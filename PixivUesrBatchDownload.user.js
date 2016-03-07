// ==UserScript==
// @name        PixivUesrBatchDownload
// @name:zh-CN    P站画师个人作品批量下载工具
// @namespace   http://www.mapaler.com/
// @description P站画师个人作品批量下载工具
// @include     http://www.pixiv.net/member_illust.php?id=*
// @version     1.1.2
// @grant       none
// @copyright  2016+, Mapaler <mapaler@163.com>
// @icon        http://source.pixiv.net/www/images/pixiv_logo.gif
// @updateURL https://github.com/Mapaler/PixivUserBatchDownload/raw/master/PixivUesrBatchDownload.meta.js
// @downloadURL https://github.com/Mapaler/PixivUserBatchDownload/raw/master/PixivUesrBatchDownload.user.js
// ==/UserScript==

(function() {
var pICD = 20; //pageIllustCountDefault默认每页作品数量
var getPicNum = 0; //Ajax获取了文件的数量
var downOver; //检测下载是否完成的循环函数
var dataset =
{
    user_id: pixiv.context.userId, //作者ID
    user_name: "", //作者昵称
    illust_count: 0, //作品总数
    illust_file_count: 0, //作品文件总数（含多图）
    illust:[
    ]
}
var user_link = document.getElementsByClassName("user-link")[0];
var user_dom = user_link.getElementsByClassName("user")[0];
dataset.user_name = user_dom.textContent;
function illust()
{
    var obj =
    {
        illust_id: 0, //作品ID
        illust_page: 0, //在作者的第几页
        illust_index: 0, //全部作品中序号
        illust_index_inverted: 0, //全部作品中序号_倒序
        illust_index_in_page: 0, //该页上序号
        illust_index_in_page_inverted: 0, //该页上序号_倒序
        title: "", //作品标题
        type: 0, //类型，单页、漫画、动画
        //type_name: "", //类型用文字表示
        filename: [""], //文件名
        extention: [""], //扩展名
        original_src: [""], //原始图片链接
        //page: 0, //第几页（漫画）
        page_count: 0, //共几页（漫画）
        year: 0,
        month: 0,
        day: 0,
        hour: 0,
        minute: 0,
        second: 0,

        thumbnail_src: "", //缩略图地址
        domain: "", //域名
        url: "", //作品页面
        time: "", //显示时间
        size: "", //显示大小
        width: 0, //宽
        height: 0, //高
        tools: [""], //使用工具
        caption: "", //说明
        tags: [""], //标签
        //添加URL
        /*
        addFromUrl: function (url)
        {
            if (url == undefined)
                url = this.url;
            else
                this.url = url;
            var regSrc = /illust_id=(\d+)/ig;
            var iid = regSrc.exec(url);
            if (iid.length >= 2) this.illust_id = iid[1];
        },
        */
        //添加ID
        /*
        addFromId: function (id)
        {
            if (id == undefined)
                id = this.illust_id;
            else
                this.illust_id = id;
            this.url = "http://www.pixiv.net/member_illust.php?mode=medium&illust_id=" + id;
        },
        */
        //从缩略图添加数据
        /*
        addFromThumbnail: function (thumbnail)
        {
            if (thumbnail == undefined)
                thumbnail = this.thumbnail_src;
            else
                this.thumbnail_src = thumbnail;
            //http://i3.pixiv.net/c/150x150/img-master/img/2015/08/11/16/30/36/51911938_p0_master1200.jpg
            var regSrc = /https?:\/\/([^\/]+)\/.+\/(\d{4})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/((\d+)(?:_p\d+)?)_[\d\w]+\.(\w+)/ig;
            var ith = regSrc.exec(thumbnail);
            //["http://i3.pixiv.net/c/15...11938_p0_master1200.jpg", "i3.pixiv.net", "2015", "08", "11", "16", "30", "36", "51911938_p0", "51911938", "jpg"]
            if (ith.length >= 1)
            {
                this.domain = ith[1];
                this.year = ith[2];
                this.month = ith[3];
                this.day = ith[4];
                this.hour = ith[5];
                this.minute = ith[6];
                this.second = ith[7];
                this.filename[0] = ith[8];
                this.illust_id = ith[9];
                this.extention[0] = ith[10];
            }
        },
        */
        //添加作品的顺序
        addIndexFromPage: function (index, page, illcount)
        {
            if (index == undefined)
                index = this.illust_index_in_page;
            else
                this.illust_index_in_page = index;
            if (page == undefined)
                page = this.illust_page;
            else
                this.illust_page = page;
            if (illcount == undefined)
                illcount = dataset.illust_count;
            this.illust_index = (this.illust_page - 1) * pICD + this.illust_index_in_page;
            this.illust_index_inverted = illcount - this.illust_index + 1;
            if ((illcount - this.illust_index) >= pICD)
                this.illust_index_in_page_inverted = pICD - index + 1;
            else
                this.illust_index_in_page_inverted = illcount % pICD - index + 1;
        },
        //ajax读取原始页面数据
        ajaxLoad: function (url)
        {
            if (url == undefined)
                url = this.url;
            else
                this.url = url;
            if (this.illust_id < 1)
            {
                var regSrc = /illust_id=(\d+)/ig;
                var iid = regSrc.exec(url);
                if (iid.length >= 2) this.illust_id = iid[1];
            }
            getSource(url, dealIllust, this);
        },
    }
    return obj;
}
var btnStart = document.createElement("button");
btnStart.className = "_button following";
btnStart.innerHTML = "获取全部作品";
btnStart.onclick = function () { startProgram(0) };

var menu_ul = document.createElement("ul");
menu_ul.className = "items";
//menu_ul.style.display = "none";
menu_ul.style.display = "block";
var li = document.createElement("li");
var a = document.createElement("a");
a.className = "item";
a.innerHTML = "Aria2 RPC";
a.onclick = function () { startProgram(0); li1.removeChild(menu_ul); };
li.appendChild(a);
menu_ul.appendChild(li);
var li = document.createElement("li");
var a = document.createElement("a");
a.className = "item";
a.innerHTML = "导出下载文件";
a.onclick = function () { buildExport(); li1.removeChild(menu_ul); startProgram(1); };
li.appendChild(a);
menu_ul.appendChild(li);
var li = document.createElement("li");
li.className = "separated";
var a = document.createElement("a");
a.className = "item";
a.innerHTML = "设置";
a.onclick = function () { buildSetting(); li1.removeChild(menu_ul); }
li.appendChild(a);
menu_ul.appendChild(li);

if (getConfig("PUBD_reset") != "1") ResetConfig();

//var add_place = document.getElementsByClassName("column-menu")[0].getElementsByClassName("menu-items")[0];
var add_place = document.getElementsByClassName("user-relation")[0];
var li1 = document.createElement("li");
add_place.appendChild(li1);
li1.className = "ui-selectbox-container";
li1.appendChild(btnStart);
//li1.appendChild(menu_ul);

/*
menu_ul.onmouseout = function (e) //需要判断是不是内部小框架
{
	if (!e) e = window.event;
	var reltg = e.relatedTarget ? e.relatedTarget : e.toElement;
	while (reltg && reltg != this) reltg = reltg.parentNode;
	if (reltg != this)
	{
		//menu_ul.style.display = "none";
		li1.removeChild(menu_ul);
	}
}

btnStart.onmouseover = function (e) //需要判断是不是内部小框架
{
    if (!e) e = window.event;
    var reltg = e.relatedTarget ? e.relatedTarget : e.fromElement;
    while (reltg && reltg != this) reltg = reltg.parentNode;
    if (reltg != this) {
    	//menu_ul.style.display = "block";
    	li1.appendChild(menu_ul);
    }
}
*/
btnStart.onclick = function (e) //需要判断是不是内部小框架
{
	if (menu_ul.parentNode == li1)
		li1.removeChild(menu_ul);
	else
		li1.appendChild(menu_ul);
}


var li2 = document.createElement("li");
add_place.appendChild(li2);
li2.className = "infoProgress";

//开始分析本作者
function startProgram(mode)
{
    if(getPicNum<1)
    {
        dealUser();
    }
    clearInterval(downOver);
    downOver = setInterval(function () { startProgramCheck(mode) }, 500);
}

//开始分析本作者
function dealUser()
{
    var count_badge = document.getElementsByClassName("count-badge");
    if (count_badge.length < 1)
    {
        alert("未发现作品数DOM");
        clearInterval(downOver);
        return;
    }

    var regPC = /(\d+)/ig;
    var photoCount = regPC.exec(count_badge[0].textContent);

    if (photoCount.length >= 2) {
        dataset.illust_count = parseInt(photoCount[1]);
		dataset.illust_file_count = dataset.illust_count;
        var pageCount = Math.ceil(dataset.illust_count / 20);
    }
    else
    {
        alert("未发现作品数字符串");
        clearInterval(downOver);
        return;
    }

    var column_title = document.getElementsByClassName("column-title");
    var self = column_title[0].getElementsByClassName("self");
    var linkPre = self[0].href;

    //列表页循环
    for (pi = 1; pi <= pageCount; pi++)
    //for (pi = 0; pi < 1; pi++)
    {
        var link = getPageSrc(linkPre, pi);
        getSource(link, dealPage, pi);
    }

}

//获取页面网址
function getPageSrc(linkPre, page)
{
    return linkPre + "&type=all&p=" + page;
}

//直接通过XMLHttpRequest对象获取远程网页源代码
function getSource(url,callback,index, index2)
{
	var xhr = new XMLHttpRequest();	//创建XMLHttpRequest对象
	xhr.onreadystatechange = function()  //设置回调函数
	{
	    if (xhr.readyState == 4 && xhr.status == 200)
	        callback(xhr.responseText, index, index2);
	}
	xhr.open("GET", url, true);
	xhr.send(null);
	return xhr.responseText;
}
//处理列表页面的回调函数
function dealPage(response, pageIndex)
{
    /*
    老式构建网页dom方法
    var fullSizePage = document.createElement("div"); //创建一个容器
    fullSizePage.innerHTML = response; //插入代码
    */

    var parser = new DOMParser();
    PageDOM = parser.parseFromString(response, "text/html");

    var _image_items = PageDOM.getElementsByClassName("_image-items");
    if (_image_items.length >= 0)
    {
        var image_items = _image_items[0].getElementsByClassName("image-item");
        //作品循环
        for (ii = 0; ii < image_items.length; ii++)
        //for (ii = 6; ii <= 6; ii++)
        {
            var _thumbnail = image_items[ii].getElementsByClassName("_thumbnail")[0];
            var title = image_items[ii].getElementsByClassName("title")[0];
            var link = image_items[ii].getElementsByTagName("a")[0];
            var multiple = image_items[ii].getElementsByClassName("multiple");
            var ugoku = image_items[ii].getElementsByClassName("ugoku-illust");
            var ill = new illust;
            ill.url = link.href;
            ill.title = title.textContent;
            ill.addIndexFromPage(ii + 1, pageIndex, dataset.illust_count);
            //ill.illust_index_in_page = ii + 1;
            //ill.addFromThumbnail(_thumbnail.src);
            ill.thumbnail_src = _thumbnail.src;
            ill.ajaxLoad();
            //ill.addFromUrl(link.href);
            if (ugoku.length > 0)
                ill.type = 2;
            else if (multiple.length > 0)
                ill.type = 1;
            else
                ill.type = 0;
            dataset.illust.push(ill);
        }
    }
}

//处理作品的回调函数
function dealIllust(response, ill)
{
    var parser = new DOMParser();
    PageDOM = parser.parseFromString(response, "text/html");
    //work_info
    var work_info = PageDOM.getElementsByClassName("work-info")[0];
    //var title = work_info.getElementsByClassName("title")[0];
    //ill.title = title.textContent;
    var caption = work_info.getElementsByClassName("caption")[0];
    if (caption) ill.caption = caption.textContent;
    //metas
    var metas = work_info.getElementsByClassName("meta")[0];
    var meta = metas.getElementsByTagName("li");
    ill.time = meta[0].textContent;
    ill.size = meta[1].textContent;
    var tools = metas.getElementsByClassName("tools")[0]
    if (tools)
    {
        var toolsli = tools.getElementsByTagName("li");
        for (ti = 0; ti < toolsli.length; ti++)
        {
            ill.tools[ti] = toolsli[ti].textContent;

        }
    }
    //TAG
    var tagsDom = PageDOM.getElementsByClassName("work-tags")[0].getElementsByClassName("tags-container")[0].getElementsByClassName("tags");
    if (tagsDom.length > 0)
    {
    	var tags = tagsDom[0].getElementsByClassName("tag");
        for (ti = 0; ti < tags.length; ti++)
        {
            ill.tags[ti] = tags[ti].getElementsByClassName("text")[0].textContent;
        }
    }


    var script = PageDOM.getElementById("wrapper").getElementsByTagName("script")[0];
    //建立内部临时变量，避免影响到原始页面
    var pixiv = new Object; pixiv.context = new Object;
    //执行获取到的代码
    eval(script.innerHTML);
    ill.illust_id = pixiv.context.illustId;
    ill.width = pixiv.context.illustSize[0];
    ill.height = pixiv.context.illustSize[1];
    ill.title = pixiv.context.illustTitle;
    //dataset.user_name = pixiv.context.userName;
    var regSrc = /https?:\/\/([^\/]+)\/.+\/(\d{4})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/((\d+)(?:[\-_][\w\d\-]+)?)\.(\w+)/ig;
    //添加静图
    if (PageDOM.getElementsByClassName("original-image")[0]) {//静图
        var originalImage = PageDOM.getElementsByClassName("original-image")[0].getAttribute("data-src");
        ill.page_count = 1;
        ill.type = 0;
        ill.original_src[0] = originalImage;
        //originalImage = "http://i2.pixiv.net/img-original/img/2016/01/26/00/01/01/54911277_p0.jpg";
        var aImg = regSrc.exec(originalImage);
        //console.log(aImg);
        //["http://i2.pixiv.net/img-...0/01/01/54911277_p0.jpg", "i2.pixiv.net", "2016", "01", "26", "00", "01", "01", "54911277_p0", "54911277", "jpg"]
        if (aImg.length >= 1)
        {
            ill.domain = aImg[1];
            ill.year = aImg[2];
            ill.month = aImg[3];
            ill.day = aImg[4];
            ill.hour = aImg[5];
            ill.minute = aImg[6];
            ill.second = aImg[7];
            ill.filename[0] = aImg[8];
            ill.extention[0] = aImg[10];
			getPicNum+=1;
        }else
        {
            alert("获取单图原始图片路径信息失败，可能需要更新正则匹配模式。");

        }
    }
    //添加动图
    else if (PageDOM.getElementsByClassName("_ugoku-illust-player-container").length > 0)
    {
        var zipUrl = pixiv.context.ugokuIllustFullscreenData.src;
        ill.page_count = pixiv.context.ugokuIllustFullscreenData.frames.length;
        ill.type = 2;
        ill.original_src[0] = zipUrl;
        //zipUrl = "http://i3.pixiv.net/img-zip-ugoira/img/2015/06/02/01/50/26/50680914_ugoira1920x1080.zip";
        var aImg = regSrc.exec(zipUrl);
        //console.log(aImg);
        //["http://i3.pixiv.net/img-...914_ugoira1920x1080.zip", "i3.pixiv.net", "2015", "06", "02", "01", "50", "26", "50680914_ugoira1920x1080", "50680914", "zip"]
        if (aImg.length >= 1) {
            ill.domain = aImg[1];
            ill.year = aImg[2];
            ill.month = aImg[3];
            ill.day = aImg[4];
            ill.hour = aImg[5];
            ill.minute = aImg[6];
            ill.second = aImg[7];
            ill.filename[0] = aImg[8];
            ill.extention[0] = aImg[10];
			getPicNum+=1;
        } else {
            alert("获取动图原始图片路径信息失败，可能需要更新正则匹配模式。");
        }
    }
    //添加多图
    else if (PageDOM.getElementsByClassName("multiple").length > 0)
    {
        var aImg = regSrc.exec(ill.thumbnail_src);
        if (aImg.length >= 1) {
            ill.domain = aImg[1];
            ill.year = aImg[2];
            ill.month = aImg[3];
            ill.day = aImg[4];
            ill.hour = aImg[5];
            ill.minute = aImg[6];
            ill.second = aImg[7];
        }

        var regPageCont = /.+\s+(\d+)[pP]/ig;
        var rs = regPageCont.exec(ill.size);
        if (rs.length >= 2)
        {
        	ill.page_count = parseInt(rs[1]);
        	console.log(ill.illust_id + "为多图，存在" + ill.page_count + "张")
            dataset.illust_file_count += ill.page_count - 1; //图片总数里增加多图的张数
			
            var manga_big = ill.url.replace(/mode=[^&]+/, "mode=manga_big");
            for (var pi = 0; pi < ill.page_count; pi++) {
                var manga_big_url = manga_big + "&page=" + pi;
                getSource(manga_big_url, dealManga, ill, pi);
            }
        }
        else
        {
            alert("获取多图总张数失败");
        }
    }
    else
    {
        alert("未知的作品类型。");
    }
}

//处理多图的回调函数
function dealManga(response, ill, index)
{
    var parser = new DOMParser();
    PageDOM = parser.parseFromString(response, "text/html");
    var picture = PageDOM.getElementsByTagName("img")[0];
    var regSrc = /\/(\d+(?:_[\w\d]+)?)\.(\w+)/ig;
    var rs = regSrc.exec(picture.src);
    ill.original_src[index] = picture.src;
    ill.filename[index] = rs[1];
    ill.extention[index] = rs[2];
	getPicNum+=1;
}

var ARIA2 = (function () {
    var jsonrpc_version = '2.0';

    function get_auth(url) {
        return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
    };

    function request(jsonrpc_path, method, params, getVersion) {
        var xhr = new XMLHttpRequest();
        var auth = get_auth(jsonrpc_path);
        jsonrpc_path = jsonrpc_path.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3'); // auth string not allowed in url for firefox

        var request_obj = {
            jsonrpc: jsonrpc_version,
            method: method,
            id: getVersion ? "1" : (new Date()).getTime().toString(),
        };
        if (params) request_obj['params'] = params;
        if (auth && auth.indexOf('token:') == 0) params.unshift(auth);

        xhr.open("POST", jsonrpc_path + "?tm=" + (new Date()).getTime().toString(), true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        if (auth && auth.indexOf('token:') != 0) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(auth));
        }
        xhr.send(JSON.stringify(request_obj));
        if (getVersion) {
            xhr.onreadystatechange = function ()  //设置回调函数
            {
                if (xhr.readyState == 4 && xhr.status == 200)
                {
                    var JSONreq = JSON.parse(xhr.responseText);
                    document.getElementsByName("PUBD_PRC_path_check")[0].innerHTML="发现Aria2 ver" + JSONreq.result.version;
                }
                else if (xhr.readyState == 4 && xhr.status != 200)
                    document.getElementsByName("PUBD_PRC_path_check")[0].innerHTML="Aria2连接失败";
            }
        }
    };

    return function (jsonrpc_path) {
        this.jsonrpc_path = jsonrpc_path;
        this.addUri = function (uri, options) {
            request(this.jsonrpc_path, 'aria2.addUri', [[uri, ], options]);
        };
        this.getVersion = function () {
            request(this.jsonrpc_path, 'aria2.getVersion', [], true);
        };
        return this;
    }
})();

function buildSetting()
{
    if (document.getElementById("PixivUserBatchDownloadSetting")) return;
    var insertPlace = document.getElementsByClassName("column-menu")[0];
    var set = document.createElement("div");
    set.id = "PixivUserBatchDownloadSetting";
    set.className = "notification-popup";
    set.style.display = "block";
    //自定义CSS
    var style = document.createElement("style");
    set.appendChild(style);
    style.type = "text/css";
    style.innerHTML +=
        [
            ".PUBD_type_name" + "{\r\n" + [
                'width:60px',
                'margin-right:10px',
            ].join(';\r\n') + "\r\n}",
            ".PUBD_PRC_path" + "{\r\n" + [
                'width:180px' ,
            ].join(';') + "\r\n}",
            ".PUBD_save_path,.PUBD_multiple_mask" + "{\r\n" + [
                'width:340px' ,
            ].join(';') + "\r\n}",
        ].join('\r\n');


    //标题行
    var h2 = document.createElement("h2");
    h2.innerHTML = "Pixiv画师作品批量获取工具选项";

    var a = document.createElement("a");
    a.className = "_official-badge";
    a.innerHTML = "设置说明";
    a.href = "https://github.com/Mapaler/PixivUserBatchDownload/blob/master/README.md";
    a.target = "_blank";
    h2.appendChild(a);
    //设置内容
    var ul = document.createElement("ul");
    ul.className = "notification-list message-thread-list";
    //设置-模式
    var li = document.createElement("li");
    li.className = "thread";
    li.style.display = "none";
    var divTime = document.createElement("div");
    divTime.className = "time date";
    var divName = document.createElement("div");
    divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    li.appendChild(divTime);
    li.appendChild(divName);
    li.appendChild(divText);
    //ul.appendChild(li);

    divName.innerHTML = "功能选择(开发中)";
    divTime.innerHTML = "选择基本功能或自定义高级参数"

    var lbl = document.createElement("label");
    var ipt = document.createElement("input");
    ipt.type = "radio";
    ipt.value = 0;
    ipt.name = "PUBD_mode";
    lbl.appendChild(ipt);
    lbl.innerHTML += "简单模式";
    divText.appendChild(lbl);
    var lbl = document.createElement("label");
    var ipt = document.createElement("input");
    ipt.type = "radio";
    ipt.value = 1;
    ipt.name = "PUBD_mode";
    lbl.appendChild(ipt);
    lbl.innerHTML += "专家模式";
    divText.appendChild(lbl);
    //设置-RPC Path
    var li = document.createElement("li");
    li.className = "thread";
    var divTime = document.createElement("div");
    divTime.className = "time date";
    var divName = document.createElement("div");
    divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    li.appendChild(divTime);
    li.appendChild(divName);
    li.appendChild(divText);
    ul.appendChild(li);

    divName.innerHTML = "Aria2 JSON-RPC Path";
    divTime.innerHTML = "填写Aria2 JSON-RPC地址"
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_PRC_path";
    ipt.name = "PUBD_PRC_path";
    ipt.value = getConfig("PUBD_PRC_path");
    divText.appendChild(ipt);
    var btnCheckLink = document.createElement("button");
    btnCheckLink.className = "_button";
    btnCheckLink.name = "PUBD_PRC_path_check";
    btnCheckLink.innerHTML = "检测地址";
    btnCheckLink.onclick = function ()
    {
        this.innerHTML = "正在连接...";
        var aria2 = new ARIA2(document.getElementsByName("PUBD_PRC_path")[0].value);
        aria2.getVersion();
    }
    divText.appendChild(btnCheckLink);
    //设置-下载路径
    var li = document.createElement("li");
    li.className = "thread";
    var divTime = document.createElement("div");
    divTime.className = "time date";
    var divName = document.createElement("div");
    divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    li.appendChild(divTime);
    li.appendChild(divName);
    li.appendChild(divText);
    ul.appendChild(li);

    divName.innerHTML = "下载路径";
    divTime.innerHTML = "下载到本地路径和文件名"
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_save_path";
    ipt.name = "PUBD_save_path";
    ipt.value = getConfig("PUBD_save_path");
    divText.appendChild(ipt);
    //设置-类型命名
    var li = document.createElement("li");
    li.className = "thread";
    var divTime = document.createElement("div");
    divTime.className = "time date";
    var divName = document.createElement("div");
    divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    li.appendChild(divTime);
    li.appendChild(divName);
    li.appendChild(divText);
    ul.appendChild(li);

    divName.innerHTML = "类型命名";
    divTime.innerHTML = "%{type_name}的内容"

    var lbl = document.createElement("label");
    lbl.innerHTML = "单：";
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_type_name";
    ipt.name = "PUBD_type_name0";
    ipt.value = getConfig("PUBD_type_name0");
    lbl.appendChild(ipt);
    divText.appendChild(lbl);
    var lbl = document.createElement("label");
    lbl.innerHTML = "多：";
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_type_name";
    ipt.name = "PUBD_type_name1";
    ipt.value = getConfig("PUBD_type_name1");
    lbl.appendChild(ipt);
    divText.appendChild(lbl);
    var lbl = document.createElement("label");
    lbl.innerHTML = "动：";
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_type_name";
    ipt.name = "PUBD_type_name2";
    ipt.value = getConfig("PUBD_type_name2");
    lbl.appendChild(ipt);
    divText.appendChild(lbl);
    //设置-多图掩码
    var li = document.createElement("li");
    li.className = "thread";
    var divTime = document.createElement("div");
    divTime.className = "time date";
    var divName = document.createElement("div");
    divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    li.appendChild(divTime);
    li.appendChild(divName);
    li.appendChild(divText);
    ul.appendChild(li);

    divName.innerHTML = "多图掩码内容";
    divTime.innerHTML = "替换%{multiple}的内容"
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_multiple_mask";
    ipt.name = "PUBD_multiple_mask";
    ipt.value = getConfig("PUBD_multiple_mask");
    divText.appendChild(ipt);

    //确定按钮行
    var confirmbar = document.createElement("div");
    confirmbar.className = "_notification-request-permission";
    confirmbar.style.display = "block";
    var btnConfirm = document.createElement("button");
    btnConfirm.className = "_button";
    btnConfirm.innerHTML = "确定";
    var btnCancel = document.createElement("button");
    btnCancel.className = "_button";
    btnCancel.innerHTML = "取消";
    btnCancel.onclick = function () { insertPlace.removeChild(set); }
    var btnReset = document.createElement("button");
    btnReset.className = "_button";
    btnReset.innerHTML = "重置设置";
    btnReset.onclick = function () { ResetConfig(); }
    confirmbar.appendChild(btnConfirm);
    confirmbar.appendChild(btnCancel);
    confirmbar.appendChild(btnReset);

    set.appendChild(h2);
    set.appendChild(ul);
    set.appendChild(confirmbar);
    insertPlace.appendChild(set);

    btnConfirm.onclick = function ()
    {
        setConfig("PUBD_PRC_path", document.getElementsByName("PUBD_PRC_path")[0].value);
        setConfig("PUBD_save_path", document.getElementsByName("PUBD_save_path")[0].value);
        setConfig("PUBD_type_name0", document.getElementsByName("PUBD_type_name0")[0].value);
        setConfig("PUBD_type_name1", document.getElementsByName("PUBD_type_name1")[0].value);
        setConfig("PUBD_type_name2", document.getElementsByName("PUBD_type_name2")[0].value);
        setConfig("PUBD_multiple_mask", document.getElementsByName("PUBD_multiple_mask")[0].value);

        btnCancel.onclick();
    }
}

function getConfig(key) {
    if (window.localStorage) {
        return window.localStorage.getItem(key) || "";
    } else {
        return getCookie(key);
    }
};
function setConfig(key, value) {
    if (window.localStorage) {
        window.localStorage.setItem(key, value);
    } else {
        setGdCookie(key, value, 86400 * 365);
    }
};
function ResetConfig() {
    setConfig("PUBD_reset", "1");
    setConfig("PUBD_PRC_path", "http://localhost:6800/jsonrpc");
    setConfig("PUBD_save_path", "%{user_id}_%{user_name}\\%{multiple}%{filename}.%{extention}");
    setConfig("PUBD_type_name0", "");
    setConfig("PUBD_type_name1", "multiple");
    setConfig("PUBD_type_name2", "ugoku");
    setConfig("PUBD_multiple_mask", "%{illust_id}_%{title}\\");

    if (document.getElementsByName("PUBD_PRC_path")[0]) document.getElementsByName("PUBD_PRC_path")[0].value = getConfig("PUBD_PRC_path");
    if (document.getElementsByName("PUBD_save_path")[0]) document.getElementsByName("PUBD_save_path")[0].value = getConfig("PUBD_save_path");
    if (document.getElementsByName("PUBD_type_name0")[0]) document.getElementsByName("PUBD_type_name0")[0].value = getConfig("PUBD_type_name0");
    if (document.getElementsByName("PUBD_type_name1")[0]) document.getElementsByName("PUBD_type_name1")[0].value = getConfig("PUBD_type_name1");
    if (document.getElementsByName("PUBD_type_name2")[0]) document.getElementsByName("PUBD_type_name2")[0].value = getConfig("PUBD_type_name2");
    if (document.getElementsByName("PUBD_multiple_mask")[0]) document.getElementsByName("PUBD_multiple_mask")[0].value = getConfig("PUBD_multiple_mask");
};
//生成导出下载窗口
function buildExport() {
    if (document.getElementById("PixivUserBatchDownloadExport")) return;
    var insertPlace = document.getElementsByClassName("_image-items")[0];
    var set = document.createElement("div");
    set.id = "PixivUserBatchDownloadExport";
    set.className = "notification-popup";
    set.style.display = "block";
    //自定义CSS
    var style = document.createElement("style");
    set.appendChild(style);
    style.type = "text/css";
    style.innerHTML +=
        [
            ".PUBD_batch" + "{\r\n" + [
                'width:350px',
                'max-width:350px',
                'min-width:350px',
                'min-height:100px',
            ].join(';\r\n') + "\r\n}",
        ].join('\r\n');

    //标题行
    var h2 = document.createElement("h2");
    h2.innerHTML = "Aria2导出";

    //设置内容
    var ul = document.createElement("ul");
    ul.className = "notification-list message-thread-list";

    //导出-Batch
    var li = document.createElement("li");
    //li.className = "thread";
    //var divTime = document.createElement("div");
    //divTime.className = "time date";
    var divName = document.createElement("div");
    divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    //li.appendChild(divTime);
    li.appendChild(divName);
    li.appendChild(divText);
    ul.appendChild(li);

    divName.innerHTML = "命令行提示符批处理";
    //divTime.innerHTML = "保存为bat文件运行"
    var ipt = document.createElement("textarea");
    ipt.className = "PUBD_batch";
    ipt.name = "PUBD_batch";
    ipt.wrap = "off";
    divText.appendChild(ipt);

    //导出-Down
    var li = document.createElement("li");
    //li.className = "thread";
    //var divTime = document.createElement("div");
    //divTime.className = "time date";
    //var divName = document.createElement("div");
    //divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    //li.appendChild(divTime);
    //li.appendChild(divName);
    li.appendChild(divText);
    ul.appendChild(li);

    //divName.innerHTML = "下载命令";
    //divTime.innerHTML = "保存为bat文件运行"
    var btnExport = document.createElement("a");
    btnExport.className = "_button";
    btnExport.name = "PUBD_down";
    btnExport.target = "_blank"
    btnExport.download = dataset.user_id + "_" + dataset.user_name + ".down"
    btnExport.innerHTML = "导出Aria2 *.down文件";
    //btnExport.onclick = function () { startProgram(2); }
    divText.appendChild(btnExport);

    //确定按钮行
    var confirmbar = document.createElement("div");
    confirmbar.className = "_notification-request-permission";
    confirmbar.style.display = "block";
    var btnClose = document.createElement("button");
    btnClose.className = "_button";
    btnClose.innerHTML = "关闭";
    btnClose.onclick = function () { insertPlace.removeChild(set); }

    confirmbar.appendChild(btnClose);

    set.appendChild(h2);
    set.appendChild(ul);
    set.appendChild(confirmbar);
    insertPlace.appendChild(set);
}
//检测下载完成情况
function startProgramCheck(mode) {
    if (getPicNum > 0 && getPicNum >= dataset.illust_file_count) {
        li2.innerHTML = "获取完成：" + getPicNum + "/" + dataset.illust_file_count;
        startDownload(mode);
        clearInterval(downOver);
    }
    else
    {
        li2.innerHTML = "已获取图像地址：" + getPicNum + "/" + dataset.illust_file_count;
        var PUBD_batch = document.getElementsByName("PUBD_batch")[0];
        if (PUBD_batch) PUBD_batch.value = li2.innerHTML;
    }
    console.log("获取" + getPicNum + "/" + dataset.illust_file_count);
}
//开始构建下载
function startDownload(mode) {
    switch (mode)
    {
        case 0: //RPC模式
            var aria2 = new ARIA2(getConfig("PUBD_PRC_path"));

            for (ii = 0; ii < dataset.illust.length; ii++) {
                var ill = dataset.illust[ii];
                for (pi = 0; pi < ill.original_src.length; pi++) {
                    aria2.addUri(ill.original_src[pi], {
                        "out": showMask(getConfig("PUBD_save_path"), ill, pi),
                        "referer": ill.url,
                        "remote-time": "true",
                        "allow-overwrite": "false",
                        "auto-file-renaming": "false"
                    });
                }
            }
            break;
        case 1: //生成BAT下载命令模式
            var txt = "";
            var downtxt = "";
            for (ii = 0; ii < dataset.illust.length; ii++)
            {
                var ill = dataset.illust[ii];
                for (pi = 0; pi < ill.original_src.length; pi++)
                {
                	txt += "aria2c --allow-overwrite=false --auto-file-renaming=false --remote-time=true --out=\"" + showMask(getConfig("PUBD_save_path"), ill, pi) + "\" --referer=\"" + ill.url + "\" \"" + ill.original_src[pi] + "\"";
                    downtxt += ill.original_src[pi]
						+ "\r\n out=\"" + showMask(getConfig("PUBD_save_path"), ill, pi) + "\""
						+ "\r\n referer=\"" + ill.url + "\""
						+ "\r\n allow-overwrite=false"
						+ "\r\n auto-file-renaming=false"
						+ "\r\n remote-time=true"
						;
                	if (pi < ill.original_src.length - 1)
                	{
                		txt += "\r\n";
                		downtxt += "\r\n\r\n";
                	}
                }
            }
            var txta = document.getElementsByName("PUBD_batch")[0];
            var btn = document.getElementsByName("PUBD_down")[0];
            if (txta) txta.value = txt;
            var downurl = "data:text/html;charset=utf-8," + encodeURIComponent(downtxt);
            if (btn) btn.href = downurl;
            //console.log(txt);
            break;
        default:
            alert("未知的下载模式");
            break;
    }
    //console.log(dataset);
};

function showMask(str,ill,index)
{
    var newTxt = str;
    var regMask = /%{([^}]+)}/g;
    var rs = regMask.exec(str);
    while (rs != null) {
        if (rs[1] == "multiple")
        {
            var rp = "";
            if (ill.type == 1)
            {
                if (getConfig("PUBD_multiple_mask").indexOf("%{multiple}") >= 0 || getConfig("PUBD_multiple_mask").indexOf("%{type_name}") >= 0 && getConfig("PUBD_type_name" + ill.type).indexOf("%{multiple}" >= 0))
                    console.log("掩码中存在循环自身引用");
                else
                    var rp = showMask(getConfig("PUBD_multiple_mask"), ill, index);
            }
            newTxt = newTxt.replace(rs[0], rp);
        }
        else if (rs[1] == "type_name")
        {
            var rp = "";
            if (getConfig("PUBD_type_name" + ill.type).indexOf("%{type_name}") >= 0 || getConfig("PUBD_type_name" + ill.type).indexOf("%{multiple}") >= 0 && getConfig("PUBD_multiple_mask").indexOf("%{type_name}" >= 0))
                console.log("掩码中存在循环自身引用");
            else
                var rp = showMask(getConfig("PUBD_type_name" + ill.type), ill, index);
            newTxt = newTxt.replace(rs[0], rp);
        }
        else if (rs[1] == "page")
            newTxt = newTxt.replace(rs[0], index);
        else if (rs[1] == "filename" || rs[1] == "extention" || rs[1] == "original_src")
            newTxt = newTxt.replace(rs[0], ill[rs[1]][index]);
        else if (ill[rs[1]] != undefined)
            newTxt = newTxt.replace(rs[0], ill[rs[1]]);
        else if (dataset[rs[1]] != undefined)
            newTxt = newTxt.replace(rs[0], dataset[rs[1]]);
        var rs = regMask.exec(str);
    }
    return newTxt;
}
})();