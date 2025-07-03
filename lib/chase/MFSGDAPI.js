/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-26 08:45:52
 * @LastEditTime: 2024-08-18 13:39:10
 * @Description:
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-19 20:48:24
 * @LastEditTime: 2024-07-05 12:00:52
 * @Description:898347945  0984e869bdee2915
 */

let SingleRequire = require('./SingleRequire.js')(runtime, global)
let { debug, logs, error, warn, info} = SingleRequire('LogInfo')
let aes=SingleRequire("Aes")
// let base64=SingleRequire('Base64')

try {
    importPackage(Packages["okhttp3"])
  } catch (e) {
    //
  }
  try {
    importClass("okhttp3.OkHttpClient")
    importClass("okhttp3.FormBody")
    importClass("okhttp3.Request")
  } catch (e) {
    //
}
// let CryptoJS = require('./lib/crypto-js.js')



// let env='development'

let env='open'

function MFSGDAPI(){
    this.app_key = env === 'development' ? '898347945' : '87824377008';
    this.app_secret = env === 'development' ? '0984e869bdee2915' : '999fb937482c3808';
    this.orderIDQueryOrder = this.orderIDQueryOrder.bind(this);
    this.statusQueryOrder = this.statusQueryOrder.bind(this);
    this.editUserQuote = this.editUserQuote.bind(this);


    this.params=""
    this.request_url = env === 'development' ? 'http://test.shop.center.mf178.cn' : 'https://shop.task.mf178.cn';
    //计算签名
    this.getSign = function (params) {
        if (!params || !this.app_key || !this.app_secret) {
            throw new Error('参数错误');
        }
        params.app_key = this.app_key;
        params.timestamp = Math.floor(Date.now() / 1000);
        // params.timestamp=1720156410
        const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});
        let signString = '';
        for (let [k, v] of Object.entries(sortedParams)) {
            if (k !== 'sign') {
                signString += `${k}${v}`;
            }
        }
        signString += this.app_secret;
        params.sign = aes.md5(signString).toString();
        return params;
    }
    this.sendRequest=function(endpoint, data) {
      try {
        let requestUrl = this.request_url + endpoint;
        let response = http.postJson(requestUrl,data)
  
        if (response['statusCode']==200) {
          let responseBody = response.body.string();
          if (responseBody != null) {
            return JSON.parse(responseBody);
          }
        }
        return null;
      } catch (e) {
          console.log("网络故障",e)
      }
  }
//autox 用不了
    // this.sendRequest=function(endpoint, data) {
    //     try {
    //         const client = new OkHttpClient.Builder().build();
    //         let requestUrl = this.request_url + endpoint;
    //         // debug(requestUrl)
    //         let requestBody = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), JSON.stringify(data));
    //         let request = new Request.Builder()
    //           .addHeader("Content-Type", "application/json")
    //           .url(requestUrl)
    //           .post(requestBody)
    //           .build();
    //         let response = client.newCall(request).execute();
    //         if (response.isSuccessful()) {
    //           let responseBody = response.body().string();
    //           if (responseBody != null) {
    //             return JSON.parse(responseBody);
    //           }
    //         }
    //         return null;
    //     } catch (e) {
    //         console.log("网络故障",e)
    //     }
    // }

    /**
     * 订单查询
    */
    this.queryOrder = function (data) {
      try {
        if (!data || !data.data || typeof data.data !== "object") {
          throw new Error("参数错误");
        }
        data.data = JSON.stringify(data.data);
        const params = this.getSign(data);
        let result = this.sendRequest("/userapi/sgd/queryOrder", params);
        if (result) {
          return result;
        } else {
          return null; //网络故障
        }
      } catch (e) {
        error(["updateStatus报错了{}", e]);
      }
    };

}
/**空号检测 */
MFSGDAPI.prototype.checkPhoneNumberStatus = function (phoneNumber) {
  try {
    
    let requestUrl = "https://eolink.o.apispace.com/konghao/batch-ucheck";
    let data={
      "mobiles": phoneNumber,
      "type": ""
   };
   let header={
    headers: {
       "X-APISpace-Token":"9pg1ww8taca810730hannrwl1g9umme1",
       "Content-Type":""
    },
 };
  //  data.mobiles = JSON.stringify(data.mobiles);

    let response = http.post(requestUrl,data,header)

    if (response['statusCode']==200) {
      let responseBody = response.body.string();
      if (responseBody != null) {
        return JSON.parse(responseBody);
      }
    }
    return null;
    
  } catch (e) {
    error(["updateStatus报错了{}", e]);
  }
};

