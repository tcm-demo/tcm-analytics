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
  { orderId: 'ORD20260901001', orderTime: '2026-09-01 07:00:12', payTime: '2026-09-01 07:03:18', payNo: 'PAY20260901001001', payMethod: 'cash', discount: 0.00, amount: 119.42, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.92, promotion: false, discount: 0.00, paid: 34.18 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.31, promotion: false, discount: 0.00, paid: 31.18 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.44, promotion: false, discount: 0.00, paid: 14.26 }
  ] },
  { orderId: 'ORD20260901002', orderTime: '2026-09-01 11:56:23', payTime: '2026-09-01 11:56:51', payNo: 'PAY20260901002001', payMethod: 'cash', discount: 0.00, amount: 107.63, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.27, promotion: false, discount: 0.00, paid: 30.23 }
  ] },
  { orderId: 'ORD20260901003', orderTime: '2026-09-01 12:43:03', payTime: '2026-09-01 12:45:28', payNo: 'PAY20260901003001', payMethod: 'alipay', discount: 5.89, amount: 33.95, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.58, promotion: true, discount: 5.29, paid: 32.31 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.45, promotion: true, discount: 0.60, paid: 1.64 }
  ] },
  { orderId: 'ORD20260901004', orderTime: '2026-09-01 18:02:28', payTime: '2026-09-01 18:05:46', payNo: 'PAY20260901004001', payMethod: 'cash', discount: 0.00, amount: 4.44, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.97, promotion: false, discount: 0.00, paid: 4.44 }
  ] },
  { orderId: 'ORD20260901005', orderTime: '2026-09-01 19:14:56', payTime: '2026-09-01 19:17:15', payNo: 'PAY20260901005001', payMethod: 'cash', discount: 2.62, amount: 48.11, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.33, promotion: true, discount: 0.97, paid: 2.99 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.40, promotion: true, discount: 1.65, paid: 5.32 }
  ] },
  { orderId: 'ORD20260901006', orderTime: '2026-09-01 19:45:32', payTime: '2026-09-01 19:48:40', payNo: 'PAY20260901006001', payMethod: 'wechat', discount: 7.44, amount: 20.21, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.60, promotion: false, discount: 0.00, paid: 2.75 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 1, weight: 0.00, promotion: true, discount: 7.44, paid: 17.46, refund: 17.46 }
  ] },
  { orderId: 'ORD20260902001', orderTime: '2026-09-02 07:25:30', payTime: '2026-09-02 07:27:40', payNo: 'PAY20260902001001', payMethod: 'alipay', discount: 7.61, amount: 42.19, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: true, discount: 7.61, paid: 22.29 }
  ] },
  { orderId: 'ORD20260902002', orderTime: '2026-09-02 08:19:31', payTime: '', payNo: '', payMethod: '', discount: 4.01, amount: 75.77, status: '10', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.60, promotion: false, discount: 0.00, paid: 14.28 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.01, promotion: true, discount: 4.01, paid: 26.09 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 }
  ] },
  { orderId: 'ORD20260902003', orderTime: '2026-09-02 08:38:42', payTime: '2026-09-02 08:38:50', payNo: 'PAY20260902003001', payMethod: 'cash', discount: 0.00, amount: 131.13, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.43, promotion: false, discount: 0.00, paid: 96.96 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.94, promotion: false, discount: 0.00, paid: 22.37 }
  ] },
  { orderId: 'ORD20260902004', orderTime: '2026-09-02 09:47:47', payTime: '2026-09-02 09:48:38', payNo: 'PAY20260902004001', payMethod: 'alipay', discount: 0.00, amount: 19.90, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260902005', orderTime: '2026-09-02 11:19:56', payTime: '2026-09-02 11:20:01', payNo: 'PAY20260902005001', payMethod: 'wechat', discount: 0.00, amount: 65.22, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.69, promotion: false, discount: 0.00, paid: 40.22 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20260902006', orderTime: '2026-09-02 12:16:32', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 135.04, status: '50', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 96.00 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.78, promotion: false, discount: 0.00, paid: 8.86 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.91, promotion: false, discount: 0.00, paid: 30.18 }
  ] },
  { orderId: 'ORD20260902007', orderTime: '2026-09-02 12:51:25', payTime: '2026-09-02 12:53:11', payNo: 'PAY20260902007001', payMethod: 'cash', discount: 1.01, amount: 19.93, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 2.33, promotion: true, discount: 1.01, paid: 10.59 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.04, promotion: false, discount: 0.00, paid: 9.34 }
  ] },
  { orderId: 'ORD20260902008', orderTime: '2026-09-02 16:39:46', payTime: '2026-09-02 16:41:06', payNo: 'PAY20260902008001', payMethod: 'cash', discount: 0.00, amount: 71.00, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.89, promotion: false, discount: 0.00, paid: 11.30 }
  ] },
  { orderId: 'ORD20260903001', orderTime: '2026-09-03 08:46:11', payTime: '2026-09-03 08:47:06', payNo: 'PAY20260903001001', payMethod: 'wechat', discount: 26.34, amount: 108.50, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: true, discount: 2.51, paid: 9.29 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: true, discount: 21.15, paid: 74.85 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.99, promotion: true, discount: 2.68, paid: 17.02 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.92, promotion: false, discount: 0.00, paid: 7.34 }
  ] },
  { orderId: 'ORD20260903002', orderTime: '2026-09-03 10:07:20', payTime: '2026-09-03 10:08:35', payNo: 'PAY20260903002001', payMethod: 'wechat', discount: 0.00, amount: 13.80, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.07, promotion: false, discount: 0.00, paid: 3.19 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.33, promotion: false, discount: 0.00, paid: 10.61 }
  ] },
  { orderId: 'ORD20260903003', orderTime: '2026-09-03 13:04:28', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 19.07, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.39, promotion: false, discount: 0.00, paid: 19.07 }
  ] },
  { orderId: 'ORD20260903004', orderTime: '2026-09-03 13:17:04', payTime: '2026-09-03 13:18:55', payNo: 'PAY20260903004001', payMethod: 'wechat', discount: 17.79, amount: 96.11, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 0.49, promotion: true, discount: 1.50, paid: 7.22 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.15, promotion: false, discount: 0.00, paid: 9.18 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: true, discount: 16.29, paid: 79.71 }
  ] },
  { orderId: 'ORD20260903005', orderTime: '2026-09-03 13:36:58', payTime: '2026-09-03 13:37:08', payNo: 'PAY20260903005001', payMethod: 'alipay', discount: 8.31, amount: 151.19, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: true, discount: 8.31, paid: 21.69 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 }
  ] },
  { orderId: 'ORD20260903006', orderTime: '2026-09-03 14:15:30', payTime: '2026-09-03 14:18:05', payNo: 'PAY20260903006001', payMethod: 'card', discount: 8.90, amount: 80.62, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 26.40 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.43, promotion: false, discount: 0.00, paid: 11.52 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: true, discount: 8.90, paid: 42.70 }
  ] },
  { orderId: 'ORD20260903007', orderTime: '2026-09-03 18:03:25', payTime: '2026-09-03 18:04:34', payNo: 'PAY20260903007001', payMethod: 'wechat', discount: 0.00, amount: 37.22, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.45, promotion: false, discount: 0.00, paid: 7.22 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 }
  ] },
  { orderId: 'ORD20260903008', orderTime: '2026-09-03 18:42:24', payTime: '2026-09-03 18:42:49', payNo: 'PAY20260903008001', payMethod: 'wechat', discount: 0.00, amount: 61.57, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 50.40 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.40, promotion: false, discount: 0.00, paid: 11.17 }
  ] },
  { orderId: 'ORD20260903009', orderTime: '2026-09-03 19:59:49', payTime: '2026-09-03 20:02:05', payNo: 'PAY20260903009001', payMethod: 'mixed', discount: 0.00, amount: 115.99, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.84, promotion: false, discount: 0.00, paid: 43.79 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 }
  ] },
  { orderId: 'ORD20260904001', orderTime: '2026-09-04 11:43:04', payTime: '2026-09-04 11:43:19', payNo: 'PAY20260904001001', payMethod: 'cash', discount: 0.00, amount: 45.38, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 33.60 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.19, promotion: false, discount: 0.00, paid: 11.78 }
  ] },
  { orderId: 'ORD20260904002', orderTime: '2026-09-04 14:44:33', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 104.58, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.60, promotion: false, discount: 0.00, paid: 69.68 }
  ] },
  { orderId: 'ORD20260904003', orderTime: '2026-09-04 14:52:52', payTime: '2026-09-04 14:52:56', payNo: 'PAY20260904003001', payMethod: 'cash', discount: 0.00, amount: 56.14, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 50.40 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.96, promotion: false, discount: 0.00, paid: 5.74 }
  ] },
  { orderId: 'ORD20260904004', orderTime: '2026-09-04 17:32:02', payTime: '2026-09-04 17:32:13', payNo: 'PAY20260904004001', payMethod: 'mixed', discount: 3.81, amount: 28.19, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.00, promotion: true, discount: 3.81, paid: 28.19 }
  ] },
  { orderId: 'ORD20260904005', orderTime: '2026-09-04 18:32:12', payTime: '2026-09-04 18:32:21', payNo: 'PAY20260904005001', payMethod: 'wechat', discount: 4.58, amount: 81.11, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.59, promotion: false, discount: 0.00, paid: 47.38, refund: 47.38 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: true, discount: 2.87, paid: 26.83 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.44, promotion: true, discount: 1.71, paid: 6.90 }
  ] },
  { orderId: 'ORD20260904006', orderTime: '2026-09-04 20:26:29', payTime: '2026-09-04 20:26:45', payNo: 'PAY20260904006001', payMethod: 'alipay', discount: 0.00, amount: 108.50, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 96.00 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 }
  ] },
  { orderId: 'ORD20260905001', orderTime: '2026-09-05 07:21:57', payTime: '2026-09-05 07:25:11', payNo: 'PAY20260905001001', payMethod: 'alipay', discount: 5.83, amount: 105.77, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.16, promotion: false, discount: 0.00, paid: 27.61 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.55, promotion: false, discount: 0.00, paid: 4.39 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 5.83, paid: 33.97 }
  ] },
  { orderId: 'ORD20260905002', orderTime: '2026-09-05 07:57:52', payTime: '2026-09-05 07:59:58', payNo: 'PAY20260905002001', payMethod: 'cash', discount: 0.00, amount: 13.41, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.68, promotion: false, discount: 0.00, paid: 13.41 }
  ] },
  { orderId: 'ORD20260905003', orderTime: '2026-09-05 09:06:55', payTime: '2026-09-05 09:08:37', payNo: 'PAY20260905003001', payMethod: 'cash', discount: 1.24, amount: 4.81, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.32, promotion: true, discount: 1.24, paid: 4.81 }
  ] },
  { orderId: 'ORD20260905004', orderTime: '2026-09-05 09:10:00', payTime: '2026-09-05 09:11:50', payNo: 'PAY20260905004001', payMethod: 'alipay', discount: 0.00, amount: 100.25, status: '40', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.19, promotion: false, discount: 0.00, paid: 11.78 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 42.90 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 2.56, promotion: false, discount: 0.00, paid: 45.57 }
  ] },
  { orderId: 'ORD20260905005', orderTime: '2026-09-05 11:06:48', payTime: '2026-09-05 11:08:17', payNo: 'PAY20260905005001', payMethod: 'wechat', discount: 0.00, amount: 59.01, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 17.60 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.74, promotion: false, discount: 0.00, paid: 41.41 }
  ] },
  { orderId: 'ORD20260905006', orderTime: '2026-09-05 11:40:36', payTime: '2026-09-05 11:43:21', payNo: 'PAY20260905006001', payMethod: 'wechat', discount: 5.40, amount: 80.99, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.05, promotion: false, discount: 0.00, paid: 20.29 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.98, promotion: true, discount: 4.49, paid: 10.99 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.81, promotion: true, discount: 0.91, paid: 9.91 }
  ] },
  { orderId: 'ORD20260905007', orderTime: '2026-09-05 13:16:58', payTime: '2026-09-05 13:20:04', payNo: 'PAY20260905007001', payMethod: 'alipay', discount: 0.00, amount: 14.36, status: '40', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.80, promotion: false, discount: 0.00, paid: 14.36 }
  ] },
  { orderId: 'ORD20260905008', orderTime: '2026-09-05 16:41:20', payTime: '2026-09-05 16:42:19', payNo: 'PAY20260905008001', payMethod: 'alipay', discount: 0.00, amount: 74.13, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.89, promotion: false, discount: 0.00, paid: 7.10 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.68, promotion: false, discount: 0.00, paid: 67.03 }
  ] },
  { orderId: 'ORD20260905009', orderTime: '2026-09-05 17:11:34', payTime: '2026-09-05 17:14:01', payNo: 'PAY20260905009001', payMethod: 'wechat', discount: 0.00, amount: 62.09, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.83, promotion: false, discount: 0.00, paid: 4.13 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.02, promotion: false, discount: 0.00, paid: 18.16 }
  ] },
  { orderId: 'ORD20260905010', orderTime: '2026-09-05 17:40:37', payTime: '2026-09-05 17:42:57', payNo: 'PAY20260905010001', payMethod: 'alipay', discount: 0.00, amount: 198.93, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.73, promotion: false, discount: 0.00, paid: 69.03 },
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 }
  ] },
  { orderId: 'ORD20260905011', orderTime: '2026-09-05 19:16:46', payTime: '2026-09-05 19:20:04', payNo: 'PAY20260905011001', payMethod: 'wechat', discount: 0.00, amount: 62.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 19.80 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 42.90 }
  ] },
  { orderId: 'ORD20260905012', orderTime: '2026-09-05 19:49:06', payTime: '2026-09-05 19:50:30', payNo: 'PAY20260905012001', payMethod: 'wechat', discount: 0.00, amount: 89.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 }
  ] },
  { orderId: 'ORD20260905013', orderTime: '2026-09-05 19:58:35', payTime: '2026-09-05 20:01:18', payNo: 'PAY20260905013001', payMethod: 'wechat', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260905014', orderTime: '2026-09-05 20:38:38', payTime: '2026-09-05 20:41:20', payNo: 'PAY20260905014001', payMethod: 'cash', discount: 0.00, amount: 149.01, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.89, promotion: false, discount: 0.00, paid: 33.64 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.65, promotion: false, discount: 0.00, paid: 19.37 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 96.00 }
  ] },
  { orderId: 'ORD20260906001', orderTime: '2026-09-06 07:13:49', payTime: '2026-09-06 07:15:50', payNo: 'PAY20260906001001', payMethod: 'wechat', discount: 0.00, amount: 8.53, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.54, promotion: false, discount: 0.00, paid: 8.53 }
  ] },
  { orderId: 'ORD20260906002', orderTime: '2026-09-06 07:19:53', payTime: '2026-09-06 07:22:52', payNo: 'PAY20260906002001', payMethod: 'wechat', discount: 2.35, amount: 64.26, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 49.80 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.57, promotion: false, discount: 0.00, paid: 2.61 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.78, promotion: true, discount: 2.35, paid: 11.85 }
  ] },
  { orderId: 'ORD20260906003', orderTime: '2026-09-06 08:38:34', payTime: '', payNo: '', payMethod: '', discount: 2.61, amount: 71.04, status: '10', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 42.90 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.40, promotion: false, discount: 0.00, paid: 7.15 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: true, discount: 2.61, paid: 20.99 }
  ] },
  { orderId: 'ORD20260906004', orderTime: '2026-09-06 08:47:20', payTime: '2026-09-06 08:48:18', payNo: 'PAY20260906004001', payMethod: 'mixed', discount: 0.00, amount: 37.50, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 }
  ] },
  { orderId: 'ORD20260906005', orderTime: '2026-09-06 08:53:28', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 143.54, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.80, promotion: false, discount: 0.00, paid: 53.64 },
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 89.90 }
  ] },
  { orderId: 'ORD20260906006', orderTime: '2026-09-06 09:22:28', payTime: '', payNo: '', payMethod: '', discount: 4.64, amount: 114.85, status: '20', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: true, discount: 4.64, paid: 30.76 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.42, promotion: false, discount: 0.00, paid: 11.33 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.16, promotion: false, discount: 0.00, paid: 4.96 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.53, promotion: false, discount: 0.00, paid: 67.80 }
  ] },
  { orderId: 'ORD20260906007', orderTime: '2026-09-06 11:01:00', payTime: '2026-09-06 11:04:15', payNo: 'PAY20260906007001', payMethod: 'card', discount: 0.00, amount: 11.62, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.71, promotion: false, discount: 0.00, paid: 2.12 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.22, promotion: false, discount: 0.00, paid: 9.50 }
  ] },
  { orderId: 'ORD20260906008', orderTime: '2026-09-06 12:51:41', payTime: '2026-09-06 12:52:29', payNo: 'PAY20260906008001', payMethod: 'wechat', discount: 0.00, amount: 23.62, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.34, promotion: false, discount: 0.00, paid: 5.74, refund: 4.71 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.24, promotion: false, discount: 0.00, paid: 17.88 }
  ] },
  { orderId: 'ORD20260906009', orderTime: '2026-09-06 13:05:04', payTime: '2026-09-06 13:05:34', payNo: 'PAY20260906009001', payMethod: 'wechat', discount: 0.00, amount: 56.56, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.12, promotion: false, discount: 0.00, paid: 26.66 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 }
  ] },
  { orderId: 'ORD20260906010', orderTime: '2026-09-06 14:02:25', payTime: '2026-09-06 14:04:45', payNo: 'PAY20260906010001', payMethod: 'wechat', discount: 0.00, amount: 118.16, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.37, promotion: false, discount: 0.00, paid: 94.56 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 }
  ] },
  { orderId: 'ORD20260906011', orderTime: '2026-09-06 15:03:27', payTime: '2026-09-06 15:04:21', payNo: 'PAY20260906011001', payMethod: 'wechat', discount: 2.35, amount: 191.68, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 96.00 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: true, discount: 2.35, paid: 14.45 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.19, promotion: false, discount: 0.00, paid: 6.53 }
  ] },
  { orderId: 'ORD20260906012', orderTime: '2026-09-06 18:30:25', payTime: '2026-09-06 18:31:57', payNo: 'PAY20260906012001', payMethod: 'alipay', discount: 0.00, amount: 154.50, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 14.80 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 49.80 },
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 89.90 }
  ] },
  { orderId: 'ORD20260906013', orderTime: '2026-09-06 18:41:05', payTime: '2026-09-06 18:42:23', payNo: 'PAY20260906013001', payMethod: 'wechat', discount: 0.00, amount: 18.33, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.03, promotion: false, discount: 0.00, paid: 18.33 }
  ] },
  { orderId: 'ORD20260906014', orderTime: '2026-09-06 18:43:06', payTime: '2026-09-06 18:45:46', payNo: 'PAY20260906014001', payMethod: 'cash', discount: 13.24, amount: 105.41, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: true, discount: 13.24, paid: 72.56 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.77, promotion: false, discount: 0.00, paid: 22.95 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 }
  ] },
  { orderId: 'ORD20260906015', orderTime: '2026-09-06 18:43:46', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 20.27, status: '50', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.91, promotion: false, discount: 0.00, paid: 11.42 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.56, promotion: false, discount: 0.00, paid: 8.85 }
  ] },
  { orderId: 'ORD20260907001', orderTime: '2026-09-07 07:17:20', payTime: '2026-09-07 07:17:43', payNo: 'PAY20260907001001', payMethod: 'cash', discount: 7.45, amount: 54.92, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.03, promotion: true, discount: 7.45, paid: 53.04 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.41, promotion: false, discount: 0.00, paid: 1.88 }
  ] },
  { orderId: 'ORD20260907002', orderTime: '2026-09-07 07:26:51', payTime: '2026-09-07 07:27:56', payNo: 'PAY20260907002001', payMethod: 'cash', discount: 0.00, amount: 120.77, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500202', name: '帮宝适纸尿裤M码', spec: '54片/包', price: 109.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 109.00 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.57, promotion: false, discount: 0.00, paid: 11.77 }
  ] },
  { orderId: 'ORD20260907003', orderTime: '2026-09-07 07:57:55', payTime: '2026-09-07 08:00:25', payNo: 'PAY20260907003001', payMethod: 'wechat', discount: 0.30, amount: 1.79, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.70, promotion: true, discount: 0.30, paid: 1.79 }
  ] },
  { orderId: 'ORD20260907004', orderTime: '2026-09-07 08:40:24', payTime: '2026-09-07 08:40:40', payNo: 'PAY20260907004001', payMethod: 'wechat', discount: 0.00, amount: 86.02, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.42, promotion: false, discount: 0.00, paid: 7.21 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.93, promotion: false, discount: 0.00, paid: 19.11 }
  ] },
  { orderId: 'ORD20260907005', orderTime: '2026-09-07 10:12:36', payTime: '2026-09-07 10:12:44', payNo: 'PAY20260907005001', payMethod: 'wechat', discount: 0.00, amount: 8.91, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.79, promotion: false, discount: 0.00, paid: 8.91 }
  ] },
  { orderId: 'ORD20260907006', orderTime: '2026-09-07 11:07:29', payTime: '2026-09-07 11:10:15', payNo: 'PAY20260907006001', payMethod: 'wechat', discount: 3.23, amount: 7.72, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.39, promotion: true, discount: 3.23, paid: 7.72 }
  ] },
  { orderId: 'ORD20260907007', orderTime: '2026-09-07 12:25:55', payTime: '2026-09-07 12:26:27', payNo: 'PAY20260907007001', payMethod: 'wechat', discount: 0.00, amount: 34.29, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.08, promotion: false, discount: 0.00, paid: 10.69 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 }
  ] },
  { orderId: 'ORD20260907008', orderTime: '2026-09-07 12:33:46', payTime: '2026-09-07 12:34:50', payNo: 'PAY20260907008001', payMethod: 'cash', discount: 8.34, amount: 204.18, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.90, promotion: true, discount: 8.34, paid: 36.88 },
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 89.90 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40 }
  ] },
  { orderId: 'ORD20260907009', orderTime: '2026-09-07 12:59:18', payTime: '2026-09-07 13:01:50', payNo: 'PAY20260907009001', payMethod: 'card', discount: 1.05, amount: 93.48, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.62, promotion: true, discount: 1.05, paid: 3.78 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 }
  ] },
  { orderId: 'ORD20260907010', orderTime: '2026-09-07 15:19:36', payTime: '2026-09-07 15:22:10', payNo: 'PAY20260907010001', payMethod: 'alipay', discount: 0.00, amount: 11.19, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.47, promotion: false, discount: 0.00, paid: 11.19 }
  ] },
  { orderId: 'ORD20260907011', orderTime: '2026-09-07 16:13:45', payTime: '2026-09-07 16:16:02', payNo: 'PAY20260907011001', payMethod: 'wechat', discount: 0.00, amount: 114.62, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.76, promotion: false, discount: 0.00, paid: 70.22 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 44.40 }
  ] },
  { orderId: 'ORD20260907012', orderTime: '2026-09-07 17:36:57', payTime: '2026-09-07 17:38:28', payNo: 'PAY20260907012001', payMethod: 'wechat', discount: 0.00, amount: 97.91, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.44, promotion: false, discount: 0.00, paid: 42.91, refund: 29.61 }
  ] },
  { orderId: 'ORD20260907013', orderTime: '2026-09-07 19:15:50', payTime: '2026-09-07 19:17:47', payNo: 'PAY20260907013001', payMethod: 'alipay', discount: 2.60, amount: 28.61, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.47, promotion: false, discount: 0.00, paid: 11.31 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 2.60, paid: 17.30 }
  ] },
  { orderId: 'ORD20260908001', orderTime: '2026-09-08 08:03:44', payTime: '2026-09-08 08:06:12', payNo: 'PAY20260908001001', payMethod: 'mixed', discount: 12.46, amount: 58.17, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.98, promotion: true, discount: 0.97, paid: 8.73 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.56, promotion: true, discount: 11.49, paid: 49.44 }
  ] },
  { orderId: 'ORD20260908002', orderTime: '2026-09-08 08:44:43', payTime: '2026-09-08 08:47:41', payNo: 'PAY20260908002001', payMethod: 'wechat', discount: 0.00, amount: 15.00, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 }
  ] },
  { orderId: 'ORD20260908003', orderTime: '2026-09-08 11:19:01', payTime: '2026-09-08 11:20:16', payNo: 'PAY20260908003001', payMethod: 'wechat', discount: 0.00, amount: 106.25, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.23, promotion: false, discount: 0.00, paid: 66.45 }
  ] },
  { orderId: 'ORD20260908004', orderTime: '2026-09-08 11:41:18', payTime: '2026-09-08 11:42:33', payNo: 'PAY20260908004001', payMethod: 'wechat', discount: 0.00, amount: 31.10, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.55, promotion: false, discount: 0.00, paid: 10.91 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.29, promotion: false, discount: 0.00, paid: 12.77 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.24, promotion: false, discount: 0.00, paid: 7.42 }
  ] },
  { orderId: 'ORD20260908005', orderTime: '2026-09-08 12:53:25', payTime: '2026-09-08 12:53:41', payNo: 'PAY20260908005001', payMethod: 'alipay', discount: 0.00, amount: 62.25, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.04, promotion: false, discount: 0.00, paid: 24.75 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 }
  ] },
  { orderId: 'ORD20260908006', orderTime: '2026-09-08 20:11:07', payTime: '2026-09-08 20:13:25', payNo: 'PAY20260908006001', payMethod: 'wechat', discount: 0.00, amount: 81.43, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.68, promotion: false, discount: 0.00, paid: 20.26 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.57, promotion: false, discount: 0.00, paid: 61.17 }
  ] },
  { orderId: 'ORD20260909001', orderTime: '2026-09-09 08:37:06', payTime: '2026-09-09 08:40:16', payNo: 'PAY20260909001001', payMethod: 'wechat', discount: 0.00, amount: 92.05, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.79, promotion: false, discount: 0.00, paid: 2.35 }
  ] },
  { orderId: 'ORD20260909002', orderTime: '2026-09-09 08:43:20', payTime: '2026-09-09 08:45:14', payNo: 'PAY20260909002001', payMethod: 'wechat', discount: 0.00, amount: 142.76, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.45, promotion: false, discount: 0.00, paid: 11.22 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.93, promotion: false, discount: 0.00, paid: 22.13 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.47, promotion: false, discount: 0.00, paid: 19.71 }
  ] },
  { orderId: 'ORD20260909003', orderTime: '2026-09-09 11:22:10', payTime: '', payNo: '', payMethod: '', discount: 6.44, amount: 38.84, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.13, promotion: true, discount: 4.93, paid: 25.35 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: true, discount: 1.51, paid: 13.49 }
  ] },
  { orderId: 'ORD20260909004', orderTime: '2026-09-09 11:32:04', payTime: '2026-09-09 11:34:54', payNo: 'PAY20260909004001', payMethod: 'cash', discount: 0.00, amount: 84.83, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.47, promotion: false, discount: 0.00, paid: 24.45 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.32, promotion: false, discount: 0.00, paid: 35.38 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20260909005', orderTime: '2026-09-09 17:11:37', payTime: '2026-09-09 17:11:55', payNo: 'PAY20260909005001', payMethod: 'mixed', discount: 0.00, amount: 27.53, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.40, promotion: false, discount: 0.00, paid: 19.15 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.22, promotion: false, discount: 0.00, paid: 5.59 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.56, promotion: false, discount: 0.00, paid: 2.79 }
  ] },
  { orderId: 'ORD20260909006', orderTime: '2026-09-09 18:52:18', payTime: '2026-09-09 18:54:34', payNo: 'PAY20260909006001', payMethod: 'cash', discount: 0.00, amount: 11.06, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.70, promotion: false, discount: 0.00, paid: 11.06 }
  ] },
  { orderId: 'ORD20260909007', orderTime: '2026-09-09 18:57:54', payTime: '2026-09-09 18:59:34', payNo: 'PAY20260909007001', payMethod: 'cash', discount: 1.73, amount: 8.97, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.50, promotion: true, discount: 1.73, paid: 8.97 }
  ] },
  { orderId: 'ORD20260909008', orderTime: '2026-09-09 20:31:26', payTime: '2026-09-09 20:32:02', payNo: 'PAY20260909008001', payMethod: 'card', discount: 7.87, amount: 40.03, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: true, discount: 7.87, paid: 27.53 }
  ] },
  { orderId: 'ORD20260910001', orderTime: '2026-09-10 07:19:45', payTime: '2026-09-10 07:22:23', payNo: 'PAY20260910001001', payMethod: 'wechat', discount: 0.00, amount: 70.35, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.54, promotion: false, discount: 0.00, paid: 60.45 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 }
  ] },
  { orderId: 'ORD20260910002', orderTime: '2026-09-10 08:02:47', payTime: '', payNo: '', payMethod: '', discount: 38.36, amount: 115.70, status: '10', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: true, discount: 38.36, paid: 91.54 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.44, promotion: false, discount: 0.00, paid: 24.16 }
  ] },
  { orderId: 'ORD20260910003', orderTime: '2026-09-10 11:22:55', payTime: '2026-09-10 11:25:00', payNo: 'PAY20260910003001', payMethod: 'wechat', discount: 0.00, amount: 42.07, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.71, promotion: false, discount: 0.00, paid: 40.70 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.46, promotion: false, discount: 0.00, paid: 1.37 }
  ] },
  { orderId: 'ORD20260910004', orderTime: '2026-09-10 16:42:49', payTime: '2026-09-10 16:44:19', payNo: 'PAY20260910004001', payMethod: 'wechat', discount: 6.24, amount: 34.42, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.49, promotion: false, discount: 0.00, paid: 10.66 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: true, discount: 6.24, paid: 23.76 }
  ] },
  { orderId: 'ORD20260910005', orderTime: '2026-09-10 19:59:50', payTime: '2026-09-10 20:00:37', payNo: 'PAY20260910005001', payMethod: 'alipay', discount: 0.00, amount: 65.81, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.05, promotion: false, discount: 0.00, paid: 6.11, refund: 5.44 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260910006', orderTime: '2026-09-10 21:04:36', payTime: '', payNo: '', payMethod: '', discount: 12.26, amount: 70.68, status: '20', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.93, promotion: false, discount: 0.00, paid: 5.75 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.52, promotion: false, discount: 0.00, paid: 6.51 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.60, promotion: true, discount: 12.26, paid: 28.82 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 29.60 }
  ] },
  { orderId: 'ORD20260911001', orderTime: '2026-09-11 08:28:05', payTime: '2026-09-11 08:28:21', payNo: 'PAY20260911001001', payMethod: 'card', discount: 0.00, amount: 10.57, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.47, promotion: false, discount: 0.00, paid: 10.57 }
  ] },
  { orderId: 'ORD20260911002', orderTime: '2026-09-11 09:38:34', payTime: '', payNo: '', payMethod: '', discount: 4.91, amount: 46.99, status: '10', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.00, promotion: true, discount: 4.91, paid: 27.09 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260911003', orderTime: '2026-09-11 13:36:52', payTime: '2026-09-11 13:39:00', payNo: 'PAY20260911003001', payMethod: 'mixed', discount: 0.00, amount: 39.50, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.50, promotion: false, discount: 0.00, paid: 39.50 }
  ] },
  { orderId: 'ORD20260911004', orderTime: '2026-09-11 17:19:37', payTime: '2026-09-11 17:21:02', payNo: 'PAY20260911004001', payMethod: 'alipay', discount: 13.24, amount: 176.35, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.76, promotion: false, discount: 0.00, paid: 52.45 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.77, promotion: true, discount: 13.24, paid: 34.20 }
  ] },
  { orderId: 'ORD20260911005', orderTime: '2026-09-11 18:49:02', payTime: '2026-09-11 18:51:08', payNo: 'PAY20260911005001', payMethod: 'wechat', discount: 0.00, amount: 14.45, status: '40', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.46, promotion: false, discount: 0.00, paid: 14.45 }
  ] },
  { orderId: 'ORD20260911006', orderTime: '2026-09-11 19:28:56', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 176.07, status: '50', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 2.03, promotion: false, discount: 0.00, paid: 36.13 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.61, promotion: false, discount: 0.00, paid: 25.44 }
  ] },
  { orderId: 'ORD20260912001', orderTime: '2026-09-12 08:25:23', payTime: '2026-09-12 08:25:54', payNo: 'PAY20260912001001', payMethod: 'cash', discount: 0.00, amount: 23.93, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.85, promotion: false, discount: 0.00, paid: 6.78 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.64, promotion: false, discount: 0.00, paid: 17.15 }
  ] },
  { orderId: 'ORD20260912002', orderTime: '2026-09-12 10:34:27', payTime: '2026-09-12 10:37:33', payNo: 'PAY20260912002001', payMethod: 'alipay', discount: 0.00, amount: 66.04, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.95, promotion: false, discount: 0.00, paid: 58.11 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.74, promotion: false, discount: 0.00, paid: 3.39 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.76, promotion: false, discount: 0.00, paid: 4.54 }
  ] },
  { orderId: 'ORD20260912003', orderTime: '2026-09-12 10:46:27', payTime: '2026-09-12 10:46:35', payNo: 'PAY20260912003001', payMethod: 'cash', discount: 11.55, amount: 158.95, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 },
    { code: '6901234500202', name: '帮宝适纸尿裤M码', spec: '54片/包', price: 109.00, qty: 1, weight: 0.00, promotion: true, discount: 11.55, paid: 97.45 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 51.60 }
  ] },
  { orderId: 'ORD20260912004', orderTime: '2026-09-12 11:24:38', payTime: '2026-09-12 11:26:04', payNo: 'PAY20260912004001', payMethod: 'card', discount: 3.74, amount: 83.81, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.27, promotion: false, discount: 0.00, paid: 67.65 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 3.74, paid: 16.16 }
  ] },
  { orderId: 'ORD20260912005', orderTime: '2026-09-12 11:51:55', payTime: '2026-09-12 11:53:06', payNo: 'PAY20260912005001', payMethod: 'wechat', discount: 6.94, amount: 70.60, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: true, discount: 3.34, paid: 32.06 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.10, promotion: false, discount: 0.00, paid: 10.89 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.79, promotion: true, discount: 3.60, paid: 8.88 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.63, promotion: false, discount: 0.00, paid: 18.77 }
  ] },
  { orderId: 'ORD20260912006', orderTime: '2026-09-12 12:06:19', payTime: '2026-09-12 12:08:29', payNo: 'PAY20260912006001', payMethod: 'wechat', discount: 0.00, amount: 14.47, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.66, promotion: false, discount: 0.00, paid: 1.97 }
  ] },
  { orderId: 'ORD20260912007', orderTime: '2026-09-12 12:33:52', payTime: '2026-09-12 12:33:56', payNo: 'PAY20260912007001', payMethod: 'card', discount: 0.00, amount: 3.51, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.82, promotion: false, discount: 0.00, paid: 3.51 }
  ] },
  { orderId: 'ORD20260912008', orderTime: '2026-09-12 13:12:33', payTime: '2026-09-12 13:15:43', payNo: 'PAY20260912008001', payMethod: 'wechat', discount: 21.80, amount: 61.29, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.70, promotion: true, discount: 10.99, paid: 29.47 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 10.81, paid: 28.99 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.95, promotion: false, discount: 0.00, paid: 2.83 }
  ] },
  { orderId: 'ORD20260912009', orderTime: '2026-09-12 13:23:55', payTime: '', payNo: '', payMethod: '', discount: 8.35, amount: 107.17, status: '20', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.41, promotion: true, discount: 8.35, paid: 25.21 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 44.40 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.03, promotion: false, discount: 0.00, paid: 18.33 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.41, promotion: false, discount: 0.00, paid: 19.23 }
  ] },
  { orderId: 'ORD20260912010', orderTime: '2026-09-12 13:29:08', payTime: '2026-09-12 13:30:00', payNo: 'PAY20260912010001', payMethod: 'wechat', discount: 15.45, amount: 72.05, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.90, promotion: false, discount: 0.00, paid: 8.70 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.80, promotion: false, discount: 0.00, paid: 21.44 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.41, promotion: true, discount: 15.45, paid: 41.91 }
  ] },
  { orderId: 'ORD20260912011', orderTime: '2026-09-12 17:18:53', payTime: '2026-09-12 17:21:11', payNo: 'PAY20260912011001', payMethod: 'card', discount: 0.00, amount: 75.47, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 8.80 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.40, promotion: false, discount: 0.00, paid: 6.97 }
  ] },
  { orderId: 'ORD20260912012', orderTime: '2026-09-12 17:39:28', payTime: '2026-09-12 17:40:32', payNo: 'PAY20260912012001', payMethod: 'wechat', discount: 0.00, amount: 38.31, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 29.70 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.44, promotion: false, discount: 0.00, paid: 8.61 }
  ] },
  { orderId: 'ORD20260912013', orderTime: '2026-09-12 18:37:00', payTime: '2026-09-12 18:37:46', payNo: 'PAY20260912013001', payMethod: 'cash', discount: 0.00, amount: 26.50, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.10, promotion: false, discount: 0.00, paid: 19.58 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.39, promotion: false, discount: 0.00, paid: 6.92 }
  ] },
  { orderId: 'ORD20260912014', orderTime: '2026-09-12 19:14:41', payTime: '2026-09-12 19:17:26', payNo: 'PAY20260912014001', payMethod: 'wechat', discount: 0.00, amount: 8.98, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.96, promotion: false, discount: 0.00, paid: 8.98 }
  ] },
  { orderId: 'ORD20260912015', orderTime: '2026-09-12 19:49:01', payTime: '2026-09-12 19:49:47', payNo: 'PAY20260912015001', payMethod: 'wechat', discount: 4.45, amount: 32.61, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 0.43, promotion: false, discount: 0.00, paid: 17.16 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 4.45, paid: 15.45 }
  ] },
  { orderId: 'ORD20260912016', orderTime: '2026-09-12 20:12:32', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 19.80, status: '20', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 19.80 }
  ] },
  { orderId: 'ORD20260913001', orderTime: '2026-09-13 07:14:25', payTime: '2026-09-13 07:17:07', payNo: 'PAY20260913001001', payMethod: 'alipay', discount: 4.85, amount: 54.72, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.26, promotion: true, discount: 4.85, paid: 28.92, refund: 28.92 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20260913002', orderTime: '2026-09-13 07:30:52', payTime: '2026-09-13 07:33:34', payNo: 'PAY20260913002001', payMethod: 'wechat', discount: 0.00, amount: 29.90, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 }
  ] },
  { orderId: 'ORD20260913003', orderTime: '2026-09-13 07:38:48', payTime: '2026-09-13 07:41:09', payNo: 'PAY20260913003001', payMethod: 'alipay', discount: 0.00, amount: 81.07, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.57, promotion: false, discount: 0.00, paid: 61.17 }
  ] },
  { orderId: 'ORD20260913004', orderTime: '2026-09-13 07:43:04', payTime: '2026-09-13 07:44:35', payNo: 'PAY20260913004001', payMethod: 'wechat', discount: 7.41, amount: 147.00, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: true, discount: 7.41, paid: 52.29 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.05, promotion: false, discount: 0.00, paid: 4.81 },
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 89.90 }
  ] },
  { orderId: 'ORD20260913005', orderTime: '2026-09-13 07:48:50', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 76.88, status: '20', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.58, promotion: false, discount: 0.00, paid: 76.88 }
  ] },
  { orderId: 'ORD20260913006', orderTime: '2026-09-13 07:56:06', payTime: '2026-09-13 07:58:19', payNo: 'PAY20260913006001', payMethod: 'alipay', discount: 7.08, amount: 176.50, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 1, weight: 0.00, promotion: true, discount: 7.08, paid: 17.82 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 51.60 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.59, promotion: false, discount: 0.00, paid: 47.38 }
  ] },
  { orderId: 'ORD20260913007', orderTime: '2026-09-13 08:54:35', payTime: '2026-09-13 08:57:04', payNo: 'PAY20260913007001', payMethod: 'alipay', discount: 10.55, amount: 35.75, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: true, discount: 10.55, paid: 26.95 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 8.80 }
  ] },
  { orderId: 'ORD20260913008', orderTime: '2026-09-13 08:57:20', payTime: '2026-09-13 08:57:25', payNo: 'PAY20260913008001', payMethod: 'wechat', discount: 1.50, amount: 162.79, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: true, discount: 1.50, paid: 11.00 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.57, promotion: false, discount: 0.00, paid: 76.59 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20260913009', orderTime: '2026-09-13 09:09:05', payTime: '', payNo: '', payMethod: '', discount: 2.56, amount: 92.84, status: '20', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: true, discount: 2.56, paid: 23.24 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260913010', orderTime: '2026-09-13 10:34:51', payTime: '2026-09-13 10:37:18', payNo: 'PAY20260913010001', payMethod: 'alipay', discount: 0.00, amount: 189.17, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.20, promotion: false, discount: 0.00, paid: 65.56 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.92, promotion: false, discount: 0.00, paid: 9.11 }
  ] },
  { orderId: 'ORD20260913011', orderTime: '2026-09-13 12:13:45', payTime: '2026-09-13 12:14:15', payNo: 'PAY20260913011001', payMethod: 'cash', discount: 0.00, amount: 80.25, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.21, promotion: false, discount: 0.00, paid: 13.22 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.68, promotion: false, discount: 0.00, paid: 67.03 }
  ] },
  { orderId: 'ORD20260913012', orderTime: '2026-09-13 12:34:19', payTime: '2026-09-13 12:35:38', payNo: 'PAY20260913012001', payMethod: 'alipay', discount: 0.76, amount: 98.60, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.49, promotion: true, discount: 0.76, paid: 4.09 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.87, promotion: false, discount: 0.00, paid: 74.61 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260913013', orderTime: '2026-09-13 12:55:11', payTime: '2026-09-13 12:55:22', payNo: 'PAY20260913013001', payMethod: 'alipay', discount: 12.60, amount: 96.40, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500202', name: '帮宝适纸尿裤M码', spec: '54片/包', price: 109.00, qty: 1, weight: 0.00, promotion: true, discount: 12.60, paid: 96.40 }
  ] },
  { orderId: 'ORD20260913014', orderTime: '2026-09-13 14:07:44', payTime: '2026-09-13 14:07:48', payNo: 'PAY20260913014001', payMethod: 'alipay', discount: 16.85, amount: 98.79, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: true, discount: 2.24, paid: 7.66 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: true, discount: 6.27, paid: 31.23 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.29, promotion: true, discount: 8.34, paid: 59.90 }
  ] },
  { orderId: 'ORD20260913015', orderTime: '2026-09-13 15:50:05', payTime: '2026-09-13 15:51:54', payNo: 'PAY20260913015001', payMethod: 'wechat', discount: 7.01, amount: 31.59, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: true, discount: 4.52, paid: 19.08 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: true, discount: 2.49, paid: 12.51 }
  ] },
  { orderId: 'ORD20260913016', orderTime: '2026-09-13 15:59:07', payTime: '', payNo: '', payMethod: '', discount: 11.17, amount: 70.43, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.48, promotion: true, discount: 11.17, paid: 32.93 }
  ] },
  { orderId: 'ORD20260913017', orderTime: '2026-09-13 17:13:56', payTime: '2026-09-13 17:15:24', payNo: 'PAY20260913017001', payMethod: 'alipay', discount: 1.25, amount: 44.23, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.33, promotion: false, discount: 0.00, paid: 36.81 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.74, promotion: true, discount: 1.25, paid: 7.42 }
  ] },
  { orderId: 'ORD20260913018', orderTime: '2026-09-13 18:02:54', payTime: '2026-09-13 18:05:44', payNo: 'PAY20260913018001', payMethod: 'wechat', discount: 0.00, amount: 24.23, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.25, promotion: false, discount: 0.00, paid: 10.31 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.94, promotion: false, discount: 0.00, paid: 4.02 }
  ] },
  { orderId: 'ORD20260913019', orderTime: '2026-09-13 20:48:34', payTime: '2026-09-13 20:49:13', payNo: 'PAY20260913019001', payMethod: 'wechat', discount: 0.00, amount: 23.82, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.45, promotion: false, discount: 0.00, paid: 8.67 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.53, promotion: false, discount: 0.00, paid: 15.15 }
  ] },
  { orderId: 'ORD20260914001', orderTime: '2026-09-14 07:02:46', payTime: '2026-09-14 07:05:51', payNo: 'PAY20260914001001', payMethod: 'cash', discount: 5.09, amount: 20.19, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.60, promotion: true, discount: 5.09, paid: 20.19 }
  ] },
  { orderId: 'ORD20260914002', orderTime: '2026-09-14 08:09:11', payTime: '2026-09-14 08:11:56', payNo: 'PAY20260914002001', payMethod: 'cash', discount: 0.00, amount: 18.05, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.78, promotion: false, discount: 0.00, paid: 12.32 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.25, promotion: false, discount: 0.00, paid: 5.73 }
  ] },
  { orderId: 'ORD20260914003', orderTime: '2026-09-14 08:35:54', payTime: '2026-09-14 08:36:40', payNo: 'PAY20260914003001', payMethod: 'alipay', discount: 0.00, amount: 83.92, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.49, promotion: false, discount: 0.00, paid: 7.42 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 16.80, refund: 14.45 }
  ] },
  { orderId: 'ORD20260914004', orderTime: '2026-09-14 11:11:21', payTime: '2026-09-14 11:14:12', payNo: 'PAY20260914004001', payMethod: 'wechat', discount: 5.80, amount: 81.26, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.91, promotion: true, discount: 5.80, paid: 15.86 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 }
  ] },
  { orderId: 'ORD20260914005', orderTime: '2026-09-14 11:58:31', payTime: '2026-09-14 12:01:47', payNo: 'PAY20260914005001', payMethod: 'wechat', discount: 5.03, amount: 12.25, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.58, promotion: true, discount: 5.03, paid: 12.25 }
  ] },
  { orderId: 'ORD20260914006', orderTime: '2026-09-14 12:34:02', payTime: '2026-09-14 12:34:48', payNo: 'PAY20260914006001', payMethod: 'wechat', discount: 0.00, amount: 82.69, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.77, promotion: false, discount: 0.00, paid: 22.95 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.51, promotion: false, discount: 0.00, paid: 59.74 }
  ] },
  { orderId: 'ORD20260914007', orderTime: '2026-09-14 17:33:45', payTime: '2026-09-14 17:35:10', payNo: 'PAY20260914007001', payMethod: 'wechat', discount: 11.61, amount: 56.93, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.76, promotion: true, discount: 0.64, paid: 3.90 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: true, discount: 10.97, paid: 53.03 }
  ] },
  { orderId: 'ORD20260914008', orderTime: '2026-09-14 17:57:03', payTime: '2026-09-14 17:58:39', payNo: 'PAY20260914008001', payMethod: 'cash', discount: 0.00, amount: 11.80, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 }
  ] },
  { orderId: 'ORD20260914009', orderTime: '2026-09-14 19:48:47', payTime: '2026-09-14 19:48:50', payNo: 'PAY20260914009001', payMethod: 'mixed', discount: 0.00, amount: 96.44, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.38, promotion: false, discount: 0.00, paid: 56.64 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20260914010', orderTime: '2026-09-14 20:01:04', payTime: '2026-09-14 20:02:15', payNo: 'PAY20260914010001', payMethod: 'card', discount: 1.05, amount: 65.27, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.31, promotion: true, discount: 1.05, paid: 5.47 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 59.80 }
  ] },
  { orderId: 'ORD20260914011', orderTime: '2026-09-14 20:53:28', payTime: '2026-09-14 20:56:09', payNo: 'PAY20260914011001', payMethod: 'wechat', discount: 0.00, amount: 53.81, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.89, promotion: false, discount: 0.00, paid: 11.30 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.60, promotion: false, discount: 0.00, paid: 1.79 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.87, promotion: false, discount: 0.00, paid: 14.92 }
  ] },
  { orderId: 'ORD20260914012', orderTime: '2026-09-14 21:07:47', payTime: '2026-09-14 21:08:26', payNo: 'PAY20260914012001', payMethod: 'wechat', discount: 2.50, amount: 18.30, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.36, promotion: true, discount: 2.50, paid: 7.60 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.79, promotion: false, discount: 0.00, paid: 10.70 }
  ] },
  { orderId: 'ORD20260915001', orderTime: '2026-09-15 07:08:15', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 118.11, status: '20', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.89, promotion: false, discount: 0.00, paid: 18.71 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 }
  ] },
  { orderId: 'ORD20260915002', orderTime: '2026-09-15 08:18:18', payTime: '2026-09-15 08:19:28', payNo: 'PAY20260915002001', payMethod: 'cash', discount: 0.00, amount: 133.02, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.82, promotion: false, discount: 0.00, paid: 43.32 }
  ] },
  { orderId: 'ORD20260915003', orderTime: '2026-09-15 11:29:35', payTime: '2026-09-15 11:30:49', payNo: 'PAY20260915003001', payMethod: 'alipay', discount: 3.00, amount: 131.34, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.46, promotion: true, discount: 3.00, paid: 11.71 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.27, promotion: false, discount: 0.00, paid: 10.13 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 49.80 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260915004', orderTime: '2026-09-15 11:35:28', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 19.90, status: '50', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260915005', orderTime: '2026-09-15 12:43:25', payTime: '2026-09-15 12:46:22', payNo: 'PAY20260915005001', payMethod: 'alipay', discount: 4.51, amount: 27.93, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.93, promotion: false, discount: 0.00, paid: 8.84 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: true, discount: 4.51, paid: 19.09 }
  ] },
  { orderId: 'ORD20260915006', orderTime: '2026-09-15 13:12:10', payTime: '2026-09-15 13:13:25', payNo: 'PAY20260915006001', payMethod: 'wechat', discount: 13.31, amount: 59.02, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.93, promotion: true, discount: 13.31, paid: 32.62 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 26.40 }
  ] },
  { orderId: 'ORD20260915007', orderTime: '2026-09-15 13:14:16', payTime: '2026-09-15 13:15:48', payNo: 'PAY20260915007001', payMethod: 'alipay', discount: 3.83, amount: 17.59, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.90, promotion: true, discount: 3.83, paid: 17.59 }
  ] },
  { orderId: 'ORD20260915008', orderTime: '2026-09-15 13:43:18', payTime: '2026-09-15 13:44:06', payNo: 'PAY20260915008001', payMethod: 'wechat', discount: 0.00, amount: 31.70, status: '40', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260915009', orderTime: '2026-09-15 14:51:32', payTime: '2026-09-15 14:54:08', payNo: 'PAY20260915009001', payMethod: 'cash', discount: 0.00, amount: 6.76, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.13, promotion: false, discount: 0.00, paid: 6.76 }
  ] },
  { orderId: 'ORD20260915010', orderTime: '2026-09-15 16:32:02', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 10.74, status: '50', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.51, promotion: false, discount: 0.00, paid: 10.74 }
  ] },
  { orderId: 'ORD20260915011', orderTime: '2026-09-15 18:39:54', payTime: '2026-09-15 18:42:36', payNo: 'PAY20260915011001', payMethod: 'cash', discount: 0.00, amount: 67.81, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.94, promotion: false, discount: 0.00, paid: 28.01 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20260916001', orderTime: '2026-09-16 07:26:59', payTime: '2026-09-16 07:28:16', payNo: 'PAY20260916001001', payMethod: 'wechat', discount: 0.00, amount: 5.45, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.46, promotion: false, discount: 0.00, paid: 2.11 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.78, promotion: false, discount: 0.00, paid: 3.34 }
  ] },
  { orderId: 'ORD20260916002', orderTime: '2026-09-16 16:23:53', payTime: '2026-09-16 16:25:43', payNo: 'PAY20260916002001', payMethod: 'wechat', discount: 7.85, amount: 133.49, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.76, promotion: true, discount: 7.85, paid: 23.48, refund: 15.50 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.92, promotion: false, discount: 0.00, paid: 5.72 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.44, promotion: false, discount: 0.00, paid: 14.59 }
  ] },
  { orderId: 'ORD20260916003', orderTime: '2026-09-16 17:07:16', payTime: '2026-09-16 17:09:35', payNo: 'PAY20260916003001', payMethod: 'alipay', discount: 0.00, amount: 52.92, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.79, promotion: false, discount: 0.00, paid: 10.70 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.08, promotion: false, discount: 0.00, paid: 8.62 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 33.60 }
  ] },
  { orderId: 'ORD20260916004', orderTime: '2026-09-16 18:04:41', payTime: '2026-09-16 18:07:55', payNo: 'PAY20260916004001', payMethod: 'cash', discount: 19.05, amount: 140.35, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 10.22, paid: 29.58 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: true, discount: 8.83, paid: 65.87 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260916005', orderTime: '2026-09-16 18:06:23', payTime: '2026-09-16 18:07:36', payNo: 'PAY20260916005001', payMethod: 'alipay', discount: 0.00, amount: 71.38, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.55, promotion: false, discount: 0.00, paid: 11.68 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260916006', orderTime: '2026-09-16 18:57:54', payTime: '2026-09-16 19:01:09', payNo: 'PAY20260916006001', payMethod: 'card', discount: 0.00, amount: 18.40, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.14, promotion: false, discount: 0.00, paid: 3.40 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 }
  ] },
  { orderId: 'ORD20260916007', orderTime: '2026-09-16 18:58:16', payTime: '2026-09-16 18:59:23', payNo: 'PAY20260916007001', payMethod: 'wechat', discount: 0.00, amount: 41.46, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 0.94, promotion: false, discount: 0.00, paid: 16.73 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.83, promotion: false, discount: 0.00, paid: 24.73 }
  ] },
  { orderId: 'ORD20260916008', orderTime: '2026-09-16 18:58:38', payTime: '2026-09-16 18:59:41', payNo: 'PAY20260916008001', payMethod: 'card', discount: 0.78, amount: 57.96, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.26, promotion: true, discount: 0.78, paid: 4.99 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.32, promotion: false, discount: 0.00, paid: 22.97 }
  ] },
  { orderId: 'ORD20260916009', orderTime: '2026-09-16 19:09:44', payTime: '2026-09-16 19:12:53', payNo: 'PAY20260916009001', payMethod: 'wechat', discount: 0.00, amount: 26.42, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.11, promotion: false, discount: 0.00, paid: 26.42 }
  ] },
  { orderId: 'ORD20260916010', orderTime: '2026-09-16 19:35:29', payTime: '2026-09-16 19:38:34', payNo: 'PAY20260916010001', payMethod: 'alipay', discount: 0.00, amount: 26.46, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 17.60 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.07, promotion: false, discount: 0.00, paid: 8.86 }
  ] },
  { orderId: 'ORD20260917001', orderTime: '2026-09-17 07:49:27', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 41.79, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.05, promotion: false, discount: 0.00, paid: 8.77 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.09, promotion: false, discount: 0.00, paid: 33.02 }
  ] },
  { orderId: 'ORD20260917002', orderTime: '2026-09-17 08:14:52', payTime: '2026-09-17 08:17:34', payNo: 'PAY20260917002001', payMethod: 'cash', discount: 0.00, amount: 177.23, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.41, promotion: false, discount: 0.00, paid: 8.43 },
    { code: '6901234500202', name: '帮宝适纸尿裤M码', spec: '54片/包', price: 109.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 109.00 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 59.80 }
  ] },
  { orderId: 'ORD20260917003', orderTime: '2026-09-17 08:54:01', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 39.97, status: '10', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.34, promotion: false, discount: 0.00, paid: 23.17 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 16.80 }
  ] },
  { orderId: 'ORD20260917004', orderTime: '2026-09-17 09:02:09', payTime: '2026-09-17 09:04:47', payNo: 'PAY20260917004001', payMethod: 'alipay', discount: 0.00, amount: 59.09, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 50.40 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.03, promotion: false, discount: 0.00, paid: 8.69 }
  ] },
  { orderId: 'ORD20260917005', orderTime: '2026-09-17 11:24:42', payTime: '2026-09-17 11:27:54', payNo: 'PAY20260917005001', payMethod: 'alipay', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260917006', orderTime: '2026-09-17 15:50:06', payTime: '2026-09-17 15:51:17', payNo: 'PAY20260917006001', payMethod: 'wechat', discount: 0.00, amount: 109.00, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500202', name: '帮宝适纸尿裤M码', spec: '54片/包', price: 109.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 109.00 }
  ] },
  { orderId: 'ORD20260917007', orderTime: '2026-09-17 18:55:33', payTime: '2026-09-17 18:58:40', payNo: 'PAY20260917007001', payMethod: 'wechat', discount: 2.14, amount: 97.02, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.86, promotion: true, discount: 2.14, paid: 7.12 },
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 89.90 }
  ] },
  { orderId: 'ORD20260918001', orderTime: '2026-09-18 08:07:03', payTime: '2026-09-18 08:07:49', payNo: 'PAY20260918001001', payMethod: 'alipay', discount: 0.00, amount: 132.21, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.82, promotion: false, discount: 0.00, paid: 3.51 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 128.70 }
  ] },
  { orderId: 'ORD20260918002', orderTime: '2026-09-18 09:11:39', payTime: '2026-09-18 09:12:40', payNo: 'PAY20260918002001', payMethod: 'cash', discount: 0.00, amount: 85.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 85.80 }
  ] },
  { orderId: 'ORD20260918003', orderTime: '2026-09-18 13:15:02', payTime: '2026-09-18 13:17:09', payNo: 'PAY20260918003001', payMethod: 'wechat', discount: 3.96, amount: 40.96, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 16.80 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: true, discount: 3.96, paid: 21.04 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.73, promotion: false, discount: 0.00, paid: 3.12 }
  ] },
  { orderId: 'ORD20260918004', orderTime: '2026-09-18 14:40:27', payTime: '2026-09-18 14:43:32', payNo: 'PAY20260918004001', payMethod: 'alipay', discount: 0.00, amount: 84.68, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.19, promotion: false, discount: 0.00, paid: 10.03 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.51, promotion: false, discount: 0.00, paid: 14.95 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260918005', orderTime: '2026-09-18 17:27:38', payTime: '2026-09-18 17:29:23', payNo: 'PAY20260918005001', payMethod: 'alipay', discount: 1.78, amount: 30.64, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.42, promotion: true, discount: 1.78, paid: 10.74, refund: 6.55 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260918006', orderTime: '2026-09-18 17:58:49', payTime: '2026-09-18 18:00:01', payNo: 'PAY20260918006001', payMethod: 'cash', discount: 0.00, amount: 28.08, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.18, promotion: false, discount: 0.00, paid: 28.08 }
  ] },
  { orderId: 'ORD20260918007', orderTime: '2026-09-18 18:56:57', payTime: '2026-09-18 19:00:11', payNo: 'PAY20260918007001', payMethod: 'cash', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260918008', orderTime: '2026-09-18 19:02:15', payTime: '2026-09-18 19:05:05', payNo: 'PAY20260918008001', payMethod: 'wechat', discount: 0.00, amount: 5.73, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.25, promotion: false, discount: 0.00, paid: 5.73 }
  ] },
  { orderId: 'ORD20260918009', orderTime: '2026-09-18 21:44:11', payTime: '2026-09-18 21:47:15', payNo: 'PAY20260918009001', payMethod: 'cash', discount: 0.00, amount: 64.94, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.20, promotion: false, discount: 0.00, paid: 5.14 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 59.80 }
  ] },
  { orderId: 'ORD20260919001', orderTime: '2026-09-19 07:38:51', payTime: '2026-09-19 07:40:06', payNo: 'PAY20260919001001', payMethod: 'wechat', discount: 0.00, amount: 70.27, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.47, promotion: false, discount: 0.00, paid: 2.01 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.15, promotion: false, discount: 0.00, paid: 12.86 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 29.60 }
  ] },
  { orderId: 'ORD20260919002', orderTime: '2026-09-19 11:27:38', payTime: '2026-09-19 11:30:19', payNo: 'PAY20260919002001', payMethod: 'cash', discount: 3.35, amount: 88.21, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.49, promotion: true, discount: 0.75, paid: 2.18 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: true, discount: 2.60, paid: 14.20 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.52, promotion: false, discount: 0.00, paid: 12.13 }
  ] },
  { orderId: 'ORD20260919003', orderTime: '2026-09-19 11:36:30', payTime: '2026-09-19 11:38:53', payNo: 'PAY20260919003001', payMethod: 'card', discount: 3.11, amount: 100.20, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.25, promotion: true, discount: 3.11, paid: 10.35 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.53, promotion: false, discount: 0.00, paid: 15.15 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260919004', orderTime: '2026-09-19 11:48:12', payTime: '2026-09-19 11:48:19', payNo: 'PAY20260919004001', payMethod: 'cash', discount: 14.44, amount: 45.34, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.84, promotion: true, discount: 4.51, paid: 20.52 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.46, promotion: true, discount: 9.93, paid: 24.82 }
  ] },
  { orderId: 'ORD20260919005', orderTime: '2026-09-19 11:50:51', payTime: '2026-09-19 11:53:14', payNo: 'PAY20260919005001', payMethod: 'wechat', discount: 0.00, amount: 19.82, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.91, promotion: false, discount: 0.00, paid: 15.24 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.00, promotion: false, discount: 0.00, paid: 4.58 }
  ] },
  { orderId: 'ORD20260919006', orderTime: '2026-09-19 13:23:47', payTime: '2026-09-19 13:25:30', payNo: 'PAY20260919006001', payMethod: 'wechat', discount: 0.00, amount: 9.32, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.84, promotion: false, discount: 0.00, paid: 4.18 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.86, promotion: false, discount: 0.00, paid: 5.14 }
  ] },
  { orderId: 'ORD20260919007', orderTime: '2026-09-19 13:48:17', payTime: '2026-09-19 13:50:52', payNo: 'PAY20260919007001', payMethod: 'cash', discount: 2.49, amount: 45.44, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.07, promotion: true, discount: 2.49, paid: 14.42 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.08, promotion: false, discount: 0.00, paid: 19.22 }
  ] },
  { orderId: 'ORD20260919008', orderTime: '2026-09-19 14:42:47', payTime: '2026-09-19 14:44:36', payNo: 'PAY20260919008001', payMethod: 'wechat', discount: 0.00, amount: 33.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 8.80 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20260919009', orderTime: '2026-09-19 14:56:16', payTime: '2026-09-19 14:56:37', payNo: 'PAY20260919009001', payMethod: 'wechat', discount: 0.00, amount: 61.31, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 33.60 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.93, promotion: false, discount: 0.00, paid: 27.71 }
  ] },
  { orderId: 'ORD20260919010', orderTime: '2026-09-19 16:25:55', payTime: '2026-09-19 16:28:53', payNo: 'PAY20260919010001', payMethod: 'wechat', discount: 0.00, amount: 58.37, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 19.80 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.09, promotion: false, discount: 0.00, paid: 32.48 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.33, promotion: false, discount: 0.00, paid: 6.09 }
  ] },
  { orderId: 'ORD20260919011', orderTime: '2026-09-19 18:03:09', payTime: '2026-09-19 18:04:08', payNo: 'PAY20260919011001', payMethod: 'wechat', discount: 1.63, amount: 43.24, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.27, promotion: false, discount: 0.00, paid: 37.85 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.41, promotion: true, discount: 1.63, paid: 5.39 }
  ] },
  { orderId: 'ORD20260919012', orderTime: '2026-09-19 18:14:17', payTime: '2026-09-19 18:14:52', payNo: 'PAY20260919012001', payMethod: 'wechat', discount: 5.57, amount: 88.99, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.58, promotion: false, discount: 0.00, paid: 12.61 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.48, promotion: true, discount: 5.57, paid: 18.98 }
  ] },
  { orderId: 'ORD20260919013', orderTime: '2026-09-19 18:47:49', payTime: '2026-09-19 18:48:30', payNo: 'PAY20260919013001', payMethod: 'wechat', discount: 0.00, amount: 42.07, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 19.80 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 0.64, promotion: false, discount: 0.00, paid: 11.39 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.82, promotion: false, discount: 0.00, paid: 10.88 }
  ] },
  { orderId: 'ORD20260919014', orderTime: '2026-09-19 19:36:44', payTime: '2026-09-19 19:38:58', payNo: 'PAY20260919014001', payMethod: 'wechat', discount: 0.00, amount: 107.30, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.07, promotion: false, discount: 0.00, paid: 31.89, refund: 26.47 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.89, promotion: false, discount: 0.00, paid: 75.41 }
  ] },
  { orderId: 'ORD20260919015', orderTime: '2026-09-19 19:40:40', payTime: '2026-09-19 19:41:27', payNo: 'PAY20260919015001', payMethod: 'wechat', discount: 0.00, amount: 68.77, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.98, promotion: false, discount: 0.00, paid: 9.07 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260920001', orderTime: '2026-09-20 07:39:52', payTime: '', payNo: '', payMethod: '', discount: 9.46, amount: 49.42, status: '50', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.39, promotion: true, discount: 7.02, paid: 26.06 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: true, discount: 2.44, paid: 23.36 }
  ] },
  { orderId: 'ORD20260920002', orderTime: '2026-09-20 09:05:14', payTime: '', payNo: '', payMethod: '', discount: 3.96, amount: 13.20, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.15, promotion: true, discount: 3.96, paid: 13.20 }
  ] },
  { orderId: 'ORD20260920003', orderTime: '2026-09-20 09:47:20', payTime: '2026-09-20 09:47:55', payNo: 'PAY20260920003001', payMethod: 'cash', discount: 4.41, amount: 100.40, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.25, promotion: true, discount: 0.49, paid: 4.86, refundPrev: 2.24 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.85, promotion: false, discount: 0.00, paid: 3.89 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.27, promotion: true, discount: 3.92, paid: 31.95 }
  ] },
  { orderId: 'ORD20260920004', orderTime: '2026-09-20 10:39:30', payTime: '2026-09-20 10:40:13', payNo: 'PAY20260920004001', payMethod: 'alipay', discount: 0.36, amount: 35.58, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.70, promotion: true, discount: 0.36, paid: 2.64 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.23, promotion: false, discount: 0.00, paid: 6.13 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.41, promotion: false, discount: 0.00, paid: 6.46 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.55, promotion: false, discount: 0.00, paid: 20.35 }
  ] },
  { orderId: 'ORD20260920005', orderTime: '2026-09-20 12:29:52', payTime: '', payNo: '', payMethod: '', discount: 10.22, amount: 60.45, status: '50', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: true, discount: 7.42, paid: 44.18 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.39, promotion: true, discount: 2.80, paid: 16.27 }
  ] },
  { orderId: 'ORD20260920006', orderTime: '2026-09-20 12:41:11', payTime: '2026-09-20 12:41:35', payNo: 'PAY20260920006001', payMethod: 'wechat', discount: 10.45, amount: 62.95, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 33.60 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 10.45, paid: 29.35 }
  ] },
  { orderId: 'ORD20260920007', orderTime: '2026-09-20 15:35:53', payTime: '2026-09-20 15:38:20', payNo: 'PAY20260920007001', payMethod: 'wechat', discount: 3.81, amount: 100.06, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.24, promotion: true, discount: 3.81, paid: 9.59 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 26.40 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.15, promotion: false, discount: 0.00, paid: 64.07 }
  ] },
  { orderId: 'ORD20260920008', orderTime: '2026-09-20 15:48:10', payTime: '2026-09-20 15:48:57', payNo: 'PAY20260920008001', payMethod: 'cash', discount: 0.00, amount: 78.21, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.87, promotion: false, discount: 0.00, paid: 18.51 }
  ] },
  { orderId: 'ORD20260920009', orderTime: '2026-09-20 16:43:24', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 6.37, status: '10', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.28, promotion: false, discount: 0.00, paid: 6.37 }
  ] },
  { orderId: 'ORD20260920010', orderTime: '2026-09-20 18:12:20', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 113.28, status: '50', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 85.80 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.88, promotion: false, discount: 0.00, paid: 5.60 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.21, promotion: false, discount: 0.00, paid: 21.88 }
  ] },
  { orderId: 'ORD20260920011', orderTime: '2026-09-20 18:32:04', payTime: '2026-09-20 18:35:22', payNo: 'PAY20260920011001', payMethod: 'card', discount: 1.84, amount: 11.73, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.57, promotion: true, discount: 1.84, paid: 11.73 }
  ] },
  { orderId: 'ORD20260920012', orderTime: '2026-09-20 18:38:54', payTime: '2026-09-20 18:39:30', payNo: 'PAY20260920012001', payMethod: 'wechat', discount: 0.00, amount: 19.47, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.44, promotion: false, discount: 0.00, paid: 19.47 }
  ] },
  { orderId: 'ORD20260920013', orderTime: '2026-09-20 18:42:27', payTime: '2026-09-20 18:44:13', payNo: 'PAY20260920013001', payMethod: 'wechat', discount: 17.13, amount: 78.58, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 2.96, paid: 16.94 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.90, promotion: true, discount: 14.17, paid: 61.64 }
  ] },
  { orderId: 'ORD20260920014', orderTime: '2026-09-20 19:04:04', payTime: '2026-09-20 19:05:25', payNo: 'PAY20260920014001', payMethod: 'mixed', discount: 10.84, amount: 143.27, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.45, promotion: true, discount: 2.39, paid: 20.52 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 51.60 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: true, discount: 8.45, paid: 51.25 }
  ] },
  { orderId: 'ORD20260920015', orderTime: '2026-09-20 20:58:31', payTime: '', payNo: '', payMethod: '', discount: 1.91, amount: 79.52, status: '50', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.47, promotion: true, discount: 1.91, paid: 4.82 }
  ] },
  { orderId: 'ORD20260921001', orderTime: '2026-09-21 07:20:52', payTime: '2026-09-21 07:22:44', payNo: 'PAY20260921001001', payMethod: 'alipay', discount: 0.00, amount: 35.40, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 }
  ] },
  { orderId: 'ORD20260921002', orderTime: '2026-09-21 10:35:08', payTime: '2026-09-21 10:38:26', payNo: 'PAY20260921002001', payMethod: 'wechat', discount: 0.00, amount: 8.56, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.87, promotion: false, discount: 0.00, paid: 8.56 }
  ] },
  { orderId: 'ORD20260921003', orderTime: '2026-09-21 12:34:42', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 27.34, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.75, promotion: false, discount: 0.00, paid: 3.74 }
  ] },
  { orderId: 'ORD20260921004', orderTime: '2026-09-21 12:35:42', payTime: '2026-09-21 12:38:50', payNo: 'PAY20260921004001', payMethod: 'card', discount: 0.00, amount: 19.79, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.48, promotion: false, discount: 0.00, paid: 19.79 }
  ] },
  { orderId: 'ORD20260921005', orderTime: '2026-09-21 13:19:53', payTime: '', payNo: '', payMethod: '', discount: 1.32, amount: 18.57, status: '50', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.20, promotion: true, discount: 1.32, paid: 3.82 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.49, promotion: false, discount: 0.00, paid: 14.75 }
  ] },
  { orderId: 'ORD20260921006', orderTime: '2026-09-21 16:24:33', payTime: '2026-09-21 16:25:38', payNo: 'PAY20260921006001', payMethod: 'alipay', discount: 1.97, amount: 84.80, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.30, promotion: true, discount: 1.97, paid: 20.80 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 }
  ] },
  { orderId: 'ORD20260921007', orderTime: '2026-09-21 19:00:15', payTime: '2026-09-21 19:01:22', payNo: 'PAY20260921007001', payMethod: 'wechat', discount: 6.21, amount: 68.62, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 49.80 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.84, promotion: true, discount: 6.21, paid: 18.82 }
  ] },
  { orderId: 'ORD20260922001', orderTime: '2026-09-22 08:07:24', payTime: '2026-09-22 08:09:35', payNo: 'PAY20260922001001', payMethod: 'wechat', discount: 4.48, amount: 56.39, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.22, promotion: false, discount: 0.00, paid: 17.72 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.61, promotion: true, discount: 4.48, paid: 38.67 }
  ] },
  { orderId: 'ORD20260922002', orderTime: '2026-09-22 09:45:46', payTime: '2026-09-22 09:48:52', payNo: 'PAY20260922002001', payMethod: 'alipay', discount: 2.60, amount: 67.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 50.40 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 2.60, paid: 17.30 }
  ] },
  { orderId: 'ORD20260922003', orderTime: '2026-09-22 09:46:07', payTime: '2026-09-22 09:48:47', payNo: 'PAY20260922003001', payMethod: 'alipay', discount: 2.28, amount: 75.46, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.72, promotion: false, discount: 0.00, paid: 7.13, refund: 3.99 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.55, promotion: true, discount: 2.28, paid: 8.63 }
  ] },
  { orderId: 'ORD20260922004', orderTime: '2026-09-22 11:25:22', payTime: '2026-09-22 11:26:21', payNo: 'PAY20260922004001', payMethod: 'alipay', discount: 0.00, amount: 8.96, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.80, promotion: false, discount: 0.00, paid: 8.96 }
  ] },
  { orderId: 'ORD20260922005', orderTime: '2026-09-22 12:19:01', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 19.52, status: '10', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.82, promotion: false, discount: 0.00, paid: 19.52 }
  ] },
  { orderId: 'ORD20260922006', orderTime: '2026-09-22 13:33:43', payTime: '2026-09-22 13:34:18', payNo: 'PAY20260922006001', payMethod: 'alipay', discount: 0.67, amount: 7.46, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.88, promotion: true, discount: 0.67, paid: 1.95 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.69, promotion: false, discount: 0.00, paid: 5.51 }
  ] },
  { orderId: 'ORD20260922007', orderTime: '2026-09-22 16:44:30', payTime: '2026-09-22 16:46:48', payNo: 'PAY20260922007001', payMethod: 'wechat', discount: 10.49, amount: 47.48, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.57, promotion: false, discount: 0.00, paid: 13.57 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: true, discount: 10.49, paid: 33.91 }
  ] },
  { orderId: 'ORD20260922008', orderTime: '2026-09-22 17:03:17', payTime: '2026-09-22 17:04:05', payNo: 'PAY20260922008001', payMethod: 'wechat', discount: 0.00, amount: 12.78, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.44, promotion: false, discount: 0.00, paid: 10.44 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.51, promotion: false, discount: 0.00, paid: 2.34 }
  ] },
  { orderId: 'ORD20260922009', orderTime: '2026-09-22 17:05:31', payTime: '2026-09-22 17:07:04', payNo: 'PAY20260922009001', payMethod: 'card', discount: 13.03, amount: 91.58, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.39, promotion: true, discount: 1.46, paid: 9.49 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.20, promotion: false, discount: 0.00, paid: 13.16 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.71, promotion: true, discount: 11.57, paid: 29.13 }
  ] },
  { orderId: 'ORD20260922010', orderTime: '2026-09-22 17:39:04', payTime: '2026-09-22 17:39:56', payNo: 'PAY20260922010001', payMethod: 'mixed', discount: 0.00, amount: 59.70, status: '40', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260922011', orderTime: '2026-09-22 19:55:11', payTime: '2026-09-22 19:56:23', payNo: 'PAY20260922011001', payMethod: 'alipay', discount: 0.00, amount: 7.62, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.53, promotion: false, discount: 0.00, paid: 7.62 }
  ] },
  { orderId: 'ORD20260923001', orderTime: '2026-09-23 08:01:47', payTime: '2026-09-23 08:02:15', payNo: 'PAY20260923001001', payMethod: 'wechat', discount: 5.03, amount: 35.08, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.23, promotion: false, discount: 0.00, paid: 10.21 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: true, discount: 5.03, paid: 24.87 }
  ] },
  { orderId: 'ORD20260923002', orderTime: '2026-09-23 08:07:27', payTime: '2026-09-23 08:10:34', payNo: 'PAY20260923002001', payMethod: 'wechat', discount: 20.00, amount: 174.93, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.49, promotion: true, discount: 20.00, paid: 79.35 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.58, promotion: false, discount: 0.00, paid: 12.61 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.43, promotion: false, discount: 0.00, paid: 65.12 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.75, promotion: false, discount: 0.00, paid: 17.85 }
  ] },
  { orderId: 'ORD20260923003', orderTime: '2026-09-23 08:21:31', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 59.70, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260923004', orderTime: '2026-09-23 12:19:16', payTime: '2026-09-23 12:19:26', payNo: 'PAY20260923004001', payMethod: 'wechat', discount: 0.00, amount: 16.80, status: '40', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 16.80 }
  ] },
  { orderId: 'ORD20260923005', orderTime: '2026-09-23 13:02:13', payTime: '2026-09-23 13:05:31', payNo: 'PAY20260923005001', payMethod: 'wechat', discount: 15.48, amount: 72.60, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.69, promotion: false, discount: 0.00, paid: 10.90 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.59, promotion: true, discount: 15.48, paid: 61.70 }
  ] },
  { orderId: 'ORD20260923006', orderTime: '2026-09-23 13:27:37', payTime: '2026-09-23 13:28:55', payNo: 'PAY20260923006001', payMethod: 'cash', discount: 0.00, amount: 8.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 8.80, refundPrev: 3.70 }
  ] },
  { orderId: 'ORD20260923007', orderTime: '2026-09-23 14:22:28', payTime: '2026-09-23 14:23:36', payNo: 'PAY20260923007001', payMethod: 'cash', discount: 0.00, amount: 44.40, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 44.40 }
  ] },
  { orderId: 'ORD20260923008', orderTime: '2026-09-23 17:27:34', payTime: '2026-09-23 17:29:18', payNo: 'PAY20260923008001', payMethod: 'alipay', discount: 6.87, amount: 140.60, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.29, promotion: true, discount: 6.87, paid: 44.60 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 96.00 }
  ] },
  { orderId: 'ORD20260923009', orderTime: '2026-09-23 17:41:15', payTime: '2026-09-23 17:44:17', payNo: 'PAY20260923009001', payMethod: 'cash', discount: 0.00, amount: 7.48, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 0.42, promotion: false, discount: 0.00, paid: 7.48 }
  ] },
  { orderId: 'ORD20260923010', orderTime: '2026-09-23 20:59:34', payTime: '2026-09-23 21:02:33', payNo: 'PAY20260923010001', payMethod: 'wechat', discount: 0.00, amount: 53.21, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.54, promotion: false, discount: 0.00, paid: 27.41 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20260924001', orderTime: '2026-09-24 07:42:47', payTime: '2026-09-24 07:46:03', payNo: 'PAY20260924001001', payMethod: 'alipay', discount: 13.13, amount: 48.07, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 16.80 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: true, discount: 13.13, paid: 31.27 }
  ] },
  { orderId: 'ORD20260924002', orderTime: '2026-09-24 08:13:42', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 31.89, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.34, promotion: false, discount: 0.00, paid: 31.89 }
  ] },
  { orderId: 'ORD20260924003', orderTime: '2026-09-24 08:36:04', payTime: '2026-09-24 08:38:16', payNo: 'PAY20260924003001', payMethod: 'alipay', discount: 0.00, amount: 55.36, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.83, promotion: false, discount: 0.00, paid: 4.96 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 50.40 }
  ] },
  { orderId: 'ORD20260924004', orderTime: '2026-09-24 09:18:16', payTime: '2026-09-24 09:18:55', payNo: 'PAY20260924004001', payMethod: 'wechat', discount: 0.64, amount: 143.73, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.81, promotion: true, discount: 0.64, paid: 4.20 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.34, promotion: false, discount: 0.00, paid: 69.73 }
  ] },
  { orderId: 'ORD20260924005', orderTime: '2026-09-24 10:38:38', payTime: '2026-09-24 10:38:48', payNo: 'PAY20260924005001', payMethod: 'wechat', discount: 2.36, amount: 80.30, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: true, discount: 2.36, paid: 9.44 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.71, promotion: false, discount: 0.00, paid: 50.96, refund: 50.96 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260924006', orderTime: '2026-09-24 11:10:42', payTime: '2026-09-24 11:12:28', payNo: 'PAY20260924006001', payMethod: 'alipay', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260924007', orderTime: '2026-09-24 14:05:21', payTime: '2026-09-24 14:07:32', payNo: 'PAY20260924007001', payMethod: 'cash', discount: 0.00, amount: 81.08, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.35, promotion: false, discount: 0.00, paid: 14.05 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.68, promotion: false, discount: 0.00, paid: 67.03 }
  ] },
  { orderId: 'ORD20260924008', orderTime: '2026-09-24 17:25:39', payTime: '2026-09-24 17:25:49', payNo: 'PAY20260924008001', payMethod: 'alipay', discount: 0.00, amount: 12.50, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 }
  ] },
  { orderId: 'ORD20260924009', orderTime: '2026-09-24 17:26:16', payTime: '2026-09-24 17:26:36', payNo: 'PAY20260924009001', payMethod: 'wechat', discount: 6.62, amount: 50.03, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: true, discount: 6.62, paid: 38.38 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 2.34, promotion: false, discount: 0.00, paid: 11.65 }
  ] },
  { orderId: 'ORD20260924010', orderTime: '2026-09-24 18:52:39', payTime: '2026-09-24 18:53:25', payNo: 'PAY20260924010001', payMethod: 'wechat', discount: 2.85, amount: 86.10, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.73, promotion: true, discount: 2.85, paid: 27.94 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.17, promotion: false, discount: 0.00, paid: 58.16 }
  ] },
  { orderId: 'ORD20260924011', orderTime: '2026-09-24 19:01:39', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 17.48, status: '50', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.19, promotion: false, discount: 0.00, paid: 17.48 }
  ] },
  { orderId: 'ORD20260924012', orderTime: '2026-09-24 20:33:15', payTime: '2026-09-24 20:36:31', payNo: 'PAY20260924012001', payMethod: 'wechat', discount: 0.00, amount: 157.19, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.42, promotion: false, discount: 0.00, paid: 8.49 }
  ] },
  { orderId: 'ORD20260924013', orderTime: '2026-09-24 21:21:22', payTime: '2026-09-24 21:24:13', payNo: 'PAY20260924013001', payMethod: 'alipay', discount: 0.00, amount: 25.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20260925001', orderTime: '2026-09-25 07:07:18', payTime: '2026-09-25 07:09:04', payNo: 'PAY20260925001001', payMethod: 'alipay', discount: 13.24, amount: 197.26, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.02, promotion: true, discount: 13.24, paid: 67.36 }
  ] },
  { orderId: 'ORD20260925002', orderTime: '2026-09-25 08:44:14', payTime: '2026-09-25 08:47:05', payNo: 'PAY20260925002001', payMethod: 'alipay', discount: 0.00, amount: 26.78, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.31, promotion: false, discount: 0.00, paid: 6.88 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260925003', orderTime: '2026-09-25 09:01:16', payTime: '2026-09-25 09:01:50', payNo: 'PAY20260925003001', payMethod: 'wechat', discount: 0.00, amount: 45.38, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.60, promotion: false, discount: 0.00, paid: 4.77 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.57, promotion: false, discount: 0.00, paid: 40.61 }
  ] },
  { orderId: 'ORD20260925004', orderTime: '2026-09-25 09:20:53', payTime: '2026-09-25 09:21:05', payNo: 'PAY20260925004001', payMethod: 'card', discount: 0.00, amount: 64.03, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.73, promotion: false, discount: 0.00, paid: 27.33 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 24.90 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 }
  ] },
  { orderId: 'ORD20260925005', orderTime: '2026-09-25 10:00:28', payTime: '2026-09-25 10:03:45', payNo: 'PAY20260925005001', payMethod: 'card', discount: 0.00, amount: 89.90, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 89.90 }
  ] },
  { orderId: 'ORD20260925006', orderTime: '2026-09-25 10:52:56', payTime: '2026-09-25 10:53:05', payNo: 'PAY20260925006001', payMethod: 'card', discount: 4.00, amount: 9.76, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.39, promotion: true, discount: 4.00, paid: 9.76 }
  ] },
  { orderId: 'ORD20260925007', orderTime: '2026-09-25 11:50:45', payTime: '2026-09-25 11:52:44', payNo: 'PAY20260925007001', payMethod: 'alipay', discount: 0.00, amount: 97.32, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.38, promotion: false, discount: 0.00, paid: 70.92 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 26.40 }
  ] },
  { orderId: 'ORD20260925008', orderTime: '2026-09-25 14:19:34', payTime: '2026-09-25 14:21:01', payNo: 'PAY20260925008001', payMethod: 'cash', discount: 15.75, amount: 170.89, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: true, discount: 12.22, paid: 62.48 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: true, discount: 3.53, paid: 8.27 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.28, promotion: false, discount: 0.00, paid: 10.44 }
  ] },
  { orderId: 'ORD20260925009', orderTime: '2026-09-25 17:06:24', payTime: '2026-09-25 17:07:33', payNo: 'PAY20260925009001', payMethod: 'alipay', discount: 2.26, amount: 18.91, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.61, promotion: false, discount: 0.00, paid: 12.85 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.67, promotion: true, discount: 2.26, paid: 6.06 }
  ] },
  { orderId: 'ORD20260925010', orderTime: '2026-09-25 19:33:55', payTime: '2026-09-25 19:34:26', payNo: 'PAY20260925010001', payMethod: 'cash', discount: 0.00, amount: 9.90, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 }
  ] },
  { orderId: 'ORD20260926001', orderTime: '2026-09-26 07:34:26', payTime: '2026-09-26 07:36:47', payNo: 'PAY20260926001001', payMethod: 'card', discount: 0.00, amount: 23.60, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60, refund: 23.60, refundPrev: 7.08 }
  ] },
  { orderId: 'ORD20260926002', orderTime: '2026-09-26 08:10:16', payTime: '2026-09-26 08:13:10', payNo: 'PAY20260926002001', payMethod: 'alipay', discount: 5.16, amount: 34.74, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.00, promotion: true, discount: 5.16, paid: 34.74 }
  ] },
  { orderId: 'ORD20260926003', orderTime: '2026-09-26 08:50:09', payTime: '2026-09-26 08:50:13', payNo: 'PAY20260926003001', payMethod: 'alipay', discount: 0.83, amount: 75.22, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.99, promotion: true, discount: 0.83, paid: 3.70 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.40, promotion: false, discount: 0.00, paid: 71.52 }
  ] },
  { orderId: 'ORD20260926004', orderTime: '2026-09-26 08:52:15', payTime: '2026-09-26 08:53:20', payNo: 'PAY20260926004001', payMethod: 'wechat', discount: 0.00, amount: 8.67, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.45, promotion: false, discount: 0.00, paid: 8.67 }
  ] },
  { orderId: 'ORD20260926005', orderTime: '2026-09-26 09:46:14', payTime: '2026-09-26 09:47:58', payNo: 'PAY20260926005001', payMethod: 'cash', discount: 0.00, amount: 29.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 29.70 }
  ] },
  { orderId: 'ORD20260926006', orderTime: '2026-09-26 09:58:04', payTime: '2026-09-26 09:58:16', payNo: 'PAY20260926006001', payMethod: 'cash', discount: 0.00, amount: 149.22, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.09, promotion: false, discount: 0.00, paid: 49.74 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.60, promotion: false, discount: 0.00, paid: 25.28 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.49, promotion: false, discount: 0.00, paid: 74.20 }
  ] },
  { orderId: 'ORD20260926007', orderTime: '2026-09-26 10:13:12', payTime: '2026-09-26 10:15:55', payNo: 'PAY20260926007001', payMethod: 'alipay', discount: 0.00, amount: 109.45, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.32, promotion: false, discount: 0.00, paid: 6.91 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.63, promotion: false, discount: 0.00, paid: 65.04 }
  ] },
  { orderId: 'ORD20260926008', orderTime: '2026-09-26 10:29:54', payTime: '2026-09-26 10:31:34', payNo: 'PAY20260926008001', payMethod: 'cash', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260926009', orderTime: '2026-09-26 11:35:57', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 59.28, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.64, promotion: false, discount: 0.00, paid: 10.11 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.65, promotion: false, discount: 0.00, paid: 49.17 }
  ] },
  { orderId: 'ORD20260926010', orderTime: '2026-09-26 12:44:51', payTime: '2026-09-26 12:45:35', payNo: 'PAY20260926010001', payMethod: 'alipay', discount: 0.00, amount: 6.08, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.04, promotion: false, discount: 0.00, paid: 6.08 }
  ] },
  { orderId: 'ORD20260926011', orderTime: '2026-09-26 13:36:43', payTime: '2026-09-26 13:39:00', payNo: 'PAY20260926011001', payMethod: 'wechat', discount: 0.88, amount: 17.21, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.30, promotion: false, discount: 0.00, paid: 12.87 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.22, promotion: true, discount: 0.88, paid: 4.34 }
  ] },
  { orderId: 'ORD20260926012', orderTime: '2026-09-26 16:10:43', payTime: '2026-09-26 16:13:45', payNo: 'PAY20260926012001', payMethod: 'cash', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260926013', orderTime: '2026-09-26 16:35:28', payTime: '2026-09-26 16:37:04', payNo: 'PAY20260926013001', payMethod: 'alipay', discount: 5.44, amount: 141.39, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.48, promotion: false, discount: 0.00, paid: 59.05 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.81, promotion: false, discount: 0.00, paid: 43.08 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: true, discount: 2.97, paid: 26.73 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: true, discount: 2.47, paid: 12.53 }
  ] },
  { orderId: 'ORD20260926014', orderTime: '2026-09-26 16:48:08', payTime: '2026-09-26 16:49:47', payNo: 'PAY20260926014001', payMethod: 'cash', discount: 0.00, amount: 43.51, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.46, promotion: false, discount: 0.00, paid: 43.51 }
  ] },
  { orderId: 'ORD20260926015', orderTime: '2026-09-26 17:16:30', payTime: '2026-09-26 17:19:21', payNo: 'PAY20260926015001', payMethod: 'cash', discount: 0.00, amount: 85.23, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 45.00 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 2.26, promotion: false, discount: 0.00, paid: 40.23 }
  ] },
  { orderId: 'ORD20260926016', orderTime: '2026-09-26 17:29:49', payTime: '2026-09-26 17:30:39', payNo: 'PAY20260926016001', payMethod: 'card', discount: 0.00, amount: 18.37, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 0.52, promotion: false, discount: 0.00, paid: 9.26 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.99, promotion: false, discount: 0.00, paid: 9.11 }
  ] },
  { orderId: 'ORD20260926017', orderTime: '2026-09-26 18:53:02', payTime: '2026-09-26 18:54:04', payNo: 'PAY20260926017001', payMethod: 'wechat', discount: 0.20, amount: 132.55, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.58, promotion: true, discount: 0.20, paid: 2.28 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.84, promotion: false, discount: 0.00, paid: 8.43 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.42, promotion: false, discount: 0.00, paid: 57.60 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.61, promotion: false, discount: 0.00, paid: 64.24 }
  ] },
  { orderId: 'ORD20260926018', orderTime: '2026-09-26 19:07:00', payTime: '2026-09-26 19:07:48', payNo: 'PAY20260926018001', payMethod: 'wechat', discount: 2.13, amount: 36.53, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.49, promotion: true, discount: 1.11, paid: 3.74 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.53, promotion: true, discount: 1.02, paid: 3.21 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.00, promotion: false, discount: 0.00, paid: 4.58 }
  ] },
  { orderId: 'ORD20260926019', orderTime: '2026-09-26 19:31:41', payTime: '2026-09-26 19:32:38', payNo: 'PAY20260926019001', payMethod: 'card', discount: 11.87, amount: 75.43, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 42.90 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: true, discount: 11.87, paid: 32.53 }
  ] },
  { orderId: 'ORD20260927001', orderTime: '2026-09-27 07:34:23', payTime: '2026-09-27 07:35:46', payNo: 'PAY20260927001001', payMethod: 'wechat', discount: 20.25, amount: 70.32, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: true, discount: 20.25, paid: 54.45 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.13, promotion: false, discount: 0.00, paid: 12.74 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.05, promotion: false, discount: 0.00, paid: 3.13, refund: 3.13 }
  ] },
  { orderId: 'ORD20260927002', orderTime: '2026-09-27 07:37:08', payTime: '2026-09-27 07:40:07', payNo: 'PAY20260927002001', payMethod: 'card', discount: 5.74, amount: 166.39, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 14.80 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.45, promotion: false, discount: 0.00, paid: 34.51 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.39, promotion: false, discount: 0.00, paid: 71.22 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: true, discount: 5.74, paid: 45.86 }
  ] },
  { orderId: 'ORD20260927003', orderTime: '2026-09-27 08:03:55', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 19.90, status: '50', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260927004', orderTime: '2026-09-27 08:18:19', payTime: '2026-09-27 08:18:33', payNo: 'PAY20260927004001', payMethod: 'wechat', discount: 3.59, amount: 146.89, status: '40', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.61, promotion: false, discount: 0.00, paid: 3.65 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.76, promotion: true, discount: 3.59, paid: 27.74 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20260927005', orderTime: '2026-09-27 08:34:28', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 127.46, status: '10', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.39, promotion: false, discount: 0.00, paid: 37.76 }
  ] },
  { orderId: 'ORD20260927006', orderTime: '2026-09-27 09:06:28', payTime: '2026-09-27 09:07:59', payNo: 'PAY20260927006001', payMethod: 'card', discount: 0.00, amount: 50.14, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.82, promotion: false, discount: 0.00, paid: 8.34 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 16.80 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20260927007', orderTime: '2026-09-27 11:10:26', payTime: '2026-09-27 11:10:37', payNo: 'PAY20260927007001', payMethod: 'alipay', discount: 12.64, amount: 87.90, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.59, promotion: false, discount: 0.00, paid: 4.71 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.35, promotion: true, discount: 12.64, paid: 57.39 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20260927008', orderTime: '2026-09-27 12:19:58', payTime: '2026-09-27 12:20:21', payNo: 'PAY20260927008001', payMethod: 'alipay', discount: 0.00, amount: 67.72, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.02, promotion: false, discount: 0.00, paid: 16.12 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 51.60 }
  ] },
  { orderId: 'ORD20260927009', orderTime: '2026-09-27 12:36:39', payTime: '2026-09-27 12:39:33', payNo: 'PAY20260927009001', payMethod: 'cash', discount: 22.93, amount: 91.44, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: true, discount: 22.93, paid: 54.47 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.34, promotion: false, discount: 0.00, paid: 36.97 }
  ] },
  { orderId: 'ORD20260927010', orderTime: '2026-09-27 13:46:04', payTime: '2026-09-27 13:47:09', payNo: 'PAY20260927010001', payMethod: 'alipay', discount: 0.00, amount: 66.91, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 51.60 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.56, promotion: false, discount: 0.00, paid: 15.31 }
  ] },
  { orderId: 'ORD20260927011', orderTime: '2026-09-27 14:35:17', payTime: '2026-09-27 14:37:26', payNo: 'PAY20260927011001', payMethod: 'cash', discount: 0.00, amount: 133.74, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.29, promotion: false, discount: 0.00, paid: 3.84 }
  ] },
  { orderId: 'ORD20260927012', orderTime: '2026-09-27 17:04:16', payTime: '2026-09-27 17:06:25', payNo: 'PAY20260927012001', payMethod: 'alipay', discount: 0.00, amount: 169.22, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40, refundPrev: 41.80 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.41, promotion: false, discount: 0.00, paid: 12.22 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20260927013', orderTime: '2026-09-27 17:29:17', payTime: '2026-09-27 17:31:07', payNo: 'PAY20260927013001', payMethod: 'alipay', discount: 0.00, amount: 178.20, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 29.70 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 128.70 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.61, promotion: false, discount: 0.00, paid: 4.80 }
  ] },
  { orderId: 'ORD20260927014', orderTime: '2026-09-27 18:16:27', payTime: '2026-09-27 18:19:46', payNo: 'PAY20260927014001', payMethod: 'card', discount: 0.00, amount: 52.84, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.78, promotion: false, discount: 0.00, paid: 23.24 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 29.60 }
  ] },
  { orderId: 'ORD20260927015', orderTime: '2026-09-27 18:25:51', payTime: '2026-09-27 18:28:21', payNo: 'PAY20260927015001', payMethod: 'alipay', discount: 0.00, amount: 74.62, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.76, promotion: false, discount: 0.00, paid: 41.89 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.62, promotion: false, discount: 0.00, paid: 6.93 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20260927016', orderTime: '2026-09-27 18:45:18', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 203.30, status: '10', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 33.60 }
  ] },
  { orderId: 'ORD20260927017', orderTime: '2026-09-27 19:01:02', payTime: '2026-09-27 19:03:48', payNo: 'PAY20260927017001', payMethod: 'cash', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260927018', orderTime: '2026-09-27 19:10:19', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 33.00, status: '50', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.32, promotion: false, discount: 0.00, paid: 10.63 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.94, promotion: false, discount: 0.00, paid: 22.37 }
  ] },
  { orderId: 'ORD20260927019', orderTime: '2026-09-27 19:12:13', payTime: '2026-09-27 19:12:40', payNo: 'PAY20260927019001', payMethod: 'cash', discount: 2.93, amount: 44.10, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.37, promotion: true, discount: 2.93, paid: 20.53 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.40, promotion: false, discount: 0.00, paid: 11.17 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 2.49, promotion: false, discount: 0.00, paid: 12.40 }
  ] },
  { orderId: 'ORD20260927020', orderTime: '2026-09-27 20:00:11', payTime: '2026-09-27 20:00:42', payNo: 'PAY20260927020001', payMethod: 'alipay', discount: 0.00, amount: 24.90, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 24.90 }
  ] },
  { orderId: 'ORD20260927021', orderTime: '2026-09-27 20:08:54', payTime: '', payNo: '', payMethod: '', discount: 5.62, amount: 92.35, status: '20', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.93, promotion: true, discount: 2.41, paid: 6.43 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.76, promotion: false, discount: 0.00, paid: 31.33 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.00, promotion: true, discount: 3.21, paid: 28.79 }
  ] },
  { orderId: 'ORD20260927022', orderTime: '2026-09-27 21:52:08', payTime: '2026-09-27 21:52:45', payNo: 'PAY20260927022001', payMethod: 'wechat', discount: 0.00, amount: 82.66, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.90, promotion: false, discount: 0.00, paid: 75.81 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.30, promotion: false, discount: 0.00, paid: 6.85 }
  ] },
  { orderId: 'ORD20260928001', orderTime: '2026-09-28 08:48:40', payTime: '2026-09-28 08:49:45', payNo: 'PAY20260928001001', payMethod: 'wechat', discount: 0.00, amount: 9.86, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.98, promotion: false, discount: 0.00, paid: 9.86 }
  ] },
  { orderId: 'ORD20260928002', orderTime: '2026-09-28 08:52:01', payTime: '2026-09-28 08:55:19', payNo: 'PAY20260928002001', payMethod: 'alipay', discount: 1.02, amount: 8.24, status: '40', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.16, promotion: true, discount: 1.02, paid: 8.24 }
  ] },
  { orderId: 'ORD20260928003', orderTime: '2026-09-28 09:40:34', payTime: '2026-09-28 09:41:40', payNo: 'PAY20260928003001', payMethod: 'cash', discount: 0.00, amount: 63.49, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 29.60 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.34, promotion: false, discount: 0.00, paid: 13.99 }
  ] },
  { orderId: 'ORD20260928004', orderTime: '2026-09-28 09:59:35', payTime: '', payNo: '', payMethod: '', discount: 0.70, amount: 51.42, status: '10', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.43, promotion: true, discount: 0.70, paid: 6.42 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 45.00 }
  ] },
  { orderId: 'ORD20260928005', orderTime: '2026-09-28 12:24:53', payTime: '2026-09-28 12:27:02', payNo: 'PAY20260928005001', payMethod: 'cash', discount: 0.00, amount: 29.02, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.28, promotion: false, discount: 0.00, paid: 20.22, refund: 17.59 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 8.80 }
  ] },
  { orderId: 'ORD20260928006', orderTime: '2026-09-28 13:36:25', payTime: '2026-09-28 13:38:36', payNo: 'PAY20260928006001', payMethod: 'alipay', discount: 2.17, amount: 13.23, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.45, promotion: true, discount: 2.17, paid: 9.40 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.77, promotion: false, discount: 0.00, paid: 3.83 }
  ] },
  { orderId: 'ORD20260928007', orderTime: '2026-09-28 16:11:39', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 257.32, status: '10', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.78, promotion: false, discount: 0.00, paid: 2.32 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 }
  ] },
  { orderId: 'ORD20260928008', orderTime: '2026-09-28 16:13:20', payTime: '2026-09-28 16:14:46', payNo: 'PAY20260928008001', payMethod: 'card', discount: 0.00, amount: 34.56, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.62, promotion: false, discount: 0.00, paid: 14.76 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 19.80 }
  ] },
  { orderId: 'ORD20260928009', orderTime: '2026-09-28 17:39:19', payTime: '2026-09-28 17:40:00', payNo: 'PAY20260928009001', payMethod: 'wechat', discount: 8.86, amount: 30.94, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 4.95, paid: 14.95 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 3.91, paid: 15.99 }
  ] },
  { orderId: 'ORD20260928010', orderTime: '2026-09-28 17:47:03', payTime: '2026-09-28 17:50:11', payNo: 'PAY20260928010001', payMethod: 'wechat', discount: 0.00, amount: 8.98, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.29, promotion: false, discount: 0.00, paid: 6.42 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.56, promotion: false, discount: 0.00, paid: 2.56 }
  ] },
  { orderId: 'ORD20260928011', orderTime: '2026-09-28 21:15:44', payTime: '2026-09-28 21:17:58', payNo: 'PAY20260928011001', payMethod: 'wechat', discount: 0.00, amount: 120.66, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.04, promotion: false, discount: 0.00, paid: 4.76 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.58, promotion: false, discount: 0.00, paid: 7.87 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.03, promotion: false, discount: 0.00, paid: 18.33 }
  ] },
  { orderId: 'ORD20260929001', orderTime: '2026-09-29 07:03:42', payTime: '2026-09-29 07:05:19', payNo: 'PAY20260929001001', payMethod: 'alipay', discount: 5.11, amount: 65.67, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.76, promotion: false, discount: 0.00, paid: 18.09 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.74, promotion: false, discount: 0.00, paid: 5.19 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.28, promotion: true, discount: 5.11, paid: 33.03 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.88, promotion: false, discount: 0.00, paid: 9.36 }
  ] },
  { orderId: 'ORD20260929002', orderTime: '2026-09-29 08:07:51', payTime: '2026-09-29 08:10:47', payNo: 'PAY20260929002001', payMethod: 'wechat', discount: 0.00, amount: 94.44, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.50, promotion: false, discount: 0.00, paid: 2.14 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.59, promotion: false, discount: 0.00, paid: 28.30 }
  ] },
  { orderId: 'ORD20260929003', orderTime: '2026-09-29 10:12:45', payTime: '2026-09-29 10:15:12', payNo: 'PAY20260929003001', payMethod: 'alipay', discount: 0.00, amount: 231.03, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.02, promotion: false, discount: 0.00, paid: 60.20 },
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 0.85, promotion: false, discount: 0.00, paid: 15.13 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20260929004', orderTime: '2026-09-29 10:58:03', payTime: '2026-09-29 11:00:27', payNo: 'PAY20260929004001', payMethod: 'cash', discount: 0.00, amount: 88.65, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.58, promotion: false, discount: 0.00, paid: 9.45 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 19.80 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 44.40 }
  ] },
  { orderId: 'ORD20260929005', orderTime: '2026-09-29 12:15:15', payTime: '2026-09-29 12:17:15', payNo: 'PAY20260929005001', payMethod: 'alipay', discount: 0.00, amount: 105.21, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.58, promotion: false, discount: 0.00, paid: 3.47 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.55, promotion: false, discount: 0.00, paid: 101.74 }
  ] },
  { orderId: 'ORD20260929006', orderTime: '2026-09-29 14:07:17', payTime: '2026-09-29 14:09:11', payNo: 'PAY20260929006001', payMethod: 'wechat', discount: 0.00, amount: 59.70, status: '40', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20260929007', orderTime: '2026-09-29 14:17:52', payTime: '2026-09-29 14:19:22', payNo: 'PAY20260929007001', payMethod: 'wechat', discount: 1.04, amount: 10.45, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.07, promotion: false, discount: 0.00, paid: 6.17 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.89, promotion: true, discount: 1.04, paid: 4.28 }
  ] },
  { orderId: 'ORD20260929008', orderTime: '2026-09-29 17:28:17', payTime: '2026-09-29 17:31:24', payNo: 'PAY20260929008001', payMethod: 'cash', discount: 0.00, amount: 32.00, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 32.00 }
  ] },
  { orderId: 'ORD20260929009', orderTime: '2026-09-29 18:16:16', payTime: '2026-09-29 18:18:26', payNo: 'PAY20260929009001', payMethod: 'cash', discount: 3.07, amount: 45.76, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.06, promotion: true, discount: 3.07, paid: 22.16 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 }
  ] },
  { orderId: 'ORD20260929010', orderTime: '2026-09-29 18:25:26', payTime: '2026-09-29 18:26:02', payNo: 'PAY20260929010001', payMethod: 'alipay', discount: 0.99, amount: 27.97, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.17, promotion: true, discount: 0.99, paid: 4.37 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 }
  ] },
  { orderId: 'ORD20260929011', orderTime: '2026-09-29 19:40:48', payTime: '2026-09-29 19:41:42', payNo: 'PAY20260929011001', payMethod: 'cash', discount: 0.00, amount: 31.12, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 0.78, promotion: false, discount: 0.00, paid: 31.12 }
  ] },
  { orderId: 'ORD20260929012', orderTime: '2026-09-29 19:52:19', payTime: '2026-09-29 19:52:59', payNo: 'PAY20260929012001', payMethod: 'wechat', discount: 0.00, amount: 62.08, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80, refundPrev: 15.12 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.25, promotion: false, discount: 0.00, paid: 22.28 }
  ] },
  { orderId: 'ORD20260930001', orderTime: '2026-09-30 08:19:39', payTime: '2026-09-30 08:19:44', payNo: 'PAY20260930001001', payMethod: 'cash', discount: 1.60, amount: 21.26, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 2.22, promotion: false, discount: 0.00, paid: 11.06 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: true, discount: 1.60, paid: 10.20 }
  ] },
  { orderId: 'ORD20260930002', orderTime: '2026-09-30 08:42:56', payTime: '2026-09-30 08:45:16', payNo: 'PAY20260930002001', payMethod: 'alipay', discount: 0.00, amount: 14.76, status: '40', store: '崧泽-松江分店', cashier: '赵收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.62, promotion: false, discount: 0.00, paid: 14.76 }
  ] },
  { orderId: 'ORD20260930003', orderTime: '2026-09-30 09:13:01', payTime: '2026-09-30 09:14:03', payNo: 'PAY20260930003001', payMethod: 'wechat', discount: 0.00, amount: 22.91, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50, refund: 12.50 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.14, promotion: false, discount: 0.00, paid: 3.40 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.53, promotion: false, discount: 0.00, paid: 7.01 }
  ] },
  { orderId: 'ORD20260930004', orderTime: '2026-09-30 09:24:53', payTime: '2026-09-30 09:25:20', payNo: 'PAY20260930004001', payMethod: 'mixed', discount: 0.00, amount: 139.17, status: '40', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.55, promotion: false, discount: 0.00, paid: 9.27 }
  ] },
  { orderId: 'ORD20260930005', orderTime: '2026-09-30 09:42:51', payTime: '2026-09-30 09:44:07', payNo: 'PAY20260930005001', payMethod: 'wechat', discount: 0.00, amount: 84.80, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 45.00 }
  ] },
  { orderId: 'ORD20260930006', orderTime: '2026-09-30 12:49:39', payTime: '2026-09-30 12:52:29', payNo: 'PAY20260930006001', payMethod: 'wechat', discount: 7.41, amount: 32.44, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.59, promotion: false, discount: 0.00, paid: 1.76 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: true, discount: 7.41, paid: 22.29 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.96, promotion: false, discount: 0.00, paid: 8.39 }
  ] },
  { orderId: 'ORD20260930007', orderTime: '2026-09-30 14:21:56', payTime: '2026-09-30 14:23:12', payNo: 'PAY20260930007001', payMethod: 'alipay', discount: 0.00, amount: 292.06, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 85.80 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.70, promotion: false, discount: 0.00, paid: 16.66 }
  ] },
  { orderId: 'ORD20260930008', orderTime: '2026-09-30 15:49:22', payTime: '2026-09-30 15:52:10', payNo: 'PAY20260930008001', payMethod: 'alipay', discount: 5.64, amount: 74.22, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: true, discount: 5.64, paid: 29.76 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.46, promotion: false, discount: 0.00, paid: 38.87 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.70, promotion: false, discount: 0.00, paid: 5.59 }
  ] },
  { orderId: 'ORD20260930009', orderTime: '2026-09-30 18:55:06', payTime: '2026-09-30 18:55:34', payNo: 'PAY20260930009001', payMethod: 'card', discount: 8.29, amount: 31.00, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: true, discount: 8.29, paid: 21.31 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.62, promotion: false, discount: 0.00, paid: 9.69 }
  ] },
  { orderId: 'ORD20260930010', orderTime: '2026-09-30 19:54:41', payTime: '2026-09-30 19:55:30', payNo: 'PAY20260930010001', payMethod: 'alipay', discount: 0.00, amount: 39.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20260930011', orderTime: '2026-09-30 20:37:47', payTime: '2026-09-30 20:40:28', payNo: 'PAY20260930011001', payMethod: 'cash', discount: 0.51, amount: 16.14, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 14.80 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.62, promotion: true, discount: 0.51, paid: 1.34 }
  ] },
  { orderId: 'ORD20261001001', orderTime: '2026-10-01 08:24:28', payTime: '2026-10-01 08:25:18', payNo: 'PAY20261001001001', payMethod: 'wechat', discount: 0.61, amount: 7.82, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.93, promotion: false, discount: 0.00, paid: 4.63 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.83, promotion: true, discount: 0.61, paid: 3.19 }
  ] },
  { orderId: 'ORD20261001002', orderTime: '2026-10-01 08:27:49', payTime: '2026-10-01 08:28:39', payNo: 'PAY20261001002001', payMethod: 'wechat', discount: 5.87, amount: 39.71, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 5.87, paid: 14.03 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.66, promotion: false, discount: 0.00, paid: 9.93 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.09, promotion: false, discount: 0.00, paid: 3.25 }
  ] },
  { orderId: 'ORD20261001003', orderTime: '2026-10-01 08:55:33', payTime: '2026-10-01 08:56:28', payNo: 'PAY20261001003001', payMethod: 'cash', discount: 2.66, amount: 35.22, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: true, discount: 2.66, paid: 27.34 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.72, promotion: false, discount: 0.00, paid: 7.88 }
  ] },
  { orderId: 'ORD20261001004', orderTime: '2026-10-01 09:31:45', payTime: '2026-10-01 09:33:12', payNo: 'PAY20261001004001', payMethod: 'cash', discount: 6.49, amount: 45.11, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: true, discount: 6.49, paid: 45.11 }
  ] },
  { orderId: 'ORD20261001005', orderTime: '2026-10-01 12:03:00', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 8.06, status: '10', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.76, promotion: false, discount: 0.00, paid: 8.06 }
  ] },
  { orderId: 'ORD20261001006', orderTime: '2026-10-01 16:15:41', payTime: '2026-10-01 16:17:42', payNo: 'PAY20261001006001', payMethod: 'alipay', discount: 0.00, amount: 14.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 14.80 }
  ] },
  { orderId: 'ORD20261001007', orderTime: '2026-10-01 16:22:00', payTime: '2026-10-01 16:22:06', payNo: 'PAY20261001007001', payMethod: 'card', discount: 16.29, amount: 43.51, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 2, weight: 0.00, promotion: true, discount: 16.29, paid: 43.51 }
  ] },
  { orderId: 'ORD20261001008', orderTime: '2026-10-01 17:22:48', payTime: '2026-10-01 17:24:50', payNo: 'PAY20261001008001', payMethod: 'alipay', discount: 0.00, amount: 21.75, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.73, promotion: false, discount: 0.00, paid: 21.75 }
  ] },
  { orderId: 'ORD20261001009', orderTime: '2026-10-01 17:51:50', payTime: '2026-10-01 17:53:58', payNo: 'PAY20261001009001', payMethod: 'mixed', discount: 0.00, amount: 43.87, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.75, promotion: false, discount: 0.00, paid: 13.97 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 }
  ] },
  { orderId: 'ORD20261001010', orderTime: '2026-10-01 20:31:37', payTime: '2026-10-01 20:34:22', payNo: 'PAY20261001010001', payMethod: 'mixed', discount: 0.00, amount: 57.08, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.13, promotion: false, discount: 0.00, paid: 57.08 }
  ] },
  { orderId: 'ORD20261002001', orderTime: '2026-10-02 07:21:38', payTime: '2026-10-02 07:24:30', payNo: 'PAY20261002001001', payMethod: 'wechat', discount: 20.22, amount: 109.45, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: true, discount: 10.94, paid: 78.76 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.53, promotion: true, discount: 9.28, paid: 30.69 }
  ] },
  { orderId: 'ORD20261002002', orderTime: '2026-10-02 08:12:15', payTime: '2026-10-02 08:15:06', payNo: 'PAY20261002002001', payMethod: 'alipay', discount: 11.48, amount: 103.44, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.00, promotion: false, discount: 0.00, paid: 4.58, refund: 2.98 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: true, discount: 6.38, paid: 23.22 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.27, promotion: false, discount: 0.00, paid: 60.84 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 5.10, paid: 14.80 }
  ] },
  { orderId: 'ORD20261002003', orderTime: '2026-10-02 08:47:02', payTime: '2026-10-02 08:48:41', payNo: 'PAY20261002003001', payMethod: 'card', discount: 2.09, amount: 7.88, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.67, promotion: true, discount: 0.27, paid: 2.60 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.55, promotion: true, discount: 1.82, paid: 5.28 }
  ] },
  { orderId: 'ORD20261002004', orderTime: '2026-10-02 09:09:44', payTime: '2026-10-02 09:12:13', payNo: 'PAY20261002004001', payMethod: 'alipay', discount: 0.00, amount: 27.25, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.23, promotion: false, discount: 0.00, paid: 19.43 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.98, promotion: false, discount: 0.00, paid: 7.82 }
  ] },
  { orderId: 'ORD20261002005', orderTime: '2026-10-02 12:12:12', payTime: '2026-10-02 12:12:39', payNo: 'PAY20261002005001', payMethod: 'alipay', discount: 0.00, amount: 57.22, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.66, promotion: false, discount: 0.00, paid: 7.10 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 42.90 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.45, promotion: false, discount: 0.00, paid: 7.22 }
  ] },
  { orderId: 'ORD20261002006', orderTime: '2026-10-02 12:50:44', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 15.73, status: '10', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.17, promotion: false, discount: 0.00, paid: 5.83 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 }
  ] },
  { orderId: 'ORD20261002007', orderTime: '2026-10-02 13:57:29', payTime: '2026-10-02 13:57:36', payNo: 'PAY20261002007001', payMethod: 'wechat', discount: 0.68, amount: 31.91, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.66, promotion: true, discount: 0.68, paid: 3.27 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.44, promotion: false, discount: 0.00, paid: 24.16 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.90, promotion: false, discount: 0.00, paid: 4.48 }
  ] },
  { orderId: 'ORD20261002008', orderTime: '2026-10-02 17:20:11', payTime: '2026-10-02 17:21:23', payNo: 'PAY20261002008001', payMethod: 'card', discount: 0.00, amount: 52.24, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 24.90 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.22, promotion: false, discount: 0.00, paid: 6.08 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.13, promotion: false, discount: 0.00, paid: 17.85 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.57, promotion: false, discount: 0.00, paid: 3.41 }
  ] },
  { orderId: 'ORD20261002009', orderTime: '2026-10-02 18:11:56', payTime: '2026-10-02 18:15:13', payNo: 'PAY20261002009001', payMethod: 'wechat', discount: 0.00, amount: 27.88, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.31, promotion: false, discount: 0.00, paid: 20.70, refundPrev: 10.35 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.20, promotion: false, discount: 0.00, paid: 7.18 }
  ] },
  { orderId: 'ORD20261002010', orderTime: '2026-10-02 21:41:45', payTime: '2026-10-02 21:42:06', payNo: 'PAY20261002010001', payMethod: 'wechat', discount: 0.00, amount: 67.38, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.25, promotion: false, discount: 0.00, paid: 7.48 }
  ] },
  { orderId: 'ORD20261003001', orderTime: '2026-10-03 07:07:16', payTime: '2026-10-03 07:08:34', payNo: 'PAY20261003001001', payMethod: 'wechat', discount: 0.00, amount: 6.18, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.35, promotion: false, discount: 0.00, paid: 6.18 }
  ] },
  { orderId: 'ORD20261003002', orderTime: '2026-10-03 07:10:00', payTime: '2026-10-03 07:11:55', payNo: 'PAY20261003002001', payMethod: 'wechat', discount: 0.00, amount: 29.90, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 }
  ] },
  { orderId: 'ORD20261003003', orderTime: '2026-10-03 07:18:50', payTime: '2026-10-03 07:18:54', payNo: 'PAY20261003003001', payMethod: 'wechat', discount: 0.00, amount: 13.04, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.18, promotion: false, discount: 0.00, paid: 13.04 }
  ] },
  { orderId: 'ORD20261003004', orderTime: '2026-10-03 08:16:19', payTime: '2026-10-03 08:17:32', payNo: 'PAY20261003004001', payMethod: 'cash', discount: 0.00, amount: 105.77, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 32.00 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.01, promotion: false, discount: 0.00, paid: 53.87 }
  ] },
  { orderId: 'ORD20261003005', orderTime: '2026-10-03 08:45:43', payTime: '2026-10-03 08:47:08', payNo: 'PAY20261003005001', payMethod: 'card', discount: 0.00, amount: 10.26, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 2.06, promotion: false, discount: 0.00, paid: 10.26 }
  ] },
  { orderId: 'ORD20261003006', orderTime: '2026-10-03 09:15:20', payTime: '2026-10-03 09:16:18', payNo: 'PAY20261003006001', payMethod: 'card', discount: 5.93, amount: 31.18, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.30, promotion: true, discount: 4.44, paid: 16.10 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.53, promotion: true, discount: 1.49, paid: 10.10 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.67, promotion: false, discount: 0.00, paid: 4.98 }
  ] },
  { orderId: 'ORD20261003007', orderTime: '2026-10-03 09:48:02', payTime: '2026-10-03 09:50:49', payNo: 'PAY20261003007001', payMethod: 'cash', discount: 0.00, amount: 44.52, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.03, promotion: false, discount: 0.00, paid: 32.07 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.56, promotion: false, discount: 0.00, paid: 12.45 }
  ] },
  { orderId: 'ORD20261003008', orderTime: '2026-10-03 10:00:36', payTime: '2026-10-03 10:03:35', payNo: 'PAY20261003008001', payMethod: 'wechat', discount: 8.22, amount: 56.58, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 8.22, paid: 31.58 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20261003009', orderTime: '2026-10-03 10:16:41', payTime: '2026-10-03 10:18:39', payNo: 'PAY20261003009001', payMethod: 'wechat', discount: 0.00, amount: 22.00, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.87, promotion: false, discount: 0.00, paid: 5.20 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 16.80 }
  ] },
  { orderId: 'ORD20261003010', orderTime: '2026-10-03 10:35:44', payTime: '2026-10-03 10:36:09', payNo: 'PAY20261003010001', payMethod: 'alipay', discount: 0.47, amount: 141.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.40, promotion: true, discount: 0.47, paid: 3.70 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 51.60 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 }
  ] },
  { orderId: 'ORD20261003011', orderTime: '2026-10-03 10:46:09', payTime: '2026-10-03 10:46:45', payNo: 'PAY20261003011001', payMethod: 'cash', discount: 13.37, amount: 89.23, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: true, discount: 6.88, paid: 52.82, refund: 45.43 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 2.41, promotion: true, discount: 6.49, paid: 36.41 }
  ] },
  { orderId: 'ORD20261003012', orderTime: '2026-10-03 11:09:55', payTime: '2026-10-03 11:12:15', payNo: 'PAY20261003012001', payMethod: 'wechat', discount: 0.00, amount: 67.94, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.28, promotion: false, discount: 0.00, paid: 67.94 }
  ] },
  { orderId: 'ORD20261003013', orderTime: '2026-10-03 11:20:14', payTime: '2026-10-03 11:21:47', payNo: 'PAY20261003013001', payMethod: 'card', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20261003014', orderTime: '2026-10-03 11:35:02', payTime: '2026-10-03 11:37:55', payNo: 'PAY20261003014001', payMethod: 'cash', discount: 0.00, amount: 14.19, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.55, promotion: false, discount: 0.00, paid: 6.63 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.65, promotion: false, discount: 0.00, paid: 7.56 }
  ] },
  { orderId: 'ORD20261003015', orderTime: '2026-10-03 11:53:05', payTime: '2026-10-03 11:53:37', payNo: 'PAY20261003015001', payMethod: 'cash', discount: 0.00, amount: 51.46, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 45.00 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.41, promotion: false, discount: 0.00, paid: 6.46 }
  ] },
  { orderId: 'ORD20261003016', orderTime: '2026-10-03 12:14:21', payTime: '2026-10-03 12:14:27', payNo: 'PAY20261003016001', payMethod: 'cash', discount: 4.31, amount: 52.63, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 4.31, paid: 35.49 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.72, promotion: false, discount: 0.00, paid: 17.14 }
  ] },
  { orderId: 'ORD20261003017', orderTime: '2026-10-03 12:49:57', payTime: '2026-10-03 12:52:43', payNo: 'PAY20261003017001', payMethod: 'wechat', discount: 0.00, amount: 73.31, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.89, promotion: false, discount: 0.00, paid: 4.43 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.57, promotion: false, discount: 0.00, paid: 68.88 }
  ] },
  { orderId: 'ORD20261003018', orderTime: '2026-10-03 15:26:39', payTime: '2026-10-03 15:29:59', payNo: 'PAY20261003018001', payMethod: 'wechat', discount: 0.00, amount: 61.20, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20261003019', orderTime: '2026-10-03 17:15:55', payTime: '2026-10-03 17:19:07', payNo: 'PAY20261003019001', payMethod: 'cash', discount: 0.00, amount: 91.31, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.87, promotion: false, discount: 0.00, paid: 74.61 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.95, promotion: false, discount: 0.00, paid: 2.83 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.32, promotion: false, discount: 0.00, paid: 13.87 }
  ] },
  { orderId: 'ORD20261003020', orderTime: '2026-10-03 17:56:53', payTime: '2026-10-03 17:59:40', payNo: 'PAY20261003020001', payMethod: 'alipay', discount: 3.20, amount: 99.68, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.14, promotion: true, discount: 3.20, paid: 13.88 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 85.80 }
  ] },
  { orderId: 'ORD20261003021', orderTime: '2026-10-03 18:20:18', payTime: '2026-10-03 18:22:02', payNo: 'PAY20261003021001', payMethod: 'wechat', discount: 0.00, amount: 62.36, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.36, promotion: false, discount: 0.00, paid: 10.81 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.35, promotion: false, discount: 0.00, paid: 14.05 }
  ] },
  { orderId: 'ORD20261003022', orderTime: '2026-10-03 18:34:00', payTime: '', payNo: '', payMethod: '', discount: 1.02, amount: 52.41, status: '20', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 45.00 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.84, promotion: true, discount: 1.02, paid: 7.41 }
  ] },
  { orderId: 'ORD20261003023', orderTime: '2026-10-03 18:35:54', payTime: '2026-10-03 18:38:45', payNo: 'PAY20261003023001', payMethod: 'card', discount: 7.44, amount: 44.83, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.47, promotion: false, discount: 0.00, paid: 14.77 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: true, discount: 7.44, paid: 30.06 }
  ] },
  { orderId: 'ORD20261003024', orderTime: '2026-10-03 19:18:21', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 47.12, status: '10', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.98, promotion: false, discount: 0.00, paid: 47.12 }
  ] },
  { orderId: 'ORD20261003025', orderTime: '2026-10-03 20:34:43', payTime: '', payNo: '', payMethod: '', discount: 10.76, amount: 124.92, status: '20', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 2, weight: 0.00, promotion: true, discount: 9.03, paid: 42.57 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 35.40 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: true, discount: 1.73, paid: 10.77 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.29, promotion: false, discount: 0.00, paid: 36.18 }
  ] },
  { orderId: 'ORD20261004001', orderTime: '2026-10-04 07:43:29', payTime: '2026-10-04 07:45:56', payNo: 'PAY20261004001001', payMethod: 'wechat', discount: 9.69, amount: 157.17, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.53, promotion: true, discount: 9.69, paid: 35.90 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.68, promotion: false, discount: 0.00, paid: 4.07 }
  ] },
  { orderId: 'ORD20261004002', orderTime: '2026-10-04 08:02:38', payTime: '2026-10-04 08:02:45', payNo: 'PAY20261004002001', payMethod: 'wechat', discount: 0.00, amount: 60.69, status: '40', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.04, promotion: false, discount: 0.00, paid: 30.99 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 29.70 }
  ] },
  { orderId: 'ORD20261004003', orderTime: '2026-10-04 08:03:44', payTime: '2026-10-04 08:06:11', payNo: 'PAY20261004003001', payMethod: 'wechat', discount: 5.44, amount: 38.62, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.61, promotion: false, discount: 0.00, paid: 2.79 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.54, promotion: true, discount: 5.44, paid: 35.83 }
  ] },
  { orderId: 'ORD20261004004', orderTime: '2026-10-04 08:15:58', payTime: '2026-10-04 08:17:54', payNo: 'PAY20261004004001', payMethod: 'wechat', discount: 0.00, amount: 24.75, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.04, promotion: false, discount: 0.00, paid: 24.75, refundPrev: 12.38 }
  ] },
  { orderId: 'ORD20261004005', orderTime: '2026-10-04 08:56:56', payTime: '2026-10-04 09:00:10', payNo: 'PAY20261004005001', payMethod: 'alipay', discount: 0.00, amount: 64.34, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 2.03, promotion: false, discount: 0.00, paid: 60.49 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.84, promotion: false, discount: 0.00, paid: 3.85 }
  ] },
  { orderId: 'ORD20261004006', orderTime: '2026-10-04 09:41:27', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 19.28, status: '50', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.00, promotion: false, discount: 0.00, paid: 4.28 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 }
  ] },
  { orderId: 'ORD20261004007', orderTime: '2026-10-04 09:59:07', payTime: '2026-10-04 09:59:41', payNo: 'PAY20261004007001', payMethod: 'card', discount: 4.77, amount: 94.73, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 4.77, paid: 35.03 }
  ] },
  { orderId: 'ORD20261004008', orderTime: '2026-10-04 10:19:14', payTime: '2026-10-04 10:21:29', payNo: 'PAY20261004008001', payMethod: 'cash', discount: 0.00, amount: 64.00, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 }
  ] },
  { orderId: 'ORD20261004009', orderTime: '2026-10-04 11:19:08', payTime: '2026-10-04 11:20:03', payNo: 'PAY20261004009001', payMethod: 'alipay', discount: 1.97, amount: 127.54, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 2, weight: 0.00, promotion: true, discount: 1.97, paid: 15.63, refund: 15.63 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.45, promotion: false, discount: 0.00, paid: 34.51 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40 }
  ] },
  { orderId: 'ORD20261004010', orderTime: '2026-10-04 11:31:33', payTime: '2026-10-04 11:34:11', payNo: 'PAY20261004010001', payMethod: 'wechat', discount: 0.00, amount: 62.20, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 50.40 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 }
  ] },
  { orderId: 'ORD20261004011', orderTime: '2026-10-04 11:43:29', payTime: '2026-10-04 11:46:15', payNo: 'PAY20261004011001', payMethod: 'wechat', discount: 0.00, amount: 56.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 32.00 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.72, promotion: false, discount: 0.00, paid: 7.36 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.21, promotion: false, discount: 0.00, paid: 5.54 }
  ] },
  { orderId: 'ORD20261004012', orderTime: '2026-10-04 12:38:42', payTime: '2026-10-04 12:41:58', payNo: 'PAY20261004012001', payMethod: 'alipay', discount: 0.00, amount: 48.07, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.72, promotion: false, discount: 0.00, paid: 2.15 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 2.58, promotion: false, discount: 0.00, paid: 45.92 }
  ] },
  { orderId: 'ORD20261004013', orderTime: '2026-10-04 12:44:08', payTime: '', payNo: '', payMethod: '', discount: 0.33, amount: 80.12, status: '10', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.51, promotion: true, discount: 0.33, paid: 2.72 }
  ] },
  { orderId: 'ORD20261004014', orderTime: '2026-10-04 14:23:09', payTime: '2026-10-04 14:25:23', payNo: 'PAY20261004014001', payMethod: 'wechat', discount: 0.00, amount: 86.29, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.05, promotion: false, discount: 0.00, paid: 48.79 }
  ] },
  { orderId: 'ORD20261004015', orderTime: '2026-10-04 14:34:22', payTime: '2026-10-04 14:36:02', payNo: 'PAY20261004015001', payMethod: 'wechat', discount: 0.00, amount: 96.43, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.68, promotion: false, discount: 0.00, paid: 6.73 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 }
  ] },
  { orderId: 'ORD20261004016', orderTime: '2026-10-04 15:16:03', payTime: '2026-10-04 15:17:16', payNo: 'PAY20261004016001', payMethod: 'cash', discount: 0.00, amount: 34.69, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.39, promotion: false, discount: 0.00, paid: 11.09 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 }
  ] },
  { orderId: 'ORD20261004017', orderTime: '2026-10-04 17:08:52', payTime: '2026-10-04 17:09:51', payNo: 'PAY20261004017001', payMethod: 'wechat', discount: 7.72, amount: 45.28, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: true, discount: 7.72, paid: 37.28 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.87, promotion: false, discount: 0.00, paid: 8.00 }
  ] },
  { orderId: 'ORD20261004018', orderTime: '2026-10-04 17:13:29', payTime: '2026-10-04 17:16:47', payNo: 'PAY20261004018001', payMethod: 'wechat', discount: 0.37, amount: 13.31, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.44, promotion: false, discount: 0.00, paid: 11.18 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.84, promotion: true, discount: 0.37, paid: 2.13 }
  ] },
  { orderId: 'ORD20261004019', orderTime: '2026-10-04 17:55:58', payTime: '', payNo: '', payMethod: '', discount: 9.47, amount: 30.33, status: '20', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 9.47, paid: 30.33 }
  ] },
  { orderId: 'ORD20261004020', orderTime: '2026-10-04 18:04:33', payTime: '2026-10-04 18:05:55', payNo: 'PAY20261004020001', payMethod: 'mixed', discount: 0.00, amount: 30.00, status: '40', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 }
  ] },
  { orderId: 'ORD20261004021', orderTime: '2026-10-04 18:14:36', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 150.19, status: '10', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.14, promotion: false, discount: 0.00, paid: 20.29 }
  ] },
  { orderId: 'ORD20261004022', orderTime: '2026-10-04 18:21:32', payTime: '2026-10-04 18:22:50', payNo: 'PAY20261004022001', payMethod: 'alipay', discount: 0.00, amount: 11.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 }
  ] },
  { orderId: 'ORD20261004023', orderTime: '2026-10-04 18:26:04', payTime: '2026-10-04 18:26:42', payNo: 'PAY20261004023001', payMethod: 'mixed', discount: 0.00, amount: 182.06, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.42, promotion: false, discount: 0.00, paid: 10.00 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.44, promotion: false, discount: 0.00, paid: 97.36 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 }
  ] },
  { orderId: 'ORD20261004024', orderTime: '2026-10-04 18:27:11', payTime: '2026-10-04 18:27:25', payNo: 'PAY20261004024001', payMethod: 'cash', discount: 0.00, amount: 74.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 }
  ] },
  { orderId: 'ORD20261004025', orderTime: '2026-10-04 18:29:24', payTime: '2026-10-04 18:31:41', payNo: 'PAY20261004025001', payMethod: 'cash', discount: 2.25, amount: 9.55, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: true, discount: 2.25, paid: 9.55 }
  ] },
  { orderId: 'ORD20261004026', orderTime: '2026-10-04 18:47:17', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 18.80, status: '50', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.79, promotion: false, discount: 0.00, paid: 18.80 }
  ] },
  { orderId: 'ORD20261004027', orderTime: '2026-10-04 19:24:25', payTime: '', payNo: '', payMethod: '', discount: 7.33, amount: 79.47, status: '50', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: true, discount: 3.63, paid: 19.97 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.17, promotion: true, discount: 3.70, paid: 9.28 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.11, promotion: false, discount: 0.00, paid: 50.22 }
  ] },
  { orderId: 'ORD20261004028', orderTime: '2026-10-04 19:42:23', payTime: '2026-10-04 19:45:21', payNo: 'PAY20261004028001', payMethod: 'alipay', discount: 0.00, amount: 90.66, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.78, promotion: false, discount: 0.00, paid: 71.02 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.96, promotion: false, discount: 0.00, paid: 4.40 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.91, promotion: false, discount: 0.00, paid: 15.24 }
  ] },
  { orderId: 'ORD20261004029', orderTime: '2026-10-04 20:00:53', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 33.60, status: '10', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 33.60 }
  ] },
  { orderId: 'ORD20261004030', orderTime: '2026-10-04 20:09:04', payTime: '2026-10-04 20:12:16', payNo: 'PAY20261004030001', payMethod: 'alipay', discount: 0.00, amount: 137.87, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.74, promotion: false, discount: 0.00, paid: 7.97 }
  ] },
  { orderId: 'ORD20261005001', orderTime: '2026-10-05 07:19:34', payTime: '2026-10-05 07:21:44', payNo: 'PAY20261005001001', payMethod: 'wechat', discount: 0.00, amount: 34.68, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.42, promotion: false, discount: 0.00, paid: 11.08 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 }
  ] },
  { orderId: 'ORD20261005002', orderTime: '2026-10-05 07:55:12', payTime: '2026-10-05 07:58:00', payNo: 'PAY20261005002001', payMethod: 'wechat', discount: 0.00, amount: 39.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20261005003', orderTime: '2026-10-05 08:27:50', payTime: '2026-10-05 08:30:37', payNo: 'PAY20261005003001', payMethod: 'alipay', discount: 11.11, amount: 42.18, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.45, promotion: true, discount: 0.61, paid: 2.98 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 10.50, paid: 29.30 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 9.90 }
  ] },
  { orderId: 'ORD20261005004', orderTime: '2026-10-05 08:39:43', payTime: '2026-10-05 08:41:09', payNo: 'PAY20261005004001', payMethod: 'cash', discount: 0.00, amount: 148.60, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90, refund: 16.42 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 128.70 }
  ] },
  { orderId: 'ORD20261005005', orderTime: '2026-10-05 10:14:36', payTime: '2026-10-05 10:17:35', payNo: 'PAY20261005005001', payMethod: 'cash', discount: 0.00, amount: 128.70, status: '40', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 128.70 }
  ] },
  { orderId: 'ORD20261005006', orderTime: '2026-10-05 11:44:48', payTime: '2026-10-05 11:46:33', payNo: 'PAY20261005006001', payMethod: 'mixed', discount: 0.00, amount: 20.80, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.55, promotion: false, discount: 0.00, paid: 7.72 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.03, promotion: false, discount: 0.00, paid: 6.05 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.71, promotion: false, discount: 0.00, paid: 7.03 }
  ] },
  { orderId: 'ORD20261005007', orderTime: '2026-10-05 12:00:14', payTime: '', payNo: '', payMethod: '', discount: 7.20, amount: 43.96, status: '50', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.90, promotion: false, discount: 0.00, paid: 11.36 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 7.20, paid: 32.60 }
  ] },
  { orderId: 'ORD20261005008', orderTime: '2026-10-05 12:10:11', payTime: '2026-10-05 12:13:02', payNo: 'PAY20261005008001', payMethod: 'alipay', discount: 5.64, amount: 85.95, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.34, promotion: true, discount: 5.64, paid: 26.25 }
  ] },
  { orderId: 'ORD20261005009', orderTime: '2026-10-05 13:17:08', payTime: '2026-10-05 13:18:10', payNo: 'PAY20261005009001', payMethod: 'card', discount: 0.83, amount: 59.42, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.47, promotion: true, discount: 0.83, paid: 7.96 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.92, promotion: false, discount: 0.00, paid: 51.46 }
  ] },
  { orderId: 'ORD20261005010', orderTime: '2026-10-05 15:18:19', payTime: '2026-10-05 15:20:53', payNo: 'PAY20261005010001', payMethod: 'card', discount: 7.14, amount: 91.64, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.28, promotion: false, discount: 0.00, paid: 22.57, refundPrev: 14.67 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.91, promotion: true, discount: 7.14, paid: 69.07 }
  ] },
  { orderId: 'ORD20261005011', orderTime: '2026-10-05 15:40:46', payTime: '2026-10-05 15:41:52', payNo: 'PAY20261005011001', payMethod: 'card', discount: 0.00, amount: 123.49, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.03, promotion: false, discount: 0.00, paid: 8.69 },
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 89.90 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 24.90 }
  ] },
  { orderId: 'ORD20261005012', orderTime: '2026-10-05 17:25:34', payTime: '2026-10-05 17:26:07', payNo: 'PAY20261005012001', payMethod: 'wechat', discount: 17.33, amount: 160.32, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.50, promotion: false, discount: 0.00, paid: 8.97 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 2, weight: 0.00, promotion: true, discount: 13.14, paid: 46.66 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.23, promotion: false, discount: 0.00, paid: 88.98 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 4.19, paid: 15.71 }
  ] },
  { orderId: 'ORD20261005013', orderTime: '2026-10-05 18:32:48', payTime: '2026-10-05 18:35:31', payNo: 'PAY20261005013001', payMethod: 'alipay', discount: 0.00, amount: 43.78, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.01, promotion: false, discount: 0.00, paid: 17.98 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20261005014', orderTime: '2026-10-05 18:52:59', payTime: '2026-10-05 18:54:06', payNo: 'PAY20261005014001', payMethod: 'cash', discount: 0.00, amount: 63.04, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.58, promotion: false, discount: 0.00, paid: 63.04 }
  ] },
  { orderId: 'ORD20261005015', orderTime: '2026-10-05 19:37:06', payTime: '2026-10-05 19:39:03', payNo: 'PAY20261005015001', payMethod: 'card', discount: 0.00, amount: 48.71, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.90, promotion: false, discount: 0.00, paid: 8.91 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20261005016', orderTime: '2026-10-05 21:47:45', payTime: '2026-10-05 21:49:17', payNo: 'PAY20261005016001', payMethod: 'wechat', discount: 0.00, amount: 40.89, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.89, promotion: false, discount: 0.00, paid: 15.08 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.45, promotion: false, discount: 0.00, paid: 25.81 }
  ] },
  { orderId: 'ORD20261006001', orderTime: '2026-10-06 07:40:24', payTime: '2026-10-06 07:41:04', payNo: 'PAY20261006001001', payMethod: 'wechat', discount: 0.00, amount: 117.21, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.34, promotion: false, discount: 0.00, paid: 53.47 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.52, promotion: false, discount: 0.00, paid: 13.94 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 49.80 }
  ] },
  { orderId: 'ORD20261006002', orderTime: '2026-10-06 09:20:08', payTime: '2026-10-06 09:21:05', payNo: 'PAY20261006002001', payMethod: 'alipay', discount: 0.00, amount: 23.36, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.36, promotion: false, discount: 0.00, paid: 23.36 }
  ] },
  { orderId: 'ORD20261006003', orderTime: '2026-10-06 11:31:09', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 8.95, status: '20', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.83, promotion: false, discount: 0.00, paid: 2.47 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.41, promotion: false, discount: 0.00, paid: 6.48 }
  ] },
  { orderId: 'ORD20261006004', orderTime: '2026-10-06 13:28:19', payTime: '2026-10-06 13:28:48', payNo: 'PAY20261006004001', payMethod: 'alipay', discount: 9.12, amount: 34.67, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.84, promotion: true, discount: 9.12, paid: 34.67 }
  ] },
  { orderId: 'ORD20261006005', orderTime: '2026-10-06 13:56:08', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 3.78, status: '10', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.27, promotion: false, discount: 0.00, paid: 3.78 }
  ] },
  { orderId: 'ORD20261006006', orderTime: '2026-10-06 14:26:25', payTime: '2026-10-06 14:28:57', payNo: 'PAY20261006006001', payMethod: 'cash', discount: 3.41, amount: 41.75, status: '40', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: true, discount: 3.41, paid: 11.59 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.22, promotion: false, discount: 0.00, paid: 13.28 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.63, promotion: false, discount: 0.00, paid: 16.88 }
  ] },
  { orderId: 'ORD20261006007', orderTime: '2026-10-06 15:02:44', payTime: '', payNo: '', payMethod: '', discount: 1.87, amount: 50.93, status: '50', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 1, weight: 0.00, promotion: true, discount: 1.87, paid: 8.03 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 42.90 }
  ] },
  { orderId: 'ORD20261006008', orderTime: '2026-10-06 15:02:48', payTime: '2026-10-06 15:03:36', payNo: 'PAY20261006008001', payMethod: 'card', discount: 0.00, amount: 13.00, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.05, promotion: false, discount: 0.00, paid: 8.77 },
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.85, promotion: false, discount: 0.00, paid: 4.23 }
  ] },
  { orderId: 'ORD20261006009', orderTime: '2026-10-06 15:11:05', payTime: '2026-10-06 15:13:25', payNo: 'PAY20261006009001', payMethod: 'wechat', discount: 5.96, amount: 152.68, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: true, discount: 5.96, paid: 17.64 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.86, promotion: false, discount: 0.00, paid: 5.14 },
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 }
  ] },
  { orderId: 'ORD20261006010', orderTime: '2026-10-06 15:48:23', payTime: '2026-10-06 15:49:07', payNo: 'PAY20261006010001', payMethod: 'cash', discount: 2.66, amount: 20.94, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: true, discount: 2.66, paid: 20.94 }
  ] },
  { orderId: 'ORD20261006011', orderTime: '2026-10-06 17:36:21', payTime: '2026-10-06 17:38:41', payNo: 'PAY20261006011001', payMethod: 'alipay', discount: 1.28, amount: 130.33, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.54, promotion: true, discount: 1.28, paid: 3.03 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 11.80 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20261006012', orderTime: '2026-10-06 17:38:01', payTime: '2026-10-06 17:40:41', payNo: 'PAY20261006012001', payMethod: 'cash', discount: 0.00, amount: 31.92, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 0.80, promotion: false, discount: 0.00, paid: 31.92, refund: 20.43 }
  ] },
  { orderId: 'ORD20261006013', orderTime: '2026-10-06 18:05:18', payTime: '2026-10-06 18:05:44', payNo: 'PAY20261006013001', payMethod: 'alipay', discount: 0.73, amount: 2.74, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.58, promotion: true, discount: 0.73, paid: 2.74 }
  ] },
  { orderId: 'ORD20261006014', orderTime: '2026-10-06 18:37:05', payTime: '2026-10-06 18:38:55', payNo: 'PAY20261006014001', payMethod: 'wechat', discount: 0.00, amount: 89.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 }
  ] },
  { orderId: 'ORD20261007001', orderTime: '2026-10-07 07:06:34', payTime: '2026-10-07 07:07:40', payNo: 'PAY20261007001001', payMethod: 'alipay', discount: 16.01, amount: 123.99, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: true, discount: 16.01, paid: 43.69 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 50.40 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 }
  ] },
  { orderId: 'ORD20261007002', orderTime: '2026-10-07 09:09:48', payTime: '', payNo: '', payMethod: '', discount: 3.63, amount: 139.50, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.35, promotion: false, discount: 0.00, paid: 8.07 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 3.63, paid: 36.17 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.39, promotion: false, discount: 0.00, paid: 55.46 }
  ] },
  { orderId: 'ORD20261007003', orderTime: '2026-10-07 09:11:05', payTime: '2026-10-07 09:14:26', payNo: 'PAY20261007003001', payMethod: 'wechat', discount: 5.08, amount: 24.47, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.66, promotion: true, discount: 5.08, paid: 24.47 }
  ] },
  { orderId: 'ORD20261007004', orderTime: '2026-10-07 10:19:55', payTime: '2026-10-07 10:21:40', payNo: 'PAY20261007004001', payMethod: 'alipay', discount: 30.82, amount: 129.45, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '个人客户', items: [
    { code: '6901234500202', name: '帮宝适纸尿裤M码', spec: '54片/包', price: 109.00, qty: 1, weight: 0.00, promotion: true, discount: 30.82, paid: 78.18 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.97, promotion: false, discount: 0.00, paid: 4.15 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.98, promotion: false, discount: 0.00, paid: 47.12 }
  ] },
  { orderId: 'ORD20261007005', orderTime: '2026-10-07 10:55:18', payTime: '2026-10-07 10:55:48', payNo: 'PAY20261007005001', payMethod: 'alipay', discount: 0.00, amount: 33.60, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '个人客户', items: [
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 33.60 }
  ] },
  { orderId: 'ORD20261007006', orderTime: '2026-10-07 11:13:25', payTime: '2026-10-07 11:13:37', payNo: 'PAY20261007006001', payMethod: 'wechat', discount: 0.00, amount: 26.94, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.29, promotion: false, discount: 0.00, paid: 20.38 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 2.20, promotion: false, discount: 0.00, paid: 6.56 }
  ] },
  { orderId: 'ORD20261007007', orderTime: '2026-10-07 11:51:54', payTime: '2026-10-07 11:54:12', payNo: 'PAY20261007007001', payMethod: 'wechat', discount: 1.39, amount: 8.62, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 2.01, promotion: true, discount: 1.39, paid: 8.62 }
  ] },
  { orderId: 'ORD20261007008', orderTime: '2026-10-07 12:09:45', payTime: '2026-10-07 12:11:54', payNo: 'PAY20261007008001', payMethod: 'wechat', discount: 0.00, amount: 74.10, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 44.40 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 29.70 }
  ] },
  { orderId: 'ORD20261007009', orderTime: '2026-10-07 14:08:53', payTime: '2026-10-07 14:12:10', payNo: 'PAY20261007009001', payMethod: 'wechat', discount: 0.00, amount: 159.40, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20261007010', orderTime: '2026-10-07 15:19:16', payTime: '2026-10-07 15:20:23', payNo: 'PAY20261007010001', payMethod: 'cash', discount: 0.00, amount: 69.60, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 49.80 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 19.80 }
  ] },
  { orderId: 'ORD20261007011', orderTime: '2026-10-07 16:06:14', payTime: '', payNo: '', payMethod: '', discount: 1.64, amount: 23.29, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.48, promotion: false, discount: 0.00, paid: 14.83 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.02, promotion: true, discount: 1.64, paid: 8.46 }
  ] },
  { orderId: 'ORD20261007012', orderTime: '2026-10-07 17:13:48', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 21.21, status: '50', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.51, promotion: false, discount: 0.00, paid: 9.03 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.23, promotion: false, discount: 0.00, paid: 12.18 }
  ] },
  { orderId: 'ORD20261007013', orderTime: '2026-10-07 18:24:43', payTime: '2026-10-07 18:25:15', payNo: 'PAY20261007013001', payMethod: 'alipay', discount: 4.93, amount: 20.11, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.80, promotion: false, discount: 0.00, paid: 8.24 },
    { code: '6901234500123', name: '速冻水饺', spec: '1kg/袋', price: 16.80, qty: 1, weight: 0.00, promotion: true, discount: 4.93, paid: 11.87, refundPrev: 6.41 }
  ] },
  { orderId: 'ORD20261007014', orderTime: '2026-10-07 18:37:59', payTime: '2026-10-07 18:41:08', payNo: 'PAY20261007014001', payMethod: 'wechat', discount: 0.00, amount: 29.32, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.49, promotion: false, discount: 0.00, paid: 7.74 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.18, promotion: false, discount: 0.00, paid: 21.58 }
  ] },
  { orderId: 'ORD20261007015', orderTime: '2026-10-07 18:44:27', payTime: '2026-10-07 18:46:47', payNo: 'PAY20261007015001', payMethod: 'wechat', discount: 0.00, amount: 35.44, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.88, promotion: false, discount: 0.00, paid: 13.90 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 8.80 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 2.13, promotion: false, discount: 0.00, paid: 12.74 }
  ] },
  { orderId: 'ORD20261007016', orderTime: '2026-10-07 18:49:42', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 79.40, status: '50', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 49.80 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 29.60 }
  ] },
  { orderId: 'ORD20261007017', orderTime: '2026-10-07 19:28:34', payTime: '2026-10-07 19:28:52', payNo: 'PAY20261007017001', payMethod: 'wechat', discount: 3.12, amount: 69.78, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 37.50 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 3, weight: 0.00, promotion: true, discount: 3.12, paid: 32.28 }
  ] },
  { orderId: 'ORD20261007018', orderTime: '2026-10-07 20:01:04', payTime: '2026-10-07 20:02:22', payNo: 'PAY20261007018001', payMethod: 'wechat', discount: 2.27, amount: 37.74, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 0.87, promotion: true, discount: 2.27, paid: 21.05 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 0.56, promotion: false, discount: 0.00, paid: 16.69 }
  ] },
  { orderId: 'ORD20261007019', orderTime: '2026-10-07 20:06:11', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 41.85, status: '50', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.75, promotion: false, discount: 0.00, paid: 11.85 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 }
  ] },
  { orderId: 'ORD20261007020', orderTime: '2026-10-07 20:14:13', payTime: '2026-10-07 20:14:33', payNo: 'PAY20261007020001', payMethod: 'alipay', discount: 0.00, amount: 8.79, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.92, promotion: false, discount: 0.00, paid: 8.79 }
  ] },
  { orderId: 'ORD20261007021', orderTime: '2026-10-07 21:23:39', payTime: '2026-10-07 21:26:20', payNo: 'PAY20261007021001', payMethod: 'alipay', discount: 6.00, amount: 65.79, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.62, promotion: false, discount: 0.00, paid: 25.60, refund: 21.76 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.55, promotion: true, discount: 6.00, paid: 40.19 }
  ] },
  { orderId: 'ORD20261008001', orderTime: '2026-10-08 08:48:24', payTime: '2026-10-08 08:51:22', payNo: 'PAY20261008001001', payMethod: 'wechat', discount: 11.09, amount: 52.91, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: true, discount: 11.09, paid: 52.91 }
  ] },
  { orderId: 'ORD20261008002', orderTime: '2026-10-08 09:27:19', payTime: '2026-10-08 09:30:26', payNo: 'PAY20261008002001', payMethod: 'wechat', discount: 0.00, amount: 75.45, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.50, promotion: false, discount: 0.00, paid: 11.45 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 }
  ] },
  { orderId: 'ORD20261008003', orderTime: '2026-10-08 10:43:54', payTime: '2026-10-08 10:45:31', payNo: 'PAY20261008003001', payMethod: 'wechat', discount: 0.00, amount: 103.12, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 0.53, promotion: false, discount: 0.00, paid: 2.64 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.83, promotion: false, discount: 0.00, paid: 3.55 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.68, promotion: false, discount: 0.00, paid: 67.03 }
  ] },
  { orderId: 'ORD20261008004', orderTime: '2026-10-08 19:09:23', payTime: '2026-10-08 19:10:02', payNo: 'PAY20261008004001', payMethod: 'wechat', discount: 0.00, amount: 157.62, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.32, promotion: false, discount: 0.00, paid: 55.22 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20261008005', orderTime: '2026-10-08 20:09:52', payTime: '2026-10-08 20:11:01', payNo: 'PAY20261008005001', payMethod: 'alipay', discount: 27.09, amount: 152.47, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: true, discount: 24.24, paid: 105.66 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.85, promotion: true, discount: 2.85, paid: 8.21 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 }
  ] },
  { orderId: 'ORD20261008006', orderTime: '2026-10-08 21:08:17', payTime: '2026-10-08 21:11:25', payNo: 'PAY20261008006001', payMethod: 'wechat', discount: 0.00, amount: 85.80, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 85.80 }
  ] },
  { orderId: 'ORD20261009001', orderTime: '2026-10-09 08:00:29', payTime: '2026-10-09 08:00:46', payNo: 'PAY20261009001001', payMethod: 'wechat', discount: 18.20, amount: 66.12, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: true, discount: 18.20, paid: 59.20 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.51, promotion: false, discount: 0.00, paid: 6.92 }
  ] },
  { orderId: 'ORD20261009002', orderTime: '2026-10-09 08:03:36', payTime: '2026-10-09 08:05:02', payNo: 'PAY20261009002001', payMethod: 'wechat', discount: 0.00, amount: 40.43, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 1.85, promotion: false, discount: 0.00, paid: 32.93 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.94, promotion: false, discount: 0.00, paid: 7.50 }
  ] },
  { orderId: 'ORD20261009003', orderTime: '2026-10-09 08:32:45', payTime: '2026-10-09 08:33:56', payNo: 'PAY20261009003001', payMethod: 'wechat', discount: 0.00, amount: 162.58, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '个人客户', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.08, promotion: false, discount: 0.00, paid: 8.62 },
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 44.40 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.37, promotion: false, discount: 0.00, paid: 13.56 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 96.00 }
  ] },
  { orderId: 'ORD20261009004', orderTime: '2026-10-09 09:38:25', payTime: '2026-10-09 09:39:47', payNo: 'PAY20261009004001', payMethod: 'alipay', discount: 0.00, amount: 60.00, status: '40', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 29.90 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.03, promotion: false, discount: 0.00, paid: 10.20 }
  ] },
  { orderId: 'ORD20261009005', orderTime: '2026-10-09 09:38:31', payTime: '2026-10-09 09:39:23', payNo: 'PAY20261009005001', payMethod: 'alipay', discount: 4.23, amount: 96.54, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 2.27, promotion: true, discount: 4.23, paid: 13.88 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 77.40 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.88, promotion: false, discount: 0.00, paid: 5.26 }
  ] },
  { orderId: 'ORD20261009006', orderTime: '2026-10-09 10:34:50', payTime: '2026-10-09 10:35:41', payNo: 'PAY20261009006001', payMethod: 'card', discount: 6.02, amount: 20.22, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.19, promotion: true, discount: 1.19, paid: 4.26 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.10, promotion: true, discount: 4.83, paid: 15.96 }
  ] },
  { orderId: 'ORD20261009007', orderTime: '2026-10-09 16:01:06', payTime: '2026-10-09 16:02:56', payNo: 'PAY20261009007001', payMethod: 'wechat', discount: 0.00, amount: 42.65, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.64, promotion: false, discount: 0.00, paid: 4.89 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.43, promotion: false, discount: 0.00, paid: 14.16 }
  ] },
  { orderId: 'ORD20261009008', orderTime: '2026-10-09 17:14:28', payTime: '2026-10-09 17:17:36', payNo: 'PAY20261009008001', payMethod: 'wechat', discount: 2.01, amount: 17.89, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: true, discount: 2.01, paid: 17.89 }
  ] },
  { orderId: 'ORD20261009009', orderTime: '2026-10-09 18:05:44', payTime: '2026-10-09 18:07:16', payNo: 'PAY20261009009001', payMethod: 'alipay', discount: 0.00, amount: 59.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 59.80 }
  ] },
  { orderId: 'ORD20261009010', orderTime: '2026-10-09 18:48:23', payTime: '2026-10-09 18:49:22', payNo: 'PAY20261009010001', payMethod: 'card', discount: 0.46, amount: 104.14, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.52, promotion: false, discount: 0.00, paid: 12.38 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.55, promotion: true, discount: 0.46, paid: 2.06 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 }
  ] },
  { orderId: 'ORD20261009011', orderTime: '2026-10-09 19:13:08', payTime: '2026-10-09 19:15:30', payNo: 'PAY20261009011001', payMethod: 'alipay', discount: 0.00, amount: 189.60, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20261009012', orderTime: '2026-10-09 19:34:42', payTime: '2026-10-09 19:34:50', payNo: 'PAY20261009012001', payMethod: 'alipay', discount: 6.45, amount: 67.68, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 0.73, promotion: true, discount: 6.45, paid: 22.68 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 45.00 }
  ] },
  { orderId: 'ORD20261009013', orderTime: '2026-10-09 21:06:05', payTime: '2026-10-09 21:08:04', payNo: 'PAY20261009013001', payMethod: 'alipay', discount: 2.62, amount: 25.88, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 2.24, promotion: true, discount: 2.62, paid: 6.97, refund: 4.74 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.91, promotion: false, discount: 0.00, paid: 18.91 }
  ] },
  { orderId: 'ORD20261010001', orderTime: '2026-10-10 07:34:07', payTime: '2026-10-10 07:34:53', payNo: 'PAY20261010001001', payMethod: 'wechat', discount: 32.16, amount: 89.74, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 1, weight: 0.00, promotion: true, discount: 5.27, paid: 26.73 },
    { code: '6901234500109', name: '食用调和油', spec: '5L/瓶', price: 89.90, qty: 1, weight: 0.00, promotion: true, discount: 26.89, paid: 63.01 }
  ] },
  { orderId: 'ORD20261010002', orderTime: '2026-10-10 08:21:26', payTime: '2026-10-10 08:22:39', payNo: 'PAY20261010002001', payMethod: 'alipay', discount: 0.27, amount: 89.49, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90, refundPrev: 9.15 },
    { code: '6901234500086', name: '草鱼', spec: '称重/公斤', price: 17.80, qty: 1, weight: 2.34, promotion: false, discount: 0.00, paid: 41.65 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.75, promotion: true, discount: 0.27, paid: 2.94 }
  ] },
  { orderId: 'ORD20261010003', orderTime: '2026-10-10 08:30:37', payTime: '2026-10-10 08:31:28', payNo: 'PAY20261010003001', payMethod: 'cash', discount: 0.00, amount: 12.53, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '个人客户', items: [
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.57, promotion: false, discount: 0.00, paid: 12.53 }
  ] },
  { orderId: 'ORD20261010004', orderTime: '2026-10-10 09:11:26', payTime: '2026-10-10 09:14:30', payNo: 'PAY20261010004001', payMethod: 'wechat', discount: 1.05, amount: 110.04, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 85.80 },
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.81, promotion: true, discount: 1.05, paid: 4.34 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20261010005', orderTime: '2026-10-10 09:13:54', payTime: '', payNo: '', payMethod: '', discount: 5.15, amount: 106.54, status: '20', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.35, promotion: false, discount: 0.00, paid: 93.77 },
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.81, promotion: true, discount: 5.15, paid: 12.77 }
  ] },
  { orderId: 'ORD20261010006', orderTime: '2026-10-10 11:36:30', payTime: '2026-10-10 11:38:24', payNo: 'PAY20261010006001', payMethod: 'wechat', discount: 0.00, amount: 94.41, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.03, promotion: false, discount: 0.00, paid: 41.10 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.24, promotion: false, discount: 0.00, paid: 53.31 }
  ] },
  { orderId: 'ORD20261010007', orderTime: '2026-10-10 13:58:10', payTime: '2026-10-10 13:59:35', payNo: 'PAY20261010007001', payMethod: 'cash', discount: 0.00, amount: 40.46, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 1.70, promotion: false, discount: 0.00, paid: 40.46 }
  ] },
  { orderId: 'ORD20261010008', orderTime: '2026-10-10 14:58:02', payTime: '2026-10-10 14:58:55', payNo: 'PAY20261010008001', payMethod: 'wechat', discount: 0.00, amount: 104.52, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 96.00 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.86, promotion: false, discount: 0.00, paid: 8.52 }
  ] },
  { orderId: 'ORD20261010009', orderTime: '2026-10-10 15:12:19', payTime: '2026-10-10 15:14:33', payNo: 'PAY20261010009001', payMethod: 'wechat', discount: 0.00, amount: 94.69, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 2.06, promotion: false, discount: 0.00, paid: 82.19 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 }
  ] },
  { orderId: 'ORD20261010010', orderTime: '2026-10-10 15:22:04', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 142.18, status: '50', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.55, promotion: false, discount: 0.00, paid: 68.34 },
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.81, promotion: false, discount: 0.00, paid: 53.94 }
  ] },
  { orderId: 'ORD20261010011', orderTime: '2026-10-10 16:05:58', payTime: '2026-10-10 16:08:16', payNo: 'PAY20261010011001', payMethod: 'wechat', discount: 0.00, amount: 36.43, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 2.32, promotion: false, discount: 0.00, paid: 10.63 }
  ] },
  { orderId: 'ORD20261010012', orderTime: '2026-10-10 16:42:36', payTime: '2026-10-10 16:43:39', payNo: 'PAY20261010012001', payMethod: 'cash', discount: 0.00, amount: 36.14, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 29.60 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.82, promotion: false, discount: 0.00, paid: 6.54 }
  ] },
  { orderId: 'ORD20261010013', orderTime: '2026-10-10 18:53:50', payTime: '2026-10-10 18:56:03', payNo: 'PAY20261010013001', payMethod: 'cash', discount: 0.00, amount: 44.90, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 25.00 }
  ] },
  { orderId: 'ORD20261011001', orderTime: '2026-10-11 07:43:12', payTime: '2026-10-11 07:45:15', payNo: 'PAY20261011001001', payMethod: 'alipay', discount: 0.00, amount: 91.24, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.30, promotion: false, discount: 0.00, paid: 54.74 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.42, promotion: false, discount: 0.00, paid: 6.50 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 }
  ] },
  { orderId: 'ORD20261011002', orderTime: '2026-10-11 08:25:39', payTime: '2026-10-11 08:26:19', payNo: 'PAY20261011002001', payMethod: 'alipay', discount: 0.00, amount: 98.71, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 1.72, promotion: false, discount: 0.00, paid: 46.10 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.10, promotion: false, discount: 0.00, paid: 49.98 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.44, promotion: false, discount: 0.00, paid: 2.63 }
  ] },
  { orderId: 'ORD20261011003', orderTime: '2026-10-11 08:30:36', payTime: '', payNo: '', payMethod: '', discount: 0.00, amount: 25.80, status: '20', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 25.80 }
  ] },
  { orderId: 'ORD20261011004', orderTime: '2026-10-11 08:33:43', payTime: '2026-10-11 08:35:49', payNo: 'PAY20261011004001', payMethod: 'wechat', discount: 3.51, amount: 36.42, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.34, promotion: true, discount: 3.51, paid: 36.42 }
  ] },
  { orderId: 'ORD20261011005', orderTime: '2026-10-11 08:37:48', payTime: '2026-10-11 08:39:47', payNo: 'PAY20261011005001', payMethod: 'wechat', discount: 8.06, amount: 55.80, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 0.42, promotion: false, discount: 0.00, paid: 4.16 },
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 8.06, paid: 31.74 }
  ] },
  { orderId: 'ORD20261011006', orderTime: '2026-10-11 09:35:38', payTime: '2026-10-11 09:39:00', payNo: 'PAY20261011006001', payMethod: 'cash', discount: 0.00, amount: 63.37, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.34, promotion: false, discount: 0.00, paid: 36.97 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 26.40 }
  ] },
  { orderId: 'ORD20261011007', orderTime: '2026-10-11 09:41:06', payTime: '2026-10-11 09:41:51', payNo: 'PAY20261011007001', payMethod: 'wechat', discount: 0.00, amount: 5.04, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.10, promotion: false, discount: 0.00, paid: 5.04 }
  ] },
  { orderId: 'ORD20261011008', orderTime: '2026-10-11 09:47:47', payTime: '2026-10-11 09:48:25', payNo: 'PAY20261011008001', payMethod: 'alipay', discount: 4.08, amount: 35.72, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: true, discount: 4.08, paid: 35.72, refund: 19.65 }
  ] },
  { orderId: 'ORD20261011009', orderTime: '2026-10-11 10:08:58', payTime: '2026-10-11 10:10:43', payNo: 'PAY20261011009001', payMethod: 'wechat', discount: 0.00, amount: 105.08, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.62, promotion: false, discount: 0.00, paid: 16.04 },
    { code: '6901234500028', name: '妃子笑荔枝', spec: '500/斤', price: 26.80, qty: 1, weight: 2.58, promotion: false, discount: 0.00, paid: 69.14 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 }
  ] },
  { orderId: 'ORD20261011010', orderTime: '2026-10-11 11:40:53', payTime: '2026-10-11 11:41:21', payNo: 'PAY20261011010001', payMethod: 'wechat', discount: 7.03, amount: 119.36, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: true, discount: 7.03, paid: 52.67 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 1.08, promotion: false, discount: 0.00, paid: 43.09 },
    { code: '6901234500116', name: '鲜牛奶', spec: '950ml/盒', price: 11.80, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 23.60 }
  ] },
  { orderId: 'ORD20261011011', orderTime: '2026-10-11 11:51:00', payTime: '2026-10-11 11:54:00', payNo: 'PAY20261011011001', payMethod: 'cash', discount: 1.24, amount: 7.87, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '个人客户', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 0.53, promotion: false, discount: 0.00, paid: 1.58 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.26, promotion: true, discount: 1.24, paid: 6.29 }
  ] },
  { orderId: 'ORD20261011012', orderTime: '2026-10-11 12:48:14', payTime: '2026-10-11 12:50:44', payNo: 'PAY20261011012001', payMethod: 'wechat', discount: 6.72, amount: 180.26, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 85.80 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 0.91, promotion: false, discount: 0.00, paid: 7.26 },
    { code: '6901234500035', name: '金枕榴莲', spec: '1.5/公斤', price: 39.90, qty: 1, weight: 0.75, promotion: true, discount: 6.72, paid: 23.20 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 }
  ] },
  { orderId: 'ORD20261011013', orderTime: '2026-10-11 12:50:26', payTime: '', payNo: '', payMethod: '', discount: 10.90, amount: 37.57, status: '50', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.56, promotion: true, discount: 10.90, paid: 29.55 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 1.75, promotion: false, discount: 0.00, paid: 8.02 }
  ] },
  { orderId: 'ORD20261011014', orderTime: '2026-10-11 16:24:18', payTime: '2026-10-11 16:26:49', payNo: 'PAY20261011014001', payMethod: 'alipay', discount: 5.09, amount: 107.61, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.62, promotion: false, discount: 0.00, paid: 14.76 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.42, promotion: true, discount: 5.09, paid: 33.15 }
  ] },
  { orderId: 'ORD20261011015', orderTime: '2026-10-11 16:27:11', payTime: '2026-10-11 16:30:03', payNo: 'PAY20261011015001', payMethod: 'wechat', discount: 0.00, amount: 132.98, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 0.72, promotion: false, discount: 0.00, paid: 3.08 },
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 }
  ] },
  { orderId: 'ORD20261011016', orderTime: '2026-10-11 18:25:46', payTime: '2026-10-11 18:28:35', payNo: 'PAY20261011016001', payMethod: 'wechat', discount: 9.01, amount: 96.69, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 19.90 },
    { code: '6901234500097', name: '东北大米5kg', spec: '5000/袋', price: 42.90, qty: 2, weight: 0.00, promotion: true, discount: 9.01, paid: 76.79 }
  ] },
  { orderId: 'ORD20261011017', orderTime: '2026-10-11 18:37:11', payTime: '2026-10-11 18:39:11', payNo: 'PAY20261011017001', payMethod: 'wechat', discount: 0.00, amount: 39.80, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20261011018', orderTime: '2026-10-11 19:27:54', payTime: '2026-10-11 19:30:03', payNo: 'PAY20261011018001', payMethod: 'card', discount: 11.70, amount: 196.66, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '好滋味餐饮', items: [
    { code: '6901234500062', name: '带皮五花肉', spec: '称重/公斤', price: 29.80, qty: 1, weight: 1.12, promotion: false, discount: 0.00, paid: 33.38 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 89.70 },
    { code: '6901234500073', name: '三黄鸡(整只)', spec: '1只约1.2kg/只', price: 25.80, qty: 3, weight: 0.00, promotion: true, discount: 11.70, paid: 65.70 },
    { code: '6901234500048', name: '马铃薯', spec: '称重/公斤', price: 4.28, qty: 1, weight: 1.84, promotion: false, discount: 0.00, paid: 7.88 }
  ] },
  { orderId: 'ORD20261011019', orderTime: '2026-10-11 19:33:14', payTime: '2026-10-11 19:35:06', payNo: 'PAY20261011019001', payMethod: 'cash', discount: 2.28, amount: 13.46, status: '30', store: '崧泽-青浦旗舰店', cashier: '周收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.59, promotion: true, discount: 2.28, paid: 13.46, refundPrev: 5.11 }
  ] },
  { orderId: 'ORD20261011020', orderTime: '2026-10-11 21:54:49', payTime: '2026-10-11 21:56:17', payNo: 'PAY20261011020001', payMethod: 'wechat', discount: 0.00, amount: 59.70, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 }
  ] },
  { orderId: 'ORD20261012001', orderTime: '2026-10-12 08:31:43', payTime: '2026-10-12 08:32:27', payNo: 'PAY20261012001001', payMethod: 'wechat', discount: 13.39, amount: 55.11, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.66, promotion: false, discount: 0.00, paid: 10.43 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 2.44, promotion: true, discount: 13.39, paid: 44.68 }
  ] },
  { orderId: 'ORD20261012002', orderTime: '2026-10-12 13:46:53', payTime: '2026-10-12 13:50:00', payNo: 'PAY20261012002001', payMethod: 'wechat', discount: 0.00, amount: 44.40, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500141', name: '红烧牛肉面(5连包)', spec: '5包/袋', price: 14.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 44.40 }
  ] },
  { orderId: 'ORD20261012003', orderTime: '2026-10-12 17:32:23', payTime: '2026-10-12 17:34:56', payNo: 'PAY20261012003001', payMethod: 'wechat', discount: 8.10, amount: 39.22, status: '30', store: '崧泽-松江分店', cashier: '王收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 1.76, promotion: false, discount: 0.00, paid: 17.42 },
    { code: '6901234500103', name: '卷纸(12卷)', spec: '12卷/提', price: 29.90, qty: 1, weight: 0.00, promotion: true, discount: 8.10, paid: 21.80 }
  ] },
  { orderId: 'ORD20261012004', orderTime: '2026-10-12 17:53:27', payTime: '2026-10-12 17:54:55', payNo: 'PAY20261012004001', payMethod: 'cash', discount: 0.00, amount: 39.80, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20261012005', orderTime: '2026-10-12 18:34:34', payTime: '2026-10-12 18:36:46', payNo: 'PAY20261012005001', payMethod: 'wechat', discount: 0.00, amount: 23.69, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 0.55, promotion: false, discount: 0.00, paid: 8.69 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 15.00 }
  ] },
  { orderId: 'ORD20261012006', orderTime: '2026-10-12 18:42:00', payTime: '2026-10-12 18:43:33', payNo: 'PAY20261012006001', payMethod: 'cash', discount: 0.00, amount: 77.07, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 1.82, promotion: false, discount: 0.00, paid: 28.76 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 0.94, promotion: false, discount: 0.00, paid: 5.62 },
    { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.58, qty: 1, weight: 0.63, promotion: false, discount: 0.00, paid: 2.89 },
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 39.80 }
  ] },
  { orderId: 'ORD20261012007', orderTime: '2026-10-12 19:09:25', payTime: '2026-10-12 19:12:42', payNo: 'PAY20261012007001', payMethod: 'wechat', discount: 0.00, amount: 96.30, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 45.00, refund: 36.00 },
    { code: '6901234500158', name: '海天生抽(500ml)', spec: '500/瓶', price: 8.80, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 26.40 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 24.90 }
  ] },
  { orderId: 'ORD20261012008', orderTime: '2026-10-12 19:18:35', payTime: '2026-10-12 19:18:54', payNo: 'PAY20261012008001', payMethod: 'wechat', discount: 5.38, amount: 58.28, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500093', name: '苹果(红富士)', spec: '称重/公斤', price: 9.90, qty: 1, weight: 2.43, promotion: false, discount: 0.00, paid: 24.06 },
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.22, promotion: false, discount: 0.00, paid: 7.30 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 },
    { code: '6901234500165', name: '乐事原味薯片', spec: '70/袋', price: 9.90, qty: 2, weight: 0.00, promotion: true, discount: 5.38, paid: 14.42 }
  ] },
  { orderId: 'ORD20261012009', orderTime: '2026-10-12 19:29:44', payTime: '2026-10-12 19:30:11', payNo: 'PAY20261012009001', payMethod: 'wechat', discount: 0.00, amount: 73.57, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.98, qty: 1, weight: 1.60, promotion: false, discount: 0.00, paid: 9.57 },
    { code: '6901234500080', name: '鲈鱼(鲜活)', spec: '约500g/条', price: 32.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 64.00 }
  ] },
  { orderId: 'ORD20261012010', orderTime: '2026-10-12 20:42:19', payTime: '2026-10-12 20:42:27', payNo: 'PAY20261012010001', payMethod: 'wechat', discount: 26.45, amount: 85.10, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '好滋味餐饮', items: [
    { code: '6901234500079', name: '鲜鸡蛋', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: true, discount: 16.02, paid: 43.68 },
    { code: '6901234500042', name: '云南夏黑葡萄', spec: '500/斤', price: 15.80, qty: 1, weight: 2.60, promotion: true, discount: 10.43, paid: 30.65 },
    { code: '6901234500055', name: '番茄', spec: '称重/公斤', price: 7.98, qty: 1, weight: 1.35, promotion: false, discount: 0.00, paid: 10.77 }
  ] },
  { orderId: 'ORD20261013001', orderTime: '2026-10-13 07:07:31', payTime: '2026-10-13 07:10:20', payNo: 'PAY20261013001001', payMethod: 'alipay', discount: 0.00, amount: 134.40, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500059', name: '鲜鸡蛋(30枚)', spec: '30枚/盒', price: 19.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 59.70 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 }
  ] },
  { orderId: 'ORD20261013002', orderTime: '2026-10-13 08:51:31', payTime: '2026-10-13 08:53:15', payNo: 'PAY20261013002001', payMethod: 'cash', discount: 0.00, amount: 3.81, status: '30', store: '崧泽-青浦旗舰店', cashier: '李收银', company: '好滋味餐饮', items: [
    { code: '6901234500031', name: '白萝卜', spec: '称重/公斤', price: 2.98, qty: 1, weight: 1.28, promotion: false, discount: 0.00, paid: 3.81 }
  ] },
  { orderId: 'ORD20261013003', orderTime: '2026-10-13 09:03:36', payTime: '2026-10-13 09:03:44', payNo: 'PAY20261013003001', payMethod: 'wechat', discount: 1.30, amount: 85.90, status: '30', store: '崧泽-青浦旗舰店', cashier: '张收银', company: '沪上阿姨奶茶', items: [
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: true, discount: 1.30, paid: 11.20 },
    { code: '6901234500196', name: '三只松鼠每日坚果', spec: '25/袋', price: 24.90, qty: 3, weight: 0.00, promotion: false, discount: 0.00, paid: 74.70 }
  ] },
  { orderId: 'ORD20261013004', orderTime: '2026-10-13 09:17:31', payTime: '2026-10-13 09:19:25', payNo: 'PAY20261013004001', payMethod: 'wechat', discount: 0.00, amount: 159.90, status: '30', store: '崧泽-松江分店', cashier: '孙收银', company: '鲜丰水果连锁', items: [
    { code: '6901234500134', name: '花生油(5L)', spec: '5000/桶', price: 129.90, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 129.90 },
    { code: '6901234500172', name: '可口可乐(330mlx6)', spec: '6罐/组', price: 15.00, qty: 2, weight: 0.00, promotion: false, discount: 0.00, paid: 30.00 }
  ] },
  { orderId: 'ORD20261013005', orderTime: '2026-10-13 09:22:41', payTime: '2026-10-13 09:25:19', payNo: 'PAY20261013005001', payMethod: 'wechat', discount: 0.00, amount: 37.98, status: '30', store: '崧泽-松江分店', cashier: '赵收银', company: '个人客户', items: [
    { code: '6901234500011', name: '宁夏硒砂瓜', spec: '2.5/公斤', price: 4.98, qty: 1, weight: 1.39, promotion: false, discount: 0.00, paid: 6.92 },
    { code: '6901234500066', name: '猪前腿肉', spec: '1.0/公斤', price: 23.80, qty: 1, weight: 0.78, promotion: false, discount: 0.00, paid: 18.56 },
    { code: '6901234500110', name: '鲜牛奶(1L)', spec: '1000/瓶', price: 12.50, qty: 1, weight: 0.00, promotion: false, discount: 0.00, paid: 12.50 }
  ] }
];
var OD_SEED_VER = 'v3-20261013';
function odLoad() {
  var ver = null, raw = null;
  try { ver = localStorage.getItem(OD_KEY + '_ver'); } catch (e) {}
  try { raw = localStorage.getItem(OD_KEY); } catch (e) {}
  if (raw && ver === OD_SEED_VER) { OD_ORDERS = JSON.parse(raw); return; }
  // 种子版本变更 → 重放种子（订单为纯演示流水，不接受旧版本残留在浏览器里）
  OD_ORDERS = JSON.parse(JSON.stringify(OD_SEED));
  try { localStorage.setItem(OD_KEY + '_ver', OD_SEED_VER); } catch (e) {}
  odPersist();
}
function odPersist() { try { localStorage.setItem(OD_KEY, JSON.stringify(OD_ORDERS)); } catch (e) {} }
function odById(id) { for (var i = 0; i < OD_ORDERS.length; i++) if (OD_ORDERS[i].orderId === id) return OD_ORDERS[i]; return null; }
// 折前商品金额：按重商品计 price×重量，按件商品计 price×数量 —— 等价于 Σ(实收+优惠)
function odGoodsAmount(o) { return o.items.reduce(function (sum, it) { return sum + msOdNum(it.paid) + msOdNum(it.discount); }, 0); }
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
  var sumRf = 0, sumRp = 0;
  o.items.forEach(function (it) { sumRf += (+it.refund || 0); sumRp += (+it.refundPrev || 0); });
  sumRf = Math.round(sumRf * 100) / 100; sumRp = Math.round(sumRp * 100) / 100;
  var itemRows = o.items.map(function (it) {
    var rf = +it.refund || 0, rp = +it.refundPrev || 0;
    var priceHtml = it.promotion ? '<span style="text-decoration:line-through;color:#c0c4cc;margin-right:6px">' + msOdMoney(it.price) + '</span><span>' + msOdMoney(it.paid / (it.qty || 1)) + '</span>' : msOdMoney(it.price);
    return '<tr><td style="padding:8px 12px">' + msOdEsc(it.name) + '</td><td style="padding:8px 12px">' + msOdEsc(it.code) + '</td><td style="padding:8px 12px">' + msOdEsc(it.spec) + '</td><td style="padding:8px 12px;text-align:right">' + priceHtml + '</td><td style="padding:8px 12px;text-align:center">' + odItemQty(it) + '</td><td style="padding:8px 12px;text-align:right;color:#f56c6c">' + msOdMoney(it.discount) + '</td><td style="padding:8px 12px;text-align:right;font-weight:600">' + msOdMoney(it.paid) + '</td><td style="padding:8px 12px;text-align:right;color:#f56c6c">' + (rf ? msOdMoney(rf) : '—') + '</td><td style="padding:8px 12px;text-align:right;color:#f56c6c">' + (rp ? msOdMoney(rp) : '—') + '</td></tr>';
  }).join('');
  var html = '<div style="font-size:12px;color:#0b1019">' +
    '<div style="margin-bottom:16px"><div style="font-weight:600;margin-bottom:8px;color:#0b1019">商品明细</div><div style="border:1px solid #e9eef7;border-radius:4px;overflow:hidden"><table style="width:100%;font-size:12px"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">商品名称</th><th style="padding:8px 12px;text-align:left">商品编码</th><th style="padding:8px 12px;text-align:left">商品规格</th><th style="padding:8px 12px;text-align:right">商品单价(元)</th><th style="padding:8px 12px;text-align:center">购买数量</th><th style="padding:8px 12px;text-align:right">优惠金额(元)</th><th style="padding:8px 12px;text-align:right">实收金额(元)</th><th style="padding:8px 12px;text-align:right">当期退款(元)</th><th style="padding:8px 12px;text-align:right">往期退款(元)</th></tr></thead><tbody>' + itemRows + '</tbody></table></div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
      '<div style="border:1px solid #e9eef7;border-radius:4px;padding:12px"><div style="font-weight:600;margin-bottom:10px;color:#0b1019">支付信息</div><div style="display:grid;grid-template-columns:80px 1fr;gap:8px 10px;color:#5b6472;font-size:12px"><span>支付方式</span><span>' + (OD_PAY_METHOD[o.payMethod] || '—') + '</span><span>商品金额</span><span>' + msOdMoney(goodsAmount) + '</span><span>优惠金额</span><span style="color:#f56c6c">' + msOdMoney(o.discount) + '</span><span>支付时间</span><span>' + (o.payTime || '—') + '</span><span>支付单号</span><span>' + (o.payNo || '—') + '</span><span>实收金额</span><span style="font-weight:600;color:#0b1019">' + msOdMoney(o.amount) + '</span><span>当期退款</span><span style="color:#f56c6c">' + msOdMoney(sumRf) + '</span><span>往期退款</span><span style="color:#f56c6c">' + msOdMoney(sumRp) + '</span><span>退款后净收</span><span style="font-weight:600;color:#0b1019">' + msOdMoney(Math.round((o.amount - sumRf - sumRp) * 100) / 100) + '</span></div></div>' +
      '<div style="border:1px solid #e9eef7;border-radius:4px;padding:12px"><div style="font-weight:600;margin-bottom:10px;color:#0b1019">订单信息</div><div style="display:grid;grid-template-columns:80px 1fr;gap:8px 10px;color:#5b6472;font-size:12px"><span>订单编号</span><span>' + o.orderId + '</span><span>下单时间</span><span>' + o.orderTime + '</span><span>门店</span><span>' + msOdEsc(o.store) + '</span><span>营业员</span><span>' + msOdEsc(o.cashier) + '</span><span>公司</span><span>' + msOdEsc(o.company) + '</span><span>终端MAC</span><span>00:1A:2B:3C:4D:5E</span></div></div>' +
    '</div>' +
    '</div>';
  msOdDlg({ title: '订单详情 · ' + o.orderId, width: 'min(960px,94vw)', body: html, bodyStyle: 'max-height:72vh;overflow:auto;' });
}

function initSalesPage(pid) {
  if (pid === 'order-list') odInit();
}
