/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-09 06:57:05
 * @LastEditTime: 2024-09-01 12:31:42
 * @Description:
 */
// 接收引擎参数：悬浮窗
let { openRechargeCenter,killJDQQ } = SingleRequire('JD');

function OrderPlacer() {
    /**
     * 验证电话号码格式
     * @param {string} phoneNumber - 要验证的电话号码
     * @returns {boolean} - 是否为有效的电话号码
     */
    this.isValidPhoneNumber = function (phoneNumber) {
        let phoneNumberReg = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
        return phoneNumberReg.test(phoneNumber);
    };
    //初始化
    this.init=function(){
    }
   /**主程序 */
    this.exec = function() {
        this.init();//初始化
        if (!this.isValidPhoneNumber(currentOrder["phoneNumber"])) {
            this.stopScript(`号码错误：${currentOrder["phoneNumber"]}`);
        }
        console.time("下单耗时");
        logs("号码格式正确准备下单：" + currentOrder["phoneNumber"]);
        try {
            // if (this.shouldRestartJD()) {
            //     killJDQQ();
            //     sleep(500);
            // }
            openRechargeCenter()//打开充值中心
            // while (textContains("待上传凭证").exists()) {sleep(300);}
            if (!this.waitForRechargeCenter()) {
                this.stopScript("打开充值中心失败");
            }
            this.selectPhoneNumber();
            this.enterPhoneNumber();
            this.selectRechargeAmount();
            this.confirmRecharge();
            logs("下单完成");
            // events.broadcast.emit("SOP", "startPay");
            console.timeEnd("下单耗时");
        } catch (e) {
            error(e);
        }
    };


    // 停止脚本并显示警告信息
    this.stopScript = function (message) {
        infoFloaty.setWarnText(message);
        logs("停止脚本");
        exit();
    };

    this.shouldRestartJD = function() {
        return new Date().getMinutes() % 9 === 0;
    };
    this.waitForRechargeCenter = function() {
        for (let i = 0; i < 11; i++) {
            sleep(1000);
            if (textContains("我的号码").exists()) return true;
            if (i === 5)openRechargeCenter();
        }
        return false;
    };

    this.selectPhoneNumber = function() {
        textMatches(/\d+\s+\d+\s+\d+/).findOne().parent().click();
        sleep(1000);
    };

    this.enterPhoneNumber = function() {
        className("EditText").setText(currentOrder["phoneNumber"]);
        sleep(1000);
    };

    this.selectRechargeAmount = function() {
        text("100").findOne(5000)
        // text("100").find().forEach(item=>{
        //     clickTextR("100")
        //     sleep(500)
        // })
        while(!click("100"));
        sleep(200);
        if (textContains("立即充值").exists()) click("立即充值");
        sleep(500);
    };

    this.confirmRecharge = function() {
        while (true) {
            if (textContains("延迟到账").exists()) {
                this.stopScript("延迟到账,手动放弃订单");
            }
            if (textContains("继续支付").exists()) break;
            if (textContains("确定").exists()) {
                textContains("确定").findOne().click();
                if (textContains("销售火爆").findOne(1000)) {
                    warn("销售火爆，建议放弃订单");
                    this.stopScript("销售火爆，建议放弃订单");
                }
                break;
            }
            sleep(1000);
        }
    };
}
module.exports=new OrderPlacer()