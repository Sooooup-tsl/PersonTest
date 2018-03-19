
var myPagePath = "/page/train/activity/common/index/index",

    myPageFlag = 'fromMyPage=1',

    appletHelper = {

        /**
         * @description 判断是否是小程序环境
         * @param {function} callback 回调方法 (isApplet) => {}
         */
        isAppletEnvi: function (callback) {
            function ready() {
                callback && callback(window.__wxjs_environment === 'miniprogram');
            }

            var av = navigator.appVersion || navigator.userAgent;

            if (!/MicroMessenger/.test(av) || av.length < 20) { // 区别PC端模拟
                ready();
                return;
            }

            if (!window.WeixinJSBridge || !WeixinJSBridge.invoke) {
                document.addEventListener('WeixinJSBridgeReady', ready, false);
            } else {
                ready();
            }
        },

        /**
         * @description 跳转当前URL到我们运营活动小程序页面
         * @param {function} callback 回调方法
         * @param {boolean} hideShareMenu 是否隐藏分享按钮  
         */
        jumpToMyPage: function (callback, hideShareMenu) {
            var pagePath = myPagePath,
                search = location.search,
                appletArgs = '',
                sessionKey = "activity_common_myPage";

            if (search.indexOf(myPageFlag) > -1 || sessionStorage.getItem(sessionKey)) {
                sessionStorage.setItem(sessionKey, "1");
                callback && callback();
            } else {
                search += (search ? '&' : '?') + myPageFlag;

                if (hideShareMenu) appletArgs += '&hideShareMenu=1';

                var pageUrl = pagePath + '?url=' + encodeURIComponent(location.protocol + '//' + location.host + location.pathname + search) + appletArgs;

                if (document.referrer) { // 网页进入
                    setTimeout(() => {
                        history.back();
                    }, 50);

                    wx.miniProgram.navigateTo({
                        url: pageUrl
                    });
                } else { // 小程序进入
                    wx.miniProgram.redirectTo({
                        url: pageUrl
                    });
                }
            }
        },

        /**
         * @description 跳转指定的URL到我们运营活动小程序页面
         */
        jumpUrlToMyPage: function (url, opts) {

        },

        /**
         * @description 设置分享数据
         */
        setShareData: function (opts) {
            var url = opts.link;
            if (url.indexOf(myPageFlag) == -1) {
                url += (url.indexOf('?') > -1 ? '&' : '?') + myPageFlag;
            }
            wx.miniProgram.postMessage({
                data: {
                    action: 'share',
                    shareData: {
                        title: opts.title,
                        link: myPagePath + "?url=" + encodeURIComponent(url),
                        desc: opts.desc,
                        imgUrl: opts.imgUrl,
                        success: opts.success,
                        error: opts.error
                    }
                }
            });
        },

        /**
         * 跳转到小程序首页
         */
        jumpToHomePage: function (refid, tab) {
            var args = '';
            if (refid) args += '&wxrefid=' + refid;
            wx.miniProgram.switchTab({
                url: '/page/home/index/index?tab=' + (tab || 0) + args
            });
        },

        jumpToUrl
    };

module.exports = appletHelper;


//=======================代码使用事例========================= 

// 页面引入js <script type="text/javascript" src="//res.wx.qq.com/open/js/jweixin-1.3.2.js"></script>

// /**
//  * 业务逻辑代码
//  * @param {boolean} isApplet 是否是小程序环境
//  */
// function todo(isApplet) {

// }

// appletHelper.isAppletEnvi(function (isApplet) {
//     if (isApplet) {
//         appletHelper.jumpToMyPage(function () {
//             todo(isApplet);
//         });
//     } else {
//         todo(isApplet);
//     }
// });
