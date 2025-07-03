"ui";
// 导入依赖包
importClass("androidx.recyclerview.widget.RecyclerView");
importClass("androidx.recyclerview.widget.ItemTouchHelper");
importClass("androidx.recyclerview.widget.GridLayoutManager");
importClass(java.lang.Thread); // 导入java自带线程

var engine_floatWindow = "";
var entries = [
    '中国银行', '工商银行', '建设银行', '农业银行', '交通银行', '广发银行', '招商银行', '邮储银行', '网商银行'
];

let view_s = ui.inflate(
    <vertical>
        <horizontal>
            <text w="auto" padding="8 8 8 8" textColor="#222222" textSize="14sp" textStyle="bold" text="渠道:" />
            <horizontal>
                <text w="auto" textColor="#222222" textSize="14sp" text="京东支付" />
                <checkbox id="jdPay" marginLeft="4" marginRight="3" textSize="14sp" />
                <text w="auto" textColor="#222222" textSize="14sp" text="云闪付" />
                <checkbox id="unionPay" marginLeft="4" marginRight="3" textSize="14sp" />
            </horizontal>
        </horizontal>
        <horizontal padding="8 1 1 1">
            <text w="auto" textColor="#222222" textSize="14sp" text="微信支付" />
            <checkbox id="wechatPay" marginLeft="4" marginRight="3" textSize="14sp" />
            <text w="auto" textColor="#222222" textSize="14sp" text="QQ" />
            <checkbox id="QQPay" marginLeft="4" marginRight="3" textSize="14sp" />
            <text w="auto" textColor="#222222" textSize="14sp" text="双开云闪付" />
            <checkbox id="secondUnionPay" marginLeft="4" marginRight="3" textSize="14sp" />
        </horizontal>
        <horizontal padding="8 1 1 1">
            <text w="auto" textColor="#222222" textSize="14sp" text="支付宝" />
            <checkbox id="alipay" marginLeft="4" marginRight="3" textSize="14sp" />
            <text w="auto" textColor="#222222" textSize="14sp" text="双开支付宝" />
            <checkbox id="secondAlipay" marginLeft="4" marginRight="3" textSize="14sp" />
        </horizontal>
        <horizontal>
            <text w="auto" padding="8" textColor="#222222" textStyle="bold" textSize="14sp" text="卡号后四位:" />
            <input id="cardNO" hint="余额宝" inputType="text" textSize="14sp" />
        </horizontal>
        <horizontal>
            <text w="auto" padding="8" textColor="#222222" textStyle="bold" textSize="14sp" text="支付密码:" />
            <input id="password" hint="6位支付密码" inputType="number" textSize="14sp" />
        </horizontal>
        <horizontal>
            <text w="auto" padding="10 8 8 8" textColor="#222222" textStyle="bold" textSize="14sp" text="银行名字:" />
            <spinner id="bankName" entries="{{entries.join('|')}}" textSize="14sp" />
        </horizontal>
        <horizontal>
            <text padding="8 8 8 8" textColor="#222222" textSize="14sp" textStyle="bold" text="卡片类型:" />
            <radiogroup orientation="horizontal" id='ddd'>
                <radio id="creditCard" checked="true" text="信用卡" textSize="14sp" textColor="#ff0000" />
                <radio id="debitCard" text="储蓄卡" textSize="14sp" textColor="#ff0000" />
            </radiogroup>
        </horizontal>
    </vertical>, null, false
);

