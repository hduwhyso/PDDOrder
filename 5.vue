<!--
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2024-06-20 04:43:33
 * @LastEditTime: 2024-09-30 22:27:16
 * @Description: 
-->


<template>
    <van-collapse v-model="activeNamess">
        <van-collapse-item v-for="(item, index) in currentPayWayOptions" :title="item.name" name="index" icon="paid">
            <van-checkbox-group v-model="configs.platform[currentPlatformKey].payMentID">
                <van-cell-group>
                    <van-cell v-for="(item, index) in get_payment" clickable :title="item.accountID"
                        @click="toggle(index)">
                        <van-checkbox :name="item.accountID" ref="checkboxes" slot="right-icon" shape="square" />
                    </van-cell>
                </van-cell-group>
            </van-checkbox-group>
        </van-collapse-item>
    </van-collapse>


    <van-row style="margin-top: 1rem;margin-bottom: 1rem;">
        <van-checkbox-group v-model="configs.platform[currentPlatformKey].payWay">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap:3vh; margin-left: 2rem;">
                <div v-for="(item, index) in get_payment">
                    <van-checkbox :name="item.value" shape="square"
                        :disabled="configs.platform[currentPlatformKey].payWayOptions.length == 1" icon-size="0.95rem">
                        {{ item.name }}
                    </van-checkbox>
                </div>
            </div>
        </van-checkbox-group>
    </van-row>
</template>

<script lang="ts" name="demo-bind" setup>
// Your existing imports and setup...
import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useCool } from '/@/cool';
import { useDict } from "/$/dict";

// Existing code...
const { dict } = useDict();
dict.refresh(["paymentPlatform", "name", "bankName"]);

const { service } = useCool();
let cardList = ref<any[]>([]);
let bindCardlists = ref<any[]>([])
let accountList = ref<any[]>([]);
let platformList = ref<any[]>([]);
let choosenCardList = ref<any[]>([]);
let choosenAccountID = ref()

let cardlists = <any[]>([])

let name = ref(1); // Watch this for changes
let platform = ref(1); // Watch this for changes

// Computed property for filtered account list
const filteredAccountList = computed(() => {
    if (name.value) {
        if (choosenAccountID.value) {
            const bindCardlist = bindCardlists.value.filter(item => item.name == name.value && item.accountID == choosenAccountID.value)
            const bindCardIds = bindCardlist.map(item => item.bankCardLastFour);
            cardList.value = cardlists.filter(account => {
                return account.name === name.value && !bindCardIds.includes(account.bankCardLastFour);
            });
        } else {
            cardList.value = cardlists.filter(account => {
                return account.name === name.value;
            });
        }
        console.log('ddddd', choosenAccountID.value)
        const accountData = accountList.value.filter(account => {
            return account.name === name.value;
        });
        const platformNameList = accountData.map(item => item.platform);
        platformList.value = dict.get("paymentPlatform").value.filter(item1 => platformNameList.some(item2 => item1.value === item2))
    }
    if (name.value && platform.value) {
        const accountData = accountList.value.filter(account => {
            return account.name === name.value && account.platform === platform.value;
        });
        console.log('accountData', accountData)
        // return accountData.map(item => item.account);
        return accountData;
    } else {
        return [];
    }
});

const findBankName = (data: any) => {
    if (data) {
        let result = dict.get("bankName").value.find(item => item.value === data);
        if (result) return result.name;
    }
    return ""; // 可以根据需要返回一个默认值
};
// Function to fetch data
const getData = async function () {
    accountList.value = await service.demo.account.list();
    cardList.value = await service.demo.card.list();
    cardlists = cardList.value
};
const getBind = async function () {
    bindCardlists.value = await service.demo.bind.list();
    console.log('bindCardlists.value', bindCardlists.value)
};

// Fetch data on mount
onMounted(() => {
    getData();

});

// cl-upsert setup
const Upsert = useUpsert({
    onOpen() {
        choosenAccountID.value = '';
        choosenCardList.value = [];
        getBind()
    },
    async onSubmit(data, { next, done, close }) {
        let arr = <any[]>([])

        for (let i = 0; i < choosenCardList.value.length; i++) {
            // 创建一个新的对象，复制 data 的属性
            const newData = { ...data };

            newData.bankName = choosenCardList.value[i].bank;
            newData.bankCardLastFour = choosenCardList.value[i].bankCardLastFour;
            newData.accountID = choosenAccountID.value

            console.log(newData);
            arr.push(newData);

        }
        next(arr)
        // let currentData = accountList.value.find(item => item.name == data.name && item.platform == data.platform && item.account == data.accountID)
        // data.nickname = currentData.nickname
    },
    items: [
        {
            props: {
                labelWidth: "0px",
            },
            component: {
                name: "cl-form-card", // 自定义组件包装组件
                props: {
                    label: "支付账户信息", // 标签名
                    expand: true, // 默认展开
                    isExpand: true, // 是否可以展开、收起
                },
            },
            children: [

                {
                    label: '持卡人',
                    prop: 'name',
                    component: {
                        name: "el-radio-group",
                        props: {
                            clearable: true,
                            onChange(value) {
                                name.value = value
                            }
                        },
                        options: dict.get("name"),
                    },
                    value: name,
                    required: true,
                },
                {
                    label: '平台名称',
                    prop: 'platform',
                    component: {
                        name: "el-radio-group",
                        options: platformList,
                        props: {
                            clearable: true,
                            onChange(value) {
                                platform.value = value
                            }
                        },
                    },
                    value: platform,
                    required: true
                },
                {
                    label: '账户ID',
                    component: {
                        name: "slot-name2",
                    },
                },
                // {
                //     label: '账户ID',
                //     prop: 'accountID',
                //     component: {
                //         name: "el-select",
                //         options: filteredAccountList,
                //         props: {
                //             clearable: true,
                //             placeholder: "请选择账户ID",
                //             onChange(value) {
                //                 choosenAccountID.value = value
                //             }
                //         },
                //     },
                //     required: true
                // },
            ],
        },
        {
            props: {
                labelWidth: "0px",
            },
            component: {
                name: "cl-form-card",
                props: {
                    label: "银行卡信息",
                },
            },
            children: [
                {
                    label: '卡片选择',
                    component: {
                        name: "slot-name",
                    },
                },
            ],
        },
    ],

});

// cl-table setup
const Table = useTable({
    columns: [
        { type: 'selection' },
        {
            label: 'ID',
            prop: 'id',
            sortable: "desc",
            minWidth: 80
        },
        {
            label: '姓名',
            dict: dict.get("name"),
            dictColor: true,
            prop: 'name',
            minWidth: 80
        },
        {
            label: '平台名称',
            prop: 'platform',
            dict: dict.get("paymentPlatform"),
            dictColor: true,
            minWidth: 80
        },
        { label: '账户ID', prop: 'accountID', minWidth: 140 },
        { label: '昵称', prop: 'nickname', minWidth: 140 },
        {
            label: '银行名称',
            prop: 'bankName',
            dict: dict.get("bankName"),
            minWidth: 80
        },

        { label: '银行卡类型', prop: 'cardType', dict: dict.get("cardType"), dictColor: true, minWidth: 80 },
        { label: '银行卡号后四位', prop: 'bankCardLastFour', minWidth: 80 },
    ]
});

// cl-crud setup
const Crud = useCrud(
    {
        service: service.demo.bind
    },
    (app) => {
        app.refresh();
    }
);


// Refresh function
function refresh(params?: any) {
    Crud.value?.refresh(params);
}
</script>
