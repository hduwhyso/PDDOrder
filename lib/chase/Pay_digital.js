let SingleRequire = require('./SingleRequire.js')(runtime, global);
let { debug, logs, error, info } = SingleRequire('LogInfo');
let { clickRandom, scrollUp } = SingleRequire("Automator");
let { sortBy,textExists,clickTextR  } = SingleRequire('Common');
var currentOrderCURD = SingleRequire('CURD');

let args = engines.myEngine().execArgv;
let infoFloaty =  args.infoFloaty;

let BasePayWay = require('./BasePayWay.js')
function DigitalPay() {
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
            text('确定').findOne().click();
            sleep(500);
            // if (textContains("密码支付").exists()) click("密码支付", 0);
            /**如果使用的不是QQ钱包默认支付卡，点击更换 */

            // logs(`QQ渠道付款卡号：${this.filteredData[this.payIndex].cardNO}`);
            // this.changeCardIfNeeded(this.filteredData, this.payIndex);

            let password = this.filteredData[this.payIndex]['password'];
            // log(password);
            this.JDPayNumberClicker(password);
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

    this.JDPayNumberClicker=function(password) {
        // 获取所有className为"android.view.View"的控件
        let views = className("android.view.View").find();
        // 创建一个数组来存储视图和它们的bounds
        let viewBounds = [];
        // 遍历所有的视图，获取它们的bounds
        views.forEach(function (view) {
          let bounds = view.bounds();
          viewBounds.push({
            view: view,
            bounds: bounds,
          });
        });
        // 按照top和left值对视图进行排序
        viewBounds.sort(function (a, b) {
          if (a.bounds.top != b.bounds.top) {
            return a.bounds.top - b.bounds.top;
          } else {
            return a.bounds.left - b.bounds.left;
          }
        });
        // 创建一个数组来存储每个视图对应的数字
        let numberViews = [];
        // 输出每个视图对应的数字，并存储在数组中
        viewBounds.forEach(function (item, index) {
          let number = (index + 1) % 10; // 计算数字，0在最后一个位置
          numberViews[number] = item.view;
          // console.log("View对应的数字是: " + number,item.bounds);
        });
        // 定义一个函数来点击指定的数字
        function clickNumbers(numbers) {
          for (let i = 0; i < numbers.length; i++) {
            let num = parseInt(numbers.charAt(i));
            if (numberViews[num]) {
              numberViews[num].click();
            } else {
              console.error("数字视图未找到: " + num);
            }
          }
        }
        // 调用点击函数，传入密码
        clickNumbers(password);
      }
}
DigitalPay.prototype = Object.create(BasePayWay.prototype)
DigitalPay.prototype.constructor = DigitalPay

module.exports = new DigitalPay();