var o = {
    hasTouch: 'ontouchstart' in window,
    isAndroid: false,
    isIPhone: false,
    isIPad: false,
    isPC: false,
    isInWeixin: false,
    isInQQ: false,
    isInApp: false,
    isInYpiao: false,
    isInOther: false,
    // 设备类型，如 Android/iPhone/iPad/PC
    deviceType: null,
    // 设置型号
    deviceModel: null,
    // 系统版本
    osVersion: null,
    getNetType: function () {
        if (navigator.connection) return navigator.connection.type;
        return 0;
    },
    toString: function (joinStr) {
        var a = [navigator.appVersion || navigator.userAgent];
        for (var i in this) if (typeof this[i] != "function") a.push(i + ":" + this[i]);
        a.push("width:" + window.innerWidth);
        a.push("height:" + window.innerHeight);
        return a.join(joinStr || "\r\n");
    }
};

(function () {
    var av = navigator.appVersion || navigator.userAgent;

    if (/Android /.test(av)) o.isAndroid = true;
    else if (/iPhone;/.test(av)) o.isIPhone = true;
    else if (/iPad;/.test(av)) o.isIPad = true;
    else o.isPC = true;

    if (/MicroMessenger/.test(av)) o.isInWeixin = true;
    else if (/TcTravel/.test(av)) o.isInApp = true;
    else if (/(iPad|iPhone|iPod).*? (IPad)?QQ\/([\d\.]+)/.test(av) || /\bV1_AND_SQI?_([\d\.]+)(.*? QQ\/([\d\.]+))?/.test(av)) o.isInQQ = true;
    else if (window.IosUTicketApp || window.UTicketApp) o.isInYpiao = true;
    else o.isInOther = true;

    o.deviceType = o.isAndroid ? "Android" : (o.isIPhone ? "iPhone" : (o.isIPad ? "iPad" : "PC"));

    try {
        if (o.isAndroid) o.osVersion = /Android (\d+[^;]+)?;/.exec(av)[1], o.deviceModel = /; ([^;\)]+)\)/.exec(av)[1];
        else if (o.isIPhone || o.isIPad) o.osVersion = / OS (\d+[^ ]+)? /.exec(av)[1].replace(/_/g, '.');
    } catch (ex) { }
})();

export default o
