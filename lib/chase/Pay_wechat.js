/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-23 18:53:06
 * @LastEditTime: 2024-08-24 11:14:21
 * @Description:
 */
let SingleRequire = require('./SingleRequire.js')(runtime, global);
let { debug, logs, error, info } = SingleRequire('LogInfo');
let { clickRandom, scrollUp } = SingleRequire("Automator");
let { sortBy,textExists,clickTextR  } = SingleRequire('Common');

let args = engines.myEngine().execArgv;
let infoFloaty =  args.infoFloaty;

let BasePayWay = require('./BasePayWay.js')
function Wechat() {
    BasePayWay.call(this)

    this.wechatExec = function () {
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
          let password = this.filteredData[this.payIndex]["password"];
          let scaleX = 1;
          let scaleY = 1;
          let equal=device.width / 3
          let WeChatNumericKeyboard = {};
          if (device.width == 900) {
            WeChatNumericKeyboard = {
              0: { x: equal + equal /2, y: 1893 },
              1: { x: equal /2, y: 1668 },
              2: { x: equal + equal /2, y: 1668 },
              3: { x: equal * 2 + equal /2, y: 1668 },
              4: { x: equal /2, y: 1743 },
              5: { x: equal + equal /2, y: 1743 },
              6: { x: equal * 2 + equal /2, y: 1743 },
              7: { x: equal /2, y: 1818 },
              8: { x: equal + equal /2, y: 1818 },
              9: { x: equal * 2 + equal /2, y: 1818 },
            };
          } else {
            scaleY = device.height / 2244;
            WeChatNumericKeyboard = {
              0: { x: equal + equal /2, y: 2162 },
              1: { x: equal /2, y: 1698 },
              2: { x: equal + equal /2, y: 1698 },
              3: { x: equal * 2 + equal /2, y: 1698 },
              4: { x: equal /2, y: 1853 },
              5: { x: equal + equal /2, y: 1853 },
              6: { x: equal * 2 + equal /2, y: 1853 },
              7: { x: equal /2, y: 2008 },
              8: { x: equal + equal /2, y: 2008 },
              9: { x: equal * 2 + equal /2, y: 2008 },
            };
          }
          if (!desc("立即支付").findOne().parent().click()) {
            if (textExists("确认支付")) clickTextR("确认支付");
            desc("立即支付").findOne().click();
            sleep(1000);
          } else {
            sleep(1000);
            while (!textExists("付款方式")) {
              if (textExists("确认支付")) clickTextR("确认支付");
              clickTextR("立即支付");
              sleep(500);
            }
            sleep(1000);
            if (textExists("使用密码")) clickTextR("使用密码");
            /**如果使用的不是微信默认支付卡，点击更换 */

            if (textExists("选择付款")) back();
            logs(
              `微信渠道付款卡号：${this.filteredData[this.payIndex].cardNO}`
            );
          }
          if(textExists('付款方式'))this.changeCardIfNeeded(this.filteredData, this.payIndex);
          for (let i = 0; i < password.length; i++) {
            sleep(50)
            press(
              WeChatNumericKeyboard[password[i]]["x"] * scaleX,
              WeChatNumericKeyboard[password[i]]["y"] * scaleY,
              random(50, 60)
            );
          }
        } catch (e) {
          error(e);
        }
    };

    this.afterPassword = function () {
      try {
        let remarkButton = desc("返回商家").findOne(30000);
        /**支付成功 */
        if (remarkButton) {
          this.paymentSuccess();
          sleep(300);
          return;
          // 付款成功后()
        }
        //异常处理
        //TODO 换卡支付没必要重启

        if (textContains("额度不足").exists() || textContains("超出银行规定").exists() || textExists("支付密码错误")) {
          let errorMsg = textContains("额度不足").exists() ? "额度不足，换卡支付" : "超出银行规定次数，换卡支付";
          log(errorMsg);
          // infoFloaty.setWarnText(errorMsg);
          this.filteredData[this.payIndex]["canPay"] = false;
          // 现在同步修改 enablePayList 中对应项的 count 值
          this.filteredData.forEach(function (filteredItem) {
            enablePayList.forEach(function (item) {
              // 检查 channel 和 cardNO 是否匹配
              if (item.channel === filteredItem.channel && item.cardNO === filteredItem.cardNO) {
                // 同步 count 值
                item.count = filteredItem.count;
                item.canPay = filteredItem.canPay;
              }
            });
          }, this); // 注意这里的 this 绑定
          this.updateData(currentOrder,enablePayList)
          return;
          /**
           *
           * 支付密码错误，请重试
           *
           */
          //
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



    this.changeCardIfNeeded = function () {
      if (this.filteredData[this.payIndex].cardNO=='零钱通' && textExists("零钱通")){
        return
      }else if(this.filteredData[this.payIndex].cardNO=='零钱' && textExists("零钱")){
        return
      }
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

Wechat.prototype = Object.create(BasePayWay.prototype)
Wechat.prototype.constructor = Wechat
module.exports = new Wechat();