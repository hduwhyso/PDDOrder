/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-09 11:09:54
 * @LastEditTime: 2025-07-13 09:07:58
 * @Description: 订单执行器 - 优化版本
 *
 * TODO：如果自己账号下面存在其他渠道订单，脚本会充错渠道
 */

// ==================== 配置初始化 ====================
var configInstance = require('../config')(runtime, this);
var config = configInstance.config;
var configData = config;
var root = configData.root;
var shizuku = configData.shizuku;
var vender = configData.vender;
var vender_id = configData.vender_id;
var orderMap = new Map(Object.entries(configData.orderMap || {}));
var currentOrder = configData.currentOrder;
var platform = configData.platform;
var limitOrders = configData.limitOrders;
var enablePayList = configData.enablePayList;
var loopPay = configData.loopPay;
var isDualOpen = configData.isDualOpen;
var ocr = configData.ocr;
var useBenefitsFirst = configData.useBenefitsFirst;
var sdkInt = configData.sdkInt;
var mjwInstalled = configData.mjwInstalled;

// ==================== 平台配置 ====================
var platformArr = Object.values(platform).map(function(platform) {
    return platform.name;
});
platformArr.push("PDD渠道api代理");

var currentVender = vender.find(function(v) {
    return v['vender_id'] === vender_id;
});

var chosenPlatform = currentVender['chosenPlatform'];
var currentPlatform = platform[chosenPlatform];
var account = currentPlatform['name'];
var operator_id = currentVender['data']['operator_id'].split(',');
var appID = "";
var currentPayWay = '';
var key = currentPlatform["payWay"];
currentPayWay = key[Math.floor(Math.random() * key.length)];
var osIngore = Boolean(sdkInt == 25 || sdkInt == 29);

// ==================== 模块导入 ====================
var SingleRequire = require('../lib/chase/SingleRequire.js')(runtime, global);
var LogInfo = SingleRequire('LogInfo');
var debug = LogInfo.debug;
var logs = LogInfo.logs;
var error = LogInfo.error;
var warn = LogInfo.warn;
var info = LogInfo.info;

var PDD = SingleRequire("PDD");
var openPersonalProfile = PDD.openPersonalProfile;
var openRechargeCenter = PDD.openRechargeCenter;
var openPDDSettingPage = PDD.openPDDSettingPage;
var openOrderDetail = PDD.openOrderDetail;

var MFSGDAPI = SingleRequire('MFSGDAPI');
var statusQueryOrder = MFSGDAPI.statusQueryOrder;
var orderIDQueryOrder = MFSGDAPI.orderIDQueryOrder;

var currentOrderCURD = SingleRequire('CURD');

var Common = SingleRequire('Common');
var sortBy = Common.sortBy;
var mapToObj = Common.mapToObj;
var shellOrShizuku = Common.shellOrShizuku;
var alertWithMusic = Common.alertWithMusic;
var ordersCountInHours = Common.ordersCountInHours;
var currentMonthOrdersCount = Common.currentMonthOrdersCount;
var ignoreBatteryOptimization = Common.ignoreBatteryOptimization;
var textExists = Common.textExists;
var searchDict = Common.searchDict;
var clickTextR = Common.clickTextR;

var pddProcess = require('./PDD_Process.js');
var unionPayProcess = require('./unionPayProcess.js');
var placeOrder = require('./placeOrder.js');
var jdPay = require('./jdPay.js');

var currentPayWayDict = searchDict(currentPayWay, 'paymentPlatform');

// 定义全局变量供 initi.js 使用
var currentStatus = ["充值到账", "未发货，退款成功", "支付成功，等待到账", "申请售后成功，退款中"];

// ==================== 悬浮窗初始化 ====================
var engineArgs = engines.myEngine().execArgv;
var infoFloaty = engineArgs.infoFloaty;
var state = engineArgs.state;
var controlPanel = engineArgs.controlPanel;

infoFloaty.setProcessText(" ");
infoFloaty.setWarnText(" ");
infoFloaty.setSPNText(" ");

