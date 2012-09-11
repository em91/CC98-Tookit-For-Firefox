var Render = {
  //初始化数据、属性以及DOM
  _$init : function(_data){
    this.__data = _data.result;
    this.__total = _data.total;
    this.__pageSize = _data.pageSize;
    this.__pageIndex = _data.pageIndex;
    this.__host = _data.host || 'http://www.cc98.org';

    this.__tpl = '<li class="clearfix">&gt;&gt;<img src="'+ this.__host + '/face/{face}"  alt="{face}"><a target="_blank" href="'+ this.__host + '{url}">{title}</a>\
    <div id="p{id}">{content}</div></li>';
    this._$destroy();
    this.__render(_data.result);
    this.__renderPager();

    //翻页器事件注册
    $('#pagerSelector').change(function(evt){
      var opt = evt.target;
      if(!opt.value)
          return;

      self.port.emit("pageIndexChange", {pageIndex:opt.value});
    })
    //上一页下一页处理
    var that = this;
    $('#prev').click(function(){
      that._$goPrev();
      return false;
    })
    $('#next').click(function(){
      that._$goNext();
      return false;
    })
  },

  //模板格式化
  __render: function(_data){
    var _html = [];
    for(var i = 0;i < _data.length;i++){
       _html.push(this.__merge(_data[i]));
    }
    $('#recentPosts').empty().html(_html.join(''));
  },

  //翻页器处理
  __renderPager:function(){
    if(this.__pageSize >= this.__total)
      return;

    $('#pager').html('<a href="###" id="prev">[上一页]</a>\
          <select name="pager" id="pagerSelector">\
          </select>\
          <a href="###" id="next">[下一页]</a>');

    var pageTotal = Math.ceil(this.__total / this.__pageSize);
    this.__pageTotal = pageTotal;

    for(var i = 0;i < pageTotal;i++){
      if(i == this.__pageIndex)
        $('#pagerSelector').append("<option selected value='"+ i + "'>"+ (i+1) +"</option>");
      else
        $('#pagerSelector').append("<option value='"+ i + "'>"+ (i+1) +"</option>");
    }
  },

  //上一页
  _$goPrev:function(){
    var prev = this.__pageIndex - 1;
    if(prev < 0)
      prev = 0;
    self.port.emit("pageIndexChange", {pageIndex:prev});
  },

  //下一页
  _$goNext:function(){
    var next = this.__pageIndex + 1;
    if(next > this.__pageTotal - 1)
      next = this.__pageTotal - 1;
    self.port.emit("pageIndexChange", {pageIndex:next});
  },

  //数据merge前处理
  __setData:function(_item){
      var str = _item.content;
      _item.content = this.__parseUbb(str);
      return _item;
  },

  _$escapeHtml:function(str){
      str.replace(/[&"<>]/g, function (m)({ "&": "&amp;", '"': "&quot", "<": "&lt;", ">": "&gt;" })[m]);
  },

  //对内容里的ubb进行格式化
  __parseUbb:function(str){
      str = str.replace(/\[color=(.[^\[\"\'\\\(\)\:\;]*)\](.*?)\[\/color\]/gi,"<span style=\"color:$1;\">$2</span>");
      str = str.replace(/\[user\](.[^\[]*)\[\/user\]/gi, "<span onclick=\"window.location.href='dispuser.asp?name=$1'\" style=\"cursor:pointer;\">$1</span>");
      str = str.replace(/\[quote=1\]([\s\S]*?)\[\/quote\]\n*/gi,"<div><div class=\"quoteMaxHeightDiv\" style=\"margin:5px 0;background:#e4e8ef;border:1px solid #6595D6;overflow:auto; padding:5px;-webkit-border-radius:3px;\">$1</div></div>");
      str = str.replace(/\[quote=0\]([\s\S]*?)\[\/quote\]\n*/gi,"<div><div style=\"margin:5px 0;background:#e4e8ef;border:1px solid #6595D6;overflow:auto; padding:5px;-webkit-border-radius:3px;\">$1</div></div>");
      str = str.replace(/\[quote\]([\s\S]*?)\[\/quote\]\n*/gi,"<div><div style=\"margin:5px 0;background:#e4e8ef;border:1px solid #6595D6;overflow:auto; padding:5px;-webkit-border-radius:3px;\">$1</div></div>");
      str = str.replace(/\[quotex\]\[b\](.*?)\[\/b\]([\s\S]*?)\[\/quotex\]\n*/gi,"<div style=\"background:#e4e8ef;border:1px solid #6595D6;margin-bottom:10px;padding:5px;-webkit-border-radius:3px;\"><div style=\"margin-bottom:5px;\"><b>$1</b></div><div class=\"quoteMaxHeightDiv\" style=\"overflow:auto; padding-left:5px;\">$2</div></div>");
      str = str.replace(/\[i\](.*?)\[\/i\]/gi,"<i>$1</i>");
      str = str.replace(/\[u\](.*?)\[\/u\]/gi,"<u>$1</u>");
      str = str.replace(/\[color=(.[^\[\"\'\\\(\)\:\;]*)\](.*?)\[\/color\]/gi,"<span style=\"color:$1;\">$2</span>");
      str = str.replace(/\[del\](.*?)(\[\/del\])/gi,'<span style="text-decoration:line-through;">$1</span>');
      str = str.replace(/\[b\](.*?)(\[\/b\])/gi,"<b>$1</b>");
      str = str.replace(/\[em([0-9]+)\]/gi,"<img src=\""+ this.__host + "/emot/simpleemot/emot$1.gif\" border=0 align=middle>");
      str= str.replace(/\[url,t=(blank|self|parent)\](.[^\[]*)\[\/url\]/gi, "<a href=\"$2\" target=\"_blank\">$2</a>");  
      str= str.replace(/\[url=(.[^\[\'\"\(\)]*?),t=(blank|self|parent)\](.[^\[]*)\[\/url\]/gi, "<a href=\""+ this.__host + "/$1\" target=\"_blank\">$3</a>");
      str= str.replace(/\[url\](.[^\[]*)\[\/url\]/gi, "<a href=\"$1\" target=\"_blank\">$1</a>"); 
      str= str.replace(/\[url=(.[^\[\'\"\(\)]*)\](.*?)\[\/url\]/gi, "<a href=\"$1\" target=\"_blank\">$2</a>");
      str= str.replace(/\[url\]http\:\/\/(www\.cc98\.org|10\.10\.98\.98|cc\.zju\.edu\.cn)\/(.[^\[\'\"\:\(\)]*)\[\/url\]/gi, "<a href=\""+ this.__host + "/$2\" target=\"_blank\">$2</a>");
      str= str.replace(/\[url=http\:\/\/(www\.cc98\.org|10\.10\.98\.98|cc\.zju\.edu\.cn)\/(.[^\[\'\"\:\(\)]*)\](.*?)\[\/url\]/gi, "<a href=\""+ this.__host + "/$2\" target=\"_blank\">$3</a>");


      var pattern = /\[size=([0-9]*)(pt|px)*\](.*?)\[\/size\]/i;
      while(pattern.test(str)){
        var unit = RegExp.$2;
        var size = RegExp.$1;
        if(unit == ''){
          size = size > 7 ? 35 : size * 5;
          str = str.replace(pattern,'<span style="font-size:' + size.toString() + 'px; line-height:110%">$3</span>');
        }else{
          size = size > 35 ? 35 : size;
          str = str.replace(pattern,'<span style="font-size:' + size.toString() + unit.toString() + '; line-height:110%">$3</span>');
        }
      }


      pattern=/\[UPLOAD=(gif|jpg|jpeg|bmp|png)([,]*)([01]*)\](http:\/\/(file\.cc98\.org|cc98file\.lifetoy\.org)\/.[^\[\'\"\:\(\)]*)(gif|jpg|jpeg|bmp|png)\[\/UPLOAD\]\n*/gi;
      str=str.replace(pattern,'<a href="$4$6" target="_blank" class="clickloadImage"  onclick="this.innerHTML=loadImg(this.href);this.onclick=function(){}; return false;"><img src="images/files/$6.gif" border=0>$4$6</a>');
      pattern=/\[UPLOAD=(.[^\[\'\"\:\(\)]*?)([,]*)([01]*)\](http:\/\/(file\.cc98\.org|cc98file\.lifetoy\.org)\/.[^\[\'\"\:\(\)]*)\[\/UPLOAD\]\n*/gi;
      str= str.replace(pattern,"<BR><IMG style=\"margin:15px 0;vertical-align:middle\" SRC=\"images/files/$1.gif\" border=0> <a style=\"border-bottom:1px dashed #ccc\" href=\"$4\">点击浏览该文件</a><br/>");
      var host = this.__host;
      switch(host){
        case "http://www.cc98.org/":
          break;
        case "http://us.cc98.lifetoy.org/":
          str = str.replace(/file.cc98.org/ig,"us.file.cc98.lifetoy.org");
          break;
        case "http://hz.cc98.lifetoy.org/":
          str = str.replace(/file.cc98.org/ig,"hz.file.cc98.lifetoy.org");
          break;
        case "http://hk.cc98.lifetoy.org/":
          str = str.replace(/file.cc98.org/ig,"hk.file.cc98.lifetoy.org");
          break;
        default:
          break;
      }
      return str;
  },

  //merge数据
  __merge : function(_item){
    var _item = this.__setData(_item);
    return this.__tpl.replace(/{(.*?)}/igm,function($,$1) {
        return _item[$1]?_item[$1]:$;
    });
  },

  //销毁翻页器和当前记录等
  _$destroy: function(){
    $('#recentPosts').empty();
    $('#pagerSelector').remove();
    $('#prev').remove();
    $('#next').remove();
    $('#pager').empty();
  }
};

//面板显示消息处理
self.port.on("show", function (data) {
  Render._$init(data);
});

self.port.on("get-prefs", function(prefs) {
  $(function(){
    console.log('domain');
    var domain = prefs.domain || 'http://www.cc98.org';
    $('#cc98Post')[0].href = domain + '/dispbbs.asp?boardID=39&ID=3971102';
  })
});
