
const widgets = require("widget");
var pageMod = require("page-mod");
var data = require("self").data;
var tabs = require('tabs');
var {Cc, Ci, Cu} = require("chrome");
var {Services} = Cu.import("resource://gre/modules/Services.jsm");
var {FileUtils} = Cu.import("resource://gre/modules/FileUtils.jsm");
var file = FileUtils.getFile("ProfD", ["cc98_posts.sqlite"]);
var mDBConn = Services.storage.openDatabase(file);
var sp = require("simple-prefs").prefs;
var pref_host = sp['domain'] || "http://www.cc98.org";
var pref_beautify = sp['beautify'];

var { MatchPattern } = require("match-pattern");
var lifetoyFastReplyPattern = new MatchPattern(/.*\.cc98\.lifetoy\.org\/dispbbs\.asp/);
var cc98FastReplyPattern = new MatchPattern(/.*\.cc98\.org\/dispbbs\.asp/);
var lifetoyQuoteReplyPattern = new MatchPattern(/.*\.cc98\.lifetoy\.org\/reannounce\.asp/);
var cc98QuoteReplyPattern = new MatchPattern(/.*\.cc98\.org\/reannounce\.asp/);

//escape HTML to avoid security issue
function escapeHTML(str) str.replace(/[&"<>]/g, function (m) ({ "&": "&amp;", '"': "&quot", "<": "&lt;", ">": "&gt;" })[m]);

//创建数据库
mDBConn.executeSimpleSQL('CREATE  TABLE  IF NOT EXISTS \
	"cc98_posts" \
	(\
		"id" INTEGER PRIMARY KEY  NOT NULL , \
		"author" VARCHAR,\
		"title" VARCHAR,\
		"face" VARCHAR,\
		"content" TEXT, \
		"date" DATETIME, \
		"url"  TEXT, \
		"host" VARCHAR, \
		"referer" TEXT \
	)'
);  

//创建面板
var logPanel = require("panel").Panel({
  width:800,
  height:500,
  contentScriptFile: [data.url("jquery.js"),data.url("log.js")],
  contentURL: data.url("log.html")
});

//读取数据库查询记录
function getData(index,pageSize){
	var sql = "select * from cc98_posts  order by id desc  limit " + (pageSize * index) + "," + pageSize; 

	console.log("sql",sql);
	var stmt = mDBConn.createStatement(sql);
	var results = [];

	while (stmt.executeStep()) {
		var row = stmt.row,
			id = row.id,
			title = row.title,
			content = row.content,
			face = row.face,
			author = row.author,
			date = row.date,
			host = row.host,
			url = row.url;
		
  		results.push({
  			id: id,
  			content:content,
  			face:face,
  			title: title,
  			author: author,
  			host: host,
  			date: "'" + date + "'",
  			url: url
  		});
		
	}
	stmt.finalize();

	var total = 0;
	var stmt2 = mDBConn.createStatement("SELECT COUNT(*) FROM cc98_posts");
	while(stmt2.executeStep()){
		total = stmt2.row['COUNT(*)'];
	}

	return {total:total,result:results,pageSize:pageSize,pageIndex:index,host:pref_host} || {total:0,result:[],pageSize:0};
}

//注册面板显示事件
logPanel.on("show", function() {
	var index = 0, pageSize = 5;
	var data = getData(index,pageSize);
  	logPanel.port.emit("show",data);
  	logPanel.port.emit('get-prefs', {'domain':sp['domain'],'beautify':sp['beautify']}); 
});

//翻页和content script通讯
logPanel.port.on("pageIndexChange", function(data) {
  	var index = data.pageIndex, pageSize = 5;
	var data = getData(index,pageSize);
	logPanel.port.emit("show",data);
});


//底部widget初始化
var widget = widgets.Widget({
  id: "cc98_toolkit",
  label: "cc98",
  contentURL: data.url("cc98-48.png"),
  panel : logPanel
});


pageMod.PageMod({
  	include:["http://www.cc98.org/*",
  			"http://hz.cc98.lifetoy.org/*",
  			"http://hk.cc98.lifetoy.org/*",
  			"http://us.cc98.lifetoy.org/*"],
  	contentScriptFile: [data.url("jquery.js"),data.url('show.js')],
  	contentScriptWhen:"ready",
  	onAttach: function onAttach(worker) {
  		 worker.port.emit('get-prefs', {'domain':sp['domain'],'beautify':sp['beautify'], 'hideQmd' : sp['hideQmd']}); 
  	}
});

//注入content script
pageMod.PageMod({
  	include:["http://hz.cc98.lifetoy.org/dispbbs.asp*",
  			"http://hk.cc98.lifetoy.org/dispbbs.asp*",
  			"http://us.cc98.lifetoy.org/dispbbs.asp*",
  			"http://www.cc98.org/dispbbs.asp*",
  			"http://hz.cc98.lifetoy.org/reannounce.asp*",
  			"http://hk.cc98.lifetoy.org/reannounce.asp*",
  			"http://us.cc98.lifetoy.org/reannounce.asp*",
  			"http://www.cc98.org/reannounce.asp*",
  			"http://hz.cc98.lifetoy.org/editannounce.asp*",
  			"http://hk.cc98.lifetoy.org/editannounce.asp*",
  			"http://us.cc98.lifetoy.org/editannounce.asp*",
  			"http://www.cc98.org/editannounce.asp*"
  			],
  	contentScriptFile: [data.url("jquery.js"),data.url("form.js")],
  	contentScriptWhen:"ready",
  	onAttach: function onAttach(worker) {
        worker.port.emit('get-prefs', {'domain':sp['domain'],'beautify':sp['beautify'],'hideQmd':sp['hideQmd']}); 
        //worker.postMessage(backtop);

		worker.on('message', function(msg) {
		   // Handle the message

		  	var method = msg.method,
				data = msg.data || {};

		  	switch(method){
				case 'sendPostData':
					var stmt = mDBConn.createStatement("INSERT INTO cc98_posts (author,title,face,content,date,url,host,referer)\
						VALUES(:username,:title,:face,:content,:date,:url,:host,:referer)");  

					console.log('stmt','');
	    			var params = stmt.newBindingParamsArray();  
				    var bp = params.newBindingParams();  
				    bp.bindByName("username", escapeHTML(data.username));  
				    bp.bindByName("title", escapeHTML(data.title));
				    bp.bindByName("face", escapeHTML(data.face));
				    bp.bindByName("content", escapeHTML(data.content));
				    bp.bindByName("date", escapeHTML(data.date));
				    bp.bindByName("url", escapeHTML(data.url));
				    bp.bindByName("host", escapeHTML(data.host));
				    bp.bindByName("referer",escapeHTML(data.referer));

				    params.addParams(bp);  

	    			stmt.bindParameters(params);  

	    			stmt.executeAsync({  
				      handleResult: function(aResultSet) {  
				      	//...
				      },  
				      
				      handleError: function(aError) {  
				        console.log("Error: " + aError.message);  
				      },

				      handleCompletion: function(aReason) {  
				      	console.log('completed');
	    				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)  
	      					console.log("Query canceled or aborted!");  
	  				  }  
				    });  
					break;
				case 'getPrefs':
					return sp['beautify'];
				default:
					break;
		  	}
		});
  	}
});