/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-24 19:01:02
 * @LastEditTime: 2025-01-30 21:22:30
 * @Description:
 */
let SingleRequire = require('./SingleRequire.js')(runtime, global);
let { debug, logs, error, warn, info,} = SingleRequire('LogInfo')



let url='http://kk.smartapp.cc:8001'
// let url='http://localhost:8001'

function CurrentOrderCURD () {
  /**
  * 发送HTTP请求
  * @param {string} endpoint 请求的终端
  * @param {Object} data 请求的数据
  * @returns {Object} 响应的JSON对象
  */
  this.post=function(endpoint, data) {
    data=data || {}
    try {
      let requestUrl = url + endpoint;
      let response = http.postJson(requestUrl,data)
      if (response['statusCode']==200) {
        let responseBody = response.body.string();
        if (responseBody != null) {
          return JSON.parse(responseBody);
        }
      }
      return null;
    } catch (e) {
      error(e)
      
    }
  }
  this.get=function(endpoint) {
    try {
      let requestUrl = url + endpoint;
      let response = http.get(requestUrl)
      if (response['statusCode']==200) {
        let responseBody = response.body.string();
        if (responseBody != null) {
          return JSON.parse(responseBody);
        }
      }
      return null;
    } catch (e) {
      // error(e)
    }
  }
    /**
     *
     * @param {*} currentOrder
     * @returns true or false
     */
    this.add = function (currentOrder) {
      try {
        let resultJson = this.post("/open/feedov/list/add", currentOrder);
        if (resultJson) {
          if (resultJson.code !== 1000) {
            error(["增加数据出错：{}", JSON.stringify(resultJson)]);
          } else {
            logs(["数据增加：{}", resultJson["message"]]);
          }
          return resultJson.code == 1000;
        }
        return false;
      } catch (e) {
        error(["增加数据出错：{}", e]);
      }
    }
    /**
     *
     * @param {*} deleteItem={id:1,MFOrderNumber:666}一般只需要MFOrderNumber即可{MFOrderNumber:666}
     * @returns
     */
    this.delete = function (deleteItem) {
      try {
        let resultJson = this.post("/open/feedov/list/delete", deleteItem);
        if (resultJson) {
          if (resultJson.code !== 1000) {
            error(["删除数据出错：{}", JSON.stringify(resultJson)]);
          } else {
            logs(["数据删除：{}", resultJson["message"]]);
          }
          return resultJson.code == 1000;
        }
        return false;
      } catch (e) {
        error(["删除数据出错：{}", e]);
      }
    }

    /**
     *
     * @param {*} info 根据MFOrderNumber/phoneNumber/orderNumber查询
     * @returns 如果resultJson.code == 1000 返回查询得到的结果组成的数组
     */
    this.info = function (info) {
      try {
        let result = this.get("/open/feedov/list/info?id="+info);
        if (result) {
          return result;
          // if(result.code !== 1000){
          //      error(["查询数据出错：{}",JSON.stringify(result)]);
          //      return result //查询数据出错 { code: 400,message: 'invalid JSON, only supports object and array, check bodyParser config' }
          // }else{
          //   if(result["data"])return result["data"];
          //   else return result; //没查询到结果
          // }
        }
        return null //没网络
      } catch (e) {
        error(["查询数据出错：{}",e]);
      }
    }
    /**
     *
     * @param {number} page 第几页
     * @param {number} size 一页几个
     * @returns"page?page="+page+"&size="+size)
     */
    this.page = function (page,size) {
      let data={
        page:page,
        size:size
      }
      try {
        let result = this.post("/open/feedov/list/page",data);
        if (result) {
          return result;
        }
        return false
      } catch (e) {
        error(["查询数据出错：{}",e]);
      }
    }
    /**
     * 
     * @param {*} data 
     * @returns 
     * 范围查询{dateRange:[2024/07/10,2024/07/12]}，天数查询{date:2]}
     */
    this.list = function (data) {
      try {
        let result = this.post("/open/feedov/list/list",data);
        if (result) {
          return result;
        }
        return false
      } catch (e) {
        error(["查询数据出错：{}",e]);
      }
    }
    /**
     * 查询字典
     * @param {*} data {"types":["owner"]}
     * @returns 
     */
    this.dictData = function (data) {
      try {
        let result = this.post("/app/dict/info/data",data);
        if (result) {
          return result;
        }
        return false
      } catch (e) {
        error(["查询数据出错：{}",e]);
      }
    }


}


/**
     *
     * @param {"MFOrderNumber": "23110800015290","detail": "移动|黑龙江|100",} currentOrder 必须带有 MFOrderNumber的JSON格式
     * @returns {"code":1000,"message":"success"} code==1000为成功
     */
CurrentOrderCURD.prototype.update = function (currentOrder){
  try {
    let resultJson = this.post("/open/feedov/list/update", currentOrder);
    if (resultJson) {
      if (resultJson.code !== 1000) {
        error(["更新数据出错：{}", JSON.stringify(resultJson)]);
      } else {
        logs(["数据更新：{}", resultJson["message"]]);
      }
      return resultJson.code == 1000;
    }else{
      log('服务器更新数据失败',resultJson)
    }
    return false;
  } catch (e) {
    error(["更新数据出错：{}", e]);
  }
}

module.exports = new CurrentOrderCURD()