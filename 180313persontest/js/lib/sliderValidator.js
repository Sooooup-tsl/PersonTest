import loader from "./loader";
import helper from "./helper";
import envi from "./envi";

var holder;

var o = {
    /**
     * @description 验证码滑块初始化
     * @param {string?} holderObj 滑块呈现元素占位符 string/element，为null时会自动创建
     * @return {function} loadCallback 滑块加载完成后回调方法
     */
    init: function (holderObj, loadCallback) {
        var type = typeof holderObj;
        if (type == "function") loadCallback = holderObj;
        if (holderObj && type == "object") holder = holderObj;
        else if (type == "string") holder = $(holderObj).get(0);
        else holder = $('<div id="TCaptcha" style="position:fixed;left:0;top:0;z-index:1000"></div>').appendTo("body").get(0);
        loadCallback && $(holder).on("DOMNodeInserted", function (e) { // hack app bug            
            var ifr = $(holder).find("iframe");
            ifr.length && ifr.on("load", loadCallback);
        });
    },

    /**
     * @description 显示滑块验证码
     * @param {string} phone 手机号
     * @param {int} platId 渠道/平台ID
     * @param {string} userIden 用户凭据
     * @param {string} enActId 加密后的活动号
     * @param {object} opts { themeColor: '21BA45', callback: fun, onLoadError: fun }
     */
    show: function (phone, platId, userIden, enActId, opts) {
        var fn = function () {
            var os = {
                callback: function (res) {
                    opts.callback && opts.callback(res.ret == 0, res);
                }, themeColor: opts.themeColor || "21BA45"
            };
            window.capInit && capInit(holder, os);
        };
        if (window.capInit) fn();
        else {
            var key = (platId == helper.plat.app.id || platId == helper.plat.yPiao.id) ? 'mid' : 'idenid',
                para = {
                    phone: phone,
                    pid: platId,
                    encodedactivityid: enActId
                };
            if (userIden) para[key] = userIden;
            helper.middlePost("/uniontrainactivity/comgetverifycodeofsecuritygroup", para, function (isOk, data) {
                var bData = helper.getMiddleData(isOk, data);
                if (bData) {
                    if (bData.code == 1000) {
                        var url = bData.result;
                        url = url.substring(url.indexOf('//'));
                        loader.loadJsByUrl(url, function (isOk2, urlData) {
                            if (isOk2) fn();
                            else if (opts.onLoadError) opts.onLoadError(3, urlData);
                            else helper.showToast("加载滑块链接失败");
                        });
                    } else {
                        if (opts.onLoadError) opts.onLoadError(2, bData);
                        else if (bData.code == 1006) helper.showToast("活动过期");
                        else if (bData.code == 2002) helper.showToast("获取滑块链接失败");
                        else helper.showToast("网络开小差，稍后再试");
                    }
                } else {
                    if (opts.onLoadError) opts.onLoadError(1, data);
                    else helper.showToast("网络开小差，稍后再试");
                }
            }, { addCheckPara: true });
        }
    },

    /**
     * @description 发送验证码
     * @param {string} ticket 滑块验证码验证完成后得到的票据
     * @param {string} phone 手机号
     * @param {int} platId 渠道/平台ID
     * @param {string} userIden 用户凭据
     * @param {string} enActId 加密后的活动号
     * @param {function} callback 接口回调方法
     */
    sendCode: function (ticket, phone, platId, userIden, enActId, callback) {
        var key = (platId == helper.plat.app.id || platId == helper.plat.yPiao.id) ? 'mid' : 'idenid',
            para = {
                phone: phone,
                pid: platId,
                ticket: ticket,
                encodedactivityid: enActId
            };
        if (userIden) para[key] = userIden;
        helper.middlePost("/uniontrainactivity/comckeckandsendverifycode", para, callback, { addCheckPara: true });
    },

    /**
     * @description 显示滑块并发送验证码
     * @param {string} phone 手机号
     * @param {int} platId 渠道/平台ID
     * @param {string} userIden 用户凭据
     * @param {string} enActId 加密后的活动号
     * @param {object} opts { themeColor: '21BA45', callback: fun, onLoadError: fun }
     */
    showAndSend: function (phone, platId, userIden, enActId, opts) {
        var callback = opts.callback;
        opts.callback = (isPass, res) => {
            if (!isPass) {
                callback && callback(isPass, res);
                return;
            }
            this.sendCode(res.ticket, phone, platId, userIden, enActId, (isOk, data) => {
                var bData = helper.getMiddleData(isOk, data);
                if (bData) {
                    if (bData.code == 1000) {
                        callback && callback(true, bData);
                    } else {
                        if (opts.onLoadError) opts.onLoadError(5, bData);
                        else if (bData.code == 1006) helper.showToast("活动过期");
                        else if (bData.code == 2002) helper.showToast("验证失败");
                        else helper.showToast("验证码发送失败");
                    }
                } else {
                    if (opts.onLoadError) opts.onLoadError(4, data);
                    else helper.showToast("网络开小差，稍后再试");
                }
            });
        };
        this.show(phone, platId, userIden, enActId, opts)
    }
};

export default o
