
import appletHelper from './lib/appletHelper';

function todo(isApplet) {
    appletHelper.setShareData({
        title: 'test2112',
        desc: 'desc',
        link: location.href
    });

    $("body").append(location.href);

}

appletHelper.isAppletEnvi(function (isApplet) {
    if (isApplet) {
        appletHelper.jumpToMyPage(function () {
            todo(isApplet);
        });
    } else {
        todo(isApplet);
    }
});

function isAppletEnvi(callback) {
    function ready() {
        // callback && callback(window.__wxjs_environment === 'miniprogram');
    }
    if (!window.WeixinJSBridge || !WeixinJSBridge.invoke) {
        document.addEventListener('WeixinJSBridgeReady', ready, false);
    } else {
        ready();
    }
}

window.onerror = function (msg, a, b) {
    alert(msg + " " + a + " " + b);
}

isAppletEnvi((isApplet) => {

    $("body").html("test " + location.href);

    if (location.search) {

        wx.miniProgram.postMessage({
            data: {
                action: 'share',
                shareData: {
                    title: 'h5Title',
                    url: "https://www.ly.com?id=12232"
                }
            }
        });   //通信(H5中的数据发送给小程序)
        return;
    }

    history.back();

    // wx.miniProgram.navigateTo({  // redirectTo
    wx.miniProgram.navigateTo({
        url: './index?url=' + encodeURIComponent(location.protocol + '//' + location.host + location.pathname + '?test=1') + '&hideShareMenu=1&title=test燛在'
    });

});


