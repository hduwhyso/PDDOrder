/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-24 19:40:47
 * @LastEditTime: 2025-07-13 08:41:02
 * @Description: 优化版订单列表
 */
const OrderMap = {
  name: "OrderMap",
  mixins: [mixin_common],
  data() {
    return {
      bankMap: {}, // 缓存bankName映射表
      searchQuery: "",
      statusFilter: "", // 新增：订单状态筛选
      customStart: "", // 新增：自定义时间筛选
      customEnd: "",
      showDetail: false, // 新增：详情弹窗
      detailOrder: {},
      currentPage: 1, // 新增：分页
      pageSize: 4,
      showMonthDetail: false, // 新增：本月详情弹窗
      monthOrderStats: [], // 新增：本月每日订单量
      configs: {
        dict: null,
        currentOrder: {},
        orderMap: {
          25021102205601: {
            rechargePlatform: "话费官方api",
            phoneNumber: "18580531981",
            MFOrderNumber: "25021102205601",
            detail: "移动|重庆|50",
            orderNumber: "250211-182856006032989",
            isSuccessful: true,
            getOrderTs: 1739282750000,
            orderDeadlineTs: 1739283350000,
            submitTs: 1739282805000,
            paidCard: null,
            orderStatus: "充值到账",
            rechargeName: "拼多多",
            rechargeID: "747371291634",
            platform: 1,
            accountID: "17374181073",
            bankName: 2,
            bankCardLastFour: "5317",
            orderStatusCode: 1,
          },
        },
      },
      refreshLoading: false, // 新增：刷新按钮
      orderDetailFields: [
        { key: "phoneNumber", label: "手机号" },
        { key: "MFOrderNumber", label: "蜜蜂单号" },
        { key: "orderNumber", label: "平台单号" },
        { key: "detail", label: "订单详情" },
        { key: "rechargePlatform", label: "充值渠道" },
        { key: "rechargeName", label: "充值账户" },
        { key: "rechargeID", label: "充值ID" },
        { key: "platform", label: "平台编号" },
        { key: "accountID", label: "账户ID" },
        { key: "bankName", label: "支付银行" },
        { key: "bankCardLastFour", label: "卡号后四位" },
        { key: "isSuccessful", label: "付款状态" },
        { key: "orderStatus", label: "订单状态" },
        { key: "orderStatusCode", label: "状态码" },
        { key: "submitTs", label: "提交时间" },
        { key: "getOrderTs", label: "接单时间" },
        { key: "orderDeadlineTs", label: "超时时间" },
      ],
    };
  },
  computed: {
    filteredOrderList() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.getFilteredOrders()
        .reverse()
        .slice(start, start + this.pageSize);
    },
    totalOrderCount() {
      return this.getFilteredOrders().length;
    },
    pageCount() {
      return Math.ceil(this.totalOrderCount / this.pageSize);
    },
    timeRangeOrders() {
      var now = Date.now();
      var oneDay = now - 24 * 60 * 60 * 1000;
      var threeDays = now - 72 * 60 * 60 * 1000;
      var sevenDays = now - 168 * 60 * 60 * 1000;
      var thirtyDays = now - 720 * 60 * 60 * 1000;
      var currentMonth = new Date(now).getMonth();
      var currentYear = new Date(now).getFullYear();
      var orders = Object.values(this.configs.orderMap).filter(function (o) {
        return o && o.submitTs !== null;
      });
      return {
        last24h: orders.filter(function (o) {
          return o && o.submitTs >= oneDay && o.orderStatusCode == 1;
        }).length,
        last72h: orders.filter(function (o) {
          return o && o.submitTs >= threeDays && o.orderStatusCode == 1;
        }).length,
        last168h: orders.filter(function (o) {
          return o && o.submitTs >= sevenDays && o.orderStatusCode == 1;
        }).length,
        last720h: orders.filter(function (o) {
          return o && o.submitTs >= thirtyDays && o.orderStatusCode == 1;
        }).length,
        currentMonth: orders.filter(function (o) {
          var orderDate = new Date(o.submitTs);
          return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth && o.orderStatusCode == 1;
        }).length,
      };
    },
  },
  methods: {
    getFilteredOrders() {
      const query = this.searchQuery.toLowerCase();
      const status = this.statusFilter;
      const startTs = this.customStart ? new Date(this.customStart).getTime() : null;
      const endTs = this.customEnd ? new Date(this.customEnd).getTime() + 86399999 : null;

      return Object.values(this.configs.orderMap).filter(order => {
        if (!order) return false;
        let match = true;
        if (query) {
          match = ["phoneNumber", "MFOrderNumber", "orderNumber"].some(field => order[field] && String(order[field]).toLowerCase().includes(query));
        }
        if (status) match = match && String(order.orderStatusCode) === status;
        if (startTs) match = match && order.submitTs >= startTs;
        if (endTs) match = match && order.submitTs <= endTs;
        return match;
      });
    },
    formatDate(timestamp) {
      if (!timestamp) return "N/A";
      var date = new Date(timestamp);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    },
    onSearch(query) {
      this.searchQuery = query;
      this.currentPage = 1;
    },
    onCancel() {
      this.searchQuery = "";
      this.currentPage = 1;
    },
    getBankName(value) {
      return this.bankMap[value] || value; // 优先使用缓存，没有就降级显示原值
    },
    get_dict() {
      this.refreshLoading = true;
      return API.post('http://kk.smartapp.cc:8001/app/dict/info/data', { types: ['name', 'paymentPlatform', 'cardType', 'bankName'] })
        .then(resp => {
          this.configs.dict = resp.data;
          // 构建 bankMap 缓存
          const bankArr = resp.data.bankName || [];
          const map = {};
          for (let i = 0; i < bankArr.length; i++) {
            map[bankArr[i].value] = bankArr[i].name;
          }
          this.bankMap = map;
          this.refreshLoading = false;
          return Promise.resolve(resp.data);
        })
        .catch(e => {
          console.error('请求失败', e);
          this.$toast('获取bankName失败');
          this.refreshLoading = false;
          return Promise.resolve(false);
        });
    },
    refreshData() {
      this.get_dict();
      this.$toast("数据已刷新");
    },
    showOrderDetail(order) {
      this.detailOrder = order;
      this.showDetail = true;
    },
    showMonthOrders() {
      // 获取本月每天的订单量
      var now = new Date();
      var year = now.getFullYear();
      var month = now.getMonth();
      var days = new Date(year, month + 1, 0).getDate();
      var stats = [];
      for (var d = 1; d <= days; d++) {
        var start = new Date(year, month, d, 0, 0, 0).getTime();
        var end = new Date(year, month, d, 23, 59, 59).getTime();
        var count = Object.values(this.configs.orderMap).filter(function (o) {
          return o && o.submitTs >= start && o.submitTs <= end;
        }).length;
        stats.push({ day: `${month + 1}/${d}`, count: count });
      }
      this.monthOrderStats = stats;
      this.showMonthDetail = true;
    },
    getMonthOrderWeeks() {
      // 生成以周一为起始的二维数组，每个元素为 {day, count} 或 null
      const stats = this.monthOrderStats;
      if (!stats || !stats.length) return [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const days = stats.length;
      const firstDay = new Date(year, month, 1).getDay(); // 0=周日, 1=周一...
      let offset = firstDay === 0 ? 6 : firstDay - 1; // 让周一为0，周日为6
      let arr = [];
      let week = [];
      // 补前置空
      for (let i = 0; i < offset; i++) week.push(null);
      for (let d = 0; d < days; d++) {
        week.push(stats[d]);
        if (week.length === 7) {
          arr.push(week);
          week = [];
        }
      }
      // 补后置空
      if (week.length) {
        while (week.length < 7) week.push(null);
        arr.push(week);
      }
      return arr;
    },
    show30DaysOrders() {
      // 统计过去30天每天的订单量
      const stats = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0).getTime();
        const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59).getTime();
        const count = Object.values(this.configs.orderMap).filter(function (o) {
          return o && o.submitTs >= start && o.submitTs <= end;
        }).length;
        stats.push({
          day: `${day.getMonth() + 1}/${day.getDate()}`,
          count: count,
        });
      }
      this.monthOrderStats = stats;
      this.showMonthDetail = true;
    },
    goPage(page) {
      // 分页跳转方法
      if (page >= 1 && page <= this.pageCount) {
        this.currentPage = page;
      }
    },
  },
  mounted() {
    this.get_dict();
  },
  template: `
  <div style="font-size: 0.7rem; color: black; padding: 1rem; max-width: 800px; margin: auto; padding-bottom: 140px;">
    <van-row style="margin-bottom: 0.5rem; align-items: center;">
      <van-search
        v-model="searchQuery"
        placeholder="搜索订单..."
        @search="onSearch"
        @cancel="onCancel"
        style="flex:1; margin-right: 0.5rem;"
      />
      <van-select v-model="statusFilter" :options="[
        {text:'全部', value:''},
        {text:'成功', value:'1'},
        {text:'失败', value:'0'},
        {text:'放弃', value:'-1'}
      ]" style="width:90px; margin-right:0.5rem;" />
      <div style="display:flex; align-items:center; margin-left:auto;">
        <input type="date" v-model="customStart" style="font-size:0.9rem; margin-right:0.2rem;" />
        <input type="date" v-model="customEnd" style="font-size:0.9rem; margin-right:0.5rem;" />
        <van-button type="primary" size="small" @click="refreshData" :loading="refreshLoading" style="margin-left:0.5rem;">刷新</van-button>
      </div>
    </van-row>
    <van-grid :column-num="5" style="margin-bottom: 0.5rem;">
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
        <div style="text-align: center; padding: 0.5rem; cursor:pointer;" @click="show30DaysOrders">
          <div style="font-size: 2rem; color:rgba(248, 149, 0, 0.62);">{{ timeRangeOrders.last720h }}</div>
          <div style="font-size: 1rem;">30天</div>
        </div>
      </van-grid-item>
      <van-grid-item>
        <div style="text-align: center; padding: 0.5rem; cursor:pointer;" @click="showMonthOrders">
          <div style="font-size: 2rem; color:#e34d59;">
            {{timeRangeOrders.currentMonth}}
          </div>
          <div style="font-size: 1rem;">本月</div>
        </div>
      </van-grid-item>
    </van-grid>
    <!-- 订单列表 -->
    <div v-if="filteredOrderList.length"
     style="margin: 0 auto; max-height: calc(100vh - 320px); overflow-y: auto; padding-right: 4px;">
  <div v-for="(order, key) in filteredOrderList" :key="key"
        style="border: 1px solid #e8e8e8;
              border-radius: 12px;
              padding: 1rem;
              margin-bottom: 1rem;
              background: #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              transition: all 0.2s;
              position: relative;
              display: flex;
              flex-direction: column;">
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
          <div @click="showOrderDetail(order)">
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
    </div>
    <div v-else>
      <van-empty description="没有找到相关订单" />
    </div>
    <!-- 分页始终在页面底部，避免被虚拟按键遮挡 -->
    <div style="position:fixed;left:0;bottom:0;width:100%;background:#fff;z-index:99;box-shadow:0 -2px 8px rgba(0,0,0,0.05);padding:0.8rem 0 1.8rem 0;text-align:center;">
      <span style="margin-right:1rem;">共 {{totalOrderCount}} 条</span>
      <van-button size="small" @click="goPage(currentPage-1)" :disabled="currentPage<=1">上一页</van-button>
      <span style="margin:0 1rem;">{{currentPage}} / {{pageCount}}</span>
      <van-button size="small" @click="goPage(currentPage+1)" :disabled="currentPage>=pageCount">下一页</van-button>
    </div>
    <!-- 本月订单量弹窗 -->
    <van-popup v-model="showMonthDetail" position="center" :style="{width:'98vw',maxWidth:'500px'}">
      <div style="padding:1.5rem 1rem 1rem 1rem;">
        <div style="font-weight:bold; font-size:1.3rem; margin-bottom:1.2rem; text-align:center; color:#222; letter-spacing:2px;">每日订单量</div>
        <div >
          <!-- 星期标题 -->
          <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:8px; margin-bottom:8px;">
            <div v-for="(w,idx) in ['一','二','三','四','五','六','日']" :key="'w'+idx"
              style="text-align:center; color:#888; font-size:1rem; font-weight:bold;">
              周{{w}}
            </div>
          </div>
          <!-- 日期和单量 -->
          <template v-for="(week, widx) in getMonthOrderWeeks()">
            <!-- 日期行 -->
            <div :key="'date-row-'+widx" style="display:grid; grid-template-columns:repeat(7,1fr); gap:8px; margin-bottom:2px;">
              <div v-for="(item, idx) in week" :key="'date-'+widx+'-'+idx"
                style="text-align:center; font-size:1.05rem; color:#555; font-weight:600; background:linear-gradient(90deg,#f3f4f8,#f8f8fa); border-radius:6px; padding:7px 0; box-shadow:0 1px 3px #eee; min-height:32px;">
                <span v-if="item">{{item.day}}</span>
              </div>
            </div>
            <!-- 单量行 -->
            <div :key="'count-row-'+widx" style="display:grid; grid-template-columns:repeat(7,1fr); gap:8px; margin-bottom:14px;">
              <div v-for="(item, idx) in week" :key="'count-'+widx+'-'+idx"
                :style="{
                  textAlign: 'center',
                  fontSize: '1.15rem',
                  color: item && item.count > 0 ? '#e34d59' : '#555',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1.5px solid #e3eaf5',
                  padding: '7px 0',
                  fontWeight: 'bold',
                  boxShadow: '0 1px 3px #f3f6fa',
                  minHeight: '32px'
                }"
              >
                <span v-if="item">{{item.count}}</span>
              </div>
            </div>
          </template>
        </div>
        <div style="margin-top:1.2rem; text-align:right;">
          <van-button type="primary" size="large" @click="showMonthDetail=false">关闭</van-button>
        </div>
      </div>
    </van-popup>
    <!-- 订单详情弹窗 -->
    <van-popup v-model="showDetail" position="center" :style="{width:'90vw',maxWidth:'400px'}">
  <div style="padding:1rem;">
    <div style="font-weight:bold; font-size:1.1rem; margin-bottom:0.5rem;">订单详情</div>
    
    <div v-for="(field, idx) in orderDetailFields" :key="idx" style="font-size:0.95rem; margin-bottom:0.3rem;">
      <span style="color:#666; display:inline-block; min-width: 6rem;">{{ field.label }}：</span>
      <span style="color:#333;">
        <template v-if="field.key.includes('Ts')">
          {{ formatDate(detailOrder[field.key]) }}
        </template>
        <template v-else-if="field.key === 'isSuccessful'">
          {{ detailOrder[field.key] ? '付款成功' : '未付款' }}
        </template>
        <template v-else-if="field.key === 'bankName'">
          {{ getBankName(detailOrder[field.key]) }}
        </template>
        <template v-else>
          {{ detailOrder[field.key] || '-' }}
        </template>
      </span>
    </div>
    <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
      <van-button type="primary" block @click="showDetail=false">关闭</van-button>
    </div>
  </div>
</van-popup>

  `,
};

