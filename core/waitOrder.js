/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2023-11-13 10:33:56
 * @LastEditTime: 2024-07-23 16:59:26
 * @Description:
 */



let {storage_name: storage_name } = require('../config')(runtime, this)
var storage = storages.create(storage_name);
let SingleRequire = require('../lib/chase/SingleRequire.js')(runtime, global);
let { debug, logs, error, warn, info } = SingleRequire('LogInfo');
var currentOrderCURD = SingleRequire('CURD');
let { getPhoneNumber } = SingleRequire('JD');
let { countTodayEntries,clickTextR,textExists } = SingleRequire('Common');
// var orderMap = storage.get("orderMap") ? new Map(Object.entries(storage.get("orderMap"))) : new Map();

// 接收引擎参数：悬浮窗
let args = engines.myEngine().execArgv;
let infoFloaty = args.infoFloaty;

function WaitOrder(orderMap) {
    this.isstable=false//脚本是否完整运行完成
    this.orderMap=orderMap
    this.currentOrder="";

    /**
     * 主执行函数，判断当前页面状态并处理订单
     */
    this.exec = function () {
        this.processButton=""
        this.currentOrder=storage.get("currentOrder") || ""; // 目前正在付款订单
        try {
            if (!textContains("待上传凭证").exists()) {
                this.navigateToOrderPage(); // 导航到订单页面
                this.processOrder(); // 处理订单
                // return this.currentOrder
            } else if (textContains("待上传凭证").exists() && textContains("充值账号").exists()) {
                this.processOrder(); // 处理订单
                // return this.currentOrder
            } else {
                this.isstable=false//脚本是否完整运行完成
                warn("waitOrder,未知错误1");
                // return null
            }
            if(this.isstable){return this.currentOrder}else{return null}
        } catch (e) {
            error(e);
            return null
        }
    };

    /**
     * 导航到订单页面
     */
    this.navigateToOrderPage = function () {
        try {
            //正常的订单巡逻
            while (true) {
                if (textContains("待上传凭证").exists() || (textContains("api代理").exists() && textContains("我已充，未到账").exists())) break;

                // if (textContains("我已充，未到账").exists()){
                //     back();
                //     this.waitForBuffering();
                //     break;
                // }

                if (textContains("基本信息").exists() && textContains("订单详情").exists() && !textContains("待上传凭证").exists()){
                    back();
                    sleep(1000);
                    this.waitForBuffering();
                    sleep(5000);
                }
                let processButton=textContains("进行中").visibleToUser(true).findOne(1000)//必须在处理中前面
                if(processButton){
                    clickTextR("进行中")
                    // processButton.click()
                    this.waitForBuffering();
                }
                // if (textContains("进行中").exists() && !textContains("加载").visibleToUser(true).exists()){
                // }
                if (textContains("处理中").exists())break;//看到订单跳出
                sleep(5000);
            }
            debug("有订单")
            for (let i = 0; i < textContains("查看详情").visibleToUser(true).boundsInside(0, device.height / 8, device.width, device.height).find().length; i++) {
                let details = textContains("查看详情").visibleToUser(true).boundsInside(0, device.height / 8, device.width, device.height).find();
                if (textContains("处理中").exists()) {
                    details[details.length - i-1].click()
                    textContains('详细信息').findOne();
                }
                if (textContains("待上传凭证").exists() || (textContains("api代理").exists() && textContains("我已充，未到账").exists())) break;
                logs("有异常单干扰");
                back();
                this.waitForBuffering(); // 等待缓冲结束
                let processButton=textContains("进行中").visibleToUser(true).findOne(1000)//必须在处理中前面
                if(processButton){
                    clickTextR("进行中")
                    // processButton.click()
                    this.waitForBuffering();
                }
                this.waitForBuffering(); // 等待缓冲结束
                sleep(300);
                if(details.length-1 == i) this.navigateToOrderPage()//有异常单干扰,循环此过程
            }
        } catch (error) {
            log(error)
        }
    };

    /**
     * 等待缓冲结束
     */
    this.waitForBuffering = function () {
        sleep(300)
        while (textContains("(0)").find().length == 5 && !textExists("没有更多数据"));
        // debug("缓冲结束");
    };

    /**
     * 处理订单
     */
    this.processOrder = function () {
        let scriptPhoneNumber = getPhoneNumber();
        if (scriptPhoneNumber) {
            this.confirmPhoneNumber(scriptPhoneNumber); // 确认电话号码并处理订单
        } else {
            logs("脚本未识别到号码");
        }
    };

    /**
     * 确认电话号码并处理订单
     * @param {string} number - 识别到的电话号码
     */
    this.confirmPhoneNumber = function (number) {
        info("脚本识别号码：" + number);
        try {
            if (!this.isValidPhoneNumber(number)) {
                infoFloaty.setSPNText("号码识别错误");
                return;
            }
            infoFloaty.setSPNText(number);
            let MFOrderNumber = this.getMFOrderNumber(); // 获取蜜蜂订单号
            if(MFOrderNumber){
                let currentNumberStatus = this.getCurrentNumberStatus(number); // 获取当前电话号码的订单状态
                if (this.currentOrder && this.currentOrder["MFOrderNumber"] && this.currentOrder["MFOrderNumber"] != MFOrderNumber) {
                    this.currentOrder = this.orderMap.get(MFOrderNumber);
                }// 首次订单currentOrder=undefined

                if (this.currentOrder) {
                    this.handleExistingOrder(number, currentNumberStatus); // 处理已有订单
                } else {
                    this.handleNewOrder(number, currentNumberStatus); // 处理新订单
                }
            }
        } catch (e) {
            error(e);
        }
    };

    /**
     * 验证电话号码格式
     * @param {string} number - 要验证的电话号码
     * @returns {boolean} - 是否为有效的电话号码
     */
    this.isValidPhoneNumber = function (number) {
        let phoneNumberReg = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
        return phoneNumberReg.test(number);
    };

    /**
     * 获取蜜蜂订单号
     * @returns {string} - 蜜蜂订单号
     */
    this.getMFOrderNumber = function () {
        let MFOrderNumberReg = /\d{14}$/;
        let MFOrderNumber=textMatches(MFOrderNumberReg).findOne(1000)
        if(!MFOrderNumber){
            logs("蜜蜂单号获取失败，重新获取")
            back();
            this.exec()
            return null
        }
        return MFOrderNumber.text();
    };

    /**
     * 获取当前电话号码的订单状态
     * @param {string} number - 电话号码
     * @returns {string} - 当前电话号码的订单状态
     */
    this.getCurrentNumberStatus = function (number) {
        let currentNumberStatus = "";
        Array.from(this.orderMap.values()).some(currentValue => {
            if (currentValue.phoneNumber === number) {
                if (["退款中", "正在充值"].includes(currentValue.orderStatus)) {
                    currentNumberStatus = currentValue.orderStatus;
                }
            }
            return currentValue.phoneNumber === number;
        });
        return currentNumberStatus;
    };

    /**
     * 处理已有订单
     * @param {string} number - 电话号码
     * @param {string} currentNumberStatus - 当前电话号码的订单状态
     */
    this.handleExistingOrder = function (number, currentNumberStatus) {
        if (this.currentOrder && this.currentOrder.isSuccessful) {
            alert("此订单付款已成功，订单状态显示" + this.currentOrder.orderStatus + "，请仔细核对\n如需继续做单，请手动做单");
            return;
        } else if (!this.currentOrder.isSuccessful && !this.orderMap.has(this.currentOrder.MFOrderNumber)) {
            console.log("继续之前未成功订单");
            this.isstable=true
        } else if (!this.currentOrder.isSuccessful && this.orderMap.has(this.currentOrder.MFOrderNumber)) {
            if (["退款中", "正在充值"].includes(currentNumberStatus)) {
                this.abandonOrder(number, currentNumberStatus); // 放弃订单
            } else {
                info("老号码新订单:" + number);
                this.isstable=true
            }
        } else {
            warn("还有啥情况我没考虑到？");
        }
        // events.broadcast.emit("SOP", "startPlaceOrder", currentOrder);
    };

    /**
     * 处理新订单
     * @param {string} number - 电话号码
     * @param {string} currentNumberStatus - 当前电话号码的订单状态
     */
    this.handleNewOrder = function (number, currentNumberStatus) {
        if (this.currentOrder && this.orderMap.has(this.currentOrder.MFOrderNumber)) {
            if (["退款中", "正在充值"].includes(currentNumberStatus)) {
                this.abandonOrder(number, currentNumberStatus); // 放弃订单
            } else {
                info("老号码新订单:" + number);
            }
        } else {
            logs("新订单:" + number);
            let { getOrderTs, orderDeadlineTs } = this.getOrderTimestamps(); // 获取订单时间戳
            this.currentOrder = {
                rechargePlatform:this.getRechargePlatform(),//获取充值平台
                phoneNumber: number,
                MFOrderNumber: this.getMFOrderNumber(),
                detail: this.getDetailedInfo (),// 获取订单详情
                orderNumber: null,
                isSuccessful: false,
                getOrderTs: getOrderTs,
                orderDeadlineTs: orderDeadlineTs,
                orderTs: null,
                payTs: null,
                submitTs: null,
                paidCard: null,
                orderStatus: null,
                JDID: null,
            };
            this.isstable=true
            this.updateData(this.currentOrder)
        }
    };

    this.updateData = function (currentOrder) {
        storage.put("currentOrder", currentOrder);
        threads.start(function(){currentOrderCURD.update(currentOrder)})
    }

    /**
     * 放弃订单
     * @param {string} number - 电话号码
     * @param {string} currentNumberStatus - 当前电话号码的订单状态
     */
    this.abandonOrder = function (number, currentNumberStatus) {
        // media.playMusic("./res/超级马里奥游戏跳跃音效.mp3", 0.3);
        device.vibrate(1000);
        info(currentNumberStatus + "的单子自动放弃：" + number, true);
        textContains("放弃订单").findOne().click();
        textContains("确定要放弃充值吗").waitFor();
        click("确定");
        back();
        sleep(200);
        this.exec(); // 重新执行主函数
    };

    /**
     * 获取订单时间戳
     * @returns {Object} - 包含获取订单时间和订单截止时间的对象
     */
    this.getOrderTimestamps = function () {
        let MFOrderTimeReg = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
        let ar = [];
        textMatches(MFOrderTimeReg).find().forEach(item => {
            ar.unshift(Number(new Date(item.text().replace(/-/g, "/"))));
        });

        let getOrderTs = ar[0];
        let orderDeadlineTs = ar[0];
        ar.forEach(ts => {
            if (ts < getOrderTs) {
                getOrderTs = ts;
            }
            if (ts > orderDeadlineTs) {
                orderDeadlineTs = ts;
            }
        });

        return {
            getOrderTs: getOrderTs,
            orderDeadlineTs: orderDeadlineTs
        };
    };

    /**
     * 获取详细信息
     * @returns {string} - 详细信息
     */
    this.getDetailedInfo  = function () {
        let detailReg = /.*\|.*\|.*/;
        return textMatches(detailReg).findOne(1000).text();
    };
    /**
     * 获取充值平台
     * @returns {string} - 充值平台
     */
    this.getRechargePlatform  = function () {
        let rechargeReg = /\【.*\】.*/;
        let button=textMatches(rechargeReg).findOne(1000)
        if(button)return button.text();

        let rechargeReg2=/.*\-(.*)\-.*/
        let button2=textMatches(rechargeReg2).findOne(1000)
        if(button2) return button2.text().match(rechargeReg2)[1];
        //都失败就返回null
        return null
    };
}

module.exports = function(orderMap) {
    return new WaitOrder(orderMap); // 返回新的 WaitOrder 实例
};

// module.exports=WaitOrder;
// 创建 WaitOrder 实例并执行主函数
// let waitOrder = new WaitOrder();
// waitOrder.exec(); // 执行主函数，判断当前页面状态并处理订单