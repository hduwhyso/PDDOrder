/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-08 10:56:10
 * @LastEditTime: 2025-07-13 01:42:16
 * @Description:
 */
/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-09 20:42:08
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2023-06-13 20:49:16
 * @Description:
 */
require("./lib/Runtimes.js")(global);
let currentEngine = engines.myEngine().getSource() + "";
let isRunningMode = currentEngine.endsWith("/config.js") && typeof module === "undefined";
let is_pro = !!Object.prototype.toString.call(com.stardust.autojs.core.timing.TimedTask.Companion).match(/Java(Class|Object)/);
try {
  /**初始设置，本地有存储后以本地为准 */
  let default_config = {
    //脚本设置
    isDualOpen: false, //手机单开还是双开拼多多APP
    loopPay: true, //循环支付
    useBenefitsFirst: false, //支付宝自动识别优惠
    limitOrders: [
      { upperLimitOrders: 9, perDays: 1 },
      { upperLimitOrders: 20, perDays: 7 },
    ], //每天每个账号限制单量
    ocr: "MlkitOcr" /**PaddleOcr  MlkitOcr */,
    dict: null, //字典
    payPassword: "",//支付密码
    vender_id: 1024,
    vender: [
      /**江苏：移动渠道也会接到电信号码，造成卡单 */
      {
        vender_id: 1024,
        vender_name: "话费官方api",
        supportPlatform: ["jd", "pdd", "unionPay"],
        chosenPlatform: "pdd",
        data: {
          amount: "100",
          operator_id: "移动",
          order_num: 1,
          prov_code: "内蒙古,西藏,宁夏,北京,天津,上海,重庆,黑龙江,吉林,青海,河南,江苏,安徽,江西,湖南,湖北,海南,甘肃",
        },
        user_quote_payment: [
          { amount: "10", operator_id: "移动", user_quote_payment: 11 },
          { amount: "20", operator_id: "移动", user_quote_payment: 21 },
          { amount: "30", operator_id: "移动", user_quote_payment: 31 },
          { amount: "50", operator_id: "移动", user_quote_payment: 50.8 },
          { amount: "100", operator_id: "移动", user_quote_payment: 100.4 },
          { amount: "200", operator_id: "移动", user_quote_payment: 200.1 },
          { amount: "300", operator_id: "移动", user_quote_payment: 300.1 },
          { amount: "500", operator_id: "移动", user_quote_payment: 500.1 },
          { amount: "30", operator_id: "联通", user_quote_payment: 30.5 },
          { amount: "50", operator_id: "联通", user_quote_payment: 50.5 },
          { amount: "100", operator_id: "联通", user_quote_payment: 100.4 },
          { amount: "30", operator_id: "电信", user_quote_payment: 30.8 },
          { amount: "50", operator_id: "电信", user_quote_payment: 50.8 },
          { amount: "100", operator_id: "电信", user_quote_payment: 100.4 },
          { amount: "200", operator_id: "电信", user_quote_payment: 200.1 },
        ],
      },
      {
        vender_id: 1039,
        vender_name: "PDD渠道api代理",
        supportPlatform: ["pdd"],
        chosenPlatform: "pdd",
        data: {
          amount: "50",
          operator_id: "移动",
          order_num: 1,
          prov_code: "内蒙古,新疆,西藏,宁夏,广西,北京,天津,上海,重庆,黑龙江,吉林,河北,青海,山东,河南,江苏,安徽,福建,江西,湖南,湖北,海南,甘肃,陕西,四川,贵州,云南" /**退款多 */,
        },
        user_quote_payment: [
          { amount: "50", operator_id: "移动", user_quote_payment: 50.8 },
          { amount: "100", operator_id: "移动", user_quote_payment: 100.1 },
        ],
      },
    ],

    /**平台设置相关 */
    platform: {
      jd: {
        name: "京东",
        dualLaunchEntry: [
          { key: "first", value: "京东", id: "" },
          { key: "second", value: "双开京东", id: "" },
          { key: "loop", value: "循环" },
        ],
        entryNow: "京东",
        owner: "",
        payWay: [],
        accountID: "",
        payWayOptions: ["QQ钱包", "微信支付", "京东支付", "云闪付"],
        amountAllowed: ["100", "200", "300", "500"],
        operatorAllowed: ["移动"],
        dailyLimit: "",
        monthlyLimit: "",
      },
      pdd: {
        name: "拼多多",
        dualLaunchEntry: [
          { key: "first", value: "拼多多", id: "" },
          { key: "second", value: "双开拼多多", id: "" },
          { key: "loop", value: "循环" },
        ],
        entryNow: "拼多多",
        owner: "",
        payWay: [],
        accountID: "",
        payWayOptions: ["QQ钱包", "微信支付", "支付宝", "多多支付"],
        amountAllowed: ["50", "100", "200", "300", "500"],
        operatorAllowed: ["移动"],
        dailyLimit: 20,
        monthlyLimit: 200,
      },
      unionPay: {
        name: "云闪付",
        dualLaunchEntry: [
          { key: "first", value: "云闪付", id: "" },
          { key: "second", value: "双开云闪付", id: "" },
          { key: "loop", value: "循环" },
        ],
        entryNow: "云闪付",
        owner: "",
        payWay: [],
        accountID: "",
        payWayOptions: ["云闪付"],
        amountAllowed: ["30", "50", "100", "200", "300", "500"],
        operatorAllowed: ["移动"],
        dailyLimit: 0,
        monthlyLimit: 10,
      },
    },
    //付款相关
    bankCardList: [],
    /**充值平台账号 */
    platformRechargeList: [],
    payList: [],
    enablePayList: [],
    active: "01",
    //订单相关
    currentOrder: {},
    orderMap: {},
    //蜜蜂api请求频率限制
    getOrderPer_MS: 2400, //获取订单2秒/次
    updateStatus_MS: 0, //上报订单充值结果 无限制
    queryOrder_MS: 1000, //获取用户订单信息1秒/次
    getVender_MS: 15000, //获取账号可做单渠道15秒/次
    getOrderStat_MS: 15000, //获取账号定时风控信息	15秒/次
    getUserQuote_MS: 5000, //查询渠道报价信息	5秒/次
    editUserQuote_MS: 5000, //查询渠道报价信息	5秒/次

    unlock_device_flag: "normal",
    password: "",
    // 是否显示状态栏的悬浮窗，避免遮挡，悬浮窗位置可以通过后两项配置修改 min_floaty_x[y]
    show_small_floaty: true,
    not_lingering_float_window: false,
    release_screen_capture_when_waiting: false,
    not_setup_auto_start: false,
    disable_all_auto_start: false,
    min_floaty_x: 150,
    min_floaty_y: 20,
    min_floaty_color: "#00ff00",
    min_floaty_text_size: 8,
    timeout_unlock: 1000,
    timeout_findOne: 1000,
    timeout_existing: 8000,
    // 异步等待截图，当截图超时后重新获取截图 默认开启
    async_waiting_capture: true,
    capture_waiting_time: 500,
    random_sleep_time: 500,
    max_collect_wait_time: 60,
    show_debug_log: true,
    show_engine_id: false,
    // 日志保留天数
    log_saved_days: 3,
    develop_mode: true /**针对LogUtils日志 */,
    develop_saving_mode: false,
    check_device_posture: false,
    check_distance: false,
    posture_threshold_z: 6,
    // 电量保护，低于该值延迟60分钟执行脚本
    battery_keep_threshold: 20,
    auto_lock: device.sdkInt >= 28,
    lock_x: 150,
    lock_y: 970,
    // 是否根据当前锁屏状态来设置屏幕亮度，当锁屏状态下启动时 设置为最低亮度，结束后设置成自动亮度
    auto_set_brightness: false,
    // 锁屏启动关闭提示框
    dismiss_dialog_if_locked: true,
    // 佛系模式
    buddha_like_mode: false,
    request_capture_permission: true,
    capture_permission_button: "START NOW|立即开始|允许",
    // 是否保存日志文件，如果设置为保存，则日志文件会按时间分片备份在logback/文件夹下
    save_log_file: true,
    // 异步写入日志文件
    async_save_log_file: true,
    back_size: "100",
    // 控制台最大日志长度，仅免费版有用
    console_log_maximum_size: 1500,
    // 通话状态监听
    enable_call_state_control: false,
    // 单脚本模式 是否只运行一个脚本 不会同时使用其他的 开启单脚本模式 会取消任务队列的功能。
    // 比如同时使用蚂蚁庄园 则保持默认 false 否则设置为true 无视其他运行中的脚本
    single_script: false,
    auto_restart_when_crashed: false,
    // 是否使用模拟的滑动，如果滑动有问题开启这个 当前默认关闭 经常有人手机上有虚拟按键 然后又不看文档注释的
    useCustomScrollDown: true,
    // 排行榜列表下滑速度 200毫秒 不要太低否则滑动不生效 仅仅针对useCustomScrollDown=true的情况
    scrollDownSpeed: 200,
    // 滑动起始底部高度
    bottomHeight: 200,
    // 当以下包正在前台运行时，延迟执行
    skip_running_packages: [],
    warn_skipped_ignore_package: false,
    warn_skipped_too_much: false,
    auto_check_update: false,

    // 代码版本
    code_version: "v1.4.0",
    // 延迟启动时延 5秒 悬浮窗中进行的倒计时时间
    delayStartTime: 5,
    // 本地ocr优先级
    local_ocr_priority: "mlkit",
    device_width: device.width,
    device_height: device.height,
    sdkInt: device.sdkInt,
    root: files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su"),
    shizuku: $shizuku && $shizuku.isRunning(),
    mjwInstalled: shell(" pm list packages", true).result.includes("com.yztc.studio.plugin"),
    // 是否是AutoJS Pro  需要屏蔽部分功能，暂时无法实现：生命周期监听等 包括通话监听
    is_pro: is_pro,
    auto_set_bang_offset: true,
    bang_offset: 0,
    // 当以下包正在前台运行时，延迟执行
    skip_running_packages: [],
    warn_skipped_ignore_package: false,
    warn_skipped_too_much: false,
    enable_visual_helper: false,
    auto_restart_when_crashed: true,
    thread_name_prefix: "autoscript_",
    // 标记是否清除webview缓存
    clear_webview_cache: false,
    // 配置界面webview打印日志
    webview_loging: false,
  };

  let force_config = {
    github_url: "https://github.com/hduwhyso/PDDOrder/tree/master",
    gitee_url: "https://gitee.com/TonyJiangWJ/Ant-Forest",
    // github release url 用于检测更新状态
    github_latest_url: "https://api.github.com/repos/hduwhyso/PDDOrder/releases/latest",
    history_tag_url: "https://api.github.com/repos/hduwhyso/PDDOrder/tags",
    gitee_relase_url: "https://gitee.com/api/v5/repos/TonyJiangWJ/Ant-Forest/releases/latest",
    gitee_package_prefix: "Ant-Forest-",
    gitee_package_url: "https://gitee.com/TonyJiangWJ/Ant-Forest/raw/release_pkgs/",
    release_access_token: "",
  };
  // 不同项目需要设置不同的storageName，不然会导致配置信息混乱
  let CONFIG_STORAGE_NAME = "beeCloud";
  let PROJECT_NAME = "1_JD";
  let config = {};
  let storageConfig = storages.create(CONFIG_STORAGE_NAME);
  let securityFields = ["password", "alipay_lock_password"];
  let AesUtil = require("./lib/AesUtil.js");
  let aesKey = device.getAndroidId();
  Object.keys(default_config).forEach(key => {
  if (typeof force_config[key] !== "undefined") {
    config[key] = force_config[key];
  } else {
    let storedVal = storageConfig.get(key);
    if (typeof storedVal !== "undefined") {
      if (securityFields.indexOf(key) > -1) {
        storedVal = AesUtil.decrypt(storedVal, aesKey) || storedVal;
      }
      config[key] = storedVal;
    } else {
      config[key] = default_config[key];
    }
  }
});

  // 覆写配置信息
  config.overwrite = (key, value) => {
    let storage_name = CONFIG_STORAGE_NAME;
    let keys = key.split("."); // 按 "." 分割多层嵌套键
    let config_key = keys[0]; // 主配置键

    // 如果是单层配置，直接处理
    if (keys.length === 1) {
      if (!config.hasOwnProperty(config_key)) {
        return;
      }
      config[config_key] = value;
    } else {
      // 处理多层嵌套配置
      let nestedConfig = config[config_key + "_config"]; // 获取第一层嵌套的 config
      if (!nestedConfig) {
        return;
      }

      // 遍历嵌套键，逐层深入
      for (let i = 1; i < keys.length - 1; i++) {
        if (!nestedConfig.hasOwnProperty(keys[i])) {
          return; // 如果某一层配置不存在，直接返回
        }
        nestedConfig = nestedConfig[keys[i]]; // 逐层进入嵌套
      }

      let lastKey = keys[keys.length - 1]; // 最后一层的键
      if (!nestedConfig.hasOwnProperty(lastKey)) {
        return;
      }

      // 设置最终嵌套的值
      nestedConfig[lastKey] = value;
    }

    // 输出调试信息
    console.verbose("覆写配置", storage_name, key);

    // 保存到持久化存储中
    storages.create(storage_name).put(key, value);
  };

  if (!isRunningMode) {
    module.exports = function (__runtime__, scope) {
      if (typeof scope.config_instance === "undefined") {
        scope.config_instance = {
          config: config,
          default_config: default_config,
          storage_name: CONFIG_STORAGE_NAME,
          securityFields: securityFields,
          project_name: PROJECT_NAME,
        };
      }
      return scope.config_instance;
    };
  } else {
    setTimeout(function () {
      engines.execScriptFile(files.cwd() + "/可视化配置.js", { path: files.cwd() });
    }, 30);
  }
} catch (e) {
  console.error(e);
}
