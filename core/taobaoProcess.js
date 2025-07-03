/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-23 18:09:26
 * @LastEditTime: 2024-07-23 22:13:48
 * @Description: 
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-22 10:49:52
 * @LastEditTime: 2024-06-23 17:43:28
 * @Description:
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-11 20:00:33
 * @LastEditTime: 2024-06-22 10:46:57
 * @Description:
 */
let SingleRequire = require('../lib/chase/SingleRequire.js')(runtime, global);
let {reportSuccess,reportRefund,reportInProgress} = require('./submit.js')
let { debug, logs, error, warn, info} = SingleRequire('LogInfo')
let { countTodayEntries,clickTextR,textExists } = SingleRequire('Common');
let alipay=SingleRequire("Alipay")

let {storage_name: storage_name } = require('../config')(runtime, this)
var storage = storages.create(storage_name);


// 接收引擎参数：悬浮窗
let { infoFloaty, state, controlPanel } = engines.myEngine().execArgv;

var init=require('./public/initi.js');

function taobaoProcess(){
    init.call(this)

    this.exec=function(){
        try {
            this.prepareForStart()
            this.procedure()
        } catch (e) {
            log(e)
        }
    }
    this.procedure=function(){
        this.openTaobaoCenter()
        this.order()//下单
        infoFloaty.setProcessText("开始支付宝付款");
        this.pay()//付款
        infoFloaty.setProcessText("支付宝等待结果");
        this.waitResult()
        this.confirmOrderStatus()
    }
    this.openTaobaoCenter= function(){
        const int={
            data:"taobao://m.duanqu.com?miniappSourceChannel=homepage&_ariver_appid=6483140&subSource=stcz_1&largescreenstyle=fullscreen&_ariver_ua=充值中心&x_object_type=miniapp&x_miniapp_id=6483140&sourceType=other",
        }
        app.startActivity(int);
        this.isDualOpen()
        for (let index = 0; index < 30; index++) {
            if(textExists("充值中心") && textExists("充话费")){
                logs("打开淘宝充值中心页面花费："+index+"秒")
                break
            }
            if(index== 9) app.startActivity(int);
            if(index == 29){
                this.stopScript("打开手机充值页面失败")
            }
            sleep(1000)
        }
    }
    //下单\
    this.order=function(){
        try {
            logs("充值号码："+this.phoneNumber)
            let editButton=className("EditText").findOne().bounds()
            click(editButton.centerX(),editButton.centerY())
            sleep(500)
            className("EditText").findOne().setText(this.phoneNumber)
            sleep(1000)
            textContains(this.rechargeAmount+" 元").findOne().click()
            // click("确定")
            sleep(2000)
            // if(!textExists(this.phoneNumber.slice(-4)))this.stopScript("待充值号码错误");
            // className("Button").textContains(this.rechargeAmount+"元").findOne().click()
            for(let i=0;i<10;i++){
                if(textExists("立即充值"))break;
                if(i==4 || i==7)clickTextR(this.rechargeAmount+"元") 
                if(i==9)this.stopScript("跳转小面额充值异常")
                sleep(1000)
            }
            textContains("立即充值").findOne().click()
            for(let i=0;i<30;i++){
                if(textExists("确认付款"))break;
                if(textExists("操作失败")){
                    this.stopScript("操作失败，请重试")
                }
                if(i==10 || i==20)textContains("立即充值").findOne().click()
                if(i==29)this.stopScript("跳转付款异常")
                sleep(300)
            }
            sleep(1000)
        } catch (e) {
            error(e)
        }
    }
    //付款
    this.pay=function(){
        textContains("确认付款").findOne()
        this.currentOrder=alipay.exec(this.currentOrder)
        // clickTextR("完成")
    }
    //
    this.waitResult=function(){
        try {
            this.openAlipaybill()
            sleep(500)
            this.findOrderDetail()
            click("更多")
            let orderNumber = this.findNextText("订单号")
            if(orderNumber)this.currentOrder["orderNumber"]=orderNumber
            let detail=this.findNextText("订单金额")
            if(detail) this.currentOrder['detail']=detail
            let orderStatus=depth(textContains("订单金额").findOne(5000).depth()).indexInParent(textContains("订单金额").findOne(5000).indexInParent()-1).findOne(5000)
            if(orderStatus)this.currentOrder['orderStatus']=orderStatus.text()
        } catch (e) {
            error(e)
        }
    }
    this.openAlipaybill= function(){
        const int={
            data:"alipays://platformapi/startapp?appId=20000003",
        }
        app.startActivity(int);
        this.isDualOpen()
        for (let index = 0; index < 30; index++) {
            if(textExists("收支分析") && textExists("手机充值")){
                logs("打开支付宝账单页面花费："+index+"秒")
                break
            }
            if(index== 9) app.startActivity(int);
            if(index == 29){
                this.stopScript("打开账单页面失败")
            }
            sleep(1000)
        }
    }
    //查找充值记录
    this.findOrderDetail = function(){
        try {
            // 查找可见且包含“充值成功”文本的按钮
            let buttons = className("Button").visibleToUser(true).textContains("手机充值").find();
            if (buttons.length) {
                buttons.forEach(button => {
                    // 检查屏幕上是否存在包含手机号码后四位的文本
                    if (!textContains(this.phoneNumber.slice(-4)).exists()) {
                        // 获取按钮的边界
                        let { left, top, right, bottom } = button.bounds();
                        // 计算按钮的中心坐标
                        let x = ((right - left) / 2) + left;
                        let y = ((bottom - top) / 2) + top;
                        log(x, y);
                        // 点击按钮
                        click(x, y);
                        sleep(1000);
                        // 检查是否存在“付款方式”文本且不包含手机号码后四位的文本
                        if (textContains("付款方式").exists() && !textContains(this.phoneNumber.slice(-4)).exists()) {
                            // 返回上一级
                            back();
                            sleep(1500);
                        }
                    }
                });
                textContains("付款方式").findOne(5000)
                sleep(500)
                if(textContains("付款方式").exists() && textContains(this.phoneNumber.slice(-4)).exists()){this.screenshot();}
                else{this.stopScript("未找到付款成功订单详情");}
            }
        } catch (e) {
            error(e)
        }
    }
    //查找下一个控件文本
    this.findNextText = function(text){
        let previousActivity=textContains(text).findOne()
        let activity=depth(previousActivity.depth()).indexInParent(previousActivity.indexInParent()+1).findOne(5000)
        if(activity){
            return activity.text()
        }else{return null}
    }
    //订单上报
    this.confirmOrderStatus = function(){
        let autoSubmit = storage.get('config') ? storage.get('config').autoSubmit : true;
        try {
            // log("开始上报state");
            infoFloaty.setProcessText("开始报单")
            if (this.currentOrder && autoSubmit) {
                if (textContains("交易成功").exists() && textContains("付款方式").exists()) {
                    logs("开始上报交易成功的订单")
                    reportSuccess(); // 上报充值成功的订单
                }
                //TODO 还不知道退款和等待到账的情况
                // else if (textContains("未发货，退款成功").exists() && textContains("联系商家").exists()) {
                //     logs("开始上报充值成功的订单")
                //     reportRefund(); // 上报退款中的订单
                // } else if (textContains("等待到账").exists() && textContains("联系商家").exists()) {
                //     logs("开始上报等待到账的订单")
                //     reportInProgress(); // 上报等待到账的订单
                // }
            }
            this.currentOrder=storage.get("currentOrder")
            info("此笔订单耗时："+ Math.round((this.currentOrder["submitTs"] - this.currentOrder["getOrderTs"]) / 1000) + "秒");
        } catch (e) {
            error(e);
        }
        sleep(1000)
    }
}

module.exports=new taobaoProcess()


