let {apiReportSuccess,apiReportRefund,apiReporInProgress, phoneNumber}= require('./APISubmit.js')
let {openOrderDetail,enterJDOrderlist,GetAndCheckOrderNumber,payWay,enterRechargelist}=SingleRequire('JD')
let pay_QQ = SingleRequire("Pay_QQ");
let pay_wechat=SingleRequire("Pay_wechat")
let unionPay=SingleRequire("Pay_unionPay")

let {clickTextR,textExists } = SingleRequire('Common');
let status=["已完成","正在充值","退款中","已退款"]
//接收引擎参数：悬浮窗
// 接收引擎参数：悬浮窗

let tryTimes=0

var init=require('./public/initi.js')

function Pay() {
    init.call(this)

    // 执行支付流程
    this.exec = function () {
        tryTimes=0
        this.prepareForStart();
        this.procedure();
    };
    // 支付流程步骤
    this.procedure = function () {
        if (tryTimes >= 5) {
            this.stopScript('检测到异常，已尝试多次，放弃重试');
        }
        this.openRechargelistPage(10)//第一步、打开话费充值订单页面
        this.findOrder()//我的订单
        this.orderDetail()//订单详情
        this.JDCheckoutCounter()//京东收银台
        this.afterPay()

    }
    this.crazyModel=function(){
      tryTimes=0
      this.prepareForStart();
      if (tryTimes >= 5) {
          this.stopScript('检测到异常，已尝试多次，放弃重试');
      }
      this.openJDOrderlist(10)
      this.JDCheckoutCounter()//京东收银台 
      this.crazyCheckResult()
    }

    this.openJDOrderlist = function (limit) {
      while (limit-- > 0) {
        enterJDOrderlist();
        let confirm = textContains("待付款").findOne(10000);
        if (confirm) {
          clickTextR("待付款");
          sleep(1000);
          if (textExists(currentOrder["phoneNumber"].slice(-4))) {
            let goToPayButton = this.payButton(currentOrder["phoneNumber"].slice(-4));
            if (goToPayButton) {
              logs("点击去支付");
              goToPayButton.click();
              sleep(500);
            } else {
              logs("phoneNumberActivityArray异常");
            }
          }else{
            this.stopScript('脚本没下单')
          }
          sleep(1000);
          if (textExists("确认付款")) break;
        }
        sleep(2000);
      }
      
    }
    this.crazyCheckResult=function(){
      try{
        let limit = 10;
        while (limit-- > 0) {
          if (!enterRechargelist()) this.stopScript("打开话费充值订单超时");
          sleep(2000);
          let phoneNumberCount = textContains(currentOrder["phoneNumber"]).find().length;
          if (phoneNumberCount == 1) {
            this.crazyShopAgain(currentOrder["phoneNumber"], "android.view.ViewGroup");
            if (currentOrder["orderStatus"] == "正在充值") {
              return this.crazyCheckResult();
            }
            if (!textExists("退款中") && (textExists("订单详情") || textExists("话费充值订单"))) {
              this.screenshot();
              infoFloaty.setProcessText("开始交单");
              this.confirmOrderStatus();
              infoFloaty.setProcessText("此单结束");
              return;
            } else {
              this.stopScript("交单异常");
            }
          } else if (phoneNumberCount > 1) {
            this.stopScript("多笔订单");
          } else if (phoneNumberCount == 0 && limit == 1) {
            this.stopScript("无订单");
          }
          sleep(2000);
        }

      }catch(e){error(e)}
    }
    
  this.crazyShopAgain=function(lastFour,Name){
      
    if (!lastFour) {
      log("this.payButton的参数lastFour未设置");
      return false;
    }
    className(Name).visibleToUser(true).find().forEach(item => {
      let state = { hasLastFour: false, payButton: null,orderNumber:'',status:'' };
      searchControls(item, lastFour, state);
      if (state.hasLastFour && state.payButton) {
        finalPayButton = state.payButton;
        currentOrder["orderNumber"]=state.orderNumber
        currentOrder["orderStatus"]=state.status
        debug(['订单号：{}，状态：{}',currentOrder["orderNumber"],currentOrder["orderStatus"]]);
        return; // 找到后立即返回，避免继续查找
      }
    });

    // return finalPayButton ? finalPayButton : false;
  }
  function searchControls(root, lastFour, state) {
    if (!root) return;
    for (let child of root.children()) {
      if (child.text().includes(lastFour)) {
        state.hasLastFour = true;
      }
      if (child.text() === "再次购买") {
        state.payButton = child;
      }
      if (/\d{12}/.test(child.text())) {
        state.orderNumber = child.text()
      }
      if(status.includes(child.text())){
        state.status=child.text()
      }
      searchControls(child, lastFour, state);
    }
  }

    // 打开话费充值订单
    this.openRechargelistPage = function (limit) {
      // shellOrShizuku("am force-stop com.jingdong.app.mall");
      //  if (!enterRechargelist()) this.stopScript("打开话费充值订单超时");
      while (limit-- > 0) {
        enterJDOrderlist();
        let confirm = textContains("待付款").findOne(10000);
        if (confirm) {
          clickTextR("待付款");
          sleep(500);
          clickTextR(currentOrder["phoneNumber"].slice(-4));
          sleep(1000);
          if (textExists("订单详情")) break;
        }
        sleep(1000);
      }

    };
    /**
     * 在待付款页面寻找去支付按钮
     * @param {*} lastFour
     * @returns
     */
    this.payButton = function (lastFour) {
      if (!lastFour) logs("this.payButton的参数lastFour未设置");
      //识别号码后四位和去支付同一个父控件，然后返回去支付的控件数组
      let payButtonArray = className("RelativeLayout")
        .visibleToUser(true)
        .find()
        .map(item => {
          let payButton = null;
          let hasLastFour = item.children().some(activity => activity.text().includes(lastFour));
          let hasPayButton = item.children().some(activity => {
            if (activity.text().includes("去支付")) {
              payButton = activity;
              return true;
            }
            return false;
          });
          return hasLastFour && hasPayButton ? payButton : null;
        })
        .filter(item => item !== null);
      if (payButtonArray.length > 0) {
        return payButtonArray[0];
      } else {
        return false;
      }
    };

    // 查找订单
    this.findOrder = function() {
        try {
            let phoneNumber = currentOrder["phoneNumber"];
            let phoneNumberButton=textContains(phoneNumber).findOne(10000)
            let phoneNumberArr = textContains(phoneNumber).visibleToUser(true).find();
            log('订单量'+phoneNumberArr.length)
            if (phoneNumberArr.length === 1) {
                this.processSingleOrder(phoneNumber, phoneNumberArr[0]);// 处理单个订单
            } else if (phoneNumberArr.length === 0) {
                logs("未找到订单,再来一次")
                ++tryTimes
                return this.procedure();
                // this.stopScript(`未找到号码为${phoneNumber}的待充值订单`);
            } else {
                this.processMultipleOrders(phoneNumber, phoneNumberArr);// 处理多个订单
            }
        } catch (e) {
            log(e);
        }
    };

    // 处理单个订单
    this.processSingleOrder = function(phoneNumber, order) {
        if (this.checkOrder(phoneNumber, order)) {
            order.parent().click();
            if (textContains('取消订单').findOne(10000)) return;
            // 页面如果卡死怎么办
        }
    };

    // 处理多个订单
    this.processMultipleOrders = function(phoneNumber, orders) {
        for (let i = 0; i < orders.length; i++) {
            if (this.checkOrder(phoneNumber, orders[i])) {
                orders[i].parent().click();
                if (textContains('取消订单').findOne(10000)) return;
                // 页面如果卡死怎么办
            }
        }
    };

    // 检查订单是否符合条件
    this.checkOrder = function(phoneNumber, order) {
        let phoneNumberExist = order.parent().children().some(function(item) {
            return item.text().includes(phoneNumber);
        });
        let pendingPayExist = order.parent().children().some(function(item) {
            return item.text().includes("等待付款");
        });
        return phoneNumberExist && pendingPayExist;
    };

    // 订单详情页
    this.orderDetail = function () {
        try{
            GetAndCheckOrderNumber();
            if (this.isTimeInsufficient()) {
                this.stopScript("剩余时间不足，停止付款");
            }
            let goToPayButton = textContains("去支付").findOne();
            sleep(500)
            debug(`点击前往京东收银台，[${goToPayButton.bounds().centerX()},${goToPayButton.bounds().centerY()}]`);
            if(!clickTextR("去支付"))goToPayButton.parent().click();
            // this.waitForCheckoutCounter();
        }catch(e){error(e)}
    };

    // 等待跳转到京东收银台
    this.waitForCheckoutCounter = function () {
        try{
            for (let i = 0; i < 11; i++) {
                if (textExists('京东收银台')) {
                    infoFloaty.setProcessText("京东收银台")
                    break;
                }
                sleep(1000);
                let goToPayButton = textContains("去支付").findOne(100);
                sleep(500)
                if (goToPayButton && i > 5) clickTextR("去支付");
                if (i == 10) return this.procedure(++tryTimes);
            }
        }catch(e){error(e)}
    };

  // 京东收银台
  this.JDCheckoutCounter = function () {
    try {
      if (textExists(currentOrder["phoneNumber"])) {
        this.choosePay(currentPayWayDict);
        console.log("选择支付方式：" + currentPayWayDict);
        switch (currentPayWayDict) {
          case "微信支付":
            pay_wechat.wechatExec();
            break;
          case "QQ钱包":
            pay_QQ.QQPayExec();
            break;
          case "云闪付":
            unionPay.exec()
            break;
          case "京东支付":
            break;

          default:
            break;
        }

        if (currentOrder["isSuccessful"]) {
          logs("充值成功");
          switch (currentPayWayDict) {
            case "QQ钱包":
              shellOrShizuku("am force-stop com.tencent.mobileqq");
              break;
            default:
              break;
          }
        } else {
          logs("异常，检查是否成功");
          let limit = 10;
          while (limit-- > 0) {
            if (textExists("充值号码")) break;
            openOrderDetail(currentOrder["orderNumber"]);
            textContains(currentOrder["orderNumber"]).findOne(10000);
            sleep(500);
            if (limit == 1) this.stopScript("付款异常,请检查");
          }
          sleep(1000);
          if (textExists("去支付")) {
            logs("充值失败");
            this.procedure();
            return false;
          } else {
            logs("充值成功");
            // currentOrder["isSuccessful"] = true;
          }
        }
      } else {
        this.stopScript("待付款号码不对");
      }
    } catch (e) {
      error(e);
    }
  };

    // 支付后处理
    this.afterPay = function () {
        try {
          let limit=10
          while(limit-->0){
            if (openOrderDetail(currentOrder["orderNumber"])) break;
            sleep(3000)
            if(limit==1){
              this.stopScript("打开话费充值订单超时")
            }

          }
            // if(textExists(currentOrder["orderNumber"])){
            //     clickTextR(currentOrder["orderNumber"])
            // }
            // textContains(currentOrder["orderNumber"]).findOne().parent().click() // 导航到订单
            this.updateOrderStatus();
        } catch (e) {
            error(e);
        }
    };

    // 更新订单状态
    this.updateOrderStatus = function () {
        textContains("归属地区").waitFor();
        logs("进入【订单详情】")
        sleep(300);
        // currentOrder["orderStatus"] = className("TextView").boundsInside(device.width * 5 / 6, 0, device.width, device.height / 4).visibleToUser(true).findOne().text();
        // debug("orderStatus:"+currentOrder["orderStatus"].toString())
        // debug(!textExists('退款中').toString())
        // debug(textExists('订单详情').toString())
        
      let orderStatus = id("com.jingdong.app.mall:id/fd").findOne(10000);
      if (orderStatus) {
        currentOrder["orderStatus"] = orderStatus.text();
        debug("orderStatus:" + currentOrder["orderStatus"].toString());
        debug(!textExists("退款中").toString());
        debug(textExists("订单详情").toString());
      }
      if (textExists("已完成") && textExists("归属地区")) {
        this.screenshot();
        infoFloaty.setProcessText("开始交单");
        this.confirmOrderStatus();
        infoFloaty.setProcessText("此单结束");
        return;
      }else if(textExists("退款中")||textExists("已退款")){

      }else if(textExists("正在充值")){
        sleep(1000)
        return this.afterPay()

      } else {
        this.stopScript("交单异常");
      }
    };
    this.confirmOrderStatus = function(){
        try {
            infoFloaty.setProcessText("开始报单")
            let submitResult=null
            log('confirmOrderStatus',Boolean(currentOrder))
            if (currentOrder) {
                if ((textExists('充值成功') ||textExists('已完成')) && (textExists('归属地区') || textExists('话费充值订单'))) {
                    logs("开始上报充值成功的订单")
                        submitResult= apiReportSuccess(); // 上报充值成功的订单
                } else if ((textExists('退款中')||textExists('已退款')) && (textExists('归属地区') || textExists('话费充值订单'))) {
                    logs("开始上报退款的订单")
                        submitResult= apiReportRefund(); // 上报退款中的订单
                }  else if (textExists('正在充值') && (textExists('归属地区') || textExists('话费充值订单'))) {
                    logs("开始上报等待到账的订单")
                    this.afterPay();
                    return;
                    // if(apiOrder){
                    //     submitResult= apiReporInProgress(); // 上报等待到账的订单
                    // }else{
                    //     submitResult=  reportInProgress(); // 上报等待到账的订单
                    // }
                }else{logs("pay中还有什么我没想到的")}
            }
            log('submitResult',Boolean(submitResult))
            if(!submitResult)this.afterPay();
            info("此笔订单耗时："+Math.round((currentOrder["submitTs"] - currentOrder["getOrderTs"]) / 1000) + "秒");
        } catch (e) {
            error(e);
        }
    }
    this.choosePay = function (payWay) {
      try {
        let limit=20
        while (limit-->0) {
          if (textExists("展开全部")) {
            clickTextR("展开全部");
          }
          if (this.clickButton(payWay, 60000)) {
            if (textExists("已选中" + payWay)) {
              break;
            }
          }
          if ( limit==5 && !textExists("展开全部")) {
            this.stopScript("未找到QQ支付,请用QQ登录京东");
          }
          sleep(1000);
        }
        console.log("已选中" + payWay);
        let passText=''
        switch (payWay) {
          case "微信支付":
            passText='立即支付'
              break;
          case "QQ钱包":
            passText='订单确认'
              break;

          default:
              break;
      }
        this.waitForTransition(passText, 60);
      } catch (e) {
        error(e);
      }
    };
    
    this.waitForTransition = function (text, limit) {
        while (limit-- > 0) {
            if(textExists("确认付款")){
                clickTextR("确认付款")
            }
            sleep(1000); 
            if(textExists('交易受限') && currentPayWayDict=='云闪付'){
              enablePayList.forEach(item=>{
                if(item.channel=='云闪付'){
                  item.canPay=false
                }
              })
            }
            if (textExists(text)) {
                logs("跳转成功");
                infoFloaty.setProcessText(currentPayWayDict)
                break;
            }
            if (limit == 1) {
                infoFloaty.setWarnText("跳转失败");
                    //TODO 采取什么措施？重新启动付款脚本？
            }
        }
    };
    this.clickButton = function (text, timeout) {
        let button = textContains(text).findOne(timeout);
        if (button) {
          // clickRandom(button);
          // clickTextR(text)
          button.parent().click();
          return true;
        }
        return false;
      };
}
module.exports=new Pay()