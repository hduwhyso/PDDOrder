/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-11 20:00:33
 * @LastEditTime: 2025-07-13 12:45:09
 * @Description:
 */

let {apiReportSuccess,apiReportRefund,apiReporInProgress}= require('./APISubmit.js')
let ocrText=null
if(ocr==="PaddleOcr"){
    ocrText=SingleRequire("PaddleOcr")
}else if(ocr==="MlkitOcr"){
    ocrText=SingleRequire("MlkitOcr")
}
let {openRechargeCenter,openMyOrder,openPeddingPayOrder}=SingleRequire("PDD")
let { countTodayEntries,clickTextR,textExists,shellOrShizuku } = SingleRequire('Common');
let alipay=SingleRequire("Alipay")
let pay_QQ=SingleRequire("Pay_QQ")
let pay_wechat=SingleRequire("Pay_wechat")
let pingduoduoPayment=SingleRequire("PingduoduoPayment")


var init=require('./public/initi.js')

function pddProcess(){
    init.call(this)

    this.newOrderExec=function(){
        try {
            this.prepareForStart();
            if(!this.orderIDQueryOrder())return;  //如果订单不存在，跳过
            this.newOrderProcedure();
        } catch (e) {
            log(e);
        }
    }
    this.directPay = function(){
        this.prepareForStart()
        if(!this.orderIDQueryOrder())return;  //如果订单不存在，跳过
        infoFloaty.setProcessText("开始PDD付款");
        if(!this.pay())return;
        infoFloaty.setProcessText("PDD等待结果");
        this.waitResult();
    }
    //防止异常情况导致脚本重复下单，先查询订单是否存在，是否是正在充值的订单
    this.orderIDQueryOrder = function () {
      let limit = 5;
      while (limit-- > 0) {
        debug('MFOrderNumber:'+currentOrder["MFOrderNumber"])
        let res = orderIDQueryOrder(currentOrder["MFOrderNumber"]);
        //判断网络是否正常
        if (res) {
          //判断有这个订单，还是没有这个订单
          if (res["code"] == 0) {
            res = res["data"][0];
            /**5 正在充值 7 异常 */
            if (res["status"] == 5 || res["status"] == 7) {
              /** || res['status'] == 7 */
              log(res["status_name"]);
              return true;
            } else {
              logs("未知情况，待思考：" + res["status_name"] + res["status"]);
              return false;
            }
          } else if (res["code"] == 1) {
            logs("按道理不可能，不存在这个订单");
            return false;
          }
        }
        sleep(1000);
      }
      return true;
    };
    this.newOrderProcedure=function(){
        if(!this.transitionToPDDRechargeCenter(10))return;
        infoFloaty.setProcessText("开始下单");
        if(!this.order()){
            infoFloaty.restore();
            controlPanel.hideExceptStop();
            return;
        }
        infoFloaty.setProcessText("开始PDD付款");
        if(!this.pay())return;
        infoFloaty.setProcessText("PDD等待结果");
        this.waitResult();
    }
    //下单
    this.order=function(){
      /** 1、输号码 */
      this.setPhoneNumber(); /**输号码 */

      /** 2、检查号码输入是否正确和是否移动号码 */
      if (!this.OCRCheckPhoneNumberAndOperator(this.phoneNumber)) return false;

      /** 3、点击充值金额 */
      infoFloaty.hide();
      controlPanel.hideAll();
      this.clickChargeAmount()
    //   if(!this.clickChargeAmount())return false;
      /** 4、下单 */
      if(this.getOrder())return true;
    }
    this.setPhoneNumber=function(){
        infoFloaty.setProcessText("开始下单")
        className("EditText").findOne().setText(this.phoneNumber);
        textContains('充值中心').visibleToUser(true).findOne();
        sleep(1000);
        text(this.rechargeAmount+"元").findOne(1000)
    }
    this.OCRCheckPhoneNumberAndOperator=function(phoneNumber){
        shellOrShizuku("screencap -p /sdcard/confirm.jpg")
        let img=images.read('/sdcard/confirm.jpg')
        img=images.clip(img,0,0,img.getWidth(),0.3*img.getHeight());
        img = images.resize(img, [img.getWidth() * 2, img.getHeight() * 2],'CUBIC')
        img = images.threshold(img, 250, 255, "BINARY"); //二值化250以下的变成黑色，250以上的变成白色
        let allWords=ocrText.ocrAllText(img);
        img.recycle();
        /**断网 未查询到归属地*/
        if( allWords.includes('请稍后再试')){
            console.log(textContains("请稍后再试").findOne(1000).text())
            return false
        }
        /**分省关闭 */
        if(allWords.includes('备货中') && allWords.includes('请稍后再试')){
            logs('未查询到归属地')
            let prov=currentOrder['detail'].match(/\|([^|]+)\|/);
            if(prov && prov[1]){
                prov=prov[1];
                info('分省充值关闭:'+prov);
                vender.find(v => v['vender_id']===vender_id)['data']['prov_code']= vender.find(v => v['vender_id']===vender_id)['data']['prov_code'].split(',').filter(province => province !== prov).join(',');
                config.overwrite('vender', vender);
                apiReportRefund("分省充值关闭");//放弃订单
                currentOrder["orderStatus"]="分省充值关闭";
                currentOrder["rechargeID"]="";
            }
            return false
        }
        if(this.OCRCheckPhoneNumber(phoneNumber,allWords)){
            let activityCompareOperator=['移动','电信','联通'].filter(item => !operator_id.includes(item)).some(function(value){
                return textExists(value)
            })
            let OCRCompareOperator=['移动','电信','联通'].filter(item => !operator_id.includes(item)).some(function(value){
                return allWords.includes(value)
            })
            if(activityCompareOperator && OCRCompareOperator){
                apiReportRefund("非移动号码"); //放弃订单
                currentOrder["orderStatus"] = "非移动号码";
                currentOrder["rechargeID"]="";
                shellOrShizuku("am force-stop com.xunmeng.pinduoduo ");
                return false;
            }
            log("号码正确，是移动号码");
            return true;
        }
        this.order()
        return false;
    }
    this.OCRCheckPhoneNumber = function (phoneNumber,basewords) {
      let matches = phoneNumber.match(/(\d{3})(\d{4})(\d{4})/);
      let part1 = matches[1];
      let part2 = matches[2];
      let part3 = matches[3];
      return basewords.includes(part1) && basewords.includes(part2) && basewords.includes(part3);
    };
    //点击充值的金额
    this.clickChargeAmount=function(){
      shellOrShizuku("screencap -p /sdcard/charge.jpg");
      let img = images.read("/sdcard/charge.jpg");
      let imageTop = text("充话费").findOne(3000);
      let imageRegion = [];
      if (imageTop) {
        imageTop = imageTop.bounds().bottom;
        imageRegion = [0, imageTop, img.getWidth(), 0.3 * img.getHeight()];
      } else {
        imageRegion = [0, 0, img.getWidth(), 0.5 * img.getHeight()];
      }
      let location = ocrText.recognizeThenClick(img, imageRegion, this.rechargeAmount + "元");
      img.recycle();
      if (!location) this.stopScript("未识别到充值金额");
      sleep(500);
      if(text("充值").find().length){
          let charge=text("充值").findOne();
          sleep(300);
          logs("点击充值");
          charge.click();
          sleep(500);
      }
      sleep(1000);
    //   if(!textContains("支付宝").findOne(10000)){
    //     shellOrShizuku("am force-stop com.xunmeng.pinduoduo ");
    //     logs("下单失败，重来");
    //     this.newOrderProcedure();
    //     return false;
    //   }
    }
    this.getOrder=function(){
        shellOrShizuku("screencap -p /sdcard/confirm.jpg");
        let img = images.read("/sdcard/confirm.jpg");
        let allWords = ocrText.ocrAllText(img);
        console.log(Boolean(allWords.includes("支付宝")))
        if (allWords.includes("支付宝")) {
          infoFloaty.restore();
          controlPanel.hideExceptStop();
          let comparePhoneNumber = this.OCRCheckPhoneNumber(this.phoneNumber, allWords);
          let compareAmount = allWords.includes(this.rechargeAmount + "元话");
          if (comparePhoneNumber && compareAmount) {
            // img = images.threshold(img, 250, 255, "BINARY"); //二值化250以下的变成黑色，250以上的变成白色
            // img = images.scale(img, 2, 2)/**放大后坐标不准，无法点击 */
            let location = ocrText.recognizeThenClick(img, [0, 0.7 * img.getHeight(), img.getWidth(), 0.3 * img.getHeight()], "支付宝");
            img.recycle();
            if (!location) this.stopScript("未识别到支付宝");
            logs("点击支付宝");
            sleep(1000);
            return true;
          }
          //OCR匹配结果对不上，重新下单
          info(["付款前OCR识别到充值号码：{}", comparePhoneNumber]);
          info(["付款前OCR识别到充值金额：{}", compareAmount]);
        }
        sleep(1000);
        shellOrShizuku("am force-stop com.xunmeng.pinduoduo ");
        logs("下单失败，重来");
        this.newOrderProcedure();
        return false;
    }
    this.transitionToPDDRechargeCenter = function(limit){
        if(textExists("充值中心")&&textExists("100元")&& textExists("优惠价") )return true;
        while(limit-->0){
            if(limit==5||limit==2)shellOrShizuku("am force-stop com.xunmeng.pinduoduo ");
            sleep(300)
            openRechargeCenter()//打开充值中心
            info("充值号码："+this.phoneNumber)
            let retryCount=30
            while(retryCount-->0){
                this.isDualOpen()//判断是单开还是双开
                if(textExists("刚刚充值") || textExists("前充值"))return true;
                if(retryCount==10 && textExists("充值中心"))return true;
                sleep(500)
            }
        }
        //跳转失败
        logs("跳转失败")
        this.newOrderExec()
        return false
    }
    //付款 com.eg.android.AlipayGphone
    this.pay=function(){
        if(currentOrder["isSuccessful"] && currentOrder["orderNumber"]){
            logs('付款成功订单，进入结果上报流程')
            return true;
        }
        if(!this.reLoad(currentPayWayDict,3))return false
        switch (currentPayWayDict) {
            case "支付宝":
                alipay.exec()
                break;
            case "微信支付":
                pay_wechat.wechatExec()
                break;
            case "QQ钱包":
                pay_QQ.QQPayExec()
                break;
            case "多多支付":
                pingduoduoPayment.exec()
                break;

            default:
                break;
        }
        if(currentOrder["isSuccessful"]){
            currentOrder["orderStatusCode"] = -1;
            currentOrder["orderStatus"]="支付成功，等待到账"
            logs("充值成功")
        }else{
            logs("异常，检查是否成功")
            let limit=10;
            while(limit-->0){
                if(textExists('充值号码'))break;
                openOrderDetail(currentOrder["orderNumber"])
                textContains(this.phoneNumber).findOne(10000)
                sleep(500)
                if(limit==1)this.stopScript('付款异常,请检查')
            }
            sleep(1000)
            if(textExists('立即支付') || textExists('支付宝')){
                logs("充值失败")
                this.pay()
                return false;
            }else{
                logs("充值成功")
                // currentOrder["isSuccessful"] = true;
            }

        }
        if (currentOrder["MFOrderNumber"]) {
            orderMap.set(currentOrder["MFOrderNumber"], currentOrder);
            config.overwrite('orderMap', mapToObj(orderMap));
        }
        return true;
    }
    this.reLoad = function(channel,limit){
        try{
            while(limit-->0){
                if(!this.enterPeddingPay(10))return false;
                let channelyButton=textContains(channel).findOne(30000)
                if(channelyButton){
                    logs("点击"+channel)
                    while(true){
                        if(textExists("已选中"+channel))break;
                        // channelyButton.click()
                        clickTextR(channel)
                        sleep(500)
                    }
                    let retryCount = 0
                    if(channel=="QQ钱包")retryCount = 10
                    else retryCount = 30
                    while(retryCount-->0){
                        switch (channel) {
                            case "微信支付":
                                this.isPayDualOpen("微信")
                                if(textExists('立即支付')) return true;
                                break;
                            case "支付宝":
                                if(textExists("付款并开通")){
                                    break;
                                }
                                if(textExists('平台商户') || (textExists('商户单号') && !textExists("付款并开通"))) return true;
                                break;
                            case "QQ钱包":
                                if(textExists('立即支付')) return true;
                                break;
                            case "多多支付":
                                if(textExists('请输入多多钱包密码')) return true;
                                break;

                            default:
                                break;
                        }
                        if (textExists("提交订单")) clickTextR("提交订单", true);
                        else if (textExists("去支付")) clickTextR("去支付", true);
                        else if (textExists("继续付款")) clickTextR("继续付款", true);
                        else if (textExists("继续支付")) clickTextR("继续支付", true);
                        else if (textExists("确认提交")) clickTextR("确认提交", true);
                        sleep(1000);

                    }
                    switch (channel) {
                        case "支付宝":
                            shellOrShizuku("am force-stop com.eg.android.AlipayGphone ")
                            sleep(300)
                            launchApp("支付宝")
                            sleep(2000)
                            break;
                        case "微信支付":
                            shellOrShizuku("am force-stop com.tencent.mm")
                            sleep(300)
                            launch("com.tencent.mm")
                            sleep(3000)
                            break;
                        case "QQ钱包":
                            shellOrShizuku("am force-stop com.tencent.mobileqq")
                            sleep(300)
                            launch("com.tencent.mobileqq")
                            sleep(2000)
                            break;
                        default:
                            break;
                    }
                }
            }
            log("跳转支付宝失败")
            return false

        }catch(e){error(e)}

    }
    this.isPayDualOpen=function(app){
        try{
            sleep(500)
            if (desc(app).find().length && desc('双开'+app).find().length) {
                this.isDual = true;
                logs('双开'+app);
                let accountButton=null;
                if(currentPlatform["entryNow"].includes('双开')){
                    accountButton = desc('双开'+app).findOne(1000);
                }else{
                    accountButton = desc(app).findOne(1000);
                }
                clickTextR(accountButton.desc());
            } else {
                logs("单开" + app);
            }
        }catch(e){error(e)}

    }
    //
    this.enterPeddingPay=function(limit){
        while(limit-- > 0){
            try {
                shellOrShizuku("am force-stop com.xunmeng.pinduoduo");
                // launchApp("拼多多")
                sleep(2000)
                openPeddingPayOrder()
                if(this.isDual){
                    if(desc(currentPlatform["entryNow"]).findOne(10000))clickTextR(this.accountButton.desc());
                }
                // textContains("我的订单").findOne(10000)
                let phoneNumberButton=null
                let count=70
                while(count-->0){
                    if(textExists("我的订单") && textExists(this.phoneNumber)){
                        phoneNumberButton=textContains(this.phoneNumber).findOne()
                        break;
                    }
                    if(!textExists("我的订单") ){
                        if(count==20 || count==40 || count==55){
                            openPeddingPayOrder()
                        }
                    }
                    sleep(300)
                }
                if(phoneNumberButton){
                    toast('phoneNumberButton')
                    sleep(300)
                    while(!click(textContains(this.phoneNumber).find().get(0).text()));
                    //当有多笔待付款订单时默认进入第一个待付款
                    let orderNumberButton=textContains("订单编号").findOne(10000)
                    if(textExists("查看更多"))textContains("查看更多").findOne(1000).click();
                    if(orderNumberButton){
                        let orderText = textContains("订单编号").findOne(1000);
                        if (orderText) orderText = orderText.text();
                        else orderText = "";
                        let orderNumberReg = /\d{6}.\d{15}/;
                        let orderNumber = orderText.match(orderNumberReg)[0];
                        if (orderNumber) currentOrder["orderNumber"] = orderNumber;
                        return true; // 成功执行，返回true
                    }
                }else{
                    if(textExists('您还没有相关的订单') && textExists('待付款')){
                        logs("没有待付款订单,重新下单")
                        this.newOrderExec()
                        return false;
                    }
                }
            } catch (e) {
                error(e)
            }
        }
        return false; // 如果循环结束仍未成功，返回false
    }
    this.waitResult=function(){
        try {
            //订单列表进入订单详情最多尝试10次
            info('等待结果')
            if(currentOrder["orderNumber"]){this.enterPaidOrderDetail(currentOrder["orderNumber"],10);}
            else{
                if(!this.enterOrderDetail(10))this.stopScript("进入我的订单失败")
            }
            switch (currentPayWayDict) {
                case "支付宝":
                    shellOrShizuku("am force-stop com.eg.android.AlipayGphone")
                    break;
                case "微信支付":
                    shellOrShizuku("am force-stop com.tencent.mm")
                    break;
                case "QQ钱包":
                    shellOrShizuku("am force-stop com.tencent.mobileqq")
                    break;
                default:
                    break;
            }
            let limit=600;
            let count=0;
            while(limit-->0){
                count++;
                if(textExists("充值到账") || textExists("请查收") || textExists("退款成功")){
                    if(!osIngore)shellOrShizuku("am force-stop com.xunmeng.pinduoduo");
                    break;
                }
                sleep(500)
                if(count % 20 == 0)swipe(device.width / 2,device.height /3, device.width / 2,  device.height /2, random(20,50));
                if(count==2){
                    if(osIngore)shellOrShizuku("am force-stop com.xunmeng.pinduoduo");
                    sleep(3000)
                    this.enterPaidOrderDetail(currentOrder["orderNumber"],10)
                    sleep(3000)
                }
            }
            this.enterPaidOrderDetail(currentOrder["orderNumber"],10)
            //确认页面加载完成
            while(limit-->0){
                if(textExists("充值到账") || textExists("退款成功"))break;
                sleep(500)
            }
            let currStatus=id("com.xunmeng.pinduoduo:id/tv_title").visibleToUser(true).findOne(5000)//"充值到账","未发货，退款成功" 的控件
            currentOrder["orderStatus"] = currStatus.text();
            log("orderStatus",currentOrder["orderStatus"])
            this.screenshot();
            this.confirmOrderStatus()
        } catch (e) {
            error(e)
        }
    }

    this.enterOrderDetail=function(limit){
        while(limit-- > 0){
            try {
                if(!osIngore)shellOrShizuku("am force-stop com.xunmeng.pinduoduo ");
                sleep(1000)
                let button=null
                openMyOrder()
                if(this.isDual){
                    button=desc(currentPlatform["entryNow"]).findOne(10000)
                    if(button)clickTextR(this.accountButton.desc());
                }
                if(button && this.isDual){
                    textContains("我的订单").findOne(10000)
                    textContains(this.phoneNumber).findOne(10000)
                    sleep(300)
                    while(!click(textContains(this.phoneNumber).find().get(0).text()));
                    //当有多笔待付款订单时默认进入第一个待付款
                    let orderNumberButton=null
                    let retryCount=10
                    while(retryCount-->0){
                        orderNumberButton=currentStatus.some(function(currentValue){
                            return textExists(currentValue) || textExists("精选")
                        })
                        if(orderNumberButton)break;
                        sleep(1000)
                    }
                    if(textExists("查看更多"))textContains("查看更多").findOne(1000).click();
                    if(orderNumberButton){
                        let orderText=textContains("订单编号").findOne(1000).text()
                        let orderNumberReg = /\d{6}.\d{15}/;
                        let orderNumber = orderText.match(orderNumberReg)[0]
                        if(orderNumber)currentOrder["orderNumber"]=orderNumber
                        return true; // 成功执行，返回true
                    }
                }else{
                    warn("请查看autojs是否开启了允许后台弹出等权限")
                }
            } catch (e) {
                error(e)
            }
        }
        return false; // 如果循环结束仍未成功，返回false
    }

    //订单上报
    this.confirmOrderStatus = function(){
        try {
            infoFloaty.setProcessText("开始报单")
            let submitResult=null
            if (currentOrder["isSuccessful"]) {
                if (textContains("充值到账").exists() && textContains("联系商家").exists()) {
                  currentOrder["orderStatusCode"] = 1;
                  logs("开始上报充值成功的订单");
                  submitResult = apiReportSuccess(); // 上报充值成功的订单
                } else if (textContains("联系商家").exists() && (textContains("未发货，退款成功").exists() || textContains("申请售后成功，退款中").exists())) {
                  logs("开始上报退款的订单");
                  currentOrder["orderStatusCode"] = 0;
                  submitResult = apiReportRefund(); // 上报退款中的订单
                } else if (textContains("等待到账").exists() && textContains("联系商家").exists()) {
                  currentOrder["orderStatusCode"] = -1;
                  logs("开始上报等待到账的订单");
                  submitResult = apiReporInProgress(); // 上报等待到账的订单
                } else {
                  warn("报单检测异常");
                  this.waitResult();
                  return;
                }
                if(!submitResult)this.waitResult();
                info('上报订单状态成功')
            }else{
                this.stopScript('付款未成功或者自动交单未打开')
            }
            info("此笔订单耗时："+ Math.round((currentOrder["submitTs"] - currentOrder["getOrderTs"]) / 1000) + "秒");
        } catch (e) {
            error(e);
        }
        sleep(1000)
    }

}


module.exports=new pddProcess()


