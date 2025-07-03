
let { config: _config } = require('../../config.js')(runtime, global)
let _debugInfo = typeof debugInfo === 'undefined' ? (v) => console.verbose(v) : debugInfo
let _errorInfo = typeof errorInfo === 'undefined' ? (v) => console.error(v) : errorInfo
let InfoFloaty = function () {
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
InfoFloaty.prototype.init = function () {
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
        <vertical id="consolePanel">
            <card id="indx2" w="auto" margin="0 0 0 1" h="60" background="#000000" cardCornerRadius="3" cardElevation="2dp" gravity="center_vertical"  >
                    <vertical gravity="center_vertical" w="*" >
                        <horizontal>
                            <text  textSize="14" color='#f8f8ff' w="auto" h="auto">识别号码:</text>
                            <text id="scriptPhoneNumber"  text="" color='red'  textSize="14sp" textStyle="bold" w="auto" h="auto" marginLeft="5" layout_gravity="center"/>
                        </horizontal>
                        <horizontal>
                               <text  textSize="14" color='#f8f8ff' w="auto" h="auto">注意:</text>
                               <text id="warn"  text="" color='green'  textSize="14sp" textStyle="bold" w="auto" h="auto" marginLeft="5" layout_gravity="center"/>
                        </horizontal>
                        <horizontal>
                            <text  textSize="14" color='#f8f8ff' w="auto" h="auto">进度:</text>
                            <text id="process"  text="" color='red'  textSize="14sp" textStyle="bold" w="auto" h="auto" marginLeft="5" layout_gravity="center"/>
                        </horizontal>
                    </vertical>
            </card>
        </vertical>
    );
      ui.run(function () {
        _this.floatyWindow.setTouchable(false)
        // _this.floatyWindow.setPosition(50, 50 + _config.bang_offset)
        _this.floatyWindow.setPosition(0,500)
        _this.floatyWindow.process.text('悬浮窗初始化成功')
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

InfoFloaty.prototype.close = function () {
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
/**
 * 
 * @param {object} position  { x: x, y: y }
 * @param {string} text 悬浮窗上显示的文本内容
 * @param {object} option {textSize:textSize,touchable:touchable}
 */

InfoFloaty.prototype.setFloatyInfo = function (position, text, idView, option) {
  option = option || {}
  if (this.floatyWindow === null) {
    this.init()
  }
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    try {
      if (position && isFinite(position.x) && isFinite(position.y)) {
        _this.floatyWindow.setPosition(parseInt(position.x), parseInt(position.y) + _config.bang_offset)
      }
      if (text) {
        _this.floatyWindow[idView].text(text)
        _this.debugInfo(text)
      }
      if (option.textSize) {
        _this.floatyWindow[idView].setTextSize(option.textSize)
      }
      if (typeof option.touchable !== 'undefined') {
        _this.floatyWindow.setTouchable(option.touchable)
      }
    } finally {
      _this.floatyLock.unlock()
    }
  })
}


InfoFloaty.prototype.setFloatyTextColor = function (colorStr) {
  if (this.floatyWindow === null) {
    this.init()
  }
  let _this = this
  if (/^#[\dabcdef]{6,8}$/i.test(colorStr)) {
    let colorInt = colors.parseColor(colorStr)
    if (colorInt !== null) {
      ui.run(function () {
        _this.floatyLock.lock()
        try {
          _this.floatyWindow.process.setTextColor(colorInt)
        } finally {
          _this.floatyLock.unlock()
        }
      })
    }
  } else {
    console.error('颜色值字符串格式不正确: ' + colorStr)
  }
}

InfoFloaty.prototype.setProcessText = function (text, option) {
  this.setFloatyInfo(null, text, "process", option)
}
InfoFloaty.prototype.setSPNText = function (text, option) {
  this.setFloatyInfo(null, text, "scriptPhoneNumber", option)
}
InfoFloaty.prototype.setWarnText = function (text, option) {
  this.setFloatyInfo(null, text, "warn", option)
}
InfoFloaty.prototype.setFloatyPosition = function (x, y, option) {
  this.setFloatyInfo({ x: x, y: y }, null, option)
}

InfoFloaty.prototype.setTextSize = function (textSize) {
  this.setFloatyInfo(null, null, { textSize: textSize })
}

InfoFloaty.prototype.setTouchable = function (touchable) {
  this.setFloatyInfo(null, null, { touchable: touchable })
}

InfoFloaty.prototype.disableLog = function () {
  this.showLog = false
}

InfoFloaty.prototype.enableLog = function () {
  this.showLog = true
}

InfoFloaty.prototype.createNewInstance = function () {
  let newInstance = new InfoFloaty()
  while (!newInstance.init()) {
    newInstance = new InfoFloaty()
  }
  newInstance.setFloatyPosition(-100, -100)
  return newInstance
}

InfoFloaty.prototype.hide = function () {
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    try {
      _this.floatyWindow.consolePanel.setVisibility(4);
    } finally {{}
      _this.floatyLock.unlock()
    }
  })
  // this.oldPosition = {
  //   x: this.floatyWindow.getX(),
  //   y: this.floatyWindow.getY()
  // }
  // this.setFloatyPosition(-1000, -1000)
}

InfoFloaty.prototype.restore = function() {
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    try {
      _this.floatyWindow.consolePanel.setVisibility(0);
    } finally {
      _this.floatyLock.unlock()
    }
  })
  // if (this.oldPosition) {
  //   this.setFloatyPosition(this.oldPosition.x, this.oldPosition.y)
  // }
}

module.exports = new InfoFloaty()