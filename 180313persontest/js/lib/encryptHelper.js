
function enObjs() {
    var str = "parseInt|charCodeAt|String|fromCharCode", res = '';
    for (var i in str) {
        res += (str[i].charCodeAt() + 1).toString(0x23);
    }
    return res;
}

function enStr(str, key, num) {
    if (num > 900 || num < 1) throw "must 900 >= num >= 1";
    var step = 0x21 + num,
        hex = 0x23,
        arr = [],
        kIndex = 0;
    step >>= 0x1;
    for (var i in str) {
        var code = str[i].charCodeAt() + step;
        code += key[kIndex++].charCodeAt();
        if (kIndex == key.length) kIndex = 0;
        code = code.toString(hex);
        arr.push(code);
    }
    return arr.join('');
}
