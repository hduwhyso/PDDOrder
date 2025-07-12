/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-14 18:35:33
 * @LastEditTime: 2024-07-09 05:52:46
 * @Description:
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-11 20:03:21
 * @LastEditTime: 2024-06-12 15:35:04
 * @Description:
 */
// let singletonRequire = require('../SingletonRequirer')(runtime, this)
// let { debug, logs, error, warn, info} = singletonRequire('LogInfo')


/**
 * PDD构造函数
 */
function PDD() {}

/**
 * 打开话费充值中心
 * 通过深链接启动拼多多的话费充值中心页面
 */
PDD.prototype.openRechargeCenter = function() {
    var intent = {
        data: "pinduoduo://com.xunmeng.pinduoduo/deposit.html",
    };
    app.startActivity(intent);
};
/**
 * 打开我的资料
 */
PDD.prototype.openPersonalProfile = function() {
    const int={
        data:"pinduoduo://com.xunmeng.pinduoduo/personal_profile.html?refer_page_name=personal",
    }
    app.startActivity(int);
};
/**
 * 打开我的订单-待付款
 */
PDD.prototype.openPeddingPayOrder = function() {
    const int={
        data:"pinduoduo://com.xunmeng.pinduoduo/orders.html?type=1&comment_tab=1&combine_orders=1&main_orders=1&refer_page_name=personal",
    }
    app.startActivity(int);
};

/**
 * 打开我的订单页面
 * 通过深链接启动拼多多的我的订单页面
 */
PDD.prototype.openMyOrder = function() {
    var intent = {
        data: "pinduoduo://com.xunmeng.pinduoduo/orders.html",
    };
    app.startActivity(intent);
};

/**
 * 根据订单编号打开订单详情页面
 * @param {string} orderNo - 订单编号
 * 通过深链接启动拼多多的订单详情页面
 */
PDD.prototype.openOrderDetail = function(orderNo) {
    var intent = {
        data: "pinduoduo://com.xunmeng.pinduoduo/order.html?order_sn=" + orderNo,
    };
    app.startActivity(intent);
};
/**
 * 根据订单编号打开订单详情页面
 * @param {string} orderNo - 订单编号
 * 通过深链接启动拼多多的订单详情页面
 */
PDD.prototype.openPDDSettingPage = function() {
    var intent = {
        data:"pinduoduo://com.xunmeng.pinduoduo/setting.html",
    };
    app.startActivity(intent);
};
// 导出PDD实例
module.exports = new PDD();