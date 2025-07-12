/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-14 07:28:06
 * @LastEditTime: 2025-07-03 22:19:33
 * @Description: 
 */
let Index = {
  mixins: [mixin_methods],
  data: function () {
    return {
      menuItems: [
        {
          title: '渠道和充值平台配置',
          link: '/basic/channelConfig'
        },
        // {
        //   title: '充值平台配置',
        //   link: '/basic/platformConfig'
        // },
        {
          title: '付款配置',
          link: '/basic/payWayConfig'
        },
        // {
        //   title: '银行卡',
        //   link: '/basic/bankCard'
        // },
        {
          title: '订单查询',
          link: '/basic/orderMap'
        },
        {
          title: '脚本设置',
          link: '/basic/scriptConfig'
        },
        // {
        //   title: '前台应用白名单设置',
        //   link: '/advance/skipPackage'
        // },
        // {
        //   title: '高级设置',
        //   link: '/advance/common'
        // },
        // {
        //   title: '新村助力设置',
        //   link: '/village/share'
        // },
        {
          title: '关于项目',
          link: '/about'
        },
        // {
        //   title: '常见问题',
        //   link: '/QA'
        // },
        // {
        //   title: '脚本说明README',
        //   link: '/readme'
        // },
      ]
    }
  },
  methods: {
    routerTo: function (item) {
      this.$router.push(item.link)
      this.$store.commit('setTitleWithPath', { title: item.title, path: item.link })
    }
  },
  template: `<div>
    <van-cell-group>
      <van-cell :title="item.title" is-link v-for="item in menuItems" :key="item.link" @click="routerTo(item)"/>
    </van-cell-group>
  </div>`
}
