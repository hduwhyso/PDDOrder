/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-08-13 12:32:55
 * @LastEditTime: 2024-10-02 13:20:04
 * @Description:
 */
let { sortBy, textExists, clickTextR } = SingleRequire("Common");
function BasePayWay() {
  this.password = "";
  this.filteredData = "";
  
  this.init=function(){
    this.password="";
    this.filteredData=""
    this.payIndex=""
     /**支付时间剩不足一分钟不支付 */
     if (this.isTimeInsufficient() && account !=='拼多多') {
        this.stopScript( "剩余交单时间不足一分钟");
    }

    if (currentOrder["isSuccessful"]) {
        this.stopScript("重复付款");
    }

    if (!enablePayList.length) {
        this.stopScript("未设置支付方式");
    }
    this.payWay();
    logs('付款方式为：'+searchDict(this.filteredData[this.payIndex]['channel'],'paymentPlatform')+this.filteredData[this.payIndex]['accountID']+'|'+searchDict(this.filteredData[this.payIndex]['bankName'],'bankName')+searchDict(this.filteredData[this.payIndex]['cardType'],'cardType')+this.filteredData[this.payIndex]['cardNO'],true);
    logs("交单剩余时间：" + Math.round((currentOrder["orderDeadlineTs"] - new Date().getTime()) / 1000 / 60) + "分钟", true);
}

  /**确定付款方式 */
  this.payWay = function () {
    //TODO:付款异常时 canpay改成false
    //判断支付工具是否双开 item["channel"].includes("双开") &&
    this.filteredData = enablePayList.filter(function (item) {
      return item["channel"]===currentPayWay;
    });

    if (!this.filteredData.length) this.stopScript(`未设置${currentPayWay}支付方式`);

    if (!this.filteredData.some(item => item.canPay === true)) {
      // 如果没有可以支付的方式，则抛出错误
      this.stopScript(`没有可用的支付方式`);
    }

    // 检查 filteredData 数组中是否有任何对象的 channel 属性包含 "双开"
    if (this.filteredData.some((item) => item["appInstance"]==="双开") && currentPlatform["entryNow"].includes("双开")) {
      // 过滤出所有 channel 属性包含 "双开" 的对象
      this.filteredData = this.filteredData.filter((item) => item["appInstance"]==="双开");
    } else {
      // 记录日志信息，提示用户未设置双开支付宝
      this.filteredData = this.filteredData.filter((item) => item["appInstance"]!=="双开");
      if (currentPlatform["entryNow"].includes("双开")) {
        logs(["当前充值平台APP为：{},但未设置双开{}", currentPlatform["entryNow"], currentPlatform["name"]]);
      }
    }

    if (loopPay) {
      /**循环支付 */
      this.filteredData.sort(sortBy("count"));
    }
    /**确定可以支付的“支付方式”的索引 */
    for (let i = 0; i < this.filteredData.length; i++) {
      if (this.filteredData[i].canPay) {
        this.payIndex = i;
        this.password = this.filteredData[i]["password"];
        break;
      }
    }
  };
  
  this.paymentSuccess = function () {
    this.filteredData[this.payIndex]['count']++;/**付款成功次数+1 */
    info(["{}支付成功{}次", this.filteredData[this.payIndex]['cardNO'], this.filteredData[this.payIndex]['count']]);
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
    currentOrder["isSuccessful"] = true;
    
    currentOrder["platform"] =  this.filteredData[this.payIndex]['channel'];
    currentOrder["accountID"] =  this.filteredData[this.payIndex]['accountID'];
    currentOrder["bankName"] =  this.filteredData[this.payIndex]['bankName'];
    currentOrder["bankCardLastFour"] =  this.filteredData[this.payIndex]['cardNO'];

    this.updateData(currentOrder,enablePayList)
};
  /**数据更新 */
  this.updateData = function (currentOrder, enablePayList) {
    config.overwrite("currentOrder", currentOrder);
    config.overwrite("enablePayList", enablePayList);
    threads.start(function () {
      currentOrderCURD.update(currentOrder);
    });
  };
  // 检查剩余时间是否不足1分钟
  this.isTimeInsufficient = function () {
    return Math.round((currentOrder["orderDeadlineTs"] - new Date().getTime()) / 1000 / 60) < 1;
  };
  // 停止脚本并显示警告信息
  this.stopScript = function (message) {
    infoFloaty.setWarnText(message);
    logs(message + " 停止脚本");
    exit();
  };
}
module.exports = BasePayWay