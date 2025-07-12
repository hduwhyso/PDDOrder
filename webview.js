"ui";

// 示例数据
let orderData = [
    {
        user_order_id: 24070500239809,
        status_name: "处理中",
        business_channel: "话费-PDD渠道api代理-移动",
        target: "15818913302",
        target_desc: '运营商：移动|省份：广东|面值（元）：50', // "移动 | 广东 | 50"
        user_payment: "50.80元",
        create_time: 1720175314 // 时间戳，需转换
    },
    {
        user_order_id: 24070700049405,
        status_name: "异常",
        business_channel: "话费-PDD渠道api代理-移动",
        target: "13665997122",
        target_desc: '运营商：移动|省份：福建|面值（元）：50', // "移动 | 福建 | 50"
        user_payment: "50.85元",
        create_time: 1720175314 // 时间戳，需转换
    },
    {
        user_order_id: 24070711149409,
        status_name: "异常",
        business_channel: "话费-PDD渠道api代理-移动",
        target: "13819119712",
        target_desc: '运营商：移动|省份：福建|面值（元）：50', // "移动 | 福建 | 50"
        user_payment: "50.85元",
        create_time: 1720175314 // 时间戳，需转换
    }
];

// 将时间戳转换为日期字符串
function formatTimestamp(timestamp) {
    let date = new Date(timestamp * 1000);
    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    let hours = ("0" + date.getHours()).slice(-2);
    let minutes = ("0" + date.getMinutes()).slice(-2);
    let seconds = ("0" + date.getSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 处理 target_desc 字符串
function formatTargetDesc(desc) {
    return desc.replace(/运营商：|省份：|面值（元）：/g, '').replace(/\|/g, '|').replace('|50', '|50');
}

// 生成HTML内容
function generateHtml(orderData) {
    let ordersHtml = orderData.map(order => `
        <div class="order">
            <h2>订单号/批次号: ${order.user_order_id}</h2>
            <p><strong>业务渠道:</strong> ${order.business_channel}</p>
            <p><strong>充值号码:</strong> ${order.target} <button class="button" onclick="copyText('${order.target}')">复制</button></p>
            <p><strong>单位数量:</strong> ${formatTargetDesc(order.target_desc)}
            <p><strong>结算金额:</strong> ${order.user_payment}</p>
            <p><strong>订单时间:</strong> ${formatTimestamp(order.create_time)}</p>
            <p class="status_name">${order.status_name}</p>
            <button class="button-yellow" onclick="showDetails()">查看详情</button>
        </div>
    `).join('');
    
    return `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; padding: 16px; font-size: 1.5em; }
            .order { border: 1px solid #ddd; padding: 16px; margin-bottom: 16px; background-color: #fff; position: relative; }
            .order h2 { margin: 0 0 8px 0; font-size: 1.5em; }
            .order p { margin: 4px 0; font-size: 1.5em; }
            .order .status_name { position: absolute; top: 16px; right: 16px; color: green; font-weight: bold; font-size: 1.5em; }
            .button { 
                display: inline-block; 
                padding: 6px 12px; 
                margin-top: 8px; 
                background-color: #f0ad4e; 
                color: #fff; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer; 
                font-size: 1em; 
            }
            .button:hover { background-color: #ec971f; }
            .button-yellow { 
                display: inline-block; 
                padding: 6px 12px; 
                margin-top: 8px; 
                background-color: #ffd700; 
                color: #000; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer; 
                font-size: 1.5em; 
            }
            .button-yellow:hover { background-color: #ffc107; }
        </style>
    </head>
    <body>
        ${ordersHtml}
        <script>
            function copyText(text) {
                navigator.clipboard.writeText(text).then(function() {
                    toast('复制成功');
                }, function(err) {
                    toast('复制失败');
                });
            }
            function showDetails() {
                toast('显示订单详情');
            }
        </script>
    </body>
    </html>`;
}

// 生成HTML字符串
let htmlContent = generateHtml(orderData);

// 将HTML内容保存到本地文件
let htmlFilePath = "/sdcard/order.html";
files.write(htmlFilePath, htmlContent);

// 定义UI布局，包含WebView
ui.layout(
    <vertical>
        <appbar>
            <toolbar title="订单信息"/>
        </appbar>
        <webview id="webview" layout_weight="1"/>
    </vertical>
);

// 加载HTML文件到WebView中
ui.webview.loadUrl("file://" + htmlFilePath);
