/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-02-22 18:21:52
 * @LastEditTime: 2024-07-23 16:59:08
 * @Description:
 */

let {storage_name: storage_name } = require('../config')(runtime, this)
var storage = storages.create(storage_name);
let SingleRequire = require('../lib/chase/SingleRequire.js')(runtime, global);
let { debug, logs, error, warn, info } = SingleRequire('LogInfo');
let { infoFloaty, state, controlPanel } = engines.myEngine().execArgv;
var currentOrderCURD = SingleRequire('CURD');
let paddleOcr=SingleRequire("PaddleOcr")
let status=["充值到账","未发货，退款成功","支付成功，等待到账"]

function Submit() {
    this.currentOrder = ""; // 目前正在付款订单

    /**
     * 启动微信并返回到主界面
     */
    this.launchWeChat = function () {
        let img=images.read('/sdcard/currentOrder.jpg')
        img=images.clip(img,0,100,img.getWidth(),600-100)
        let allWords=paddleOcr.ocrAllText(img)
        let comparePhoneNumber=allWords.includes(this.phoneNumber)
        let compareAmount=allWords.includes(this.rechargeAmount+"元")
        if(comparePhoneNumber){
            debug(["充值号码比对结果：{}；订单状态比对结果：{}；充值金额比对结果：{}",status.find(s => allWords.includes(s)),orderStatus,compareAmount])
        }else{this.stopScript("OCR识别号码对不上");}
        this.currentOrder = storage.get("currentOrder") || ""; // 目前正在付款订单
        launchApp("微信"); // 启动微信应用
        //校验蜜蜂单号
        if(this.currentOrder["MFOrderNumber"] !== this.getMFOrderNumber()){
            this.setWarnText("蜜蜂订单号不符")
            return;
        }
        className("android.widget.TextView").text("").findOne().click(); // 点击返回按钮
        sleep(1000);
        depth(3).drawingOrder(4).findOne().click(); // 点击微信中的某个元素
        textContains("完成").findOne().click(); // 点击完成按钮
        sleep(1000);
    };

    // 绑定this上下文
    this.reportSuccess = this.reportSuccess.bind(this);
    this.reportRefund = this.reportRefund.bind(this);
    this.reportInProgress = this.reportInProgress.bind(this);
    /**
     * 获取蜜蜂订单号
     * @returns {string} - 蜜蜂订单号
     */
     this.getMFOrderNumber = function () {
        let MFOrderNumberReg = /\d{14}$/;
        let MFOrderNumber=textMatches(MFOrderNumberReg).findOne(10000)
        if(!MFOrderNumber){
            logs("蜜蜂单号获取失败，重新获取")
            back();
            this.exec()
            return null
        }
        return MFOrderNumber.text();
    };
    // 停止脚本并显示警告信息
    this.stopScript = function (message) {
        infoFloaty.setWarnText(message);
        logs("停止脚本");
        exit();
    };
}


/**
 * 上报充值成功的订单
 */
Submit.prototype.reportSuccess = function () {
    this.launchWeChat();
    textContains("充值到账").findOne().click(); // 点击充值到账按钮
    sleep(300)
    click(890, 2332); // 点击充值成功位置
    sleep(500)
    while (!textContains("确认上报").exists()) {
        logs("充值到账按钮："+textContains("充值到账").findOne().click()); // 点击充值到账按钮
        sleep(300);
        click(890, 2332); // 点击充值成功位置
        sleep(500)
    }
    textContains("确认上报").findOne().click(); // 点击确认上报按钮
    this.currentOrder["submitTs"] = new Date().getTime(); // 记录提交时间
    storage.put("currentOrder", this.currentOrder);
    threads.start(function(){currentOrderCURD.update(currentOrder)})
    for (let i = 0; i < 60; i++) {
        if (textContains("成功原因").exists()) break;
        if (textContains("凭证与示例凭证不符").exists()) {
            info("凭证与示例凭证不符");
            className("android.widget.TextView").text("").findOne().click(); // 点击返回按钮
            sleep(10000);
            descContains("图片1").findOne(1000).parent().click(); // 点击图片1
            textContains("完成").findOne().click(); // 点击完成按钮
            sleep(1000);
            textContains("充值到账").findOne().click(); // 点击充值到账按钮
            sleep(300);
            click(890, 2332); // 点击充值成功位置
            sleep(500)
        }
        if (i == 59) {
            exit();
            infoFloaty.setWarnText("凭证异常")
        }
        sleep(1000);
    }
    // sleep(10000);
};

/**
 * 上报退款中的订单
 */
Submit.prototype.reportRefund = function () {
    this.currentOrder = storage.get("currentOrder") || ""; // 目前正在付款订单
    infoFloaty.setWarnText("开始上报退款中订单");
    launchApp("微信"); // 启动微信应用
    //校验蜜蜂单号
    if(this.currentOrder["MFOrderNumber"] !== this.getMFOrderNumber()){
        this.setWarnText("蜜蜂订单号不符")
        return;
    }
    textContains("放弃订单").findOne().click(); // 点击放弃订单按钮
    sleep(300);
    click(180, 2332); // 点击放弃订单位置
    sleep(500)
    device.vibrate(1000); // 设备震动
    textContains("确定要放弃充值吗").waitFor(); // 等待确认放弃充值提示
    click("确定"); // 点击确定按钮
    this.currentOrder["submitTs"] = new Date().getTime(); // 记录提交时间
    storage.put("currentOrder", this.currentOrder);
    while (true) {
        if (textContains("用户取消订单").exists() || textContains("进行中").exists()) {
            logs("退款单结束");
            break;
        }
        sleep(1000);
    }
};

/**
 * 上报正在充值的订单
 */
Submit.prototype.reportInProgress = function () {
    infoFloaty.setWarnText("开始上报正在充值订单");
    this.launchWeChat();
    textContains("我已充未到账").findOne().click(); // 点击我已充未到账按钮
    click(535, 2332); // 点击我已充未到账位置
    while (!textContains("确认上报").exists()) {
        textContains("我已充未到账").findOne().click(); // 点击我已充未到账按钮
        click(535, 2332); // 点击我已充未到账位置
        sleep(500);
    }
    textContains("确认上报").findOne().click(); // 点击确认上报按钮
    this.currentOrder["submitTs"] = new Date().getTime(); // 记录提交时间
    storage.put("currentOrder", this.currentOrder);
    while (true) {
        if (textContains("订单将变为异常").exists() || textContains("进行中").exists()) {
            logs("正在充值单结束");
            break;
        }
        sleep(1000);
    }
};

// 外部调用
module.exports = new Submit();