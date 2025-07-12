/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-20 05:10:35
 * @LastEditTime: 2024-09-01 12:52:25
 * @Description: rechargeAmount
 */
let SingleRequire = require('../../lib/chase/SingleRequire.js')(runtime, global);
let { countTodayEntries,clickTextR,shellOrShizuku } = SingleRequire('Common');

function init(){
    this.phoneNumber = "";

    this.isDual=false;
    this.accountButton="";
    this.rechargeAmount="";//充值金额
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
}


module.exports = init;