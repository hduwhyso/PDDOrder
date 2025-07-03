/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2023-11-12 18:59:23
 * @LastEditTime: 2024-08-04 22:24:37
 * @Description:
 */

// let { config: _config } = require('../../config.js')(runtime, global)
let _debugInfo = typeof debugInfo === 'undefined' ? (v) => console.verbose(v) : debugInfo
let _errorInfo = typeof errorInfo === 'undefined' ? (v) => console.error(v) : errorInfo
let ControlPanelFloaty = function () {
  this.floatyWindow = null
  this.floatyInitStatus = false
  this.floatyLock = null
  this.floatyCondition = null
  this.showLog = false

  this.oldPosition = null

  this.debugInfo = function (content) {
    this.showLog && _debugInfo(content)
  }
}
ControlPanelFloaty.prototype.init = function () {
  if (this.floatyInitStatus) {
    return true
  }
  this.floatyLock = threads.lock()
  this.floatyCondition = this.floatyLock.newCondition()
  let _this = this
  threads.start(function () {
    // 延迟初始化，避免死机
    sleep(400)
    _this.floatyLock.lock()
    try {
      if (_this.floatyInitStatus) {
        return true
      }
      _this.floatyWindow = floaty.rawWindow(
        <horizontal id="controlPanel">
            <vertical  w="60sp" h="auto" bg="#00000000" gravity="center|top">
                <button id="show" text="隐藏" h="40" w="60sp" />
                <button id='stop' text="停止" h="40" w="60sp"/>
                <button id="autoRun" text="开始" h="40" w="60sp" />
                <button id="pay" text="付款" h="40" w="60sp" />
                <button id="forcestop" text="强停" h="40" w="60sp"/>
                <button id="setting" text="设置" h="40" w="60sp"/>
                <button id="exit" text="退出" h="40" w="60sp"/>
            </vertical>
        </horizontal>
    );
      ui.run(function () {

        _this.floatyWindow.setSize(160,760);
        _this.floatyWindow.setPosition(0,800)   //设置位置（x，y）Math.trunc(device.height /12)
        _this.floatyWindow.setTouchable(true)//false触摸穿透，true不穿透
      })
      _this.floatyInitStatus = true

    } catch (e) {
      _errorInfo('悬浮窗初始化失败' + e)
      _this.floatyWindow = null
      _this.floatyInitStatus = false
    } finally {
      _this.floatyCondition.signalAll()
      _this.floatyLock.unlock()
    }
  })
  this.floatyLock.lock()
  try {
    if (this.floatyInitStatus === false) {
      this.debugInfo('等待悬浮窗初始化')
      this.floatyCondition.await()
    }
  } finally {
    this.floatyLock.unlock()
  }
  this.debugInfo('悬浮窗初始化' + (this.floatyInitStatus ? '成功' : '失败'))
  return this.floatyInitStatus
}

ControlPanelFloaty.prototype.close = function () {
  if (this.floatyInitStatus) {
    this.floatyLock.lock()
    try {
      if (this.floatyWindow !== null) {
        this.floatyWindow.close()
        this.floatyWindow = null
      }
      this.floatyInitStatus = false
    } finally {
      this.floatyLock.unlock()
    }
  }
}

/**调用悬浮窗的时候设置按钮点击事件 */
ControlPanelFloaty.prototype.setButtonClickListener = function(buttonId, listener) {
  if (this.floatyInitStatus && this.floatyWindow) {
    ui.run(() => {
      this.floatyWindow[buttonId].click(listener);
    });
  } else {
    _errorInfo('悬浮窗未初始化或初始化失败');
  }
};


ControlPanelFloaty.prototype.setFloatyPosition = function (x, y, option) {
  this.setFloatyInfo({ x: x, y: y }, null, option)
}


ControlPanelFloaty.prototype.setTouchable = function (touchable) {
  this.setFloatyInfo(null, null, { touchable: touchable })
}

