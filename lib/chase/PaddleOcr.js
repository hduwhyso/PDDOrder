/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-22 19:19:09
 * @LastEditTime: 2025-02-12 07:39:56
 * @Description:
 */
require('../../modules/init_if_needed.js')(runtime, global)
let SingleRequire = require('./SingleRequire')(runtime, this)
let { debug, logs, error, warn, info} = SingleRequire('LogInfo')
// let commonFunctions = singletonRequire('CommonFunction')

function PaddleOcrUtil () {
  this.enabled = false
  this.useSlim = true //默认true使用v3的slim版(速度更快)，false使用v3的普通版(准确率更高）
  this.predictor = null
  this.type = 'paddle'
  this.use_customize_model = false
  this.customize_model_path = ''
  this.customize_lable_path = ''
  this.initialized = false

  importClass(org.opencv.imgcodecs.Imgcodecs)
  importClass(org.opencv.android.Utils)
  importClass(org.opencv.core.Mat)
  importClass(android.graphics.Bitmap)
  if (!$power_manager.isIgnoringBatteryOptimizations()) {
    warn(['未开启电量无限制，PaddleOCR可能会闪退，自动禁用PaddleOCR。请主动开启或运行unit/关闭电量限制.js 选择无限制'], true)
    require('../../modules/init_if_needed')(runtime, global)

    let permision = $power_manager.isIgnoringBatteryOptimizations(context.packageName)
    console.log('是否授权:', permision);
    if (!permision) {
      toastLog('请选择 无限制')
      $power_manager.requestIgnoreBatteryOptimizations()
    } else {
      toastLog('当前已授权电量无限制')
    }
    return
  }
  // this.init()
}

PaddleOcrUtil.prototype.checkInited = function (loading) {
  this.enabled = loading.blockedGet() == true
  if (!this.enabled) {
    error('初始化PaddleOcr失败')
    // if (config.force_init_paddle) {
    //   error('重启脚本，重新初始化Paddle', true)
    //   commonFunctions.setUpAutoStart(3, true)
    //   exit()
    // }
  } else {
    debug('初始化PaddleOcr成功')
  }
}

PaddleOcrUtil.prototype.init = function () {
  try {
    importClass(com.baidu.paddle.lite.ocr.Predictor)
  } catch (e) {
    warn(['当前版本的AutoJS不支持PaddleOcr'])
    this.initialized = true
    return
  }
  this.use_customize_model = false
  this.predictor = new Predictor()
  let loading = threads.disposable()
  let _this = this
  // 建议在新线程中初始化模型
  threads.start(function () {
    debug('初始化PaddleOcr')
    _this.predictor.releaseModel()
    sleep(50)
    _this.predictor.init(context, _this.useSlim)
    loading.setAndNotify(true)
  })
  this.checkInited(loading)
  this.initialized = true
  // this.ensureModelLoaded()
}

PaddleOcrUtil.prototype.initWithCustomizeModel = function () {
  try {
    importClass(com.baidu.paddle.lite.ocr.Predictor)
  } catch (e) {
    LogUtils.warnInfo(['当前版本的AutoJS不支持PaddleOcr'])
    return
  }
  this.predictor = new Predictor()
  let loading = threads.disposable()
  let _this = this
  // 建议在新线程中初始化模型
  threads.start(function () {
    _this.use_customize_model = true
    let modelPath = 'models/ocr_v4_for_cpu' // 指定自定义模型路径
    let labelPath = 'labels/ppocr_keys_v1.txt' // 指定自定义label路径
    // 使用自定义模型时det rec cls三个模型文件名称需要手动指定
    _this.predictor.detModelFilename = 'det_opt.nb'
    _this.predictor.recModelFilename = 'rec_opt.nb'
    _this.predictor.clsModelFilename = 'cls_opt.nb'

    _this.predictor.releaseModel()
    _this.predictor.init(context, modelPath, labelPath)
    _this.customize_lable_path = labelPath
    _this.customize_model_path = modelPath
    loading.setAndNotify(true)
  })
  this.checkInited(loading)
  this.initialized = true
}

/**
 * 识别图片上的文字
 *
 * @param {imageWrapper} img 待识别图片
 * @param {array: [left, top, width, height]} region   [bounds.left, bounds.top, bounds.width(), bounds.height()]
 */
PaddleOcrUtil.prototype.ocrAllText = function (img, region) {
  if (!this.initialized) {
    // this.initWithCustomizeModel()
    this.init()
  }
  if (this.enabled) {
    img = images.grayscale(img) //// 进行灰度处理 降低干扰
    let start = new Date()
    let bitmapToRelease = []
    let bitmap = Bitmap.createBitmap(img.getWidth(), img.getHeight(), Bitmap.Config.ARGB_8888)
    Utils.matToBitmap(img.mat, bitmap)
    bitmapToRelease.push(bitmap)
    if (region) {
      let imgMat = new Mat(img.mat, buildRegion(region, img))
      bitmap = Bitmap.createBitmap(imgMat.cols(), imgMat.rows(), Bitmap.Config.ARGB_8888)
      Utils.matToBitmap(imgMat, bitmap)
      bitmapToRelease.push(bitmap)
      imgMat.release()
    }
    start = new Date()
    let ocrResults = runtime.bridges.bridges.toArray(this.predictor.runOcr(bitmap)).filter(v => v.confidence > 0.5)
    debug(['paddle识别文本耗时：{}ms', new Date() - start])
    bitmapToRelease.forEach(bitmap => bitmap.recycle())
    let allWords=""
    ocrResults.forEach(item=>{
      allWords=allWords+item.label
    })
    allWords=allWords.replace(/\s+/g, '');
    debug(['paddle识别到文本：{}', allWords])
    return allWords
  }
  return null
}

