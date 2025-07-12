const PlatformConfig = {
  name: 'PlatformConfig',
  mixins: [mixin_common],
  data() {
    return {
      configs: {
        showPlatform: {},
        platform: {
          jd: {
            name: '京东',
            dualLaunchEntry: [{key:'first',value:'京东'},{key:'second',value:'双开京东'},{key:'loop',value:'循环'}],
            entryNow: '京东',
            payWay: [],
            payWayOptions:['QQ','微信','京东','云闪付']
          },
          pdd: {
            name: '拼多多',
            dualLaunchEntry: [{key:'first',value:'拼多多'},{key:'second',value:'双开拼多多'},{key:'loop',value:'循环'}],
            entryNow: '拼多多',
            payWay: [],
            payWayOptions:['QQ钱包','微信支付','支付宝','多多支付']
          },
          unionPay: {
            name: '云闪付',
            dualLaunchEntry: [{key:'first',value:'云闪付'},{key:'second',value:'双开云闪付'},{key:'loop',value:'循环'}],
            entryNow: '云闪付',
            payWay: ['云闪付'],
            payWayOptions:['云闪付']
          },
          taobao: {
            name: '淘宝',
            dualLaunchEntry: [{key:'first',value:'淘宝'},{key:'second',value:'双开淘宝'},{key:'loop',value:'循环'}],
            entryNow: '淘宝',
            payWay: ['支付宝'],
            payWayOptions:['支付宝']
          },
          alipay: {
            name: '支付宝',
            dualLaunchEntry: [{key:'first',value:'支付宝'},{key:'second',value:'双开支付宝'},{key:'loop',value:'循环'}],
            entryNow: '支付宝',
            payWay: ['支付宝'],
            payWayOptions:['支付宝']
          },
        },
      },
    };
  },
  computed: {
    platforms() {
      return Object.keys(this.configs.platform);
    }
  },
  method:{
    showPlatformMethod(){
      this.showPlatform=Object.keys(this.configs.platform).reduce((acc, key) => {
        acc[key] = true; // 每个平台默认设置为可见
        return acc;
      }, {});
    }
  },
  template: `

<div>
  <!-- 添加复选框来控制平台配置的显示和隐藏 -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.3vh;place-items: center; margin-top:1rem; margin-bottom:1rem;font-size: 0.95rem;">
    <div v-for="platformKey in platforms" :key="'checkbox_' + platformKey" style="margin-right: 1rem;">
      <van-checkbox shape="square" v-model="configs.showPlatform[platformKey]">{{ configs.platform[platformKey].name }}</van-checkbox>
    </div>
  </div>

  <!-- 使用v-if来根据showPlatform中的值控制每个平台配置的显示 -->
  <div v-for="platformKey in platforms" :key="platformKey" v-if="configs.showPlatform[platformKey]">
  <van-row>
     <hr style="width: 100%; border: 0; border-top: 1px solid #1989fa; margin: 0;" />
  </van-row>

  <van-row type="flex" align="center" style="padding :1rem 0 ">
    <van-col span="2" style="padding-left:0.5rem">
      <div v-html="configs.platform[platformKey].name.replace(/(.{1})/g, '$1<br>')" style="text-align: center;font-size: 1.1rem; color: #1989fa; font-weight: bold;"></div>
    </van-col>
    <van-col span="22">

      <van-row type="flex" align="center"  style="text-align: center;font-size: 0.95rem; color: black;">
        <van-col span="5">
          <van-row>
            <div>做单</div>
          </van-row>

          <van-row>
            <div>APP</div>
          </van-row>
        </van-col>
        <van-col span="19">
          <van-radio-group v-model="configs.platform[platformKey].entryNow" style="display: flex;">
                  <van-radio v-for="option in configs.platform[platformKey].dualLaunchEntry" :key="option.value" :name="option.value" icon-size="0.95rem" style="margin-right:1rem;">
                    {{ option.value }}
                  </van-radio>
                </van-radio-group>
        </van-col>
      </van-row>

      <van-row>
        <hr style="border: 0; border-top: 1px solid hsl(0, 0%, 92%); margin: 0; margin-left: 1rem; margin-right: 1rem; margin-top:0.5rem; margin-bottom:0.5rem"  />
      </van-row>

      <van-row type="flex" align="center"  style="text-align: center;font-size: 0.95rem; color: black;">
        <van-col span="5">
          <van-row>
            <div>付款</div>
          </van-row>

          <van-row>
            <div>方式</div>
          <van-row>
        </van-col>
        <van-col span="19">
          <van-checkbox-group v-model="configs.platform[platformKey].payWay" style="display: flex; flex-wrap: wrap;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.3vh;">
              <div v-for="(payWayOption, index) in configs.platform[platformKey].payWayOptions" :key="index">
                <van-checkbox :name="payWayOption" shape="square" :disabled="configs.platform[platformKey].payWayOptions.length == 1" icon-size="0.95rem">
                  {{ payWayOption }}
                </van-checkbox>
              </div>
            </div>
          </van-checkbox-group>
        </van-col>
      </van-row>
    </van-col>
</van-row>
</div>
</div>
  `,
};
