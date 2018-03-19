// 针对字符串（String）对象做扩展
(function (S) {
    S.prototype.zjTrim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
    S.prototype.zjFill = function (args) {
        var s = this;
        if (args != null) {
            var r, type = Object.prototype.toString.call(args),
                arr = type == "[object Array]" || type == "[object Object]" ? args : arguments;
            for (var i in arr) {
                r = new RegExp('\\{' + i + '\\}', 'gm');
                s = s.replace(r, arr[i]);
            }
        }
        return s;
    };
    S.prototype.zjReplace = function (oldStr, newStr) {
        var s = this, i = 0;
        while ((i = s.indexOf(oldStr, i)) > -1) {
            s = s.substring(0, i) + newStr + s.substring(i + oldStr.length);
            i += newStr.length;
        }
        return s;
    };
})(String);

// 针对日期（Date）对象做扩展
(function (D) {
    D.zjParse = function (str) {
        var arr = /Date\((\d{13})\)/.exec(str);
        if (arr && arr.length == 2) return new Date(Number(arr[1]));
        return new Date(Date.parse(str.replace(/-/g, '/')));
    };

    D.prototype.zjMinus = function (date) {
        var ms = (this.getTime() - date.getTime()); // / 24 / 3600 / 1000;

        var day = Math.floor(ms / 24 / 3600 / 1000),
            hh = Math.floor((ms / 3600 / 1000) % 24),
            mm = Math.floor((ms / 1000 / 60) % 60),
            ss = Math.floor((ms / 1000) % 60);
        return {
            day: day,
            hour: hh,
            minute: mm,
            second: ss
        };
    }

    D.prototype.zjGetWeek = function () {
        return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][this.getDay()];
    }

    D.prototype.zjFormat = function (format) {
        var o = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "H+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "f+": this.getMilliseconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),
            "w+": this.zjGetWeek()
        };

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
        return format;
    };
})(Date);

// html模板渲染器
var zjRender = function (tmpl) {
    var f, varI = 1219,
        esc = function (s) {
            return s.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/'/g, "\\'")
        },
        foreach = function (m) {
            return "for(var i{0} in {1}){var {2}={1}[i{0}];".zjFill(varI++, m[2], m[1]);
        };

    var init = function () {
        var m, t, reg = /{{([\s\S]+?)}}/,
            forReg = /\s*foreach\s*\(var\ +([_a-zA-Z0-9]+)\ +in\ +([^\)]+)\)\s*\{\s*/,
            code = "var str = '';";
        while (m = reg.exec(tmpl)) {
            t = m[1];
            code += "str += '" + esc(tmpl.substring(0, m.index)) + "';";
            if (t.charAt(0) == ':') code += "str += " + t.substring(1) + ";";
            else if (t.charAt(0) == '>') code += "str += (" + t.substring(1) + " + '').replace(/</g,'&lt;').replace(/>/g,'&gt;');";
            else if (forReg.test(t)) code += foreach(forReg.exec(t));
            else code += t;
            tmpl = tmpl.substring(m.index + m[0].length);
        }
        code += "str += '" + esc(tmpl) + "';";
        code += "return str;";
        try {
            f = new Function(["data", "index"], code);
        } catch (e) {
            console.log(code.zjReplace(';', ';\r\n'));
            console.error('zjRender Error:' + e.message);
        }
        //console.log((f + "").zjReplace(';', ';\r\n'));
    };

    this.fill = function (data) {
        if (Object.prototype.toString.call(data) == "[object Array]") {
            var s = '';
            for (var i in data) s += f(data[i], i);
            return s;
        }
        return f(data, -1);
    };

    init();
};