/**
 * 识别图片上的文字 并返回位置信息
 *
 * @param {imageWrapper} img 待识别图片
 * @param {array: [left, top, width, height]} region
 * @param {string} text 查找包含文本
 */
PaddleOcrUtil.prototype.recognizeWithBounds = function (img, region, text) {
  let regex = '^.*' + text +'.*$'
  if (!this.initialized) {
    this.initWithCustomizeModel()
    // this.init()
  }
  if (this.enabled) {
    let start = new Date()
    let bitmapToRelease = []
    let bitmap = Bitmap.createBitmap(img.getWidth(), img.getHeight(), Bitmap.Config.ARGB_8888)
    Utils.matToBitmap(img.mat, bitmap)
    bitmapToRelease.push(bitmap)
    if (region) {
      let imgMat = new Mat(img.mat, buildRegion(region, img))
      bitmap = Bitmap.createBitmap(imgMat.cols(), imgMat.rows(), Bitmap.Config.ARGB_8888)
      Utils.matToBitmap(imgMat, bitmap)
      bitmapToRelease.push(bitmap)
      imgMat.release()
    }
    debug(['图片转换耗时：{}ms', new Date() - start])
    start = new Date()
    let result = runtime.bridges.bridges.toArray(this.predictor.runOcr(bitmap)).filter(v => v.confidence > 0.5)
    debug(['paddle识别文本耗时：{}ms', new Date() - start])
    // let allWords=""
    // result.forEach(item=>{
    //   allWords=allWords+item.label
    // })

    if (regex) {
      regex = new RegExp(regex)
      result = result.filter(r => regex.test(r.label))
    }
    if (region && region.length > 1) {
      result.forEach(r => r.bounds.offset(region[0], region[1]))
    }
    bitmapToRelease.forEach(bitmap => bitmap.recycle())
    return JSON.parse(JSON.stringify(result))
    // return allWords
  }
  return []
}


PaddleOcrUtil.prototype.recognizeThenClick = function (img, region, text) {
  let regex = '^.*' + text +'.*$'
  if (!this.initialized) {
    this.initWithCustomizeModel()
    // this.init()
  }
  if (this.enabled) {
    let start = new Date();
    let bitmapToRelease = [];
    let bitmap = Bitmap.createBitmap(img.getWidth(), img.getHeight(), Bitmap.Config.ARGB_8888);
    Utils.matToBitmap(img.mat, bitmap);
    bitmapToRelease.push(bitmap);
    if (region) {
      let imgMat = new Mat(img.mat, buildRegion(region, img));
      bitmap = Bitmap.createBitmap(imgMat.cols(), imgMat.rows(), Bitmap.Config.ARGB_8888);
      Utils.matToBitmap(imgMat, bitmap);
      bitmapToRelease.push(bitmap);
      imgMat.release();
    }
    debug(["图片转换耗时：{}ms", new Date() - start]);
    start = new Date();
    let result = runtime.bridges.bridges.toArray(this.predictor.runOcr(bitmap)).filter(v => v.confidence > 0.5);
    debug(["paddle识别文本耗时：{}ms", new Date() - start]);
    // let allWords=""
    // result.forEach(item=>{
    //   allWords=allWords+item.label
    // })

    if (regex) {
      regex = new RegExp(regex);
      result = result.filter(r => regex.test(r.label));
    }
    if (region && region.length > 1) {
      result.forEach(r => r.bounds.offset(region[0], region[1]));
    }
    bitmapToRelease.forEach(bitmap => bitmap.recycle());

    result = JSON.parse(JSON.stringify(result));
    if (result.length == 1) {
      let location = result[0].bounds;
      randomClick(location);

      return true;
    } else {
      console.log("PaddleOcr识别到【" + result.length + "】个文本");
      return false;
    }
  }
  return []
}


module.exports = new PaddleOcrUtil()



function buildRegion (region, img) {
  if (region == undefined) {
    region = [];
  }
  var x = region[0] === undefined ? 0 : region[0];
  var y = region[1] === undefined ? 0 : region[1];
  var width = region[2] === undefined ? img.getWidth() - x : region[2];
  var height = region[3] === undefined ? (img.getHeight() - y) : region[3];
  var r = new org.opencv.core.Rect(x, y, width, height);
  if (x < 0 || y < 0 || (x + width) > img.width || (y + height) > img.height) {
    throw new Error("out of region: region = [" + [x, y, width, height] + "], image.size = [" + [img.width, img.height] + "]");
  }
  return r;
}

function randomClick(region) {
  // 获取区域的边界坐标
  let left = region.left;
  let top = region.top;
  let right = region.right;
  let bottom = region.bottom;

  // 计算随机的x和y坐标
  let randomX = Math.floor(Math.random() * (right - left + 1)) + left;
  let randomY = Math.floor(Math.random() * (bottom - top + 1)) + top;

  // 执行点击操作
  click(randomX, randomY);
}