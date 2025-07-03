/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-08-10 11:09:57
 * @LastEditTime: 2024-08-18 18:09:02
 * @Description:
 */
/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-20 19:01:24
 * @LastEditTime: 2024-08-09 08:57:13
 * @Description:
          { cardNO: "3511", password: "140989", cardType: "信用卡", bankName: "工商银行", owner: "chase" },
 */
const AddBankCard = {
  name: 'AddBankCard',
  mixins: [mixin_common],
  data() {
    return {
      showPicker: false,
      banks:['中国银行', '工商银行', '建设银行', '农业银行', '交通银行', '广发银行', '招商银行', '邮储银行', '网商银行'],
      bankLimit:[{bankName:'广发银行',limit:100},{bankName:'邮储银行',limit:30},{bankName:'招商银行',limit:20}],
      bankCard:{
        cardNO: '',
        password: '',
        cardType: '信用卡',
        bankName: '工商银行',
        owner: 'chase',
        dailyLimit:0,
      },
      configs: {
        bankCardList:[
        ]
      },
    };
  },
  computed:{
    computedCardType: {
      get() {
        return this.bankCard.cardType ? this.bankCard.cardType.split(',') : [];
      },
      set(value) {
        if (this.bankCard) {
          this.bankCard.cardType = value.join(',');
        }
      },
    },

  },
  methods: {
    onSubmit() {
      this.bankCard.bankLimit=this.bankLimit.find(item=>item.bankName==this.bankCard.bankName)?this.bankLimit.find(item=>item.bankName==this.bankCard.bankName).limit:0

      // Check if the payment password is exactly 6 digits
      if (!/^\d{6}$/.test(this.bankCard.password)) {
        this.$toast.fail("支付密码必须是6位数字");
        return;
      }

      // 检查是否已经存在
      const exists = this.configs.bankCardList.some(
        item => item.owner === this.bankCard.owner && 
        item.cardNO == this.bankCard.cardNO && 
        item.bankName == this.bankCard.bankName);
      if(exists){
        // 弹出提示
        this.$toast.fail(`卡片 ${this.bankCard.cardNO} 已经存在`);
      }else{
        this.configs.bankCardList.push(this.bankCard)
        this.$toast.success(`新增卡片 ${this.bankCard.cardNO} 成功`);
      }
    },
    onConfirm(value) {
      this.bankCard.bankName = value;
      this.showPicker = false;
    },
  },
  template: `<div>
    <van-field v-model="bankCard.cardNO" type="digit" label="卡号后四位"
    placeholder="输入卡号后四位" clearable required style="font-size: 1rem;color: black;"/>
    <van-field v-model="bankCard.password" type="digit" label="支付密码" placeholder="输入密码" clearable required style="font-size: 1rem;color: black;"/>
    <van-field v-model="bankCard.owner" type="digit" label="持卡人" placeholder="输入持卡人" clearable required style="font-size: 1rem;color: black;"/>

    <van-field
    readonly
    clickable
    name="picker"
    :value="bankCard.bankName"
    label="银行"
    placeholder="点击选择银行"
    @click="showPicker = true"
    style="font-size: 1rem;color: black;"
    />
    <van-popup v-model="showPicker" position="bottom">
      <van-picker
        show-toolbar
        :columns="banks"
        @confirm="onConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>

    <van-field name="radio" label="卡片类型" style="font-size: 1rem;color: black;">
      <template #input>
        <van-radio-group v-model="bankCard.cardType"  style="display: grid; grid-template-columns: repeat(3, 1fr);place-items: center;">
          <van-radio name="信用卡">信用卡</van-radio>
          <van-radio name="储蓄卡">储蓄卡</van-radio>
        </van-radio-group>
      </template>
    </van-field>

    <div style="margin: 16px;">
      <van-button round block type="info" @click="onSubmit">提交</van-button>
    </div>
  </div>`,
}


