var express = require('express');
var router = express.Router();
var crypto = require("crypto");
var multer = require("multer");
var User = require("../modules/user.js");
var Post = require("../modules/post.js");
var Comment = require('../modules/comment.js');;

//上传图片
var storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/images')
    },
    filename:function(req,file,cb){
        cb(null,file.originalname);
    }
});
var upload = multer({
    storage:storage
});

//权限管理
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash("error","未登录");
        res.redirect("/login");
    }
    next();
}
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash("error","已登录");
        res.redirect("back");  //返回之前的页面
    }
    next();
}

/* GET home page. */
router.get('/', function(req, res, next) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = parseInt(req.query.p) || 1;
    //查询并返回第 page 页的 10 篇文章
    Post.getTen(null, page, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: '主页',
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10 + posts.length) == total,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

/*注册*/
router.get('/reg',checkNotLogin);
router.get('/reg', function(req, res, next) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/reg',checkNotLogin);
router.post('/reg', function(req, res, next) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error','两次输入的密码不一致!');
        return res.redirect('/reg');//返回注册页
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: name,
        password: password,
        email: req.body.email
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        if (user) {
            req.flash('error', '用户已存在!');
            return res.redirect('/reg');//返回注册页
        }
        //如果不存在则新增用户
        newUser.save(function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');//注册失败返回主册页
            }
            req.session.user = newUser;//用户信息存入 session
            req.flash('success', '注册成功!');
            res.redirect('/');//注册成功后返回主页
        });
    });
});
/*登录*/
router.get('/login',checkNotLogin);
router.get('/login', function(req, res, next) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()});
});
router.post('/login',checkNotLogin);
router.post('/login', function(req, res, next) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
        if (!user) {
            req.flash('error', req.body.password);
            return res.redirect('/login');//用户不存在则跳转到登录页
        }
        //检查密码是否一致
        if (user.password != password) {
            req.flash('error', '密码错误!');
            return res.redirect('/login');//密码错误则跳转到登录页
        }
        //用户名密码都匹配后，将用户信息存入 session
        req.session.user = user;
        req.flash('success', '登陆成功!');
        res.redirect('/');//登陆成功后跳转到主页
    });
});
/*发布*/
router.get('/post',checkLogin);
router.get('/post', function(req, res, next) {
    res.render('post', {
        title: '发布',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/post',checkLogin);
router.post('/post', function(req, res, next) {
    var currentUser = req.session.user,
        post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '发布成功!');
        res.redirect('/');//发表成功跳转到主页
    });
});
/*退出*/
router.get('/logout',checkLogin);
router.get('/logout', function(req, res, next) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/');//登出成功后跳转到主页
});
/*文件上传*/
router.get('/upload', checkLogin);
router.get('/upload', function (req, res) {
    res.render('upload', {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/upload', checkLogin);
router.post('/upload', upload.array('field1', 5), function (req, res) {
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
});

router.get('/u/:name', checkLogin);
router.get('/u/:name',function(req,res){
    var page = parseInt(req.query.p) || 1;
//    检查用户是否存在
    User.get(req.params.name,function(err,user){
        if (!user){
            req.flash('error','用户不存在');
            return res.redirect('/');
        }
        //查询并返回该用户第 page 页的 10 篇文章
        Post.getTen(user.name, page, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});

router.get('/u/:name/:day/:title', checkLogin);
router.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.post('/u/:name/:day/:title', checkLogin);
router.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '留言成功!');
        res.redirect('back');
    });
});

router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
        if (err) {
            req.flash('error', err);
            return res.redirect(url);//出错！返回文章页
        }
        req.flash('success', '修改成功!');
        res.redirect(url);//成功！返回文章页
    });
});

router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '删除成功!');
        res.redirect('/');
    });
});


module.exports = router;
