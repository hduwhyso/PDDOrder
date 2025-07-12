const ChannelConfig = {
	name: 'ChannelConfig',
	mixins: [mixin_common],
	data() {
	  return {
		activeNames:[],
		activeNamess: ["0"],
		showPlatformConfig: false,
		show: false,
		currentAmount: null,
		currentQuotes: {},
		provinceOptions: [
		  '内蒙古', '新疆', '西藏', '宁夏', '广西', '北京', '天津', '上海', '重庆', '黑龙江', '吉林', '河北', '山西', '青海', '山东', '河南', '江苏', '安徽', '福建', '江西', '湖南', '湖北', '海南', '甘肃', '陕西', '四川', '贵州', '云南'
		],
		ownerArray: [],
		paymentArray: [],
		paymentPlatformArray: [],
		operator_idOptions: ['移动', '联通', '电信'],
		configs: {
			dict:null,
			payList: [],
		  vender_id: 1039,// 当前做单的 vender_id
		  vender: [
			{
			  vender_id: 1039,
			  vender_name: "PDD渠道api代理",
			  supportPlatform: ["pdd"],
			  chosenPlatform: "pdd",
			  data: {
				amount: "50",
				operator_id: "移动",
				order_num: 1,
				prov_code:
				  "内蒙古,新疆,西藏,宁夏,北京,天津,上海,重庆,黑龙江,吉林,青海,河南,江苏,安徽,江西,湖南,湖北,海南,甘肃,云南",/**退款多 */
			  },
			  user_quote_payment: [
				{ amount: "50", operator_id: "移动", user_quote_payment: 50.8 },
				{ amount: "100", operator_id: "移动", user_quote_payment: 100.1 },
			  ],
			},{
				vender_id: 1024,
				vender_name: "话费官方api",
				supportPlatform: ["jd", "pdd", "unionPay"],
				chosenPlatform: "pdd",
				data: {
				  amount: "100",
				  operator_id: "移动",
				  order_num: 1,
				  prov_code: "内蒙古,新疆,西藏,宁夏,北京,天津,上海,重庆,黑龙江,吉林,青海,河南,江苏,安徽,江西,湖南,湖北,海南,甘肃,云南",
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
		  ],
		  platform: {
			jd: {
			  name: "京东",
			  dualLaunchEntry: [
				{ key: "first", value: "京东", id: ""},
				{ key: "second", value: "双开京东", id: ""},
				{ key: "loop", value: "循环" },
			  ],
			  entryNow: "京东",
			  owner:'',
			  payWay: [],
			  accountID:'',
			  payWayOptions: ["QQ钱包", "微信支付", "京东支付", "云闪付"],
			  amountAllowed: ["100", "200", "300", "500"],
			  operatorAllowed: ["移动"],
			  dailyLimit: "",
			  monthlyLimit: "",
			},
			pdd: {
			  name: "拼多多",
			  dualLaunchEntry: [
				{ key: "first", value: "拼多多", id: ""},
				{ key: "second", value: "双开拼多多", id: ""},
				{ key: "loop", value: "循环" },
			  ],
			  entryNow: "拼多多",
			  owner:'',
			  payWay: [],
			  accountID:'',
			  payWayOptions: ["QQ钱包", "微信支付", "支付宝", "多多支付"],
			  amountAllowed: ["50", "100", "200", "300", "500"],
			  operatorAllowed: ["移动"],
			  dailyLimit: 20,
			  monthlyLimit: 200,
			},
			unionPay: {
			  name: "云闪付",
			  dualLaunchEntry: [
				{ key: "first", value: "云闪付", id: ""},
				{ key: "second", value: "双开云闪付", id: ""},
				{ key: "loop", value: "循环" },
			  ],
			  entryNow: "云闪付",
			  owner:'',
			  payWay: [],
			  accountID:'',
			  payWayOptions: ["云闪付"],
			  amountAllowed: ["30", "50", "100", "200", "300", "500"],
			  operatorAllowed: ["移动"],
			  dailyLimit: 0,
			  monthlyLimit: 10,
			},
		  },
		},
	  };
	},
	computed: {
		currentPlatformKey(){
			return this.currentVender.chosenPlatform
		},
	  currentVender() {
		return this.configs.vender.find(v => v.vender_id === this.configs.vender_id) || {};
	  },
	  currentVenderData() {
		return this.currentVender.data || {};
	  },
	  computedProvinces: {
		get() {
		  return this.currentVenderData.prov_code ? this.currentVenderData.prov_code.split(',') : [];
		},
		set(value) {
		  if (this.currentVender) {
			this.currentVender.data.prov_code = value.join(',');
		  }
		},
	  },
	  computedOperator_id: {
		get() {
			let co=this.currentVenderData.operator_id ? this.currentVenderData.operator_id.split(',') : [];
			co=co.filter(value=>this.configs['platform'][this.currentVender.chosenPlatform]['operatorAllowed'].includes(value))
		  return co;
		},
		set(value) {
		  if (this.currentVender) {
			this.currentVender.data.operator_id = value.join(',');
		  }
		},
	  },
	  computedPlatform: {
		get() {
		  return this.currentVender.chosenPlatform ? this.currentVender.chosenPlatform.split(',') : [];
		},
		set(value) {
		  if (this.currentVender) {
			this.currentVender.chosenPlatform = value.join(',');
		  }
		},
	  },
	  computedAmounts: {
		get() {
			// if()
			let cd=this.currentVenderData.amount ? this.currentVenderData.amount.split(',') : [];
			cd=cd.filter(value=>this.configs['platform'][this.currentVender.chosenPlatform]['amountAllowed'].includes(value))
		  return cd;
		},
		set(value) {
		  if (this.currentVender) {
			this.currentVenderData.amount = value.join(',');
		  }
		},
	  },
	  currentVenderName() {
		return this.configs.vender.find(v => v.vender_id === this.configs.vender_id)["vender_name"];
	  },
	  amountsArr() {
		const amounts = this.currentVender.user_quote_payment.map(uqp => uqp.amount);
		// 去重
		let newArr=[]
		for(var i=0;i<amounts.length;i++) {
		  if(!newArr.includes(amounts[i])){
			newArr.push(amounts[i])
		  }
		}
		newArr=newArr.filter(value => this.configs['platform'][this.currentVender.chosenPlatform]['amountAllowed'].includes(value));
		return newArr;
	  },
	  currentPayWayOptions(){
        if(this.configs.dict && this.configs.dict.paymentPlatform && this.configs.dict.paymentPlatform.length){
            var array = this.configs.dict.paymentPlatform.filter(function(payment){
                return this.configs.platform[this.currentPlatformKey].payWayOptions.indexOf(payment.name) > -1;
            }.bind(this));
            if(array.length === 1){
                if(this.configs.platform[this.currentPlatformKey].payWay.indexOf(array[0].value) === -1){
                    this.configs.platform[this.currentPlatformKey].payWay.push(array[0].value);
                }
            }
            return array;
        }
        return [];
      },
	},
	// async mounted() {
	//   try {
	// 	await this.get_dict();
	//   } catch (error) {
	// 	// 处理可能发生的错误
	// 	console.error("Error during data fetching:", error);
	//   }
	// },
	methods: {
		get_payList() {
          return API.post('http://kk.smartapp.cc:8001/open/feedov/bind/getTargets',{
            "name": this.configs.platform[this.currentPlatformKey].owner,
            "platforms": this.configs.platform[this.currentPlatformKey].payWay,
            "accountID": this.configs.platform[this.currentPlatformKey].accountID
          }).then(function(resp){
            if(resp.data && resp.data.length){
              this.configs.payList = [];
              resp.data.forEach(function(item){
                this.configs.payList.push({
                    channel: item.platform,
                    accountID: item.accountID,
                    nickname: item.nickname,
                    cardNO: item.bankCardLastFour,
                    password: '',
                    cardType: item.cardType,
                    bankName: item.bankName,
                    done: true,
                    canPay: false,
                    count: 0 
                });
              }.bind(this));
            }
            return Promise.resolve(resp.data);
          }.bind(this)).catch(function(e){
            console.error('请求失败', e);
            this.$toast('get_payList请求失败');
            return Promise.resolve(false);
          }.bind(this));
        },
		get_dict() {
		  return API.post('http://kk.smartapp.cc:8001/app/dict/info/data',{"types": ["name","paymentPlatform","cardType","bankName"]}).then(resp => {
		  this.configs.dict=resp.data
		  return Promise.resolve(resp.data)
		  }).catch(e => {
		  console.error('请求失败', e)
		  this.$toast('获取name失败')
		  return Promise.resolve(false)
		  })
		},
		get_payment() {
			console.log(this.configs.platform[this.currentPlatformKey].owner,this.configs.platform[this.currentPlatformKey].payWay)
		  return API.post('http://kk.smartapp.cc:8001/open/feedov/account/getTargets',{"name":this.configs.platform[this.currentPlatformKey].owner,"platforms": this.configs.platform[this.currentPlatformKey].payWay}).then(resp => {
			this.paymentArray=resp.data
			console.log(resp.data)
			return Promise.resolve(resp.data)
		  }).catch(e => {
			console.error('请求失败', e)
			this.$toast('获取name失败')
			return Promise.resolve(false)
		  })
		},
    showActionSheet(value) {
      this.currentAmount = value;
      this.operator_idOptions.forEach(operator => {
        this.currentQuotes[operator] = this.getQuotePayment(value, operator).user_quote_payment;
      });
      this.show = true;
    },
    confirmQuotes() {
      this.operator_idOptions.forEach(operator => {
        this.getQuotePayment(this.currentAmount, operator).user_quote_payment = this.currentQuotes[operator];
      });
      this.show = false;
    },
    getQuotesDisplay(value) {
      let returnValue=this.operator_idOptions.map(operator => this.getQuotePayment(value, operator).user_quote_payment).filter(quote => quote !== undefined && quote !== null)
      if(returnValue.length) return returnValue.join(' / ');
      else return null
    },
    getQuotePayment(amount, operator) {
      return this.currentVender.user_quote_payment.find(uqp => uqp.amount === amount && uqp.operator_id === operator) || {};
    },
    toggleSelectAll() {
      if (this.computedProvinces.length !== this.provinceOptions.length) {
        this.computedProvinces=this.provinceOptions
      }else{this.computedProvinces = [];}
    },
    resetProvinces(){
      this.computedProvinces=['新疆','广西','北京','天津','上海','重庆','河北','山东','河南','江西','湖南','四川','贵州','云南']
    },
    toggle(index) {
      this.$refs.checkboxes[index].toggle();
    },
	showPlatformConfigs(option) {
		this.showPlatformConfig=true
		this.currentPlatformKey=option
	}
	},
	watch:{
	},
	template: `
	<div>
		<van-collapse v-model="activeNames">
 		<van-collapse-item title="当前渠道" :value="currentVenderName" name="1" style="my-custom-class" value-class="my-custom-class">
			<van-cell-group>
			<van-radio-group v-model="configs.vender_id">
				<van-cell v-for="(option, index) in configs.vender" :title="option.vender_name" :key="option.vender_name" clickable @click="configs.vender_id = option.vender_id">
				<van-radio slot="right-icon" :name="option.vender_id" />
				</van-cell>
			</van-radio-group>
			</van-cell-group>

		</van-collapse-item>
		</van-collapse>

		<div>
		<div>
		<span>充值平台：</span>
		<van-cell-group v-for="(option, index) in currentVender.supportPlatform">
			<van-row type="flex" align="center" >
				<van-col span="16">
					<van-radio-group v-model="currentVender.chosenPlatform">
						<van-cell  :title="configs.platform[option].name" :key="index" clickable @click="currentVender.chosenPlatform = option">
						<van-radio slot="right-icon" :name="option" />
						</van-cell>
					</van-radio-group>
				</van-col>
				<van-col span="8">
					<van-button type="primary" size="small" :disabled='configs.platform[option].name!==configs.platform[currentPlatformKey].name' plain block @click="showPlatformConfigs(option)">{{configs.platform[option].name}}平台配置</van-button>
				</van-col>
			</van-row>
		</van-cell-group>
		</div>
		</div>

		<van-popup v-model="showPlatformConfig" position="bottom" :style="{ height: '90%' }" @click-overlay="showPlatformConfig=false" @closed="get_payList" @open="get_dict">
			<div style="font-size: 0.95rem; color: black;">
			<van-divider  style="font-size: 1rem; color: black;">{{configs.platform[currentPlatformKey].name}}平台配置</van-divider>
			<van-row style="type:flex">
				<van-col span="12">
				 <van-field
				 	:disabled="configs.platform[currentPlatformKey].dailyLimit !==0"
				 	type="number"
				 	v-model="configs.platform[currentPlatformKey].dailyLimit"
					label="平台日限制"
					input-align="center"
					placeholder="0为无限制"
					style=" margin-left: 1rem; font-size: 0.9rem;"
					clearable>
		  		</van-field>
				</van-col>
				<van-col span="12">
				 <van-field
				 	:disabled="configs.platform[currentPlatformKey].monthlyLimit !==0"
				 	type="number"
				 	v-model="configs.platform[currentPlatformKey].monthlyLimit"
					label="平台月限制"
					input-align="center"
					placeholder="0为无限制"
					style=" margin-left: 1rem; font-size: 0.9rem;"
					clearable>
		  		</van-field>
				</van-col>
				</van-row>
				<van-row>
					<div style="font-weight: bold;font-size: 1rem;  margin-left:2rem; ">做单APP</div>
				</van-row>
				<van-row style="margin-top: 1rem;margin-bottom: 1rem;">
					<van-radio-group v-model="configs.platform[currentPlatformKey].entryNow" style="display: grid; grid-template-columns: repeat(3, 1fr);gap:0.2vh 4vw;place-items: center;">
						<van-radio v-for="option in configs.platform[currentPlatformKey].dualLaunchEntry" :key="option.value" :name="option.value" icon-size="0.95rem" style="margin-right:1rem;">
							{{ option.value }}
						</van-radio>
					</van-radio-group>
				</van-row>

				<van-row>
					<hr style="border: 0; border-top: 1px solid hsl(0, 0%, 92%); margin: 0; margin-right: 0.5rem; margin-top:0.5rem; margin-bottom:0.5rem"  />
				</van-row>
				<van-row>

				<van-row style="type:flex">
				 <van-field
				 	v-model="configs.platform[currentPlatformKey].dualLaunchEntry[0]['id']"
					:label="configs.platform[currentPlatformKey].dualLaunchEntry[0]['value']+'ID'"
					input-align="center"
					placeholder="请输入ID"
					style="font-weight: bold; margin-left: 1rem; font-size: 0.9rem;"
					clearable>
		  		</van-field>
				 <van-field
				 	v-model="configs.platform[currentPlatformKey].dualLaunchEntry[1]['id']"
					:label="configs.platform[currentPlatformKey].dualLaunchEntry[1]['value']+'ID'"
					input-align="center"
					placeholder="请输入ID"
					style="font-weight: bold; margin-left: 1rem; font-size: 0.9rem;"
					clearable>
		  		</van-field>
				</van-row>

				<van-row>
						<div style="font-weight: bold;font-size: 1rem; margin-left:2rem; margin-top:1rem; ">付款方式</div>
				</van-row>

				 <van-field name="radio" label="名字" style="font-size: 1rem;color: black;">
				<template #input>
					<van-radio-group v-model="configs.platform[currentPlatformKey].owner"  style="display: grid; grid-template-columns: repeat(3, 1fr);place-items: center;">
					<van-radio v-for="(item, index) in configs.dict['name']" :name="item.value" icon-size="0.95rem" style="margin-right:1rem;">{{item.name}}</van-radio>
					</van-radio-group>
				</template>
				</van-field>

				<van-row style="margin-top: 1rem;margin-bottom: 1rem;">
					<van-checkbox-group v-model="configs.platform[currentPlatformKey].payWay" >
						<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap:3vh; margin-left: 2rem;">
						<div v-for="(item, index) in currentPayWayOptions">
							<van-checkbox :name="item.value" shape="square" :disabled="configs.platform[currentPlatformKey].payWayOptions.length == 1" icon-size="0.95rem" >
							{{ item.name }}
							</van-checkbox>
						</div>
						</div>
					</van-checkbox-group>
				</van-row>

				<van-collapse v-model="activeNamess" @change="get_payment">
					<van-collapse-item v-for="(item, index) in currentPayWayOptions" :title="item.name" :name="index" icon="paid" v-if="configs.platform[currentPlatformKey].payWay.includes(item.value)">
						<van-radio-group v-model="configs.platform[currentPlatformKey].accountID" >
							<van-cell-group>
								<van-cell v-for="(item2, index) in paymentArray" clickable :title="item2.accountID" :label="item2.nickname"
									@click="toggle(index)" v-if="item.value==item2.platform">
									<van-radio :name="item2.accountID" ref="checkboxes" slot="right-icon" shape="square" />
								</van-cell>
							</van-cell-group>
						</van-radio-group>
					</van-collapse-item>
				</van-collapse>
			</div>
		</van-popup>

  <template>
	<div>
	  <van-divider :margin="2" style="font-size: 1rem; color: black;">金额</van-divider>
	  <van-checkbox-group v-model="computedAmounts" direction="horizontal">
		<div style="display: grid; grid-template-columns: repeat(4, 1fr); margin-left: 4vw;">
		  <div v-for="(value, index) in amountsArr" :key="index">
			<van-checkbox :name="value" shape="square" :disabled="amountsArr.length === 1" icon-size="0.9rem" style="font-size: 0.9rem;">
			  {{ value + '元' }}
			</van-checkbox>

			<van-tag
			  v-if="computedAmounts.includes(value)"
			  type="primary"
			  style="margin-top: 0.1rem; cursor: pointer;font-size: 0.4rem;"
			  @click="showActionSheet(value)">
			  {{ getQuotesDisplay(value) }}
			</van-tag>
		  </div>
		</div>
	  </van-checkbox-group>

	  <!-- ActionSheet -->
	  <van-action-sheet v-model="show" title="修改报价">
		<template v-for="operator in operator_idOptions" :key="operator">
		  <van-field
			v-if="currentQuotes[operator]"
			v-model="currentQuotes[operator]"
			type="number"

			:label="operator + '报价'"
			input-align="right"
			:placeholder="'输入' + operator + '报价'"
			style="font-weight: bold; color: red; font-size: 0.9rem;"
			clearable>
		  </van-field>
		</template>
		<van-button type="primary" @click="confirmQuotes"   block>确定</van-button>
	  </van-action-sheet>
	</div>
  </template>

		<van-divider :margin="2" style="font-size: 1rem; color: black;">单量</van-divider>
		<van-field v-model="currentVender.data.order_num" type="number" required='true' input-align="right"  label="获取订单数量" placeholder="输入单量"
				clearable/>

		<van-divider :margin="2" style="font-size: 1rem; color: black;">运营商</van-divider>
		<van-checkbox-group v-model="computedOperator_id" direction="horizontal">
			<div style="display: grid; grid-template-columns: repeat(3, 1fr);gap:0.2vh 4vw;place-items: center;">
			  <div v-for="(operator_id, colIndex) in configs['platform'][currentVender.chosenPlatform]['operatorAllowed']" :key="colIndex">
				<van-checkbox :name="operator_id" :disabled="configs['platform'][currentVender.chosenPlatform]['operatorAllowed'].length == 1" shape="square" icon-size="0.9rem" style="font-size: 0.9rem;">
				  {{ operator_id }}
				</van-checkbox>
			  </div>
			</div>
		</van-checkbox-group>

		<van-divider :margin="2" style="font-size: 1rem; color: black;">省份</van-divider>
	  <div style="display: flex; justify-content: space-between; padding: 10px;">
			<van-checkbox icon-size="0.9rem" @click="toggleSelectAll" v-model="computedProvinces.length == provinceOptions.length">全选</van-checkbox>
			<van-button type="primary" size="mini" @click="resetProvinces" style="font-size: 0.7rem;">重置</van-button>
	  </div>
		<van-checkbox-group v-model="computedProvinces" direction="horizontal" ref="checkboxGroup">
		  <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1vh 0.1vw;margin-left:0.8rem">
			<div v-for="(province, colIndex) in provinceOptions" :key="colIndex">
			  <van-checkbox :name="province" shape="square" icon-size="0.9rem" style="font-size: 0.9rem;">
				{{ province }}
			  </van-checkbox>
			</div>
		  </div>
		</van-checkbox-group>

	</div>`,
	style:`
		van-row {
		margin-top: 1rem;
		margin-bottom: 1rem;
		  }
	`,
  };
