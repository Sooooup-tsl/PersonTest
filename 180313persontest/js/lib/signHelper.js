import md5 from "md5";

function deObjs(str) {
    var res = '',
        SS = String,
        PS = parseInt,
        hex20 = 0x10,
        len = str.length,
        fcc = SS.fromCharCode;
    for (var i = 0; i < len; i++) {
        var ch = str[i] + str[++i],
            num = PS(ch, 0x23) << 16;
        num >>= hex20;
        res += fcc(--num);
    }
    var splitChar = PS("7e", 0x13).toString();
    return res.split(fcc(PS(splitChar, 9)));
}

function deStr(str, key, num) {
    var step = 0x21 + num,
        hex = 0x23,
        arr = [],
        len = str.length,
        kIndex = 0,
        win = window,
        objs = deObjs('382s3a3b2w24363c3k2u302s3a1x372v2w1v3c3k2e3c3a31362y3k2x3a37351x302s3a1x372v2w'),
        pi = objs[0], cc = objs[1], st = objs[2], fcc = objs[3];
    step >>= 0x1;

    for (var i = 0; i < len; i++) {
        var code = win[pi](str[i++] + str[i], hex);
        var kChar = key[kIndex++];
        code -= kChar[cc]() + step;
        if (kIndex == key.length) kIndex = 0;
        arr.push(win[st][fcc](code));
    }
    return arr.join('');
}

/**
 * @description 获取执行签名的方法
 * @param {int} num 0x193
 * @return {function} 
 */
function getSignFn(num) {
    var key = "1a4b3c4d6";
    return function (data) {
        var param = '',
            arr = [],
            signKey = "aebs8sa48rag95ajavahc1akc48va5aea5ag8p";

        for (var i in data) arr.push({
            key: i,
            val: data[i]
        });

        arr.sort(function (a, b) {
            var x = a.key, y = b.key;
            return x < y ? -1 : (x > y ? 1 : 0);
        });

        arr.forEach(function (item) {
            var v = item.val;
            param += item.key + (typeof v === "object" ? JSON.stringify(v) : v);
        });

        param += deStr(signKey, key, num);

        return md5(param);
    }
}

export default getSignFn;
