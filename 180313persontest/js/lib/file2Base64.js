export default function (accept) {

    var parseEle = function (eleStr) {
        var div = document.createElement("div");
        div.innerHTML = eleStr;
        return div.firstChild;
    };

    this.getBase64 = function (callback) {
        this.getFile(function (file) {
            //console.log(file);
            var reader = new FileReader();
            reader.readAsDataURL(file); // 读出 base64
            reader.onload = function (ev) {
                var dataURL = ev.target.result, // reader.result,
                    fn = file.name;
                callback && callback({
                    data: dataURL,
                    fileName: fn,
                    extName: fn.substring(fn.lastIndexOf('.')).toLowerCase(),
                    getWithoutPrefixData: function () {
                        var flag = "base64,";
                        return this.data.substring(this.data.indexOf(flag) + flag.length);
                    }
                });
            };
        });
    };

    this.getBinaryStr = function (callback) {
        this.getFile(function (file) {
            //console.log(file);
            var reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = function (ev) {
                var res = ev.target.result,
                    fn = file.name;
                callback && callback({
                    data: res,
                    fileName: fn,
                    extName: fn.substring(fn.lastIndexOf('.')).toLowerCase()
                });
            };
        });
    };

    this.getFile = function (callback) {
        this.openLocalFile(function (file) {
            var val;
            if (navigator.userAgent.indexOf("MSIE") >= 1) { // IE 
                val = file.value;
            } else { // Chrome other
                val = file.files.item(0);  // window.URL.createObjectURL(
            }
            callback && callback(val);
        });
    };

    this.openLocalFile = function (callback) {
        var file = parseEle("<input type='file' accept='" + accept + "' style='width:0;'/>");
        file.onchange = (function () {
            callback && callback(file);
            document.body.removeChild(file);
        });
        document.body.appendChild(file);
        file.click();
    };
}
