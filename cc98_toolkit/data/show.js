console.log('show.js loaded.');

self.port.on("get-prefs", function(prefs) {
	$(function(){
		if(prefs.beautify){
			var css = '*{font-family:consolas,"微软雅黑" !important;}';
			$('head').append('<style type="text/css">' + css + '</style>');
		}

		if(prefs.hideQmd){
			console.log('hideqmd');
			var qmds = $('div.userQmd').parent().hide();
		}
	})
});
