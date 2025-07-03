/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-24 19:40:47
 * @LastEditTime: 2025-02-14 23:25:08
 * @Description: 
 */
const OrderMap = {
  name: 'OrderMap',
  mixins: [mixin_common],
  data() {
    return {
      searchQuery: '',
      configs: {
        dict:null,
        currentOrder: {},
        orderMap: {
          '25021102205601': 
           { rechargePlatform: '话费官方api',
             phoneNumber: '18580531981',
             MFOrderNumber: '25021102205601',
             detail: '移动|重庆|50',
             orderNumber: '250211-182856006032989',
             isSuccessful: true,
             getOrderTs: 1739282750000,
             orderDeadlineTs: 1739283350000,
             submitTs: 1739282805000,
             paidCard: null,
             orderStatus: '充值到账',
             rechargeName: '拼多多',
             rechargeID: '747371291634',
             platform: 1,
             accountID: '17374181073',
             bankName: 2,
             bankCardLastFour: '5317',
             orderStatusCode: 1 }, }
      },
    };
  },
  computed: {
    filteredOrderList() {
      const query = this.searchQuery.toLowerCase();
      return Object.values(this.configs.orderMap).filter(order => 
        (order.phoneNumber && String(order.phoneNumber).toLowerCase().includes(query)) ||
        (order.MFOrderNumber && String(order.MFOrderNumber).toLowerCase().includes(query)) ||
        (order.orderNumber && String(order.orderNumber).toLowerCase().includes(query))
      ).reverse();
    },
    timeRangeOrders() {
      const now = Date.now();
      const oneDay = now - 24 * 60 * 60 * 1000;
      const threeDays = now - 72 * 60 * 60 * 1000;
      const sevenDays = now - 168 * 60 * 60 * 1000;
      const thirtyDays = now - 720 * 60 * 60 * 1000;

      const orders = Object.values(this.configs.orderMap).filter(o => o.submitTs !== null);
      console.log('orders',orders.length);

      return {
        last24h: orders.filter(o => o.submitTs >= oneDay && o?.orderStatusCode==1).length,
        last72h: orders.filter(o => o.submitTs >= threeDays && o?.orderStatusCode==1).length,
        last168h: orders.filter(o => o.submitTs >= sevenDays && o?.orderStatusCode==1).length,
        last720h: orders.filter(o => o.submitTs >= thirtyDays && o?.orderStatusCode==1).length
      };
    }
  },
  methods: {
    formatDate(timestamp) {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    },
    onSearch(query) {
      this.searchQuery = query;
    },
    onCancel() {
      this.searchQuery = '';
    },
    getBankName(value){
      const bankMap = this.configs.dict?.bankName.reduce((map, item) => {
      map[item.value] = item.name;
      return map;
    }, {});
    if(bankMap){
      return bankMap[value];
    }else return null

    },
		get_dict() {
		  return API.post('http://kk.smartapp.cc:8001/app/dict/info/data',{"types": ["name","paymentPlatform","cardType","bankName"]}).then(resp => {
		  this.configs.dict=resp.data
		  return Promise.resolve(resp.data)
		  }).catch(e => {
		  console.error('请求失败', e)
		  this.$toast('获取bankName失败')
		  return Promise.resolve(false)
		  })
		}
  },
  mounted() {
    this.get_dict()
  },
  template: `
  <div style="font-size: 0.7rem; color: black; padding: 1rem;">
  <van-grid :column-num="4" style="margin-bottom: 0.5rem;">
      <van-grid-item>
        <div style="text-align: center; padding: 0.5rem;">
          <div style="font-size: 2rem; color: #1989fa;">{{ timeRangeOrders.last24h }}</div>
          <div style="font-size: 1rem;">1天</div>
        </div>
      </van-grid-item>
      <van-grid-item>
        <div style="text-align: center; padding: 0.5rem;">
          <div style="font-size: 2rem; color: #07c160;">{{ timeRangeOrders.last72h }}</div>
          <div style="font-size: 1rem;">3天</div>
        </div>
      </van-grid-item>
      <van-grid-item>
        <div style="text-align: center; padding: 0.5rem;">
          <div style="font-size: 2rem; color: #ff4444;">{{ timeRangeOrders.last168h }}</div>
          <div style="font-size: 1rem;">7天</div>
        </div>
      </van-grid-item>
      <van-grid-item>
        <div style="text-align: center; padding: 0.5rem;">
          <div style="font-size: 2rem; color:rgba(248, 149, 0, 0.62);">{{ timeRangeOrders.last720h }}</div>
          <div style="font-size: 1rem;">30天</div>
        </div>
      </van-grid-item>
    </van-grid>
      <!-- 搜索框 -->
      <van-search
        v-model="searchQuery"
        placeholder="搜索订单..."
        @search="onSearch"
        @cancel="onCancel"
        style="margin-bottom: 1rem;"
      />
      
      <!-- 订单列表 -->
     <!-- 订单列表 -->
<div v-if="filteredOrderList.length" style="max-width: 600px; margin: 0 auto;">
  <div v-for="(order, key) in filteredOrderList" :key="key" 
       style="border: 1px solid #e8e8e8;
              border-radius: 12px;
              padding: 1rem;
              margin-bottom: 1rem;
              background: #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              transition: all 0.2s;
              position: relative;">
    <!-- 状态角标 -->
    <div :style="{
      position: 'absolute',
      top: '-1px',
      right: '-1px',
      background: order.orderStatusCode === 1 ? '#07c160' : order.orderStatusCode === 0 ? '#ff4444' : '#888',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '0 12px 0 12px',
      fontSize: '0.7rem'
    }">
      {{ order.orderStatus || '放弃' }}
    </div>

    <!-- 主体内容 -->
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
      <!-- 左侧信息 -->
      <div>
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 1.3rem; font-weight: 500; color: #333;">{{ order.phoneNumber }}</span>
          <van-tag 
            :type="order.isSuccessful ? 'success' : 'danger'" 
            size="small"
            style="transform: scale(0.9)">
            {{ order.isSuccessful ? '付款成功' : order.isSuccessful === false ? '未付款' : '未付款' }}
          </van-tag>
        </div>
        
        <div style="display: grid; gap: 0.3rem; font-size: 1rem;">
          <div>
            <span style="color: #666; min-width: 70px; display: inline-block">平台订单号</span>
            <span style="color: #333">{{ order.orderNumber || '-' }}</span>
          </div>
          <div>
            <span style="color: #666; min-width: 70px; display: inline-block">详情</span>
            <span style="color: #333">{{ order.detail }}</span>
          </div>
          <div>
            <span style="color: #666; min-width: 70px; display: inline-block">支付方式</span>
            <span v-if="order.bankName" style="color: #333">
              {{ getBankName(order.bankName) }}{{ order.bankCardLastFour }}
            </span>
            <span v-else style="color: #999">-</span>
          </div>
        </div>
      </div>

      <!-- 右侧时间 -->
      <div style="text-align: right;">
        <div style="font-size: 0.9rem; color: #999; line-height: 1.4;">
          <div>
            {{ formatDate(order.getOrderTs).split(' ')[0] }}<br>
            {{ formatDate(order.getOrderTs).split(' ')[1] }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部补充信息 -->
    <div style="margin-top: 0.8rem; padding-top: 0.5rem; border-top: 1px dashed #eee; font-size: 0.95rem;">
      <div style="display: flex; gap: 0.5rem; color: #666; flex-wrap: wrap;">
        <div style="min-width: calc(50% - 0.5rem);">
          <span style="margin-right: 0.3rem">蜜蜂单号:</span>
          <span style="color: #333; word-break: break-all;">{{ order.MFOrderNumber }}</span>
        </div>
        <div style="min-width: calc(50% - 0.5rem);">
          <span style="margin-right: 0.3rem">渠道:</span>
          <span style="color: #333">{{ order.rechargePlatform }}</span>
        </div>
      </div>
    </div>
      </div>
      <div v-else>
        <van-empty description="没有找到相关订单" />
      </div>
    </div>
  `,
};