// ==================== 工具类 ====================
var OrderUtils = {
    /**
     * 创建订单对象
     */
    createOrder: function(orderData) {
        return {
            rechargePlatform: vender.find(function(v) {
                return v["vender_id"] === vender_id;
            })["vender_name"] || null,
            phoneNumber: orderData.target,
            MFOrderNumber: orderData.user_order_id,
            detail: orderData.target_desc,
            orderNumber: null,
            isSuccessful: false,
            getOrderTs: orderData.create_time ? orderData.create_time * 1000 : new Date().getTime(),
            orderDeadlineTs: (orderData.create_time ? orderData.create_time * 1000 : new Date().getTime()) + 10 * 60 * 1000,
            submitTs: null,
            paidCard: null,
            orderStatus: null,
            rechargeName: account
        };
    },

    /**
     * 启动支付应用
     */
    launchPaymentApp: function(paymentType) {
        switch (paymentType) {
            case "支付宝":
                launch("com.eg.android.AlipayGphone");
                sleep(3000);
                break;
            case "微信支付":
                launch("com.tencent.mm");
                sleep(3000);
                break;
            case "QQ钱包":
                launch("com.tencent.mobileqq");
                sleep(2000);
                break;
        }
    },

    /**
     * 安全退出
     */
    safeExit: function(message) {
        if (message) {
            infoFloaty.setWarnText(message);
        }
        exit();
    }
};

// ==================== 配置验证器 ====================
var ConfigValidator = {
    /**
     * 验证基础配置
     */
    validateBasicConfig: function() {
        if (!root && !shizuku) {
            OrderUtils.safeExit("未root或未开启shizuku");
        }

        if (!currentPlatform["payWay"].length) {
            OrderUtils.safeExit("未选择付款方式");
        }
    },

    /**
     * 验证平台配置
     */
    validatePlatformConfig: function() {
        var platformEntry = currentPlatform["dualLaunchEntry"].find(function(item) {
            return item.value === currentPlatform["entryNow"];
        });

        if (!platformEntry || !platformEntry.id) {
            OrderUtils.safeExit("未配置充值平台账号");
        }

        return platformEntry.id;
    }
};

// ==================== 订单管理器 ====================
var OrderManager = {
    /**
     * 更新订单数据
     */
    updateOrderData: function() {
        try {
            logs("开始数据更新");
            debug("最终的currentOrder：" + JSON.stringify(currentOrder));

            if (currentOrder["MFOrderNumber"]) {
                config.overwrite("currentOrder", currentOrder);

                threads.start(function() {
                    log('服务器开始更新订单数据');
                    currentOrderCURD.update(currentOrder);
                });

                orderMap.set(currentOrder["MFOrderNumber"], currentOrder);
                config.overwrite('orderMap', mapToObj(orderMap));
            }
        } catch (e) {
            error(e);
        }
    },

    /**
     * 计算订单数量
     */
    calculateOrderCount: function() {
        if (!appID) return;

        var warnText = "单量：";
        var totalLocalOrders = 0;
        var totalServerOrders = 0;

        for (var i = 0; i < limitOrders.length; i++) {
            var limitOrder = limitOrders[i];

            // 服务器计算单量
            var todayOrder = currentOrderCURD.list({ date: limitOrder['perDays'] }) || 0;
            if (todayOrder && todayOrder["data"]) {
                todayOrder = todayOrder["data"].reduce(function(acc, item) {
                    var jdid = item.rechargeID;
                    if (jdid && jdid.includes(appID) && item.isSuccessful) {
                        acc++;
                    }
                    return acc;
                }, 0);
            } else {
                todayOrder = 0;
            }

            // 本地 orderMap 计算单量
            var daysOrders = ordersCountInHours(appID, limitOrder['perDays'] * 24);

            // 记录最大值用于调试输出
            if (daysOrders > totalLocalOrders) {
                totalLocalOrders = daysOrders;
            }
            if (todayOrder > totalServerOrders) {
                totalServerOrders = todayOrder;
            }

            daysOrders = Math.max(daysOrders, todayOrder);
            warnText += daysOrders + "/" + limitOrder['upperLimitOrders'] + " (" + limitOrder['perDays'] + "天) ";

            if (daysOrders > (limitOrder['upperLimitOrders'] - 1)) {
                infoFloaty.setWarnText(warnText + ' 停止做单');
                exit();
            }
        }
        debug(["本地计算单量：{}，服务器计算单量：{}", totalLocalOrders, totalServerOrders]);

        info(appID + warnText);
        infoFloaty.setWarnText(warnText);
    },

    /**
     * 根据状态码检查订单状态
     */
    checkOrderStatus: function() {
        var limit = 5;
        while (limit-- > 0) {
            var status = 998;/**处理中,包含异常 */
            var res = statusQueryOrder(status);

            if (!res) {
                sleep(1000);
                continue;
            }

            if (res["code"] == 0) {
                res = res["data"];
                logs(["存在{}笔未处理订单，优先处理", res.length]);

                for (var i = 0; i < res.length; i++) {
                    if (!res[i]["user_order_id"]) {
                        logs(["蜜蜂单号：{}", res[i]["user_order_id"]]);
                        return true;
                    }

                    var order = orderMap.get(res[i]["user_order_id"]);
                    if (!order) {
                        var result = currentOrderCURD.info(res[i]["user_order_id"]);
                        order = result ? result.data : null;
                    }

                    if (order) {
                        if (!order["isSuccessful"] && !order["orderNumber"]) {
                            if (res[i]["status"] == 5) {
                                currentOrder = order;
                                logs("存在未处理订单，优先处理。currentOrder:" + JSON.stringify(currentOrder));
                            } else if (res[i]["status"] == 7) {
                                currentOrder = OrderUtils.createOrder(res[i]);
                                logs("存在异常订单，优先处理。currentOrder:" + JSON.stringify(currentOrder));
                            } else {
                                logs("没有其他情况了吧");
                                exit();
                            }
                            break;
                        } else if (!order["isSuccessful"] && order["orderNumber"]) {
                            logs("存在下单已成功，付款未成功订单，重新下单解决");
                            currentOrder = OrderUtils.createOrder(res[i]);
                        } else if (order["isSuccessful"] && order["orderNumber"]) {
                            logs(["{}下单已成功，付款已成功订单，不处理", order["MFOrderNumber"]]);
                            if (res.length - 1 == i) return true;
                        } else {
                            logs("还有什么情况？");
                            exit();
                        }
                    } else {
                        logs("存在已抢到但是未下单未付款订单");
                        currentOrder = OrderUtils.createOrder(res[i]);
                    }
                }

                sleep(1000);
                infoFloaty.setSPNText(currentOrder['phoneNumber']);
                return false;
            } else if (res["code"] == 1) {
                return true;
            }
        }

        log('网络异常，退出');
        exit();
    }
};

