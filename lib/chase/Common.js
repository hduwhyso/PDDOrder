/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-09 09:56:38
 * @LastEditTime: 2025-02-14 23:13:24
 * @Description:
 */
let SingleRequire = require("./SingleRequire")(runtime, this);
let { debug, logs, error, warn, info } = SingleRequire("LogInfo");
let fileUtils = SingleRequire("FileUtils");
let {config:{root,shizuku,dict}}=require('../../config')(runtime, this)
let {widgetChecking}=SingleRequire('widgetUtils')

function Common() {
  this.shellOrShizuku = this.shellOrShizuku.bind(this);
  this.hasRootPermission = function () {
    return files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su");
  };
}
// 将方法定义在构造函数的原型上

/**是否有root权限 */
// Common.prototype.hasRootPermission = function () {
//     return files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
// }

Common.prototype.shellOrShizuku = function (cmd) {
  if (root) {
    let result = shell(cmd, true);
    if (result && result["code"] == 0) return true;
    else {
      if (shizuku) {
        $shizuku(cmd);
      }
    }
  } else if (shizuku) {
    $shizuku(cmd);
  } else {
    console.log("手机未root，也未开启$shizuku，停止");
    exit();
  }
};

/**忽略电池优化 */
Common.prototype.ignoreBatteryOptimization = function () {
  if (
    !context
      .getSystemService(context.POWER_SERVICE)
      .isIgnoringBatteryOptimizations(context.getPackageName()) &&
    device.sdkInt >= 23 &&
    device.sdkInt <= 29
  ) {
    //获取安卓api级别(安卓6以上引入了忽略电池优化功能)
    importClass(android.content.Intent);
    importClass(android.net.Uri);
    var intent = new Intent();
    intent.setAction("android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS");
    intent.setData(Uri.parse("package:" + context.getPackageName()));
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    try {
      context.startActivity(intent);
      let button = text("是").findOne(1000);
      if (button) {
        button.click();
      } else {
        button = text("允许").findOne(1000);
        if (button) {
          button.click();
        }
      }
      toastLog("已打开忽略电池优化");
    } catch (e) {
      console.error(e);
    }
  }
};

/** map转对象 */
Common.prototype.mapToObj = function (map) {
  const obj = Object.create(null);
  map.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
};


/**
 * 
 * @param {*} key 数组的值为对象，key是对象中的某个键
 * @param {*} descending 为false则升序，为true则降序
 * @returns 
 * 用法：array.sort(sortBy('age',true))根据对象中的某个键(age)降序排序
 */
Common.prototype.sortBy = function (key, descending) {
  descending = descending || false;
  return function (a, b) {
    let val1 = a[key];
    let val2 = b[key];
    if (descending) {
    return val2 - val1;
    } else {
    return val1 - val2;
    }
  };
};

/** 时间戳转时间 */
Common.prototype.ts_to_time = function (timestamp) {
  // 时间格式：'2023-10-26 22:43:10'
  if (typeof timestamp === "string") {
    timestamp = Number(timestamp);
  }
  if (typeof timestamp !== "number") {
    alert("输入参数无法识别为时间戳");
    return;
  }
  let date = new Date(timestamp);
  let Y = date.getFullYear() + "-";
  let M = (date.getMonth() + 1).toString().padStart(2, "0") + "-";
  let D = date.getDate().toString().padStart(2, "0") + " ";
  let h = date.getHours().toString().padStart(2, "0") + ":";
  let m = date.getMinutes().toString().padStart(2, "0") + ":";
  let s = date.getSeconds().toString().padStart(2, "0");
  return Y + M + D + h + m + s;
};

/** 带音乐的提示 */
Common.prototype.alertWithMusic = function (text) {
  // 循环播放音乐
  media.playMusic(fileUtils.getCurrentWorkPath() + "/res/青蛙叫声.wav", 1, true);
  // 让音乐播放完
  sleep(media.getMusicDuration());
  // 暂停音乐播放
  media.pauseMusic();
};

/** 停止指定引擎 */
Common.prototype.engineStop = function (name) {
  try {
    engines.all().forEach((execution) => {
      if (/\w*\.js/.exec(execution.getSource())[0] === name) {
        execution.forceStop();
      }
    });
  } catch (e) {
    error("engineStop", e);
  }
};
  /**
   * 杀死重复运行的同源脚本
   */