var en = process.env.NODE_ENV, // 当前的打包环境
    projDirName = process.env.ProjDirName,  // 当前活动项目的文件夹名称
    mRoot = process.env.MiddleRoot, // 中间层接口地址
    bRoot = process.env.BackRoot, // 后端接口地址
    pack = {
        isDev: en.indexOf('dev') == 0, // 是否是本地开发环境
        isTest: en.indexOf('test') == 0, // 是否是预发测试环境
        isProd: en.indexOf('prod') == 0, // 是否是生产环境
        projDirName: projDirName // 项目文件夹名称
    },

    /**
     * @description 获取/添加中间层公共参数（入参）
     * @param {object} data
     * @return {opts} options
     */
    getMiddlePara = function (data, opts) {
        var para = {
            ts: Date.now(),
            pid: helper.getCurrPlat().id,
            callerid: "train.mo.frontend"
        };
        if (data.pid != null) para.pid = data.pid;
        if (opts.addCheckPara) {
            if (para.pid == helper.plat.qq.id) {
                para["oauth_consumer_key"] = "101177501";
                para["access_token"] = $.cookie("token");
            }
        }
        return $.extend(para, data);
    },
    helper = {
        /**
         * @description 当前运行环境
         */
        pack: pack,

        /**
         * @description 显示加载弹窗
         * @param {string?} text 提示信息
         */
        showLoading: function (text) {
            text = text || '正在加载...';
            $('body').append('<div id="loading" class="loading-layer"><div class="loading-activity"><div class="loading-icon-activity"><div class="loading-gif"></div></div><div class="loading-text-activity">' + text + '</div></div></div>');
        },

        /**
         * @description 隐藏加载弹窗
         */
        hideLoading: function () {
            $('#loading').remove();
        },

        /**
         * @description 显示toast弹窗
         * @param {string} message 要显示的提示信息
         * @param {function?} callback 显示完成后的回调方法 
         */
        showToast: function (message, callback) {
            $('<div class="toast"><div class="toast-inner"><div class="toast-text">' + message + '</div></div></div>').appendTo($('.wrap'));
            toastid = setTimeout(function () {
                $('.toast').hide().remove();
                clearTimeout(toastid);
                callback && callback();
            }, 2000);
        },
        showAlert: function (message, callback) {

        },
        showConfirm: function (message, callback, title) {

        },
        stopScroll: function () {
            $('body').on('touchmove', function (e) {
                e.preventDefault();
            });
        },
        startScroll: function () {
            $('body').off('touchmove');
        },

        /**
         * @description 发送http/https接口请求
         * @param {string} url 接口地址
         * @param {object} data 接口所需参数
         * @param {function?} callback 接口请求完成后的回调方法 (isOk, res) => {} 
         * @param {object?} options 其它非接口参数，如timeout等
         */
        http: function (url, data, callback, options) {
            var opts = {
                showLoading: true,
                timeout: 20000,
                dataType: 'json'
            };
            if (options) for (var i in options) opts[i] = options[i];

            if (opts.showLoading) this.showLoading();

            var that = this,
                fn = function (isOk, res) {
                    if (opts.showLoading) that.hideLoading();
                    callback && callback(isOk, res);
                },
                success = function (res) {
                    fn(true, res);
                },
                error = function (res) {
                    console.error(res);
                    fn(false, res);
                };

            // var os = {
            //     headers: {
            //         withCredentials: "true"
            //     }
            // };

            if (opts.signFn) data.sign = opts.signFn(data);

            $.ajax({
                url: url,
                type: opts.method,
                dataType: opts.dataType,
                cache: false,
                data: data,
                timeout: opts.timeout,
                success: success,
                error: error
            });
        },

        /**
         * @description 发送http/https接口GET请求
         * @param {string} url 接口地址
         * @param {object} data 接口所需参数
         * @param {function?} callback 接口请求完成后的回调方法 (isOk, res) => {} 
         * @param {object?} options 其它非接口参数，如timeout等
         */
        httpGet: function (url, data, callback, options) {
            if (!options) options = {};
            options["method"] = "GET";
            this.http(url, data, callback, options);
        },

        /**
         * @description 发送http/https接口GET请求，并使用JSONP的方式获取接口返回值
         * @param {string} url 接口地址
         * @param {object} data 接口所需参数
         * @param {function?} callback 接口请求完成后的回调方法 (isOk, res) => {} 
         * @param {object?} options 其它非接口参数，如timeout等
         */
        httpJSONP: function (url, data, callback, options) {
            if (!options) options = {};
            options["dataType"] = "jsonp";
            this.httpGet(url, data, callback, options);
        },

        /**
         * @description 使用GET方式请求中间层接口
         * @param {string} apiName 接口名称
         * @param {object} data 接口所需参数
         * @param {function?} callback 接口请求完成后的回调方法 (isOk, res) => {} 
         * @param {object?} options 其它非接口参数，如timeout、addCheckPara等
         */
        middleGet: function (apiName, data, callback, options) {
            var para = getMiddlePara(data, options);
            this.httpGet(mRoot + apiName, para, callback, options);
        },

        /**
         * @description 使用POST方式请求中间层接口
         * @param {string} apiName 接口名称
         * @param {object} data 接口所需参数
         * @param {function?} callback 接口请求完成后的回调方法 (isOk, res) => {} 
         * @param {object?} options 其它非接口参数，如timeout、addCheckPara等
         */
        middlePost: function (apiName, data, callback, options) {
            if (!options) options = {};
            options["method"] = "POST";
            var para = getMiddlePara(data, options);
            this.http(mRoot + apiName, para, callback, options);
        },

        /**
         * @description 获取中间层接口data返回值
         * @param {boolean} isOk
         * @param {object} res
         * @return {object}  data返回值（json格式）
         */
        getMiddleData: function (isOk, res) {
            if (isOk && res) {// && res.status == 200
                if (typeof res.data === "string") {
                    try {
                        return JSON.parse(res.data);
                    } catch (ex) {
                        console.error(ex);
                    }
                }
                return res.data;
            }
            return null;
        },

        /**
        * @description 使用GET方式请求后端接口
        * @param {string} apiName 接口名称
        * @param {object} data 接口所需参数
        * @param {function?} callback 接口请求完成后的回调方法 (isOk, res) => {} 
        * @param {object?} options 其它非接口参数，如timeout等
        */
        backGet: function (apiName, data, callback, options) {
            this.httpGet(bRoot + apiName, data, callback, options);
        },

        /**
        * @description 使用POST方式请求后端接口
        * @param {string} apiName 接口名称
        * @param {object} data 接口所需参数
        * @param {function?} callback 接口请求完成后的回调方法 (isOk, res) => {} 
        * @param {object?} options 其它非接口参数，如timeout等
        */
        backPost: function (apiName, data, callback, options) {
            if (!opts) opts = {};
            opts["method"] = "POST";
            this.http(bRoot + apiName, data, callback, options);
        },

        /**
        * @description 渲染html模板
        * @param {string} tmplSelector html模板选择器
        * @param {object} data html模板数据
        * @return {string} 返回渲染后html代码
        */
        render: function (tmplSelector, data) {
            var tmpl = document.querySelector(tmplSelector).innerHTML;
            // var tmpl = $(tmplSelector).html();
            return new zjRender(tmpl).fill(data);
        },

        /**
        * @description 渠道/平台信息
        */
        plat: {
            wx: {
                id: 501
            },
            qq: {
                id: 596
            },
            app: {
                id: 434
            },
            yPiao: {
                id: 860
            },
            other: {
                id: -1
            }
        },

        /**
        * @description 获取指定URL的页面名称
        * @param {string} URL 参数为null时，获取当前URL
        * @return {string} 
        */
        getPageName: function (url) {
            if (!url) url = location.href;
            var i = url.indexOf('?');
            if (i > -1) url = url.substring(0, i);
            if (url[url.length - 1] == '/') url = url.substring(0, url.length - 1);
            var pn = url.substring(url.lastIndexOf('/') + 1);
            if (this.pack.isDev && pn.indexOf('.') > 0) pn = pn.substring(0, pn.indexOf('.'));
            return pn;
        },

        /**
        * @description 初始化页面统计代码
        * @param {string} refid
        * @param {string?} baiduCode string/{pageName:code}
        */
        initStat: function (refid, baiduCode) {
            this.getUserIden((userIden) => {
                var _tcq = _tcq || [],
                    _timediff = -1;
                if (typeof _tcopentime != "undefined") {
                    _timediff = new Date().getTime() - _tcopentime;
                }
                _tcq.push(['_refId', refid]);
                _tcq.push(['_vrcode', '10003-2016-0']);
                _tcq.push(['_userId', userIden]);
                _tcq.push(['_openTime', _timediff]);
                _tcq.push(['_trackPageview', userIden]);
                window._tcq = _tcq;
                window._timediff = _timediff;
            });

            if (!baiduCode) return;

            if (typeof baiduCode == "object") {
                var bc = null, pn = this.getPageName();
                for (var i in baiduCode) {
                    if (i == pn) {
                        bc = baiduCode[i];
                        break;
                    }
                }
            }
            if (!bc) return;
            var _hmt = _hmt || [];
            (function () {
                var hm = document.createElement("script");
                hm.src = "//hm.baidu.com/hm.js?" + bc;
                var s = document.getElementsByTagName("script")[0];
                s.parentNode.insertBefore(hm, s);
            })();
            window._hmt = _hmt;
        },

        /**
        * @description 添加统计/点击事件
        * @param {string} eventName 事件名称
        * @param {string?} label 
        * @param {string?} value 
        */
        pushEvent: function (eventName, label, value) {
            try {
                if (window._tcTraObj) _tcTraObj._tcTrackEvent('TrainActivity', eventName, label || '', value || '');
                if (window._hmt) _hmt.push(['_trackEvent', eventName, label || 'click', value || 'touch']);
            } catch (e) { }
        },

        /**
        * @description 获取当前URL参数
        * @param {string?} name 参数名称，为null时 则以json的格式返回所有的参数信息
        * @return {string} string/json
        */
        getUrlArg: function (name) {
            return this.getArgByUrl(location.href, name);
        },

        /**
        * @description 获取指定URL参数
        * @param {string?} url 为null时 则默认获取当前的URL
        * @param {string?} name 参数名称，为null时 则以json的格式返回所有的参数信息
        * @return {string} string/json
        */
        getArgByUrl: function (url, name) {
            var str = url.substring(url.indexOf('?') + 1),
                args = {};
            var i = str.indexOf('#');
            if (i > -1) str = str.substring(0, i);
            if (str) {
                var arr = str.split('&');
                for (var i in arr) {
                    var t = arr[i].split('='),
                        v = t.length > 1 ? t[1] : "";
                    v = v.replace(/</g, "&lt;").replace(/>/g, "&gt;")
                    args[t[0]] = v;
                }
            }
            if (name != null) return args[name];
            return args;
        },

        /**
        * @description 获取当前浏览器的运行环境
        * @return {object}
        */
        getEnvi: function () {
            return require('./envi').default;
        },

        /**
        * @description 是否需要输入手机号码（暂app和有票儿需要）
        * @param {int} targetPlatId 目标渠道/平台ID
        * @return {boolean}
        */
        isNeedPhone: function (targetPlatId) {
            var pId = targetPlatId, plat = this.plat;
            return pId == plat.app.id || pId == plat.yPiao.id;
        },

        /**
        * @description 设置页面标题
        * @param {string} title 页面标题
        */
        setTitle: function (title) {
            var en = this.getEnvi();
            if (en.isInApp) {
                if (window._tc_bridge_bar) {
                    _tc_bridge_bar.set_navbar({
                        'param': {
                            'center': [{ 'value': title }]
                        }
                    });
                    return;
                }
            }
            document.title = title;
        },

        /**
         * @description 获取当前URL携带的refid参数
         * @return {string} refid
         */
        getRefid: function () {
            return this.getUrlArg("refid") || this.getUrlArg("RefId") || '';
        },

        /**
         * @description 获取当前可分享的URL，如果目标渠道是微信的话，会改变 host 为 wx.17u.cn
         * @param {int?} toPlatId 目标渠道ID，为null时会默认当前渠道
         * @param {string?} searchArg 需要携带的URL参数，可以是string/key[]/{key:val}
         * @return {string} url
         */
        getShareUrl: function (toPlatId, searchArg) {
            if (!toPlatId) toPlatId = this.getCurrPlat().id;
            var // refid = this.getRefid(),
                protocol = location.protocol,
                //如果目标渠道是微信，则改变 host 为 wx.17u.cn
                host = toPlatId == this.plat.wx.id ? 'wx.17u.cn' : location.host,
                url = protocol + "//" + host + location.pathname;

            // if (refid) url += '?refid=' + refid;
            if (searchArg) {
                if (typeof searchArg == "object") {
                    var temp = searchArg;
                    searchArg = '';
                    if ($.isArray(temp)) {
                        var args = this.getUrlArg();
                        for (var key of temp) {
                            var val = args[key];
                            if (val != null) searchArg += '&' + key + "=" + encodeURIComponent(val);
                        }
                    } else {
                        for (var key in temp) {
                            var val = temp[key];
                            searchArg += '&' + key + "=" + encodeURIComponent(val);
                        }
                    }
                }
                if (searchArg[0] == '?' || searchArg[0] == '&') searchArg = searchArg.substring(1);
                if (searchArg) url += (url.indexOf('?') > -1 ? '&' : '?') + searchArg;
            }
            url = this.getViewportUrl(url);
            if (toPlatId == helper.plat.qq.id) url = protocol + "//app.ly.com/hcpzt/cube/common/jump2qq2?url=" + encodeURIComponent(url);
            return url;
        },

        /**
         * @description 为url添加wv_viewport参数，目前主要适用于app渠道的UI兼容问题
         * @param {string} url
         * @return {string} url
         */
        getViewportUrl: function (url) {
            var vp = 'wv_viewport';
            if (url.indexOf(vp) > -1) return url;
            return url + (url.indexOf('?') > -1 ? '&' : '?') + vp;
        },

        /**
         * @description 是否需要再次跳转，目前主要是为了处理app渠道的UI排版问题
         * @return {boolean}
         */
        isReturnUrl: function () {
            var en = this.getEnvi();
            if (en.isInApp) { // 处理页面排版兼容问题
                var vp = 'wv_viewport';
                if (location.search.indexOf(vp) == -1) {
                    if (en.isAndroid) {
                        //alert(document.referrer);
                        location.replace(location.origin + location.pathname + location.search + (location.search ? '&' : '?') + 'tcwvcnew' + vp);
                        setTimeout(function () {
                            if (document.referrer) history.back();
                            else location.href = "http://shouji.17u.cn/internal/common/close";
                        }, 200);
                    } else {
                        location.replace(location.origin + location.pathname + location.search + (location.search ? '&' : '?') + vp);
                    }
                    return true;
                }
            }
            return false;
        },

        /**
         * @description 处理（活动规则）换行、空格等
         * @param {string} txt 文本内容
         * @return {string} 
         */
        wordWrap: function (txt) {
            txt = txt.replace(/\ /g, '&nbsp;');
            txt = txt.replace(/\n/g, '<br/>');
            txt = txt.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
            return txt;
        },

        /**
         * @description 将http/https替换为当前的协议
         * @param {string} str
         * @return {string} 
         */
        replaceProtocol: function (str) {
            return str.replace(/https?:/ig, location.protocol);
        },

        /**
         * @description 根据所在不同的渠道/平台环境获取用户标识，在PC端调试时可以统一使用URL中的testMid参数
         * @param {function} callback 主要为了兼容有票儿
         */
        getUserIden: function (callback) {
            var fn = callback;
            callback = function (iden) {
                if (!iden) iden = helper.getUrlArg('testMid') || '';
                fn && fn(iden);
            }
            var userIden, en = this.getEnvi();
            if (en.isInApp) {
                userIden = this.getUrlArg('mid') || '';
                if (userIden.toLowerCase() == 'tcwvmid') userIden = '';
                callback(userIden);
            } else if (en.isInYpiao) {
                if (window.UTicketApp) callback(UTicketApp.getMemberId() || '');
                else if (window.IosUTicketApp) {
                    IosUTicketApp.getIosMemberId(function (memberId) {
                        callback(memberId || '');
                    });
                } else callback(null);
            } else if (en.isInQQ) {
                userIden = this.getUrlArg('openid') || this.getUrlArg('code') || '';
                callback(userIden);
            } else if (en.isInWeixin) {
                var getWxObj = function () {
                    var str = $.cookie('WxUser');
                    var theRequest = new Object();
                    if (str) {
                        var strs = str.split('&');
                        for (var i = 0; i < strs.length; i++) {
                            theRequest[strs[i].slice(0, strs[i].indexOf('='))] = strs[i].slice(strs[i].indexOf('=') + 1);
                        }
                    }
                    return theRequest;
                }
                userIden = getWxObj().openid || this.getUrlArg('openid') || this.getUrlArg('code') || '';
                callback(userIden);
            } else callback();
        },

        /**
         * @description 获取带用户授权/登录的连接
         * @param {string?} url 为null时 则默认获取当前的URL
         * @param {boolean?} mustLogin 是否必需登录，主要针对 app 和 有票有用
         * @param {int?} targetPlatId 目标渠道/平台ID，为null时 则默认获取当前渠道ID
         * @param {boolean?} getUserInfo 是否获取用户信息，目前只对微信有用（获取头像和昵称）
         * @return {string} 
         */
        getAuthUrl: function (url, mustLogin, targetPlatId, getUserInfo) {
            if (!url) url = location.href;
            var authUrl, platId = targetPlatId == null ? this.getCurrPlat().id : targetPlatId; //en = this.getEnvi();
            if (platId == this.plat.app.id) {
                authUrl = url + (url.indexOf('?') > -1 ? '&' : '?') + "mid=tcwvmid";
                if (mustLogin) authUrl += "&tcwvclogin";
            } else if (platId == this.plat.yPiao.id) {
                authUrl = url;
                if (mustLogin) {

                }
            } else if (platId == this.plat.qq.id) {
                //authUrl = 'http://open.show.qq.com/cgi-bin/login_state_auth_redirect?appid=101177501&redirect_uri=http%3A%2F%2Fapp.ly.com%2Ftrain%2Findex.html%3Fmqq_redirectUrl%3D{0}';
                authUrl = location.protocol + "//app.ly.com/hcpzt/cube/common/jump2qq2?url={0}";
                authUrl = authUrl.zjFill(encodeURIComponent(url));
            } else if (platId == this.plat.wx.id) {
                authUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx3827070276e49e30&redirect_uri=http://wx.17u.cn/flight/getopenid.html?url={0}&response_type=code&scope={1}&state=123#wechat_redirect';
                authUrl = authUrl.zjFill(encodeURIComponent(url), getUserInfo ? 'snsapi_userinfo' : 'snsapi_base');
            }
            return authUrl;
        },

        /**
         * @description 获取当前带授权的URL
         * @param {int?} toPlatId 目标渠道/平台ID，为null时 则默认获取当前渠道ID
         * @param {string?} searchArg 需要携带的URL参数，可以是string/key[]/{key:val}
         * @param {boolean?} mustLogin 是否必需登录，主要针对 app 和 有票有用
         * @param {boolean?} getUserInfo 是否获取用户信息，目前只对微信有用（获取头像和昵称）
         * @return {string} 
         */
        getLocalAuthUrl: function (toPlatId, searchArg, mustLogin, getUserInfo) {
            var url = this.getShareUrl(toPlatId, searchArg);
            return this.getAuthUrl(url, mustLogin, toPlatId, getUserInfo);
        },

        /**
         * @description 获取购票首页连接
         * @param {int?} targetPlatId 目标渠道/平台ID，为null时 则默认获取当前渠道ID
         * @return {string} 
         */
        getBuyTicketUrl: function (targetPlatId) {
            var url, prot = location.protocol,
                platId = targetPlatId == null ? this.getCurrPlat().id : targetPlatId;
            if (platId == this.plat.app.id) {
                //url = 'http://shouji.17u.cn/internal/h5/file/18/main.html?wvc1=1&wvc2=1#/index';
                url = prot + "//app.ly.com/hcpzt/cube/common/openAppBuyTicket";
            } else if (platId == this.plat.yPiao.id) {
                url = prot + "//app.ly.com/hcpzt/cube/common/openYpiaoBuyTicket";
            } else if (platId == this.plat.qq.id) {
                url = 'http://wx.17u.cn/qqhome/?code=value&_vacf=qw&_wv=4099';
            } else if (platId == this.plat.wx.id) {
                url = 'http://wx.17u.cn/home';
            }
            if (url) {
                if (platId == this.plat.wx.id) {
                    url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx3827070276e49e30&redirect_uri=http://wx.17u.cn/home/index.html&response_type=code&scope=snsapi_base&state=123#wechat_redirect";
                } else {
                    url = this.getAuthUrl(url);
                }
            }
            return url;
        },

        /**
         * @description 去购票，跳转到购票页面
         * @param {int?} targetPlatId 目标渠道/平台ID，为null时 则默认获取当前渠道ID
         */
        toBuyTicket: function (targetPlatId) {
            location.href = this.getBuyTicketUrl(targetPlatId);
        },

        /**
         * @description 获取卡劵列表连接
         * @param {int?} targetPlatId 目标渠道/平台ID，为null时 则默认获取当前渠道ID
         * @return {string}
         */
        getCardCouponsListUrl: function (targetPlatId) {
            var url, prot = location.protocol,
                platId = targetPlatId == null ? this.getCurrPlat().id : targetPlatId;
            if (platId == this.plat.wx.id) {
                url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx3827070276e49e30&redirect_uri=http://wx.17u.cn/flight/getopenid.html?url=http://wx.17u.cn/pub/mycard&response_type=code&scope=snsapi_base&state=123#wechat_redirect';
            } else if (platId == this.plat.qq.id) {
                //url = prot + '//app.ly.com/hcpzt/cube/common/openQQCardCouponsList';
                url = prot + '//app.ly.com/hcpzt/cube/common/openQQTcCardCouponsList';
            } else if (platId == this.plat.app.id) {
                url = prot + '//app.ly.com/hcpzt/cube/common/openAppRedPackageList';
            } else if (platId == this.plat.yPiao.id) {
                url = prot + '//app.ly.com/hcpzt/cube/common/openYpiaoBuyTicket';
            }
            return url;
        },

        /**
         * @description 跳转到卡劵列表页面
         * @param {int?} targetPlatId 目标渠道/平台ID，为null时 则默认获取当前渠道ID
         */
        toCardCouponsList: function (targetPlatId) {
            location.href = this.getCardCouponsListUrl(targetPlatId);
        },

        /**
         * @description 获取外部跳转连接，目前主要针对从外部应用打开App渠道/平台
         * @param {string} url 需要跳转的URL
         * @param {int} targetPlatId 目标渠道/平台ID
         * @param {string?} refid
         * @return {string}
         */
        getExternalReturnUrl: function (url, targetPlatId, refid) {
            var plat = this.plat;
            if (targetPlatId == plat.app.id) {
                url = encodeURIComponent(url.replace(/\http\:\/\//g, "").replace(/\//g, "|"));
                url = location.protocol + "//m.17u.cn/app/qr/" + (refid ? refid : '42931258') + "?schemUrl=" + url;
            }
            return url;
        },

        /**
         * @description 获取当前渠道/平台
         * @return {object}
         */
        getCurrPlat: function () {
            var en = this.getEnvi(), plat;
            if (en.isInApp) plat = this.plat.app;
            else if (en.isInYpiao) plat = this.plat.yPiao;
            else if (en.isInWeixin) plat = this.plat.wx;
            else if (en.isInQQ) plat = this.plat.qq;
            else plat = this.plat.other;
            if (plat) return $.extend({}, plat);
            return null;
        }
    };

try {
    module.exports = helper;
} catch (ex) {
    //console.error(ex);
}
