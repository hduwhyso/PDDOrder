/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-20 11:57:54
 * @LastEditTime: 2024-08-13 14:03:28
 * @Description:
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-13 12:51:09
 * @LastEditTime: 2024-06-16 14:45:48
 * @Description:
 */
let SingleRequire = require('./SingleRequire.js')(runtime, global);
let { debug, logs, error, info } = SingleRequire('LogInfo');
let { sortBy,textExists,clickTextR  } = SingleRequire('Common');

// 接收引擎参数：悬浮窗
let { infoFloaty, state, controlPanel } = engines.myEngine().execArgv;

let BasePayWay = require('./BasePayWay.js')
function UnionPay() {
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
            sleep(300)
            if(textExists("密码支付"))while(!click("密码支付"));
            sleep(500)
            this.changeCardIfNeeded();
            sleep(500)
            if(!textExists("请输入支付密码")){
                while(textExists("确认付款")){
                    clickTextR("密码支付")
                    sleep(1000)
                }
                // this.stopScript("支付异常，请查看原因")
            }
            for(let i=0;i < this.password.length;i++){
                text(this.password[i]).findOne(). click()
                sleep(random(30,50))
            }
            sleep(1000)
            this.afterPassword()
        } catch (e) {
            error(e);
        }
    };

    this.changeCardIfNeeded = function () {
        let cardNO=this.filteredData[this.payIndex].cardNO
        if (cardNO && !textExists(cardNO)) {
            for(let i=0;i<10;i++){
                if(textExists(cardNO) && textExists("订单信息")){
                    logs("换卡成功")
                    logs('换卡后付款方式为：'+this.filteredData[this.payIndex]['channel']+'-'+this.filteredData[this.payIndex]['bankName']+this.filteredData[this.payIndex]['cardType']+this.filteredData[this.payIndex]['cardNO'],true);
                    if(textExists("密码支付"))while(!click("密码支付"));
                    sleep(1000)
                    break;
                }
                if(textExists("订单信息")){
                    textContains("付款方式").findOne(500).parent().click()
                    sleep(1000)
                }
                if(textExists("选择付款方式")){
                    if(textContains(cardNO).exists()){
                        textContains(cardNO).findOne().parent().click()
                        sleep(1000)
                    }else{
                        while(scrollDown()){
                            if(textExists(cardNO)){
                                log("未找到卡片下滑");
                                textContains(cardNO).findOne().parent().click()
                                sleep(1000)
                                break;
                            }
                        }
                        if(!textExists(cardNO) && textExists("选择付款方式")){
                            logs("云闪付无"+cardNO+"银行卡");
                            this.filteredData[this.payIndex]['canPay'] = false;
                            back()
                            this.payIndex++
                            if(this.filteredData[this.payIndex]){
                                cardNO=this.filteredData[this.payIndex].cardNO
                                logs("接下来使用"+cardNO+"银行卡付款");
                            }else{
                                this.stopScript("无可用付款卡片")
                            }

                            sleep(1000)
                        }
                    }
                }
                if(i==5){clickTextR(cardNO);sleep(1000)}
                if(i==9)this.stopScript("换卡异常")
            }
        }else{
            logs("不用换卡")
        }
    };

    this.afterPassword = function () {
        try {
            while(text("完成").exists()){
                clickTextR("完成")
                sleep(1000)
            }
            // textContains("完成").findOne()
            this.paymentSuccess();
        } catch (e) {error(e);}
    };
}
UnionPay.prototype = Object.create(BasePayWay.prototype)
UnionPay.prototype.constructor = UnionPay

module.exports = new UnionPay();