// ==================== 平台处理器 ====================
var PlatformProcessor = (function() {
    // 创建基础对象
    var processor = {
        /**
         * 获取平台ID
         */
        getPlatformID: function() {
            var tid = currentPlatform["dualLaunchEntry"].find(function(item) {
                return item.value === currentPlatform["entryNow"];
            });
            tid = tid.id;

            switch (chosenPlatform) {
                case "pdd":
                    if (tid) {
                        appID = tid;
                        break;
                    }

                    var verifyID = "";
                    this.openPersonalProfile(10);
                    verifyID = textMatches(/\d{10,15}/).findOne().text();

                    if (verifyID) {
                        currentPlatform["dualLaunchEntry"].forEach(function(item) {
                            if (item.value === currentPlatform["entryNow"]) {
                                item.id = verifyID;
                            }
                        });

                        config.overwrite("platform", platform);
                        appID = verifyID;
                    }

                    if (!osIngore) {
                        shellOrShizuku("am force-stop com.xunmeng.pinduoduo ");
                    }

                    debug(["获取到的账号信息：{}", verifyID]);
                    break;

                case "jd":
                case "unionPay":
                default:
                    appID = currentPlatform["dualLaunchEntry"].find(function(item) {
                        return item.value === currentPlatform["entryNow"];
                    });
                    appID = appID.id;

                    if (!appID) {
                        OrderUtils.safeExit("未配置充值平台账号");
                    }
                    break;
            }
        },

        /**
         * 打开个人资料页面
         */
        openPersonalProfile: function(limit) {
            while (limit-- > 0) {
                openPersonalProfile();
                sleep(300);
                // 判断是单开还是双开
                this.isDualOpen();
                var moreButton = textContains("多多号").findOne(30000);
                if (moreButton) return;
            }
            // 进入我的资料失败
            infoFloaty.setWarnText("进入我的资料失败");
            exit();
        }
    };

    // 注入 initi.js 的方法
    var init = require('./public/initi.js');
    init.call(processor);

    // 添加平台处理方法
    processor.processJDOrder = function() {
        infoFloaty.setProcessText("开始京东下单");
        placeOrder.exec();

        infoFloaty.setProcessText("开始京东付款");
        jdPay.exec();
    };

    processor.processPDDOrder = function() {
        infoFloaty.setProcessText("开始PDD下单");
        pddProcess.newOrderExec();
    };

    processor.processUnionPayOrder = function() {
        infoFloaty.setProcessText("开始云闪付下单");
        unionPayProcess.exec();
    };

    processor.processRepayment = function() {
        var rechargePlatform = currentOrder["rechargePlatform"];
        if (!rechargePlatform) {
          OrderUtils.safeExit("无待付款订单");
        }
        logs("当前充值平台是：" + rechargePlatform);

        switch (chosenPlatform) {
            case "jd":
                jdPay.exec();
                break;
            case "pdd":
                pddProcess.directPay();
                break;
            case "unionPay":
                break;
            default:
                break;
        }

        OrderManager.updateOrderData();
    };

    return processor;
})();

