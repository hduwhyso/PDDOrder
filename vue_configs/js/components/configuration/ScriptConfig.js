/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-07-20 19:01:24
 * @LastEditTime: 2025-07-05 14:21:40
 * @Description:
 */

 const ScriptConfigs = {
   name: "ScriptConfigs",
   mixins: [mixin_common],
   data() {
     return {
       configs: {
        isDualOpen: false, //手机单开还是双开拼多多APP
         loopPay: true,
         useBenefitsFirst: false, //支付宝自动识别优惠
         limitOrders: [{ upperLimitOrders: 18, perDays: 1 },{ upperLimitOrders: 40, perDays: 7 }], //每天每个账号限制单量
         ocr: "MlkitOcr" /**PaddleOcr  MlkitOcr */,
       },
     };
   },
   template: `
   <div style="font-size:1rem; color: black;">
  <van-cell-group>
    <van-cell title="双开充值APP">
      <van-switch v-model="configs.isDualOpen" size="1rem" />
    </van-cell>
    <van-cell title="循环支付">
      <van-switch v-model="configs.loopPay" size="1rem" />
    </van-cell>
    <van-cell title="支付宝自动识别优惠">
      <van-switch v-model="configs.useBenefitsFirst" size="1rem" />
    </van-cell>
    
    <van-cell title="订单量控制">
    </van-cell>
    <van-cell>
<template v-for="(option, index) in configs.limitOrders">
  <van-row type="flex" align="center" :key="index" style="margin-bottom: 1rem;">
    <van-col span="24" style="font-size: 0.85rem; color: black;">
      <van-row type="flex" align="center">
        <span style="margin-right:0.3rem;">每</span>
        <van-stepper v-model="option['perDays']" step="1" />
        <span style="margin-left:0.3rem">天</span>
      </van-row>
    </van-col>
    <van-col span="24" style="margin-top: 0.5rem;">
      <van-field
        v-model="option['upperLimitOrders']"
        label="单量上限"
        placeholder="0为无限制"
        type="number"
        required
        clearable
        input-align="right"
      />
    </van-col>
  </van-row>
</template>
    </van-cell>
    <van-cell-group>
      <van-cell title="OCR选择" reverse-color>
        <van-radio-group v-model="configs.ocr" style="display: flex;">
          <van-radio name="PaddleOcr">PaddleOcr</van-radio>
          <van-radio name="MlkitOcr" style="margin-left:1rem">MlkitOcr</van-radio>
        </van-radio-group>
      </van-cell>
    </van-cell-group>
  </van-cell-group>
</div>
  `,
 };

