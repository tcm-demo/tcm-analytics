// ===== MULTI-PAGE INIT =====
var CURRENT_PAGE = (document.currentScript && document.currentScript.getAttribute('data-page')) || 'overview';
function navigateTo(pid) { window.location.href = pid + '.html'; }

function initMultiPage(pid) {
  // Set header
  document.getElementById('headerTitle').innerHTML = (pageTitles[pid] || pid)
    + (pid === 'personal-shift' ? ' <span style="font-size:10px;font-weight:500;display:inline-block;padding:2px 8px;border-radius:3px;background:#fff3e0;color:#e65100;border:1px solid #ffe0b2;vertical-align:middle;margin-left:4px">\u7535\u5b50\u79e4\u7ec8\u7aef</span>' : '');
  document.getElementById('headerBreadcrumb').textContent = (PAGE_GROUPS[pid] || '') + ' / ' + (pageTitles[pid] || pid);

  // Show page (add active class) and highlight nav
  activatePage(pid);

  // Hide scope bar for pages that don't need it
  var noScope = ["label-print", "print-plan", "file-store", "price-log", "goods-class", "goods-list", "group-manage", "store-manage", "group-form", "store-form", "remove-guard", "order-hold", "shift-handover", "daily-report", "personal-shift", "product-memo", "item-code"];
  var hideScope = noScope.indexOf(pid) >= 0;
  var scopeBar = document.getElementById('scopeBar');
  if (scopeBar) scopeBar.style.display = hideScope ? 'none' : '';
  var scopeDt = document.querySelector('.scope-datetime');
  if (scopeDt) scopeDt.style.display = hideScope ? 'none' : '';
  var scopeItems = document.querySelectorAll('.scope-bar .scope-item');
  scopeItems.forEach(function(el) { el.style.display = hideScope ? 'none' : ''; });
  var scopeSep = document.querySelectorAll('.scope-bar .scope-sep');
  scopeSep.forEach(function(el) { el.style.display = hideScope ? 'none' : ''; });
  var scopeSpacer = document.querySelectorAll('.scope-bar .scope-spacer');
  scopeSpacer.forEach(function(el) { el.style.display = hideScope ? 'none' : ''; });

  // Full-width pages: remove content padding
  var content = document.querySelector('.content');
  if (content) {
    content.style.padding = hideScope ? '0' : '';
    content.style.overflow = hideScope ? 'hidden' : '';
  }

  // Init page
  if (!initializedPages.has(pid)) {
    initializedPages.add(pid);
    setTimeout(function() { initPage(pid); }, 100);
  }
}

// ===== CHART DEFAULTS =====
if (typeof Chart !== 'undefined') {
Chart.defaults.font.family = "'PingFang SC', 'Microsoft YaHei', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 14;

if (typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
  Chart.defaults.plugins.datalabels = { display: false };
}

// ---- 饼图外侧引线标注插件 ----
Chart.register({
  id: 'pieOuterLabels',
  afterDraw: function(chart) {
    if (chart.config.type !== 'doughnut' && chart.config.type !== 'pie') return;
    var outerLabels = chart.config.options && chart.config.options._outerLabels;
    if (!outerLabels) return;
    var ctx = chart.ctx;
    var ds = chart.data.datasets[0];
    if (!ds) return;
    var total = ds.data.reduce(function(a,b){return a+b;},0);
    if (!total) return;
    var meta = chart.getDatasetMeta(0);
    var labels = chart.data.labels || [];
    ctx.save();
    ctx.font = '500 11.5px -apple-system,sans-serif';
    meta.data.forEach(function(arc, i) {
      var val = ds.data[i];
      if (!val) return;
      var pct = Math.round(val / total * 100);
      if (pct < 3) return;
      var startAngle = arc.startAngle;
      var endAngle = arc.endAngle;
      var midAngle = (startAngle + endAngle) / 2;
      var cx = arc.x, cy = arc.y;
      var outerR = arc.outerRadius;
      var r1 = outerR + 8;
      var r2 = outerR + 22;
      var r3 = outerR + 26;
      var x1 = cx + Math.cos(midAngle) * r1;
      var y1 = cy + Math.sin(midAngle) * r1;
      var x2 = cx + Math.cos(midAngle) * r2;
      var y2 = cy + Math.sin(midAngle) * r2;
      var right = Math.cos(midAngle) >= 0;
      var lineLen = 18;
      var x3 = x2 + (right ? lineLen : -lineLen);
      var y3 = y2;
      var label = labels[i] || '';
      var text = label + ' ' + pct + '%';
      ctx.strokeStyle = ds.backgroundColor[i] || '#999';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();
      ctx.fillStyle = ds.backgroundColor[i] || '#999';
      ctx.beginPath();
      ctx.arc(x1, y1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.textBaseline = 'middle';
      ctx.textAlign = right ? 'left' : 'right';
      ctx.fillText(text, x3 + (right ? 4 : -4), y3);
    });
    ctx.restore();
  }
});

// ---- 环形图中心总额插件 ----
Chart.register({
  id: 'doughnutCenter',
  afterDraw: function(chart) {
    if (chart.config.type !== 'doughnut') return;
    var fmt = chart._centerFormat, label = chart._centerLabel;
    if (!fmt) return;
    var ds = chart.data.datasets[0];
    if (!ds || !ds.data || ds.data.length === 0) return;
    var total = ds.data.reduce(function(a,b) { return a + b; }, 0);
    var ctx = chart.ctx, cw = chart.width, ch = chart.height;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '500 16px sans-serif'; ctx.fillStyle = '#333';
    ctx.fillText(fmt(total), cw/2, ch/2 - 6);
    ctx.font = '400 11px sans-serif'; ctx.fillStyle = '#999';
    ctx.fillText(label || '', cw/2, ch/2 + 14);
    ctx.restore();
  }
});
}

const GREEN_PALETTE = ['#1088C3','#3EB27E','#83BFF4','#FFB86C','#CAAED8','#FF7500','#9E61C1'];
const MULTI_PALETTE = ['#1088C3','#FF7500','#83BFF4','#FFB86C','#3EB27E','#F35352','#9E61C1'];

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function closeConceptBar() {
  const bar = document.getElementById('ov-concept-bar');
  const btn = document.getElementById('conceptReopenBtn');
  bar.classList.add('hidden');
  btn.classList.remove('hidden');
}

function openConceptBar() {
  const bar = document.getElementById('ov-concept-bar');
  const btn = document.getElementById('conceptReopenBtn');
  bar.classList.remove('hidden');
  btn.classList.add('hidden');
}

// ===== UPDATE TICKER（仅 deploy 时更新） =====
var TICKER_DATA = [
  { date: '07/01', type: 'new', title: '商品分类', page: 'goods-class', status: 'done' },
  { date: '07/01', type: 'adjust', title: '商品列表', page: 'goods-list', status: 'done' },
  { date: '07/01', type: 'new', title: '企业管理', page: 'group-manage', status: 'pending' },
  { date: '07/01', type: 'new', title: '门店管理', page: 'store-manage', status: 'done' },
];

function initTicker() {
  var track = document.getElementById('tickerTrack');
  if (!track) return;
  var html = '';
  TICKER_DATA.forEach(function(item) {
    var tagText = item.type === 'new' ? '新增' : '调整';
    var tagCls = item.type === 'new' ? 't-tag-feat' : 't-tag-opt';
    var statusCls = item.status === 'done' ? '' : ' t-pending';
    var desc = item.status === 'done' ? item.title + '功能' : item.title + '（修改中）';
    var pageAttr = item.status === 'done' ? ' data-page="'+item.page+'" style="cursor:pointer"' : '';
    html += '<span class="ticker-item'+statusCls+'"'+pageAttr+'>'
      + '<span class="t-tag '+tagCls+'">'+tagText+'</span>'
      + '<span class="t-date">'+item.date+'</span> '
      + desc
      + '</span>';
  });
  track.innerHTML = html + html;
  // 委托点击
  track.addEventListener('click', function(e) {
    var el = e.target.closest('.ticker-item');
    if (el && el.dataset.page) switchPage(el.dataset.page);
  });
}

// ===== DATE RANGE STATE =====
let currentRange = 'today';
const chartMap = {}; // canvasId -> Chart instance
const ovCharts = {}; // overview chart instances (in-place update)

function makeChart(canvasId, config) {
  if (typeof Chart === 'undefined') return null;
  try {
    if (chartMap[canvasId]) chartMap[canvasId].destroy();
    const chart = new Chart(document.getElementById(canvasId), config);
    chartMap[canvasId] = chart;
    return chart;
  } catch(e) { console.warn('Chart init failed:', canvasId, e); return null; }
}

// ===== DYNAMIC DATE & TREND HELPERS (基于 new Date()) =====
function getTodayDate() { return new Date(); }
function getWeekRange() {
  var now = new Date(), dow = now.getDay(); dow = dow === 0 ? 6 : dow - 1;
  var mon = new Date(now); mon.setDate(now.getDate() - dow);
  return { start: mon, end: now };
}
function getMonthRange() {
  var now = new Date();
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
}
function computeDateMeta() {
  var now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  var tStr = y + '-' + pad(m) + '-' + pad(d);
  var wk = getWeekRange();
  var wkStr = y + '-' + pad(wk.start.getMonth() + 1) + '-' + pad(wk.start.getDate()) + ' ~ ' + tStr;
  return {
    today: {
      dateLabel: '📅 ' + tStr + '（今日）',
      sidebarDate: '今日 ' + tStr + ' · 营业中',
      conceptDate: '📅 数据周期：' + tStr + '（今日）',
      trendTitle: '近7日营业额趋势',
      trendSub: '近7日：营业额 + 订单量双轴对比',
      hourTitle: '今日时段销售分布',
      pieSub: '6大品类 · 共 ¥11,395'
    },
    week: {
      dateLabel: '📅 ' + wkStr + '（本周）',
      sidebarDate: '本周 ' + wkStr + ' · 营业中',
      conceptDate: '📅 数据周期：' + wkStr + '（本周一至今天）',
      trendTitle: '本周营业额趋势',
      trendSub: '本周每日：营业额 + 订单量双轴对比',
      hourTitle: '本周日均时段分布',
      pieSub: '6大品类 · 共 ¥99,410'
    },
    month: {
      dateLabel: '📅 ' + y + '年' + m + '月（本月）',
      sidebarDate: '本月 ' + y + '年' + m + '月 · 营业中',
      conceptDate: '📅 数据周期：' + y + '-' + pad(m) + '-01 ~ ' + tStr + '（本月）',
      trendTitle: '本月营业额趋势',
      trendSub: '按日：营业额 + 订单量双轴对比',
      hourTitle: '本月平均时段分布',
      pieSub: '6大品类 · 共 ¥99,410'
    },
    year: {
      dateLabel: '📅 ' + y + '年1-' + m + '月',
      sidebarDate: '本年 ' + y + ' · 营业中',
      conceptDate: '📅 数据周期：' + y + '-01 ~ ' + tStr + '（本年累计）',
      trendTitle: '本年月度营业额趋势',
      trendSub: '按月：营业额 + 订单量双轴对比',
      hourTitle: '本年平均时段分布',
      pieSub: '6大品类 · 共 ¥1,680,000'
    }
  };
}
function parseAmount(str) {
  if (!str) return null;
  var num = parseFloat(String(str).replace(/[^\d.]/g, ''));
  if (isNaN(num)) return null;
  return String(str).indexOf('万') >= 0 ? num * 10000 : num;
}
function seededRand(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 动态生成概览趋势图（标签+数值），按范围自适应粒度与量级
function genOverviewTrend(range) {
  var now = new Date();
  // 自定义日期时用选中日期为参照点
  if (periodOverrides.today && range === 'today') now = new Date(periodOverrides.today.date + 'T00:00:00');
  if (periodOverrides.week && range === 'week') now = new Date(periodOverrides.week.end + 'T00:00:00');

  var labels = [], dates = [], n, base;
  if (range === 'today') {
    n = 7; base = 11000;
    for (var i = n - 1; i >= 0; i--) { var d = new Date(now); d.setDate(now.getDate() - i); dates.push(d); labels.push((d.getMonth() + 1) + '/' + d.getDate()); }
  } else if (range === 'week') {
    n = 7; base = 4900; var wk = periodOverrides.week ? {start:new Date(periodOverrides.week.start + 'T00:00:00'), end:new Date(periodOverrides.week.end + 'T00:00:00')} : getWeekRange(); var wn = ['日','一','二','三','四','五','六'];
    for (var i = 0; i < 7; i++) { var d = new Date(wk.start); d.setDate(wk.start.getDate() + i); dates.push(d); labels.push((d.getMonth() + 1) + '/' + d.getDate() + '（周' + wn[d.getDay()] + '）'); }
  } else if (range === 'month') {
    n = Math.min(now.getDate(), 28); base = 3300;
    for (var i = 1; i <= n; i++) { var d = new Date(now.getFullYear(), now.getMonth(), i); dates.push(d); labels.push((now.getMonth() + 1) + '/' + i); }
  } else {
    n = now.getMonth() + 1; base = 86000;
    for (var i = 1; i <= n; i++) { labels.push(i + '月'); dates.push(null); }
  }
  var rnd = seededRand(now.getFullYear() * 1000 + now.getMonth() + n);
  var biz = [], orders = [];
  for (var i = 0; i < n; i++) {
    var dowFactor = 1;
    if (dates[i]) { var dw = dates[i].getDay(); dowFactor = (dw === 0 || dw === 6) ? 1.15 : 1; }
    var trend = 0.85 + 0.3 * (i + 1) / n;
    var v = Math.round(base * trend * dowFactor * (0.9 + rnd() * 0.2));
    biz.push(v); orders.push(Math.round(v / 73));
  }
  return { labels: labels, biz: biz, orders: orders };
}
// 动态生成时段图（粒度随范围自适应）
function genHourData(range) {
  var now = new Date();
  if (range === 'today') {
    return { labels: Array.from({ length: 24 }, (_, i) => i + '时'), data: [0,0,0,0,0,0,3,5,11,19,28,22,26,22,20,0,0,0,0,0,0,0,0,0] };
  }
  if (range === 'week') {
    return { labels: ['周一','周二','周三','周四','周五','周六','周日'], data: [18,22,26,24,30,42,38] };
  }
  if (range === 'month') {
    var n = now.getDate(), labels = [];
    for (var i = 1; i <= n; i++) labels.push(i + '日');
    return { labels: labels, data: labels.map(function (_, i) { return Math.round(36 * (0.7 + 0.6 * Math.sin(i / 3))); }) };
  }
  var mlabels = []; for (var i = 1; i <= now.getMonth() + 1; i++) mlabels.push(i + '月');
  return { labels: mlabels, data: mlabels.map(function (_, i) { return Math.round(900 * (0.7 + 0.5 * Math.sin(i / 2))); }) };
}

// ===== DATA MODEL =====
const DATA = {
  today: {
    dateLabel: '📅 2026-05-27（今日）',
    sidebarDate: '今日 2026-05-27 · 营业中',
    conceptDate: '📅 数据周期：2026-05-27（今日）',

    overview: {
      k1: { lbl:'今日交易额', val:'<span>¥</span>12,916', chg:'▲ 8.2% 较昨日', dir:'up' },
      k2: { lbl:'今日营业额', val:'<span>¥</span>11,395', chg:'▲ 7.5% 较昨日', dir:'up' },
      k3: { lbl:'今日营收', val:'<span>¥</span>11,015', chg:'▲ 6.8% 较昨日', dir:'up' },
      k4: { lbl:'今日订单数', val:'156<span>单</span>', chg:'▲ 5.4% 较昨日', dir:'up' },
      k5: { lbl:'今日优惠金额', val:'<span>¥</span>1,285', chg:'▼ 0.5% 收窄', dir:'down' },
      k6: { lbl:'今日退款金额', val:'<span>¥</span>616', chg:'▼ 2.1% 改善', dir:'down', refundDetail:'当期 ¥236 · 跨期 ¥380' },
      k7: { lbl:'今日客单价(成交)', val:'<span>¥</span>70.6', chg:'▲ 1.4% 较昨日', dir:'up' },
      k8: { lbl:'优惠率', val:'10.0<span>%</span>', chg:'▼ 较昨日-0.2%', dir:'down' },
      k9: { lbl:'当期退款率', val:'2.1<span>%</span>', chg:'▼ 较昨日-0.1%', dir:'down' },
      k10: { lbl:'营收/营业额比', val:'96.7<span>%</span>', chg:'▼ 较昨日-0.5%', dir:'down' },
    },
    trendTitle: '近7日营业额趋势',
    trendSub: '近7日：营业额 + 订单量双轴对比',
    trendLabels: ['5/21','5/22','5/23','5/24','5/25(一)','5/26(二)','5/27(三)'],
    trendBiz: [9520, 9480, 9150, 8920, 12154, 10626, 11395],
    trendOrders: [128, 124, 122, 118, 162, 148, 156],
    hourTitle: '今日时段销售分布',
    hourData: [0,0,0,0,0,0,3,5,11,19,28,22,26,22,20,0,0,0,0,0,0,0,0,0],
    topProducts: [
      {name:'土豆', cat:'蔬菜', qty:'42件', val:'¥520', pct:100, chg:'+12%', dir:'up'},
      {name:'西红柿', cat:'蔬菜', qty:'35件', val:'¥460', pct:88, chg:'-3%', dir:'down'},
      {name:'鸡蛋', cat:'蛋奶', qty:'30件', val:'¥398', pct:77, chg:'+8%', dir:'up'},
      {name:'白菜', cat:'蔬菜', qty:'28件', val:'¥335', pct:64, chg:'+5%', dir:'up'},
      {name:'猪肉', cat:'肉禽', qty:'15件', val:'¥310', pct:60, chg:'-2%', dir:'down'},
    ],
    pieData: {labels:['蔬菜','水果','肉禽','水产','粮油','其他'], data:[38,20,18,10,8,6]},
    pieSub: '6大品类 · 共 ¥11,395',
    // 洞察卡片 — 4 维度结构化数据
    insights: [
      { title:'销售健康度', items: [
        '今日交易额 ¥12,916，<b>营业额 ¥11,395</b>，营收 ¥11,015，连续3日上涨',
        '优惠率 <b>10.0%</b>，较昨日收窄 0.5pct <span class="ins-tag good">改善</span>',
        '客单价 ¥70.6，环比 <b>+1.4%</b>，高于月均 ¥65.0'
      ]},
      { title:'商品与品类', items: [
        '蔬菜品类贡献 <b>35%</b> 营业额，土豆/西红柿/白菜包揽 Top 3',
        '猪肉销量 15 件，环比 <b>−2%</b> <span class="ins-tag warn">下滑</span>，鸡蛋增长 +8%',
        '本周热销品类集中度高，Top 5 占销售额 <b>61%</b>'
      ]},
      { title:'客群与流量', items: [
        '今日 156 单，<b>上午 10-11 点</b> 为全天客流高峰（占 22%）',
        '时段分布呈双峰结构：早市 9-11 点 + 晚市 17-19 点',
        '今日订单量较昨日 <b>+5.4%</b>，晚高峰回暖明显'
      ]},
      { title:'风险与建议', items: [
        '今日跨期退款 ¥380，占总退款 <b>61.7%</b> <span class="ins-tag warn">需关注</span>',
        '土豆/鸡蛋/猪肉 3 个 SKU 库存低于安全线，建议今日补货',
        '晚高峰 17-19 点客流占 32%，可增加该时段限时促销活动'
      ]}
    ],

    crossPeriod: {
      thisWeek: { orderCount:156, txAmt:12916, bizAmt:11395, revAmt:11015, curRefund:236, crossRefund:380, totalRefund:616, discount:1285 },
      lastWeek: { orderCount:148, txAmt:11940, bizAmt:10626, revAmt:10216, curRefund:258, crossRefund:410, totalRefund:668, discount:1056 },
    },
    dailyRefund: {
      labels: ['今日5/27'],
      curRefund: [236],
      crossRefund: [380],
      lastWeekCurRefund: [258],
      lastWeekCrossRefund: [410],
    },

    transaction: {
      k1: { lbl:'今日交易额(原价)', val:'<span>¥</span>1.29<span>万</span>', chg:'▲ 8.2% 较昨日', dir:'up' },
      k2: { lbl:'今日营业额', val:'<span>¥</span>1.14<span>万</span>', chg:'▲ 7.5% 较昨日', dir:'up' },
      k3: { lbl:'今日营收', val:'<span>¥</span>1.10<span>万</span>', chg:'▲ 6.8% 较昨日', dir:'up' },
      k4: { lbl:'今日优惠金额', val:'<span>¥</span>1,285', chg:'▼ 0.5% 收窄', dir:'down' },
      k5: { lbl:'优惠率', val:'10.0<span>%</span>', chg:'▼ 0.5% 收窄', dir:'down' },
      k6: { lbl:'当期退款率', val:'1.8<span>%</span>', chg:'▼ 0.1% 改善', dir:'down' },
      k7: { lbl:'跨期退款金额', val:'<span>¥</span>380', chg:'▲ 较昨日+3.2%', dir:'down' },
      k8: { lbl:'营收/营业额比', val:'96.7<span>%</span>', chg:'▼ 较昨日−0.3%', dir:'down' },
    },
    txTrendTitle: '交易额 → 营收 全链路',
    txTrendSub: '今日时段：原价交易额、营业额、营收、优惠四线对比',
    txTrendLabels: ['6时','7时','8时','9时','10时','11时','12时','13时','14时'],
    txTrendTx: [260, 440, 1020, 1600, 2420, 1850, 2130, 1880, 1215],
    txTrendBiz: [220, 380, 900, 1420, 2180, 1650, 1890, 1680, 1075],
    txTrendRev: [200, 350, 850, 1340, 2050, 1550, 1780, 1580, 1005],
    txTrendDisc: [24, 35, 80, 120, 170, 130, 155, 135, 92],
    txStackLabels: ['5/27周三'],
    txStackRev: [11015], txStackCross: [380], txStackCur: [236], txStackDisc: [1285],
    txStackSub: '今日：营收 + 跨期退款 + 当期退款 + 优惠 = 交易额(原价)',

    trend: {
      k1: { lbl:'今日交易额(原价)', val:'<span>¥</span>1.29<span>万</span>', chg:'▲ 8.2% 较昨日', dir:'up' },
      k2: { lbl:'今日营业额', val:'<span>¥</span>1.14<span>万</span>', chg:'▲ 7.5% 较昨日', dir:'up' },
      k3: { lbl:'今日营收', val:'<span>¥</span>1.10<span>万</span>', chg:'▲ 6.8% 较昨日', dir:'up' },
      k4: { lbl:'今日优惠金额', val:'<span>¥</span>1,285', chg:'▼ 0.5% 收窄', dir:'down' },
    },

    profit: {
      k1: { lbl:'今日交易额(原价)', val:'<span>¥</span>1.29<span>万</span>', chg:'▲ 8.2% 较昨日', dir:'up' },
      k2: { lbl:'今日营业额', val:'<span>¥</span>1.14<span>万</span>', chg:'▲ 7.5% 较昨日', dir:'up' },
      k3: { lbl:'今日营收', val:'<span>¥</span>1.10<span>万</span>', chg:'▲ 6.8% 较昨日', dir:'up' },
      k4: { lbl:'今日毛利润', val:'<span>¥</span>3,380', chg:'▲ 7.2% 较昨日', dir:'up' },
      k5: { lbl:'综合毛利率', val:'30.7<span>%</span>', chg:'▲ 0.5% 提升', dir:'up' },
    },
    waterfallData: [1.29, -0.024, -0.129, 0, -0.038, 0, -0.76, -0.05, 0, -0.11, -0.06, 0],
    // 商品销售页数据
    productData: {
      products: ['土豆','西红柿','鸡蛋','白菜','猪肉','苹果','黄瓜','胡萝卜','鲫鱼','大米'],
      cats: ['蔬菜','蔬菜','蛋奶','蔬菜','肉禽','水果','蔬菜','蔬菜','水产','粮油'],
      origPrices: ['¥3.20/斤','¥4.20/斤','¥14.00/打','¥2.60/斤','¥21.00/斤','¥7.80/斤','¥3.20/根','¥2.90/斤','¥14.00/斤','¥4.50/斤'],
      memberPrices: ['¥2.80/斤','¥3.50/斤','¥12.00/打','¥2.20/斤','¥18.00/斤','¥6.50/斤','¥2.80/根','¥2.50/斤','¥12.00/斤','¥3.80/斤'],
      finalPrices: ['¥2.60/斤','¥3.30/斤','¥11.50/打','¥2.10/斤','¥17.20/斤','¥6.20/斤','¥2.65/根','¥2.35/斤','¥11.50/斤','¥3.60/斤'],
      qty: [42,35,30,28,15,14,12,10,6,11],
      sales: [568,504,442,370,342,306,252,221,198,172],
      margins: ['29.2%','31.8%','19.5%','27.4%','23.1%','36.2%','31.0%','28.5%','39.8%','16.0%'],
    },
  },

  week: {
    dateLabel: '📅 2026-05-25 ~ 2026-05-27（本周）',
    sidebarDate: '本周 2026-05-25~31 · 营业中',
    conceptDate: '📅 数据周期：2026-05-25 ~ 2026-05-27（本周一至今天）',

    overview: {
      k1: { lbl:'本周交易额', val:'<span>¥</span>38,376', chg:'▲ 10.6% 较上周同期', dir:'up' },
      k2: { lbl:'本周营业额', val:'<span>¥</span>34,175', chg:'▲ 9.8% 较上周同期', dir:'up' },
      k3: { lbl:'本周营收', val:'<span>¥</span>33,065', chg:'▲ 8.4% 较上周同期', dir:'up' },
      k4: { lbl:'本周订单数', val:'466<span>单</span>', chg:'▲ 7.1% 较上周同期', dir:'up' },
      k5: { lbl:'本周优惠金额', val:'<span>¥</span>3,521', chg:'▼ 1.2% 较上周收窄', dir:'down' },
      k6: { lbl:'本周退款金额', val:'<span>¥</span>1,790', chg:'▼ 3.5% 较上周改善', dir:'down', refundDetail:'当期 ¥680 · 跨期 ¥1,110' },
      k7: { lbl:'本周客单价(成交)', val:'<span>¥</span>70.9', chg:'▲ 1.2% 较上周', dir:'up' },
      k8: { lbl:'优惠率', val:'9.2<span>%</span>', chg:'▼ 较上周-0.3%', dir:'down' },
      k9: { lbl:'当期退款率', val:'2.0<span>%</span>', chg:'▼ 较上周-0.2%', dir:'down' },
      k10: { lbl:'营收/营业额比', val:'96.8<span>%</span>', chg:'▼ 较上周-0.5%', dir:'down' },
    },
    trendTitle: '本周营业额趋势',
    trendSub: '营业额 + 订单量双轴对比',
    trendLabels: ['5/25周一','5/26周二','5/27周三'],
    trendBiz: [12154, 10626, 11395],
    trendOrders: [162, 148, 156],
    trendTitle30: '近30天营业额趋势',
    trendSub30: '30天营业额 + 订单量双轴对比',
    trendBiz30: [8200,9100,7800,8500,10200,11300,9800,10600,12154,10626,11395,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    trendOrders30: [108,125,102,112,138,152,130,142,162,148,156,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    hourTitle: '本周平均时段分布',
    hourData: [2,1,1,1,2,8,18,42,38,22,28,35,30,24,20,18,25,48,55,38,28,18,10,5],
    topProducts: [
      {name:'土豆', cat:'蔬菜', qty:'108件', val:'¥1,260', pct:100, chg:'+12%', dir:'up'},
      {name:'西红柿', cat:'蔬菜', qty:'92件', val:'¥1,120', pct:89, chg:'-3%', dir:'down'},
      {name:'鸡蛋', cat:'蛋奶', qty:'78件', val:'¥980', pct:78, chg:'+8%', dir:'up'},
      {name:'白菜', cat:'蔬菜', qty:'65件', val:'¥820', pct:65, chg:'+5%', dir:'up'},
      {name:'猪肉', cat:'肉禽', qty:'42件', val:'¥760', pct:60, chg:'-2%', dir:'down'},
    ],
    pieData: {labels:['蔬菜','水果','肉禽','水产','粮油','其他'], data:[35,22,18,12,8,5]},
    pieSub: '6大品类 · 共 ¥99,410',
    // 商品销售页数据
    productData: {
      products: ['土豆','西红柿','鸡蛋','白菜','猪肉','苹果','黄瓜','胡萝卜','鲫鱼','大米'],
      cats: ['蔬菜','蔬菜','蛋奶','蔬菜','肉禽','水果','蔬菜','蔬菜','水产','粮油'],
      origPrices: ['¥3.20/斤','¥4.20/斤','¥14.00/打','¥2.60/斤','¥21.00/斤','¥7.80/斤','¥3.20/根','¥2.90/斤','¥14.00/斤','¥4.50/斤'],
      memberPrices: ['¥2.80/斤','¥3.50/斤','¥12.00/打','¥2.20/斤','¥18.00/斤','¥6.50/斤','¥2.80/根','¥2.50/斤','¥12.00/斤','¥3.80/斤'],
      finalPrices: ['¥2.60/斤','¥3.30/斤','¥11.50/打','¥2.10/斤','¥17.20/斤','¥6.20/斤','¥2.65/根','¥2.35/斤','¥11.50/斤','¥3.60/斤'],
      qty: [486,412,356,298,196,168,142,128,86,148],
      sales: [5680,5040,4420,3700,3420,3060,2520,2210,1980,1720],
      margins: ['29.2%','31.8%','19.5%','27.4%','23.1%','36.2%','31.0%','28.5%','39.8%','16.0%'],
    },
    // 洞察卡片
    insights: [
      { title:'销售健康度', items: [
        '本周交易额 ¥3.84万，<b>营业额 ¥3.42万</b>，营收 ¥3.31万，3天累计超上周同期',
        '毛利率 30.5%，环比 <b>+0.8pct</b> <span class="ins-tag good">提升</span>，优惠率收窄至 9.2%',
        '周一表现最佳（交易额 ¥13,520），周二略回落，周三强势回暖'
      ]},
      { title:'商品与品类', items: [
        '蔬菜品类贡献 <b>35%</b> 营业额，土豆/西红柿稳居 Top 2',
        '猪肉销售额 ¥760，环比 <b>−2%</b> <span class="ins-tag warn">下滑</span>；鸡蛋增长 +8% 跃升至第 3',
        'Top 5 商品集中度 <b>61%</b>，品类结构健康，蔬菜占主导'
      ]},
      { title:'客群与流量', items: [
        '本周 466 单，日均 155 单，<b>周一是订单高峰</b>（162 单）',
        '晚高峰 17-19 点客流占全天 <b>32%</b>，为最强时段',
        '本周日均订单较上周同期 <b>+7.1%</b>，客流增长明显'
      ]},
      { title:'风险与建议', items: [
        '本周跨期退款 ¥1,110，占营收 <b>3.4%</b> <span class="ins-tag warn">略高于上周 2.8%</span>',
        '土豆、鸡蛋、猪肉库存预警持续，建议调整采购计划',
        '周一/周三客流高峰时段可增加促销力度，提升转化率'
      ]}
    ],

    // 跨周期订单额与退款对比数据
    crossPeriod: {
      thisWeek: { orderCount:466, txAmt:38376, bizAmt:34175, revAmt:33065, curRefund:680, crossRefund:1110, totalRefund:1790, discount:3521 },
      lastWeek: { orderCount:435, txAmt:34700, bizAmt:31100, revAmt:30350, curRefund:720, crossRefund:1050, totalRefund:1770, discount:3605 },
    },
    dailyRefund: {
      labels: ['周一5/25','周二5/26','周三5/27'],
      curRefund: [186, 258, 236],
      crossRefund: [320, 410, 380],
      lastWeekCurRefund: [220, 245, 255],
      lastWeekCrossRefund: [350, 340, 360],
    },

    transaction: {
      k1: { lbl:'本周交易额(原价)', val:'<span>¥</span>3.84<span>万</span>', chg:'▲ 10.6% 较上周同期', dir:'up' },
      k2: { lbl:'本周营业额', val:'<span>¥</span>3.42<span>万</span>', chg:'▲ 9.8% 较上周同期', dir:'up' },
      k3: { lbl:'本周营收', val:'<span>¥</span>3.31<span>万</span>', chg:'▲ 8.4% 较上周同期', dir:'up' },
      k4: { lbl:'本周优惠金额', val:'<span>¥</span>3,521', chg:'▼ 1.2% 收窄', dir:'down' },
      k5: { lbl:'优惠率', val:'9.2<span>%</span>', chg:'▼ 0.3% 收窄', dir:'down' },
      k6: { lbl:'当期退款率', val:'1.8<span>%</span>', chg:'▼ 0.2% 改善', dir:'down' },
      k7: { lbl:'跨期退款金额', val:'<span>¥</span>1,110', chg:'▲ 较上周+5.6%', dir:'down' },
      k8: { lbl:'营收/营业额比', val:'96.8<span>%</span>', chg:'▼ 较上周−0.5%', dir:'down' },
    },
    txTrendTitle: '交易额 → 营收 全链路',
    txTrendSub: '本周每日：原价交易额、营业额、营收、优惠四线对比',
    txTrendLabels: ['5/25周一','5/26周二','5/27周三'],
    txTrendTx: [13520, 11940, 12916],
    txTrendBiz: [13520-1180-186, 11940-1056-258, 12916-1285-236],
    txTrendRev: [13520-1180-186-320, 11940-1056-258-410, 12916-1285-236-380],
    txTrendDisc: [1180, 1056, 1285],
    txStackLabels: ['5/25周一','5/26周二','5/27周三'],
    txStackRev: [13520-1180-186-320, 11940-1056-258-410, 12916-1285-236-380],
    txStackCross: [320, 410, 380], txStackCur: [186, 258, 236], txStackDisc: [1180, 1056, 1285],
    txStackSub: '每日：营收 + 跨期退款 + 当期退款 + 优惠 = 交易额(原价)',

    trend: {
      k1: { lbl:'本周交易额(原价)', val:'<span>¥</span>3.84<span>万</span>', chg:'▲ 10.6% 较上周同期', dir:'up' },
      k2: { lbl:'本周营业额', val:'<span>¥</span>3.42<span>万</span>', chg:'▲ 9.8% 较上周同期', dir:'up' },
      k3: { lbl:'本周营收', val:'<span>¥</span>3.31<span>万</span>', chg:'▲ 8.4% 较上周同期', dir:'up' },
      k4: { lbl:'本周优惠金额', val:'<span>¥</span>3,521', chg:'▼ 1.2% 收窄', dir:'down' },
    },

    profit: {
      k1: { lbl:'本周交易额(原价)', val:'<span>¥</span>3.84<span>万</span>', chg:'▲ 10.6% 较上周同期', dir:'up' },
      k2: { lbl:'本周营业额', val:'<span>¥</span>3.42<span>万</span>', chg:'▲ 9.8% 较上周同期', dir:'up' },
      k3: { lbl:'本周营收', val:'<span>¥</span>3.31<span>万</span>', chg:'▲ 8.4% 较上周同期', dir:'up' },
      k4: { lbl:'本周毛利润', val:'<span>¥</span>1.01<span>万</span>', chg:'▲ 9.5% 较上周同期', dir:'up' },
      k5: { lbl:'综合毛利率', val:'30.5<span>%</span>', chg:'▲ 0.8% 提升', dir:'up' },
    },
    waterfallData: [3.84, -0.068, -0.352, 0, -0.111, 0, -2.76, -0.19, 0, -0.38, -0.20, 0],
  },

  month: {
    dateLabel: '📅 2026年5月（本月）',
    sidebarDate: '本月 2026年5月 · 营业中',
    conceptDate: '📅 数据周期：2026-05-01 ~ 2026-05-27（本月）',

    overview: {
      k1: { lbl:'本月交易额', val:'<span>¥</span>111,295', chg:'▲ 12.3% 较上月同期', dir:'up', yoyChg:'+18.6%', yoyDir:'up' },
      k2: { lbl:'本月营业额', val:'<span>¥</span>99,410', chg:'▲ 11.7% 较上月同期', dir:'up', yoyChg:'+17.2%', yoyDir:'up' },
      k3: { lbl:'本月营收', val:'<span>¥</span>96,180', chg:'▲ 10.5% 较上月同期', dir:'up', yoyChg:'+16.0%', yoyDir:'up' },
      k4: { lbl:'本月订单数', val:'1,480<span>单</span>', chg:'▲ 9.6% 较上月同期', dir:'up', yoyChg:'+15.1%', yoyDir:'up' },
      k5: { lbl:'本月优惠金额', val:'<span>¥</span>10,880', chg:'▼ 0.8% 较上月收窄', dir:'down', yoyChg:'-2.3%', yoyDir:'down' },
      k6: { lbl:'本月退款金额', val:'<span>¥</span>5,420', chg:'▼ 6.2% 较上月改善', dir:'down', refundDetail:'当期 ¥3,010 · 跨期 ¥2,410', yoyChg:'-9.5%', yoyDir:'down' },
      k7: { lbl:'本月客单价(成交)', val:'<span>¥</span>65.0', chg:'▲ 1.8% 较上月', dir:'up', yoyChg:'+3.2%', yoyDir:'up' },
      k8: { lbl:'优惠率', val:'9.8<span>%</span>', chg:'▼ 较上月-0.3%', dir:'down', yoyChg:'-0.8%', yoyDir:'down' },
      k9: { lbl:'当期退款率', val:'3.0<span>%</span>', chg:'▼ 较上月-0.5%', dir:'down', yoyChg:'-1.1%', yoyDir:'down' },
      k10: { lbl:'营收/营业额比', val:'96.8<span>%</span>', chg:'▲ 较上月+0.2%', dir:'up', yoyChg:'+0.6%', yoyDir:'up' },
    },
    trendTitle: '本月营业额趋势',
    trendSub: '按天：营业额 + 订单量双轴对比',
    trendLabels: (()=>{ const a=[]; for(let i=1;i<=27;i++)a.push('5/'+i); return a; })(),
    trendBiz: [3220,3150,3010,2980,3350,3680,3420,3190,3560,3880,3950,3720,3580,4010,4230,4150,3880,4520,4780,4650,4380,5020,5180,4890,4620,11395,12916],
    trendOrders: [41,40,38,37,43,48,44,41,46,51,52,48,46,53,56,54,50,60,63,61,57,66,68,64,60,148,156],
    hourTitle: '本月平均时段分布',
    hourData: [2,1,1,1,2,7,20,38,42,28,30,36,32,26,22,19,26,45,52,36,26,17,11,6],
    topProducts: [
      {name:'土豆', cat:'蔬菜', qty:'312件', val:'¥3,860', pct:100, chg:'+10%', dir:'up'},
      {name:'西红柿', cat:'蔬菜', qty:'275件', val:'¥3,320', pct:86, chg:'-5%', dir:'down'},
      {name:'猪肉', cat:'肉禽', qty:'186件', val:'¥3,100', pct:80, chg:'+6%', dir:'up'},
      {name:'鸡蛋', cat:'蛋奶', qty:'243件', val:'¥2,850', pct:74, chg:'+4%', dir:'up'},
      {name:'白菜', cat:'蔬菜', qty:'210件', val:'¥2,440', pct:63, chg:'+2%', dir:'up'},
    ],
    pieData: {labels:['蔬菜','水果','肉禽','水产','粮油','其他'], data:[34,23,19,11,8,5]},
    pieSub: '6大品类 · 共 ¥99,410',
    // 商品销售页数据
    productData: {
      products: ['土豆','西红柿','鸡蛋','白菜','猪肉','苹果','黄瓜','胡萝卜','鲫鱼','大米'],
      cats: ['蔬菜','蔬菜','蛋奶','蔬菜','肉禽','水果','蔬菜','蔬菜','水产','粮油'],
      origPrices: ['¥3.20/斤','¥4.20/斤','¥14.00/打','¥2.60/斤','¥21.00/斤','¥7.80/斤','¥3.20/根','¥2.90/斤','¥14.00/斤','¥4.50/斤'],
      memberPrices: ['¥2.80/斤','¥3.50/斤','¥12.00/打','¥2.20/斤','¥18.00/斤','¥6.50/斤','¥2.80/根','¥2.50/斤','¥12.00/斤','¥3.80/斤'],
      finalPrices: ['¥2.60/斤','¥3.30/斤','¥11.50/打','¥2.10/斤','¥17.20/斤','¥6.20/斤','¥2.65/根','¥2.35/斤','¥11.50/斤','¥3.60/斤'],
      qty: [312,275,243,210,186,128,118,102,78,110],
      sales: [3860,3320,2850,2440,3100,980,890,760,880,1080],
      margins: ['28.5%','32.1%','18.2%','26.8%','22.4%','35.6%','30.2%','27.8%','40.1%','15.3%'],
    },
    // 洞察卡片
    insights: [
      { title:'销售健康度', items: [
        '5 月交易额 ¥11.1万，<b>营业额 ¥9.94万</b>，营收 ¥9.62万，较上月同期增长 12.3%',
        '优惠率 9.8%，较上月 <b>收窄 0.5pct</b> <span class="ins-tag good">持续改善</span>',
        '月中（5/12-5/20）为销售高峰，日均交易额超 ¥4,500'
      ]},
      { title:'商品与品类', items: [
        '蔬菜品类贡献 <b>35%</b> 营业额；猪肉月度销售额 ¥3,100 跃居第 3',
        '大米新晋 Top 5（¥2,440），<b>粮油品类增长明显</b>',
        'Top 5 商品集中度 63%，品类覆盖趋于均衡'
      ]},
      { title:'客群与流量', items: [
        '本月 1,480 单，日均 55 单，<b>较上月同期 +9.6%</b>',
        '月中订单密度最高（5/15-5/20 日均超 62 单）',
        '晚高峰 17-19 点持续为最强客流时段，占比稳定在 30%+'
      ]},
      { title:'风险与建议', items: [
        '本月跨期退款 ¥2,410，占营收 2.5% <span class="ins-tag good">较上月 3.1% 明显改善</span>',
        '月底（5/25-27）库存预警反复出现，建议优化月末备货策略',
        '6 月进入夏季旺季，可提前规划生鲜品类促销活动'
      ]}
    ],

    transaction: {
      k1: { lbl:'本月交易额(原价)', val:'<span>¥</span>11.1<span>万</span>', chg:'▲ 12.3% 较上月同期', dir:'up' },
      k2: { lbl:'本月营业额', val:'<span>¥</span>9.94<span>万</span>', chg:'▲ 11.7% 较上月同期', dir:'up' },
      k3: { lbl:'本月营收', val:'<span>¥</span>9.62<span>万</span>', chg:'▲ 10.5% 较上月同期', dir:'up' },
      k4: { lbl:'本月优惠金额', val:'<span>¥</span>1.09<span>万</span>', chg:'▼ 0.8% 收窄', dir:'down' },
      k5: { lbl:'优惠率', val:'9.8<span>%</span>', chg:'▼ 0.3% 收窄', dir:'down' },
      k6: { lbl:'当期退款率', val:'2.7<span>%</span>', chg:'▼ 0.3% 改善', dir:'down' },
      k7: { lbl:'跨期退款金额', val:'<span>¥</span>2,410', chg:'▲ 较上月+3.2%', dir:'down' },
      k8: { lbl:'营收/营业额比', val:'96.8<span>%</span>', chg:'▼ 较上月−0.5%', dir:'down' },
    },
    txTrendTitle: '交易额 → 营收 全链路',
    txTrendSub: '本月每日：原价交易额、营业额、营收、优惠四线对比',
    txTrendLabels: ['5/1','5/2','5/3','5/4','5/5','5/6','5/7','5/8','5/9','5/10','5/11','5/12','5/13','5/14','5/15','5/16','5/17','5/18','5/19','5/20','5/21','5/22','5/23','5/24','5/25','5/26','5/27'],
    txTrendTx: [1810,1800,1920,1990,2190,2260,2400,2320,2480,2490,2620,2760,2760,2880,3060,3130,3150,3320,3450,5180,4890,4620,4780,4380,13520,11940,12916],
    txTrendBiz: [1810-120-50,1800-130-35,1920-140-35,1990-160-50,2190-170-50,2260-160-50,2400-190-60,2320-180-40,2480-180-40,2490-170-50,2620-190-50,2760-190-70,2760-210-50,2880-200-60,3060-240-70,3130-260-80,3150-210-60,3320-230-90,3450-250-80,5180-380-180,4890-360-170,4620-340-160,4780-350-170,4380-320-150,13520-1180-186,11940-1056-258,12916-1285-236],
    txTrendRev: [1810-120-50-40,1800-130-35-40,1920-140-35-30,1990-160-50-40,2190-170-50-50,2260-160-50-50,2400-190-60-50,2320-180-40-40,2480-180-40-40,2490-170-50-50,2620-190-50-40,2760-190-70-60,2760-210-50-60,2880-200-60-70,3060-240-70-60,3130-260-80-50,3150-210-60-50,3320-230-90-70,3450-250-80-60,5180-380-180-150,4890-360-170-140,4620-340-160-130,4780-350-170-135,4380-320-150-125,13520-1180-186-320,11940-1056-258-410,12916-1285-236-380],
    txTrendDisc: [120,130,140,160,170,160,190,180,180,170,190,190,210,200,240,260,210,230,250,380,360,340,350,320,1180,1056,1285],
    txStackLabels: ['5/1','5/2','5/3','5/4','5/5','5/6','5/7','5/8','5/9','5/10','5/11','5/12','5/13','5/14','5/15','5/16','5/17','5/18','5/19','5/20','5/21','5/22','5/23','5/24','5/25','5/26','5/27'],
    txStackRev: [1810-120-50-40,1800-130-35-40,1920-140-35-30,1990-160-50-40,2190-170-50-50,2260-160-50-50,2400-190-60-50,2320-180-40-40,2480-180-40-40,2490-170-50-50,2620-190-50-40,2760-190-70-60,2760-210-50-60,2880-200-60-70,3060-240-70-60,3130-260-80-50,3150-210-60-50,3320-230-90-70,3450-250-80-60,5180-380-180-150,4890-360-170-140,4620-340-160-130,4780-350-170-135,4380-320-150-125,13520-1180-186-320,11940-1056-258-410,12916-1285-236-380],
    txStackCross: [40,40,30,40,50,50,50,40,40,50,40,60,60,70,60,50,50,70,60,150,140,130,135,125,320,410,380], txStackCur: [50,35,35,50,50,50,60,40,40,50,50,70,50,60,70,80,60,90,80,180,170,160,170,150,186,258,236], txStackDisc: [120,130,140,160,170,160,190,180,180,170,190,190,210,200,240,260,210,230,250,380,360,340,350,320,1180,1056,1285],
    txStackSub: '5/1-5/27：营收 + 跨期退款 + 当期退款 + 优惠 = 交易额(原价)',

    trend: {
      k1: { lbl:'本月交易额(原价)', val:'<span>¥</span>11.1<span>万</span>', chg:'▲ 12.3% 较上月同期', dir:'up' },
      k2: { lbl:'本月营业额', val:'<span>¥</span>9.94<span>万</span>', chg:'▲ 11.7% 较上月同期', dir:'up' },
      k3: { lbl:'本月营收', val:'<span>¥</span>9.62<span>万</span>', chg:'▲ 10.5% 较上月同期', dir:'up' },
      k4: { lbl:'本月优惠金额', val:'<span>¥</span>1.09<span>万</span>', chg:'▼ 0.8% 收窄', dir:'down' },
    },

    profit: {
      k1: { lbl:'本月交易额(原价)', val:'<span>¥</span>11.1<span>万</span>', chg:'▲ 12.3% 较上月同期', dir:'up' },
      k2: { lbl:'本月营业额', val:'<span>¥</span>9.94<span>万</span>', chg:'▲ 11.7% 较上月同期', dir:'up' },
      k3: { lbl:'本月营收', val:'<span>¥</span>9.62<span>万</span>', chg:'▲ 10.5% 较上月同期', dir:'up' },
      k4: { lbl:'本月毛利润', val:'<span>¥</span>2.89<span>万</span>', chg:'▲ 11.2% 较上月同期', dir:'up' },
      k5: { lbl:'综合毛利率', val:'30.0<span>%</span>', chg:'▲ 0.3% 提升', dir:'up' },
    },
    waterfallData: [11.1, -0.2, -1.09, 0, -0.3, 0, -7.5, -0.55, 0, -1.0, -0.55, 0],
  },

  year: {
    dateLabel: '📅 2026年1-5月',
    sidebarDate: '本年 2026 · 营业中',
    conceptDate: '📅 数据周期：2026-01 ~ 2026-05（本年累计）',

    overview: {
      k1: { lbl:'本年交易额', val:'<span>¥</span>48.3<span>万</span>', chg:'▲ 15.2% 较去年同期', dir:'up' },
      k2: { lbl:'本年营业额', val:'<span>¥</span>43.2<span>万</span>', chg:'▲ 14.5% 较去年同期', dir:'up' },
      k3: { lbl:'本年营收', val:'<span>¥</span>41.8<span>万</span>', chg:'▲ 13.8% 较去年同期', dir:'up' },
      k4: { lbl:'本年订单数', val:'6,258<span>单</span>', chg:'▲ 12.1% 较去年同期', dir:'up' },
      k5: { lbl:'本年优惠金额', val:'<span>¥</span>4.68<span>万</span>', chg:'▼ 1.5% 较去年收窄', dir:'down' },
      k6: { lbl:'本年退款金额', val:'<span>¥</span>2.21<span>万</span>', chg:'▼ 8.3% 较去年改善', dir:'down', refundDetail:'当期 ¥1.35万 · 跨期 ¥0.86万' },
      k7: { lbl:'本年客单价(成交)', val:'<span>¥</span>66.8', chg:'▲ 2.1% 较去年', dir:'up' },
      k8: { lbl:'优惠率', val:'9.7<span>%</span>', chg:'▼ 较去年-0.5%', dir:'down' },
      k9: { lbl:'当期退款率', val:'3.1<span>%</span>', chg:'▼ 较去年-0.8%', dir:'down' },
      k10: { lbl:'营收/营业额比', val:'96.8<span>%</span>', chg:'▲ 较去年+0.3%', dir:'up' },
    },
    trendTitle: '本年营业额趋势',
    trendSub: '按月：营业额 + 订单量双轴对比',
    trendLabels: ['1月','2月','3月','4月','5月'],
    trendBiz: [76800, 82300, 89800, 85200, 99410],
    trendOrders: [1026, 1100, 1205, 1147, 1480],
    hourTitle: '本年平均时段分布',
    hourData: [1,1,1,1,2,6,17,35,40,30,31,34,30,24,20,18,24,40,48,34,24,16,9,5],
    topProducts: [
      {name:'土豆', cat:'蔬菜', qty:'1,380件', val:'¥1.68万', pct:100, chg:'+8%', dir:'up'},
      {name:'猪肉', cat:'肉禽', qty:'820件', val:'¥1.45万', pct:86, chg:'+12%', dir:'up'},
      {name:'西红柿', cat:'蔬菜', qty:'1,180件', val:'¥1.38万', pct:82, chg:'-6%', dir:'down'},
      {name:'鸡蛋', cat:'蛋奶', qty:'1,050件', val:'¥1.22万', pct:73, chg:'+4%', dir:'up'},
      {name:'大米', cat:'粮油', qty:'520件', val:'¥1.08万', pct:64, chg:'+7%', dir:'up'},
    ],
    pieData: {labels:['蔬菜','水果','肉禽','水产','粮油','其他'], data:[33,24,20,10,8,5]},
    pieSub: '6大品类 · 共 ¥1,680,000',
    // 商品销售页数据
    productData: {
      products: ['土豆','猪肉','西红柿','鸡蛋','大米','白菜','苹果','胡萝卜','鲫鱼','黄瓜'],
      cats: ['蔬菜','肉禽','蔬菜','蛋奶','粮油','蔬菜','水果','蔬菜','水产','蔬菜'],
      origPrices: ['¥3.20/斤','¥21.00/斤','¥4.20/斤','¥14.00/打','¥4.50/斤','¥2.60/斤','¥7.80/斤','¥2.90/斤','¥14.00/斤','¥3.20/根'],
      memberPrices: ['¥2.80/斤','¥18.00/斤','¥3.50/斤','¥12.00/打','¥3.80/斤','¥2.20/斤','¥6.50/斤','¥2.50/斤','¥12.00/斤','¥2.80/根'],
      finalPrices: ['¥2.60/斤','¥17.20/斤','¥3.30/斤','¥11.50/打','¥3.60/斤','¥2.10/斤','¥6.20/斤','¥2.35/斤','¥11.50/斤','¥2.65/根'],
      qty: [1380,820,1180,1050,520,980,680,510,310,460],
      sales: [16800,14500,13800,12200,10800,10200,9800,8200,7600,6800],
      margins: ['28.5%','22.4%','32.1%','18.2%','15.3%','26.8%','35.6%','27.8%','40.1%','30.2%'],
    },
    // 洞察卡片
    insights: [
      { title:'销售健康度', items: [
        '1-5 月累计交易额 ¥48.3万，<b>营业额 ¥43.2万</b>，营收 ¥41.8万',
        '5 月为年度最佳单月，交易额突破 11 万，<b>环比增长 12.3%</b> <span class="ins-tag good">新高</span>',
        '毛利率稳定在 30%+，优惠率持续收窄，经营质量稳步提升'
      ]},
      { title:'商品与品类', items: [
        '蔬菜品类全年贡献 <b>35%</b> 营业额，为绝对主力品类',
        '猪肉销售额 ¥1.45万，<b>肉禽品类年增长 +12%</b>，第二大品类地位稳固',
        '大米年销 ¥1.08万进入 Top 5，<span class="ins-tag info">粮油品类潜力释放</span>'
      ]},
      { title:'客群与流量', items: [
        '1-5 月累计订单超 6,500 单，<b>5 月订单量创新高</b>',
        '晚高峰客流占比稳定在 30%+，为全年最强时段',
        '上半年客流逐月递增，<b>趋势向好</b>，下半年旺季可期'
      ]},
      { title:'风险与建议', items: [
        '年度跨期退款 ¥8,600，占营收 <b>2.1%</b> <span class="ins-tag good">处于健康水平</span>',
        '库存预警集中在月末，建议建立 <b>月末安全库存基线</b>',
        '下半年逢中秋+国庆旺季，建议提前 2 周启动备货'
      ]}
    ],

    transaction: {
      k1: { lbl:'本年交易额(原价)', val:'<span>¥</span>48.3<span>万</span>', chg:'▲ 15.2% 较去年同期', dir:'up' },
      k2: { lbl:'本年营业额', val:'<span>¥</span>43.2<span>万</span>', chg:'▲ 14.5% 较去年同期', dir:'up' },
      k3: { lbl:'本年营收', val:'<span>¥</span>41.8<span>万</span>', chg:'▲ 13.8% 较去年同期', dir:'up' },
      k4: { lbl:'本年优惠金额', val:'<span>¥</span>4.68<span>万</span>', chg:'▼ 1.5% 收窄', dir:'down' },
      k5: { lbl:'优惠率', val:'9.7<span>%</span>', chg:'▼ 0.4% 收窄', dir:'down' },
      k6: { lbl:'当期退款率', val:'2.8<span>%</span>', chg:'▼ 0.5% 改善', dir:'down' },
      k7: { lbl:'跨期退款金额', val:'<span>¥</span>8,600', chg:'▲ 较去年+2.1%', dir:'down' },
      k8: { lbl:'营收/营业额比', val:'96.8<span>%</span>', chg:'▼ 较去年−0.4%', dir:'down' },
    },
    txTrendTitle: '交易额 → 营收 全链路',
    txTrendSub: '各月：原价交易额、营业额、营收、优惠四线对比',
    txTrendLabels: ['1月','2月','3月','4月','5月'],
    txTrendTx: [86000, 92000, 101000, 95000, 111295],
    txTrendBiz: [76800, 82300, 89800, 85200, 99410],
    txTrendRev: [74200, 79500, 86800, 82400, 96180],
    txTrendDisc: [8200, 8800, 10200, 9100, 10880],
    txStackLabels: ['1月','2月','3月','4月','5月'],
    txStackRev: [74200,79500,86800,82400,96180],
    txStackCross: [1200,1350,1500,1320,2410],
    txStackCur: [1800,1950,2100,1890,3010],
    txStackDisc: [8200,8800,10200,9100,10880],
    txStackSub: '各月：营收 + 跨期退款 + 当期退款 + 优惠 = 交易额(原价)',

    trend: {
      k1: { lbl:'本年交易额(原价)', val:'<span>¥</span>48.3<span>万</span>', chg:'▲ 15.2% 较去年同期', dir:'up' },
      k2: { lbl:'本年营业额', val:'<span>¥</span>43.2<span>万</span>', chg:'▲ 14.5% 较去年同期', dir:'up' },
      k3: { lbl:'本年营收', val:'<span>¥</span>41.8<span>万</span>', chg:'▲ 13.8% 较去年同期', dir:'up' },
      k4: { lbl:'本年优惠金额', val:'<span>¥</span>4.68<span>万</span>', chg:'▼ 1.5% 收窄', dir:'down' },
    },

    profit: {
      k1: { lbl:'本年交易额(原价)', val:'<span>¥</span>48.3<span>万</span>', chg:'▲ 15.2% 较去年同期', dir:'up' },
      k2: { lbl:'本年营业额', val:'<span>¥</span>43.2<span>万</span>', chg:'▲ 14.5% 较去年同期', dir:'up' },
      k3: { lbl:'本年营收', val:'<span>¥</span>41.8<span>万</span>', chg:'▲ 13.8% 较去年同期', dir:'up' },
      k4: { lbl:'本年毛利润', val:'<span>¥</span>12.6<span>万</span>', chg:'▲ 14.8% 较去年同期', dir:'up' },
      k5: { lbl:'综合毛利率', val:'30.2<span>%</span>', chg:'▲ 0.6% 提升', dir:'up' },
    },
    waterfallData: [48.3, -0.88, -4.68, 0, -1.35, 0, -32.5, -2.4, 0, -4.5, -2.5, 0],
    // 商品销售页数据（本年）
    productData: {
      products: ['猪肉','土豆','鸡蛋','大米','西红柿','苹果','白菜','鲫鱼','胡萝卜','黄瓜'],
      cats: ['肉禽','蔬菜','蛋奶','粮油','蔬菜','水果','蔬菜','水产','蔬菜','蔬菜'],
      origPrices: ['¥21.00/斤','¥3.20/斤','¥14.00/打','¥4.50/斤','¥4.20/斤','¥7.80/斤','¥2.60/斤','¥14.00/斤','¥2.90/斤','¥3.20/根'],
      memberPrices: ['¥18.00/斤','¥2.80/斤','¥12.00/打','¥3.80/斤','¥3.50/斤','¥6.50/斤','¥2.20/斤','¥12.00/斤','¥2.50/斤','¥2.80/根'],
      finalPrices: ['¥17.20/斤','¥2.60/斤','¥11.50/打','¥3.60/斤','¥3.30/斤','¥6.20/斤','¥2.10/斤','¥11.50/斤','¥2.35/斤','¥2.65/根'],
      qty: [1280,1150,920,680,620,580,440,325,280,310],
      sales: [26880,5880,10580,4620,5940,5080,3080,8790,1960,2480],
      margins: ['27.5%','30.8%','18.5%','14.2%','29.1%','36.8%','26.2%','42.0%','32.5%','22.8%'],
    },
  }
};

// ===== 基础统计数据 =====
const STATS_DATA = {
  today: {
    label: '2026-06-02（今日）',
    compareLabel: '较昨日同时段',
    kpi: [
      { lbl:'营业额', val:'¥11,680', chg:'+8.4%', up:true },
      { lbl:'订单数', val:'142', chg:'+5.2%', up:true },
      { lbl:'客单价', val:'¥82.3', chg:'+3.1%', up:true },
      { lbl:'毛利率', val:'26.8%', chg:'+0.5%', up:true },
      { lbl:'销售量', val:'286件', chg:'+10.8%', up:true },
    ],
    trendLabels: ['8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'],
    trendRev: [860, 1620, 2180, 1860, 1520, 980, 660, 540, 820, 1280, 1520, 1080, 720],
    trendOrders: [12, 22, 28, 24, 20, 14, 8, 7, 10, 16, 22, 14, 9],
    trendSalesVol: [68, 124, 178, 142, 118, 72, 48, 38, 62, 98, 132, 82, 52],
    category: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[32,24,18,14,9,6,5]},
    orderStatus: {labels:['已完成','进行中','已退款','待处理'],data:[118,8,12,4]},
    orderStatusColors: ['#3EB27E','#83BFF4','#1088C3','#FFB86C'],
    recentOrders: [
      {time:'10:32',no:'TX0602001',items:'土豆×3 西红柿×2',amount:'¥35.60',pay:'微信支付',status:'已完成'},
      {time:'10:18',no:'TX0602002',items:'鸡蛋×2 猪肉500g',amount:'¥62.80',pay:'微信支付',status:'已完成'},
      {time:'10:05',no:'TX0602003',items:'苹果×5 香蕉×2',amount:'¥48.00',pay:'支付宝',status:'已完成'},
      {time:'9:48',no:'TX0602004',items:'大米5kg',amount:'¥38.50',pay:'现金',status:'已完成'},
      {time:'9:30',no:'TX0602005',items:'鲫鱼×1 豆腐×2',amount:'¥55.20',pay:'微信支付',status:'已完成'},
      {time:'9:15',no:'TX0602006',items:'黄瓜×3 胡萝卜×4',amount:'¥22.40',pay:'支付宝',status:'已退款'},
      {time:'8:52',no:'TX0602007',items:'猪排×2 葱×1',amount:'¥78.00',pay:'微信支付',status:'已完成'},
      {time:'8:38',no:'TX0602008',items:'白菜×2 蒜×3',amount:'¥18.60',pay:'现金',status:'已完成'},
    ],
    topProducts: [
      {name:'土豆',cat:'蔬菜',qty:42,sales:520,bar:100},
      {name:'西红柿',cat:'蔬菜',qty:35,sales:460,bar:88},
      {name:'鸡蛋',cat:'蛋奶',qty:30,sales:398,bar:77},
      {name:'白菜',cat:'蔬菜',qty:28,sales:335,bar:64},
      {name:'猪肉',cat:'肉禽',qty:16,sales:310,bar:60},
      {name:'苹果',cat:'水果',qty:12,sales:210,bar:40},
      {name:'黄瓜',cat:'蔬菜',qty:20,sales:180,bar:35},
      {name:'胡萝卜',cat:'蔬菜',qty:18,sales:158,bar:30},
      {name:'鲫鱼',cat:'水产',qty:8,sales:142,bar:27},
      {name:'大米',cat:'粮油',qty:5,sales:128,bar:25},
      {name:'豆腐',cat:'蛋奶',qty:22,sales:96,bar:18},
      {name:'香蕉',cat:'水果',qty:14,sales:88,bar:17},
      {name:'猪排',cat:'肉禽',qty:6,sales:82,bar:16},
      {name:'洋葱',cat:'蔬菜',qty:18,sales:74,bar:14},
      {name:'牛肉',cat:'肉禽',qty:4,sales:72,bar:14},
      {name:'青椒',cat:'蔬菜',qty:16,sales:68,bar:13},
      {name:'南瓜',cat:'蔬菜',qty:10,sales:52,bar:10},
      {name:'生姜',cat:'蔬菜',qty:8,sales:48,bar:9},
      {name:'花生油',cat:'粮油',qty:2,sales:46,bar:9},
      {name:'酱油',cat:'粮油',qty:7,sales:42,bar:8},
      {name:'蒜头',cat:'蔬菜',qty:9,sales:38,bar:7},
      {name:'草鱼',cat:'水产',qty:3,sales:36,bar:7},
      {name:'芹菜',cat:'蔬菜',qty:11,sales:34,bar:7},
      {name:'木耳',cat:'蔬菜',qty:6,sales:32,bar:6},
      {name:'醋',cat:'粮油',qty:8,sales:28,bar:5},
      {name:'火腿肠',cat:'肉禽',qty:5,sales:26,bar:5},
      {name:'草莓',cat:'水果',qty:4,sales:24,bar:5},
      {name:'面粉',cat:'粮油',qty:3,sales:22,bar:4},
      {name:'荔枝',cat:'水果',qty:3,sales:20,bar:4},
      {name:'辣椒',cat:'蔬菜',qty:6,sales:18,bar:3},
      {name:'香油',cat:'粮油',qty:4,sales:16,bar:3},
      {name:'酵母',cat:'粮油',qty:8,sales:14,bar:3},
    ],
    catSales: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[2340,1620,1180,960,640,480,380]},
    productDetail: [
      {name:'土豆',cat:'蔬菜',qty:42,sales:520,cost:380,margin:140,rate:'26.9%'},
      {name:'西红柿',cat:'蔬菜',qty:35,sales:460,cost:310,margin:150,rate:'32.6%'},
      {name:'鸡蛋',cat:'蛋奶',qty:30,sales:398,cost:328,margin:70,rate:'17.6%'},
      {name:'白菜',cat:'蔬菜',qty:28,sales:335,cost:248,margin:87,rate:'26.0%'},
      {name:'猪肉',cat:'肉禽',qty:16,sales:310,cost:250,margin:60,rate:'19.4%'},
      {name:'苹果',cat:'水果',qty:12,sales:210,cost:148,margin:62,rate:'29.5%'},
      {name:'黄瓜',cat:'蔬菜',qty:20,sales:180,cost:140,margin:40,rate:'22.2%'},
      {name:'胡萝卜',cat:'蔬菜',qty:18,sales:158,cost:120,margin:38,rate:'24.1%'},
    ],
  },
  week: {
    label: '2026-05-27 ~ 2026-06-02（本周）',
    compareLabel: '较上周同期',
    kpi: [
      { lbl:'营业额', val:'¥78,250', chg:'+12.3%', up:true },
      { lbl:'订单数', val:'986', chg:'+9.8%', up:true },
      { lbl:'客单价', val:'¥79.4', chg:'+2.3%', up:true },
      { lbl:'毛利率', val:'27.2%', chg:'+0.8%', up:true },
      { lbl:'销售量', val:'1,920件', chg:'+11.2%', up:true },
    ],
    trendLabels: ['周一','周二','周三','周四','周五','周六','周日'],
    trendRev: [9800,10200,11800,12400,13800,11800,8450],
    trendOrders: [126,138,156,168,180,142,76],
    trendSalesVol: [520,610,780,820,960,720,480],
    category: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[34,22,17,15,10,7,6]},
    orderStatus: {labels:['已完成','进行中','已退款','待处理'],data:[832,52,78,24]},
    orderStatusColors: ['#3EB27E','#83BFF4','#1088C3','#FFB86C'],
    recentOrders: [
      {time:'06/02',no:'TX0602078',items:'牛肉500g 洋葱×2',amount:'¥68.00',pay:'微信支付',status:'已完成'},
      {time:'06/02',no:'TX0602077',items:'鸡蛋×2 猪肉500g',amount:'¥62.80',pay:'微信支付',status:'已完成'},
      {time:'06/01',no:'TX0601076',items:'西瓜×1 草莓×1',amount:'¥68.00',pay:'支付宝',status:'已完成'},
      {time:'06/01',no:'TX0601075',items:'土豆×5 白菜×3',amount:'¥52.00',pay:'现金',status:'已完成'},
      {time:'05/31',no:'TX0531074',items:'鲫鱼×2',amount:'¥32.00',pay:'微信支付',status:'已完成'},
      {time:'05/31',no:'TX0531073',items:'苹果×6 香蕉×3',amount:'¥58.00',pay:'支付宝',status:'已完成'},
      {time:'05/30',no:'TX0530072',items:'大米5kg',amount:'¥38.50',pay:'现金',status:'已完成'},
      {time:'05/30',no:'TX0530071',items:'豆腐×4 香菇×3',amount:'¥28.00',pay:'微信支付',status:'已退款'},
    ],
    topProducts: [
      {name:'土豆',cat:'蔬菜',qty:280,sales:3480,bar:100},
      {name:'西红柿',cat:'蔬菜',qty:235,sales:3060,bar:88},
      {name:'鸡蛋',cat:'蛋奶',qty:210,sales:2680,bar:77},
      {name:'猪肉',cat:'肉禽',qty:108,sales:2160,bar:62},
      {name:'白菜',cat:'蔬菜',qty:186,sales:2120,bar:61},
      {name:'苹果',cat:'水果',qty:85,sales:1450,bar:42},
      {name:'黄瓜',cat:'蔬菜',qty:132,sales:1180,bar:34},
      {name:'胡萝卜',cat:'蔬菜',qty:118,sales:1060,bar:30},
      {name:'鲫鱼',cat:'水产',qty:52,sales:920,bar:26},
      {name:'大米',cat:'粮油',qty:38,sales:850,bar:24},
      {name:'豆腐',cat:'蛋奶',qty:118,sales:620,bar:18},
      {name:'香蕉',cat:'水果',qty:78,sales:550,bar:17},
      {name:'猪排',cat:'肉禽',qty:42,sales:520,bar:16},
      {name:'洋葱',cat:'蔬菜',qty:98,sales:480,bar:14},
      {name:'牛肉',cat:'肉禽',qty:28,sales:470,bar:14},
      {name:'青椒',cat:'蔬菜',qty:85,sales:380,bar:13},
      {name:'南瓜',cat:'蔬菜',qty:58,sales:320,bar:10},
      {name:'生姜',cat:'蔬菜',qty:48,sales:280,bar:9},
    ],
    catSales: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[16500,12800,7800,6800,4500,3800,3100]},
    productDetail: [
      {name:'土豆',cat:'蔬菜',qty:280,sales:3480,cost:2520,margin:960,rate:'27.6%'},
      {name:'西红柿',cat:'蔬菜',qty:235,sales:3060,cost:2050,margin:1010,rate:'33.0%'},
      {name:'鸡蛋',cat:'蛋奶',qty:210,sales:2680,cost:2220,margin:460,rate:'17.2%'},
      {name:'猪肉',cat:'肉禽',qty:108,sales:2160,cost:1750,margin:410,rate:'19.0%'},
      {name:'白菜',cat:'蔬菜',qty:186,sales:2120,cost:1580,margin:540,rate:'25.5%'},
      {name:'苹果',cat:'水果',qty:85,sales:1450,cost:1050,margin:400,rate:'27.6%'},
      {name:'黄瓜',cat:'蔬菜',qty:132,sales:1180,cost:920,margin:260,rate:'22.0%'},
      {name:'鲫鱼',cat:'水产',qty:52,sales:920,cost:610,margin:310,rate:'33.7%'},
    ],
  },
  month: {
    label: '2026年5月',
    compareLabel: '较上月',
    kpi: [
      { lbl:'营业额', val:'¥32.8万', chg:'+15.6%', up:true },
      { lbl:'订单数', val:'4,280', chg:'+12.1%', up:true },
      { lbl:'客单价', val:'¥76.6', chg:'+3.1%', up:true },
      { lbl:'毛利率', val:'27.5%', chg:'+1.2%', up:true },
      { lbl:'销售量', val:'8,850件', chg:'+14.3%', up:true },
    ],
    trendLabels: ['1日','2日','3日','4日','5日','6日','7日','8日','9日','10日','11日','12日','13日','14日','15日','16日','17日','18日','19日','20日','21日','22日','23日','24日','25日','26日','27日','28日','29日','30日','31日'],
    trendRev: [2050,2120,2080,2180,2450,2680,2520,1980,2150,2230,2580,2720,2480,2100,2280,2690,2960,2780,2150,2320,2680,3120,2980,2520,2280,2450,2820,3080,3200,2860,2650],
    trendOrders: [24,26,22,28,32,36,32,20,26,28,34,38,30,24,30,36,42,38,26,30,36,44,40,32,28,30,38,42,48,38,34],
    trendSalesVol: [68,72,62,76,88,96,84,58,72,78,92,102,82,66,80,98,112,104,72,82,98,118,108,86,76,82,104,112,126,102,92],
    category: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[33,23,16,13,11,8,5]},
    orderStatus: {labels:['已完成','进行中','已退款','待处理'],data:[3680,260,420,180]},
    orderStatusColors: ['#3EB27E','#83BFF4','#1088C3','#FFB86C'],
    recentOrders: [
      {time:'第4周',no:'TX0528400',items:'土豆×15 白菜×12',amount:'¥168.00',pay:'微信支付',status:'已完成'},
      {time:'第4周',no:'TX0528399',items:'猪肉800g',amount:'¥52.00',pay:'现金',status:'已完成'},
      {time:'第4周',no:'TX0528398',items:'鸡蛋×4打',amount:'¥96.00',pay:'微信支付',status:'已完成'},
      {time:'第4周',no:'TX0528397',items:'苹果×20 香蕉×10',amount:'¥188.00',pay:'支付宝',status:'已完成'},
      {time:'第3周',no:'TX0521396',items:'鱼肉×3 豆腐×5',amount:'¥72.00',pay:'微信支付',status:'已退款'},
      {time:'第3周',no:'TX0521395',items:'胡萝卜×15',amount:'¥48.00',pay:'现金',status:'已完成'},
      {time:'第3周',no:'TX0521394',items:'黄瓜×12 西红柿×8',amount:'¥86.00',pay:'支付宝',status:'已完成'},
      {time:'第2周',no:'TX0514393',items:'大米10kg',amount:'¥76.00',pay:'微信支付',status:'已完成'},
    ],
    topProducts: [
      {name:'土豆',cat:'蔬菜',qty:1280,sales:15600,bar:100},
      {name:'西红柿',cat:'蔬菜',qty:1080,sales:13800,bar:88},
      {name:'鸡蛋',cat:'蛋奶',qty:860,sales:11200,bar:72},
      {name:'猪肉',cat:'肉禽',qty:520,sales:9800,bar:63},
      {name:'白菜',cat:'蔬菜',qty:920,sales:9500,bar:61},
      {name:'苹果',cat:'水果',qty:380,sales:6500,bar:42},
      {name:'黄瓜',cat:'蔬菜',qty:620,sales:5300,bar:34},
      {name:'胡萝卜',cat:'蔬菜',qty:540,sales:4600,bar:29},
      {name:'鲫鱼',cat:'水产',qty:240,sales:4200,bar:27},
      {name:'大米',cat:'粮油',qty:180,sales:3800,bar:24},
      {name:'豆腐',cat:'蛋奶',qty:520,sales:2800,bar:18},
      {name:'香蕉',cat:'水果',qty:380,sales:2500,bar:17},
      {name:'猪排',cat:'肉禽',qty:200,sales:2350,bar:16},
      {name:'洋葱',cat:'蔬菜',qty:460,sales:2180,bar:14},
      {name:'牛肉',cat:'肉禽',qty:130,sales:2150,bar:14},
      {name:'青椒',cat:'蔬菜',qty:380,sales:1720,bar:13},
      {name:'南瓜',cat:'蔬菜',qty:260,sales:1450,bar:10},
      {name:'生姜',cat:'蔬菜',qty:220,sales:1260,bar:9},
    ],
    catSales: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[72000,48000,32000,24000,18000,14500,12000]},
    productDetail: [
      {name:'土豆',cat:'蔬菜',qty:1280,sales:15600,cost:11200,margin:4400,rate:'28.2%'},
      {name:'西红柿',cat:'蔬菜',qty:1080,sales:13800,cost:9200,margin:4600,rate:'33.3%'},
      {name:'鸡蛋',cat:'蛋奶',qty:860,sales:11200,cost:9300,margin:1900,rate:'17.0%'},
      {name:'猪肉',cat:'肉禽',qty:520,sales:9800,cost:7900,margin:1900,rate:'19.4%'},
      {name:'白菜',cat:'蔬菜',qty:920,sales:9500,cost:7200,margin:2300,rate:'24.2%'},
      {name:'苹果',cat:'水果',qty:380,sales:6500,cost:4600,margin:1900,rate:'29.2%'},
      {name:'黄瓜',cat:'蔬菜',qty:620,sales:5300,cost:4100,margin:1200,rate:'22.6%'},
      {name:'鲫鱼',cat:'水产',qty:240,sales:4200,cost:2800,margin:1400,rate:'33.3%'},
    ],
  },
  year: {
    label: '2026年1-5月',
    compareLabel: '较去年同期',
    kpi: [
      { lbl:'营业额', val:'¥148.5万', chg:'+16.8%', up:true },
      { lbl:'订单数', val:'20,850', chg:'+14.2%', up:true },
      { lbl:'客单价', val:'¥71.2', chg:'+2.3%', up:true },
      { lbl:'毛利率', val:'28.1%', chg:'+0.8%', up:true },
      { lbl:'销售量', val:'42,300件', chg:'+15.6%', up:true },
    ],
  }
};

// ===== NAVIGATION =====
const pageTitles = {
  overview: '经营概览', transaction: '交易分析', product: '商品销售',
  category: '品类分析', trend: '销售趋势', profit: '利润分析',
  cost: '成本管控', member: '会员分析', inventory: '库存预警',
  'biz-stats': '经营统计', 'sales-stats': '销售统计', 'daily-report': '营业日报',
  'product-detail': '销售明细', 'label-print': '价签打印', 'print-plan': '打印计划', 'file-store': '文件库',
  'item-code': '打码记录', 'remove-guard': '结算移除',
  'order-hold': '挂单记录', 'shift-handover': '交班记录', 'personal-shift': '交班记录',
  'price-log': '改价日志', 'goods-class': '商品分类', 'goods-list': '商品列表',
  'group-manage': '企业管理', 'store-manage': '门店管理', 'group-form': '企业管理', 'store-form': '门店管理', 'product-memo': '产品备忘'
};
const PAGE_GROUPS = {
  overview: '核心看板', transaction: '核心看板',
  product: '销售分析', category: '销售分析', 'product-detail': '销售分析', trend: '销售分析',
  profit: '财务分析', cost: '财务分析',
  member: '客户运营', inventory: '客户运营',
  'biz-stats': '统计报表', 'sales-stats': '统计报表', 'daily-report': '统计报表',
  'label-print': '打印管理', 'print-plan': '打印管理', 'file-store': '智慧零售云',
  'item-code': '销售管理', 'remove-guard': '销售管理', 'order-hold': '销售管理', 'shift-handover': '销售管理', 'personal-shift': '销售管理',
  'price-log': '商品管理', 'goods-class': '商品管理', 'goods-list': '商品管理',
  'group-manage': '系统管理', 'store-manage': '系统管理', 'group-form': '系统管理', 'store-form': '系统管理', 'product-memo': '产品管理'
};
const initializedPages = new Set();

function activatePage(id) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  // Highlight matching nav item
  var navs = document.querySelectorAll('.nav-item');
  for (var ni = 0; ni < navs.length; ni++) {
    var onclick = navs[ni].getAttribute('onclick') || '';
    if (onclick.indexOf("'" + id + "'") >= 0) { navs[ni].classList.add('active'); break; }
  }
  var page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  // 价签打印、改价日志页面不需要全局日期筛选和企业/门店选择
  var scopeBar = document.getElementById('scopeBar');
  var scopeDt = document.querySelector('.scope-datetime');
  var scopeItems = document.querySelectorAll('.scope-bar .scope-item');
  var scopeSep = document.querySelectorAll('.scope-bar .scope-sep');
  var scopeSpacer = document.querySelectorAll('.scope-bar .scope-spacer');
  var hideScope = (id === 'label-print' || id === 'print-plan' || id === 'file-store' || id === 'price-log' || id === 'goods-class' || id === 'goods-list' || id === 'group-manage' || id === 'store-manage' || id === 'group-form' || id === 'store-form' || id === 'remove-guard' || id === 'order-hold' || id === 'shift-handover' || id === 'daily-report' || id === 'personal-shift' || id === 'product-memo');
  if (scopeBar) {
    scopeBar.style.display = hideScope ? 'none' : '';
  }
  if (scopeDt) scopeDt.style.display = hideScope ? 'none' : '';
  scopeItems.forEach(function(el) { el.style.display = hideScope ? 'none' : ''; });
  scopeSep.forEach(function(el) { el.style.display = hideScope ? 'none' : ''; });
  scopeSpacer.forEach(function(el) { el.style.display = hideScope ? 'none' : ''; });
  // 全宽页面移除 content 内边距，让白色背景铺满
  var content = document.querySelector('.content');
  if (content) {
    content.style.padding = hideScope ? '0' : '';
    content.style.overflow = hideScope ? 'hidden' : '';
  }
  document.getElementById('headerTitle').innerHTML = (pageTitles[id] || id) + (id === 'personal-shift' ? ' <span style="font-size:10px;font-weight:500;display:inline-block;padding:2px 8px;border-radius:3px;background:#fff3e0;color:#e65100;border:1px solid #ffe0b2;vertical-align:middle;margin-left:4px">电子秤终端</span>' : '');
  var bcPrefix = PAGE_GROUPS[id] || '数据分析';
  document.getElementById('headerBreadcrumb').textContent = bcPrefix + ' / ' + (pageTitles[id] || id);
  if (!initializedPages.has(id)) {
    initializedPages.add(id);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        setTimeout(function() { initPage(id); refreshPageKPIs(id); }, 50);
      });
    });
  } else {
    refreshPageKPIs(id);
    refreshPageCharts(id);
  }
  // Update mobile bottom tabs
  var mobileTabMap = { overview: 0, transaction: 1, product: 2 };
  var mobileTabs = document.querySelectorAll('#mobileTabs .mobile-tab');
  for (var mi = 0; mi < mobileTabs.length; mi++) { mobileTabs[mi].classList.remove('active'); }
  if (mobileTabMap[id] !== undefined) {
    mobileTabs[mobileTabMap[id]].classList.add('active');
  } else {
    if (mobileTabs[3]) mobileTabs[3].classList.add('active');
  }
}

function switchPage(id, el) {
  // Update URL hash (push to history for back/forward support)
  var hash = '#' + id;
  if (window.location.hash !== hash) {
    history.pushState(null, '', hash);
  }
  // Highlight clicked element immediately so it feels instant
  if (el) {
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    el.classList.add('active');
  }
  activatePage(id);
}

function goToProductPage() {
  const nav = document.getElementById('nav-product');
  if (nav) switchPage('product', nav);
}

function initPage(id) {
  const fns = {
    overview: initOverview,
    transaction: initTransaction, product: initProduct, category: initCategory,
    trend: initTrend, profit: initProfit, cost: initCost, member: initMember, inventory: initInventory,
    'biz-stats': initBizStats, 'sales-stats': initSalesStats,
    'product-detail': initProductDetail, 'label-print': initLabelPrint, 'print-plan': initPrintPlan, 'file-store': initFileStore,
    'item-code': initItemCode, 'remove-guard': initRemoveGuard,
    'order-hold': initOrderHold, 'shift-handover': initShiftHandover, 'daily-report': initDailyReport,
    'personal-shift': initPersonalShift, 'price-log': initPriceLog,
    'goods-class': initGoodsClass, 'goods-list': initGoodsList,
    'group-manage': initGroupManage, 'store-manage': initStoreManage, 'group-form': initGroupForm, 'store-form': initStoreForm, 'product-memo': initProductMemo
  };
  if (fns[id]) fns[id]();
}

function initProductMemo() {
  var box = document.getElementById('productMemoContent');
  if (!box) return;

  function stType(s) {
    if (s === '已上线' || s === '已修复') return 'done';
    if (s === '开发中') return 'dev';
    if (s === '设计中') return 'design';
    if (s === '设计完成') return 'designok';
    if (s === '测试中') return 'test';
    if (s === '规划中') return 'plan';
    if (s === '待评估' || s === '待处理' || s === '已搁置' || s === '已取消' || s === '未启动') return 'todo';
    if (s === 'P0') return 'p0';
    if (s === 'P1') return 'p1';
    if (s === 'P2') return 'p2';
    if (s === '高') return 'high';
    if (s === '中') return 'mid';
    if (s === '低') return 'low';
    return 'todo';
  }
  var stMap = {
    done: 'background:#e6f7ec;color:#1a7f37;border:1px solid #b7e4c7',
    dev:  'background:#e7f0ff;color:#1a56c4;border:1px solid #bcd4ff',
    design:   'background:#f3e8ff;color:#7b2cbf;border:1px solid #e0c8f5',
    designok: 'background:#e3fafc;color:#0b7285;border:1px solid #c5ebf1',
    test:     'background:#fff3e0;color:#b25e00;border:1px solid #ffe0b2',
    plan: 'background:#fff3e0;color:#b25e00;border:1px solid #ffe0b2',
    todo: 'background:#f0f1f3;color:#5b6472;border:1px solid #e2e5ea',
    p0:   'background:#fde7e7;color:#c0392b;border:1px solid #f5c2c2',
    p1:   'background:#fff3e0;color:#b25e00;border:1px solid #ffe0b2',
    p2:   'background:#f0f1f3;color:#5b6472;border:1px solid #e2e5ea',
    high: 'background:#fde7e7;color:#c0392b;border:1px solid #f5c2c2',
    mid:  'background:#fff3e0;color:#b25e00;border:1px solid #ffe0b2',
    low:  'background:#f0f1f3;color:#5b6472;border:1px solid #e2e5ea'
  };
  function tag(text) {
    var st = stMap[stType(text)] || stMap.todo;
    return '<span style="display:inline-block;padding:1px 8px;border-radius:3px;font-size:12px;line-height:18px;white-space:nowrap;' + st + '">' + text + '</span>';
  }
  function card(title, inner) {
    return '<div style="background:#fff;border:1px solid #e9eef7;border-radius:8px;margin:12px 16px;padding:16px 18px;">'
      + '<div style="font-size:15px;font-weight:600;color:#0b1019;margin:0 0 12px;display:flex;align-items:center;gap:8px;">'
      + '<span style="display:inline-block;width:3px;height:14px;background:#005cf5;border-radius:2px;"></span>' + title + '</div>'
      + inner + '</div>';
  }
  function table(head, rows) {
    var h = '<tr>' + head.map(function(c){ return '<th style="width:' + (c.w || '') + '">' + c.t + '</th>'; }).join('') + '</tr>';
    var b = rows.map(function(r){
      return '<tr>' + r.map(function(c, i){
        var v = (head[i] && head[i].tag) ? tag(c) : c;
        return '<td' + (head[i] && head[i].nowrap ? ' style="white-space:nowrap"' : '') + '>' + v + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="table-wrap" style="overflow-x:auto"><table class="ps-table" style="table-layout:fixed;width:100%;min-width:760px">' + h + b + '</table></div>';
  }
  function list(items) {
    return '<ul style="margin:0;padding-left:18px;color:#3a4252;font-size:12px;line-height:22px">' + items.map(function(it){ return '<li>' + it + '</li>'; }).join('') + '</ul>';
  }

  // ===================== 数据（维护只改这里） =====================
  var decisions = [
    ['D-001', '规则即行为(通用)', '页面不靠横幅/提示语复述规则,行为本身体现即可。适用于菜店主线所有页面。']
    // 注：文件库等相关设计规则属智慧零售云(共建),不收录,见 ⑧ 工作备忘。
  ];
  var reqs = [
    ['R-009', '商品推荐(上架关联推荐)', '菜店', 'P2', '规划中', '上架商品时关联推荐商品；目前无此能力'],
    ['R-010', '入库增强(允许未上架商品/入库完成自动上架)', '菜店', 'P1', '规划中', '入库可添加未上架商品（标品库已有即可）；入库完成自动上架'],
    ['R-011', '仓库功能独立开关', '菜店', 'P1', '规划中', '可仅使用库存管理、不启用仓库功能'],
    ['R-012', '销售拆零装箱(库存不足自动拆装关联商品/维护库存)', '菜店', 'P1', '规划中', '销售自动拆零/装箱；主品库存不足时从关联商品自动拆装并维护库存'],
    ['R-008', '数据看板(核心看板)', '菜店', 'P2', '规划中', '核心看板(经营概览/交易分析)未标一期,随 F-001 基础框架规划中；其下 销售明细/经营统计/销售统计/营业日报 属一期已上线'],
    ['F-001', '基础框架(经营概览/交易分析/商品销售/品类分析/销售趋势/利润分析/成本管控/会员分析/库存预警/经营统计/销售统计/营业日报/销售明细)', '菜店', '—', '规划中', '含 13 个分析模块；其中 销售明细/经营统计/销售统计/营业日报 标一期已上线，其余(经营概览/交易分析/商品销售/品类分析/销售趋势/利润分析/成本管控/会员分析/库存预警)规划中'],
    ['R-001', '打印计划模块', '菜店', 'P0', '已上线', '已上线（菜店）；demo + Vue 均已交付'],
    ['R-002', '商品中心(分类 / 列表 / 改价日志)', '菜店', 'P1', '已上线', 'PRD 页 + 功能页'],
    ['R-003', '价签(多批次取最早批次)', '菜店', 'P1', '已上线', '_ppLookupProduceDate 已落地；价签打印按 FIFO 取最早批次'],
    ['R-005', '交班(交班记录 / 个人交班)', '菜店', 'P1', '已上线', '已交付'],
    ['R-006', '销售管理一期(打码记录 / 结算移除 / 挂单记录)', '菜店', 'P0', '已上线', '一期基础功能'],
    ['R-007', '系统管理(企业管理 / 门店管理)', '菜店', 'P1', '已上线', '企业管理/门店管理（列表页/RBAC 仅 dev）'],
    ['F-002', '价签打印', '菜店', '—', '已上线', ''],
    ['F-003', '文件库', '智慧零售云·美天', '—', '开发中', 'v1.9（美天）曾上线；现进入新一期开发']
    // 注：原「需求池」与「模块进度」合并为一表,消除重复;需求条目 R-*,非需求功能 F-*;文件库(零售云)见 ⑦ 工作备忘。
    // 标注约定：需求含多个功能时,在名称括号内注明子功能(如 商品中心(分类/列表/改价日志)),不拆行;此约定适用于所有条目。
  ];
  var issues = [
    // 当前菜店主线无待处理产品问题；一线反馈优化点持续收集。
    // 注：零售云(文件库)曾发现样式问题,已反馈零售云侧,不在此展开。
  ];
  var plan = [
    '<b>近期</b>：价签多批次落地；活动 banner 图（运营素材，非功能需求）。',
    '<b>中期</b>：移动端适配(视一线反馈)。',
    '<b>已共建</b>：智慧零售云·美天 文件库(v1.9)随共建设计完成,规则不在本备忘展开。'
  ];
  // ⑤ 归档：按月 / 按版本的上线纪事摘要（发布层结论），仅列已上线项，不逐条对应 ② 的 R-/F- 编号。维护约定：某功能上线后 → ② 状态改「已上线」+ 此处补一条月度纪事。
  var archived = [
    '2026-06 一期功能上线（菜店）：销售管理一期、交班、商品中心、系统管理、价签打印、打印计划、销售明细·经营统计·销售统计·营业日报',
    '2026-07 打印计划模块上线（菜店）',
    '2026-07 价签多批次（FIFO 取最早批次）上线（菜店）'
  ];
  var todos = [
    'GitLab 同步已放弃,改为 Gitee + GitHub Pages 双端；旧 Push 镜像是否已彻底删除?(影响 Gitee 稳定性)',
    '公开 Pages 仓库 <code>tcm-demo/tcm-analytics</code> 的部署 Secrets 是否已配齐?(PAGES_REPO 应为 tcm-demo/tcm-analytics,非注释里的 -site)',
    '本地明文令牌(GitHub PAT / Gitee token)上线稳定后是否吊销重建?'
  ];

  // 智慧零售云（共建）：含 SaaS / 美天 两标签；本备忘仅记录协作工作备忘,不收录其功能规则
  var retailCloud = {
    tags: ['SaaS（标准版）', '美天（定制版）'],
    memo: [
      '智慧零售云与菜店为两条产品线：菜店为主线需求；零售云为共建(一起设计)，本备忘仅记录协作工作备忘,不收录其功能规则(规则由零售云侧维护)。',
      '标签：智慧零售云含两个版本 —— SaaS（标准）、美天（定制）。已落地的「文件库」功能归属零售云,当前为「美天」标签版本。',
      '文件库(美天版)已随共建设计完成,其具体功能规则不在本备忘展开,需追溯见零售云 PRD/历史。',
      '待确认：SaaS 版是否复用同一套文件库?共建边界(哪些模块归零售云)待与零售云团队对齐。',
      '备注：零售云页面/PRD 见其独立仓库,本菜店项目仅保留入口与引用,不维护其细节。'
    ]
  };

  // ===================== 渲染 =====================
  var html = '';
  html += '<div style="background:#fff;border:1px solid #e9eef7;border-radius:8px;margin:12px 16px;padding:14px 18px;color:#5b6472;font-size:12px;line-height:20px">'
    + '<b style="color:#0b1019">产品备忘（内部用）</b> · 记录需求池、规划、问题与决策,方便随时回顾"未来还有什么要做、现在卡在哪"。不是对外 PRD。<br>'
    + '<b style="color:#0b1019">产品线区分</b>：<b>菜店</b>（主线需求,下方①~⑥ 以菜店为主,零售云相关需求并入 ② 子表）；<b>智慧零售云</b>（共建,含 SaaS / 美天 两标签,其规则不收录,仅见 ⑦ 工作备忘）。<br>'
    + '维护：直接在 <code>initProductMemo</code> 的数据数组增删（<code>reqs / issues / decisions / plan / archived / todos / retailCloud</code>），保存即生效,随 git 同步多端一致。</div>';

  html += card('① 产品原则与决策记录（菜店主线）', table(
    [{t:'编号',w:'70px'},{t:'主题',w:'150px'},{t:'内容'}], decisions)
    + '<div style="font-size:12px;color:#8a93a3;margin-top:8px">零售云(文件库)相关设计规则不收录,见 ⑦ 智慧零售云工作备忘。</div>');
  var reqHead = [{t:'编号',w:'70px'},{t:'需求 / 功能'},{t:'优先级',w:'60px',tag:1},{t:'状态',w:'90px',tag:1},{t:'说明'}];
  function reqRowsByLine(line) {
    return reqs.filter(function(r){ return line === '菜店' ? r[2] === '菜店' : r[2] !== '菜店'; })
               .map(function(r){ return [r[0], r[1], r[3], r[4], r[5]]; });
  }
  html += card('② 需求与功能进度总览',
      '<div style="font-size:12px;font-weight:600;color:#1a2233;margin:2px 0 8px">菜店（主线）</div>'
    + table(reqHead, reqRowsByLine('菜店'))
    + '<div style="font-size:12px;font-weight:600;color:#1a2233;margin:16px 0 8px">智慧零售云（共建）</div>'
    + table(reqHead, reqRowsByLine('零售云'))
    + '<div style="font-size:12px;color:#8a93a3;margin-top:8px">状态口径：<b>一期</b> = 已上线（开发完成），其余均处<b>规划中</b>（以导航「一期」标签为权威范围）。设计态（规划中 / 设计中 / 设计完成）由产品侧手动维护；开发中 = Vue dev/feature 分支在开发项（如文件库），已上线 = 已合 master。<br>标注约定：需求含多个功能时，在名称括号内注明子功能（如 商品中心(分类/列表/改价日志)），不拆行。</div>');
  var issuesInner = issues.length
    ? table([{t:'编号',w:'70px'},{t:'问题 / 优化点'},{t:'模块',w:'90px'},{t:'严重度',w:'80px',tag:1},{t:'状态',w:'90px',tag:1},{t:'备注'}], issues)
    : '<div style="font-size:12px;color:#8a93a3">当前菜店主线无待处理产品问题；一线反馈优化点持续收集。</div>';
  html += card('③ 优化与问题清单（菜店）', issuesInner);
  html += card('④ 规划与里程碑', list(plan));
  html += card('⑤ 已上线 / 已完成归档', list(archived)
    + '<div style="font-size:12px;color:#8a93a3;margin-top:8px">明细状态以 ② 需求与功能进度总览 为准；本栏为按月上线纪事摘要，不逐条对应编号。</div>');
  html += card('⑥ 待确认 / 存疑', list(todos));

  // ⑦ 智慧零售云（共建 · 工作备忘）—— 仅记协作备忘,不收录功能规则
  var rcTagHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'
    + retailCloud.tags.map(function(t){ return '<span style="display:inline-block;padding:2px 10px;border-radius:3px;font-size:12px;background:#eef4ff;color:#1a56c4;border:1px solid #cfe0ff">' + t + '</span>'; }).join('')
    + '</div>';
  html += card('⑦ 智慧零售云（共建 · 工作备忘）', rcTagHtml + list(retailCloud.memo));

  box.innerHTML = html;
}

// ===== 企业管理 =====
var GROUP_DATA = [
  { companyId: 'G1001', companyName: '上海崧泽商贸有限公司', companyShortName: '崧泽', type: 0, businessLicenseNo: '91310118MA1JXXXXX01', businessLicenseFileId: '', businessLicenseExpirationTime: '2027-12-31', businessRegistrationAddress: '上海市青浦区徐泾镇崧泽大道100号', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '张伟', identityCardNo: '310105198504123456', identityCardExpirationTime: '2035-04-12', contact: '陈明', contactPhoneNumber: '13800138001', effectiveTime: '2024-01-15', expirationTime: '2026-01-14', shopNum: 3, enableShopNum: 2, status: 0, logoFileId: '' },
  { companyId: 'G1002', companyName: '北京菜篮子供应链有限公司', companyShortName: '菜篮子', type: 0, businessLicenseNo: '91110108MA0XXXXX02', businessLicenseFileId: '', businessLicenseExpirationTime: '2028-06-30', businessRegistrationAddress: '北京市海淀区中关村大街1号', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '李芳', identityCardNo: '110108197802153321', identityCardExpirationTime: '2032-02-15', contact: '刘洋', contactPhoneNumber: '13900139002', effectiveTime: '2024-03-01', expirationTime: '2025-08-31', shopNum: 1, enableShopNum: 1, status: 2, logoFileId: '' },
  { companyId: 'G1003', companyName: '深圳鲜达配送有限公司', companyShortName: '鲜达', type: 0, businessLicenseNo: '91440300MA5XXXXX03', businessLicenseFileId: '', businessLicenseExpirationTime: '2026-09-15', businessRegistrationAddress: '深圳市南山区粤海街道科技园1号', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '王强', identityCardNo: '440301198910204567', identityCardExpirationTime: '2030-10-20', contact: '黄丽', contactPhoneNumber: '13700137003', effectiveTime: '2023-11-20', expirationTime: '2024-11-19', shopNum: 2, enableShopNum: 0, status: 1, logoFileId: '' },
  { companyId: 'G1005', companyName: '上海正鲜优生鲜超市有限公司', companyShortName: '正鲜优', type: 0, businessLicenseNo: '91310115MA1KXXXX05', businessLicenseFileId: '', businessLicenseExpirationTime: '2027-12-31', businessRegistrationAddress: '上海市浦东新区唐镇', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '赵敏', identityCardNo: '310115199203054321', identityCardExpirationTime: '2039-03-05', contact: '赵敏', contactPhoneNumber: '13701666007', effectiveTime: '2025-06-01', expirationTime: '2027-11-30', shopNum: 3, enableShopNum: 3, status: 0, logoFileId: '' }
];
var STORE_DATA = [
  { shopId: 'S2001', companyId: 'G1001', shopShortName: '青浦旗舰店', shopName: '崧泽-青浦旗舰店', businessLicenseNo: '92310118MA1JXXXXX11', businessLicenseFileId: '', businessLicenseExpirationTime: '2028-12-31', businessRegistrationAddress: '上海市青浦区城中北路500号', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '张伟', identityCardNo: '310105198504123456', identityCardExpirationTime: '2035-04-12', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 1, contact: '陈明', contactPhoneNumber: '13800138001', effectiveTime: '2024-02-01', status: '0' },
  { shopId: 'S2002', companyId: 'G1001', shopShortName: '松江分店', shopName: '崧泽-松江分店', businessLicenseNo: '92310117MA1JXXXXX12', businessLicenseFileId: '', businessLicenseExpirationTime: '2028-06-30', businessRegistrationAddress: '上海市松江区中山路200号', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '张伟', identityCardNo: '310105198504123456', identityCardExpirationTime: '2035-04-12', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 1, contact: '刘洋', contactPhoneNumber: '13900139002', effectiveTime: '2024-03-15', status: '0' },
  { shopId: 'S2003', companyId: 'G1001', shopShortName: '浦东社区店', shopName: '崧泽-浦东社区店', businessLicenseNo: '92310115MA1JXXXXX13', businessLicenseFileId: '', businessLicenseExpirationTime: '2027-03-31', businessRegistrationAddress: '上海市浦东新区张杨路800号', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '张伟', identityCardNo: '310105198504123456', identityCardExpirationTime: '2035-04-12', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 0, contact: '黄丽', contactPhoneNumber: '13700137003', effectiveTime: '2024-04-10', status: '1' },
  { shopId: 'S2004', companyId: 'G1002', shopShortName: '海淀体验店', shopName: '菜篮子-海淀体验店', businessLicenseNo: '92110108MA0XXXXX21', businessLicenseFileId: '', businessLicenseExpirationTime: '2029-01-31', businessRegistrationAddress: '北京市海淀区西三环北路100号', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '李芳', identityCardNo: '110108197802153321', identityCardExpirationTime: '2032-02-15', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 1, contact: '赵刚', contactPhoneNumber: '13600136004', effectiveTime: '2024-03-20', status: '0' },
  { shopId: 'S2005', companyId: 'G1003', shopShortName: '南山配送中心', shopName: '鲜达-南山配送中心', businessLicenseNo: '92440300MA5XXXXX31', businessLicenseFileId: '', businessLicenseExpirationTime: '2026-06-30', businessRegistrationAddress: '深圳市南山区科技南路10号', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '王强', identityCardNo: '440301198910204567', identityCardExpirationTime: '2030-10-20', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 0, contact: '孙涛', contactPhoneNumber: '13500135005', effectiveTime: '2023-12-01', status: '1' },
  { shopId: 'S2006', companyId: 'G1003', shopShortName: '福田社区店', shopName: '鲜达-福田社区店', businessLicenseNo: '92440300MA5XXXXX32', businessLicenseFileId: '', businessLicenseExpirationTime: '2027-09-30', businessRegistrationAddress: '深圳市福田区福华路50号', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '王强', identityCardNo: '440301198910204567', identityCardExpirationTime: '2030-10-20', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 1, contact: '周杰', contactPhoneNumber: '13400134006', effectiveTime: '2024-01-05', status: '1' },
  { shopId: 'S2008', companyId: 'G1005', shopShortName: '唐镇店', shopName: '正育生鲜中心菜场唐镇', businessLicenseNo: '92310115MA1KXXXX51', businessLicenseFileId: '', businessLicenseExpirationTime: '2028-12-31', businessRegistrationAddress: '上海市浦东新区唐镇', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '赵敏', identityCardNo: '310115199203054321', identityCardExpirationTime: '2039-03-05', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 1, contact: '赵敏', contactPhoneNumber: '13701666007', effectiveTime: '2025-06-10', status: '0' },
  { shopId: 'S2009', companyId: 'G1005', shopShortName: '正育菜市场', shopName: '正育生鲜中心菜市场', businessLicenseNo: '92310115MA1KXXXX52', businessLicenseFileId: '', businessLicenseExpirationTime: '2028-12-31', businessRegistrationAddress: '上海市浦东新区', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '赵敏', identityCardNo: '310115199203054321', identityCardExpirationTime: '2039-03-05', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 1, contact: '赵敏', contactPhoneNumber: '13701666007', effectiveTime: '2025-06-12', status: '0' },
  { shopId: 'S2010', companyId: 'G1005', shopShortName: '五莲路店', shopName: '正育生鲜中心菜场五莲路店', businessLicenseNo: '92310115MA1KXXXX53', businessLicenseFileId: '', businessLicenseExpirationTime: '2028-12-31', businessRegistrationAddress: '上海市浦东新区五莲路', shopFrontFileId: '', identityCardFrontFileId: '', identityCardBackFileId: '', lrName: '赵敏', identityCardNo: '310115199203054321', identityCardExpirationTime: '2039-03-05', licenseFileId: '', businessScenarioFileIds: [], inventorySwitch: 1, contact: '赵敏', contactPhoneNumber: '13701666007', effectiveTime: '2025-06-15', status: '0' }
];
var GROUP_PAGE = 1, GROUP_PAGE_SIZE = 10, GROUP_FILTER_KEYWORD = '', GROUP_EDIT_ID = null, GM_SELECTED_ID = null;
var SM_PAGE = 1, SM_PAGE_SIZE = 10, SM_FILTER_COMPANY = 'all', SM_FILTER_KEYWORD = '', STORE_EDIT_ID = null, SM_SELECTED_ID = null;

function gmBuildCompanyOptions(selectedId) {
  return GROUP_DATA.map(function(r){return '<option value="'+r.companyId+'"'+(r.companyId===selectedId?' selected':'')+'>'+r.companyName+'</option>';}).join('');
}

// ========== 企业管理列表 ==========
function initGroupManage() {
  var el = document.getElementById('groupManageContent');
  if (!el) { setTimeout(initGroupManage, 80); return; }
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;background:#F1F2F5">' +
      // ===== 筛选栏（铺满，白色背景）=====
      '<div style="flex-shrink:0;margin:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<input type="text" id="gmFilterKeyword" class="ic-search" placeholder="公司名称或信用代码" style="flex:0 1 240px" value="' + (GROUP_FILTER_KEYWORD || '') + '" onkeydown="if(event.key===\'Enter\')gmSearch()">' +
        '<button class="ic-btn" onclick="gmReset()">重置</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="gmSearch()">查询</button>' +
      '</div>' +
      // ===== 按钮栏（白色背景，独立一行）=====
      '<div style="flex-shrink:0;margin:0;padding:8px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn ic-btn-pri" onclick="showGroupModal()"><span style="margin-right:3px;font-size:12px">+</span>新增</button>' : '') +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn" onclick="gmBatchEdit()">编辑</button>' : '') +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn" onclick="gmBatchEnable()">启用</button>' : '') +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn" onclick="gmBatchDisable()">禁用</button>' : '') +
      '</div>' +
      // ===== 表格卡片（渐变边框 + 白色内层 + table-wrap + pagination-bar）=====
      '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
        '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
          '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
            '<table>' +
              '<thead><tr>' +
                '<th style="width:50px">序号</th>' +
                '<th>公司名称</th>' +
                '<th>统一社会信用代码</th>' +
                '<th>公司法人</th>' +
                '<th>企业类型</th>' +
                '<th>开通时间</th>' +
                '<th>服务有效期至</th>' +
                '<th>已开通门店(启用/禁用)</th>' +
                '<th>状态</th>' +
              '</tr></thead>' +
              '<tbody id="groupTableBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="pagination-bar" id="groupPageBar" style="flex-shrink:0"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  renderGroupTable();
}

// 保存成功后返回列表
function closeGroupForm() {
  GROUP_EDIT_ID = null;
  switchPage('group-manage');
}

function closeStoreForm() {
  STORE_EDIT_ID = null;
  switchPage('store-manage');
}

function gmBatchEnable() {
  if (!GM_SELECTED_ID) { alert('请先点击选择要操作的企业'); return; }
  var d = GROUP_DATA.find(function(r){return r.companyId===GM_SELECTED_ID;});
  if (d) d.status = 0;
  GM_SELECTED_ID = null;
  document.querySelectorAll('#groupTableBody tr.gm-selected-row').forEach(function(r){ r.classList.remove('gm-selected-row'); });
  renderGroupTable();
}

function gmBatchDisable() {
  if (!GM_SELECTED_ID) { alert('请先点击选择要操作的企业'); return; }
  var d = GROUP_DATA.find(function(r){return r.companyId===GM_SELECTED_ID;});
  if (d) d.status = 1;
  GM_SELECTED_ID = null;
  document.querySelectorAll('#groupTableBody tr.gm-selected-row').forEach(function(r){ r.classList.remove('gm-selected-row'); });
  renderGroupTable();
}

// ===== 编辑选中企业 =====
function gmBatchEdit() {
  var ids = gmGetSelectedCompanyIds();
  if (!ids.length) { alert('请先选择要编辑的企业'); return; }
  if (ids.length > 1) { alert('编辑模式仅支持单选'); return; }
  showGroupModal(ids[0]);
}

// ===== 搜索 =====
function gmSearch() {
  var kw = document.getElementById('gmFilterKeyword');
  GROUP_FILTER_KEYWORD = kw ? kw.value.trim() : '';
  GROUP_PAGE = 1;
  renderGroupTable();
}

// ===== 重置 =====
function gmReset() {
  GROUP_FILTER_KEYWORD = '';
  GROUP_PAGE = 1;
  var elKw = document.getElementById('gmFilterKeyword');
  if (elKw) elKw.value = '';
  renderGroupTable();
}

function gmCancelForm() {
  GROUP_EDIT_ID = null;
  switchPage('group-manage');
}

function showGroupModal(editId) {
  GROUP_EDIT_ID = editId || null;
  switchPage('group-form');
}

// ===== 企业管理表单（独立页面，对齐Vue oneEnterprise.vue）=====
function initGroupForm() {
  var el = document.getElementById('groupFormContent');
  if (!el) { setTimeout(initGroupForm, 80); return; }
  var isEdit = !!GROUP_EDIT_ID;
  var titleText = isEdit ? '编辑企业' : '新增企业';
  var d = null;
  if (isEdit) {
    d = GROUP_DATA.find(function(r){return r.companyId===GROUP_EDIT_ID;});
  }
  var v = function(key){return d ? (d[key] || '') : '';};
  var url = function(key){return d ? (d[key] || '') : '';};
  var previewStyle = function(u){return u ? 'block' : 'none';};

  el.innerHTML =
    '<div class="gf-page">' +
      // ===== 页头 =====
      '<div style="flex-shrink:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px">' +
        '<button class="ic-btn" onclick="gmCancelForm()" style="display:flex;align-items:center;gap:4px;font-size:12px"><span style="font-size:15px">←</span>返回</button>' +
        '<span style="font-size:16px;font-weight:700;color:#1a1a2e">' + titleText + '</span>' +
      '</div>' +
      // ===== 表单主体 =====
      '<div class="gf-body">' +

        // 章节1: 企业信息
        '<div class="gf-section">' +
          '<div class="gf-section-hd">企业信息</div>' +
          // 企业类型（置顶，控制显隐）
          '<div class="gf-row">' +
            '<label class="gf-label required">企业类型</label>' +
            '<div class="gf-cell">' +
              '<div style="display:flex;gap:20px;align-items:center;height:32px">' +
                '<label style="display:flex;align-items:center;cursor:pointer;font-size:14px;color:#606266;font-weight:400"><input type="radio" name="gType" value="0" '+(v('type')===1?'':'checked')+' onchange="gmToggleType()" style="margin-right:6px"> 实体企业</label>' +
                '<label style="display:flex;align-items:center;cursor:pointer;font-size:14px;color:#606266;font-weight:400"><input type="radio" name="gType" value="1" '+(v('type')===1?'checked':'')+' onchange="gmToggleType()" style="margin-right:6px"> 非实体组织</label>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 品牌Logo (label + 上传)
          '<div class="gf-row">' +
            '<label class="gf-label">品牌Logo</label>' +
            '<div class="gf-cell">' +
              '<div class="gf-upload" onclick="gmTriggerUpload(\'gLogoFileId\',\'gLogoUrl\',this)">' +
                '<span class="gf-upload-plus" id="gLogoUrl-plus" style="display:' + (url('logoUrl') ? 'none' : 'block') + '">+</span>' +
                '<span class="gf-upload-text" id="gLogoUrl-text" style="display:' + (url('logoUrl') ? 'none' : 'block') + '">上传</span>' +
                '<input type="hidden" id="gLogoFileId" value="' + v('logoFileId') + '">' +
                '<img class="gf-upload-preview" id="gLogoUrl-img" src="' + url('logoUrl') + '" style="display:' + previewStyle(url('logoUrl')) + '">' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 品牌名（在品牌Logo下方，单排）
          '<div class="gf-row">' +
            '<label class="gf-label">品牌名</label>' +
            '<div class="gf-cell"><input class="gf-input" id="gCompanyShortName" placeholder="请输入品牌名" maxlength="8" value="' + v('companyShortName') + '"></div>' +
          '</div>' +
          // 实体企业字段（type==0 显示，对应Vue v-if type==0）：营业执照
          '<div id="gEntityFields">' +
            // 营业执照 (label + 上传)
            '<div class="gf-row">' +
              '<label class="gf-label required">营业执照</label>' +
              '<div class="gf-cell">' +
                '<div class="gf-upload" onclick="gmTriggerUpload(\'gBizLicenseFileId\',\'gBizLicenseUrl\',this)">' +
                  '<span class="gf-upload-plus" id="gBizLicenseUrl-plus" style="display:' + (url('businessLicenseUrl') ? 'none' : 'block') + '">+</span>' +
                  '<span class="gf-upload-text" id="gBizLicenseUrl-text" style="display:' + (url('businessLicenseUrl') ? 'none' : 'block') + '">上传</span>' +
                  '<input type="hidden" id="gBizLicenseFileId" value="' + v('businessLicenseFileId') + '">' +
                  '<img class="gf-upload-preview" id="gBizLicenseUrl-img" src="' + url('businessLicenseUrl') + '" style="display:' + previewStyle(url('businessLicenseUrl')) + '">' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 企业名称 / 组织名称（始终显示，label随类型切换，对应Vue companyName）—— 排在实体字段之前
          '<div class="gf-row">' +
            '<label class="gf-label required" id="gCompanyNameLabel">企业名称</label>' +
            '<div class="gf-cell"><input class="gf-input" id="gCompanyName" placeholder="请输入企业名称" maxlength="50" value="' + v('companyName') + '"></div>' +
          '</div>' +
          // 实体专属：信用代码 / 注册地址 / 营业执照有效期（type==0 显示）
          '<div id="gEntityFields2">' +
            // 信用代码
            '<div class="gf-row">' +
              '<label class="gf-label required">信用代码</label>' +
              '<div class="gf-cell"><input class="gf-input" id="gLicenseNo" placeholder="请输入企业统一社会信用代码" value="' + v('businessLicenseNo') + '"></div>' +
            '</div>' +
            // 注册地址
            '<div class="gf-row">' +
              '<label class="gf-label required">注册地址</label>' +
              '<div class="gf-cell"><input class="gf-input" id="gBizRegAddress" placeholder="请输入企业注册地址" value="' + v('businessRegistrationAddress') + '"></div>' +
            '</div>' +
            // 营业执照有效期
            '<div class="gf-row">' +
              '<label class="gf-label required">营业执照有效期</label>' +
              '<div class="gf-cell"><input class="gf-input" type="date" id="gBizLicenseExpTime" value="' + v('businessLicenseExpirationTime') + '"></div>' +
            '</div>' +
          '</div>' +
          // 服务有效期至（始终显示，对应Vue expirationTime）
          '<div class="gf-row">' +
            '<label class="gf-label required" id="gExpTimeLabel">服务有效期至</label>' +
            '<div class="gf-cell"><input class="gf-input" type="date" id="gExpirationTime" value="' + v('expirationTime') + '"></div>' +
          '</div>' +
        '</div>' +

        // 章节2: 法人信息（仅实体组织显示）
        '<div class="gf-section" id="gLegalSection">' +
          '<div class="gf-section-hd">法人信息</div>' +
          // 身份证正反面
          '<div class="gf-row">' +
            '<label class="gf-label required">身份证正反面</label>' +
            '<div class="gf-cell">' +
              '<div class="gf-upload-area">' +
                '<div class="gf-upload" onclick="gmTriggerUpload(\'gIdCardFrontFileId\',\'gIdCardFrontUrl\',this)">' +
                  '<span class="gf-upload-plus" id="gIdCardFrontUrl-plus" style="display:' + (url('identityCardFrontUrl') ? 'none' : 'block') + '">+</span>' +
                  '<span class="gf-upload-text" id="gIdCardFrontUrl-text" style="display:' + (url('identityCardFrontUrl') ? 'none' : 'block') + '">人像面</span>' +
                  '<input type="hidden" id="gIdCardFrontFileId" value="' + v('identityCardFrontFileId') + '">' +
                  '<img class="gf-upload-preview" id="gIdCardFrontUrl-img" src="' + url('identityCardFrontUrl') + '" style="display:' + previewStyle(url('identityCardFrontUrl')) + '">' +
                '</div>' +
                '<div class="gf-upload" onclick="gmTriggerUpload(\'gIdCardBackFileId\',\'gIdCardBackUrl\',this)">' +
                  '<span class="gf-upload-plus" id="gIdCardBackUrl-plus" style="display:' + (url('identityCardBackUrl') ? 'none' : 'block') + '">+</span>' +
                  '<span class="gf-upload-text" id="gIdCardBackUrl-text" style="display:' + (url('identityCardBackUrl') ? 'none' : 'block') + '">国徽面</span>' +
                  '<input type="hidden" id="gIdCardBackFileId" value="' + v('identityCardBackFileId') + '">' +
                  '<img class="gf-upload-preview" id="gIdCardBackUrl-img" src="' + url('identityCardBackUrl') + '" style="display:' + previewStyle(url('identityCardBackUrl')) + '">' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 法人姓名
          '<div class="gf-row">' +
            '<label class="gf-label required">法人姓名</label>' +
            '<div class="gf-cell"><input class="gf-input" id="gLrName" placeholder="请输入法人姓名" value="' + v('lrName') + '"></div>' +
          '</div>' +
          // 身份证号
          '<div class="gf-row">' +
            '<label class="gf-label required">身份证号</label>' +
            '<div class="gf-cell"><input class="gf-input" id="gIdCardNo" placeholder="请输入法人身份证号" value="' + v('identityCardNo') + '"></div>' +
          '</div>' +
          // 身份证有效期
          '<div class="gf-row">' +
            '<label class="gf-label required">身份证有效期</label>' +
            '<div class="gf-cell"><input class="gf-input" type="date" id="gIdCardExpTime" value="' + v('identityCardExpirationTime') + '"></div>' +
          '</div>' +
        '</div>' +

        // 章节3: 联系信息
        '<div class="gf-section">' +
          '<div class="gf-section-hd">联系信息</div>' +
          // 联系人
          '<div class="gf-row">' +
            '<label class="gf-label required">联系人</label>' +
            '<div class="gf-cell"><input class="gf-input" id="gContact" placeholder="请输入企业联系人" value="' + v('contact') + '"></div>' +
          '</div>' +
          // 联系电话
          '<div class="gf-row">' +
            '<label class="gf-label required">联系电话</label>' +
            '<div class="gf-cell"><input class="gf-input" id="gContactPhone" placeholder="请输入联系人电话" value="' + v('contactPhoneNumber') + '"></div>' +
          '</div>' +
        '</div>' +

      '</div>' +
      // ===== 底部操作栏（居中）=====
      '<div class="gf-footer">' +
        '<button class="ic-btn" onclick="gmCancelForm()">取消</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="saveGroup()">保存</button>' +
      '</div>' +
    '</div>';
  gmToggleType();
}

function gmToggleType() {
  var t = parseInt((document.querySelector('input[name="gType"]:checked')||{}).value || '0', 10);
  var isOrg = (t === 1);
  var entity = document.getElementById('gEntityFields');
  var entity2 = document.getElementById('gEntityFields2');
  var legal = document.getElementById('gLegalSection');
  if (entity) entity.style.display = isOrg ? 'none' : 'block';
  if (entity2) entity2.style.display = isOrg ? 'none' : 'block';
  if (legal) legal.style.display = isOrg ? 'none' : 'block';
  var lbl = document.getElementById('gCompanyNameLabel');
  if (lbl) lbl.textContent = isOrg ? '组织名称' : '企业名称';
  var expLbl = document.getElementById('gExpTimeLabel');
  if (expLbl) expLbl.className = 'gf-label required';
}

function saveGroup() {
  var type = parseInt((document.querySelector('input[name="gType"]:checked')||{}).value || '0', 10);
  var isOrg = (type === 1);
  var name = document.getElementById('gCompanyName').value.trim();
  var expTime = document.getElementById('gExpirationTime').value;
  if (!name) { alert('请输入' + (isOrg ? '组织名称' : '企业名称')); return; }
  if (isOrg) {
    // 非实体组织：仅校验服务有效期（组织名称选填，无营业执照、无法人信息）
    if (!expTime) { alert('请选择服务有效期'); return; }
  } else {
    // 实体企业：营业执照 + 法人信息 + 其他必填（除品牌logo、品牌名外均必填）
    var bizFileId = document.getElementById('gBizLicenseFileId').value.trim();
    if (!bizFileId) { alert('请上传营业执照'); return; }
    if (!document.getElementById('gLicenseNo').value.trim()) { alert('请输入企业统一社会信用代码'); return; }
    if (!document.getElementById('gBizRegAddress').value.trim()) { alert('请输入企业注册地址'); return; }
    if (!document.getElementById('gBizLicenseExpTime').value) { alert('请选择营业执照有效期'); return; }
    if (!expTime) { alert('请选择服务有效期'); return; }
    // 法人信息（实体组织必填）
    var idFront = document.getElementById('gIdCardFrontFileId').value.trim();
    var idBack = document.getElementById('gIdCardBackFileId').value.trim();
    if (!idFront || !idBack) { alert('请上传身份证正反面'); return; }
    var lrName = document.getElementById('gLrName').value.trim();
    if (!lrName) { alert('请输入法人姓名'); return; }
    var idCard = document.getElementById('gIdCardNo').value.trim();
    if (!idCard) { alert('请输入法人身份证号'); return; }
    if (!/^(\d{15}|\d{17}[\dXx])$/.test(idCard)) { alert('请输入正确的身份证号码（15位全数字或18位）'); return; }
    var idExp = document.getElementById('gIdCardExpTime').value;
    if (!idExp) { alert('请选择身份证有效期'); return; }
    if (!document.getElementById('gContact').value.trim()) { alert('请输入企业联系人'); return; }
  }
  // 联系电话校验（手机或座机；实体企业必填，非实体组织选填）
  var phone = document.getElementById('gContactPhone').value.trim();
  if (!isOrg && !phone) { alert('请输入联系人电话'); return; }
  if (phone && !/^1[3-9]\d{9}$/.test(phone) && !/^(0\d{2,3}-?)?\d{7,8}$/.test(phone)) { alert('请输入正确的联系电话（手机号或座机号）'); return; }
  
  var data = {
    companyName: name,
    businessLicenseNo: document.getElementById('gLicenseNo').value.trim(),
    businessLicenseFileId: document.getElementById('gBizLicenseFileId').value.trim(),
    businessLicenseExpirationTime: document.getElementById('gBizLicenseExpTime').value,
    businessRegistrationAddress: document.getElementById('gBizRegAddress').value.trim(),
    identityCardFrontFileId: document.getElementById('gIdCardFrontFileId').value.trim(),
    identityCardBackFileId: document.getElementById('gIdCardBackFileId').value.trim(),
    lrName: document.getElementById('gLrName').value.trim(),
    identityCardNo: document.getElementById('gIdCardNo').value.trim(),
    identityCardExpirationTime: document.getElementById('gIdCardExpTime').value,
    contact: document.getElementById('gContact').value.trim(),
    contactPhoneNumber: phone,
    expirationTime: expTime,
    type: parseInt((document.querySelector('input[name="gType"]:checked')||{}).value || '0', 10),
    companyShortName: document.getElementById('gCompanyShortName').value.trim(),
    logoFileId: document.getElementById('gLogoFileId').value.trim()
  };
  if (GROUP_EDIT_ID) {
    var d = GROUP_DATA.find(function(r){return r.companyId===GROUP_EDIT_ID;});
    if (d) { Object.assign(d, data); }
  } else {
    var maxId = 0;
    GROUP_DATA.forEach(function(r){var n=parseInt(r.companyId.replace('G',''));if(n>maxId)maxId=n;});
    data.companyId = 'G' + (maxId + 1);
    data.effectiveTime = new Date().toISOString().slice(0,10);
    data.shopNum = 0; data.enableShopNum = 0; data.status = 0;
    GROUP_DATA.push(data);
  }
  closeGroupForm();
  renderGroupTable();
}

// 上传触发（演示模式 - 读取本地图片预览）
function gmTriggerUpload(fileFieldId, urlFieldId, el) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function() {
    if (!this.files || !this.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      // fileId 用占位符（实际后端会返回）
      document.getElementById(fileFieldId).value = 'demo-file-' + Date.now();
      // 预览图片
      var img = document.getElementById(urlFieldId + '-img');
      if (img) { img.src = e.target.result; img.style.display = 'block'; }
      // 隐藏占位符
      var plus = document.getElementById(urlFieldId + '-plus');
      var text = document.getElementById(urlFieldId + '-text');
      if (plus) plus.style.display = 'none';
      if (text) text.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  };
  input.click();
}

function renderGroupTable() {
  var tbody = document.getElementById('groupTableBody');
  if (!tbody) return;
  var list = GROUP_DATA;
  if (GROUP_FILTER_KEYWORD) {
    var kw = GROUP_FILTER_KEYWORD.toLowerCase();
    list = list.filter(function(r){return r.companyName.toLowerCase().indexOf(kw)>-1||r.businessLicenseNo.indexOf(kw)>-1;});
  }
  var total = list.length;
  var pages = Math.ceil(total / GROUP_PAGE_SIZE) || 1;
  if (GROUP_PAGE > pages) GROUP_PAGE = pages;
  if (GROUP_PAGE < 1) GROUP_PAGE = 1;
  var start = (GROUP_PAGE - 1) * GROUP_PAGE_SIZE;
  var pageData = list.slice(start, start + GROUP_PAGE_SIZE);
  var canEdit = CURRENT_USER_ROLE === 'enterprise';
  tbody.innerHTML = pageData.length ? pageData.map(function(r, idx){
    var seq = start + idx + 1;
    var statusMap = {0: '<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;color:#67c23a;background:#f0f9eb;border:1px solid #e1f3d8">启用</span>', 1: '<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;color:#f56c6c;background:#fef0f0;border:1px solid #fde2e2">禁用</span>', 2: '<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;color:#67c23a;background:#f0f9eb;border:1px solid #e1f3d8">生效中</span>'};
    var statusHtml = statusMap[r.status] || '<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;color:#909399;background:#f4f4f5;border:1px solid #e9e9eb">已过期</span>';
    var nameHtml = canEdit ? '<span onclick="event.stopPropagation();gmOpenEdit(\''+r.companyId+'\')" style="color:#1677ff;cursor:pointer">'+r.companyName+'</span>' : r.companyName;
    return '<tr data-company-id="'+r.companyId+'" onclick="gmSelectRow(this)" style="cursor:pointer">' +
      '<td style="text-align:center;color:#999">'+seq+'</td>' +
      '<td>'+nameHtml+'</td>' +
      '<td>'+r.businessLicenseNo+'</td>' +
      '<td>'+r.lrName+'</td>' +
      '<td>'+(r.type===1?'非实体组织':'实体企业')+'</td>' +
      '<td>'+r.effectiveTime+'</td>' +
      '<td>'+r.expirationTime+'</td>' +
      '<td>'+r.shopNum+' / '+r.enableShopNum+'</td>' +
      '<td>'+statusHtml+'</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:#999;padding:30px">暂无数据</td></tr>';
  gmUpdatePagination(total);
}

// 企业列表点击行选中（单选）
function gmSelectRow(tr) {
  document.querySelectorAll('#groupTableBody tr.gm-selected-row').forEach(function(r){ r.classList.remove('gm-selected-row'); });
  tr.classList.add('gm-selected-row');
  GM_SELECTED_ID = tr.dataset.companyId;
}

function smSelectRow(tr) {
  document.querySelectorAll('#smTableBody tr.sm-selected-row').forEach(function(r){ r.classList.remove('sm-selected-row'); });
  tr.classList.add('sm-selected-row');
  SM_SELECTED_ID = tr.dataset.shopId;
}

// ===== 企业管理分页渲染 =====
function gmUpdatePagination(total) {
  var bar = document.getElementById('groupPageBar');
  if (!bar) return;
  var totalPages = Math.ceil(total / GROUP_PAGE_SIZE) || 1;
  var html = '<span class="page-info">共 ' + total + ' 条</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="gmGoPage(' + (GROUP_PAGE - 1) + ')" ' + (GROUP_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';

  // 页码按钮：前3页 + 当前附近 + 最后2页
  var pages = [];
  for (var p = 1; p <= totalPages; p++) {
    if (p <= 3 || p > totalPages - 2 || Math.abs(p - GROUP_PAGE) <= 1) {
      if (pages.length > 0 && p - pages[pages.length - 1] > 1) pages.push('...');
      pages.push(p);
    }
  }
  for (var pi = 0; pi < pages.length; pi++) {
    var pg = pages[pi];
    if (pg === '...') {
      html += '<span class="page-num" style="opacity:0.4">...</span>';
    } else {
      html += '<button class="page-btn' + (pg === GROUP_PAGE ? ' active' : '') + '" onclick="gmGoPage(' + pg + ')">' + pg + '</button>';
    }
  }
  html += '<button class="page-btn" onclick="gmGoPage(' + (GROUP_PAGE + 1) + ')" ' + (GROUP_PAGE >= totalPages ? 'disabled' : '') + '>›</button></div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666"><span>' + GROUP_PAGE_SIZE + '条/页</span><span>跳至</span><input type="number" class="page-jump-input" id="gmJumpInput" min="1" max="' + totalPages + '" value="' + GROUP_PAGE + '" onkeydown="if(event.key===\'Enter\')gmGoPage(parseInt(this.value))"><span>页</span></div>';
  bar.innerHTML = html;
}

function gmGoPage(p) {
  var total = GROUP_DATA.length;
  if (GROUP_FILTER_KEYWORD) {
    var kw = GROUP_FILTER_KEYWORD.toLowerCase();
    total = GROUP_DATA.filter(function(r){return r.companyName.toLowerCase().indexOf(kw)>-1||r.businessLicenseNo.indexOf(kw)>-1;}).length;
  }
  var totalPages = Math.ceil(total / GROUP_PAGE_SIZE) || 1;
  if (p < 1 || p > totalPages) return;
  GROUP_PAGE = p;
  renderGroupTable();
}

// ========== 门店管理列表（完全对齐企业管理列表结构）==========
function initStoreManage() {
  var el = document.getElementById('storeManageContent');
  if (!el) { setTimeout(initStoreManage, 80); return; }
  var companyOpts = '<option value="all">全部企业</option>' + (GROUP_DATA||[]).map(function(r){return '<option value="'+r.companyId+'">'+r.companyName+'</option>';}).join('');
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;background:#F1F2F5">' +
      // ===== 筛选栏（铺满，白色背景）=====
      '<div style="flex-shrink:0;margin:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<select id="smFilterCompany" style="width:160px;height:32px;padding:0 10px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;background:#fff;outline:none;box-sizing:border-box" onchange="SM_FILTER_COMPANY=this.value;SM_PAGE=1;smRenderTable()">' +
          companyOpts +
        '</select>' +
        '<input type="text" id="smFilterKeyword" class="ic-search" placeholder="门店名称或信用代码" style="flex:0 1 240px" value="' + (SM_FILTER_KEYWORD || '') + '" onkeydown="if(event.key===\'Enter\')smSearch()">' +
        '<button class="ic-btn" onclick="smReset()">重置</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="smSearch()">查询</button>' +
      '</div>' +
      // ===== 按钮栏（白色背景，独立一行）=====
      '<div style="flex-shrink:0;margin:0;padding:8px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn ic-btn-pri" onclick="smOpenAdd()"><span style="margin-right:3px;font-size:12px">+</span>新增</button>' : '') +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn" onclick="smBatchEdit()">编辑</button>' : '') +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn" onclick="smBatchEnable()">启用</button>' : '') +
        (CURRENT_USER_ROLE === 'enterprise' ? '<button class="ic-btn" onclick="smBatchDisable()">禁用</button>' : '') +
      '</div>' +
      // ===== 表格卡片（渐变边框 + 白色内层 + table-wrap + pagination-bar）=====
      '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
        '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
          '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
            '<table>' +
              '<thead><tr>' +
                '<th style="width:50px">序号</th>' +
                '<th>门店名称</th>' +
                '<th>营业执照名称</th>' +
                '<th>统一社会信用代码</th>' +
                '<th>联系人</th>' +
                '<th>开通时间</th>' +
                '<th>所属企业</th>' +
                '<th>状态</th>' +
              '</tr></thead>' +
              '<tbody id="smTableBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="pagination-bar" id="smPageBar" style="flex-shrink:0"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  smRenderTable();
}


// ===== STORE FORM FUNCTIONS =====
function initStoreForm() {
  var el = document.getElementById('storeFormContent');
  if (!el) { setTimeout(initStoreForm, 80); return; }
  var isEdit = STORE_EDIT_ID !== null;
  var title = document.getElementById('storeFormTitle');
  if (title) title.textContent = isEdit ? '编辑门店' : '新增门店';

  var d = isEdit ? (function(){ var r=null; STORE_DATA.forEach(function(s){if(s.shopId===STORE_EDIT_ID)r=s;}); return r; })() : null;
  var companyOpts = (GROUP_DATA||[]).map(function(g){
    return '<option value="'+g.companyId+'"'+(d&&d.companyId===g.companyId?' selected':'')+'>'+g.companyName+'</option>';
  }).join('');

  el.innerHTML =
    '<div class="gf-page">' +
      // 页头
      '<div style="flex-shrink:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px">' +
        '<button class="ic-btn" onclick="closeStoreForm()" style="display:flex;align-items:center;gap:4px;font-size:12px"><span style="font-size:15px">←</span>返回</button>' +
        '<span style="font-size:16px;font-weight:700;color:#1a1a2e">' + (isEdit ? '编辑门店' : '新增门店') + '</span>' +
      '</div>' +
      // 表单主体
      '<div class="gf-body">' +

        '<!-- 门店信息 -->' +
        '<div class="gf-section" style="margin-bottom:28px">' +
          '<div class="gf-section-hd">门店信息</div>' +
          '<div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>营业执照</label>' +
              '<div class="sf-upload" id="sfLicenseUpload" style="width:148px;height:148px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden" onclick="smTriggerUpload(\'businessLicenseFileId\',\'sfLicensePreview\',this)">' +
                (d&&d.businessLicenseFileId?'<img id="sfLicensePreview" src="#" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.45);color:#fff;font-size:11px;text-align:center;padding:3px 0;display:none" id="sfLicenseRemove" onclick="event.stopPropagation();smRemoveUpload(\'businessLicenseFileId\',\'sfLicensePreview\',\'sfLicenseUpload\')">移除</div>':'<span style="font-size:28px;color:#bbb;line-height:1">+</span><span style="font-size:11px;color:#999;margin-top:4px">营业执照</span><img id="sfLicensePreview" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0"><input type="file" id="sfFileInput_license" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'businessLicenseFileId\',\'sfLicensePreview\',\'sfLicenseUpload\')">') +
              '</div>' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>门头照</label>' +
              '<div class="sf-upload" id="sfDoorUpload" style="width:148px;height:148px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden" onclick="smTriggerUpload(\'shopFrontFileId\',\'sfDoorPreview\',this)">' +
                (d&&d.shopFrontFileId?'<img id="sfDoorPreview" src="#" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.45);color:#fff;font-size:11px;text-align:center;padding:3px 0;display:none" id="sfDoorRemove" onclick="event.stopPropagation();smRemoveUpload(\'shopFrontFileId\',\'sfDoorPreview\',\'sfDoorUpload\')">移除</div>':'<span style="font-size:28px;color:#bbb;line-height:1">+</span><span style="font-size:11px;color:#999;margin-top:4px">门头照</span><img id="sfDoorPreview" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0"><input type="file" id="sfFileInput_door" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'shopFrontFileId\',\'sfDoorPreview\',\'sfDoorUpload\')">') +
              '</div>' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>门店名称</label>' +
              '<input class="gf-input" id="sfShopShortName" value="'+(d?d.shopShortName:'')+'" placeholder="请输入门店名称（内部简称）">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>营业执照名称</label>' +
              '<input class="gf-input" id="sfShopName" value="'+(d?d.shopName:'')+'" placeholder="请输入营业执照上的门店名称">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>统一代码</label>' +
              '<input class="gf-input" id="sfLicenseNo" value="'+(d?d.businessLicenseNo:'')+'" placeholder="请输入统一社会信用代码">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>有效期至</label>' +
              '<input class="gf-input" type="date" id="sfBizLicenseExp" value="'+(d?d.businessLicenseExpirationTime:'')+'">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>地址</label>' +
              '<input class="gf-input" id="sfBizRegAddress" value="'+(d?d.businessRegistrationAddress:'')+'" placeholder="请输入注册地址">' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<!-- 法人信息 -->' +
        '<div class="gf-section" style="margin-bottom:28px">' +
          '<div class="gf-section-hd">法人信息</div>' +
          '<div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>身份证正反面</label>' +
              '<div style="display:flex;gap:12px">' +
                '<div class="sf-upload" id="sfCardFrontUpload" style="width:148px;height:148px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden" onclick="smTriggerUpload(\'identityCardFrontFileId\',\'sfCardFrontPreview\',this)">' +
                  (d&&d.identityCardFrontFileId?'<img id="sfCardFrontPreview" src="#" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:28px;color:#bbb;line-height:1">+</span><span style="font-size:11px;color:#999;margin-top:4px">人像面</span><img id="sfCardFrontPreview" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0"><input type="file" id="sfFileInput_front" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'identityCardFrontFileId\',\'sfCardFrontPreview\',\'sfCardFrontUpload\')">') +
                '</div>' +
                '<div class="sf-upload" id="sfCardBackUpload" style="width:148px;height:148px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden" onclick="smTriggerUpload(\'identityCardBackFileId\',\'sfCardBackPreview\',this)">' +
                  (d&&d.identityCardBackFileId?'<img id="sfCardBackPreview" src="#" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:28px;color:#bbb;line-height:1">+</span><span style="font-size:11px;color:#999;margin-top:4px">国徽面</span><img id="sfCardBackPreview" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0"><input type="file" id="sfFileInput_back" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'identityCardBackFileId\',\'sfCardBackPreview\',\'sfCardBackUpload\')">') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>法人姓名</label>' +
              '<input class="gf-input" id="sfLrName" value="'+(d?d.lrName:'')+'" placeholder="请输入法人姓名">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>身份证号</label>' +
              '<input class="gf-input" id="sfIdCardNo" value="'+(d?d.identityCardNo:'')+'" placeholder="请输入法人身份证号">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>有效期至</label>' +
              '<input class="gf-input" type="date" id="sfIdCardExp" value="'+(d?d.identityCardExpirationTime:'')+'">' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<!-- 其他证照 -->' +
        '<div class="gf-section" style="margin-bottom:28px">' +
          '<div class="gf-section-hd">其他证照</div>' +
          '<div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>许可证</label>' +
              '<div class="sf-upload" id="sfPermitUpload" style="width:148px;height:148px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden" onclick="smTriggerUpload(\'licenseFileId\',\'sfPermitPreview\',this)">' +
                (d&&d.licenseFileId?'<img id="sfPermitPreview" src="#" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:28px;color:#bbb;line-height:1">+</span><span style="font-size:11px;color:#999;margin-top:4px">许可证</span><img id="sfPermitPreview" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0"><input type="file" id="sfFileInput_permit" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'licenseFileId\',\'sfPermitPreview\',\'sfPermitUpload\')">') +
              '</div>' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:flex-start;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0;margin-top:4px"><span style="color:#f56c6c;margin-right:2px">*</span>经营场景</label>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<div class="sf-upload" id="sfScene1Upload" style="width:110px;height:110px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden;font-size:11px" onclick="smTriggerUpload(\'sceneFileId1\',\'sfScene1Preview\',this)">' +
                  (d&&d.businessScenarioFileIds&&d.businessScenarioFileIds[0]?'<img id="sfScene1Preview" src="#" style="width:100%;height:100%;object-fit:cover">':'收银台<input type="file" id="sfFileInput_scene1" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'sceneFileId1\',\'sfScene1Preview\',\'sfScene1Upload\')">') +
                '</div>' +
                '<div class="sf-upload" id="sfScene2Upload" style="width:110px;height:110px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden;font-size:11px" onclick="smTriggerUpload(\'sceneFileId2\',\'sfScene2Preview\',this)">' +
                  (d&&d.businessScenarioFileIds&&d.businessScenarioFileIds[1]?'<img id="sfScene2Preview" src="#" style="width:100%;height:100%;object-fit:cover">':'货架1<input type="file" id="sfFileInput_scene2" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'sceneFileId2\',\'sfScene2Preview\',\'sfScene2Upload\')">') +
                '</div>' +
                '<div class="sf-upload" id="sfScene3Upload" style="width:110px;height:110px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden;font-size:11px" onclick="smTriggerUpload(\'sceneFileId3\',\'sfScene3Preview\',this)">' +
                  (d&&d.businessScenarioFileIds&&d.businessScenarioFileIds[2]?'<img id="sfScene3Preview" src="#" style="width:100%;height:100%;object-fit:cover">':'货架2<input type="file" id="sfFileInput_scene3" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'sceneFileId3\',\'sfScene3Preview\',\'sfScene3Upload\')">') +
                '</div>' +
                '<div class="sf-upload" id="sfScene4Upload" style="width:110px;height:110px;border:1px dashed #dcdfe6;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden;font-size:11px" onclick="smTriggerUpload(\'sceneFileId4\',\'sfScene4Preview\',this)">' +
                  (d&&d.businessScenarioFileIds&&d.businessScenarioFileIds[3]?'<img id="sfScene4Preview" src="#" style="width:100%;height:100%;object-fit:cover">':'货架3<input type="file" id="sfFileInput_scene4" accept="image/*" style="display:none" onchange="smHandleUpload(this,\'sceneFileId4\',\'sfScene4Preview\',\'sfScene4Upload\')">') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<!-- 其他信息 -->' +
        '<div class="gf-section" style="margin-bottom:28px">' +
          '<div class="gf-section-hd">其他信息</div>' +
          '<div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>所属企业</label>' +
              '<select class="gf-input" id="sfCompanyId" style="flex:1;height:32px;padding:0 10px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;outline:none;box-sizing:border-box;background:#fff">' +
                '<option value="">请选择企业</option>' + companyOpts +
              '</select>' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>联系人</label>' +
              '<input class="gf-input" id="sfContact" value="'+(d?d.contact:'')+'" placeholder="请输入联系人">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0"><span style="color:#f56c6c;margin-right:2px">*</span>联系电话</label>' +
              '<input class="gf-input" id="sfContactPhone" value="'+(d?d.contactPhoneNumber:'')+'" placeholder="请输入联系电话">' +
            '</div>' +
            '<div class="gf-row" style="display:flex;align-items:center;margin-bottom:18px">' +
              '<label class="gf-label" style="width:120px;text-align:right;padding-right:12px;color:#606266;white-space:nowrap;font-size:12px;flex-shrink:0">库存开关</label>' +
              '<label style="display:flex;align-items:center;cursor:pointer"><input type="checkbox" id="sfInventorySwitch" '+(d&&d.inventorySwitch===1?'checked':'')+' style="margin-right:8px">开启</label>' +
            '</div>' +
          '</div>' +
          '</div>' +

      '</div>' +   // closes gf-body
      // ===== 底部操作栏（居中）=====
      '<div class="gf-footer">' +
        '<button class="ic-btn" onclick="smCloseForm()">取消</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="smSaveForm()">保存</button>' +
      '</div>' +
    '</div>';

  // 如果有图片，显示预览（用本地文件读取）
  if (isEdit && d) {
    // 触发一次文件读取来显示预览（如果有文件路径）
    // 这里用占位符，实际项目中应该显示服务器图片
  }
}

function smCloseForm() {
  STORE_EDIT_ID = null;
  switchPage('store-manage');
}

function smSaveForm() {
  var isEdit = STORE_EDIT_ID !== null;
  var d = isEdit ? (function(){ var r=null; STORE_DATA.forEach(function(s){if(s.shopId===STORE_EDIT_ID)r=s;}); return r; })() : null;

  // 上传必填校验：新增看本次上传，编辑看已有记录
  function sfHasUpload(fieldId, dataField) {
    if (_SF_FILE_DATA[fieldId]) return true;
    var hidden = document.getElementById('sfHidden_' + fieldId);
    if (hidden && hidden.value) return true;
    if (isEdit && d && d[dataField]) return true;
    return false;
  }

  var shortName = document.getElementById('sfShopShortName').value.trim();
  var shopName = document.getElementById('sfShopName').value.trim();
  var companyId = document.getElementById('sfCompanyId').value;
  var licenseNo = document.getElementById('sfLicenseNo').value.trim();
  var bizExp = document.getElementById('sfBizLicenseExp').value;
  var regAddr = document.getElementById('sfBizRegAddress').value.trim();
  var lrName = document.getElementById('sfLrName').value.trim();
  var idCard = document.getElementById('sfIdCardNo').value.trim();
  var idExp = document.getElementById('sfIdCardExp').value;
  var contact = document.getElementById('sfContact').value.trim();
  var contactPhone = document.getElementById('sfContactPhone').value.trim();

  // 全部字段必填
  if (!sfHasUpload('businessLicenseFileId', 'businessLicenseFileId')) { alert('请上传营业执照'); return; }
  if (!sfHasUpload('shopFrontFileId', 'shopFrontFileId')) { alert('请上传门头照'); return; }
  if (!shortName) { alert('请输入门店名称'); return; }
  if (!shopName) { alert('请输入营业执照名称'); return; }
  if (!licenseNo) { alert('请输入统一社会信用代码'); return; }
  if (!bizExp) { alert('请选择营业执照有效期'); return; }
  if (!regAddr) { alert('请输入注册地址'); return; }
  if (!sfHasUpload('identityCardFrontFileId', 'identityCardFrontFileId') || !sfHasUpload('identityCardBackFileId', 'identityCardBackFileId')) { alert('请上传身份证正反面'); return; }
  if (!lrName) { alert('请输入法人姓名'); return; }
  if (!idCard) { alert('请输入法人身份证号'); return; }
  if (!/^(\d{15}|\d{17}[\dXx])$/.test(idCard)) { alert('请输入正确的身份证号码（15位或18位）'); return; }
  if (!idExp) { alert('请选择身份证有效期'); return; }
  if (!sfHasUpload('licenseFileId', 'licenseFileId')) { alert('请上传许可证'); return; }
  var sceneOk = sfHasUpload('sceneFileId1', 'businessScenarioFileIds') || sfHasUpload('sceneFileId2', 'businessScenarioFileIds') || sfHasUpload('sceneFileId3', 'businessScenarioFileIds') || sfHasUpload('sceneFileId4', 'businessScenarioFileIds');
  if (!sceneOk) { alert('请至少上传一张经营场景照片'); return; }
  if (!companyId) { alert('请选择所属企业'); return; }
  if (!contact) { alert('请输入联系人'); return; }
  if (!contactPhone) { alert('请输入联系电话'); return; }
  if (contactPhone && !/^1[3-9]\d{9}$/.test(contactPhone) && !/^(0\d{2,3}-?)?\d{7,8}$/.test(contactPhone)) { alert('请输入正确的联系电话（手机号或座机号）'); return; }

  var data = {
    companyId: companyId,
    shopShortName: shortName,
    shopName: shopName,
    businessLicenseNo: licenseNo,
    businessLicenseExpirationTime: bizExp,
    businessRegistrationAddress: regAddr,
    lrName: lrName,
    identityCardNo: idCard,
    identityCardExpirationTime: idExp,
    inventorySwitch: document.getElementById('sfInventorySwitch').checked ? 1 : 0,
    contact: contact,
    contactPhoneNumber: contactPhone,
    businessLicenseFileId: '',
    shopFrontFileId: '',
    identityCardFrontFileId: '',
    identityCardBackFileId: '',
    licenseFileId: '',
    businessScenarioFileIds: []
  };

  if (STORE_EDIT_ID) {
    var idx = -1;
    STORE_DATA.forEach(function(r, i){ if(r.shopId===STORE_EDIT_ID) idx = i; });
    if (idx >= 0) {
      var oldCompanyId = STORE_DATA[idx].companyId;
      // 保留原有文件ID（编辑时如果不重新上传，保持原值）
      data.businessLicenseFileId = STORE_DATA[idx].businessLicenseFileId || '';
      data.shopFrontFileId = STORE_DATA[idx].shopFrontFileId || '';
      data.identityCardFrontFileId = STORE_DATA[idx].identityCardFrontFileId || '';
      data.identityCardBackFileId = STORE_DATA[idx].identityCardBackFileId || '';
      data.licenseFileId = STORE_DATA[idx].licenseFileId || '';
      data.businessScenarioFileIds = STORE_DATA[idx].businessScenarioFileIds || [];
      Object.assign(STORE_DATA[idx], data);
      if (oldCompanyId !== companyId) {
        var oldC = GROUP_DATA.find(function(r){return r.companyId===oldCompanyId;});
        if (oldC) oldC.shopNum = Math.max(0, (oldC.shopNum||0) - 1);
        var newC = GROUP_DATA.find(function(r){return r.companyId===companyId;});
        if (newC) newC.shopNum = (newC.shopNum||0) + 1;
      }
    }
  } else {
    var maxId = 0;
    STORE_DATA.forEach(function(r){ var n=parseInt(r.shopId.replace('S','')); if(n>maxId)maxId=n; });
    data.shopId = 'S' + (maxId + 1);
    data.effectiveTime = new Date().toISOString().slice(0,10);
    data.status = '0';
    STORE_DATA.push(data);
    var c = GROUP_DATA.find(function(r){return r.companyId===companyId;});
    if (c) c.shopNum = (c.shopNum||0) + 1;
  }
  STORE_EDIT_ID = null;
  showToast(STORE_EDIT_ID ? '保存成功' : '新增成功');
  switchPage('store-manage');
}

// 门店表单文件上传
var _SF_FILE_DATA = {};  // fieldId -> base64 data URL

function smTriggerUpload(fieldId, previewId, uploadEl) {
  var inputId = 'sfFileInput_' + fieldId.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/,'');
  // 简化：用文本输入框替代文件上传（demo用）
  var url = prompt('请输入图片URL（demo模式，实际应上传文件）:', '');
  if (url) {
    _SF_FILE_DATA[fieldId] = url;
    var preview = document.getElementById(previewId);
    if (preview) { preview.src = url; preview.style.display = 'block'; }
    // 标记已上传
    var hiddenInput = document.getElementById('sfHidden_' + fieldId);
    if (!hiddenInput) {
      hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.id = 'sfHidden_' + fieldId;
      document.getElementById('storeFormContent').appendChild(hiddenInput);
    }
    hiddenInput.value = url;
  }
}

function smHandleUpload(input, fieldId, previewId, uploadElId) {
  // 文件上传处理（简化版）
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    _SF_FILE_DATA[fieldId] = e.target.result;
    var preview = document.getElementById(previewId);
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    var uploadEl = document.getElementById(uploadElId);
    if (uploadEl) uploadEl.style.borderColor = '#005CF5';
  };
  reader.readAsDataURL(input.files[0]);
}

function smRemoveUpload(fieldId, previewId, uploadElId) {
  delete _SF_FILE_DATA[fieldId];
  var preview = document.getElementById(previewId);
  if (preview) { preview.src = '#'; preview.style.display = 'none'; }
  var uploadEl = document.getElementById(uploadElId);
  if (uploadEl) uploadEl.style.borderColor = '#dcdfe6';
}


function smRenderTable() {
  var tbody = document.getElementById('smTableBody');
  if (!tbody) return;
  var list = STORE_DATA;
  if (SM_FILTER_COMPANY !== 'all') {
    list = list.filter(function(r){return r.companyId===SM_FILTER_COMPANY;});
  }
  if (SM_FILTER_KEYWORD) {
    var kw = SM_FILTER_KEYWORD.toLowerCase();
    list = list.filter(function(r){return r.shopName.toLowerCase().indexOf(kw)>-1||r.businessLicenseNo.indexOf(kw)>-1;});
  }
  var total = list.length;
  var pages = Math.ceil(total / SM_PAGE_SIZE) || 1;
  if (SM_PAGE > pages) SM_PAGE = pages;
  if (SM_PAGE < 1) SM_PAGE = 1;
  var start = (SM_PAGE - 1) * SM_PAGE_SIZE;
  var pageData = list.slice(start, start + SM_PAGE_SIZE);
  var canEdit = CURRENT_USER_ROLE === 'enterprise';
  var companyMap = {};
  GROUP_DATA.forEach(function(r){companyMap[r.companyId]=r.companyName;});
  tbody.innerHTML = pageData.length ? pageData.map(function(r, idx){
    var seq = start + idx + 1;
    var enabled = r.status === '0';
    var statusHtml = enabled ? '<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;color:#67c23a;background:#f0f9eb;border:1px solid #e1f3d8">启用</span>' : '<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;color:#f56c6c;background:#fef0f0;border:1px solid #fde2e2">禁用</span>';
    var shortName = r.shopShortName || r.shopName;
    var nameHtml = canEdit ? '<span onclick="event.stopPropagation();smOpenEdit(\''+r.shopId+'\')" style="color:#1677ff;cursor:pointer">'+shortName+'</span>' : shortName;
    return '<tr data-shop-id="'+r.shopId+'" onclick="smSelectRow(this)" style="cursor:pointer">' +
      '<td style="text-align:center;color:#999">'+seq+'</td>' +
      '<td>'+nameHtml+'</td>' +
      '<td>'+r.shopName+'</td>' +
      '<td>'+r.businessLicenseNo+'</td>' +
      '<td>'+r.contact+'</td>' +
      '<td>'+r.effectiveTime+'</td>' +
      '<td>'+(companyMap[r.companyId]||'未知')+'</td>' +
      '<td>'+statusHtml+'</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">暂无数据</td></tr>';
  smUpdatePagination(total);
}

function smUpdatePagination(total) {
  var bar = document.getElementById('smPageBar');
  if (!bar) return;
  var totalPages = Math.ceil(total / SM_PAGE_SIZE) || 1;
  var html = '<span class="page-info">共 ' + total + ' 条</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="smGoPage(' + (SM_PAGE - 1) + ')" ' + (SM_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';

  // 页码按钮：前3页 + 当前附近 + 最后2页
  var pages = [];
  for (var p = 1; p <= totalPages; p++) {
    if (p <= 3 || p > totalPages - 2 || Math.abs(p - SM_PAGE) <= 1) {
      if (pages.length > 0 && p - pages[pages.length - 1] > 1) pages.push('...');
      pages.push(p);
    }
  }
  for (var pi = 0; pi < pages.length; pi++) {
    var pg = pages[pi];
    if (pg === '...') {
      html += '<span class="page-num" style="opacity:0.4">...</span>';
    } else {
      html += '<button class="page-btn' + (pg === SM_PAGE ? ' active' : '') + '" onclick="smGoPage(' + pg + ')">' + pg + '</button>';
    }
  }
  html += '<button class="page-btn" onclick="smGoPage(' + (SM_PAGE + 1) + ')" ' + (SM_PAGE >= totalPages ? 'disabled' : '') + '>›</button></div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666"><span>' + SM_PAGE_SIZE + '条/页</span><span>跳至</span><input type="number" class="page-jump-input" id="smJumpInput" min="1" max="' + totalPages + '" value="' + SM_PAGE + '" onkeydown="if(event.key===\'Enter\')smGoPage(parseInt(this.value))"><span>页</span></div>';
  bar.innerHTML = html;
}

function smGoPage(p) {
  var list = STORE_DATA;
  if (SM_FILTER_COMPANY !== 'all') list = list.filter(function(r){return r.companyId===SM_FILTER_COMPANY;});
  if (SM_FILTER_KEYWORD) {
    var kw = SM_FILTER_KEYWORD.toLowerCase();
    list = list.filter(function(r){return r.shopName.toLowerCase().indexOf(kw)>-1||r.businessLicenseNo.indexOf(kw)>-1;});
  }
  var totalPages = Math.ceil(list.length / SM_PAGE_SIZE) || 1;
  if (p < 1 || p > totalPages) return;
  SM_PAGE = p;
  smRenderTable();
}

function smReset() {
  SM_FILTER_COMPANY = 'all';
  SM_FILTER_KEYWORD = '';
  SM_PAGE = 1;
  var cf = document.getElementById('smFilterCompany');
  if (cf) cf.value = 'all';
  var kw = document.getElementById('smFilterKeyword');
  if (kw) kw.value = '';
  smRenderTable();
}

function smSearch() {
  var cf = document.getElementById('smFilterCompany');
  if (cf) SM_FILTER_COMPANY = cf.value;
  var kw = document.getElementById('smFilterKeyword');
  if (kw) SM_FILTER_KEYWORD = kw.value;
  SM_PAGE = 1;
  smRenderTable();
}

function smOpenAdd() {
  STORE_EDIT_ID = null;
  switchPage('store-form');
}

function gmOpenEdit(id) {
  GROUP_EDIT_ID = id;
  switchPage('group-form');
}

function smOpenEdit(id) {
  STORE_EDIT_ID = id;
  switchPage('store-form');
}

function smBatchEdit() {
  var ids = smGetSelectedIds();
  if (ids.length !== 1) { alert('请选择且仅选择一条记录进行编辑'); return; }
  STORE_EDIT_ID = ids[0];
  switchPage('store-form');
}

function smBatchEnable() {
  if (!SM_SELECTED_ID) { alert('请先点击选择要操作的门店'); return; }
  var d = STORE_DATA.find(function(r){return r.shopId===SM_SELECTED_ID;});
  if (d && d.status !== '0') d.status = '0';
  SM_SELECTED_ID = null;
  document.querySelectorAll('#smTableBody tr.sm-selected-row').forEach(function(r){ r.classList.remove('sm-selected-row'); });
  smRenderTable();
}

function smBatchDisable() {
  if (!SM_SELECTED_ID) { alert('请先点击选择要操作的门店'); return; }
  var d = STORE_DATA.find(function(r){return r.shopId===SM_SELECTED_ID;});
  if (d && d.status !== '1') d.status = '1';
  SM_SELECTED_ID = null;
  document.querySelectorAll('#smTableBody tr.sm-selected-row').forEach(function(r){ r.classList.remove('sm-selected-row'); });
  smRenderTable();
}


// ===== PRICE LOG PAGE =====
var _PL_MOCK_PRODUCTS = [
  { name: '鲜猪肉（带皮前腿）', code: '6928484901001', spec: '称重/kg', unit: 'kg', memberPrice: 19.00, origPrice: 22.00, category: '肉类' },
  { name: '鲜猪肉（带皮五花）', code: '6928484901002', spec: '称重/kg', unit: 'kg', memberPrice: 17.50, origPrice: 20.00, category: '肉类' },
  { name: '鲜鸡蛋（散装）', code: '6928484901003', spec: '称重/kg', unit: 'kg', memberPrice: 10.50, origPrice: 12.00, category: '肉类' },
  { name: '西红柿（精选）', code: '6928484901004', spec: '称重/kg', unit: 'kg', memberPrice: 5.50, origPrice: 6.50, category: '蔬菜' },
  { name: '土豆（黄心）', code: '6928484901005', spec: '称重/kg', unit: 'kg', memberPrice: 3.50, origPrice: 4.00, category: '蔬菜' },
  { name: '大白菜', code: '6928484901006', spec: '称重/kg', unit: 'kg', memberPrice: 2.30, origPrice: 2.80, category: '蔬菜' },
  { name: '黄瓜（刺黄瓜）', code: '6928484901007', spec: '称重/kg', unit: 'kg', memberPrice: 4.80, origPrice: 5.50, category: '蔬菜' },
  { name: '茄子（紫长茄）', code: '6928484901008', spec: '称重/kg', unit: 'kg', memberPrice: 3.80, origPrice: 4.50, category: '蔬菜' },
  { name: '青椒（薄皮）', code: '6928484901009', spec: '称重/kg', unit: 'kg', memberPrice: 6.00, origPrice: 7.00, category: '蔬菜' },
  { name: '豆腐（老豆腐）', code: '6928484901010', spec: '称重/kg', unit: 'kg', memberPrice: 2.80, origPrice: 3.50, category: '蔬菜' },
  { name: '苹果（红富士）', code: '6928484901011', spec: '称重/kg', unit: 'kg', memberPrice: 8.50, origPrice: 9.90, category: '水果' },
  { name: '香蕉（进口）', code: '6928484901012', spec: '称重/kg', unit: 'kg', memberPrice: 7.50, origPrice: 8.80, category: '水果' },
  { name: '大米（东北珍珠米 5kg）', code: '6928484901013', spec: '5kg/袋', unit: '袋', memberPrice: 26.00, origPrice: 29.90, category: '干货' },
  { name: '金龙鱼调和油 5L', code: '6928484901014', spec: '5L/瓶', unit: '瓶', memberPrice: 72.00, origPrice: 79.90, category: '调味品' },
  { name: '海天酱油（生抽 500ml）', code: '6928484901015', spec: '500ml/瓶', unit: '瓶', memberPrice: 7.20, origPrice: 8.50, category: '调味品' },
  { name: '纯牛奶（蒙牛 250ml×12）', code: '6928484901016', spec: '250ml×12/箱', unit: '箱', memberPrice: 45.00, origPrice: 49.90, category: '干货' },
  { name: '方便面（康师傅红烧 5连包）', code: '6928484901017', spec: '5包/袋', unit: '包', memberPrice: 11.00, origPrice: 12.90, category: '干货' },
  { name: '矿泉水（农夫山泉 550ml×24）', code: '6928484901018', spec: '550ml×24/箱', unit: '箱', memberPrice: 30.00, origPrice: 35.00, category: '干货' },
  { name: '食盐（中盐精制盐 400g）', code: '6928484901019', spec: '400g/袋', unit: '袋', memberPrice: 1.60, origPrice: 2.00, category: '调味品' },
  { name: '白砂糖（太古 400g）', code: '6928484901020', spec: '400g/袋', unit: '袋', memberPrice: 6.50, origPrice: 7.50, category: '调味品' }
];
var _PL_MOCK_OPERATORS = ['店员1', '店员2', '店员3', '店长', '管理员'];
var PL_LOGS = [];
var PL_PAGE = 1;
var PL_PAGE_SIZE = 20;
var PL_FILTER_STORE = 'all';
var PL_FILTER_DATE = 'all';
var PL_FILTER_KEYWORD = '';
var PL_FILTER_CATEGORY = 'all';
var PL_CATEGORIES = ['蔬菜', '水果', '肉类', '水产', '干货', '调味品'];

function plGenerateMockLogs() {
  var TOTAL = 120;
  PL_LOGS = [];
  var now = new Date();
  var stores = ['崧泽大道中心店', '华科东路店', '盈港路店'];
  for (var i = 0; i < TOTAL; i++) {
    var offsetMs = Math.floor(i * 90 * 24 * 3600000 / TOTAL + Math.random() * 86400000);
    var ts = new Date(now.getTime() - offsetMs);
    var p = _PL_MOCK_PRODUCTS[Math.floor(Math.random() * _PL_MOCK_PRODUCTS.length)];
    var op = _PL_MOCK_OPERATORS[Math.floor(Math.random() * _PL_MOCK_OPERATORS.length)];
    var store = stores[Math.floor(Math.random() * stores.length)];
    // Random price change: old price is current, new price varies
    var oldPrice = parseFloat((p.origPrice + (Math.random() * 5 - 2)).toFixed(2));
    var newPrice = parseFloat((p.origPrice + (Math.random() * 8 - 3)).toFixed(2));
    // 会员价：始终 ≤ 销售价格（会员价高于销售价格则会员体系不生效）
    var oldMemberPrice = parseFloat((p.memberPrice + (Math.random() * 4 - 2)).toFixed(2));
    if (oldMemberPrice > oldPrice) oldMemberPrice = parseFloat((oldPrice * (0.82 + Math.random() * 0.1)).toFixed(2));
    var newMemberPrice;
    if (Math.random() < 0.4) {
      newMemberPrice = oldMemberPrice;
    } else {
      newMemberPrice = parseFloat((p.memberPrice + (Math.random() * 6 - 2.5)).toFixed(2));
      if (newMemberPrice > newPrice) newMemberPrice = parseFloat((newPrice * (0.82 + Math.random() * 0.1)).toFixed(2));
    }
    PL_LOGS.push({
      id: i + 1,
      name: p.name,
      code: p.code,
      spec: p.spec,
      unit: p.unit,
      oldPrice: parseFloat(oldPrice),
      newPrice: parseFloat(newPrice),
      oldMemberPrice: parseFloat(oldMemberPrice),
      newMemberPrice: parseFloat(newMemberPrice),
      origPrice: p.origPrice,
      category: p.category,
      operator: op,
      store: store,
      time: ts.getFullYear() + '-' +
        (ts.getMonth()+1).toString().padStart(2,'0') + '-' +
        ts.getDate().toString().padStart(2,'0') + ' ' +
        ts.getHours().toString().padStart(2,'0') + ':' +
        ts.getMinutes().toString().padStart(2,'0') + ':' +
        ts.getSeconds().toString().padStart(2,'0')
    });
  }
  PL_LOGS.sort(function(a, b) { return a.time < b.time ? 1 : -1; });
}

function plGetFilteredLogs() {
  var logs = PL_LOGS.slice();
  if (PL_FILTER_STORE !== 'all') {
    logs = logs.filter(function(l) { return l.store === PL_FILTER_STORE; });
  }
  if (PL_FILTER_DATE !== 'all') {
    var now = new Date();
    var cutoff = '';
    if (PL_FILTER_DATE === 'today') {
      cutoff = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0');
    } else if (PL_FILTER_DATE === 'yesterday') {
      var y = new Date(now); y.setDate(now.getDate()-1);
      cutoff = y.getFullYear()+'-'+(y.getMonth()+1).toString().padStart(2,'0')+'-'+y.getDate().toString().padStart(2,'0');
    } else if (PL_FILTER_DATE === 'week') {
      var w = new Date(now); w.setDate(now.getDate()-7);
      cutoff = w.getFullYear()+'-'+(w.getMonth()+1).toString().padStart(2,'0')+'-'+w.getDate().toString().padStart(2,'0');
    } else if (PL_FILTER_DATE === 'month') {
      var m = new Date(now); m.setMonth(now.getMonth()-1);
      cutoff = m.getFullYear()+'-'+(m.getMonth()+1).toString().padStart(2,'0')+'-'+m.getDate().toString().padStart(2,'0');
    }
    if (PL_FILTER_DATE === 'today' || PL_FILTER_DATE === 'yesterday') {
      logs = logs.filter(function(l) { return l.time.indexOf(cutoff) === 0; });
    } else if (cutoff) {
      logs = logs.filter(function(l) { return l.time >= cutoff; });
    }
  }
  if (PL_FILTER_KEYWORD) {
    var kw = PL_FILTER_KEYWORD.toLowerCase();
    logs = logs.filter(function(l) {
      return l.name.toLowerCase().indexOf(kw) >= 0 || l.code.toLowerCase().indexOf(kw) >= 0;
    });
  }
  return logs;
}

function plRenderTable() {
  var thead = document.getElementById('plTableHead');
  var tbody = document.getElementById('plTableBody');
  if (!thead || !tbody) return;

  // thead is static, only render once
  if (!thead.innerHTML) {
    thead.innerHTML = '<th><input type="checkbox" id="plSelectAll" onclick="plToggleAll(this)"></th>' +
      '<th>序号</th><th>商品名称</th><th>商品编码</th><th>商品规格</th>' +
      '<th>商品单位</th><th>销售价格</th><th>会员价</th><th>原价</th>' +
      '<th>操作人</th><th>操作时间</th>';
  }

  var filtered = plGetFilteredLogs();
  var total = filtered.length;
  var start = (PL_PAGE - 1) * PL_PAGE_SIZE;
  var end = Math.min(start + PL_PAGE_SIZE, total);
  var pageLogs = filtered.slice(start, end);

  var html = '';
  for (var i = 0; i < pageLogs.length; i++) {
    var l = pageLogs[i];
    var idx = start + i + 1;
    var priceChanged = l.oldPrice !== l.newPrice;
    var priceDir = l.newPrice > l.oldPrice ? 'up' : 'down';
    var memberChanged = l.oldMemberPrice !== l.newMemberPrice;
    var memberDir = l.newMemberPrice > l.oldMemberPrice ? 'up' : 'down';
    html += '<tr>' +
      '<td><input type="checkbox" class="pl-row-cb" data-id="' + l.id + '"></td>' +
      '<td>' + idx + '</td>' +
      '<td>' + _esc(l.name) + '</td>' +
      '<td style="font-family:monospace;font-size:12px">' + _esc(l.code) + '</td>' +
      '<td>' + _esc(l.spec) + '</td>' +
      '<td>' + _esc(l.unit) + '</td>' +
      '<td style="' + (priceChanged ? 'color:' + (priceDir === 'up' ? '#fc4b52' : '#2e7d32') : '') + '">' +
        '<span style="text-decoration:line-through;color:#999">' + l.oldPrice.toFixed(2) + '</span> ' +
        '→ <span style="font-weight:600">' + l.newPrice.toFixed(2) + '</span>元/' + _esc(l.unit) +
      '</td>' +
      '<td style="' + (memberChanged ? 'color:' + (memberDir === 'up' ? '#fc4b52' : '#2e7d32') : '') + '">' +
        '<span style="text-decoration:line-through;color:#999">' + l.oldMemberPrice.toFixed(2) + '</span> ' +
        '→ <span style="font-weight:600">' + l.newMemberPrice.toFixed(2) + '</span>元/' + _esc(l.unit) +
      '</td>' +
      '<td>' + l.origPrice.toFixed(2) + '元/' + _esc(l.unit) + '</td>' +
      '<td>' + _esc(l.operator) + '</td>' +
      '<td>' + l.time + '</td>' +
    '</tr>';
  }

  if (pageLogs.length === 0) {
    html = '<tr><td colspan="11" style="text-align:center;color:#999;padding:40px">暂无改价记录</td></tr>';
  }

  // Mass-fill select-all state
  tbody.innerHTML = html;
  plUpdatePagination(total);
}

function plUpdatePagination(total) {
  var el = document.getElementById('plPagination');
  if (!el) return;
  var totalPages = Math.ceil(total / PL_PAGE_SIZE) || 1;
  var html = '<span class="page-info">共 ' + total + ' 条</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="plGoPage(' + (PL_PAGE-1) + ')" ' + (PL_PAGE<=1?'disabled':'') + '>‹</button>';

  // page numbers: show first 3, last 2, and current area
  var pages = [];
  for (var p = 1; p <= totalPages; p++) {
    if (p <= 3 || p > totalPages - 2 || Math.abs(p - PL_PAGE) <= 1) {
      if (pages.length > 0 && p - pages[pages.length-1] > 1) pages.push('...');
      pages.push(p);
    }
  }
  for (var pi = 0; pi < pages.length; pi++) {
    var pg = pages[pi];
    if (pg === '...') {
      html += '<span class="page-num" style="opacity:0.4">...</span>';
    } else {
      html += '<button class="page-btn" style="' + (pg===PL_PAGE?'background:#005CF5;color:#fff;border-color:#005CF5':'') + '" onclick="plGoPage(' + pg + ')">' + pg + '</button>';
    }
  }
  html += '<button class="page-btn" onclick="plGoPage(' + (PL_PAGE+1) + ')" ' + (PL_PAGE>=totalPages?'disabled':'') + '>›</button></div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
      PL_PAGE_SIZE + '条/页 跳至 <input type="number" id="plJumpInput" min="1" max="' + totalPages + '" value="' + PL_PAGE + '" ' +
      'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
      'onkeydown="if(event.key===\'Enter\')plGoPage(parseInt(this.value))"> 页' +
    '</div>';
  el.innerHTML = html;
}

function plGoPage(p) {
  var totalPages = Math.ceil(plGetFilteredLogs().length / PL_PAGE_SIZE) || 1;
  if (p < 1 || p > totalPages) return;
  PL_PAGE = p;
  plRenderTable();
}

function plToggleAll(cb) {
  var cbs = document.querySelectorAll('.pl-row-cb');
  for (var i = 0; i < cbs.length; i++) cbs[i].checked = cb.checked;
}

function plSearch() {
  PL_FILTER_STORE = document.getElementById('plFilterStore').value;
  PL_FILTER_KEYWORD = document.getElementById('plFilterKeyword').value.trim();
  PL_PAGE = 1;
  plRenderTable();
}

function plReset() {
  PL_FILTER_STORE = 'all';
  PL_FILTER_DATE = 'all';
  PL_FILTER_KEYWORD = '';
  PL_PAGE = 1;
  var elS = document.getElementById('plFilterStore'); if (elS) elS.value = 'all';
  var elK = document.getElementById('plFilterKeyword'); if (elK) elK.value = '';
  plSyncDateTabs('plFilterTabs', PL_FILTER_DATE);
  plRenderTable();
}

// ===== 改价日志 → 自动加入调价打印计划 开关 =====
// 监控字段（可扩展）：这些字段发生变更即视为「商品信息变更」，开关开启时自动加入调价打印计划
var PP_AUTO_FIELDS = ['name', 'newPrice', 'origPrice', 'oldPrice', 'newMemberPrice', 'oldMemberPrice', 'spec', 'unit', 'store'];

// 从 PL_LOGS 收集商品（开关自动加入 / 手动加入共用）
function plCollectProducts(logIds) {
  var seen = {};
  var products = [];
  for (var j = 0; j < PL_LOGS.length; j++) {
    var log = PL_LOGS[j];
    if (logIds.indexOf(log.id) >= 0 && !seen[log.code]) {
      seen[log.code] = true;
      products.push({
        name: log.name,
        barcode: log.code,
        price: log.newPrice,
        origPrice: log.origPrice,
        memberPrice: log.newMemberPrice || 0,
        unit: log.unit,
        spec: log.spec,
        produceDate: _ppLookupProduceDate(log.code),
        batchCount: _ppBatchCount(log.code),
        origin: log.store || '',
        printQty: 1
      });
    }
  }
  return products;
}

// 自动加入（开关开启时调用）：将商品信息变更自动归集到调价自动计划
function plAutoAdd(logIds, silent) {
  var products = plCollectProducts(logIds);
  if (products.length === 0) return 0;
  if (PPApi.USE_HTTP) {
    PPApi.addFromPriceChanges({
      target: 'latest',
      shopId: products[0].origin || '',
      companyId: PP_COMPANY_ID,
      goodsList: products.map(function(p) {
        return { goodsId: '', goodsName: p.name, goodsListPrice: p.origPrice, goodsPrice: p.price, vipPrice: p.memberPrice, recordTime: '' };
      })
    }).then(function(res) {
      if (!silent) plToast((res && res.code === 0) ? '已自动加入调价打印计划' : ('加入失败：' + ((res && res.message) || '')));
      refreshPlansFromServerOrLocal();
    });
    return products.length;
  }
  var r = ppAddPriceChangeProducts(products, 'price-change');
  if (!silent) {
    var msg = '检测到商品信息变更，已自动加入调价打印计划（' + ((r && r.addedCount) || 0) + ' 件）';
    if (r && r.updatedCount > 0) msg += '，' + r.updatedCount + ' 件价格有变动已更新';
    plToast(msg);
  }
  ppRenderTable();
  _ppSave();
  return (r && r.addedCount) || 0;
}

// 开关切换
function plAutoAddOnToggle() {
  var cb = document.getElementById('plAutoAddSwitch');
  var on = cb ? cb.checked : false;
  try { localStorage.setItem('tcm_pp_autoprice_switch', on ? '1' : '0'); } catch (e) {}
  plSetAutoStatus(on);
  if (on) {
    var ids = PL_LOGS.map(function(l) { return l.id; });
    var added = plAutoAdd(ids, true);
    plToast(added > 0 ? ('已开启：自动加入调价打印计划（本次新增 ' + added + ' 件）') : '已开启：自动加入调价打印计划');
  } else {
    plToast('已关闭：商品信息变更不再自动加入打印计划');
  }
}

function plSetAutoStatus(on) {
  var s = document.getElementById('plAutoStatus');
  if (!s) return;
  s.className = 'pl-auto-status ' + (on ? 'on' : 'off');
  s.textContent = on ? '● 自动加入已开启' : '○ 已关闭';
}

// 进入页面时还原开关状态并静默同步（确保已变更商品已在计划中）
function plLoadAutoSwitch() {
  var on = false;
  try { on = localStorage.getItem('tcm_pp_autoprice_switch') === '1'; } catch (e) {}
  var cb = document.getElementById('plAutoAddSwitch');
  if (cb) cb.checked = on;
  plSetAutoStatus(on);
  if (on) {
    var ids = PL_LOGS.map(function(l) { return l.id; });
    plAutoAdd(ids, true);
  }
}

// 模拟一次商品信息变更（用于演示开关的自动加入效果）
function plSimulateChange() {
  var p = _PL_MOCK_PRODUCTS[Math.floor(Math.random() * _PL_MOCK_PRODUCTS.length)];
  var stores = ['崧泽大道中心店', '华科东路店', '盈港路店'];
  var store = stores[Math.floor(Math.random() * stores.length)];
  var oldPrice = parseFloat((p.origPrice + (Math.random() * 4 - 2)).toFixed(2));
  var newPrice = parseFloat((p.origPrice + (Math.random() * 6 - 2.5)).toFixed(2));
  var newMember = parseFloat((newPrice * (0.82 + Math.random() * 0.1)).toFixed(2));
  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  var ts = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  var maxId = PL_LOGS.reduce(function(m, l) { return Math.max(m, l.id); }, 0);
  var log = {
    id: maxId + 1,
    name: p.name, code: p.code, spec: p.spec, unit: p.unit,
    oldPrice: oldPrice, newPrice: newPrice,
    oldMemberPrice: parseFloat((oldPrice * 0.85).toFixed(2)), newMemberPrice: newMember,
    origPrice: p.origPrice, category: p.category,
    operator: '演示', store: store, time: ts
  };
  PL_LOGS.unshift(log);
  PL_LOGS.sort(function(a, b) { return a.time < b.time ? 1 : -1; });
  plRenderTable();
  var cb = document.getElementById('plAutoAddSwitch');
  var on = cb ? cb.checked : false;
  if (on) {
    plAutoAdd([log.id], false);
  } else {
    plToast('已记录商品信息变更（开关关闭，未自动加入计划）');
  }
}

// 轻量 toast
var _plToastTimer = null;
function plToast(msg) {
  var t = document.getElementById('plToast');
  if (!t) { t = document.createElement('div'); t.id = 'plToast'; t.className = 'pl-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  if (_plToastTimer) clearTimeout(_plToastTimer);
  _plToastTimer = setTimeout(function() { t.classList.remove('show'); }, 2400);
}

// 手动加入选中项（独立于开关，始终加入调价自动计划）
function plAddToPlan() {
  var cbs = document.querySelectorAll('.pl-row-cb:checked');
  if (cbs.length === 0) { alert('请先勾选要加入的改价记录'); return; }
  var ids = [];
  for (var i = 0; i < cbs.length; i++) ids.push(parseInt(cbs[i].getAttribute('data-id')));
  ppAddToPlanFromPriceLog(ids, 'price-change');
}

// ===== 改价日志 → 打印价签 =====
var _PL_PRINT_PRODUCTS = null
var _PL_PRINT_TPL = 'tpl-01'

function plPrintLabels() {
  // 收集所有选中的行
  var cbs = document.querySelectorAll('.pl-row-cb:checked')
  var ids = []
  for (var i = 0; i < cbs.length; i++) {
    ids.push(parseInt(cbs[i].getAttribute('data-id')))
  }
  if (ids.length === 0) { alert('请先在表格中勾选要打印的商品'); return }

  // 从 PL_LOGS 中查出对应记录（去重：同一商品名只取第一个）
  var seen = {}
  var products = []
  for (var j = 0; j < PL_LOGS.length; j++) {
    var log = PL_LOGS[j]
    if (ids.indexOf(log.id) >= 0 && !seen[log.code]) {
      seen[log.code] = true
      products.push({
        name: log.name,
        price: log.newPrice,
        origPrice: log.origPrice,
        spec: log.spec,
        unit: log.unit,
        barcode: log.code,
        origin: log.store || '',
        memberPrice: log.newMemberPrice || 0,
        produceDate: ''
      })
    }
  }

  if (products.length === 0) { alert('未找到选中商品的数据'); return }
  _PL_PRINT_PRODUCTS = products
  _showPlPrintDialog()
}

// ===== 改价日志 → 打印价签 =====
function _showPlPrintDialog() {
  _PL_PRINT_TPL = 'tpl-01'

  var tplOptions = ''
  for (var t = 0; t < LABEL_TEMPLATES.length; t++) {
    var tp = LABEL_TEMPLATES[t]
    tplOptions += '<option value="' + tp.id + '"' + (tp.id === _PL_PRINT_TPL ? ' selected' : '') + '>' +
      tp.name + '（' + tp.size.w + '×' + tp.size.h + 'mm）</option>'
  }

  var html =
    '<div class="ps-overlay" id="plPrintOverlay" style="z-index:9700" onclick="closePlPrintDialog()">' +
      '<div class="ps-dialog" style="width:min(860px,96vw)" onclick="event.stopPropagation()">' +
        '<div class="ps-header">' +
          '<h3>打印价签 — 已选 <span style="color:#005CF5">' + _PL_PRINT_PRODUCTS.length + '</span> 件商品</h3>' +
          '<button class="ps-close" onclick="closePlPrintDialog()">×</button>' +
        '</div>' +
        // 模板选择行
        '<div style="padding:12px 20px;display:flex;align-items:center;gap:10px;background:#fafafa;border-bottom:1px solid var(--border)">' +
          '<span style="font-size:12px;color:var(--text);flex-shrink:0;font-weight:600">价签模板：</span>' +
          '<select id="plPrintTplSelect" onchange="_PL_PRINT_TPL=this.value;plPreviewTpl()" ' +
          'style="flex:1;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:12px;background:#fff">' +
            tplOptions +
          '</select>' +
        '</div>' +
        // 预览区 — 所有商品价签
        '<div id="plPrintPreview" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;padding:16px 20px;max-height:460px;overflow-y:auto;background:#f5f5f5;align-items:flex-start"></div>' +
        '<div class="ps-footer">' +
          '<div class="ps-footer-count">共 ' + _PL_PRINT_PRODUCTS.length + ' 件商品</div>' +
          '<div class="ps-footer-actions">' +
            '<button onclick="closePlPrintDialog()">取消</button>' +
            '<button class="primary" onclick="plDoPrint()">打印价签</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'

  document.body.insertAdjacentHTML('beforeend', html)
  plPreviewTpl()
}

function plPreviewTpl() {
  var preview = document.getElementById('plPrintPreview')
  if (!preview || !_PL_PRINT_PRODUCTS || !_PL_PRINT_PRODUCTS.length) return
  var tpl = LABEL_TEMPLATES.find(function(t) { return t.id === _PL_PRINT_TPL })
  if (!tpl) return

  var scale = 0.85
  var html = ''

  for (var p = 0; p < _PL_PRINT_PRODUCTS.length; p++) {
    var prod = _PL_PRINT_PRODUCTS[p]
    var w = tpl.size.w * scale
    var h = tpl.size.h * scale

    html += '<div class="label-tag" style="width:' + w + 'px;height:' + h + 'px;background:' + tpl.bg +
      ';position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12);border-radius:2px;flex-shrink:0">'

    for (var e = 0; e < (tpl.elements||[]).length; e++) {
      var el = tpl.elements[e]
      var s = 'position:absolute;left:' + (el.x*scale).toFixed(1) + 'px;top:' + (el.y*scale).toFixed(1) + 'px;font-size:' + (el.fontSize*scale).toFixed(1) + 'px;color:' + (el.color||'#333') + ';line-height:1.2;white-space:nowrap'
      if (el.fontWeight) s += ';font-weight:' + el.fontWeight
      if (el.letterSpacing) s += ';letter-spacing:' + (el.letterSpacing*scale).toFixed(1) + 'px'
      if (el.isBadge) {
        var bg = el.bg || '#e65100'
        var tl = el.borderRadiusTL != null ? el.borderRadiusTL : 2
        s += ';background:' + bg + ';padding:1px 4px;border-radius:' + tl + 'px;color:' + (el.color||'#fff')
      }
      if (el.strikethrough) s += ';text-decoration:line-through'
      var text = _getProductValue(el, prod)
      html += '<div style="' + s + '">' + _esc(text) + '</div>'
    }
    html += '</div>'
  }

  preview.innerHTML = html
}

function closePlPrintDialog() {
  var el = document.getElementById('plPrintOverlay')
  if (el) el.remove()
  _PL_PRINT_PRODUCTS = null
}

function plDoPrint() {
  if (!_PL_PRINT_PRODUCTS || !_PL_PRINT_PRODUCTS.length) return
  var tpl = LABEL_TEMPLATES.find(function(t) { return t.id === _PL_PRINT_TPL })
  if (!tpl) { alert('请选择价签模板'); return }

  var products = _PL_PRINT_PRODUCTS
  closePlPrintDialog()

  var w = window.open('', '_blank', 'width=400,height=300')
  if (!w) { alert('请允许弹出窗口以打印价签'); return }
  w.document.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>打印价签 - ' + tpl.name + '</title>' +
    '<style>body{margin:0;display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:8px;padding:12px;min-height:100vh;background:#eee}' +
    '.label-tag{font-family:\'PingFang SC\',\'Microsoft YaHei\',sans-serif;position:relative;overflow:hidden}.label-bg-img{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;pointer-events:none;z-index:0}' +
    '@page{size:auto;margin:6mm}@media print{body{margin:0;padding:4mm;background:#fff;gap:4mm}.label-bg-img.no-print{display:none!important}}' +
    '</style></head><body>' +
    products.map(function(p) { return renderProductLabelMM(tpl, p) }).join('') +
    '</body></html>')
  w.document.close()
  setTimeout(function() { w.print() }, 300)
}

function initPriceLog() {
  var el = document.getElementById('priceLogContent');
  if (!el) return;

  if (PL_LOGS.length === 0) plGenerateMockLogs();

  var stores = ['崧泽大道中心店', '华科东路店', '盈港路店'];

  el.innerHTML =
      // 筛选栏（铺满，上部紧接）
      '<div style="flex-shrink:0;margin:0;padding:10px 16px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<select id="plFilterStore" style="width:169px;height:32px;padding:0 12px;border:1px solid #d9dbde;border-radius:4px;font-size:12px;background:#fff;outline:none;color:#0b1019" onchange="plSearch()">' +
          '<option value="all">全部门店</option>' +
          stores.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
        '</select>' +
        '<div class="ic-filter-tabs" id="plFilterTabs">' +
          '<span class="ic-ftab' + (PL_FILTER_DATE === 'all' ? ' active' : '') + '" onclick="plSetDateFilter(\'all\',this)">全部</span>' +
          '<span class="ic-ftab' + (PL_FILTER_DATE === 'today' ? ' active' : '') + '" onclick="plSetDateFilter(\'today\',this)">今天</span>' +
          '<span class="ic-ftab' + (PL_FILTER_DATE === 'yesterday' ? ' active' : '') + '" onclick="plSetDateFilter(\'yesterday\',this)">昨天</span>' +
          '<span class="ic-ftab' + (PL_FILTER_DATE === 'week' ? ' active' : '') + '" onclick="plSetDateFilter(\'week\',this)">近7天</span>' +
          '<span class="ic-ftab' + (PL_FILTER_DATE === 'month' ? ' active' : '') + '" onclick="plSetDateFilter(\'month\',this)">近30天</span>' +
        '</div>' +
        '<input type="text" id="plFilterKeyword" style="flex:0 1 220px;height:32px;padding:0 12px;border:1px solid #d9dbde;border-radius:4px;font-size:12px;outline:none;color:#0b1019" placeholder="条形码/编码" onkeydown="if(event.key===\'Enter\')plSearch()" onfocus="this.style.borderColor=\'#005cf5\'" onblur="this.style.borderColor=\'#d9dbde\'">' +
        '<button class="ps-op-btn" onclick="plReset()">重置</button>' +
        '<button class="ps-op-btn ps-op-pri" onclick="plSearch()">查询</button>' +
      '</div>' +
      // 操作栏（紧接筛选栏，白底+border）
      '<div style="flex-shrink:0;padding:8px;display:flex;align-items:center;gap:8px;background:#fff;border-bottom:1px solid #dfe3ed">' +
        '<button class="ps-op-btn ps-op-pri" onclick="plPrintLabels()">打印价签</button>' +
        '<label class="pl-switch" title="打开后，商品信息（名称 / 现价 / 原价 / 会员价 / 产地等）发生变更将自动加入调价打印计划">' +
          '<input type="checkbox" id="plAutoAddSwitch" onchange="plAutoAddOnToggle()" />' +
          '<span class="pl-switch-track"><span class="pl-switch-thumb"></span></span>' +
          '<span class="pl-switch-label">自动加入调价打印计划</span>' +
        '</label>' +
        '<span id="plAutoStatus" class="pl-auto-status off">○ 已关闭</span>' +
        '<button class="ps-op-btn" onclick="plSimulateChange()">模拟新改价</button>' +
        '<button class="ps-op-btn" onclick="plAddToPlan()">加入选中项</button>' +
      '</div>' +
      // 表格卡片（左右缩进8px，上方间隔10px，底部间隔8px，渐变边框）
      '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
      '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
          '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
            '<table>' +
              '<thead id="plTableHead"></thead>' +
              '<tbody id="plTableBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="pagination-bar" id="plPagination" style="flex-shrink:0"></div>' +
        '</div>' +
      '</div>';

  plRenderTable();
  plLoadAutoSwitch();
}

// ===== 日期 Tab 切换（改价日志）=====
function plSetDateFilter(val, el) {
  PL_FILTER_DATE = val;
  PL_PAGE = 1;
  plSyncDateTabs('plFilterTabs', val, el);
  plRenderTable();
}

// ===== 日期 Tab 切换通用 =====
function plSyncDateTabs(containerId, val, activeEl) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var tabs = container.querySelectorAll('.ic-ftab');
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    if (activeEl) {
      t.classList.toggle('active', t === activeEl);
    } else {
      var onClick = t.getAttribute('onclick') || '';
      var match = onClick.match(/SetDateFilter\('(\w+)'/);
      t.classList.toggle('active', match && match[1] === val);
    }
  }
}


// ===== DATA SCOPE (Platform → Enterprise → Store) =====
var ENTERPRISES = [
  { id: 'ent-001', name: '好滋味餐饮', stores: [
    { id: 'st-001', name: '崧泽大道中心店' },
    { id: 'st-002', name: '华新镇农贸店' },
    { id: 'st-003', name: '重固镇菜场店' },
    { id: 'st-004', name: '徐泾东社区店' }
  ]},
  { id: 'ent-002', name: '鲜百味生鲜', stores: [
    { id: 'st-005', name: '泗泾大润发店' },
    { id: 'st-006', name: '九亭农贸店' },
    { id: 'st-007', name: '新桥镇中心店' }
  ]},
  { id: 'ent-003', name: '绿康源供应链', stores: [
    { id: 'st-008', name: '安亭老街店' },
    { id: 'st-009', name: '南翔印象城店' }
  ]},
  { id: 'ent-004', name: '上海正鲜优生鲜超市有限公司', stores: [
    { id: 'st-010', name: '正育生鲜中心菜场唐镇' },
    { id: 'st-011', name: '正育生鲜中心菜市场' },
    { id: 'st-012', name: '正育生鲜中心菜场五莲路店' }
  ]}
];

var DATA_SCOPE = {
  userType: 'platform', // 'platform' | 'enterprise'
  enterpriseId: 'ent-001',
  storeAll: true,   // true = 全部门店(默认)；false = 仅 storeIds 中的门店
  storeIds: []      // storeAll=false 时有效：显式选中的门店；空数组表示「未选择任何门店」
};

function getCurrentEnterprise() {
  var i, ent;
  for (i = 0; i < ENTERPRISES.length; i++) {
    if (ENTERPRISES[i].id === DATA_SCOPE.enterpriseId) return ENTERPRISES[i];
  }
  return null;
}

function getSelectedStores() {
  var ent = getCurrentEnterprise();
  if (!ent) return [];
  if (DATA_SCOPE.storeAll) return ent.stores.slice(); // 全部门店
  if (!DATA_SCOPE.storeIds.length) return [];          // 显式未选任何门店
  var result = [], i, s;
  for (i = 0; i < ent.stores.length; i++) {
    s = ent.stores[i];
    if (DATA_SCOPE.storeIds.indexOf(s.id) !== -1) result.push(s);
  }
  return result;
}

function getScopeSummary() {
  var ent = getCurrentEnterprise();
  if (!ent) return '未选择企业';
  if (DATA_SCOPE.storeAll) return ent.name + ' · 全部门店';
  var stores = getSelectedStores();
  if (!stores.length) return ent.name + ' · 未选择门店';
  if (stores.length === 1) return ent.name + ' · ' + stores[0].name;
  return ent.name + ' · ' + stores.length + '个门店';
}

// ---- Global pickers: detach to body so they float above .main / content layers ----
function moveGlobalPickers() {
  var ids = ['scopeEnterpriseDropdown', 'scopeStoreDropdown', 'periodPicker', 'pickerOverlay'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.parentNode !== document.body) document.body.appendChild(el);
  });
}
function positionDropdown(dd, btn) {
  var r = btn.getBoundingClientRect();
  dd.style.top = (r.bottom + 4) + 'px';
  dd.style.left = r.left + 'px';
  dd.style.minWidth = r.width + 'px';
}
function positionPeriodPicker(picker, anchor) {
  var r = anchor.getBoundingClientRect();
  var ww = window.innerWidth;
  picker.style.top = (r.bottom + 8) + 'px';
  picker.style.right = (ww - r.right) + 'px';
  picker.style.left = 'auto';
}
function isGlobalPicker(el) {
  return el && (el.id === 'scopeEnterpriseDropdown' || el.id === 'scopeStoreDropdown' || el.id === 'periodPicker' || el.id === 'pickerOverlay' || el.closest('#scopeEnterpriseDropdown, #scopeStoreDropdown, #periodPicker, #pickerOverlay'));
}

// ---- Enterprise Dropdown ----
function buildEnterpriseDropdown() {
  var dd = document.getElementById('scopeEnterpriseDropdown'), i, ent, isActive;
  dd.innerHTML = '';
  for (i = 0; i < ENTERPRISES.length; i++) {
    ent = ENTERPRISES[i];
    isActive = ent.id === DATA_SCOPE.enterpriseId;
    dd.innerHTML += '<div class="scope-dropdown-item' + (isActive ? ' active' : '') + '" onclick="selectEnterprise(\'' + ent.id + '\', event)">' + ent.name + (isActive ? ' ✓' : '') + '</div>';
  }
}

function toggleEnterpriseDropdown(e) {
  e.stopPropagation();
  var ed = document.getElementById('scopeEnterpriseDropdown');
  var sd = document.getElementById('scopeStoreDropdown');
  var el = document.getElementById('scopeEnterprise');
  sd.classList.remove('show');
  document.getElementById('scopeStore').classList.remove('open');
  if (ed.classList.contains('show')) { ed.classList.remove('show'); el.classList.remove('open'); return; }
  closeAllScopeDropdowns();
  buildEnterpriseDropdown();
  positionDropdown(ed, el);
  ed.classList.add('show');
  el.classList.add('open');
}

function selectEnterprise(entId, e) {
  if (e) e.stopPropagation();
  if (DATA_SCOPE.enterpriseId === entId) {
    document.getElementById('scopeEnterpriseDropdown').classList.remove('show');
    document.getElementById('scopeEnterprise').classList.remove('open');
    return;
  }
  DATA_SCOPE.enterpriseId = entId;
  DATA_SCOPE.storeAll = true;
  DATA_SCOPE.storeIds = [];
  document.getElementById('scopeEnterpriseName').textContent = getCurrentEnterprise().name;
  updateStoreLabel();
  document.getElementById('scopeEnterpriseDropdown').classList.remove('show');
  document.getElementById('scopeEnterprise').classList.remove('open');
  onScopeChange();
}

// ---- Store Dropdown ----
function buildStoreDropdown() {
  var dd = document.getElementById('scopeStoreDropdown');
  var ent = getCurrentEnterprise(), i, s, checked;
  // 全部门店态：storeIds 为空(全部) 或 显式列表已覆盖全部门店 均视为「全选」
  var allActive = DATA_SCOPE.storeAll;
  dd.innerHTML = '';
  dd.innerHTML += '<div class="scope-dropdown-item' + (allActive ? ' checked' : '') + '" onclick="selectAllStores(event)"><span class="check-box">' + (allActive ? '✓' : '') + '</span>全部门店</div>';
  for (i = 0; i < ent.stores.length; i++) {
    s = ent.stores[i];
    // 全部门店模式下，所有门店均视为已选（显示勾选标记），避免「全选却没勾」的歧义
    checked = allActive || DATA_SCOPE.storeIds.indexOf(s.id) !== -1;
    dd.innerHTML += '<div class="scope-dropdown-item' + (checked ? ' checked' : '') + '" onclick="toggleStore(\'' + s.id + '\', event)"><span class="check-box">' + (checked ? '✓' : '') + '</span>' + s.name + '</div>';
  }
  dd.innerHTML += '<div class="scope-dropdown-foot"><button onclick="confirmStoreSelection(event)">确定</button></div>';
}

function toggleStoreDropdown(e) {
  e.stopPropagation();
  var sd = document.getElementById('scopeStoreDropdown');
  var ed = document.getElementById('scopeEnterpriseDropdown');
  var el = document.getElementById('scopeStore');
  ed.classList.remove('show');
  document.getElementById('scopeEnterprise').classList.remove('open');
  if (sd.classList.contains('show')) { sd.classList.remove('show'); el.classList.remove('open'); return; }
  closeAllScopeDropdowns();
  buildStoreDropdown();
  positionDropdown(sd, el);
  sd.classList.add('show');
  el.classList.add('open');
}

function selectAllStores(e) {
  if (e) e.stopPropagation();
  DATA_SCOPE.storeAll = true;
  DATA_SCOPE.storeIds = [];
  buildStoreDropdown();
}

function toggleStore(storeId, e) {
  if (e) e.stopPropagation();
  var ent = getCurrentEnterprise();
  // 全部门店态点某门店：取消该门店，其余保留（即「全部门店 − 该门店」）
  if (DATA_SCOPE.storeAll) {
    DATA_SCOPE.storeAll = false;
    DATA_SCOPE.storeIds = ent.stores.map(function(s) { return s.id; }).filter(function(id) { return id !== storeId; });
    buildStoreDropdown();
    return;
  }
  // 显式态：点击即切换该门店（已选 → 取消，未选 → 选中）
  var idx = DATA_SCOPE.storeIds.indexOf(storeId);
  if (idx !== -1) {
    DATA_SCOPE.storeIds.splice(idx, 1); // 取消选择
  } else {
    DATA_SCOPE.storeIds.push(storeId);   // 选中
  }
  // 显式选择已覆盖全部门店 → 折叠回「全部门店」态
  if (DATA_SCOPE.storeIds.length === ent.stores.length) {
    DATA_SCOPE.storeAll = true;
    DATA_SCOPE.storeIds = [];
  }
  buildStoreDropdown();
}

function confirmStoreSelection(e) {
  if (e) e.stopPropagation();
  updateStoreLabel();
  document.getElementById('scopeStoreDropdown').classList.remove('show');
  document.getElementById('scopeStore').classList.remove('open');
  onScopeChange();
}

function updateStoreLabel() {
  var stores = getSelectedStores();
  var labelEl = document.getElementById('scopeStoreLabel');
  var countEl = document.getElementById('scopeStoreCount');
  var ent = getCurrentEnterprise();
  var allSelected = DATA_SCOPE.storeAll || (ent && DATA_SCOPE.storeIds.length === ent.stores.length);
  if (allSelected) {
    labelEl.textContent = '全部门店';
    countEl.classList.add('hidden');
  } else if (stores.length === 1) {
    labelEl.textContent = stores[0].name;
    countEl.classList.add('hidden');
  } else if (!stores.length) {
    labelEl.textContent = '未选择门店';
    countEl.classList.add('hidden');
  } else {
    labelEl.textContent = '已选门店';
    countEl.textContent = stores.length;
    countEl.classList.remove('hidden');
  }
}

function closeAllScopeDropdowns() {
  var ed = document.getElementById('scopeEnterpriseDropdown');
  var sd = document.getElementById('scopeStoreDropdown');
  if (ed) ed.classList.remove('show');
  if (sd) sd.classList.remove('show');
  var ee = document.getElementById('scopeEnterprise');
  var se = document.getElementById('scopeStore');
  if (ee) ee.classList.remove('open');
  if (se) se.classList.remove('open');
}

// Global click to close scope dropdowns
document.addEventListener('click', function(e) {
  var scopeBar = document.getElementById('scopeBar');
  if (isGlobalPicker(e.target)) return;
  if (scopeBar && !scopeBar.contains(e.target)) closeAllScopeDropdowns();
});

// ---- Scope change handler ----
function onScopeChange() {
  updateSidebarScope();
  refreshCurrentPage();
}

function updateSidebarScope() {
  var ent = getCurrentEnterprise();
  var stores = getSelectedStores();
  var nameEl = document.querySelector('.sidebar-footer .store-name');
  if (nameEl) {
    if (DATA_SCOPE.storeAll) {
      nameEl.textContent = '🏪 ' + ent.name;
    } else if (stores.length === 1) {
      nameEl.textContent = '🏪 ' + stores[0].name;
    } else {
      nameEl.textContent = '🏪 ' + ent.name + '（' + stores.length + '店）';
    }
  }
  // Update concept date with scope info
  var conceptEl = document.getElementById('ov-concept-date');
  if (conceptEl) {
    var d = DATA[currentRange];
    conceptEl.textContent = (d ? d.conceptDate : '') + ' ｜ ' + getScopeSummary();
  }
}

// ===== PERIOD SELECTOR (今日/本周/本月 with popup pickers) =====

// Deep-copy backups of default data (so we can reset)
var DEFAULT_DATA = {}, DEFAULT_STATS_DATA = {};
(function(){
  for (var k in DATA) { DEFAULT_DATA[k] = JSON.parse(JSON.stringify(DATA[k])); }
  for (var k in STATS_DATA) { DEFAULT_STATS_DATA[k] = JSON.parse(JSON.stringify(STATS_DATA[k])); }
})();

// Period override state
var periodOverrides = { today:null, week:null, month:null, year:null, custom:null };
// 系统上线日期：2026-07-01，在此之前无有效数据
var SYSTEM_START_DATE = '2026-07-01';
var SYSTEM_START_YEAR = 2026;
var SYSTEM_START_MONTH = '2026-07'; // YYYY-MM 比较格式
// Picker state
var pickerState = null;

// ---- tab switching (点击维度按钮，不弹窗) ----
function switchTab(range, btn) {
  if (range === currentRange) return;
  console.log('[switchTab] switching to', range, 'from', currentRange);
  hidePicker();
  currentRange = range;
  if (!periodOverrides[range]) resetToDefault(range);
  updateTabUI(btn);
  updateDateDisplay();
  refreshCurrentPage();
}

function updateTabUI(activeBtn) {
  document.querySelectorAll('#dateTabGroup .btn-tab').forEach(function(b){b.classList.remove('active');});
  if (activeBtn) activeBtn.classList.add('active');
}

// ---- 时段导航：上一/下一时段 ----
function navPeriod(dir) {
  var now = new Date(), tStr = fmtDate(now);
  if (currentRange === 'today') {
    var base = periodOverrides.today ? new Date(periodOverrides.today.date + 'T00:00:00') : now;
    var t = new Date(base); t.setDate(base.getDate() + dir);
    var ts = fmtDate(t);
    if (ts > tStr) return;                 // 不进入未来
    if (ts < SYSTEM_START_DATE) return;    // 不进入系统上线前
    if (ts === tStr) { selectPickerToday(); return; }
    selectPickerDay(ts);
    return;
  }
  if (currentRange === 'week') {
    var cw = getCurrentWeek();
    var ov = periodOverrides.week;
    var base = ov ? new Date(ov.start + 'T00:00:00') : new Date(cw.start + 'T00:00:00');
    var t = new Date(base); t.setDate(base.getDate() + 7 * dir);
    var end = new Date(t); end.setDate(t.getDate() + 6);
    if (fmtDate(end) > tStr) return;       // 不跨入未来周
    if (fmtDate(end) < SYSTEM_START_DATE) return; // 不进入系统上线前
    if (fmtDate(t) === cw.start) { resetWeekToDefault(); return; }
    selectPickerWeek(fmtDate(t), fmtDate(end));
    return;
  }
  if (currentRange === 'month') {
    var ov = periodOverrides.month;
    var bd = now;
    if (ov && ov.start) bd = new Date(ov.start + 'T00:00:00');
    else bd = new Date(now.getFullYear(), now.getMonth(), 1);
    var y = bd.getFullYear(), m = bd.getMonth() + dir;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    var start = new Date(y, m, 1);
    if (fmtDate(start) > tStr) return;     // 未来月
    if (y + '-' + pad(m+1) < SYSTEM_START_MONTH) return; // 不进入系统上线前
    pickerState = { year: y, month: m };
    applyMonthFull();
    return;
  }
  if (currentRange === 'year') {
    var ov = periodOverrides.year;
    var y = (ov ? ov.year : now.getFullYear()) + dir;
    if (y > now.getFullYear()) return;     // 未来年
    if (y < SYSTEM_START_YEAR) return;     // 系统上线前
    if (y === now.getFullYear()) { resetToDefault('year'); updateDateDisplay(); refreshCurrentPage(); return; }
    applyYear(y);
    return;
  }
  if (currentRange === 'custom') {
    var cov = periodOverrides.custom;
    var s, e;
    if (cov) {
      s = new Date(cov.start + 'T00:00:00');
      e = new Date(cov.end + 'T00:00:00');
      var durMs = e - s, durDays = Math.round(durMs / 86400000) + 1;
      s = new Date(s.getTime() + durMs * dir);
      e = new Date(e.getTime() + durMs * dir);
    } else {
      // 默认30天
      e = new Date(now); e.setDate(e.getDate() + 30 * dir);
      if (fmtDate(e) > fmtDate(now)) { s = new Date(now); s.setDate(s.getDate() - 30); e = now; }
      else { s = new Date(e); s.setDate(e.getDate() - 30); }
    }
    if (fmtDate(s) < SYSTEM_START_DATE) { s = new Date(SYSTEM_START_DATE+'T00:00:00'); }
    if (fmtDate(e) > fmtDate(now)) { e = now; }
    if (fmtDate(s) >= fmtDate(e)) return;
    periodOverrides.custom = { start: fmtDate(s), end: fmtDate(e), type: 'custom' };
    var label = fmtDate(s) + ' \u007E ' + fmtDate(e);
    var md = generateCustomMonthData(fmtDate(s), fmtDate(e));
    STATS_DATA.custom = generateCustomRangeData(fmtDate(s), fmtDate(e));
    STATS_DATA.custom.label = label;
    STATS_DATA.custom.compareLabel = '较上一区间';
    DATA.custom = DATA.custom || {};
    DATA.custom.dateLabel = '\u{1F4C5} ' + label;
    DATA.custom.sidebarDate = '\u00B7 ' + label;
    DATA.custom.conceptDate = '\u{1F4C5} 数据周期：' + label;
    DATA.custom.overview = md.overview;
    DATA.custom.insights = md.ovInsights;
    DATA.custom.trendLabels = md.ovTrendLabels;
    DATA.custom.trendBiz = md.ovTrendBiz;
    DATA.custom.trendOrders = md.ovTrendOrders;
    DATA.custom.trendTitle = md.ovTrendTitle;
    DATA.custom.trendSub = md.ovTrendSub;
    DATA.custom.hourTitle = md.ovHourTitle;
    DATA.custom.hourData = md.ovHourData;
    DATA.custom.topProducts = md.ovTopProducts;
    DATA.custom.pieData = md.ovPieData;
    DATA.custom.pieSub = md.ovPieSub;
    DATA.custom.transaction = md.transaction;
    DATA.custom.txTrendTitle = md.txTrendTitle;
    DATA.custom.txTrendSub = md.txTrendSub;
    DATA.custom.txTrendLabels = md.txTrendLabels;
    DATA.custom.txTrendTx = md.txTrendTx;
    DATA.custom.txTrendBiz = md.txTrendBiz;
    DATA.custom.txTrendRev = md.txTrendRev;
    DATA.custom.txTrendDisc = md.txTrendDisc;
    DATA.custom.txStackLabels = md.txStackLabels;
    DATA.custom.txStackRev = md.txStackRev;
    DATA.custom.txStackCross = md.txStackCross;
    DATA.custom.txStackCur = md.txStackCur;
    DATA.custom.txStackDisc = md.txStackDisc;
    DATA.custom.txStackSub = md.txStackSub;
    updateDateDisplay();
    refreshCurrentPage();
    return;
  }
}

// ---- picker open/close ----
function openPeriodPicker(range) {
  closeAllScopeDropdowns();
  var picker = document.getElementById('periodPicker');
  var overlay = document.getElementById('pickerOverlay');
  var anchor = document.getElementById('dateDisplay');
  if (anchor) positionPeriodPicker(picker, anchor);
  picker.classList.add('show');
  overlay.classList.add('show');
  var now = new Date();
  if (range === 'today') {
    var ov = periodOverrides.today;
    var d = ov ? new Date(ov.date+'T00:00:00') : now;
    pickerState = { mode:'day', year:d.getFullYear(), month:d.getMonth() };
    buildDayPicker(d.getFullYear(), d.getMonth(), ov ? ov.date : null);
  } else if (range === 'week') {
    var ov = periodOverrides.week;
    var d = ov ? new Date(ov.start+'T00:00:00') : now;
    pickerState = { mode:'week', year:d.getFullYear(), month:d.getMonth() };
    buildWeekPicker(d.getFullYear(), d.getMonth(), ov ? ov.start : null);
  } else if (range === 'month') {
    var ov = periodOverrides.month;
    var d = ov ? new Date(ov.start+'T00:00:00') : now;
    pickerState = { mode:'month', year:d.getFullYear(), month:d.getMonth() };
    buildMonthPicker(d.getFullYear(), d.getMonth());
  } else if (range === 'year') {
    var ov = periodOverrides.year;
    var y = ov ? ov.year : now.getFullYear();
    pickerState = { mode:'year', year: y };
    buildYearPicker(y);
  } else if (range === 'custom') {
    var cov = periodOverrides.custom;
    var d0, d1;
    if (cov) {
      d0 = new Date(cov.start + 'T00:00:00');
      d1 = new Date(cov.end + 'T00:00:00');
    } else {
      d0 = new Date(now); d0.setDate(d0.getDate() - 30);
      if (fmtDate(d0) < SYSTEM_START_DATE) d0 = new Date(SYSTEM_START_DATE + 'T00:00:00');
      d1 = now;
    }
    pickerState = {
      mode: 'custom',
      rangeStart: fmtDate(d0),
      rangeEnd: fmtDate(d1),
      calYear: d0.getFullYear(),
      calMonth: d0.getMonth()
    };
    buildCustomRangePicker();
  }
}

function hidePicker() {
  document.getElementById('periodPicker').classList.remove('show');
  document.getElementById('pickerOverlay').classList.remove('show');
  pickerState = null;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n) { return String(n).padStart(2,'0'); }
function fmtDate(d) { return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function genDailyData(n, totalRev, rngFn) {
  var rfn = rngFn || rand;
  var revs = [], orders = [], vols = [];
  for (var i = 0; i < n; i++) {
    var w = rfn(60, 130) / 100;
    var r = Math.round(totalRev / n * w);
    revs.push(r);
    orders.push(Math.round(r / 78));
    vols.push(Math.round(r / 14));
  }
  return {rev: revs, orders: orders, vol: vols};
}

function generateCustomDayData(dateStr) {
  // ---- 日期种子确定性 RNG ----
  var seed = 0;
  for (var i = 0; i < dateStr.length; i++) { seed = ((seed * 31) + dateStr.charCodeAt(i)) | 0; }
  var r = seededRand(seed);
  function rrng(lo, hi) { return Math.floor(lo + r() * (hi - lo + 1)); }

  var parts = dateStr.split('-');
  var label = parts[0] + '-' + parts[1] + '-' + parts[2];
  var dateShort = parts[1] + '/' + parts[2];
  var dObj = new Date(dateStr + 'T00:00:00');
  var wd = ['日','一','二','三','四','五','六'];
  var weekday = wd[dObj.getDay()];
  var dateFull = dateShort + '（周' + weekday + '）';

  // ---- 小时维度时序数据 ----
  var hours = []; for (var h = 8; h <= 20; h++) hours.push(h + ':00');
  var gd = genDailyData(13, 11200, rrng);
  var hrTotalOrders = gd.orders.reduce(function(a,b){return a+b;}, 0);
  var hrTotalRev = gd.rev.reduce(function(a,b){return a+b;}, 0);
  var hrTotalVol = gd.vol.reduce(function(a,b){return a+b;}, 0);

  // ---- Overview (概览页) KPI 基础数值 ----
  var orders = rrng(130, 180);
  var avgUnit = Math.round((65 + r() * 10) * 10) / 10;
  var bizAmt = Math.round(orders * avgUnit);
  var txAmt = Math.round(bizAmt * (1.10 + r() * 0.06));
  var discount = txAmt - bizAmt;
  var revAmt = Math.round(bizAmt * (0.962 + r() * 0.008));
  var curRefund = bizAmt - revAmt;
  var crossRefund = Math.round(curRefund * (0.6 + r() * 1.5));
  var totalRefund = curRefund + crossRefund;
  var discountRate = (discount / txAmt * 100).toFixed(1);
  var curRefundRate = (curRefund / bizAmt * 100).toFixed(1);
  var revToBiz = (revAmt / bizAmt * 100).toFixed(1);

  // ---- 对比变化值（种子派生，顺序固定） ----
  function genChg(idx) {
    var bases = [8.2, 7.5, 6.8, 5.4, 0.5, 2.1, 1.4, 0.2, 0.1, 0.5];
    var b = bases[idx] || 1.0;
    var v = b + (r() - 0.5) * 2.5;
    var arrow = v >= 0 ? '▲' : '▼';
    return arrow + ' ' + Math.abs(v).toFixed(1) + '%';
  }
  function chgDir(idx) {
    var bases = [8.2, 7.5, 6.8, 5.4, 0.5, 2.1, 1.4, 0.2, 0.1, 0.5];
    var b = bases[idx] || 1.0;
    return (b + (r() - 0.5) * 2.5) >= 0 ? 'up' : 'down';
  }

  // ===== 10 概览 KPI 卡片 =====
  var overview = {
    k1: { lbl:'交易额', val:'<span>¥</span>'+txAmt.toLocaleString(), chg:genChg(0)+' 较前日', dir:chgDir(0) },
    k2: { lbl:'营业额', val:'<span>¥</span>'+bizAmt.toLocaleString(), chg:genChg(1)+' 较前日', dir:chgDir(1) },
    k3: { lbl:'营收', val:'<span>¥</span>'+revAmt.toLocaleString(), chg:genChg(2)+' 较前日', dir:chgDir(2) },
    k4: { lbl:'订单数', val:''+orders+'<span>单</span>', chg:genChg(3)+' 较前日', dir:chgDir(3) },
    k5: { lbl:'优惠金额', val:'<span>¥</span>'+discount.toLocaleString(), chg:'▼ '+genChg(4).replace(/[▲▼] /,'')+' 较前日收窄', dir:'down' },
    k6: { lbl:'退款金额', val:'<span>¥</span>'+totalRefund.toLocaleString(), chg:'▼ '+genChg(5).replace(/[▲▼] /,'')+' 较前日改善', dir:'down', refundDetail:'当期 ¥'+curRefund.toLocaleString()+' · 跨期 ¥'+crossRefund.toLocaleString() },
    k7: { lbl:'客单价(成交)', val:'<span>¥</span>'+avgUnit, chg:genChg(6)+' 较前日', dir:chgDir(6) },
    k8: { lbl:'优惠率', val:discountRate+'<span>%</span>', chg:'▼ 较前日-'+genChg(7).replace(/[▲▼] /,'')+'%', dir:'down' },
    k9: { lbl:'当期退款率', val:curRefundRate+'<span>%</span>', chg:'▼ 较前日-'+genChg(8).replace(/[▲▼] /,'')+'%', dir:'down' },
    k10: { lbl:'营收/营业额比', val:revToBiz+'<span>%</span>', chg:'▼ 较前日-'+genChg(9).replace(/[▲▼] /,'')+'%', dir:'down' },
  };

  // ---- 7日趋势（以选中日期为终点） ----
  var trendLabels = [], trendBiz = [], trendOrders = [];
  for (var ti = 0; ti < 7; ti++) {
    var td = new Date(dObj); td.setDate(dObj.getDate() - 6 + ti);
    var tl = (td.getMonth()+1)+'/'+td.getDate();
    if (ti === 6) tl += '（周' + wd[td.getDay()] + '）';
    trendLabels.push(tl);
    trendBiz.push(Math.round(bizAmt * (0.78 + r() * 0.32)));
    trendOrders.push(Math.round(orders * (0.75 + r() * 0.30)));
  }
  // make the last entry match the selected date
  trendBiz[6] = bizAmt;
  trendOrders[6] = orders;

  // ---- 24 小时时段分布 ----
  var hourData = [0,0,0,0,0,0];
  var peak = rrng(9, 12); // 早峰
  var peak2 = rrng(16, 19); // 晚峰
  for (var hi = 6; hi < 24; hi++) {
    var dist = Math.min(Math.abs(hi - peak), Math.abs(hi - peak2));
    hourData.push(dist <= 3 ? rrng(2, 20 - dist * 4) : rrng(0, 3));
  }

  // ---- 商品排行（概览）----
  var topProducts = [
    {name:'土豆', cat:'蔬菜', qty:rrng(35,55)+'件', val:'¥'+rrng(450,600), pct:100, chg:'+'+rrng(8,18)+'%', dir:'up'},
    {name:'西红柿', cat:'蔬菜', qty:rrng(28,42)+'件', val:'¥'+rrng(380,520), pct:88, chg:(rrng(0,1)?'+':'-')+rrng(2,10)+'%', dir:rrng(0,1)?'up':'down'},
    {name:'鸡蛋', cat:'蛋奶', qty:rrng(25,38)+'件', val:'¥'+rrng(320,460), pct:77, chg:'+'+rrng(5,15)+'%', dir:'up'},
    {name:'白菜', cat:'蔬菜', qty:rrng(22,36)+'件', val:'¥'+rrng(280,400), pct:64, chg:(rrng(0,1)?'+':'-')+rrng(2,10)+'%', dir:rrng(0,1)?'up':'down'},
    {name:'猪肉', cat:'肉禽', qty:rrng(10,22)+'件', val:'¥'+rrng(240,370), pct:60, chg:'-'+rrng(1,8)+'%', dir:'down'},
  ];

  // ---- 品类饼图 ----
  var pieData = {labels:['蔬菜','水果','肉禽','水产','粮油','其他'],
    data:[rrng(32,42), rrng(16,24), rrng(14,22), rrng(8,14), rrng(6,10), rrng(4,8)]};

  // ===== 洞察卡片（含动态数据） =====
  var insights = [
    { title:'销售健康度', items: [
      dateFull + ' 交易额 ¥'+txAmt.toLocaleString()+'，<b>营业额 ¥'+bizAmt.toLocaleString()+'</b>，营收 ¥'+revAmt.toLocaleString()+'，近7日趋势平稳',
      '优惠率 <b>'+discountRate+'%</b>，较前日收窄 <span class="ins-tag good">改善</span>',
      '客单价 ¥'+avgUnit+'，处于月均正常区间'
    ]},
    { title:'商品与品类', items: [
      '蔬菜品类贡献约 <b>'+pieData.data[0]+'%</b> 营业额，土豆/西红柿/白菜包揽 Top 3',
      '猪肉销量 '+topProducts[4].qty+'，环比 <b>'+topProducts[4].chg+'</b> <span class="ins-tag warn">下滑</span>，鸡蛋增长 '+topProducts[2].chg,
      '热销品类集中度高，Top 5 占销售额约 <b>'+rrng(55,66)+'%</b>'
    ]},
    { title:'客群与流量', items: [
      dateFull + ' ' + orders + ' 单，<b>上午 10-11 点</b> 为全天客流高峰',
      '时段分布呈双峰结构：早市 9-11 点 + 晚市 17-19 点',
      '订单量较前日 <b>'+genChg(3).replace(/[▲▼] /,'')+'</b>，客流平稳'
    ]},
    { title:'风险与建议', items: [
      '跨期退款 ¥'+crossRefund.toLocaleString()+'，占总退款 <b>'+(crossRefund/totalRefund*100).toFixed(1)+'%</b> <span class="ins-tag warn">需关注</span>',
      '土豆/鸡蛋/猪肉 3 个 SKU 库存低于安全线，建议及时补货',
      '晚高峰 17-19 点客流集中，可增加该时段限时促销活动'
    ]}
  ];

  // ===== STATS_DATA 兼容字段（供统计页使用）=====
  var catOrdersPct = [
    Math.round(pieData.data[0]/orders*100) || 32,
    Math.round(pieData.data[1]/orders*100) || 24,
    Math.round(pieData.data[2]/orders*100) || 18,
    Math.round(pieData.data[3]/orders*100) || 14,
    Math.round(pieData.data[4]/orders*100) || 9,
    Math.round(pieData.data[5]/orders*100) || 6,
    Math.round(pieData.data[6]/orders*100) || 5
  ];
  var osRates = [Math.round(orders*0.82), Math.round(orders*0.05), Math.round(orders*0.08), Math.round(orders*0.05)];

  return {
    // ---- STATS_DATA 兼容字段 ----
    label: label, compareLabel: '较前一日同时段',
    kpi: [
      { lbl:'营业额', val:'¥'+bizAmt.toLocaleString(), chg:'+'+rrng(30,120)/10+'%', up:true },
      { lbl:'订单数', val:''+orders, chg:'+'+rrng(20,80)/10+'%', up:true },
      { lbl:'客单价', val:'¥'+avgUnit, chg:'+'+rrng(10,50)/10+'%', up:true },
      { lbl:'毛利率', val:rrng(250,290)/10+'%', chg:'+'+rrng(1,20)/10+'%', up:true },
      { lbl:'销售量', val:hrTotalVol+'件', chg:'+'+rrng(50,160)/10+'%', up:true },
    ],
    trendLabels: hours, trendRev: gd.rev, trendOrders: gd.orders, trendSalesVol: gd.vol,
    category: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:catOrdersPct},
    orderStatus: {labels:['已完成','进行中','已退款','待处理'],data:osRates},
    orderStatusColors: ['#3EB27E','#83BFF4','#1088C3','#FFB86C'],
    recentOrders: [], topProducts: [
      {name:'土豆',cat:'蔬菜',qty:rrng(30,50),sales:rrng(400,600),bar:100},
      {name:'西红柿',cat:'蔬菜',qty:rrng(25,40),sales:rrng(350,500),bar:88},
      {name:'鸡蛋',cat:'蛋奶',qty:rrng(20,35),sales:rrng(300,450),bar:77},
      {name:'猪肉',cat:'肉禽',qty:rrng(10,20),sales:rrng(250,380),bar:62},
      {name:'白菜',cat:'蔬菜',qty:rrng(20,30),sales:rrng(250,350),bar:61},
      {name:'苹果',cat:'水果',qty:rrng(8,18),sales:rrng(150,250),bar:42},
      {name:'黄瓜',cat:'蔬菜',qty:rrng(15,25),sales:rrng(120,200),bar:34},
      {name:'胡萝卜',cat:'蔬菜',qty:rrng(12,22),sales:rrng(100,180),bar:30},
      {name:'鲫鱼',cat:'水产',qty:rrng(5,12),sales:rrng(100,180),bar:27},
      {name:'大米',cat:'粮油',qty:rrng(3,8),sales:rrng(80,150),bar:25},
    ],
    catSales: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[2340,1620,1180,960,640,480,380].map(function(v){return Math.round(v*(bizAmt/11400));})},
    productDetail: [
      {name:'土豆',cat:'蔬菜',qty:rrng(30,50),sales:rrng(400,600),cost:rrng(300,420),margin:rrng(60,180),rate:rrng(180,320)/10+'%'},
      {name:'西红柿',cat:'蔬菜',qty:rrng(25,40),sales:rrng(350,500),cost:rrng(230,340),margin:rrng(70,160),rate:rrng(200,340)/10+'%'},
      {name:'鸡蛋',cat:'蛋奶',qty:rrng(20,35),sales:rrng(300,450),cost:rrng(250,370),margin:rrng(30,80),rate:rrng(100,240)/10+'%'},
      {name:'猪肉',cat:'肉禽',qty:rrng(10,20),sales:rrng(250,380),cost:rrng(200,310),margin:rrng(30,80),rate:rrng(120,260)/10+'%'},
      {name:'白菜',cat:'蔬菜',qty:rrng(20,30),sales:rrng(250,350),cost:rrng(180,260),margin:rrng(50,110),rate:rrng(180,320)/10+'%'},
      {name:'苹果',cat:'水果',qty:rrng(8,18),sales:rrng(150,250),cost:rrng(100,180),margin:rrng(40,90),rate:rrng(200,380)/10+'%'},
      {name:'黄瓜',cat:'蔬菜',qty:rrng(15,25),sales:rrng(120,200),cost:rrng(80,150),margin:rrng(20,60),rate:rrng(150,320)/10+'%'},
      {name:'鲫鱼',cat:'水产',qty:rrng(5,12),sales:rrng(100,180),cost:rrng(60,130),margin:rrng(20,70),rate:rrng(200,400)/10+'%'},
    ],

    // ---- DATA.today 概览字段 (selectPickerDay 取用) ----
    overview: overview,
    ovInsights: insights,
    ovTrendLabels: trendLabels,
    ovTrendBiz: trendBiz,
    ovTrendOrders: trendOrders,
    ovTrendTitle: '近7日营业额趋势',
    ovTrendSub: '近7日：营业额 + 订单量双轴对比',
    ovHourTitle: dateShort + ' 时段销售分布',
    ovHourData: hourData,
    ovTopProducts: topProducts,
    ovPieData: pieData,
    ovPieSub: '6大品类 · 共 ¥' + bizAmt.toLocaleString(),

    // ---- 交易分析页 ----
    transaction: {
      k1: { lbl:'当日交易额(原价)', val:'<span>¥</span>'+txAmt.toLocaleString(), chg:genChg(0)+' 较前日', dir:chgDir(0) },
      k2: { lbl:'当日营业额', val:'<span>¥</span>'+bizAmt.toLocaleString(), chg:genChg(1)+' 较前日', dir:chgDir(1) },
      k3: { lbl:'当日营收', val:'<span>¥</span>'+revAmt.toLocaleString(), chg:genChg(2)+' 较前日', dir:chgDir(2) },
      k4: { lbl:'当日优惠金额', val:'<span>¥</span>'+discount.toLocaleString(), chg:'▼ '+genChg(4).replace(/[▲▼] /,'')+' 较前日收窄', dir:'down' },
      k5: { lbl:'优惠率', val:discountRate+'<span>%</span>', chg:'▼ '+genChg(7).replace(/[▲▼] /,'')+' 较前日收窄', dir:'down' },
      k6: { lbl:'当期退款率', val:curRefundRate+'<span>%</span>', chg:'▼ '+genChg(8).replace(/[▲▼] /,'')+' 较前日改善', dir:'down' },
      k7: { lbl:'跨期退款金额', val:'<span>¥</span>'+crossRefund.toLocaleString(), chg:'▲ 较前日+'+(rrng(20,60)/10).toFixed(1)+'%', dir:'down' },
      k8: { lbl:'营收/营业额比', val:revToBiz+'<span>%</span>', chg:'▼ 较前日−'+(rrng(1,5)/10).toFixed(1)+'%', dir:'down' },
    },
    txTrendTitle: '交易额 → 营收 全链路',
    txTrendSub: dateShort + ' 时段：原价交易额、营业额、营收、优惠四线对比',
    txTrendLabels: hours,
    txTrendTx: gd.rev.map(function(v) { return Math.round(v * (txAmt / hrTotalRev)); }),
    txTrendBiz: gd.rev.map(function(v) { return Math.round(v * (bizAmt / hrTotalRev)); }),
    txTrendRev: gd.rev.map(function(v) { return Math.round(v * (revAmt / hrTotalRev)); }),
    txTrendDisc: gd.rev.map(function(v) { return Math.round(v * (discount / hrTotalRev)); }),
    txStackLabels: [dateShort + '（周' + weekday + '）'],
    txStackRev: [revAmt], txStackCross: [crossRefund], txStackCur: [curRefund], txStackDisc: [discount],
    txStackSub: dateShort + '：营收 + 跨期退款 + 当期退款 + 优惠 = 交易额(原价)',
  };
}

// ===== 自定义周数据生成（种子确定性） =====
function generateCustomWeekData(startStr, endStr) {
  var seed = 0, key = startStr + endStr;
  for (var i = 0; i < key.length; i++) { seed = ((seed * 31) + key.charCodeAt(i)) | 0; }
  var r = seededRand(seed);
  function rrng(lo, hi) { return Math.floor(lo + r() * (hi - lo + 1)); }

  var s = new Date(startStr + 'T00:00:00'), e = new Date(endStr + 'T00:00:00');
  var days = Math.round((e - s) / 86400000) + 1;

  // ---- Overview KPI（周量级） ----
  var orders = rrng(850, 1150);
  var avgUnit = Math.round((65 + r() * 10) * 10) / 10;
  var bizAmt = Math.round(orders * avgUnit);
  var txAmt = Math.round(bizAmt * (1.10 + r() * 0.06));
  var discount = txAmt - bizAmt;
  var revAmt = Math.round(bizAmt * (0.962 + r() * 0.008));
  var curRefund = bizAmt - revAmt;
  var crossRefund = Math.round(curRefund * (0.6 + r() * 1.5));
  var totalRefund = curRefund + crossRefund;
  var discountRate = (discount / txAmt * 100).toFixed(1);
  var curRefundRate = (curRefund / bizAmt * 100).toFixed(1);
  var revToBiz = (revAmt / bizAmt * 100).toFixed(1);

  function genChg(idx) {
    var bases = [10.6, 9.8, 8.4, 7.1, 1.2, 3.5, 1.4, 0.2, 0.1, 0.5];
    var b = bases[idx] || 1.0, v = b + (r() - 0.5) * 2.5;
    var arrow = v >= 0 ? '▲' : '▼';
    return arrow + ' ' + Math.abs(v).toFixed(1) + '%';
  }
  function chgDir(idx) {
    var bases = [10.6, 9.8, 8.4, 7.1, 1.2, 3.5, 1.4, 0.2, 0.1, 0.5];
    var b = bases[idx] || 1.0;
    return (b + (r() - 0.5) * 2.5) >= 0 ? 'up' : 'down';
  }

  var overview = {
    k1: { lbl:'交易额', val:'<span>¥</span>'+txAmt.toLocaleString(), chg:genChg(0)+' 较前一周', dir:chgDir(0) },
    k2: { lbl:'营业额', val:'<span>¥</span>'+bizAmt.toLocaleString(), chg:genChg(1)+' 较前一周', dir:chgDir(1) },
    k3: { lbl:'营收', val:'<span>¥</span>'+revAmt.toLocaleString(), chg:genChg(2)+' 较前一周', dir:chgDir(2) },
    k4: { lbl:'订单数', val:''+orders+'<span>单</span>', chg:genChg(3)+' 较前一周', dir:chgDir(3) },
    k5: { lbl:'优惠金额', val:'<span>¥</span>'+discount.toLocaleString(), chg:'▼ '+genChg(4).replace(/[▲▼] /,'')+' 较前一周收窄', dir:'down' },
    k6: { lbl:'退款金额', val:'<span>¥</span>'+totalRefund.toLocaleString(), chg:'▼ '+genChg(5).replace(/[▲▼] /,'')+' 较前一周改善', dir:'down', refundDetail:'当期 ¥'+curRefund.toLocaleString()+' · 跨期 ¥'+crossRefund.toLocaleString() },
    k7: { lbl:'客单价(成交)', val:'<span>¥</span>'+avgUnit, chg:genChg(6)+' 较前一周', dir:chgDir(6) },
    k8: { lbl:'优惠率', val:discountRate+'<span>%</span>', chg:'▼ 较前一周-'+genChg(7).replace(/[▲▼] /,'')+'%', dir:'down' },
    k9: { lbl:'当期退款率', val:curRefundRate+'<span>%</span>', chg:'▼ 较前一周-'+genChg(8).replace(/[▲▼] /,'')+'%', dir:'down' },
    k10: { lbl:'营收/营业额比', val:revToBiz+'<span>%</span>', chg:'▼ 较前一周-'+genChg(9).replace(/[▲▼] /,'')+'%', dir:'down' },
  };

  // ---- 7 日趋势 ----
  var trendLabels = [], trendBiz = [], trendOrders = [];
  for (var ti = 0; ti < days; ti++) {
    var td = new Date(s); td.setDate(s.getDate() + ti);
    trendLabels.push((td.getMonth()+1)+'/'+td.getDate());
    trendBiz.push(Math.round(bizAmt / days * (0.78 + r() * 0.32)));
    trendOrders.push(Math.round(orders / days * (0.75 + r() * 0.30)));
  }
  // last entry = actual total
  trendBiz[days-1] = bizAmt;
  trendOrders[days-1] = orders;

  // ---- 时段分布 ----
  var hourData = [0,0,0,0,0,0];
  var peak = rrng(9, 12), peak2 = rrng(16, 19);
  for (var hi = 6; hi < 24; hi++) {
    var dist = Math.min(Math.abs(hi - peak), Math.abs(hi - peak2));
    hourData.push(dist <= 3 ? rrng(6, 50 - dist * 8) : rrng(1, 8));
  }

  var pieData = {labels:['蔬菜','水果','肉禽','水产','粮油','其他'],
    data:[rrng(32,42), rrng(16,24), rrng(14,22), rrng(8,14), rrng(6,10), rrng(4,8)]};

  var topProducts = [
    {name:'土豆', cat:'蔬菜', qty:rrng(220,320)+'件', val:'¥'+rrng(3000,3800), pct:100, chg:'+'+rrng(8,18)+'%', dir:'up'},
    {name:'西红柿', cat:'蔬菜', qty:rrng(180,260)+'件', val:'¥'+rrng(2600,3400), pct:88, chg:(rrng(0,1)?'+':'-')+rrng(2,10)+'%', dir:rrng(0,1)?'up':'down'},
    {name:'鸡蛋', cat:'蛋奶', qty:rrng(150,230)+'件', val:'¥'+rrng(2200,3000), pct:77, chg:'+'+rrng(5,15)+'%', dir:'up'},
    {name:'白菜', cat:'蔬菜', qty:rrng(130,200)+'件', val:'¥'+rrng(1800,2600), pct:64, chg:(rrng(0,1)?'+':'-')+rrng(2,10)+'%', dir:rrng(0,1)?'up':'down'},
    {name:'猪肉', cat:'肉禽', qty:rrng(80,140)+'件', val:'¥'+rrng(1600,2400), pct:60, chg:'-'+rrng(1,8)+'%', dir:'down'},
  ];

  var insights = [
    { title:'销售健康度', items: [
      '本周交易额 ¥'+txAmt.toLocaleString()+'，<b>营业额 ¥'+bizAmt.toLocaleString()+'</b>，周订单 '+orders+' 单',
      '优惠率 <b>'+discountRate+'%</b>，较前一周收窄 <span class="ins-tag good">改善</span>',
      '客单价 ¥'+avgUnit+'，处于正常周均区间'
    ]},
    { title:'商品与品类', items: [
      '蔬菜品类贡献约 <b>'+pieData.data[0]+'%</b> 营业额，土豆/西红柿/白菜包揽 Top 3',
      '猪肉销量 '+topProducts[4].qty+'，周环比 <b>'+topProducts[4].chg+'</b> <span class="ins-tag warn">下滑</span>',
      '热销品类集中度高，Top 5 占销售额约 <b>'+rrng(55,66)+'%</b>'
    ]},
    { title:'客群与流量', items: [
      '本周 '+orders+' 单，日均 '+Math.round(orders/days)+' 单，上午 10-11 点为全天客流高峰',
      '时段分布双峰结构稳定：早市 9-11 点 + 晚市 17-19 点',
      '订单量较前一周 <b>'+genChg(3).replace(/[▲▼] /,'')+'</b>，客流平稳'
    ]},
    { title:'风险与建议', items: [
      '本周跨期退款 ¥'+crossRefund.toLocaleString()+'，占总退款 <b>'+(crossRefund/totalRefund*100).toFixed(1)+'%</b>',
      '每周一、周二订单量偏低，可考虑推出周初促销活动',
      '土豆/鸡蛋/猪肉库存周转较快，建议加大订货量'
    ]}
  ];

  return {
    overview: overview, ovInsights: insights,
    ovTrendLabels: trendLabels, ovTrendBiz: trendBiz, ovTrendOrders: trendOrders,
    ovTrendTitle: '本周期日营业额趋势',     ovTrendSub: '逐日营业额 + 订单量双轴对比',
    ovHourTitle: startStr + ' ~ ' + endStr + ' 时段分布',
    ovHourData: hourData, ovTopProducts: topProducts, ovPieData: pieData,
    ovPieSub: '6大品类 · 共 ¥' + bizAmt.toLocaleString(),

    // ---- 交易分析页 ----
    transaction: {
      k1: { lbl:'本周期交易额(原价)', val:'<span>¥</span>'+txAmt.toLocaleString(), chg:genChg(0)+' 较前一周', dir:chgDir(0) },
      k2: { lbl:'本周期营业额', val:'<span>¥</span>'+bizAmt.toLocaleString(), chg:genChg(1)+' 较前一周', dir:chgDir(1) },
      k3: { lbl:'本周期营收', val:'<span>¥</span>'+revAmt.toLocaleString(), chg:genChg(2)+' 较前一周', dir:chgDir(2) },
      k4: { lbl:'本周期优惠金额', val:'<span>¥</span>'+discount.toLocaleString(), chg:'▼ '+genChg(4).replace(/[▲▼] /,'')+' 较前一周收窄', dir:'down' },
      k5: { lbl:'优惠率', val:discountRate+'<span>%</span>', chg:'▼ '+genChg(7).replace(/[▲▼] /,'')+' 较前一周收窄', dir:'down' },
      k6: { lbl:'当期退款率', val:curRefundRate+'<span>%</span>', chg:'▼ '+genChg(8).replace(/[▲▼] /,'')+' 较前一周改善', dir:'down' },
      k7: { lbl:'跨期退款金额', val:'<span>¥</span>'+crossRefund.toLocaleString(), chg:'▲ 较上周+'+(rrng(20,60)/10).toFixed(1)+'%', dir:'down' },
      k8: { lbl:'营收/营业额比', val:revToBiz+'<span>%</span>', chg:'▼ 较上周−'+(rrng(1,5)/10).toFixed(1)+'%', dir:'down' },
    },
    txTrendTitle: '交易额 → 营收 全链路',
    txTrendSub: '本周期每日：原价交易额、营业额、营收、优惠四线对比',
    txTrendLabels: trendLabels,
    txTrendTx: trendBiz.map(function(v) { return Math.round(v * (txAmt / bizAmt)); }),
    txTrendBiz: trendBiz,
    txTrendRev: trendBiz.map(function(v) { return Math.round(v * (revAmt / bizAmt)); }),
    txTrendDisc: trendBiz.map(function(v) { return Math.round(v * (discount / bizAmt)); }),
    txStackLabels: trendLabels,
    txStackRev: trendBiz.map(function(v) { return Math.round(v * (revAmt / bizAmt)); }),
    txStackCross: trendBiz.map(function(v) { return Math.round(v * (crossRefund / bizAmt * 0.5)); }),
    txStackCur: trendBiz.map(function(v) { return Math.round(v * (curRefund / bizAmt * 0.5)); }),
    txStackDisc: trendBiz.map(function(v) { return Math.round(v * (discount / bizAmt)); }),
    txStackSub: '每日：营收 + 跨期退款 + 当期退款 + 优惠 = 交易额(原价)',
  };
}

// ===== 自定义月数据生成（种子确定性） =====
function generateCustomMonthData(startStr, endStr) {
  var seed = 0, key = startStr + endStr;
  for (var i = 0; i < key.length; i++) { seed = ((seed * 31) + key.charCodeAt(i)) | 0; }
  var r = seededRand(seed);
  function rrng(lo, hi) { return Math.floor(lo + r() * (hi - lo + 1)); }

  var s = new Date(startStr + 'T00:00:00'), e = new Date(endStr + 'T00:00:00');
  var days = Math.round((e - s) / 86400000) + 1;

  // 检测是否为完整自然月
  var isFullMonth = (s.getDate() === 1) && (e.getMonth() === s.getMonth()) && (e.getDate() === new Date(s.getFullYear(), s.getMonth()+1, 0).getDate());

  // ---- Overview KPI（月量级） ----
  var orders = rrng(4500, 6000);
  var avgUnit = Math.round((65 + r() * 10) * 10) / 10;
  var bizAmt = Math.round(orders * avgUnit);
  var txAmt = Math.round(bizAmt * (1.10 + r() * 0.06));
  var discount = txAmt - bizAmt;
  var revAmt = Math.round(bizAmt * (0.962 + r() * 0.008));
  var curRefund = bizAmt - revAmt;
  var crossRefund = Math.round(curRefund * (0.6 + r() * 1.5));
  var totalRefund = curRefund + crossRefund;
  var discountRate = (discount / txAmt * 100).toFixed(1);
  var curRefundRate = (curRefund / bizAmt * 100).toFixed(1);
  var revToBiz = (revAmt / bizAmt * 100).toFixed(1);

  function genChg(idx) {
    var bases = [8.5, 7.2, 6.0, 5.8, 1.5, 4.2, 1.2, 0.3, 0.2, 0.6];
    var b = bases[idx] || 1.0, v = b + (r() - 0.5) * 2.5;
    var arrow = v >= 0 ? '▲' : '▼';
    return arrow + ' ' + Math.abs(v).toFixed(1) + '%';
  }
  function chgDir(idx) {
    var bases = [8.5, 7.2, 6.0, 5.8, 1.5, 4.2, 1.2, 0.3, 0.2, 0.6];
    var b = bases[idx] || 1.0;
    return (b + (r() - 0.5) * 2.5) >= 0 ? 'up' : 'down';
  }

  // 自定义区间对比文案统一用「上一区间」
  var cmpText = isFullMonth ? '较上月同期' : '较上一区间';
  
  // 同比模拟（仅整月模式）
  function genYoy(idx) {
    if (!isFullMonth) return null;
    var bases = [18.6, 17.2, 16.0, 15.1, -2.3, -9.5, 3.2, -0.8, -1.1, 0.6];
    var b = bases[idx] || 1.0, v = b + (r() - 0.5) * 1.8;
    return { yoyChg: (v >= 0 ? '+' : '') + v.toFixed(1) + '%', yoyDir: v >= 0 ? 'up' : 'down' };
  }
  var y1 = genYoy(0), y2 = genYoy(1), y3 = genYoy(2), y4 = genYoy(3), y5 = genYoy(4);
  var y6 = genYoy(5), y7 = genYoy(6), y8 = genYoy(7), y9 = genYoy(8), y10 = genYoy(9);

  var overview = {
    k1: { lbl:'交易额', val:'<span>¥</span>'+txAmt.toLocaleString(), chg:genChg(0)+' '+cmpText, dir:chgDir(0), yoyChg:y1&&y1.yoyChg, yoyDir:y1&&y1.yoyDir },
    k2: { lbl:'营业额', val:'<span>¥</span>'+bizAmt.toLocaleString(), chg:genChg(1)+' '+cmpText, dir:chgDir(1), yoyChg:y2&&y2.yoyChg, yoyDir:y2&&y2.yoyDir },
    k3: { lbl:'营收', val:'<span>¥</span>'+revAmt.toLocaleString(), chg:genChg(2)+' '+cmpText, dir:chgDir(2), yoyChg:y3&&y3.yoyChg, yoyDir:y3&&y3.yoyDir },
    k4: { lbl:'订单数', val:''+orders+'<span>单</span>', chg:genChg(3)+' '+cmpText, dir:chgDir(3), yoyChg:y4&&y4.yoyChg, yoyDir:y4&&y4.yoyDir },
    k5: { lbl:'优惠金额', val:'<span>¥</span>'+discount.toLocaleString(), chg:'▼ '+genChg(4).replace(/[▲▼] /,'')+' '+cmpText+'收窄', dir:'down', yoyChg:y5&&y5.yoyChg, yoyDir:y5&&y5.yoyDir },
    k6: { lbl:'退款金额', val:'<span>¥</span>'+totalRefund.toLocaleString(), chg:'▼ '+genChg(5).replace(/[▲▼] /,'')+' '+cmpText+'改善', dir:'down', refundDetail:'当期 ¥'+curRefund.toLocaleString()+' · 跨期 ¥'+crossRefund.toLocaleString(), yoyChg:y6&&y6.yoyChg, yoyDir:y6&&y6.yoyDir },
    k7: { lbl:'客单价(成交)', val:'<span>¥</span>'+avgUnit, chg:genChg(6)+' '+cmpText, dir:chgDir(6), yoyChg:y7&&y7.yoyChg, yoyDir:y7&&y7.yoyDir },
    k8: { lbl:'优惠率', val:discountRate+'<span>%</span>', chg:'▼ '+cmpText+'-'+genChg(7).replace(/[▲▼] /,'')+'%', dir:'down', yoyChg:y8&&y8.yoyChg, yoyDir:y8&&y8.yoyDir },
    k9: { lbl:'当期退款率', val:curRefundRate+'<span>%</span>', chg:'▼ '+cmpText+'-'+genChg(8).replace(/[▲▼] /,'')+'%', dir:'down', yoyChg:y9&&y9.yoyChg, yoyDir:y9&&y9.yoyDir },
    k10: { lbl:'营收/营业额比', val:revToBiz+'<span>%</span>', chg:'▼ '+cmpText+'-'+genChg(9).replace(/[▲▼] /,'')+'%', dir:'down', yoyChg:y10&&y10.yoyChg, yoyDir:y10&&y10.yoyDir },
  };

  // ---- 趋势图：按区间长度决定粒度 ----
  var trendLabels = [], trendBiz = [], trendOrders = [];
  var trendTitle, trendSub;
  if (days <= 31) {
    // 短周期：逐日
    trendTitle = '本周期日营业额趋势';
    trendSub = '按日：营业额 + 订单量双轴对比';
    var step = Math.max(1, Math.floor(days / 14));
    for (var ti = 0; ti < days; ti += step) {
      var td = new Date(s); td.setDate(s.getDate() + ti);
      trendLabels.push((td.getMonth()+1)+'/'+td.getDate());
      var segBiz = Math.round(bizAmt / days * step * (0.78 + r() * 0.32));
      var segOrders = Math.round(orders / days * step * (0.75 + r() * 0.30));
      trendBiz.push(segBiz);
      trendOrders.push(segOrders);
    }
    trendBiz[trendBiz.length-1] = Math.round(bizAmt / days * Math.min(step, days));
    trendOrders[trendOrders.length-1] = Math.round(orders / days * Math.min(step, days));
  } else if (days <= 90) {
    // 中周期：按周聚合
    trendTitle = '本周期周营业额趋势';
    trendSub = '按周：营业额 + 订单量双轴对比';
    var weeks = Math.ceil(days / 7);
    for (var wi = 0; wi < weeks; wi++) {
      var ws = new Date(s); ws.setDate(s.getDate() + wi * 7);
      var we = new Date(ws); we.setDate(ws.getDate() + 6);
      if (we > e) we = new Date(e);
      trendLabels.push((ws.getMonth()+1)+'/'+ws.getDate());
      var wLen = Math.round((we - ws) / 86400000) + 1;
      trendBiz.push(Math.round(bizAmt / days * wLen * (0.78 + r() * 0.32)));
      trendOrders.push(Math.round(orders / days * wLen * (0.75 + r() * 0.30)));
    }
    trendBiz[trendBiz.length-1] = Math.round(bizAmt / days * (days - (weeks-1)*7));
    trendOrders[trendOrders.length-1] = Math.round(orders / days * (days - (weeks-1)*7));
  } else {
    // 长周期：按月聚合
    trendTitle = '本周期月营业额趋势';
    trendSub = '按月：营业额 + 订单量双轴对比';
    var cur = new Date(s.getFullYear(), s.getMonth(), 1);
    while (cur <= e) {
      var ym = cur.getFullYear() + '-' + pad(cur.getMonth()+1);
      var ms = new Date(cur);
      var me = new Date(cur.getFullYear(), cur.getMonth()+1, 0);
      if (ms < s) ms = new Date(s);
      if (me > e) me = new Date(e);
      var mLen = Math.round((me - ms) / 86400000) + 1;
      trendLabels.push((cur.getMonth()+1)+'月');
      trendBiz.push(Math.round(bizAmt / days * mLen * (0.78 + r() * 0.32)));
      trendOrders.push(Math.round(orders / days * mLen * (0.75 + r() * 0.30)));
      cur.setMonth(cur.getMonth()+1);
    }
  }

  // ---- 时段分布 ----
  var hourData = [0,0,0,0,0,0];
  var peak = rrng(9, 12), peak2 = rrng(16, 19);
  for (var hi = 6; hi < 24; hi++) {
    var dist = Math.min(Math.abs(hi - peak), Math.abs(hi - peak2));
    hourData.push(dist <= 3 ? rrng(8, 55 - dist * 8) : rrng(2, 10));
  }

  var pieData = {labels:['蔬菜','水果','肉禽','水产','粮油','其他'],
    data:[rrng(32,42), rrng(16,24), rrng(14,22), rrng(8,14), rrng(6,10), rrng(4,8)]};

  var topProducts = [
    {name:'土豆', cat:'蔬菜', qty:rrng(1100,1500)+'件', val:'¥'+rrng(14000,18000), pct:100, chg:'+'+rrng(8,18)+'%', dir:'up'},
    {name:'西红柿', cat:'蔬菜', qty:rrng(900,1300)+'件', val:'¥'+rrng(12000,16000), pct:88, chg:(rrng(0,1)?'+':'-')+rrng(2,10)+'%', dir:rrng(0,1)?'up':'down'},
    {name:'鸡蛋', cat:'蛋奶', qty:rrng(750,1100)+'件', val:'¥'+rrng(10000,14000), pct:77, chg:'+'+rrng(5,15)+'%', dir:'up'},
    {name:'白菜', cat:'蔬菜', qty:rrng(650,950)+'件', val:'¥'+rrng(8000,12000), pct:64, chg:(rrng(0,1)?'+':'-')+rrng(2,10)+'%', dir:rrng(0,1)?'up':'down'},
    {name:'猪肉', cat:'肉禽', qty:rrng(400,600)+'件', val:'¥'+rrng(7000,11000), pct:60, chg:'-'+rrng(1,8)+'%', dir:'down'},
  ];

  // 洞察文案统一用「本周期 / 较上一区间」
  var avgOrders = days > 0 ? Math.round(orders/days) : orders;
  var insights = [
    { title:'销售健康度', items: [
      '本周期交易额 ¥'+txAmt.toLocaleString()+'，<b>营业额 ¥'+bizAmt.toLocaleString()+'</b>，订单 '+orders+' 单',
      '优惠率 <b>'+discountRate+'%</b>，'+cmpText+'收窄 <span class="ins-tag good">改善</span>',
      '客单价 ¥'+avgUnit+'，处于周期平均正常区间'
    ]},
    { title:'商品与品类', items: [
      '蔬菜品类贡献约 <b>'+pieData.data[0]+'%</b> 营业额，土豆/西红柿/白菜为周期热销 Top 3',
      '猪肉周期销量 '+topProducts[4].qty+'，环比 <b>'+topProducts[4].chg+'</b> <span class="ins-tag warn">下滑</span>',
      '热销品类集中度高，Top 5 占周期销售额约 <b>'+rrng(55,66)+'%</b>'
    ]},
    { title:'客群与流量', items: [
      '本周期 '+orders+' 单，日均 '+avgOrders+' 单',
      '时段分布双峰结构稳定：早市 9-11 点 + 晚市 17-19 点',
      '订单量 '+cmpText+' <b>'+genChg(3).replace(/[▲▼] /,'')+'</b>，周期客流平稳'
    ]},
    { title:'风险与建议', items: [
      '本周期跨期退款 ¥'+crossRefund.toLocaleString()+'，占总退款 <b>'+(crossRefund/totalRefund*100).toFixed(1)+'%</b>',
      '月中（15-20日）订单量略低，可考虑推出月中促销活动',
      '土豆/鸡蛋/猪肉周期周转率偏高，建议优化订货节奏'
    ]}
  ];

  return {
    overview: overview, ovInsights: insights,
    ovTrendLabels: trendLabels, ovTrendBiz: trendBiz, ovTrendOrders: trendOrders,
    ovTrendTitle: trendTitle, ovTrendSub: trendSub,
    ovHourTitle: startStr + ' ~ ' + endStr + ' 时段分布',
    ovHourData: hourData, ovTopProducts: topProducts, ovPieData: pieData,
    ovPieSub: '6大品类 · 共 ¥' + bizAmt.toLocaleString(),

    // ---- 交易分析页 ----
    transaction: {
      k1: { lbl:'本周期交易额(原价)', val:'<span>¥</span>'+txAmt.toLocaleString(), chg:genChg(0)+' '+cmpText, dir:chgDir(0) },
      k2: { lbl:'本周期营业额', val:'<span>¥</span>'+bizAmt.toLocaleString(), chg:genChg(1)+' '+cmpText, dir:chgDir(1) },
      k3: { lbl:'本周期营收', val:'<span>¥</span>'+revAmt.toLocaleString(), chg:genChg(2)+' '+cmpText, dir:chgDir(2) },
      k4: { lbl:'本周期优惠金额', val:'<span>¥</span>'+discount.toLocaleString(), chg:'▼ '+genChg(4).replace(/[▲▼] /,'')+' '+cmpText+'收窄', dir:'down' },
      k5: { lbl:'优惠率', val:discountRate+'<span>%</span>', chg:'▼ '+genChg(7).replace(/[▲▼] /,'')+' '+cmpText+'收窄', dir:'down' },
      k6: { lbl:'当期退款率', val:curRefundRate+'<span>%</span>', chg:'▼ '+genChg(8).replace(/[▲▼] /,'')+' '+cmpText+'改善', dir:'down' },
      k7: { lbl:'跨期退款金额', val:'<span>¥</span>'+crossRefund.toLocaleString(), chg:'▲ '+cmpText+'+'+(rrng(20,60)/10).toFixed(1)+'%', dir:'down' },
      k8: { lbl:'营收/营业额比', val:revToBiz+'<span>%</span>', chg:'▼ '+cmpText+'−'+(rrng(1,5)/10).toFixed(1)+'%', dir:'down' },
    },
    txTrendTitle: '交易额 → 营收 全链路',
    txTrendSub: trendSub.replace('营业额 + 订单量', '原价交易额、营业额、营收、优惠'),
    txTrendLabels: trendLabels,
    txTrendTx: trendBiz.map(function(v) { return Math.round(v * (txAmt / bizAmt)); }),
    txTrendBiz: trendBiz,
    txTrendRev: trendBiz.map(function(v) { return Math.round(v * (revAmt / bizAmt)); }),
    txTrendDisc: trendBiz.map(function(v) { return Math.round(v * (discount / bizAmt)); }),
    txStackLabels: trendLabels,
    txStackRev: trendBiz.map(function(v) { return Math.round(v * (revAmt / bizAmt)); }),
    txStackCross: trendBiz.map(function(v) { return Math.round(v * (crossRefund / bizAmt * 0.5)); }),
    txStackCur: trendBiz.map(function(v) { return Math.round(v * (curRefund / bizAmt * 0.5)); }),
    txStackDisc: trendBiz.map(function(v) { return Math.round(v * (discount / bizAmt)); }),
    txStackSub: '营收 + 跨期退款 + 当期退款 + 优惠 = 交易额(原价)',
  };
}

function generateCustomRangeData(startStr, endStr) {
  var s = new Date(startStr + 'T00:00:00'), e = new Date(endStr + 'T00:00:00');
  var days = Math.round((e - s) / 86400000) + 1;
  if (days < 1) days = 1;
  var dayLabels = [];
  for (var i = 0; i < days; i++) {
    var dt = new Date(s); dt.setDate(s.getDate() + i);
    dayLabels.push((dt.getMonth()+1)+'/'+dt.getDate());
  }
  var totalRev = days * 11000;
  var d = genDailyData(days, totalRev);
  var totalOrders = d.orders.reduce(function(a,b){return a+b;},0);
  var totalVol = d.vol.reduce(function(a,b){return a+b;},0);
  return {
    label: startStr + ' ~ ' + endStr + '（指定周期）',
    compareLabel: '较上一同期',
    kpi: [
      { lbl:'营业额', val:'¥'+(totalRev/10000).toFixed(1)+'万', chg:'+'+rand(50,180)/10+'%', up:true },
      { lbl:'订单数', val:totalOrders.toLocaleString(), chg:'+'+rand(50,150)/10+'%', up:true },
      { lbl:'客单价', val:'¥'+(totalRev/totalOrders).toFixed(1), chg:'+'+rand(10,40)/10+'%', up:true },
      { lbl:'毛利率', val:rand(260,290)/10+'%', chg:'+'+rand(1,20)/10+'%', up:true },
      { lbl:'销售量', val:totalVol.toLocaleString()+'件', chg:'+'+rand(50,180)/10+'%', up:true },
    ],
    trendLabels: dayLabels, trendRev: d.rev, trendOrders: d.orders, trendSalesVol: d.vol,
    category: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[34,22,17,15,10,7,6]},
    orderStatus: {labels:['已完成','进行中','已退款','待处理'],data:[Math.round(totalOrders*0.85),Math.round(totalOrders*0.03),Math.round(totalOrders*0.07),Math.round(totalOrders*0.05)]},
    orderStatusColors: ['#3EB27E','#83BFF4','#1088C3','#FFB86C'],
    recentOrders: [], topProducts: (function(){
      var scale = Math.max(1, Math.round(totalRev/11000));
      return [
        {name:'土豆',cat:'蔬菜',qty:rand(200,350)*scale,sales:rand(2500,4000)*scale,bar:100},
        {name:'西红柿',cat:'蔬菜',qty:rand(180,300)*scale,sales:rand(2200,3600)*scale,bar:88},
        {name:'鸡蛋',cat:'蛋奶',qty:rand(150,250)*scale,sales:rand(2000,3200)*scale,bar:77},
        {name:'猪肉',cat:'肉禽',qty:rand(80,140)*scale,sales:rand(1800,2800)*scale,bar:62},
        {name:'白菜',cat:'蔬菜',qty:rand(140,220)*scale,sales:rand(1600,2600)*scale,bar:61},
        {name:'苹果',cat:'水果',qty:rand(60,100)*scale,sales:rand(1000,1800)*scale,bar:42},
        {name:'黄瓜',cat:'蔬菜',qty:rand(100,160)*scale,sales:rand(800,1400)*scale,bar:34},
        {name:'胡萝卜',cat:'蔬菜',qty:rand(80,140)*scale,sales:rand(700,1200)*scale,bar:30},
        {name:'鲫鱼',cat:'水产',qty:rand(35,70)*scale,sales:rand(600,1100)*scale,bar:27},
        {name:'大米',cat:'粮油',qty:rand(25,50)*scale,sales:rand(500,900)*scale,bar:25},
        {name:'豆腐',cat:'蛋奶',qty:rand(60,100)*scale,sales:rand(350,650)*scale,bar:18},
        {name:'香蕉',cat:'水果',qty:rand(40,80)*scale,sales:rand(300,550)*scale,bar:17},
        {name:'猪排',cat:'肉禽',qty:rand(20,40)*scale,sales:rand(280,500)*scale,bar:16},
        {name:'洋葱',cat:'蔬菜',qty:rand(50,90)*scale,sales:rand(250,450)*scale,bar:14},
        {name:'牛肉',cat:'肉禽',qty:rand(15,30)*scale,sales:rand(240,480)*scale,bar:14},
        {name:'青椒',cat:'蔬菜',qty:rand(45,80)*scale,sales:rand(220,380)*scale,bar:13},
        {name:'南瓜',cat:'蔬菜',qty:rand(30,60)*scale,sales:rand(180,320)*scale,bar:10},
        {name:'生姜',cat:'蔬菜',qty:rand(25,45)*scale,sales:rand(160,280)*scale,bar:9},
      ];
    })(),
    catSales: {labels:['蔬菜','肉禽','蛋奶','水果','水产','粮油','其他'],data:[Math.round(totalRev*0.28),Math.round(totalRev*0.20),Math.round(totalRev*0.15),Math.round(totalRev*0.13),Math.round(totalRev*0.10),Math.round(totalRev*0.08),Math.round(totalRev*0.06)]},
    productDetail: (function(){
      return [
        {name:'土豆',cat:'蔬菜',qty:rand(200,350),sales:rand(2500,4000),cost:rand(1800,2900),margin:rand(500,1100),rate:rand(180,320)/10+'%'},
        {name:'西红柿',cat:'蔬菜',qty:rand(180,300),sales:rand(2200,3600),cost:rand(1500,2500),margin:rand(500,1100),rate:rand(200,340)/10+'%'},
        {name:'鸡蛋',cat:'蛋奶',qty:rand(150,250),sales:rand(2000,3200),cost:rand(1700,2700),margin:rand(200,500),rate:rand(100,240)/10+'%'},
        {name:'猪肉',cat:'肉禽',qty:rand(80,140),sales:rand(1800,2800),cost:rand(1500,2300),margin:rand(200,500),rate:rand(120,260)/10+'%'},
        {name:'白菜',cat:'蔬菜',qty:rand(140,220),sales:rand(1600,2600),cost:rand(1200,1900),margin:rand(300,700),rate:rand(180,320)/10+'%'},
        {name:'苹果',cat:'水果',qty:rand(60,100),sales:rand(1000,1800),cost:rand(700,1300),margin:rand(200,500),rate:rand(200,380)/10+'%'},
        {name:'黄瓜',cat:'蔬菜',qty:rand(100,160),sales:rand(800,1400),cost:rand(600,1100),margin:rand(150,400),rate:rand(150,320)/10+'%'},
        {name:'鲫鱼',cat:'水产',qty:rand(35,70),sales:rand(600,1100),cost:rand(400,800),margin:rand(150,350),rate:rand(200,400)/10+'%'},
      ];
    })()
  };
}

// ===== DAY PICKER (今日) =====
function buildDayPicker(year, month, selDate) {
  var picker = document.getElementById('periodPicker');
  var mn = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  picker.innerHTML =
    '<div class="picker-nav">'+
      '<button class="nav-arrow" onclick="navDayPicker(-1)">◀</button>'+
      '<span class="nav-title">'+year+'年'+mn[month]+'</span>'+
      '<button class="nav-arrow" onclick="navDayPicker(1)">▶</button>'+
    '</div>'+
    '<div class="picker-calendar">'+
      '<div class="day-headers"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>'+
      '<div class="day-grid" id="pickerDayGrid"></div>'+
    '</div>'+
    '<div class="picker-today-row"><button onclick="selectPickerToday()">回到今天</button></div>';
  renderDayGrid(year, month, selDate);
}

function navDayPicker(dir) {
  var s = pickerState;
  s.month += dir;
  if (s.month < 0) { s.month = 11; s.year--; }
  if (s.month > 11) { s.month = 0; s.year++; }
  // 不能翻到系统上线月之前（2026-06及更早→禁用）
  var mm = s.year + '-' + pad(s.month + 1);
  if (mm < SYSTEM_START_MONTH) { s.month = 6; s.year = 2026; }
  var now = new Date();
  if (s.year > now.getFullYear() || (s.year === now.getFullYear() && s.month > now.getMonth())) {
    s.year = now.getFullYear(); s.month = now.getMonth();
  }
  buildDayPicker(s.year, s.month, null);
}

function renderDayGrid(year, month, selDate) {
  var grid = document.getElementById('pickerDayGrid');
  if (!grid) return;
  var now = new Date();
  var todayStr = fmtDate(now);
  var firstDay = new Date(year, month, 1);
  var lastDay = new Date(year, month + 1, 0);
  var sd = firstDay.getDay(); sd = sd === 0 ? 6 : sd - 1;
  var html = '';
  var pLast = new Date(year, month, 0).getDate();
  for (var i = sd - 1; i >= 0; i--) html += '<div class="day-cell other">'+(pLast - i)+'</div>';
  for (var d = 1; d <= lastDay.getDate(); d++) {
    var ds = year+'-'+pad(month+1)+'-'+pad(d);
    var cls = 'day-cell';
    var isFuture = ds > todayStr;
    var isBeforeSystem = ds < SYSTEM_START_DATE;
    if (ds === todayStr) cls += ' today';
    if (ds === selDate) cls += ' sel';
    if (isFuture || isBeforeSystem) cls += ' disabled';
    var onclick = (isFuture || isBeforeSystem) ? '' : ' onclick="selectPickerDay(\''+ds+'\')"';
    html += '<div class="'+cls+'"'+onclick+'>'+d+'</div>';
  }
  var rem = 42 - (sd + lastDay.getDate());
  for (var d = 1; d <= rem; d++) html += '<div class="day-cell other">'+d+'</div>';
  grid.innerHTML = html;
}

function selectPickerDay(dateStr) {
  if (dateStr > fmtDate(new Date())) return; // 不允许选择未来日期
  if (dateStr < SYSTEM_START_DATE) return;   // 系统上线前无数据
  // 选了今天 → 恢复默认
  if (dateStr === fmtDate(new Date())) { selectPickerToday(); return; }

  var cd = generateCustomDayData(dateStr);

  // ---- STATS_DATA（统计页用） ----
  STATS_DATA.today = cd;

  // ---- DATA.today 标签 ----
  DATA.today.dateLabel = '\u{1F4C5} '+dateStr+'（日）';
  DATA.today.sidebarDate = '日 \u00B7 '+dateStr;
  DATA.today.conceptDate = '\u{1F4C5} 数据周期：'+dateStr+'（日）';

  // ---- DATA.today 概览（10 KPI 卡片 + 洞察 + 图表数据） ----
  DATA.today.overview = cd.overview;
  DATA.today.insights = cd.ovInsights;
  DATA.today.trendTitle = cd.ovTrendTitle;
  DATA.today.trendSub = cd.ovTrendSub;
  DATA.today.trendLabels = cd.ovTrendLabels;
  DATA.today.trendBiz = cd.ovTrendBiz;
  DATA.today.trendOrders = cd.ovTrendOrders;
  DATA.today.hourTitle = cd.ovHourTitle;
  DATA.today.hourData = cd.ovHourData;
  DATA.today.topProducts = cd.ovTopProducts;
  DATA.today.pieData = cd.ovPieData;
  DATA.today.pieSub = cd.ovPieSub;

  // ---- DATA.today 交易分析 ----
  DATA.today.transaction = cd.transaction;
  DATA.today.txTrendTitle = cd.txTrendTitle;
  DATA.today.txTrendSub = cd.txTrendSub;
  DATA.today.txTrendLabels = cd.txTrendLabels;
  DATA.today.txTrendTx = cd.txTrendTx;
  DATA.today.txTrendBiz = cd.txTrendBiz;
  DATA.today.txTrendRev = cd.txTrendRev;
  DATA.today.txTrendDisc = cd.txTrendDisc;
  DATA.today.txStackLabels = cd.txStackLabels;
  DATA.today.txStackRev = cd.txStackRev;
  DATA.today.txStackCross = cd.txStackCross;
  DATA.today.txStackCur = cd.txStackCur;
  DATA.today.txStackDisc = cd.txStackDisc;
  DATA.today.txStackSub = cd.txStackSub;

  periodOverrides.today = { date: dateStr };
  periodOverrides.week = null; periodOverrides.month = null;
  hidePicker();
  updateDateDisplay();
  updateOverviewDataForCustom('today');
  refreshCurrentPage();
}

function selectPickerToday() {
  resetToDefault('today');
  hidePicker();
  updateDateDisplay();
  refreshCurrentPage();
}

// ===== WEEK PICKER (本周) =====
function buildWeekPicker(year, month, selStart) {
  var picker = document.getElementById('periodPicker');
  var mn = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  var weeks = getWeeksInMonth(year, month);
  var html =
    '<div class="picker-nav">'+
      '<button class="nav-arrow" onclick="navWeekPicker(-1)">◀</button>'+
      '<span class="nav-title">'+year+'年'+mn[month]+'</span>'+
      '<button class="nav-arrow" onclick="navWeekPicker(1)">▶</button>'+
    '</div>'+
    '<div class="picker-week-list">';
  var now = new Date(), todayStr = fmtDate(now);
  for (var i = 0; i < weeks.length; i++) {
    var w = weeks[i];
    var active = selStart && w.start === selStart;
    var isCur = todayStr >= w.start && todayStr <= w.end;
    var isFuture = w.start > todayStr;
    var isBeforeSystem = w.end < SYSTEM_START_DATE;
    var disabled = isFuture || isBeforeSystem;
    var cls = 'picker-week-row' + (active?' active':'') + (disabled?' disabled':'');
    var onclick = disabled ? '' : ' onclick="selectPickerWeek(\''+w.start+'\',\''+w.end+'\')"';
    html += '<div class="'+cls+'"'+onclick+'>'+
      '<span>'+w.label+'</span>'+
      '<span class="week-meta">'+(isCur?'本周':'')+'</span></div>';
  }
  html += '</div>';
  picker.innerHTML = html;
}

function getWeeksInMonth(year, month) {
  var weeks = [];
  var first = new Date(year, month, 1);
  var last = new Date(year, month + 1, 0);
  var dow = first.getDay(); dow = dow === 0 ? 6 : dow - 1;
  var mon = new Date(first); mon.setDate(1 - dow);
  while (true) {
    var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    weeks.push({
      start: fmtDate(mon), end: fmtDate(sun),
      label: pad(mon.getMonth()+1)+'/'+pad(mon.getDate())+' \u2013 '+pad(sun.getMonth()+1)+'/'+pad(sun.getDate())
    });
    if (sun >= last) break;
    mon.setDate(mon.getDate() + 7);
  }
  return weeks;
}

function navWeekPicker(dir) {
  var s = pickerState;
  s.month += dir;
  if (s.month < 0) { s.month = 11; s.year--; }
  if (s.month > 11) { s.month = 0; s.year++; }
  var mm = s.year + '-' + pad(s.month + 1);
  if (mm < SYSTEM_START_MONTH) { s.month = 6; s.year = 2026; }
  var now = new Date();
  if (s.year > now.getFullYear() || (s.year === now.getFullYear() && s.month > now.getMonth())) {
    s.year = now.getFullYear(); s.month = now.getMonth();
  }
  buildWeekPicker(s.year, s.month, null);
}

function selectPickerWeek(start, end) {
  if (start > fmtDate(new Date())) return; // 不允许选择未开始的自然周
  if (end < SYSTEM_START_DATE) return;     // 系统上线前无数据
  // 选了当前自然周 → 恢复默认
  var cw = getCurrentWeek();
  if (start === cw.start) { resetWeekToDefault(); return; }

  // ---- 生成确定性模拟数据 ----
  var wd = generateCustomWeekData(start, end);

  // ---- STATS_DATA（统计页用） ----
  STATS_DATA.week = generateCustomRangeData(start, end);
  STATS_DATA.week.label = start+' \u007E '+end+'（周）';
  STATS_DATA.week.compareLabel = '较前一周';

  // ---- DATA.week 标签 ----
  DATA.week.dateLabel = '\u{1F4C5} '+start+' \u007E '+end+'（周）';
  DATA.week.sidebarDate = '周 \u00B7 '+start+'\u007E'+end;
  DATA.week.conceptDate = '\u{1F4C5} 数据周期：'+start+' \u007E '+end;

  // ---- DATA.week 概览数据 ----
  DATA.week.overview = wd.overview;
  DATA.week.insights = wd.ovInsights;
  DATA.week.trendLabels = wd.ovTrendLabels;
  DATA.week.trendBiz = wd.ovTrendBiz;
  DATA.week.trendOrders = wd.ovTrendOrders;
  DATA.week.trendTitle = wd.ovTrendTitle;
  DATA.week.trendSub = wd.ovTrendSub;
  DATA.week.hourTitle = wd.ovHourTitle;
  DATA.week.hourData = wd.ovHourData;
  DATA.week.topProducts = wd.ovTopProducts;
  DATA.week.pieData = wd.ovPieData;
  DATA.week.pieSub = wd.ovPieSub;

  // ---- DATA.week 交易分析 ----
  DATA.week.transaction = wd.transaction;
  DATA.week.txTrendTitle = wd.txTrendTitle;
  DATA.week.txTrendSub = wd.txTrendSub;
  DATA.week.txTrendLabels = wd.txTrendLabels;
  DATA.week.txTrendTx = wd.txTrendTx;
  DATA.week.txTrendBiz = wd.txTrendBiz;
  DATA.week.txTrendRev = wd.txTrendRev;
  DATA.week.txTrendDisc = wd.txTrendDisc;
  DATA.week.txStackLabels = wd.txStackLabels;
  DATA.week.txStackRev = wd.txStackRev;
  DATA.week.txStackCross = wd.txStackCross;
  DATA.week.txStackCur = wd.txStackCur;
  DATA.week.txStackDisc = wd.txStackDisc;
  DATA.week.txStackSub = wd.txStackSub;

  periodOverrides.week = { start: start, end: end };
  periodOverrides.today = null; periodOverrides.month = null;
  hidePicker();
  updateDateDisplay();
  updateOverviewDataForCustom('week');
  refreshCurrentPage();
}

function getCurrentWeek() {
  var now = new Date();
  var dow = now.getDay(); dow = dow === 0 ? 7 : dow; // 1=Mon ... 7=Sun
  var mon = new Date(now); mon.setDate(now.getDate() - dow + 1);
  var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: fmtDate(mon), end: fmtDate(sun) };
}

function resetWeekToDefault() {
  resetToDefault('week');
  hidePicker();
  updateDateDisplay();
  refreshCurrentPage();
}

// ===== MONTH PICKER (本月) =====
function buildMonthPicker(year, month) {
  var picker = document.getElementById('periodPicker');
  var mn = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  picker.innerHTML =
    '<div class="picker-nav">'+
      '<button class="nav-arrow" onclick="navMonthPicker(-1)">◀</button>'+
      '<span class="nav-title">'+year+'年</span>'+
      '<button class="nav-arrow" onclick="navMonthPicker(1)">▶</button>'+
    '</div>'+
    '<div class="picker-month-grid" id="pickerMonthGrid"></div>';
  var grid = document.getElementById('pickerMonthGrid');
  var html = '';
  var now = new Date();
  for (var m = 0; m < 12; m++) {
    var ym = year + '-' + pad(m + 1);
    var isBeforeSystem = ym < SYSTEM_START_MONTH;
    var isFuture = (year > now.getFullYear()) || (year === now.getFullYear() && m > now.getMonth());
    var disabled = isBeforeSystem || isFuture;
    var act = (m === now.getMonth() && year === now.getFullYear() && !disabled);
    var cls = 'picker-month-cell' + (act ? ' active' : '') + (disabled ? ' disabled' : '');
    html += '<div class="' + cls + '"';
    if (!disabled) html += ' onclick="selectPickerMonth(' + year + ',' + m + ')"';
    html += '>' + mn[m] + '</div>';
  }
  grid.innerHTML = html;
}

function buildYearPicker(year) {
  var picker = document.getElementById('periodPicker');
  var now = new Date();
  var currentYear = now.getFullYear();
  // 只显示系统上线（2026）至今的年份
  var start = SYSTEM_START_YEAR;
  var html = '<div class="picker-nav"><span class="nav-title">选择年份</span></div>';
  html += '<div class="picker-year-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px">';
  for (var y = start; y <= currentYear; y++) {
    var act = (y === year);
    html += '<button class="picker-year-cell" style="padding:10px 0;border:1px solid '+(act?'#005CF5':'#e0e0e0')+';border-radius:4px;background:'+(act?'#e8f0fe':'#fff')+';color:'+(act?'#005CF5':'#333')+';cursor:pointer;font-size:13px" onclick="applyYear('+y+')">'+y+'年</button>';
  }
  html += '</div>';
  picker.innerHTML = html;
}

function applyYear(year) {
  hidePicker();
  // 系统上线前的年份无数据
  if (year < SYSTEM_START_YEAR) return;
  var now = new Date();
  if (year > now.getFullYear()) return;
  resetToDefault('year');
  periodOverrides.year = { year: year, type: 'year' };
  var m = now.getMonth() + 1, d = now.getDate();
  var tStr;
  if (year < now.getFullYear()) {
    // 历史年份：全年 1-12
    tStr = year + '-12-' + pad(new Date(year, 12, 0).getDate());
    DATA.year.conceptDate = '📅 数据周期：' + year + '-01-01 ~ ' + tStr + '（' + year + '年全年）';
    DATA.year.dateLabel = '📅 ' + year + '年（全年）';
  } else {
    // 今年：1月至今
    tStr = year + '-' + pad(m) + '-' + pad(d);
    DATA.year.conceptDate = '📅 数据周期：' + year + '-01-01 ~ ' + tStr + '（' + year + '年累计至今）';
    DATA.year.dateLabel = '📅 ' + year + '年1-' + m + '月';
  }
  DATA.year.sidebarDate = '本年 ' + year + ' · 营业中';
  updateDateDisplay();
  refreshCurrentPage();
}

function selectPickerMonth(year, month) {
  pickerState.year = year; pickerState.month = month;
  applyMonthFull();
}

function navMonthPicker(dir) {
  pickerState.year += dir;
  // 不能翻到系统上线前（2025及更早）
  if (pickerState.year < SYSTEM_START_YEAR) pickerState.year = SYSTEM_START_YEAR;
  var now = new Date();
  if (pickerState.year > now.getFullYear()) pickerState.year = now.getFullYear();
  buildMonthPicker(pickerState.year, pickerState.month);
}

function applyMonthFull() {
  var year = pickerState.year, month = pickerState.month;
  var ym = year + '-' + pad(month + 1);
  // 系统上线前的月份无数据
  if (ym < SYSTEM_START_MONTH) return;
  // 未来月份不可选
  var now = new Date();
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth())) return;
  var start = year+'-'+pad(month+1)+'-01';
  var end = year+'-'+pad(month+1)+'-'+pad(new Date(year, month+1, 0).getDate());
  // 选了当前月整月 → 恢复默认
  if (year === now.getFullYear() && month === now.getMonth()) { resetMonthToDefault(); return; }

  // ---- 生成确定性模拟数据 ----
  var md = generateCustomMonthData(start, end);

  var mn = (month+1)+'月';
  var label = year+'年'+mn;

  // ---- STATS_DATA（统计页用） ----
  STATS_DATA.month = generateCustomRangeData(start, end);
  STATS_DATA.month.label = label+'（月）';
  STATS_DATA.month.compareLabel = '较上月';

  // ---- DATA.month 标签 ----
  DATA.month.dateLabel = '\u{1F4C5} '+label+'（月）';
  DATA.month.sidebarDate = '月 \u00B7 '+label;
  DATA.month.conceptDate = '\u{1F4C5} 数据周期：'+start+' \u007E '+end;

  // ---- DATA.month 概览数据 ----
  DATA.month.overview = md.overview;
  DATA.month.insights = md.ovInsights;
  DATA.month.trendLabels = md.ovTrendLabels;
  DATA.month.trendBiz = md.ovTrendBiz;
  DATA.month.trendOrders = md.ovTrendOrders;
  DATA.month.trendTitle = md.ovTrendTitle;
  DATA.month.trendSub = md.ovTrendSub;
  DATA.month.hourTitle = md.ovHourTitle;
  DATA.month.hourData = md.ovHourData;
  DATA.month.topProducts = md.ovTopProducts;
  DATA.month.pieData = md.ovPieData;
  DATA.month.pieSub = md.ovPieSub;

  // ---- DATA.month 交易分析 ----
  DATA.month.transaction = md.transaction;
  DATA.month.txTrendTitle = md.txTrendTitle;
  DATA.month.txTrendSub = md.txTrendSub;
  DATA.month.txTrendLabels = md.txTrendLabels;
  DATA.month.txTrendTx = md.txTrendTx;
  DATA.month.txTrendBiz = md.txTrendBiz;
  DATA.month.txTrendRev = md.txTrendRev;
  DATA.month.txTrendDisc = md.txTrendDisc;
  DATA.month.txStackLabels = md.txStackLabels;
  DATA.month.txStackRev = md.txStackRev;
  DATA.month.txStackCross = md.txStackCross;
  DATA.month.txStackCur = md.txStackCur;
  DATA.month.txStackDisc = md.txStackDisc;
  DATA.month.txStackSub = md.txStackSub;

  periodOverrides.month = { type:'full', start:start, end:end };
  periodOverrides.today = null; periodOverrides.week = null;
  hidePicker();
  updateDateDisplay();
  updateOverviewDataForCustom('month');
  refreshCurrentPage();
}

function resetMonthToDefault() {
  resetToDefault('month');
  hidePicker();
  updateDateDisplay();
  refreshCurrentPage();
}

// ---- reset helpers ----
function resetToDefault(range) {
  var dm = computeDateMeta();
  if (range === 'today' || !range) {
    DATA.today = JSON.parse(JSON.stringify(DEFAULT_DATA.today));
    Object.assign(DATA.today, dm.today);
    STATS_DATA.today = JSON.parse(JSON.stringify(DEFAULT_STATS_DATA.today));
    periodOverrides.today = null;
  }
  if (range === 'week' || !range) {
    DATA.week = JSON.parse(JSON.stringify(DEFAULT_DATA.week));
    Object.assign(DATA.week, dm.week);
    STATS_DATA.week = JSON.parse(JSON.stringify(DEFAULT_STATS_DATA.week));
    periodOverrides.week = null;
  }
  if (range === 'month' || !range) {
    DATA.month = JSON.parse(JSON.stringify(DEFAULT_DATA.month));
    Object.assign(DATA.month, dm.month);
    STATS_DATA.month = JSON.parse(JSON.stringify(DEFAULT_STATS_DATA.month));
    periodOverrides.month = null;
  }
  if (range === 'year' || !range) {
    DATA.year = JSON.parse(JSON.stringify(DEFAULT_DATA.year));
    Object.assign(DATA.year, dm.year);
    STATS_DATA.year = JSON.parse(JSON.stringify(DEFAULT_STATS_DATA.year));
    periodOverrides.year = null;
  }
  if (range === 'custom' || !range) {
    // 恢复默认自定义区间（最近30天，clamp到系统上线）
    var nowD = new Date(), sD = new Date(nowD); sD.setDate(sD.getDate() - 30);
    if (fmtDate(sD) < SYSTEM_START_DATE) sD = new Date(SYSTEM_START_DATE + 'T00:00:00');
    var label = fmtDate(sD) + ' \u007E ' + fmtDate(nowD);
    var md = generateCustomMonthData(fmtDate(sD), fmtDate(nowD));
    STATS_DATA.custom = generateCustomRangeData(fmtDate(sD), fmtDate(nowD));
    STATS_DATA.custom.label = label;
    STATS_DATA.custom.compareLabel = '较上一区间';
    DATA.custom = {
      dateLabel: '\u{1F4C5} ' + label,
      sidebarDate: '\u00B7 ' + label,
      conceptDate: '\u{1F4C5} 数据周期：' + label,
      overview: md.overview,
      insights: md.ovInsights,
      trendLabels: md.ovTrendLabels,
      trendBiz: md.ovTrendBiz,
      trendOrders: md.ovTrendOrders,
      trendTitle: md.ovTrendTitle,
      trendSub: md.ovTrendSub,
      hourTitle: md.ovHourTitle,
      hourData: md.ovHourData,
      topProducts: md.ovTopProducts,
      pieData: md.ovPieData,
      pieSub: md.ovPieSub
    };
    periodOverrides.custom = { start: fmtDate(sD), end: fmtDate(nowD), type: 'custom' };
  }
}

function updateDateDisplay() {
  var d = DATA[currentRange];
  document.getElementById('dateDisplay').textContent = d.dateLabel;
  document.getElementById('sidebarDate').textContent = d.sidebarDate;
}

function updateOverviewDataForCustom(range) {
  if (range === 'today') {
    DATA.today.dateLabel = DATA.today.dateLabel || STATS_DATA.today.label;
  } else if (range === 'week') {
    DATA.week.dateLabel = DATA.week.dateLabel || STATS_DATA.week.label;
  } else if (range === 'month') {
    DATA.month.dateLabel = DATA.month.dateLabel || STATS_DATA.month.label;
  } else if (range === 'year') {
    DATA.year.dateLabel = DATA.year.dateLabel || STATS_DATA.year.label;
  }
}

function hideAllPickers() {
  hidePicker();
}

// ===== 自定义区间选择器 =====
function buildCustomRangePicker() {
  var picker = document.getElementById('periodPicker');
  var y = pickerState.calYear, m = pickerState.calMonth;
  var m1y = y, m1m = m;
  var m2y = y, m2m = m + 1;
  if (m + 1 > 11) { m2y = y + 1; m2m = 0; }
  var mn = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  // 左箭头可达性：左右日历都不能翻到系统上线前
  var prevM = m1m - 1, prevY = m1y;
  if (prevM < 0) { prevM = 11; prevY--; }
  var prevDisabled = (prevY + '-' + pad(prevM + 1)) < SYSTEM_START_MONTH ? ' disabled' : '';
  var nextDisabled = (new Date(m2y, m2m, 1) > new Date()) ? ' disabled' : '';

  picker.innerHTML =
    '<div class="custom-range-wrap">'+
      '<div class="custom-cal-row">'+
        '<div class="custom-cal-col">'+
          '<div class="custom-cal-header">'+
            '<button class="custom-cal-nav nav-left" onclick="navCustomCalendar(-1)"'+prevDisabled+'>◀</button>'+
            '<span class="custom-cal-title">'+m1y+'年 '+mn[m1m]+'</span>'+
          '</div>'+
          '<div class="custom-day-headers"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>'+
          '<div class="custom-day-grid" id="customCalGrid0"></div>'+
        '</div>'+
        '<div class="custom-cal-col">'+
          '<div class="custom-cal-header">'+
            '<span class="custom-cal-title">'+m2y+'年 '+mn[m2m]+'</span>'+
            '<button class="custom-cal-nav nav-right" onclick="navCustomCalendar(1)"'+nextDisabled+'>▶</button>'+
          '</div>'+
          '<div class="custom-day-headers"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>'+
          '<div class="custom-day-grid" id="customCalGrid1"></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  renderCustomCalGrid(m1y, m1m, 'customCalGrid0');
  renderCustomCalGrid(m2y, m2m, 'customCalGrid1');
}

function renderCustomCalGrid(year, month, gridId) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  var lastDay = new Date(year, month + 1, 0);
  var firstDay = new Date(year, month, 1);
  var sd = firstDay.getDay(); sd = sd === 0 ? 6 : sd - 1;
  var todayStr = fmtDate(new Date());
  var rs = pickerState.rangeStart, re = pickerState.rangeEnd;
  var html = '';
  for (var i = 0; i < sd; i++) html += '<div class="custom-day-cell empty"></div>';
  for (var d = 1; d <= lastDay.getDate(); d++) {
    var ds = year + '-' + pad(month + 1) + '-' + pad(d);
    var cls = 'custom-day-cell';
    var isFuture = ds > todayStr;
    var isBeforeSystem = ds < SYSTEM_START_DATE;
    var disabled = isFuture || isBeforeSystem;
    if (disabled) { cls += ' disabled'; }
    else {
      if (rs && re) {
        if (ds === rs && ds === re) { cls += ' range-single'; }
        else if (ds === rs) { cls += ' range-start'; }
        else if (ds === re) { cls += ' range-end'; }
        else if (ds > rs && ds < re) { cls += ' in-range'; }
      } else if (rs && ds === rs) {
        cls += ' range-single';
      }
    }
    var onclick = disabled ? '' : ' onclick="clickCustomDay(\'' + ds + '\')"';
    html += '<div class="' + cls + '"' + onclick + '>' + d + '</div>';
  }
  grid.innerHTML = html;
}

function clickCustomDay(dateStr) {
  if (dateStr > fmtDate(new Date())) return;
  if (dateStr < SYSTEM_START_DATE) return;
  if (!pickerState.rangeStart || (pickerState.rangeStart && pickerState.rangeEnd)) {
    // 重新开始选择
    pickerState.rangeStart = dateStr;
    pickerState.rangeEnd = null;
    buildCustomRangePicker();
  } else {
    // 设置结束日期并直接生效
    var s = pickerState.rangeStart;
    if (s > dateStr) { pickerState.rangeStart = dateStr; pickerState.rangeEnd = s; }
    else { pickerState.rangeEnd = dateStr; }
    applyCustomRange();
  }
}

function navCustomCalendar(dir) {
  pickerState.calMonth += dir;
  if (pickerState.calMonth < 0) { pickerState.calMonth = 11; pickerState.calYear--; }
  else if (pickerState.calMonth > 11) { pickerState.calMonth = 0; pickerState.calYear++; }
  // 不能翻到系统上线前
  var calM1 = pickerState.calYear + '-' + pad(pickerState.calMonth + 1);
  if (calM1 < SYSTEM_START_MONTH) { pickerState.calMonth = 6; pickerState.calYear = 2026; }
  // 不能翻到未来
  var calM2y = pickerState.calYear, calM2m = pickerState.calMonth + 1;
  if (calM2m > 11) { calM2y++; calM2m = 0; }
  var now = new Date();
  if (calM2y > now.getFullYear() || (calM2y === now.getFullYear() && calM2m > now.getMonth() + 1)) {
    pickerState.calYear = now.getFullYear();
    pickerState.calMonth = now.getMonth() - 1;
    if (pickerState.calMonth < 0) { pickerState.calMonth = 0; pickerState.calYear--; }
  }
  buildCustomRangePicker();
}

function applyCustomRange() {
  var start = pickerState.rangeStart, end = pickerState.rangeEnd;
  if (!start || !end) return;
  var label = start + ' \u007E ' + end;

  // 生成数据
  var md = generateCustomMonthData(start, end);
  STATS_DATA.custom = generateCustomRangeData(start, end);
  STATS_DATA.custom.label = label;
  STATS_DATA.custom.compareLabel = '较上一区间';

  DATA.custom = {
    dateLabel: '\u{1F4C5} ' + label,
    sidebarDate: '\u00B7 ' + label,
    conceptDate: '\u{1F4C5} 数据周期：' + label,
    overview: md.overview,
    insights: md.ovInsights,
    trendLabels: md.ovTrendLabels,
    trendBiz: md.ovTrendBiz,
    trendOrders: md.ovTrendOrders,
    trendTitle: md.ovTrendTitle,
    trendSub: md.ovTrendSub,
    hourTitle: md.ovHourTitle,
    hourData: md.ovHourData,
    topProducts: md.ovTopProducts,
    pieData: md.ovPieData,
    pieSub: md.ovPieSub,
    transaction: md.transaction,
    txTrendTitle: md.txTrendTitle,
    txTrendSub: md.txTrendSub,
    txTrendLabels: md.txTrendLabels,
    txTrendTx: md.txTrendTx,
    txTrendBiz: md.txTrendBiz,
    txTrendRev: md.txTrendRev,
    txTrendDisc: md.txTrendDisc,
    txStackLabels: md.txStackLabels,
    txStackRev: md.txStackRev,
    txStackCross: md.txStackCross,
    txStackCur: md.txStackCur,
    txStackDisc: md.txStackDisc,
    txStackSub: md.txStackSub
  };

  periodOverrides.custom = { start: start, end: end, type: 'custom' };
  hidePicker();
  updateDateDisplay();
  refreshCurrentPage();
}
// ===== 自定义区间选择器 END =====

function refreshCurrentPage() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const pageId = activePage.id.replace('page-', '');
  refreshPageKPIs(pageId);
  // 始终尝试刷新图表——即使页面不在 initializedPages 中（防御缓存/时序问题）
  refreshPageCharts(pageId);
}

function refreshPageKPIs(pageId) {
  const d = DATA[currentRange];
  switch(pageId) {
    case 'overview': refreshOverviewKPIs(d.overview, d); break;
    case 'transaction': refreshTransactionKPIs(d.transaction); break;
    case 'trend': refreshTrendKPIs(d.trend); break;
    case 'profit': refreshProfitKPIs(d.profit); break;
    // 以下页面由 init* 函数完整重建 HTML，无需单独刷新 KPI
    case 'sales-stats': case 'biz-stats': case 'product': case 'category':
    case 'member': case 'inventory': case 'cost': break;
  }
}

function refreshPageCharts(pageId) {
  switch(pageId) {
    case 'overview': try { initOverviewCharts(); } catch(e) { console.error('initOverviewCharts error:', e); } break;
    case 'transaction': initTransactionCharts(); break;
    case 'product': initProduct(); break;
    case 'category': initCategory(); break;
    case 'trend': initTrend(); break;
    case 'profit': initProfitCharts(); break;
    case 'cost': initCost(); break;
    case 'member': initMember(); break;
    case 'inventory': initInventory(); break;
    case 'biz-stats': initBizStats(); break;
    case 'sales-stats': initSalesStats(); break;
    case 'product-detail': initProductDetail(); break;
    case 'label-print': initLabelPrint(); break;
    case 'print-plan': initPrintPlan(); break;
    case 'file-store': initFileStore(); break;
    case 'item-code': initItemCode(); break;
    case 'remove-guard': initRemoveGuard(); break;
    case 'goods-list': renderGoodsCatSidebar(); glRenderTable(); break;
    case 'group-manage': initGroupManage(); break;
    case 'group-form': initGroupForm(); break;
    case 'store-manage': initStoreManage(); break;
  }
}

// ===== KPI REFRESH FUNCTIONS =====
function applyCompareLabel(chgStr) {
  if (currentRange === 'today') return chgStr;
  if (currentRange === 'year') return chgStr;

  if (currentRange === 'week') {
    if (!periodOverrides.week) return chgStr; // 本周默认：不动
    // 自选周：较上周同期 → 较前一周，较上周 → 较前一周
    var s = chgStr.replace(/较上周同期/g, '较前一周');
    s = s.replace(/较上周/g, '较前一周');
    return s;
  }

  if (currentRange === 'month') {
    if (!periodOverrides.month) return chgStr; // 本月默认：不动
    if (periodOverrides.month.type === 'range') return chgStr; // 自定义周期：不动
    // 其他整月：较上月同期 → 较上月
    return chgStr.replace(/较上月同期/g, '较上月');
  }

  if (currentRange === 'custom') {
    // 自定义周期：统一「较上月同期」→「较上一区间」
    return chgStr.replace(/较上月同期/g, '较上一区间');
  }

  return chgStr;
}

function ensureKpiYoy(prefix) {
  if (document.getElementById(prefix + '-yoy')) return;
  const valEl = document.getElementById(prefix + '-val');
  if (!valEl) return;
  const card = valEl.closest('.kpi-card');
  if (!card) return;
  const el = document.createElement('div');
  el.className = 'kpi-yoy'; el.id = prefix + '-yoy';
  card.appendChild(el);
}

function setKPI(prefix, k) {
  const lbl = document.getElementById(prefix + '-lbl');
  const val = document.getElementById(prefix + '-val');
  const chg = document.getElementById(prefix + '-chg');
  if (lbl) lbl.textContent = k.lbl;
  if (val) val.innerHTML = k.val;
  if (chg) { chg.textContent = applyCompareLabel(k.chg); chg.className = 'kpi-change ' + k.dir; }
  ensureKpiYoy(prefix);
  const yoy = document.getElementById(prefix + '-yoy');
  if (yoy) {
    if (k.yoyChg) {
      yoy.textContent = '同比 ' + k.yoyChg;
      yoy.className = 'kpi-yoy ' + (k.yoyDir || 'up');
      yoy.style.display = '';
    } else {
      yoy.style.display = 'none';
    }
  }
}

function refreshOverviewKPIs(ov, d) {
  setKPI('ov1', ov.k1); setKPI('ov2', ov.k2); setKPI('ov3', ov.k3); setKPI('ov4', ov.k4);
  setKPI('ov5', ov.k5); setKPI('ov6', ov.k6); setKPI('ov7', ov.k7);
  setKPI('ov8', ov.k8); setKPI('ov9', ov.k9); setKPI('ov10', ov.k10);
  document.getElementById('ov-concept-date').textContent = d.conceptDate + ' ｜ ' + getScopeSummary();
  // 洞察卡片
  if (d.insights) {
    for (let i = 0; i < 4; i++) {
      const card = d.insights[i];
      if (!card) continue;
      const titleEl = document.getElementById('ov-ins' + (i+1) + '-title');
      const listEl = document.getElementById('ov-ins' + (i+1) + '-list');
      console.log('[DEBUG] insight card', i+1, 'titleEl:', !!titleEl, 'listEl:', !!listEl, 'card.items:', card.items?.length);
      if (titleEl) titleEl.textContent = card.title;
      if (listEl) {
        listEl.innerHTML = card.items.map(item =>
          '<li class="ins-item"><span class="ins-bullet"></span><span class="ins-text">' + item + '</span></li>'
        ).join('');
      }
    }
  }
  // Refund detail sub-line
  const rd = document.getElementById('ov6-detail');
  if (rd) {
    if (ov.k6.refundDetail) {
      const parts = ov.k6.refundDetail.split('·');
      rd.innerHTML = `<span class="rd-cur">${parts[0]?.trim()}</span><span class="rd-sep">·</span><span class="rd-cross">${parts[1]?.trim()}</span>`;
      rd.style.display = 'flex';
    } else {
      rd.style.display = 'none';
    }
  }
}

function refreshTransactionKPIs(tx) {
  setKPI('tx1', tx.k1); setKPI('tx2', tx.k2); setKPI('tx3', tx.k3); setKPI('tx4', tx.k4);
  document.getElementById('tx5-val').innerHTML = tx.k5.val;
  document.getElementById('tx5-chg').textContent = applyCompareLabel(tx.k5.chg); document.getElementById('tx5-chg').className = 'kpi-change ' + tx.k5.dir;
  document.getElementById('tx6-val').innerHTML = tx.k6.val;
  document.getElementById('tx6-chg').textContent = applyCompareLabel(tx.k6.chg); document.getElementById('tx6-chg').className = 'kpi-change ' + tx.k6.dir;
  setKPI('tx7', tx.k7);
  document.getElementById('tx8-val').innerHTML = tx.k8.val;
  document.getElementById('tx8-chg').textContent = applyCompareLabel(tx.k8.chg); document.getElementById('tx8-chg').className = 'kpi-change ' + tx.k8.dir;
}

function refreshTrendKPIs(tr) {
  setKPI('tr1', tr.k1); setKPI('tr2', tr.k2); setKPI('tr3', tr.k3); setKPI('tr4', tr.k4);
}

function refreshProfitKPIs(pf) {
  setKPI('pf1', pf.k1); setKPI('pf2', pf.k2); setKPI('pf3', pf.k3); setKPI('pf4', pf.k4);
  document.getElementById('pf5-val').innerHTML = pf.k5.val;
  document.getElementById('pf5-chg').textContent = applyCompareLabel(pf.k5.chg); document.getElementById('pf5-chg').className = 'kpi-change ' + pf.k5.dir;
}

// ===== MOCK DATA HELPERS =====
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, dec=1) { return parseFloat((Math.random() * (max - min) + min).toFixed(dec)); }

const last30days = Array.from({length:30}, (_,i) => {
  const d = new Date(2026,4,27); d.setDate(d.getDate()-29+i);
  return `${d.getMonth()+1}/${d.getDate()}`;
});
const months = ['1月','2月','3月','4月','5月'];

// ===== OVERVIEW PAGE =====
function initOverviewCharts() {
  const d = DATA[currentRange];
  const dm = computeDateMeta()[currentRange];

  // ===== 趋势图（动态生成 + 原地更新）=====
  const td = genOverviewTrend(currentRange);
  const hasOv = periodOverrides[currentRange];
  // override 时用 DATA 中已生成的一致数据，否则用 genOverviewTrend 返回值
  const trendLabels = hasOv ? d.trendLabels : td.labels;
  const trendBiz = hasOv ? d.trendBiz : td.biz;
  const trendOrders = hasOv ? d.trendOrders : td.orders;
  document.getElementById('ov-trend-title').textContent = hasOv ? d.trendTitle : dm.trendTitle;
  document.getElementById('ov-trend-sub').textContent = hasOv ? d.trendSub : dm.trendSub;
  if (ovCharts.trend) {
    ovCharts.trend.data.labels = trendLabels;
    ovCharts.trend.data.datasets[0].data = trendBiz;
    ovCharts.trend.data.datasets[1].data = trendOrders;
    ovCharts.trend.update('active');
  } else {
    ovCharts.trend = new Chart(document.getElementById('overviewTrendChart'), {
      data: {
        labels: trendLabels,
        datasets: [
          { type:'line', label:'营业额（元）', data:trendBiz, borderColor:'#005CF5', backgroundColor:'rgba(0,92,245,0.08)', borderWidth:2.5, fill:true, tension:0.4, yAxisID:'y', pointRadius:3 },
          { type:'bar', label:'订单数', data:trendOrders, backgroundColor:'rgba(131,191,244,0.5)', borderColor:'#83BFF4', borderWidth:1, yAxisID:'y1', borderRadius:3 }
        ]
      },
      options: {
        responsive:true, interaction:{mode:'index', intersect:false},
        scales:{
          y:{ type:'linear', position:'left', grid:{color:'#f0f0f0'}, ticks:{callback:v=>'¥'+v.toLocaleString()} },
          y1:{ type:'linear', position:'right', grid:{drawOnChartArea:false}, ticks:{callback:v=>v+'单'} }
        },
        plugins:{legend:{position:'top'}}
      }
    });
  }

  // ===== 时段图（粒度随范围自适应 + 原地更新）=====
  const hd = hasOv ? {labels: Array.from({length:24},function(_,i){return i+'时'}), data: d.hourData} : genHourData(currentRange);
  document.getElementById('ov-hour-title').textContent = hasOv ? d.hourTitle : dm.hourTitle;
  if (ovCharts.hour) {
    ovCharts.hour.data.labels = hd.labels;
    ovCharts.hour.data.datasets[0].data = hd.data;
    ovCharts.hour.data.datasets[0].backgroundColor = hd.data.map(v => v>=40?'#1088C3':v>=25?'#3EB27E':'#c8f0e0');
    ovCharts.hour.update('active');
  } else {
    ovCharts.hour = new Chart(document.getElementById('overviewHourChart'), {
      type:'bar',
      data:{
        labels: hd.labels,
        datasets:[{label:'交易笔数', data:hd.data,
          backgroundColor: hd.data.map(v => v>=40?'#1088C3':v>=25?'#3EB27E':'#c8f0e0'),
          borderRadius:3
        }]
      },
      options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{grid:{color:'#f5f5f5'}}}}
    });
  }

  // ===== 热销商品 Top5 =====
  const list = document.getElementById('overviewRankList');
  list.innerHTML = '';
  (d.topProducts || []).forEach((p,i) => {
    const isTop3 = i < 3;
    list.innerHTML += `<li class="rank-item">
      <div class="rank-row">
        <div class="rank-num ${isTop3?'top3':'other'}">${i+1}</div>
        <div class="rank-name" title="${p.name}">${p.name}</div>
        <div class="rank-cat">${p.cat || ''}</div>
        <div class="rank-qty">${p.qty || ''}</div>
        <div class="rank-value">${p.val}</div>
        <div class="rank-change ${p.dir || ''}">${p.chg || ''}</div>
      </div>
      <div class="rank-bar-row">
        <div class="rank-bar"><div class="rank-bar-fill" style="width:${p.pct}%"></div></div>
      </div>
    </li>`;
  });

  // ===== 品类占比环形图（原地更新）=====
  const pd = d.pieData || {labels:['蔬菜','水果','肉禽','水产','粮油','其他'], data:[35,22,18,12,8,5]};
  document.getElementById('ov-pie-sub').textContent = hasOv ? d.pieSub : dm.pieSub;
  const ovTotalStr = d.overview.k2.val.replace(/<[^>]*>/g,'').replace(/,/g,'');
  const ovTotal = parseFloat(ovTotalStr) * (ovTotalStr.includes('万')?10000:1) || 10000;
  const ovAmts = pd.data.map(p=>Math.round(ovTotal*p/100));
  if (ovCharts.pie) {
    ovCharts.pie.data.labels = pd.labels;
    ovCharts.pie.data.datasets[0].data = pd.data;
    ovCharts.pie.data.datasets[0].amounts = ovAmts;
    ovCharts.pie.update('active');
  } else {
    ovCharts.pie = new Chart(document.getElementById('overviewPieChart'), {
      type:'doughnut',
      data:{
        labels:pd.labels,
        datasets:[{data:pd.data, amounts:ovAmts, backgroundColor:MULTI_PALETTE, borderWidth:2, borderColor:'#fff', hoverOffset:6}]
      },
      options:{
        responsive:true, cutout:'60%', layout:{padding:50},
        _outerLabels: true,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:c=>'¥'+c.dataset.amounts[c.dataIndex].toLocaleString()+' ('+c.raw+'%)'}},
          datalabels:{display:false}
        }
      }
    });
  }
}

function initOverview() {
  try { initOverviewCharts(); } catch(e) { console.error('initOverviewCharts error:', e); }
  try { refreshOverviewKPIs(DATA[currentRange].overview, DATA[currentRange]); } catch(e) { console.error('refreshOverviewKPIs error:', e); }
}

// ===== TRANSACTION PAGE =====
function initTransactionCharts() {
  const d = DATA[currentRange];

  // Trend
  document.getElementById('tx-trend-title').textContent = d.txTrendTitle;
  document.getElementById('tx-trend-sub').textContent = d.txTrendSub;
  makeChart('txTrendChart', {
    type:'line',
    data:{labels:d.txTrendLabels, datasets:[
      {label:'交易额(原价)', data:d.txTrendTx, borderColor:'#005CF5', backgroundColor:'rgba(0,92,245,0.06)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4},
      {label:'营业额', data:d.txTrendBiz, borderColor:'#3EB27E', backgroundColor:'rgba(62,178,126,0.04)', fill:true, tension:0.4, borderWidth:2, pointRadius:3, borderDash:[6,3]},
      {label:'营收', data:d.txTrendRev, borderColor:'#83BFF4', fill:false, tension:0.4, borderWidth:2, pointRadius:3, borderDash:[2,2]},
      {label:'优惠金额', data:d.txTrendDisc, borderColor:'#FFB86C', fill:false, tension:0.4, borderWidth:1.5, pointRadius:2, borderDash:[3,3]},
    ]},
    options:{responsive:true, plugins:{legend:{position:'top'}}, scales:{y:{ticks:{callback:v=>'¥'+v.toLocaleString()}, grid:{color:'#f5f5f5'}}}}
  });

  // Stacked bar
  document.getElementById('tx-stack-sub').textContent = d.txStackSub;
  makeChart('txVsRevenueChart', {
    type:'bar',
    data:{labels:d.txStackLabels, datasets:[
      {label:'营收', data:d.txStackRev, backgroundColor:'#83BFF4', borderRadius:4, stack:'stack1'},
      {label:'跨期退款', data:d.txStackCross, backgroundColor:'#CAAED8', borderRadius:4, stack:'stack1'},
      {label:'当期退款', data:d.txStackCur, backgroundColor:'#FF9193', borderRadius:4, stack:'stack1'},
      {label:'优惠金额', data:d.txStackDisc, backgroundColor:'#FFB86C', borderRadius:4, stack:'stack1'},
    ]},
    options:{responsive:true, plugins:{legend:{position:'top'}}, scales:{x:{stacked:true}, y:{stacked:true, ticks:{callback:v=>'¥'+v.toLocaleString()}, grid:{color:'#f5f5f5'}}}}
  });
}

function initTransaction() {
  initTransactionCharts();

  // Pay method (not date-range dependent)
  const txTotal = parseFloat(DATA[currentRange].overview.k1.val.replace(/<[^>]*>/g,'').replace(/,/g,'')) * (DATA[currentRange].overview.k1.val.includes('万')?10000:1) || 12916;
  const payAmts = [55,32,11,2].map(p=>Math.round(txTotal*p/100));
  makeChart('payMethodChart', {
    type:'doughnut',
    data:{labels:['微信支付','支付宝','现金','其他'], datasets:[{data:[55,32,11,2], amounts:payAmts, backgroundColor:['#1088C3','#83BFF4','#FFB86C','#CAAED8'], borderWidth:3, borderColor:'#fff'}]},
    options:{responsive:true, maintainAspectRatio:false, cutout:'50%', layout:{padding:50}, _outerLabels:true, plugins:{
      legend:{display:false},
      tooltip:{callbacks:{label:c=>'¥'+c.dataset.amounts[c.dataIndex].toLocaleString()+' ('+c.raw+'%)'}},
      datalabels:{display:false}
    }}
  });

  // tx table
  const orders = [
    {time:'10:32',no:'TX20260527001',goods:'土豆×3 西红柿×2',orig:'¥38.60',disc:'-¥3.00',final:'¥35.60',pay:'微信',status:'已完成'},
    {time:'10:28',no:'TX20260527002',goods:'鸡蛋×2 猪肉500g',orig:'¥72.80',disc:'-¥10.00',final:'¥62.80',pay:'微信',status:'已完成'},
    {time:'10:15',no:'TX20260527003',goods:'苹果×5 香蕉×2',orig:'¥52.00',disc:'-¥4.00',final:'¥48.00',pay:'支付宝',status:'已完成'},
    {time:'09:58',no:'TX20260527004',goods:'大米5kg',orig:'¥42.50',disc:'-¥4.00',final:'¥38.50',pay:'现金',status:'已完成'},
    {time:'09:42',no:'TX20260527005',goods:'鲫鱼×1 豆腐×2',orig:'¥58.20',disc:'-¥3.00',final:'¥55.20',pay:'微信',status:'已完成'},
    {time:'09:30',no:'TX20260527006',goods:'黄瓜×3 胡萝卜×4',orig:'¥24.40',disc:'-¥2.00',final:'¥22.40',pay:'支付宝',status:'已退款'},
    {time:'09:18',no:'TX20260527007',goods:'猪排×2 葱×1',orig:'¥88.00',disc:'-¥10.00',final:'¥78.00',pay:'微信',status:'已完成'},
    {time:'09:02',no:'TX20260527008',goods:'白菜×2 蒜×3',orig:'¥20.60',disc:'-¥2.00',final:'¥18.60',pay:'现金',status:'已完成'},
    {time:'08:55',no:'TX20260527009',goods:'草莓×1盒',orig:'¥36.00',disc:'-¥4.00',final:'¥32.00',pay:'支付宝',status:'待处理'},
    {time:'08:40',no:'TX20260527010',goods:'土豆×5',orig:'¥27.00',disc:'-¥2.00',final:'¥25.00',pay:'微信',status:'已完成'},
    {time:'08:22',no:'TX20260527011',goods:'青椒×3 茄子×2',orig:'¥33.50',disc:'-¥3.00',final:'¥30.50',pay:'微信',status:'已完成'},
    {time:'08:08',no:'TX20260527012',goods:'牛肉500g 洋葱×2',orig:'¥68.00',disc:'-¥8.00',final:'¥60.00',pay:'微信',status:'已完成'},
    {time:'07:55',no:'TX20260527013',goods:'牛奶×2 面包×3',orig:'¥45.80',disc:'-¥5.00',final:'¥40.80',pay:'支付宝',status:'已完成'},
    {time:'07:40',no:'TX20260527014',goods:'西瓜×1',orig:'¥28.00',disc:'-¥3.00',final:'¥25.00',pay:'现金',status:'已完成'},
    {time:'07:22',no:'TX20260527015',goods:'芹菜×2 生姜×3',orig:'¥22.40',disc:'-¥2.00',final:'¥20.40',pay:'微信',status:'已完成'},
  ];
  const statusMap = {'已完成':'badge-green','已退款':'badge-red','待处理':'badge-orange'};
  const payMap = {'微信':'badge-green','支付宝':'badge-blue','现金':'badge-gray'};
  const tbody = document.querySelector('#txTable tbody');
  tbody.innerHTML = '';
  orders.forEach(o => {
    tbody.innerHTML += `<tr><td>${o.time}</td><td style="font-size:11px;color:#999">${o.no}</td><td>${o.orig}</td><td style="color:#e65100">${o.disc}</td><td><b>${o.final}</b></td><td><span class="badge ${payMap[o.pay]}">${o.pay}</span></td><td><span class="badge ${statusMap[o.status]}">${o.status}</span></td></tr>`;
  });

  // Discount type chart
  const discTotalStr = DATA[currentRange].overview.k5.val.replace(/<[^>]*>/g,'').replace(/,/g,'');
  const discTotal = parseFloat(discTotalStr) * (discTotalStr.includes('万')?10000:1) || 1285;
  const discAmts = [45,25,18,12].map(p=>Math.round(discTotal*p/100));
  makeChart('discountTypeChart', {
    type:'doughnut',
    data:{labels:['会员价差额','优惠券','积分抵扣','价格优惠'], datasets:[{data:[45,25,18,12], amounts:discAmts, backgroundColor:['#1088C3','#FFB86C','#3EB27E','#9E61C1'], borderWidth:2, borderColor:'#fff'}]},
    options:{responsive:true, cutout:'50%', layout:{padding:50}, _outerLabels:true, plugins:{
      legend:{display:false}, title:{display:true, text:'优惠总额 ¥'+discAmts.reduce((a,b)=>a+b,0).toLocaleString(), position:'bottom', font:{size:12}},
      tooltip:{callbacks:{label:c=>'¥'+c.dataset.amounts[c.dataIndex].toLocaleString()+' ('+c.raw+'%)'}},
      datalabels:{display:false}
    }}
  });

  // Price chain chart
  makeChart('priceChainChart', {
    type:'bar',
    data:{
      labels:['蔬菜','水果','肉类','水产','粮油'],
      datasets:[
        {label:'原价总额', data:[10200,6600,5400,3600,2400], backgroundColor:'#1088C3', borderRadius:4},
        {label:'销售价总额', data:[9690,6138,4914,3348,2280], backgroundColor:'#3EB27E', borderRadius:4},
        {label:'成交价总额(营业额)', data:[8670,5610,4590,3060,2040], backgroundColor:'#83BFF4', borderRadius:4},
      ]
    },
    options:{responsive:true, plugins:{legend:{position:'top'}}, scales:{x:{grid:{display:false}}, y:{ticks:{callback:v=>'¥'+v.toLocaleString()}, grid:{color:'#f5f5f5'}}}}
  });
}

// ===== PRODUCT PAGE =====
function initProduct() {
  console.log('[initProduct] called, currentRange =', currentRange);
  var d = DATA[currentRange] || DATA.today;
  var pd = (d && d.productData) ? d.productData : DATA.today.productData;
  if (!pd || !pd.products) { console.warn('[initProduct] productData missing'); return; }

  var products = pd.products;
  var sales = pd.sales;
  var qty = pd.qty;
  var cats = pd.cats;
  var origPrices = pd.origPrices;
  var memberPrices = pd.memberPrices;
  var finalPrices = pd.finalPrices;
  var margins = pd.margins;

  // KPI 随周期变化
  var kpiMap = {
    today: { sku: 428, skuChg: '▲ 新增 15 个', kind: 203, kindChg: '▲ 今日已售', dead: 23, turn: 4.2 },
    week:  { sku: 435, skuChg: '▲ 新增 42 个', kind: 208, kindChg: '▲ 本周已售', dead: 19, turn: 4.0 },
    month: { sku: 452, skuChg: '▲ 新增 128 个', kind: 215, kindChg: '▲ 本月已售', dead: 21, turn: 4.3 },
    year:  { sku: 486, skuChg: '▲ 新增 620 个', kind: 238, kindChg: '▲ 本年已售', dead: 18, turn: 4.1 }
  };
  var k = kpiMap[currentRange] || kpiMap.today;
  var setHtml = function(sel, html) { var el = document.querySelector(sel); if (el) el.innerHTML = html; };
  setHtml('#kpiSku .kpi-value', k.sku + '<span>个</span>');
  setHtml('#kpiSku .kpi-change', k.skuChg);
  setHtml('#kpiKind .kpi-value', k.kind + '<span>种</span>');
  setHtml('#kpiKind .kpi-change', k.kindChg);
  setHtml('#kpiDead .kpi-value', k.dead + '<span>个</span>');
  setHtml('#kpiTurn .kpi-value', k.turn + '<span>天</span>');

  if (typeof Chart === 'undefined') return;

  try {
    var bgColors = products.map(function(_, i) { return i < 3 ? '#1088C3' : '#83BFF4'; });

    // Top10 bar — update in-place for smooth transition; only create if first time
    var topCanvas = document.getElementById('productTopChart');
    if (window._productTopChart) {
      window._productTopChart.data.labels = products;
      window._productTopChart.data.datasets[0].data = sales;
      window._productTopChart.data.datasets[0].backgroundColor = bgColors;
      window._productTopChart.update('active');
    } else {
      window._productTopChart = new Chart(topCanvas, {
        type: 'bar',
        data: {
          labels: products,
          datasets: [{
            label: '营业额（元）',
            data: sales,
            backgroundColor: bgColors,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          animation: { duration: 500 },
          plugins: { legend: { display: false }, datalabels: { display: false } },
          scales: { x: { ticks: { callback: function(v) { return '¥' + v; } }, grid: { color: '#f5f5f5' } }, y: { grid: { display: false } } }
        }
      });
    }

    // Bubble chart — update each dataset in-place (same objects, Chart.js can tween smoothly)
    var maxSales = Math.max.apply(null, sales);
    var maxR = 30;

    if (window._productBubbleChart) {
      var chart = window._productBubbleChart;
      for (var j = 0; j < 8; j++) {
        var ds = chart.data.datasets[j];
        ds.label = products[j];
        ds.data[0] = {
          x: qty[j] || randBetween(50, 300),
          y: parseFloat(margins[j]) || randFloat(15, 45),
          r: Math.max(4, Math.min(maxR, sales[j] / maxSales * maxR))
        };
        ds.backgroundColor = MULTI_PALETTE[j % 7] + '99';
        ds.borderColor = MULTI_PALETTE[j % 7];
      }
      chart.update('active');
    } else {
      var initDatasets = products.slice(0, 8).map(function(n, i) {
        return {
          label: n,
          data: [{
            x: qty[i] || randBetween(50, 300),
            y: parseFloat(margins[i]) || randFloat(15, 45),
            r: Math.max(4, Math.min(maxR, sales[i] / maxSales * maxR))
          }],
          backgroundColor: MULTI_PALETTE[i % 7] + '99',
          borderColor: MULTI_PALETTE[i % 7]
        };
      });
      window._productBubbleChart = new Chart(document.getElementById('productBubbleChart'), {
        type: 'bubble',
        data: { datasets: initDatasets },
        options: {
          responsive: true,
          animation: { duration: 500 },
          scales: {
            x: { title: { display: true, text: '日均销量(个)' }, grid: { color: '#f5f5f5' } },
            y: { title: { display: true, text: '毛利率(%)' }, ticks: { callback: function(v) { return v + '%'; } }, grid: { color: '#f5f5f5' } }
          },
          plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } }
        }
      });
    }
  } catch(e) { console.warn('initProduct charts failed:', e); }

  var tbody = document.querySelector('#productTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    products.forEach(function(p, i) {
      tbody.innerHTML += '<tr>' +
        '<td><span class="rank-num ' + (i < 3 ? 'top3' : 'other') + '" style="display:inline-flex">' + (i + 1) + '</span></td>' +
        '<td><b>' + p + '</b></td><td><span class="badge badge-green">' + cats[i] + '</span></td>' +
        '<td style="color:#999;text-decoration:line-through">' + origPrices[i] + '</td>' +
        '<td style="color:#005CF5">' + memberPrices[i] + '</td>' +
        '<td><b>' + finalPrices[i] + '</b></td><td>' + qty[i] + '</td><td><b>¥' + sales[i].toLocaleString() + '</b></td>' +
        '<td>' + margins[i] + '</td>' +
      '</tr>';
    });
  }
}

// ===== CATEGORY PAGE =====
function initCategory() {
  const catMonths = months;
  const cats = ['蔬菜','水果','肉禽','水产','粮油','其他'];
  const catData = [
    [52000,58000,61000,67000,72000], [32000,35000,38000,42000,45000],
    [28000,31000,29000,33000,36000], [18000,20000,22000,25000,24000],
    [10000,11000,12000,13000,14000], [6000,7000,8000,7500,9000],
  ];
  makeChart('catBarChart', {
    type:'bar',
    data:{labels:catMonths, datasets: cats.map((c,i)=>({label:c, data:catData[i], backgroundColor:MULTI_PALETTE[i]+'cc', borderRadius:4}))},
    options:{responsive:true, plugins:{legend:{position:'top'}}, scales:{x:{stacked:true}, y:{stacked:true, ticks:{callback:v=>'¥'+(v/10000).toFixed(0)+'万'}, grid:{color:'#f5f5f5'}}}}
  });

  makeChart('catPieChart', {
    type:'doughnut',
    data:{labels:cats, datasets:[{data:[35,22,18,12,8,5], backgroundColor:MULTI_PALETTE, borderWidth:2, borderColor:'#fff'}]},
    options:{responsive:true, cutout:'55%', layout:{padding:55}, _outerLabels:true, plugins:{legend:{display:false}, datalabels:{display:false}}}
  });

  makeChart('catRadarChart', {
    type:'radar',
    data:{labels:cats, datasets:[
      {label:'营业额指数', data:[95,70,65,48,38,22], borderColor:'#1088C3', backgroundColor:'rgba(16,136,195,0.1)', borderWidth:2, pointRadius:3},
      {label:'毛利指数', data:[80,90,55,75,30,40], borderColor:'#3EB27E', backgroundColor:'rgba(62,178,126,0.1)', borderWidth:2, pointRadius:3},
      {label:'订单量指数', data:[98,65,60,42,50,28], borderColor:'#FFB86C', backgroundColor:'rgba(255,184,108,0.1)', borderWidth:2, pointRadius:3},
    ]},
    options:{responsive:true, scales:{r:{min:0, max:100, grid:{color:'#e0e0e0'}}}}
  });
}

// ===== TREND PAGE =====
function initTrend() {
  const allMonths = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const data2025 = [18.2,17.5,22.1,24.8,26.3,28.5,30.2,29.8,27.6,31.2,32.5,35.8];
  const data2026 = [20.1,19.8,24.5,26.2,28.6,null,null,null,null,null,null,null];
  makeChart('trendYearChart', {
    type:'line',
    data:{labels:allMonths, datasets:[
      {label:'2026年', data:data2026, borderColor:'#005CF5', backgroundColor:'rgba(0,92,245,0.08)', borderWidth:3, fill:true, tension:0.4, pointRadius:4},
      {label:'2025年', data:data2025, borderColor:'#9e9e9e', borderDash:[5,5], borderWidth:2, fill:false, tension:0.4, pointRadius:3},
    ]},
    options:{responsive:true, scales:{y:{ticks:{callback:v=>v+'万'}, grid:{color:'#f5f5f5'}}}, plugins:{legend:{position:'top'}}}
  });

  const weeks = Array.from({length:12},(_,i)=>`第${i+1}周`);
  makeChart('trendWeekChart', {
    type:'line',
    data:{labels:weeks, datasets:[
      {label:'周交易额(原价)', data:weeks.map(()=>randBetween(60000,92000)), borderColor:'#005CF5', backgroundColor:'rgba(0,92,245,0.1)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:3},
      {label:'周营业额', data:weeks.map(()=>randBetween(52000,80000)), borderColor:'#3EB27E', backgroundColor:'rgba(62,178,126,0.05)', fill:true, tension:0.4, borderWidth:1.5, pointRadius:2, borderDash:[4,4]},
    ]},
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:v=>'¥'+(v/10000).toFixed(1)+'万'}, grid:{color:'#f5f5f5'}}}}
  });

  makeChart('trendHolidayChart', {
    type:'bar',
    data:{
      labels:['元旦','春节','元宵','清明','劳动节','端午','中秋','国庆'],
      datasets:[{label:'销售倍数', data:[1.8,3.2,2.1,1.6,2.5,1.9,2.8,3.5], backgroundColor:['#3EB27E','#1088C3','#3EB27E','#83BFF4','#1088C3','#3EB27E','#FFB86C','#FF7500'], borderRadius:6}]
    },
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, title:{display:true,text:'倍数（vs普通日）'}, grid:{color:'#f5f5f5'}}}}
  });
}

// ===== PROFIT PAGE =====
function initProfitCharts() {
  const d = DATA[currentRange];

  // Waterfall
  makeChart('profitWaterfallChart', {
    type:'bar',
    data:{
      labels:['交易额(原价)','−当期退款','−优惠金额','=营业额','−跨期退款','=营收','−采购成本','−损耗','=毛利润','−人力','−租金水电','=净利润'],
      datasets:[{label:'金额（万元）', data:d.waterfallData, backgroundColor:['#1088C3','#FF9193','#FFB86C','#3EB27E','#CAAED8','#83BFF4','#F35352','#FF9193','#3EB27E','#FFB86C','#FF7500','#9E61C1'], borderRadius:4}]
    },
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:v=>v+'万'}, grid:{color:'#f5f5f5'}}}}
  });
}

function initProfit() {
  initProfitCharts();

  const profitMonths = months;
  makeChart('profitTrendChart', {
    type:'line',
    data:{labels:profitMonths, datasets:[
      {label:'毛利润', data:[72000,75000,80000,82000,85800], borderColor:'#1088C3', backgroundColor:'rgba(16,136,195,0.1)', fill:true, tension:0.4, borderWidth:2.5},
      {label:'净利润', data:[36000,38000,40000,41000,43000], borderColor:'#3EB27E', backgroundColor:'rgba(62,178,126,0.1)', fill:true, tension:0.4, borderWidth:2.5},
    ]},
    options:{responsive:true, scales:{y:{ticks:{callback:v=>'¥'+(v/10000).toFixed(1)+'万'}, grid:{color:'#f5f5f5'}}}, plugins:{legend:{position:'top'}}}
  });

  const cats = ['蔬菜','水果','肉禽','水产','粮油','其他'];
  const margins = [28.5,35.6,22.4,40.1,15.3,30.2];
  makeChart('profitCatChart', {
    type:'bar',
    data:{labels:cats, datasets:[{label:'毛利率(%)', data:margins, backgroundColor:margins.map(v=>v>30?'#1088C3':v>20?'#3EB27E':'#83BFF4'), borderRadius:6}]},
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:v=>v+'%'}, max:50, grid:{color:'#f5f5f5'}}}}
  });

  const profitRank = [{name:'水果',val:'¥30,245',pct:100},{name:'蔬菜',val:'¥28,128',pct:93},{name:'水产',val:'¥13,657',pct:45},{name:'肉禽',val:'¥11,429',pct:38},{name:'粮油',val:'¥4,614',pct:15},{name:'其他',val:'¥2,706',pct:9}];
  const list = document.getElementById('profitRankList');
  list.innerHTML = '';
  profitRank.forEach((p,i) => {
    const isTop3 = i < 3;
    list.innerHTML += `<li class="rank-item">
      <div class="rank-row">
        <div class="rank-num ${isTop3?'top3':'other'}">${i+1}</div>
        <div class="rank-name">${p.name}</div>
        <div class="rank-value">${p.val}</div>
      </div>
      <div class="rank-bar-row">
        <div class="rank-bar"><div class="rank-bar-fill" style="width:${p.pct}%"></div></div>
      </div>
    </li>`;
  });
}

// ===== COST PAGE =====
function initCost() {
  makeChart('costPieChart', {
    type:'doughnut',
    data:{labels:['采购成本','人力成本','租金','损耗','水电','其他'], datasets:[{data:[76.8,10.8,5.8,5.5,1.9,1.2], backgroundColor:MULTI_PALETTE, borderWidth:2, borderColor:'#fff'}]},
    options:{responsive:true, cutout:'55%', layout:{padding:55}, _outerLabels:true, plugins:{legend:{display:false}, datalabels:{display:false}}}
  });

  makeChart('costTrendChart', {
    type:'line',
    data:{labels:months, datasets:[
      {label:'采购成本', data:[185000,190000,198000,202000,200000], borderColor:'#F35352', fill:false, tension:0.4, borderWidth:2},
      {label:'总运营成本', data:[245000,252000,258000,262000,260000], borderColor:'#FFB86C', fill:false, tension:0.4, borderWidth:2},
    ]},
    options:{responsive:true, scales:{y:{ticks:{callback:v=>'¥'+(v/10000).toFixed(1)+'万'}, grid:{color:'#f5f5f5'}}}, plugins:{legend:{position:'top'}}}
  });

  const lossData = [
    {cat:'叶菜类', rate:18.5, color:'#fc4b52'}, {cat:'根茎类', rate:8.2, color:'#005CF5'},
    {cat:'水果类', rate:12.3, color:'#e65100'}, {cat:'肉禽类', rate:4.1, color:'#005CF5'},
    {cat:'水产类', rate:9.8, color:'#0277bd'}, {cat:'豆腐类', rate:22.6, color:'#fc4b52'},
  ];
  const div = document.getElementById('lossRateList');
  div.innerHTML = '';
  lossData.forEach(d => {
    div.innerHTML += `<div class="progress-row">
      <div class="progress-label">${d.cat}</div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${d.rate/25*100}%;background:${d.color}"></div></div>
      <div class="progress-val" style="color:${d.color}">${d.rate}%</div>
    </div>`;
  });
}

// ===== MEMBER PAGE =====
function initMember() {
  makeChart('memberGrowthChart', {
    type:'line',
    data:{labels:months, datasets:[
      {label:'累计会员', data:[2450,2560,2648,2709,2847], borderColor:'#1088C3', backgroundColor:'rgba(16,136,195,0.1)', fill:true, tension:0.4, borderWidth:2.5},
      {label:'活跃会员', data:[980,1020,1080,1150,1203], borderColor:'#FFB86C', fill:false, tension:0.4, borderWidth:2, borderDash:[4,4]},
    ]},
    options:{responsive:true, scales:{y:{grid:{color:'#f5f5f5'}}}, plugins:{legend:{position:'top'}}}
  });

  makeChart('memberLevelChart', {
    type:'doughnut',
    data:{labels:['普通会员','银卡','金卡','铂金卡','黑金卡'], datasets:[{data:[45,28,16,8,3], backgroundColor:['#CAAED8','#83BFF4','#FFB86C','#FF7500','#9E61C1'], borderWidth:2, borderColor:'#fff'}]},
    options:{responsive:true, cutout:'55%', layout:{padding:55}, _outerLabels:true, plugins:{legend:{display:false}, datalabels:{display:false}}}
  });

  makeChart('memberFreqChart', {
    type:'bar',
    data:{labels:['月1次','月2-3次','每周1次','每周2-3次','几乎每天'], datasets:[{label:'会员人数', data:[680,520,480,390,280], backgroundColor:GREEN_PALETTE.slice(0,5).reverse(), borderRadius:5}]},
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{grid:{color:'#f5f5f5'}}}}
  });

  const rfmSegments = [
    {label:'💎 高价值客户', count:280, desc:'高频高额，近期活跃', color:'#F0F6FF', border:'#005CF5'},
    {label:'🌟 潜力客户', count:420, desc:'消费额高但频次低', color:'#e3f2fd', border:'#0277bd'},
    {label:'⚠️ 流失风险', count:360, desc:'近期未消费，需召回', color:'#fff3e0', border:'#ff8f00'},
    {label:'😴 沉睡客户', count:240, desc:'长期未消费', color:'#ffebee', border:'#fc4b52'},
    {label:'🆕 新客户', count:138, desc:'本月新注册', color:'#f3e5f5', border:'#6a1b9a'},
    {label:'📈 成长型', count:510, desc:'频次逐步提升', color:'#F0F6FF', border:'#43a047'},
  ];
  const grid = document.getElementById('rfmGrid');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px';
  grid.innerHTML = '';
  rfmSegments.forEach(s => {
    grid.innerHTML += `<div style="background:${s.color};border:1px solid ${s.border};border-radius:8px;padding:10px 12px">
      <div style="font-size:12px;font-weight:700;color:${s.border}">${s.label}</div>
      <div style="font-size:20px;font-weight:700;margin:4px 0">${s.count}<span style="font-size:12px;font-weight:400;color:#999">人</span></div>
      <div style="font-size:11px;color:#666">${s.desc}</div>
    </div>`;
  });
}

// ===== INVENTORY PAGE =====
function initInventory() {
  const cats = ['蔬菜','水果','肉禽','水产','粮油','其他'];
  makeChart('invTurnChart', {
    type:'bar',
    data:{labels:cats, datasets:[{label:'库存周转天数', data:[2.1,3.5,4.2,3.8,18.5,7.2], backgroundColor:cats.map((_,i)=>[2.1,3.5,4.2,3.8,18.5,7.2][i]>10?'#F35352':'#3EB27E'), borderRadius:5}]},
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{title:{display:true,text:'天'}, grid:{color:'#f5f5f5'}}}}
  });

  makeChart('invLevelChart', {
    type:'doughnut',
    data:{labels:['充足(>150%)','正常(80-150%)','偏低(50-80%)','告急(<50%)'], datasets:[{data:[42,35,15,8], backgroundColor:['#1088C3','#3EB27E','#FFB86C','#F35352'], borderWidth:2, borderColor:'#fff'}]},
    options:{responsive:true, cutout:'55%', layout:{padding:55}, _outerLabels:true, plugins:{legend:{display:false}, datalabels:{display:false}}}
  });

  const invItems = [
    {name:'土豆', cat:'蔬菜', cur:'8kg', safe:'20kg', daily:'12kg', days:'<1天', status:'告急'},
    {name:'鸡蛋', cat:'禽蛋', cur:'50个', safe:'200个', daily:'80个', days:'<1天', status:'告急'},
    {name:'猪肉', cat:'肉禽', cur:'3kg', safe:'15kg', daily:'8kg', days:'<1天', status:'告急'},
    {name:'白菜', cat:'蔬菜', cur:'15kg', safe:'25kg', daily:'10kg', days:'1.5天', status:'偏低'},
    {name:'苹果', cat:'水果', cur:'20kg', safe:'30kg', daily:'8kg', days:'2.5天', status:'偏低'},
    {name:'西红柿', cat:'蔬菜', cur:'18kg', safe:'20kg', daily:'12kg', days:'1.5天', status:'偏低'},
    {name:'大米', cat:'粮油', cur:'50kg', safe:'40kg', daily:'5kg', days:'10天', status:'充足'},
    {name:'香蕉', cat:'水果', cur:'25kg', safe:'20kg', daily:'6kg', days:'4天', status:'正常'},
  ];
  const statusBadge = {'告急':'badge-red','偏低':'badge-orange','正常':'badge-blue','充足':'badge-green'};
  const tbody = document.querySelector('#invTable tbody');
  tbody.innerHTML = '';
  invItems.forEach(r => {
    tbody.innerHTML += `<tr><td><b>${r.name}</b></td><td>${r.cat}</td><td><b style="color:${r.status==='告急'?'#fc4b52':r.status==='偏低'?'#e65100':'#005CF5'}">${r.cur}</b></td><td>${r.safe}</td><td>${r.daily}</td><td>${r.days}</td><td><span class="badge ${statusBadge[r.status]}">${r.status}</span></td></tr>`;
  });
}

// ===== 经营统计 + 销售统计 =====
const statsCharts = {};
const STATS_CAT_COLORS = ['#1088C3','#FF7500','#83BFF4','#FFB86C','#3EB27E','#9E61C1','#CAAED8'];
const STATS_PAY_MAP = {'微信支付':'stats-badge-green','支付宝':'stats-badge-blue','现金':'stats-badge-gray'};
const STATS_STATUS_MAP = {'已完成':'stats-badge-green','已退款':'stats-badge-red','进行中':'stats-badge-blue','待处理':'stats-badge-orange'};

function statsMakeChart(id, cfg) {
  if (typeof Chart === 'undefined') return null;
  try {
    if (statsCharts[id]) statsCharts[id].destroy();
    statsCharts[id] = new Chart(document.getElementById(id), cfg);
    return statsCharts[id];
  } catch(e) { console.warn('Stats chart init failed:', id, e); return null; }
}

function destroyStatsCharts() {
  Object.values(statsCharts).forEach(c => { if (c && c.destroy) c.destroy(); });
  for (const k in statsCharts) delete statsCharts[k];
}

function initBizStats() {
  var d = STATS_DATA[currentRange];
  destroyStatsCharts();
  // KPI cards: 营业额, 订单量, 销售量, 客单价
  var bizKPIs = [d.kpi[0], d.kpi[1], d.kpi[4], d.kpi[2]]; // 营业额, 订单数, 销售量, 客单价
  var kpiCards = bizKPIs.map(function(k) {
    return '<div class="kpi-card"><div class="kpi-label">'+k.lbl+'</div><div class="kpi-value">'+k.val+'</div><div class="kpi-change '+(k.up?'up':'down')+'">'+k.chg+' '+d.compareLabel+'</div></div>';
  }).join('');

  var h = '<div class="kpi-grid" style="margin-bottom:8px">'+kpiCards+'</div>'+
    '<div class="stats-grid-2">'+
      '<div class="stats-panel">'+
        '<div class="stats-panel-header"><div><div class="stats-panel-title">营业额 &amp; 订单量趋势</div></div></div>'+
        '<div class="chart-wrap" style="padding:8px 12px"><canvas id="statsBizTrend" height="260"></canvas></div>'+
      '</div>'+
      '<div class="stats-panel">'+
        '<div class="stats-panel-header"><div><div class="stats-panel-title">订单状态分布</div></div></div>'+
        '<div class="chart-wrap" style="padding:8px 12px"><canvas id="statsBizStatus" height="260"></canvas></div>'+
      '</div>'+
      '<div class="stats-panel">'+
        '<div class="stats-panel-header"><div><div class="stats-panel-title">品类营收占比</div></div></div>'+
        '<div class="doughnut-wrap" style="position:relative;min-height:240px">'+
          '<canvas id="statsBizCat"></canvas>'+
          '<div id="statsBizCatLegend" class="doughnut-legend" style="position:absolute;right:8px;bottom:12px;z-index:2;background:rgba(255,255,255,0.92);padding:4px 6px;border-radius:6px"></div>'+
        '</div>'+
      '</div>'+
      '<div class="stats-panel">'+
        '<div class="stats-panel-header"><div><div class="stats-panel-title">销售量趋势</div></div></div>'+
        '<div class="chart-wrap" style="padding:8px 12px"><canvas id="statsBizVol" height="260"></canvas></div>'+
      '</div>'+
    '</div>';
  document.getElementById('bizStatsContent').innerHTML = h;

  // 营业额 & 订单量双轴趋势图
  statsMakeChart('statsBizTrend', {
    type:'line',
    data:{labels:d.trendLabels, datasets:[
      {label:'营业额(元)',data:d.trendRev,borderColor:'#1088C3',backgroundColor:'rgba(16,136,195,0.08)',fill:true,tension:0.4,borderWidth:2.5,pointRadius:5,pointBackgroundColor:'#1088C3'},
      {label:'订单数(单)',data:d.trendOrders,borderColor:'#3EB27E',backgroundColor:'rgba(62,178,126,0.06)',fill:true,tension:0.4,borderWidth:2,pointRadius:4,pointBackgroundColor:'#3EB27E',borderDash:[4,3],yAxisID:'y1'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      scales:{y:{type:'linear',position:'left',grid:{color:'#f5f5f5'},ticks:{callback:function(v){return '¥'+v.toLocaleString();}}},y1:{type:'linear',position:'right',grid:{drawOnChartArea:false},ticks:{callback:function(v){return v+'单';}}}},
      plugins:{legend:{position:'top',labels:{usePointStyle:true,padding:18}}}
    }
  });

  // 品类营收占比（营收值 + 占比双显）
  var totalRev = parseInt(d.kpi[0].val.replace(/[^0-9]/g,''));
  var catPctSum = d.category.data.reduce(function(a,b){return a+b;},0);
  var catRevenues = d.category.data.map(function(pct){ return Math.round(totalRev * pct / catPctSum); });
  statsMakeChart('statsBizCat', {
    type:'doughnut',
    data:{labels:d.category.labels,datasets:[{data:d.category.data,_revenues:catRevenues,backgroundColor:STATS_CAT_COLORS,borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'55%',layout:{padding:55},_outerLabels:true,
      plugins:{legend:{display:false},datalabels:{display:false},
        tooltip:{callbacks:{label:function(ctx){
          var lbl = d.category.labels[ctx.dataIndex];
          var rev = catRevenues[ctx.dataIndex];
          var pct = d.category.data[ctx.dataIndex];
          return lbl+': ¥'+rev.toLocaleString()+' ('+pct+'%)';
        }}}
      }
    }
  });
  // 品类营收占比图例（右下角，仅 <3% 小品类）
  (function(){
    var legEl = document.getElementById('statsBizCatLegend');
    if (!legEl) return;
    var catPcts = d.category.data.map(function(v){ return Math.round(v / catPctSum * 10000) / 100; });
    var catSorted = d.category.labels.map(function(l,i){ return {name:l, pct:catPcts[i], rev:catRevenues[i], color:STATS_CAT_COLORS[i]}; });
    var smallItems = catSorted.filter(function(c){ return c.pct > 0 && c.pct < 3; });
    if (!smallItems.length) { legEl.innerHTML = ''; return; }
    legEl.innerHTML = smallItems.map(function(c){
      return '<div class="lg-item">'+
        '<span class="lg-dot" style="background:'+c.color+'"></span>'+
        '<span class="lg-name">'+c.name+'</span>'+
        '<span class="lg-val">'+c.pct.toFixed(1)+'% (¥'+c.rev.toLocaleString()+')</span>'+
        '</div>';
    }).join('');
  })();

  // 销售量趋势
  statsMakeChart('statsBizVol', {
    type:'bar',
    data:{labels:d.trendLabels,datasets:[{label:'销售量(件)',data:d.trendSalesVol,backgroundColor:'#83BFF4',borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,
      scales:{y:{grid:{color:'#f5f5f5'},ticks:{callback:function(v){return v+'件';}}}},
      plugins:{legend:{display:false}}
    }
  });

  // 订单状态分布
  statsMakeChart('statsBizStatus', {
    type:'doughnut',
    data:{labels:d.orderStatus.labels,datasets:[{data:d.orderStatus.data,backgroundColor:d.orderStatusColors,borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'52%',layout:{padding:55},_outerLabels:true,
      plugins:{legend:{display:false},datalabels:{display:false}}
    }
  });

  // ---- 多门店时展示各门店数据对比表 ----
  var stores = getSelectedStores();
  if (stores.length > 1) {
    var storeData = generateStoreBizData(d, stores);
    renderStoreBizTable(storeData);
  }
}

// 根据汇总数据 + 门店列表生成各门店模拟数据
function generateStoreBizData(d, stores) {
  var totalRev = parseInt(d.kpi[0].val.replace(/[^0-9]/g,''));
  var totalOrders = parseInt(d.kpi[1].val.replace(/[^0-9]/g,''));
  var totalVolume = parseInt(d.kpi[4].val.replace(/[^0-9]/g,''));
  var avgGrossMargin = parseFloat(d.kpi[3].val);

  // 按门店数量分配权重（平方权重，使门店间有合理差异）
  var weights = [], totalW = 0;
  var i;
  for (i = 0; i < stores.length; i++) { var w = (i + 1) * (i + 1); weights.push(w); totalW += w; }

  // 确定性波动系数（基于索引，不会每次渲染都变）
  var variation = [1.06, 0.91, 1.13, 0.86, 1.02, 0.94, 0.84, 1.09, 0.97];

  return stores.map(function(store, idx) {
    var w = weights[idx] / totalW;
    var v = variation[idx % variation.length];
    var rev = Math.round(totalRev * w * v);
    var orders = Math.round(totalOrders * w * v);
    var volume = Math.round(totalVolume * w * v);
    var avg = Math.round(rev / Math.max(orders, 1) * 10) / 10;
    var margin = Math.max(18, Math.min(38, avgGrossMargin + (v - 1) * 15));
    margin = Math.round(margin * 10) / 10;

    // 微调使汇总接近原始值
    return { name: store.name, revenue: rev, orders: orders, volume: volume, avgOrder: avg, margin: margin.toFixed(1) };
  });
}

// 渲染多门店经营数据对比表
function renderStoreBizTable(storeData) {
  // 构建表格行
  var rows = storeData.map(function(s, i) {
    return '<tr>'+
      '<td><span class="store-rank-badge">'+(i+1)+'</span> '+s.name+'</td>'+
      '<td class="text-right" style="font-weight:600;color:var(--primary-dark)">¥'+s.revenue.toLocaleString()+'</td>'+
      '<td class="text-right">'+s.orders+'单</td>'+
      '<td class="text-right">'+s.volume+'件</td>'+
      '<td class="text-right">¥'+s.avgOrder+'</td>'+
      '<td class="text-right" style="font-weight:600">'+s.margin+'%</td>'+
      '</tr>';
  }).join('');

  var tableHTML = ''+
    '<div class="chart-card" style="margin-top:8px">'+
      '<div class="chart-header">'+
        '<div><div class="chart-title">📊 各门店经营数据对比</div></div>'+
      '</div>'+
      '<div class="table-wrap">'+
        '<table>'+
          '<thead><tr>'+
            '<th>门店</th>'+
            '<th class="text-right">营业额</th>'+
            '<th class="text-right">订单数</th>'+
            '<th class="text-right">销售量</th>'+
            '<th class="text-right">客单价</th>'+
            '<th class="text-right">毛利率</th>'+
          '</tr></thead>'+
          '<tbody>'+rows+'</tbody>'+
        '</table>'+
      '</div>'+
    '</div>';

  document.getElementById('bizStatsContent').insertAdjacentHTML('beforeend', tableHTML);
}

// ===== SALES STATS STATE =====
var STATS_DIM = 'sales'; // 'sales' | 'qty' — 统御所有图表的维度
var STATS_SORT_COL = 'sales'; // 'sales' | 'qty' — 表格当前排序列
var STATS_SORT_DIR = 'desc'; // 'desc' | 'asc'
var STATS_CAT_FILTER = '全部';
var STATS_PAGE = 1;
var STATS_PAGE_SIZE = 15;
var PRODUCT_DETAIL_TARGET = null; // {name, cat, qty, sales, cost, margin, rate}

function initSalesStats() {
  console.log('[initSalesStats] called, currentRange =', currentRange, 'd =', STATS_DATA[currentRange] ? 'OK' : 'MISSING');
  // 防御：确保 currentRange 命中的 key 存在
  var d = STATS_DATA[currentRange];
  if (!d || !d.topProducts) {
    console.warn('[initSalesStats] No data for range:', currentRange, 'falling back to today');
    d = STATS_DATA.today;
    if (!d) return;
  }
  destroyStatsCharts();

  // ---- KPI 汇总 ----
  var allProducts = d.topProducts;
  var totalSales = allProducts.reduce(function(s,p){return s+p.sales;},0);
  var totalQty   = allProducts.reduce(function(s,p){return s+p.qty;},0);
  var kpiHTML = '<div class="kpi-grid kpi-grid-3" style="margin-bottom:8px">'+
    '<div class="kpi-card"><div class="kpi-label">商品种数</div><div class="kpi-val">'+allProducts.length+'种</div></div>'+
    '<div class="kpi-card"><div class="kpi-label">销售总额</div><div class="kpi-val" style="color:var(--accent)">¥'+totalSales.toLocaleString()+'</div></div>'+
    '<div class="kpi-card"><div class="kpi-label">销售总量</div><div class="kpi-val">'+totalQty+'件</div></div>'+
    '</div>';

  // ---- Rate lookup from productDetail ----
  var rateMap = {};
  if (d.productDetail && d.productDetail.length) {
    d.productDetail.forEach(function(p){ rateMap[p.name] = p.rate || '--'; });
  }

  // ---- Top 5 chart (统一维度，单图) ----
  var top5Base = d.topProducts.slice(0,5);

  // ---- 品类数据 (横柱 + 甜甜圈，无独立切换) ----

  // ---- Ranking table ----
  var cats = ['全部'];
  d.topProducts.forEach(function(p){ if (cats.indexOf(p.cat)===-1) cats.push(p.cat); });
  var catOpts = cats.map(function(c){ return '<option'+(c===STATS_CAT_FILTER?' selected':'')+'>'+c+'</option>'; }).join('');

  var filtered = d.topProducts.filter(function(p){ return STATS_CAT_FILTER==='全部' || p.cat===STATS_CAT_FILTER; });
  filtered.sort(function(a,b){
    var va = STATS_SORT_COL==='sales' ? a.sales : a.qty;
    var vb = STATS_SORT_COL==='sales' ? b.sales : b.qty;
    return STATS_SORT_DIR==='desc' ? vb - va : va - vb;
  });

  var totalFiltered = filtered.length;
  var totalPages = Math.ceil(totalFiltered / STATS_PAGE_SIZE);
  if (STATS_PAGE > totalPages) STATS_PAGE = totalPages || 1;
  var startIdx = (STATS_PAGE - 1) * STATS_PAGE_SIZE;
  var pageItems = filtered.slice(startIdx, startIdx + STATS_PAGE_SIZE);

  var salesArrow = STATS_SORT_COL==='sales' ? (STATS_SORT_DIR==='desc'?'↓':'↑') : '';
  var qtyArrow   = STATS_SORT_COL==='qty'   ? (STATS_SORT_DIR==='desc'?'↓':'↑') : '';

  var rankRows = pageItems.map(function(p,i){
    return '<tr><td>'+(startIdx+i+1)+'</td>'+
      '<td><span class="product-link" onclick="openProductDetail(\''+p.name+'\',\'sales-stats\')">'+p.name+'</span></td>'+
      '<td>'+p.cat+'</td>'+
      '<td class="text-right">'+p.qty+'</td>'+
      '<td class="text-right" style="color:var(--primary);font-weight:600">¥'+p.sales.toLocaleString()+'</td>'+
      '<td class="text-right" style="font-size:12px;color:var(--text-muted)">'+
        '¥'+(p.sales/p.qty).toFixed(2)+
      '</td>'+
      '<td class="text-right res-col">--</td>'+
      '<td class="text-right res-col">--</td>'+
      '<td class="text-right res-col">--</td>'+
      '<td class="text-right res-col">--</td>'+
      '<td class="text-right res-col">--</td>'+
      '<td class="text-right res-col">'+(rateMap[p.name]||'--')+'</td>'+
      '</tr>';
  }).join('');

  // ---- 页面级维度切换 ----
  var dimToggleHTML = '<div class="dim-bar">'+
    '<span class="dim-label">统计维度</span>'+
    '<div class="dim-toggle">'+
      '<button class="dim-btn'+(STATS_DIM==='sales'?' active':'')+'" onclick="switchStatsDim(\'sales\')">按销售额</button>'+
      '<button class="dim-btn'+(STATS_DIM==='qty'?' active':'')+'" onclick="switchStatsDim(\'qty\')">按销量</button>'+
    '</div>'+
    '</div>';

  var top5Title = STATS_DIM==='sales' ? '热销 Top 5 · 销售额' : '热销 Top 5 · 销量';

  // ---- Build HTML ----
  var h =
    // KPI 卡片
    kpiHTML+
    // 统一维度切换
    dimToggleHTML+
    // 第一行：热销 Top 5 + 品类排行 · 占比 并排
    '<div class="stats-grid-2" style="grid-template-columns:3fr 2fr; margin-bottom:8px">'+
      '<div class="stats-panel" style="margin-bottom:0">'+
        '<div class="stats-panel-header">'+
          '<div><div class="stats-panel-title">'+top5Title+'</div></div>'+
        '</div>'+
        '<div id="statsTop5List" class="top5-list"></div>'+
      '</div>'+
      '<div class="stats-panel" style="margin-bottom:0">'+
        '<div class="stats-panel-header">'+
          '<div><div class="stats-panel-title">品类占比</div></div>'+
        '</div>'+
        '<div class="doughnut-wrap" style="position:relative;min-height:240px">'+
          '<canvas id="statsCatDoughnut"></canvas>'+
          '<div id="statsCatLegend" class="doughnut-legend" style="position:absolute;right:8px;bottom:12px;z-index:2;background:rgba(255,255,255,0.92);padding:4px 6px;border-radius:6px"></div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    // 第二行：销售排行表
    '<div class="chart-card" style="margin-bottom:8px">'+
      '<div class="chart-header">'+
        '<div><div class="chart-title">销售排行</div><div class="chart-sub">点击商品名查看明细 · 点击列头排序'+
        (totalFiltered>STATS_PAGE_SIZE ? ' · 共'+totalFiltered+'件商品' : '')+'</div></div>'+
        '<span class="cat-filter">品类：<select onchange="filterStatsCat(this.value)">'+catOpts+'</select></span>'+
      '</div>'+
      '<div class="table-wrap">'+
        '<table><thead><tr><th style="width:40px">#</th><th>商品</th><th>品类</th>'+
        '<th class="text-right sortable" onclick="sortStatsBy(\'qty\')">销量 <span class="sort-arrow'+(STATS_SORT_COL==='qty'?' active':'')+'">'+qtyArrow+'</span></th>'+
        '<th class="text-right sortable" onclick="sortStatsBy(\'sales\')">销售额 <span class="sort-arrow'+(STATS_SORT_COL==='sales'?' active':'')+'">'+salesArrow+'</span></th>'+
        '<th class="text-right">均价</th>'+
        '<th class="text-right res-hd">交易额<sup>预</sup></th>'+
        '<th class="text-right res-hd">价格优惠<sup>预</sup></th>'+
        '<th class="text-right res-hd">商品成本<sup>预</sup></th>'+
        '<th class="text-right res-hd">促销费用<sup>预</sup></th>'+
        '<th class="text-right res-hd">毛利<sup>预</sup></th>'+
        '<th class="text-right res-hd">毛利率<sup>预</sup></th></tr></thead>'+
        '<tbody>'+rankRows+'</tbody></table>'+
      '</div>'+
      (totalFiltered > STATS_PAGE_SIZE ?
        '<div class="pagination-bar">'+
          '<span class="page-info">第 '+(startIdx+1)+'–'+Math.min(startIdx+STATS_PAGE_SIZE,totalFiltered)+' 条 / 共 '+totalFiltered+' 条</span>'+
          '<div class="page-btns">'+
            '<button class="page-btn" onclick="goStatsPage('+(STATS_PAGE-1)+')" '+(STATS_PAGE<=1?'disabled':'')+'>« 上一页</button>'+
            '<span class="page-num">'+STATS_PAGE+' / '+totalPages+'</span>'+
            '<button class="page-btn" onclick="goStatsPage('+(STATS_PAGE+1)+')" '+(STATS_PAGE>=totalPages?'disabled':'')+'>下一页 »</button>'+
          '</div>'+
        '</div>'
      : '')+
    '</div>';

  document.getElementById('salesStatsContent').innerHTML = h;

  // ---- 渲染：热销 Top 5 排名卡片 ----
  var top5Sorted = top5Base.slice().sort(function(a,b){
    return STATS_DIM==='sales' ? b.sales - a.sales : b.qty - a.qty;
  });
  _renderTop5Ranking(top5Sorted);


  // ---- 品类数据 ----
  var catTotal   = d.catSales.data.reduce(function(a,b){return a+b;},0);
  var catQtyData = d.catSales.labels.map(function(l,i){
    var qty = d.topProducts.filter(function(p){return p.cat===l;}).reduce(function(s,p){return s+p.qty;},0);
    return qty;
  });
  var catQtyTotal = catQtyData.reduce(function(a,b){return a+b;},0) || 1;

  var catBarData = d.catSales.labels.map(function(l,i){
    var sales = d.catSales.data[i];
    var qty   = catQtyData[i];
    return {
      name:  l,
      sales: sales,
      qty:   qty,
      salesPct: Math.round(sales / catTotal * 1000) / 10,
      qtyPct:   Math.round(qty   / catQtyTotal * 1000) / 10,
      color: STATS_CAT_COLORS[i]
    };
  });

  var barSorted = catBarData.slice().sort(function(a,b){
    return STATS_DIM === 'sales' ? b.sales - a.sales : b.qty - a.qty;
  });

  // ---- 渲染：品类甜甜圈图 + 图例 ----
  statsMakeChart('statsCatDoughnut', {
    type:'doughnut',
    data:{labels:barSorted.map(function(c){return c.name;}), datasets:[
      {data:barSorted.map(function(c){return STATS_DIM==='sales'?c.sales:c.qty;}),
       backgroundColor:barSorted.map(function(c){return c.color;}),
       borderColor:'#fff',borderWidth:2}
    ]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'55%',layout:{padding:55},_outerLabels:true,
      plugins:{legend:{display:false},datalabels:{display:false},
        tooltip:{callbacks:{label:function(ctx){
          var item = barSorted[ctx.dataIndex];
          var pct = STATS_DIM==='sales' ? item.salesPct : item.qtyPct;
          var val = STATS_DIM==='sales' ? '¥'+item.sales.toLocaleString() : item.qty+'件';
          return item.name+': '+val+' ('+pct+'%)';
        }}}
      }
    }
  });
  var dc = statsCharts['statsCatDoughnut'];
  dc._centerFormat = STATS_DIM==='sales'
    ? function(v){return '¥'+(v/1000).toFixed(1)+'k';}
    : function(v){return v+'件';};
  dc._centerLabel = STATS_DIM==='sales' ? '品类销售总额' : '品类销售总量';
  _renderCatLegend(barSorted);
}

// ---- 热销 Top 5 排名卡片 ----
function _renderTop5Ranking(data) {
  var el = document.getElementById('statsTop5List');
  if (!el || !data.length) return;
  var isSales = STATS_DIM === 'sales';
  var maxVal = data.reduce(function(m, p) { return Math.max(m, isSales ? p.sales : p.qty); }, 0);
  var rankColors = ['#1088C3', '#FF7500', '#3EB27E', '#9E61C1', '#F35352'];
  var barColors  = ['linear-gradient(90deg, #4A7AF7 0%, #83A5F9 100%)', 'linear-gradient(90deg, #4A7AF7 0%, #83A5F9 100%)', 'linear-gradient(90deg, #4A7AF7 0%, #83A5F9 100%)', 'linear-gradient(90deg, #4A7AF7 0%, #83A5F9 100%)', 'linear-gradient(90deg, #4A7AF7 0%, #83A5F9 100%)'];

  el.innerHTML = data.map(function(p, i) {
    var val = isSales ? p.sales : p.qty;
    var pct = maxVal ? Math.round(val / maxVal * 100) : 0;
    return '<div class="top5-row">' +
      '<div class="top5-head">' +
        '<span class="top5-num">' + (i + 1) + '</span>' +
        '<span class="top5-name" onclick="openProductDetail(\'' + p.name + '\',\'sales-stats\')">' + p.name + '</span>' +
        '<span class="top5-val" style="color:#0B1019">' + (isSales ? '¥' + p.sales.toLocaleString() : p.qty + '件') + '</span>' +
      '</div>' +
      '<div class="top5-bar-wrap"><div class="top5-bar" style="width:' + pct + '%;background:' + barColors[i] + '"></div></div>' +
    '</div>';
  }).join('');
}

// ---- 品类甜甜圈图例（仅展示 <3% 的小品类）----
function _renderCatLegend(data) {
  var el = document.getElementById('statsCatLegend');
  if (!el) return;
  var smallItems = data.filter(function(c) {
    var pct = STATS_DIM==='sales' ? c.salesPct : c.qtyPct;
    return pct > 0 && pct < 3;
  });
  if (!smallItems.length) { el.innerHTML = ''; return; }
  el.innerHTML = smallItems.map(function(c){
    var val = STATS_DIM==='sales' ? '¥' + c.sales.toLocaleString() : c.qty + '件';
    var pct = STATS_DIM==='sales' ? c.salesPct : c.qtyPct;
    return '<div class="lg-item">'+
      '<span class="lg-dot" style="background:'+c.color+'"></span>'+
      '<span class="lg-name">'+c.name+'</span>'+
      '<span class="lg-val">'+pct.toFixed(1)+'% ('+val+')</span>'+
      '</div>';
  }).join('');
}

// 统一切换统计维度（销售额 / 销量），仅更新数据和图表，不刷新 DOM 避免闪烁
function switchStatsDim(dim) {
  if (STATS_DIM === dim) return;
  STATS_DIM = dim;
  STATS_SORT_COL = dim;
  STATS_SORT_DIR = 'desc';
  STATS_PAGE = 1;

  // 更新按钮激活态
  var btns = document.querySelectorAll('#salesStatsContent .dim-btn');
  for (var b = 0; b < btns.length; b++) {
    btns[b].classList.toggle('active', btns[b].textContent.indexOf(dim==='sales'?'销售额':'销量') >= 0);
  }

  // 更新热销标题
  var t5Title = document.querySelector('#salesStatsContent .stats-grid-2 .stats-panel:first-child .stats-panel-title');
  if (t5Title) t5Title.textContent = dim === 'sales' ? '热销 Top 5 · 销售额' : '热销 Top 5 · 销量';

  // 更新图表数据（不销毁 canvas）
  _updateStatsCharts();

  // 仅重建表格
  _rebuildStatsTable();
}

// ---- 轻量图表数据更新（不销毁 DOM，无闪烁）----
function _updateStatsCharts() {
  var d = STATS_DATA[currentRange];
  var isSales = STATS_DIM === 'sales';

  // === Top 5 排名卡片 ===
  var top5Sorted = d.topProducts.slice(0, 5).sort(function(a, b) {
    return isSales ? b.sales - a.sales : b.qty - a.qty;
  });
  _renderTop5Ranking(top5Sorted);

  // === 品类甜甜圈图表 ===
  var cat = statsCharts['statsCatDoughnut'];
  if (cat) {
    var catTotal = d.catSales.data.reduce(function(a, b) { return a + b; }, 0);
    var catQtyData = d.catSales.labels.map(function(l, i) {
      return d.topProducts.filter(function(p) { return p.cat === l; }).reduce(function(s, p) { return s + p.qty; }, 0);
    });
    var catQtyTotal = catQtyData.reduce(function(a, b) { return a + b; }, 0) || 1;

    var barSorted = d.catSales.labels.map(function(l, i) {
      var sales = d.catSales.data[i];
      var qty = catQtyData[i];
      return {
        name: l, sales: sales, qty: qty,
        salesPct: Math.round(sales / catTotal * 1000) / 10,
        qtyPct: Math.round(qty / catQtyTotal * 1000) / 10,
        color: STATS_CAT_COLORS[i]
      };
    }).sort(function(a, b) {
      return isSales ? b.sales - a.sales : b.qty - a.qty;
    });

    cat.data.labels = barSorted.map(function(c) { return c.name; });
    cat.data.datasets[0].data = barSorted.map(function(c) { return isSales ? c.sales : c.qty; });
    cat.data.datasets[0].backgroundColor = barSorted.map(function(c) { return c.color; });
    cat.options.plugins.tooltip.callbacks.label = function(ctx) {
      var item = barSorted[ctx.dataIndex];
      var pct = isSales ? item.salesPct : item.qtyPct;
      var val = isSales ? '¥' + item.sales.toLocaleString() : item.qty + '件';
      return item.name + ': ' + val + ' (' + pct + '%)';
    };
    cat._centerFormat = isSales
      ? function(v) { return '¥' + (v / 1000).toFixed(1) + 'k'; }
      : function(v) { return v + '件'; };
    cat._centerLabel = isSales ? '品类销售总额' : '品类销售总量';
    cat.update('none');
    _renderCatLegend(barSorted);
  }
}

// ---- 轻量表格重建（仅改 table 区域，不碰图表）----
function _rebuildStatsTable() {
  var d = STATS_DATA[currentRange];

  var rateMap = {};
  if (d.productDetail && d.productDetail.length) {
    d.productDetail.forEach(function(p) { rateMap[p.name] = p.rate || '--'; });
  }

  // 品类筛选
  var cats = ['全部'];
  d.topProducts.forEach(function(p) { if (cats.indexOf(p.cat) === -1) cats.push(p.cat); });
  var catOpts = cats.map(function(c) { return '<option' + (c === STATS_CAT_FILTER ? ' selected' : '') + '>' + c + '</option>'; }).join('');

  var filtered = d.topProducts.filter(function(p) { return STATS_CAT_FILTER === '全部' || p.cat === STATS_CAT_FILTER; });
  filtered.sort(function(a, b) {
    var va = STATS_SORT_COL === 'sales' ? a.sales : a.qty;
    var vb = STATS_SORT_COL === 'sales' ? b.sales : b.qty;
    return STATS_SORT_DIR === 'desc' ? vb - va : va - vb;
  });

  var totalFiltered = filtered.length;
  var totalPages = Math.ceil(totalFiltered / STATS_PAGE_SIZE);
  if (STATS_PAGE > totalPages) STATS_PAGE = totalPages || 1;
  var startIdx = (STATS_PAGE - 1) * STATS_PAGE_SIZE;
  var pageItems = filtered.slice(startIdx, startIdx + STATS_PAGE_SIZE);

  var salesArrow = STATS_SORT_COL === 'sales' ? (STATS_SORT_DIR === 'desc' ? '↓' : '↑') : '';
  var qtyArrow = STATS_SORT_COL === 'qty' ? (STATS_SORT_DIR === 'desc' ? '↓' : '↑') : '';

  var rankRows = pageItems.map(function(p, i) {
    return '<tr><td>' + (startIdx + i + 1) + '</td>' +
      '<td><span class="product-link" onclick="openProductDetail(\'' + p.name + '\',\'sales-stats\')">' + p.name + '</span></td>' +
      '<td>' + p.cat + '</td>' +
      '<td class="text-right">' + p.qty + '</td>' +
      '<td class="text-right" style="color:var(--primary);font-weight:600">¥' + p.sales.toLocaleString() + '</td>' +
      '<td class="text-right" style="font-size:12px;color:var(--text-muted)">¥' + (p.sales / p.qty).toFixed(2) + '</td>' +
      '<td class="text-right res-col">--</td>' +
      '<td class="text-right res-col">--</td>' +
      '<td class="text-right res-col">--</td>' +
      '<td class="text-right res-col">--</td>' +
      '<td class="text-right res-col">--</td>' +
      '<td class="text-right res-col">' + (rateMap[p.name] || '--') + '</td>' +
      '</tr>';
  }).join('');

  var tableCard = document.querySelector('#salesStatsContent .chart-card');
  if (!tableCard) return;

  tableCard.innerHTML =
    '<div class="chart-header">' +
      '<div><div class="chart-title">销售排行</div><div class="chart-sub">点击商品名查看明细 · 点击列头排序' +
      (totalFiltered > STATS_PAGE_SIZE ? ' · 共' + totalFiltered + '件商品' : '') + '</div></div>' +
      '<span class="cat-filter">品类：<select onchange="filterStatsCat(this.value)">' + catOpts + '</select></span>' +
    '</div>' +
    '<div class="table-wrap">' +
      '<table><thead><tr><th style="width:40px">#</th><th>商品</th><th>品类</th>' +
      '<th class="text-right sortable" onclick="sortStatsBy(\'qty\')">销量 <span class="sort-arrow' + (STATS_SORT_COL === 'qty' ? ' active' : '') + '">' + qtyArrow + '</span></th>' +
      '<th class="text-right sortable" onclick="sortStatsBy(\'sales\')">销售额 <span class="sort-arrow' + (STATS_SORT_COL === 'sales' ? ' active' : '') + '">' + salesArrow + '</span></th>' +
      '<th class="text-right">均价</th>' +
      '<th class="text-right res-hd">交易额<sup>预</sup></th>' +
      '<th class="text-right res-hd">价格优惠<sup>预</sup></th>' +
      '<th class="text-right res-hd">商品成本<sup>预</sup></th>' +
      '<th class="text-right res-hd">促销费用<sup>预</sup></th>' +
      '<th class="text-right res-hd">毛利<sup>预</sup></th>' +
      '<th class="text-right res-hd">毛利率<sup>预</sup></th></tr></thead>' +
      '<tbody>' + rankRows + '</tbody></table>' +
    '</div>' +
    (totalFiltered > STATS_PAGE_SIZE ?
      '<div class="pagination-bar">' +
        '<span class="page-info">第 ' + (startIdx + 1) + '–' + Math.min(startIdx + STATS_PAGE_SIZE, totalFiltered) + ' 条 / 共 ' + totalFiltered + ' 条</span>' +
        '<div class="page-btns">' +
          '<button class="page-btn" onclick="goStatsPage(' + (STATS_PAGE - 1) + ')" ' + (STATS_PAGE <= 1 ? 'disabled' : '') + '>« 上一页</button>' +
          '<span class="page-num">' + STATS_PAGE + ' / ' + totalPages + '</span>' +
          '<button class="page-btn" onclick="goStatsPage(' + (STATS_PAGE + 1) + ')" ' + (STATS_PAGE >= totalPages ? 'disabled' : '') + '>下一页 »</button>' +
        '</div>' +
      '</div>'
    : '');
}

function sortStatsBy(col) {
  if (STATS_SORT_COL === col) {
    STATS_SORT_DIR = STATS_SORT_DIR === 'desc' ? 'asc' : 'desc';
  } else {
    STATS_SORT_COL = col;
    STATS_SORT_DIR = 'desc';
  }
  STATS_PAGE = 1;
  _rebuildStatsTable();
}

function filterStatsCat(cat) {
  STATS_CAT_FILTER = cat;
  STATS_PAGE = 1;
  _rebuildStatsTable();
}

function goStatsPage(p) {
  STATS_PAGE = Math.max(1, p);
  _rebuildStatsTable();
}

// ===== PRODUCT DETAIL PAGE =====
// ===== 公共数据：营业员 / 门店 =====
var STAFF_NAMES = ['王建国','李小红','赵明亮','刘芳','陈海燕','周大伟','吴秀珍','郑立强'];

// 根据门店索引生成营业员列表（每店固定几人）
function getStoreStaff(storeIdx) {
  var base = (storeIdx * 2) % STAFF_NAMES.length;
  return [STAFF_NAMES[base], STAFF_NAMES[(base+1) % STAFF_NAMES.length], STAFF_NAMES[(base+2) % STAFF_NAMES.length]];
}

// 生成一条交易记录
function makeRecord(j, qty, avgPrice, stores) {
  var buyers = ['张伟','李萍','王芳','赵强','刘明','陈丽','周杰','吴婷','孙磊','郑华','黄勇','林秀','杨帆','马斌','冯雪'];
  var payMethods = ['微信支付','微信支付','微信支付','微信支付','支付宝','支付宝','支付宝','现金','银行卡'];
  var isVipArr = [true,false,false,true,false,false,true,false,true];

  var now = new Date();
  var hour = 8 + Math.floor(j / Math.max(qty,1) * 12);
  var min = 10 + (j * 17) % 50;
  var sec = (j * 7) % 60;
  var ts = new Date(now);
  ts.setHours(hour, min, sec, 0);
  if (currentRange === 'week')  { ts.setDate(ts.getDate() - (6 - Math.floor(j * 7  / Math.max(qty,1)))); }
  if (currentRange === 'month') { ts.setDate(ts.getDate() - (29 - Math.floor(j * 30 / Math.max(qty,1)))); }

  var timeStr = ts.getFullYear()+'-'+pad2(ts.getMonth()+1)+'-'+pad2(ts.getDate())+' '+pad2(ts.getHours())+':'+pad2(ts.getMinutes())+':'+pad2(ts.getSeconds());
  var vip = isVipArr[j % isVipArr.length];
  var pm  = payMethods[j % payMethods.length];
  var b   = buyers[j % buyers.length];

  // 门店分配
  var storeIdx = j % stores.length;
  var store    = stores[storeIdx];
  var staff    = getStoreStaff(storeIdx);
  var staffName = staff[j % staff.length];

  var salePrice   = avgPrice + Math.round(avgPrice * (0.18 + (j % 7) * 0.02));
  var memberPrice = Math.round(salePrice * (0.80 + (j % 5) * 0.03));
  var finalPrice  = vip ? memberPrice : salePrice;
  var origPrice   = salePrice + Math.round(salePrice * (0.25 + (j % 6) * 0.02));

  return {
    orderNo:     'OD'+ts.getFullYear()+pad2(ts.getMonth()+1)+pad2(ts.getDate())+pad4(j+1),
    time:        timeStr,
    origPrice:   origPrice,
    salePrice:   salePrice,
    memberPrice: memberPrice,
    finalPrice:  finalPrice,
    buyer:       b,
    payMethod:   pm,
    isVip:       vip,
    store:       store,
    staff:       staffName
  };
}

// 打开商品销售明细
function openProductDetail(name, fromPage) {
  PRODUCT_DETAIL_TARGET = name;
  switchPage('product-detail', document.querySelector('[onclick*="product-detail"]'));
}

function initProductDetail() {
  var d = STATS_DATA[currentRange];
  var p = null;
  var allProducts = d.topProducts;
  for (var i = 0; i < allProducts.length; i++) {
    if (allProducts[i].name === PRODUCT_DETAIL_TARGET) { p = allProducts[i]; break; }
  }
  if (!p) {
    document.getElementById('productDetailContent').innerHTML =
      '<div class="chart-card"><div class="chart-header"><div class="chart-title">未找到商品</div></div>'+
      '<div style="padding:40px;text-align:center;color:var(--text-muted)">请从销售排行中点击商品名称进入</div></div>';
    return;
  }

  var avgPrice = Math.round(p.sales / Math.max(p.qty, 1));
  var stores   = getSelectedStores();

  var records = [];
  for (var j = 0; j < p.qty; j++) {
    records.push(makeRecord(j, p.qty, avgPrice, stores));
  }

  var totalFinal = records.reduce(function(s,r){return s+r.finalPrice;},0);

  var backLabel = '返回销售统计';
  var backFn    = 'goBackToSalesStats()';

  var rows = records.map(function(r, idx){
    return '<tr>'+
      '<td style="font-family:monospace;font-size:12px"><span class="order-link" onclick="showOrderDetail(\''+r.orderNo+'\','+idx+',\'product\')">'+r.orderNo+'</span></td>'+
      '<td style="white-space:nowrap">'+r.time+'</td>'+
      '<td class="text-right" style="color:var(--text-dim);text-decoration:line-through">¥'+r.origPrice+'</td>'+
      '<td class="text-right">¥'+r.salePrice+'</td>'+
      '<td class="text-right">'+(r.isVip?'<span style="color:var(--primary);font-weight:600">¥'+r.memberPrice+'</span>':'¥'+r.memberPrice)+'</td>'+
      '<td class="text-right" style="font-weight:600;color:var(--accent)">¥'+r.finalPrice+'</td>'+
      '<td>'+r.buyer+(r.isVip?' <span style="font-size:10px;color:#fff;background:var(--primary);border-radius:3px;padding:1px 4px">VIP</span>':'')+'</td>'+
      '<td>'+r.payMethod+'</td>'+
      '<td>'+r.store.name+'</td>'+
      '<td>'+r.staff+'</td>'+
      '</tr>';
  }).join('');

  var h = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;flex-wrap:wrap">'+
    '<button onclick="'+backFn+'" style="border:1px solid var(--border);background:#fff;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;color:var(--text)">← '+backLabel+'</button>'+
    '<span style="font-size:18px;font-weight:700;color:var(--text)">'+p.name+'</span>'+
    '<span style="font-size:12px;color:var(--text-dim);background:var(--bg-light);padding:2px 8px;border-radius:4px">'+p.cat+'</span>'+
  '</div>'+

  '<div class="kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:8px">'+
    '<div class="kpi-card"><div class="kpi-label">销售笔数</div><div class="kpi-val">'+records.length+'笔</div></div>'+
    '<div class="kpi-card"><div class="kpi-label">成交总额</div><div class="kpi-val" style="color:var(--accent)">¥'+totalFinal.toLocaleString()+'</div></div>'+
    '<div class="kpi-card"><div class="kpi-label">平均单价</div><div class="kpi-val">¥'+avgPrice+'</div></div>'+
    '<div class="kpi-card"><div class="kpi-label">VIP 成交</div><div class="kpi-val">'+records.filter(function(r){return r.isVip;}).length+'笔</div></div>'+
    '<div class="kpi-card"><div class="kpi-label">毛利率</div><div class="kpi-val" style="color:var(--primary)">'+(p.rate||'--')+'</div></div>'+
  '</div>'+

  '<div class="chart-card" style="margin-bottom:0">'+
    '<div class="chart-header"><div><div class="chart-title">'+p.name+' · 销售明细</div><div class="chart-sub">共 '+records.length+' 条交易，点击订单号查看详情</div></div></div>'+
    '<div class="table-wrap">'+
      '<table>'+
        '<thead><tr>'+
          '<th>订单号</th><th>销售时间</th>'+
          '<th class="text-right">原价</th><th class="text-right">销售价</th><th class="text-right">会员价</th><th class="text-right">成交价</th>'+
          '<th>购买人</th><th>支付方式</th><th>销售门店</th><th>营业员</th>'+
        '</tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
      '</table>'+
    '</div>'+
  '</div>';

  // 保存 records 供订单弹窗使用
  window._productRecords = records;
  window._productInfo    = p;
  document.getElementById('productDetailContent').innerHTML = h;
}
function pad2(n) { return n<10?'0'+n:''+n; }
function pad4(n) { return n<10?'000'+n:n<100?'00'+n:n<1000?'0'+n:''+n; }

// ===== 订单详情弹窗 =====
// source: 'product' | 'records'
function showOrderDetail(orderNo, idx, source) {
  var r;
  if (source === 'product' && window._productRecords) {
    r = window._productRecords[idx];
  } else if (source === 'records' && window._recordsData) {
    r = window._recordsData[idx];
  }
  if (!r) return;

  var p = window._productInfo || {name:'--', cat:'--'};

  // 模拟该订单包含 1-3 件商品（当前商品 + 随机搭配）
  var extraProducts = [
    {name:'精装礼盒',qty:1,price:r.salePrice+15},
    {name:'袋装配料',qty:2,price:38},
    {name:'精品包装',qty:1,price:12}
  ];
  var mainItem   = {name:p.name, qty:1, price:r.finalPrice, isMain:true};
  var extraCount = (idx) % 3;  // 0 / 1 / 2 件附加商品
  var items      = [mainItem].concat(extraProducts.slice(0, extraCount));
  var totalAmt   = items.reduce(function(s,it){return s+it.price*it.qty;},0);

  var itemRows = items.map(function(it){
    return '<tr style="border-bottom:1px solid var(--border)">'+
      '<td style="padding:8px 12px">'+(it.isMain?'<strong>'+it.name+'</strong>':it.name)+'</td>'+
      '<td style="padding:8px 12px;text-align:center">×'+it.qty+'</td>'+
      '<td style="padding:8px 12px;text-align:right">¥'+it.price+'</td>'+
      '<td style="padding:8px 12px;text-align:right;font-weight:600">¥'+(it.price*it.qty)+'</td>'+
      '</tr>';
  }).join('');

  var html =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
      '<div>'+
        '<div style="font-size:18px;font-weight:700;color:var(--text)">订单详情</div>'+
        '<div style="font-size:12px;color:var(--text-muted);font-family:monospace;margin-top:2px">'+orderNo+'</div>'+
      '</div>'+
      '<button onclick="closeOrderDetail()" style="border:none;background:none;font-size:22px;cursor:pointer;color:var(--text-dim);padding:0 4px">✕</button>'+
    '</div>'+

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">'+
      '<div style="background:var(--bg-light);border-radius:8px;padding:10px 14px">'+
        '<div style="font-size:11px;color:var(--text-muted)">销售时间</div>'+
        '<div style="font-size:12px;margin-top:2px">'+r.time+'</div>'+
      '</div>'+
      '<div style="background:var(--bg-light);border-radius:8px;padding:10px 14px">'+
        '<div style="font-size:11px;color:var(--text-muted)">支付方式</div>'+
        '<div style="font-size:12px;margin-top:2px">'+r.payMethod+'</div>'+
      '</div>'+
      '<div style="background:var(--bg-light);border-radius:8px;padding:10px 14px">'+
        '<div style="font-size:11px;color:var(--text-muted)">购买人</div>'+
        '<div style="font-size:12px;margin-top:2px">'+r.buyer+(r.isVip?' <span style="font-size:10px;color:#fff;background:var(--primary);border-radius:3px;padding:1px 4px">VIP</span>':'')+'</div>'+
      '</div>'+
      '<div style="background:var(--bg-light);border-radius:8px;padding:10px 14px">'+
        '<div style="font-size:11px;color:var(--text-muted)">销售门店</div>'+
        '<div style="font-size:12px;margin-top:2px">'+r.store.name+'</div>'+
      '</div>'+
      '<div style="background:var(--bg-light);border-radius:8px;padding:10px 14px">'+
        '<div style="font-size:11px;color:var(--text-muted)">营业员</div>'+
        '<div style="font-size:12px;margin-top:2px">'+r.staff+'</div>'+
      '</div>'+
      '<div style="background:var(--bg-light);border-radius:8px;padding:10px 14px">'+
        '<div style="font-size:11px;color:var(--text-muted)">会员折扣</div>'+
        '<div style="font-size:12px;margin-top:2px">'+(r.isVip ? '已享VIP折扣（'+Math.round(r.memberPrice/r.salePrice*100)+'折）' : '无')+'</div>'+
      '</div>'+
    '</div>'+

    '<div style="margin-bottom:12px">'+
      '<div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:6px">商品明细</div>'+
      '<table style="width:100%;border-collapse:collapse;font-size:12px">'+
        '<thead><tr style="background:var(--bg-light)">'+
          '<th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600">商品</th>'+
          '<th style="padding:8px 12px;text-align:center;color:var(--text-muted);font-weight:600">数量</th>'+
          '<th style="padding:8px 12px;text-align:right;color:var(--text-muted);font-weight:600">单价</th>'+
          '<th style="padding:8px 12px;text-align:right;color:var(--text-muted);font-weight:600">小计</th>'+
        '</tr></thead>'+
        '<tbody>'+itemRows+'</tbody>'+
      '</table>'+
    '</div>'+

    '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:linear-gradient(90deg,var(--primary) 0%,var(--primary-dark) 100%);border-radius:8px;color:#fff">'+
      '<div style="font-size:15px;font-weight:600">实付总额</div>'+
      '<div style="font-size:22px;font-weight:800">¥'+totalAmt.toLocaleString()+'</div>'+
    '</div>';

  document.getElementById('orderDetailInner').innerHTML = html;
  document.getElementById('orderDetailBackdrop').style.display = 'block';
  document.getElementById('orderDetailModal').style.display = 'block';
}

function closeOrderDetail() {
  document.getElementById('orderDetailBackdrop').style.display = 'none';
  document.getElementById('orderDetailModal').style.display = 'none';
}

function goBackToSalesStats() {
  var nav = document.getElementById('nav-sales-stats');
  if (nav) switchPage('sales-stats', nav);
}
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen = sidebar.classList.contains('show');
  if (isOpen) { closeSidebar(); }
  else { sidebar.classList.add('show'); overlay.classList.add('show'); }
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('show');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

function mobileSwitchTab(pageId, el) {
  // Highlight the active bottom tab
  document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // Find sidebar nav item and trigger page switch
  const navItems = document.querySelectorAll('.nav-item');
  let found = false;
  navItems.forEach(item => {
    const onclick = item.getAttribute('onclick') || '';
    if (onclick.includes("'" + pageId + "'")) {
      found = true;
      item.click();
    }
  });
  if (!found) {
    // Direct switch if nav item not found
    switchPageDirect(pageId);
  }
  closeSidebar();
  closeMobileMoreMenu();
}

function switchPageDirect(id) {
  var hash = '#' + id;
  if (window.location.hash !== hash) history.pushState(null, '', hash);
  activatePage(id);
}

function toggleMobileMoreMenu() {
  const menu = document.getElementById('mobileMoreMenu');
  const backdrop = document.getElementById('mobileMoreBackdrop');
  const isOpen = menu.classList.contains('show');
  if (isOpen) { closeMobileMoreMenu(); }
  else { menu.classList.add('show'); backdrop.classList.add('show'); }
}
function closeMobileMoreMenu() {
  document.getElementById('mobileMoreMenu').classList.remove('show');
  document.getElementById('mobileMoreBackdrop').classList.remove('show');
}

function mobileMoreSelect(pageId) {
  closeMobileMoreMenu();
  mobileSwitchTab(pageId, document.getElementById('mobileMoreTab'));
}

// Close sidebar on window resize (back to desktop)
window.addEventListener('resize', function() {
  if (window.innerWidth > 1024) closeSidebar();
});

// Hash-based routing: handle browser back/forward
window.addEventListener('hashchange', function() {
  var pageId = window.location.hash.replace('#', '');
  if (pageId && pageTitles[pageId]) {
    activatePage(pageId);
  }
});

// ===== 价签打印 =====
// Sample product data for label printing — shared across templates
var LABEL_PRODUCTS = [
  { id:'p01', name:'大白菜', cat:'蔬菜', price:3.5, origPrice:5.0, memberPrice:3.0, unit:'斤', origin:'山东寿光', barcode:'6901234567012', spec:'约500g', produceDate:'2026-06-03', batches:[{produceDate:'2026-06-03',qty:12},{produceDate:'2026-06-10',qty:8}] },
  { id:'p02', name:'黄瓜', cat:'蔬菜', price:4.2, origPrice:6.5, memberPrice:3.6, unit:'斤', origin:'山东兰陵', barcode:'6901234567029', spec:'约400g', produceDate:'2026-06-04' },
  { id:'p03', name:'番茄', cat:'蔬菜', price:5.8, origPrice:8.0, memberPrice:4.8, unit:'斤', origin:'云南昆明', barcode:'6901234567036', spec:'约500g', produceDate:'2026-05-28', batches:[{produceDate:'2026-05-28',qty:5},{produceDate:'2026-06-04',qty:15},{produceDate:'2026-06-11',qty:10}] },
  { id:'p04', name:'土鸡蛋', cat:'禽蛋', price:1.5, origPrice:2.0, memberPrice:1.2, unit:'枚', origin:'安徽阜阳', barcode:'6901234567043', spec:'约55g/枚', produceDate:'2026-05-30' },
  { id:'p05', name:'五花肉', cat:'猪肉', price:18.5, origPrice:24.0, memberPrice:16.0, unit:'斤', origin:'河南双汇', barcode:'6901234567050', spec:'约500g', produceDate:'2026-06-04' },
  { id:'p06', name:'鲜牛奶', cat:'乳品', price:12.9, origPrice:16.9, memberPrice:11.5, unit:'瓶', origin:'内蒙古伊利', barcode:'6901234567067', spec:'950ml', produceDate:'2026-06-03', batches:[{produceDate:'2026-06-03',qty:30},{produceDate:'2026-06-12',qty:20}] },
  { id:'p07', name:'东北大米', cat:'粮油', price:38.0, origPrice:49.0, memberPrice:35.0, unit:'袋', origin:'黑龙江五常', barcode:'6901234567074', spec:'5kg', produceDate:'2026-05-15' },
  { id:'p08', name:'金龙鱼调和油', cat:'粮油', price:68.0, origPrice:78.0, memberPrice:62.0, unit:'桶', origin:'上海益海嘉里', barcode:'6901234567081', spec:'5L', produceDate:'2026-04-20' },
  { id:'p09', name:'红富士苹果', cat:'水果', price:8.8, origPrice:12.0, memberPrice:7.5, unit:'斤', origin:'陕西洛川', barcode:'6901234567098', spec:'约200g/个', produceDate:'2026-05-28' },
  { id:'p10', name:'进口车厘子', cat:'水果', price:58.0, origPrice:78.0, memberPrice:49.0, unit:'盒', origin:'智利进口', barcode:'6901234567104', spec:'约500g', produceDate:'2026-05-25' },
  { id:'p11', name:'味极鲜酱油', cat:'调料', price:9.9, origPrice:14.5, memberPrice:8.5, unit:'瓶', origin:'广东佛山', barcode:'6901234567111', spec:'500ml', produceDate:'2026-03-10' },
  { id:'p12', name:'特仑苏牛奶', cat:'乳品', price:59.9, origPrice:69.9, memberPrice:55.0, unit:'箱', origin:'内蒙古蒙牛', barcode:'6901234567128', spec:'250ml×12', produceDate:'2026-05-20' },
  { id:'p13', name:'牛腱子肉', cat:'牛肉', price:42.0, origPrice:55.0, memberPrice:38.0, unit:'斤', origin:'内蒙古科尔沁', barcode:'6901234567135', spec:'约500g', produceDate:'2026-06-02' },
  { id:'p14', name:'三黄鸡', cat:'禽肉', price:15.8, origPrice:22.0, memberPrice:13.9, unit:'只', origin:'广东清远', barcode:'6901234567142', spec:'约1.2kg', produceDate:'2026-06-03' },
  { id:'p15', name:'基围虾', cat:'水产', price:38.0, origPrice:48.0, memberPrice:32.0, unit:'斤', origin:'广东湛江', barcode:'6901234567159', spec:'约20只/斤', produceDate:'2026-06-04' },
  { id:'p16', name:'带鱼段', cat:'水产', price:28.0, origPrice:35.0, memberPrice:24.0, unit:'袋', origin:'浙江舟山', barcode:'6901234567166', spec:'500g', produceDate:'2026-03-15' },
  { id:'p17', name:'思念水饺', cat:'速冻', price:16.9, origPrice:22.9, memberPrice:14.5, unit:'袋', origin:'河南郑州', barcode:'6901234567173', spec:'450g', produceDate:'2026-04-10' },
  { id:'p18', name:'洽洽瓜子', cat:'零食', price:9.9, origPrice:12.9, memberPrice:8.5, unit:'袋', origin:'安徽合肥', barcode:'6901234567180', spec:'228g', produceDate:'2026-02-15' },
  { id:'p19', name:'金龙泉啤酒', cat:'酒饮', price:5.0, origPrice:6.5, memberPrice:4.5, unit:'瓶', origin:'湖北荆门', barcode:'6901234567197', spec:'500ml', produceDate:'2026-05-01' },
  { id:'p20', name:'维达纸巾', cat:'日用品', price:19.9, origPrice:25.9, memberPrice:17.9, unit:'提', origin:'广东江门', barcode:'6901234567203', spec:'3层×10包', produceDate:'2026-01-10' }
];
// Element type definitions: { label, icon, defaults }
var LABEL_ELEM_TYPES = {
  'product':       { label:'商品名',    icon:'📦', def:{ fontSize:11, color:'#222', fontWeight:700 } },
  'price':         { label:'价格',      icon:'💰', def:{ fontSize:16, color:'#d32f2f', fontWeight:800, prefix:'¥' } },
  'original-price':{ label:'原价',      icon:'🏷️', def:{ fontSize:9, color:'#999', fontWeight:400, prefix:'¥', strikethrough:true } },
  'member-price':  { label:'会员价',    icon:'👑', def:{ fontSize:12, color:'#e65100', fontWeight:700, prefix:'¥' } },
  'unit':          { label:'计价单位',  icon:'⚖️', def:{ fontSize:8, color:'#666' } },
  'origin':        { label:'产地',      icon:'📍', def:{ fontSize:7, color:'#999', prefix:'产地：' } },
  'barcode':       { label:'条码',      icon:'🔢', def:{ fontSize:7, color:'#555', letterSpacing:1 } },
  'custom-text':   { label:'自定义文本',icon:'✏️', def:{ fontSize:8, color:'#333' } },
  'produce-date':  { label:'生产日期',  icon:'📅', def:{ fontSize:7, color:'#999', prefix:'生产日期：' } },
  'spec':          { label:'规格',      icon:'📏', def:{ fontSize:8, color:'#555' } },
  'badge':         { label:'角标',      icon:'🔖', def:{ fontSize:8, color:'#fff', fontWeight:700, bg:'#e65100', isBadge:true, borderRadiusTL:2, borderRadiusTR:2, borderRadiusBR:2, borderRadiusBL:2 } }
};

function _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/\"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

var LABEL_TEMPLATES = [
  { id:'tpl-01', name:'标准价签', size:{w:158,h:90}, bg:'#ffffff',
    elements:[
      {id:'e1',type:'product',text:'有机西红柿',x:4,y:3,fontSize:12,color:'#222',fontWeight:700},
      {id:'e2',type:'spec',text:'约500g±50g',x:4,y:18,fontSize:8,color:'#888'},
      {id:'e3',type:'price',text:'8.80',x:4,y:28,fontSize:20,color:'#d32f2f',fontWeight:800,prefix:'¥'},
      {id:'e4',type:'original-price',text:'12.80',x:4,y:50,fontSize:9,color:'#bbb',prefix:'¥',strikethrough:true},
      {id:'e5',type:'member-price',text:'7.90',x:80,y:28,fontSize:14,color:'#e65100',fontWeight:700,prefix:'¥'},
      {id:'e6',type:'unit',text:'元/500g',x:4,y:62,fontSize:8,color:'#999'},
      {id:'e7',type:'origin',text:'山东寿光',x:4,y:72,fontSize:7,color:'#ccc',prefix:'产地：'},
      {id:'e8',type:'barcode',text:'6901234567890',x:80,y:72,fontSize:7,color:'#ccc',letterSpacing:1}
    ], desc:'完整信息白底价签，含价格/原价/会员价/规格/条码' },
  { id:'tpl-02', name:'促销价签', size:{w:158,h:90}, bg:'#fff8e1',
    elements:[
      {id:'e1',type:'product',text:'进口车厘子',x:4,y:3,fontSize:13,color:'#333',fontWeight:700},
      {id:'e2',type:'spec',text:'JJ级 智利进口',x:4,y:18,fontSize:8,color:'#999'},
      {id:'e3',type:'price',text:'39.90',x:4,y:28,fontSize:22,color:'#e65100',fontWeight:800,prefix:'¥'},
      {id:'e4',type:'original-price',text:'69.90',x:4,y:52,fontSize:10,color:'#ccc',prefix:'¥',strikethrough:true},
      {id:'e5',type:'unit',text:'元/盒',x:4,y:63,fontSize:8,color:'#999'},
      {id:'e6',type:'origin',text:'智利',x:4,y:73,fontSize:7,color:'#ccc',prefix:'产地：'},
      {id:'e7',type:'barcode',text:'6909876543210',x:80,y:73,fontSize:7,color:'#ccc',letterSpacing:1},
      {id:'e8',type:'badge',text:'热卖',x:110,y:4,fontSize:8,color:'#fff',fontWeight:700,bg:'#e65100',isBadge:true}
    ], desc:'暖色底+划线原价+热卖角标，适合促销商品' },
  { id:'tpl-03', name:'精肉价签', size:{w:158,h:90}, bg:'#fce4ec',
    elements:[
      {id:'e1',type:'product',text:'黑猪五花肉',x:4,y:3,fontSize:13,color:'#333',fontWeight:700},
      {id:'e2',type:'spec',text:'去皮去骨',x:4,y:18,fontSize:8,color:'#999'},
      {id:'e3',type:'price',text:'25.80',x:4,y:28,fontSize:22,color:'#fc4b52',fontWeight:800,prefix:'¥'},
      {id:'e4',type:'original-price',text:'32.80',x:4,y:52,fontSize:10,color:'#e57373',prefix:'¥',strikethrough:true},
      {id:'e5',type:'unit',text:'元/500g',x:4,y:63,fontSize:8,color:'#999'},
      {id:'e6',type:'origin',text:'安徽金寨',x:4,y:73,fontSize:7,color:'#ccc',prefix:'产地：'},
      {id:'e7',type:'barcode',text:'6901122334455',x:80,y:73,fontSize:7,color:'#ccc',letterSpacing:1},
      {id:'e8',type:'badge',text:'当日鲜',x:105,y:4,fontSize:8,color:'#fff',fontWeight:700,bg:'#fc4b52',isBadge:true}
    ], desc:'粉色底+划线原价+当日鲜角标，精肉品类专属' },
  { id:'tpl-04', name:'水果价签', size:{w:158,h:90}, bg:'#e8f5e9',
    elements:[
      {id:'e1',type:'product',text:'阳光玫瑰葡萄',x:4,y:3,fontSize:12,color:'#1b5e20',fontWeight:700},
      {id:'e2',type:'spec',text:'特级 单串约500g',x:4,y:18,fontSize:8,color:'#666'},
      {id:'e3',type:'price',text:'29.90',x:4,y:28,fontSize:20,color:'#2e7d32',fontWeight:800,prefix:'¥'},
      {id:'e4',type:'original-price',text:'39.90',x:4,y:50,fontSize:9,color:'#a5d6a7',prefix:'¥',strikethrough:true},
      {id:'e5',type:'member-price',text:'26.90',x:80,y:28,fontSize:14,color:'#e65100',fontWeight:700,prefix:'¥'},
      {id:'e6',type:'unit',text:'元/串',x:4,y:62,fontSize:8,color:'#999'},
      {id:'e7',type:'origin',text:'云南大理',x:4,y:72,fontSize:7,color:'#ccc',prefix:'产地：'},
      {id:'e8',type:'barcode',text:'6905566778899',x:80,y:72,fontSize:7,color:'#ccc',letterSpacing:1}
    ], desc:'绿色自然风+会员价，适合精品水果' },
  { id:'tpl-05', name:'蔬菜价签', size:{w:158,h:90}, bg:'#f1f8e9',
    elements:[
      {id:'e1',type:'product',text:'有机上海青',x:4,y:3,fontSize:12,color:'#333',fontWeight:700},
      {id:'e2',type:'spec',text:'散装称重',x:4,y:18,fontSize:8,color:'#888'},
      {id:'e3',type:'price',text:'4.50',x:4,y:28,fontSize:20,color:'#33691e',fontWeight:800,prefix:'¥'},
      {id:'e4',type:'member-price',text:'3.80',x:80,y:28,fontSize:14,color:'#e65100',fontWeight:700,prefix:'¥'},
      {id:'e5',type:'unit',text:'元/500g',x:4,y:50,fontSize:8,color:'#999'},
      {id:'e6',type:'produce-date',text:'2026-06-04',x:4,y:62,fontSize:7,color:'#ccc',prefix:'采摘日期：'},
      {id:'e7',type:'origin',text:'上海崇明',x:4,y:72,fontSize:7,color:'#ccc',prefix:'产地：'}
    ], desc:'简约绿底+会员价+采摘日期，适合散装蔬菜' }
];

// Load from localStorage if available
(function(){
  var saved = localStorage.getItem('labelTemplates');
  if (saved) {
    try { var arr = JSON.parse(saved); if (Array.isArray(arr) && arr.length) LABEL_TEMPLATES = arr; } catch(e){}
  }
})();

function _saveTemplates() {
  try { localStorage.setItem('labelTemplates', JSON.stringify(LABEL_TEMPLATES)); } catch(e){}
}

var LABEL_EDITING = null, LABEL_SEL_ELEM = null, LABEL_DRAG = null;
var LABEL_CANVAS_SCALE = 1;
var LABEL_CANVAS_ZOOM = 1;   // manual zoom multiplier (1 = auto-fit)
var LABEL_CANVAS_PAN_X = 0;  // canvas pan offset px
var LABEL_CANVAS_PAN_Y = 0;
var _showBuiltinGrid = localStorage.getItem('lb_show_builtin') !== '0'; // 默认展示
var LABEL_SELECTED_IDS = {}; // Set-like object for multi-select export
var LABEL_EXPORT_MODE = false; // whether card-select mode is active
var _idCounter = 100;

function _newElemId() { return 'elem'+(_idCounter++); }

// Render all elements with absolute positioning
function renderLabelTag(tpl, scale) {
  scale = scale || 1;
  var w = tpl.size.w * scale, h = tpl.size.h * scale;
  var html = '<div class="label-tag" style="width:'+w+'px;height:'+h+'px;background:'+tpl.bg+';position:relative;overflow:hidden">';
  // Background image layer (rendered behind all elements)
  if (tpl.bgImage) {
    html += '<div class="label-bg-img'+(tpl.printBg?'':' no-print')+'" style="background-image:url('+tpl.bgImage+')"></div>';
  }
  (tpl.elements||[]).forEach(function(e) {
    var style = 'position:absolute;left:'+(e.x*scale)+'px;top:'+(e.y*scale)+'px;font-size:'+(e.fontSize*scale)+'px;color:'+(e.color||'#333')+';line-height:1.2;white-space:nowrap';
    if (e.fontWeight) style += ';font-weight:'+e.fontWeight;
    if (e.letterSpacing) style += ';letter-spacing:'+(e.letterSpacing*scale)+'px';
    if (e.isBadge) {
      var bg = e.bg || '#e65100';
      var tl = e.borderRadiusTL != null ? e.borderRadiusTL : 2;
      var tr = e.borderRadiusTR != null ? e.borderRadiusTR : 2;
      var br = e.borderRadiusBR != null ? e.borderRadiusBR : 2;
      var bl = e.borderRadiusBL != null ? e.borderRadiusBL : 2;
      style += ';background:'+bg+';padding:'+(1*scale).toFixed(1)+'px '+(4*scale).toFixed(1)+'px;border-radius:'+(tl*scale).toFixed(1)+'px '+(tr*scale||0).toFixed(1)+'px '+(br*scale||0).toFixed(1)+'px '+(bl*scale||0).toFixed(1)+'px;color:'+(e.color||'#fff');
    }
    if (e.strikethrough) style += ';text-decoration:line-through';
    var text = (e.prefix||'') + e.text;
    html += '<div class="label-elem" style="'+style+'">'+_esc(text)+'</div>';
  });
  html += '</div>';
  return html;
}

// MM-unit variant for print — dimensions and positions use CSS mm so the
// browser maps them to the printer's physical resolution (no DPI guesswork).
function renderLabelTagMM(tpl) {
  var w = tpl.size.w, h = tpl.size.h;
  var html = '<div class="label-tag" style="width:'+w+'mm;height:'+h+'mm;background:'+tpl.bg+';position:relative;overflow:hidden">';
  if (tpl.bgImage) {
    html += '<div class="label-bg-img'+(tpl.printBg?'':' no-print')+'" style="background-image:url('+tpl.bgImage+')"></div>';
  }
  (tpl.elements||[]).forEach(function(e) {
    var fz = (e.fontSize||8); // fontSize is stored in mm
    var style = 'position:absolute;left:'+e.x+'mm;top:'+e.y+'mm;font-size:'+fz+'mm;color:'+(e.color||'#333')+';line-height:1.2;white-space:nowrap';
    if (e.fontWeight) style += ';font-weight:'+e.fontWeight;
    if (e.letterSpacing) style += ';letter-spacing:'+(e.letterSpacing||0)+'mm';
    if (e.isBadge) {
      var bg = e.bg || '#e65100';
      var tl = e.borderRadiusTL != null ? e.borderRadiusTL : 2;
      var tr = e.borderRadiusTR != null ? e.borderRadiusTR : 2;
      var br = e.borderRadiusBR != null ? e.borderRadiusBR : 2;
      var bl = e.borderRadiusBL != null ? e.borderRadiusBL : 2;
      style += ';background:'+bg+';padding:1mm 4mm;border-radius:'+tl+'mm '+tr+'mm '+br+'mm '+bl+'mm;color:'+(e.color||'#fff');
    }
    if (e.strikethrough) style += ';text-decoration:line-through';
    var text = (e.prefix||'') + e.text;
    html += '<div class="label-elem" style="'+style+'">'+_esc(text)+'</div>';
  });
  html += '</div>';
  return html;
}

function _toggleBuiltinGrid(show) {
  _showBuiltinGrid = show;
  localStorage.setItem('lb_show_builtin', show ? '1' : '0');
  initLabelPrint();
}

// ---- Card grid + editor bootstrap ----
function initLabelPrint() {
  var el = document.getElementById('labelPrintContent');
  if (!el) return;
  // Find next template index for new IDs
  var maxN = 0;
  LABEL_TEMPLATES.forEach(function(t){
    var m = t.id.match(/^tpl-(\d+)$/);
    if (m) maxN = Math.max(maxN, parseInt(m[1]));
  });
  var builtin = ['tpl-01','tpl-02','tpl-03','tpl-04','tpl-05'];
  // Filter templates for display
  var displayTemplates = _showBuiltinGrid ? LABEL_TEMPLATES.slice() : LABEL_TEMPLATES.filter(function(t){ return builtin.indexOf(t.id) === -1; });
  var builtinHiddenCount = 0;
  if (!_showBuiltinGrid) builtinHiddenCount = LABEL_TEMPLATES.length - displayTemplates.length;
  el.innerHTML =
    '<div style="padding:20px 24px 0;min-height:100%">' +
    '<div class="lp-toolbar"><div class="lp-toolbar-actions"><h2>价签模板</h2>'+
        '<button class="lp-btn-new" onclick="createNewLabel()">+ 新建价签</button>'+
        '<button class="lp-btn-ghost" onclick="document.getElementById(\'lpImportFile\').click()">📥 导入</button>'+
        '<input type="file" id="lpImportFile" accept=".json" multiple style="display:none" onchange="importLabelTemplates(event)">'+
        _renderExportButton(displayTemplates) +
        (_showBuiltinGrid ? '<button class="lp-btn-ghost" onclick="_toggleBuiltinGrid(false)" style="font-size:12px">隐藏内置模板</button>' : '')+
        (!_showBuiltinGrid && builtinHiddenCount > 0 ? '<button class="lp-btn-ghost" onclick="_toggleBuiltinGrid(true)" style="font-size:12px">显示内置模板 ('+builtinHiddenCount+')</button>' : '')+
      '</div>'+
      '<div class="lp-toolbar-actions">'+
        '<span style="font-size:12px;color:var(--text-muted)">共 '+displayTemplates.length+' 个模板</span>'+
      '</div>'+
    '</div>'+
    _renderSelectionBar() +
    '<div class="label-card-grid" id="labelCardGrid">'+(displayTemplates.length===0?'<div class="tag-empty"><div class="icon">🏷️</div><p>暂无模板</p><p style="font-size:12px;color:#999">点击「+ 新建价签」创建第一个</p></div>':'')+displayTemplates.map(function(t) {
      var isBuiltin = builtin.indexOf(t.id) >= 0;
      var sel = LABEL_SELECTED_IDS[t.id];
      var cardOnclick = LABEL_EXPORT_MODE
        ? (isBuiltin ? '' : 'toggleCardSelect(\''+t.id+'\')')
        : 'openLabelEditor(\''+t.id+'\')';
      return '<div class="label-card'+(sel?' selected':'')+(isBuiltin?' is-builtin':'')+'" id="lc-'+t.id+'" onclick="'+cardOnclick+'">'+
        (isBuiltin ? '' : '<button class="card-check'+(sel?' checked':'')+'" onclick="event.stopPropagation();toggleCardSelect(\''+t.id+'\')" title="选择">'+(sel?'✓':'')+'</button>')+
        (!isBuiltin?'<button class="card-delete-btn" onclick="event.stopPropagation();deleteLabelTemplate(\''+t.id+'\')" title="删除模板"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h12M5 4V2.5A1.5 1.5 0 016.5 1h3A1.5 1.5 0 0111 2.5V4M13 4l-.8 9.2A1.5 1.5 0 0110.7 14.5H5.3A1.5 1.5 0 013.8 13.2L3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 7.5v4M9.5 7.5v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>':'')+
        '<div class="label-card-preview">'+renderLabelTag(t,1.0)+'</div>'+
        '<div class="label-card-info"><div class="label-card-name"><span class="lc-name-text" title="'+_esc(t.name)+'">'+_esc(t.name)+'</span><span class="label-card-badge'+(isBuiltin?'':' custom')+'">'+(isBuiltin?'内置':'自定义')+'</span></div>'+
          '<div class="label-card-meta"><span class="lc-size">'+t.size.w+'×'+t.size.h+'mm</span><span class="lc-desc">'+_esc(t.desc||'')+'</span></div></div>'+
        '<div class="label-card-actions">'+
          '<button onclick="event.stopPropagation();openLabelEditor(\''+t.id+'\')">编辑</button>'+
          '<button onclick="event.stopPropagation();duplicateLabelTemplate(\''+t.id+'\')" title="基于此模板创建副本">复制</button>'+
          '<button class="primary" onclick="event.stopPropagation();showProductSelector(\''+t.id+'\')">打印</button>'+
        '</div></div>';
    }).join('')+'</div>'+
    '</div>' +  // close padding wrapper
    '<div class="lp-overlay" id="lpOverlay" onclick="closeLabelEditor()"><div class="lp-editor" id="lpEditor" onclick="event.stopPropagation()"></div></div>';
}

// ===================================================================
// ========== PAGE: 打码记录 (Item Code) =============================
// ===================================================================
// 打码记录（localStorage 持久化）
function _loadICData() {
  try {
    var raw = localStorage.getItem('ic_data');
    if (raw) {
      var d = JSON.parse(raw);
      IC_CODES = d.codes || [];
      IC_SEQ = d.seq || 1000;
      // 迁移：旧数据时间无秒数，补 ":00"
      var migrated = false;
      IC_CODES.forEach(function(c) {
        if (c.time && c.time.length === 16) { c.time += ':00'; migrated = true; }
      });
      if (migrated) _saveICData();
      return true;
    }
  } catch(e) {}
  return false;
}
function _saveICData() {
  try { localStorage.setItem('ic_data', JSON.stringify({ codes: IC_CODES, seq: IC_SEQ })); } catch(e) {}
}
var IC_CODES = [];
var IC_SEQ = 1000;
var IC_FILTER = 'all'; // all | active | used | voided | overtime
var IC_PAGE = 1;
var IC_PAGE_SIZE = 16;
var _icSelectedId = null;
_loadICData();

function generateICMockData() {
  var now = new Date()
  var base = now.getTime()
  var seq = IC_SEQ || 1000
  var records = []
  var ops = ['张伟','李娜','王强','陈晓','刘芳','赵刚']
  function pad(n) { return n < 10 ? '0' + n : '' + n }
  LABEL_PRODUCTS.forEach(function(p) {
    var count = 2 + Math.floor(Math.random() * 2)
    for (var j = 0; j < count; j++) {
      ++seq
      var w = Math.round((0.5 + Math.random() * 9.5) * 10) / 10
      var total = Math.round(p.price * w * 100) / 100
      var s, t, r = Math.random()
      if (r < 0.6) {
        s = 'active'
        t = Math.random() < 0.7
          ? new Date(base - (31 + Math.floor(Math.random() * 600)) * 60000)
          : new Date(base - Math.floor(Math.random() * 29) * 60000)
      } else if (r < 0.85) {
        s = 'used'
        t = new Date(base - Math.floor(Math.random() * 1440) * 60000)
      } else {
        s = 'voided'
        t = new Date(base - Math.floor(Math.random() * 1440) * 60000)
      }
      var y = t.getFullYear(), mo = pad(t.getMonth()+1), d = pad(t.getDate())
      var h = pad(t.getHours()), mi = pad(t.getMinutes()), se = pad(t.getSeconds())
      var rec = {
        id:'ic-'+seq,
        code:'IC'+y+mo+d+String(seq),
        name:p.name,
        productCode:p.barcode,
        unitPrice:p.price,
        weight:w,
        price:total,
        status:s,
        time:y+'-'+mo+'-'+d+' '+h+':'+mi+':'+se
      }
      if (s === 'voided') rec.voidedBy = ops[Math.floor(Math.random() * ops.length)]
      records.push(rec)
    }
  })
  IC_CODES = records
  IC_SEQ = seq
  _saveICData()
}

function initItemCode() {
  var el = document.getElementById('itemCodeContent');
  if (!el) return;

  if (IC_CODES.length === 0) generateICMockData();

  el.innerHTML =
    '<div class="ic-layout">' +
      // ===== 左侧：统计 + 列表 =====
      '<div class="ic-left">' +
        '<div class="ic-stat-row" id="icStatRow"></div>' +
        '<div class="ic-filter-bar">' +
          '<div class="ic-filter-tabs">' +
            '<span class="ic-ftab active" onclick="icSetFilter(\'all\',this)">全部</span>' +
            '<span class="ic-ftab" onclick="icSetFilter(\'active\',this)">待核销</span>' +
            '<span class="ic-ftab" onclick="icSetFilter(\'overtime\',this)">超时未结</span>' +
            '<span class="ic-ftab" onclick="icSetFilter(\'used\',this)">已核销</span>' +
            '<span class="ic-ftab" onclick="icSetFilter(\'voided\',this)">已销毁</span>' +
          '</div>' +
          '<input class="ic-search" id="icSearchInput" placeholder="🔍 搜索商品/条码..." oninput="renderCodeList()">' +
        '</div>' +
        '<div class="ic-list" id="icList"></div>' +
        '<div class="ic-pagination" id="icPagination"></div>' +
      '</div>' +
      // ===== 右侧：生成打码 + 扫码回收 + 记录详情 =====
      '<div class="ic-right">' +
        '<div id="icGenPanel" style="display:block">' +
          '<div class="ic-panel">' +
            '<div class="ic-panel-header">📝 生成打码</div>' +
            '<div class="ic-panel-body">' +
              '<div class="ic-form-row"><label>选择商品</label>' +
                '<div class="ic-select-wrap" id="icSelectWrap">' +
                  '<input class="ic-select-input" id="icSelectInput" placeholder="搜索商品名称..." autocomplete="off" readonly onclick="icToggleDropdown()">' +
                  '<div class="ic-select-dropdown" id="icSelectDropdown">' +
                    '<div class="ic-select-search"><input id="icSelectSearch" placeholder="输入关键词筛选..." oninput="icFilterProducts()"></div>' +
                    '<div id="icSelectList"></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="ic-pcode-row" id="icPcodeRow" style="display:none">' +
                '<span class="ic-pcode-lbl">商品码</span>' +
                '<span class="ic-pcode-val" id="icPcodeVal">--</span>' +
              '</div>' +
              '<div class="ic-form-row"><label>单价 (元/斤)</label><input id="icUnitPrice" type="number" min="0" step="0.01" placeholder="选择商品后自动填入" oninput="icPreviewPrice()"></div>' +
              '<div class="ic-form-row"><label>重量 (斤)</label><input id="icWeight" type="number" min="0" step="0.01" placeholder="0.00" oninput="icPreviewPrice()"></div>' +
              '<div class="ic-form-row"><label>份数（同批打印，1-20）</label><input id="icCopies" type="number" min="1" max="20" value="1"></div>' +
              '<div class="ic-price-preview" id="icPricePreview">单价 × 重量 = 金额</div>' +
              '<button class="ic-btn-primary" onclick="doGenCode()">✨ 生成并打印</button>' +
            '</div>' +
          '</div>' +
          '<div class="ic-panel">' +
            '<div class="ic-panel-header">🔍 扫码回收</div>' +
            '<div class="ic-panel-body">' +
              '<p style="color:var(--text-muted);font-size:12px;margin:0 0 10px">输入或扫描条码，确认后标记为已销毁</p>' +
              '<input class="ic-scan-input" id="icScanInput" placeholder="条码..." onkeydown="if(event.key===\'Enter\')doScanVoid()">' +
              '<div class="ic-scan-result" id="icScanResult"></div>' +
              '<button class="ic-btn-danger" onclick="doScanVoid()">确认销毁</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div id="icDetailPanel" style="display:none">' +
          '<div class="ic-panel">' +
            '<div class="ic-panel-header">' +
              '📋 记录详情' +
              '<button class="ic-detail-close" onclick="icCloseRecordDetail()">✕</button>' +
            '</div>' +
            '<div class="ic-panel-body" id="icDetailBody"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  renderCodeStats();
  renderCodeList();
}

function icPreviewPrice() {
  var p = parseFloat(document.getElementById('icUnitPrice').value)||0;
  var w = parseFloat(document.getElementById('icWeight').value)||0;
  var el = document.getElementById('icPricePreview');
  if (el) el.textContent = p && w ? '单价 ¥'+p.toFixed(2)+'/斤 × '+w.toFixed(2)+'斤 = ¥'+(p*w).toFixed(2) : '单价 × 重量 = 金额';
}

// ===== 打印计划 =====
var PRINT_PLANS = [];
var PP_PAGE = 1;
var PP_PAGE_SIZE = 20;
var PP_FILTER_TYPE = 'all';
var PP_FILTER_STATUS = 'all';
var PP_FILTER_KEYWORD = '';
var PP_FILTER_STORE = 'all';
var PP_FILTER_TIME = 'all';
var PP_STORES = ['崧泽大道中心店', '华科东路店', '盈港路店'];
var PP_EDITING_PLAN_ID = null;
var PP_DETAIL_PLAN_ID = null;
var _PP_ID_COUNTER = 1;

function _ppGenId() { return 'plan-' + String(_PP_ID_COUNTER++).padStart(3, '0'); }

function _ppGenItemId() { return 'item-' + Date.now() + '-' + Math.floor(Math.random() * 10000); }

function _ppNow() {
  var d = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function _ppFmtPrintedAt(s) {
  if (!s) return '';
  var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::\d{2})?$/.exec(s);
  if (m) return m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5];
  return s;
}

function _ppTodayStr() {
  var d = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// ===== 本地缓存（localStorage 持久化）=====
var PP_STORAGE_KEY = 'tcm_print_plans_v1';
function _ppSave() {
  try { localStorage.setItem(PP_STORAGE_KEY, JSON.stringify(PRINT_PLANS)); } catch (e) {}
}
function _ppLoad() {
  try {
    var raw = localStorage.getItem(PP_STORAGE_KEY);
    if (!raw) return false;
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return false;
    PRINT_PLANS = arr;
    var maxN = 0;
    for (var i = 0; i < arr.length; i++) {
      var m = /^plan-(\d+)$/.exec(arr[i].id || '');
      if (m) { var n = parseInt(m[1], 10); if (n > maxN) maxN = n; }
    }
    _PP_ID_COUNTER = maxN + 1;
    return true;
  } catch (e) { return false; }
}

/* ===================== 打印计划 · 接口适配层 PPApi =====================
 * 统一封装 /mnmart/printPlan/* 接口的请求构建与响应解析。
 * - 默认（USE_HTTP=false）：走前端内存模拟（演示态，localStorage 持久化），
 *   请求/响应契约与新接口规范严格一致，便于后续对接。
 * - 线上 Mock 模式（URL 加 ?api=1）：所有读写走「线上静态 Mock」
 *   （站点托管的 JSON，见项目根 mock/ 目录，部署后位于站点相对路径 mock/...json）。
 *   无需起任何服务、无需 Python，其他技术人员直接打开页面即可调试页面与参数；
 *   请求参数会 console.log 输出，便于校对入参。如需参数化动态响应，
 *   将 PPApi.MOCK_BASE 指向任意在线 mock 服务（如 Beeceptor / Apifox）基址即可。
 * 删除类接口（§9.5）：code===0 即成功，data 内无冗余字段（需求3/4）。
 */
var PP_COMPANY_ID = 'ent-001';
var PPApi = {
  USE_HTTP: (window.location && window.location.search && window.location.search.indexOf('api=1') >= 0),
  BASE: '/mnmart',
  // 线上静态 Mock 根目录（相对路径，GitHub Pages 与本地均可用）。
  // 改为外部 mock 服务基址（如 'https://xxx.mock.pstmn.io'）即可获得参数化动态响应。
  MOCK_BASE: './mock',
  // 线上 Mock（?api=1）：GET 静态 JSON 文件（无需后端 / 无需起服务）
  _post: function(path, data, requestPage) {
    if (!this.USE_HTTP) return Promise.resolve(null); // 本地降级：调用方走内存逻辑
    var url = this.MOCK_BASE + this.BASE + path + '.json';
    if (window.console && console.log) console.log('[PPApi mock] GET', url, 'params:', data);
    return fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
      .then(function(r) { if (!r.ok) throw new Error('mock HTTP ' + r.status); return r.json(); });
  },
  // §9.2 计划列表
  list: function(filters, requestPage) {
    if (!this.USE_HTTP) return Promise.resolve(null);
    return this._post('/printPlan/list', filters || {}, requestPage).then(function(r) { return (r && r.data) || []; });
  },
  // §9.4 计划详情
  detail: function(planId) {
    if (!this.USE_HTTP) return Promise.resolve(null);
    return this._post('/printPlan/detail', { printPlanId: planId }).then(function(r) { return r && r.data; });
  },
  // §9.3 新建计划（本地分支仅构造对象，由调用方 unshift）
  add: function(req) {
    if (!this.USE_HTTP) {
      var plan = {
        id: _ppGenId(),
        name: req.planName || (req.shopId + (req.type === 1 ? ' 调价打印' : ' 手动计划')),
        type: req.type === 1 ? 'price-change' : 'manual',
        status: 'pending',
        store: req.shopId || '',
        createdAt: _ppNow(),
        createdBy: '当前用户',
        items: []
      };
      return Promise.resolve({ code: 0, message: 'success', data: plan });
    }
    return this._post('/printPlan/add', req);
  },
  // §9.5 删除计划：code===0 即成功，data 无冗余（需求3/4）
  del: function(planId) {
    if (!this.USE_HTTP) return Promise.resolve({ code: 0, message: 'success', data: null });
    return this._post('/printPlan/delete', { printPlanId: planId });
  },
  // §9.6 添加商品：请求含商品名称/原价/售价/会员价；响应 data=更新后计划（item 含批次）
  addGoods: function(req) {
    if (!this.USE_HTTP) {
      var plan = _ppGetPlan(req.printPlanId);
      if (!plan) return Promise.resolve({ code: 404, message: '计划不存在' });
      for (var i = 0; i < req.goodsList.length; i++) {
        var g = req.goodsList[i];
        var b = _ppResolveBatch(g.goodsId); // 批次由「接口」解析后随响应返回（需求2）
        plan.items.push({
          id: _ppGenItemId(),
          name: g.goodsName,
          barcode: b.barcode,
          price: g.goodsPrice,
          origPrice: g.goodsListPrice,
          memberPrice: g.vipPrice,
          unit: b.unit,
          spec: b.spec,
          produceDate: b.productionDate,
          batchCount: b.batchCount,
          batches: b.batches,
          origin: b.origin,
          printQty: g.printQty || 1,
          printed: false,
          printedAt: null
        });
      }
      _ppUpdateStatus(plan);
      return Promise.resolve({ code: 0, message: 'success', data: plan });
    }
    return this._post('/printPlan/addGoods', req);
  },
  // §9.7 移除计划项
  removeGoods: function(req) {
    if (!this.USE_HTTP) return Promise.resolve({ code: 0, message: 'success', data: null });
    return this._post('/printPlan/removeGoods', req);
  },
  // §9.8 打印记录：data 精简（可空，以 code===0 判成功，需求4）
  print: function(req) {
    if (!this.USE_HTTP) return Promise.resolve({ code: 0, message: 'success', data: null });
    return this._post('/printPlan/print', req);
  },
  // §9.9 调价自动入计划（服务端内部；联调用）
  autoAdd: function(req) {
    if (!this.USE_HTTP) return Promise.resolve({ code: 0, message: 'success', data: null });
    return this._post('/printPlan/autoAddFromPriceChange', req);
  },
  // §9.10 改价日志加入（已恢复）
  addFromPriceChanges: function(req) {
    if (!this.USE_HTTP) return Promise.resolve({ code: 0, message: 'success', data: null });
    return this._post('/printPlan/addFromPriceChanges', req);
  }
};

// 由商品 ID 解析批次信息（FIFO 最早生产日期 + 批次数 + batches 数组）
// 替代原 _ppLookupProduceDate：批次数据改由 addGoods 接口返回（需求2）
function _ppResolveBatch(goodsId) {
  for (var i = 0; i < LABEL_PRODUCTS.length; i++) {
    var p = LABEL_PRODUCTS[i];
    if (p.id === goodsId) {
      var batches = p.batches || [];
      var ds = batches.map(function(b) { return b.produceDate; }).filter(Boolean).sort();
      return {
        barcode: p.barcode,
        unit: p.unit,
        spec: p.spec,
        origin: p.origin,
        productionDate: ds.length ? ds[0] : (p.produceDate || ''),
        batchCount: batches.length ? batches.length : 1,
        batches: batches
      };
    }
  }
  return { barcode: '', unit: '', spec: '', origin: '', productionDate: '', batchCount: 1, batches: [] };
}

// 初始化模拟数据
function _ppInitMockData() {
  if (_ppLoad()) return;
  var stores = ['崧泽大道中心店', '华科东路店', '盈港路店'];
  var today = _ppTodayStr();
  PRINT_PLANS = [
    {
      id: _ppGenId(),
      name: today + ' 调价打印',
      type: 'price-change',
      status: 'partial',
      store: '崧泽大道中心店',
      createdAt: today + ' 09:30',
      createdBy: '系统自动',
      items: [
        { id: _ppGenItemId(), name: '大白菜', barcode: '6901234567012', price: 3.5, origPrice: 5.0, memberPrice: 3.0, unit: '斤', spec: '约500g', origin: '山东寿光', printQty: 2, printed: true, printedAt: today + ' 10:15' },
        { id: _ppGenItemId(), name: '黄瓜', barcode: '6901234567029', price: 4.2, origPrice: 6.5, memberPrice: 3.6, unit: '斤', spec: '约400g', origin: '山东兰陵', printQty: 1, printed: false, printedAt: null },
        { id: _ppGenItemId(), name: '番茄', barcode: '6901234567036', price: 5.8, origPrice: 8.0, memberPrice: 4.8, unit: '斤', spec: '约500g', origin: '云南昆明', printQty: 1, printed: false, printedAt: null }
      ]
    },
    {
      id: _ppGenId(),
      name: '生鲜区价签补打',
      type: 'manual',
      status: 'pending',
      store: '华科东路店',
      createdAt: today + ' 14:00',
      createdBy: '李四',
      items: [
        { id: _ppGenItemId(), name: '五花肉', barcode: '6901234567050', price: 18.5, origPrice: 24.0, memberPrice: 16.0, unit: '斤', spec: '约500g', origin: '河南双汇', printQty: 3, printed: false, printedAt: null },
        { id: _ppGenItemId(), name: '牛腱子肉', barcode: '6901234567135', price: 42.0, origPrice: 55.0, memberPrice: 38.0, unit: '斤', spec: '约500g', origin: '内蒙古科尔沁', printQty: 2, printed: false, printedAt: null }
      ]
    },
    {
      id: _ppGenId(),
      name: today + ' 调价打印',
      type: 'price-change',
      status: 'done',
      store: '盈港路店',
      createdAt: today + ' 08:00',
      createdBy: '系统自动',
      items: [
        { id: _ppGenItemId(), name: '鲜牛奶', barcode: '6901234567067', price: 12.9, origPrice: 16.9, memberPrice: 11.5, unit: '瓶', spec: '950ml', origin: '内蒙古伊利', printQty: 2, printed: true, printedAt: today + ' 08:30' },
        { id: _ppGenItemId(), name: '东北大米', barcode: '6901234567074', price: 38.0, origPrice: 49.0, memberPrice: 35.0, unit: '袋', spec: '5kg', origin: '黑龙江五常', printQty: 1, printed: true, printedAt: today + ' 08:30' }
      ]
    }
  ];
  _ppSave();
}

function _ppGetPlan(id) {
  for (var i = 0; i < PRINT_PLANS.length; i++) {
    if (PRINT_PLANS[i].id === id) return PRINT_PLANS[i];
  }
  return null;
}

function _ppUpdateStatus(plan) {
  if (!plan || !plan.items || plan.items.length === 0) { plan.status = 'pending'; return; }
  var printed = 0;
  for (var i = 0; i < plan.items.length; i++) {
    if (plan.items[i].printed) printed++;
  }
  if (printed === 0) plan.status = 'pending';
  else if (printed < plan.items.length) plan.status = 'partial';
  else plan.status = 'done';
}

function _ppStatusText(s) {
  return s === 'pending' ? '待打印' : s === 'partial' ? '部分打印' : '已完成';
}

function _ppStatusColor(s) {
  return s === 'pending' ? '#e65100' : s === 'partial' ? '#005CF5' : '#52c41a';
}
function _ppStatusBg(s) {
  return s === 'pending' ? '#fff7e6' : s === 'partial' ? '#f2f8ff' : '#f6ffed';
}

function _ppTypeText(t) {
  return t === 'price-change' ? '调价自动' : '手动创建';
}
function _ppProductSummary(items) {
  if (!items || items.length === 0) return '—';
  var names = items.slice(0, 3).map(function(it) { return it.name; });
  var extra = items.length > 3 ? ' 等' + items.length + '件' : '';
  return names.join('、') + extra;
}

// 取商品生产日期：多批次共存时按 FIFO 取最早（最临近过期）批次
function _ppLookupProduceDate(barcode) {
  for (var i = 0; i < LABEL_PRODUCTS.length; i++) {
    var p = LABEL_PRODUCTS[i];
    if (p.barcode === barcode) {
      if (p.batches && p.batches.length) {
        var ds = p.batches.map(function(b){ return b.produceDate; }).filter(Boolean).sort();
        return ds.length ? ds[0] : (p.produceDate || '');
      }
      return p.produceDate || '';
    }
  }
  return '';
}
// 取商品批次数（用于 UI 标注多批次）
function _ppBatchCount(barcode) {
  for (var i = 0; i < LABEL_PRODUCTS.length; i++) {
    if (LABEL_PRODUCTS[i].barcode === barcode) {
      var bs = LABEL_PRODUCTS[i].batches;
      return (bs && bs.length) ? bs.length : 1;
    }
  }
  return 1;
}

function _ppPlanInTimeRange(createdAt, range) {
  if (range === 'all' || !createdAt) return true;
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var day = createdAt.slice(0, 10);
  if (range === 'today') return day === todayStr;
  if (range === 'month') return createdAt.slice(0, 7) === (now.getFullYear() + '-' + pad(now.getMonth() + 1));
  if (range === 'week') {
    var dow = now.getDay();
    var diff = (dow === 0 ? -6 : 1 - dow);
    var mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    var monStr = mon.getFullYear() + '-' + pad(mon.getMonth() + 1) + '-' + pad(mon.getDate());
    var sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    var sunStr = sun.getFullYear() + '-' + pad(sun.getMonth() + 1) + '-' + pad(sun.getDate());
    return day >= monStr && day <= sunStr;
  }
  return true;
}

function _ppFilteredPlans() {
  return PRINT_PLANS.filter(function(p) {
    if (PP_FILTER_TYPE !== 'all' && p.type !== PP_FILTER_TYPE) return false;
    if (PP_FILTER_STATUS !== 'all' && p.status !== PP_FILTER_STATUS) return false;
    if (PP_FILTER_STORE !== 'all' && p.store !== PP_FILTER_STORE) return false;
    if (PP_FILTER_TIME !== 'all' && !_ppPlanInTimeRange(p.createdAt, PP_FILTER_TIME)) return false;
    if (PP_FILTER_KEYWORD) {
      var kw = PP_FILTER_KEYWORD.toLowerCase();
      if (p.name.toLowerCase().indexOf(kw) < 0 && p.store.toLowerCase().indexOf(kw) < 0) return false;
    }
    return true;
  });
}

function initPrintPlan() {
  var el = document.getElementById('printPlanContent');
  if (!el) return;
  function _ppRenderShell() {
    el.innerHTML =
      '<div style="flex-shrink:0;margin:0;padding:10px 16px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<div class="scope-item" id="ppStorePicker" onclick="ppToggleStorePicker(event)" style="height:32px;flex:0 0 auto">' +
        '<span class="scope-val" id="ppStorePickerLabel">' + (PP_FILTER_STORE === 'all' ? '全部门店' : _esc(PP_FILTER_STORE)) + '</span>' +
        '<span class="scope-arrow">▼</span>' +
        '<div class="scope-dropdown" id="ppStoreDropdown"></div>' +
      '</div>' +
      '<div class="gl-radio-group" id="ppFilterType">' +
        '<span class="gl-radio-btn' + (PP_FILTER_TYPE === 'all' ? ' active' : '') + '" onclick="ppSetFilterType(\'all\',this)">全部</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_TYPE === 'manual' ? ' active' : '') + '" onclick="ppSetFilterType(\'manual\',this)">手动创建</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_TYPE === 'price-change' ? ' active' : '') + '" onclick="ppSetFilterType(\'price-change\',this)">调价自动</span>' +
      '</div>' +
      '<div class="gl-radio-group" id="ppFilterStatus">' +
        '<span class="gl-radio-btn' + (PP_FILTER_STATUS === 'all' ? ' active' : '') + '" onclick="ppSetFilterStatus(\'all\',this)">全部</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_STATUS === 'pending' ? ' active' : '') + '" onclick="ppSetFilterStatus(\'pending\',this)">待打印</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_STATUS === 'partial' ? ' active' : '') + '" onclick="ppSetFilterStatus(\'partial\',this)">部分打印</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_STATUS === 'done' ? ' active' : '') + '" onclick="ppSetFilterStatus(\'done\',this)">已完成</span>' +
      '</div>' +
      '<div class="gl-radio-group" id="ppFilterTime">' +
        '<span class="gl-radio-btn' + (PP_FILTER_TIME === 'all' ? ' active' : '') + '" onclick="ppSetFilterTime(\'all\',this)">全部</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_TIME === 'today' ? ' active' : '') + '" onclick="ppSetFilterTime(\'today\',this)">今天</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_TIME === 'week' ? ' active' : '') + '" onclick="ppSetFilterTime(\'week\',this)">本周</span>' +
        '<span class="gl-radio-btn' + (PP_FILTER_TIME === 'month' ? ' active' : '') + '" onclick="ppSetFilterTime(\'month\',this)">本月</span>' +
      '</div>' +
      '<input type="text" id="ppFilterKeyword" style="flex:0 1 220px;height:32px;padding:0 12px;border:1px solid #d9dbde;border-radius:4px;font-size:12px;outline:none;color:#0b1019" placeholder="计划名称" value="' + _esc(PP_FILTER_KEYWORD) + '" onkeydown="if(event.key===\'Enter\')ppSearch()" onfocus="this.style.borderColor=\'#005cf5\'" onblur="this.style.borderColor=\'#d9dbde\'">' +
      '<button class="ps-op-btn" onclick="ppReset()">重置</button>' +
      '<button class="ps-op-btn ps-op-pri" onclick="ppSearch()">查询</button>' +
      '<button class="ps-op-btn" style="margin-left:auto;border:1px dashed #b8bcc4;color:#606266" onclick="window.open(\'../prd.html?doc=打印计划模块需求说明\',\'_blank\')">📋 需求说明</button>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px;display:flex;align-items:center;gap:8px;background:#fff;border-bottom:1px solid #dfe3ed">' +
      '<button class="ps-op-btn ps-op-pri" onclick="ppOpenCreate()">+ 新建计划</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
      '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
        '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
          '<table style="width:100%;table-layout:fixed">' +
            '<thead id="ppTableHead"></thead>' +
            '<tbody id="ppTableBody"></tbody>' +
          '</table>' +
        '</div>' +
        '<div class="pagination-bar" id="ppPagination" style="flex-shrink:0"></div>' +
      '</div>' +
    '</div>';
    ppRenderTable();
  }
  if (PPApi.USE_HTTP) {
    // 联调模式：从 mock server 拉取计划列表（持有唯一数据）
    PPApi.list({}).then(function(arr) { if (arr && arr.length) { PRINT_PLANS = arr; } else { _ppInitMockData(); } _ppRenderShell(); });
    return;
  }
  _ppInitMockData();
  _ppRenderShell();
}

// ===== 文件库（file-store）=====
function initFileStore() {
  var el = document.getElementById('fileStoreContent');
  if (!el) return;
  // 顶部筛选栏 + 操作栏（白底，沿用项目规范：select 169px / input 32px / focus #005cf5）
  el.innerHTML =
    '<div style="flex-shrink:0;margin:0;padding:10px 16px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<select id="fsFilterMarket" style="height:32px;border:1px solid #d9dbde;border-radius:4px;font-size:12px;padding:0 8px;color:#0b1019;outline:none;font-weight:600" onchange="fsSetMarket(this.value)" onfocus="this.style.borderColor=\'#005cf5\'" onblur="this.style.borderColor=\'#d9dbde\'">' +
        FS_MARKETS.map(function(m) { return '<option value="' + m.marketId + '">' + _esc(m.marketName) + '</option>'; }).join('') +
      '</select>' +
      '<select id="fsFilterTaskType" style="height:32px;border:1px solid #d9dbde;border-radius:4px;font-size:12px;padding:0 8px;color:#0b1019;outline:none" onchange="fsSearch()" onfocus="this.style.borderColor=\'#005cf5\'" onblur="this.style.borderColor=\'#d9dbde\'">' +
        '<option value="">任务类型：全部</option>' +
        '<option value="inspection">巡检</option>' +
        '<option value="acceptance">验收</option>' +
        '<option value="rectification">整改</option>' +
        '<option value="training">培训</option>' +
        '<option value="inventory">盘点</option>' +
        '<option value="other">其他</option>' +
      '</select>' +
      '<input type="text" id="fsFilterKeyword" style="flex:0 1 220px;height:32px;padding:0 12px;border:1px solid #d9dbde;border-radius:4px;font-size:12px;outline:none;color:#0b1019" placeholder="文件名" onkeydown="if(event.key===\'Enter\')fsSearch()" onfocus="this.style.borderColor=\'#005cf5\'" onblur="this.style.borderColor=\'#d9dbde\'">' +
      '<button class="ps-op-btn" onclick="fsReset()">重置</button>' +
      '<button class="ps-op-btn ps-op-pri" onclick="fsSearch()">查询</button>' +
      '<button class="ps-op-btn" style="margin-left:auto;border:1px dashed #b8bcc4;color:#606266" onclick="window.open(\'../prd.html?doc=文件托管模块需求说明\',\'_blank\')">📋 需求说明</button>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px;display:flex;align-items:center;gap:8px;background:#fff;border-bottom:1px solid #dfe3ed">' +
      '<button class="ps-op-btn ps-op-pri" onclick="fsOpenUpload()">+ 上传文件</button>' +
      '<span style="font-size:12px;color:#909399">支持持续上传更新 · 仅支持下载（无在线预览）</span>' +
      '<button class="ps-op-btn" style="margin-left:auto" onclick="fsShowDeleteLog()">🗑 删除记录</button>' +
      '<span id="fsUsageStat" style="font-size:12px;color:#909399;white-space:nowrap"></span>' +
    '</div>' +
    '<div id="fsListView" style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
      '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
        '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
          '<table style="width:100%;table-layout:fixed">' +
            '<thead><tr>' +
              '<th style="width:40px"></th>' +
              '<th style="width:50px">序号</th>' +
              '<th style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">文件名</th>' +
              '<th style="width:120px">文件类型</th>' +
              '<th style="width:90px">任务类型</th>' +
              '<th style="width:110px">大小</th>' +
              '<th style="width:120px">最后操作人</th>' +
              '<th style="width:165px;white-space:nowrap">最后操作时间</th>' +
              '<th style="width:160px">操作</th>' +
            '</tr></thead>' +
            '<tbody id="fsTableBody"></tbody>' +
          '</table>' +
        '</div>' +
        '<div class="pagination-bar" id="fsPagination" style="flex-shrink:0"></div>' +
      '</div>' +
    '</div>';
  var msel = document.getElementById('fsFilterMarket');
  if (msel) msel.value = FS_FILTER.market;
  fsRenderTable();
}

// 文件类型枚举（扩展：覆盖台账/备份常见文件类型）
var FS_FILE_TYPE = {
  image:   { name: '图片',     icon: '🖼️', ext: ['png','jpg','jpeg','gif','webp','bmp'] },
  doc:     { name: '文档',     icon: '📄', ext: ['pdf','doc','docx'] },
  sheet:   { name: '表格',     icon: '📊', ext: ['xls','xlsx','csv'] },
  ppt:     { name: '演示文稿', icon: '📽️', ext: ['ppt','pptx'] },
  text:    { name: '文本',     icon: '📝', ext: ['txt','md','log'] },
  archive: { name: '压缩包',   icon: '🗜️', ext: ['zip','rar','7z','tar','gz'] },
  video:   { name: '视频',     icon: '🎬', ext: ['mp4','avi','mov'] },
  audio:   { name: '音频',     icon: '🎵', ext: ['mp3','wav'] },
  other:   { name: '其他',     icon: '📦', ext: [] }
};
var FS_FILE_EXT_MAP = {};
Object.keys(FS_FILE_TYPE).forEach(function(k){ FS_FILE_TYPE[k].ext.forEach(function(e){ FS_FILE_EXT_MAP[e] = k; }); });
function fsTypeIcon(fileType) { return (FS_FILE_TYPE[fileType] && FS_FILE_TYPE[fileType].icon) || '📦'; }
function fsTypeName(fileType) { return (FS_FILE_TYPE[fileType] && FS_FILE_TYPE[fileType].name) || '其他'; }
// 人类可读大小
function fsHumanSize(bytes) {
  if (bytes == null) return '-';
  var u = ['B', 'KB', 'MB', 'GB']; var i = 0; var n = bytes;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return (i === 0 ? n : n.toFixed(1)) + ' ' + u[i];
}

// 市场列表（文件库按市场隔离：单市场视图，不支持跨市场混合查阅 / 共享）
var FS_MARKETS = [
  { marketId: 'm-songze', marketName: '崧泽市场' },
  { marketId: 'm-qingpu', marketName: '青浦市场' },
  { marketId: 'm-songjiang', marketName: '松江市场' },
  { marketId: 'm-wujiao', marketName: '五角场市场' }
];
function fsCurrentMarketName() {
  var m = FS_MARKETS.filter(function(x) { return x.marketId === FS_FILTER.market; })[0];
  return m ? m.marketName : '';
}
var FS_FILTER = { market: FS_MARKETS[0].marketId, taskType: '', keyword: '' };
var FS_DATA = [
  { fileId: 'fs-001', fileName: '崧泽店价签模板_v3.png', market: 'm-songze', marketName: '崧泽市场', taskType: 'training', taskTypeName: '培训', fileType: 'image', fileSize: 2411724, uploader: '运营-张三', createdAt: '2026-07-28 10:12:00', updatedBy: '运营-张三', updatedAt: '2026-07-28 15:30:00' },
  { fileId: 'fs-002', fileName: '2026Q3促销活动方案.pdf', market: 'm-qingpu', marketName: '青浦市场', taskType: 'other', taskTypeName: '其他', fileType: 'doc', fileSize: 3820416, uploader: '运营-李四', createdAt: '2026-07-27 16:40:00' },
  { fileId: 'fs-003', fileName: '门店对账模板.xlsx', market: 'm-songze', marketName: '崧泽市场', taskType: 'inspection', taskTypeName: '巡检', fileType: 'sheet', fileSize: 51200, uploader: '财务-王五', createdAt: '2026-07-25 09:05:00' },
  { fileId: 'fs-004', fileName: '门店装修图打包.zip', market: 'm-songjiang', marketName: '松江市场', taskType: '', taskTypeName: '—', fileType: 'archive', fileSize: 52428800, uploader: '工程-赵六', createdAt: '2026-07-20 14:22:00' }
];

var FS_TASK_TYPE_NAME = { inspection: '巡检', acceptance: '验收', rectification: '整改', training: '培训', inventory: '盘点', spotCheck: '快检抽检', cert: '索证索票', other: '其他' };

// 删除记录（审计留痕）：文件删除后不可找回，仅记录元数据用于追溯删除责任人
var FS_DELETE_LOG = [];

// 当前市场存储用量（仅统计已用空间，不做配额/限额；演示态 = 当前市场 FS_DATA 累加；随上传/删除动态刷新）
function fsRenderStorage() {
  var el = document.getElementById('fsUsageStat');
  if (!el) return;
  var used = 0;
  for (var i = 0; i < FS_DATA.length; i++) {
    if (!FS_FILTER.market || FS_DATA[i].market === FS_FILTER.market) used += (FS_DATA[i].fileSize || 0);
  }
  var usedTxt = used >= 1024 * 1024 * 1024
    ? (used / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    : (used / (1024 * 1024)).toFixed(1) + ' MB';
  el.innerHTML = '当前市场已用存储：' + usedTxt;
}

function fsRenderTable() {
  var body = document.getElementById('fsTableBody');
  if (!body) return;
  fsRenderStorage();
  var rows = FS_DATA.filter(function(f) {
    if (FS_FILTER.market && f.market !== FS_FILTER.market) return false;
    if (FS_FILTER.taskType && (f.taskType || '') !== FS_FILTER.taskType) return false;
    if (FS_FILTER.keyword && f.fileName.indexOf(FS_FILTER.keyword) < 0) return false;
    return true;
  });
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#909399">该分类暂无文件</td></tr>';
    var pg = document.getElementById('fsPagination'); if (pg) pg.innerHTML = '';
    return;
  }
  var html = '';
  for (var i = 0; i < rows.length; i++) {
    var f = rows[i];
    html += '<tr>' +
      '<td style="text-align:center"><input type="checkbox"></td>' +
      '<td style="text-align:center">' + (i + 1) + '</td>' +
      '<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + _esc(f.fileName) + '"><span style="margin-right:6px">' + fsTypeIcon(f.fileType) + '</span>' + _esc(f.fileName) + '</td>' +
      '<td>' + fsTypeIcon(f.fileType) + ' ' + fsTypeName(f.fileType) + '</td>' +
      '<td>' + _esc(f.taskTypeName || '—') + '</td>' +
      '<td>' + fsHumanSize(f.fileSize) + '</td>' +
      '<td>' + _esc(f.updatedBy || f.uploader) + '</td>' +
      '<td style="white-space:nowrap">' + _esc(f.updatedAt || f.createdAt) + '</td>' +
      '<td>' +
        '<button class="ps-op-btn ps-op-pri" style="margin-right:6px" onclick="fsDownload(\'' + f.fileId + '\')">下载</button>' +
        '<button class="ps-op-btn ps-op-danger" onclick="fsDelete(\'' + f.fileId + '\')">删除</button>' +
      '</td>' +
    '</tr>';
  }
  body.innerHTML = html;
}

function fsSetMarket(val) {
  FS_FILTER.market = val;
  fsRenderTable();
}
function fsSearch() {
  var k = document.getElementById('fsFilterKeyword');
  if (k) FS_FILTER.keyword = k.value.trim();
  var tt = document.getElementById('fsFilterTaskType');
  if (tt) FS_FILTER.taskType = tt.value;
  fsRenderTable();
}
function fsReset() {
  var market = FS_FILTER.market; // 市场维度不随重置清除（按市场隔离）
  FS_FILTER = { market: market, taskType: '', keyword: '' };
  var kw = document.getElementById('fsFilterKeyword'); if (kw) kw.value = '';
  var tt = document.getElementById('fsFilterTaskType'); if (tt) tt.value = '';
  fsRenderTable();
}
// ===== 上传文件弹窗（产品设计态：完整交互，不实际调用存储，演示态直接写 FS_DATA）=====
var FS_UPLOAD_FILES = []; // 待上传文件（含本地 File 对象与解析后的显示信息）

function fsOpenUpload() {
  FS_UPLOAD_FILES = [];
  var html =
    '<div class="ps-overlay" id="fsUploadOverlay" onclick="fsCloseUpload()">' +
      '<div class="ps-dialog" style="width:min(560px,94vw)" onclick="event.stopPropagation()">' +
        '<div class="ps-header">' +
          '<h3>上传文件</h3>' +
          '<button class="ps-close" onclick="fsCloseUpload()">×</button>' +
        '</div>' +
        '<div class="ps-body">' +
          '<div class="ps-form-item">' +
            '<label class="ps-label">选择文件 <span class="ps-required">*</span></label>' +
            '<div class="ps-field">' +
              '<div class="fs-dropzone" id="fsDropzone" onclick="document.getElementById(\'fsFileInput\').click()">' +
                '<div style="font-size:28px;line-height:1">📁</div>' +
                '<div style="margin-top:8px;font-size:12px;color:#0b1019">点击或拖拽文件到此处上传</div>' +
                '<div style="margin-top:4px;font-size:12px;color:#909399">支持批量上传，单个文件 &lt; 20MB（可执行/脚本类由后端拦截）</div>' +
                '<input type="file" id="fsFileInput" multiple style="display:none" onchange="fsPickFiles(this)">' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div id="fsUploadList"></div>' +
          '<div class="ps-form-item">' +
            '<label class="ps-label">归属市场</label>' +
            '<div class="ps-field"><input type="text" id="fsUploadMarket" value="' + _esc(fsCurrentMarketName()) + '" readonly style="background:#f5f7fa;color:#606266;cursor:not-allowed" /></div>' +
          '</div>' +
          '<div class="ps-form-item">' +
            '<label class="ps-label">任务类型</label>' +
            '<div class="ps-field"><select id="fsUploadTaskType">' +
              '<option value="">未归类</option>' +
              '<option value="inspection">巡检</option>' +
              '<option value="acceptance">验收</option>' +
              '<option value="rectification">整改</option>' +
              '<option value="training">培训</option>' +
              '<option value="inventory">盘点</option>' +
              '<option value="other">其他</option>' +
            '</select></div>' +
          '</div>' +
          '<div class="ps-form-item" style="margin-bottom:0">' +
            '<label class="ps-label">同名策略</label>' +
            '<div class="ps-field"><select id="fsUploadOverwrite">' +
              '<option value="overwrite">覆盖（新文件替换旧版本，version 自增）</option>' +
              '<option value="versioned">新增版本（保留历史版本）</option>' +
              '<option value="reject">拒绝（同名存在则报错）</option>' +
            '</select></div>' +
          '</div>' +
        '</div>' +
        '<div class="ps-footer">' +
          '<span style="margin-right:auto;font-size:12px;color:#909399">接口：POST /mnmart/fileStore/upload（multipart/form-data）</span>' +
          '<button class="ps-op-btn" onclick="fsCloseUpload()">取消</button>' +
          '<button class="ps-op-btn ps-op-pri" onclick="fsSubmitUpload()">开始上传</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
  // 拖拽支持
  var dz = document.getElementById('fsDropzone');
  ['dragenter', 'dragover'].forEach(function(ev) {
    dz.addEventListener(ev, function(e) { e.preventDefault(); dz.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function(ev) {
    dz.addEventListener(ev, function(e) { e.preventDefault(); dz.classList.remove('drag'); });
  });
  dz.addEventListener('drop', function(e) {
    if (e.dataTransfer && e.dataTransfer.files) fsPickFiles({ files: e.dataTransfer.files });
  });
  setTimeout(function() { var inp = document.getElementById('fsFileInput'); if (inp) inp.focus(); }, 50);
}

function fsCloseUpload() {
  var ov = document.getElementById('fsUploadOverlay');
  if (ov) ov.remove();
}

// 选择 / 拖拽文件后，解析显示信息
function fsPickFiles(input) {
  var files = input && input.files ? input.files : [];
  if (!files || !files.length) return;
  // 批量模式：遍历所有选中文件，追加到待传列表（每个文件仍受 20MB / 类型限制）
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var ext = (f.name.split('.').pop() || '').toLowerCase();
    var ft = FS_FILE_EXT_MAP[ext] || 'other';
    var blocked = ['exe', 'bat', 'sh', 'msi', 'vbs', 'js'].indexOf(ext) >= 0;
    var tooLarge = f.size > 20 * 1024 * 1024;
    FS_UPLOAD_FILES.push({
      id: 'up-' + Date.now() + '-' + i,
      name: f.name, file: f, fileSize: f.size, fileType: ft, blocked: blocked, tooLarge: tooLarge
    });
  }
  fsRenderUploadList();
}

function fsRenderUploadList() {
  var box = document.getElementById('fsUploadList');
  if (!box) return;
  if (!FS_UPLOAD_FILES.length) { box.innerHTML = ''; return; }
  var html = '';
  for (var i = 0; i < FS_UPLOAD_FILES.length; i++) {
    var u = FS_UPLOAD_FILES[i];
    html += '<div class="fs-drop-item">' +
      '<span style="font-size:18px">' + fsTypeIcon(u.fileType) + '</span>' +
      '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + _esc(u.name) + '">' + _esc(u.name) + '</span>' +
      '<span style="font-size:12px;color:#909399;white-space:nowrap">' + fsHumanSize(u.fileSize) + '</span>' +
      (u.blocked ? '<span style="font-size:12px;color:#fc4b52;white-space:nowrap">类型受限</span>' : '') +
      (u.tooLarge ? '<span style="font-size:12px;color:#fc4b52;white-space:nowrap">超 20MB</span>' : '') +
      '<span class="fs-progress"><i id="fsProg-' + u.id + '"></i></span>' +
      '<button class="ps-op-btn ps-op-danger" style="height:26px;padding:0 8px" onclick="fsRemoveUpload(\'' + u.id + '\')">移除</button>' +
    '</div>';
  }
  box.innerHTML = html;
}

function fsRemoveUpload(id) {
  FS_UPLOAD_FILES = FS_UPLOAD_FILES.filter(function(u) { return u.id !== id; });
  fsRenderUploadList();
}

function fsSubmitUpload() {
  var tt = (document.getElementById('fsUploadTaskType') || {}).value || '';
  var overwrite = (document.getElementById('fsUploadOverwrite') || {}).value || 'overwrite';
  // 前端拦截：类型受限文件不允许提交（后端强制，前端仅体验）
  var blocked = FS_UPLOAD_FILES.filter(function(u) { return u.blocked; });
  if (blocked.length) { showToast('存在不支持的文件类型（' + blocked.map(function(u){return u.name;}).join('、') + '），已排除'); }
  var valid = FS_UPLOAD_FILES.filter(function(u) { return !u.blocked && !u.tooLarge; });
  if (valid.length < FS_UPLOAD_FILES.length) { showToast('单个文件需 < 20MB，请重新选择'); }
  if (!valid.length) { showToast('请先选择要上传的文件'); return; }

  // 演示态：模拟 multipart/form-data 上传 + 进度，成功后写入 FS_DATA
  var done = 0;
  valid.forEach(function(u) {
    // 模拟进度（每 120ms 增加一段）
    var prog = document.getElementById('fsProg-' + u.id);
    var p = 0;
    var timer = setInterval(function() {
      p += 12 + Math.random() * 18;
      if (p >= 100) { p = 100; clearInterval(timer); }
      if (prog) prog.style.width = p + '%';
      if (p >= 100) {
        done++;
        // 写入文件库数据（演示态：用客户端当前时间作为 createdAt）
        var now = new Date();
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        var ts = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        var id = 'fs-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        FS_DATA.unshift({
          fileId: id, fileName: u.name, market: FS_FILTER.market, marketName: fsCurrentMarketName(),
          taskType: tt, taskTypeName: tt ? (FS_TASK_TYPE_NAME[tt] || '其他') : '—',
          fileType: u.fileType, fileSize: u.fileSize, uploader: '当前用户', createdAt: ts
        });
        if (done === valid.length) {
          fsCloseUpload();
          showToast('上传成功，已加入文件库（演示态）');
          fsRenderTable();
        }
      }
    }, 120);
  });
}

function fsDownload(fileId) {
  // 仅下载，无预览：演示态生成一个带文件名的文本 Blob 触发真实下载（不内嵌预览/不打开阅读器）
  var f = FS_DATA.filter(function(x) { return x.fileId === fileId; })[0];
  if (!f) return;
  var content = '文件托管模块 · 演示态下载文件\n文件名：' + f.fileName +
    '\n任务类型：' + (f.taskTypeName || '—') + '\n大小：' + fsHumanSize(f.fileSize) +
    '\n最后操作人：' + (f.updatedBy || f.uploader) + '\n最后操作时间：' + (f.updatedAt || f.createdAt) +
    '\n\n（本模块不提供在线预览，内容获取一律通过下载到本地完成；实际文件内容由后端存储返回，见《接口定义》§9.4。）';
  var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = f.fileName + '.txt';
  document.body.appendChild(a); a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  showToast('已触发下载：' + f.fileName + '（演示态）');
}

// 删除确认：着重强调不可逆，并提供"先去下载"路径
function fsDelete(fileId) {
  var f = null;
  for (var i = 0; i < FS_DATA.length; i++) { if (FS_DATA[i].fileId === fileId) { f = FS_DATA[i]; break; } }
  if (!f) return;
  var ex = document.getElementById('fsDelOverlay');
  if (ex && ex.parentNode) ex.parentNode.removeChild(ex);
  var ov = document.createElement('div');
  ov.className = 'ps-overlay';
  ov.id = 'fsDelOverlay';
  ov.innerHTML =
    '<div class="ps-dialog" style="width:460px">' +
      '<div style="padding:20px 24px">' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600;color:#1f2329">' +
          '<span style="color:#fc4b52;font-size:20px;line-height:1">⚠</span>删除文件' +
        '</div>' +
        '<div style="margin-top:14px;padding:12px 14px;background:#fff5f5;border:1px solid #ffd6d6;border-radius:4px">' +
          '<div style="font-size:12px;font-weight:600;color:#e23c3c;line-height:1.6">文件删除后将无法找回</div>' +
          '<div style="margin-top:4px;font-size:12px;color:#a8442f;line-height:1.6">建议删除前先下载备份到本地。</div>' +
        '</div>' +
        '<div style="margin-top:10px;font-size:12px;color:#606266">文件名：<span style="color:#1f2329">' + _esc(f.fileName) + '</span></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;padding:12px 24px 20px">' +
        '<button class="ps-op-btn" id="fsDelDownloadBtn">先去下载</button>' +
        '<button class="ps-op-btn ps-op-danger" id="fsDelConfirmBtn">确认删除</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);
  document.getElementById('fsDelDownloadBtn').onclick = function() {
    if (ov.parentNode) ov.parentNode.removeChild(ov);
    fsDownload(f);
  };
  document.getElementById('fsDelConfirmBtn').onclick = function() {
    if (ov.parentNode) ov.parentNode.removeChild(ov);
    FS_DELETE_LOG.unshift({
      fileId: f.fileId, fileName: f.fileName, fileType: f.fileType, taskTypeName: f.taskTypeName,
      fileSize: f.fileSize, market: f.market, marketName: f.marketName,
      lastOperator: (f.updatedBy || f.uploader), lastOperatedAt: (f.updatedAt || f.createdAt),
      deletedBy: '当前用户', deletedAt: fsNowStr()
    });
    FS_DATA = FS_DATA.filter(function(x) { return x.fileId !== fileId; });
    fsRenderTable();
    showToast('已删除（已记入删除记录）');
  };
}

// 删除记录查看（审计留痕弹窗）
function fsNowStr() {
  var d = new Date();
  function p(n) { return (n < 10 ? '0' : '') + n; }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}
function fsShowDeleteLog() {
  var ov = document.createElement('div');
  ov.className = 'ps-overlay';
  ov.id = 'fsDelLogOverlay';
  var rows = FS_DELETE_LOG;
  var bodyHtml = rows.length ? '' : '<tr><td colspan="9" style="text-align:center;padding:40px;color:#909399">暂无删除记录</td></tr>';
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var ftName = (FS_FILE_TYPE[r.fileType] && FS_FILE_TYPE[r.fileType].name) ? FS_FILE_TYPE[r.fileType].name : '其他';
    bodyHtml += '<tr>' +
      '<td>' + _esc(r.fileName) + '</td>' +
      '<td>' + ftName + '</td>' +
      '<td>' + _esc(r.taskTypeName || '—') + '</td>' +
      '<td>' + fsHumanSize(r.fileSize) + '</td>' +
      '<td>' + _esc(r.marketName) + '</td>' +
      '<td>' + _esc(r.lastOperator) + '</td>' +
      '<td style="white-space:nowrap">' + _esc(r.lastOperatedAt) + '</td>' +
      '<td>' + _esc(r.deletedBy) + '</td>' +
      '<td style="white-space:nowrap">' + _esc(r.deletedAt) + '</td>' +
    '</tr>';
  }
  ov.innerHTML =
    '<div class="ps-dialog" style="width:min(1060px,94vw)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #dfe3ed">' +
        '<div style="font-size:15px;font-weight:600;color:#1f2329">删除记录</div>' +
        '<button class="ps-op-btn" onclick="var o=document.getElementById(\'fsDelLogOverlay\');if(o&&o.parentNode)o.parentNode.removeChild(o)">关闭</button>' +
      '</div>' +
      '<div style="padding:8px 12px 0;font-size:12px;color:#909399">文件删除后不可找回；本记录仅留存元数据，不含文件内容。其中「最后操作人」为文件最后经手人（通常即上传/维护者），如文件丢失可向其确认本地是否仍存原件。</div>' +
      '<div class="table-wrap" style="max-height:60vh;overflow:auto;margin:8px 12px 12px">' +
        '<table style="width:100%;table-layout:fixed">' +
          '<thead><tr>' +
            '<th>文件名</th>' +
            '<th style="width:70px">类型</th>' +
            '<th style="width:70px">任务</th>' +
            '<th style="width:80px">大小</th>' +
            '<th style="width:80px">市场</th>' +
            '<th style="width:90px">最后操作人</th>' +
            '<th style="width:160px;white-space:nowrap">最后操作时间</th>' +
            '<th style="width:90px">删除人</th>' +
            '<th style="width:160px;white-space:nowrap">删除时间</th>' +
          '</tr></thead>' +
          '<tbody>' + bodyHtml + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);
}

function ppSearch() {
  var k = document.getElementById('ppFilterKeyword');
  if (k) PP_FILTER_KEYWORD = k.value.trim();
  PP_PAGE = 1;
  ppRenderTable();
}

function ppSetFilterType(val, el) {
  PP_FILTER_TYPE = val;
  var btns = document.querySelectorAll('#ppFilterType .gl-radio-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  if (el) el.classList.add('active');
  PP_PAGE = 1;
  ppRenderTable();
}

function ppSetFilterStatus(val, el) {
  PP_FILTER_STATUS = val;
  var btns = document.querySelectorAll('#ppFilterStatus .gl-radio-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  if (el) el.classList.add('active');
  PP_PAGE = 1;
  ppRenderTable();
}

function ppSetFilterTime(val, el) {
  PP_FILTER_TIME = val;
  var btns = document.querySelectorAll('#ppFilterTime .gl-radio-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  if (el) el.classList.add('active');
  PP_PAGE = 1;
  ppRenderTable();
}

function ppReset() {
  PP_FILTER_TYPE = 'all';
  PP_FILTER_STATUS = 'all';
  PP_FILTER_KEYWORD = '';
  PP_FILTER_STORE = 'all';
  PP_FILTER_TIME = 'all';
  PP_PAGE = 1;
  initPrintPlan();
}

// ===== 门店筛选 picker =====
function ppToggleStorePicker(e) {
  if (e) e.stopPropagation();
  var picker = document.getElementById('ppStorePicker');
  var dd = document.getElementById('ppStoreDropdown');
  if (!picker || !dd) return;
  if (dd.classList.contains('show')) { ppCloseStorePicker(); return; }
  var html = '<div class="scope-dropdown-item' + (PP_FILTER_STORE === 'all' ? ' active' : '') + '" onclick="ppSelectStoreFilter(\'all\', event)">全部门店</div>';
  for (var i = 0; i < PP_STORES.length; i++) {
    var s = PP_STORES[i];
    html += '<div class="scope-dropdown-item' + (PP_FILTER_STORE === s ? ' active' : '') + '" onclick="ppSelectStoreFilter(\'' + _esc(s) + '\', event)">' + _esc(s) + '</div>';
  }
  dd.innerHTML = html;
  dd.classList.add('show');
  picker.classList.add('open');
  setTimeout(function() { document.addEventListener('click', ppCloseStorePickerOnDoc); }, 0);
}

function ppSelectStoreFilter(store, e) {
  if (e) e.stopPropagation();
  PP_FILTER_STORE = store;
  var label = document.getElementById('ppStorePickerLabel');
  if (label) label.textContent = (store === 'all' ? '全部门店' : store);
  PP_PAGE = 1;
  ppCloseStorePicker();
  ppRenderTable();
}

function ppCloseStorePicker() {
  var dd = document.getElementById('ppStoreDropdown');
  var picker = document.getElementById('ppStorePicker');
  if (dd) dd.classList.remove('show');
  if (picker) picker.classList.remove('open');
  document.removeEventListener('click', ppCloseStorePickerOnDoc);
}

function ppCloseStorePickerOnDoc(e) {
  var picker = document.getElementById('ppStorePicker');
  if (picker && !picker.contains(e.target)) ppCloseStorePicker();
}

function ppRenderTable() {
  var head = document.getElementById('ppTableHead');
  var body = document.getElementById('ppTableBody');
  var pag = document.getElementById('ppPagination');
  if (!head || !body) return;

  var filtered = _ppFilteredPlans();
  var total = filtered.length;
  var totalPages = Math.max(1, Math.ceil(total / PP_PAGE_SIZE));
  if (PP_PAGE > totalPages) PP_PAGE = totalPages;
  var start = (PP_PAGE - 1) * PP_PAGE_SIZE;
  var pageData = filtered.slice(start, start + PP_PAGE_SIZE);

  head.innerHTML = '<tr>' +
    '<th style="width:56px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">序号</th>' +
    '<th style="width:18%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">计划名称</th>' +
    '<th style="width:88px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">类型</th>' +
    '<th style="width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">门店</th>' +
    '<th style="width:72px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">商品数</th>' +
    '<th style="width:72px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">待打印</th>' +
    '<th style="width:72px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">已打印</th>' +
    '<th style="width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">打印进度</th>' +
    '<th style="width:22%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">计划商品</th>' +
    '<th style="width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">状态</th>' +
    '<th style="width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">创建时间</th>' +
    '<th style="width:112px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">操作</th>' +
  '</tr>';

  if (pageData.length === 0) {
    body.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:#999">暂无打印计划</td></tr>';
  } else {
    var html = '';
    for (var i = 0; i < pageData.length; i++) {
      var p = pageData[i];
      _ppUpdateStatus(p);
      var unprinted = 0;
      for (var j = 0; j < p.items.length; j++) { if (!p.items[j].printed) unprinted++; }
      var printed = p.items.length - unprinted;
      var progress = p.items.length ? Math.round(printed / p.items.length * 100) : 0;
      var productSummary = _ppProductSummary(p.items);
      html += '<tr>' +
        '<td style="text-align:center;white-space:nowrap">' + (start + i + 1) + '</td>' +
        '<td style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><button class="ps-op-link" onclick="ppOpenDetail(\'' + p.id + '\')">' + _esc(p.name) + '</button></td>' +
        '<td style="white-space:nowrap">' + _ppTypeText(p.type) + '</td>' +
        '<td style="white-space:nowrap">' + _esc(p.store || '—') + '</td>' +
        '<td style="text-align:center;white-space:nowrap">' + p.items.length + '</td>' +
        '<td style="text-align:center;white-space:nowrap">' + unprinted + '</td>' +
        '<td style="text-align:center;white-space:nowrap">' + printed + '</td>' +
        '<td style="text-align:center;white-space:nowrap">' +
          '<span style="display:inline-block;min-width:34px;text-align:right;color:#606266">' + printed + '/' + p.items.length + '</span>' +
          '<span style="display:inline-block;width:42px;height:6px;background:#eef0f3;border-radius:3px;vertical-align:middle;margin-left:6px;overflow:hidden">' +
            '<span style="display:block;height:100%;background:' + (progress === 100 ? '#52c41a' : '#005cf5') + ';width:' + progress + '%"></span>' +
          '</span>' +
        '</td>' +
        '<td style="font-size:12px;color:#606266;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + _esc(productSummary) + '">' + _esc(productSummary) + '</td>' +
        '<td style="white-space:nowrap"><span class="ps-status-tag" style="background:' + _ppStatusBg(p.status) + ';color:' + _ppStatusColor(p.status) + '">' + _ppStatusText(p.status) + '</span></td>' +
        '<td style="white-space:nowrap">' + _esc(p.createdAt) + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="ps-op-btn" style="padding:0 8px;height:28px;font-size:12px;color:#005cf5;border-color:#005cf5;background:rgba(0,92,245,0.1)" onclick="ppOpenDetail(\'' + p.id + '\')">查看</button> ' +
          (p.status === 'pending'
            ? '<button class="ps-op-btn ps-op-danger" style="padding:0 8px;height:28px;font-size:12px" onclick="ppDeletePlan(\'' + p.id + '\')">删除</button>'
            : '<button class="ps-op-btn ps-op-danger" disabled style="padding:0 8px;height:28px;font-size:12px;opacity:.45;cursor:not-allowed">删除</button>') +
        '</td>' +
      '</tr>';
    }
    body.innerHTML = html;
  }

  // 分页
  if (pag) {
    var pagHtml = '<span class="ic-page-info">共 ' + total + ' 条</span>';
    pagHtml += '<button class="ic-page-btn' + (PP_PAGE <= 1 ? ' disabled' : '') + '"' + (PP_PAGE <= 1 ? ' disabled' : ' onclick="ppGoPage(' + (PP_PAGE - 1) + ')"') + '>上一页</button>';
    var maxBtn = 5;
    var s2 = Math.max(1, PP_PAGE - Math.floor(maxBtn / 2));
    var e2 = Math.min(totalPages, s2 + maxBtn - 1);
    if (e2 - s2 < maxBtn - 1) s2 = Math.max(1, e2 - maxBtn + 1);
    for (var pg = s2; pg <= e2; pg++) {
      pagHtml += '<button class="ic-page-btn' + (pg === PP_PAGE ? ' active' : '') + '" onclick="ppGoPage(' + pg + ')">' + pg + '</button>';
    }
    pagHtml += '<button class="ic-page-btn' + (PP_PAGE >= totalPages ? ' disabled' : '') + '"' + (PP_PAGE >= totalPages ? ' disabled' : ' onclick="ppGoPage(' + (PP_PAGE + 1) + ')"') + '>下一页</button>';
    pagHtml += '<span class="ic-page-jump">第 <input type="text" id="ppJumpInput" style="width:36px;text-align:center" value="' + PP_PAGE + '" onkeydown="if(event.key===\'Enter\'){var v=parseInt(this.value);if(v>=1&&v<=' + totalPages + ')ppGoPage(v);}""> / ' + totalPages + ' 页</span>';
    pag.innerHTML = pagHtml;
  }
}

function ppGoPage(p) {
  PP_PAGE = p;
  ppRenderTable();
}

// ===== 新建计划弹窗 =====
// ===== 新建计划弹窗 =====
function ppOpenCreate() {
  var stores = PP_STORES;
  var defStore = (PP_FILTER_STORE !== 'all') ? PP_FILTER_STORE : stores[0];
  var storeOpts = stores.map(function(s) { return '<option value="' + s + '"' + (s === defStore ? ' selected' : '') + '>' + s + '</option>'; }).join('');
  var html =
    '<div class="ps-overlay" id="ppCreateOverlay" onclick="ppCloseCreate()">' +
      '<div class="ps-dialog" style="width:460px" onclick="event.stopPropagation()">' +
        '<div class="ps-header">' +
          '<h3>新建打印计划</h3>' +
          '<button class="ps-close" onclick="ppCloseCreate()">×</button>' +
        '</div>' +
        '<div class="ps-body">' +
          '<div class="ps-form-item">' +
            '<label class="ps-label">计划名称 <span class="ps-required">*</span></label>' +
            '<div class="ps-field"><input type="text" id="ppCreateName" placeholder="请输入计划名称" /></div>' +
          '</div>' +
          '<div class="ps-form-item">' +
            '<label class="ps-label">门店</label>' +
            '<div class="ps-field"><select id="ppCreateStore">' + storeOpts + '</select></div>' +
          '</div>' +
        '</div>' +
        '<div class="ps-footer">' +
          '<button class="ps-op-btn" onclick="ppCloseCreate()">取消</button>' +
          '<button class="ps-op-btn ps-op-pri" onclick="ppCreatePlan()">创建</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(function() { var inp = document.getElementById('ppCreateName'); if (inp) inp.focus(); }, 50);
}

function ppCloseCreate() {
  var ov = document.getElementById('ppCreateOverlay');
  if (ov) ov.remove();
}

function ppCreatePlan() {
  var name = (document.getElementById('ppCreateName') || {}).value || '';
  var store = (document.getElementById('ppCreateStore') || {}).value || '';
  name = name.trim();
  if (!name) { alert('请输入计划名称'); return; }
  PPApi.add({ shopId: store, companyId: PP_COMPANY_ID, type: 0, planName: name }).then(function(res) {
    if (!res || res.code !== 0) { alert((res && res.message) || '创建失败'); return; }
    if (res.data) PRINT_PLANS.unshift(res.data);
    _ppSave();
    ppCloseCreate();
    PP_PAGE = 1;
    ppRenderTable();
  });
}

// ===== 删除计划 =====
function ppDeletePlan(id) {
  var plan = _ppGetPlan(id);
  if (!plan) return;
  if (plan.status !== 'pending') { alert('仅「待打印」状态的计划可以删除'); return; }
  if (!confirm('确认删除计划「' + plan.name + '」？')) return;
  // 删除接口：code===0 即成功，data 内无冗余字段（需求3/4）
  PPApi.del(id).then(function(res) {
    if (!res || res.code !== 0) { alert((res && res.message) || '删除失败'); return; }
    for (var i = 0; i < PRINT_PLANS.length; i++) {
      if (PRINT_PLANS[i].id === id) { PRINT_PLANS.splice(i, 1); break; }
    }
    ppRenderTable();
    _ppSave();
  });
}

// ===== 计划详情弹窗 =====
function ppOpenDetail(id) {
  PP_DETAIL_PLAN_ID = id;
  if (PPApi.USE_HTTP) {
    // 联调模式：从服务端拉详情（含批次等快照字段）
    PPApi.detail(id).then(function(plan) {
      if (plan) {
        for (var i = 0; i < PRINT_PLANS.length; i++) { if (PRINT_PLANS[i].id === id) { PRINT_PLANS[i] = plan; break; } }
      }
      var p = _ppGetPlan(id);
      if (!p) return;
      _ppUpdateStatus(p);
      _ppRenderDetail();
    });
    return;
  }
  var plan = _ppGetPlan(id);
  if (!plan) return;
  _ppUpdateStatus(plan);
  _ppRenderDetail();
}

function _ppRenderDetail() {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;
  _ppUpdateStatus(plan);
  ppCloseDetail();

  var unprinted = 0;
  for (var j = 0; j < plan.items.length; j++) { if (!plan.items[j].printed) unprinted++; }

  var itemsHtml = '';
  if (plan.items.length === 0) {
    itemsHtml = '<tr><td colspan="11" style="text-align:center;padding:30px;color:#999">暂无商品，点击「添加商品」</td></tr>';
  } else {
    for (var i = 0; i < plan.items.length; i++) {
      var it = plan.items[i];
      var checked = it.printed ? '' : 'checked';
      var statusHtml = it.printed
        ? '<span class="ps-status-tag" style="background:#f6ffed;color:#52c41a">已打印</span>'
        : '<span class="ps-status-tag" style="background:#fff7e6;color:#e65100">待打印</span>';
      var qtyCell = it.printed
        ? '<span style="font-size:12px;color:#999">' + (it.printQty || 1) + '</span>'
        : '<span style="display:inline-flex;align-items:center;gap:4px">'
          + '<button class="pp-qty-btn" onclick="ppStepQty(\'' + it.id + '\',-1)">−</button>'
          + '<span style="min-width:18px;text-align:center;font-size:12px">' + (it.printQty || 1) + '</span>'
          + '<button class="pp-qty-btn" onclick="ppStepQty(\'' + it.id + '\',1)">＋</button>'
        + '</span>';
      itemsHtml += '<tr>' +
        '<td style="text-align:center;width:40px"><input type="checkbox" class="pp-item-cb" data-item-id="' + it.id + '" data-printed="' + (it.printed ? '1' : '0') + '"' + ' ' + checked + ' style="width:16px;height:16px;accent-color:#005cf5" /></td>' +
        '<td style="width:50px;text-align:center">' + (i + 1) + '</td>' +
        '<td style="width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(it.name) + '</td>' +
        '<td style="width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(it.barcode) + '</td>' +
        '<td style="width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(it.spec || '—') + '</td>' +
        '<td style="text-align:center;width:118px">¥' + it.price.toFixed(2) + '/' + _esc(it.unit) + '</td>' +
        '<td style="text-align:center;width:112px">¥' + (it.origPrice != null ? it.origPrice.toFixed(2) : '—') + '</td>' +
        (function(){ var _pd = it.produceDate || _ppLookupProduceDate(it.barcode) || ''; var _bc = (it.batchCount != null ? it.batchCount : _ppBatchCount(it.barcode)); return '<td style="width:130px">' + (_pd ? _esc(_pd) : '—') + (_bc > 1 ? '<span class="pp-batch-tag" title="多批次共存，按 FIFO 取最早批次（最临近过期）打印">'+_bc+'批</span>' : '') + '</td>'; })() +
        '<td style="text-align:center;width:100px">' + statusHtml + '</td>' +
        '<td style="text-align:center;width:110px;white-space:nowrap">' + qtyCell + '</td>' +
        '<td style="text-align:center;width:100px;white-space:nowrap" title="' + _esc(it.printedAt || '') + '">' + (it.printed ? _esc(_ppFmtPrintedAt(it.printedAt) || '—') : '<button class="ps-op-btn ps-op-danger" style="padding:0 8px;height:26px;font-size:12px" onclick="ppRemoveProduct(\'' + it.id + '\')">移除</button>') + '</td>' +
      '</tr>';
    }
  }

  var html =
    '<div class="ps-overlay" id="ppDetailOverlay" onclick="ppCloseDetail()">' +
      '<div class="ps-dialog" style="width:min(1400px,95%);height:calc(100% - 120px);max-height:none" onclick="event.stopPropagation()">' +
        '<div class="ps-header">' +
          '<h3>' + _esc(plan.name) + '</h3>' +
          '<div style="display:flex;align-items:center;gap:12px">' +
            '<span class="ps-status-tag" style="background:' + _ppStatusBg(plan.status) + ';color:' + _ppStatusColor(plan.status) + '">' + _ppStatusText(plan.status) + '</span>' +
            '<button class="ps-close" onclick="ppCloseDetail()">×</button>' +
          '</div>' +
        '</div>' +
        '<div class="ps-info-bar">' +
          '<span>门店：<b>' + _esc(plan.store || '—') + '</b></span>' +
          '<span>类型：<b>' + _ppTypeText(plan.type) + '</b></span>' +
          '<span>商品数：<b>' + plan.items.length + '</b></span>' +
          '<span>待打印：<b style="color:#e65100">' + unprinted + '</b></span>' +
          '<span>创建：<b>' + _esc(plan.createdAt) + '</b></span>' +
        '</div>' +
        '<div style="padding:8px 16px;background:#f7f9fc;border-bottom:1px solid #eef1f5;font-size:12px;color:#8a94a6;display:flex;align-items:center;gap:6px">' +
          '📅 备注：商品生产日期按批次先进先出（FIFO）取最早批次（最临近过期）打印；多批次共存时标注批次数' +
        '</div>' +
        '<div class="ps-btn-bar">' +
          '<button class="ps-op-btn ps-op-pri" onclick="ppAddProduct()">+ 添加商品</button>' +
          '<label style="font-size:12px;color:#606266;display:flex;align-items:center;gap:4px;cursor:pointer">' +
            '<input type="checkbox" id="ppSelectAllCb" onchange="ppToggleAll(this.checked)" style="width:16px;height:16px;accent-color:#005cf5" /> 全选未打印' +
          '</label>' +
          '<div style="flex:1"></div>' +
          '<button class="ps-op-btn ps-op-danger" onclick="ppRemoveAllUnprinted()">移除未打印</button>' +
        '</div>' +
        '<div style="flex:1;min-height:0;overflow-x:auto;overflow-y:auto">' +
          '<table class="ps-table" style="table-layout:fixed;min-width:1260px">' +
            '<thead><tr>' +
              '<th style="width:40px;text-align:center"></th>' +
              '<th style="width:50px;text-align:center">序号</th>' +
              '<th style="width:220px">商品名称</th>' +
              '<th style="width:150px">编码</th>' +
              '<th style="width:120px">规格</th>' +
              '<th style="width:118px;text-align:center">价格</th>' +
              '<th style="width:112px;text-align:center">原价</th>' +
              '<th style="width:130px">生产日期</th>' +
              '<th style="width:100px;text-align:center">状态</th>' +
              '<th style="width:110px;text-align:center;white-space:nowrap">打印份数</th>' +
              '<th style="width:100px;text-align:center;white-space:nowrap">操作</th>' +
            '</tr></thead>' +
            '<tbody id="ppDetailItems">' + itemsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="ps-footer" style="justify-content:flex-end">' +
          '<button class="ps-op-btn" onclick="ppCloseDetail()">取消</button>' +
          '<button class="ps-op-btn ps-op-pri" onclick="ppPrintSelected()">打印选中</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
  ppRenderTable(); // 加入/删除/打印商品后同步刷新底层列表状态
}

function ppCloseDetail() {
  var ov = document.getElementById('ppDetailOverlay');
  if (ov) ov.remove();
}

function ppToggleAll(checked) {
  var cbs = document.querySelectorAll('.pp-item-cb');
  for (var i = 0; i < cbs.length; i++) {
    // 全选只针对未打印项；已打印项保留手动勾选（二次打印）能力，不随全选变动
    if (cbs[i].getAttribute('data-printed') !== '1') cbs[i].checked = checked;
  }
}

function ppSetQty(itemId, val) {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;
  var qty = parseInt(val) || 1;
  if (qty < 1) qty = 1;
  for (var i = 0; i < plan.items.length; i++) {
    if (plan.items[i].id === itemId) { plan.items[i].printQty = qty; break; }
  }
}

function ppStepQty(itemId, delta) {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;
  for (var i = 0; i < plan.items.length; i++) {
    if (plan.items[i].id === itemId) {
      var q = parseInt(plan.items[i].printQty) || 1;
      q += delta;
      if (q < 1) q = 1;
      plan.items[i].printQty = q;
      break;
    }
  }
  _ppRenderDetail();
  _ppSave();
}

function ppRemoveProduct(itemId) {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;
  PPApi.removeGoods({ printPlanId: plan.id, itemIds: [itemId] }).then(function(res) {
    if (!res || res.code !== 0) { alert((res && res.message) || '移除失败'); return; }
    plan.items = plan.items.filter(function(it) { return it.id !== itemId; });
    _ppRenderDetail();
    ppRenderTable();
    _ppSave();
  });
}

function ppRemoveAllUnprinted() {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;
  var unprinted = plan.items.filter(function(it) { return !it.printed; });
  if (unprinted.length === 0) { alert('当前没有未打印的商品'); return; }
  if (!confirm('确认移除全部 ' + unprinted.length + ' 件未打印商品？已打印的商品将保留。')) return;
  PPApi.removeGoods({ printPlanId: plan.id, removeAllUnprinted: true }).then(function(res) {
    if (!res || res.code !== 0) { alert((res && res.message) || '移除失败'); return; }
    plan.items = plan.items.filter(function(it) { return it.printed; });
    _ppRenderDetail();
    ppRenderTable();
    _ppSave();
  });
}

// ===== 添加商品弹窗 =====
function ppAddProduct() {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;

  var productHtml = '';
  var catSet = {};
  for (var i = 0; i < LABEL_PRODUCTS.length; i++) {
    var p = LABEL_PRODUCTS[i];
    if (p.cat) catSet[p.cat] = true;
    var alreadyIn = false;
    for (var j = 0; j < plan.items.length; j++) {
      if (plan.items[j].barcode === p.barcode) { alreadyIn = true; break; }
    }
    productHtml += '<tr data-cat="' + _esc(p.cat || '') + '">' +
      '<td style="text-align:center;width:40px"><input type="checkbox" class="pp-add-cb" data-prod-id="' + p.id + '"' + (alreadyIn ? ' disabled' : '') + ' style="width:16px;height:16px;accent-color:#005cf5" /></td>' +
      '<td style="width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(p.name) + '</td>' +
      '<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(p.barcode) + '</td>' +
      '<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(p.spec || '—') + '</td>' +
      '<td style="text-align:center;width:110px">¥' + p.price.toFixed(2) + '/' + _esc(p.unit) + '</td>' +
      '<td style="text-align:center;width:100px">' + (alreadyIn ? '<span class="ps-status-tag" style="background:#f3f4f7;color:#999">已添加</span>' : '') + '</td>' +
    '</tr>';
  }

  var cats = Object.keys(catSet);
  var catOpts = '<option value="all">全部分类</option>';
  for (var c = 0; c < cats.length; c++) {
    catOpts += '<option value="' + _esc(cats[c]) + '">' + _esc(cats[c]) + '</option>';
  }

  var html =
    '<div class="ps-overlay" id="ppAddOverlay" onclick="ppCloseAdd()">' +
      '<div class="ps-dialog" style="width:min(760px,94vw)" onclick="event.stopPropagation()">' +
        '<div class="ps-header">' +
          '<h3>添加商品到「' + _esc(plan.name) + '」</h3>' +
          '<button class="ps-close" onclick="ppCloseAdd()">×</button>' +
        '</div>' +
        '<div class="ps-search" style="display:flex;align-items:center;gap:8px">' +
          '<select id="ppAddCat" onchange="ppFilterAddList()" style="width:140px;height:32px;padding:0 12px;border:1px solid #d9dbde;border-radius:4px;font-size:12px;background:#fff;outline:none;color:#0b1019;flex-shrink:0">' + catOpts + '</select>' +
          '<input type="text" id="ppAddSearch" placeholder="搜索商品名称/条码" oninput="ppFilterAddList()" style="flex:1" />' +
        '</div>' +
        '<div style="min-height:0;overflow-x:auto;overflow-y:auto;height:380px">' +
          '<table class="ps-table" id="ppAddTable" style="table-layout:fixed;width:100%">' +
            '<thead><tr>' +
              '<th style="width:40px"></th>' +
              '<th style="width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">商品名称</th>' +
              '<th style="width:130px">编码</th>' +
              '<th style="width:96px">规格</th>' +
              '<th style="width:110px">价格</th>' +
              '<th style="width:100px;text-align:center">状态</th>' +
            '</tr></thead>' +
            '<tbody id="ppAddBody">' + productHtml + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="ps-footer">' +
          '<span style="flex:1;font-size:12px;color:#606266" id="ppAddCount">已选 0 件</span>' +
          '<button class="ps-op-btn" onclick="ppCloseAdd()">取消</button>' +
          '<button class="ps-op-btn ps-op-pri" onclick="ppConfirmAdd()">确认添加</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
  // 更新选中计数
  document.querySelectorAll('.pp-add-cb').forEach(function(cb) {
    cb.addEventListener('change', function() { ppUpdateAddCount(); });
  });
}

function ppUpdateAddCount() {
  var cbs = document.querySelectorAll('.pp-add-cb:checked');
  var el = document.getElementById('ppAddCount');
  if (el) el.textContent = '已选 ' + cbs.length + ' 件';
}

function ppFilterAddList() {
  var kwEl = document.getElementById('ppAddSearch');
  var catEl = document.getElementById('ppAddCat');
  var kw = (kwEl ? kwEl.value : '').toLowerCase();
  var cat = catEl ? catEl.value : 'all';
  var rows = document.querySelectorAll('#ppAddBody tr');
  for (var i = 0; i < rows.length; i++) {
    var text = (rows[i].textContent || '').toLowerCase();
    var rowCat = rows[i].getAttribute('data-cat') || '';
    var okKw = text.indexOf(kw) >= 0;
    var okCat = (cat === 'all') || (rowCat === cat);
    rows[i].style.display = (okKw && okCat) ? '' : 'none';
  }
}

function ppCloseAdd() {
  var ov = document.getElementById('ppAddOverlay');
  if (ov) ov.remove();
}

function ppConfirmAdd() {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;
  var cbs = document.querySelectorAll('.pp-add-cb:checked');
  if (cbs.length === 0) { alert('请选择要添加的商品'); return; }
  // 构建请求（§9.6 新规范：商品列表每项携带商品名称/原价/售价/会员价）
  var goodsList = [];
  var chosen = [];
  for (var i = 0; i < cbs.length; i++) {
    var pid = cbs[i].getAttribute('data-prod-id');
    var prod = null;
    for (var j = 0; j < LABEL_PRODUCTS.length; j++) {
      if (LABEL_PRODUCTS[j].id === pid) { prod = LABEL_PRODUCTS[j]; break; }
    }
    if (prod) {
      chosen.push(prod);
      goodsList.push({
        goodsId: prod.id,
        goodsName: prod.name,
        goodsListPrice: prod.origPrice,
        goodsPrice: prod.price,
        vipPrice: prod.memberPrice,
        printQty: 1
      });
    }
  }
  if (goodsList.length === 0) return;
  // 调用 addGoods：批次数据由接口响应返回（需求2），不再单独查批次接口
  PPApi.addGoods({
    printPlanId: plan.id,
    shopId: plan.store || '',
    companyId: PP_COMPANY_ID,
    goodsList: goodsList
  }).then(function(res) {
    if (!res || res.code !== 0) { alert((res && res.message) || '添加失败'); return; }
    // 以接口返回的更新后计划刷新（item 已含 productionDate/batchCount）
    var updated = (res.data && res.data.items) ? res.data : plan;
    for (var i = 0; i < PRINT_PLANS.length; i++) {
      if (PRINT_PLANS[i].id === updated.id) { PRINT_PLANS[i] = updated; break; }
    }
    PP_DETAIL_PLAN_ID = updated.id;
    ppCloseAdd();
    _ppRenderDetail();
    ppRenderTable();
    _ppSave();
  });
}

// ===== 打印选中商品 =====
function ppPrintSelected() {
  var plan = _ppGetPlan(PP_DETAIL_PLAN_ID);
  if (!plan) return;
  var cbs = document.querySelectorAll('.pp-item-cb:checked');
  if (cbs.length === 0) { alert('请勾选要打印的商品'); return; }

  var selectedIds = [];
  for (var i = 0; i < cbs.length; i++) {
    selectedIds.push(cbs[i].getAttribute('data-item-id'));
  }

  var products = [];
  for (var j = 0; j < plan.items.length; j++) {
    var it = plan.items[j];
    if (selectedIds.indexOf(it.id) >= 0) {
      for (var k = 0; k < it.printQty; k++) {
        products.push({
          name: it.name,
          price: it.price,
          origPrice: it.origPrice,
          spec: it.spec,
          unit: it.unit,
          barcode: it.barcode,
          origin: it.origin,
          memberPrice: it.memberPrice,
          produceDate: it.produceDate
        });
      }
    }
  }

  if (products.length === 0) { alert('未找到可打印的商品'); return; }

  // 本地乐观标记已打印（演示态）
  var now = _ppNow();
  for (var m = 0; m < plan.items.length; m++) {
    if (selectedIds.indexOf(plan.items[m].id) >= 0) {
      plan.items[m].printed = true;
      plan.items[m].printedAt = now;
    }
  }

  // 上报打印记录（§9.8）：响应精简（data 可空，以 code===0 判成功，需求4）
  var copies = {};
  for (var c = 0; c < plan.items.length; c++) {
    if (selectedIds.indexOf(plan.items[c].id) >= 0) copies[plan.items[c].id] = plan.items[c].printQty;
  }
  PPApi.print({ printPlanId: plan.id, itemIds: selectedIds, templateId: _PL_PRINT_TPL, copies: copies }).then(function() {
    // 使用已有的打印对话框
    _PL_PRINT_PRODUCTS = products;
    _showPlPrintDialog();
    _ppRenderDetail();
    ppRenderTable();
    _ppSave();
  });
}

// ===== 从列表直接打印 =====
function ppPrintFromList(id) {
  ppOpenDetail(id);
  // 弹窗渲染后自动勾选未打印项（已打印需手动勾选二次打印）
  setTimeout(function() {
    var cbs = document.querySelectorAll('.pp-item-cb');
    for (var i = 0; i < cbs.length; i++) {
      if (cbs[i].getAttribute('data-printed') !== '1') cbs[i].checked = true;
    }
    var cb = document.getElementById('ppSelectAllCb');
    if (cb) cb.checked = false;
  }, 100);
}

// ===== 改价日志 → 加入打印计划 =====
// ===== 调价商品加入打印计划（核心）=====
// 所有调价行为（改价日志/销售改价/商品编辑等，规则5）统一调用本函数。
// products: [{ name, barcode, price, origPrice, memberPrice, unit, spec, produceDate, origin, printQty }]
function ppAddPriceChangeProducts(products, forceType) {
  if (!products || products.length === 0) return null;
  var today = _ppTodayStr();

  // —— 目标计划选择（规则2/3/4，支持 forceType）——
  // forceType==='price-change'（默认，自动调价）：P1 优先当天调价自动计划 → P2 当天未完成计划 → P3 新建调价自动计划
  // forceType==='manual'（手动加入）：仅用当天未完成 manual 计划 → 否则新建 manual 计划
  var wantAuto = (forceType !== 'manual');
  var priceChangePlan = null, pcLatest = '';
  var incompletePlan = null, incLatest = '';
  for (var i = 0; i < PRINT_PLANS.length; i++) {
    var p = PRINT_PLANS[i];
    if (p.createdAt.indexOf(today) !== 0) continue; // 仅限当天
    if (p.type === 'price-change') {
      if (wantAuto && (!priceChangePlan || p.createdAt > pcLatest)) { priceChangePlan = p; pcLatest = p.createdAt; }
    } else if (p.status !== 'done') { // manual 且未完成
      if (!incompletePlan || p.createdAt > incLatest) { incompletePlan = p; incLatest = p.createdAt; }
    }
  }

  var plan;
  if (wantAuto) {
    if (priceChangePlan) {
      plan = priceChangePlan;                        // P1
    } else if (incompletePlan) {
      plan = incompletePlan;                         // P2
    } else {
      plan = {                                       // P3 新建「调价自动」计划
        id: _ppGenId(),
        name: today + ' 调价打印',
        type: 'price-change',
        status: 'pending',
        store: products[0].origin || (products[0].store || ''),
        createdAt: _ppNow(),
        createdBy: '系统自动',
        items: []
      };
      PRINT_PLANS.unshift(plan);
    }
  } else {
    if (incompletePlan) {
      plan = incompletePlan;                         // 当天未完成 manual 计划
    } else {
      plan = {                                       // 新建「手动」计划
        id: _ppGenId(),
        name: today + ' 手动加入',
        type: 'manual',
        status: 'pending',
        store: products[0].origin || (products[0].store || ''),
        createdAt: _ppNow(),
        createdBy: '当前用户',
        items: []
      };
      PRINT_PLANS.unshift(plan);
    }
  }

  // —— 加入/更新商品（规则1/2/4，按 §5.3 精确化）——
  // 无同条码 → 新增（待打印，最新价）
  // 有同条码且价格与计划相同 → 任何信息都不修改（含打印状态，规则1：价格没变则不更新、不重置）
  // 有同条码且价格不同 → 仅当计划可更新时才：同步最新价 + 状态置为待打印
  //   计划可更新 = 「调价自动(price-change)」任意状态 或 「用户新增(manual)且计划未完成(plan.status!=='done'，以计划状态为准)」
  //   计划为「用户新增且已完成」→ 即便价格不同也不更新信息、不重置打印状态
  var addedCount = 0, updatedCount = 0, resetCount = 0;
  var planUpdatable = (plan.type === 'price-change')
    || (plan.type === 'manual' && plan.status !== 'done');
  for (var m = 0; m < products.length; m++) {
    var prod = products[m];
    var mp = (prod.memberPrice != null) ? prod.memberPrice : 0;
    var found = null;
    for (var n = 0; n < plan.items.length; n++) {
      if (plan.items[n].barcode === prod.barcode) { found = plan.items[n]; break; }
    }
    if (!found) {
      plan.items.push({
        id: _ppGenItemId(),
        name: prod.name,
        barcode: prod.barcode,
        price: prod.price,
        origPrice: prod.origPrice,
        memberPrice: mp,
        unit: prod.unit,
        spec: prod.spec,
        produceDate: prod.produceDate,
        origin: prod.origin,
        printQty: prod.printQty || 1,
        printed: false,
        printedAt: null
      });
      addedCount++;
    } else {
      var samePrice = (found.price === prod.price)
        && (found.origPrice === prod.origPrice)
        && (found.memberPrice === mp);
      if (samePrice) continue;                 // 价格相同：不改任何信息（含打印状态）
      if (!planUpdatable) continue;            // 用户新增且已完成：价格不同也不更新、不重置打印状态
      found.price = prod.price;
      found.origPrice = prod.origPrice;
      found.memberPrice = mp;
      found.spec = prod.spec;
      found.unit = prod.unit;
      found.produceDate = prod.produceDate;
      found.origin = prod.origin;
      if (found.printed) { found.printed = false; found.printedAt = null; resetCount++; }
      updatedCount++;
    }
  }

  _ppUpdateStatus(plan); // 规则4：计划状态 待打印/部分打印；规则6：进度 = 已打印/总商品数
  return { plan: plan, addedCount: addedCount, updatedCount: updatedCount, resetCount: resetCount };
}

function ppAddToPlanFromPriceLog(logIds, forceType) {
  forceType = forceType || 'price-change';
  // 从 PL_LOGS 收集商品
  var seen = {};
  var products = [];
  for (var j = 0; j < PL_LOGS.length; j++) {
    var log = PL_LOGS[j];
    if (logIds.indexOf(log.id) >= 0 && !seen[log.code]) {
      seen[log.code] = true;
      products.push({
        name: log.name,
        barcode: log.code,
        price: log.newPrice,
        origPrice: log.origPrice,
        memberPrice: log.newMemberPrice || 0,
        unit: log.unit,
        spec: log.spec,
        produceDate: _ppLookupProduceDate(log.code),
        batchCount: _ppBatchCount(log.code),
        origin: log.store || '',
        printQty: 1
      });
    }
  }
  if (products.length === 0) { alert('未找到选中的改价商品'); return; }

  // 联调模式：走真实 addFromPriceChanges 接口（§9.10 已恢复）
  if (PPApi.USE_HTTP) {
    PPApi.addFromPriceChanges({
      target: forceType === 'manual' ? 'new' : 'latest',
      shopId: (products[0].origin || ''),
      companyId: PP_COMPANY_ID,
      goodsList: products.map(function(p) {
        return { goodsId: '', goodsName: p.name, goodsListPrice: p.origPrice, goodsPrice: p.price, vipPrice: p.memberPrice, recordTime: '' };
      })
    }).then(function(res) {
      if (res && res.code === 0) {
        var added = (res.data && res.data.added) || 0;
        alert('已加入' + (forceType === 'manual' ? '手动' : '调价自动') + '打印计划（新增 ' + added + ' 件）');
      } else {
        alert((res && res.message) || '加入失败');
      }
      refreshPlansFromServerOrLocal();
    });
    return;
  }

  var r = ppAddPriceChangeProducts(products, forceType);
  if (r && (r.addedCount > 0 || r.updatedCount > 0)) {
    var msg = '已将 ' + r.addedCount + ' 件商品加入计划「' + r.plan.name + '」';
    if (r.updatedCount > 0) msg += '\n其中 ' + r.updatedCount + ' 件价格有变动已更新' + (r.resetCount > 0 ? '（' + r.resetCount + ' 件已打印的已重置为待打印，旧价签作废需重打）' : '') + (r.resetCount < r.updatedCount ? '，其余待打印项同步更新价格' : '');
    alert(msg);
  } else {
    alert('选中的商品已在计划中且价格相同，无需重复添加');
  }
  ppRenderTable(); // 同步刷新打印计划列表（若当前在打印计划页）
  _ppSave();
}

// 联调（?api=1）/本地 刷新打印计划列表
function refreshPlansFromServerOrLocal() {
  if (PPApi.USE_HTTP) {
    PPApi.list({}).then(function(arr) { if (arr && arr.length) PRINT_PLANS = arr; ppRenderTable(); });
    return;
  }
  ppRenderTable();
}


function icToggleDropdown() {
  var dd = document.getElementById('icSelectDropdown');
  var isOpen = dd.classList.contains('open');
  if (isOpen) { icCloseDropdown(); return; }
  icRenderProductList('');
  document.getElementById('icSelectSearch').value = '';
  dd.classList.add('open');
}
function icCloseDropdown() {
  document.getElementById('icSelectDropdown').classList.remove('open');
  document.getElementById('icSelectSearch').value = '';
}
function icFilterProducts() {
  var kw = (document.getElementById('icSelectSearch').value||'').trim().toLowerCase();
  icRenderProductList(kw);
}
function icRenderProductList(kw) {
  var list = LABEL_PRODUCTS;
  if (kw) list = list.filter(function(p){ return p.name.indexOf(kw)>=0 || p.barcode.indexOf(kw)>=0; });
  var sel = window._icSelectedProduct;
  var html = list.length===0
    ? '<div class="ic-select-no-result">无匹配商品</div>'
    : list.map(function(p) {
        var cls = sel && sel.id===p.id ? 'ic-select-item selected' : 'ic-select-item';
        return '<div class="'+cls+'" onclick="icSelectProduct(\''+p.id+'\')">' +
          '<span>'+_esc(p.name)+' <span style="font-size:11px;color:var(--text-muted)">'+p.cat+'</span></span>' +
          '<span class="ic-si-code">'+p.barcode+'</span>' +
        '</div>';
      }).join('');
  document.getElementById('icSelectList').innerHTML = html;
}
function icSelectProduct(pid) {
  var p = LABEL_PRODUCTS.find(function(x){ return x.id===pid; });
  if (!p) return;
  window._icSelectedProduct = p;
  document.getElementById('icSelectInput').value = p.name;
  document.getElementById('icUnitPrice').value = p.price;
  document.getElementById('icPcodeVal').textContent = p.barcode;
  document.getElementById('icPcodeRow').style.display = 'flex';
  icCloseDropdown();
  icPreviewPrice();
}
function icClearSelection() {
  window._icSelectedProduct = null;
  document.getElementById('icSelectInput').value = '';
  document.getElementById('icPcodeRow').style.display = 'none';
  document.getElementById('icPcodeVal').textContent = '--';
}
// 点击外部关闭下拉（全局委托，运行动态检查）
document.addEventListener('click', function(e) {
  var dd = document.getElementById('icSelectDropdown');
  if (!dd || !dd.classList.contains('open')) return;
  var wrap = document.getElementById('icSelectWrap');
  if (!wrap) return;
  var node = e.target;
  while (node) { if (node === wrap) return; node = node.parentNode; }
  dd.classList.remove('open');
  var s = document.getElementById('icSelectSearch');
  if (s) s.value = '';
});

// ===== 记录详情面板 =====
function icSelectRecord(id) {
  if (window._icSelectedId === id) { icCloseRecordDetail(); return }
  window._icSelectedId = id;
  renderCodeList();
  document.getElementById('icGenPanel').style.display = 'none';
  document.getElementById('icDetailPanel').style.display = 'block';
  icRenderDetail(id);
}
function icCloseRecordDetail() {
  window._icSelectedId = null;
  renderCodeList();
  document.getElementById('icGenPanel').style.display = 'block';
  document.getElementById('icDetailPanel').style.display = 'none';
}
function icRenderDetail(id) {
  var item = IC_CODES.find(function(c){ return c.id === id; });
  if (!item) return;
  var isOT = item.status === 'active' && _icIsOvertime(item.time);
  var st = item.status === 'active' ? (isOT ? '超时未结' : '待核销') : item.status === 'used' ? '已核销' : '已销毁';
  var h = '';
  h += '<div class="ic-detail-field"><span class="ic-detail-label">商品</span><span class="ic-detail-value">' + _esc(item.name) + '</span></div>';
  h += '<div class="ic-detail-field"><span class="ic-detail-label">条码</span><span class="ic-detail-value"><code>' + item.code + '</code></span></div>';
  if (item.productCode) h += '<div class="ic-detail-field"><span class="ic-detail-label">商品码</span><span class="ic-detail-value"><code>' + item.productCode + '</code></span></div>';
  h += '<div class="ic-detail-field"><span class="ic-detail-label">重量</span><span class="ic-detail-value">' + item.weight + ' 斤</span></div>';
  h += '<div class="ic-detail-field"><span class="ic-detail-label">金额</span><span class="ic-detail-value">¥' + item.price.toFixed(2) + '</span></div>';
  h += '<div class="ic-detail-field"><span class="ic-detail-label">状态</span><span class="ic-detail-value">' + st + '</span></div>';
  if (item.status === 'voided' && item.voidedBy) h += '<div class="ic-detail-field"><span class="ic-detail-label">销毁人</span><span class="ic-detail-value">' + _esc(item.voidedBy) + '</span></div>';
  h += '<div class="ic-detail-field"><span class="ic-detail-label">生成时间</span><span class="ic-detail-value">' + item.time + '</span></div>';
  h += '<div class="ic-detail-actions">';
  if (item.status === 'active') h += '<button class="ic-btn" onclick="manualVoid(\'' + item.id + '\')">回收销毁</button>';
  h += '</div>';
  document.getElementById('icDetailBody').innerHTML = h;
}

function icSetFilter(f, el) {
  IC_FILTER = f;
  IC_PAGE = 1;
  document.querySelectorAll('.ic-ftab').forEach(function(t){ t.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderCodeList(false);
}

// 超时判定：打码后 30 分钟未结算
function _icIsOvertime(timeStr) {
  // timeStr 格式: "2026-06-08 11:23" 或 "2026-06-08 11:23:45"
  var iso = timeStr.replace(' ','T');
  if (iso.length === 16) iso += ':00';
  var t = new Date(iso).getTime();
  return (Date.now() - t) > 30 * 60 * 1000;
}

function _getICDateRange() {
  var now = new Date()
  var todayStr = fmtDate ? fmtDate(now) : (now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate()))
  if (currentRange === 'today') {
    var ov = periodOverrides && periodOverrides.today
    var d = ov ? ov.date : todayStr
    return { start: d, end: d }
  }
  if (currentRange === 'week') {
    var ov = periodOverrides && periodOverrides.week
    if (ov) return { start: ov.start, end: ov.end }
    var dow = now.getDay(); dow = dow === 0 ? 7 : dow
    var mon = new Date(now); mon.setDate(now.getDate() - dow + 1)
    var sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { start: fmtDate ? fmtDate(mon) : (mon.getFullYear()+'-'+pad(mon.getMonth()+1)+'-'+pad(mon.getDate())),
             end: fmtDate ? fmtDate(sun) : (sun.getFullYear()+'-'+pad(sun.getMonth()+1)+'-'+pad(sun.getDate())) }
  }
  if (currentRange === 'month') {
    var ov = periodOverrides && periodOverrides.month
    var y = ov ? ov.year : now.getFullYear()
    var m = ov ? ov.month : now.getMonth()
    return {
      start: y + '-' + pad(m + 1) + '-01',
      end: y + '-' + pad(m + 1) + '-' + pad(new Date(y, m + 1, 0).getDate())
    }
  }
  return { start: todayStr, end: todayStr }
}

function renderCodeStats() {
  var el = document.getElementById('icStatRow');
  if (!el) return;
  var dr = _getICDateRange();
  var total = IC_CODES.filter(function(c){ var d=c.time.substring(0,10); return d>=dr.start && d<=dr.end; }).length;
  var active = IC_CODES.filter(function(c){ var d=c.time.substring(0,10); return c.status==='active' && d>=dr.start && d<=dr.end; }).length;
  var overtime = IC_CODES.filter(function(c){ var d=c.time.substring(0,10); return c.status==='active' && _icIsOvertime(c.time) && d>=dr.start && d<=dr.end; }).length;
  var used   = IC_CODES.filter(function(c){ var d=c.time.substring(0,10); return c.status==='used' && d>=dr.start && d<=dr.end; }).length;
  var voided = IC_CODES.filter(function(c){ var d=c.time.substring(0,10); return c.status==='voided' && d>=dr.start && d<=dr.end; }).length;
  el.innerHTML =
    '<div class="ic-stat-card"><div class="ic-stat-val">'+total+'</div><div class="ic-stat-lbl">累计打码</div></div>'+
    '<div class="ic-stat-card"><div class="ic-stat-val" style="color:#005CF5">'+active+'</div><div class="ic-stat-lbl">待核销</div></div>'+
    '<div class="ic-stat-card"><div class="ic-stat-val" style="color:#e65100">'+overtime+'</div><div class="ic-stat-lbl">超时未结</div></div>'+
    '<div class="ic-stat-card"><div class="ic-stat-val" style="color:#2e7d32">'+used+'</div><div class="ic-stat-lbl">已核销</div></div>'+
    '<div class="ic-stat-card"><div class="ic-stat-val" style="color:#9e9e9e">'+voided+'</div><div class="ic-stat-lbl">已销毁</div></div>';
}

function renderCodeList(resetPage) {
  if (resetPage !== false) IC_PAGE = 1;
  var el = document.getElementById('icList');
  if (!el) return;
  var q = (document.getElementById('icSearchInput')||{value:''}).value.trim().toLowerCase();
  var dr = _getICDateRange();
  var list = IC_CODES.filter(function(c) {
    var d = c.time.substring(0,10);
    if (d < dr.start || d > dr.end) return false;
    if (IC_FILTER === 'overtime') {
      if (c.status !== 'active' || !_icIsOvertime(c.time)) return false;
    } else if (IC_FILTER !== 'all' && c.status !== IC_FILTER) { return false; }
    if (q && c.name.toLowerCase().indexOf(q) < 0 && c.code.indexOf(q) < 0) return false;
    return true;
  });
  // reverse: newest first
  list = list.slice().reverse();
  var total = list.length;
  var totalPages = Math.max(1, Math.ceil(total / IC_PAGE_SIZE));
  if (IC_PAGE > totalPages) IC_PAGE = totalPages;
  var start = (IC_PAGE - 1) * IC_PAGE_SIZE;
  var pageItems = list.slice(start, start + IC_PAGE_SIZE);

  if (total === 0) {
    el.innerHTML = '<div class="ic-empty">暂无记录</div>';
    renderICPagination(0, 1); return;
  }

  var statusMap = {
    active:'<span class="ic-badge ic-badge-active">待核销</span>',
    used:'<span class="ic-badge ic-badge-used">已核销</span>',
    voided:'<span class="ic-badge ic-badge-voided">已销毁</span>'
  };
  el.innerHTML = pageItems.map(function(c) {
    var isOvertime = c.status==='active' && _icIsOvertime(c.time);
    var badge = statusMap[c.status] || '';
    if (isOvertime) badge = '<span class="ic-badge ic-badge-overtime">超时未结</span>';
    var isSelected = c.id === window._icSelectedId;
    return '<div class="ic-card' + (isSelected ? ' selected' : '') + '" onclick="icSelectRecord(\''+c.id+'\')">' +
      '<div class="ic-card-header">' +
        '<span class="ic-card-name" title="'+_esc(c.name)+'">'+_esc(c.name)+'</span>' +
        badge +
      '</div>' +
      '<div class="ic-card-code">'+c.code+'</div>' +
      '<div class="ic-card-body">' +
        '<div class="ic-cb-item"><span class="ic-cb-label">重量</span><span class="ic-cb-value">'+c.weight+' 斤</span></div>' +
        '<div class="ic-cb-item"><span class="ic-cb-label">单价</span><span class="ic-cb-value">¥'+(c.unitPrice||0).toFixed(2)+'/斤</span></div>' +
        '<div class="ic-cb-item"'+(c.productCode?'':' style="grid-column:span 2"')+'><span class="ic-cb-label">金额</span><span class="ic-cb-value">¥'+c.price.toFixed(2)+'</span></div>' +
        (c.productCode ? '<div class="ic-cb-item"><span class="ic-cb-label">商品码</span><span class="ic-cb-value">'+c.productCode+'</span></div>' : '') +
      '</div>' +
      '<div class="ic-card-footer">' +
        '<span class="ic-cf-time">'+c.time+'</span>' +
        (c.status === 'voided' && c.voidedBy ? '<span class="ic-cf-voidedby">销毁人：'+_esc(c.voidedBy)+'</span>' : '') +
      '</div>' +
    '</div>';
  }).join('');
  renderICPagination(total, totalPages);
}
function renderICPagination(total, totalPages) {
  var el = document.getElementById('icPagination');
  if (!el) return;
  el.innerHTML = total === 0
    ? '<span class="ic-page-info">共 0 条</span>'
    : '<span class="ic-page-info">共 '+total+' 条，第 '+IC_PAGE+'/'+totalPages+' 页</span>' +
      '<div class="ic-page-btns">' +
        '<button class="ic-page-btn" onclick="icGoPage('+(IC_PAGE-1)+')" '+(IC_PAGE<=1?'disabled':'')+'>上一页</button>' +
        '<span class="ic-page-num">'+IC_PAGE+'/'+totalPages+'</span>' +
        '<button class="ic-page-btn" onclick="icGoPage('+(IC_PAGE+1)+')" '+(IC_PAGE>=totalPages?'disabled':'')+'>下一页</button>' +
      '</div>';
}
function icGoPage(n) {
  var dr = _getICDateRange();
  var total = IC_CODES.filter(function(c) {
    var d = c.time.substring(0,10);
    if (d < dr.start || d > dr.end) return false;
    if (IC_FILTER === 'overtime') {
      if (c.status !== 'active' || !_icIsOvertime(c.time)) return false;
    } else if (IC_FILTER !== 'all' && c.status !== IC_FILTER) { return false; }
    var q = (document.getElementById('icSearchInput')||{value:''}).value.trim().toLowerCase();
    if (q && c.name.toLowerCase().indexOf(q) < 0 && c.code.indexOf(q) < 0) return false;
    return true;
  }).length;
  var totalPages = Math.max(1, Math.ceil(total / IC_PAGE_SIZE));
  if (n < 1 || n > totalPages) return;
  IC_PAGE = n;
  renderCodeList(false);
}

function doGenCode() {
  var sel = window._icSelectedProduct;
  if (!sel) { alert('请先选择商品'); return; }
  var name = sel.name;
  var pCode = sel.barcode || '';
  var uPrice = parseFloat(document.getElementById('icUnitPrice').value)||0;
  var weight = parseFloat(document.getElementById('icWeight').value)||0;
  var copies = parseInt(document.getElementById('icCopies').value)||1;
  if (uPrice <= 0) { alert('请输入单价'); return; }
  if (weight <= 0) { alert('请输入重量'); return; }
  var now = new Date();
  var timeStr = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+' '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0');
  var generated = [];
  for (var i=0; i<copies; i++) {
    var code = 'IC'+now.getFullYear()+(now.getMonth()+1).toString().padStart(2,'0')+now.getDate().toString().padStart(2,'0')+(++IC_SEQ);
    var item = { id:'ic-'+IC_SEQ, code:code, name:name, productCode:pCode, unitPrice:uPrice, weight:weight, price:uPrice*weight, status:'active', time:timeStr };
    IC_CODES.push(item);
    generated.push(item);
  }
  _saveICData();
  // 清空表单
  icClearSelection();
  document.getElementById('icUnitPrice').value='';
  document.getElementById('icWeight').value='';
  document.getElementById('icCopies').value='1';
  document.getElementById('icPricePreview').textContent='单价 × 重量 = 金额';
  renderCodeStats();
  renderCodeList();
  // 打印预览
  printBarcodeBatch(generated);
}

function printBarcode(id) {
  var item = IC_CODES.find(function(c){ return c.id===id; });
  if (item) printBarcodeBatch([item]);
}

function printBarcodeBatch(items) {
  var rows = items.map(function(item) {
    var pcodeHtml = item.productCode ? '<div style="font-size:8pt;color:#999;margin-bottom:3mm">商品码 '+item.productCode+'</div>' : '';
    return '<div style="display:inline-block;border:1px solid #ddd;padding:8mm 6mm;border-radius:2mm;page-break-inside:avoid;font-family:\'PingFang SC\',sans-serif;text-align:center;margin:2mm">' +
      '<div style="font-size:11pt;font-weight:700;margin-bottom:2mm">'+item.name+'</div>' +
      '<div style="font-size:18pt;font-weight:900;letter-spacing:1px;margin-bottom:2mm">¥'+item.price.toFixed(2)+'</div>' +
      '<div style="font-size:8pt;color:#666;margin-bottom:3mm">'+item.weight+'斤 · ¥'+item.unitPrice.toFixed(2)+'/斤</div>' +
      pcodeHtml +
      '<div style="font-family:\'Courier New\',monospace;font-size:7pt;letter-spacing:6px;border-top:1px solid #eee;padding-top:2mm">'+item.code+'</div>' +
      '<div style="font-size:7pt;color:#999;margin-top:1mm">'+item.time+'</div>' +
    '</div>';
  }).join('');
  var w = window.open('','_blank','width=420,height=300');
  if (!w) { alert('请允许弹出窗口以打印'); return; }
  w.document.write('<!DOCTYPE html><html><head><title>打码记录</title>' +
    '<style>body{margin:0;padding:4mm;background:#fff}@page{margin:4mm}@media print{body{padding:0}}</style>' +
    '</head><body>'+rows+'<script>window.onload=function(){window.print();}<\/script></body></html>');
  w.document.close();
}

function doScanVoid() {
  var code = (document.getElementById('icScanInput').value||'').trim();
  var res = document.getElementById('icScanResult');
  if (!code) { res.innerHTML='<span style="color:#fc4b52">请输入条码</span>'; return; }
  var item = IC_CODES.find(function(c){ return c.code===code; });
  if (!item) { res.innerHTML='<span style="color:#fc4b52">未找到条码 '+_esc(code)+'</span>'; return; }
  if (item.status==='voided') { res.innerHTML='<span style="color:#9e9e9e">该码已销毁</span>'; return; }
  if (item.status==='used') { res.innerHTML='<span style="color:#2e7d32">该码已在收银台核销，无需手动销毁</span>'; return; }
  item.status='voided';
  item.voidedBy = (prompt('确认销毁 "'+item.name+'"，请输入操作人姓名：')||'').trim() || '未知';
  _saveICData();
  document.getElementById('icScanInput').value='';
  res.innerHTML='<span style="color:#2e7d32">✅ '+item.name+' 已成功销毁</span>';
  renderCodeStats();
  renderCodeList();
}

function manualVoid(id) {
  if (!confirm('确认回收并销毁该打码？操作不可撤销。')) return;
  var item = IC_CODES.find(function(c){ return c.id===id; });
  if (item) { item.status='voided'; item.voidedBy = (prompt('请输入操作人姓名：')||'').trim() || '未知'; _saveICData(); renderCodeStats(); renderCodeList(); }
}

// 收银台扫码时调用（供结算模块联动）
function icAutoSettle(code) {
  var item = IC_CODES.find(function(c){ return c.code===code; });
  if (!item) return null;
  if (item.status !== 'active') return { error: item.status==='used'?'该码已核销':'该码已销毁', item:item };
  item.status = 'used';
  _saveICData();
  renderCodeStats();
  renderCodeList();
  return { ok:true, item:item };
}

// ===================================================================
// ========== PAGE: 结算移除 (Remove Guard) ==========================
// ===================================================================
// 配置项（localStorage 持久化）
function _loadRGData() {
  try {
    var raw = localStorage.getItem('rg_data');
    console.log('[RG] _loadRGData raw长度:', raw ? raw.length : 0);
    if (raw) {
      var d = JSON.parse(raw);
      console.log('[RG] _loadRGData 解析成功, config keys:', d.config ? Object.keys(d.config).join(',') : '无config', 'logs条数:', (d.logs||[]).length);
      RG_CONFIG = d.config || RG_CONFIG;
      RG_LOGS = d.logs || [];
      return true;
    }
  } catch(e) { console.error('[RG] _loadRGData 异常:', e); }
  console.log('[RG] _loadRGData 无数据，使用默认值');
  return false;
}
function _saveRGData() {
  try {
    var payload = JSON.stringify({ config: RG_CONFIG, logs: RG_LOGS || [] });
    localStorage.setItem('rg_data', payload);
  } catch(e) { console.error('[RG] _saveRGData 保存失败：', e); }
}

var RG_CONFIG = {
  fixedCodeEnabled: true,
  tempCodeEnabled: false,
  tempCodeExpirySec: 300,
  supervisorEnabled: true,
  auditors: [
    { name: '张伟', fixedCode: '888888' },
    { name: '李娜', fixedCode: '666666' },
  ]
};
var RG_LOGS = [];
// 当前待审批请求（含每位审核人的临时码）
var RG_PENDING = null;
// 临时授权码运行时状态
var RG_TEMP_CODE = null;
var RG_TEMP_EXPIRE = 0;
var RG_PAGE = 1
var RG_PAGE_SIZE = 20
var RG_FILTER_STORE = 'all'
var RG_FILTER_DATE = 'today'
var RG_FILTER_KEYWORD = ''
var _RG_MOCK_STORES = ['崧泽大道中心店', '华科东路店', '盈港路店']
// 临时状态
var RG_SUPERVISOR_DONE = false;
var RG_TEMP_TIMER = null;
var RG_AUTH_BY = '';  // 记录本次是哪位审核人的码/审批通过的
_loadRGData();
// 数据迁移：旧格式 → 新三方法+用户格式
// 数据迁移：旧格式 → auditors 新格式
function _rgMigrate() {
  var changed = false;

  // 旧格式1：mode 字段存在（三选一模式）
  if (RG_CONFIG.mode !== undefined) {
    var oldMode = RG_CONFIG.mode;
    var oldSv = RG_CONFIG.supervisors || ['张伟', '李娜'];
    RG_CONFIG = {
      fixedCodeEnabled: oldMode === 'fixed',
      tempCodeEnabled: oldMode === 'dynamic',
      tempCodeExpirySec: RG_CONFIG.dynamicExpirySec || 180,
      supervisorEnabled: oldMode === 'scan',
      auditors: oldSv.map(function(name) {
        return { name: name, fixedCode: '', tempCode: null, tempExpire: 0 };
      })
    };
    changed = true;
  }

  // 旧格式2：有 supervisors 但没有 auditors 数组
  if (RG_CONFIG.supervisors && !RG_CONFIG.auditors) {
    RG_CONFIG.auditors = RG_CONFIG.supervisors.map(function(name) {
      return { name: name, fixedCode: '', tempCode: null, tempExpire: 0 };
    });
    delete RG_CONFIG.supervisors;
    changed = true;
  }

  // 确保 auditors 数组存在
  if (!RG_CONFIG.auditors) {
    RG_CONFIG.auditors = [
      { name: '张伟', fixedCode: '888888', tempCode: null, tempExpire: 0 },
      { name: '李娜', fixedCode: '666666', tempCode: null, tempExpire: 0 },
    ];
    changed = true;
  }

  // 确保 auditors 里每个对象都有必要字段
  RG_CONFIG.auditors.forEach(function(a) {
    if (a.fixedCode === undefined) { a.fixedCode = ''; changed = true; }
    if (a.tempCode === undefined) { a.tempCode = null; changed = true; }
    if (a.tempExpire === undefined) { a.tempExpire = 0; changed = true; }
  });

  // 确保全局开关字段存在
  if (RG_CONFIG.fixedCodeEnabled === undefined) { RG_CONFIG.fixedCodeEnabled = true; changed = true; }
  if (RG_CONFIG.tempCodeEnabled === undefined) { RG_CONFIG.tempCodeEnabled = false; changed = true; }
  if (RG_CONFIG.supervisorEnabled === undefined) { RG_CONFIG.supervisorEnabled = true; changed = true; }
  if (RG_CONFIG.tempCodeExpirySec === undefined) { RG_CONFIG.tempCodeExpirySec = 180; changed = true; }

  // 清理旧字段
  if (RG_CONFIG.mode !== undefined) { delete RG_CONFIG.mode; changed = true; }
  if (RG_CONFIG.currentUser !== undefined) { delete RG_CONFIG.currentUser; changed = true; }

  if (changed) { console.log('[RG] _rgMigrate 有变更，保存中...'); _saveRGData(); } else { console.log('[RG] _rgMigrate 无需迁移'); }
}
_rgMigrate();

function initRemoveGuard() {
  var el = document.getElementById('removeGuardContent');
  if (!el) return;
  var needRegen = false
  if (!_loadRGData() || !RG_LOGS || RG_LOGS.length === 0) {
    needRegen = true
  } else if (!RG_LOGS[0].name || RG_LOGS[0].price === undefined || RG_LOGS[0].orderNo === undefined) {
    // 旧数据不含 name/price/orderNo 字段 → 重新生成
    needRegen = true
  }
  if (needRegen) {
    generateRGMockLogs();
    _saveRGData();
  }

  el.innerHTML =
      // 筛选栏（铺满，上部紧接，白底）
      '<div style="flex-shrink:0;margin:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<select id="rgFilterStore" style="padding:7px 12px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;background:#fff;outline:none" onchange="rgSearch()">' +
          '<option value="all">全部门店</option>' +
          _RG_MOCK_STORES.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
        '</select>' +
        '<div class="ic-filter-tabs" id="rgFilterTabs">' +
          '<span class="ic-ftab' + (RG_FILTER_DATE === 'all' ? ' active' : '') + '" onclick="rgSetDateFilter(\'all\',this)">全部</span>' +
          '<span class="ic-ftab' + (RG_FILTER_DATE === 'today' ? ' active' : '') + '" onclick="rgSetDateFilter(\'today\',this)">今天</span>' +
          '<span class="ic-ftab' + (RG_FILTER_DATE === 'yesterday' ? ' active' : '') + '" onclick="rgSetDateFilter(\'yesterday\',this)">昨天</span>' +
          '<span class="ic-ftab' + (RG_FILTER_DATE === 'week' ? ' active' : '') + '" onclick="rgSetDateFilter(\'week\',this)">近7天</span>' +
          '<span class="ic-ftab' + (RG_FILTER_DATE === 'month' ? ' active' : '') + '" onclick="rgSetDateFilter(\'month\',this)">近30天</span>' +
        '</div>' +
        '<input type="text" id="rgFilterKeyword" class="ic-search" placeholder="条码" style="flex:0 1 220px" onkeydown="if(event.key===\'Enter\')rgSearch()">' +
        '<button class="ic-btn" onclick="rgReset()">重置</button>' +
        '<button class="ic-btn" style="background:#005CF5;color:#fff;border-color:#005CF5;font-weight:600" onclick="rgSearch()">查询</button>' +
        '<div style="flex:1"></div>' +
        '<button class="ic-btn" style="background:#5c6bc0;color:#fff;border-color:#5c6bc0" onclick="simulateRemoveRequest()">模拟删除</button>' +
      '</div>' +
      // 表格卡片（左右缩进8px，上方间隔10px，底部间隔8px，渐变边框）
      '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
      '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
          '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
            '<table>' +
              '<thead id="rgTableHead"></thead>' +
              '<tbody id="rgTableBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="pagination-bar" id="rgPagination" style="flex-shrink:0"></div>' +
        '</div>' +
      '</div>';

  rgRenderTable();
}

// ===== 日期 Tab 切换（结算移除）=====
function rgSetDateFilter(val, el) {
  RG_FILTER_DATE = val;
  RG_PAGE = 1;
  plSyncDateTabs('rgFilterTabs', val, el);
  rgRenderTable();
}

// ===== 授权配置弹框（可被任意页面调用） =====

function openRgConfigModal() {
  console.log('[RG] openRgConfigModal 被调用');
  try {
  closeRgConfigModal();

  var backdrop = document.createElement('div');
  backdrop.className = 'ic-modal-backdrop';
  backdrop.id = 'rgConfigBackdrop';
  backdrop.onclick = function(e) { if (e.target === this) closeRgConfigModal(); };

  var modal = document.createElement('div');
  modal.className = 'ic-modal';
  modal.id = 'rgConfigModal';

  console.log('[RG] openRgConfigModal RG_CONFIG:', JSON.stringify(RG_CONFIG).substring(0, 200));

  modal.innerHTML =
    '<div class="ic-modal-header"><span>⚙️ 授权设置</span><button class="ic-modal-close" onclick="closeRgConfigModal()">✕</button></div>' +
    '<div class="ic-modal-body">' +
      rgMethodCard('fixed', '🔑 固定授权码', '启用后设置一个固定授权码，收银员录入该码即通过授权',
        '<div style="margin-top:10px">' +
          '<label style="font-size:12px;color:var(--text-muted)">授权码' + (RG_CONFIG.fixedCode ? ' <span style="color:#2E7D32;font-weight:600">（已设置）</span>' : '') + '：</label>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:4px">' +
            '<input id="rgFixedCodeInput" type="password" value="' + _esc(RG_CONFIG.fixedCode || '') + '" placeholder="' + (RG_CONFIG.fixedCode ? '留空则沿用已设授权码' : '请输入固定授权码') + '" style="flex:1;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:12px">' +
            '<button type="button" onclick="rgToggleCodeEye()" style="background:none;border:none;cursor:pointer;font-size:16px;padding:4px 6px">👁️</button>' +
          '</div>' +
        '</div>') +
      rgMethodCard('temp', '⏱️ 临时授权码', '每次删除请求自动为每个审核人生成独立临时码，5分钟内有效，用后即失效',
        '<div style="font-size:12px;color:var(--text-muted);margin-top:6px">有效时长：<span style="color:#005CF5;font-weight:600">5 分钟</span>（固定）</div>') +
      rgMethodCard('supervisor', '📱 即时审批', '删除请求发起后，当前登录用户收到推送可一键同意',
        '<div class="rg-code-hint">✅ 所有审核人都可审批，无需额外设置</div>') +
    '</div>' +
    '<div class="ic-modal-footer">' +
      '<button class="btn-secondary" onclick="closeRgConfigModal()">取消</button>' +
      '<button class="btn-primary" onclick="saveRgConfigFromModal()">保存配置</button>' +
    '</div>';

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
  backdrop.style.display = 'block';
  modal.style.display = 'flex';

  setTimeout(function() { rgRefreshCards(); }, 50);
  console.log('[RG] openRgConfigModal 弹框已创建并显示');
  } catch(e) {
    console.error('[RG] openRgConfigModal 异常:', e);
    alert('打开授权设置失败：' + e.message);
  }
}

function closeRgConfigModal() {
  var bd = document.getElementById('rgConfigBackdrop');
  var md = document.getElementById('rgConfigModal');
  if (bd) bd.remove();
  if (md) md.remove();
}

// 审核人管理
function rgAddAuditor() {
  var name = prompt("请输入审核人姓名：");
  if (!name || !name.trim()) return;
  name = name.trim();
  // 检查重名
  if (RG_CONFIG.auditors.some(function(a) { return a.name === name; })) {
    alert("该审核人已存在");
    return;
  }
  RG_CONFIG.auditors.push({ name: name, fixedCode: "", tempCode: null, tempExpire: 0 });
  _saveRGData();
  // 刷新弹框
  var list = document.getElementById("rgAuditorsList");
  if (list) list.innerHTML = RG_CONFIG.auditors.map(function(a, i) {
    return '<div class="rg-auditor-row">' +
      '<span class="rg-auditor-name">' + _esc(a.name) + '</span>' +
      '<input type="text" value="' + _esc(a.fixedCode || "") + '" onchange="rgAuditorFixedCodeChange(' + i + ', this.value)" placeholder="固定授权码">' +
      '<button class="rg-auditor-del" onclick="rgRemoveAuditor(' + i + ')">删除</button>' +
    '</div>';
  }).join("");
}

function rgRemoveAuditor(idx) {
  if (!confirm("确定删除审核人「" + RG_CONFIG.auditors[idx].name + "」？")) return;
  RG_CONFIG.auditors.splice(idx, 1);
  _saveRGData();
  rgAddAuditor.__lastCall = null;
  var list = document.getElementById("rgAuditorsList");
  if (list) list.innerHTML = RG_CONFIG.auditors.map(function(a, i) {
    return '<div class="rg-auditor-row">' +
      '<span class="rg-auditor-name">' + _esc(a.name) + '</span>' +
      '<input type="text" value="' + _esc(a.fixedCode || "") + '" onchange="rgAuditorFixedCodeChange(' + i + ', this.value)" placeholder="固定授权码">' +
      '<button class="rg-auditor-del" onclick="rgRemoveAuditor(' + i + ')">删除</button>' +
    '</div>';
  }).join("");
}

function rgAuditorFixedCodeChange(idx, value) {
  RG_CONFIG.auditors[idx].fixedCode = value || "";
  _saveRGData();
}



function saveRgConfigFromModal() {
  try {
    console.log('[RG] saveRgConfigFromModal 开始保存...');
    saveRgConfig();
    console.log('[RG] saveRgConfig 完成，准备关闭弹框');
    closeRgConfigModal();
    console.log('[RG] 弹框已关闭');
  } catch(e) {
    console.error('[RG] saveRgConfigFromModal 异常:', e);
    alert('保存配置失败：' + e.message);
  }
}

// ===== 生成模拟授权记录 =====
function generateRGMockLogs() {
  var TOTAL = 40;
  RG_LOGS = [];
  var now = new Date();
  for (var i = 0; i < TOTAL; i++) {
    var offsetMs = Math.floor(i * 168 * 3600000 / TOTAL + Math.random() * 2 * 3600000);
    var ts = new Date(now.getTime() - offsetMs);
    var timeStr = ts.getFullYear() + '-' +
      (ts.getMonth()+1).toString().padStart(2,'0') + '-' +
      ts.getDate().toString().padStart(2,'0') + ' ' +
      ts.getHours().toString().padStart(2,'0') + ':' +
      ts.getMinutes().toString().padStart(2,'0') + ':' +
      ts.getSeconds().toString().padStart(2,'0');

    var prod = _MOCK_PRODUCTS[Math.floor(Math.random() * _MOCK_PRODUCTS.length)];
    var cashier = _MOCK_CASHIERS[Math.floor(Math.random() * _MOCK_CASHIERS.length)];
    var store = _RG_MOCK_STORES[Math.floor(Math.random() * _RG_MOCK_STORES.length)];

    // 关联单号：约70%有单号（结账完成），约30%无（未完成收银）
    var hasOrder = Math.random() < 0.7;
    var orderNo = hasOrder
      ? 'SO' + ts.getFullYear().toString().slice(2) +
        (ts.getMonth()+1).toString().padStart(2,'0') +
        ts.getDate().toString().padStart(2,'0') +
        Math.floor(Math.random() * 900000 + 100000).toString()
      : '';
    RG_LOGS.push({
      store: store,
      name: prod.name,
      barcode: prod.barcode,
      qty: prod.qty + prod.unit,
      price: prod.price,
      amount: prod.amount,
      operator: cashier,
      time: timeStr,
      spec: prod.spec || '',
      unit: prod.unit || '',
      orderNo: orderNo
    });
  }
  RG_LOGS.sort(function(a, b) { return a.time < b.time ? 1 : -1; });
}

// 生成 toggle 卡片
function rgMethodCard(key, title, desc, bodyHTML) {
  var cfgMap = { fixed: "fixedCodeEnabled", temp: "tempCodeEnabled", supervisor: "supervisorEnabled" };
  var prop = cfgMap[key];
  var enabled = RG_CONFIG[prop];
  var toggleId = "rgToggle" + key.charAt(0).toUpperCase() + key.slice(1);
  return "<div class=\"rg-method-card"+(enabled?" enabled":"")+"\" id=\"rgMethodCard"+key+"\">" +
    "<div class=\"rg-method-row\">" +
      "<label class=\"rg-toggle\">" +
        "<input type=\"checkbox\" id=\""+toggleId+"\" onchange='rgToggleMethod(\""+key+"\")' "+(enabled?"checked":"")+">" +
        "<span class=\"rg-toggle-slider\"></span>" +
      "</label>" +
      "<div class=\"rg-method-info\">" +
        "<div class=\"rg-method-title\">"+title+"</div>" +
        "<div class=\"rg-method-desc\">"+desc+"</div>" +
      "</div>" +
    "</div>" +
    "<div class=\"rg-method-body\">"+bodyHTML+"</div>" +
  "</div>";
}

function rgToggleMethod(key) {
  var cfgMap = { fixed: "fixedCodeEnabled", temp: "tempCodeEnabled", supervisor: "supervisorEnabled" };
  var prop = cfgMap[key];
  var toggleId = "rgToggle" + key.charAt(0).toUpperCase() + key.slice(1);
  var cb = document.getElementById(toggleId);
  if (prop && cb) RG_CONFIG[prop] = cb.checked;
  rgRefreshCards();
}

function rgRefreshCards() {
  var cardF = document.getElementById("rgMethodCardfixed");
  var cardT = document.getElementById("rgMethodCardtemp");
  var cardS = document.getElementById("rgMethodCardsupervisor");
  var cbF = document.getElementById("rgToggleFixed");
  var cbT = document.getElementById("rgToggleTemp");
  var cbS = document.getElementById("rgToggleSupervisor");
  if (cardF) cardF.classList.toggle("enabled", RG_CONFIG.fixedCodeEnabled);
  if (cardT) cardT.classList.toggle("enabled", RG_CONFIG.tempCodeEnabled);
  if (cardS) cardS.classList.toggle("enabled", RG_CONFIG.supervisorEnabled);
  if (cbF) cbF.checked = !!RG_CONFIG.fixedCodeEnabled;
  if (cbT) cbT.checked = !!RG_CONFIG.tempCodeEnabled;
  if (cbS) cbS.checked = !!RG_CONFIG.supervisorEnabled;
}




// 主管名单管理
function rgRenderSvTags() {
  if (!RG_CONFIG.supervisors.length) return '<div class="rg-sv-empty">暂无授权主管，请添加</div>';
  return RG_CONFIG.supervisors.map(function(name, i) {
    return '<span class="rg-sv-tag">'+_esc(name)+'<span class="rg-sv-remove" onclick="rgRemoveSupervisor('+i+')">×</span></span>';
  }).join('');
}

function rgAddSupervisor() {
  var inp = document.getElementById('rgSvAddInput');
  var name = (inp.value || '').trim();
  if (!name) return;
  if (RG_CONFIG.supervisors.indexOf(name) >= 0) { alert('该主管已在名单中'); return; }
  RG_CONFIG.supervisors.push(name);
  inp.value = '';
  document.getElementById('rgSvTags').innerHTML = rgRenderSvTags();
}

function rgRemoveSupervisor(idx) {
  RG_CONFIG.supervisors.splice(idx, 1);
  document.getElementById('rgSvTags').innerHTML = rgRenderSvTags();
}

function rgToggleCodeEye() {
  var inp = document.getElementById('rgFixedCodeInput');
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

function saveRgConfig() {
  // 从 DOM 读取实际开关状态，确保与 UI 一致
  var cbF = document.getElementById('rgToggleFixed');
  var cbT = document.getElementById('rgToggleTemp');
  var cbS = document.getElementById('rgToggleSupervisor');
  RG_CONFIG.fixedCodeEnabled = cbF ? cbF.checked : RG_CONFIG.fixedCodeEnabled;
  RG_CONFIG.tempCodeEnabled = cbT ? cbT.checked : RG_CONFIG.tempCodeEnabled;
  RG_CONFIG.supervisorEnabled = cbS ? cbS.checked : RG_CONFIG.supervisorEnabled;

  if (RG_CONFIG.fixedCodeEnabled) {
    var code = (document.getElementById('rgFixedCodeInput')||{}).value || '';
    if (code.trim()) {
      RG_CONFIG.fixedCode = code.trim();
    } else {
      alert('固定授权码已启用，请输入授权码'); return;
    }
  }
  if (RG_CONFIG.tempCodeEnabled) {
    RG_CONFIG.tempCodeExpirySec = 300;  // 固定 5 分钟
  }
  console.log('[RG] saveRgConfig 最终 state:', JSON.stringify({fixedCodeEnabled:RG_CONFIG.fixedCodeEnabled,tempCodeEnabled:RG_CONFIG.tempCodeEnabled,supervisorEnabled:RG_CONFIG.supervisorEnabled,fixedCode:RG_CONFIG.fixedCode}));
  _saveRGData();
  // 延迟重新渲染，避免与弹框关闭冲突
  setTimeout(function() {
    if (typeof initRemoveGuard === 'function') initRemoveGuard();
  }, 100);
}

// ===== 模拟删除请求 =====

var _MOCK_PRODUCTS = [
  // 称重类 — spec: 称重/kg，单位统一用 kg 或 L
  { name:'猪里脊肉', barcode:'6901011200001', qty:0.52, unit:'kg', price:24.00, amount:12.48, spec:'称重/kg' },
  { name:'三文鱼',     barcode:'6901011200002', qty:0.32, unit:'kg', price:90.00, amount:28.80, spec:'称重/kg' },
  { name:'西兰花',     barcode:'6901011200003', qty:1.20, unit:'kg', price:6.00,  amount:7.20,  spec:'称重/kg' },
  { name:'五花肉',     barcode:'6901011200004', qty:0.68, unit:'kg', price:18.50, amount:12.58, spec:'称重/kg' },
  { name:'基围虾',     barcode:'6901011200005', qty:0.45, unit:'kg', price:38.00, amount:17.10, spec:'称重/kg' },
  { name:'牛腱子',     barcode:'6901011200006', qty:0.80, unit:'kg', price:48.00, amount:38.40, spec:'称重/kg' },
  { name:'鸡蛋',       barcode:'6901011200007', qty:1.50, unit:'kg', price:4.20,  amount:6.30,  spec:'称重/kg' },
  { name:'苹果',       barcode:'6901011200008', qty:2.00, unit:'kg', price:5.00,  amount:10.00, spec:'称重/kg' },
  { name:'大米',       barcode:'6901011200010', qty:5.00, unit:'kg', price:5.98,  amount:29.90, spec:'称重/kg' },
  // 包装类
  { name:'牛奶',       barcode:'6901011200009', qty:1.00, unit:'箱', price:45.00, amount:45.00, spec:'250ml×12/箱' },
];
var _MOCK_CASHIERS = ['张伟','李娜','王芳','赵强','刘明'];
var _MOCK_CB_SEQ = 0;

// 生成收银条码: CB + 年月日 + 序号
function _genCashierBarcode() {
  _MOCK_CB_SEQ++;
  var d = new Date();
  return 'CB' + d.getFullYear() +
    (d.getMonth()+1).toString().padStart(2,'0') +
    d.getDate().toString().padStart(2,'0') +
    _MOCK_CB_SEQ.toString().padStart(3,'0');
}

function simulateRemoveRequest() {
  var prod = _MOCK_PRODUCTS[Math.floor(Math.random()*_MOCK_PRODUCTS.length)];
  var cashier = _MOCK_CASHIERS[Math.floor(Math.random()*_MOCK_CASHIERS.length)];
  var store = _RG_MOCK_STORES[Math.floor(Math.random() * _RG_MOCK_STORES.length)];
  var now = new Date();
  var timeStr = now.getFullYear() + '-' +
    (now.getMonth()+1).toString().padStart(2,'0') + '-' +
    now.getDate().toString().padStart(2,'0') + ' ' +
    now.getHours().toString().padStart(2,'0') + ':' +
    now.getMinutes().toString().padStart(2,'0') + ':' +
    now.getSeconds().toString().padStart(2,'0');

  RG_LOGS.unshift({
    store: store,
    name: prod.name,
    barcode: prod.barcode,
    qty: prod.qty + prod.unit,
    price: prod.price,
    amount: prod.amount,
    operator: cashier,
    time: timeStr,
    spec: prod.spec || '',
    unit: prod.unit || ''
  });
  _saveRGData();
  RG_PAGE = 1
  rgRenderTable();
}

function showRgAuth(ctx) {
  var backdrop = document.getElementById('rgAuthBackdrop');
  var modal = document.getElementById('rgAuthModal');
  var confirmBtn = document.getElementById('rgAuthConfirmBtn');
  backdrop.style.display = 'block'; modal.style.display = 'flex';
  confirmBtn.disabled = true;

  var hasFixed = RG_CONFIG.fixedCodeEnabled;
  var hasTemp = RG_CONFIG.tempCodeEnabled;
  var hasSv = RG_CONFIG.supervisorEnabled;

  // 商品明细 + 收银上下文
  var html =
    '<div class="rg-auth-item">' +
      '<div class="rg-auth-info-grid">' +
        '<div class="rg-auth-info-col"><span class="rg-auth-info-label">发起人</span><span class="rg-auth-info-value">'+_esc(ctx.initiator||'未知')+'</span></div>' +
        '<div class="rg-auth-info-col"><span class="rg-auth-info-label">商品名称</span><span class="rg-auth-info-value">'+_esc(ctx.item)+'</span></div>' +
        '<div class="rg-auth-info-col"><span class="rg-auth-info-label">商品条码</span><span class="rg-auth-info-value mono">'+_esc(ctx.barcode||'—')+'</span></div>' +
        '<div class="rg-auth-info-col"><span class="rg-auth-info-label">数量</span><span class="rg-auth-info-value">'+_esc(ctx.qty||'—')+'</span></div>' +
        '<div class="rg-auth-info-col"><span class="rg-auth-info-label">金额</span><span class="rg-auth-info-value" style="color:#C62828;font-weight:600">¥'+(typeof ctx.amount==='number'?ctx.amount.toFixed(2):_esc(ctx.amount||'—'))+'</span></div>' +
        '<div class="rg-auth-info-col"><span class="rg-auth-info-label">收银条码</span><span class="rg-auth-info-value mono">'+_esc(ctx.cashierBarcode||'—')+'</span></div>' +
      '</div>' +
      '<small style="color:#999;margin-top:6px;display:block">发起时间：'+(new Date()).toLocaleTimeString()+'</small>' +
    '</div>';

  var sections = [];

  // ── 固定授权码 ──
  if (hasFixed) {
    sections.push('<div class="rg-auth-section" id="rgAuthSecFixed">' +
      '<div class="rg-auth-section-label">🔑 收银机端 — 固定授权码</div>' +
      '<input id="rgAuthFixedInput" type="password" placeholder="请输入授权码" class="rg-auth-input" onkeydown="if(event.key===\'Enter\')rgCheckFixedCode()" oninput="rgCheckFixedCode()">' +
      '<div class="rg-auth-hint" id="rgAuthFixedHint"></div>' +
    '</div>');
  }

  // ── 临时授权码 ──
  if (hasTemp) {
    // 专码专用：临时码由 simulateRemoveRequest 生成，此处仅展示
    var sec = RG_CONFIG.tempCodeExpirySec;
    var durText = sec >= 3600 ? Math.floor(sec/3600)+'小时'+((sec%3600)?Math.floor((sec%3600)/60)+'分钟':'') : Math.floor(sec/60)+'分钟';

    sections.push('<div class="rg-auth-section" id="rgAuthSecTemp">' +
      '<div class="rg-auth-section-label">⏱️ 临时授权码（有效期 '+durText+'· 一次性，校验成功即作废）</div>' +
      '<div class="rg-dyn-code" id="rgTempCodeDisp">'+RG_TEMP_CODE+'</div>' +
      '<div class="rg-countdown" id="rgTempCountdown"></div>' +
      '<input id="rgAuthTempInput" maxlength="6" placeholder="收银员输入6位临时授权码" class="rg-auth-input" oninput="rgCheckTempCode()" onkeydown="if(event.key===\'Enter\')rgCheckTempCode()">' +
      '<div class="rg-auth-hint" id="rgAuthTempHint"></div>' +
    '</div>');
    // 倒计时稍后启动
    setTimeout(function() { rgStartTempCountdown(); }, 50);
  }

  // ── 即时审批 ──
  if (hasSv) {
    sections.push('<div class="rg-auth-section" id="rgAuthSecSupervisor">' +
      '<div class="rg-auth-section-label">📱 即时审批 — 当前登录用户</div>' +
      '<div class="rg-auth-status waiting" id="rgSvStatus">' +
        '<span class="rg-auth-status-icon">⏳</span> 等待当前用户确认...' +
      '</div>' +
      '<div class="rg-simulate-row">' +
        '<button onclick="rgSimulateSupervisorApprove()">🧪 模拟当前用户审批通过</button>' +
        '<button onclick="rgSimulateSupervisorReject()">模拟审批拒绝</button>' +
      '</div>' +
    '</div>');
  }

  // 三种方法间用分隔符连接
  html += sections.join('<div class="rg-auth-divider">或</div>');

  document.getElementById('rgAuthBody').innerHTML = html;
  // 自动聚焦第一个输入
  setTimeout(function() {
    var f = document.getElementById('rgAuthFixedInput') || document.getElementById('rgAuthTempInput');
    if (f) f.focus();
  }, 100);
}


// 隐藏授权弹框（不取消删除请求，等待审核人审核）
function hideRgAuthModal() {
  var backdrop = document.getElementById('rgAuthBackdrop');
  var modal = document.getElementById('rgAuthModal');
  if (backdrop) backdrop.style.display = 'none';
  if (modal) modal.style.display = 'none';
  // RG_PENDING 保持，不清除——等待审核人后续审核
  showRgPendingBar();
}

// 在页面顶部显示"等待审核"状态栏
function showRgPendingBar() {
  var existing = document.getElementById('rgPendingBar');
  if (existing) existing.remove();
  if (!RG_PENDING) return;
  var bar = document.createElement('div');
  bar.id = 'rgPendingBar';
  bar.style.cssText = 'background:#FFF8E1;border:1px solid #FFC107;border-radius:8px;padding:12px 16px;margin:12px 0;display:flex;align-items:center;justify-content:space-between;font-size:12px';
  var codeHTML = '';
  if (RG_TEMP_CODE && RG_TEMP_EXPIRE > Date.now()) {
    codeHTML = '<span style="color:#E65100;font-weight:700;font-size:15px;letter-spacing:2px;margin:0 8px">🔐 临时授权码：' + RG_TEMP_CODE + '</span>';
  }
  bar.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px">' +
      '<span style="font-size:18px">⏳</span>' +
      '<div>' +
        '<div style="font-weight:600;color:#E65100">等待审核中</div>' +
        '<div style="color:#666;font-size:12px;margin-top:2px">' + _esc(RG_PENDING.item) + ' · ' + _esc(RG_PENDING.initiator) + ' 发起</div>' +
      '</div>' +
      codeHTML +
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:center">' +
      '<button onclick="resumeRgAuth()" style="padding:6px 14px;border:1px solid #FFC107;border-radius:6px;background:#fff;cursor:pointer;font-size:12px">继续审核</button>' +
      '<button onclick="cancelRgPending()" style="padding:6px 14px;border:none;border-radius:6px;background:#ffebee;color:#fc4b52;cursor:pointer;font-size:12px">取消等待</button>' +
    '</div>';
  var container = document.getElementById('removeGuardContent');
  if (container) container.insertBefore(bar, container.firstChild);
}

// 继续审核（重新打开授权弹框）
function resumeRgAuth() {
  if (!RG_PENDING) return;
  showRgAuth(RG_PENDING);
}

// 取消等待审核
function cancelRgPending() {
  // 写入日志（取消）
  var now = new Date();
  var timeStr = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+' '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0');
  RG_LOGS.unshift({
    initiator: RG_PENDING ? RG_PENDING.initiator : '—',
    item: RG_PENDING ? RG_PENDING.item : '商品',
    barcode: RG_PENDING ? RG_PENDING.barcode : '',
    qty: RG_PENDING ? RG_PENDING.qty : '—',
    amount: typeof (RG_PENDING?RG_PENDING.amount:0) === 'number' ? RG_PENDING.amount : 0,
    cashierBarcode: RG_PENDING ? RG_PENDING.cashierBarcode : '',
    time: timeStr,
    methods: [],
    authorizer: '',
    result: '已取消'
  });
  RG_PENDING = null;
  RG_TEMP_CODE = null;
  RG_TEMP_EXPIRE = 0;
  if (RG_TEMP_TIMER) { clearInterval(RG_TEMP_TIMER); RG_TEMP_TIMER = null; }
  _saveRGData();
  var bar = document.getElementById('rgPendingBar');
  if (bar) bar.remove();
  rgRenderTable();
}

// 超时拒绝处理
function rgHandleTimeout() {
  if (RG_TEMP_TIMER) { clearInterval(RG_TEMP_TIMER); RG_TEMP_TIMER = null; }
  if (!RG_PENDING) return;
  // 写入日志（超时拒绝）
  var now = new Date();
  var timeStr = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+' '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0');
  RG_LOGS.unshift({
    initiator: RG_PENDING.initiator || '—',
    item: RG_PENDING.item || '商品',
    barcode: RG_PENDING.barcode || '',
    qty: RG_PENDING.qty || '—',
    amount: typeof RG_PENDING.amount === 'number' ? RG_PENDING.amount : 0,
    cashierBarcode: RG_PENDING.cashierBarcode || '',
    time: timeStr,
    methods: [],
    authorizer: '',
    result: '超时拒绝'
  });
  RG_PENDING = null;
  RG_TEMP_CODE = null;
  RG_TEMP_EXPIRE = 0;
  _saveRGData();
  var bar = document.getElementById('rgPendingBar');
  if (bar) bar.remove();
  rgRenderTable();
}

// 临时授权码倒计时
function rgStartTempCountdown() {
  if (RG_TEMP_TIMER) clearInterval(RG_TEMP_TIMER);
  RG_TEMP_TIMER = setInterval(function() {
    var left = Math.ceil((RG_TEMP_EXPIRE - Date.now())/1000);
    var el = document.getElementById('rgTempCountdown');
    var disp = document.getElementById('rgTempCodeDisp');
    if (!el) { clearInterval(RG_TEMP_TIMER); return; }
    if (left <= 0) {
      rgHandleTimeout();
      // 隐藏弹框（如果还开着）
      var backdrop = document.getElementById('rgAuthBackdrop');
      var modal = document.getElementById('rgAuthModal');
      if (backdrop) backdrop.style.display = 'none';
      if (modal) modal.style.display = 'none';
      return;
    } else {
      el.textContent = '⏱️ 有效期剩余 ' + left + ' 秒';
      el.style.color = left <= 10 ? '#fc4b52' : '#ff8f00';
    }
  }, 500);
}

// 检查临时授权码
function rgCheckTempCode() {
  var inp = (document.getElementById('rgAuthTempInput') || {}).value || '';
  var hint = document.getElementById('rgAuthTempHint');
  var sec = document.getElementById('rgAuthSecTemp');
  if (!hint) return;
  if (inp.length < 6) { hint.textContent = ''; hint.className = 'rg-auth-hint'; return; }
  var ok = RG_TEMP_CODE && inp === RG_TEMP_CODE && Date.now() < RG_TEMP_EXPIRE;
  hint.textContent = ok ? '✅ 临时授权码正确' : '❌ 授权码错误或已过期';
  hint.className = ok ? 'rg-auth-hint ok' : 'rg-auth-hint error';
  if (ok && sec) sec.classList.add('active-method');
  if (!ok && sec) sec.classList.remove('active-method');
  RG_PENDING.tempApproved = ok;
  // 专码专用：校验通过后立即作废，不可复用
  if (ok) {
    RG_TEMP_CODE = null;
    RG_TEMP_EXPIRE = 0;
    if (RG_TEMP_TIMER) { clearInterval(RG_TEMP_TIMER); RG_TEMP_TIMER = null; }
    _saveRGData();
    var bar = document.getElementById('rgTempInfoBar');
    if (bar) bar.innerHTML = rgTempInfoHTML();
  }
  rgEnableConfirm();
}

// 收银机端：检查固定授权码
function rgCheckFixedCode() {
  var inp = (document.getElementById('rgAuthFixedInput') || {}).value || '';
  var hint = document.getElementById('rgAuthFixedHint');
  var sec = document.getElementById('rgAuthSecFixed');
  if (!hint) return;
  if (!inp) { hint.textContent = ''; hint.className = 'rg-auth-hint'; return; }
  if (inp === RG_CONFIG.fixedCode) {
    hint.textContent = '✅ 授权码正确 — 移除已获授权';
    hint.className = 'rg-auth-hint ok';
    if (sec) sec.classList.add('active-method');
    RG_PENDING.fixedApproved = true;
    rgEnableConfirm();
  } else {
    hint.textContent = '❌ 授权码错误，请重试';
    hint.className = 'rg-auth-hint error';
    if (sec) sec.classList.remove('active-method');
    RG_PENDING.fixedApproved = false;
    rgEnableConfirm();
  }
}

// 模拟：当前用户审批通过
function rgSimulateSupervisorApprove() {
  var status = document.getElementById('rgSvStatus');
  var sec = document.getElementById('rgAuthSecSupervisor');
  if (status) {
    status.className = 'rg-auth-status approved';
    status.innerHTML = '<span class="rg-auth-status-icon">✅</span> 当前用户已审批通过';
  }
  if (sec) sec.classList.add('active-method');
  RG_SUPERVISOR_DONE = true;
  RG_PENDING.supervisorApproved = true;
  rgEnableConfirm();
}

function rgSimulateSupervisorReject() {
  var status = document.getElementById('rgSvStatus');
  if (status) {
    status.className = 'rg-auth-status waiting';
    status.innerHTML = '<span class="rg-auth-status-icon">❌</span> 审批未通过，请改用其他方式';
    status.style.background = '#FFEBEE';
    status.style.color = '#C62828';
  }
  RG_SUPERVISOR_DONE = false;
  RG_PENDING.supervisorApproved = false;
}

function rgEnableConfirm() {
  var btn = document.getElementById('rgAuthConfirmBtn');
  if (!btn) return;
  var ok = (RG_CONFIG.fixedCodeEnabled ? RG_PENDING.fixedApproved : true) &&
           (RG_CONFIG.tempCodeEnabled ? RG_PENDING.tempApproved : true) &&
           (RG_CONFIG.supervisorEnabled ? RG_PENDING.supervisorApproved : true);
  btn.disabled = !ok;
}

function confirmRgAuth() {
  var hasFixed = RG_CONFIG.fixedCodeEnabled;
  var hasTemp = RG_CONFIG.tempCodeEnabled;
  var hasSv = RG_CONFIG.supervisorEnabled;
  var approvedVia = [];
  var authorizer = '';
  if (hasFixed && RG_PENDING.fixedApproved) { approvedVia.push('固定授权码'); authorizer = authorizer || '当前用户'; }
  if (hasTemp && RG_PENDING.tempApproved) { approvedVia.push('临时授权码'); authorizer = authorizer || '当前用户'; }
  if (hasSv && RG_PENDING.supervisorApproved) { approvedVia.push('即时审批'); authorizer = authorizer || '当前用户'; }

  // 写入日志
  var now = new Date();
  var timeStr = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+' '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0');
  RG_LOGS.unshift({
    initiator: RG_PENDING ? RG_PENDING.initiator : '—',
    item: RG_PENDING ? RG_PENDING.item : '商品',
    barcode: RG_PENDING ? RG_PENDING.barcode : '—',
    qty: RG_PENDING ? RG_PENDING.qty : '—',
    amount: RG_PENDING ? RG_PENDING.amount : 0,
    cashierBarcode: RG_PENDING ? RG_PENDING.cashierBarcode : '—',
    methods: approvedVia,
    authorizer: authorizer,
    time: timeStr,
    result: '已批准移除'
  });
  _saveRGData();
  closeRgAuth(true);
  rgRenderTable();
}

function closeRgAuth(approved) {
  // 清除等待审核状态栏
  var bar = document.getElementById('rgPendingBar');
  if (bar) bar.remove();
  if (RG_TEMP_TIMER) clearInterval(RG_TEMP_TIMER);
  RG_TEMP_TIMER = null;
  // 临时授权码专码专用，用后即作废（此处仅清除计时器）
  document.getElementById('rgAuthModal').style.display = 'none';
  document.getElementById('rgAuthBackdrop').style.display = 'none';
  RG_SUPERVISOR_DONE = false;
  if (!approved && RG_PENDING) {
    var now = new Date();
    var timeStr = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+' '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0');
    RG_LOGS.unshift({
      initiator: RG_PENDING.initiator || '—',
      item: RG_PENDING.item,
      barcode: RG_PENDING.barcode || '—',
      qty: RG_PENDING.qty || '—',
      amount: RG_PENDING.amount || 0,
      cashierBarcode: RG_PENDING.cashierBarcode || '—',
      methods: [],
      authorizer: '—',
      time: timeStr,
      result: '已取消'
    });
    _saveRGData();
    rgRenderTable();
  }
  RG_PENDING = null;
}

// 临时授权码时效信息（页面顶部展示）
function rgTempInfoHTML() {
  if (!RG_CONFIG.tempCodeEnabled) return '';
  var sec = RG_CONFIG.tempCodeExpirySec;
  var durText = sec >= 3600
    ? Math.floor(sec/3600)+'小时'+(sec%3600?Math.floor((sec%3600)/60)+'分钟':'')
    : Math.floor(sec/60)+'分钟';
  if (RG_TEMP_CODE && RG_TEMP_EXPIRE > Date.now()) {
    var expDate = new Date(RG_TEMP_EXPIRE);
    var left = Math.ceil((RG_TEMP_EXPIRE - Date.now())/1000);
    var leftText = left >= 3600
      ? Math.floor(left/3600)+'小时'+Math.floor((left%3600)/60)+'分钟'
      : Math.floor(left/60)+'分钟'+(left%60)+'秒';
    return '<span class="rg-temp-code-display">🔐 '+RG_TEMP_CODE+'</span>' +
      '<span style="color:#666">有效期至 '+expDate.toLocaleTimeString()+'（剩余 '+leftText+'）</span>' +
      '<button onclick="rgClearTempCode()" style="margin-left:8px;font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer">✕ 作废</button>';
  }
  return '<span class="rg-temp-code-display" style="opacity:0.5">⏱️ 未生成</span>' +
    '<span style="color:#999">有效期 '+durText+' · 将在下次删除请求时自动生成</span>';
}
function rgClearTempCode() {
  RG_TEMP_CODE = null; RG_TEMP_EXPIRE = 0;
  if (RG_TEMP_TIMER) { clearInterval(RG_TEMP_TIMER); RG_TEMP_TIMER = null; }
  _saveRGData();
  var bar = document.getElementById('rgTempInfoBar');
  if (bar) bar.innerHTML = rgTempInfoHTML();
}

function rgGetFilteredLogs() {
  var now = new Date()
  var todayStr = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')
  var yesterday = new Date(now); yesterday.setDate(now.getDate()-1)
  var yesterdayStr = yesterday.getFullYear()+'-'+(yesterday.getMonth()+1).toString().padStart(2,'0')+'-'+yesterday.getDate().toString().padStart(2,'0')
  var weekAgo = new Date(now); weekAgo.setDate(now.getDate()-7)
  var weekAgoStr = weekAgo.getFullYear()+'-'+(weekAgo.getMonth()+1).toString().padStart(2,'0')+'-'+weekAgo.getDate().toString().padStart(2,'0')
  var monthAgo = new Date(now); monthAgo.setDate(now.getDate()-30)
  var monthAgoStr = monthAgo.getFullYear()+'-'+(monthAgo.getMonth()+1).toString().padStart(2,'0')+'-'+monthAgo.getDate().toString().padStart(2,'0')

  return RG_LOGS.filter(function(l) {
    if (RG_FILTER_STORE !== 'all' && l.store !== RG_FILTER_STORE) return false
    if (RG_FILTER_DATE !== 'all') {
      var d = l.time.substring(0, 10)
      if (RG_FILTER_DATE === 'today' && d !== todayStr) return false
      if (RG_FILTER_DATE === 'yesterday' && d !== yesterdayStr) return false
      if (RG_FILTER_DATE === 'week' && d < weekAgoStr) return false
      if (RG_FILTER_DATE === 'month' && d < monthAgoStr) return false
    }
    if (RG_FILTER_KEYWORD) {
      var kw = RG_FILTER_KEYWORD.toLowerCase()
      if ((l.barcode||'').toLowerCase().indexOf(kw) === -1 && (l.name||'').toLowerCase().indexOf(kw) === -1) return false
    }
    return true
  })
}

function rgRenderTable() {
  var thead = document.getElementById('rgTableHead')
  var tbody = document.getElementById('rgTableBody')
  if (!thead || !tbody) return

  thead.innerHTML = '<th><input type="checkbox" id="rgSelectAll" onclick="rgToggleAll(this)"></th>' +
    '<th>序号</th><th>商品名称</th><th>商品条码</th><th>商品规格</th><th>销售价</th><th>数量</th>' +
    '<th>金额</th>' +
    '<th><span style="display:inline-flex;align-items:center;gap:4px">' +
      '关联单号' +
      '<span class="ic-tip-icon" data-tip="关联单号为当次扫码商品产生的订单号，无订单生成的该字段无值">?</span>' +
    '</span></th>' +
    '<th>操作人</th><th>操作时间</th>'

  var filtered = rgGetFilteredLogs()
  var total = filtered.length
  var start = (RG_PAGE - 1) * RG_PAGE_SIZE
  var end = Math.min(start + RG_PAGE_SIZE, total)
  var pageLogs = filtered.slice(start, end)

  var html = ''
  for (var i = 0; i < pageLogs.length; i++) {
    var l = pageLogs[i]
    var idx = start + i + 1
    html += '<tr>' +
      '<td><input type="checkbox" class="rg-row-cb" data-id="' + idx + '"></td>' +
      '<td>' + idx + '</td>' +
      '<td>' + _esc(l.name || '—') + '</td>' +
      '<td style="font-family:monospace;font-size:12px">' + _esc(l.barcode || '—') + '</td>' +
      '<td style="font-size:12px;color:#555">' + _esc(l.spec || '—') + '</td>' +
      '<td>¥' + (typeof l.price === 'number' ? l.price.toFixed(2) : '—') + '</td>' +
      '<td>' + _esc(l.qty || '—') + '</td>' +
      '<td style="font-weight:600">¥' + (typeof l.amount === 'number' ? l.amount.toFixed(2) : '—') + '</td>' +
      '<td style="font-family:monospace;font-size:12px;color:' + (l.orderNo ? '#005CF5' : '#bbb') + '">' +
        (l.orderNo ? l.orderNo : '<span style="color:#bbb">—</span>') +
      '</td>' +
      '<td>' + _esc(l.operator || '—') + '</td>' +
      '<td>' + (l.time || '—') + '</td>' +
    '</tr>'
  }

  if (pageLogs.length === 0) {
    html = '<tr><td colspan="11" style="text-align:center;color:#999;padding:40px">暂无移除记录</td></tr>'
  }

  tbody.innerHTML = html
  rgUpdatePagination(total)
}

function rgUpdatePagination(total) {
  var el = document.getElementById('rgPagination')
  if (!el) return
  var totalPages = Math.ceil(total / RG_PAGE_SIZE) || 1

  // build page number array
  var pages = []
  for (var p = 1; p <= totalPages; p++) {
    if (p <= 3 || p > totalPages - 2 || Math.abs(p - RG_PAGE) <= 1) {
      if (pages.length > 0 && p - pages[pages.length-1] > 1) pages.push('...')
      pages.push(p)
    }
  }

  var html =
    '<span class="page-info">共 ' + total + ' 条</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="rgGoPage(' + (RG_PAGE-1) + ')" ' + (RG_PAGE<=1?'disabled':'') + '>‹</button>'

  for (var pi = 0; pi < pages.length; pi++) {
    var pg = pages[pi]
    if (pg === '...') {
      html += '<span class="page-num" style="opacity:0.4">...</span>'
    } else {
      html += '<button class="page-btn" style="' + (pg === RG_PAGE ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="rgGoPage(' + pg + ')">' + pg + '</button>'
    }
  }

  html +=
      '<button class="page-btn" onclick="rgGoPage(' + (RG_PAGE+1) + ')" ' + (RG_PAGE>=totalPages?'disabled':'') + '>›</button>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
      RG_PAGE_SIZE + '条/页 跳至 <input type="number" id="rgJumpInput" min="1" max="' + totalPages + '" value="' + RG_PAGE + '" ' +
      'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
      'onkeydown="if(event.key===\'Enter\')rgGoPage(parseInt(this.value))"> 页' +
    '</div>'

  el.innerHTML = html
}

function rgGoPage(p) {
  var totalPages = Math.ceil(rgGetFilteredLogs().length / RG_PAGE_SIZE) || 1
  if (p < 1 || p > totalPages) return
  RG_PAGE = p
  rgRenderTable()
}

function rgToggleAll(cb) {
  var cbs = document.querySelectorAll('.rg-row-cb')
  for (var i = 0; i < cbs.length; i++) cbs[i].checked = cb.checked
}

function rgSearch() {
  RG_FILTER_STORE = document.getElementById('rgFilterStore').value
  RG_FILTER_KEYWORD = document.getElementById('rgFilterKeyword').value.trim()
  RG_PAGE = 1
  rgRenderTable()
}

function rgReset() {
  RG_FILTER_STORE = 'all'
  RG_FILTER_DATE = 'today'
  RG_FILTER_KEYWORD = ''
  RG_PAGE = 1
  var elS = document.getElementById('rgFilterStore'); if (elS) elS.value = 'all'
  var elK = document.getElementById('rgFilterKeyword'); if (elK) elK.value = ''
  plSyncDateTabs('rgFilterTabs', RG_FILTER_DATE);
  rgRenderTable()
}

// ========== PAGE: 挂单记录 (Order Hold) ==========================
var OH_MOCK_ORDERS = (function() {
  var stores = ['崧泽大道中心店', '徐泾店', '赵巷店', '华新店', '重固店'];
  var products = [
    '鲜猪肉（带皮前腿）', '鲜鸡蛋（散装）', '西红柿（精选）', '土豆（黄心）',
    '苹果（红富士）', '大米（珍珠米5kg）', '金龙鱼调和油5L', '海天酱油（生抽500ml）',
    '纯牛奶（蒙牛250ml×12）', '方便面（康师傅红烧5连包）', '黄瓜（刺黄瓜）',
    '香蕉（进口）', '白砂糖（太古400g）', '矿泉水（农夫山泉550ml×24）'
  ];
  var reasons = ['客户临时离开', '等待称重确认', '价格争议', '库存不足待确认', '客户要求暂存'];
  var operators = ['张三', '李四', '王五', '赵六', '钱七'];
  var orders = [];
  var baseTime = new Date('2026-06-10T10:00:00').getTime();

  for (var i = 1; i <= 55; i++) {
    var storeIdx = Math.floor(Math.random() * stores.length);
    var productCount = 1 + Math.floor(Math.random() * 8);
    var items = [];
    var totalAmount = 0;
    for (var j = 0; j < productCount; j++) {
      var price = parseFloat((3 + Math.random() * 80).toFixed(2));
      var qty = 1 + Math.floor(Math.random() * 3);
      totalAmount += price * qty;
      items.push(products[Math.floor(Math.random() * products.length)]);
    }
    totalAmount = parseFloat(totalAmount.toFixed(2));

    var offsetMins = Math.floor(Math.random() * 43200); // 30 days
    var orderTime = new Date(baseTime - offsetMins * 60000);
    var timeStr = orderTime.getFullYear() + '-' +
      String(orderTime.getMonth() + 1).padStart(2, '0') + '-' +
      String(orderTime.getDate()).padStart(2, '0') + ' ' +
      String(orderTime.getHours()).padStart(2, '0') + ':' +
      String(orderTime.getMinutes()).padStart(2, '0') + ':' +
      String(orderTime.getSeconds()).padStart(2, '0');

    orders.push({
      id: 'OH' + String(i).padStart(4, '0'),
      orderNo: 'DD' + String(202606010000 + i),
      store: stores[storeIdx],
      time: timeStr,
      items: items,
      itemCount: productCount,
      amount: totalAmount,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      operator: operators[Math.floor(Math.random() * operators.length)],
      status: Math.random() < 0.6 ? '已支付' : '未支付'
    });
  }
  return orders.sort(function(a, b) { return b.time.localeCompare(a.time); });
})();

var OH_FILTER_STORE = 'all';
var OH_FILTER_DATE = 'all';
var OH_FILTER_KEYWORD = '';
var OH_PAGE = 1;
var OH_PAGE_SIZE = 15;
var OH_SORT_COL = null;
var OH_SORT_DIR = 1;

function ohGetFilteredOrders() {
  var orders = OH_MOCK_ORDERS.slice();

  if (OH_FILTER_STORE !== 'all') {
    orders = orders.filter(function(o) { return o.store === OH_FILTER_STORE; });
  }
  if (OH_FILTER_DATE !== 'all') {
    var now = new Date();
    var cutoff;
    switch (OH_FILTER_DATE) {
      case 'today': cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); break;
      case 'yesterday': cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime(); break;
      case 'week': cutoff = now.getTime() - 7 * 86400000; break;
      case 'month': cutoff = now.getTime() - 30 * 86400000; break;
    }
    if (OH_FILTER_DATE === 'yesterday') {
      orders = orders.filter(function(o) {
        var t = new Date(o.time).getTime();
        var today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return t >= cutoff && t < today0;
      });
    } else {
      orders = orders.filter(function(o) { return new Date(o.time).getTime() >= cutoff; });
    }
  }
  if (OH_FILTER_KEYWORD) {
    var kw = OH_FILTER_KEYWORD.toLowerCase();
    orders = orders.filter(function(o) {
      return o.orderNo.toLowerCase().indexOf(kw) >= 0 ||
        o.items.some(function(it) { return it.toLowerCase().indexOf(kw) >= 0; });
    });
  }
  return orders.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
}

function ohRenderTable() {
  var orders = ohGetFilteredOrders();
  var total = orders.length;
  var pages = Math.ceil(total / OH_PAGE_SIZE) || 1;
  if (OH_PAGE > pages) OH_PAGE = pages;
  var start = (OH_PAGE - 1) * OH_PAGE_SIZE;
  var pageOrders = orders.slice(start, start + OH_PAGE_SIZE);

  var thead = document.getElementById('ohTableHead');
  var tbody = document.getElementById('ohTableBody');
  if (!thead || !tbody) return;

  if (!thead.innerHTML) {
    thead.innerHTML = '<th><input type="checkbox" id="ohSelectAll" onclick="ohToggleAll(this)"></th>' +
      '<th>序号</th><th>订单编号</th><th>所属门店</th><th>挂单时间</th>' +
      '<th>商品明细</th><th>商品数量</th><th>应收金额</th><th>状态</th>' +
      '<th>操作人</th>';
  }

  var html = '';
  for (var i = 0; i < pageOrders.length; i++) {
    var o = pageOrders[i];
    var idx = start + i + 1;
    html += '<tr>' +
      '<td><input type="checkbox" class="oh-row-cb" data-id="' + o.id + '"></td>' +
      '<td>' + idx + '</td>' +
      '<td style="font-family:monospace;font-size:12px">' + _esc(o.orderNo) + '</td>' +
      '<td>' + _esc(o.store) + '</td>' +
      '<td>' + o.time + '</td>' +
      '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:default" data-tip="' + _esc(o.items.join('、')) + '">' + _esc(o.items.join('、')) + '</td>' +
      '<td>' + o.itemCount + ' 件</td>' +
      '<td style="font-weight:600;color:#333">¥' + o.amount.toFixed(2) + '</td>' +
      '<td>' +
        '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:500;' +
          (o.status === '已支付' ? 'color:#005CF5' : 'color:#999') + '">' +
          (o.status === '已支付' ? '●' : '○') + ' ' + _esc(o.status) +
        '</span>' +
      '</td>' +
      '<td>' + _esc(o.operator) + '</td>' +
    '</tr>';
  }
  tbody.innerHTML = html;

  // 分页
  var pag = document.getElementById('ohPagination');
  if (pag) {
    var pagHtml = '<span class="page-info">共 ' + total + ' 条</span>' +
      '<div class="page-btns">' +
        '<button class="page-btn" onclick="ohGoPage(' + (OH_PAGE - 1) + ')" ' + (OH_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';
    // smart page numbers
    var pageNums = [];
    for (var p = 1; p <= pages; p++) {
      if (p <= 3 || p > pages - 2 || Math.abs(p - OH_PAGE) <= 1) {
        if (pageNums.length > 0 && p - pageNums[pageNums.length - 1] > 1) pageNums.push('...');
        pageNums.push(p);
      }
    }
    for (var pi = 0; pi < pageNums.length; pi++) {
      var pg = pageNums[pi];
      if (pg === '...') {
        pagHtml += '<span class="page-num" style="opacity:0.4">...</span>';
      } else {
        pagHtml += '<button class="page-btn" style="' + (pg === OH_PAGE ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="ohGoPage(' + pg + ')">' + pg + '</button>';
      }
    }
    pagHtml += '<button class="page-btn" onclick="ohGoPage(' + (OH_PAGE + 1) + ')" ' + (OH_PAGE >= pages ? 'disabled' : '') + '>›</button></div>' +
      '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
        OH_PAGE_SIZE + '条/页 跳至 <input type="number" id="ohJumpInput" min="1" max="' + pages + '" value="' + OH_PAGE + '" ' +
        'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
        'onkeydown="if(event.key===\'Enter\')ohGoPage(parseInt(this.value))"> 页' +
      '</div>';
    pag.innerHTML = pagHtml;
  }
}

function ohGoPage(p) {
  var orders = ohGetFilteredOrders();
  var pages = Math.ceil(orders.length / OH_PAGE_SIZE) || 1;
  if (p < 1) p = 1;
  if (p > pages) p = pages;
  OH_PAGE = p;
  ohRenderTable();
}

function ohToggleAll(el) {
  var cbs = document.querySelectorAll('.oh-row-cb');
  for (var i = 0; i < cbs.length; i++) { cbs[i].checked = el.checked; }
}

function ohSetDateFilter(val, el) {
  OH_FILTER_DATE = val;
  OH_PAGE = 1;
  var tabs = document.querySelectorAll('#ohFilterTabs .ic-ftab');
  for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); }
  if (el) el.classList.add('active');
  ohRenderTable();
}

function ohSearch() {
  OH_FILTER_STORE = document.getElementById('ohFilterStore').value;
  OH_FILTER_KEYWORD = document.getElementById('ohFilterKeyword').value.trim();
  OH_PAGE = 1;
  ohRenderTable();
}

function ohReset() {
  OH_FILTER_STORE = 'all';
  OH_FILTER_DATE = 'all';
  OH_FILTER_KEYWORD = '';
  OH_PAGE = 1;
  var elS = document.getElementById('ohFilterStore'); if (elS) elS.value = 'all';
  var elK = document.getElementById('ohFilterKeyword'); if (elK) elK.value = '';
  plSyncDateTabs('ohFilterTabs', OH_FILTER_DATE);
  ohRenderTable();
}

function initOrderHold() {
  var el = document.getElementById('orderHoldContent');
  if (!el) return;
  var stores = ['崧泽大道中心店', '徐泾店', '赵巷店', '华新店', '重固店'];

  el.innerHTML =
      // 筛选栏（铺满，上部紧接，白底）
      '<div style="flex-shrink:0;margin:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<select id="ohFilterStore" style="padding:7px 12px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;background:#fff;outline:none" onchange="ohSearch()">' +
          '<option value="all">全部门店</option>' +
          stores.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
        '</select>' +
        '<div class="ic-filter-tabs" id="ohFilterTabs">' +
          '<span class="ic-ftab' + (OH_FILTER_DATE === 'all' ? ' active' : '') + '" onclick="ohSetDateFilter(\'all\',this)">全部</span>' +
          '<span class="ic-ftab' + (OH_FILTER_DATE === 'today' ? ' active' : '') + '" onclick="ohSetDateFilter(\'today\',this)">今天</span>' +
          '<span class="ic-ftab' + (OH_FILTER_DATE === 'yesterday' ? ' active' : '') + '" onclick="ohSetDateFilter(\'yesterday\',this)">昨天</span>' +
          '<span class="ic-ftab' + (OH_FILTER_DATE === 'week' ? ' active' : '') + '" onclick="ohSetDateFilter(\'week\',this)">近7天</span>' +
          '<span class="ic-ftab' + (OH_FILTER_DATE === 'month' ? ' active' : '') + '" onclick="ohSetDateFilter(\'month\',this)">近30天</span>' +
        '</div>' +
        '<input type="text" id="ohFilterKeyword" class="ic-search" placeholder="订单编号/商品名称" style="flex:0 1 240px" onkeydown="if(event.key===\'Enter\')ohSearch()">' +
        '<button class="ic-btn" onclick="ohReset()">重置</button>' +
        '<button class="ic-btn" style="background:#005CF5;color:#fff;border-color:#005CF5;font-weight:600" onclick="ohSearch()">查询</button>' +
        '<div style="flex:1"></div>' +
        '<button class="ic-btn" style="background:#5c6bc0;color:#fff;border-color:#5c6bc0" onclick="ohGenerateMock()">模拟数据</button>' +
      '</div>' +
      // 表格卡片（左右缩进8px，上方间隔10px，底部间隔8px，渐变边框）
      '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
      '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
          '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
            '<table>' +
              '<thead id="ohTableHead"></thead>' +
              '<tbody id="ohTableBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="pagination-bar" id="ohPagination" style="flex-shrink:0"></div>' +
        '</div>' +
      '</div>';

  ohRenderTable();
}

function ohGenerateMock() {
  var stores = ['崧泽大道中心店', '徐泾店', '赵巷店', '华新店', '重固店'];
  var products = [
    ['鲜猪肉（带皮前腿）', '西红柿（精选）', '大米（东北珍珠米 5kg）'],
    ['鲜鸡蛋（散装）', '土豆（黄心）', '海天酱油（生抽 500ml）'],
    ['苹果（红富士）', '香蕉（进口）', '纯牛奶（蒙牛 250ml×12）'],
    ['黄瓜（刺黄瓜）', '茄子（紫长茄）', '金龙鱼调和油 5L'],
    ['大白菜', '豆腐（老豆腐）', '方便面（康师傅红烧 5连包）'],
    ['青椒（薄皮）', '鲜猪肉（带皮五花）', '食盐（中盐精制盐 400g）'],
    ['矿泉水（农夫山泉 550ml×24）', '白砂糖（太古 400g）', '鲜鸡蛋（散装）'],
    ['西红柿（精选）', '苹果（红富士）', '纯牛奶（蒙牛 250ml×12）'],
    ['土豆（黄心）', '大白菜', '鲜猪肉（带皮前腿）'],
    ['香蕉（进口）', '黄瓜（刺黄瓜）', '海天酱油（生抽 500ml）']
  ];
  var reasons = ['顾客要求暂存', '等待凑单', '余额不足', '更换商品', '临时离开'];
  var operators = ['张伟', '李娜', '王强', '陈芳', '赵明', '刘洋'];
  var now = new Date();
  var count = Math.floor(Math.random() * 20) + 10; // 10~29 条
  for (var i = 0; i < count; i++) {
    // 新数据使用当前时间，每条间隔几秒
    var ts = new Date(now.getTime() - i * (Math.floor(Math.random() * 30) + 2) * 1000);
    var items = products[Math.floor(Math.random() * products.length)];
    var itemCount = items.length + Math.floor(Math.random() * 3);
    var amounts = [23.5, 15.8, 42.0, 9.9, 55.2, 18.6, 78.0, 33.4, 27.5, 61.8, 12.3, 88.9, 45.0, 19.7, 30.2];
    var amount = amounts[Math.floor(Math.random() * amounts.length)] + Math.floor(Math.random() * 6) * 10;
    OH_MOCK_ORDERS.push({
      id: 'oh-' + Date.now() + '-' + i,
      orderNo: 'SO' + ts.getFullYear().toString().slice(2) +
        (ts.getMonth()+1).toString().padStart(2,'0') +
        ts.getDate().toString().padStart(2,'0') +
        Math.floor(Math.random() * 900000 + 100000).toString(),
      store: stores[Math.floor(Math.random() * stores.length)],
      time: ts.getFullYear() + '-' +
        (ts.getMonth()+1).toString().padStart(2,'0') + '-' +
        ts.getDate().toString().padStart(2,'0') + ' ' +
        ts.getHours().toString().padStart(2,'0') + ':' +
        ts.getMinutes().toString().padStart(2,'0') + ':' +
        ts.getSeconds().toString().padStart(2,'0'),
      items: items,
      itemCount: itemCount,
      amount: amount,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      operator: operators[Math.floor(Math.random() * operators.length)],
      status: Math.random() < 0.6 ? '已支付' : '未支付'
    });
  }
  ohRenderTable();
}

// ========== PAGE: 交班记录 (Shift Handover) ==========================
var SH_MOCK_RECORDS = (function() {
  var cached = localStorage.getItem('SH_MOCK_RECORDS');
  if (cached) { try { var p = JSON.parse(cached); if (Array.isArray(p) && p.length > 0 && p[0]._v === 3 && p[0].dueCash !== undefined) return p; } catch(e) {} }
  return null;
})();
var SH_FILTER_STORE = 'all';
var SH_FILTER_DATE = 'today';
var SH_FILTER_STAFF = 'all';
var SH_PAGE = 1;
var SH_PAGE_SIZE = 15;
// 当前登录用户（交班记录[称]页面用）
var CURRENT_STAFF = '张伟';

var SH_STORES = ['崧泽大道中心店', '徐泾店', '赵巷店', '华新店', '重固店'];
var SH_STAFF = ['张伟', '李娜', '王强', '陈芳', '赵明', '刘洋', '孙悦', '周杰'];
var SH_TERMINALS = {
  '崧泽大道中心店': ['收银台A', '收银台B', '收银台C', '自助机1'],
  '徐泾店': ['收银台01', '收银台02', '收银台03', '收银台04'],
  '赵巷店': ['POS-1', 'POS-2', 'POS-3'],
  '华新店': ['前台A', '前台B', '前台C'],
  '重固店': ['终端1', '终端2', '终端3']
};

function _generateSHMockRecords() {
  var records = [];
  var now = new Date();
  for (var d = 0; d < 45; d++) {
    var ts = new Date(now.getTime() - d * 24 * 3600000);
    var dateStr = ts.getFullYear() + '-' + (ts.getMonth()+1).toString().padStart(2,'0') + '-' + ts.getDate().toString().padStart(2,'0');
    // daySlots scoped to date (across all stores): prevents same person in two stores at same time
    var daySlots = {}; // { staff: [[startMin, endMin], ...] }
    for (var s = 0; s < SH_STORES.length; s++) {
      var cnt = Math.floor(Math.random() * 3) + 2;
      for (var c = 0; c < cnt; c++) {
        var startH = 6 + Math.floor(Math.random() * 6);
        var startM = Math.floor(Math.random() * 60);
        var durH = 4 + Math.floor(Math.random() * 6);
        var durM = Math.floor(Math.random() * 60);
        var startMin = startH * 60 + startM;
        var endMinRaw = startMin + durH * 60 + durM;
        var endMin = Math.min(endMinRaw, 23 * 60);
        // pick a staff without overlap; retry up to 20 times
        var staff = null, tried = 0;
        while (tried < 20) {
          var cand = SH_STAFF[Math.floor(Math.random() * SH_STAFF.length)];
          var occupied = daySlots[cand] || [];
          var ok = true;
          for (var o = 0; o < occupied.length; o++) {
            if (startMin < occupied[o][1] && endMin > occupied[o][0]) { ok = false; break; }
          }
          if (ok) { staff = cand; break; }
          tried++;
        }
        if (!staff) continue; // all staff busy this date, skip this shift
        if (!daySlots[staff]) daySlots[staff] = [];
        daySlots[staff].push([startMin, endMin]);
        var endH = Math.floor(endMin / 60);
        var endM2 = endMin % 60;
        var durStr = Math.floor((endMin - startMin) / 60) + '小时' + ((endMin - startMin) % 60 > 0 ? (endMin - startMin) % 60 + '分' : '');
        var startTime = startH.toString().padStart(2,'0') + ':' + startM.toString().padStart(2,'0');
        var endTime = endH.toString().padStart(2,'0') + ':' + endM2.toString().padStart(2,'0');
        var totalAmt = parseFloat((200 + Math.random() * 5000).toFixed(2));
        var cashAmt = parseFloat((totalAmt * (0.1 + Math.random() * 0.5)).toFixed(2));
        var onlineAmt = parseFloat((totalAmt - cashAmt).toFixed(2));
        var ordCnt = Math.floor(Math.random() * 60) + 5;
        var terminals = SH_TERMINALS[SH_STORES[s]];
        var startTerm = terminals[Math.floor(Math.random() * terminals.length)];
        var endTerm = Math.random() < 0.2 ? terminals[Math.floor(Math.random() * terminals.length)] : startTerm;
        var petty = parseFloat(Math.min(200 + Math.random() * 400, cashAmt * 0.8).toFixed(0));
        var dueCash = parseFloat(Math.max(cashAmt - petty, 0).toFixed(2));
        var variance = parseFloat(((Math.random() - 0.4) * 60).toFixed(2)); // -24 ~ +36
        var actualCash = parseFloat((dueCash + variance).toFixed(2));
        var overShort = parseFloat((actualCash - dueCash).toFixed(2));
        var baseNotes = ['', '', '', '', '交接班正常', '备用金已交接', '收银机已清零', 'POS机故障已报修'];
        var note = baseNotes[Math.floor(Math.random() * baseNotes.length)];
        if (overShort !== 0 && (note === '' || Math.random() < 0.3)) {
          note = '长短款' + (overShort >= 0 ? '+' : '') + overShort.toFixed(2) + '元';
        }
        records.push({ _v: 3, date: dateStr, store: SH_STORES[s], staff: staff, startTime: startTime, endTime: endTime, duration: durStr, startTerminal: startTerm, endTerminal: endTerm, pettyCash: petty, totalAmount: totalAmt, cashAmount: cashAmt, dueCash: dueCash, actualCash: actualCash, overShort: overShort, onlineAmount: onlineAmt, orderCount: ordCnt, note: note });
      }
    }
  }
  return records;
}

function shGetFilteredRecords() {
  var records = SH_MOCK_RECORDS || [];
  if (SH_FILTER_STORE !== 'all') records = records.filter(function(r) { return r.store === SH_FILTER_STORE; });
  if (SH_FILTER_DATE !== 'all') {
    var _now = new Date();
    var _today = _now.getFullYear() + '-' + (_now.getMonth()+1).toString().padStart(2,'0') + '-' + _now.getDate().toString().padStart(2,'0');
    if (SH_FILTER_DATE === 'today') {
      records = records.filter(function(r) { return r.date === _today; });
    } else if (SH_FILTER_DATE === 'yesterday') {
      var _y = new Date(_now.getTime() - 86400000);
      var _yst = _y.getFullYear() + '-' + (_y.getMonth()+1).toString().padStart(2,'0') + '-' + _y.getDate().toString().padStart(2,'0');
      records = records.filter(function(r) { return r.date === _yst; });
    } else if (SH_FILTER_DATE === 'week') {
      var _wa = new Date(_now.getTime() - 7 * 86400000);
      var _wstr = _wa.getFullYear() + '-' + (_wa.getMonth()+1).toString().padStart(2,'0') + '-' + _wa.getDate().toString().padStart(2,'0');
      records = records.filter(function(r) { return r.date >= _wstr; });
    } else if (SH_FILTER_DATE === 'month') {
      var _ma = new Date(_now.getTime() - 30 * 86400000);
      var _mstr = _ma.getFullYear() + '-' + (_ma.getMonth()+1).toString().padStart(2,'0') + '-' + _ma.getDate().toString().padStart(2,'0');
      records = records.filter(function(r) { return r.date >= _mstr; });
    }
  }
  if (SH_FILTER_STAFF !== 'all') records = records.filter(function(r) { return r.staff === SH_FILTER_STAFF; });
  records.sort(function(a, b) {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.endTime.localeCompare(a.endTime);
  });
  return records;
}

function shRenderCards() {
  var container = document.getElementById('shSummaryCards');
  if (!container) return;
  var records = shGetFilteredRecords();
  if (records.length === 0) { container.innerHTML = ''; return; }

  // 计算总计
  var total = { count: 0, totalAmt: 0, cashAmt: 0, onlineAmt: 0, dueCash: 0, actualCash: 0, totalMin: 0 };
  // 按人员汇总
  var staffMap = {};
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    // 总计
    total.count++;
    total.totalAmt += r.totalAmount;
    total.cashAmt += r.cashAmount;
    total.onlineAmt += r.onlineAmount;
    total.dueCash += r.dueCash;
    total.actualCash += r.actualCash;
    var dur = r.duration || '';
    var hh = dur.match(/(\d+)小时/);
    var mm = dur.match(/(\d+)分/);
    total.totalMin += (hh ? parseInt(hh[1]) : 0) * 60 + (mm ? parseInt(mm[1]) : 0);
    // 按人员
    if (!staffMap[r.staff]) {
      staffMap[r.staff] = { staff: r.staff, count: 0, totalAmt: 0, cashAmt: 0, onlineAmt: 0, dueCash: 0, actualCash: 0, totalMin: 0 };
    }
    var sm = staffMap[r.staff];
    sm.count++;
    sm.totalAmt += r.totalAmount;
    sm.cashAmt += r.cashAmount;
    sm.onlineAmt += r.onlineAmount;
    sm.dueCash += r.dueCash;
    sm.actualCash += r.actualCash;
    sm.totalMin += (hh ? parseInt(hh[1]) : 0) * 60 + (mm ? parseInt(mm[1]) : 0);
  }
  var durH = Math.floor(total.totalMin / 60);
  var durM = total.totalMin % 60;
  var durStr = durH + '小时' + (durM > 0 ? durM + '分' : '');
  var totalOS = parseFloat((total.actualCash - total.dueCash).toFixed(2));
  var totalOSColor = totalOS > 0 ? '#2e7d32' : totalOS < 0 ? '#fc4b52' : '#666';

  var html = '';
  // 总计卡片
  html += '<div style="flex-shrink:0;width:240px;padding:14px 16px;background:linear-gradient(135deg,#f5f7ff,#e8ecff);border-radius:8px;border:1px solid #c5cae9;box-shadow:0 1px 4px rgba(92,107,192,0.15)">' +
    '<div style="font-size:12px;font-weight:700;color:#3949ab;margin-bottom:10px;display:flex;align-items:center;gap:4px"><span style="font-size:15px">📊</span> 合计</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px">' +
      '<span style="color:#666">班次</span><span style="text-align:right;font-weight:700">' + total.count + '</span>' +
      '<span style="color:#666">在岗时长</span><span style="text-align:right;font-weight:600;color:#6a1b9a">' + durStr + '</span>' +
      '<span style="color:#666">收款合计</span><span style="text-align:right;font-weight:700;color:#005CF5">¥' + total.totalAmt.toFixed(2) + '</span>' +
      '<span style="color:#666">现金</span><span style="text-align:right">¥' + total.cashAmt.toFixed(2) + '</span>' +
      '<span style="color:#666">线上</span><span style="text-align:right">¥' + total.onlineAmt.toFixed(2) + '</span>' +
      '<span style="color:#666">应缴</span><span style="text-align:right">¥' + total.dueCash.toFixed(2) + '</span>' +
      '<span style="color:#666">实缴</span><span style="text-align:right">¥' + total.actualCash.toFixed(2) + '</span>' +
    '</div>' +
    '<div style="margin-top:8px;padding:6px 10px;border-radius:6px;background:' + (totalOS > 0 ? '#e8f5e9' : totalOS < 0 ? '#ffebee' : '#f5f5f5') + ';display:flex;justify-content:space-between;align-items:center;font-size:12px">' +
      '<span style="color:#666">长短款</span>' +
      '<span style="font-weight:700;color:' + totalOSColor + '">' + (totalOS >= 0 ? '+' : '') + totalOS.toFixed(2) + '</span>' +
    '</div>' +
  '</div>';

  // 按人员卡片
  var staffs = Object.keys(staffMap).sort();
  for (var s = 0; s < staffs.length; s++) {
    var m = staffMap[staffs[s]];
    var overShort = parseFloat((m.actualCash - m.dueCash).toFixed(2));
    var osColor = overShort > 0 ? '#2e7d32' : overShort < 0 ? '#fc4b52' : '#666';
    var osBg = overShort > 0 ? '#e8f5e9' : overShort < 0 ? '#ffebee' : '#f5f5f5';
    var staffDurH = Math.floor(m.totalMin / 60);
    var staffDurM = m.totalMin % 60;
    var staffDurStr = staffDurH + '小时' + (staffDurM > 0 ? staffDurM + '分' : '');
    html += '<div style="flex-shrink:0;width:220px;padding:14px 16px;background:#fff;border-radius:8px;border:1px solid #f0f0f0;box-shadow:0 1px 3px rgba(0,0,0,0.06)">' +
      '<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:10px">' + _esc(m.staff) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px">' +
        '<span style="color:#999">班次</span><span style="text-align:right;font-weight:600">' + m.count + '</span>' +
        '<span style="color:#999">在岗时长</span><span style="text-align:right;font-weight:600;color:#6a1b9a">' + staffDurStr + '</span>' +
        '<span style="color:#999">收款合计</span><span style="text-align:right;font-weight:600;color:#005CF5">¥' + m.totalAmt.toFixed(2) + '</span>' +
        '<span style="color:#999">现金</span><span style="text-align:right">¥' + m.cashAmt.toFixed(2) + '</span>' +
        '<span style="color:#999">线上</span><span style="text-align:right">¥' + m.onlineAmt.toFixed(2) + '</span>' +
        '<span style="color:#999">应缴</span><span style="text-align:right">¥' + m.dueCash.toFixed(2) + '</span>' +
        '<span style="color:#999">实缴</span><span style="text-align:right">¥' + m.actualCash.toFixed(2) + '</span>' +
      '</div>' +
      '<div style="margin-top:8px;padding:6px 10px;border-radius:6px;background:' + osBg + ';display:flex;justify-content:space-between;align-items:center;font-size:12px">' +
        '<span style="color:#666">长短款</span>' +
        '<span style="font-weight:600;color:' + osColor + '">' + (overShort >= 0 ? '+' : '') + overShort.toFixed(2) + '</span>' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = '<div style="display:flex;gap:12px;overflow-x:auto;padding:0 4px">' + html + '</div>';
}

function shRenderTable() {
  var records = shGetFilteredRecords();
  var total = records.length;
  var totalPages = Math.ceil(total / SH_PAGE_SIZE) || 1;
  if (SH_PAGE > totalPages) SH_PAGE = totalPages;
  var start = (SH_PAGE - 1) * SH_PAGE_SIZE;
  var page = records.slice(start, start + SH_PAGE_SIZE);
  var thead = document.getElementById('shTableHead');
  var tbody = document.getElementById('shTableBody');
  var pag = document.getElementById('shPagination');
  if (!thead || !tbody) return;
  thead.innerHTML = '<th>序号</th><th>日期</th><th>门店</th><th>人员</th>' +
    '<th>上岗时间</th><th>交班时间</th><th>在岗时长</th>' +
    '<th>备用金</th><th>现金收款</th><th>线上收款</th><th>收款合计</th>' +
    '<th>应缴现金</th><th>实缴金额</th><th>长短款</th>' +
    '<th>订单笔数</th><th>备注</th><th>类型</th><th>交班终端</th>';
  var html = '';
  if (page.length === 0) {
    html = '<tr><td colspan="18" style="text-align:center;color:#999;padding:40px">暂无交班记录</td></tr>';
  } else {
    for (var i = 0; i < page.length; i++) {
      var r = page[i];
      var typeStyle = r.type === '换班' ? 'background:#e8eaf6;color:#3949ab;border:1px solid #c5cae9' : 'background:#fff3e0;color:#e65100;border:1px solid #ffe0b2';
      html += '<tr>' +
        '<td>' + (start + i + 1) + '</td>' +
        '<td>' + _esc(r.date) + '</td>' +
        '<td>' + _esc(r.store) + '</td>' +
        '<td>' + _esc(r.staff) + '</td>' +
        '<td>' + _esc(r.startTime) + '</td>' +
        '<td>' + _esc(r.endTime) + '</td>' +
        '<td>' + _esc(r.duration) + '</td>' +
        '<td>¥' + r.pettyCash.toFixed(0) + '</td>' +
        '<td>¥' + r.cashAmount.toFixed(2) + '</td>' +
        '<td>¥' + r.onlineAmount.toFixed(2) + '</td>' +
        '<td style="font-weight:600;color:#005CF5">¥' + r.totalAmount.toFixed(2) + '</td>' +
        '<td>¥' + r.dueCash.toFixed(2) + '</td>' +
        '<td>¥' + r.actualCash.toFixed(2) + '</td>' +
        '<td style="font-weight:600;' + (r.overShort > 0 ? 'color:#2e7d32' : r.overShort < 0 ? 'color:#fc4b52' : 'color:#666') + '">' + (r.overShort >= 0 ? '+' : '') + r.overShort.toFixed(2) + '</td>' +
        '<td>' + r.orderCount + '笔</td>' +
        '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:default" data-tip="' + _esc(r.note || '') + '">' + _esc(r.note || '—') + '</td>' +
        '<td><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:500;' + typeStyle + '">' + _esc(r.type || '换班') + '</span></td>' +
        '<td>' + _esc(r.endTerminal) + '</td>' +
      '</tr>';
    }
  }
  tbody.innerHTML = html;
  var ph = '<span class="page-info">共 ' + total + ' 条</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="shGoPage(' + (SH_PAGE - 1) + ')" ' + (SH_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';
  // smart page numbers: show first 3, last 2, and current area
  var pageNums = [];
  for (var p = 1; p <= totalPages; p++) {
    if (p <= 3 || p > totalPages - 2 || Math.abs(p - SH_PAGE) <= 1) {
      if (pageNums.length > 0 && p - pageNums[pageNums.length - 1] > 1) pageNums.push('...');
      pageNums.push(p);
    }
  }
  for (var pi = 0; pi < pageNums.length; pi++) {
    var pg = pageNums[pi];
    if (pg === '...') {
      ph += '<span class="page-num" style="opacity:0.4">...</span>';
    } else {
      ph += '<button class="page-btn" style="' + (pg === SH_PAGE ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="shGoPage(' + pg + ')">' + pg + '</button>';
    }
  }
  ph += '<button class="page-btn" onclick="shGoPage(' + (SH_PAGE + 1) + ')" ' + (SH_PAGE >= totalPages ? 'disabled' : '') + '>›</button></div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
      SH_PAGE_SIZE + '条/页 跳至 <input type="number" id="shJumpInput" min="1" max="' + totalPages + '" value="' + SH_PAGE + '" ' +
      'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
      'onkeydown="if(event.key===\'Enter\')shGoPage(parseInt(this.value))"> 页' +
    '</div>';
  if (pag) pag.innerHTML = ph;
  shRenderCards();
}

function shGoPage(p) {
  var records = shGetFilteredRecords();
  var totalPages = Math.ceil(records.length / SH_PAGE_SIZE) || 1;
  SH_PAGE = Math.max(1, Math.min(p, totalPages));
  shRenderTable();
}

function shSearch() {
  var s1 = document.getElementById('shFilterStore'); if (s1) SH_FILTER_STORE = s1.value;
  var s2 = document.getElementById('shFilterStaff'); if (s2) SH_FILTER_STAFF = s2.value;
  SH_PAGE = 1; shRenderTable();
}

function shReset() {
  SH_FILTER_STORE = 'all'; SH_FILTER_DATE = 'today'; SH_FILTER_STAFF = 'all'; SH_PAGE = 1;
  var _s = document.getElementById('shFilterStore'); if (_s) _s.value = 'all';
  var _sf = document.getElementById('shFilterStaff'); if (_sf) _sf.value = 'all';
  var _tabs = document.querySelectorAll('#shFilterTabs .ic-ftab');
  _tabs.forEach(function(t) { t.classList.remove('active'); });
  var _today = document.querySelector('#shFilterTabs .ic-ftab:nth-child(2)');
  if (_today) _today.classList.add('active');
  shRenderTable();
}

function shSetDateFilter(val, el) {
  SH_FILTER_DATE = val; SH_PAGE = 1;
  var _tabs = document.querySelectorAll('#shFilterTabs .ic-ftab');
  _tabs.forEach(function(t) { t.classList.remove('active'); });
  if (el) el.classList.add('active');
  shRenderTable();
}

function shGenerateMock() {
  SH_MOCK_RECORDS = _generateSHMockRecords();
  try { localStorage.setItem('SH_MOCK_RECORDS', JSON.stringify(SH_MOCK_RECORDS)); } catch(e) {}
  SH_PAGE = 1;
  shRenderTable();
}

// ========== PAGE: 交班记录（电子秤终端） ==========================
var PSH_PAGE = 1;
var PSH_PAGE_SIZE = 15;
var PSH_FILTER_STORE = 'all';
var PSH_FILTER_DATE = 'today';

function pshGetFilteredRecords() {
  if (!SH_MOCK_RECORDS) return [];
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  return SH_MOCK_RECORDS.filter(function(r) {
    if (r.staff !== CURRENT_STAFF) return false;
    if (PSH_FILTER_DATE === 'today') {
      return r.date === todayStr;
    } else if (PSH_FILTER_DATE === 'yesterday') {
      var y = new Date(now.getTime() - 86400000);
      var ys = y.getFullYear() + '-' + String(y.getMonth()+1).padStart(2,'0') + '-' + String(y.getDate()).padStart(2,'0');
      return r.date === ys;
    } else if (PSH_FILTER_DATE === 'week') {
      var w = new Date(now.getTime() - 7*86400000);
      var ws = w.getFullYear() + '-' + String(w.getMonth()+1).padStart(2,'0') + '-' + String(w.getDate()).padStart(2,'0');
      return r.date >= ws;
    } else if (PSH_FILTER_DATE === 'month') {
      var m = new Date(now.getTime() - 30*86400000);
      var ms = m.getFullYear() + '-' + String(m.getMonth()+1).padStart(2,'0') + '-' + String(m.getDate()).padStart(2,'0');
      return r.date >= ms;
    }
    return true;
  }).filter(function(r) {
    if (PSH_FILTER_STORE !== 'all') return r.store === PSH_FILTER_STORE;
    return true;
  });
}

function pshRenderTable() {
  var records = pshGetFilteredRecords();
  var total = records.length;
  var totalPages = Math.ceil(total / PSH_PAGE_SIZE) || 1;
  if (PSH_PAGE > totalPages) PSH_PAGE = totalPages;
  var start = (PSH_PAGE - 1) * PSH_PAGE_SIZE;
  var page = records.slice(start, start + PSH_PAGE_SIZE);
  var thead = document.getElementById('pshTableHead');
  var tbody = document.getElementById('pshTableBody');
  var pag = document.getElementById('pshPagination');
  if (!thead || !tbody) return;
  thead.innerHTML = '<th>序号</th><th>日期</th><th>门店</th>' +
    '<th>上岗时间</th><th>交班时间</th><th>在岗时长</th>' +
    '<th>备用金</th><th>现金收款</th><th>线上收款</th><th>收款合计</th>' +
    '<th>应缴现金</th><th>实缴金额</th><th>长短款</th>' +
    '<th>订单笔数</th><th>备注</th><th>类型</th><th>交班终端</th>';
  var html = '';
  if (page.length === 0) {
    html = '<tr><td colspan="17" style="text-align:center;color:#999;padding:40px">暂无交班记录</td></tr>';
  } else {
    for (var i = 0; i < page.length; i++) {
      var r = page[i];
      var typeStyle = r.type === '换班' ? 'background:#e8eaf6;color:#3949ab;border:1px solid #c5cae9' : 'background:#fff3e0;color:#e65100;border:1px solid #ffe0b2';
      html += '<tr>' +
        '<td>' + (start + i + 1) + '</td>' +
        '<td>' + _esc(r.date) + '</td>' +
        '<td>' + _esc(r.store) + '</td>' +
        '<td>' + _esc(r.startTime) + '</td>' +
        '<td>' + _esc(r.endTime) + '</td>' +
        '<td>' + _esc(r.duration) + '</td>' +
        '<td>¥' + r.pettyCash.toFixed(0) + '</td>' +
        '<td>¥' + r.cashAmount.toFixed(2) + '</td>' +
        '<td>¥' + r.onlineAmount.toFixed(2) + '</td>' +
        '<td style="font-weight:600;color:#005CF5">¥' + r.totalAmount.toFixed(2) + '</td>' +
        '<td>¥' + r.dueCash.toFixed(2) + '</td>' +
        '<td>¥' + r.actualCash.toFixed(2) + '</td>' +
        '<td style="font-weight:600;' + (r.overShort > 0 ? 'color:#2e7d32' : r.overShort < 0 ? 'color:#fc4b52' : 'color:#666') + '">' + (r.overShort >= 0 ? '+' : '') + r.overShort.toFixed(2) + '</td>' +
        '<td>' + r.orderCount + '笔</td>' +
        '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:default" data-tip="' + _esc(r.note || '') + '">' + _esc(r.note || '—') + '</td>' +
        '<td><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:500;' + typeStyle + '">' + _esc(r.type || '换班') + '</span></td>' +
        '<td>' + _esc(r.endTerminal) + '</td>' +
      '</tr>';
    }
  }
  tbody.innerHTML = html;
  // Pagination
  var ph = '<span class="page-info">共 ' + total + ' 条交班记录</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="pshGoPage(' + (PSH_PAGE - 1) + ')" ' + (PSH_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';
  var totalPages2 = Math.ceil(total / PSH_PAGE_SIZE) || 1;
  var pageNums = [];
  for (var p = 1; p <= totalPages2; p++) {
    if (p <= 3 || p > totalPages2 - 2 || Math.abs(p - PSH_PAGE) <= 1) {
      if (pageNums.length > 0 && p - pageNums[pageNums.length - 1] > 1) pageNums.push('...');
      pageNums.push(p);
    }
  }
  for (var pi = 0; pi < pageNums.length; pi++) {
    var pg2 = pageNums[pi];
    if (pg2 === '...') {
      ph += '<span class="page-num" style="opacity:0.4">...</span>';
    } else {
      ph += '<button class="page-btn' + (pg2 === PSH_PAGE ? ' active' : '') + '" onclick="pshGoPage(' + pg2 + ')">' + pg2 + '</button>';
    }
  }
  ph += '<button class="page-btn" onclick="pshGoPage(' + (PSH_PAGE + 1) + ')" ' + (PSH_PAGE >= totalPages2 ? 'disabled' : '') + '>›</button></div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
      PSH_PAGE_SIZE + '条/页 跳至 <input type="number" id="pshJumpInput" min="1" max="' + totalPages2 + '" value="' + PSH_PAGE + '" ' +
      'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
      'onkeydown="if(event.key===\'Enter\')pshGoPage(parseInt(this.value))"> 页' +
    '</div>';
  if (pag) pag.innerHTML = ph;
  pshRenderCards();
}

function pshRenderCards() {
  var container = document.getElementById('pshSummaryCards');
  if (!container) return;
  var records = pshGetFilteredRecords();
  if (records.length === 0) { container.innerHTML = ''; return; }

  var m = { count: 0, totalAmt: 0, cashAmt: 0, onlineAmt: 0, dueCash: 0, actualCash: 0, orderCount: 0, totalMin: 0 };
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    m.count++;
    m.totalAmt += r.totalAmount;
    m.cashAmt += r.cashAmount;
    m.onlineAmt += r.onlineAmount;
    m.dueCash += r.dueCash;
    m.actualCash += r.actualCash;
    m.orderCount += r.orderCount;
    // 解析在岗时长
    var dur = r.duration || '';
    var hh = dur.match(/(\d+)小时/);
    var mm = dur.match(/(\d+)分/);
    m.totalMin += (hh ? parseInt(hh[1]) : 0) * 60 + (mm ? parseInt(mm[1]) : 0);
  }
  var durH = Math.floor(m.totalMin / 60);
  var durM = m.totalMin % 60;
  var durStr = durH + '小时' + (durM > 0 ? durM + '分' : '');

  var overShort = parseFloat((m.actualCash - m.dueCash).toFixed(2));
  var osColor = overShort > 0 ? '#2e7d32' : overShort < 0 ? '#fc4b52' : '#666';
  var osBg = overShort > 0 ? '#e8f5e9' : overShort < 0 ? '#ffebee' : '#f5f5f5';

  container.innerHTML =
    '<div style="display:flex;flex-wrap:wrap;gap:10px;padding:0 4px">' +
      // 班次
      '<div style="flex:1;min-width:100px;padding:14px 12px;background:#fff;border-radius:4px;border:1px solid #f0f0f0;text-align:center">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">交班次数</div>' +
        '<div style="font-size:24px;font-weight:800;color:#333">' + m.count + '</div>' +
      '</div>' +
      // 在岗时长
      '<div style="flex:1;min-width:100px;padding:14px 12px;background:#fff;border-radius:4px;border:1px solid #f0f0f0;text-align:center">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">在岗时长</div>' +
        '<div style="font-size:20px;font-weight:800;color:#6a1b9a">' + durStr + '</div>' +
      '</div>' +
      // 收款合计
      '<div style="flex:1;min-width:120px;padding:14px 12px;background:#fff;border-radius:4px;border:1px solid #f0f0f0;text-align:center">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">收款合计</div>' +
        '<div style="font-size:18px;font-weight:800;color:#005CF5">¥' + m.totalAmt.toFixed(2) + '</div>' +
      '</div>' +
      // 现金
      '<div style="flex:1;min-width:100px;padding:14px 12px;background:#fff;border-radius:4px;border:1px solid #f0f0f0;text-align:center">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">现金收款</div>' +
        '<div style="font-size:16px;font-weight:700;color:#fc4b52">¥' + m.cashAmt.toFixed(2) + '</div>' +
      '</div>' +
      // 线上
      '<div style="flex:1;min-width:100px;padding:14px 12px;background:#fff;border-radius:4px;border:1px solid #f0f0f0;text-align:center">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">线上收款</div>' +
        '<div style="font-size:16px;font-weight:700;color:#1565C0">¥' + m.onlineAmt.toFixed(2) + '</div>' +
      '</div>' +
      // 应缴
      '<div style="flex:1;min-width:100px;padding:14px 12px;background:#fff;border-radius:4px;border:1px solid #f0f0f0;text-align:center">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">应缴现金</div>' +
        '<div style="font-size:16px;font-weight:700;color:#ff8f00">¥' + m.dueCash.toFixed(2) + '</div>' +
      '</div>' +
      // 实缴
      '<div style="flex:1;min-width:100px;padding:14px 12px;background:#fff;border-radius:4px;border:1px solid #f0f0f0;text-align:center">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">实缴金额</div>' +
        '<div style="font-size:16px;font-weight:700;color:#333">¥' + m.actualCash.toFixed(2) + '</div>' +
      '</div>' +
      // 长短款
      '<div style="flex:1;min-width:110px;padding:14px 12px;border-radius:4px;text-align:center;background:' + osBg + ';border:1px solid ' + (overShort > 0 ? '#c8e6c9' : overShort < 0 ? '#ffcdd2' : '#f0f0f0') + '">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px">长短款</div>' +
        '<div style="font-size:18px;font-weight:800;color:' + osColor + '">' + (overShort >= 0 ? '+' : '') + overShort.toFixed(2) + '</div>' +
      '</div>' +
    '</div>';
}

function pshGoPage(p) {
  var records = pshGetFilteredRecords();
  var totalPages = Math.ceil(records.length / PSH_PAGE_SIZE) || 1;
  PSH_PAGE = Math.max(1, Math.min(p, totalPages));
  pshRenderTable();
}

function pshSearch() {
  var s = document.getElementById('pshFilterStore'); if (s) PSH_FILTER_STORE = s.value;
  PSH_PAGE = 1; pshRenderTable();
}

function pshReset() {
  PSH_FILTER_STORE = 'all'; PSH_FILTER_DATE = 'today'; PSH_PAGE = 1;
  var _s = document.getElementById('pshFilterStore'); if (_s) _s.value = 'all';
  var _tabs = document.querySelectorAll('#pshFilterTabs .ic-ftab');
  _tabs.forEach(function(t) { t.classList.remove('active'); });
  var _today = document.querySelector('#pshFilterTabs .ic-ftab:nth-child(2)');
  if (_today) _today.classList.add('active');
  pshRenderTable();
}

function pshSetDateFilter(val, el) {
  PSH_FILTER_DATE = val; PSH_PAGE = 1;
  var _tabs = document.querySelectorAll('#pshFilterTabs .ic-ftab');
  _tabs.forEach(function(t) { t.classList.remove('active'); });
  if (el) el.classList.add('active');
  pshRenderTable();
}

// ===== 交班记录（电子秤终端） =====
function initPersonalShift() {
  var el = document.getElementById('personalShiftContent');
  if (!el) return;
  if (!SH_MOCK_RECORDS) {
    SH_MOCK_RECORDS = _generateSHMockRecords();
    try { localStorage.setItem('SH_MOCK_RECORDS', JSON.stringify(SH_MOCK_RECORDS)); } catch(e) {}
  }
  el.innerHTML =
    '<div style="flex-shrink:0;margin:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<select id="pshFilterStore" style="padding:7px 12px;border:1px solid #e0e0e0;border-radius:4px;font-size:12px;background:#fff;outline:none;height:32px" onchange="pshSearch()">' +
        '<option value="all">全部门店</option>' +
        SH_STORES.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
      '</select>' +
      '<div class="ic-filter-tabs" id="pshFilterTabs">' +
        '<span class="ic-ftab' + (PSH_FILTER_DATE === 'all' ? ' active' : '') + '" onclick="pshSetDateFilter(\'all\',this)">全部</span>' +
        '<span class="ic-ftab' + (PSH_FILTER_DATE === 'today' ? ' active' : '') + '" onclick="pshSetDateFilter(\'today\',this)">今天</span>' +
        '<span class="ic-ftab' + (PSH_FILTER_DATE === 'yesterday' ? ' active' : '') + '" onclick="pshSetDateFilter(\'yesterday\',this)">昨天</span>' +
        '<span class="ic-ftab' + (PSH_FILTER_DATE === 'week' ? ' active' : '') + '" onclick="pshSetDateFilter(\'week\',this)">近7天</span>' +
        '<span class="ic-ftab' + (PSH_FILTER_DATE === 'month' ? ' active' : '') + '" onclick="pshSetDateFilter(\'month\',this)">近30天</span>' +
      '</div>' +
      '<button class="ic-btn" onclick="pshReset()">重置</button>' +
      '<button class="ic-btn" style="background:#005CF5;color:#fff;border-color:#005CF5;font-weight:600" onclick="pshSearch()">查询</button>' +
      '<div style="flex:1"></div>' +
      '<button class="ic-btn" style="background:#5c6bc0;color:#fff;border-color:#5c6bc0" onclick="openShiftSimModal(CURRENT_STAFF)">交班</button>' +
    '</div>' +
    // 个人总览卡片
    '<div id="pshSummaryCards" style="flex-shrink:0;margin:10px 12px 0"></div>' +
    '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
    '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
        '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
          '<table><thead id="pshTableHead"></thead><tbody id="pshTableBody"></tbody></table>' +
        '</div>' +
        '<div class="pagination-bar" id="pshPagination" style="flex-shrink:0"></div>' +
      '</div>' +
    '</div>';
  pshRenderTable();
}

// ========== PAGE: 营业日报 (Daily Report) ==========================
var DR_STORES = ['上海卢东生鲜超市中心店', '上海卢东生鲜超市徐汇店', '上海卢东生鲜超市浦东店', '上海卢东生鲜超市闵行店', '上海卢东生鲜超市宝山店'];
var DR_MOCK_RECORDS = (function() {
  var cached = localStorage.getItem('DR_MOCK_RECORDS');
  if (cached) { try { var p = JSON.parse(cached); if (Array.isArray(p) && p.length > 0 && p[0]._v === 2) return p; } catch(e) {} }
  return null;
})();
var DR_STAFF = ['张伟', '李娜', '王强', '陈芳', '赵明', '刘洋', '孙悦', '周杰'];
var DR_PAGE = 1;
var DR_PAGE_SIZE = 10;
var DR_FILTER_STORE = 'all';
var DR_FILTER_DATE = 'week'; // all/today/yesterday/week/month
var DR_FILTER_STAFF = 'all';

function _generateDRMockRecords() {
  var records = [];
  var now = new Date();
  var storeCount = DR_STORES.length;
  for (var d = 0; d < 30; d++) {
    var ts = new Date(now.getTime() - d * 24 * 3600000);
    var dateStr = ts.getFullYear() + '-' + (ts.getMonth()+1).toString().padStart(2,'0') + '-' + ts.getDate().toString().padStart(2,'0');
    for (var s = 0; s < storeCount; s++) {
      // Each store generates 1 record per day (matches the "共2条" with filter)
      var gmv = parseFloat((500 + Math.random() * 50000).toFixed(2));
      var couponPct = 0.02 + Math.random() * 0.12;
      var couponAmt = parseFloat((gmv * couponPct).toFixed(2));
      var revenue = parseFloat((gmv - couponAmt).toFixed(2));
      var todayRefund = Math.random() < 0.05 ? parseFloat((Math.random() * 100).toFixed(2)) : null;
      var prevRefund = Math.random() < 0.03 ? parseFloat((Math.random() * 50).toFixed(2)) : null;
      var totalDeduct = (todayRefund || 0) + (prevRefund || 0);
      var netReceived = parseFloat((revenue - totalDeduct).toFixed(2));
      // Payment breakdown: mostly cash, sometimes split
      var hasWechat = Math.random() < 0.1;
      var hasAlipay = Math.random() < 0.1;
      var hasBank = Math.random() < 0.05;
      var cashAmt, wechatAmt, alipayAmt, bankAmt;
      if (hasWechat || hasAlipay || hasBank) {
        cashAmt = parseFloat((netReceived * (0.3 + Math.random() * 0.4)).toFixed(2));
        var remaining = parseFloat((netReceived - cashAmt).toFixed(2));
        if (hasWechat && hasAlipay) {
          wechatAmt = parseFloat((remaining * 0.5).toFixed(2));
          alipayAmt = parseFloat((remaining - wechatAmt).toFixed(2));
          bankAmt = null;
        } else if (hasWechat) {
          wechatAmt = remaining;
          alipayAmt = null;
          bankAmt = null;
        } else if (hasAlipay) {
          alipayAmt = remaining;
          wechatAmt = null;
          bankAmt = null;
        } else {
          wechatAmt = null;
          alipayAmt = null;
          bankAmt = netReceived;
          cashAmt = null;
        }
      } else {
        cashAmt = netReceived;
        wechatAmt = null;
        alipayAmt = null;
        bankAmt = null;
      }
      records.push({
        _v: 2, date: dateStr, store: DR_STORES[s],
        staff: DR_STAFF[Math.floor(Math.random() * DR_STAFF.length)],
        gmv: gmv, couponAmt: couponAmt, todayRefund: todayRefund,
        revenue: revenue, prevRefund: prevRefund, netReceived: netReceived,
        cashAmt: cashAmt, wechatAmt: wechatAmt, alipayAmt: alipayAmt, bankAmt: bankAmt
      });
    }
  }
  return records;
}

function _drFmt(v) { return v != null ? v.toFixed(2) : '--'; }

function drGetFilteredRecords() {
  var records = DR_MOCK_RECORDS || [];
  // date filter
  if (DR_FILTER_DATE !== 'all') {
    var now = new Date();
    var todayStr = now.getFullYear() + '-' + (now.getMonth()+1).toString().padStart(2,'0') + '-' + now.getDate().toString().padStart(2,'0');
    if (DR_FILTER_DATE === 'today') {
      records = records.filter(function(r) { return r.date === todayStr; });
    } else if (DR_FILTER_DATE === 'yesterday') {
      var y = new Date(now.getTime() - 86400000);
      var yStr = y.getFullYear() + '-' + (y.getMonth()+1).toString().padStart(2,'0') + '-' + y.getDate().toString().padStart(2,'0');
      records = records.filter(function(r) { return r.date === yStr; });
    } else if (DR_FILTER_DATE === 'week') {
      var cutoff7 = new Date(now.getTime() - 7 * 86400000);
      var c7 = cutoff7.getFullYear() + '-' + (cutoff7.getMonth()+1).toString().padStart(2,'0') + '-' + cutoff7.getDate().toString().padStart(2,'0');
      records = records.filter(function(r) { return r.date >= c7; });
    } else if (DR_FILTER_DATE === 'month') {
      var cutoff30 = new Date(now.getTime() - 30 * 86400000);
      var c30 = cutoff30.getFullYear() + '-' + (cutoff30.getMonth()+1).toString().padStart(2,'0') + '-' + cutoff30.getDate().toString().padStart(2,'0');
      records = records.filter(function(r) { return r.date >= c30; });
    }
  }
  if (DR_FILTER_STORE !== 'all') {
    records = records.filter(function(r) { return r.store === DR_FILTER_STORE; });
  }
  if (DR_FILTER_STAFF !== 'all') {
    records = records.filter(function(r) { return r.staff === DR_FILTER_STAFF; });
  }
  records.sort(function(a, b) {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.store.localeCompare(a.store);
  });
  return records;
}

function drSearch() {
  var storeEl = document.getElementById('drFilterStore');
  if (storeEl) DR_FILTER_STORE = storeEl.value;
  var staffEl = document.getElementById('drFilterStaff');
  if (staffEl) DR_FILTER_STAFF = staffEl.value;
  DR_PAGE = 1;
  drRenderTable();
}

function drReset() {
  DR_FILTER_STORE = 'all';
  DR_FILTER_DATE = 'week';
  DR_FILTER_STAFF = 'all';
  DR_PAGE = 1;
  var storeEl = document.getElementById('drFilterStore');
  if (storeEl) storeEl.value = 'all';
  var staffEl = document.getElementById('drFilterStaff');
  if (staffEl) staffEl.value = 'all';
  plSyncDateTabs('drFilterTabs', 'week', null);
  drRenderTable();
}

function drSetDateFilter(val, el) {
  DR_FILTER_DATE = val;
  DR_PAGE = 1;
  plSyncDateTabs('drFilterTabs', val, el);
  drRenderTable();
}

function drGoPage(p) {
  var records = drGetFilteredRecords();
  var totalPages = Math.ceil(records.length / DR_PAGE_SIZE) || 1;
  if (p < 1 || p > totalPages) return;
  DR_PAGE = p;
  drRenderTable();
}

function drRenderTable() {
  var records = drGetFilteredRecords();
  var total = records.length;
  var totalPages = Math.ceil(total / DR_PAGE_SIZE) || 1;
  var startIdx = (DR_PAGE - 1) * DR_PAGE_SIZE;
  var pageRecords = records.slice(startIdx, startIdx + DR_PAGE_SIZE);

  // Table header
  var thead = document.getElementById('drTableHead');
  if (thead) {
    thead.innerHTML = '<colgroup>' +
      '<col style="width:44px"><col style="width:92px">' +
      '<col style="width:96px"><col style="width:96px"><col style="width:96px">' +
      '<col style="width:90px"><col style="width:96px"><col style="width:90px">' +
      '<col style="width:90px"><col style="width:96px"><col style="width:96px"><col style="width:96px">' +
      '</colgroup>' +
      '<th>序号</th><th>日期</th><th>交易额(GMV)</th>' +
      '<th>优惠券金额(元)</th><th>今日订单退款(元)</th><th>营业额</th>' +
      '<th>往日订单退款(元)</th><th>实收(元)</th><th>现金收款(元)</th>' +
      '<th>微信收款(元)</th><th>支付宝收款(元)</th><th>银行卡收款(元)</th>';
  }

  // Table body
  var tbody = document.getElementById('drTableBody');
  if (!tbody) return;

  if (pageRecords.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:#999;padding:40px">暂无营业日报数据</td></tr>';
    var _tf = document.getElementById('drTableFoot'); if (_tf) _tf.innerHTML = '';
    var _tw = document.getElementById('drTotalsWrap'); if (_tw) _tw.style.display = 'none';
  } else {
    var html = '';
    // compute totals
    var totals = { gmv: 0, couponAmt: 0, todayRefund: 0, revenue: 0, prevRefund: 0, netReceived: 0, cashAmt: 0, wechatAmt: 0, alipayAmt: 0, bankAmt: 0 };
    for (var i = 0; i < pageRecords.length; i++) {
      var r = pageRecords[i];
      var seq = startIdx + i + 1;
      html += '<tr>' +
        '<td>' + seq + '</td>' +
        '<td>' + r.date + '</td>' +
        '<td>' + _drFmt(r.gmv) + '</td>' +
        '<td>' + _drFmt(r.couponAmt) + '</td>' +
        '<td>' + _drFmt(r.todayRefund) + '</td>' +
        '<td>' + _drFmt(r.revenue) + '</td>' +
        '<td>' + _drFmt(r.prevRefund) + '</td>' +
        '<td>' + _drFmt(r.netReceived) + '</td>' +
        '<td>' + _drFmt(r.cashAmt) + '</td>' +
        '<td>' + _drFmt(r.wechatAmt) + '</td>' +
        '<td>' + _drFmt(r.alipayAmt) + '</td>' +
        '<td>' + _drFmt(r.bankAmt) + '</td>' +
        '</tr>';
      // accumulate totals
      totals.gmv += r.gmv;
      totals.couponAmt += r.couponAmt;
      if (r.todayRefund != null) totals.todayRefund += r.todayRefund;
      totals.revenue += r.revenue;
      if (r.prevRefund != null) totals.prevRefund += r.prevRefund;
      totals.netReceived += r.netReceived;
      if (r.cashAmt != null) totals.cashAmt += r.cashAmt;
      if (r.wechatAmt != null) totals.wechatAmt += r.wechatAmt;
      if (r.alipayAmt != null) totals.alipayAmt += r.alipayAmt;
      if (r.bankAmt != null) totals.bankAmt += r.bankAmt;
    }
    // 合计 row — rendered into tfoot, fixed at bottom below scroll area
    var tfoot = document.getElementById('drTableFoot');
    if (tfoot) {
      tfoot.innerHTML = '<colgroup>' +
        '<col style="width:44px"><col style="width:92px">' +
        '<col style="width:96px"><col style="width:96px"><col style="width:96px">' +
        '<col style="width:90px"><col style="width:96px"><col style="width:90px">' +
        '<col style="width:90px"><col style="width:96px"><col style="width:96px"><col style="width:96px">' +
        '</colgroup>' +
        '<tr style="font-weight:600">' +
        '<td colspan="2">合计</td>' +
        '<td>' + totals.gmv.toFixed(2) + '</td>' +
        '<td>' + totals.couponAmt.toFixed(2) + '</td>' +
        '<td>' + (totals.todayRefund > 0 ? totals.todayRefund.toFixed(2) : '--') + '</td>' +
        '<td>' + totals.revenue.toFixed(2) + '</td>' +
        '<td>' + (totals.prevRefund > 0 ? totals.prevRefund.toFixed(2) : '--') + '</td>' +
        '<td>' + totals.netReceived.toFixed(2) + '</td>' +
        '<td>' + (totals.cashAmt > 0 ? totals.cashAmt.toFixed(2) : '--') + '</td>' +
        '<td>' + (totals.wechatAmt > 0 ? totals.wechatAmt.toFixed(2) : '--') + '</td>' +
        '<td>' + (totals.alipayAmt > 0 ? totals.alipayAmt.toFixed(2) : '--') + '</td>' +
        '<td>' + (totals.bankAmt > 0 ? totals.bankAmt.toFixed(2) : '--') + '</td>' +
        '</tr>';
    }
    tbody.innerHTML = html;
    var _tw = document.getElementById('drTotalsWrap'); if (_tw) _tw.style.display = '';
  }

  // Pagination
  var pag = document.getElementById('drPagination');
  if (pag) {
    var ph = '<span class="page-info">共 ' + total + ' 条</span>' +
      '<div class="page-btns">' +
        '<button class="page-btn" onclick="drGoPage(' + (DR_PAGE - 1) + ')" ' + (DR_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';
    var pageNums = [];
    for (var p = 1; p <= totalPages; p++) {
      if (p <= 3 || p > totalPages - 2 || Math.abs(p - DR_PAGE) <= 1) {
        if (pageNums.length > 0 && p - pageNums[pageNums.length - 1] > 1) pageNums.push('...');
        pageNums.push(p);
      }
    }
    for (var pi = 0; pi < pageNums.length; pi++) {
      var pg = pageNums[pi];
      if (pg === '...') {
        ph += '<span class="page-num" style="opacity:0.4">...</span>';
      } else {
        ph += '<button class="page-btn" style="' + (pg === DR_PAGE ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="drGoPage(' + pg + ')\">' + pg + '</button>';
      }
    }
    ph += '<button class="page-btn" onclick="drGoPage(' + (DR_PAGE + 1) + ')" ' + (DR_PAGE >= totalPages ? 'disabled' : '') + '>›</button></div>' +
      '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
        DR_PAGE_SIZE + '条/页 跳至 <input type="number" id="drJumpInput" min="1" max="' + totalPages + '" value="' + DR_PAGE + '" ' +
        'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
        "onkeydown=\"if(event.key===\\'Enter\\')drGoPage(parseInt(this.value))\"> 页" +
      '</div>';
    pag.innerHTML = ph;
  }
}

function drGenerateMock() {
  DR_MOCK_RECORDS = _generateDRMockRecords();
  try { localStorage.setItem('DR_MOCK_RECORDS', JSON.stringify(DR_MOCK_RECORDS)); } catch(e) {}
  DR_PAGE = 1;
  drRenderTable();
}

function initDailyReport() {
  var el = document.getElementById('dailyReportContent');
  if (!el) return;
  if (!DR_MOCK_RECORDS) {
    DR_MOCK_RECORDS = _generateDRMockRecords();
    try { localStorage.setItem('DR_MOCK_RECORDS', JSON.stringify(DR_MOCK_RECORDS)); } catch(e) {}
  }
  el.innerHTML =
    '<div style="flex-shrink:0;margin:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<select id="drFilterStore" style="padding:7px 12px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;background:#fff;outline:none" onchange="drSearch()">' +
        '<option value="all">全部门店</option>' +
        DR_STORES.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
      '</select>' +
      '<select id="drFilterStaff" style="padding:7px 12px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;background:#fff;outline:none" onchange="drSearch()">' +
        '<option value="all">全部人员</option>' +
        DR_STAFF.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
      '</select>' +
      '<div class="ic-filter-tabs" id="drFilterTabs">' +
        '<span class="ic-ftab' + (DR_FILTER_DATE === 'all' ? ' active' : '') + '" onclick="drSetDateFilter(\'all\',this)">全部</span>' +
        '<span class="ic-ftab' + (DR_FILTER_DATE === 'today' ? ' active' : '') + '" onclick="drSetDateFilter(\'today\',this)">今天</span>' +
        '<span class="ic-ftab' + (DR_FILTER_DATE === 'yesterday' ? ' active' : '') + '" onclick="drSetDateFilter(\'yesterday\',this)">昨天</span>' +
        '<span class="ic-ftab' + (DR_FILTER_DATE === 'week' ? ' active' : '') + '" onclick="drSetDateFilter(\'week\',this)">近7天</span>' +
        '<span class="ic-ftab' + (DR_FILTER_DATE === 'month' ? ' active' : '') + '" onclick="drSetDateFilter(\'month\',this)">近30天</span>' +
      '</div>' +
      '<button class="ic-btn" onclick="drReset()">重置</button>' +
      '<button class="ic-btn" style="background:#005CF5;color:#fff;border-color:#005CF5;font-weight:600" onclick="drSearch()">查询</button>' +
      '<div style="flex:1"></div>' +
      '<button class="ic-btn" style="background:#5c6bc0;color:#fff;border-color:#5c6bc0" onclick="drGenerateMock()">模拟数据</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
      '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
        '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
          '<table style="width:100%;table-layout:fixed"><thead id="drTableHead"></thead><tbody id="drTableBody"></tbody></table>' +
        '</div>' +
        '<div id="drTotalsWrap" style="flex-shrink:0;background:#fafbfc;border-top:2px solid #e8e8e8;box-shadow:0 -2px 6px rgba(0,0,0,0.06);overflow:hidden">' +
          '<table style="width:100%;table-layout:fixed"><tfoot id="drTableFoot"></tfoot></table>' +
        '</div>' +
        '<div class="pagination-bar" id="drPagination" style="flex-shrink:0"></div>' +
      '</div>' +
    '</div>';
  drRenderTable();
}

function initShiftHandover() {
  var el = document.getElementById('shiftHandoverContent');
  if (!el) return;
  if (!SH_MOCK_RECORDS) {
    SH_MOCK_RECORDS = _generateSHMockRecords();
    try { localStorage.setItem('SH_MOCK_RECORDS', JSON.stringify(SH_MOCK_RECORDS)); } catch(e) {}
  }
  el.innerHTML =
    '<div style="flex-shrink:0;margin:0;padding:14px 24px;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<select id="shFilterStore" style="padding:7px 12px;border:1px solid #e0e0e0;border-radius:4px;font-size:12px;background:#fff;outline:none;height:32px" onchange="shSearch()">' +
        '<option value="all">全部门店</option>' +
        SH_STORES.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
      '</select>' +
      '<div class="ic-filter-tabs" id="shFilterTabs">' +
        '<span class="ic-ftab' + (SH_FILTER_DATE === 'all' ? ' active' : '') + '" onclick="shSetDateFilter(\'all\',this)">全部</span>' +
        '<span class="ic-ftab' + (SH_FILTER_DATE === 'today' ? ' active' : '') + '" onclick="shSetDateFilter(\'today\',this)">今天</span>' +
        '<span class="ic-ftab' + (SH_FILTER_DATE === 'yesterday' ? ' active' : '') + '" onclick="shSetDateFilter(\'yesterday\',this)">昨天</span>' +
        '<span class="ic-ftab' + (SH_FILTER_DATE === 'week' ? ' active' : '') + '" onclick="shSetDateFilter(\'week\',this)">近7天</span>' +
        '<span class="ic-ftab' + (SH_FILTER_DATE === 'month' ? ' active' : '') + '" onclick="shSetDateFilter(\'month\',this)">近30天</span>' +
      '</div>' +
      '<select id="shFilterStaff" style="padding:7px 12px;border:1px solid #e0e0e0;border-radius:4px;font-size:12px;background:#fff;outline:none;height:32px" onchange="shSearch()">' +
        '<option value="all">全部人员</option>' +
        SH_STAFF.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
      '</select>' +
      '<button class="ic-btn" onclick="shReset()">重置</button>' +
      '<button class="ic-btn" style="background:#005CF5;color:#fff;border-color:#005CF5;font-weight:600" onclick="shSearch()">查询</button>' +
      '<div style="flex:1"></div>' +
      '<button class="ic-btn" style="background:#5c6bc0;color:#fff;border-color:#5c6bc0" onclick="openShiftSimModal(SH_FILTER_STAFF !== \'all\' ? SH_FILTER_STAFF : CURRENT_STAFF)">模拟交班</button>' +
    '</div>' +
    // 人员总览卡片
    '<div id="shSummaryCards" style="flex-shrink:0;margin:10px 12px 0"></div>' +
    '<div style="flex:1;min-height:0;margin:10px 8px 8px;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
    '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
        '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
          '<table><thead id="shTableHead"></thead><tbody id="shTableBody"></tbody></table>' +
        '</div>' +
        '<div class="pagination-bar" id="shPagination" style="flex-shrink:0"></div>' +
      '</div>' +
    '</div>';
  shRenderTable();
}


function _renderSelectionBar() {
  if (!LABEL_EXPORT_MODE) return '';
  var selCount = Object.keys(LABEL_SELECTED_IDS).length;
  var builtinIds = ['tpl-01','tpl-02','tpl-03','tpl-04','tpl-05'];
  var allCount = LABEL_TEMPLATES.filter(function(t){ return builtinIds.indexOf(t.id) === -1; }).length;
  var isAll = selCount >= allCount;
  return '<div class="lp-selection-bar" id="lpSelectionBar">'+
    '<div class="lp-sel-info">'+
      '<span class="lp-sel-count">已选择 <strong>'+selCount+'</strong> / '+allCount+' 个模板</span>'+
    '</div>'+
    '<div class="lp-sel-actions">'+
      '<button class="lp-btn-ghost" onclick="_toggleSelectAll()" style="font-size:12px">'+(isAll?'取消全选':'全选')+'</button>'+
      '<button class="lp-btn-new" onclick="exportSelectedTemplates()" '+(selCount===0?'disabled style="opacity:0.5;cursor:not-allowed"':'')+' style="font-size:12px">📤 导出所选</button>'+
      '<button class="lp-btn-ghost" onclick="_exitExportMode()" style="font-size:12px">取消</button>'+
    '</div>'+
  '</div>';
}

function _toggleSelectAll() {
  var builtinIds = ['tpl-01','tpl-02','tpl-03','tpl-04','tpl-05'];
  var allCount = LABEL_TEMPLATES.filter(function(t){ return builtinIds.indexOf(t.id) === -1; }).length;
  var selCount = Object.keys(LABEL_SELECTED_IDS).length;
  if (selCount >= allCount) {
    LABEL_SELECTED_IDS = {};
  } else {
    LABEL_TEMPLATES.forEach(function(t){
      if (builtinIds.indexOf(t.id) === -1) LABEL_SELECTED_IDS[t.id] = true;
    });
  }
  _refreshSelectionUI();
}

function _selectAllTemplates() {
  var builtinIds = ['tpl-01','tpl-02','tpl-03','tpl-04','tpl-05'];
  LABEL_TEMPLATES.forEach(function(t){ 
    if (builtinIds.indexOf(t.id) === -1) LABEL_SELECTED_IDS[t.id] = true; 
  });
  _refreshSelectionUI();
}

function _clearCardSelection() {
  LABEL_SELECTED_IDS = {};
  _refreshSelectionUI();
}

function _refreshSelectionUI() {
  // Update selection bar
  var bar = document.getElementById('lpSelectionBar');
  if (bar) bar.outerHTML = _renderSelectionBar();
  // Update card checkboxes
  document.querySelectorAll('.label-card').forEach(function(card) {
    var tplId = card.id.replace('lc-','');
    if (LABEL_SELECTED_IDS[tplId]) {
      card.classList.add('selected');
      var chk = card.querySelector('.card-check');
      if (chk) { chk.classList.add('checked'); chk.textContent = '✓'; }
    } else {
      card.classList.remove('selected');
      var chk = card.querySelector('.card-check');
      if (chk) { chk.classList.remove('checked'); chk.textContent = ''; }
    }
  });
}

function _renderExportButton(displayTemplates) {
  return '<button class="lp-btn-ghost" onclick="_enterExportMode()">📤 导出</button>';
}

function toggleCardSelect(tplId) {
  if (LABEL_SELECTED_IDS[tplId]) {
    delete LABEL_SELECTED_IDS[tplId];
  } else {
    LABEL_SELECTED_IDS[tplId] = true;
  }
  _refreshSelectionUI();
}

function _enterExportMode() {
  LABEL_EXPORT_MODE = true;
  LABEL_SELECTED_IDS = {};
  var wrapper = document.getElementById('labelPrintContent');
  if (wrapper) wrapper.classList.add('label-export-mode');
  initLabelPrint();
}

function _exitExportMode() {
  LABEL_EXPORT_MODE = false;
  LABEL_SELECTED_IDS = {};
  var wrapper = document.getElementById('labelPrintContent');
  if (wrapper) wrapper.classList.remove('label-export-mode');
  // Clear selected styles
  document.querySelectorAll('.label-card.selected').forEach(function(c){ c.classList.remove('selected'); });
  document.querySelectorAll('.card-check.checked').forEach(function(c){ c.classList.remove('checked'); c.textContent = ''; });
  initLabelPrint();
}

function exportSelectedTemplates() {
  var ids = Object.keys(LABEL_SELECTED_IDS);
  if (ids.length === 0) return;
  var selected = LABEL_TEMPLATES.filter(function(t){ return LABEL_SELECTED_IDS[t.id]; });
  var data = {version: 1, templates: selected};
  var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = selected.length === 1
    ? 'label-template-'+selected[0].name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g,'_')+'.json'
    : 'label-templates-selected-'+selected.length+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  _exitExportMode();
}

function _clearCardSelection() {
  LABEL_SELECTED_IDS = {};
  initLabelPrint();
}

// ---- Editor ----
function openLabelEditor(tplId) {
  var tpl = LABEL_TEMPLATES.find(function(t){return t.id===tplId;});
  if (!tpl) return;
  LABEL_EDITING = JSON.parse(JSON.stringify(tpl));
  LABEL_SEL_ELEM = null;
  _renderLabelEditor();
  _showEditor();
  _refreshCanvas(); // re-calc after dialog is visible
}
function _showEditor() {
  document.getElementById('lpOverlay').classList.add('show');
  document.getElementById('lpEditor').classList.add('show');
}
function closeLabelEditor() {
  document.getElementById('lpOverlay').classList.remove('show');
  document.getElementById('lpEditor').classList.remove('show');
  LABEL_EDITING = null; LABEL_SEL_ELEM = null; LABEL_DRAG = null;
  _canvasPanBound = false;  // allow re-binding on next open
}

function _renderLabelEditor() {
  var t = LABEL_EDITING, sz = t.size;
  var el = document.getElementById('lpEditor');
  if (!el) return;
  var bgSwatches = ['#ffffff','#fff8e1','#fce4ec','#e8f5e9','#f1f8e9','#f3e5f5','#e3f2fd','#fff3e0'];
  var bgOpts = bgSwatches.map(function(bc){return '<span data-color="'+bc+'" style="background:'+bc+'" class="lp-color-pick-swatch'+(t.bg===bc?' sel':'')+'" onclick="_setLabelBg(\''+bc+'\')"></span>';}).join('');

  var builtinIds = ['tpl-01','tpl-02','tpl-03','tpl-04','tpl-05'];
  var isBuiltin = builtinIds.indexOf(t.id)>=0;

  el.innerHTML =
    // ---- LEFT: style + element list ----
    '<div class="lp-editor-left">'+
      // Style section
      '<div class="lp-style-section">'+
        '<div class="lp-section-label">价签样式</div>'+
        // Name
        '<div class="lp-prop-row" style="margin-bottom:20px">'+
          '<label>名称</label>'+
          '<input type="text" id="lpStyleName" value="'+_esc(t.name)+'" oninput="LABEL_EDITING.name=this.value" style="flex:1">'+
        '</div>'+
        // Description
        '<div class="lp-prop-row" style="margin-bottom:20px">'+
          '<label>描述</label>'+
          '<input type="text" id="lpStyleDesc" value="'+_esc(t.desc||'')+'" oninput="LABEL_EDITING.desc=this.value" style="flex:1" placeholder="简短描述此价签用途">'+
        '</div>'+
        // Size
        '<div class="lp-size-row" style="margin-bottom:20px">'+
          '<label>尺寸</label>'+
          '<input type="number" id="lpSizeW" value="'+sz.w+'" min="20" max="120" onchange="_onSizeChange()">'+
          '<span class="lp-unit">×</span>'+
          '<input type="number" id="lpSizeH" value="'+sz.h+'" min="20" max="120" onchange="_onSizeChange()">'+
          '<span class="lp-unit">mm</span>'+
        '</div>'+
        // Background color + image (compact single row)
        '<div class="lp-bg-row">'+
          '<span class="lp-row-label">背景</span>'+
          '<div class="lp-color-pick">'+(bgOpts||'')+'</div>'+
          '<div class="lp-bg-img-inline">'+
            (t.bgImage ?
              '<img src="'+t.bgImage+'" alt="背景">'+
              '<button onclick="_removeBgImage()">移除</button>'+
              '<label class="lp-bg-toggle"><input type="checkbox" id="lpPrintBg"'+(t.printBg!==false?' checked':'')+' onchange="_togglePrintBg()">打印</label>' :
              '<label class="lp-bg-img-upload">＋<input type="file" accept="image/*" onchange="_handleBgImageUpload(event)" style="display:none"></label>'
            )+
          '</div>'+
        '</div>'+
      '</div>'+
      // Element list section
      '<div class="lp-elem-list-section">'+
        '<div class="lp-section-label">元素列表 <span style="font-weight:400;color:var(--text-muted)">('+t.elements.length+'项)</span></div>'+
        '<div class="lp-elem-list-scroll"><div class="lp-elem-list" id="lpElemList">'+_renderElemList(t)+'</div></div>'+
        '<div class="lp-add-elem-wrap">'+
          '<button class="lp-add-elem-btn" onclick="_toggleAddMenu()">+ 添加元素</button>'+
          '<div class="lp-add-elem-menu" id="lpAddMenu">'+_renderAddMenu()+'</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    // ---- RIGHT: canvas (top) + properties (bottom) ----
    '<div class="lp-editor-right">'+
      // Canvas area with rulers + zoom
      '<div class="lp-canvas-area">'+
        '<div class="lp-ruler-corner"></div>'+
        '<div class="lp-ruler-h" id="lpRulerH"></div>'+
        '<div class="lp-ruler-v" id="lpRulerV"></div>'+
        '<div class="lp-canvas-wrap">'+
          '<div class="lp-canvas editing" id="lpCanvas">'+renderLabelTag(t, LABEL_CANVAS_SCALE)+'</div>'+
        '</div>'+
        '<div class="lp-zoom-bar">'+
          '<button onclick="_zoomIn()" title="放大">+</button>'+
          '<span class="lp-zoom-pct" id="lpZoomPct">100%</span>'+
          '<button onclick="_zoomOut()" title="缩小">−</button>'+
          '<button class="lp-zoom-fit" onclick="_zoomReset()" title="适应画布">⊡</button>'+
          '<button onclick="_zoomOriginal()" title="原始尺寸">◎</button>'+
        '</div>'+
      '</div>'+
      // Properties section
      '<div class="lp-props-section">'+
        '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px;letter-spacing:0.5px">元素属性</div>'+
        '<div class="lp-elem-props" id="lpElemProps"></div>'+
        '<div class="lp-props-empty" id="lpPropsEmpty">← 在画布上点击元素或从左侧列表选择</div>'+
      '</div>'+
      // --- Action buttons ---
      '<div class="lp-editor-btns">'+
        '<button onclick="closeLabelEditor()">取消</button>'+
        '<button class="primary" onclick="saveLabelTemplate()">保存修改</button>'+
        (isBuiltin?'<button class="danger" onclick="resetLabelTemplate()">恢复默认</button>':'')+
      '</div>'+
    '</div>';

  // Init drag on canvas — refresh canvas to recalc scale
  _refreshCanvas();
  _selectElem(null);
}

function _renderElemList(t) {
  var colors = {product:'#e53935',price:'#ef6c00','original-price':'#9e9e9e','member-price':'#e65100',unit:'#7b1fa2',origin:'#1565c0',barcode:'#2e7d32','custom-text':'#546e7a','produce-date':'#00838f',spec:'#5d4037'};
  return t.elements.map(function(e){
    var tp = LABEL_ELEM_TYPES[e.type]||{label:e.type,icon:'📌'};
    var dot = colors[e.type]||'#999';
    return '<div class="lp-elem-item'+(LABEL_SEL_ELEM&&LABEL_SEL_ELEM.id===e.id?' active':'')+'" onclick="_selectElem(\''+e.id+'\')" data-eid="'+e.id+'">'+
      '<span class="ei-icon">'+tp.icon+'</span>'+
      '<span class="ei-name">'+_esc((e.prefix||'')+e.text)+'</span>'+
      '<button class="ei-del" onclick="event.stopPropagation();_deleteElem(\''+e.id+'\')" title="删除">×</button>'+
      '</div>';
  }).join('');
}

function _renderAddMenu() {
  var items = '';
  var existing = LABEL_EDITING ? LABEL_EDITING.elements.map(function(e){return e.type;}) : [];
  for (var key in LABEL_ELEM_TYPES) {
    var t = LABEL_ELEM_TYPES[key];
    var dup = key !== 'custom-text' && existing.indexOf(key) !== -1;
    items += '<div class="am-item'+(dup?' am-disabled':'')+'" onclick="'+(dup?'':'_addElement(\''+key+'\')')+'"><span class="am-icon">'+t.icon+'</span>'+t.label+(dup?' <span style="font-size:10px;color:#bbb">已添加</span>':'')+'</div>';
  }
  return items;
}

function _toggleAddMenu() {
  var m = document.getElementById('lpAddMenu');
  if (m) m.classList.toggle('show');
}

function _addElement(type) {
  if (!LABEL_EDITING) return;
  var tp = LABEL_ELEM_TYPES[type];
  if (!tp) return;

  // Non-custom-text types: prevent duplicate
  if (type !== 'custom-text') {
    var exists = LABEL_EDITING.elements.some(function(e){ return e.type === type; });
    if (exists) { _toggleAddMenu(); return; }
  }

  var d = tp.def;
  var defText = {product:'新商品',price:'0.00','original-price':'0.00','member-price':'0.00',unit:'元/500g',origin:'产地',barcode:'6900000000000','produce-date':new Date().toISOString().slice(0,10),spec:'规格','custom-text':'文本'};
  var sz = LABEL_EDITING.size;
  var elem = { id:_newElemId(), type:type, text:defText[type]||'文本', x:Math.round(sz.w/3), y:Math.round(sz.h/2), fontSize:d.fontSize||8, color:d.color||'#333' };
  if (d.fontWeight) elem.fontWeight = d.fontWeight;
  if (d.prefix) elem.prefix = d.prefix;
  if (d.letterSpacing) elem.letterSpacing = d.letterSpacing;
  if (d.isBadge) { elem.isBadge = true; elem.bg = d.bg; elem.borderRadiusTL = 2; elem.borderRadiusTR = 2; elem.borderRadiusBR = 2; elem.borderRadiusBL = 2; }
  if (d.strikethrough) elem.strikethrough = true;
  if (d.bg) elem.bg = d.bg;
  LABEL_EDITING.elements.push(elem);
  _selectElem(elem.id);
  _refreshCanvas();
  _refreshElemList();
  _refreshAddMenu();
  _toggleAddMenu();
}

function _selectElem(eid) {
  if (eid === null) { LABEL_SEL_ELEM = null; }
  else {
    LABEL_SEL_ELEM = LABEL_EDITING.elements.find(function(e){return e.id===eid;})||null;
  }
  // Update canvas selection visuals
  var canvas = document.getElementById('lpCanvas');
  if (canvas) {
    var elems = canvas.querySelectorAll('.label-elem');
    for (var i=0;i<elems.length;i++) {
      elems[i].classList.remove('selected');
      if (LABEL_SEL_ELEM && elems[i].textContent === ((LABEL_SEL_ELEM.prefix||'')+LABEL_SEL_ELEM.text)) {
        // Match by position as well since text can be duplicate
        var sx = parseFloat(elems[i].style.left), sy = parseFloat(elems[i].style.top);
        if (Math.abs(sx - LABEL_SEL_ELEM.x * LABEL_CANVAS_SCALE) < 2 && Math.abs(sy - LABEL_SEL_ELEM.y * LABEL_CANVAS_SCALE) < 2)
          elems[i].classList.add('selected');
      }
    }
  }
  _refreshElemList();
  _refreshProps();
}

function _refreshCanvas() {
  var canvas = document.getElementById('lpCanvas');
  if (canvas && LABEL_EDITING) {
    var wrap = canvas.parentElement;
    var maxW = Math.max(100, wrap.clientWidth - 12);
    var maxH = Math.max(40, wrap.clientHeight - 12);
    var autoScale = Math.min(maxW / LABEL_EDITING.size.w, maxH / LABEL_EDITING.size.h);
    autoScale = Math.max(0.3, autoScale);
    // Apply manual zoom on top of auto-fit
    LABEL_CANVAS_SCALE = autoScale * LABEL_CANVAS_ZOOM;
    LABEL_CANVAS_SCALE = Math.max(0.3, Math.min(LABEL_CANVAS_SCALE, 4.0));
    // Center the canvas initially
    var cw = LABEL_EDITING.size.w * LABEL_CANVAS_SCALE;
    var ch = LABEL_EDITING.size.h * LABEL_CANVAS_SCALE;
    LABEL_CANVAS_PAN_X = Math.max(0, (maxW - cw) / 2);
    LABEL_CANVAS_PAN_Y = Math.max(0, (maxH - ch) / 2);
    canvas.innerHTML = renderLabelTag(LABEL_EDITING, LABEL_CANVAS_SCALE);
    canvas.style.transform = 'translate('+LABEL_CANVAS_PAN_X+'px,'+LABEL_CANVAS_PAN_Y+'px)';
    _bindCanvasDrag();
    _bindCanvasPan();
    if (LABEL_SEL_ELEM) _selectElem(LABEL_SEL_ELEM.id);
    _renderRulers();
    _updateZoomDisplay();
  }
}

// ---- Ruler rendering (px-space viewBox, no distortion) ----
function _renderRulers() {
  var hRuler = document.getElementById('lpRulerH');
  var vRuler = document.getElementById('lpRulerV');
  if (!hRuler || !vRuler || !LABEL_EDITING) return;
  var s = LABEL_CANVAS_SCALE || 1;
  var cW = hRuler.clientWidth;   // container px width
  var cH = vRuler.clientHeight;  // container px height
  if (!cW || !cH) return;

  // In px space: canvas 0,0 is at (PAN_X,PAN_Y) from container origin.
  // viewBox origin = PAN_X (shifted so canvas 0 aligns at container PAN_X px).
  var px0 = LABEL_CANVAS_PAN_X;
  var py0 = LABEL_CANVAS_PAN_Y;

  // ---- Horizontal ruler ----
  // viewBox maps 1:1 to container pixels. Tick position = px0 + mm*s (visual px in container).
  var h0mm = Math.max(0, Math.floor((-px0) / (5*s)) * 5);
  var h1mm = Math.ceil((cW - px0) / (5*s)) * 5;
  var tickH = '';
  for (var mm = h0mm; mm <= h1mm; mm += 5) {
    var x = px0 + mm * s;
    if (x < -10 || x > cW + 10) continue;
    var major = mm % 10 === 0;
    tickH += '<line x1="'+x.toFixed(1)+'" y1="'+(major?13:18)+'" x2="'+x.toFixed(1)+'" y2="24" stroke="#b0b5bd" stroke-width="0.4"/>';
    if (major) tickH += '<text x="'+x.toFixed(1)+'" y="9.5" font-size="6" fill="#444" text-anchor="middle" font-family="Inter,sans-serif">'+mm+'</text>';
  }
  hRuler.innerHTML = '<svg viewBox="0 0 '+cW+' 24" style="display:block">'+
    '<rect x="0" y="0" width="'+cW+'" height="24" fill="#f0f1f3"/>'+tickH+'</svg>';

  // ---- Vertical ruler ----
  var v0mm = Math.max(0, Math.floor((-py0) / (5*s)) * 5);
  var v1mm = Math.ceil((cH - py0) / (5*s)) * 5;
  var tickV = '';
  for (var mm2 = v0mm; mm2 <= v1mm; mm2 += 5) {
    var y = py0 + mm2 * s;
    if (y < -10 || y > cH + 10) continue;
    var major2 = mm2 % 10 === 0;
    tickV += '<line x1="'+(major2?13:18)+'" y1="'+y.toFixed(1)+'" x2="24" y2="'+y.toFixed(1)+'" stroke="#b0b5bd" stroke-width="0.4"/>';
    if (major2) tickV += '<text x="12" y="'+(y+3.5).toFixed(1)+'" font-size="6" fill="#444" text-anchor="end" font-family="Inter,sans-serif">'+mm2+'</text>';
  }
  vRuler.innerHTML = '<svg viewBox="0 0 24 '+cH+'" style="display:block">'+
    '<rect x="0" y="0" width="24" height="'+cH+'" fill="#f0f1f3"/>'+tickV+'</svg>';
}

// ---- Zoom controls ----
// Helper: measure actual CSS px per physical mm on this screen
function _getMmToPx() {
  var d = document.createElement('div');
  d.style.cssText = 'position:absolute;visibility:hidden;width:50mm;height:1px;left:-9999px;';
  document.body.appendChild(d);
  var px = d.getBoundingClientRect().width / 50;
  document.body.removeChild(d);
  return px || 3.78;  // fallback: 96 DPI → 96/25.4 ≈ 3.78
}

function _zoomOriginal() {
  var mmToPx = _getMmToPx();
  // Target: LABEL_CANVAS_SCALE = mmToPx  (1mm → mmToPx screen px)
  // SCALE = autoScale * ZOOM  →  ZOOM = mmToPx / autoScale
  var canvas = document.getElementById('lpCanvas');
  if (!canvas || !LABEL_EDITING) return;
  var wrap = canvas.parentElement;
  var maxW = Math.max(100, wrap.clientWidth - 12);
  var maxH = Math.max(40, wrap.clientHeight - 12);
  var autoScale = Math.min(maxW / LABEL_EDITING.size.w, maxH / LABEL_EDITING.size.h);
  autoScale = Math.max(0.3, autoScale);
  LABEL_CANVAS_ZOOM = Math.max(0.3, Math.min(mmToPx / autoScale, 4.0));
  _refreshCanvas();
}

function _zoomIn() {
  LABEL_CANVAS_ZOOM = Math.min(4.0, LABEL_CANVAS_ZOOM * 1.25);
  _refreshCanvas();
}
function _zoomOut() {
  LABEL_CANVAS_ZOOM = Math.max(0.3, LABEL_CANVAS_ZOOM / 1.25);
  _refreshCanvas();
}
function _zoomReset() {
  LABEL_CANVAS_ZOOM = 1;
  _refreshCanvas();
}
function _updateZoomDisplay() {
  var el = document.getElementById('lpZoomPct');
  if (el) el.textContent = Math.round(LABEL_CANVAS_SCALE * 100) + '%';
}

function _refreshElemList() {
  var list = document.getElementById('lpElemList');
  if (list && LABEL_EDITING) list.innerHTML = _renderElemList(LABEL_EDITING);
}

function _refreshProps() {
  var panel = document.getElementById('lpElemProps');
  var empty = document.getElementById('lpPropsEmpty');
  if (!panel) return;
  if (!LABEL_SEL_ELEM) {
    panel.classList.remove('show');
    if (empty) empty.style.display = 'block';
    return;
  }
  panel.classList.add('show');
  if (empty) empty.style.display = 'none';
  var e = LABEL_SEL_ELEM;
  var tp = LABEL_ELEM_TYPES[e.type]||{label:e.type,icon:'📌'};
  panel.classList.add('show');
  panel.innerHTML =
    // ---- Content group ----
    '<div class="lp-prop-group">'+
      '<div class="lp-prop-group-title">'+tp.icon+' '+tp.label+' · 内容</div>'+
      '<div class="lp-prop-grid">'+
        '<div class="lp-prop-row fw"><label>文本</label><input value="'+_esc(e.text||'')+'" oninput="_updateSelProp(\'text\',this.value)"></div>'+
        (e.prefix!==undefined?'<div class="lp-prop-row fw"><label>前缀</label><input value="'+_esc(e.prefix||'')+'" oninput="_updateSelProp(\'prefix\',this.value)" placeholder="如 ¥、产地："></div>':'')+
      '</div>'+
    '</div>'+
    // ---- Style group ----
    '<div class="lp-prop-group">'+
      '<div class="lp-prop-group-title">样式</div>'+
      '<div class="lp-prop-grid">'+
        '<div class="lp-prop-row"><label>字号</label>'+
          '<input type="number" value="'+e.fontSize+'" oninput="_updateSelProp(\'fontSize\',+this.value)" min="4" max="48" style="flex:1">'+
        '</div>'+
        '<div class="lp-prop-row"><label>字色</label><span class="lp-color-swatch" style="background:'+(e.color||'#333')+'" onclick="this.nextElementSibling.click()"></span><input type="color" value="'+(e.color||'#333')+'" oninput="_updateSelProp(\'color\',this.value)" style="width:40px;flex:none"></div>'+
        (e.isBadge?'<div class="lp-prop-row fw"><label>圆角</label>'+
          '<div style="display:flex;gap:2px;flex:1;align-items:center">'+
            '<svg viewBox="0 0 24 24" width="16" height="16" style="flex-shrink:0" title="左上角"><path d="M20,4 L8,4 A5,5 0 0,0 4,8 L4,20" fill="none" stroke="#8899aa" stroke-width="1.6" stroke-linecap="round"/></svg>'+
            '<input type="number" value="'+(e.borderRadiusTL!=null?e.borderRadiusTL:2)+'" oninput="_updateSelProp(\'borderRadiusTL\',+this.value)" min="0" max="50" style="width:30px;height:22px;padding:2px 3px;font-size:11px;text-align:center">'+
            '<svg viewBox="0 0 24 24" width="16" height="16" style="flex-shrink:0" title="右上角"><path d="M4,4 L16,4 A5,5 0 0,1 20,8 L20,20" fill="none" stroke="#8899aa" stroke-width="1.6" stroke-linecap="round"/></svg>'+
            '<input type="number" value="'+(e.borderRadiusTR!=null?e.borderRadiusTR:2)+'" oninput="_updateSelProp(\'borderRadiusTR\',+this.value)" min="0" max="50" style="width:30px;height:22px;padding:2px 3px;font-size:11px;text-align:center">'+
            '<svg viewBox="0 0 24 24" width="16" height="16" style="flex-shrink:0" title="右下角"><path d="M4,20 L16,20 A5,5 0 0,0 20,16 L20,4" fill="none" stroke="#8899aa" stroke-width="1.6" stroke-linecap="round"/></svg>'+
            '<input type="number" value="'+(e.borderRadiusBR!=null?e.borderRadiusBR:2)+'" oninput="_updateSelProp(\'borderRadiusBR\',+this.value)" min="0" max="50" style="width:30px;height:22px;padding:2px 3px;font-size:11px;text-align:center">'+
            '<svg viewBox="0 0 24 24" width="16" height="16" style="flex-shrink:0" title="左下角"><path d="M20,20 L8,20 A5,5 0 0,1 4,16 L4,4" fill="none" stroke="#8899aa" stroke-width="1.6" stroke-linecap="round"/></svg>'+
            '<input type="number" value="'+(e.borderRadiusBL!=null?e.borderRadiusBL:2)+'" oninput="_updateSelProp(\'borderRadiusBL\',+this.value)" min="0" max="50" style="width:30px;height:22px;padding:2px 3px;font-size:11px;text-align:center">'+
          '</div>'+
        '</div>':'')+
        (e.isBadge?'<div class="lp-prop-row"><label>底色</label><span class="lp-color-swatch" style="background:'+(e.bg||'#e65100')+'" onclick="this.nextElementSibling.click()"></span><input type="color" value="'+(e.bg||'#e65100')+'" oninput="_updateSelProp(\'bg\',this.value)" style="width:40px;flex:none"></div>':'')+
        (e.isBadge?'<div class="lp-prop-row"><label>文字</label><span class="lp-color-swatch" style="background:'+(e.color||'#fff')+'" onclick="this.nextElementSibling.click()"></span><input type="color" value="'+(e.color||'#fff')+'" oninput="_updateSelProp(\'color\',this.value)" style="width:40px;flex:none"></div>':'')+
        '<div class="lp-prop-row"><label>粗体</label>'+
          '<select onchange="_updateSelProp(\'fontWeight\',this.value===\'1\'?700:undefined)" style="flex:1">'+
            '<option value="0"'+(e.fontWeight!==700?' selected':'')+'>正常</option>'+
            '<option value="1"'+(e.fontWeight===700?' selected':'')+'>粗体</option>'+
          '</select>'+
        '</div>'+
        (e.strikethrough!==undefined?'<div class="lp-prop-row"><label>划线</label>'+
          '<select onchange="_updateSelProp(\'strikethrough\',this.value===\'1\')" style="flex:1">'+
            '<option value="0"'+(e.strikethrough?'':' selected')+'>否</option>'+
            '<option value="1"'+(e.strikethrough?' selected':'')+'>是</option>'+
          '</select>'+
        '</div>':'')+
      '</div>'+
    '</div>'+
    // ---- Position group ----
    '<div class="lp-prop-group">'+
      '<div class="lp-prop-group-title">位置</div>'+
      '<div class="lp-prop-grid">'+
        '<div class="lp-prop-row"><label>X</label>'+
          '<input type="number" value="'+e.x+'" oninput="_updateSelProp(\'x\',+this.value)" min="0" style="flex:1">'+
        '</div>'+
        '<div class="lp-prop-row"><label>Y</label>'+
          '<input type="number" value="'+e.y+'" oninput="_updateSelProp(\'y\',+this.value)" min="0" style="flex:1">'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<button class="lp-prop-del" onclick="_deleteElem(\''+e.id+'\')">删除 '+tp.label+'</button>';
}

// Incremental adjustment via stepper buttons (keeps canvas in sync)
function _adjSelProp(prop, delta) {
  if (!LABEL_SEL_ELEM) return;
  LABEL_SEL_ELEM[prop] = (LABEL_SEL_ELEM[prop]||0) + delta;
  if (prop==='fontSize' && LABEL_SEL_ELEM[prop] < 4) LABEL_SEL_ELEM[prop] = 4;
  if ((prop==='x'||prop==='y') && LABEL_SEL_ELEM[prop] < 0) LABEL_SEL_ELEM[prop] = 0;
  _refreshCanvas();
  _refreshProps();
}
function _updateSelProp(prop, val) {
  if (!LABEL_SEL_ELEM) return;
  LABEL_SEL_ELEM[prop] = val;
  _refreshCanvas();
  _refreshElemList();
  _refreshProps();
}


function _deleteElem(eid) {
  if (!LABEL_EDITING) return;
  var idx = LABEL_EDITING.elements.findIndex(function(e){return e.id===eid;});
  if (idx < 0) return;
  LABEL_EDITING.elements.splice(idx,1);
  if (LABEL_SEL_ELEM && LABEL_SEL_ELEM.id===eid) LABEL_SEL_ELEM = null;
  _refreshCanvas();
  _refreshElemList();
  _refreshProps();
  _refreshAddMenu();
}

function _refreshAddMenu() {
  var menu = document.getElementById('lpAddMenu');
  if (menu) menu.innerHTML = _renderAddMenu();
}

function _setLabelBg(color) {
  if (!LABEL_EDITING) return;
  LABEL_EDITING.bg = color;
  _refreshCanvas();
  var swatches = document.querySelectorAll('#lpEditor .lp-color-pick span');
  for (var i=0;i<swatches.length;i++) {
    swatches[i].classList.toggle('sel', swatches[i].getAttribute('data-color')===color);
  }
}
function _onSizeChange() {
  if (!LABEL_EDITING) return;
  var nw = parseFloat(document.getElementById('lpSizeW').value);
  var nh = parseFloat(document.getElementById('lpSizeH').value);
  if (nw>0 && nh>0) { LABEL_EDITING.size.w=nw; LABEL_EDITING.size.h=nh; _refreshCanvas(); }
}

// ---- Create / Delete templates ----
function createNewLabel() {
  openNewLabelDialog();
}

function deleteLabelTemplate(tplId) {
  var builtin = ['tpl-01','tpl-02','tpl-03','tpl-04','tpl-05'];
  if (builtin.indexOf(tplId)>=0) { alert('内置模板不可删除'); return; }
  if (!confirm('确定删除这个价签模板吗？此操作不可撤销。')) return;
  var idx = LABEL_TEMPLATES.findIndex(function(t){return t.id===tplId;});
  if (idx>=0) { LABEL_TEMPLATES.splice(idx,1); _saveTemplates(); initLabelPrint(); }
}

function duplicateLabelTemplate(tplId) {
  var src = LABEL_TEMPLATES.find(function(t){return t.id===tplId;});
  if (!src) return;
  var maxN = 0;
  LABEL_TEMPLATES.forEach(function(t){
    var m = t.id.match(/^tpl-(\d+)$/);
    if (m) maxN = Math.max(maxN, parseInt(m[1]));
  });
  var newId = 'tpl-' + String(maxN+1).padStart(2,'0');
  var copy = JSON.parse(JSON.stringify(src));
  copy.id = newId;
  copy.name = src.name + ' (副本)';
  // Reassign element IDs to avoid conflicts
  copy.elements.forEach(function(e){ e.id = _newElemId(); });
  // Open the copy in editor (doesn't persist until save)
  LABEL_EDITING = copy;
  LABEL_SEL_ELEM = null;
  _renderLabelEditor();
  _showEditor();
  _refreshCanvas();
}

// ---- Import / Export ----
function exportLabelTemplate(tplId) {
  var tpl = LABEL_TEMPLATES.find(function(t){return t.id===tplId;});
  if (!tpl) return;
  var blob = new Blob([JSON.stringify(tpl, null, 2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'label-template-'+tpl.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g,'_')+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportAllLabelTemplates() {
  var data = {version:1,templates:LABEL_TEMPLATES};
  var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'label-templates-all.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importLabelTemplates(event) {
  var files = Array.from(event.target.files);
  if (!files.length) return;
  var totalImported = 0, totalSkipped = 0, done = 0;

  function _mergeTemplate(tpl) {
    if (!tpl.id || !tpl.name || !tpl.size || !Array.isArray(tpl.elements)) {
      totalSkipped++; return;
    }
    var existing = LABEL_TEMPLATES.find(function(t){ return t.id === tpl.id; });
    if (existing) {
      var maxN = 0;
      LABEL_TEMPLATES.forEach(function(t){
        var m = t.id.match(/^tpl-(\d+)$/);
        if (m) maxN = Math.max(maxN, parseInt(m[1]));
      });
      tpl.id = 'tpl-' + String(maxN + 1).padStart(2, '0');
      tpl.name = tpl.name + ' (导入)';
    }
    tpl.elements.forEach(function(e){ e.id = _newElemId(); });
    LABEL_TEMPLATES.push(tpl);
    totalImported++;
  }

  files.forEach(function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        var templates = Array.isArray(data) ? data
          : (data.templates && Array.isArray(data.templates) ? data.templates : [data]);
        templates.forEach(_mergeTemplate);
      } catch(err) {
        totalSkipped++;
      }
      done++;
      if (done === files.length) {
        alert('导入完成：成功 ' + totalImported + ' 个' + (totalSkipped ? '，跳过 ' + totalSkipped + ' 个无效模板' : ''));
        _saveTemplates();
        initLabelPrint();
      }
    };
    reader.readAsText(file);
  });

  // Reset so same files can be re-imported
  event.target.value = '';
}

function openNewLabelDialog() {
  var existing = document.getElementById('lpNewDialog');
  if (existing) existing.remove();
  var builtinIds = ['tpl-01','tpl-02','tpl-03','tpl-04','tpl-05'];
  var html =
    '<div id="lpNewDialog" class="lp-new-dialog-overlay" onclick="closeNewLabelDialog()">'+
      '<div class="lp-new-dialog" onclick="event.stopPropagation()">'+
        '<div class="lp-new-dialog-header"><h3>选择基础模板</h3><button class="lp-new-dialog-close" onclick="closeNewLabelDialog()">&times;</button></div>'+
        '<div class="lp-new-dialog-body">'+
          // Blank option
          '<div class="lp-new-option" data-tpl="" onclick="confirmNewLabel(null)">'+
            '<div class="lp-new-option-preview lp-new-option-blank">&empty;</div>'+
            '<div class="lp-new-option-info"><strong>空白价签</strong><span>从头开始编辑</span></div>'+
          '</div>'+
          // Built-in templates only
          LABEL_TEMPLATES.filter(function(t) { return builtinIds.indexOf(t.id) >= 0; }).map(function(t) {
            return '<div class="lp-new-option" data-tpl="'+t.id+'" onclick="confirmNewLabel(\''+t.id+'\')">'+
              '<div class="lp-new-option-preview">'+renderLabelTag(t, 1.0)+'</div>'+
              '<div class="lp-new-option-info"><strong>'+_esc(t.name)+'</strong><span>'+t.size.w+'×'+t.size.h+'mm</span></div>'+
            '</div>';
          }).join('')+
        '</div>'+
      '</div>'+
    '</div>';
  document.getElementById('labelPrintContent').insertAdjacentHTML('beforeend', html);
}

function closeNewLabelDialog() {
  var d = document.getElementById('lpNewDialog');
  if (d) d.remove();
}

function confirmNewLabel(tplId) {
  closeNewLabelDialog();
  if (tplId) {
    // Clone from existing template (doesn't persist until save)
    var src = LABEL_TEMPLATES.find(function(t){return t.id===tplId;});
    if (!src) return;
    var maxN = 0;
    LABEL_TEMPLATES.forEach(function(t){
      var m = t.id.match(/^tpl-(\d+)$/);
      if (m) maxN = Math.max(maxN, parseInt(m[1]));
    });
    var newId = 'tpl-' + String(maxN+1).padStart(2,'0');
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = newId;
    copy.name = src.name + ' (副本)';
    copy.elements.forEach(function(e){ e.id = _newElemId(); });
    LABEL_EDITING = copy;
  } else {
    // Blank template
    createNewLabelBlank();
    return;
  }
  LABEL_SEL_ELEM = null;
  _renderLabelEditor();
  _showEditor();
  _refreshCanvas();
}

function createNewLabelBlank() {
  var maxN = 0;
  LABEL_TEMPLATES.forEach(function(t){
    var m = t.id.match(/^tpl-(\d+)$/);
    if (m) maxN = Math.max(maxN, parseInt(m[1]));
  });
  var newId = 'tpl-' + String(maxN+1).padStart(2,'0');
  LABEL_EDITING = {
    id: newId, name: '新价签', desc: '', size: {w:158, h:90}, bg: '#ffffff',
    elements: [
      {id:'e1',type:'product',text:'商品名称',x:4,y:2,fontSize:11,color:'#222',fontWeight:700},
      {id:'e2',type:'price',text:'0.00',x:4,y:15,fontSize:16,color:'#d32f2f',fontWeight:800,prefix:'¥'},
      {id:'e3',type:'unit',text:'元/500g',x:4,y:33,fontSize:8,color:'#666'}
    ]
  };
  LABEL_SEL_ELEM = null;
  _renderLabelEditor();
  _showEditor();
  _refreshCanvas();
}


// ---- Drag on canvas ----
function _bindCanvasDrag() {
  var canvas = document.getElementById('lpCanvas');
  if (!canvas) return;
  var scale = LABEL_CANVAS_SCALE;
  var elems = canvas.querySelectorAll('.label-elem');
  var dragTarget = null, startX, startY, origX, origY;

  function onDown(e) {
    var target = e.target.closest('.label-elem');
    if (!target) { _selectElem(null); return; }
    e.preventDefault();
    dragTarget = target;
    // Find which data element this corresponds to
    var el = dragTarget;
    for (var i=0;i<LABEL_EDITING.elements.length;i++) {
      var de = LABEL_EDITING.elements[i];
      var sx=parseFloat(el.style.left), sy=parseFloat(el.style.top);
      if (Math.abs(sx-de.x*scale)<2 && Math.abs(sy-de.y*scale)<2) {
        _selectElem(de.id); break;
      }
    }
    if (!LABEL_SEL_ELEM) return;
    origX = LABEL_SEL_ELEM.x;
    origY = LABEL_SEL_ELEM.y;
    startX = e.clientX; startY = e.clientY;
    dragTarget.classList.add('dragging');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
  function onMove(e) {
    if (!dragTarget || !LABEL_SEL_ELEM) return;
    var dx = (e.clientX - startX) / scale;
    var dy = (e.clientY - startY) / scale;
    var nx = Math.round(Math.max(0, origX + dx));
    var ny = Math.round(Math.max(0, origY + dy));
    LABEL_SEL_ELEM.x = nx;
    LABEL_SEL_ELEM.y = ny;
    dragTarget.style.left = (nx*scale)+'px';
    dragTarget.style.top = (ny*scale)+'px';
    _refreshProps();
  }
  function onUp() {
    if (dragTarget) dragTarget.classList.remove('dragging');
    dragTarget = null;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  for (var i=0;i<elems.length;i++) {
    elems[i].addEventListener('mousedown', onDown);
  }
}

// ---- Canvas pan (drag to move the whole canvas) ----
var _canvasPanBound = false;
function _bindCanvasPan() {
  if (_canvasPanBound) return;
  var wrap = document.querySelector('.lp-canvas-wrap');
  if (!wrap) return;
  var canvas = document.getElementById('lpCanvas');
  var panning = false, sx, sy, ox, oy;

  function onDown(e) {
    // Only pan when clicking on empty canvas (not on elements)
    if (e.target.closest('.label-elem')) return;
    e.preventDefault();
    panning = true;
    sx = e.clientX; sy = e.clientY;
    ox = LABEL_CANVAS_PAN_X; oy = LABEL_CANVAS_PAN_Y;
    wrap.classList.add('panning');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
  function onMove(e) {
    if (!panning) return;
    LABEL_CANVAS_PAN_X = ox + (e.clientX - sx);
    LABEL_CANVAS_PAN_Y = oy + (e.clientY - sy);
    canvas.style.transform = 'translate('+LABEL_CANVAS_PAN_X+'px,'+LABEL_CANVAS_PAN_Y+'px)';
    _renderRulers();  // sync rulers with pan
  }
  function onUp() {
    panning = false;
    wrap.classList.remove('panning');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  wrap.addEventListener('mousedown', onDown);
  _canvasPanBound = true;
}

// ---- Background Image ----
function _handleBgImageUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { alert('图片不能超过 3MB，请压缩后重试'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    if (!LABEL_EDITING) return;
    LABEL_EDITING.bgImage = e.target.result;
    LABEL_EDITING.printBg = true;
    _renderLabelEditor();
  };
  reader.readAsDataURL(file);
}
function _removeBgImage() {
  if (!LABEL_EDITING) return;
  LABEL_EDITING.bgImage = null;
  LABEL_EDITING.printBg = false;
  _renderLabelEditor();
}
function _togglePrintBg() {
  var cb = document.getElementById('lpPrintBg');
  if (cb && LABEL_EDITING) { LABEL_EDITING.printBg = cb.checked; _refreshCanvas(); }
}

// ---- Save / Reset ----
function saveLabelTemplate() {
  if (!LABEL_EDITING) return;
  var idx = LABEL_TEMPLATES.findIndex(function(t){return t.id===LABEL_EDITING.id;});
  if (idx>=0) {
    LABEL_TEMPLATES[idx]=JSON.parse(JSON.stringify(LABEL_EDITING));
  } else {
    LABEL_TEMPLATES.push(JSON.parse(JSON.stringify(LABEL_EDITING)));
  }
  _saveTemplates();
  closeLabelEditor(); initLabelPrint();
}
function resetLabelTemplate() {
  if (!LABEL_EDITING) return;
  var orig = (function(){
    switch(LABEL_EDITING.id) {
      case 'tpl-01': return {id:'tpl-01',name:'标准价签',size:{w:158,h:90},bg:'#ffffff',elements:[{id:'e1',type:'product',text:'有机西红柿',x:4,y:2,fontSize:11,color:'#222',fontWeight:700},{id:'e2',type:'price',text:'8.80',x:4,y:15,fontSize:16,color:'#d32f2f',fontWeight:800,prefix:'¥'},{id:'e3',type:'unit',text:'元/500g',x:4,y:33,fontSize:8,color:'#666'},{id:'e4',type:'origin',text:'山东寿光',x:4,y:43,fontSize:7,color:'#999',prefix:'产地：'},{id:'e5',type:'barcode',text:'6901234567890',x:2,y:52,fontSize:7,color:'#555',letterSpacing:1}],desc:'基础白底价签'};
      case 'tpl-02': return {id:'tpl-02',name:'促销价签',size:{w:158,h:90},bg:'#fff8e1',elements:[{id:'e1',type:'product',text:'进口车厘子',x:4,y:2,fontSize:12,color:'#222',fontWeight:700},{id:'e2',type:'price',text:'39.90',x:4,y:16,fontSize:18,color:'#e65100',fontWeight:800,prefix:'¥'},{id:'e3',type:'unit',text:'元/盒',x:4,y:36,fontSize:8,color:'#666'},{id:'e4',type:'origin',text:'智利',x:4,y:46,fontSize:7,color:'#999',prefix:'产地：'},{id:'e5',type:'barcode',text:'6909876543210',x:2,y:55,fontSize:7,color:'#555',letterSpacing:1},{id:'e6',type:'custom-text',text:'热卖',x:46,y:2,fontSize:7,color:'#fff',bg:'#e65100',isBadge:true}],desc:'暖色底+热卖角标'};
      case 'tpl-03': return {id:'tpl-03',name:'精肉价签',size:{w:158,h:90},bg:'#fce4ec',elements:[{id:'e1',type:'product',text:'黑猪五花肉',x:4,y:2,fontSize:13,color:'#333',fontWeight:700},{id:'e2',type:'price',text:'25.80',x:4,y:17,fontSize:20,color:'#fc4b52',fontWeight:800,prefix:'¥'},{id:'e3',type:'unit',text:'元/500g',x:4,y:39,fontSize:8,color:'#666'},{id:'e4',type:'origin',text:'安徽金寨',x:4,y:49,fontSize:7,color:'#999',prefix:'产地：'},{id:'e5',type:'barcode',text:'6901122334455',x:2,y:60,fontSize:7,color:'#555',letterSpacing:1},{id:'e6',type:'custom-text',text:'当日鲜',x:50,y:2,fontSize:7,color:'#fff',bg:'#fc4b52',isBadge:true}],desc:'粉色底+当日鲜角标'};
      case 'tpl-04': return {id:'tpl-04',name:'水果价签',size:{w:158,h:90},bg:'#e8f5e9',elements:[{id:'e1',type:'product',text:'阳光玫瑰葡萄',x:4,y:2,fontSize:12,color:'#1b5e20',fontWeight:700},{id:'e2',type:'price',text:'29.90',x:4,y:16,fontSize:18,color:'#2e7d32',fontWeight:800,prefix:'¥'},{id:'e3',type:'unit',text:'元/串',x:4,y:36,fontSize:8,color:'#666'},{id:'e4',type:'origin',text:'云南大理',x:4,y:46,fontSize:7,color:'#999',prefix:'产地：'},{id:'e5',type:'barcode',text:'6905566778899',x:2,y:55,fontSize:6,color:'#555',letterSpacing:1}],desc:'绿色自然风'};
      case 'tpl-05': return {id:'tpl-05',name:'蔬菜价签',size:{w:158,h:90},bg:'#f1f8e9',elements:[{id:'e1',type:'product',text:'有机上海青',x:4,y:2,fontSize:11,color:'#333',fontWeight:700},{id:'e2',type:'price',text:'4.50',x:4,y:15,fontSize:16,color:'#33691e',fontWeight:800,prefix:'¥'},{id:'e3',type:'unit',text:'元/500g',x:4,y:33,fontSize:8,color:'#666'},{id:'e4',type:'origin',text:'上海崇明',x:4,y:43,fontSize:7,color:'#999',prefix:'产地：'}],desc:'简约绿底'};
      default: return null;
    }
  })();
  if (orig) { LABEL_EDITING=JSON.parse(JSON.stringify(orig)); LABEL_SEL_ELEM=null; _renderLabelEditor(); }
}

// ---- Print ----
function printLabel(tplId) {
  var tpl = LABEL_TEMPLATES.find(function(t){return t.id===tplId;});
  if (!tpl) return;
  var w = window.open('','_blank','width=400,height=300');
  if (!w) { alert('请允许弹出窗口以打印价签'); return; }
  w.document.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>打印价签 - '+tpl.name+'</title>'+
    '<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#eee}'+
    '.label-tag{font-family:\'PingFang SC\',\'Microsoft YaHei\',sans-serif;position:relative;overflow:hidden}.label-bg-img{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;pointer-events:none;z-index:0}.label-elem{position:absolute;line-height:1.2;white-space:nowrap}'+
    '@page{margin:0}@media print{body{margin:0;padding:0;background:#fff}.label-bg-img.no-print{display:none!important}}'+
    '</style></head><body>'+renderLabelTagMM(tpl)+
    '</body></html>');
  w.document.close();
  setTimeout(function(){ w.print(); }, 300);
}

function refreshLabelPrint() {
  var el = document.getElementById('labelCardGrid');
  if (el) { el.innerHTML = ''; initLabelPrint(); }
}

// ---- Product Selector for Printing ----
function showProductSelector(tplId) {
  var tpl = LABEL_TEMPLATES.find(function(t){return t.id===tplId;});
  if (!tpl) return;
  // Build selector HTML
  var html =
    '<div class="ps-overlay" id="psOverlay" onclick="closeProductSelector()"><div class="ps-dialog" onclick="event.stopPropagation()">'+
      '<div class="ps-header"><h3>选择商品 — '+_esc(tpl.name)+'</h3><button class="ps-close" onclick="closeProductSelector()">×</button></div>'+
      '<div class="ps-search"><input type="text" id="psSearch" placeholder="搜索商品名称或品类..." oninput="renderProductList(\''+tplId+'\')"></div>'+
      '<div class="ps-body" id="psBody"></div>'+
      '<div class="ps-footer">'+
        '<div class="ps-footer-count"><label style="cursor:pointer"><input type="checkbox" id="psSelectAll" onchange="toggleSelectAll(\''+tplId+'\')"> 全选</label> <span id="psCount" style="margin-left:4px">已选 0 件</span></div>'+
        '<div class="ps-footer-actions">'+
          '<button onclick="closeProductSelector()">取消</button>'+
          '<button class="primary" id="psConfirm" disabled onclick="printSelectedProducts(\''+tplId+'\')">打印选中商品</button>'+
        '</div>'+
      '</div>'+
    '</div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  _psTplId = tplId;
  _psSelected = {};
  renderProductList(tplId);
}

function closeProductSelector() {
  var el = document.getElementById('psOverlay');
  if (el) el.remove();
  _psTplId = null;
  _psSelected = null;
}

var _psTplId = null;
var _psSelected = null;

function renderProductList(tplId) {
  var body = document.getElementById('psBody');
  var search = (document.getElementById('psSearch')||{}).value || '';
  var q = search.toLowerCase();
  var list = LABEL_PRODUCTS.filter(function(p){
    if (!q) return true;
    return p.name.indexOf(q)>=0 || p.cat.indexOf(q)>=0 || p.barcode.indexOf(q)>=0;
  });
  if (list.length === 0) {
    body.innerHTML = '<div class="ps-empty">未找到匹配商品</div>';
  } else {
    body.innerHTML = list.map(function(p){
      var sel = _psSelected[p.id] ? ' selected' : '';
      return '<div class="ps-row'+sel+'" onclick="toggleProduct(\''+tplId+'\',\''+p.id+'\')">'+
        '<input type="checkbox" '+(sel?'checked':'')+' onclick="event.stopPropagation();toggleProduct(\''+tplId+'\',\''+p.id+'\')">'+
        '<span class="ps-row-name">'+_esc(p.name)+'</span>'+
        '<span class="ps-row-cat">'+_esc(p.cat)+'</span>'+
        '<span class="ps-row-price">¥'+p.price.toFixed(1)+'</span>'+
      '</div>';
    }).join('');
  }
  // Select all checkbox state
  var all = document.getElementById('psSelectAll');
  if (all) { all.checked = list.length > 0 && list.every(function(p){ return _psSelected[p.id]; }); }
  updatePsCount();
}

function toggleSelectAll(tplId) {
  var all = document.getElementById('psSelectAll');
  var search = (document.getElementById('psSearch')||{}).value || '';
  var q = search.toLowerCase();
  var list = LABEL_PRODUCTS.filter(function(p){
    if (!q) return true;
    return p.name.indexOf(q)>=0 || p.cat.indexOf(q)>=0 || p.barcode.indexOf(q)>=0;
  });
  if (all.checked) {
    list.forEach(function(p){ _psSelected[p.id] = true; });
  } else {
    list.forEach(function(p){ delete _psSelected[p.id]; });
  }
  renderProductList(tplId);
  updatePsCount();
}

function toggleProduct(tplId, pid) {
  if (_psSelected[pid]) { delete _psSelected[pid]; } else { _psSelected[pid] = true; }
  renderProductList(tplId);
  updatePsCount();
}

function updatePsCount() {
  var cnt = Object.keys(_psSelected).length;
  var el = document.getElementById('psCount');
  if (el) el.textContent = '已选 '+cnt+' 件';
  var btn = document.getElementById('psConfirm');
  if (btn) btn.disabled = cnt === 0;
}

// ---- Print with real product data ----
function renderProductLabel(tpl, product, scale) {
  scale = scale || 1;
  var w = tpl.size.w * scale, h = tpl.size.h * scale;
  var html = '<div class="label-tag" style="width:'+w+'px;height:'+h+'px;background:'+tpl.bg+';position:relative;overflow:hidden">';
  // Background image layer (rendered behind all elements)
  if (tpl.bgImage) {
    html += '<div class="label-bg-img'+(tpl.printBg?'':' no-print')+'" style="background-image:url('+tpl.bgImage+')"></div>';
  }
  (tpl.elements||[]).forEach(function(e) {
    var style = 'position:absolute;left:'+(e.x*scale)+'px;top:'+(e.y*scale)+'px;font-size:'+(e.fontSize*scale)+'px;color:'+(e.color||'#333')+';line-height:1.2;white-space:nowrap';
    if (e.fontWeight) style += ';font-weight:'+e.fontWeight;
    if (e.letterSpacing) style += ';letter-spacing:'+(e.letterSpacing*scale)+'px';
    if (e.isBadge) {
      var bg = e.bg || '#e65100';
      var tl = e.borderRadiusTL != null ? e.borderRadiusTL : 2;
      var tr = e.borderRadiusTR != null ? e.borderRadiusTR : 2;
      var br = e.borderRadiusBR != null ? e.borderRadiusBR : 2;
      var bl = e.borderRadiusBL != null ? e.borderRadiusBL : 2;
      style += ';background:'+bg+';padding:'+(1*scale).toFixed(1)+'px '+(4*scale).toFixed(1)+'px;border-radius:'+(tl*scale).toFixed(1)+'px '+(tr*scale||0).toFixed(1)+'px '+(br*scale||0).toFixed(1)+'px '+(bl*scale||0).toFixed(1)+'px;color:'+(e.color||'#fff');
    }
    if (e.strikethrough) style += ';text-decoration:line-through';
    // Replace placeholder with real product data
    var text = _getProductValue(e, product);
    html += '<div class="label-elem" style="'+style+'">'+_esc(text)+'</div>';
  });
  html += '</div>';
  return html;
}

// MM-unit variant for product labels — see renderLabelTagMM for rationale.
function renderProductLabelMM(tpl, product) {
  var w = tpl.size.w, h = tpl.size.h;
  var html = '<div class="label-tag" style="width:'+w+'mm;height:'+h+'mm;background:'+tpl.bg+';position:relative;overflow:hidden">';
  if (tpl.bgImage) {
    html += '<div class="label-bg-img'+(tpl.printBg?'':' no-print')+'" style="background-image:url('+tpl.bgImage+')"></div>';
  }
  (tpl.elements||[]).forEach(function(e) {
    var fz = (e.fontSize||8);
    var style = 'position:absolute;left:'+e.x+'mm;top:'+e.y+'mm;font-size:'+fz+'mm;color:'+(e.color||'#333')+';line-height:1.2;white-space:nowrap';
    if (e.fontWeight) style += ';font-weight:'+e.fontWeight;
    if (e.letterSpacing) style += ';letter-spacing:'+(e.letterSpacing||0)+'mm';
    if (e.isBadge) {
      var bg = e.bg || '#e65100';
      var tl = e.borderRadiusTL != null ? e.borderRadiusTL : 2;
      var tr = e.borderRadiusTR != null ? e.borderRadiusTR : 2;
      var br = e.borderRadiusBR != null ? e.borderRadiusBR : 2;
      var bl = e.borderRadiusBL != null ? e.borderRadiusBL : 2;
      style += ';background:'+bg+';padding:1mm 4mm;border-radius:'+tl+'mm '+tr+'mm '+br+'mm '+bl+'mm;color:'+(e.color||'#fff');
    }
    if (e.strikethrough) style += ';text-decoration:line-through';
    var text = _getProductValue(e, product);
    html += '<div class="label-elem" style="'+style+'">'+_esc(text)+'</div>';
  });
  html += '</div>';
  return html;
}

// Resolve element text from product data
function _getProductValue(elem, product) {
  var prefix = elem.prefix || '';
  switch (elem.type) {
    case 'product':       return prefix + product.name;
    case 'price':         return prefix + product.price.toFixed(1);
    case 'original-price':return prefix + product.origPrice.toFixed(1);
    case 'member-price':  return prefix + product.memberPrice.toFixed(1);
    case 'unit':          return prefix + product.unit;
    case 'origin':        return prefix + product.origin;
    case 'barcode':       return prefix + product.barcode;
    case 'spec':          return prefix + product.spec;
    case 'produce-date':  return prefix + product.produceDate;
    case 'badge':         return elem.text; // Badge text is custom, not from product
    case 'custom-text':   return prefix + elem.text;
    default:              return prefix + (elem.text || '');
  }
}

function printSelectedProducts(tplId) {
  var tpl = LABEL_TEMPLATES.find(function(t){return t.id===tplId;});
  if (!tpl) return;
  var pids = Object.keys(_psSelected);
  if (pids.length === 0) return;
  var products = pids.map(function(id){ return LABEL_PRODUCTS.find(function(p){return p.id===id;}); }).filter(Boolean);
  closeProductSelector();

  var w = window.open('','_blank','width=400,height=300');
  if (!w) { alert('请允许弹出窗口以打印价签'); return; }
  w.document.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>打印价签 - '+tpl.name+'</title>'+
    '<style>body{margin:0;display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:8px;padding:12px;min-height:100vh;background:#eee}'+
    '.label-tag{font-family:\'PingFang SC\',\'Microsoft YaHei\',sans-serif;position:relative;overflow:hidden}.label-bg-img{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;pointer-events:none;z-index:0}'+
    '@page{size:auto;margin:6mm}@media print{body{margin:0;padding:4mm;background:#fff;gap:4mm}.label-bg-img.no-print{display:none!important}}'+
    '</style></head><body>'+
    products.map(function(p){ return renderProductLabelMM(tpl, p); }).join('')+
    '</body></html>');
  w.document.close();
  setTimeout(function(){ w.print(); }, 300);
}

// ===== INIT =====
// Sync hardcoded date labels with real system date
(function syncDateLabels() {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var d = now.getDate();
  var dow = now.getDay(); // 0=Sun
  var pad = function(n) { return String(n).padStart(2,'0'); };
  var fmt = function(dt) { return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate()); };

  // Compute Mon-Sun for this week
  var mon = new Date(now);
  mon.setDate(d - (dow === 0 ? 6 : dow - 1));
  var sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  var todayStr = y+'-'+pad(m)+'-'+pad(d);
  var weekStart = fmt(mon), weekEnd = fmt(sun);
  var monthStr = y+'年'+m+'月';

  // Patch DATA (original dashboard)
  DATA.today.dateLabel = '📅 '+todayStr+'（今日）';
  DATA.today.sidebarDate = '今日 '+todayStr+' · 营业中';
  DATA.today.conceptDate = '📅 数据周期：'+todayStr+'（今日）';
  DATA.week.dateLabel = '📅 '+weekStart+' ~ '+weekEnd+'（本周）';
  DATA.week.sidebarDate = '本周 '+weekStart+'~'+sun.getDate()+' · 营业中';
  DATA.week.conceptDate = '📅 数据周期：'+weekStart+' ~ '+fmt(now)+'（本周一至今天）';
  DATA.month.dateLabel = '📅 '+monthStr+'（本月）';
  DATA.month.sidebarDate = '本月 '+monthStr+' · 营业中';
  DATA.month.conceptDate = '📅 数据周期：'+y+'-'+pad(m)+'-01 ~ '+fmt(now)+'（本月）';

  // Patch STATS_DATA (stats pages)
  STATS_DATA.today.label = todayStr+'（今日）';
  STATS_DATA.week.label = weekStart+' ~ '+weekEnd+'（本周）';
  STATS_DATA.month.label = monthStr+'（本月）';

  // Set initial display
  document.getElementById('sidebarDate').textContent = DATA.today.sidebarDate;
  document.getElementById('dateDisplay').textContent = DATA.today.dateLabel;

  // Refresh DEFAULT_DATA backups so resets use synced dates
  for (var k in DATA) { DEFAULT_DATA[k] = JSON.parse(JSON.stringify(DATA[k])); }
  for (var k in STATS_DATA) { DEFAULT_STATS_DATA[k] = JSON.parse(JSON.stringify(STATS_DATA[k])); }
})();

// (auto-init removed — multi-page mode handles init via initMultiPage)
initTicker();
moveGlobalPickers();
(function() { var el = document.getElementById('updateTime'); if (el) el.textContent = '更新时间 2026-07-01 23:05'; })();
// ========== 全局 Tooltip（[data-tip]） ==========
(function() {
  var box = null;
  var currentEl = null;
  function getBox() {
    if (!box) {
      box = document.createElement('div');
      box.className = 'ic-tooltip-box';
      box.style.display = 'none';
      document.body.appendChild(box);
    }
    return box;
  }
  function hide() { var b = getBox(); b.style.display = 'none'; currentEl = null; }
  document.addEventListener('mouseover', function(e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (!el) { hide(); return; }
    if (el === currentEl) return;
    currentEl = el;
    var b = getBox();
    b.textContent = el.getAttribute('data-tip');
    b.style.display = 'block';
    var r = el.getBoundingClientRect();
    // 先让浮层可见以测量宽度
    var bw = b.offsetWidth || 240;
    var left = r.left + r.width / 2 - bw / 2;
    if (left + bw > window.innerWidth - 8) left = window.innerWidth - bw - 8;
    if (left < 8) left = 8;
    b.style.left = left + 'px';
    // 尝试上方，空间不够则下方
    if (r.top - b.offsetHeight - 6 >= 0) {
      b.style.top = (r.top - b.offsetHeight - 6) + 'px';
    } else {
      b.style.top = (r.bottom + 6) + 'px';
    }
  });
  document.addEventListener('mouseout', function(e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el === currentEl) hide();
  });
  document.addEventListener('scroll', function() { hide(); }, true);
})();

// ========== PAGE: 模拟交班 (Shift Simulation) ==========================
var SH_SIM_RECORDS = (function() { try { var d = JSON.parse(localStorage.getItem('shiftSimRecords') || 'null'); return Array.isArray(d) ? d : []; } catch(e) { return []; } })();
function saveSimRecords() { try { localStorage.setItem('shiftSimRecords', JSON.stringify(SH_SIM_RECORDS)); } catch(e) {} }

var SH_SIM_REMARK_PRESETS = ['POS故障已报修', '网络异常已反馈', '备用金不足已申请', '系统卡顿已重启', '交接班正常', '其他异常'];
var SH_SIM_STORES = ['崧泽大道中心店', '徐泾店', '赵巷店', '华新店', '重固店'];
var SH_SIM_STAFF = ['张伟', '李娜', '王芳', '刘洋', '陈静', '赵强', '周敏', '吴秀英', '徐伟', '孙丽'];

// 商品目录（称重商品）
var SH_SIM_PRODUCTS = [
  {plu:'01001', name:'红富士苹果', price:12.80, unit:'kg'},
  {plu:'01002', name:'进口香蕉',   price:8.90,  unit:'kg'},
  {plu:'01003', name:'巨峰葡萄',   price:19.80, unit:'kg'},
  {plu:'01004', name:'水蜜桃',     price:25.60, unit:'kg'},
  {plu:'01005', name:'脐橙',       price:9.90,  unit:'kg'},
  {plu:'01006', name:'草莓',       price:32.00, unit:'kg'},
  {plu:'01007', name:'红提',       price:22.00, unit:'kg'},
  {plu:'02001', name:'猪五花肉',   price:28.00, unit:'kg'},
  {plu:'02002', name:'牛腩',       price:45.00, unit:'kg'},
  {plu:'02003', name:'鸡胸肉',     price:18.50, unit:'kg'},
  {plu:'02004', name:'排骨',       price:38.00, unit:'kg'},
  {plu:'02005', name:'牛腱子',     price:52.00, unit:'kg'},
  {plu:'03001', name:'大白菜',     price:2.50,  unit:'kg'},
  {plu:'03002', name:'土豆',       price:3.80,  unit:'kg'},
  {plu:'03003', name:'番茄',       price:6.50,  unit:'kg'},
  {plu:'03004', name:'黄瓜',       price:5.80,  unit:'kg'},
  {plu:'03005', name:'西兰花',     price:11.00, unit:'kg'},
  {plu:'03006', name:'菠菜',       price:7.20,  unit:'kg'},
  {plu:'04001', name:'草鸡蛋',     price:15.00, unit:'kg'},
  {plu:'04002', name:'鲜牛奶',     price:18.90, unit:'瓶'},
  {plu:'05001', name:'散装大米',   price:5.60,  unit:'kg'},
  {plu:'05002', name:'散装面粉',   price:4.80,  unit:'kg'},
];

// 交班模拟：根据期间收款总额生成 mock 订单列表
function simGenOrders(totalAmt, cashAmt, startTime, endTime) {
  var count = 25 + Math.floor(Math.random() * 21); // 25~45 笔
  var orders = [];
  // 随机权重分配总金额
  var weights = [];
  var wsum = 0;
  for (var i = 0; i < count; i++) { var w = 0.3 + Math.random() * 1.7; weights.push(w); wsum += w; }
  var cashPool = cashAmt;
  var onlinePool = totalAmt - cashAmt;
  var remaining = totalAmt;

  for (var i = 0; i < count; i++) {
    var prod = SH_SIM_PRODUCTS[Math.floor(Math.random() * SH_SIM_PRODUCTS.length)];
    var amt = (i === count - 1) ? Math.round(remaining * 100) / 100 : Math.round(totalAmt * (weights[i] / wsum) * 100) / 100;
    if (amt < 1) amt = Math.round((1 + Math.random() * 5) * 100) / 100;
    remaining -= amt;
    var weight = Math.round(amt / prod.price * 1000) / 1000; // 保留3位小数
    if (prod.unit === '瓶') weight = Math.round(amt / prod.price);
    var ts = startTime.getTime() + (i / count) * (endTime.getTime() - startTime.getTime()) + Math.random() * ((endTime.getTime() - startTime.getTime()) / count);
    var t = new Date(ts);
    // 支付方式：尽量匹配 cashAmt 比例
    var method;
    if (cashPool > 0 && (Math.random() < cashAmt / totalAmt || onlinePool <= 0)) {
      method = '现金'; cashPool -= amt;
    } else {
      method = Math.random() < 0.55 ? '微信支付' : '支付宝';
      onlinePool -= amt;
    }
    orders.push({
      seq: i + 1,
      plu: prod.plu,
      name: prod.name,
      weight: weight,
      price: prod.price,
      unit: prod.unit,
      amount: Math.round(amt * 100) / 100,
      time: String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0') + ':' + String(t.getSeconds()).padStart(2,'0'),
      method: method
    });
  }
  // 按时间排序并重新编号
  orders.sort(function(a,b) { return a.time.localeCompare(b.time); });
  for (var j = 0; j < orders.length; j++) { orders[j].seq = j + 1; }
  return orders;
}

// 交班模拟：生成当班 mock 数据（门店、人员、上岗时间、期间收款等）
function simGenShiftData(staffOverride) {
  var now = new Date();
  var store = SH_SIM_STORES[Math.floor(Math.random() * SH_SIM_STORES.length)];
  var staff = staffOverride || SH_SIM_STAFF[Math.floor(Math.random() * SH_SIM_STAFF.length)];
  // 上岗时间：今天 06:00~10:00 之间随机
  var startHour = 6 + Math.floor(Math.random() * 5);
  var startMin  = Math.floor(Math.random() * 60);
  var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin, 0);
  // 期间收款 mock
  var totalAmt   = Math.round((8000 + Math.random() * 17000) * 100) / 100; // ¥8000~¥25000
  var onlineRate = 0.55 + Math.random() * 0.25; // 55%~80%
  var onlineAmt = Math.round(totalAmt * onlineRate * 100) / 100;
  var cashAmt   = Math.round((totalAmt - onlineAmt) * 100) / 100;
  var pettyCash = [200, 300, 500, 800, 1000][Math.floor(Math.random() * 5)];
  // 生成 mock 订单
  var orders = simGenOrders(totalAmt, cashAmt, startTime, now);
  // 从订单重新计算精确金额（消除舍入误差）
  totalAmt = Math.round(orders.reduce(function(s,o){return s+o.amount;},0) * 100) / 100;
  cashAmt = Math.round(orders.filter(function(o){return o.method==='现金';}).reduce(function(s,o){return s+o.amount;},0) * 100) / 100;
  onlineAmt = Math.round((totalAmt - cashAmt) * 100) / 100;
  return {
    store: store,
    staff: staff,
    startTime: startTime,
    startStr: simFmtTime(startTime),
    totalAmt: totalAmt,
    onlineAmt: onlineAmt,
    cashAmt: cashAmt,
    pettyCash: pettyCash,
    orders: orders
  };
}

function simFmtTime(d) {
  var Y = d.getFullYear(), M = String(d.getMonth()+1).padStart(2,'0'),
      D = String(d.getDate()).padStart(2,'0'), H = String(d.getHours()).padStart(2,'0'),
      m = String(d.getMinutes()).padStart(2,'0'), s = String(d.getSeconds()).padStart(2,'0');
  return Y + '-' + M + '-' + D + ' ' + H + ':' + m + ':' + s;
}

function simFmtDuration(ms) {
  var totalMin = Math.floor(ms / 60000);
  var h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h + '小时' + String(m).padStart(2, '0') + '分';
}

// 实时刷新当前时间和在岗时长的定时器 ID
var _simTimer = null;

function openShiftSimModal(staffOverride) {
  var overlay = document.getElementById('shiftSimOverlay');
  var body = document.getElementById('shiftSimModalBody');
  var data = simGenShiftData(staffOverride);

  body.innerHTML =
    // ===== 门店 / 人员（不可选，仅展示） =====
    '<div style="display:flex;gap:24px;margin-bottom:20px;padding:12px 16px;background:#fff;border:1px solid #e8e8e8;border-radius:4px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:12px;color:#999;font-weight:500">门店</span>' +
        '<span id="simStore" style="font-size:14px;font-weight:700;color:#333">' + data.store + '</span>' +
      '</div>' +
      '<div style="width:1px;background:#e8e8e8"></div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:12px;color:#999;font-weight:500">人员</span>' +
        '<span id="simStaff" style="font-size:14px;font-weight:700;color:#333">' + data.staff + '</span>' +
      '</div>' +
    '</div>' +

    // ===== 基本信息 =====
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">' +
      '<div style="background:#f8fafc;border-radius:4px;padding:12px 16px">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px;font-weight:500">上岗时间</div>' +
        '<div id="simStartTime" style="font-size:15px;font-weight:700;color:#333;font-family:\'SF Mono\',Menlo,monospace">' + data.startStr + '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;border-radius:4px;padding:12px 16px">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px;font-weight:500">当前时间</div>' +
        '<div id="simNowTime" style="font-size:15px;font-weight:700;color:#333;font-family:\'SF Mono\',Menlo,monospace">' + simFmtTime(new Date()) + '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;border-radius:4px;padding:12px 16px">' +
        '<div style="font-size:11px;color:#999;margin-bottom:4px;font-weight:500">在岗时长</div>' +
        '<div id="simDuration" style="font-size:15px;font-weight:700;color:#005CF5;font-family:\'SF Mono\',Menlo,monospace">' + simFmtDuration(Date.now() - data.startTime.getTime()) + '</div>' +
      '</div>' +
    '</div>' +

    // ===== 在岗期间收款 =====
    '<div style="margin-bottom:20px">' +
      '<div style="font-size:12px;font-weight:700;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:3px;height:14px;background:#005CF5;border-radius:2px"></span>在岗期间收款<span id="simOrderCount" style="font-weight:400;font-size:12px;color:#888;margin-left:8px"></span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">' +
        '<div style="background:#fff;border:1px solid #e8e8e8;border-radius:4px;padding:14px 16px">' +
          '<div style="font-size:11px;color:#999;margin-bottom:6px;font-weight:500">应收款总额</div>' +
          '<div id="simTotalAmt" style="font-size:20px;font-weight:800;color:#005CF5">¥' + data.totalAmt.toFixed(2) + '</div>' +
        '</div>' +
        '<div style="background:#fff;border:1px solid #e8e8e8;border-radius:4px;padding:14px 16px">' +
          '<div style="font-size:11px;color:#999;margin-bottom:6px;font-weight:500">线上收款</div>' +
          '<div id="simOnlineAmt" style="font-size:20px;font-weight:800;color:#7b1fa2">¥' + data.onlineAmt.toFixed(2) + '</div>' +
        '</div>' +
        '<div style="background:#fff;border:1px solid #e8e8e8;border-radius:4px;padding:14px 16px">' +
          '<div style="font-size:11px;color:#999;margin-bottom:6px;font-weight:500">现金收款</div>' +
          '<div id="simCashAmt" style="font-size:20px;font-weight:800;color:#fc4b52">¥' + data.cashAmt.toFixed(2) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ===== 交班结算 =====
    '<div style="margin-bottom:20px">' +
      '<div style="font-size:12px;font-weight:700;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:3px;height:14px;background:#ff8f00;border-radius:2px"></span>交班结算</div>' +
      '<div style="background:#fff;border:1px solid #e8e8e8;border-radius:6px;padding:0">' +
        // 第一行：结果展示 —— 现金收款 | 应缴现金 | 长短款
        '<div style="display:flex;align-items:stretch;gap:0;padding:0;border-bottom:1px dashed #e8e8e8;flex-wrap:wrap">' +
          // 现金收款
          '<div style="flex:1;min-width:90px;padding:14px 12px;text-align:center">' +
            '<div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:500">现金收款</div>' +
            '<div style="font-size:16px;font-weight:800;color:#fc4b52">¥' + data.cashAmt.toFixed(2) + '</div>' +
          '</div>' +
          // 应缴现金
          '<div style="flex:1;min-width:90px;padding:14px 12px;text-align:center;border-left:1px solid #f0f0f0">' +
            '<div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:500">应缴现金</div>' +
            '<div id="simDueCash" style="font-size:16px;font-weight:800;color:#ff8f00">¥' + Math.max(data.cashAmt - data.pettyCash, 0).toFixed(2) + '</div>' +
          '</div>' +
          // 长短款
          '<div id="simOverShortBox" style="flex:1;min-width:100px;padding:10px 12px;text-align:center;border-left:1px solid #f0f0f0;background:#fafafa">' +
            '<div style="font-size:10px;color:#999;margin-bottom:4px;font-weight:500">长短款</div>' +
            '<div id="simOverShort" style="font-size:20px;font-weight:800;color:#999;font-family:\'SF Mono\',Menlo,monospace;line-height:1.2">--</div>' +
          '</div>' +
        '</div>' +
        // 第二行：输入区 —— 备用金 | 实缴金额
        '<div style="display:flex;align-items:stretch;gap:0;padding:0;flex-wrap:wrap">' +
          // 备用金
          '<div style="flex:1;min-width:120px;padding:14px 12px;text-align:center">' +
            '<div style="font-size:10px;color:#666;margin-bottom:6px;font-weight:500">备用金（元）</div>' +
            '<input type="number" id="simPettyCash" value="' + data.pettyCash + '" style="width:100%;max-width:160px;text-align:center;padding:10px 8px;border:2px solid #ff8f00;border-radius:4px;font-size:18px;font-weight:800;font-family:\'SF Mono\',Menlo,monospace;outline:none;background:#fff8e1;box-sizing:border-box" min="0" step="0.01" oninput="simCalc()" inputmode="decimal">' +
          '</div>' +
          // 分隔
          '<div style="width:1px;align-self:stretch;background:#f0f0f0;flex-shrink:0;margin:10px 0"></div>' +
          // 实缴金额
          '<div style="flex:1;min-width:140px;padding:14px 12px;text-align:center">' +
            '<div style="font-size:10px;color:#666;margin-bottom:6px;font-weight:500">实缴金额（元）</div>' +
            '<input type="number" id="simActualCash" style="width:100%;max-width:200px;text-align:center;padding:10px 8px;border:2px solid #005CF5;border-radius:4px;font-size:18px;font-weight:800;font-family:\'SF Mono\',Menlo,monospace;color:#005CF5;outline:none;background:#f8fbff;box-sizing:border-box" min="0" step="0.01" oninput="simCalc()" placeholder="输入金额" inputmode="decimal">' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ===== 备注 =====
    '<div style="margin-bottom:16px">' +
      '<label style="display:block;font-size:12px;color:#666;margin-bottom:5px;font-weight:500">备注</label>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">' +
        SH_SIM_REMARK_PRESETS.map(function(p) { return '<span style="display:inline-block;padding:3px 10px;border:1px solid #d0d0d0;border-radius:4px;font-size:11px;color:#666;cursor:pointer;background:#fafafa;transition:all .15s" onmouseover="this.style.borderColor=\'#005CF5\';this.style.color=\'#005CF5\';this.style.background=\'#f0f5ff\'" onmouseout="this.style.borderColor=\'#d0d0d0\';this.style.color=\'#666\';this.style.background=\'#fafafa\'" onclick="simFillRemark(\'' + p + '\')">' + p + '</span>'; }).join('') +
      '</div>' +
      '<textarea id="simRemark" style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:4px;font-size:12px;background:#fff;outline:none;resize:vertical;min-height:56px" placeholder="可选填备注信息，也可点击上方标签快速填入"></textarea>' +
    '</div>' +

    // ===== 操作按钮 =====
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-bottom:20px">' +
      '<button class="ic-btn" style="background:#3949ab;color:#fff;border-color:#3949ab;font-weight:600;font-size:14px;padding:0 28px" onclick="simSubmit(\'换班\')">确认换班</button>' +
      '<button class="ic-btn" style="background:#e65100;color:#fff;border-color:#e65100;font-weight:600;font-size:14px;padding:0 28px" onclick="simSubmit(\'下班\')">确认下班</button>' +
    '</div>';

  // 保存当班数据供后续计算使用
  body._shiftData = data;

  // 启动实时时钟
  clearInterval(_simTimer);
  _simTimer = setInterval(function() {
    var now2 = new Date();
    var el = document.getElementById('simNowTime');
    if (el) el.textContent = simFmtTime(now2);
    var du = document.getElementById('simDuration');
    if (du && body._shiftData) du.textContent = simFmtDuration(now2.getTime() - body._shiftData.startTime.getTime());
  }, 1000);

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  var cntEl = document.getElementById('simOrderCount');
  if (cntEl) cntEl.textContent = '（' + data.orders.length + ' 笔订单）';
}

function simFillRemark(text) {
  var ta = document.getElementById('simRemark');
  if (!ta) return;
  var cur = ta.value.trim();
  ta.value = cur ? cur + '；' + text : text;
  ta.focus();
}

function simCalc() {
  var body = document.getElementById('shiftSimModalBody');
  var data = body ? body._shiftData : null;
  if (!data) return;

  var pettyCash  = parseFloat(document.getElementById('simPettyCash').value) || data.pettyCash;
  var actualCash = parseFloat(document.getElementById('simActualCash').value) || 0;
  var dueCash    = Math.max(data.cashAmt - pettyCash, 0);
  var overShort  = actualCash - dueCash;

  // 更新应缴现金
  document.getElementById('simDueCash').textContent = '¥' + dueCash.toFixed(2);

  var osEl = document.getElementById('simOverShort');
  var osBox = document.getElementById('simOverShortBox');
  if (actualCash === 0) {
    osEl.textContent = '--';
    osEl.style.color = '#999';
    if (osBox) { osBox.style.background = '#fafafa'; osBox.style.borderLeftColor = '#f0f0f0'; }
  } else {
    osEl.textContent = (overShort >= 0 ? '+' : '') + '¥' + overShort.toFixed(2);
    osEl.style.color = overShort > 0 ? '#2e7d32' : overShort < 0 ? '#fc4b52' : '#666';
    if (osBox) {
      osBox.style.background = overShort > 0 ? '#e8f5e9' : overShort < 0 ? '#ffebee' : '#fafafa';
      osBox.style.borderLeftColor = overShort > 0 ? '#c8e6c9' : overShort < 0 ? '#ffcdd2' : '#f0f0f0';
    }
  }
}

function simSubmit(type) {
  var body = document.getElementById('shiftSimModalBody');
  var data = body ? body._shiftData : null;
  if (!data) return;

  var remark = (document.getElementById('simRemark').value || '').trim();
  var pettyCash  = parseFloat(document.getElementById('simPettyCash').value) || data.pettyCash;
  var actualCash = parseFloat(document.getElementById('simActualCash').value) || 0;
  var dueCash    = Math.max(data.cashAmt - pettyCash, 0);
  var overShort  = actualCash - dueCash;
  var nowStr     = simFmtTime(new Date());
  var duration   = simFmtDuration(Date.now() - data.startTime.getTime());

  var record = {
    id: Date.now(),
    type:       type,
    store:      data.store,
    staff:      data.staff,
    startTime:  data.startStr,
    endTime:    nowStr,
    duration:   duration,
    totalAmt:   data.totalAmt,
    onlineAmt:  data.onlineAmt,
    cashAmt:    data.cashAmt,
    pettyCash:   pettyCash,
    dueCash:     dueCash,
    actualCash:  actualCash,
    overShort:   overShort,
    orderCount:  data.orders ? data.orders.length : 0,
    remark:      remark
  };

  SH_SIM_RECORDS.unshift(record);
  saveSimRecords();

  // 同步写入交班记录（SH_MOCK_RECORDS）
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  var startTime = data.startStr.split(' ')[1] || data.startStr;
  var endTime   = nowStr.split(' ')[1] || nowStr;
  var terminals = SH_TERMINALS && SH_TERMINALS[data.store] ? SH_TERMINALS[data.store] : ['电子秤01'];
  var termId = terminals[Math.floor(Math.random() * terminals.length)];
  var shRecord = {
    _v: 2,
    date: todayStr,
    store: data.store,
    staff: data.staff,
    startTime: startTime,
    endTime: endTime,
    duration: duration,
    startTerminal: termId,
    endTerminal: termId,
    pettyCash: pettyCash,
    totalAmount: data.totalAmt,
    cashAmount: data.cashAmt,
    dueCash: dueCash,
    actualCash: actualCash,
    overShort: overShort,
    onlineAmount: data.onlineAmt,
    orderCount: data.orders ? data.orders.length : 0,
    note: remark || '交班正常'
  };
  if (!SH_MOCK_RECORDS) SH_MOCK_RECORDS = [];
  SH_MOCK_RECORDS.unshift(shRecord);
  try { localStorage.setItem('SH_MOCK_RECORDS', JSON.stringify(SH_MOCK_RECORDS)); } catch(e) {}

  simReset();
  showToast('交班记录已提交');
}

function simReset() {
  // 重新生成一班 mock 数据
  var body = document.getElementById('shiftSimModalBody');
  if (body) {
    var curStaff = body._shiftData ? body._shiftData.staff : null;
    var data = simGenShiftData(curStaff);
    body._shiftData = data;

    // 更新显示
    var el;
    el = document.getElementById('simStore');       if (el) el.textContent = data.store;
    el = document.getElementById('simStaff');       if (el) el.textContent = data.staff;
    el = document.getElementById('simStartTime');  if (el) el.textContent = data.startStr;
    el = document.getElementById('simNowTime');    if (el) el.textContent = simFmtTime(new Date());
    el = document.getElementById('simDuration');    if (el) el.textContent = simFmtDuration(Date.now() - data.startTime.getTime());
    el = document.getElementById('simTotalAmt');   if (el) el.textContent = '¥' + data.totalAmt.toFixed(2);
    el = document.getElementById('simOnlineAmt');  if (el) el.textContent = '¥' + data.onlineAmt.toFixed(2);
    el = document.getElementById('simCashAmt');    if (el) el.textContent = '¥' + data.cashAmt.toFixed(2);
    el = document.getElementById('simPettyCash');  if (el) el.value = data.pettyCash;
    el = document.getElementById('simDueCash');     if (el) el.textContent = '¥' + (data.cashAmt + data.pettyCash).toFixed(2);
    el = document.getElementById('simActualCash');  if (el) el.value = '';
    el = document.getElementById('simOverShort');   if (el) { el.textContent = '--'; el.style.color = '#999'; }
    el = document.getElementById('simOverShortBox'); if (el) { el.style.background = '#fafafa'; el.style.borderLeftColor = '#f0f0f0'; }
    el = document.getElementById('simRemark');      if (el) el.value = '';
    // 更新订单数量
    el = document.getElementById('simOrderCount'); if (el) el.textContent = '（' + data.orders.length + ' 笔订单）';
  }
}

// 关闭弹框时清除定时器
function closeShiftSimModal() {
  clearInterval(_simTimer);
  _simTimer = null;
  var overlay = document.getElementById('shiftSimOverlay');
  overlay.style.display = 'none';
  document.body.style.overflow = '';
  // 关闭弹框后刷新交班记录页
  if (typeof shSearch === 'function') shSearch();
}

// ========== PAGE: 商品分类 (Goods Class) ==========================
// ========== 商品分类数据 ==========================
var GOODS_CATEGORIES = [
  { id: '_uncategorized', name: '未分类', hidden: true, sort: 9999, color: '#ccc' },
  { id: 'c1', name: '蔬菜', hidden: false, sort: 0, color: '#005CF5' },
  { id: 'c2', name: '水果', hidden: false, sort: 1, color: '#3EB27E' },
  { id: 'c3', name: '肉禽蛋', hidden: false, sort: 2, color: '#F5A623' },
  { id: 'c4', name: '水产', hidden: false, sort: 3, color: '#9B59B6' },
  { id: 'c5', name: '粮油调味', hidden: false, sort: 4, color: '#E74C3C' },
  { id: 'c6', name: '乳制品', hidden: false, sort: 5, color: '#1ABC9C' },
  { id: 'c7', name: '休闲零食', hidden: false, sort: 6, color: '#F39C12' },
  { id: 'c8', name: '酒水饮料', hidden: false, sort: 7, color: '#3498DB' }
];

// 排序模式状态
var GC_SORT_MODE = false;      // 是否处于排序模式
var GC_SORT_SNAPSHOT = null;   // 进入排序模式前的 sort 快照 [{id, sort}, ...]

// 当前用户角色（Mock: 'enterprise' | 'store'）
var CURRENT_USER_ROLE = 'enterprise';

// 获取分类列表（不含隐藏的"未分类"，按 sort 排序，用于管理页面展示）
function getVisibleCategories() {
  return GOODS_CATEGORIES.filter(function(c) { return !c.hidden; }).sort(function(a, b) { return a.sort - b.sort; });
}

// 根据ID获取分类名称
function getCategoryName(catId) {
  var cat = GOODS_CATEGORIES.find(function(c) { return c.id === catId; });
  return cat ? cat.name : '未分类';
}

// 新增分类（自动排在末尾）
function addCategory(name) {
  var id = 'c' + (Date.now());  // 用时间戳避免 id 冲突
  var maxSort = 0;
  GOODS_CATEGORIES.forEach(function(c) { if (c.sort > maxSort) maxSort = c.sort; });
  // 从调色板中挑一个未被使用的颜色，都用过了则随机取
  var usedColors = GOODS_CATEGORIES.map(function(c) { return c.color; });
  var avail = CATEGORY_COLORS.filter(function(clr) { return usedColors.indexOf(clr) === -1; });
  var color = avail.length > 0 ? avail[0] : CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
  GOODS_CATEGORIES.push({ id: id, name: name, hidden: false, sort: maxSort + 1, color: color });
  return id;
}

// 编辑分类
function updateCategory(id, name) {
  var cat = GOODS_CATEGORIES.find(function(c) { return c.id === id; });
  if (cat && !cat.hidden) cat.name = name;
}

// 删除分类（删除后该分类下商品自动归到"未分类"）
function deleteCategory(id) {
  var idx = GOODS_CATEGORIES.findIndex(function(c) { return c.id === id; });
  if (idx !== -1 && !GOODS_CATEGORIES[idx].hidden) {
    GOODS_CATEGORIES.splice(idx, 1);
    // 将商品列表中该分类的商品归到"未分类"
    if (typeof GL_MOCK_DATA !== 'undefined') {
      GL_MOCK_DATA.forEach(function(item) {
        if (item.categoryId === id) item.categoryId = '_uncategorized';
      });
    }
  }
}

// ========== 全局当前选中的分类（用于商品列表联动） ==========
var GL_FILTER_CATEGORY = '';  // ''=全部

// ========== PAGE: 商品分类 ==========================
function initGoodsClass() {
  var el = document.getElementById('goodsClassContent');
  if (!el) return;

  var categories = getVisibleCategories();

  el.innerHTML =
    '<div style="background:#fff;flex:1;display:flex;flex-direction:column;overflow:hidden">' +
      // 顶部操作栏：按钮统一左侧
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-bottom:1px solid #f0f0f0">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          (GC_SORT_MODE ?
            '<button class="ic-btn ic-btn-pri" onclick="gcSaveSort()">保存排序</button>' +
            '<button class="ic-btn" onclick="gcCancelSort()" style="color:#e05555;border-color:#e05555">取消</button>' +
            '<span style="font-size:12px;color:#005CF5;margin-left:6px">拖拽卡片调整顺序</span>'
            :
            (CURRENT_USER_ROLE === 'enterprise' ?
              '<button class="ic-btn ic-btn-pri" onclick="showAddCategoryDialog()"><span style="margin-right:3px;font-size:12px">+</span>新增分类</button>' +
              '<button class="ic-btn" onclick="gcEnterSortMode()">排序</button>' +
              '<button class="ic-btn" onclick="window.open(\'prd-goods-category.html\',\'_blank\')" style="font-size:12px;color:#888;border-color:#ddd" title="查看产品需求文档">产品需求文档</button>'
              :
              '<span style="font-size:12px;color:#999;background:#f5f6f8;padding:3px 10px;border-radius:6px;border:1px solid #e8e8e8">🔒 仅查看</span>' +
              '<button class="ic-btn" onclick="window.open(\'prd-goods-category.html\',\'_blank\')" style="font-size:12px;color:#888;border-color:#ddd" title="查看产品需求文档">产品需求文档</button>'
            )
          ) +
        '</div>' +
        '<span style="font-size:12px;color:#999;background:#f5f6f8;padding:2px 10px;border-radius:10px">' + categories.length + ' 个分类</span>' +
      '</div>' +
      // 分类列表
      '<div id="categoryList" style="flex:1;overflow:auto;padding:16px 24px">' +
        renderCategoryList(categories) +
      '</div>' +
    '</div>';

  // 挂载弹窗容器
  if (!document.getElementById('categoryDialog')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div id="categoryDialog" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background:rgba(0,0,0,0.35);justify-content:center;align-items:center">' +
      '</div>'
    );
  }

  // 排序模式下初始化拖拽
  if (GC_SORT_MODE) {
    setTimeout(function() { initCategoryDragSort(); }, 50);
  }
}

// 渲染分类列表（卡片网格 + 排序模式支持）
function renderCategoryList(categories) {
  if (!categories || categories.length === 0) {
    return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 0;color:#bbb;font-size:14px">' +
             '<div style="font-size:48px;margin-bottom:12px;color:#e0e0e0">📂</div>' +
             '暂无分类，点击"新增分类"创建' +
           '</div>';
  }

  var cardsHtml = categories.map(function(cat, index) {
      var count = getCategoryItemCount(cat.id);
      var dragAttrs = GC_SORT_MODE ? ' class="cat-drag-row" draggable="true" data-cat-id="' + cat.id + '"' : '';
      var handleHtml = GC_SORT_MODE
        ? '<span class="cat-drag-handle" style="cursor:grab;color:#ccc;font-size:16px;flex-shrink:0;user-select:none;margin-right:4px" title="拖拽排序">☰</span>'
        : '';
      var actionHtml = GC_SORT_MODE
        ? '<span style="font-size:12px;color:#ccc;padding:4px 10px">拖拽排序中</span>'
        : (CURRENT_USER_ROLE === 'enterprise'
            ? '<span onclick="event.stopPropagation();showEditCategoryDialog(\'' + cat.id + '\')" style="font-size:12px;color:#005CF5;cursor:pointer;padding:4px 8px;border-radius:4px;hover:background:#f0f0f0">编辑</span>' +
              '<span onclick="event.stopPropagation();confirmDeleteCategory(\'' + cat.id + '\')" style="font-size:12px;color:#e05555;cursor:pointer;padding:4px 8px;border-radius:4px;hover:background:#fff0f0">删除</span>'
            : '<span style="font-size:11px;color:#bbb;background:#f5f6f8;padding:2px 8px;border-radius:6px">🔒 仅查看</span>'
          );
      var cursorStyle = GC_SORT_MODE ? 'cursor:grab' : 'cursor:pointer';

      return '<div id="cat-card-' + cat.id + '"' + dragAttrs +
               ' onclick="' + (GC_SORT_MODE ? 'event.stopPropagation()' : 'gcGoToGoodsList(\'' + cat.id + '\')') + '"' +
               ' style="background:#fff;border:1px solid #eceef2;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px;' + cursorStyle + ';transition:all .15s">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          handleHtml +
          '<div style="width:8px;height:8px;border-radius:50%;background:' + getCategoryColor(cat.id) + ';flex-shrink:0"></div>' +
          '<div style="font-size:14px;font-weight:600;color:#1D2440;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(cat.name) + '</div>' +
          '<span style="font-size:12px;color:#999;flex-shrink:0">' + count + ' 件</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;border-top:1px solid #f5f5f5;padding-top:8px">' +
          actionHtml +
        '</div>' +
      '</div>';
    }).join('');

  return '<div id="catListContainer" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">' +
    cardsHtml +
    '<div style="background:#fafbfc;border:1px dashed #ddd;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px;opacity:0.65;cursor:default">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<div style="width:8px;height:8px;border-radius:50%;background:#ccc;flex-shrink:0"></div>' +
        '<div style="font-size:14px;font-weight:600;color:#999;flex:1;min-width:0">未分类</div>' +
        '<span style="font-size:12px;color:#999;flex-shrink:0">' + getCategoryItemCount('_uncategorized') + ' 件</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;border-top:1px solid #f5f5f5;padding-top:8px">' +
        '<span style="font-size:11px;color:#bbb;background:#eee;padding:2px 8px;border-radius:6px">系统</span>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// 初始化分类列表的拖拽排序（仅排序模式下生效）
function initCategoryDragSort() {
  var container = document.getElementById('catListContainer');
  if (!container) return;

  var dragEl = null;

  container.addEventListener('dragstart', function(e) {
    var row = e.target.closest('.cat-drag-row');
    if (!row) { e.preventDefault(); return; }
    dragEl = row;
    row.style.opacity = '0.4';
    row.style.borderColor = '#005CF5';
    row.style.boxShadow = '0 0 0 2px rgba(0,92,245,0.2)';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', row.dataset.catId);
  });

  container.addEventListener('dragend', function(e) {
    var row = e.target.closest('.cat-drag-row');
    if (row) {
      row.style.opacity = '';
      row.style.borderColor = '';
      row.style.boxShadow = '';
    }
    // 清除所有指示
    var rows = container.querySelectorAll('.cat-drag-row');
    rows.forEach(function(r) {
      r.style.border = '';
      r.style.boxShadow = '';
    });
    dragEl = null;
  });

  container.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var row = e.target.closest('.cat-drag-row');
    if (!row || row === dragEl) return;

    var rect = row.getBoundingClientRect();
    var midX = rect.left + rect.width / 2;
    var midY = rect.top + rect.height / 2;

    // 清除所有指示
    var rows = container.querySelectorAll('.cat-drag-row');
    rows.forEach(function(r) {
      r.style.boxShadow = '';
      r.style.border = '';
    });

    if (e.clientX < midX) {
      row.style.borderLeft = '3px solid #005CF5';
    } else if (e.clientY < midY) {
      row.style.borderTop = '3px solid #005CF5';
    } else {
      row.style.borderBottom = '3px solid #005CF5';
    }
  });

  container.addEventListener('dragleave', function(e) {
    var row = e.target.closest('.cat-drag-row');
    if (row && row !== dragEl) {
      row.style.border = '';
      row.style.boxShadow = '';
    }
  });

  container.addEventListener('drop', function(e) {
    e.preventDefault();
    var targetRow = e.target.closest('.cat-drag-row');
    if (!targetRow || !dragEl || targetRow === dragEl) return;

    var catId = dragEl.dataset.catId;
    var targetId = targetRow.dataset.catId;

    var rect = targetRow.getBoundingClientRect();
    var midX = rect.left + rect.width / 2;
    var midY = rect.top + rect.height / 2;

    var cats = getVisibleCategories();
    var fromIdx = cats.findIndex(function(c) { return c.id === catId; });
    var toIdx = cats.findIndex(function(c) { return c.id === targetId; });
    if (fromIdx === -1 || toIdx === -1) return;

    // 根据落点判断插入位置
    if (e.clientX < midX) {
      // 插到目标前面
    } else if (e.clientY < midY) {
      // 插到目标前面
    } else {
      toIdx += 1; // 插到目标后面
    }

    if (fromIdx < toIdx) toIdx -= 1;
    var moved = cats.splice(fromIdx, 1)[0];
    cats.splice(toIdx, 0, moved);

    // 更新 sort 值
    cats.forEach(function(c, i) {
      var catInMaster = GOODS_CATEGORIES.find(function(m) { return m.id === c.id; });
      if (catInMaster) catInMaster.sort = i + 1;
    });

    // 重新渲染 + 重新绑定拖拽
    refreshCategoryList();
    setTimeout(function() { initCategoryDragSort(); }, 50);
  });
}

// 刷新分类列表（保持排序模式状态）
function refreshCategoryList() {
  var listEl = document.getElementById('categoryList');
  if (!listEl) return;
  var categories = getVisibleCategories();
  listEl.innerHTML = renderCategoryList(categories);
}

// 点击分类卡片，跳转商品列表并定位到该分类
function gcGoToGoodsList(catId) {
  GL_FILTER_CATEGORY = catId || '';
  GL_PAGE = 1;
  GL_SELECTED_ID = null;
  switchPage('goods-list');
}

// 进入排序模式
function gcEnterSortMode() {
  // 快照当前 sort 值
  GC_SORT_SNAPSHOT = GOODS_CATEGORIES.map(function(c) { return { id: c.id, sort: c.sort }; });
  GC_SORT_MODE = true;
  // 重绘整个页面以更新按钮状态
  initGoodsClass();
}

// 保存排序
function gcSaveSort() {
  GC_SORT_MODE = false;
  GC_SORT_SNAPSHOT = null;
  initGoodsClass();
}

// 取消排序（恢复快照）
function gcCancelSort() {
  if (GC_SORT_SNAPSHOT) {
    GC_SORT_SNAPSHOT.forEach(function(s) {
      var cat = GOODS_CATEGORIES.find(function(c) { return c.id === s.id; });
      if (cat) cat.sort = s.sort;
    });
  }
  GC_SORT_MODE = false;
  GC_SORT_SNAPSHOT = null;
  initGoodsClass();
}

// 给每个分类分配一个颜色（用于圆点标识）
var CATEGORY_COLORS = ['#005CF5','#3EB27E','#F5A623','#9B59B6','#E74C3C','#1ABC9C','#F39C12','#3498DB','#E67E22','#2ECC71'];
function getCategoryColor(catId) {
  var cat = GOODS_CATEGORIES.find(function(c) { return c.id === catId; });
  return cat && cat.color ? cat.color : '#ccc';
}

// 获取某分类下的商品数量
function getCategoryItemCount(catId) {
  if (typeof GL_MOCK_DATA === 'undefined') return 0;
  return GL_MOCK_DATA.filter(function(item) { return item.categoryId === catId; }).length;
}

// 搜索过滤分类
function filterCategories(keyword) {
  var filtered = getVisibleCategories().filter(function(cat) {
    return !keyword || cat.name.indexOf(keyword) !== -1;
  });
  document.getElementById('categoryList').innerHTML = renderCategoryList(filtered);
  // 排序模式下重新绑定拖拽
  if (GC_SORT_MODE) {
    setTimeout(function() { initCategoryDragSort(); }, 50);
  }
}

// ========== 新增分类弹窗 ==========
function showAddCategoryDialog() {
  var dialog = document.getElementById('categoryDialog');
  dialog.innerHTML =
    '<div style="background:#fff;border-radius:12px;width:420px;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">' +
      '<div style="padding:18px 24px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">' +
        '<div style="font-size:15px;font-weight:600;color:#1D2440">新增分类</div>' +
        '<span onclick="closeCategoryDialog()" style="cursor:pointer;font-size:18px;color:#ccc;hover:color:#999">&times;</span>' +
      '</div>' +
      '<div style="padding:24px">' +
        '<div style="margin-bottom:16px">' +
          '<div style="font-size:12px;color:#666;margin-bottom:6px">分类名称 <span style="color:#e05555">*</span></div>' +
          '<input type="text" id="categoryNameInput" placeholder="请输入分类名称" maxlength="20" ' +
            'style="width:100%;height:36px;padding:0 12px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" />' +
        '</div>' +
      '</div>' +
      '<div style="padding:14px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">' +
        '<button class="ic-btn" onclick="closeCategoryDialog()">取消</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="doAddCategory()">确定</button>' +
      '</div>' +
    '</div>';
  dialog.style.display = 'flex';
  setTimeout(function() { document.getElementById('categoryNameInput').focus(); }, 100);
}

// 执行新增分类
function doAddCategory() {
  var name = document.getElementById('categoryNameInput').value.trim();
  if (!name) { alert('请输入分类名称'); return; }
  // 检查重名
  if (GOODS_CATEGORIES.some(function(c) { return c.name === name && !c.hidden; })) {
    alert('已存在同名分类，请更换名称');
    return;
  }
  addCategory(name);
  closeCategoryDialog();
  initGoodsClass();  // 刷新页面
}

// ========== 编辑分类弹窗 ==========
function showEditCategoryDialog(id) {
  var cat = GOODS_CATEGORIES.find(function(c) { return c.id === id; });
  if (!cat || cat.hidden) return;

  var dialog = document.getElementById('categoryDialog');
  dialog.innerHTML =
    '<div style="background:#fff;border-radius:12px;width:420px;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">' +
      '<div style="padding:18px 24px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">' +
        '<div style="font-size:15px;font-weight:600;color:#1D2440">编辑分类</div>' +
        '<span onclick="closeCategoryDialog()" style="cursor:pointer;font-size:18px;color:#ccc;hover:color:#999">&times;</span>' +
      '</div>' +
      '<div style="padding:24px">' +
        '<div style="margin-bottom:16px">' +
          '<div style="font-size:12px;color:#666;margin-bottom:6px">分类名称 <span style="color:#e05555">*</span></div>' +
          '<input type="text" id="categoryNameInput" value="' + escapeHtml(cat.name) + '" placeholder="请输入分类名称" maxlength="20" ' +
            'style="width:100%;height:36px;padding:0 12px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" />' +
        '</div>' +
      '</div>' +
      '<div style="padding:14px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">' +
        '<button class="ic-btn" onclick="closeCategoryDialog()">取消</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="doEditCategory(\'' + id + '\')">保存</button>' +
      '</div>' +
    '</div>';
  dialog.style.display = 'flex';
  setTimeout(function() { document.getElementById('categoryNameInput').focus(); }, 100);
}

// 执行编辑分类
function doEditCategory(id) {
  var name = document.getElementById('categoryNameInput').value.trim();
  if (!name) { alert('请输入分类名称'); return; }
  // 检查重名（排除自身）
  if (GOODS_CATEGORIES.some(function(c) { return c.name === name && c.id !== id && !c.hidden; })) {
    alert('已存在同名分类，请更换名称');
    return;
  }
  updateCategory(id, name);
  closeCategoryDialog();
  initGoodsClass();  // 刷新页面
}

// ========== 分类排序：上移/下移 ==========
function moveCategoryUp(id) {
  var categories = getVisibleCategories();  // 已按 sort 排序
  var idx = categories.findIndex(function(c) { return c.id === id; });
  if (idx <= 0) return;  // 已是第一个
  var prev = categories[idx - 1];
  var curr = categories[idx];
  var temp = prev.sort;
  prev.sort = curr.sort;
  curr.sort = temp;
  initGoodsClass();
}

function moveCategoryDown(id) {
  var categories = getVisibleCategories();  // 已按 sort 排序
  var idx = categories.findIndex(function(c) { return c.id === id; });
  if (idx === -1 || idx >= categories.length - 1) return;  // 已是最后一个
  var next = categories[idx + 1];
  var curr = categories[idx];
  var temp = next.sort;
  next.sort = curr.sort;
  curr.sort = temp;
  initGoodsClass();
}

// ========== 删除分类确认 ==========
function confirmDeleteCategory(id) {
  var cat = GOODS_CATEGORIES.find(function(c) { return c.id === id; });
  if (!cat || cat.hidden) return;

  var count = getCategoryItemCount(id);
  var msg = '确定删除分类「' + cat.name + '」？';
  if (count > 0) msg += '\n该分类下有 ' + count + ' 件商品，删除后将自动归入"未分类"。';

  if (!confirm(msg)) return;
  deleteCategory(id);
  initGoodsClass();  // 刷新页面
}

// 关闭弹窗
function closeCategoryDialog() {
  var dialog = document.getElementById('categoryDialog');
  if (dialog) dialog.style.display = 'none';
}

// HTML转义
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== PAGE: 商品列表 (Goods List) ==========================
// ========== PAGE: 商品列表 (Goods List) ==========================
var GL_MOCK_DATA = [];
var GL_FILTER_ENABLE = ''; // 上下架: ''=全部, '0'=上架, '1'=下架
var GL_FILTER_SHOP = '';   // 门店筛选: ''=全部
var GL_FILTER_KEYWORD = '';
var GL_FILTER_SALE_TYPE = ''; // 售卖类型: ''=全部, 'sell'=售卖品, 'nosell'=非售品
var GL_FILTER_STATUS = '';   // 启用/禁用: ''=全部, '0'=启用, '1'=禁用
var GL_PAGE = 1;
var GL_PAGE_SIZE = 10;
var GL_SELECTED_ID = null;

// 系统商品库（模拟从系统库选择）
var GL_SYSTEM_GOODS = [
  { id: 'sys-1', name: '鲜猪肉（带皮前腿）' },
  { id: 'sys-2', name: '西红柿（精选）' },
  { id: 'sys-3', name: '大米（东北珍珠米 5kg）' },
  { id: 'sys-4', name: '鲜鸡蛋（散装）' },
  { id: 'sys-5', name: '土豆（黄心）' },
  { id: 'sys-6', name: '海天酱油（生抽 500ml）' },
  { id: 'sys-7', name: '苹果（红富士）' },
  { id: 'sys-8', name: '香蕉（进口）' },
  { id: 'sys-9', name: '纯牛奶（蒙牛 250ml×12）' },
  { id: 'sys-10', name: '黄瓜（刺黄瓜）' },
  { id: 'sys-11', name: '茄子（紫长茄）' },
  { id: 'sys-12', name: '金龙鱼调和油 5L' },
  { id: 'sys-13', name: '大白菜' },
  { id: 'sys-14', name: '豆腐（老豆腐）' },
  { id: 'sys-15', name: '方便面（康师傅红烧 5连包）' },
  { id: 'sys-16', name: '青椒（薄皮）' },
  { id: 'sys-17', name: '鲜猪肉（带皮五花）' },
  { id: 'sys-18', name: '食盐（中盐精制盐 400g）' },
  { id: 'sys-19', name: '矿泉水（农夫山泉 550ml×24）' },
  { id: 'sys-20', name: '白砂糖（太古 400g）' },
  { id: 'sys-21', name: '排骨（精肋排）' },
  { id: 'sys-22', name: '鸡翅中（冷冻）' },
  { id: 'sys-23', name: '西兰花' },
  { id: 'sys-24', name: '胡萝卜' },
  { id: 'sys-25', name: '洋葱' },
  { id: 'sys-26', name: '大蒜（白皮）' },
  { id: 'sys-27', name: '生姜' },
  { id: 'sys-28', name: '食用油（花生油 1.8L）' },
  { id: 'sys-29', name: '大米（香米 10kg）' },
  { id: 'sys-30', name: '挂面（龙须面 1kg）' }
];

// 商品定义：每个商品绑定合理的规格和分类，避免猪肉配mL这种离奇组合
var PRODUCT_DEFS = {
  '鲜猪肉（带皮前腿）': { specs: ['称重/kg', '500g/袋'], category: 'c3' },
  '西红柿（精选）':       { specs: ['称重/kg', '500g/袋'], category: 'c1' },
  '大米（东北珍珠米 5kg）': { specs: ['5kg/袋'], category: 'c5' },
  '鲜鸡蛋（散装）':       { specs: ['称重/kg', '散装/kg', '6个/盒'], category: 'c3' },
  '土豆（黄心）':         { specs: ['称重/kg', '1kg/袋'], category: 'c1' },
  '海天酱油（生抽 500ml）': { specs: ['500ml/瓶'], category: 'c5' },
  '苹果（红富士）':       { specs: ['称重/kg', '500g/袋'], category: 'c2' },
  '香蕉（进口）':         { specs: ['称重/kg'], category: 'c2' },
  '纯牛奶（蒙牛 250ml×12）': { specs: ['250ml×12/箱'], category: 'c6' },
  '黄瓜（刺黄瓜）':       { specs: ['称重/kg', '500g/袋'], category: 'c1' },
  '茄子（紫长茄）':       { specs: ['称重/kg'], category: 'c1' },
  '金龙鱼调和油 5L':     { specs: ['5L/瓶', '1.8L/瓶'], category: 'c5' },
  '大白菜':              { specs: ['称重/kg'], category: 'c1' },
  '豆腐（老豆腐）':       { specs: ['称重/kg', '500g/袋'], category: 'c1' },
  '方便面（康师傅红烧 5连包）': { specs: ['5连包/包'], category: 'c7' },
  '青椒（薄皮）':         { specs: ['称重/kg', '500g/袋'], category: 'c1' },
  '鲜猪肉（带皮五花）':   { specs: ['称重/kg', '500g/袋'], category: 'c3' },
  '食盐（中盐精制盐 400g）': { specs: ['400g/袋'], category: 'c5' },
  '矿泉水（农夫山泉 550ml×24）': { specs: ['550ml×24/箱', '550ml/瓶'], category: 'c8' },
  '白砂糖（太古 400g）':  { specs: ['400g/袋'], category: 'c5' },
  '排骨（精肋排）':       { specs: ['称重/kg', '500g/袋'], category: 'c3' },
  '鸡翅中（冷冻）':       { specs: ['称重/kg', '1kg/袋'], category: 'c3' },
  '西兰花':              { specs: ['称重/kg'], category: 'c1' },
  '胡萝卜':              { specs: ['称重/kg', '500g/袋'], category: 'c1' },
  '洋葱':                { specs: ['称重/kg'], category: 'c1' },
  '大蒜（白皮）':         { specs: ['称重/kg', '500g/袋'], category: 'c1' },
  '生姜':                { specs: ['称重/kg'], category: 'c1' },
  '食用油（花生油 1.8L）': { specs: ['1.8L/瓶'], category: 'c5' },
  '大米（香米 10kg）':    { specs: ['10kg/袋', '5kg/袋'], category: 'c5' },
  '挂面（龙须面 1kg）':   { specs: ['1kg/袋', '500g/袋'], category: 'c5' }
};

(function() {
  var stores = ['崧泽大道中心店', '徐泾店', '赵巷店', '华新店', '重固店'];
  var companies = ['崧泽集团', '青浦商超', '鲜生控股'];
  var names = [
    '鲜猪肉（带皮前腿）', '西红柿（精选）', '大米（东北珍珠米 5kg）',
    '鲜鸡蛋（散装）', '土豆（黄心）', '海天酱油（生抽 500ml）',
    '苹果（红富士）', '香蕉（进口）', '纯牛奶（蒙牛 250ml×12）',
    '黄瓜（刺黄瓜）', '茄子（紫长茄）', '金龙鱼调和油 5L',
    '大白菜', '豆腐（老豆腐）', '方便面（康师傅红烧 5连包）',
    '青椒（薄皮）', '鲜猪肉（带皮五花）', '食盐（中盐精制盐 400g）',
    '矿泉水（农夫山泉 550ml×24）', '白砂糖（太古 400g）',
    '排骨（精肋排）', '鸡翅中（冷冻）', '西兰花',
    '胡萝卜', '洋葱', '大蒜（白皮）', '生姜',
    '食用油（花生油 1.8L）', '大米（香米 10kg）', '挂面（龙须面 1kg）'
  ];
  var suppliers = ['青浦食品厂', '华东农产品批发', '鲜肉专供公司', '光明乳业', '中粮集团', '李锦记', '统一食品'];
  var prices = [3.5, 5.8, 12.0, 8.9, 2.5, 9.9, 15.8, 22.0, 45.0, 6.5, 4.2, 18.6, 1.8, 3.0, 25.0, 7.5, 11.0, 16.8, 32.0, 88.0, 35.5, 13.2, 4.8, 7.0, 29.9, 55.0, 19.8, 6.0, 65.0, 10.5];
  // 标品：品牌商品 → 69 开头条码
  var brandMap = {
    '海天酱油（生抽 500ml）': '海天',
    '纯牛奶（蒙牛 250ml×12）': '蒙牛',
    '金龙鱼调和油 5L': '金龙鱼',
    '方便面（康师傅红烧 5连包）': '康师傅',
    '食盐（中盐精制盐 400g）': '中盐',
    '矿泉水（农夫山泉 550ml×24）': '农夫山泉',
    '白砂糖（太古 400g）': '太古'
  };
  var stdCodeBase = 6900000000000;

  var tags = ['赠品', '试吃品', '报损品', '展示品', '过期品', '退货品'];

  var unitFromSpec = { kg: '千克', g: '克', ml: '毫升', l: '升' };

  for (var i = 0; i < 50; i++) {
    var p = prices[Math.floor(Math.random() * prices.length)];
    var gName = names[i % names.length];
    var def = PRODUCT_DEFS[gName];
    var randomCatId = def.category;
    var isBrand = brandMap.hasOwnProperty(gName);
    var sale = Math.random() > 0.25 ? 1 : 0;
    var goodsSpec = def.specs[Math.floor(Math.random() * def.specs.length)];
    var unitSuffix = goodsSpec.split('/').pop();
    var goodsUnitId = unitFromSpec[unitSuffix] || unitSuffix;
    
    GL_MOCK_DATA.push({
      goodsId: 'g-' + (i + 1),
      goodsName: gName,
      salesName: gName,
      goodsCode: isBrand ? String(stdCodeBase + i) : ('SP' + String(2026 + Math.floor(i / 10)).slice(2) + String(i + 1).padStart(4, '0')),
      goodsUnitId: goodsUnitId,
      goodsSpec: goodsSpec,
      goodsPrice: p,
      goodsListPrice: Math.round(p * 1.15 * 100) / 100,
      status: Math.random() > 0.2 ? '0' : '1',
      enable: Math.random() > 0.3 ? 0 : 1,
      companyName: companies[Math.floor(Math.random() * companies.length)],
      shopName: stores[Math.floor(Math.random() * stores.length)],
      supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
      picUrl: '',
      categoryId: randomCatId,
      goodsBrand: isBrand ? brandMap[gName] : '',
      isSellable: sale, // 0-非售品 1-售卖品
      isMarked: Math.random() > 0.7 ? 1 : 0, // 0-未标记 1-已标记
      goodsTag: sale === 0 ? tags[Math.floor(Math.random() * tags.length)] : '',
      memberPrice: sale === 1 && Math.random() > 0.4 ? +(p * (Math.random() * 0.3 + 0.7)).toFixed(2) : null // 预留：会员价
    });
  }
})();

function initGoodsList() {
  var el = document.getElementById('goodsListContent');
  if (!el) return;

  el.innerHTML =
    '<div style="display:flex;flex:1;flex-direction:column;min-height:0;overflow:hidden">' +
      // ===== 头部：筛选栏 + 按钮栏（横跨全宽） =====
      '<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;padding:14px 24px">' +
        // 筛选栏（左移至侧边栏右侧边界）
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:1">' +
          '<div style="position:relative;flex:0 1 180px">' +
            '<select id="glFilterShop" style="width:100%;height:32px;padding:0 10px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;background:#fff;outline:none;box-sizing:border-box" onchange="glSearch()">' +
              '<option value=""' + (GL_FILTER_SHOP === '' ? ' selected' : '') + '>全部门店</option>' +
              '<option value="崧泽大道中心店"' + (GL_FILTER_SHOP === '崧泽大道中心店' ? ' selected' : '') + '>崧泽大道中心店</option>' +
              '<option value="徐泾店"' + (GL_FILTER_SHOP === '徐泾店' ? ' selected' : '') + '>徐泾店</option>' +
              '<option value="赵巷店"' + (GL_FILTER_SHOP === '赵巷店' ? ' selected' : '') + '>赵巷店</option>' +
              '<option value="华新店"' + (GL_FILTER_SHOP === '华新店' ? ' selected' : '') + '>华新店</option>' +
              '<option value="重固店"' + (GL_FILTER_SHOP === '重固店' ? ' selected' : '') + '>重固店</option>' +
            '</select>' +
          '</div>' +
          '<div class="gl-radio-group" id="glFilterSaleType">' +
            '<span class="gl-radio-btn' + (GL_FILTER_SALE_TYPE === '' ? ' active' : '') + '" onclick="glSetSaleType(\'\',this)">全部</span>' +
            '<span class="gl-radio-btn' + (GL_FILTER_SALE_TYPE === 'sell' ? ' active' : '') + '" onclick="glSetSaleType(\'sell\',this)">售卖品</span>' +
            '<span class="gl-radio-btn' + (GL_FILTER_SALE_TYPE === 'nosell' ? ' active' : '') + '" onclick="glSetSaleType(\'nosell\',this)">非售品</span>' +
          '</div>' +
          '<div class="gl-radio-group" id="glFilterEnable">' +
            '<span class="gl-radio-btn' + (GL_FILTER_ENABLE === '' ? ' active' : '') + '" onclick="glSetEnable(\'\',this)">全部</span>' +
            '<span class="gl-radio-btn' + (GL_FILTER_ENABLE === '0' ? ' active' : '') + '" onclick="glSetEnable(\'0\',this)">上架</span>' +
            '<span class="gl-radio-btn' + (GL_FILTER_ENABLE === '1' ? ' active' : '') + '" onclick="glSetEnable(\'1\',this)">下架</span>' +
          '</div>' +
          '<div class="gl-radio-group" id="glFilterStatus">' +
            '<span class="gl-radio-btn' + (GL_FILTER_STATUS === '' ? ' active' : '') + '" onclick="glSetStatus(\'\',this)">全部</span>' +
            '<span class="gl-radio-btn' + (GL_FILTER_STATUS === '0' ? ' active' : '') + '" onclick="glSetStatus(\'0\',this)">启用</span>' +
            '<span class="gl-radio-btn' + (GL_FILTER_STATUS === '1' ? ' active' : '') + '" onclick="glSetStatus(\'1\',this)">禁用</span>' +
          '</div>' +
          '<div style="position:relative;flex:0 1 220px">' +
            '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#bbb;font-size:12px">🔍</span>' +
            '<input type="text" id="glFilterKeyword" placeholder="搜索商品名称/编码" ' +
              'style="width:100%;height:32px;padding:0 10px 0 28px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" ' +
              'value="' + (GL_FILTER_KEYWORD || '') + '" onkeydown="if(event.key===\'Enter\')glSearch()">' +
          '</div>' +
          '<button class="ic-btn" onclick="glReset()" style="font-size:12px">重置</button>' +
          '<button class="ic-btn ic-btn-pri" onclick="glSearch()">查询</button>' +
        '</div>' +
      '</div>' +
      // ===== 按钮栏（全宽，右对齐） =====
      '<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 24px">' +
        '<button class="ic-btn ic-btn-pri" onclick="glOpenAddModal()">新增商品</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="glOpenStandardModal()">新增标品</button>' +
        '<button class="ic-btn" onclick="glBatchUpdateStatus(0,\'enable\')" style="font-size:12px">上架</button>' +
        '<button class="ic-btn" onclick="glBatchUpdateStatus(1,\'enable\')" style="font-size:12px">下架</button>' +
        '<button class="ic-btn" onclick="glBatchUpdateStatus(\'0\',\'status\')" style="font-size:12px">启用</button>' +
        '<button class="ic-btn" onclick="glBatchUpdateStatus(\'1\',\'status\')" style="font-size:12px">禁用</button>' +
        '<button class="ic-btn" onclick="window.open(\'prd-goods-list.html\',\'_blank\')" style="font-size:12px;color:#888;border-color:#ddd" title="查看产品需求文档">产品需求文档</button>' +
      '</div>' +
      // ===== 正文：左侧分类 + 右侧表格 =====
      '<div style="display:flex;flex:1;min-height:0;overflow:hidden;gap:8px;padding:8px 8px 8px 8px;background:#F1F2F5">' +
        '<div id="goodsCatSidebar" style="width:200px;flex-shrink:0;background:#fff;border-radius:4px;display:flex;flex-direction:column;overflow:hidden">' +
          '<div id="goodsCatList" style="flex:1;overflow-y:auto;padding:12px 0"></div>' +
        '</div>' +
        '<div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden">' +
          '<div style="flex:1;min-height:0;padding:1px;background:linear-gradient(180deg, #e0e3e8, #f0f2f5);border-radius:4px">' +
            '<div style="height:100%;background:#fff;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">' +
              '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
                '<table>' +
                  '<thead><tr>' +
                    '<th style="width:40px"><input type="checkbox" id="glSelectAll" onclick="glToggleSelectAll()" style="cursor:pointer"></th>' +
                    '<th style="width:50px">序号</th>' +
                    '<th style="width:240px">商品名称</th>' +
                    '<th style="width:100px">品牌</th>' +
                    '<th style="width:120px">商品编码</th>' +
                    '<th style="width:100px">商品规格</th>' +
                    '<th style="width:100px">销售价格</th>' +
                    '<th style="width:80px">会员价<span style="color:#c0c4cc;font-weight:400;font-size:11px;margin-left:2px">(预留)</span></th>' +
                    '<th style="width:80px">原价</th>' +
                    '<th style="width:100px">商品分类</th>' +
                    '<th style="width:80px">标签<span style="color:#c0c4cc;font-weight:400;font-size:11px;margin-left:2px">(预留)</span></th>' +
                    '<th style="width:80px">商品状态</th>' +
                    '<th style="width:90px">上下架</th>' +
                    '<th style="width:80px">非售品</th>' +
                    '<th style="width:150px">所属门店</th>' +
                  '</tr></thead>' +
                  '<tbody id="glTableBody"></tbody>' +
                '</table>' +
              '</div>' +
              '<div class="pagination-bar" id="glPagination" style="flex-shrink:0"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // 渲染分类侧边栏
  renderGoodsCatSidebar();
  glRenderTable();
}

// 渲染商品列表左侧分类侧边栏
function renderGoodsCatSidebar() {
  var container = document.getElementById('goodsCatList');
  if (!container) return;

  var categories = GOODS_CATEGORIES.slice().sort(function(a, b) { return a.sort - b.sort; });  // 按 sort 排序，包含"未分类"
  var totalCount = (typeof GL_MOCK_DATA !== 'undefined') ? GL_MOCK_DATA.length : 0;

  container.innerHTML =
    // 全部
    '<div class="gc-sidebar-item' + (GL_FILTER_CATEGORY === '' ? ' active' : '') + '" ' +
      'onclick="glFilterByCategory(\'\', this)" ' +
      'style="padding:9px 16px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .1s;hover:background:#f5f7fa">' +
      '<span>全部商品</span>' +
      '<span style="font-size:11px;color:#999;background:#f0f0f0;padding:1px 7px;border-radius:8px">' + totalCount + '</span>' +
    '</div>' +
    // 各分类
    categories.map(function(cat) {
      var count = getCategoryItemCount(cat.id);
      var isActive = GL_FILTER_CATEGORY === cat.id;
      var itemStyle = 'padding:9px 16px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .1s;hover:background:#f5f7fa';
      if (isActive) itemStyle += ';background:#F0F6FF;color:#005CF5;font-weight:500';
      if (cat.hidden) itemStyle += ';opacity:0.5';
      return '<div class="gc-sidebar-item' + (isActive ? ' active' : '') + '" ' +
        'onclick="glFilterByCategory(\'' + cat.id + '\', this)" ' +
        'style="' + itemStyle + '">' +
        '<span style="display:flex;align-items:center;gap:8px">' +
          (cat.hidden ? '' : '<span style="width:6px;height:6px;border-radius:50%;background:' + getCategoryColor(cat.id) + ';flex-shrink:0"></span>') +
          '<span>' + escapeHtml(cat.name) + '</span>' +
        '</span>' +
        '<span style="font-size:11px;' + (isActive ? 'color:#005CF5;background:rgba(0,92,245,0.08)' : 'color:#999;background:#f0f0f0') + ';padding:1px 7px;border-radius:8px">' + count + '</span>' +
      '</div>';
    }).join('') +
    '<style>.gc-sidebar-item.active{background:#F0F6FF;color:#005CF5;font-weight:500}</style>';
}

// 按分类过滤商品
function glFilterByCategory(catId, el) {
  GL_FILTER_CATEGORY = catId;
  GL_PAGE = 1;
  GL_SELECTED_ID = null;
  // 更新侧边栏高亮
  var items = document.querySelectorAll('#goodsCatList .gc-sidebar-item');
  items.forEach(function(item) { item.classList.remove('active'); });
  if (el) el.classList.add('active');
  glRenderTable();
}

// 在 glGetFilteredData 中加入分类过滤
function glGetFilteredData() {
  var data = GL_MOCK_DATA.slice();
  // 分类过滤
  if (GL_FILTER_CATEGORY) {
    data = data.filter(function(r) { return r.categoryId === GL_FILTER_CATEGORY; });
  }
  // 门店筛选
  if (GL_FILTER_SHOP) {
    data = data.filter(function(r) { return r.shopName === GL_FILTER_SHOP; });
  }
  // 售卖类型
  if (GL_FILTER_SALE_TYPE === 'sell') {
    data = data.filter(function(r) { return r.isSellable === 1; });
  } else if (GL_FILTER_SALE_TYPE === 'nosell') {
    data = data.filter(function(r) { return r.isSellable === 0; });
  }
  // 上下架状态
  if (GL_FILTER_ENABLE !== '') {
    data = data.filter(function(r) { return String(r.enable) === GL_FILTER_ENABLE; });
  }
  // 启用/禁用
  if (GL_FILTER_STATUS !== '') {
    data = data.filter(function(r) { return r.status === GL_FILTER_STATUS; });
  }
  // 关键词搜索
  if (GL_FILTER_KEYWORD) {
    var kw = GL_FILTER_KEYWORD.toLowerCase();
    data = data.filter(function(r) {
      return r.goodsName.toLowerCase().indexOf(kw) >= 0 || r.goodsCode.toLowerCase().indexOf(kw) >= 0 || (r.salesName && r.salesName.toLowerCase().indexOf(kw) >= 0);
    });
  }
  return data;
}

function glSetEnable(val, el) {
  GL_FILTER_ENABLE = val;
  var btns = document.querySelectorAll('#glFilterEnable .gl-radio-btn');
  btns.forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  glSearch();
}

function glSetStatus(val, el) {
  GL_FILTER_STATUS = val;
  var btns = document.querySelectorAll('#glFilterStatus .gl-radio-btn');
  btns.forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  GL_PAGE = 1;
  GL_SELECTED_ID = null;
  glRenderTable();
}

function glSetSaleType(val, el) {
  GL_FILTER_SALE_TYPE = val;
  var btns = document.querySelectorAll('#glFilterSaleType .gl-radio-btn');
  btns.forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  GL_PAGE = 1;
  GL_SELECTED_ID = null;
  glRenderTable();
}

function glSearch() {
  var kw = document.getElementById('glFilterKeyword');
  var shop = document.getElementById('glFilterShop');
  GL_FILTER_KEYWORD = kw ? kw.value.trim() : '';
  GL_FILTER_SHOP = shop ? shop.value : '';
  GL_PAGE = 1;
  GL_SELECTED_ID = null;
  glRenderTable();
}

function glReset() {
  GL_FILTER_CATEGORY = '';
  GL_FILTER_ENABLE = '';
  GL_FILTER_STATUS = '';
  GL_FILTER_SHOP = '';
  GL_FILTER_SALE_TYPE = '';
  GL_FILTER_KEYWORD = '';
  GL_PAGE = 1;
  GL_SELECTED_ID = null;
  var el = document.getElementById('glFilterKeyword');
  if (el) el.value = '';
  var shopEl = document.getElementById('glFilterShop');
  if (shopEl) shopEl.value = '';
  var btns = document.querySelectorAll('#glFilterEnable .gl-radio-btn');
  btns.forEach(function(b) { b.classList.remove('active'); });
  if (btns[0]) btns[0].classList.add('active');
  var saleBtns = document.querySelectorAll('#glFilterSaleType .gl-radio-btn');
  saleBtns.forEach(function(b) { b.classList.remove('active'); });
  if (saleBtns[0]) saleBtns[0].classList.add('active');
  var statusBtns = document.querySelectorAll('#glFilterStatus .gl-radio-btn');
  statusBtns.forEach(function(b) { b.classList.remove('active'); });
  if (statusBtns[0]) statusBtns[0].classList.add('active');
  renderGoodsCatSidebar();
  glRenderTable();
}

function glRenderTable() {
  var filtered = glGetFilteredData();
  var total = filtered.length;
  var totalPages = Math.ceil(total / GL_PAGE_SIZE) || 1;
  var start = (GL_PAGE - 1) * GL_PAGE_SIZE;
  var pageData = filtered.slice(start, start + GL_PAGE_SIZE);

  var tbody = document.getElementById('glTableBody');
  if (!tbody) return;

  tbody.innerHTML = pageData.map(function(r, i) {
    var idx = start + i + 1;
    var selectedClass = (GL_SELECTED_ID === r.goodsId) ? ' style="background:#F0F6FF"' : '';
    var statusTag = r.status === '0'
      ? '<span class="gl-tag gl-tag-success">启用</span>'
      : '<span class="gl-tag gl-tag-danger">禁用</span>';
    var enableTag = r.enable === 0
      ? '<span class="gl-tag gl-tag-success">上架</span>'
      : '<span class="gl-tag gl-tag-danger">下架</span>';
    return '<tr' + selectedClass + ' onclick="glSelectRow(\'' + r.goodsId + '\', this)">' +
      '<td onclick="event.stopPropagation()"><input type="checkbox" class="gl-row-check" data-id="' + r.goodsId + '" style="cursor:pointer"></td>' +
      '<td>' + idx + '</td>' +
      '<td><span style="color:#005CF5;cursor:pointer">' + (r.salesName || r.goodsName) + '</span></td>' +
      '<td>' + (r.goodsBrand || '-') + '</td>' +
      '<td>' + r.goodsCode + '</td>' +
      '<td>' + r.goodsSpec + '</td>' +
      '<td>¥' + r.goodsPrice.toFixed(2) + '</td>' +
      '<td>' + (r.memberPrice != null ? '¥' + r.memberPrice.toFixed(2) : '<span style="color:#c0c4cc;font-size:12px">-</span>') + '</td>' +
      '<td>¥' + r.goodsListPrice.toFixed(2) + '</td>' +
      '<td>' + (r.categoryId && getCategoryName(r.categoryId) !== '未分类' ? getCategoryName(r.categoryId) : '<span style="color:#c0c4cc;font-size:12px">-</span>') + '</td>' +
      '<td>' + (r.goodsTag || '<span style="color:#c0c4cc;font-size:12px">-</span>') + '</td>' +
      '<td>' + statusTag + '</td>' +
      '<td>' + enableTag + '</td>' +
      '<td>' + (r.isSellable === 0 ? '<span style="color:#D46B08;font-size:12px">是</span>' : '') + '</td>' +
      '<td>' + r.shopName + '</td>' +
      '</tr>';
  }).join('');

  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#999">暂无数据</td></tr>';
  }

  // Pagination（与改价日志风格一致）
  var pagEl = document.getElementById('glPagination');
  if (!pagEl) return;
  var html = '<span class="page-info">共 ' + total + ' 条</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="glGoPage(' + (GL_PAGE - 1) + ')" ' + (GL_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';
  // 智能省略号：显示前3、后2、当前附近
  var pages = [];
  for (var p = 1; p <= totalPages; p++) {
    if (p <= 3 || p > totalPages - 2 || Math.abs(p - GL_PAGE) <= 1) {
      if (pages.length > 0 && p - pages[pages.length - 1] > 1) pages.push('...');
      pages.push(p);
    }
  }
  for (var pi = 0; pi < pages.length; pi++) {
    var pg = pages[pi];
    if (pg === '...') {
      html += '<span class="page-num" style="opacity:0.4">...</span>';
    } else {
      html += '<button class="page-btn" style="' + (pg === GL_PAGE ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="glGoPage(' + pg + ')">' + pg + '</button>';
    }
  }
  html += '<button class="page-btn" onclick="glGoPage(' + (GL_PAGE + 1) + ')" ' + (GL_PAGE >= totalPages ? 'disabled' : '') + '>›</button></div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
      GL_PAGE_SIZE + '条/页 跳至 <input type="number" id="glJumpInput" min="1" max="' + totalPages + '" value="' + GL_PAGE + '" ' +
      'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
      'onkeydown="if(event.key===\'Enter\')glGoPage(parseInt(this.value))"> 页' +
    '</div>';
  pagEl.innerHTML = html;
}

function glGoPage(p) {
  GL_PAGE = p;
  glRenderTable();
  var wrap = document.querySelector('#page-goods-list .table-wrap');
  if (wrap) wrap.scrollTop = 0;
}

function glSelectRow(goodsId, tr) {
  GL_SELECTED_ID = goodsId;
  var rows = document.querySelectorAll('#glTableBody tr');
  rows.forEach(function(r) { r.style.background = ''; });
  if (tr) tr.style.background = '#F0F6FF';
  // 点击行直接弹出编辑
  glEditRow();
}

function glUpdateStatus(val, type) {
  if (!GL_SELECTED_ID) { alert('请先选择一条商品'); return; }
  var item = GL_MOCK_DATA.find(function(r) { return r.goodsId === GL_SELECTED_ID; });
  if (!item) return;
  if (String(item[type]) === String(val)) { alert('已是该状态'); return; }
  item[type] = type === 'enable' ? val : String(val);
  glRenderTable();
  // Re-select to keep highlight
  GL_SELECTED_ID = item.goodsId;
}

function glGetSelectedIds() {
  var checks = document.querySelectorAll('#glTableBody .gl-row-check:checked');
  var ids = [];
  checks.forEach(function(cb) { ids.push(cb.getAttribute('data-id')); });
  return ids;
}

function glToggleSelectAll() {
  var selectAll = document.getElementById('glSelectAll');
  var checks = document.querySelectorAll('#glTableBody .gl-row-check');
  checks.forEach(function(cb) { cb.checked = selectAll.checked; });
}

function glBatchUpdateStatus(val, type) {
  var ids = glGetSelectedIds();
  if (ids.length === 0) { alert('请先勾选商品'); return; }
  var count = 0;
  ids.forEach(function(id) {
    var item = GL_MOCK_DATA.find(function(r) { return r.goodsId === id; });
    if (!item) return;
    if (String(item[type]) === String(val)) return;
    item[type] = type === 'enable' ? val : String(val);
    count++;
  });
  if (count === 0) { alert('选中的商品已是该状态'); return; }
  glRenderTable();
  // uncheck select all
  var selectAll = document.getElementById('glSelectAll');
  if (selectAll) selectAll.checked = false;
}

function glEditRow() {
  if (!GL_SELECTED_ID) { alert('请先选择一条商品'); return; }
  var item = GL_MOCK_DATA.find(function(r) { return r.goodsId === GL_SELECTED_ID; });
  if (!item) return;
  // 标品有 brand, 普通商品品牌为空；标品 goodsCode 以 69 开头（EAN-13）
  if (item.goodsBrand || (item.goodsCode && /^69/.test(item.goodsCode))) {
    glOpenStandardModal(item);
  } else {
    glOpenAddModal(item);
  }
}

// ===== 系统商品搜索选择器 =====
function glInputWrap(id, value, placeholder, extra) {
  // Element Plus style clearable input — clear icon only on hover
  extra = extra || '';
  return '<div class="gl-input-wrap"><input class="gl-form-input gl-has-clr" id="' + id + '" value="' + escapeHtml(value) + '" placeholder="' + placeholder + '"' + extra + ' oninput="glInputClrToggle(this)">' +
    '<span class="gl-input-clr' + (value ? ' show' : '') + '" id="' + id + 'Clr" onclick="var i=document.getElementById(\'' + id + '\');i.value=\'\';this.classList.remove(\'show\');i.focus();i.dispatchEvent(new Event(\'input\'))">' +
    '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" fill="currentColor"/></svg>' +
    '</span></div>';
}
function glInputClrToggle(input) {
  var clr = document.getElementById(input.id + 'Clr');
  if (clr) clr.classList.toggle('show', !!input.value);
}

function glBuildSearchSelect(id, value, placeholder, salesTarget) {
  placeholder = placeholder || '请搜索选择系统商品';
  var targetAttr = salesTarget ? ' data-sales-target="' + salesTarget + '"' : '';
  return '<div class="gl-ss-wrap" id="' + id + 'Wrap"' + targetAttr + '>' +
    '<input class="gl-form-input gl-ss-input" id="' + id + '" value="' + escapeHtml(value) + '" placeholder="' + placeholder + '" autocomplete="off">' +
    '<span class="gl-ss-clear' + (value ? ' show' : '') + '" id="' + id + 'Clear" onclick="event.stopPropagation();glClearSearchSelect(\'' + id + '\')">' +
      '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" fill="currentColor"/></svg>' +
    '</span>' +
    '<span class="gl-ss-arrow" onclick="event.stopPropagation();glToggleSearchSelect(\'' + id + '\')">' +
      '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</span>' +
    '<div class="gl-ss-drop" id="' + id + 'Drop"></div>' +
  '</div>';
}

function glInitSearchSelect(id) {
  var input = document.getElementById(id);
  var drop = document.getElementById(id + 'Drop');
  if (!input || !drop) return;
  var keyword = input.value.trim().toLowerCase();
  var html = '';
  for (var i = 0; i < GL_SYSTEM_GOODS.length; i++) {
    var item = GL_SYSTEM_GOODS[i];
    var nameLower = item.name.toLowerCase();
    if (!keyword || nameLower.indexOf(keyword) !== -1) {
      html += '<div class="gl-ss-item' + (item.name === input.value ? ' active' : '') + '" data-name="' + item.name.replace(/"/g, '&quot;') + '" onmousedown="event.preventDefault();glSelectSearchItem(\'' + id + '\', this)">' + escapeHtml(item.name) + '</div>';
    }
  }
  if (!html) html = '<div class="gl-ss-empty">无匹配商品，请输入其他关键词</div>';
  drop.innerHTML = html;
  drop.classList.add('show');
}

function glToggleSearchSelect(id) {
  var drop = document.getElementById(id + 'Drop');
  if (!drop) return;
  if (drop.classList.contains('show')) {
    drop.classList.remove('show');
  } else {
    glInitSearchSelect(id);
  }
}

function glSelectSearchItem(inputId, el) {
  var input = document.getElementById(inputId);
  var drop = document.getElementById(inputId + 'Drop');
  var clearBtn = document.getElementById(inputId + 'Clear');
  var name = el.getAttribute('data-name');
  if (input) { input.value = name; }
  if (clearBtn) clearBtn.classList.add('show');
  if (drop) drop.classList.remove('show');
  // 自动同步销售品名
  var wrap = document.getElementById(inputId + 'Wrap');
  if (wrap) {
    var targetId = wrap.getAttribute('data-sales-target');
    if (targetId) {
      var salesInput = document.getElementById(targetId);
      if (salesInput) salesInput.value = name;
    }
  }
}

function glClearSearchSelect(id) {
  var input = document.getElementById(id);
  var clearBtn = document.getElementById(id + 'Clear');
  var drop = document.getElementById(id + 'Drop');
  if (input) { input.value = ''; }
  if (clearBtn) clearBtn.classList.remove('show');
  if (drop) drop.classList.remove('show');
  // 同步清除销售品名
  var wrap = document.getElementById(id + 'Wrap');
  if (wrap) {
    var targetId = wrap.getAttribute('data-sales-target');
    if (targetId) {
      var salesInput = document.getElementById(targetId);
      if (salesInput) salesInput.value = '';
    }
  }
}

// 全局点击关闭下拉
document.addEventListener('click', function(e) {
  var drops = document.querySelectorAll('.gl-ss-drop.show');
  for (var i = 0; i < drops.length; i++) {
    var wrap = drops[i].parentElement;
    if (wrap && !wrap.contains(e.target)) {
      drops[i].classList.remove('show');
    }
  }
});

// ===== 新增商品弹窗 =====
var GL_ADD_MODE = 'add'; // 'add' or 'edit'
var GL_EDIT_DATA = null;
// ===== 新增标品弹窗状态 =====
var GL_STD_ADD_MODE = 'add';
var GL_STD_EDIT_DATA = null;

// ===== 通用选择器数据 =====
var GL_SHOP_LIST = [
  { value: '崧泽大道中心店', label: '崧泽大道中心店' },
  { value: '徐泾店', label: '徐泾店' },
  { value: '赵巷店', label: '赵巷店' },
  { value: '华新店', label: '华新店' },
  { value: '重固店', label: '重固店' }
];
var GL_UNIT_LIST = [
  { value: '斤', label: '斤' },
  { value: '千克', label: '千克' },
  { value: '克', label: '克' },
  { value: '袋', label: '袋' },
  { value: '瓶', label: '瓶' },
  { value: '盒', label: '盒' },
  { value: '个', label: '个' },
  { value: '包', label: '包' },
  { value: '升', label: '升' },
  { value: '毫升', label: '毫升' }
];


// ===== 通用选择器组件 =====
function glGetGenericData(key) {
  if (key === 'categories') return getVisibleCategories();
  if (key === 'shops') return GL_SHOP_LIST;
  if (key === 'units') return GL_UNIT_LIST;
  return [];
}

function glBuildGenericSelect(id, value, placeholder, dataKey, valueId) {
  // valueId: 当label≠value时（如分类），传入实际id值，会生成隐藏input存id
  var hasId = valueId !== undefined;
  var displayVal = value || '';
  var hiddenHtml = hasId ? '<input type="hidden" id="' + id + '" value="' + escapeHtml(valueId) + '">' : '';
  var inputId = hasId ? (id + 'Input') : id;
  return '<div class="gl-ss-wrap" id="' + id + 'Wrap">' +
    hiddenHtml +
    '<input class="gl-form-input gl-ss-input" id="' + inputId + '" value="' + escapeHtml(displayVal) + '" placeholder="' + placeholder + '" autocomplete="off" onclick="glToggleGenericSelect(\'' + id + '\', \'' + dataKey + '\')">' +
    '<span class="gl-ss-clear' + (displayVal ? ' show' : '') + '" id="' + id + 'Clear" onclick="event.stopPropagation();glClearGenericSelect(\'' + id + '\', \'' + dataKey + '\')">' +
      '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" fill="currentColor"/></svg>' +
    '</span>' +
    '<span class="gl-ss-arrow" onclick="event.stopPropagation();glToggleGenericSelect(\'' + id + '\', \'' + dataKey + '\')">' +
      '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</span>' +
    '<div class="gl-ss-drop" id="' + id + 'Drop"></div>' +
    '</div>';
}

function glInitGenericSelect(id, dataKey) {
  var drop = document.getElementById(id + 'Drop');
  if (!drop) return;
  var items = glGetGenericData(dataKey);
  var hiddenInput = document.getElementById(id);
  var hasHidden = hiddenInput && hiddenInput.type === 'hidden';
  var inputId = hasHidden ? (id + 'Input') : id;
  var input = document.getElementById(inputId);
  var curVal = input ? input.value : '';
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var itemVal = item.value !== undefined ? item.value : item.id;
    var itemLabel = item.label !== undefined ? item.label : item.name;
    var isActive = hasHidden ? (hiddenInput.value === itemVal) : (curVal === itemVal || curVal === itemLabel);
    html += '<div class="gl-ss-item' + (isActive ? ' active' : '') + '" data-value="' + escapeHtml(itemVal) + '" data-label="' + escapeHtml(itemLabel) + '" onmousedown="event.preventDefault();glSelectGenericItem(\'' + id + '\', this)">' + escapeHtml(itemLabel) + '</div>';
  }
  if (!html) html = '<div class="gl-ss-empty">暂无选项</div>';
  drop.innerHTML = html;
  drop.classList.add('show');
}

function glToggleGenericSelect(id, dataKey) {
  var drop = document.getElementById(id + 'Drop');
  if (!drop) return;
  if (drop.classList.contains('show')) {
    drop.classList.remove('show');
    return;
  }
  var drops = document.querySelectorAll('.gl-ss-drop.show');
  for (var i = 0; i < drops.length; i++) drops[i].classList.remove('show');
  glInitGenericSelect(id, dataKey);
}

function glSelectGenericItem(baseId, el) {
  var drop = document.getElementById(baseId + 'Drop');
  var clearBtn = document.getElementById(baseId + 'Clear');
  var itemVal = el.getAttribute('data-value');
  var itemLabel = el.getAttribute('data-label');
  var hiddenInput = document.getElementById(baseId);
  var hasHidden = hiddenInput && hiddenInput.type === 'hidden';
  var inputId = hasHidden ? (baseId + 'Input') : baseId;
  var input = document.getElementById(inputId);
  if (hasHidden) {
    hiddenInput.value = itemVal;
    if (input) input.value = itemLabel;
  } else {
    if (input) input.value = itemVal;
  }
  // Also update unit label if present
  var unitLabel = document.getElementById(baseId + 'Label');
  if (unitLabel) {
    unitLabel.textContent = itemLabel;
    unitLabel.style.color = '#303133';
  }
  if (clearBtn) clearBtn.classList.add('show');
  if (drop) drop.classList.remove('show');
}

function glClearGenericSelect(id, dataKey) {
  var hiddenInput = document.getElementById(id);
  var hasHidden = hiddenInput && hiddenInput.type === 'hidden';
  var inputId = hasHidden ? (id + 'Input') : id;
  var input = document.getElementById(inputId);
  var clearBtn = document.getElementById(id + 'Clear');
  if (hasHidden) hiddenInput.value = '';
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.remove('show');
  var unitLabel = document.getElementById(id + 'Label');
  if (unitLabel) {
    unitLabel.textContent = '请选择单位';
    unitLabel.style.color = '#c0c4cc';
  }
}

// ===== 单位选择器（紧凑版，规格/单位组件内使用） =====
function glBuildUnitSelect(id, unitVal) {
  var displayText = unitVal || '请选择单位';
  var labelColor = unitVal ? '#303133' : '#c0c4cc';
  return '<div style="position:relative;flex-shrink:0" id="' + id + 'UnitWrap">' +
    '<span class="gl-su-unit" style="display:inline-flex;align-items:center;gap:2px;cursor:pointer;user-select:none" onclick="event.stopPropagation();glToggleGenericSelect(\'' + id + '\', \'units\')">' +
      '<span id="' + id + 'Label" style="color:' + labelColor + '">' + escapeHtml(displayText) + '</span>' +
      '<svg viewBox="0 0 12 12" width="10" height="10" style="flex-shrink:0"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke="#c0c4cc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</span>' +
    '<input type="hidden" id="' + id + '" value="' + escapeHtml(unitVal) + '">' +
    '<div class="gl-ss-drop" id="' + id + 'Drop" style="min-width:80px;left:auto;right:0"></div>' +
    '</div>';
}

function glOpenAddModal(data) {
  GL_ADD_MODE = data ? 'edit' : 'add';
  GL_EDIT_DATA = data || null;
  var existing = document.getElementById('glAddModalOverlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'glAddModalOverlay';
  overlay.className = 'gl-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  var isEdit = !!data;
  var goodsName = data ? data.goodsName : '';
  var salesName = data ? (data.salesName || '') : '';
  var goodsClassId = data ? (data.goodsClassId || data.categoryId || '') : '';
  var goodsCategoryName = goodsClassId ? getCategoryName(goodsClassId) : '';
  var goodsUnitId = data ? (data.goodsUnitId || '') : '';
  var goodsSpecRaw = data ? (data.goodsSpec || '') : '';
  // 从规格中分离数值和单位：500g/袋 → specPart=500g, unitPart=袋
  var slashIdx = goodsSpecRaw.lastIndexOf('/');
  var goodsSpecPart = slashIdx >= 0 ? goodsSpecRaw.slice(0, slashIdx) : goodsSpecRaw;
  var goodsUnitPart = slashIdx >= 0 ? goodsSpecRaw.slice(slashIdx + 1) : '';
  // 如果 goodsUnitId 存在但不在 specPart 里，用 goodsUnitId 覆盖 unitPart
  if (!goodsUnitPart && goodsUnitId) goodsUnitPart = goodsUnitId;
  if (!goodsUnitPart || ['千克','克','毫升','升'].indexOf(goodsUnitPart) >= 0) {
    // unitPart 是完整中文单位名，直接使用
  } else {
    // 简写映射
    var suMap = { kg:'千克', g:'克', ml:'毫升', l:'升' };
    goodsUnitPart = suMap[goodsUnitPart] || goodsUnitPart;
  }
  var brand = data ? (data.goodsBrand || '') : '';
  var goodsListPrice = data ? data.goodsListPrice : '';
  var goodsPrice = data ? data.goodsPrice : '';
  var shopName = data ? data.shopName : '';
  var picUrl = data ? (data.picUrl || '') : '';


  overlay.innerHTML =
    '<div class="gl-modal">' +
      '<div class="gl-modal-header">' +
        '<span class="gl-modal-title">' + (isEdit ? '编辑商品' : '新增商品') + '</span>' +
        '<button class="gl-modal-close" onclick="document.getElementById(\'glAddModalOverlay\').remove()">✕</button>' +
      '</div>' +
      '<div class="gl-modal-body">' +
        // 商品图片
        '<div class="gl-form-item gl-form-item-block">' +
          '<span class="gl-form-label">商品图片</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-upload-area">' +
              '<div class="gl-upload-box" id="glAddPicBox" onclick="glTriggerUpload(\'glAddPicInput\')">' +
                (picUrl ? '<img src="' + picUrl + '" alt="商品图">' : '<span class="gl-upload-text">点击上传</span>') +
              '</div>' +
              '<input type="file" id="glAddPicInput" accept="image/*" style="display:none" onchange="glPreviewPic(this, \'glAddPicBox\')">' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Row 1: 系统商品(100%) - 搜索下拉
        '<div class="gl-form-grid">' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label"><span class="required">*</span>系统商品</span>' +
            '<div class="gl-form-control">' + glBuildSearchSelect('glAddName', goodsName, '请搜索选择系统商品', 'glAddSalesName') + '</div>' +
          '</div>' +
          '<div style="visibility:hidden"></div>' +
        '</div>' +
        // Row 2: 销售品名(50%) + 商品分类(50%)
        '<div class="gl-form-grid">' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label">销售品名</span>' +
            '<div class="gl-form-control">' + glInputWrap('glAddSalesName', salesName, '不填默认为系统商品名称') + '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label">商品分类</span>' +
            '<div class="gl-form-control">' + glBuildGenericSelect('glAddClassId', goodsCategoryName, '请选择分类', 'categories', goodsClassId) + '</div>' +
          '</div>' +
        '</div>' +
        // Row 3: 规格/单位(50%) + 品牌(50%)
        '<div class="gl-form-grid">' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label"><span class="required">*</span>规格/单位</span>' +
            '<div class="gl-form-control">' +
              '<div class="gl-su-wrap" id="glAddSuWrap">' +
                '<input class="gl-su-spec" id="glAddSpec" value="' + escapeHtml(goodsSpecPart) + '" placeholder="规格">' +
                '<span class="gl-su-sep">/</span>' +
                glBuildUnitSelect('glAddUnit', goodsUnitPart) +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label">品牌</span>' +
            '<div class="gl-form-control">' + glInputWrap('glAddBrand', brand, '请输入品牌') + '</div>' +
          '</div>' +
        '</div>' +
        // Row 4: 商品销售价(50%) + 商品原价(50%)
        '<div class="gl-form-grid">' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label"><span class="required">*</span>售价</span>' +
            '<div class="gl-form-control">' + glInputWrap('glAddPrice', goodsPrice, '请输入售价') + '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label">原价</span>' +
            '<div class="gl-form-control">' + glInputWrap('glAddListPrice', goodsListPrice, '请输入原价') + '</div>' +
          '</div>' +
        '</div>' +
        // Row 5: 门店(50%)
        '<div class="gl-form-grid">' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label"><span class="required">*</span>门店</span>' +
            '<div class="gl-form-control">' + glBuildGenericSelect('glAddShop', shopName, '请选择门店', 'shops') + '</div>' +
          '</div>' +
          '<div style="visibility:hidden"></div>' +
        '</div>' +
      '</div>' +
      '<div class="gl-modal-footer">' +
        '<button class="gl-btn gl-btn-plain" onclick="document.getElementById(\'glAddModalOverlay\').remove()">取消</button>' +
        '<button class="gl-btn gl-btn-primary" onclick="glSaveAddGoods()">确定</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  // 编辑态：系统商品不可修改、不可删除，单位不可调整
  if (isEdit) {
    var nameInput = document.getElementById('glAddName');
    var nameClr = document.getElementById('glAddNameClear');
    if (nameInput) { nameInput.readOnly = true; }
    if (nameClr) { nameClr.style.display = 'none'; }
    // 单位不可修改：移除下拉箭头和 onclick，禁用交互
    var unitWrap = document.getElementById('glAddUnitUnitWrap');
    if (unitWrap) {
      var unitBtn = unitWrap.querySelector('.gl-su-unit');
      var unitArrow = unitBtn ? unitBtn.querySelector('svg') : null;
      if (unitBtn) { unitBtn.removeAttribute('onclick'); unitBtn.style.cursor = 'default'; }
      if (unitArrow) { unitArrow.style.display = 'none'; }
    }
  } else {
    // 绑定系统商品搜索下拉事件
    var ssInput = document.getElementById('glAddName');
    if (ssInput) {
      ssInput.addEventListener('focus', function() { glInitSearchSelect('glAddName'); });
      ssInput.addEventListener('input', function() {
        var clearBtn = document.getElementById('glAddNameClear');
        if (clearBtn) clearBtn.style.display = ssInput.value ? '' : 'none';
        glInitSearchSelect('glAddName');
      });
    }
  }
}

function glSaveAddGoods() {
  var name = document.getElementById('glAddName').value.trim();
  var classId = document.getElementById('glAddClassId').value;
  var unit = document.getElementById('glAddUnit').value;
  var spec = document.getElementById('glAddSpec').value.trim();
  var fullSpec = spec && unit ? (spec + '/' + unit) : spec;
  var brand = document.getElementById('glAddBrand').value.trim();
  var listPrice = document.getElementById('glAddListPrice').value.trim();
  var price = document.getElementById('glAddPrice').value.trim();
  var shop = document.getElementById('glAddShop').value;
  var picBox = document.getElementById('glAddPicBox');
  var picUrl = '';
  var img = picBox ? picBox.querySelector('img') : null;
  if (img) picUrl = img.src;

  if (!name) { alert('请搜索选择系统商品'); return; }
  if (!GL_SYSTEM_GOODS.some(function(g) { return g.name === name; })) { alert('请从系统库中选择商品'); return; }
  if (!unit) { alert('请选择商品单位'); return; }
  if (!spec) { alert('请输入商品规格'); return; }
  if (!price) { alert('请输入商品销售价'); return; }
  if (!shop) { alert('请选择门店'); return; }

  var salesName = (document.getElementById('glAddSalesName') || {}).value || '' || name;

  var sellablePrice = parseFloat(price) || 0;
  var listPriceNum = parseFloat(listPrice) || 0;

  if (GL_ADD_MODE === 'edit' && GL_EDIT_DATA) {
    GL_EDIT_DATA.goodsName = name;
    GL_EDIT_DATA.salesName = salesName;
    GL_EDIT_DATA.categoryId = classId;
    GL_EDIT_DATA.goodsUnitId = unit;
    GL_EDIT_DATA.goodsSpec = fullSpec;
    GL_EDIT_DATA.goodsPrice = sellablePrice;
    GL_EDIT_DATA.goodsListPrice = listPriceNum;
    GL_EDIT_DATA.supplierName = '';
    GL_EDIT_DATA.goodsBrand = brand;
    GL_EDIT_DATA.shopName = shop;
    GL_EDIT_DATA.memberPrice = GL_EDIT_DATA.memberPrice || null;
    if (picUrl) GL_EDIT_DATA.picUrl = picUrl;
  } else {
    var newId = 'g-new-' + Date.now();
    GL_MOCK_DATA.unshift({
      goodsId: newId,
      goodsName: name,
      salesName: salesName,
      goodsCode: 'SP' + String(new Date().getFullYear()).slice(2) + String(GL_MOCK_DATA.length + 1).padStart(4, '0'),
      goodsUnitId: unit,
      goodsSpec: fullSpec,
      goodsPrice: sellablePrice,
      goodsListPrice: listPriceNum,
      memberPrice: null,
      status: '0',
      enable: 0,
      companyName: '崧泽集团',
      shopName: shop,
      supplierName: '',
      goodsBrand: brand,
      picUrl: picUrl,
      categoryId: classId,
      isSellable: 1,
      isMarked: 0,
      goodsTag: ''
    });
  }

  document.getElementById('glAddModalOverlay').remove();
  glRenderTable();
}

function glPreviewPic(input, boxId) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = '<img src="' + e.target.result + '">';
  };
  reader.readAsDataURL(file);
}

// ===== 新增标品弹窗 =====
// 非售商品 radio 改变时联动禁用/启用售价
function glStdOnSaleTypeChange() {
  var checked = document.querySelector('input[name="glStdSaleType"]:checked');
  var isNonSell = checked && checked.value === '0';
  // 售价
  var priceInput = document.getElementById('glStdPrice');
  var priceClr = document.getElementById('glStdPriceClear');
  if (priceInput) {
    priceInput.readOnly = isNonSell;
    if (isNonSell) { if (priceClr) priceClr.style.display = 'none'; }
  }
  // 原价
  var listPriceInput = document.getElementById('glStdListPrice');
  var listPriceClr = document.getElementById('glStdListPriceClear');
  if (listPriceInput) {
    listPriceInput.readOnly = isNonSell;
    if (isNonSell) { if (listPriceClr) listPriceClr.style.display = 'none'; }
  }
}

function glOpenStandardModal(data) {
  GL_STD_ADD_MODE = data ? 'edit' : 'add';
  GL_STD_EDIT_DATA = data || null;
  var existing = document.getElementById('glStandardModalOverlay');
  if (existing) existing.remove();

  var isEdit = !!data;
  var stdCode = data ? (data.goodsCode || '') : '';
  var stdLabelName = data ? (data.name || data.goodsLibraryName || '') : '';  // 标品名称
  var stdGoodsName = data ? (data.goodsName || '') : '';
  var stdSalesName = data ? (data.salesName || '') : '';
  var stdClassId = data ? (data.categoryId || data.goodsClassId || '') : '';
  var stdCategoryName = stdClassId ? getCategoryName(stdClassId) : '';
  var stdBrand = data ? (data.goodsBrand || '') : '';
  var stdUnitRaw = data ? (data.goodsUnitId || '') : '';
  var stdSpecRaw = data ? (data.goodsSpec || '') : '';
  // 从 goodsSpec 解析规格/单位: "500g/袋" → specPart="500g", unitPart="袋"
  var stdSlashIdx = stdSpecRaw.lastIndexOf('/');
  var stdSpecPart = stdSlashIdx >= 0 ? stdSpecRaw.slice(0, stdSlashIdx) : stdSpecRaw;
  var stdUnitPart = stdSlashIdx >= 0 ? stdSpecRaw.slice(stdSlashIdx + 1) : '';
  if (!stdUnitPart && stdUnitRaw) stdUnitPart = stdUnitRaw;
  if (stdUnitPart) {
    var suMap2 = { kg:'千克', g:'克', ml:'毫升', l:'升' };
    stdUnitPart = suMap2[stdUnitPart] || stdUnitPart;
  }
  var stdListPrice = data ? (data.goodsListPrice || '') : '';
  var stdPrice = data ? (data.goodsPrice || '') : '';
  var stdShop = data ? (data.shopName || '') : '';
  var picUrl = data ? (data.picUrl || '') : '';
  var stdSaleType = data ? (data.isSellable !== undefined ? String(data.isSellable) : '1') : '1';
  var stdShelfLife = data ? (data.shelfLife || '') : '';
  var stdShelfLifeType = data ? (data.shelfLifeType || 'day') : 'day';
  var stdStorage = data ? (data.storage || '') : '';
  // 从规格中解析保质期信息（兼容旧数据）
  if (!stdShelfLife && stdSpecRaw && stdSpecRaw.indexOf(' | ') !== -1) {
    var parts2 = stdSpecRaw.split(' | ');
    stdSpecPart = parts2[0];
    var lifePart2 = parts2[1];
    if (lifePart2.indexOf('天') !== -1) { stdShelfLife = lifePart2.replace('天', ''); stdShelfLifeType = 'day'; }
    else if (lifePart2.indexOf('月') !== -1) { stdShelfLife = lifePart2.replace('月', ''); stdShelfLifeType = 'month'; }
    else if (lifePart2.indexOf('年') !== -1) { stdShelfLife = lifePart2.replace('年', ''); stdShelfLifeType = 'year'; }
  }


  var overlay = document.createElement('div');
  overlay.id = 'glStandardModalOverlay';
  overlay.className = 'gl-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML =
    '<div class="gl-modal gl-modal-wide">' +
      '<div class="gl-modal-header">' +
        '<span class="gl-modal-title">' + (isEdit ? '编辑标品' : '新增标品') + '</span>' +
        '<button class="gl-modal-close" onclick="document.getElementById(\'glStandardModalOverlay\').remove()">✕</button>' +
      '</div>' +
      '<div class="gl-modal-body">' +
        // 商品图片
        '<div class="gl-form-item gl-form-item-block">' +
          '<span class="gl-form-label">商品图片</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-upload-area">' +
              '<div class="gl-upload-box" id="glStdPicBox" onclick="glTriggerUpload(\'glStdPicInput\')">' +
                (picUrl ? '<img src="' + picUrl + '" alt="商品图">' : '<span class="gl-upload-text">点击上传</span>') +
              '</div>' +
              '<input type="file" id="glStdPicInput" accept="image/*" style="display:none" onchange="glPreviewPic(this, \'glStdPicBox\')">' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Row 1: 条码(span2) + 标品名称(span2)
        '<div class="gl-form-grid-4">' +
          '<div class="gl-form-item gl-span2">' +
            '<span class="gl-form-label gl-form-label-s"><span class="required">*</span>条码</span>' +
            '<div class="gl-form-control">' + glInputWrap('glStdCode', stdCode, '请输入条码或扫码', (isEdit ? ' readonly' : '')) + '</div>' +
          '</div>' +
          '<div class="gl-form-item gl-span2">' +
            '<span class="gl-form-label gl-form-label-s">标品名称</span>' +
            '<div class="gl-form-control">' + glInputWrap('glStdLabelName', stdLabelName, '标品名称', 'readonly') + '</div>' +
          '</div>' +
        '</div>' +
        // Row 2: 销售品名(span2) + 商品分类(1) + 品牌(1)
        '<div class="gl-form-grid-4">' +
          '<div class="gl-form-item gl-span2">' +
            '<span class="gl-form-label gl-form-label-s"><span class="required">*</span>销售品名</span>' +
            '<div class="gl-form-control">' + glInputWrap('glStdGoodsName', stdGoodsName, '请输入销售品名') + '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s">商品分类</span>' +
            '<div class="gl-form-control">' + glBuildGenericSelect('glStdClassId', stdCategoryName, '请选择分类', 'categories', stdClassId) + '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s">品牌</span>' +
            '<div class="gl-form-control">' + glInputWrap('glStdBrand', stdBrand, '请输入品牌') + '</div>' +
          '</div>' +
        '</div>' +
        // Row 3: 规格/单位(span2) + 保质期(1) + 贮藏(1)
        '<div class="gl-form-grid-4">' +
          '<div class="gl-form-item gl-span2">' +
            '<span class="gl-form-label gl-form-label-s"><span class="required">*</span>规格/单位</span>' +
            '<div class="gl-form-control">' +
              '<div class="gl-su-wrap" id="glStdSuWrap">' +
                '<input class="gl-su-spec" id="glStdSpec" value="' + escapeHtml(stdSpecPart) + '" placeholder="规格">' +
                '<span class="gl-su-sep">/</span>' +
                glBuildUnitSelect('glStdUnit', stdUnitPart) +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s">保质期</span>' +
            '<div class="gl-form-control"><div class="gl-life-box">' +
              '<input class="gl-form-input" id="glStdShelfLife" value="' + stdShelfLife + '" placeholder="保质期">' +
              '<select class="gl-form-select" id="glStdShelfLifeType">' +
                '<option value="day"' + (stdShelfLifeType === 'day' ? ' selected' : '') + '>天</option>' +
                '<option value="month"' + (stdShelfLifeType === 'month' ? ' selected' : '') + '>月</option>' +
                '<option value="year"' + (stdShelfLifeType === 'year' ? ' selected' : '') + '>年</option>' +
              '</select>' +
            '</div></div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s">贮藏</span>' +
            '<div class="gl-form-control">' + glInputWrap('glStdStorage', stdStorage, '请输入贮藏条件') + '</div>' +
          '</div>' +
        '</div>' +
        // Row 4: 售价 + 原价 + 非售商品 + 门店
        '<div class="gl-form-grid-4">' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s"><span class="required">*</span>售价</span>' +
            '<div class="gl-form-control">' + glInputWrap('glStdPrice', stdPrice, '请输入售价', (stdSaleType === '0' ? ' disabled' : '')) + '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s">原价</span>' +
            '<div class="gl-form-control">' + glInputWrap('glStdListPrice', stdListPrice, '请输入原价') + '</div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s">非售商品</span>' +
            '<div class="gl-form-control"><div class="gl-radio-group" onchange="glStdOnSaleTypeChange()">' +
              '<label><input type="radio" name="glStdSaleType" value="0"' + (stdSaleType === '0' ? ' checked' : '') + '> 是</label>' +
              '<label><input type="radio" name="glStdSaleType" value="1"' + (stdSaleType === '1' ? ' checked' : '') + '> 否</label>' +
            '</div></div>' +
          '</div>' +
          '<div class="gl-form-item">' +
            '<span class="gl-form-label gl-form-label-s">门店</span>' +
            '<div class="gl-form-control">' + glBuildGenericSelect('glStdShop', stdShop, '请选择门店', 'shops') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="gl-modal-footer">' +
        '<button class="gl-btn gl-btn-plain" onclick="document.getElementById(\'glStandardModalOverlay\').remove()">取消</button>' +
        '<button class="gl-btn gl-btn-primary" onclick="glSaveStandard()">确定</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  // 编辑态：条码不可删除，单位不可调整
  if (isEdit) {
    var codeClr = document.getElementById('glStdCodeClr');
    if (codeClr) codeClr.style.display = 'none';
    // 单位不可修改
    var unitWrap = document.getElementById('glStdUnitUnitWrap');
    if (unitWrap) {
      var unitBtn = unitWrap.querySelector('.gl-su-unit');
      var unitArrow = unitBtn ? unitBtn.querySelector('svg') : null;
      if (unitBtn) { unitBtn.removeAttribute('onclick'); unitBtn.style.cursor = 'default'; }
      if (unitArrow) { unitArrow.style.display = 'none'; }
    }
  }
}

function glSaveStandard() {
  var code = document.getElementById('glStdCode').value.trim();
  var labelName = document.getElementById('glStdLabelName').value.trim();
  var goodsName = document.getElementById('glStdGoodsName').value.trim() || labelName;
  var classId = document.getElementById('glStdClassId').value;
  var brand = document.getElementById('glStdBrand').value.trim();
  var unitSelect = document.getElementById('glStdUnit').value;
  var spec = document.getElementById('glStdSpec').value.trim();
  var specUnit = spec && unitSelect ? (spec + '/' + unitSelect) : (spec || unitSelect);
  var shelfLife = document.getElementById('glStdShelfLife').value.trim();
  var shelfLifeType = document.getElementById('glStdShelfLifeType').value;
  var storage = document.getElementById('glStdStorage').value.trim();
  var saleTypeEl = document.querySelector('input[name="glStdSaleType"]:checked');
  var saleType = saleTypeEl ? saleTypeEl.value : '1';
  var listPrice = document.getElementById('glStdListPrice').value.trim();
  var price = document.getElementById('glStdPrice').value.trim();
  var shop = document.getElementById('glStdShop').value;
  var picBox = document.getElementById('glStdPicBox');
  var picUrl = '';
  var img = picBox ? picBox.querySelector('img') : null;
  if (img) picUrl = img.src;

  if (!code) { alert('请输入条码'); return; }
  if (!goodsName) { alert('请搜索选择系统商品'); return; }
  if (!GL_SYSTEM_GOODS.some(function(g) { return g.name === goodsName; })) { alert('请从系统库中选择商品'); return; }
  if (!unitSelect) { alert('请选择单位'); return; }
  if (!spec) { alert('请输入规格'); return; }
  if (saleType === '1' && !price) { alert('请输入售价'); return; }
  if (!shop) { alert('请选择门店'); return; }

  var salesName = goodsName;

  var shelfLifeLabel = '';
  if (shelfLife) {
    shelfLifeLabel = shelfLife + (shelfLifeType === 'day' ? '天' : shelfLifeType === 'month' ? '月' : '年');
  }
  var fullSpec = shelfLifeLabel ? (specUnit + ' | ' + shelfLifeLabel) : specUnit;

  if (GL_STD_ADD_MODE === 'edit' && GL_STD_EDIT_DATA) {
    GL_STD_EDIT_DATA.goodsCode = code;
    GL_STD_EDIT_DATA.name = labelName;
    GL_STD_EDIT_DATA.goodsLibraryName = labelName;
    GL_STD_EDIT_DATA.goodsName = goodsName;
    GL_STD_EDIT_DATA.salesName = salesName;
    GL_STD_EDIT_DATA.goodsClassId = classId;
    GL_STD_EDIT_DATA.categoryId = classId;
    GL_STD_EDIT_DATA.goodsBrand = brand;
    GL_STD_EDIT_DATA.goodsUnitId = unitSelect;
    GL_STD_EDIT_DATA.goodsSpec = fullSpec;
    GL_STD_EDIT_DATA.storage = storage;
    GL_STD_EDIT_DATA.isSellable = parseInt(saleType);
    GL_STD_EDIT_DATA.goodsListPrice = parseFloat(listPrice) || 0;
    GL_STD_EDIT_DATA.goodsPrice = parseFloat(price) || 0;
    GL_STD_EDIT_DATA.shopName = shop;
    if (picUrl) GL_STD_EDIT_DATA.picUrl = picUrl;
  } else {
    var newId = 'g-std-' + Date.now();
    GL_MOCK_DATA.unshift({
      goodsId: newId,
      name: labelName,
      goodsLibraryName: labelName,
      goodsName: goodsName,
      salesName: salesName,
      goodsCode: code,
      goodsUnitId: unitSelect,
      goodsSpec: fullSpec,
      goodsPrice: parseFloat(price) || 0,
      goodsListPrice: parseFloat(listPrice) || 0,
      memberPrice: null,
      status: '0',
      enable: 0,
      companyName: '崧泽集团',
      shopName: shop,
      supplierName: '',
      picUrl: picUrl,
      categoryId: classId || '',
      goodsBrand: brand,
      storage: storage,
      shelfLife: shelfLife,
      shelfLifeType: shelfLifeType,
      isSellable: parseInt(saleType),
      isMarked: 0,
      goodsTag: ''
    });
  }

  document.getElementById('glStandardModalOverlay').remove();
  glRenderTable();
}