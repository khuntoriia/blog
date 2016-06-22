/**
 * Created by sylvie on 2016/6/11.
 */
$(document).ready(function(){
    $("#but").click(function(){
        alert("click");
        $.post("/user",
            {
                name:"admin",
                age:"19"
            },function(data,status){
                alert("data="+data+"\nstatus="+status);
            });
    });
});

