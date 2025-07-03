<!--
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-08-10 10:18:42
 * @LastEditTime: 2024-08-10 11:53:23
 * @Description:
-->
<!-- LockConfig.vue -->
<template>
    <div style=" position: relative;min-height: 100vh;padding-bottom: 50px;">

        <div style="padding-bottom: 20px;">
            <div style="overflow:scroll;display: grid; grid-template-columns: 1fr; gap: 0.5rem;margin:0.5rem">
                <div v-for="(value, key) in configs.bankCardList" :key="key" style=" width: 100%;" @click="toggle(key)">
                    <van-swipe-cell style="border: 1px solid #dcdcdc; border-radius: 0.5rem; overflow: hidden;">
                        <van-row>
                            <van-col span="6">
                                <div
                                    style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                    <van-icon :name="value.cardType === '信用卡' ? 'credit-pay' : 'debit-pay'"
                                        color="#1989fa" size="3em" />
                                    <div style="display: flex; justify-content: center; align-items: center;">
                                        <van-cell :value="value.cardType" center
                                            style="text-align: center; flex: 1; padding:0;" />
                                    </div>
                                </div>
                            </van-col>
                            <van-col span="15" style="margin-top: 0.5rem">
                                <van-row>
                                    <span style="font-size: 0.8rem;margin-left:0.5rem">
                                        {{value.bankName + value.cardNO}}
                                    </span>
                                </van-row>
                                <van-row>
                                    <span style="font-size: 0.8rem;">
                                        密码：
                                    </span>
                                    <span style="font-size: 0.8rem;">
                                        {{value.password}}
                                    </span>
                                </van-row>
                            </van-col>
                            <van-col span="3">
                                <van-row>
                                    <div
                                        style="display: flex; justify-content: center; align-items: center; margin-top:2rem ">
                                        <van-checkbox v-model="selectedEnablePayList[key]" ref="checkboxes" />
                                    </div>
                                </van-row>
                            </van-col>
                        </van-row>
                        <template #right>
                            <van-button square type="danger" text="删除" style="height: 100%;"
                                @click="deletePayWay(key)" />
                        </template>
                    </van-swipe-cell>
                </div>
            </div>

        </div>

        <div>
        </div>



        <div style="position: absolute;left: 0;  bottom: 0;  width: 100%;">
            <van-pagination v-model="currentPage" :total-items="totalPages" :items-per-page="itemsPerPage" />
        </div>
    </div>
</template>

<script>
export default {
    name: 'AddPayWay',
    mixins: [mixin_common], // 确保mixin_common是可导入的
    data() {
        return {
            showPicker: false,
            channels: ['京东支付', '双开京东支付', '多多支付', '双开多多支付', '云闪付', '双开云闪付', '微信支付', '双开微信支付', 'QQ支付', '双开QQ支付', '支付宝', '双开支付宝'],
            banks: ['中国银行', '工商银行', '建设银行', '农业银行', '交通银行', '广发银行', '招商银行', '邮储银行', '网商银行'],
            payWays: {
                channel: [],
                cardNO: '',
                password: '',
                cardType: '信用卡',
                bankName: '工商银行',
                color: '#5c6bc0',
                done: true,
                canPay: true,
                count: 0
            },
            configs: {
                active: '0',
                payList: []
            },
        };
    },
    computed: {
        computedCardType: {
            get() {
                return this.payWays.cardType ? this.payWays.cardType.split(',') : [];
            },
            set(value) {
                if (this.payWays) {
                    this.payWays.cardType = value.join(',');
                }
            },
        },

    },
    methods: {
        onSubmit() {
            // Check if at least one payment platform is selected
            if (this.payWays.channel.length === 0) {
                this.$toast.fail('请至少选择一个平台');
                return;
            }

            // Check if the payment password is exactly 6 digits
            if (!/^\d{6}$/.test(this.payWays.password)) {
                this.$toast.fail('支付密码必须是6位数字');
                return;
            }
            // 遍历 payWays.channel 并添加到 payList 中
            this.payWays.channel.forEach(channel => {
                // 检查是否已经存在
                const exists = this.configs.payList.some(item =>
                    item.channel === channel &&
                    item.cardNO == this.payWays.cardNO &&
                    item.bankName == this.payWays.bankName
                );

                if (exists) {
                    // 弹出提示
                    this.$toast.fail(`卡片 ${this.payWays.cardNO} 已经存在`);
                    return;
                } else {
                    // 添加到 payList
                    this.configs.payList.push({
                        channel,
                        cardNO: this.payWays.cardNO,
                        password: this.payWays.password,
                        cardType: this.payWays.cardType,
                        bankName: this.payWays.bankName,
                        color: this.payWays.color,
                        done: this.payWays.done,
                        canPay: this.payWays.canPay,
                        count: this.payWays.count
                    });
                    this.$toast.success(`新增卡片 ${this.payWays.cardNO} 成功`);
                    this.configs.payList.sort((a, b) => {
                        return a.channel.localeCompare(b.channel);
                    });
                }
            });
        },
        onConfirm(value) {
            this.payWays.bankName = value;
            this.showPicker = false;
        },
    },
    created() {
        this.configs.active = '1';
        console.log('this.configs.active', this.configs.active)
    },
};
</script>

<style scoped>
/* 可以添加组件特定的样式 */
</style>