Common.prototype.killDuplicateScript = function () {
  let currentEngine = engines.myEngine()
  let runningEngines = null
  while (runningEngines === null) {
    // engines.all()有并发问题，尝试多次获取
    try {
      runningEngines = engines.all()
    } catch (e) {
      sleep(200)
    }
  }
  let runningSize = runningEngines.length
  let currentSource = currentEngine.getSource() + ''
  debug('当前脚本信息 id:' + currentEngine.id + ' source:' + currentSource + ' 运行中脚本数量：' + runningSize)
  if (runningSize > 1) {
    runningEngines.forEach(engine => {
      let compareEngine = engine
      let compareSource = compareEngine.getSource() + ''
      debug('对比脚本信息 id:' + compareEngine.id + ' source:' + compareSource)
      if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
        warn(['currentId：{} 退出运行中的同源脚本id：{}', currentEngine.id, compareEngine.id])
        // 直接关闭同源的脚本，暂时可以无视锁的存在
        engine.forceStop()
      }
    })
  }
};

/**
 * 暂停所有正在运行的脚本引擎，除了当前脚本引擎。
 */
Common.prototype.pauseOtherEngines = function () {
  // 获取当前脚本的引擎
  let currentEngine = engines.myEngine();
  // 获取所有正在运行的脚本引擎
  let allEngines = engines.all();
  // 遍历所有脚本引擎
  for (let i = 0; i < allEngines.length; i++) {
    let engine = allEngines[i];
    // 如果不是当前脚本的引擎，则关闭它
    if (engine !== currentEngine) {
      engine.forceStop();
    }
  }

  // 记录日志，提示已关闭除本脚本之外的其他脚本
  logs("已关闭除本脚本之外的其他脚本", true);
};

/** 点击文字 */
Common.prototype.clickTextR = function (keyword, strict) {
  strict=strict||false
  try {
    if (!keyword) {
      error("clickTextR传入参数错误为空");
      return false;
    }
    let textBounds=''
    if(strict){
      textBounds = text(keyword).visibleToUser(true).findOne(1000) || desc(keyword).visibleToUser(true).findOne(1000);
    }else{
      textBounds = textContains(keyword).visibleToUser(true).findOne(1000) || descContains(keyword).visibleToUser(true).findOne(1000);
    }
    let limitX = device.width,
      limitY = device.height;
    /**防止没找到textBounds */
    if (!textBounds) {
      debug("clickTextR点击【" + keyword + "】失败");
      return false;
    }
    textBounds = textBounds.bounds();
    let X = random(textBounds.left, textBounds.right);
    let Y = random(textBounds.top, textBounds.bottom);
    if (X < limitX && X > 0 && Y < limitY && Y > 0) {
      sleep(300);
      let ran = random(30, 50);
      press(X, Y, ran);
      // sleep(300)
      debug("clickTextR点击【" + keyword + "】成功 " + ran + "ms");
      return true;
    } else {
      error("超出屏幕范围，clickOnRandom拒绝执行", limitX, limitY, X, Y);
    }
  } catch (e) {
    error("clickTextR：", e);
  }
};
//是否存在text
Common.prototype.textExists = function (keyword) {
  if (textContains(keyword).visibleToUser(true).exists() || descContains(keyword).visibleToUser(true).exists()) {
    return true;
  } else {
    return false;
  }
};



//几天内的订单量
Common.prototype.ordersCountInDays = function (appId, days) {
  days= days || 1;
  let count = 0;
  let now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  for (let [, order] of orderMap) {
    let orderDate = new Date(Number(order.getOrderTs));
    if (orderDate >= startDate && orderDate <= endDate && order.rechargeID==appId && order.isSuccessful) {
      count++;
    }
  }
  return count;
};

//几天内的订单量（）
Common.prototype.ordersCountInHours = function (appId, hours) {
  let count = 0;
  let now = new Date();
  let startDate = new Date(now.getTime() - hours * 60 * 60 * 1000); // 24小时前的时间
  for (let [, order] of orderMap) {
    let orderDate = new Date(Number(order.getOrderTs));
    if (orderDate >= startDate && orderDate <= now && order.rechargeID == appId && order.isSuccessful) {
      count++;
    }
  }
  return count;
};
//本月订单量
Common.prototype.currentMonthOrdersCount = function (appId) {
  let count = 0;
  let now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  for (let [, order] of orderMap) {
    let orderDate = new Date(Number(order.getOrderTs));
    if (orderDate >= startDate && orderDate <= endDate && order.JDID==appId && order.isSuccessful) {
      count++;
    }
  }
  return count;
};

Common.prototype.searchDict=function(value,type){
  if (dict && dict[type]) {
    const dictresult = dict[type].find(v => v.value === value);
    return dictresult ? dictresult.name : null; // 假设字典对象的名称属性是label
  }
  return null
}
function getTodayTimestamps() {
  var now = new Date();
  var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
  return { startOfDay: startOfDay, endOfDay: endOfDay };
}

module.exports = new Common();
