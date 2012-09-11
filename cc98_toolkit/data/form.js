console.log('form.js loaded.');

//拦截表单提交，对数据进行处理之后允许提交
$('form').submit(function(evt){
	if(evt.target.name != 'frmAnnounce'){
		console.log('not hitted form',evt.target.name || "")
		return;
	}

	if($(this).hasClass('prevented'))
		return true;
	else
		evt.preventDefault();
	
	//获取表单数据
	var form = evt.target;
	var face = "";
	var username = "";
	var title = document.title;
	var url = location.pathname + location.search + location.hash;
	
	if(title.indexOf('回复帖子') != -1 || title.indexOf('编辑帖子') != -1)
		url = "/dispbbs.asp" + location.search + location.hash;

	if(form.UserName)
		username = form.UserName.value;
	else if(form.username)
		username = form.username.value;

	var expressions = document.getElementsByName('Expression');
	for(var i = 0;i < expressions.length;i++)
		if(expressions[i].checked){
			face = expressions[i].value;
			break;
		}

	//将表单数据发给addon脚本
	self.postMessage({
		'method':'sendPostData',
		data:{
			'content':form.Content.value,
			'username':username,
			'title':document.title,
			'face':face,
			'date':new Date(),
			'referer':location.href,
			'url':url,
			'host':location.host
		}
	});

	$(this).addClass('prevented');
	//延迟提交
	var that = this;
	setTimeout(function(){
		that.submit();
	},200);
});