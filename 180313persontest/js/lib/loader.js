
var
    getText = function (url, callback) {
        var fn = callback || function () { };
        $.ajax({
            type: "GET",
            url: url,
            //dataType: "text",
            complete: function (xhr, status) {
                if (200 == xhr.status) fn(true, xhr.responseText);
                else fn(false, xhr);
            }
        });
    },
    appendToHead = function (e) {
        document.getElementsByTagName("head")[0].appendChild(e);
    };

var loader = {

    // 把 js code 加载到页面中
    loadJs: function (jsCode) {
        var s = document.createElement("script");
        s.innerHTML = jsCode;
        appendToHead(s);
    },

    // 动态引入js
    loadJsByUrl: function (urls, callback) {
        var arr = Array.isArray(urls) ? urls : [urls];
        if ($.isFunction(callback)) {
            var fun = function (url) {
                var s = document.createElement("script");
                s.src = arr[i];
                s.onload = function () {
                    callback && callback(true, url);
                };
                s.onerror = function (err) {
                    callback && callback(false, url, err);
                    console.log("load error: ", err);
                };
                appendToHead(s);
            };
            for (var i in arr) fun(arr[i]);
        } else {
            for (var i in arr) {
                var s = document.createElement("script");
                s.src = arr[i];
                appendToHead(s);
            }
        }
    },

    // 获取 css code
    getCss: function (urls, callback) {
        var arr = Array.isArray(urls) ? urls : [urls], cssCode = "";
        (function (i) {
            var me = arguments.callee;
            getText(arr[i++], function (isOk, txt) {
                if (isOk) {
                    cssCode += txt;
                    if (i == arr.length) callback(true, cssCode);
                    else me(i);
                } else {
                    callback(false, txt);
                }
            });
        })(0);
    },

    // 把 css code 加载到页面中
    loadCss: function (cssCode) {
        var s = document.createElement("style");
        s.type = "text/css";
        s.textContent = cssCode;
        appendToHead(s);
    },

    loadCssByUrl: function (urls, callback) {
        var arr = Array.isArray(urls) ? urls : [urls];
        if ($.isFunction(callback)) {
            this.getCss(arr, function (isOk, cssCode) {
                if (isOk) {
                    this.loadCss(cssCode);
                    callback(true);
                } else callback(false, cssCode);
            }.bind(this));
        } else {
            for (var i in arr) {
                var l = document.createElement("link");
                l.href = arr[i];
                l.rel = "stylesheet";
                appendToHead(l);
            }
        }
    },

    // 获取 text
    getText: function (url, callback) {
        getText(url, callback);
    },

    loadImg: function () {

    }
};

export default loader;