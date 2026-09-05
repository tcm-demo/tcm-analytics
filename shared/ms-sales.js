// ========== 销售域（订单列表） ==========
var MS_SALES_LOADED = true;
function msOdEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function msOdToast(m) { try { showToast(m); } catch (e) { alert(m); } }
function msOdNum(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function msOdMoney(v) { return '¥' + (msOdNum(v) || 0).toFixed(2); }
function msOdDlg(opt) {
  var b = document.getElementById('msOdBackdrop'), m = document.getElementById('msOdModal');
  if (b) b.remove(); if (m) m.remove();
  var bd = document.createElement('div'); bd.className = 'ic-modal-backdrop'; bd.id = 'msOdBackdrop';
  bd.onclick = function (e) { if (e.target === this) { bd.remove(); md.remove(); } };
  var md = document.createElement('div'); md.className = 'ic-modal'; md.id = 'msOdModal';
  md.style.cssText = 'width:' + (opt.width || 'min(720px,94vw)') + ';';
  var foot = '';
  if (opt.footer !== false) {
    foot = '<div class="ic-modal-footer"><button class="btn-secondary" onclick="var b=document.getElementById(\'msOdBackdrop\'),m=document.getElementById(\'msOdModal\');if(b)b.remove();if(m)m.remove();">关闭</button></div>';
  }
  md.innerHTML = '<div class="ic-modal-header"><span>' + opt.title + '</span><button class="ic-modal-close" onclick="var b=document.getElementById(\'msOdBackdrop\'),m=document.getElementById(\'msOdModal\');if(b)b.remove();if(m)m.remove();">✕</button></div>'
    + '<div class="ic-modal-body" id="msOdBody" style="' + (opt.bodyStyle || 'max-height:70vh;overflow:auto;') + '">' + opt.body + '</div>' + foot;
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msOdPager(total, page, size, pagerId, cbName) {
  var bar = document.getElementById(pagerId); if (!bar) return;
  var keep = bar.innerHTML; // 保留调用前已写入的合计条，避免覆盖
  var pages = Math.ceil(total / size) || 1;
  if (page > pages) page = pages; if (page < 1) page = 1;
  var html = '<span class="page-info">共 ' + total + ' 条</span><div class="page-btns">';
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
  var s = Math.max(1, page - 2), e = Math.min(pages, page + 2);
  for (var p = s; p <= e; p++) html += '<button class="page-btn' + (p === page ? ' active' : '') + '" style="' + (p === page ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="' + cbName + '(' + p + ')">' + p + '</button>';
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page + 1) + ')" ' + (page >= pages ? 'disabled' : '') + '>›</button></div>';
  bar.innerHTML = keep + html;
}
function msOdStatusBadge(s) {
  var map = { '10': 'warn', '20': 'info', '30': 'ok', '40': 'err', '50': 'info' };
  var text = { '10': '待支付', '20': '支付中', '30': '支付成功', '40': '支付失败', '50': '订单关闭' };
  var style = { warn: 'background:#fdf6ec;color:#e6a23c;border:1px solid #faecd8', info: 'background:#f4f4f5;color:#909399;border:1px solid #e9e9eb', ok: 'background:#f0f9eb;color:#67c23a;border:1px solid #e1f3d8', err: 'background:#fef0f0;color:#f56c6c;border:1px solid #fde2e2' };
  return '<span style="display:inline-block;padding:1px 10px;border-radius:10px;font-size:12px;line-height:18px;white-space:nowrap;' + (style[map[s]] || style.info) + '">' + (text[s] || s) + '</span>';
}

/* ================================================================
 * 1) 订单列表 order-list
 * ================================================================ */
var OD_KEY = 'tcm_order_list_v1';
var OD_PAGE = 1, OD_SIZE = 10, OD_KW = '', OD_ST = '', OD_D1 = '', OD_D2 = '', OD_STORE = '';
var OD_ORDERS = [];
var OD_PAY_STATUS = { '': '全部', '10': '待支付', '20': '支付中', '30': '支付成功', '40': '支付失败', '50': '订单关闭' };
var OD_PAY_METHOD = { 'wechat': '微信支付', 'alipay': '支付宝', 'cash': '现金', 'card': '银行卡', 'mixed': '混合支付' };
var OD_SEED = [
  { orderId: 'ORD20260901001', orderTime: '2026-09-01 08:23:11', payTime: '2026-09-01 08:23:45', payNo: 'PAY20260901001001', discount: 3.50, amount: 86.30, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 2, weight: 5.00, promotion: true, discount: 0, paid: 24.90 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0, promotion: false, discount: 0, paid: 19.90 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 2, weight: 0, promotion: true, discount: 3.50, paid: 56.30 }
  ] },
  { orderId: 'ORD20260901002', orderTime: '2026-09-01 09:05:33', payTime: '2026-09-01 09:06:01', payNo: 'PAY20260901002002', discount: 0, amount: 15.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.5, promotion: false, discount: 0, paid: 15.80 }
  ] },
  { orderId: 'ORD20260901003', orderTime: '2026-09-01 10:48:22', payTime: '', payNo: '', discount: 0, amount: 198.00, status: '10', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.8, promotion: false, discount: 0, paid: 71.82 },
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 126.18, qty: 1, weight: 0, promotion: false, discount: 0, paid: 126.18 }
  ] },
  { orderId: 'ORD20260901004', orderTime: '2026-09-01 11:17:49', payTime: '2026-09-01 11:18:10', payNo: 'PAY20260901004004', discount: 5.00, amount: 45.00, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0, promotion: true, discount: 2.50, paid: 22.50 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.2, promotion: false, discount: 0, paid: 28.56 }
  ] },
  { orderId: 'ORD20260901005', orderTime: '2026-09-01 13:22:06', payTime: '', payNo: '', discount: 0, amount: 9.90, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0, promotion: false, discount: 0, paid: 9.90 }
  ] },
  { orderId: 'ORD20260901006', orderTime: '2026-09-01 14:55:17', payTime: '2026-09-01 14:55:48', payNo: 'PAY20260901006006', discount: 0, amount: 32.00, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.55, promotion: false, discount: 0, paid: 32.00 }
  ] },
  { orderId: 'ORD20260901007', orderTime: '2026-09-01 16:40:59', payTime: '2026-09-01 16:41:30', payNo: 'PAY20260901007007', discount: 8.00, amount: 120.00, status: '40', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500189', name: '青岛啤酒(500ml×12)', spec: '12瓶/箱', price: 128.00, qty: 1, weight: 0, promotion: true, discount: 8.00, paid: 120.00 }
  ] },
  { orderId: 'ORD20260901008', orderTime: '2026-09-01 18:12:34', payTime: '2026-09-01 18:13:02', payNo: 'PAY20260901008008', discount: 0, amount: 66.50, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 1, weight: 0, promotion: false, discount: 0, paid: 42.90 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0, promotion: false, discount: 0, paid: 8.80 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 1, weight: 0, promotion: false, discount: 0, paid: 14.80 }
  ] },
  { orderId: 'ORD20260901009', orderTime: '2026-09-01 19:28:15', payTime: '2026-09-01 19:28:40', payNo: 'PAY20260901009009', discount: 0, amount: 218.00, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500202', name: '帮宝适纸尿裤M码', spec: '54片/包', price: 109.00, qty: 2, weight: 0, promotion: false, discount: 0, paid: 218.00 }
  ] },
  { orderId: 'ORD20260901010', orderTime: '2026-09-01 20:05:51', payTime: '', payNo: '', discount: 0, amount: 7.50, status: '20', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330ml×6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0, promotion: true, discount: 7.50, paid: 7.50 }
  ] },
  { orderId: 'ORD20260902011', orderTime: '2026-09-02 08:44:20', payTime: '2026-09-02 08:44:55', payNo: 'PAY20260902011011', discount: 0, amount: 53.60, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 1.1, promotion: false, discount: 0, paid: 28.38 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.94, promotion: false, discount: 0, paid: 25.22 }
  ] },
  { orderId: 'ORD20260902012', orderTime: '2026-09-02 10:10:10', payTime: '2026-09-02 10:10:40', payNo: 'PAY20260902012012', discount: 0, amount: 12.50, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500127', name: '原味酸奶(100g×8)', spec: '8杯/组', price: 12.50, qty: 1, weight: 0, promotion: false, discount: 0, paid: 12.50 }
  ] },
  { orderId: 'ORD20260902013', orderTime: '2026-09-02 12:30:00', payTime: '', payNo: '', discount: 0, amount: 99.00, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 5.50, qty: 18, weight: 0, promotion: false, discount: 0, paid: 99.00 }
  ] },
  { orderId: 'ORD20260902014', orderTime: '2026-09-02 15:18:42', payTime: '2026-09-02 15:19:12', payNo: 'PAY20260902014014', discount: 0, amount: 36.00, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.67, promotion: false, discount: 0, paid: 17.95 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.64, promotion: false, discount: 0, paid: 18.05 }
  ] },
  { orderId: 'ORD20260902015', orderTime: '2026-09-02 17:05:33', payTime: '2026-09-02 17:06:05', payNo: 'PAY20260902015015', discount: 2.00, amount: 48.00, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 126.18, qty: 1, weight: 0, promotion: true, discount: 2.00, paid: 124.18 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0, promotion: false, discount: 0, paid: 8.80 }
  ] },
  { orderId: 'ORD20260902016', orderTime: '2026-09-02 20:22:11', payTime: '', payNo: '', discount: 0, amount: 21.50, status: '50', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.5, promotion: false, discount: 0, paid: 21.50 }
  ] }
];
function odLoad() { try { var r = localStorage.getItem(OD_KEY); if (r) { OD_ORDERS = JSON.parse(r); return; } } catch (e) {} OD_ORDERS = JSON.parse(JSON.stringify(OD_SEED)); odPersist(); }
function odPersist() { try { localStorage.setItem(OD_KEY, JSON.stringify(OD_ORDERS)); } catch (e) {} }
function odById(id) { for (var i = 0; i < OD_ORDERS.length; i++) if (OD_ORDERS[i].orderId === id) return OD_ORDERS[i]; return null; }
function odGoodsAmount(o) { return o.items.reduce(function (sum, it) { return sum + msOdNum(it.price) * msOdNum(it.qty); }, 0); }
function odItemQty(it) { return it.weight > 0 && it.qty <= 1 ? (msOdNum(it.weight).toFixed(2) + it.spec.split('/').pop()) : (it.qty + '件'); }
function odInit() {
  odLoad();
  var el = document.getElementById('order-listContent');
  if (!el) { setTimeout(odInit, 80); return; }
  var stOpt = function (v) { return '<option value="' + v + '"' + (OD_ST === v ? ' selected' : '') + '>' + OD_PAY_STATUS[v] + '</option>'; };
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<select class="ic-input" style="width:160px" onchange="odStore(this.value)"><option value="">全部门店</option><option value="S2001"' + (OD_STORE === 'S2001' ? ' selected' : '') + '>崧泽-青浦旗舰店</option><option value="S2002"' + (OD_STORE === 'S2002' ? ' selected' : '') + '>崧泽-松江分店</option></select>' +
      '<span style="font-size:12px;color:#8a93a3">下单时间</span>' +
      '<input type="date" class="ic-input" style="width:148px" id="odD1" value="' + OD_D1 + '">' +
      '<span style="color:#8a93a3">—</span>' +
      '<input type="date" class="ic-input" style="width:148px" id="odD2" value="' + OD_D2 + '">' +
      '<select class="ic-input" style="width:130px" onchange="odSetSt(this.value)">' + stOpt('') + stOpt('10') + stOpt('20') + stOpt('30') + stOpt('40') + stOpt('50') + '</select>' +
      '<input class="ic-search" style="flex:0 1 200px" placeholder="订单号" value="' + msOdEsc(OD_KW) + '" onkeydown="if(event.key===\'Enter\')odQuery()" id="odKw">' +
      '<button class="ic-btn" onclick="odReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="odQuery()">查询</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1320px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:170px">下单时间</th><th style="width:170px">订单号</th><th style="width:110px">优惠金额(元)</th>' +
            '<th style="width:110px">实收金额(元)</th><th style="width:170px">支付时间</th><th style="width:170px">支付单号</th><th style="width:90px">支付状态</th>' +
            '<th style="width:130px">门店</th><th style="width:80px">营业员</th><th style="width:120px">公司</th>' +
          '</tr></thead>' +
          '<tbody id="odBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="odPager" style="flex-shrink:0"></div>' +
    '</div>';
  odRender();
}
function odStore(v) { OD_STORE = v; OD_PAGE = 1; odRender(); }
function odSetSt(v) { OD_ST = v; OD_PAGE = 1; odRender(); }
function odReset() { OD_KW = ''; OD_ST = ''; OD_D1 = ''; OD_D2 = ''; OD_STORE = ''; OD_PAGE = 1; var k = document.getElementById('odKw'); if (k) k.value = ''; document.getElementById('odD1').value = ''; document.getElementById('odD2').value = ''; odRender(); }
function odQuery() { var k = document.getElementById('odKw'), d1 = document.getElementById('odD1'), d2 = document.getElementById('odD2'); OD_KW = k ? k.value.trim() : ''; OD_D1 = d1 ? d1.value : ''; OD_D2 = d2 ? d2.value : ''; OD_PAGE = 1; odRender(); }
function odRows() {
  return OD_ORDERS.filter(function (o) {
    if (OD_STORE && o.store !== (OD_STORE === 'S2001' ? '崧泽-青浦旗舰店' : '崧泽-松江分店')) return false;
    if (OD_ST && String(o.status) !== OD_ST) return false;
    if (OD_D1 && o.orderTime.slice(0, 10) < OD_D1) return false;
    if (OD_D2 && o.orderTime.slice(0, 10) > OD_D2) return false;
    if (OD_KW && o.orderId.toLowerCase().indexOf(OD_KW.toLowerCase()) < 0) return false;
    return true;
  });
}
function odRender(page) {
  if (page) OD_PAGE = page;
  var rows = odRows();
  var pages = Math.ceil(rows.length / OD_SIZE) || 1;
  if (OD_PAGE > pages) OD_PAGE = pages; if (OD_PAGE < 1) OD_PAGE = 1;
  var slice = rows.slice((OD_PAGE - 1) * OD_SIZE, OD_PAGE * OD_SIZE);
  var body = document.getElementById('odBody'); if (!body) return;
  var totalDiscount = 0, totalAmount = 0;
  rows.forEach(function (o) { totalDiscount += msOdNum(o.discount); totalAmount += msOdNum(o.amount); });
  body.innerHTML = slice.map(function (o, i) {
    return '<tr><td style="text-align:center;color:#999">' + ((OD_PAGE - 1) * OD_SIZE + i + 1) + '</td>' +
      '<td style="font-size:11px;color:#5b6472">' + o.orderTime + '</td>' +
      '<td><button class="ic-op-link" style="font-weight:600" onclick="odDetail(\'' + o.orderId + '\')">' + o.orderId + '</button></td>' +
      '<td style="color:#5b6472">' + msOdMoney(o.discount) + '</td>' +
      '<td style="font-weight:600;color:#0b1019">' + msOdMoney(o.amount) + '</td>' +
      '<td style="font-size:11px;color:#8a93a3">' + (o.payTime || '—') + '</td>' +
      '<td style="font-size:11px;color:#8a93a3">' + (o.payNo || '—') + '</td>' +
      '<td>' + msOdStatusBadge(o.status) + '</td>' +
      '<td style="font-size:11px;color:#5b6472">' + msOdEsc(o.store) + '</td>' +
      '<td>' + msOdEsc(o.cashier) + '</td>' +
      '<td style="font-size:11px;color:#5b6472">' + msOdEsc(o.company) + '</td></tr>';
  }).join('') || '<tr><td colspan="11" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  var sumRow = '<div style="display:flex;gap:24px;font-size:12px;color:#5b6472;padding:8px 20px;background:#f7f9fc;border-top:1px solid #e9eef7;flex-shrink:0"><span>本页合计：优惠 <b style="color:#0b1019">' + msOdMoney(totalDiscount) + '</b></span><span>实收 <b style="color:#0b1019">' + msOdMoney(totalAmount) + '</b></span><span>订单数 <b style="color:#0b1019">' + rows.length + '</b></span></div>';
  var pager = document.getElementById('odPager');
  if (pager) pager.innerHTML = sumRow;
  msOdPager(rows.length, OD_PAGE, OD_SIZE, 'odPager', 'odRender');
}
function odDetail(id) {
  var o = odById(id); if (!o) return;
  var goodsAmount = odGoodsAmount(o);
  var itemRows = o.items.map(function (it) {
    var priceHtml = it.promotion ? '<span style="text-decoration:line-through;color:#c0c4cc;margin-right:6px">' + msOdMoney(it.price) + '</span><span>' + msOdMoney(it.paid / (it.qty || 1)) + '</span>' : msOdMoney(it.price);
    return '<tr><td style="padding:8px 12px">' + msOdEsc(it.name) + '</td><td style="padding:8px 12px">' + msOdEsc(it.code) + '</td><td style="padding:8px 12px">' + msOdEsc(it.spec) + '</td><td style="padding:8px 12px;text-align:right">' + priceHtml + '</td><td style="padding:8px 12px;text-align:center">' + odItemQty(it) + '</td><td style="padding:8px 12px;text-align:right;color:#f56c6c">' + msOdMoney(it.discount) + '</td><td style="padding:8px 12px;text-align:right;font-weight:600">' + msOdMoney(it.paid) + '</td></tr>';
  }).join('');
  var html = '<div style="font-size:12px;color:#0b1019">' +
    '<div style="margin-bottom:16px"><div style="font-weight:600;margin-bottom:8px;color:#0b1019">商品明细</div><div style="border:1px solid #e9eef7;border-radius:4px;overflow:hidden"><table style="width:100%;font-size:12px"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">商品名称</th><th style="padding:8px 12px;text-align:left">商品编码</th><th style="padding:8px 12px;text-align:left">商品规格</th><th style="padding:8px 12px;text-align:right">商品单价(元)</th><th style="padding:8px 12px;text-align:center">购买数量</th><th style="padding:8px 12px;text-align:right">优惠金额(元)</th><th style="padding:8px 12px;text-align:right">实收金额(元)</th></tr></thead><tbody>' + itemRows + '</tbody></table></div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
      '<div style="border:1px solid #e9eef7;border-radius:4px;padding:12px"><div style="font-weight:600;margin-bottom:10px;color:#0b1019">支付信息</div><div style="display:grid;grid-template-columns:80px 1fr;gap:8px 10px;color:#5b6472;font-size:12px"><span>支付方式</span><span>微信支付</span><span>商品金额</span><span>' + msOdMoney(goodsAmount) + '</span><span>优惠金额</span><span style="color:#f56c6c">' + msOdMoney(o.discount) + '</span><span>支付时间</span><span>' + (o.payTime || '—') + '</span><span>支付单号</span><span>' + (o.payNo || '—') + '</span><span>实收金额</span><span style="font-weight:600;color:#0b1019">' + msOdMoney(o.amount) + '</span></div></div>' +
      '<div style="border:1px solid #e9eef7;border-radius:4px;padding:12px"><div style="font-weight:600;margin-bottom:10px;color:#0b1019">订单信息</div><div style="display:grid;grid-template-columns:80px 1fr;gap:8px 10px;color:#5b6472;font-size:12px"><span>订单编号</span><span>' + o.orderId + '</span><span>下单时间</span><span>' + o.orderTime + '</span><span>门店</span><span>' + msOdEsc(o.store) + '</span><span>营业员</span><span>' + msOdEsc(o.cashier) + '</span><span>公司</span><span>' + msOdEsc(o.company) + '</span><span>终端MAC</span><span>00:1A:2B:3C:4D:5E</span></div></div>' +
    '</div>' +
    '</div>';
  msOdDlg({ title: '订单详情 · ' + o.orderId, width: 'min(960px,94vw)', body: html, bodyStyle: 'max-height:72vh;overflow:auto;' });
}

function initSalesPage(pid) {
  if (pid === 'order-list') odInit();
}
