/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-06 12:11:39
 * @LastEditTime: 2024-10-02 15:13:06
 * @Description:
 * 1、得到新订单后，先数据库查询该号码以前是否有失败记录，有失败记录直接放弃
 */




let { config:{vender_id,vender,getOrderPer_MS} } = require('../config')(runtime, this)
// let SingleRequire = require('../lib/chase/SingleRequire.js')(runtime, global);
// let { debug, logs, error, warn, info } = SingleRequire('LogInfo');
let {updateOrder}= require('./APISubmit.js')
var mfsgdapi = SingleRequire('MFSGDAPI');
var curd = SingleRequire('CURD');


// let vender=[ { vender_id: 1021, vender_name: '话费活动api' },
// { vender_id: 1023, vender_name: '视频会员API' },
// { vender_id: 1024, vender_name: '话费官方api' },
// { vender_id: 1032, vender_name: '官方分省资源API' },
// { vender_id: 1039, vender_name: 'PDD渠道api代理' } ]

// 接收引擎参数：悬浮窗
// let args = engines.myEngine().execArgv;
// let infoFloaty = args.infoFloaty;


function WaitOrderAPI() {
    this.data={
        "vender_id": vender_id.toString(),
        "data": {
            "amount": currentVender["data"]["amount"],
            "operator_id":currentVender["data"]["operator_id"],
            "order_num": currentVender["data"]["order_num"],
            "prov_code": currentVender["data"]["prov_code"],
        }
    }
    this.quoteDate={
        "vender_id": vender_id.toString(),
        "data": {
            "amount": null,
            "operator_id":null,
            "user_quote_payment":null,
        }
    }
    this.exec = function () {
        currentOrder="";
        this.editUserQuote()/**报价 */
        while(true){
            let startTime=Date.now()
            // 深拷贝 this.data  防止this.data被修改
            // console.time("获取订单")
            let dataCopy = JSON.parse(JSON.stringify(this.data));
            let res=mfsgdapi.getOrder(dataCopy)
            if(res && res["message"]){
                if(res['code'] == 0){
                    if(this.checkPhoneNumber(res))break;
                }else{
                     infoFloaty.setProcessText(res["message"]);
                     if(res["message"].includes("频"))log(res["message"])
                     else if(res["message"].includes("最近30天")){log(res["message"]);exit()}
                }
                // log(startTime,res['stime'],Date.now(),res['etime'])
                // let sTime=res['stime']*1000-startTime//stime,stime
                // let eTime=Date.now()-res['stime']*1000
                let allTime=Date.now()-startTime
                // let allTime=sTime+eTime
                // log(sTime,eTime,allTime)
                if(allTime<getOrderPer_MS)sleep(getOrderPer_MS-allTime)
                infoFloaty.setProcessText(" ");
            }else{
                sleep(getOrderPer_MS)
            }
            // console.timeEnd("获取订单")
        }
        return currentOrder
    }
    this.editUserQuote=function () {
        let amountArr=currentVender["data"]["amount"].split(',')
        let operator_id=currentVender["data"]["operator_id"].split(',')
        // 构建查找表
        let lookup = {};
        currentVender["user_quote_payment"].forEach(entry => {
            let key = `${entry.amount}-${entry.operator_id}`;
            lookup[key] = entry.user_quote_payment;
        });
        // 初始化最终结果数组
        let finalData = [];
        // 遍历金额数组
        amountArr.forEach(amount => {
            // 遍历运营商数组
            operator_id.forEach(operator => {
                // 查找报价
                let key = `${amount}-${operator}`;
                let user_quote = lookup[key];
                // 生成最终的数组元素
                finalData.push({
                    amount: amount,
                    operator_id: operator,
                    user_quote_payment: user_quote
                });
            });
        });
            // 将 finalData 分批次处理，每次最多 10 个元素
        const batchSize = 10;
        const totalBatches = Math.ceil(finalData.length / batchSize);
        for (let i = 0; i < totalBatches; i++) {
            let batch = finalData.slice(i * batchSize, (i + 1) * batchSize);
            this.quoteDate['data']=batch
            let quoteDateCopy = JSON.parse(JSON.stringify(this.quoteDate));
            let response=mfsgdapi.editUserQuote(quoteDateCopy)
            if(response && response['data']){
                response['data'].forEach(item=>{
                    logs(['{}报价{}',item['spec_info'],item['user_quote_payment']])
                })
            }else{
                debug(response)
            }
        }
    }
    this.checkPhoneNumber = function (response) {
        let res=mfsgdapi.checkPhoneNumberStatus(response['data'][0]["target"])
        if(res){
            if (res["code"] == "200000") {
              res = res["data"];
              let exists = res.find(v => v.mobile == response["data"][0]["target"]);
            //   logs(exists)
              if (exists) {
                info(["验号结果：mobile: {}, area: {}, numberType: {},status: {}", exists["mobile"], exists["area"], exists["numberType"], exists["status"]]);
                if (exists["status"] == "1" || exists["status"] == "2") {
                    if(exists["numberType"].includes("物联网卡")){
                        infoFloaty.setWarnText(exists["numberType"]);
                        this.apiReportRefund(response,exists["numberType"]);
                        return false;
                    }
                  this.updateCurrentOrder(response);
                  return true;
                } else {
                    let rsp_info=['空号','实号','停机','库无','沉默号','风险号']//[ 0：空号 1：实号 2：停机 3：库无 4：沉默号 5：风险号]
                    logs(["status返回值：{}。【 0：空号 1：实号 2：停机 3：库无 4：沉默号 5：风险号】", exists["status"]]);

                    infoFloaty.setWarnText(rsp_info[exists["status"]]);
                  this.apiReportRefund(response,rsp_info[exists["status"]]);
                  return false;
                }
              } else {
                log("不可能吧");
              }
            } else {
                logs(res)
                if(res["code"] == "10001"){
                    warn('尚未购买该 API 或 API 调用次数已用完')
                }
              if (this.curdCheck(response)) return true;
              return false
            }
        }else {
            if (this.curdCheck(response)) return true;
            return false
          }
    }
    this.curdCheck = function (response) {
        let res=curd.info(response['data'][0]["target"])
            if(res){
                if(res['code']==1000){
                    if(res['data']){
                        if(res['data']['orderStatus'].includes('退款成功') ){
                            logs("退款单，直接放弃")
                            infoFloaty.setWarnText("退款单，直接放弃");
                            this.apiReportRefund(response)
                            return false
                        }else if(res['data']['orderStatus'].includes('分省充值关闭')){
                            logs("分省充值关闭")
                            infoFloaty.setWarnText("分省充值关闭");
                            this.apiReportRefund(response)
                            return false

                        }else if(res['data']['orderStatus'].includes('无法充值')){
                            logs("无法充值")
                            infoFloaty.setWarnText("无法充值");
                            this.apiReportRefund(response)
                            return false

                        }else{
                            this.updateCurrentOrder(response)
                            return true
                        }
                    }else{
                        this.updateCurrentOrder(response)
                        return true
                    }
                }else{
                    log('查询数据异常',res['message'])
                    this.updateCurrentOrder(response)
                    return true
                }
            }else{
                info('数据库服务器网络异常')
                this.updateCurrentOrder(response)
                return true

            }
    }
    //直接上报失败
    this.apiReportRefund = function(response,rsp_info){
        let data = {
            data: {
                user_order_id: response['data'][0]["user_order_id"],
                rsp_info: rsp_info || '未发货，退款成功',
                status: '8'
            }
        };
        if(updateOrder(data)){
            logs('放弃订单成功')
            // sleep(60000)
            return;
        }
        infoFloaty.setWarnText("上报失败订单失败");
        exit()//停止运行
    }
    this.updateCurrentOrder=function(res){
        logs('新订单')
        currentOrder = {
            rechargePlatform: currentVender['vender_name'] || null,//获取充值平台
            phoneNumber: res['data'][0]["target"],
            MFOrderNumber: res['data'][0]["user_order_id"],
            detail: res['data'][0]["target_desc"],// 获取订单详情
            orderNumber: null,
            isSuccessful: false,
            getOrderTs: res['data'][0]["create_time"]*1000,
            orderDeadlineTs: res['data'][0]["create_time"]*1000 + 10*60*1000,
            submitTs: null,
            paidCard: null,
            orderStatus: null,
            rechargeName:account,
        };
        infoFloaty.setSPNText(res['data'][0]["target"]);
        this.updateData(currentOrder);
    }

    this.updateData = function (currentOrder) {
        config.overwrite("currentOrder", currentOrder);
        threads.start(function(){curd.update(currentOrder)});
    }

}

module.exports = new WaitOrderAPI()

