/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-14 07:28:06
 * @LastEditTime: 2025-07-13 03:25:33
 * @Description:
   enablePayList=[ { 
   "channel": 3, 
   "accountID": "13811114444", 
   "nickname": null, 
   "cardNO": "花呗", 
   "password": 
   "", 
   "cardType": 0, 
   "bankName": 7, 
   "done": true, 
   "canPay": false, 
   "count": 0 }, ]
 */

const EnablePayList = {
  name: "EnablePayList",
  mixins: [mixin_common],
  data() {
    return {
      selectedEnablePayList: {},
      ownerArray: [],
      configs: {
        dict: null,
        payList: [],
        enablePayList: [],
      },
    };
  },
  computed: {
    allSelected() {
      return this.configs.enablePayList.length && this.configs.enablePayList.every((_, index) => this.selectedEnablePayList[index]);
    },
  },
  // async mounted() {
  //   try {
  //     // get_payList 完成后，执行 get_dict 方法
  //     await this.get_dict();
  //   } catch (error) {
  //     // 处理可能发生的错误
  //     console.error("Error during data fetching:", error);
  //   }
  // },
  methods: {
    //cooladmin的字典查询
    searchDict(value,type){
    if (this.configs.dict && this.configs.dict[type]) {
      const dictresult = this.configs.dict[type].find(v => v.value === value);
      return dictresult ? dictresult.name : null; // 假设字典对象的名称属性是label
    }
    return null
  },
    deletePayWay: function (key) {
      this.configs.enablePayList.splice(key, 1);
      Vue.delete(this.selectedEnablePayList, key);
    },
    toggleSelectAll() {
      const allSelected = Object.keys(this.selectedEnablePayList).length === this.configs.enablePayList.length;
      this.selectedEnablePayList = {};
      if (!allSelected) {
        this.configs.enablePayList.forEach((currentValue, index) => {
          this.$set(this.selectedEnablePayList, index, true);
        });
      }
    },
    deleteSelected() {
      this.configs.enablePayList = this.configs.enablePayList.filter((_, index) => !this.selectedEnablePayList[index]);
      this.selectedEnablePayList = {};
    },
    toggle(index) {
      this.$refs.checkboxes[index].toggle();
    },
  },
  template: `
  <div>
	<div style="display: flex; justify-content: space-between; padding: 10px;">
		<van-checkbox @click="toggleSelectAll" v-model="Object.keys(selectedEnablePayList).length === configs.enablePayList.length">
			全选
		</van-checkbox>
		<div>
			<van-button type="danger" size="small" @click="deletePayWay">
				删除
			</van-button>
		</div>
	</div>
	<div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;margin:0.5rem">
		<div v-for="(item, key) in configs.enablePayList" :key="key" style=" width: 100%;"
		@click="toggle(key)">
			<van-swipe-cell style="border: 1px solid #dcdcdc; border-radius: 0.5rem; overflow: hidden;">
				<van-row>
					<van-col span="6">
						<div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
							<van-icon :name="searchDict(item.cardType,'cardType') === '信用卡' ? 'credit-pay' : 'debit-pay'"
							color="#1989fa" size="4em" />
							<div style="display: flex; justify-content: center; align-items: center;">
								<van-cell :value="searchDict(item.cardType,'cardType')" center style="text-align: center; flex: 1; padding:0;"
								/>
							</div>
						</div>
					</van-col>
					<van-col span="15" style="margin-top: 0.5rem">
						<van-row>
							<span style="font-weight: bold; font-size: 1rem; color: black;">
								{{searchDict(item.channel,'paymentPlatform')}}
							</span>
							<span style="font-size: 0.8rem;margin-left:0.5rem">
								{{searchDict(item.bankName,'bankName') + item.cardNO}}
							</span>
						</van-row>
						<van-row>
							<span style="font-size: 0.8rem;">
								账户：
							</span>
							<span style="font-size: 0.8rem;">
								{{item.accountID}}
							</span>
						</van-row>
						<van-row>
							<span style="font-size: 0.8rem;">
								昵称：
							</span>
							<span style="font-size: 0.8rem;">
								{{item.nickname}}
							</span>
						</van-row>
						<van-row>
							<span style="font-size: 0.8rem;">
								密码：
							</span>
							<span style="font-size: 0.8rem;">
								{{item.password}}
							</span>
						</van-row>
						<van-row>
							<span style="font-size: 0.8rem;">
								付款笔数：
							</span>
							<span style="font-size: 0.8rem;">
								{{item.count}}
							</span>
						</van-row>
						<van-row type="flex" justify="end" style="margin-top: 0.8rem;align-items: center;">
							<span style="font-size: 1rem;">
								付款功能：
							</span>
							<van-switch v-model="item.canPay" size="16" />
						</van-row>
					</van-col>
					<van-col span="3">
						<van-row>
							<div style="display: flex; justify-content: center; align-items: center; margin-top:2rem ">
								<van-checkbox v-model="selectedEnablePayList[key]" ref="checkboxes" />
							</div>
						</van-row>
					</van-col>
				</van-row>
        <template #right>
              <van-button square type="danger" text="删除" style="height: 100%;" @click="deletePayWay(key)" />
            </template>
			</van-swipe-cell>
			</div>
		</div>
	</div>
	`,
};
const PayList = {
  name: "PayList",
  mixins: [mixin_common],
  data() {
    return {
      showPassword: false,
      selectedPayWays: {},
      configs: {
        payPassword: "",
        dict: null,
        active: "0",
        payList: [],
        enablePayList: [],
      },
    };
  },
  computed: {
    currentPlatformKey() {
      return this.currentVender.chosenPlatform;
    },
    currentVender() {
      return this.configs.vender.find(v => v.vender_id === this.configs.vender_id) || {};
    },
    allSelected() {
      return this.configs.payList.length && this.configs.payList.every((_, index) => this.selectedPayWays[index]);
    },
  },
  // async mounted() {
  //   try {
  //     // get_payList 完成后，执行 get_dict 方法
  //     await this.get_dict();
  //   } catch (error) {
  //     // 处理可能发生的错误
  //     console.error("Error during data fetching:", error);
  //   }
  // },
  methods: {
    onPasswordInput(val) {
    // 只保留数字，最多6位
    this.configs.payPassword = val.replace(/\D/g, '').slice(0, 6);
  },
    //cooladmin的字典查询
    searchDict(value, type) {
      if (this.configs.dict && this.configs.dict[type]) {
        const dictresult = this.configs.dict[type].find(v => v.value === value);
        return dictresult ? dictresult.name : null; // 假设字典对象的名称属性是label
      }
      return null;
    },
    toggleSelectAll() {
      const allSelected = Object.keys(this.selectedPayWays).length === this.configs.payList.length;
      this.selectedPayWays = {};
      if (!allSelected) {
        this.configs.payList.forEach((currentValue, index) => {
          this.$set(this.selectedPayWays, index, true);
        });
      }
    },
    addToHome() {
      const pwd = this.configs.payPassword;
      if (!/^\d{6}$/.test(pwd)) {
        this.$toast.fail("请输入6位数字支付密码");
        return;
      }
      Object.keys(this.selectedPayWays).forEach(index => {
        if (this.selectedPayWays[index] && !this.configs.enablePayList.some(item => JSON.stringify(item) === JSON.stringify(this.configs.payList[index]))) {
          this.configs.payList[index].password = this.configs.payPassword;
          this.configs.payList[index].canPay = true;
          this.configs.enablePayList.push(this.configs.payList[index]);
          this.$toast.success(`添加 ${this.configs.payList[index].cardNO} 成功`);
          this.configs.enablePayList.sort((a, b) => {
            return a.channel.toString().localeCompare(b.channel.toString());
          });
        }
      });
      this.selectedPayWays = {};
    },
    singleAddToHome(value) {
      const pwd = this.configs.payPassword;
      if (!/^\d{6}$/.test(pwd)) {
        this.$toast.fail("请输入6位数字支付密码");
        return;
      }
      console.log(JSON.stringify(value), JSON.stringify(this.configs.enablePayList));
      if (!this.configs.enablePayList.some(item => JSON.stringify(item) === JSON.stringify(value))) {
        value.password = this.configs.payPassword;
        value.canPay = true;
        this.configs.enablePayList.push(value);
        this.configs.enablePayList.sort((a, b) => {
          return a.channel.toString().localeCompare(b.channel.toString());
        });
        this.$toast.success(`添加 ${value.cardNO} 成功`);
      } else {
        this.$toast.fail(`${value.cardNO} 已存在`);
      }
    },
    toggle(index) {
      this.$refs.checkboxes[index].toggle();
    },
  },
  template: `
  <div  style="overflow:scroll;">
	<div style="display: flex; justify-content: space-between; padding: 10px;">
		<van-checkbox @click="toggleSelectAll" v-model="Object.keys(selectedPayWays).length === configs.payList.length">
			全选
		</van-checkbox>
		<div>
			<van-button type="primary" size="small" @click="addToHome">
				添加到首页
			</van-button>
		</div>
	</div>
  <van-field
  v-model="configs.payPassword"
  :type="showPassword ? 'text' : 'password'"
  label="支付密码"
  placeholder="请输入6位数字密码"
  maxlength="6"
  inputmode="numeric"
  @input="onPasswordInput"
  @click-right-icon="showPassword = !showPassword"
  :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
/>
	<div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;margin:0.5rem">
		<div v-for="(item, key) in configs.payList" :key="key" style=" width: 100%;"
		@click="toggle(key)">
			<van-swipe-cell style="border: 1px solid #dcdcdc; border-radius: 0.5rem; overflow: hidden;">
				<van-row>
					<van-col span="6">
						<div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
							<van-icon :name="searchDict(item.cardType,'cardType') === '信用卡' ? 'credit-pay' : 'debit-pay'"
							color="#1989fa" size="4em" />
							<div style="display: flex; justify-content: center; align-items: center;">
								<van-cell :value="searchDict(item.cardType,'cardType')" center style="text-align: center; flex: 1; padding:0;"
								/>
							</div>
						</div>
					</van-col>
					<van-col span="15" style="margin-top: 0.5rem">
						<van-row>
							<span style="font-weight: bold; font-size: 1rem; color: black;">
								{{searchDict(item.channel,'paymentPlatform')}}
							</span>
							<span style="font-size: 0.8rem;margin-left:0.5rem">
								{{searchDict(item.bankName,'bankName') + item.cardNO}}
							</span>
						</van-row>
						<van-row>
							<span style="font-size: 0.8rem;">
								账户：
							</span>
							<span style="font-size: 0.8rem;">
								{{item.accountID}}
							</span>
						</van-row>
						<van-row>
							<span style="font-size: 0.8rem;">
								昵称：
							</span>
							<span style="font-size: 0.8rem;">
								{{item.nickname}}
							</span>
						</van-row>
						<van-row>
							<span style="font-size: 0.8rem;">
								密码：
							</span>
							<span style="font-size: 0.8rem;">
								{{item.password}}
							</span>
						</van-row>
						<van-row type="flex" justify="end" style="margin-top: 0.8rem;align-items: center;">
							<van-button  plain type="info" size="mini" @click="singleAddToHome(item)">
				添加到首页
			</van-button>
						</van-row>
					</van-col>
					<van-col span="3">
						<van-row>
							<div style="display: flex; justify-content: center; align-items: center; margin-top:2rem ">
								<van-checkbox v-model="selectedPayWays[key]" ref="checkboxes" />
							</div>
						</van-row>
					</van-col>
				</van-row>
			</van-swipe-cell>
			</div>
		</div>
	</div>
	`,
};
const PayWayConfig = {
  name: "PayWayConfig",
  components: {
    EnablePayList,
    PayList,
  },
  mixins: [mixin_common],
  data() {
    return {
      configs: {
        active: "0",
      },
    };
  },
  created() {
    console.log(this.configs.active);
  },
  template: `
  <div>
    <!-- Display EnablePayList when active is 0 -->
    <div v-if="configs.active === '0'"  style="overflow:scroll; padding-bottom:3rem">
      <EnablePayList />
    </div>

    <!-- Display PayList when active is 1 -->
    <div v-if="configs.active === '1'" style="overflow:scroll; padding-bottom:3rem">
      <PayList />
    </div>
    <van-tabbar v-model="configs.active" fixed >
      <van-tabbar-item name="0" icon="home-o">主页</van-tabbar-item>
      <van-tabbar-item name="1" icon="add">新增</van-tabbar-item>
    </van-tabbar>

  </div>
`,
};

