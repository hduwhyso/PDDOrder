/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-13 12:51:09
 * @LastEditTime: 2024-08-23 08:45:53
 * @Description:
 */
let SingleRequire = require('./SingleRequire.js')(runtime, global);
let { debug, logs, error, info } = SingleRequire('LogInfo');
let { clickRandom, scrollUp } = SingleRequire("Automator");
let { sortBy,textExists,clickTextR } = SingleRequire('Common');
var currentOrderCURD = SingleRequire('CURD');
let BasePayWay = require('./BasePayWay.js')

// 接收引擎参数：悬浮窗
let { infoFloaty, state, controlPanel } = engines.myEngine().execArgv;

function Alipay() {
    BasePayWay.call(this)

    this.exec = function () {
        try {
            this.init();
            this.startPay();
            sleep(1000)
        } catch (e) {
            error(e);
        }
    };
    this.startPay = function () {
        try {
            if (textContains("使用密码").exists()) while (!click("使用密码"));
            // if (useBenefitsFirst){ 
            //     this.useBenefitsFirst();
            // }else{
            //     sleep(1000)
            // }
            sleep(1000)
            if(!this.changeCardIfNeeded())return;
            sleep(1000);
            // if(!textExists("请输入支付密码"))this.stopScript("支付异常，请查看原因")
            for(let i=0;i < this.password.length;i++){
                text(this.password[i]).findOne(). click()
                sleep(random(30,50))
            }
            this.afterPassword()
        } catch (e) {
            error(e);
        }
    };

    this.useBenefitsFirst = function () {
        this.enterUseBenefits();
        if(this.findAndUseBenefitsFirst())return true
        else return false
    }
    this.enterUseBenefits = function () {
        desc("查看全部").findOne(10000)
        sleep(1000)
        desc("查看全部").findOne(10000).click()
        while(true){
            sleep(1000)
            if(textExists("使用密码")){while(!click("使用密码"));sleep(500)}
            if(!textExists("请输入支付密码")){
                sleep(1000)
                break;
            }
        }

    }
    this.findAndUseBenefitsFirst=function(){
        let activityText = textContains("立减").exists() ? "立减" : (textContains("福利金").exists() ? "福利金" : null);
        let cardButton=null;
        if (activityText) {
            let activityElement = textContains(activityText).findOne(5000);
            cardButton=activityElement.parent()
            logs("发现活动：" + activityElement.text());
            if(cardButton.text().includes("分期")){
            logs("活动为分期活动，不参与：" + activityElement.text());
                cardButton = textContains(this.filteredData[this.payIndex].cardNO).findOne(5000).parent()
            }
        } else {
            logs("未发现立减活动");
            cardButton = textContains(this.filteredData[this.payIndex].cardNO).findOne(5000).parent()
        }
        if (cardButton) {
            // let creditCardInstallmentsExists=cardButton.children.some(element => {
            //     debug(element.text())
            //     element.text().includes("分期")
            // })
            if(cardButton.desc().includes("分期")){
                logs("卡片未显示，重来:"+cardButton.desc());
                return false
            }
            log("点击换卡",cardButton.click())
        }else{
            logs("卡片未显示，重来");
            return false
        }
        sleep(500)
        if(textContains("使用密码").exists())while(!click("使用密码"));
        return true
    }


    this.changeCardIfNeeded = function () {
        let cardNO=this.filteredData[this.payIndex].cardNO
        if (cardNO) {
            let choosenButton=descContains("已选中").findOne(10000)
            if (choosenButton && !choosenButton.desc().includes(cardNO)) {
                desc("查看全部").findOne(5000).click()
                while(true){
                    sleep(1000)
                    if(textExists("使用密码")){while(!click("使用密码"));sleep(500)}
                    if(!textExists("请输入支付密码")){
                        sleep(1000)
                        break;
                    }
                }
                if(this.findAndUseBenefitsFirst())return true
                else return false
            }else{
                logs("不用换卡")
                if(textExists('确认付款')){clickTextR('确认付款')}
            }
            return true
        }
    };

    this.afterPassword = function () {
        try {
            while(!textContains("完成").exists()){
                click("关闭")//干扰
                clickTextR("放弃开通")//开通刷脸付
                sleep(500)
            }
            // textContains("完成").findOne()
            this.paymentSuccess();
        } catch (e) {error(e);}
    };
}
Alipay.prototype = Object.create(BasePayWay.prototype)
Alipay.prototype.constructor = Alipay

module.exports = new Alipay();