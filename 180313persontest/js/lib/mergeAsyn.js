export default function (maxCount, callback) {
    var _count = 0;

    this.push = function () {
        if (++_count > maxCount) console.error("mergeAsyn count 已超过 maxCount");
        else if (_count == maxCount) this.runCallback();
    }

    this.runCallback = function () {
        callback && callback();
    }

    // 尝试执行 callback，当不符合条件时 就不执行
    this.tryRunCallback = function () {
        this.canRunCallback && this.runCallback();
    }

    this.__defineGetter__("count", function () {
        return _count;
    });

    this.__defineGetter__("maxCount", function () {
        return maxCount;
    });

    this.__defineGetter__("canRunCallback", function () {
        return _count >= maxCount;
    });
}