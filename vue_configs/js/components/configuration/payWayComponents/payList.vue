<!-- LockConfig.vue -->
<template>
    <div>
        <div style="display: flex; justify-content: space-between; padding: 10px;">
            <van-checkbox @click="toggleSelectAll"
                v-model="Object.keys(selectedPayWays).length === configs.payList.length">
                全选
            </van-checkbox>
            <div>
                <van-button type="danger" size="small" @click="deleteSelected">
                    删除
                </van-button>
                <van-button type="primary" size="small" @click="addToHome">
                    添加到首页
                </van-button>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;margin:0.5rem">
            <div v-for="(value, key) in configs.payList" :key="key" style=" width: 100%;" @click="toggle(key)">
                <van-swipe-cell style="border: 1px solid #dcdcdc; border-radius: 0.5rem; overflow: hidden;">
                    <van-row>
                        <van-col span="6">
                            <div
                                style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                <van-icon :name="value.cardType === '信用卡' ? 'credit-pay' : 'debit-pay'" color="#1989fa"
                                    size="5em" />
                                <div style="display: flex; justify-content: center; align-items: center;">
                                    <van-cell :value="value.cardType" center
                                        style="text-align: center; flex: 1; padding:0;" />
                                </div>
                            </div>
                        </van-col>
                        <van-col span="15" style="margin-top: 0.5rem">
                            <van-row>
                                <span style="font-weight: bold; font-size: 1rem; color: black;">
                                    {{ value.channel }}
                                </span>
                                <span style="font-size: 0.8rem;margin-left:0.5rem">
                                    {{ value.bankName + value.cardNO }}
                                </span>
                            </van-row>
                            <van-row>
                                <span style="font-size: 0.8rem;">
                                    密码：
                                </span>
                                <span style="font-size: 0.8rem;">
                                    {{ value.password }}
                                </span>
                            </van-row>
                            <van-row type="flex" justify="end" style="margin-top: 0.8rem;align-items: center;">
                                <van-button plain type="info" size="small" @click="singleAddToHome(value)">
                                    添加到首页
                                </van-button>
                            </van-row>
                        </van-col>
                        <van-col span="3">
                            <van-row>
                                <div
                                    style="display: flex; justify-content: center; align-items: center; margin-top:2rem ">
                                    <van-checkbox v-model="selectedPayWays[key]" ref="checkboxes" />
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
        <van-button type="primary" block style="width: 100%;" @click="addPayWay">
            新增卡片
        </van-button>
    </div>
</template>

<script>
export default {
    name: 'PayList',
    mixins: [mixin_common], // 确保mixin_common是可导入的
    data() {
        return {
            selectedPayWays: {},
            configs: {
                active: '0',
                payList: [{ "channel": "QQ支付", "cardNO": "3511", "password": "140989", "cardType": "信用卡", "bankName": "工商银行", "color": "#5c6bc0", "done": true, "canPay": true, "count": 0 }, { "channel": "支付宝", "cardNO": "8683", "password": "140989", "cardType": "信用卡", "bankName": "交通银行", "color": "#5c6bc0", "done": true, "canPay": true, "count": 0 }, { "channel": "云闪付", "cardNO": "8683", "password": "140989", "cardType": "信用卡", "bankName": "交通银行", "color": "#5c6bc0", "done": true, "canPay": true, "count": 0 }, { "channel": "双开云闪付", "cardNO": "4124", "password": "663321", "cardType": "信用卡", "bankName": "工商银行", "color": "#5c6bc0", "done": true, "canPay": true, "count": 0 }, { "channel": "QQ支付", "cardNO": "2903", "password": "140989", "cardType": "信用卡", "bankName": "交通银行", "color": "#5c6bc0", "done": true, "canPay": true, "count": 0 }],
                enablePayList: [],
            },
        };
    },
    computed: {
        allSelected() {
            return this.configs.payList.length && this.configs.payList.every((_, index) => this.selectedPayWays[index]);
        },
    },
    methods: {
        addPayWay: function () {
            this.$router.push("/payway/addPayWay");
        },
        deletePayWay: function (key) {
            this.configs.payList.splice(key, 1);
            Vue.delete(this.selectedPayWays, key);
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
        deleteSelected() {
            this.configs.payList = this.configs.payList.filter((_, index) => !this.selectedPayWays[index]);
            this.selectedPayWays = {};
        },
        addToHome() {
            Object.keys(this.selectedPayWays).forEach(index => {
                if (this.selectedPayWays[index] && !this.configs.enablePayList.some(item => JSON.stringify(item) === JSON.stringify(this.configs.payList[index]))) {
                    this.configs.enablePayList.push(this.configs.payList[index]);
                    this.$toast.success(`添加 ${this.configs.payList[index].cardNO} 成功`);
                    this.configs.enablePayList.sort((a, b) => {
                        return a.channel.localeCompare(b.channel);
                    });
                }
            });
            this.selectedPayWays = {};
        },
        singleAddToHome(value) {
            console.log(JSON.stringify(value), JSON.stringify(this.configs.enablePayList))
            if (!this.configs.enablePayList.some(item => JSON.stringify(item) === JSON.stringify(value))) {
                this.configs.enablePayList.push(value);
                this.configs.enablePayList.sort((a, b) => {
                    return a.channel.localeCompare(b.channel);
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
};
</script>

<style scoped>
/* 可以添加组件特定的样式 */
</style>