ui.layout(
    <drawer id="drawer">
        <vertical>
            <appbar>
                <toolbar bg="#FF5c50e6" id="toolbar" title="京东App付款" paddingTop="2dp" h="50dp" />
                <tabs id="tabs" />
            </appbar>
            <viewpager id="viewpager">
                <frame>
                    <vertical>
                        <horizontal gravity="center_vertical" padding="0 5 0 0">
                            <Switch id="autoService" checked="{{auto.service != null}}" padding="8 8 8 8" text="无障碍服务" textSize="12sp" textColor="#222222" textStyle="bold" />
                            <Switch id="floaty" padding="8 8 8 8" text="悬浮窗权限" textSize="12sp" textColor="#222222" textStyle="bold" />
                        </horizontal>
                        <Switch id="loopPay" padding="8 8 8 8" text="循环支付" textSize="12sp" textColor="#222222" textStyle="bold" w="auto" />
                        <text w="auto" padding="8 8 8 8" textColor="#222222" textStyle="bold" textSize="12sp" text="蜜蜂汇云手工单相关配置" />
                        <Switch id="autoSubmit" padding="8 8 8 8" text="自动交单" textSize="12sp" textColor="#222222" textStyle="bold" w="auto" />
                        <horizontal gravity="right">
                            <button style="Widget.AppCompat.Button.Colored" id="start" text="启动" padding="12dp" w="*" />
                        </horizontal>
                        <button style="Widget.AppCompat.Button.Colored" id="clearCount" text="清空已付" padding="12dp" w="auto" layout_gravity="right" />
                        <scroll id='firstScroll'>
                            <grid id='enablePayList' spanCount='1'>
                                <relative bg='#FFFFFF' margin='10 1'>
                                    <vertical w='*'>
                                        <card w="*" h="70" margin="2 2" cardCornerRadius="4dp" cardElevation="10dp" foreground="?selectableItemBackground">
                                            <horizontal gravity="center_vertical">
                                                <vertical padding="10 8" h="auto" layout_weight="1">
                                                    <frame>
                                                        <text id="channel" text="{{this.channel}}" textColor="#222222" textSize="16sp" maxLines="1" margin="0 0 0 10" />
                                                    </frame>
                                                    <horizontal>
                                                        <text text="{{this.bankName}}" textColor="#999999" textSize="14sp" />
                                                        <text text="{{this.cardType}}" textColor="#999999" textSize="14sp" />
                                                        <text text="{{this.cardNO}}" textColor="#999999" textSize="14sp" />
                                                        <frame w="*">
                                                            <text text="已付{{this.count}}笔" textColor="#999999" textSize="14sp" layout_gravity="right|center" w="auto" h="auto" padding="0 0 100 0" />
                                                            <Switch id="canPay" checked="{{this.canPay}}" text="付款" textSize="14sp" textColor="#999999" layout_gravity="right|center" h="auto" w="auto" />
                                                        </frame>
                                                    </horizontal>
                                                </vertical>
                                                <frame w="auto" h="*">
                                                    <img id='homeDelete' w='20' h='20' margin='4' background='@drawable/ic_close_white_24dp' backgroundTint='#ff7575' layout_gravity="right|top" layout_alignParentRight='true' />
                                                </frame>
                                            </horizontal>
                                        </card>
                                    </vertical>
                                </relative>
                            </grid>
                        </scroll>
                    </vertical>
                </frame>
                <frame>
                    <vertical>
                        <horizontal>
                            <button id="selectAll" text="全反选" />
                            <button id="delete" text="删除" />
                            <button id="addToEnablePayList" text="添加到首页" />
                        </horizontal>
                        <scroll id='secondScroll'>
                            <vertical>
                                <list id="payList">
                                    <card w="*" h="70" margin="10 5" cardCornerRadius="2dp" cardElevation="1dp" foreground="?selectableItemBackground">
                                        <horizontal gravity="center_vertical">
                                            <vertical padding="10 8" h="auto" layout_weight="1">
                                                <text id="channel" text="{{this.channel}}" textColor="#222222" textSize="16sp" maxLines="1" />
                                                <horizontal>
                                                    <text text="{{this.bankName}}" textColor="#999999" textSize="14sp" />
                                                    <text text="{{this.cardType}}" textColor="#999999" textSize="14sp" />
                                                    <text text="{{this.cardNO}}" textColor="#999999" textSize="14sp" />
                                                    <text text=" 支付密码：" textColor="#999999" textSize="14sp" />
                                                    <text text="{{this.password}}" textColor="#999999" textSize="14sp" />
                                                </horizontal>
                                            </vertical>
                                            <checkbox id="done" marginLeft="4" marginRight="6" checked="{{this.done}}" />
                                        </horizontal>
                                    </card>
                                </list>
                            </vertical>
                        </scroll>
                    </vertical>
                    <fab id="add" w="auto" h="auto" src="@drawable/ic_add_black_48dp" margin="16" layout_gravity="bottom|right" tint="#ffffff" />
                </frame>
                <frame>
                    <vertical>
                        <card cardCornerRadius="10" cardElevation="0">
                            <horizontal w="*" h="auto" marginRight="0">
                            <SearchView id="search" w="*" h="50" margin="5 0" padding="10 0" />
                            </horizontal>
                        </card>
                        <list id="list" w="*" marginBottom="20">
                            <card w="*" h="auto" margin="5 1" cardCornerRadius="10dp" cardElevation="3dp" foreground="?selectableItemBackground">
                                <horizontal gravity="center_vertical">
                                    <vertical padding="10 8" h="auto" layout_weight="1">
                                        <frame>
                                            <text id="phoneNumber" text="{{phoneNumber}}" textColor="#000000" textSize="18sp" textType="bold" />
                                            <text id="orderStatus" text="{{orderStatus}}" textColor="red" textSize="12sp" textType="bold" layout_gravity="right|center" w="auto" h="auto" padding="0 0 15 0" />
                                        </frame>
                                        <text id="detail" text="{{detail}}" textColor="#0f59a4" textSize="12sp" textType="bold" padding="0 0 0 8" />
                                        <horizontal>
                                            <text text="蜜蜂单号：" textColor="#999999" textSize="14sp" maxLines="1" />
                                            <text text="{{MFOrderNumber}}" textColor="#999999" textSize="14sp" />
                                        </horizontal>
                                        <horizontal>
                                            <text text="平台订单号：" textColor="#999999" textSize="14sp" padding="0 0 0 8" />
                                            <text text="{{orderNumber}}" textColor="#999999" textSize="14sp" />
                                        </horizontal>
                                        <horizontal>
                                            <text text="下单时间：" textColor="#999999" textSize="14sp" />
                                            <text text="{{ts_to_time(getOrderTs)}}" textColor="#999999" textSize="14sp" />
                                        </horizontal>
                                        <horizontal>
                                            <text text="交单时间：" textColor="#999999" textSize="14sp" />
                                            <text text="{{ts_to_time(submitTs)}}" textColor="#999999" textSize="14sp" />
                                        </horizontal>
                                        <horizontal>
                                            <text text="截单时间：" textColor="#999999" textSize="14sp" />
                                            <text text="{{ts_to_time(orderDeadlineTs)}}" textColor="#999999" textSize="14sp" />
                                        </horizontal>
                                        <horizontal>
                                            <text text="付款信息：" textColor="#1c0d1a" textSize="14sp" />
                                            <text text="{{paidCard}}" textColor="#1c0d1a" textSize="14sp" />
                                            <text text="付款成功：" textColor="#1c0d1a" textSize="14sp" padding="20 0 0 0" />
                                            <text text="{{isSuccessful}}" textColor="#1c0d1a" textSize="14sp" />
                                        </horizontal>
                                    </vertical>
                                </horizontal>
                            </card>
                        </list>
                    </vertical>
                </frame>
            </viewpager>
        </vertical>
    </drawer>
);

