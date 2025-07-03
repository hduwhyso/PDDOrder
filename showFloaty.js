/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-08 16:59:18
 * @LastEditTime: 2025-01-31 11:44:17
 * @Description:
 */

let SingleRequire = require('./lib/chase/SingleRequire.js')(runtime, global);
let {ignoreBatteryOptimization,pauseOtherEngines,killDuplicateScript} = SingleRequire('Common');
//开启无障碍
let enableAccessibility=SingleRequire('EnableAccessibility');
let retryCount=5
while(retryCount-->0){
    if (auto.service == null) {
      //开启无障碍
      enableAccessibility.disableAccessibilityAndRestart();
      sleep(3000);
      enableAccessibility.enabledAccessibility();
      sleep(3000);
    }else{
        break;
    }
}

/**忽略电池优化 */
ignoreBatteryOptimization();



let {killJDQQ } = SingleRequire('JD');
let infoFloaty = SingleRequire("InfoFloaty");
let controlPanel = SingleRequire("ControlPanelFloaty");
let fileUtils = SingleRequire('FileUtils')

killDuplicateScript()

infoFloaty.init();
controlPanel.init();

// 设置按钮点击事件
controlPanel.setButtonClickListener('show', () => {
    if (controlPanel.floatyWindow.show.getText() == "隐藏") {
        controlPanel.hide();
        infoFloaty.hide();
    } else {
        controlPanel.restore();
        infoFloaty.restore();
    }
});

controlPanel.setButtonClickListener('stop', () => {
    // 停止操作
    pauseOtherEngines();
    controlPanel.debugInfo('停止按钮被点击');
    controlPanel.restore();
});

controlPanel.setButtonClickListener('autoRun', () => {
        pauseOtherEngines();
    // 开始自动运行操作
        let source = fileUtils.getCurrentWorkPath() + '/core/executor.js'/**不用绝对路径，engine气动的脚本无法require */
        threads.start(function(){
        engines.execScriptFile(source, { path: source.substring(0, source.lastIndexOf('/')),arguments: { "infoFloaty": infoFloaty,"state": "waitOrder","controlPanel": controlPanel} });
        })
    controlPanel.debugInfo('开始按钮被点击');
});

controlPanel.setButtonClickListener('pay', () => {
    // 付款操作
    pauseOtherEngines();
    let source = fileUtils.getCurrentWorkPath() + '/core/executor.js'/**不用绝对路径，engine气动的脚本无法require */
    threads.start(function(){
        engines.execScriptFile(source, { path: source.substring(0, source.lastIndexOf('/')),arguments: { "infoFloaty": infoFloaty,"state": "pay","controlPanel": controlPanel} });
    })
    controlPanel.debugInfo('付款按钮被点击');
});

controlPanel.setButtonClickListener('forcestop', () => {
    // 强制停止操作
    threads.start(function () {
        killJDQQ();
        app.openAppSetting("com.jingdong.app.mall");
    });
    controlPanel.debugInfo('强停按钮被点击');
});

controlPanel.setButtonClickListener('setting', () => {
    controlPanel.hide();
    infoFloaty.hide();
    threads.start(function () {
        engines.execScriptFile("./可视化配置.js");
    });
});

controlPanel.setButtonClickListener('exit', () => {
    // 退出操作
    controlPanel.debugInfo('退出按钮被点击');
    controlPanel.close();
    infoFloaty.close();
    engines.stopAll();
    exit();
});

device.keepScreenOn()
device.setBrightnessMode(0) //返回当前亮度模式，0为手动亮度，1为自动亮度。
device.setBrightness(30)  //范围0~255

events.on("exit", function(){
    device.cancelKeepingAwake()
    device.setBrightnessMode(1) //返回当前亮度模式，0为手动亮度，1为自动亮度。
    log("结束运行");
});

/**保活 */
events.observeToast();
events.onToast(function(toast){
    log("Toast内容: " + toast.getText() + " 包名: " + toast.getPackageName());
});