// 上报话费渠道报价
MFSGDAPI.prototype.editUserQuote = function (data) {
  try {
    if (!data || !data.vender_id || !data.data || typeof data.data !== "object") {
      debug(["getOrder哪里错{}{}{}{}", !data, !data.vender_id, !data.data, typeof data.data !== "object"]);
      throw new Error("参数错误");
    }
    data.data = JSON.stringify(data.data);
    let params = this.getSign(data);
    let result = this.sendRequest("/userapi/sgd/editUserQuote", params);
    return result;
  } catch (e) {
    error(["updateStatus报错了{}", e]);
  }
};
// 下单
MFSGDAPI.prototype.getOrder = function (data) {
  try {
    if (
      !data ||
      !data.vender_id ||
      !data.data ||
      typeof data.data !== "object"
    ) {
      debug([
        "getOrder哪里错{}{}{}{}",
        !data,
        !data.vender_id,
        !data.data,
        typeof data.data !== "object",
      ]);
      throw new Error("参数错误");
    }
    data.data = JSON.stringify(data.data);
    let params = this.getSign(data);
    let result = this.sendRequest("/userapi/sgd/getOrder", params);
    // if (result.code !== 0) {
    //     log(result)
    //     // throw new Error(result.message);
    // }
    return result;
  } catch (e) {
    error(["updateStatus报错了{}", e]);
  }
};

// 获取用户渠道
MFSGDAPI.prototype.getVender = function (data) {
  try {
    const params = {
      data: JSON.stringify(data),
    };
    const signedParams = this.getSign(params);
    // signedParams=base64.encode( JSON.stringify(signedParams))
    let result = this.sendRequest("/userapi/sgd/getVender", signedParams);
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    return result.data || {};
  } catch (e) {
    error(["updateStatus报错了{}", e]);
  }
};

// 上报充值结果
MFSGDAPI.prototype.updateStatus = function (data) {
    try {
        if (!data || !data.data || typeof data.data !== 'object') {
            debug(Boolean(!data),Boolean(!data.data),Boolean(typeof data.data !== 'object'))
            throw new Error('参数错误');
        }

        data.data = JSON.stringify(data.data);
        const params = this.getSign(data);
        let result = this.sendRequest("/userapi/sgd/updateStatus", params);
        // debug(result)
        if(result){
            return result
        }else{
            return null
        }
    } catch (e) { error(['updateStatus报错了{}',e]);}
}

/**
 * 根据订单号查询
*/
//res["data"][0]
MFSGDAPI.prototype.orderIDQueryOrder = function (MFOrderNumber) {
  try {
    let data = {
      data: {
        user_order_id: MFOrderNumber,
      },
    };
    let result = this.queryOrder(data);
    if (result) {
      return result;
    } else {
      return null;
    }
  } catch (e) {
    error(["orderIDQueryOrder报错了{}", e]);
  }
};
/**
 * 根据状态码查询
*/

MFSGDAPI.prototype.statusQueryOrder = function (status) {
  try {
    let data = {
      data: {
        status: status,
      },
    };
    let result = this.queryOrder(data);
    if (result) {
      return result;
    } else {
      return null;
    }
  } catch (e) {
    error(["updateStatus报错了{}", e]);
  }
};

module.exports=new MFSGDAPI()