var storage = storages.create("abc33ss33"); // 创建本地存储
var payList = [], enablePayList = []; // payList:卡片信息；enablePayList：首页
var orderMap = storage.get("orderMap") ? new Map(Object.entries(storage.get("orderMap"))) : new Map();
var orderArr = Array.from(orderMap.values()).reverse();
var materialColors = ["#e91e63", "#ab47bc", "#5c6bc0", "#7e57c2", "##2196f3", "#00bcd4", "#26a69a", "#4caf50", "#8bc34a", "#ffeb3b", "#ffa726", "#78909c", "#8d6e63"];
let config={
    "loopPay":true,
    "autoSubmit":true,
    platform:{
        "jd":{name:"京东",
            dualLaunchEntry:"second",
            entryNow:"",

        },
        "pdd":{name:"拼多多",
            dualLaunchEntry:"second",
            entryNow:"",

        },
        "unionPay":{name:"云闪付",
            dualLaunchEntry:"second",
            entryNow:"",

        },
    }
}

// 创建选项菜单(右上角)
ui.emitter.on("create_options_menu", menu => {
    menu.add("清空订单池");
    menu.add("日志");
    menu.add("关于");
    menu.add("退出");
});

// 监听选项菜单点击
ui.emitter.on("options_item_selected", (e, item) => {
    switch (item.getTitle()) {
        case "日志":
            app.startActivity("console");
            break;
        case "关于":
            alert("关于", "welcome to Chase Studio");
            break;
        case "清空订单池":
            confirm("确定吗").then(value => {
                if (value) {
                    storage.put("orderMap", []);
                    orderMap = new Map();
                    orderArr = [];
                    ui.list.setDataSource(orderArr);
                }
            });
            break;
        case "退出":
            ui.finish();
            break;
    }
    e.consumed = true;
});

