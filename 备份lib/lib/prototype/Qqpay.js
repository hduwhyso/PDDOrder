let singletonRequire = require('../SingletonRequirer.js')(runtime, global);
let { debug, logs, error, info } = singletonRequire('LogInfo');
let { clickRandom, scrollUp } = singletonRequire("Automator");

let args = engines.myEngine().execArgv;
let infoFloaty =  args.infoFloaty;

function QQPay() {
    this.QQPayExec = function (currentOrder, enablePayList, payIndex) {
        try {
            this.chooseQQPay();
            this.startPay(currentOrder, enablePayList, payIndex);
            this.afterPassword(currentOrder, enablePayList, payIndex);
        } catch (e) {
            error(e);
        }
        return { "currentOrder": currentOrder, "enablePayList": enablePayList };
    };

    this.chooseQQPay = function () {
        try {
            while (true) {
                if (this.clickButton("QQ钱包", 60000)) break;
                if (!this.clickButton("展开好友", 1000)) {
                    this.stopScript("未找到QQ支付,请用QQ登录京东");
                }
                sleep(500);
                if (this.clickButton("QQ钱包", 1000)) break;
                this.stopScript("未找到QQ支付,请用QQ登录京东");
            }
            console.log("已选中QQ钱包支付");
            this.confirmPayment();
            this.waitForTransition("订单确认", 60);
        } catch (e) {
            error(e);
        }
    };

    this.startPay = function (currentOrder, enablePayList, payIndex) {
        try {
            logs("交单剩余时间：" + Math.round((currentOrder["orderDeadlineTs"] - new Date().getTime()) / 1000 / 60) + "分钟", true);
            text('立即支付').findOne().click();
            sleep(500);
            if (textContains("密码支付").exists()) click("密码支付", 0);
            /**如果使用的不是QQ钱包默认支付卡，点击更换 */

            logs(`QQ渠道付款卡号：${enablePayList[payIndex].cardNO}`);
            this.changeCardIfNeeded(enablePayList, payIndex);

            /**支付时间剩不足一分钟不支付 */
            if (this.isTimeInsufficient(currentOrder)) {
                this.stopScript( "剩余交单时间不足一分钟");
            }
            if (currentOrder["isSuccessful"]) {
                this.stopScript("重复付款");
            }

            let password = enablePayList[payIndex]['password'];
            // log(password);
            desc("支付密码").findOne().setText(password);
            textContains('支付成功').findOne(10000);
        } catch (e) {
            error(e);
        }
    };

    this.afterPassword = function (currentOrder, enablePayList, payIndex) {
        try {
        /**支付成功 */
         if (textContains('支付成功').exists()) {
            info("付款成功");
            currentOrder["isSuccessful"] = true;
            currentOrder["payTs"] = new Date().getTime();
            currentOrder["paidCard"] = enablePayList[payIndex]['channel'] + enablePayList[payIndex]['bankName'] + enablePayList[payIndex]['cardNO'];
            enablePayList[payIndex]['count']++;/**付款成功次数+1 */
            return { "currentOrder": currentOrder, "enablePayList": enablePayList };
            // 付款成功后()
        }
        //异常处理
        //TODO 换卡支付没必要重启
        let Pay=require("../pay")
        Pay.call(this)

        if (textContains("额度不足").exists() || textContains("超出银行规定").exists()) {
            let errorMsg = textContains("额度不足").exists() ? "额度不足，换卡支付" : "超出银行规定次数，换卡支付";
            infoFloaty.setWarnText(errorMsg);
            enablePayList[payIndex]['canPay'] = false;
            this.exec();//重启做单流程
            /**
             * 邮储银行：您的交易已超出银行规定的累计支付金额,请使用其他卡尝试
             *
             */
            //
        }
        if(textContains('找回密码').exists()){
            this.stopScript("付款密码错误");
        } else {
            log("未知错误");
            this.stopScript("付款出现未知错误");
        }
    } catch (e) {
        error(e);
    }
    };

    this.clickButton = function (text, timeout) {
        let button = textContains(text).findOne(timeout);
        if (button) {
            clickRandom(button);
            return true;
        }
        return false;
    };

    this.confirmPayment = function () {
        while (textContains("京东收银台").exists()) {
            while (!click("确认付款"));
            sleep(1000);
        }
    };

    this.waitForTransition = function (text, limit) {
        while (limit-- > 0) {
            sleep(1000);
            if (textContains(text).exists()) {
                logs("跳转QQ支付成功");
                infoFloaty.setProcessText("QQ支付")
                break;
            }
            if (limit == 1) {
                infoFloaty.setWarnText("跳转QQ支付失败");                
                    //TODO 采取什么措施？重新启动付款脚本？
            }
        }
        textContains(text).findOne(10000);
    };

    this.changeCardIfNeeded = function (enablePayList, payIndex) {
        if (enablePayList[payIndex].cardNO) {
            let cardCodeButton = textStartsWith("(").findOne();
            let cardCode = cardCodeButton.text();
            if (cardCode.match(/\d{4}/g)[0] != enablePayList[payIndex].cardNO) {
                while (textContains("支付密码").exists()) {
                    clickRandom(cardCodeButton);
                    sleep(200);
                }
                let cardButton = textContains(enablePayList[payIndex].cardNO).findOne(2000);
                if (cardButton) {
                    logs("点击换卡")
                    cardButton.parent().click();
                } else {
                    this.stopScript("找不到" + enablePayList[payIndex].cardNO + "卡片");
                }
                sleep(200);
            }else{
                logs("不用换卡")
            }
        }
    };
    // 检查剩余时间是否不足1分钟
    this.isTimeInsufficient = function (currentOrder) {
        return Math.round((currentOrder["orderDeadlineTs"] - new Date().getTime()) / 1000 / 60) < 1;
    };
    // 停止脚本并显示警告信息
    this.stopScript = function (message) {
        infoFloaty.setWarnText(message);
        logs(message+" 停止脚本");
        exit();
    };
}

module.exports = new QQPay();