// ==================== 主订单处理器 ====================
function OrderHandler() {
    var init = require('./public/initi.js');
    init.call(this);

    /**
     * 处理订单的通用函数
     */
    this.handleOrder = function(processFunction) {
        try {
            this.init();
            processFunction();
        } catch (err) {
            error(err);
            exit();
        }
    };

    /**
     * 初始化检查
     */
    this.init = function() {
        ConfigValidator.validateBasicConfig();
    };

    /**
     * 更新数据
     */
    this.updateData = function() {
        OrderManager.updateOrderData();
    };

    /**
     * 等待订单处理流程
     */
    this.waitOrderProcess = function() {
        var self = this;
        this.handleOrder(function() {
            PlatformProcessor.getPlatformID();

            while (true) {
                infoFloaty.setWarnText(" ");
                OrderManager.calculateOrderCount();
                infoFloaty.setProcessText("订单在路上");

                OrderUtils.launchPaymentApp(currentPayWayDict);

                if (chosenPlatform == 'pdd' && osIngore) {
                    openRechargeCenter();
                }

                if (self.checkOrder()) {
                    var res = require('./waitOrderAPI.js').exec();
                    if (res && res['MFOrderNumber'] && !res['isSuccessful']) {
                        currentOrder = res;
                    } else {
                        infoFloaty.setWarnText("waitOrder未获取到号码");
                        break;
                    }
                }

                debug("currentOrder：" + JSON.stringify(currentOrder));
                threads.start(function() {
                    alertWithMusic();
                });

                logs("充值平台是：" + chosenPlatform + ';平台ID：' + appID);
                currentOrder["rechargeID"] = appID;

                switch (chosenPlatform) {
                    case "jd":
                        PlatformProcessor.processJDOrder();
                        break;
                    case "pdd":
                        if (mjwInstalled) {
                            launch("com.yztc.studio.plugin");
                            sleep(1000);
                        }
                        PlatformProcessor.processPDDOrder();
                        break;
                    case "unionPay":
                        PlatformProcessor.processUnionPayOrder();
                        break;
                    default:
                        break;
                }

                self.updateData();
                sleep(1000);
            }

            controlPanel.restore();
        });
    };



    /**
     * 检查订单
     */
    this.checkOrder = function() {
        return OrderManager.checkOrderStatus();
    };



    /**
     * 重新支付处理流程
     */
    this.rePayProcess = function() {
        var self = this;
        this.handleOrder(function() {
            PlatformProcessor.processRepayment();
            self.updateData();
        });
    };

    /**
     * 默认处理流程
     */
    this.defaultProcess = function() {
        warn("jdExecutor出错了吗");
    };
}

// ==================== 后台任务 ====================
threads.start(function() {
    while (true) {
        sleep(500);
        if (textExists("一键抹机")) {
            recents();
            sleep(80);
            recents();
            sleep(500);
        }
        if (textExists("当前访问人数较多")) {
            clickTextR('知道了');
        }
    }
});

// ==================== 退出事件处理 ====================
events.on("exit", function() {
    infoFloaty.setProcessText("脚本停止运行");
    log('脚本退出，更新订单数据');

    if (currentOrder["MFOrderNumber"]) {
      config.overwrite("currentOrder", currentOrder);
        var thread = threads.start(function() {
            currentOrderCURD.update(currentOrder);
        });
        orderMap.set(currentOrder["MFOrderNumber"], currentOrder);
        config.overwrite('orderMap', mapToObj(orderMap));
        thread.join(10000);
    }
});

// ==================== 主程序执行 ====================
info(['订单渠道：{}; 运营商：{}; 充值金额：{}; 充值平台：{}; 做单APP：{}; 支付方式：{};',
    currentVender['vender_name'], operator_id, currentVender["data"]["amount"], account, currentPlatform["entryNow"], currentPayWayDict]);
logs(['本机订单总数：{}', orderMap.size]);

var orderHandler = new OrderHandler();

var processMap = {
    "waitOrder": orderHandler.waitOrderProcess.bind(orderHandler),
    "pay": orderHandler.rePayProcess.bind(orderHandler)
};

(processMap[state] || orderHandler.defaultProcess.bind(orderHandler))();