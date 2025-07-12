/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-11 20:00:33
 * @LastEditTime: 2024-08-09 06:39:49
 * @Description:
 */
let SingleRequire = require('../lib/chase/SingleRequire.js')(runtime, global);
let {apiReportSuccess,apiReportRefund,apiReporInProgress}= require('./APISubmit.js')
let { debug, logs, error, warn, info} = SingleRequire('LogInfo')
let { countTodayEntries,clickTextR,textExists,shellOrShizuku } = SingleRequire('Common');
let unionPay=SingleRequire("Pay_unionPay")


var init=require('./public/initi.js')

function UnionPayProcess(){
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
        if(!this.openUnionPayRechargeCenter(10))return;
        this.order()//下单
        infoFloaty.setProcessText("开始云闪付付款");
        this.pay()//付款
        infoFloaty.setProcessText("云闪付等待结果");
        this.waitResult()
        this.confirmOrderStatus()
    }
    this.openUnionPayRechargeCenter= function(limit){
        while(limit-->0){
            const int={
                data:"upwallet://applet?toLink=https://openysf.cup.com.cn/s/open/ysfapplets/paymentMobileApplet9/index.html#/?v=202207071&encryptAppId=7c2b6cbc3c45da26&partnerId=fb228a28b69f4b87a1dcc635a3922e91",
            }
            app.startActivity(int);
            this.isDualOpen()//判断单开还是双开
            let peddingPayButton=textContains('充值记录').findOne(10000)
            if(peddingPayButton){logs("进入手机充值成功");return true;}
            else{logs("进入手机充值失败")}
        }
        //跳转失败
        logs("跳转失败")
        this.procedure()
        return false
    }
    //下单\
    this.order=function(){
        try {
            logs("充值号码："+this.phoneNumber)
            className("EditText").findOne().setText(this.phoneNumber)
            sleep(500)
            className("EditText").findOne().setText(this.phoneNumber)
            sleep(300)
            className("Button").textContains(this.rechargeAmount+"元").findOne().click()
            sleep(500)
            for(let i=0;i<10;i++){
                if(textExists("确认充值"))break;
                if(i==4 || i==7)className("Button").textContains(this.rechargeAmount+"元").findOne(1000).click()
                if(i==9)this.stopScript("跳转付款异常")
                sleep(1000)
            }
            textContains("确认充值").findOne().click()
            sleep(1000)
        } catch (e) {
            error(e)
        }
    }
    //付款
    this.pay=function(){
        textContains("付款方式").findOne()
        unionPay.exec()

        if(currentOrder["isSuccessful"]){
            logs("充值成功")
            if (currentOrder["MFOrderNumber"]) {
                orderMap.set(currentOrder["MFOrderNumber"], currentOrder);
                config.overwrite('orderMap', mapToObj(orderMap));
            }
            clickTextR("完成")
            sleep(1000)
        }else{
            logs("充值失败")
            this.stopScript("充值失败");
            // this.reLoad(key,3)
        }
    }
    //
    this.waitResult=function(){
        try {
            textContains("充值记录").findOne().click()
            textContains("话费充值").findOne()
            sleep(2000)
            this.findOrderDetail()
            let orderNumber = this.findBrotherText("订单编号")
            if(orderNumber)currentOrder["orderNumber"]=orderNumber
            let detail=this.findBrotherText("面值")
            if(detail) currentOrder['detail']=detail
            let orderStatus=this.findBrotherText("充值状态")
            if(orderStatus)currentOrder['orderStatus']=orderStatus
        } catch (e) {
            error(e)
        }
    }
    //查找充值记录
    this.findOrderDetail = function(){
        try {
            while(true){
                // 查找可见且包含“充值成功”文本的按钮
                if(textExists("订单金额") && textExists(this.phoneNumber.slice(-4)) && textExists('充值成功')){
                    this.screenshot();
                    break;
                }else if(textExists("订单金额") && textExists(this.phoneNumber.slice(-4)) && textExists('处理中')){
                    back()
                    sleep(2000)
                }
                let buttons = className("Button").visibleToUser(true).textContains("话费充值").find();
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
                            // 检查是否存在“订单金额”文本且不包含手机号码后四位的文本
                            if (textContains("订单金额").exists() && !textContains(this.phoneNumber.slice(-4)).exists()) {
                                // 返回上一级
                                back();
                                sleep(1500);
                            }
                        }
                    });
                    textContains("订单金额").findOne(500)
                    sleep(1000)
                    // else{this.stopScript("未找到付款成功订单详情");}
                }

            }
        } catch (e) {
            error(e)
        }
    }
    //查找同一个父控件下的兄弟控件文本
    this.findBrotherText = function(text){
        let brother=textContains(text).findOne(5000)
        if(brother && brother.parent() && brother.children()){
            let brotherText=brother.parent().children().filter(item=>{return item.text() !==text})
            if(brotherText && brotherText[0]){return brotherText[0].text()}
            else return null
        }else{return null}
    }
    //订单上报
    this.confirmOrderStatus = function(){
        try {
            // log("开始上报state");
            infoFloaty.setProcessText("开始报单")
            if (currentOrder["isSuccessful"]) {
                logs("开始上报充值成功的订单")
                        apiReportSuccess('充值成功'); // 上报充值成功的订单
                //TODO 还不知道退款和等待到账的情况
                // else if (textContains("未发货，退款成功").exists() && textContains("联系商家").exists()) {
                //     logs("开始上报充值成功的订单")
                //     reportRefund(); // 上报退款中的订单
                // } else if (textContains("等待到账").exists() && textContains("联系商家").exists()) {
                //     logs("开始上报等待到账的订单")
                //     reportInProgress(); // 上报等待到账的订单
                // }
            }
            info("此笔订单耗时："+ Math.round((currentOrder["submitTs"] - currentOrder["getOrderTs"]) / 1000) + "秒");
        } catch (e) {
            error(e);
        }
        sleep(1000)
    }
}
module.exports=new UnionPayProcess()


