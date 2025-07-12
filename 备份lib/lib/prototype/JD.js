/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2023-11-13 14:59:58
 * @LastEditTime: 2024-06-10 21:37:01
 * @Description:
 */

let singletonRequire = require('../SingletonRequirer')(runtime, this)
let { debug, logs, error, warn, info} = singletonRequire('LogInfo')
const ORDER_STATES = {
    FIRST_RECHARGE: "首次充值",
    PAYMENT_FAILED: "付款未成功",
    NEW_ORDER_RECHARGE: "新订单充值",
    REPEATED_RECHARGE: "重复充值"
};
function JD(){
    /**关闭QQ和JD */
    this.killJDQQ=function() {
        app.openAppSetting("com.jingdong.app.mall");
        textContains("结束运行").waitFor();
        sleep(100);
        click("结束运行");
        click("确定");
        sleep(200);
        back();
        sleep(200);
        app.openAppSetting("com.tencent.mobileqq");
        textContains("结束运行").waitFor();
        sleep(100);
        click("结束运行");
        click("确定");
        sleep(200);
        back();
    }
    /**打开_京东充值中心 */
    this.openRechargeCenter=function () {
        let params = { "category": "jump", "des": "m", "url": "https://txsm-m.jd.com/" };
        params = encodeURIComponent(JSON.stringify(params));
        const intent = {
            data: "openapp.jdmobile://virtual?params=" + params,
        };
        app.startActivity(intent);
    }
    /** 进入京东订单列表*/
    this.enterJDOrderlist=function(tryTime){
      tryTime=tryTime || 1;
        let params = {"category":"jump","des":"orderlist"};
        params=encodeURIComponent(JSON.stringify(params))
        const int={
            data:"openapp.jdmobile://virtual?params="+params,
            packageName: "com.jingdong.app.mall",
        }
        app.startActivity(int);
        let peddingPayButton=textContains('待付款').findOne(5000)
        if(peddingPayButton){logs("进入订单列表成功");return true;}
        if (tryTime >= 5) {
          warn('检测到未能进入京东订单页，已尝试多次，放弃重试')
          logs("停止脚本")
          return false
          exit()
          // return false
        }
        warn(`检测到未能进入京东订单页，第${tryTime}次重新进入`)
        return this.enterJDOrderlist(++tryTime)
    }
    /**匹配手机号码 */
    this.getPhoneNumber = function() {
      var phoneNumberReg = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
      let phoneNumber = textMatches(phoneNumberReg).findOne(1000);
      let result = phoneNumber ? phoneNumber.text() : null;
      logs(phoneNumber ? `匹配到号码：${result}` : `未匹配到号码`);
      return result;
    }
    /**匹配12位数字（订单号） */
    this.getOrderNumber=function() {
      var orderNumberReg = /\d{12}$/;    /**正则匹配12位订单编号 */
      let orderNumber=textMatches(orderNumberReg).findOne(1000);
      let result = orderNumber ? orderNumber.text() : null;
      logs(orderNumber ? `匹配到订单号：${result}` : `未匹配到订单号：`);
      return result;
    }
    /**检查订单情况 */
    _this=this
    this.GetAndCheckOrderNumber=function (orderedPhoneNumber,currentOrder,infoFloaty){
            let scriptPhoneNumber=currentOrder["phoneNumber"]
            let orderTs=new Date(textContains(new Date().getFullYear()).findOne().text().replace(/-/g,"/")).getTime();
            /**本次充值号码检测 */
            textContains('订单').findOne()
            /**订单号*/
            let JDOrderNumber=_this.getOrderNumber()
            /**已下单手机号*/
            orderedPhoneNumber=_this.getPhoneNumber()
            /**isSuccessful */
            let isSuccessful=currentOrder["isSuccessful"]
            let isSameOrderNumber=currentOrder["JDOrderNumber"] ==JDOrderNumber
            let isSamePhoneNumber=scriptPhoneNumber==orderedPhoneNumber
            const getOrderState=function(){
                if(currentOrder["JDOrderNumber"]==""&& isSamePhoneNumber) return ORDER_STATES.FIRST_RECHARGE;/**首次充值 */
                if (JDOrderNumber && isSamePhoneNumber) {
                    if (isSameOrderNumber) {
                        return isSuccessful ? ORDER_STATES.REPEATED_RECHARGE : ORDER_STATES.PAYMENT_FAILED;/**重复充值   付款未成功 */
                    } else {
                        return isSuccessful ? ORDER_STATES.REPEATED_RECHARGE : ORDER_STATES.NEW_ORDER_RECHARGE;/**重复充值 新订单充值 */
                    }
                }
                debug(`getordernumber中的getStage未匹配到任何匹配项,{JDOrderNumber:${JDOrderNumber},isSameOrderNumber:${isSameOrderNumber},isSamePhoneNumber:${isSamePhoneNumber},isSuccessful:${isSuccessful},}`)
                return null;
            }
            let state=getOrderState();
            logs(state+" 待充号码："+orderedPhoneNumber)
            switch(state){
                case ORDER_STATES.FIRST_RECHARGE:
                    logs("待付款号码===手输号码",true);
                    logs('订单编号：'+JDOrderNumber+' 首次支付\n充值号码：'+orderedPhoneNumber);
                    currentOrder["JDOrderNumber"]=JDOrderNumber;
                    currentOrder["JDOrderTs"]=orderTs;
                break;
                case ORDER_STATES.PAYMENT_FAILED:
                    logs('订单编号：'+JDOrderNumber+' 上次未支付成功，这次重新支付',true);
                break;
                case ORDER_STATES.NEW_ORDER_RECHARGE:
                    currentOrder["JDOrderNumber"]=JDOrderNumber;
                    currentOrder["JDOrderTs"]=orderTs;
                    logs('新订单编号：'+JDOrderNumber+' 换号充值，或者重复下多笔订单充值',true);
                break;
                case ORDER_STATES.REPEATED_RECHARGE:
                    infoFloaty.setWarnText("脚本异常 重复付款 请查询原因");
                    logs('warning！！！订单编号：'+JDOrderNumber+' 已重复充值',true);
                    sleep(2000);
                    // alert("脚本异常，\n重复付款，\n停止运行，\n★★★请查询原因")
                    exit()
                break;
                default:
                    debug("getOrderNumber 未知情况",isSuccessful,isSameOrderNumber,isSamePhoneNumber);
            }
            return{'currentOrder':currentOrder,'orderedPhoneNumber':orderedPhoneNumber}
            // storage.put('currentOrder',currentOrder)
            // storage.put('orderedPhoneNumber',orderedPhoneNumber)
    }
    
    /**确定付款方式 */
    this.payWay=function(enablePayList,loopPay){
        let payIndex=null,password=null;
        // enablePayList=storage.get('enablePayList')
        //TODO:付款异常时 canpay改成false
        if(loopPay){
            /**循环支付 */
            enablePayList.sort(sortBy('count'));
        }
        /**确定可以支付的“支付方式”的索引 */
        for(let i=0;i<enablePayList.length;i++){
            if(enablePayList[i].canPay){
                payIndex=i;
                password=enablePayList[i]['password']
                break;
            }
        }
        return{"enablePayList":enablePayList,"payIndex":payIndex,"password":password}
      }}
function sortBy(para){
    return function(a,b){
        let val1 = a[para]
        let val2 = b[para]
        return  val1-val2
    }
}
module.exports = new JD()
