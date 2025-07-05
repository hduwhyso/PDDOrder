/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-09 11:09:54
 * @LastEditTime: 2025-07-05 15:35:34
 * @Description:
 *
TODO：如果自己账号下面存在其他渠道订单，脚本会充错渠道

 */
var { config:{root,shizuku,vender,vender_id,orderMap,currentOrder,platform,limitOrders,enablePayList,loopPay,isDualOpen,ocr,useBenefitsFirst,sdkInt,mjwInstalled},config, } = require('../config')(runtime, this)
// 创建本地存储
orderMap = new Map(Object.entries(orderMap || {}));
var platformArr = Object.values(config.platform).map(platform => platform.name);// [ '京东', '拼多多', '淘宝' ]
platformArr.push("PDD渠道api代理")
var currentVender=vender.find(v => v['vender_id']===vender_id) //waitOrderAPI用到
var chosenPlatform=currentVender['chosenPlatform']//pdd
var currentPlatform=platform[chosenPlatform]
var account=currentPlatform['name']//京东
var operator_id=currentVender['data']['operator_id'].split(',')
let appID=""
let currentPayWay=''
let key=currentPlatform["payWay"]
currentPayWay=key[Math.floor(Math.random() * key.length)]
let osIngore=Boolean(sdkInt==25 || sdkInt==29)//安卓7和安卓10


// 引入所需模块
let SingleRequire = require('../lib/chase/SingleRequire.js')(runtime, global);
let { debug, logs, error, warn, info } = SingleRequire('LogInfo');
let { openPersonalProfile,openRechargeCenter,openPDDSettingPage}=SingleRequire("PDD")
var {statusQueryOrder}= SingleRequire('MFSGDAPI');
var currentOrderCURD = SingleRequire('CURD');
let { sortBy,mapToObj,shellOrShizuku,alertWithMusic,ordersCountInHours,currentMonthOrdersCount,ignoreBatteryOptimization,textExists,searchDict,clickTextR} = SingleRequire('Common');
let pddProcess = require('./PDD_Process.js');
let unionPayProcess = require('./unionPayProcess.js')
let placeOrder = require('./placeOrder.js');
let jdPay = require('./jdPay.js');


currentPayWayDict=searchDict(currentPayWay,'paymentPlatform')//当前付款方式检索字典

// 接收引擎参数：悬浮窗
let { infoFloaty, state, controlPanel } = engines.myEngine().execArgv;
infoFloaty.setProcessText(" ");
infoFloaty.setWarnText(" ");
infoFloaty.setSPNText(" ");



threads.start(function(){
  while(true){
    sleep(500);
    if (textExists("一键抹机")) {
      recents();
      sleep(80);
      recents();
      sleep(500);
    }
    if (textExists("当前访问人数较多")) {
      clickTextR('知道了')
    }

  }
})

events.on("exit", function(){
  
  infoFloaty.setProcessText("脚本停止运行");
  log('脚本退出，更新订单数据')
  if (currentOrder["MFOrderNumber"]) {
    config.overwrite("currentOrder", currentOrder);
    let thread=threads.start(function(){currentOrderCURD.update(currentOrder)})
    orderMap.set(currentOrder["MFOrderNumber"], currentOrder);
    config.overwrite('orderMap', mapToObj(orderMap));
    thread.join(10000);
  }
});

/**
 * 订单处理类
 */
