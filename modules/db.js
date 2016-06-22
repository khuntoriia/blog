/**
 * Created by sylvie on 2016/6/6.
 */
var settings = require("../settings.js"),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Collection,
    Server = require('mongodb').Server;
module.exports = new Db(settings.db,new Server(settings.host,settings.port),{safe:true});