if (storage.get('config')) config = storage.get('config');
if (storage.get('enablePayList')) enablePayList = storage.get('enablePayList');
if (storage.get('payList')) payList = storage.get('payList');
ui.enablePayList.setDataSource(enablePayList);
ui.payList.setDataSource(payList);
ui.list.setDataSource(orderArr.slice(0, 10));

// 一开始不要显示输入法
activity.getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);


// 文件搜索
ui.search.setIconifiedByDefault(false);
ui.search.setQueryHint("搜索号码/订单号..."); // 搜索的hint
ui.search.setOnQueryTextListener({
    onQueryTextChange(text) {
        try {
            if (text.length == 0) {
                ui.list.setDataSource(orderArr.slice(0, 10));
            } else {
                search(text);
            }
            return true;
        } catch (err) {
            console.error(err);
            return true;
        }
    },
    onQueryTextSubmit(query) {
        try {
            search(query);
            return true;
        } catch (err) {
            console.error(err);
            return true;
        }
    }
});

// 搜索函数
function search(text) {
    var search_list = [];
    for (var i = 0; i < orderArr.length; i++) {
        var folder_list_data = orderArr[i];
        if ((folder_list_data.phoneNumber || "").indexOf(text) >= 0 ||
            (folder_list_data.MFOrderNumber || "").indexOf(text) >= 0 ||
            (folder_list_data.orderNumber || "").indexOf(text) >= 0) {
            search_list.push(folder_list_data);
        }
    }
    ui.list.setDataSource(search_list);
}


let helper = new ItemTouchHelper(new ItemTouchHelper.Callback({
    getMovementFlags: function (recyclerView, viewHolder) {
        let dragFrlg = ItemTouchHelper.UP | ItemTouchHelper.DOWN | ItemTouchHelper.LEFT | ItemTouchHelper.RIGHT;
        return this.makeMovementFlags(dragFrlg, 0);
    },
    onMove: function (recyclerView, viewHolder, target) {
        let fromPosition = viewHolder.getAdapterPosition();
        let toPosition = target.getAdapterPosition();
        if (fromPosition < toPosition) {
            for (let i = fromPosition; i < toPosition; i++) {
                swapArray(ary, i, i + 1);
            }
        } else {
            for (let i = fromPosition; i > toPosition; i--) {
                swapArray(ary, i, i - 1);
            }
        }
        recyclerView.adapter.notifyItemMoved(fromPosition, toPosition);
        return true;
    },
    isLongPressDragEnabled: function () {
        return true;
    },
    onSelectedChanged: function (viewHolder, actionState) {
        this.super$onSelectedChanged(viewHolder, actionState);
        if (actionState != ItemTouchHelper.ACTION_STATE_IDLE) {
            viewHolder.itemView.attr("backgroundTint", "#d0d0d0");
            device.vibrate(7);
            ary = new Array();
            for (let i in enablePayList) ary.push(enablePayList[i]);
        }
    },
    clearView: function (recyclerView, viewHolder) {
        this.super$clearView(recyclerView, viewHolder);
        viewHolder.itemView.attr("backgroundTint", "#FFFFFF");
        enablePayList = ary;
        recyclerView.setDataSource(enablePayList);
        recyclerView.adapter.notifyDataSetChanged();
        storage.put("enablePayList", enablePayList);
    }
}));

function swapArray(arr, index1, index2) {
    arr[index1] = arr.splice(index2, 1, arr[index1])[0];
    return arr;
}

ui.viewpager.setTitles(["首页", "卡片信息", "订单查询"]);
ui.tabs.setupWithViewPager(ui.viewpager);
activity.setSupportActionBar(ui.toolbar);