info(['当前订单渠道：{};当前运营商：{};当前充值平台：{};当前做单APP：{};当前支付方式：{};',currentVender['vender_name'],operator_id,account,currentPlatform["entryNow"],currentPayWayDict])
logs(['本机订单数：{}',orderMap.size])
var init=require('./public/initi.js');
function OrderHandler() {
    init.call(this)
    /**
     * 处理订单的通用函数
     * @param {Function} processFunction - 处理订单的具体函数
     */
    this.handleOrder = function (processFunction) {
      try {
        this.init();
        processFunction();
      } catch (err) {
        error(err);
        exit();
      }
    };
    this.init = function () {
      //初始条件检查
      /**是否root检查 */
      if(!root && !shizuku){
        infoFloaty.setWarnText("未root或未开启shizuku");
        exit();
      }
      /**付款方式检查 */
      if (!currentPlatform["payWay"].length) {
        infoFloaty.setWarnText("未选择付款方式");
        exit();
      }

    };

    /**
     * 更新订单Map并存储
     */
    this.updateData = function() {
        try {
            logs("开始数据更新");
            debug(`最终的currentOrder：${JSON.stringify(currentOrder)}`);
            if (currentOrder["MFOrderNumber"]) {
                config.overwrite("currentOrder", currentOrder);
                threads.start(function(){
                  log('服务器开始更新订单数据')
                  currentOrderCURD.update(currentOrder)
                })
                orderMap.set(currentOrder["MFOrderNumber"], currentOrder);
                config.overwrite('orderMap', mapToObj(orderMap));
            }
        } catch (e) {
            error(e)
        }
    };

    /**
     * 等待订单处理流程
     */
    this.waitOrderProcess = function() {
        this.handleOrder(() => {
          this.getID(chosenPlatform)/**获取ID */
            while (true) {
                infoFloaty.setWarnText(" ");
                this.ordersCal()/**根据ID计算单量 */
                infoFloaty.setProcessText("订单在路上");
                switch (currentPayWayDict) {
                  case "支付宝":
                      launch("com.eg.android.AlipayGphone")
                      sleep(3000)
                      break;
                  case "微信支付":
                    // launchApp('微信')
                      launch("com.tencent.mm")
                      sleep(3000)
                      break;
                  case "QQ钱包":
                      launch("com.tencent.mobileqq")
                      sleep(2000)
                      break;
                  default:
                      break;
              }
              if(chosenPlatform=='pdd' && osIngore)openRechargeCenter();
                if(this.checkOrder()){
                    let res=""
                        res = require('./waitOrderAPI.js').exec(); // 等单
                    if (res && res['MFOrderNumber'] && !res['isSuccessful']) {
                        currentOrder=res
                    } else {
                        infoFloaty.setWarnText("waitOrder未获取到号码");
                        break;
                    }

                }
                debug(`currentOrder：${JSON.stringify(currentOrder)}`);
                threads.start(function(){alertWithMusic()} )
                logs("充值平台是：" + chosenPlatform+';平台ID：'+appID);
                currentOrder["rechargeID"]=appID
                switch (chosenPlatform) {
                    case "jd":
                        this.jdProcess();
                        break;
                    case "pdd":
                      if (mjwInstalled) {
                        launch("com.yztc.studio.plugin");/**抹机王 */
                        sleep(1000);
                        // openRechargeCenter();
                      }
                        this.pddOrderProcess();
                        break;
                    case "unionPay":
                        this.unionPayOrderProcess();
                        break;
                    default:
                        break;
                }
                this.updateData();

                sleep(1000);
            }
            controlPanel.restore();
        });
    };
    this.ordersCal = function() {
      if (appID) {
        let warnText = "单量：";
        for (let limitOrder of limitOrders) {
          /** 服务器计算单量 */
          let todayOrder = currentOrderCURD.list({ date: limitOrder['perDays'] }) || 0;
          if (todayOrder && todayOrder["data"]) {
            todayOrder = todayOrder["data"].reduce((acc, item) => {
              const jdid = item.rechargeID;
              if (jdid && jdid.includes(appID) && item.isSuccessful) {
                acc++;
              }
              return acc;
            }, 0);
          } else {
            todayOrder = 0;
          }
          /** 本地 orderMap 计算单量 */
          let daysOrders = ordersCountInHours(appID, limitOrder['perDays'] * 24); /** 几天内的订单量 */
          debug(["本地计算单量：{}，服务器计算单量：{}", daysOrders, todayOrder]);
          daysOrders = Math.max(daysOrders, todayOrder);
          warnText += `${daysOrders}/${limitOrder['upperLimitOrders']} (${limitOrder['perDays']}天) `;
          if (daysOrders > (limitOrder['upperLimitOrders'] - 1)) {
            infoFloaty.setWarnText(warnText + ' 停止做单');
            exit();
          }
        }
        info(appID + warnText);
        infoFloaty.setWarnText(warnText);
      }
    }

    this.getID = function (chosenPlatform) {
      // appID = currentPlatform["dualLaunchEntry"].find((item) => item.value === currentPlatform["entryNow"]);
      // appID = appID.id;
      // if(!appID){
      //   infoFloaty.setWarnText('未配置充值平台账号');
      //   exit();
      // }
      let tid = currentPlatform["dualLaunchEntry"].find(item => item.value === currentPlatform["entryNow"]);
      tid = tid.id;
      switch (chosenPlatform) {
        case "pdd":
          if (tid) {
            appID = tid;
            break;
          }
          let verifyID = "";
          this.openPersonalProfile(10);
          verifyID = textMatches(/\d{10,15}/)
            .findOne()
            .text();
          if (verifyID) {
            currentPlatform["dualLaunchEntry"].forEach(item => {
              if (item.value === currentPlatform["entryNow"]) {
                item.id = verifyID;
              }
            });

            config.overwrite("platform", platform);
            appID = verifyID;
          }
          if (!osIngore) shellOrShizuku("am force-stop com.xunmeng.pinduoduo ");
          debug(["获取到的账号信息：{}", verifyID]);
          break;
        case "jd":
        case "unionPay":
        default:
          appID = currentPlatform["dualLaunchEntry"].find(item => item.value === currentPlatform["entryNow"]);
          appID = appID.id;
          if (!appID) {
            infoFloaty.setWarnText("未配置充值平台账号");
            exit();
          }
          break;
      }
    };
    this.checkOrder = function () {
      let limit = 5;
      while (limit-- > 0) {
        let status = 998;
        let res = statusQueryOrder(status);
        //判断网络是否正常
        if (res) {
          //判断有这个订单，还是没有这个订单
          if (res["code"] == 0) {
            res=res["data"]
            logs(["存在{}笔未处理订单，优先处理", res.length]);
            for (let i = 0; i < res.length; i++) {
              if(!res[i]["user_order_id"]){
                logs(["蜜蜂单号：{}", res[i]["user_order_id"]]);
                return true;
              }
              let order = null;
              order = orderMap.get(res[i]["user_order_id"]);
              if (!order) {
                let result = currentOrderCURD.info(res[i]["user_order_id"]);
                if (result) order = result.data;
                else order = null;
              }
              // let result=currentOrderCURD.info(res[i]['user_order_id'])
              // debug(result)
              if (order) {
                if (!order["isSuccessful"] && !order["orderNumber"]) {
                  if (res[i]["status"] == 5) {
                    currentOrder = order;
                    logs(
                      "存在未处理订单，优先处理。currentOrder:" + JSON.stringify(currentOrder)
                    );

                  } else if (res[i]["status"] == 7) {
                    currentOrder = {
                      rechargePlatform:
                        vender.find((v) => v["vender_id"] === vender_id)[
                          "vender_name"
                        ] || null, //获取充值平台
                      phoneNumber: res[i]["target"],
                      MFOrderNumber: res[i]["user_order_id"],
                      detail: res[i]["target_desc"], // 获取订单详情
                      orderNumber: null,
                      isSuccessful: false,
                      getOrderTs: new Date().getTime(),
                      orderDeadlineTs: new Date().getTime() + 10 * 60 * 1000,
                      submitTs: null,
                      paidCard: null,
                      orderStatus: null,
                      rechargeName:account,
                    };
                    logs(
                      "存在异常订单，优先处理。currentOrder:" + currentOrder
                    );
                  } else {
                    logs("没有其他情况了吧");
                    exit();
                  }
                  break;
                } else if (!order["isSuccessful"] && order["orderNumber"]) {
                  logs("存在下单已成功，付款未成功订单，重新下单解决");
                  // this.rePayProcess()
                  // currentOrder=order;
                  currentOrder = {
                    rechargePlatform:
                      vender.find(v => v["vender_id"] === vender_id)[
                        "vender_name"
                      ] || null, //获取充值平台
                    phoneNumber: res[i]["target"],
                    MFOrderNumber: res[i]["user_order_id"],
                    detail: res[i]["target_desc"], // 获取订单详情
                    orderNumber: null,
                    isSuccessful: false,
                    getOrderTs: new Date().getTime(),
                    orderDeadlineTs: new Date().getTime() + 10 * 60 * 1000,
                    submitTs: null,
                    paidCard: null,
                    orderStatus: null,
                    rechargeName:account,
                  };
                } else if (order["isSuccessful"] && order["orderNumber"]) {
                  logs([
                    "{}下单已成功，付款已成功订单，不处理",
                    order["MFOrderNumber"],
                  ]);
                  if(res.length-1==i)return true;
                } else {
                  logs("还有什么情况？");
                  exit();
                }
              } else {
                logs("存在已抢到但是未下单未付款订单");
                currentOrder = {
                  rechargePlatform:
                    vender.find(v => v["vender_id"] === vender_id)[
                      "vender_name"
                    ] || null, //获取充值平台
                  phoneNumber: res[i]["target"],
                  MFOrderNumber: res[i]["user_order_id"],
                  detail: res[i]["target_desc"], // 获取订单详情
                  orderNumber: null,
                  isSuccessful: false,
                  getOrderTs: res[i]["create_time"] * 1000,
                  orderDeadlineTs:
                    res[i]["create_time"] * 1000 + 10 * 60 * 1000,
                  submitTs: null,
                  paidCard: null,
                  orderStatus: null,
                  rechargeName:account,
                };
              }
            }
            sleep(1000);

            infoFloaty.setSPNText(currentOrder['phoneNumber']);
            return false;
          } else if (res["code"] == 1) {
            return true;
          }
        }
        sleep(1000);
      }
      log('网络异常，退出')
      exit();
    };

    /**
     * 京东处理流程
     */
    this.jdProcess = function() {
        infoFloaty.setProcessText("开始京东下单");
        placeOrder.exec(); // 下单

        infoFloaty.setProcessText("开始京东付款");
        jdPay.exec(); // 付款
        // jdPay.crazyModel(); // 付款
    };

    /**
     * 拼多多处理流程
     */
    this.pddOrderProcess = function() {
        infoFloaty.setProcessText("开始PDD下单");
        pddProcess.newOrderExec(); // pdd
    };

    this.openPersonalProfile = function(limit){
        while(limit-- > 0){
            openPersonalProfile()
            sleep(300)
            this.isDualOpen()//判断是单开还是双开
            let moreButton=textContains("多多号").findOne(30000)
            if(moreButton)return
        }
        this.stopScript("进入我的资料失败")
    }

    /**
     * 云闪付处理流程
     */
    this.unionPayOrderProcess = function() {
        infoFloaty.setProcessText("开始云闪付下单");
        unionPayProcess.exec(); // pdd
    };
    /**
     * 重新支付处理流程
     */
    this.rePayProcess = function () {
      this.handleOrder(() => {
        let rechargePlatform = currentOrder["rechargePlatform"];
        // let currentPlatForm = platForm.find(item => rechargePlatform.includes(item));
        logs("当前充值平台是：" + rechargePlatform);
        switch (chosenPlatform) {
          case "jd":
            jdPay.exec();

            // jdPay.crazyModel(); // 付款
            break;
          case "pdd":
            pddProcess.directPay(); // pdd
            break;
          case "unionPay":
            break;
          default:
            break;
        }
        this.updateData();
      });
    };

    /**
     * 默认处理流程
     */
    this.defaultProcess = function() {
        warn(`jdExecutor出错了吗`);
    };
}

// 创建订单处理实例
let orderHandler = new OrderHandler();

// 处理流程映射
const processMap = {
    "waitOrder": orderHandler.waitOrderProcess.bind(orderHandler),
    "pay": orderHandler.rePayProcess.bind(orderHandler)
};

// 执行对应的处理流程
(processMap[state] || orderHandler.defaultProcess.bind(orderHandler))();