ControlPanelFloaty.prototype.createNewInstance = function () {
  let newInstance = new ControlPanelFloaty()
  while (!newInstance.init()) {
    newInstance = new ControlPanelFloaty()
  }
  newInstance.setFloatyPosition(-100, -100)
  return newInstance
}

ControlPanelFloaty.prototype.hide = function () {
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    try {
      _this.floatyWindow.controlPanel.show.setText("显示");
      _this.floatyWindow.controlPanel.stop.setVisibility(8);
      _this.floatyWindow.controlPanel.autoRun.setVisibility(8);
      _this.floatyWindow.controlPanel.pay.setVisibility(8);
      _this.floatyWindow.controlPanel.forcestop.setVisibility(8);
      _this.floatyWindow.controlPanel.setting.setVisibility(8);
      _this.floatyWindow.controlPanel.exit.setVisibility(8);
      _this.floatyWindow.setSize(160,130);
    } finally {
      _this.floatyLock.unlock()
    }
  })
}
ControlPanelFloaty.prototype.hideExceptStop = function () {
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    try {
      _this.floatyWindow.controlPanel.stop.setVisibility(0);
      _this.floatyWindow.controlPanel.show.setVisibility(8);
      _this.floatyWindow.controlPanel.autoRun.setVisibility(8);
      _this.floatyWindow.controlPanel.pay.setVisibility(8);
      _this.floatyWindow.controlPanel.forcestop.setVisibility(8);
      _this.floatyWindow.controlPanel.setting.setVisibility(8);
      _this.floatyWindow.controlPanel.exit.setVisibility(8);
      _this.floatyWindow.setSize(160,130);
    } finally {
      _this.floatyLock.unlock()
    }
  })
}

ControlPanelFloaty.prototype.restore = function() {
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    try {
      _this.floatyWindow.controlPanel.show.setText("隐藏")
      _this.floatyWindow.controlPanel.show.setVisibility(0)
      _this.floatyWindow.controlPanel.stop.setVisibility(0);
      _this.floatyWindow.controlPanel.autoRun.setVisibility(0);
      _this.floatyWindow.controlPanel.pay.setVisibility(0);
      _this.floatyWindow.controlPanel.forcestop.setVisibility(0);
      _this.floatyWindow.controlPanel.setting.setVisibility(0);
      _this.floatyWindow.controlPanel.exit.setVisibility(0);
      _this.floatyWindow.setSize(160,760);
    } finally {
      _this.floatyLock.unlock()
    }
  })
}

ControlPanelFloaty.prototype.hideAll = function () {
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    try {
      _this.floatyWindow.controlPanel.show.setVisibility(8);
      _this.floatyWindow.controlPanel.stop.setVisibility(8);
      _this.floatyWindow.controlPanel.autoRun.setVisibility(8);
      _this.floatyWindow.controlPanel.pay.setVisibility(8);
      _this.floatyWindow.controlPanel.forcestop.setVisibility(8);
      _this.floatyWindow.controlPanel.setting.setVisibility(8);
      _this.floatyWindow.controlPanel.exit.setVisibility(8);
      _this.floatyWindow.setSize(160,1);
    } finally {
      _this.floatyLock.unlock()
    }
  })
}

// ControlPanelFloaty.prototype.restoreAll = function() {
//   let _this = this
//   ui.run(function () {
//     _this.floatyLock.lock()
//     try {
//       _this.floatyWindow.controlPanel.show.setText("隐藏")
//       _this.floatyWindow.controlPanel.show.setVisibility(0)
//       _this.floatyWindow.controlPanel.stop.setVisibility(0);
//       _this.floatyWindow.controlPanel.autoRun.setVisibility(0);
//       _this.floatyWindow.controlPanel.pay.setVisibility(0);
//       _this.floatyWindow.controlPanel.forcestop.setVisibility(0);
//       _this.floatyWindow.controlPanel.setting.setVisibility(0);
//       _this.floatyWindow.controlPanel.exit.setVisibility(0);
//       _this.floatyWindow.setSize(160,760);
//     } finally {
//       _this.floatyLock.unlock()
//     }
//   })
// }

module.exports = new ControlPanelFloaty()