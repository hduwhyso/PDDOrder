/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-05 18:53:59
 * @LastEditTime: 2025-02-15 12:59:17
 * @Description:
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-02-22 18:21:52
 * @LastEditTime: 2024-07-04 19:13:04
 * @Description:
 */

// var currentOrderCURD = SingleRequire('CURD');
let ocrText=null
if(ocr==="PaddleOcr"){
    ocrText=SingleRequire("PaddleOcr")
}else if(ocr==="MlkitOcr"){
    ocrText=SingleRequire("MlkitOcr")
}
let status = ["充值到账", "未发货，退款成功", "支付成功，等待到账", "申请售后成功，退款中"];
var mfsgdapi = SingleRequire('MFSGDAPI');

/**
 * SubmitAPI构造函数
 */
function SubmitAPI() {
    this.phoneNumber = "";
    this.imgBase64 = "";
    this.comparePhoneNumber = "";
    this.compareorderNumber = "";
    this.allWords = "";
    this.limit=null;//

    // 绑定this上下文
    this.apiReportSuccess = this.apiReportSuccess.bind(this);
    this.apiReportRefund = this.apiReportRefund.bind(this);
    this.apiReporInProgress = this.apiReporInProgress.bind(this);
    this.init = this.init.bind(this);
    
    // this.updateData = function () {
    //     config.overwrite("currentOrder", currentOrder);
    //     threads.start(function () {
    //         currentOrderCURD.update(currentOrder);
    //     });
    // };

    this.updateOrder=function(data){
        this.limit=100;
        while (this.limit-- > 0) {
            let dataCopy = JSON.parse(JSON.stringify(data));
            let res = mfsgdapi.updateStatus(dataCopy);
            /**判断网络是否正常 */
            if (res) {
              /**判断返回状态 */
              if (res["code"] == 0) {
                if (res["data"]["status"] == 8 || res["data"]["status"] == 9) {
                    currentOrder["submitTs"] = res["data"]["rsp_time"] * 1000;
                    // this.updateData();
                    return true;
                } else {
                  debug(["上报出现异常，请想对策：{}", res]);
                }
              } else if (res["code"] == 1) {
                debug(["上报好像有问题:{}", res["message"]])
                let result = mfsgdapi.orderIDQueryOrder(currentOrder["MFOrderNumber"]);
                if (result) {
                  if (result["data"][0]["status"] == 8 || result["data"][0]["status"] == 9) {
                    currentOrder["submitTs"] = res["data"]["rsp_time"] * 1000;
                    // this.updateData();
                    return true;
                  }
                }
              } else {
                debug(["蜜蜂搞事情:{}", res]);
              }
            } else {
            }
            sleep(1000);
        }
          return false;
    }
}

/**
 * 初始化方法
 */
SubmitAPI.prototype.init = function () {
    this.phoneNumber = currentOrder['phoneNumber'];
    this.orderNumber = currentOrder['orderNumber'];

    // 读取图片
    var img = images.read("/sdcard/currentOrder.jpg");

    // 对图片进行操作
    this.imgBase64 = "data:image/jpg;base64," + images.toBase64(img, "jpg", 20);
    // img=images.clip(img, 0, 0, device.width, device.height/2);
    img = images.resize(img, [img.getWidth() * 2, img.getHeight() * 2],'CUBIC')
    img = images.threshold(img, 250, 255, "BINARY"); //二值化250以下的变成黑色，250以上的变成白色
    this.allWords = ocrText.ocrAllText(img);
    let matches = this.phoneNumber.match(/(\d{3})(\d{4})(\d{4})/);
    let part1 = matches[1];
    let part2 = matches[2];
    let part3 = matches[3];

    // 回收图片
    img.recycle();

    // 比对电话号码和订单号
    this.comparePhoneNumber = this.allWords.includes(this.phoneNumber.replace(/\s+/g, '')) || (this.allWords.includes(part1) && this.allWords.includes(part2) && this.allWords.includes(part3));
    this.compareorderNumber = this.allWords.includes(this.orderNumber.replace(/\s+/g, ''));
    debug(["充值号码[{}]比对结果：{}；订单号[{}]比对结果：{}", this.phoneNumber,this.comparePhoneNumber,this.orderNumber,this.compareorderNumber]);
};


/**
 * 上报充值成功的订单
 */
SubmitAPI.prototype.apiReportSuccess = function (rsp_info) {
    // 初始化
    this.init();
    if (!currentOrder["isSuccessful"]) {
        infoFloaty.setWarnText("正在上报未付款订单");
        debug(['蜜蜂单号：{}',currentOrder['MFOrderNumber']])
        exit()
    }
    if (this.comparePhoneNumber || this.compareorderNumber) {
        let data = {
            data: {
                user_order_id: currentOrder['MFOrderNumber'],
                rsp_info: rsp_info || '充值到账',
                status: '9',
                voucher: this.imgBase64
            }
        };
        debug(["{}开始上报：{}", data['data']['user_order_id'], data['data']['rsp_info']])
        infoFloaty.setProcessText("开始上传凭证上报成功");
        if(this.updateOrder(data)){
            return true
        }else{
            infoFloaty.setWarnText("上报充值到账失败");
            return false;
        }
        exit()//停止运行
    }else{
        warn("比对充值号码和订单号失败")
        infoFloaty.setWarnText("OCR比对失败");
        exit()
    }
};

/**
 * 上报退款中的订单
 *
 *
 */
SubmitAPI.prototype.apiReportRefund = function (rsp_info) {
    // 初始化
    if(!rsp_info){this.init();}//特殊情况的上报失败就不用执行init了
    if (rsp_info || (this.comparePhoneNumber && this.compareorderNumber)) {
        let data = {
            data: {
                user_order_id: currentOrder['MFOrderNumber'],
                rsp_info: rsp_info || '未发货，退款成功',
                status: '8'
            }
        };
        debug(["{}开始上报：{}", data['data']['user_order_id'], data['data']['rsp_info']])
        // infoFloaty.setProcessText("开始上报失败");
        if(this.updateOrder(data)){
            return true
        }else{
            infoFloaty.setWarnText("上报失败订单失败");
            return false;
        }
    }
};

/**
 * 等待到账的订单
 */
SubmitAPI.prototype.apiReporInProgress = function () {
    // 初始化
    this.init();

    if (this.comparePhoneNumber  && this.compareorderNumber) {
        log("等待到账订单，还没想好怎么处理");
        infoFloaty.setWarnText("卡单");
        exit()
    }
};

// 外部调用
module.exports = new SubmitAPI();
