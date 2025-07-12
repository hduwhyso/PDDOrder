let SingleRequire = require('./SingleRequire.js')(runtime, global);
let { debug, logs, error, info } = SingleRequire('LogInfo');
let { clickRandom, scrollUp } = SingleRequire("Automator");
let { sortBy,textExists,clickTextR  } = SingleRequire('Common');
var currentOrderCURD = SingleRequire('CURD');

let args = engines.myEngine().execArgv;
let infoFloaty =  args.infoFloaty;

let BasePayWay = require('./BasePayWay.js')
function QQPay() {
    BasePayWay.call(this)

    this.QQPayExec = function () {
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
            text('立即支付').findOne().click();
            sleep(500);
            if (textContains("密码支付").exists()) click("密码支付", 0);
            /**如果使用的不是QQ钱包默认支付卡，点击更换 */

            logs(`QQ渠道付款卡号：${this.filteredData[this.payIndex].cardNO}`);
            this.changeCardIfNeeded(this.filteredData, this.payIndex);

            let password = this.filteredData[this.payIndex]['password'];
            // log(password);
            desc("支付密码").findOne().setText(password);
        } catch (e) {
            error(e);
        }
    };

    this.afterPassword = function () {
        try {
            let remarkButton = textContains("支付成功").findOne(30000);
            if (textExists("验证码")) {
                remarkButton =textContains("支付成功").findOne();
            }
            /**支付成功 */
            if (remarkButton) {
              this.paymentSuccess();
              sleep(300);
              return;
              // 付款成功后()
            }
        //异常处理
        let ExceptionDescription=[
            {text:"额度不足",reason:'额度不足，换卡支付'},
            {text:"超出银行规定",reason:'您的交易已超出银行规定的累计支付金额,请使用其他卡尝试'},/**邮储银行*/
            {text:"找回密码",reason:'密码错误'},
            {text:"银行拒绝",reason:'银行拒绝'},
            {text:"交易异常",reason:'银行拒绝'},
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
            return
            /**
             * 邮储银行：您的交易已超出银行规定的累计支付金额,请使用其他卡尝试；银行拒绝该交易
             *
             */
            //
        }
    } catch (e) {
        error(e);
    }
    };

    this.changeCardIfNeeded = function () {
        if (this.filteredData[this.payIndex].cardNO) {
            let cardCodeButton = textStartsWith("(").findOne();
            let cardCode = cardCodeButton.text();
            if (cardCode.match(/\d{4}/g)[0] != this.filteredData[this.payIndex].cardNO) {
                while (textContains("支付密码").exists()) {
                    clickRandom(cardCodeButton);
                    sleep(200);
                }
                let cardButton = textContains(this.filteredData[this.payIndex].cardNO).findOne(2000);
                if (cardButton) {
                    logs("点击换卡")
                    cardButton.parent().click();
                } else {
                    this.stopScript("找不到" + this.filteredData[this.payIndex].cardNO + "卡片");
                }
                sleep(200);
            }else{
                logs("不用换卡")
            }
        }
    };
}
QQPay.prototype = Object.create(BasePayWay.prototype)
QQPay.prototype.constructor = QQPay

module.exports = new QQPay();