ui.autoService.on("check", function (checked) {
    if (checked && auto.service == null) {
        new Thread(function () {
            let EnableAccessibility = require("./utility/EnableAccessibility");
            let enableAccessibility = new EnableAccessibility();
            enableAccessibility.enabledAccessibility();
            sleep(3000);
        }).start();
    }
    if (!checked && auto.service != null) {
        auto.service.disableSelf();
        toastLog("已关闭无障碍服务");
    }
});

ui.floaty.on("check", function (checked) {
    if (checked && !hasOverlayPermission()) {
        importClass(android.content.Intent);
        importClass(android.net.Uri);
        importClass(android.provider.Settings);
        var intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + context.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        app.startActivity(intent);
    }
    if (!checked && hasOverlayPermission()) {
        var intent = new Intent();
        intent.setAction("android.settings.action.MANAGE_OVERLAY_PERMISSION");
        context.startActivity(intent);
        toastLog('请手动关闭悬浮窗权限');
    }
});

function setupSwitch(switchElement, configKey) {
    switchElement.on("check", function (checked) {
        config[configKey] = switchElement.isChecked();
        storage.put("config", config);
    });
}

setupSwitch(ui.loopPay, "loopPay");
setupSwitch(ui.autoSubmit, "autoSubmit");

ui.start.click(function () {
    if (engine_floatWindow && !engine_floatWindow.getEngine().isDestroyed()) engine_floatWindow.getEngine().forceStop();
    ui.finish();
    new Thread(function () {
        engine_floatWindow = engines.execScriptFile('./floatWindow.js');
    }).start();
});

ui.clearCount.click(function () {
    enablePayList.forEach(item => {
        item.count = 0;
    });
    storage.put("enablePayList", enablePayList);
    ui.enablePayList.adapter.notifyDataSetChanged();
});

ui.selectAll.on("click", function () {
    payList.forEach(item => {
        item.done = !item.done;
    });
    ui.payList.adapter.notifyDataSetChanged();
});

ui.delete.on('click', function () {
    for (let index = 0; index < payList.length; index++) {
        if (payList[index].done) {
            payList.splice(index, 1);
            index--;
        }
    }
    ui.payList.adapter.notifyDataSetChanged();
});

ui.addToEnablePayList.on('click', function () {
   // 遍历payList中的每个项目
   payList.forEach(item => {
        if (item.done) {
            // 检查enablePayList中是否已经存在相同的项目
            let exists = enablePayList.some(value => value.channel === item.channel && value.cardNO === item.cardNO);
            // 如果不存在相同的项目，则添加到enablePayList
            if (!exists) {
                item['canPay'] = true;
                item['count'] = 0;
                enablePayList.unshift(item);
            }else{toast( item.channel+" "+item.cardNO+" 已存在")}
        }
    });

    // 滚动到顶部
    ui.firstScroll.scrollTo(0, 0);
});

ui.add.on("click", function () {
    dialogs.build({
        customView: view_s,
        title: "新增支付方式",
        titleColor: "#FF00BDFF",
        positive: "新增",
        negative: "取消",
        positiveColor: "#FF00BDFF",
        autoDismiss: false,
        wrapInScrollView: true
    }).on("positive", function (dialog) {
        if (!view_s.jdPay.isChecked() && !view_s.unionPay.isChecked() && !view_s.secondUnionPay.isChecked() && !view_s.wechatPay.isChecked() && !view_s.QQPay.isChecked() && !view_s.alipay.isChecked() && !view_s.secondAlipay.isChecked()) {
            toastLog('请至少勾选一个渠道');
            return;
        }
        if (!view_s.cardNO.text()) {
            toastLog('卡号不能为空');
            return;
        }
        if (typeof view_s.cardNO.text() === 'number' && view_s.cardNO.text().length !== 4) {
            toastLog('请输入四位卡号');
            return;
        }
        if (view_s.password.text().length !== 6) {
            toastLog('请输入六位密码');
            return;
        }
        var cardType = view_s.creditCard.isChecked() ? '信用卡' : '储蓄卡';
        let channels = [
            { id: 'jdPay', name: '京东支付' },
            { id: 'unionPay', name: '云闪付' },
            { id: 'secondUnionPay', name: '双开云闪付' },
            { id: 'wechatPay', name: '微信支付' },
            { id: 'QQPay', name: 'QQ支付' },
            { id: 'alipay', name: '支付宝' },
            { id: 'secondAlipay', name: '双开支付宝' },
        ];
        channels.forEach(channel => {
            if (view_s[channel.id].isChecked()) {
                let ifNew = payList.every(value => !(value.channel === channel.name && value.cardNO === view_s.cardNO.text()));
                if (ifNew) {
                    payList.unshift({
                        channel: channel.name,
                        cardNO: view_s.cardNO.text(),
                        password: view_s.password.text(),
                        cardType: cardType,
                        bankName: view_s.bankName.getSelectedItem(),
                        color: materialColors[random(0, materialColors.length - 1)]
                    });
                }
            }
        });
        ui.secondScroll.scrollTo(0, 0);
        toastLog("新增成功！");
        dialog.dismiss();
    }).on('negative', (dialog) => {
        dialog.dismiss();
    }).show();
});

