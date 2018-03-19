import envi from "./envi";
import loader from "./loader";
import mergeAsyn from './mergeAsyn';

/*
 opts / options 参数说明：
 {
    initSuccess: function() // 初始化成功回调
    initFailed: function(err) // 初始化失败回调
    shareSuccess: function(channel) // 分享成功后回调
    shareFailed: function(channel, err) // 分享失败/取消后回调，取消回调 err = null    
    disableSuccess: function() // 禁用分享成功回调
    disableFailed: function(err) // 禁用分享失败回调
    shareChannels: { // 分享到外部渠道，key 取值范围 share.shareChannels
        wxTimeline: {
            title: '', // 分享标题
            desc: '', // 分享描述
            link: '', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
            imgUrl: '', // 分享图标
            type: '', // 分享类型,music、video或link，不填默认为link
            dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
            _isBack: true, // 是否返回，目前主要用于手Q
            _isLock: false // 是否开启?(锁定)，目前主要用于有票儿app
        }
    },
    //isToShare: true // 是否会主动调用分享，目前主要用于同程app
 }
*/

var opts,
    isInitRely = false,
    wxShare = {
        init: function () {
            this.initRely(function () {
                wxShare.onShare();
                opts.initSuccess && opts.initSuccess();
            });
        },
        disable: function () {
            this.initRely(function () {
                if (wx.hideAllNonBaseMenuItem) wx.hideAllNonBaseMenuItem();
                else if (wx.hideOptionMenu) wx.hideOptionMenu();
                else {
                    opts.disableFailed && opts.disableFailed();
                    return;
                }
                opts.disableSuccess && opts.disableSuccess();
            });
        },
        initRely: function (callback) {
            var fn = callback;
            callback = function () {
                isInitRely = true;
                fn && fn();
            };
            if (isInitRely) {
                callback();
                return;
            }
            var mAsynData = {},
                mAsyn = new mergeAsyn(2, function () {
                    var data = mAsynData.config;
                    wx.config({
                        debug: false,
                        appId: data.Data.AppId,
                        timestamp: data.Data.TimeStamp,
                        nonceStr: data.Data.NonceStr,
                        signature: data.Data.Signature,
                        jsApiList: [
                            'checkJsApi',
                            'onMenuShareTimeline',
                            'onMenuShareAppMessage',
                            'onMenuShareQQ',
                            'onMenuShareWeibo',
                            'hideMenuItems',
                            'showMenuItems',
                            'hideAllNonBaseMenuItem',
                            'showAllNonBaseMenuItem',
                            'translateVoice',
                            'startRecord',
                            'stopRecord',
                            'onRecordEnd',
                            'playVoice',
                            'pauseVoice',
                            'stopVoice',
                            'uploadVoice',
                            'downloadVoice',
                            'chooseImage',
                            'previewImage',
                            'uploadImage',
                            'downloadImage',
                            'getNetworkType',
                            'openLocation',
                            'getLocation',
                            'hideOptionMenu',
                            'showOptionMenu',
                            'closeWindow',
                            'scanQRCode',
                            'chooseWXPay',
                            'openProductSpecificView',
                            'addCard',
                            'chooseCard',
                            'openCard'
                        ]
                    });
                    wx.ready(function () {
                        callback && callback();
                    });
                    wx.error(function (err) {
                        console.error("wxShare init faild：", err);
                        opts.initFailed && opts.initFailed(err);
                    });
                });
            if (window.jWeixin) {
                mAsyn.push();
            } else {
                loader.loadJsByUrl(location.protocol + "//res.wx.qq.com/open/js/jweixin-1.3.2.js", function (isOk, url) {
                    if (isOk) mAsyn.push();
                    else opts.initFailed && opts.initFailed("加载wx js sdk error");
                });
            }
            $.ajax({
                url: '//www.ly.com/huochepiao/resource/WXJsApi/GetWXApiConfig',
                type: 'get',
                dataType: 'jsonp',
                cache: false,
                data: {
                    url: window.location.href
                },
                success: function (data) {
                    mAsynData.config = data;
                    mAsyn.push();
                },
                error: function (err) {
                    console.error("GetWXApiConfig faild：", err);
                    opts.initFailed && opts.initFailed(err);
                }
            });
        },
        onShare: function () {
            function fun(shareFunName, channel) {
                var data = $.extend({}, opts.shareChannels[channel]);
                data.success = function () {
                    opts.shareSuccess && opts.shareSuccess(channel);
                };
                data.cancel = function () {
                    opts.shareFailed && opts.shareFailed(channel);
                };
                wx[shareFunName](data);
            };
            var cs = opts.shareChannels;
            for (var i in cs) {
                if (i == share.shareChannels.wxTimeline) fun("onMenuShareTimeline", i);
                else if (i == share.shareChannels.wxAppMessage) fun("onMenuShareAppMessage", i);
                else if (i == share.shareChannels.qq) fun("onMenuShareQQ", i);
                else if (i == share.shareChannels.qZone) fun("onMenuShareQZone", i);
                else if (i == share.shareChannels.weibo) fun("onMenuShareWeibo", i);
                else console.error("wxShare not support " + i + " share");
            }
        },
        toShare: function (channel) {
            console.error("wxShare not support toShare");
        }
    },
    qqShare = {
        tag: {},
        init: function () {
            //share_type  0: QQ好友；1：QQ空间；2：微信好友；3：微信朋友圈。默认为 0
            var channels = share.shareChannels;
            this.tag[channels.qq] = 0;
            this.tag[channels.qZone] = 1;
            this.tag[channels.wxAppMessage] = 2;
            this.tag[channels.wxTimeline] = 3;
            this.initRely(function () {
                qqShare.onShare();
                opts.initSuccess && opts.initSuccess();
            });
        },
        disable: function () {
            /* var url = location.href, disPara = '_wv=49976'; // 3
            if (url.indexOf(disPara) > 0) return;
            if (/_wv=\d+/.test(url)) {
                url = url.replace(/_wv=\d+/ig, disPara);
            } else {
                url += (location.search ? '&' : '?') + disPara;
            }
            location.replace(url);
            opts.disableSuccess && opts.disableSuccess(); // 应该是没有用的
            */
            this.initRely(function () {
                mqq.ui.setActionButton({
                    title: '',
                    hidden: true,
                    iconID: '4',
                    cornerID: '0'
                }, function () {
                    opts.disableSuccess && opts.disableSuccess();
                });
            });
        },
        initRely: function (callback) {
            var fn = callback;
            callback = function () {
                isInitRely = true;
                fn && fn();
            };
            if (isInitRely) {
                callback();
                return;
            }
            loader.loadJsByUrl(location.protocol + "//open.mobile.qq.com/sdk/qqapi.js?_bid=152", function (isOk, url) {
                if (isOk) callback && callback();
                else opts.initFailed && opts.initFailed("加载qq js sdk error");
            });
        },
        onShare: function () {
            mqq.ui.setOnShareHandler(function (type) {
                var channel;
                for (var i in qqShare.tag) {
                    if (qqShare.tag[i] == type) {
                        channel = i;
                        break;
                    }
                }
                if (channel) qqShare.toShare(channel);
                else opts.shareFailed && opts.shareFailed(null, "qqShare not support share_type: " + type);
            });
        },
        toShare: function (channel) {
            var data = opts.shareChannels[channel];
            if (data) {
                mqq.ui.shareMessage({
                    title: data.title,
                    desc: data.desc,
                    share_url: data.link,
                    image_url: data.imgUrl,
                    share_type: qqShare.tag[channel],
                    back: data._isBack == null ? true : data._isBack
                }, function (res) {
                    if (res.retCode == 0) { //分享成功回调
                        opts.shareSuccess && opts.shareSuccess(channel);
                    } else {
                        opts.shareFailed && opts.shareFailed(channel);
                    }
                });
            } else opts.shareFailed && opts.shareFailed(channel, "qqShare " + channel + " no share data or not support");
        }
    },
    appShare = {
        init: function () {
            var key = Object.keys(opts.shareChannels)[0],
                shareData = opts.shareChannels[key];
            $('<input type="hidden" name="tcshareurl" value="' + shareData.link + '" />').appendTo(document.body);
            $('<input type="hidden" name="tcshareimg" value="' + shareData.imgUrl + '" />').appendTo(document.body);
            $('<input type="hidden" name="tcsharetext" value="' + shareData.title + '" />').appendTo(document.body);
            $('<input type="hidden" name="tcDesc" value="' + shareData.desc + '" />').appendTo(document.body);
            if (null == opts.isToShare || opts.isToShare) {
                this.initRely(function () {
                    appShare.onShare();
                    opts.initSuccess && opts.initSuccess();
                });
            } opts.initSuccess && opts.initSuccess();
        },
        disable: function () {
            this.initRely(function () {
                window._tc_bridge_bar && _tc_bridge_bar.set_navbar({
                    "param": {
                        "right": []
                    },
                    callback: function (data) { }
                });
            });
        },
        initRely: function (callback) {
            var fn = callback;
            callback = function () {
                isInitRely = true;
                fn && fn();
            };
            if (isInitRely) {
                callback();
                return;
            }
            loader.loadJsByUrl(location.protocol + "//js.40017.cn/touch/hb/c/bridge.2.3.0.js?v=2016122701", function (isOk, url) {
                if (isOk) callback && callback();
                else opts.initFailed && opts.initFailed("加载app js sdk error");
            });
        },
        onShare: function () {
            var key = Object.keys(opts.shareChannels)[0],
                shareData = opts.shareChannels[key];
            function setVal(name, val) {
                document.getElementsByName(name)[0].value = val;
            }
            setVal("tcshareurl", shareData.link);
            setVal("tcshareimg", shareData.imgUrl);
            setVal("tcsharetext", shareData.title);
            setVal("tcDesc", shareData.desc);
        },
        toShare: function (channel) {
            var data = opts.shareChannels[channel];
            if (data) {
                var para = {
                    "tcsharetxt": data.title,
                    "tcsharedesc": data.desc,
                    "tcshareurl": data.link,
                    "tcshareimg": data.imgUrl,
                    "tcsharetype": channel.indexOf('wx') == 0 // "false"：调用分享面板；"true"：调用微信单独的分享功能
                };
                if (para.tcsharetype) {
                    var shareType;
                    if (channel == share.shareChannels.wxAppMessage) para.shareType = "haoyou";
                    else if (channel == share.shareChannels.wxTimeline) para.shareType = "pengyouquan";
                }
                _tc_bridge_bar.shareInfoFromH5({
                    param: para,
                    callback: function (data) { // 仅微信单独的分享才有回调信息。
                        // status: 0分享成功|1取消分享|2 操作被拒绝| 3 其他
                        if (data.status == "0") opts.shareSuccess && opts.shareSuccess(channel);
                        else opts.shareFailed && opts.shareFailed(channel, data.status == '1' ? null : data.desc);
                    }
                });
            } else opts.shareFailed && opts.shareFailed(channel, "appShare " + channel + " no share data or not support");
        }
    },
    yPiaoShare = {
        tag: {},
        init: function () {
            // "channel" //渠道号 1：微信, 2：微信朋友圈, 3：QQ, 4：QQ空间, 5：微博;
            var channels = share.shareChannels;
            this.tag[channels.wxAppMessage] = 1;
            this.tag[channels.wxTimeline] = 2;
            this.tag[channels.qq] = 3;
            this.tag[channels.qZone] = 4;
            this.tag[channels.weibo] = 5;
            var shareObj = window.UTicketApp || window.IosUTicketApp;
            if (shareObj && shareObj.toShare) opts.initSuccess && opts.initSuccess();
            else opts.initFailed && opts.initFailed("yPiao share object undefined");
        },
        disable: function () {
        },
        onShare: function () {
        },
        // 主动调用分享，支持多个渠道分享
        toShare: function (channel) {
            var arr = Array.isArray(channel) ? channel : [channel],
                shareObj = window.UTicketApp || window.IosUTicketApp,
                that = this, dataArr = [],
                fun = function (chan) {
                    var data = opts.shareChannels[chan];
                    if (data) dataArr.push({
                        "channel": that.tag[chan],
                        "islock": !!data._isLock,   //是否开启?(锁定)
                        "title": data.title,  //分享标题
                        "content": data.desc, //分享内容
                        "url": data.link,    //活动地址
                        "pic": data.imgUrl,  //图片地址
                        "success": function () {
                            opts.shareSuccess && opts.shareSuccess(chan);
                        },
                        "cancel": function () {
                            opts.shareFailed && opts.shareFailed(chan);
                        },
                        "failed": function (err) {
                            opts.shareFailed && opts.shareFailed(chan, err);
                        }
                    });
                    else opts.shareFailed && opts.shareFailed(chan, "yPiaoShare " + chan + " no share data or not support");
                };
            for (var i in arr) fun(arr[i]);
            dataArr.length == arr.length && shareObj.toShare(JSON.stringify(dataArr));
        }
    };

