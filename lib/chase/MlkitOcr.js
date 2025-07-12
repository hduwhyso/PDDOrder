/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-22 18:51:20
 * @LastEditTime: 2025-02-15 12:42:32
 * @Description: 
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-14 18:35:33
 * @LastEditTime: 2024-06-22 18:42:09
 * @Description: 
 */


let SingleRequire = require('./SingleRequire')(runtime, this)
let { debug, logs, error, warn, info} = SingleRequire('LogInfo')
// let commonFunctions = SingleRequire('CommonFunction')
let autoJsSupport = false
if (typeof $mlKitOcr !== 'undefined') {
  autoJsSupport = true
}

function MlkitOCR () {
  let pluginOcr = autoJsSupport ? null : (() => {
    try {
      return plugins.load('com.tony.mlkit.ocr')
    } catch (e) {
      warn('未安装插件 请通过此链接下载MlkitOCR插件：https://github.com/TonyJiangWJ/Ant-Forest/releases/download/v1.1.1.4/mlkit-ocr-plugin-latest.apk')
    }
  })()
  this.enabled = autoJsSupport || !!pluginOcr
  // if (pluginOcr && typeof pluginOcr.release !== 'undefined') {
  //   commonFunctions.registerOnEngineRemoved(function () {
  //     pluginOcr.release()
  //   }, 'release mlkit-plugin resource')
  // }
  this.type = 'mlkit'
  if (!this.enabled) {
    warn(['当前版本AutoJS不支持mlKitOcr且同时未安装MlkitOCR插件，自动禁用mlKitOcr功能'])
    return
  }
  this.ocr = autoJsSupport ? $mlKitOcr : pluginOcr
}


/**
 * 识别图片上的文字
 * 
 * @param {imageWrapper} img 待识别图片
 */
MlkitOCR.prototype.ocrAllText = function (img, region) {
  if (!this.enabled) {
    return ''
  }
  let start = new Date()
  // img = images.grayscale(img) //// 进行灰度处理 降低干扰
    // img=images.threshold(img, 200, 255, "BINARY") //二值化
  let ocrResults = this.ocr.detect(img, { region: region }).filter(v => v.confidence > 0.4)
  let allWords=""
  ocrResults.forEach(item=>{
    allWords=allWords+item.label
  })
  allWords=allWords.replace(/\s+/g, '').replace(/\//g, '');
  debug(['mklit识别到文本：{};耗时：{}ms', allWords,new Date() - start])
  return allWords
}

/**
 * 识别图片上的文字 并返回位置信息
 * 
 * @param {imageWrapper} img 待识别图片
 * @param {Array} region 待识别区域
 * @param {string} regex 查找文本
 */
MlkitOCR.prototype.recognizeWithBounds = function (img, region, text) {
  let regex = '^.*' + text +'.*$'
  if (!this.enabled) {
    return []
  }
  let start = new Date()
  let resultLines = this.ocr.detect(img, { region: region }).filter(v => v.confidence > 0.4)
  let result = resultLines.map(line => line.elements).reduce((a, b) => a = a.concat(b), [])
  debug(['mlkit识别文本耗时：{}ms', new Date() - start])
  // debug(['mlkit识别文本信息：{}', JSON.stringify(result)])
  if (regex) {
    regex = new RegExp(regex)
    result = result.filter(r => regex.test(r.label))
  }
  result=JSON.parse(JSON.stringify(result))
  return result
}


MlkitOCR.prototype.recognizeThenClick = function (img, region, text) {
  let regex = '^.*' + text +'.*$'
  if (!this.enabled) {
    return []
  }
  // let start = new Date()
  // img = images.grayscale(img) //// 进行灰度处理 降低干扰
  let resultLines = this.ocr.detect(img, { region: region }).filter(v => v.confidence > 0.4)
  let result = resultLines.map(line => line.elements).reduce((a, b) => a = a.concat(b), [])
  // console.log(JSON.parse(JSON.stringify(result)))
  if (regex) {
    regex = new RegExp(regex)
    result = result.filter(r => regex.test(r.label))
  }
  result=JSON.parse(JSON.stringify(result))
  if(result.length==1){
   let location=result[0].bounds
    randomClick(location)
    
    return true
  }else{
    console.log('MlkitOCR识别到【'+result.length+'】个文本')
    return false
  }
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
module.exports = new MlkitOCR()
