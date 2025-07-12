/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2023-11-13 14:59:58
 * @LastEditTime: 2024-09-01 12:40:07
 * @Description:
 */

let { countTodayEntries,clickTextR } = SingleRequire('Common');
const ORDER_STATES = {
    FIRST_RECHARGE: "首次充值",
    PAYMENT_FAILED: "付款未成功",
    NEW_ORDER_RECHARGE: "新订单充值",
    REPEATED_RECHARGE: "重复充值"
};
function JD(){
    this.isDual=false;
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
    }.bind(this);
    /**打开_话费充值列表 */
    this.enterRechargelist=function () {
        var params = {"category":"jump","des":"jdreactcommon","modulename": "JDReactVirtualRecharge","appname": "JDReactVirtualRecharge","ishidden": !0,
        "param": {
            "page": "orderList",
            "routeParams": {
                "type": 1,
                "source": "txsm"
            }
        },
        "h5params": {
            "toPage": "telChargeOrderList",
            "sid": 1
        }};
        params=encodeURIComponent(JSON.stringify(params))
        const int={
            data:"openapp.jdmobile://virtual?params="+params,
        }
        log(shellOrShizuku("am force-stop com.jingdong.app.mall"))
        sleep(1000)
        app.startActivity(int);
        this.isDualOpen()//判断单开还是双开
        let peddingPayButton=textContains('话费充值订单').findOne(5000)
        if(peddingPayButton){logs("进入话费充值订单成功");return true;}
        return false;
    }.bind(this);
    /**打开_京东充值中心 */
    this.openRechargeCenter=function () {
        let params = { "category": "jump", "des": "m", "url": "https://txsm-m.jd.com/" };
        params = encodeURIComponent(JSON.stringify(params));
        const intent = {
            data: "openapp.jdmobile://virtual?params=" + params,
        };
        app.startActivity(intent);
        this.isDualOpen()//判断单开还是双开
    }.bind(this);
    
    /** 进入京东订单列表*/
    this.enterJDOrderlist=function(){
        let params = {"category":"jump","des":"orderlist"};
        params=encodeURIComponent(JSON.stringify(params))
        const int={
            data:"openapp.jdmobile://virtual?params="+params,
            packageName: "com.jingdong.app.mall",
        }
        app.startActivity(int);
        this.isDualOpen()//判断单开还是双开
        let peddingPayButton=textContains('待付款').findOne(5000)
        if(peddingPayButton){logs("进入订单列表成功");return true;}
        return false;
    }.bind(this);
    /** 根据订单号打开订单详情*/
    this.openOrderDetail=function(orderNumber){
        let params = {"category":"jump",
        "des":"m",
        "url":"https://recharge.m.jd.com/orderDetail?orderId="+orderNumber};
        params=encodeURIComponent(JSON.stringify(params))
        const int={
            data:"openjd://virtual?params="+params,

        }
        app.startActivity(int);
        this.isDualOpen()//判断单开还是双开
        let peddingPayButton=textContains('归属地区').findOne(5000)
        if(peddingPayButton){logs("进入【订单详情】成功");return true;}
        return false;
    }.bind(this);
    // 判断单双开
    this.isDualOpen = function() {
        if(!isDualOpen)return
        let limit=5
        while(limit-->0){
            sleep(100)
            if (desc(account).find().length && desc('双开'+account).find().length) {
                this.isDual = true;
                logs('双开'+account);
                this.confirmAccount();
                break;
            } else {
                if(limit==1)logs("单开" + account);
            }
        }
    }.bind(this);

    // 确认账号
    this.confirmAccount = function() {
        if(currentPlatform["entryNow"] !="循环")this.clickAccount();
        // currentPlatform["entryNow"] = currentPlatform["dualLaunchEntry"] == "second" ? '双开'+account : account;
    }.bind(this);

    // 点击账号
    this.clickAccount = function() {
        info("这次做单的账号是：" +  currentPlatform["entryNow"]);
        infoFloaty.setWarnText("做单账号：" +  currentPlatform["entryNow"]);
        this.accountButton = desc(currentPlatform["entryNow"]).findOne();
        // sleep(300);
        clickTextR(this.accountButton.desc());
    }.bind(this);
    /**检查订单情况 */
    this.GetAndCheckOrderNumber=function (){
            let scriptPhoneNumber=currentOrder["phoneNumber"]
            let orderTs=new Date(textContains(new Date().getFullYear()).findOne().text().replace(/-/g,"/")).getTime();
            /**本次充值号码检测 */
            textContains('订单').findOne()
            /**订单号*/
            let orderNumber=this.getOrderNumber()
            /**已下单手机号*/
            orderedPhoneNumber=this.getPhoneNumber()
            /**isSuccessful */
            let isSuccessful=currentOrder["isSuccessful"]
            let isSameOrderNumber=currentOrder["orderNumber"] ==orderNumber
            let isSamePhoneNumber=scriptPhoneNumber==orderedPhoneNumber
            const getOrderState=function(){
                if(currentOrder["orderNumber"]==""&& isSamePhoneNumber) return ORDER_STATES.FIRST_RECHARGE;/**首次充值 */
                if (orderNumber && isSamePhoneNumber) {
                    if (isSameOrderNumber) {
                        return isSuccessful ? ORDER_STATES.REPEATED_RECHARGE : ORDER_STATES.PAYMENT_FAILED;/**重复充值   付款未成功 */
                    } else {
                        return isSuccessful ? ORDER_STATES.REPEATED_RECHARGE : ORDER_STATES.NEW_ORDER_RECHARGE;/**重复充值 新订单充值 */
                    }
                }
                debug(`getordernumber中的getStage未匹配到任何匹配项,{orderNumber:${orderNumber},isSameOrderNumber:${isSameOrderNumber},isSamePhoneNumber:${isSamePhoneNumber},isSuccessful:${isSuccessful},}`)
                return null;
            }
            let state=getOrderState();
            logs(state+" 待充号码："+orderedPhoneNumber)
            switch(state){
                case ORDER_STATES.FIRST_RECHARGE:
                    logs("待付款号码===手输号码",true);
                    logs('订单编号：'+orderNumber+' 首次支付\n充值号码：'+orderedPhoneNumber);
                    currentOrder["orderNumber"]=orderNumber;
                    currentOrder["orderTs"]=orderTs;
                break;
                case ORDER_STATES.PAYMENT_FAILED:
                    logs('订单编号：'+orderNumber+' 上次未支付成功，这次重新支付',true);
                break;
                case ORDER_STATES.NEW_ORDER_RECHARGE:
                    currentOrder["orderNumber"]=orderNumber;
                    currentOrder["orderTs"]=orderTs;
                    logs('新订单编号：'+orderNumber+' 换号充值，或者重复下多笔订单充值',true);
                break;
                case ORDER_STATES.REPEATED_RECHARGE:
                    infoFloaty.setWarnText("脚本异常 重复付款 请查询原因");
                    logs('warning！！！订单编号：'+orderNumber+' 已重复充值',true);
                    sleep(2000);
                    // alert("脚本异常，\n重复付款，\n停止运行，\n★★★请查询原因")
                    exit()
                break;
                default:
                    debug("getOrderNumber 未知情况",isSuccessful,isSameOrderNumber,isSamePhoneNumber);
            }
    }.bind(this);

    /**匹配手机号码 */
    this.getPhoneNumber = function() {
        var phoneNumberReg = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
        let phoneNumber = textMatches(phoneNumberReg).findOne(1000);
        let result = phoneNumber ? phoneNumber.text() : null;
        logs(phoneNumber ? `匹配到号码：${result}` : `未匹配到号码`);
        return result;
      }.bind(this);
      /**匹配12位数字（订单号） */
      this.getOrderNumber=function() {
        var orderNumberReg = /\d{12}$/;    /**正则匹配12位订单编号 */
        let orderNumber=textMatches(orderNumberReg).findOne(1000);
        let result = orderNumber ? orderNumber.text() : null;
        logs(orderNumber ? `匹配到订单号：${result}` : `未匹配到订单号：`);
        return result;
      }.bind(this);
}

module.exports = new JD()
