/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-22 18:17:54
 * @LastEditTime: 2024-07-07 14:31:11
 * @Description:
 */

let SingleRequire = require('./lib/chase/SingleRequire.js')(runtime, global);
let mfsgdapi=SingleRequire("MFSGDAPI")
let curd=SingleRequire("CURD")
let { countTodayEntries,clickTextR,textExists } = SingleRequire('Common');
let {openRechargeCenter,openMyOrder,openOrderDetail}=SingleRequire("PDD")


let data={
    data: {
        status: '998',  //
    },
}

let res=mfsgdapi.queryOrder(data)
let peddingOrder=[]


if(res && res.length){
    res.forEach(item=>{
        if(item['status']==7){
            let res=curd.info(item['user_order_id'])
            if(res){
                if(res['code']==1000){
                    if(res['data']){
                        delete res['data']['createTime']
                        delete res['data']['updateTime']
                        peddingOrder.push(res['data'])
                    }else{
                        log('数据库无此数据')
                    }
                }else{
                    log('查询数据异常',res['message'])
                }
            }
        }
    })
}
// log(peddingOrder)

let isDual=true,account='';

let status = ["充值到账", "未发货，退款成功", "支付成功，等待到账"];

if(peddingOrder[0]){
    isDual==true;
    account=peddingOrder[0]["JDID"]

    reOpenOrderDetail(peddingOrder[0]['orderNumber'],100);
    if(textExists('未发货，退款成功')){
        log('订单已退款，上报失败')
        let data = {
            data: {
                user_order_id: peddingOrder[0]['MFOrderNumber'],
                rsp_info: '未发货，退款成功',
                status: '8'
            }
        };
        let res = mfsgdapi.updateStatus(data);
        if (res['status'] == 8) {
            log('放弃退款单成功')
        } else {
            log(["上报退款订单出现异常，请想对策：{}", res]);
        }

    }else{
        log('其他还愿意，看看')
    }
}


function reOpenOrderDetail(orderNumber,limit){
    while(limit-- > 0){
        openOrderDetail(orderNumber)
        sleep(300)
        if(isDual){
            log(account)
            let accountButton=desc(account).findOne(10000)
            clickTextR(accountButton.desc())
        }
        let moreButton=textContains("查看更多").findOne(5000)
        if(moreButton)return
    }
    log('进入订单失败')
    exit()
}