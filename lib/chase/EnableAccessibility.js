
importClass(android.content.Context);
importClass(android.provider.Settings);
importClass(android.content.pm.PackageManager);

function EnableAccessibility(){
    this.hasRootPermission = function () {
        return files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
    }
    const _current_pacakge = currentPackage
    currentPackage = function () {
      try {
        if (!runtime.getAccessibilityBridge()) {
          return _current_pacakge()
        }
        // 通过windowRoot获取根控件的包名，理论上返回一个 速度较快
        let windowRoots = runtime.getAccessibilityBridge().windowRoots()
        if (windowRoots && windowRoots.size() > 0) {
            // console.log('windowRoots size: %s', windowRoots.size())
          for (let i = windowRoots.size() - 1; i >= 0; i--) {
            let root = windowRoots.get(i)
            if (root !== null && root.getPackageName()) {
              return root.getPackageName()
            }
          }
        }
        // windowRoot获取失败了通过service.getWindows获取根控件的包名，按倒序从队尾开始获取 速度相对慢一点
        let service = runtime.getAccessibilityBridge().getService()
        let serviceWindows = service !== null ? service.getWindows() : null
        if (serviceWindows && serviceWindows.size() > 0) {
            console.log('windowRoots未能获取包名信息，尝试service window size: %s', serviceWindows.size())
          for (let i = serviceWindows.size() - 1; i >= 0; i--) {
            let window = serviceWindows.get(i)
            let root = null
            if (window && ((root = window.getRoot()) != null) && root.getPackageName()) {
              return root.getPackageName()
            }
          }
        }
        console.log('service.getWindows未能获取包名信息，通过currentPackage()返回数据')
        // 以上方法无法获取的，直接按原方法获取包名
        return _current_pacakge()
      } catch (e) {
        console.error('通过控件方式获取包名失败, 使用原始方法获取', e)
        return _current_pacakge()
      }
    }
    this.checkPermission = function (permission) {
        return PackageManager.PERMISSION_GRANTED === context.getPackageManager().checkPermission(permission, context.getPackageName())
    }

    this.hasAdbPermission = function () {
    return this.checkPermission('android.permission.WRITE_SECURE_SETTINGS')
    }
    this.getAutoJsPackage = function () {
        return context.getPackageName()
    }
    this.getAccessibilityServiceClassName = function () {
        if (this.getAutoJsPackage().startsWith("org.autojs.autojs")) {
          return "com.stardust.autojs.core.accessibility.AccessibilityService"
        } else {
          /**
           * 适配变更包名的AutoJS，针对淘宝客户端会读取并拉黑无障碍功能中已启用AutoJS相关的用户，
           * 可以创建一个乱七八糟包名的AutoJS并修改AccessibilityService的包名称，脚本中需要通过反射获取对应的类全名
           */
          try {
            importClass(org.autojs.autojs.tool.AccessibilityServiceTool)
            let clz = new AccessibilityServiceTool().getClass()
            let field = clz.getDeclaredField('sAccessibilityServiceClass')
            let typeName = field.getGenericType().getTypeName()
            console.log(clz,666,field,777,typeName)
            let regex = /.*<(.*)>/
            return regex.exec(typeName)[1]
          } catch (e) {
          console.error(e)
          //  self.printExceptionStack(e)
            return null
          }
        }
    }
      /**
   * 关闭无障碍权限
   */
    this.disableAccessibilityAndRestart = function () {
        if (!this.hasAdbPermission()) {
        console.warn('未通过ADB授权，无法自动关闭无障碍权限，交由后续处理')
        return
        }
        try {
        // let accessibilityServiceClassName = this.getAccessibilityServiceClassName()
        let accessibilityServiceClassName ="com.stardust.autojs.core.accessibility.AccessibilityService"
          // let accessibilityServiceClassName ="com.taobao.idlefish.AccessibilityService"
        let requiredService = this.getAutoJsPackage() + '/' + accessibilityServiceClassName
      //   log(this.getAutoJsPackage(),666,accessibilityServiceClassName)
        let enabledServices = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) || ''
        enabledServices = enabledServices.replace(requiredService, '').split(':').filter(v => /^(((\w+\.)+\w+)[/]?){2}$/.test(v)).join(':')
        log(enabledServices)
        Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, enabledServices)
        Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED, '1')
        if(auto.service == null)console.warn('关闭无障碍服务成功');
        //   exit()
        } catch (e) {
        console.error(['无法自动关闭无障碍权限，交由后续处理: %s', e])
        }
    }
   /**
    * adb 授权命令
    *
    * @returns
    */
    this.getAdbGrantCmd = function () {
        return 'adb shell pm grant ' + this.getAutoJsPackage() + ' android.permission.WRITE_SECURE_SETTINGS'
        //关闭权限：'adb shell pm revoke ' + this.getAutoJsPackage() + ' android.permission.WRITE_SECURE_SETTINGS'
    }

    this.myCurrentPackage = function () {
      return currentPackage()
    }
    this.adbEnableAccessibilityService = function () {
      let hasAdbPermission = this.hasAdbPermission()
      if (hasAdbPermission && auto.service == null) {
          let packageName = this.getAutoJsPackage()
          // let accessibilityServiceClassName = this.getAccessibilityServiceClassName()

          // let accessibilityServiceClassName ="com.taobao.idlefish.AccessibilityService"
          let accessibilityServiceClassName = "com.stardust.autojs.core.accessibility.AccessibilityService"
          if (!accessibilityServiceClassName) {
              // 无法准确获取无障碍服务名称，交由auto.waitFor()处理
              return false
          }
          let requiredService = packageName + '/' + accessibilityServiceClassName
          try {
              let enabledServices = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
              // console.info('当前已启用无障碍功能的服务:%s', enabledServices)
              var service = null
              if (enabledServices.indexOf(requiredService) < 0 || enabledServices.split(':').filter(v => !/^(((\w+\.)+\w+)[/]?){2}$/.test(v)).length > 1) {
                service = enabledServices + ':' + requiredService
              }else{
                service = enabledServices
              }
              if (service) {
                // if (_config.other_accessisibility_services) {
                // service += ':' + _config.other_accessisibility_services
                // }
                // 清理service 删除无效的或者不正确的
                console.info('准备设置无障碍权限：%s', service)
                let services = []
                service = service.split(':')
                .filter(v => /^(((\w+\.)+\w+)[/]?){2}$/.test(v))
                .filter(s => {
                    if (services.indexOf(s) > -1) {
                      return false
                    }
                    services.push(s)
                    return true
                }).join(':')
                // console.log('过滤无效内容后的services：%s', service)
                //开启无障碍
                Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, service)
                Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED, '1')
                sleep(5000)
                if(auto.service != null){
                  toastLog('成功开启辅助服务')
                  return true
                }else{
                  return false
                }
              }
          } catch (e) {
              console.log(e)
              console.log('\n请确保已给予 WRITE_SECURE_SETTINGS 权限\n\n授权代码已复制，请使用adb工具连接手机执行(重启不失效)\n\n')
              let shellScript = this.getAdbGrantCmd()
              console.log('adb 脚本 已复制到剪切板：[' + shellScript + ']')
              setClip(shellScript)
              return false
          }

      }
      else if(auto.service != null){
        console.log('无需重复开启辅助服务')
        return true
      }
      // 无ADB授权时直接返回false
      else if (!hasAdbPermission) {
          return false
      }

    }
    /**启动无障碍 */
    this.enabledAccessibility = function () {
        if (!this.adbEnableAccessibilityService()) {
          try {
              if(auto.service == null && !this.hasAdbPermission() && (this.hasRootPermission() ||$shizuku.isRunning())){
                  console.log("尝试开启adb权限")
                  let cmd="pm grant "+context.getPackageName()+" android.permission.WRITE_SECURE_SETTINGS"
                  if(this.hasRootPermission()){
                    shell(cmd, true)
                }else if($shizuku.isRunning()){$shizuku(cmd);}
                  // shell("pm grant "+context.getPackageName()+" android.permission.WRITE_SECURE_SETTINGS", true)
                  if(this.adbEnableAccessibilityService())return;
              }
            console.info('无ADB授权，使用auto.waitFor()')
            console.info('ADB授权命令：' + this.getAdbGrantCmd())
            console.info('即将跳转无障碍界面，授权完毕后会自动打开AutoJS，如果失败请手动返回，或者给与AutoJS后台弹出界面的权限')
            sleep(1500)
            auto.waitFor()
            // waitFor执行完毕后 重新打开AutoJS界面
            app.launch(context.getPackageName())
            // 等待十秒钟，如果app.launch失败了等手动回到autojs界面
            limit = 10
            let currentPackageName = this.myCurrentPackage()
            while (limit-- > 0 && currentPackageName !== context.getPackageName()) {
              console.info('当前包名：%s', currentPackageName)
              sleep(1000)
              currentPackageName = this.myCurrentPackage()
            }
            return true
          } catch (e) {
            console.warn('auto.waitFor()不可用',e)
            auto()
          }
        }
        return true
    }

}

module.exports = new EnableAccessibility()