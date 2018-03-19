import helper from "./lib/helper";
import envi from "./lib/envi";
import share from "./lib/share";
// mock
import mock from './mock.js';

// import getSignFn from "./lib/signHelper";
// options {signFn: getSignFn(0x193)}

(function () {

    // 判断APP渠道，做UI兼容
    if (helper.isReturnUrl()) return;

    var pageData,
        serialId = helper.getUrlArg("serialId") || "",
        channels = {
            wx: {
                isWX: 1,
                platId: helper.plat.wx.id,
                actCode: "a521fa3ef985644c1096fedae224c8ac",
                jumpUrl: "//wx.17u.cn/channel-web/wxModule/chuxingbao/open?ref_id=hcpqbp",
                robTicketUrl: "//wx.17u.cn/train/TrainGrabPage.html?privateEnter=1",
                refid: "399516790",
                // showShare: true,
                // shareTitle: '上微信钱包，买全国火车票',
                // shareSubTitle: '送你一份同程火车票代金券！',
                // sharePicture:'https://file.40017.cn/huochepiao/activity/180312firsttest/img/share.png',
                showPhone: false
            },
            qq: {
                isQQ: 1,
                platId: helper.plat.qq.id,
                actCode: "8c3b5181881d9a4cca2584c22a91f90d",
                jumpUrl: "http://m.17u.cn/client/pj/240976581?schemUrl=shouji.17u.cn%2Finternal%2Fh5%2Ffile%2F35%2Fcoupon%2Findex.html%3Ftcwvcwl",
                robTicketUrl: "//wx.17u.cn/uniontrain/webapp/train/robticketsfill.html",
                refid: "399516781",
                // showShare: true,
                // shareTitle: '上QQ钱包，买全国火车票',
                // shareSubTitle: '送你一份同程火车票代金券！',
                // sharePicture:'https://file.40017.cn/huochepiao/activity/180312firsttest/img/share.png',
                showPhone: true
            },
            app: {
                isAPP: 1,
                platId: helper.plat.app.id,
                actCode: "9c57de8eb35283897f229b131d5cbb63",
                jumpUrl: "http://shouji.17u.cn/internal/h5/file/35/coupon/index.html?tcwvclogin",
                robTicketUrl: "tctclient://train/GrabTicketOrderList",
                refid: "399516783",
                // showShare: true,
                // shareTitle: '上同程旅游钱包，买全国火车票',
                // shareSubTitle: '送你一份同程火车票红包！',
                // sharePicture:'https://file.40017.cn/huochepiao/activity/180312firsttest/img/share.png',
                showPhone: false
            }
        };

    if (envi.isInWeixin) pageData = channels.wx;
    else if (envi.isInQQ) pageData = channels.qq;
    else if (envi.isInApp) pageData = channels.app;
    else { // 其他渠道，默认走qq渠道逻辑
        //pageData = channels.wx;
        pageData = channels.qq;
    }

    // 渲染/呈现页面 及 其业务逻辑
    var render = function (userIden) {
        // mock
        pageData.ql = mock

        $('.content').html(helper.render('#tmplList', pageData));
        $('#tmplList').remove();

        // 提交姓名手机号
        $('.js-submit').on('click', function() {
            // 姓名
            var name = $('#ipt_name').val();
            // 手机号
            var phone = $('#ipt_phone').val();
            
            if (phone.length == 0) {
                helper.showToast("请输入手机号");
            } else if (!validatePhone()) {
            } else if(!name) {
                helper.showToast("请输入您的姓名");
            } else {
            // 开始答题
                $('.name_box').addClass('hide');
                $('.content').removeClass('hide');
            }
        });

        // 上一题
        $('.prev_btn').on('click', function() {
            var _this = $(this);
            _this.parents('.question').hide().addClass('unselected').prev().show();
            answerArr.pop(); 
        })


        // 选择答案 
        var tt;
        // 答案对象 D S I C
        var answerArr = [];
        $('.unselected:first-child').show();
        $('.js-list li').on('click', function() {
            window.clearTimeout(tt);
            var _this = $(this);

            _this.parents('.question').find('li').removeClass('cur');
            _this.addClass('cur');
            _this.parents('.question').removeClass('unselected');

            if (!answerArr[_this.parents('.question').index()]) {
                answerArr.push(_this.data('val'));
            }

            tt = setTimeout(function() {
                _this.parents('.question').hide();
                $('.unselected:first').show();
            }, 200);

            if ($('.unselected:first').length == 0) {
                submitAnswer(answerArr);
            }
        })

        function submitAnswer(answerArr) {
            // 统计DISC数量
            var D = 0;
            var I = 0;
            var S = 0;
            var C = 0;

            answerArr.forEach(item => {
                if (item == 'D') {
                    D++;
                } else if (item == 'I') {
                    I++;
                } else if (item == 'S') {
                    S++;
                } else if (item == 'C') {
                    C++;
                } 
            });
            
            setTimeout(function() {
                $('.res_D em').html(D + '题');
                $('.res_I em').html(I + '题');
                $('.res_S em').html(S + '题');
                $('.res_C em').html(C + '题');
                
                $('.res_box').removeClass('hide');
            }, 500)

            $.ajax({
                url: 'http://10.101.68.18:5000/api/addRecord',
                data: {
                    'name': $('#ipt_name').val(),
                    'jobno': $('#ipt_phone').val(),
                    'D': D,
                    'I': I,
                    'S': S,
                    'C': C,
                },
                type: 'POST',
                success: function(data) {
                    if (data.code == 0) {
                    }
                },
                error: function(e) {
                    helper.showToast("网络异常");
                }
            })
        }

        // 验证手机号的合法性
        function validatePhone() {
            var regPhone = /^1[3,4,5,6,7,8,9]\d{9}$/,
                phone = $("#ipt_phone").val().trim();
            if (phone.length == 0) {
                helper.showToast("请输入手机号码");
            } else if (!(regPhone.test(phone))) {
                helper.showToast("请输入正确的手机号码");
            } else return true;
            return false;
        }

        // 设置分享
        if (pageData.showShare) {
            var sharePara = {
                initSuccess: function () {
                    if (pageData.isWX) {
                        wx.hideAllNonBaseMenuItem();
                        wx.showMenuItems({
                            menuList: ["menuItem:share:appMessage", "menuItem:share:timeline"]
                        });
                    }
                }, // 初始化成功回调
                initFailed: function () { } //function(err) // 初始化失败回调
            };

            var shareUrl = helper.getShareUrl(pageData.platId);

            sharePara = $.extend(sharePara, {
                shareSuccess: function (channel) { // 分享成功后回调
                    helper.pushEvent(pageData.eventShareSuccess);
                },
                shareFailed: function (channel, err) { // 分享失败/取消后回调，取消回调 err = null            
                },
                shareChannels: share.getShareChannelsData({ // 分享到外部渠道，key 取值范围 share.shareChannels
                    title: pageData.shareTitle, // 分享标题
                    desc: pageData.shareSubTitle, // 分享描述
                    link: shareUrl, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                    imgUrl: pageData.sharePicture, // 分享图标
                    _isBack: true, // 是否返回，目前主要用于手Q
                    _isLock: false // 是否开启?(锁定)，目前主要用于有票儿app
                })
            });
            share.init(sharePara);
        } else {
            share.disable();
        }

        helper.initStat(pageData.refid);
    };

    helper.getUserIden(function (userIden) {
        // if (userIden) {
        //     render(userIden);
        // } else {
        //     var authUrl = helper.getLocalAuthUrl(pageData.platId, ["serialId", "refid"], true);
        //     location.replace(authUrl);
        // }
        render(userIden);
    });

})();


window.onpageshow = function (event) {
    if (event.persisted) {
        window.location.reload();
    }
}