const BankCard = {
  name: "BankCard",
  mixins: [mixin_common],
  data() {
    return {
      currentPage: 1, // 当前页码
      itemsPerPage: 8, // 每页显示的订单数
      selectedEnablePayList: {},
      selectedBankName: "全部",
      selectedOwner: "全部",
      configs: {
        bankCardList: [
          { cardNO: "3511", password: "140989", cardType: "信用卡", bankName: "工商银行", owner: "chase", dailyLimit: 0 },
        ],
      },
    };
  },
  computed: {
    // 动态计算 filteredBankCardList
    filteredBankCardList() {
      return this.configs.bankCardList.filter(card => {
        const bankNameMatch = this.selectedBankName === '全部' || card.bankName === this.selectedBankName;
        const ownerMatch = this.selectedOwner === '全部' || card.owner === this.selectedOwner;
        return bankNameMatch && ownerMatch;
      });
    },
    // 动态计算 bankNames
    bankNames() {
      const bankNamesSet = new Set(this.configs.bankCardList.map(card => card.bankName));
      const bankNamesArray = Array.from(bankNamesSet).map(bankName => ({
        text: bankName,
        value: bankName
      }));
      bankNamesArray.unshift({ text: '全部', value: '全部' });
      return bankNamesArray;
    },
    // 动态计算 owners
    owners() {
      const ownersSet = new Set(this.configs.bankCardList.map(card => card.owner));
      const ownersArray = Array.from(ownersSet).map(owner => ({
        text: owner,
        value: owner
      }));
      ownersArray.unshift({ text: '全部', value: '全部' });
      return ownersArray;
    },
    // 计算总页数
    totalPages() {
      return Math.ceil(this.filteredBankCardList.length / this.itemsPerPage);
    },
    // 计算当前页显示的银行卡列表
    paginatedBankCardList() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredBankCardList.slice(start, end);
    }
  },
  methods: {
    deleteBankCard: function (key) {
      this.configs.bankCardList.splice(key, 1);
      Vue.delete(this.selectedEnablePayList, key);
    },
    addBankCard: function () {
      this.$router.push("/payway/addBankCard");
    },
    changeBankNames: function () {
      this.currentPage = 1; // 切换银行名称后回到第一页
    },
    changeOwners: function () {
      this.currentPage = 1; // 切换持卡人后回到第一页
    }
  },
  template: `
       <div style=" position: relative;min-height: 100vh;padding-bottom: 50px;">
        <van-dropdown-menu >
          <van-dropdown-item
            v-model="selectedBankName"
            :options="bankNames"
            placeholder="请选择银行"
           @change="changeBankNames"
          ></van-dropdown-item>
          <van-dropdown-item
            v-model="selectedOwner"
            :options="owners"
            placeholder="请选择持卡人"
           @change="changeOwners"
          ></van-dropdown-item>
        </van-dropdown-menu>
        <div style="padding-bottom: 20px;">
            <div style="overflow:scroll;display: grid; grid-template-columns: 1fr; gap: 0.5rem;margin:0.5rem">
                <div v-for="(value, key) in paginatedBankCardList" :key="key" style="width: 100%;" @click="toggle(key)">
                    <van-swipe-cell style="border: 1px solid #dcdcdc; border-radius: 0.5rem; overflow: hidden;">
                        <van-row>
                            <van-col span="5">
                                <div
                                    style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                    <van-icon :name="value.cardType === '信用卡' ? 'credit-pay' : 'debit-pay'"
                                        color="#1989fa" size="3em" />
                                      <div style="display: flex; justify-content: center; align-items: center;">
                                              <span style="font-size: 0.9rem; color: blue;">
                                                {{value.owner}}
                                              </span>
                                      </div>
                                </div>
                            </van-col>

                            <van-col span="16" style="margin-top: 0.5rem" >
                              <van-col>
                                  <van-col>
                                    <van-row>
                                      <span style="font-size: 1.1rem;margin-left:0.1rem">
                                          {{value.bankName}}
                                      </span>
                                      </van-row>
                                      <van-row>
                                              <span style="font-size: 0.9rem;margin-left:0.1rem">
                                                {{value.cardType}}
                                              </span>
                                      </van-row>

                                  </van-col>

                                <van-col>
                                    <div style="display: flex; justify-content: center; align-items: center;">
                                        <span style="font-weight: bold; font-size: 1.2rem;margin-left:1rem">
                                             xxxx xxxx
                                        </span>
                                        <span style="font-weight: bold; font-size: 1.2rem; color: green;margin-left:0.5rem">
                                             {{value.cardNO}}
                                        </span>
                                    </div>
                                </van-col>
                              </van-col>
                            </van-col>

                            <van-col span="3" >
                                <van-row  type="flex" justify="center" align="center" >
                                        <van-checkbox v-model="selectedEnablePayList[key]" ref="checkboxes" style="padding-top:1rem;" />
                                </van-row>
                            </van-col>
                        </van-row>
                        <template #right>
                            <van-button square type="danger" text="删除" style="height: 100%;"
                                @click="deleteBankCard(key)" />
                        </template>
                    </van-swipe-cell>
                </div>
            </div>
        </div>
        <div>
        </div>
      <div style="position: fixed; left: 0; bottom: 0; width: 100%; background: #fff; border-top: 1px solid #dcdcdc; z-index: 0;">
        <van-button type="primary" block style="width: 100%;" @click="addBankCard">
          新增卡片
        </van-button>
        <van-pagination v-model="currentPage" :total-items="filteredBankCardList.length" :items-per-page="itemsPerPage" />
      </div>
    </div>
   `,
};



