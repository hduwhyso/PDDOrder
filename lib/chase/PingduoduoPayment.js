/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-23 18:53:06
 * @LastEditTime: 2024-08-18 21:36:10
 * @Description:
 */
let SingleRequire = require('./SingleRequire.js')(runtime, global);
let { debug, logs, error, info } = SingleRequire('LogInfo');
let { clickRandom, scrollUp } = SingleRequire("Automator");
let { sortBy,textExists,clickTextR  } = SingleRequire('Common');

let args = engines.myEngine().execArgv;
let infoFloaty =  args.infoFloaty;

let BasePayWay = require('./BasePayWay.js')
function PingduoduoPayment() {
    BasePayWay.call(this)

    this.exec = function () {
        try {
            this.init();
            this.startPay();
            this.afterPassword();
        } catch (e) {
            error(e);
        }
    };
    this.startPay = function () {
        try {
            let password = this.filteredData[this.payIndex]['password'];
            let scaleX=device.width/1080;
            let scaleY=device.height/2460
            let passwordNumericKeyboard = {
                0:{'x':540,'y':2344},
                1:{'x':180,'y':1885},
                2:{'x':540,'y':1885},
                3:{'x':900,'y':1885},
                4:{'x':180,'y':2039},
                5:{'x':540,'y':2039},
                6:{'x':900,'y':2039},
                7:{'x':180,'y':2190},
                8:{'x':540,'y':2190},
                9:{'x':900,'y':2190},
            };
            logs("交单剩余时间：" + Math.round((currentOrder["orderDeadlineTs"] - new Date().getTime()) / 1000 / 60) + "分钟", true);
            textContains('请输入多多钱包密码').findOne()
            this.changeCardIfNeeded(this.filteredData, this.payIndex);

            for(let i=0;i < password.length;i++){
                press(passwordNumericKeyboard[password[i]]['x']*scaleX,passwordNumericKeyboard[password[i]]['y']*scaleY,random(30,50))
            }

            textContains("拼单成功").findOne(30000)
        } catch (e) {
            error(e);
        }
    };

    this.afterPassword = function () {
        try {
        /**支付成功 */
         if (textExists("拼单成功")) {
            this.paymentSuccess();
            sleep(300)
            return
            // 付款成功后()
        }
        //异常处理
        //TODO 换卡支付没必要重启
        let ExceptionDescription=[
            {text:"密码不正确",reason:'密码不正确'},
            {text:"密码验证不成功",reason:'密码不正确'},
        ];

        let statusBoolean=ExceptionDescription.some(function(currentValue){
            if(textExists(currentValue['text'])){
                logs(this.filteredData[this.payIndex]['bankName']+this.filteredData[this.payIndex]['cardNO']+"："+currentValue['reason']);
            }
            return textExists(currentValue['text']);
        })
        if (statusBoolean) {
            // infoFloaty.setWarnText(errorMsg);
            this.filteredData[this.payIndex]['canPay'] = false;
            // 现在同步修改 enablePayList 中对应项的 count 值
            this.filteredData.forEach(function(filteredItem) {
                enablePayList.forEach(function(item) {
                    // 检查 channel 和 cardNO 是否匹配
                    if (item.channel === filteredItem.channel && item.cardNO === filteredItem.cardNO) {
                        // 同步 count 值
                        item.count = filteredItem.count;
                        item.canPay = filteredItem.canPay
                    }
                });
            }, this); // 注意这里的 this 绑定
            storage.put("enablePayList",  enablePayList);
            return
            /**
             *
             * 支付密码错误，请重试
             *
             */
            //
        }


        this.stopScript("付款出现未知错误");
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



    this.changeCardIfNeeded = function () {
        if (this.filteredData[this.payIndex].cardNO) {
            let cardCodeButton = textContains("(").findOne();
            let cardCode = cardCodeButton.text();
            if (!cardCode.includes(this.filteredData[this.payIndex].cardNO) ) {
                while(!click(cardCode));
                sleep(1000);
                let cardButton = textContains(this.filteredData[this.payIndex].cardNO).findOne(2000);
                if (cardButton) {
                    logs("点击换卡")
                    clickTextR(this.filteredData[this.payIndex].cardNO)
                    sleep(1000);
                } else {
                    this.stopScript("找不到" + this.filteredData[this.payIndex].cardNO + "卡片");
                }
                sleep(200);
            }else{
                logs("不用换卡",true)
            }
        };
    }
}

PingduoduoPayment.prototype = Object.create(BasePayWay.prototype)
PingduoduoPayment.prototype.constructor = PingduoduoPayment


module.exports = new PingduoduoPayment();