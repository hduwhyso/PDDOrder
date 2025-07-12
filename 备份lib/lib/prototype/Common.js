/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-09 09:56:38
 * @LastEditTime: 2024-06-10 21:36:57
 * @Description: 
 */
let singletonRequire = require('../SingletonRequirer')(runtime, this);
let { debug, logs, error, warn, info } = singletonRequire('LogInfo');

function Common() {}

// 将方法定义在构造函数的原型上

/** map转对象 */
Common.prototype.mapToObj = function(map) {
    const obj = Object.create(null);
    map.forEach((v, k) => {
        obj[k] = v;
    });
    return obj;
};

/** 时间戳转时间 */
Common.prototype.ts_to_time = function(timestamp) {
    // 时间格式：'2023-10-26 22:43:10'
    if (typeof timestamp === 'string') {
        timestamp = Number(timestamp);
    }
    if (typeof timestamp !== 'number') {
        alert("输入参数无法识别为时间戳");
        return;
    }
    let date = new Date(timestamp);
    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() + 1).toString().padStart(2, '0') + '-';
    let D = date.getDate().toString().padStart(2, '0') + ' ';
    let h = date.getHours().toString().padStart(2, '0') + ':';
    let m = date.getMinutes().toString().padStart(2, '0') + ':';
    let s = date.getSeconds().toString().padStart(2, '0');
    return Y + M + D + h + m + s;
};

/** 带音乐的提示 */
Common.prototype.alertWithMusic = function(text) {
    // 循环播放音乐
    media.playMusic("./res/青蛙叫声.wav", 1, true);
    // 让音乐播放完
    alert(text);
    // 暂停音乐播放
    media.pauseMusic();
};

/** 停止指定引擎 */
Common.prototype.engineStop = function(name) {
    try {
        engines.all().forEach(execution => {
            if (/\w*\.js/.exec(execution.getSource())[0] === name) {
                execution.forceStop();
            }
        });
    } catch (e) {
        error('engineStop', e);
    }
};

/**
 * 暂停所有正在运行的脚本引擎，除了当前脚本引擎。
 */
Common.prototype.pauseOtherEngines = function() {
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
Common.prototype.clickTextR = function(text,i) {
    try {
        let textBounds=textContains(text).visibleToUser(true).findOne(1000) || descContains(text).visibleToUser(true).findOne(1000)
        let limitX=device.width,limitY=device.height;
        /**防止没找到textBounds */
        if(!textBounds){ 
            log('点击【'+text+'】失败')
            return false;
        }
        textBounds=textBounds.bounds()
        let X=random(textBounds.left, textBounds.right)
        let Y=random(textBounds.top, textBounds.bottom)
        if(X<limitX && X>0 && Y<limitY && Y>0){
            sleep(500)
            press(X,Y,random(10,50))
            // log('点击【'+text+'】成功')
            return true;
        }else{
            log("超出屏幕范围，clickOnRandom拒绝执行",limitX,limitY,X,Y)
        }
    } catch (e) {
        error('clickTextR：', e);
    }
};

module.exports = new Common();