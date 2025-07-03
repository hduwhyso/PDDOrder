<!--
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-08-10 10:22:35
 * @LastEditTime: 2024-08-10 10:24:34
 * @Description: 
-->
<!-- LockConfig.vue -->
<template>
    <div>
	<div style="display: flex; justify-content: space-between; padding: 10px;">
		<van-checkbox @click="toggleSelectAll" v-model="Object.keys(selectedEnablePayList).length === configs.enablePayList.length">
			全选
		</van-checkbox>
		<div>
			<van-button type="danger" size="small" @click="deleteSelected">
				删除
			</van-button>
		</div>
	</div>
	<div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;margin:0.5rem">
		<div v-for="(value, key) in configs.enablePayList" :key="key" style=" width: 100%;"
		@click="toggle(key)">
			<van-swipe-cell style="border: 1px solid #dcdcdc; border-radius: 0.5rem; overflow: hidden;">
				<van-row>
					<van-col span="6">
						<div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
							<van-icon :name="value.cardType === '信用卡' ? 'credit-pay' : 'debit-pay'"
							color="#1989fa" size="5em" />
							<div style="display: flex; justify-content: center; align-items: center;">
								<van-cell :value="value.cardType" center style="text-align: center; flex: 1; padding:0;"
								/>
							</div>
                        </div>
					</van-col>
					<van-col span="15" style="margin-top: 0.5rem">
						<van-row>
							<span style="font-weight: bold; font-size: 1rem; color: black;">
								{{value.channel}}
							</span>
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
						<van-row type="flex" justify="end" style="margin-top: 0.8rem;align-items: center;">
							<span style="font-size: 1rem;">
								付款功能：
							</span>
							<van-switch v-model="value.canPay" size="16" />
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
</template>

<script>
export default {
    name: 'EnablePayList',
    mixins: [mixin_common], // 确保mixin_common是可导入的
    data() {
        return {
            selectedEnablePayList: {},
            configs: {
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
    methods: {
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
};
</script>

<style scoped>
/* 可以添加组件特定的样式 */
</style>