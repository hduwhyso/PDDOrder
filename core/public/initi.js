/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-20 05:10:35
 * @LastEditTime: 2025-07-13 12:53:03
 * @Description: rechargeAmount
 */
let SingleRequire = require('../../lib/chase/SingleRequire.js')(runtime, global);
let { countTodayEntries,clickTextR,shellOrShizuku } = SingleRequire('Common');

function init(){
    this.phoneNumber = "";

    this.isDual=false;
    this.accountButton="";
    this.rechargeAmount="";//充值金额

    /**
     * 根据订单号查询订单是否存在
     * @param {string} orderNumber - 订单号，默认为 currentOrder["MFOrderNumber"]
     * @returns {Object} - 返回查询结果，包含 code 和 data
     */
    this.queryOrderExists = function(orderNumber) {
        orderNumber = orderNumber || currentOrder["MFOrderNumber"];
        if (!orderNumber) {
            logs("订单号为空，无法查询");
            return null;
        }

        let limit = 5;
        while (limit-- > 0) {
            debug('查询订单号: ' + orderNumber);
            let res = orderIDQueryOrder(orderNumber);

            if (res) {
                // code为0表示订单存在，为1表示订单不存在
                if (res["code"] == 0) {
                    logs("订单存在: " + orderNumber);
                    return res;
                } else if (res["code"] == 1) {
                    logs("订单不存在: " + orderNumber);
                    return res;
                } else {
                    logs("查询订单返回异常状态: " + res["code"]);
                }
            } else {
                logs("网络异常，重试查询订单");
            }
            sleep(1000);
        }

        logs("查询订单失败，网络异常");
        return null;
    };

    //运行前检查
    this.prepareForStart = function () {
        this.phoneNumber = currentOrder["phoneNumber"];
        this.rechargeAmount=currentOrder["detail"].match(/\d+/)[0]
        let errorMsg =
            !this.isValidPhoneNumber ? "号码格式不对" :
            !currentOrder ? "脚本未曾下单" :
            currentOrder["isSuccessful"] ? "该笔订单付款已成功" :
            this.isTimeInsufficient() ? "剩余时间不足1分钟，停止付款" :
            null;
        if (errorMsg) {
            this.stopScript(errorMsg);
        }
        this.isDual=false;
        this.accountButton="";
        controlPanel.hideExceptStop();
    };
    /**
     * 验证电话号码格式
     * @param {string} phoneNumber - 要验证的电话号码
     * @returns {boolean} - 是否为有效的电话号码
     */
    this.isValidPhoneNumber = function (phoneNumber) {
        let phoneNumberReg = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
        return phoneNumberReg.test(phoneNumber);
    };
    // 检查剩余时间是否不足1分钟
    this.isTimeInsufficient = function () {
        return (currentOrder["orderDeadlineTs"] - new Date().getTime()) / 1000 / 60 < 1 && account !=='拼多多';
    };
    // 停止脚本并显示警告信息
    this.stopScript = function (message) {
        infoFloaty.setWarnText(message);
        logs("停止脚本");
        exit();
    };
    // 判断单双开
    this.isDualOpen = function() {
        if(!isDualOpen)return
        let limit=5
        while(limit-->0){
            sleep(100)
            if (desc(account).find().length && desc('双开'+account).find().length) {
                this.isDual = true;
                logs('双开'+account);
                this.confirmAccount();
                break;
            } else {
                if(limit==1)logs("单开" + account);
            }
        }
    }

    // 确认账号
    this.confirmAccount = function() {
        if(currentPlatform["entryNow"] !="循环")this.clickAccount();
        // currentPlatform["entryNow"] = currentPlatform["dualLaunchEntry"] == "second" ? '双开'+account : account;
    }

    // 点击账号
    this.clickAccount = function() {
        info("这次做单的账号是：" +  currentPlatform["entryNow"]);
        infoFloaty.setWarnText("做单账号：" +  currentPlatform["entryNow"]);
        this.accountButton = desc(currentPlatform["entryNow"]).findOne();
        // sleep(300);
        clickTextR(this.accountButton.desc());
    }
    //截屏
    this.screenshot = function(){
        logs("开始截屏")
        controlPanel.hideAll();
        infoFloaty.hide();
        sleep(300);
        /**截屏 */
        shellOrShizuku("screencap -p /sdcard/currentOrder.jpg")
        sleep(500);
        controlPanel.hideExceptStop();
        infoFloaty.restore();
    }

    // 进入已付款订单详情
    this.enterPaidOrderDetail = function(orderNumber, limit) {
        try {
            while (limit-- > 0) {
                debug(["MFOrderNumber:{}，orderNumber:{}", currentOrder["MFOrderNumber"], orderNumber]);
                openOrderDetail(orderNumber);
                sleep(300);
                if (this.isDual) {
                    if (desc(currentPlatform["entryNow"]).findOne(10000)) clickTextR(this.accountButton.desc());
                }
                let retryCount = 30;
                while (retryCount-- > 0) {
                    let status = currentStatus.some(function (currentValue) {
                        return textExists(currentValue);
                    });
                    if (status || textExists("精选")) {
                        if (textExists("查看更多")) {
                            let button = textContains("查看更多").findOne(1000);
                            if (button) button.click();
                        }
                        return;
                    }
                    sleep(1000);
                }
            }
            this.stopScript("进入订单详情失败");
        } catch (e) {
            error(e);
        }
    }
}


module.exports = init;