ui.emitter.on("resume", function () {
    ui.autoService.checked = auto.service != null;
    ui.floaty.checked = hasOverlayPermission();
    helper.attachToRecyclerView(ui.enablePayList);
    orderMap = storage.get("orderMap") ? new Map(Object.entries(storage.get("orderMap"))) : new Map();
    orderArr = Array.from(orderMap.values()).reverse();
    ui.list.setDataSource(orderArr.slice(0, 10));
    ui.enablePayList.setDataSource(enablePayList);
});

helper.attachToRecyclerView(ui.enablePayList);

ui.emitter.on("pause", () => {
    storage.put("payList", payList);
    storage.put("enablePayList", enablePayList);
});

ui.emitter.on('back_pressed', function (event) {
    event.consumed = true;
});

initializeData();

ui.payList.on("item_bind", function (itemView, itemHolder) {
    itemView.done.on("check", function (checked) {
        let item = itemHolder.item;
        item.done = checked;
        storage.put("payList", payList);
    });
});

ui.payList.on("item_click", function (item, i, itemView, listView) {
    itemView.done.checked = !itemView.done.checked;
    item.done = itemView.done.checked;
    storage.put("payList", payList);
});

ui.payList.on("item_long_click", function (e, item, i, itemView, listView) {
    confirm("确定要删除" + item.channel + "吗？").then(ok => {
        if (ok) {
            payList.splice(i, 1);
            ui.payList.adapter.notifyDataSetChanged();
        }
    });
    e.consumed = true;
});

ui.enablePayList.on('item_bind', (itemView, itemHolder) => {
    itemView.homeDelete.on('click', () => {
        enablePayList.splice(itemHolder.position, 1);
        storage.put("enablePayList", enablePayList);
        ui.enablePayList.adapter.notifyDataSetChanged();
    });
    itemView.canPay.on("check", function (checked) {
        let item = itemHolder.item;
        item.canPay = checked;
        storage.put("enablePayList", enablePayList);
    });
});

function initializeData() {
    ui.floaty.setChecked(hasOverlayPermission());
    ui.loopPay.setChecked(config.loopPay);
    ui.autoSubmit.setChecked(config.autoSubmit);
}

function hasOverlayPermission() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
        return android.provider.Settings.canDrawOverlays(context);
    } else {
        return true; // 低于Android 6.0的版本默认有悬浮窗权限
    }
}
function ts_to_time(timestamp) {
    // 时间格式：'2023-10-26 22:43:10'
    if (typeof timestamp === 'string') {
        timestamp = Number(timestamp);
    }
    if (typeof timestamp !== 'number') {
        alert("输入参数无法识别为时间戳");
        return;
    }
    let date = new Date(timestamp);
    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() + 1).toString().padStart(2, '0') + '-';
    let D = date.getDate().toString().padStart(2, '0') + ' ';
    let h = date.getHours().toString().padStart(2, '0') + ':';
    let m = date.getMinutes().toString().padStart(2, '0') + ':';
    let s = date.getSeconds().toString().padStart(2, '0');
    return Y + M + D + h + m + s;
};