var share = {
    shareChannels: {
        wxTimeline: '', // 微信朋友圈
        wxAppMessage: '', // 微信消息
        qq: '', // qq消息
        qZone: '', // qq空间
        weibo: '' // 微博
    },

    /**
     * @description 初始化分享功能
     * @param {object} options 分享参数，详见文件头部
     */
    init: function (options) {
        opts = options;
        var keys = Object.keys(opts.shareChannels || {});
        if (keys.length == 0) return; // 没有分享数据，不需要分享
        if (envi.isInWeixin) wxShare.init();
        else if (envi.isInQQ) qqShare.init();
        else if (envi.isInApp) appShare.init();
        else if (envi.isInYpiao) yPiaoShare.init();
        else opts.initFailed && opts.initFailed("no share");
    },

    /**
     * @description 重新设置分享内容/数据，应确保在初始化成功（initSuccess）之后调用
     * @param {object} options 分享参数，详见文件头部
     * @return {object}
     */
    resetOpts: function (options) {
        opts = options;
        if (envi.isInWeixin) wxShare.onShare();
        else if (envi.isInQQ) qqShare.onShare();
        else if (envi.isInApp) appShare.onShare();
        else if (envi.isInYpiao) yPiaoShare.onShare();
        else console.error("no share");
    },

    /**
     * @description 禁用分享功能/按钮
     * @param {object?} options 分享参数，详见文件头部
     */
    disable: function (options) {
        opts = options || {}; // 为了兼容，避免出错
        if (envi.isInWeixin) wxShare.disable();
        else if (envi.isInQQ) qqShare.disable();
        else if (envi.isInApp) appShare.disable();
        else if (envi.isInYpiao) yPiaoShare.disable();
        else opts.initFailed && opts.initFailed("no share disable");
    },

    /**
     * @description 将分享参数/数据复制到所有渠道/平台，并返回
     * @param {object?} shareData 取值参考 opts.shareChannels.wxTimeline，详见文件头部
     * @return {object}
     */
    getShareChannelsData: function (shareData) {
        var channels = share.shareChannels, shareChannels = {};
        for (var i in channels) shareChannels[i] = $.extend({}, shareData);
        return shareChannels;
    },

    /**
     * @description 主动发起分享功能，目前仅支持 QQ、同程APP、有票儿APP 环境
     * @param {string?} channel 分享渠道名称 取值参考 share.shareChannels，详见文件头部
     */
    toShare: function (channel) {
        if (envi.isInWeixin) wxShare.toShare(channel);
        else if (envi.isInQQ) qqShare.toShare(channel);
        else if (envi.isInApp) appShare.toShare(channel);
        else if (envi.isInYpiao) yPiaoShare.toShare(channel);
        else console.error("no share");
    }
};

for (var i in share.shareChannels) share.shareChannels[i] = i;

export default share;
