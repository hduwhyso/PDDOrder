/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-11 11:31:31
 * @LastEditTime: 2024-10-03 21:55:27
 * @Description: 
 */

const router = new VueRouter({
  scrollBehavior(to, from, savedPosition) {
    console.log('savedPosition', savedPosition)
    if (savedPosition) {
        return savedPosition
    }
    return {x: 0, y: 0}
  },
  routes: [
    { path: '/', component: Index, meta: { index: 0 } },
    { path: '/basic/scriptConfig', component: ScriptConfigs, meta: { index: 1 } },
    { path: '/basic/payWayConfig', component: PayWayConfig, meta: { index: 1 } },
    // { path: '/basic/bankCard', component: BankCard, meta: { index: 1 } },
    // { path: '/basic/platformConfig', component: PlatformConfig, meta: { index: 1 } },
    { path: '/basic/channelConfig', component: ChannelConfig, meta: { index: 1 } },
    { path: '/basic/orderMap', component: OrderMap, meta: { index: 1 } },
    // { path: '/payway/addPayWay', component: AddPayWay, meta: { index: 1, title: '新增付款方式'  } },
    // { path: '/payway/addBankCard', component: AddBankCard, meta: { index: 1, title: '新增银行卡'  } },
    { path: '/payway/enablePayList', component: EnablePayList, meta: { index: 1, title: '已启用付款方式'  } },
    { path: '/payway/payList', component: PayList, meta: { index: 1, title: '待启用付款方式'  } },
    // { path: '/basic/log', component: LogConfig, meta: { index: 1 } },
    // { path: '/advance/skipPackage', component: SkipPackageConfig, meta: { index: 1 } },
    // { path: '/advance/common', component: AdvanceCommonConfig, meta: { index: 1 } },
    { path: '/about', component: About, meta: { index: 1 } },
    // { path: '/about/develop', component: DevelopConfig, meta: { index: 2, title: '开发模式' } },
    { path: '/about/releases', component: HistoryRelease, meta: { index: 3, title: '更新历史' } },
    // { path: '/village/share', component: AccountManager, meta: { index: 1 } },
    // { path: '/QA', component: QuestionAnswer, meta: { index: 1, title: '常见问题' } },
    // { path: '/readme', component: Readme, meta: { index: 1, title: '脚本说明README' } },
  ]
})

window.router = router

