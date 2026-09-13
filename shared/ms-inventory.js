// ========== 库存管理域（对齐 Vue master Inventory 域，2026-09-03 补齐 demo） ==========
// 页面：inv-list 库存查询 / inv-entry 入库单 / inv-transfer 调拨记录 / inv-return 退货记录 / inv-check 盘点记录
// 依赖 layout.js：showToast / DATA_SCOPE / initTicker；共享样式 layout.css（ic-btn/ic-search/ic-modal/page-*）
var MS_INV_LOADED = true;
function msInvEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function msInvToast(m) { try { showToast(m); } catch (e) { alert(m); } }
// 状态徽标（对齐 demo 既有色系）
function msInvBadge(text, kind) {
  var map = {
    ok: 'background:#f0f9eb;color:#67c23a;border:1px solid #e1f3d8',
    warn: 'background:#fdf6ec;color:#e6a23c;border:1px solid #faecd8',
    err: 'background:#fef0f0;color:#f56c6c;border:1px solid #fde2e2',
    info: 'background:#f4f4f5;color:#909399;border:1px solid #e9e9eb',
    blue: 'background:#ecf5ff;color:#409eff;border:1px solid #d9ecff'
  };
  return '<span style="display:inline-block;padding:1px 10px;border-radius:10px;font-size:12px;line-height:18px;white-space:nowrap;' + (map[kind] || map.info) + '">' + text + '</span>';
}
/* ---------- 保质期体系（对齐 Vue LIFE_TYPES / computeExpiration，2026-09-07 补齐） ---------- */
var MS_INV_LIFE_TYPES = { 1: '天', 2: '月', 3: '年' };
// 保质期文本：shelfLife + 单位（如 12天），兼容旧字符串
function msInvLifeText(it) {
  if (it == null) return '—';
  if (typeof it === 'string') return it || '—';
  if (it.shelfLife == null || it.shelfLife === '') return '—';
  return String(it.shelfLife) + (MS_INV_LIFE_TYPES[it.shelfLifeType] || '天');
}
// 由生产日期 + 保质期(值/单位) 计算有效期至 YYYY-MM-DD（本地日期，避免 UTC 偏差）；缺参数返回 ''
function msInvCalcExp(pdate, life, lifeType) {
  if (!pdate || life == null || life === '') return '';
  var a = String(pdate).split('-'); if (a.length !== 3) return '';
  var d = new Date(+a[0], +a[1] - 1, +a[2]);
  var n = Math.max(0, parseInt(life, 10)); if (isNaN(n)) return '';
  var t = parseInt(lifeType, 10);
  if (t === 2) d.setMonth(d.getMonth() + n);
  else if (t === 3) d.setFullYear(d.getFullYear() + n);
  else d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
// 通用 A4 打印：body 为表格 HTML（含合计行由调用方拼好），title 为页眉
function msInvPrint(title, sub, headHtml, rowsHtml, footHtml) {
  var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>' + title + '</title><style>' +
    '@page{size:A4;margin:14mm}body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#1a2233;font-size:12px}' +
    '.print-hd{border-bottom:2px solid #1a2233;padding-bottom:8px;margin-bottom:4px}.print-hd h2{margin:0;font-size:18px}' +
    '.print-sub{color:#666;margin:4px 0 12px;font-size:11px}table{width:100%;border-collapse:collapse;font-size:12px}' +
    'th,td{border:1px solid #c9ced6;padding:6px 8px;text-align:left}th{background:#f2f4f7;font-weight:600}' +
    'td.r,th.r{text-align:right}.tfoot td{background:#f7f8fa;font-weight:600}.red{color:#ec2d30}.gray{color:#999}' +
    '</style></head><body><div class="print-hd"><h2>' + title + '</h2></div>' +
    '<div class="print-sub">' + sub + '</div><table><thead>' + headHtml + '</thead><tbody>' + rowsHtml + '</tbody>' +
    (footHtml ? '<tfoot>' + footHtml + '</tfoot>' : '') + '</table>' +
    '<div style="margin-top:10px;font-size:11px;color:#999;text-align:right">打印时间：' + new Date().toLocaleString('zh-CN', { hour12: false }) + '</div>' +
    '</body></html>';
  var w = window.open('', '_blank');
  if (!w) { msInvToast('请允许弹出窗口后重试'); return; }
  w.document.write(html); w.document.close();
  setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 120);
}
// 变动流水表（v2，支撑 inv-detail 库存明细页；类型对齐 Vue DETAIL_TYPES）
var INV_FLOW_KEY = 'tcm_inv_flow_v1';
var MS_INV_FLOW_TYPES = { 10: '入库', 20: '退货', 30: '调入', 40: '调出', 50: '销售', 60: '售后退货', 70: '货架补货', 80: '退回仓库', 90: '整箱拆零', 100: '零货装箱', 110: '盘点修正' };
var INV_FLOW = [];
function invFlowLoad() { try { var r = localStorage.getItem(INV_FLOW_KEY); if (r) { INV_FLOW = JSON.parse(r); return; } } catch (e) {} INV_FLOW = []; }
function invFlowPersist() { try { localStorage.setItem(INV_FLOW_KEY, JSON.stringify(INV_FLOW)); } catch (e) {} }
// type 数字 / code / name / qty 带符号 / pos '仓库'|'货架' / refNo / batch
// 对齐 Vue Inventorydetails：写入时顺带记录该商品运行余额快照（初始量/最新值）+ 规格/门店/分类，供明细三段式展示
function invFlowAdd(type, code, name, qty, pos, refNo, batch) {
  var now = new Date();
  var t = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2) + ' ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
  var g = msInvFindGoods(code);
  var wh = g ? (g.warehouse || 0) : 0, sh = g ? (g.shelf || 0) : 0;
  var latest = Math.round((wh + sh) * 100) / 100;          // 变动后总库存（调用方已在变动后写流水）
  var init = Math.round((latest - qty) * 100) / 100;       // 变动前总库存
  var spec = g ? (g.spec + '/' + g.unit) : '';
  var storeId = g ? g.storeId : '';
  var cat = g ? g.cat : '';
  INV_FLOW.unshift({ id: 'f' + Date.now() + String(INV_FLOW.length), type: type, typeName: MS_INV_FLOW_TYPES[type] || String(type), code: code, name: name, qty: Math.round(qty * 100) / 100, pos: pos || '仓库', refNo: refNo || '—', batch: batch || '—', ts: t, init: init, latest: latest, spec: spec, storeId: storeId, cat: cat });
  invFlowPersist();
}

// 分页渲染：写 #xxxPager，调用 cb(page)
function msInvPager(total, page, size, pagerId, cbName) {
  var bar = document.getElementById(pagerId);
  if (!bar) return;
  var pages = Math.ceil(total / size) || 1;
  if (page > pages) page = pages; if (page < 1) page = 1;
  var html = '<span class="page-info">共 ' + total + ' 条</span><div class="page-btns">';
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
  var s = Math.max(1, page - 2), e = Math.min(pages, page + 2);
  for (var p = s; p <= e; p++) {
    html += '<button class="page-btn' + (p === page ? ' active' : '') + '" style="' + (p === page ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="' + cbName + '(' + p + ')">' + p + '</button>';
  }
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page + 1) + ')" ' + (page >= pages ? 'disabled' : '') + '>›</button></div>';
  bar.innerHTML = html;
}
// 门店范围过滤（scope-bar 生效：DATA_SCOPE.storeAll=true 时不过滤）
function msInvScopeFilter(rows) {
  try {
    if (!window.DATA_SCOPE || DATA_SCOPE.storeAll) return rows;
    var ids = DATA_SCOPE.storeIds || [];
    if (!ids.length) return rows;
    return rows.filter(function (r) { return ids.indexOf(r.storeId) > -1; });
  } catch (e) { return rows; }
}
// 当前范围门店标签（供新增弹窗默认值展示）
function msInvScopeStoreLabel() {
  try {
    if (window.DATA_SCOPE && !DATA_SCOPE.storeAll && (DATA_SCOPE.storeIds || []).length === 1) {
      var ent = window.getCurrentEnterprise && getCurrentEnterprise();
      if (ent) { for (var i = 0; i < ent.stores.length; i++) { if (ent.stores[i].id === DATA_SCOPE.storeIds[0]) return ent.stores[i].name; } }
    }
  } catch (e) {}
  return '全部门店';
}
// 通用弹窗骨架（复用 ic-modal 体系）
function msInvModal(opt) {
  msInvCloseModal();
  var bd = document.createElement('div'); bd.className = 'ic-modal-backdrop'; bd.id = 'msInvBackdrop';
  bd.onclick = function (e) { if (e.target === this && opt.allowClose !== false) msInvCloseModal(); };
  var md = document.createElement('div'); md.className = 'ic-modal'; md.id = 'msInvModal';
  md.style.cssText = 'width:' + (opt.width || 'min(560px,94vw)') + ';' + (opt.height ? 'height:' + opt.height + ';max-height:none;' : '');
  md.innerHTML = '<div class="ic-modal-header"><span>' + (opt.title || '') + '</span><button class="ic-modal-close" onclick="msInvCloseModal()">✕</button></div>'
    + '<div class="ic-modal-body" style="' + (opt.bodyStyle || '') + '">' + opt.body + '</div>'
    + (opt.footer === false ? '' : '<div class="ic-modal-footer">'
      + (opt.footLeft || '')
      + '<button class="btn-secondary" onclick="msInvCloseModal()">' + (opt.cancelText || '取消') + '</button>'
      + '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>'
      + '</div>');
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msInvCloseModal() {
  var b = document.getElementById('msInvBackdrop'); if (b) b.remove();
  var m = document.getElementById('msInvModal'); if (m) m.remove();
}

/* ================================================================
 * 1) 库存查询 inv-list（Vue Inventorylist：仓库/货架库存 + 补货退仓 + 拆零装箱 + 批次弹窗）
 * ================================================================ */
// 当前范围门店 id（单店取之，全部门店回退默认店）
function msInvScopeStoreId(def) {
  try { if (window.DATA_SCOPE && !DATA_SCOPE.storeAll && (DATA_SCOPE.storeIds || []).length === 1) return DATA_SCOPE.storeIds[0]; } catch (e) {}
  return def || 'S2001';
}
// 今日日期 YYYY-MM-DD / 现在 YYYY-MM-DD HH:mm
function msInvToday() { var n = new Date(); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
function msInvNow() { var n = new Date(); return msInvToday() + ' ' + ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); }
// 批次对象化归一：兼容旧字符串 life '5天' → {shelfLife,shelfLifeType}
function msInvNormBatch(b) {
  if (!b) return b;
  if (b.shelfLife == null && typeof b.life === 'string') {
    var m = /^(\d+(?:\.\d+)?)(天|月|年)$/.exec(b.life);
    if (m) { b.shelfLife = parseFloat(m[1]); b.shelfLifeType = m[2] === '月' ? 2 : (m[2] === '年' ? 3 : 1); }
    else { b.shelfLife = null; b.shelfLifeType = 1; }
  }
  if (b.exp == null && b.pdate && b.shelfLife != null) b.exp = msInvCalcExp(b.pdate, b.shelfLife, b.shelfLifeType);
  return b;
}
// 按编码+批次号查某商品的批次
function msInvFindGoods(code) { for (var i = 0; i < INV_GOODS.length; i++) if (INV_GOODS[i].code === code) return INV_GOODS[i]; return null; }
function msInvBatchByNo(g, no) { if (!g || !g.batches) return null; for (var i = 0; i < g.batches.length; i++) if (g.batches[i].no === no) return g.batches[i]; return null; }
// 商品分类路径：优先取 catPath（T1 新字段），历史数据按名称回填（老 localStorage 无 catPath 时兜底）
var MS_INV_CATPATH_BY_NAME = {
  '娃娃菜': '生鲜/蔬菜/叶菜/娃娃菜', '上海青': '生鲜/蔬菜/叶菜/上海青', '白萝卜': '生鲜/蔬菜/根茎/白萝卜',
  '土豆': '生鲜/蔬菜/根茎/土豆', '西红柿': '生鲜/蔬菜/茄果/西红柿', '五花肉': '生鲜/肉禽蛋/猪肉/五花肉',
  '土鸡蛋': '生鲜/肉禽蛋/蛋品/鸡蛋', '草鱼': '生鲜/水产/淡水鱼/草鱼', '红富士苹果': '生鲜/水果/仁果/红富士苹果',
  '金龙鱼调和油': '食品/粮油调味/食用油/调和油', '光明鲜牛奶': '乳品/乳制品/牛奶/鲜牛奶', '思念水饺': '食品/方便食品/速冻食品/水饺'
};
function msInvCatPathOf(g) {
  if (!g) return '';
  if (g.catPath) return g.catPath;
  return MS_INV_CATPATH_BY_NAME[g.name] || '';
}
// 老数据迁移：把按名称推出的分类写回 catPath，避免每次取价都要兜底查表
function msInvMigrateCatPath() {
  var changed = false;
  for (var i = 0; i < INV_GOODS.length; i++) {
    var g = INV_GOODS[i];
    if (!g.catPath && MS_INV_CATPATH_BY_NAME[g.name]) { g.catPath = MS_INV_CATPATH_BY_NAME[g.name]; changed = true; }
    if (g.grade == null) { g.grade = ''; changed = true; }
  }
  if (changed) invListPersist();
}
// 批次成本回填（FIFO 成本流转依赖批级成本；旧数据/种子批次缺 cost 用商品 avgCost 兜底）
function msInvNormBatchCost(g) {
  if (!g.batches) return;
  for (var j = 0; j < g.batches.length; j++) { var b = g.batches[j]; if (typeof b.cost !== 'number') b.cost = g.avgCost || 0; }
}
function msInvPdateVal(p) { if (!p) return 99999999; var a = String(p).split('-'); return a.length === 3 ? new Date(+a[0], +a[1] - 1, +a[2]).getTime() : 99999999; }
// 无效期商品 FIFO 单位成本：该区域最早批次（生产日期升序）的进货成本；无批级成本回退 avgCost
function msInvFifoCost(g, loc) {
  if (!g) return 0;
  var bs = (g.batches || []).filter(function (b) { return (loc === '货架' ? b.s : b.w) > 0; }).slice().sort(function (a, b) { return msInvPdateVal(a.pdate) - msInvPdateVal(b.pdate); });
  if (bs.length && typeof bs[0].cost === 'number') return bs[0].cost;
  return g.avgCost || 0;
}
// 无效期商品：按 FIFO 把 delta 分摊到批次（减：最早批次先扣；增：加到最新批次；无批次则新建），并同步商品总数
function msInvFifoApply(g, loc, delta) {
  if (!g || !delta) return;
  var locKey = loc === '货架' ? 'shelf' : 'warehouse', bKey = loc === '货架' ? 's' : 'w';
  if (delta < 0) {
    var bs = g.batches.slice().sort(function (a, b) { return msInvPdateVal(a.pdate) - msInvPdateVal(b.pdate); });
    var need = -delta;
    for (var i = 0; i < bs.length && need > 0; i++) { var t = Math.min(need, bs[i][bKey]); bs[i][bKey] -= t; need -= t; }
  } else {
    var sorted = g.batches.slice().sort(function (a, b) { return msInvPdateVal(b.pdate) - msInvPdateVal(a.pdate); });
    var tgt = sorted.length ? sorted[0] : null;
    if (!tgt) { tgt = { no: 'FIFO' + msInvToday().replace(/-/g, ''), pdate: msInvToday(), shelfLife: null, shelfLifeType: 1, exp: '', w: 0, s: 0, cost: g.avgCost || 0 }; g.batches.push(tgt); }
    tgt[bKey] += delta;
  }
  g[locKey] = Math.max(0, g[locKey] + delta);
}
var INV_LIST_PAGE = 1, INV_LIST_SIZE = 10, INV_LIST_KW = '', INV_LIST_SALE = '', INV_LIST_CAT = '', INV_LIST_CHECKED = {};
var INV_GOODS_KEY = 'tcm_inv_goods_v3';
// 效期管理默认：按商品编码判定（鲜活/乳品/蛋/水果/冻品/鲜肉/水产=效期管理；蔬菜/粮油调味=不计效期，保质期照填但不预警）。与商品资料「效期管理」开关同义，落库存域自有主数据，不依赖平台标准商品库。
var INV_EXP_DEFAULT = { '6901234500062': true, '6901234500079': true, '6901234500086': true, '6901234500093': true, '6901234500116': true, '6901234500123': true };
var INV_GOODS_SEED = [
  { goodsId: 'g-01', name: '娃娃菜', code: '6901234500017', cat: '叶菜类', catPath: '生鲜/蔬菜/叶菜/娃娃菜', grade: '', unit: 'kg', spec: '500g/份', sale: 1, expiryManaged: false, warehouse: 100, shelf: 26, avgCost: 2.8, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [{ no: 'RK20260908001', pdate: '2026-09-08', shelfLife: 5, shelfLifeType: 1, exp: '2026-09-13', w: 70, s: 18 }, { no: 'RK20260903001', pdate: '2026-09-03', shelfLife: 5, shelfLifeType: 1, exp: '2026-09-08', w: 30, s: 8 }] },
  { goodsId: 'g-02', name: '上海青', code: '6901234500024', cat: '叶菜类', catPath: '生鲜/蔬菜/叶菜/上海青', grade: '', unit: 'kg', spec: '400g/份', sale: 1, expiryManaged: false, warehouse: 88, shelf: 24, avgCost: 2.2, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [{ no: 'RK20260909001', pdate: '2026-09-09', shelfLife: 4, shelfLifeType: 1, exp: '2026-09-13', w: 60, s: 24 }, { no: 'RK20260911001', pdate: '2026-09-11', shelfLife: 4, shelfLifeType: 1, exp: '2026-09-15', w: 28, s: 0 }] },
  { goodsId: 'g-03', name: '白萝卜', code: '6901234500031', cat: '根茎类', catPath: '生鲜/蔬菜/根茎/白萝卜', grade: '', unit: 'kg', spec: '称重', sale: 1, expiryManaged: false, warehouse: 64, shelf: 30, avgCost: 1.6, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [{ no: 'RK20260905001', pdate: '2026-09-05', shelfLife: 10, shelfLifeType: 1, exp: '2026-09-15', w: 64, s: 30 }] },
  { goodsId: 'g-04', name: '土豆', code: '6901234500048', cat: '根茎类', catPath: '生鲜/蔬菜/根茎/土豆', grade: '', unit: 'kg', spec: '称重', sale: 1, expiryManaged: false, warehouse: 200, shelf: 60, avgCost: 3.4, supplier: '崧泽基地直供', storeId: 'S2001', batches: [{ no: 'RK20260901002', pdate: '2026-09-01', shelfLife: 30, shelfLifeType: 1, exp: '2026-10-01', w: 200, s: 60 }] },
  { goodsId: 'g-05', name: '西红柿', code: '6901234500055', cat: '茄果类', catPath: '生鲜/蔬菜/茄果/西红柿', grade: '', unit: 'kg', spec: '称重', sale: 1, expiryManaged: false, warehouse: 40, shelf: 18, avgCost: 5.1, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [{ no: 'RK20260904001', pdate: '2026-09-04', shelfLife: 10, shelfLifeType: 1, exp: '2026-09-14', w: 40, s: 18 }] },
  { goodsId: 'g-06', name: '五花肉', code: '6901234500062', cat: '肉禽蛋', catPath: '生鲜/肉禽蛋/猪肉/五花肉', grade: '', unit: 'kg', spec: '称重', sale: 1, expiryManaged: true, warehouse: 42, shelf: 18, avgCost: 24.5, supplier: '正大肉品', storeId: 'S2001', batches: [{ no: 'RK20260910003', pdate: '2026-09-10', shelfLife: 3, shelfLifeType: 1, exp: '2026-09-13', w: 30, s: 12 }, { no: 'RK20260906003', pdate: '2026-09-06', shelfLife: 3, shelfLifeType: 1, exp: '2026-09-09', w: 12, s: 6 }] },
  { goodsId: 'g-07', name: '土鸡蛋', code: '6901234500079', cat: '肉禽蛋', catPath: '生鲜/肉禽蛋/蛋品/鸡蛋', grade: '', unit: '盒', spec: '30枚/盒', sale: 1, expiryManaged: true, warehouse: 35, shelf: 22, avgCost: 18.8, supplier: '正大肉品', storeId: 'S2002', batches: [{ no: 'RK20260830001', pdate: '2026-08-30', shelfLife: 45, shelfLifeType: 1, exp: '2026-10-14', w: 35, s: 22 }] },
  { goodsId: 'g-08', name: '草鱼', code: '6901234500086', cat: '水产', catPath: '生鲜/水产/淡水鱼/草鱼', grade: '', unit: 'kg', spec: '称重', sale: 1, expiryManaged: true, warehouse: 26, shelf: 12, avgCost: 13.2, supplier: '淀山湖水产', storeId: 'S2001', batches: [{ no: 'RK20260911004', pdate: '2026-09-11', shelfLife: 2, shelfLifeType: 1, exp: '2026-09-13', w: 18, s: 10 }, { no: 'RK20260908004', pdate: '2026-09-08', shelfLife: 2, shelfLifeType: 1, exp: '2026-09-10', w: 8, s: 2 }] },
  { goodsId: 'g-09', name: '红富士苹果', code: '6901234500093', cat: '水果', catPath: '生鲜/水果/仁果/红富士苹果', grade: '', unit: 'kg', spec: '称重', sale: 1, expiryManaged: true, warehouse: 150, shelf: 48, avgCost: 7.6, supplier: '山东栖霞直供', storeId: 'S2002', batches: [{ no: 'RK20260905001', pdate: '2026-09-05', shelfLife: 15, shelfLifeType: 1, exp: '2026-09-20', w: 120, s: 40 }, { no: 'RK20260822001', pdate: '2026-08-22', shelfLife: 15, shelfLifeType: 1, exp: '2026-09-06', w: 30, s: 8 }] },
  { goodsId: 'g-10', name: '金龙鱼调和油', code: '6901234500109', cat: '粮油副食', catPath: '食品/粮油调味/食用油/调和油', grade: '', unit: '瓶', spec: '5L/瓶', sale: 0, expiryManaged: false, warehouse: 12, shelf: 6, avgCost: 62.0, supplier: '益海嘉里', storeId: 'S2001', batches: [{ no: 'RK20260801001', pdate: '2026-08-01', shelfLife: 540, shelfLifeType: 1, exp: '2027-01-22', w: 12, s: 6 }] },
  { goodsId: 'g-11', name: '光明鲜牛奶', code: '6901234500116', cat: '乳品烘焙', catPath: '乳品/乳制品/牛奶/鲜牛奶', grade: '', unit: '盒', spec: '950ml/盒', sale: 1, expiryManaged: true, warehouse: 30, shelf: 24, avgCost: 11.9, supplier: '光明乳业', storeId: 'S2001', batches: [{ no: 'RK20260908001', pdate: '2026-09-08', shelfLife: 7, shelfLifeType: 1, exp: '2026-09-15', w: 22, s: 16 }, { no: 'RK20260911001', pdate: '2026-09-11', shelfLife: 7, shelfLifeType: 1, exp: '2026-09-18', w: 8, s: 8 }] },
  { goodsId: 'g-12', name: '思念水饺', code: '6901234500123', cat: '冻品', catPath: '食品/方便食品/速冻食品/水饺', grade: '', unit: '袋', spec: '1kg/袋', sale: 1, expiryManaged: true, warehouse: 18, shelf: 10, avgCost: 21.5, supplier: '思念食品', storeId: 'S2002', batches: [{ no: 'RK20260818001', pdate: '2026-08-18', shelfLife: 180, shelfLifeType: 1, exp: '2027-02-14', w: 18, s: 10 }] }
];
var INV_GOODS = [];
function invListLoad() { try { var r = localStorage.getItem(INV_GOODS_KEY); if (r) { INV_GOODS = JSON.parse(r); } else { INV_GOODS = JSON.parse(JSON.stringify(INV_GOODS_SEED)); invListPersist(); } } catch (e) { INV_GOODS = JSON.parse(JSON.stringify(INV_GOODS_SEED)); }
  INV_GOODS.forEach(function (g) { if (g.expiryManaged == null) g.expiryManaged = !!INV_EXP_DEFAULT[g.code]; });
  // 批次对象化归一（旧数据 life:'5天' → shelfLife/shelfLifeType/exp）
  for (var i = 0; i < INV_GOODS.length; i++) { var g = INV_GOODS[i]; if (g.batches) for (var j = 0; j < g.batches.length; j++) msInvNormBatch(g.batches[j]); }
  msInvMigrateCatPath();
}
function invListPersist() { try { localStorage.setItem(INV_GOODS_KEY, JSON.stringify(INV_GOODS)); } catch (e) {} }
function invListCatName(id) { var m = { '': '全部', leaf: '叶菜类', root: '根茎类', sol: '茄果类', meat: '肉禽蛋', fish: '水产', fruit: '水果', oil: '粮油副食', milk: '乳品烘焙', ice: '冻品' }; return m[id] || id; }
function invListInit() {
  invListLoad();
  var el = document.getElementById('inv-listContent');
  if (!el) { setTimeout(invListInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">售品类型：</span>' +
      '<div class="segment" id="invListSaleTabs">' +
        '<button class="segment-btn active" data-v="" onclick="invListSetSale(\'\',this)">全部商品</button>' +
        '<button class="segment-btn" data-v="1" onclick="invListSetSale(1,this)">可售</button>' +
        '<button class="segment-btn" data-v="0" onclick="invListSetSale(0,this)">不可售</button>' +
      '</div>' +
      '<select class="ic-search" style="flex:0 1 140px" id="invListCatSel" onchange="invListSetCat(this.value)">' +
        '<option value="">全部分类</option><option>叶菜类</option><option>根茎类</option><option>茄果类</option><option>肉禽蛋</option><option>水产</option><option>水果</option><option>粮油副食</option><option>乳品烘焙</option><option>冻品</option>' +
      '</select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="名称 / 编码 / 条码" value="' + msInvEsc(INV_LIST_KW) + '" onkeydown="if(event.key===\'Enter\')invListQuery()" id="invListKw">' +
      '<button class="ic-btn" onclick="invListReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invListQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<span style="font-size:12px;color:#8a93a3">当前范围：' + msInvScopeStoreLabel() + '（随顶栏门店联动）</span>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invListBatchOp(1)">🛒 货架补货</button>' +
      '<button class="ic-btn" onclick="invListBatchOp(0)">退回仓库</button>' +
      '<button class="ic-btn" onclick="invListBoxOp(1)">整箱拆零</button>' +
      '<button class="ic-btn" onclick="invListBoxOp(0)">零货装箱</button>' +
      '<span style="flex:1"></span>' +
      '<span id="invListCheckedTip" style="font-size:12px;color:#8a93a3">已选 0 项</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="width:100%;table-layout:fixed;border-collapse:collapse">' +
          '<thead><tr>' +
            '<th style="width:4%;text-align:center;vertical-align:middle;padding:8px 6px"><input type="checkbox" onclick="invListCheckAll(this.checked)"></th>' +
            '<th style="width:5%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th>' +
            '<th style="width:12%;text-align:left;vertical-align:middle;padding:8px 10px">商品名称</th>' +
            '<th style="width:13%;text-align:left;vertical-align:middle;padding:8px 10px">编码/条码</th>' +
            '<th style="width:9%;text-align:left;vertical-align:middle;padding:8px 10px">商品规格</th>' +
            '<th style="width:7%;text-align:right;vertical-align:middle;padding:8px 10px">仓库数量</th>' +
            '<th style="width:7%;text-align:right;vertical-align:middle;padding:8px 10px">货架数量</th>' +
            '<th style="width:7%;text-align:right;vertical-align:middle;padding:8px 10px">总库存量</th>' +
            '<th style="width:9%;text-align:right;vertical-align:middle;padding:8px 10px">总成本价(元)</th>' +
            '<th style="width:8%;text-align:right;vertical-align:middle;padding:8px 10px">平均进货价</th>' +
            '<th style="width:7%;text-align:left;vertical-align:middle;padding:8px 10px">门店</th>' +
            '<th style="width:8%;text-align:left;vertical-align:middle;padding:8px 10px">供应商</th>' +
            '<th style="width:7%;text-align:center;vertical-align:middle;padding:8px 6px">状态</th>' +
          '</tr></thead>' +
          '<tbody id="invListBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="invListPager" style="flex-shrink:0"></div>' +
    '</div>';
  invListRender();
}
function invListData() {
  var rows = msInvScopeFilter(INV_GOODS);
  if (INV_LIST_SALE !== '') rows = rows.filter(function (r) { return String(r.sale) === String(INV_LIST_SALE); });
  if (INV_LIST_CAT) rows = rows.filter(function (r) { return r.cat === INV_LIST_CAT; });
  if (INV_LIST_KW) { var kw = INV_LIST_KW.toLowerCase(); rows = rows.filter(function (r) { return r.name.toLowerCase().indexOf(kw) > -1 || r.code.indexOf(kw) > -1; }); }
  return rows;
}
function invListRender() {
  var rows = invListData(), tbody = document.getElementById('invListBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_LIST_SIZE) || 1;
  if (INV_LIST_PAGE > pages) INV_LIST_PAGE = pages; if (INV_LIST_PAGE < 1) INV_LIST_PAGE = 1;
  var start = (INV_LIST_PAGE - 1) * INV_LIST_SIZE, data = rows.slice(start, start + INV_LIST_SIZE);
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1, totalInv = r.warehouse + r.shelf, totalCost = (r.avgCost * totalInv).toFixed(2);
    var spec = (r.unit === 'kg' || r.unit === 'l') ? '称重 / ' + r.unit : r.spec + ' / ' + r.unit;
    var chk = INV_LIST_CHECKED[r.goodsId] ? 'checked' : '';
    return '<tr style="' + (INV_LIST_CHECKED[r.goodsId] ? 'background:#f5f9ff' : '') + '">' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px"><input type="checkbox" ' + chk + ' onclick="invListCheckOne(\'' + r.goodsId + '\', this.checked)"></td>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + seq + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px"><a style="color:#1677ff;cursor:pointer" onclick="invListOpenBatch(\'' + r.goodsId + '\')">' + msInvEsc(r.name) + '</a></td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.code) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(spec) + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + r.warehouse + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + r.shelf + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px;font-weight:600;color:#0b1019">' + totalInv + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + totalCost + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">¥' + r.avgCost.toFixed(2) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + (storeName[r.storeId] || r.storeId) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.supplier) + '</td>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px">' + (r.sale === 1 ? msInvBadge('可售', 'ok') : msInvBadge('不可售', 'info')) + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="13" style="text-align:center;color:#999;padding:36px 0">暂无库存数据</td></tr>';
  invListUpdateCheckedTip();
  msInvPager(total, INV_LIST_PAGE, INV_LIST_SIZE, 'invListPager', 'invListGoPage');
}
function invListGoPage(p) { INV_LIST_PAGE = p; invListRender(); }
function invListSetSale(v, el) {
  INV_LIST_SALE = String(v); INV_LIST_PAGE = 1;
  var tabs = document.querySelectorAll('#invListSaleTabs .segment-btn');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === el);
  invListRender();
}
function invListSetCat(v) { INV_LIST_CAT = v; INV_LIST_PAGE = 1; invListRender(); }
function invListQuery() { var el = document.getElementById('invListKw'); if (el) INV_LIST_KW = el.value.trim(); INV_LIST_PAGE = 1; invListRender(); }
function invListReset() { INV_LIST_KW = ''; INV_LIST_CAT = ''; INV_LIST_SALE = ''; INV_LIST_PAGE = 1;
  var iw = document.getElementById('invListKw'); if (iw) iw.value = '';
  var cs = document.getElementById('invListCatSel'); if (cs) cs.value = '';
  var tabs = document.querySelectorAll('#invListSaleTabs .segment-btn'); for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', i === 0);
  invListRender();
}
function invListCheckedRows() {
  return msInvScopeFilter(INV_GOODS).filter(function (r) { return INV_LIST_CHECKED[r.goodsId]; });
}
function invListCheckOne(id, on) { INV_LIST_CHECKED[id] = !!on; invListRender(); }
function invListCheckAll(on) {
  var rows = invListData();
  rows.forEach(function (r) { INV_LIST_CHECKED[r.goodsId] = on; });
  invListRender();
}
function invListUpdateCheckedTip() {
  var n = invListCheckedRows().length, tip = document.getElementById('invListCheckedTip');
  if (tip) tip.textContent = '已选 ' + n + ' 项';
}
// 货架补货 / 退回仓库（对齐 Vue Inventorylist：勾选商品 → 列出这些商品的全部批次，逐批录入数量，不做自动 FIFO 分摊）
function invListBatchOp(type) {
  var rows = invListCheckedRows();
  if (!rows.length) { msInvToast('请先勾选商品'); return; }
  // 展开为「批次」行：货架补货只取仓库库存(w)>0 的批次；退回仓库只取货架库存(s)>0 的批次（对齐 Vue 过滤逻辑）
  var list = [], dropped = 0;
  rows.forEach(function (r) {
    var bs = r.batches || [];
    if (!bs.length) { dropped++; return; }
    bs.forEach(function (b) {
      if (type === 1 && !(b.w > 0)) return;
      if (type === 0 && !(b.s > 0)) return;
      list.push({ g: r, b: b });
    });
  });
  if (!list.length) {
    msInvToast(type === 1 ? '选中商品没有可用（仓库库存>0）的批次' : '选中商品没有可用（货架库存>0）的批次');
    return;
  }
  window._ilbType = type;
  window._ilbBatches = list;
  var specOf = function (g) { return (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : (g.spec || '') + '/' + g.unit; };
  var body = '<div style="font-size:12px;color:#5b6472;margin-bottom:10px">' +
    (type === 1 ? '将以下批次从仓库补至货架，请逐批录入补货数量（不自动分摊）：' : '将以下批次从货架退回仓库，请逐批录入退仓数量（不自动分摊）：') +
    (dropped ? '<span style="color:#f59e0b;margin-left:6px">（' + dropped + ' 种商品无批次记录，已忽略）</span>' : '') + '</div>' +
    '<div style="max-height:340px;overflow-y:auto;overflow-x:hidden"><table style="width:100%;table-layout:fixed;border-collapse:collapse">' +
    '<thead><tr><th style="width:12%;text-align:left;vertical-align:middle;padding:8px 10px">商品名称</th><th style="width:16%;text-align:left;vertical-align:middle;padding:8px 10px">编码/条码</th><th style="width:14%;text-align:left;vertical-align:middle;padding:8px 10px">批次号</th><th style="width:11%;text-align:left;vertical-align:middle;padding:8px 10px">规格</th>' +
    '<th style="width:8%;text-align:center;vertical-align:middle;padding:8px 6px">仓库</th><th style="width:8%;text-align:center;vertical-align:middle;padding:8px 6px">货架</th><th style="width:19%;text-align:left;vertical-align:middle;padding:8px 10px">生产日期→剩余效期-有效期至</th><th style="width:12%;text-align:left;vertical-align:middle;padding:8px 10px">' + (type === 1 ? '补货数量' : '退仓数量') + '</th></tr></thead><tbody>' +
    list.map(function (item, i) {
      var r = item.g, b = item.b;
      var remain = msInvRemainDays(b.exp);
      var remainHtml = remain == null ? '—' : ('<span style="color:' + (remain <= 0 ? '#ec2d30' : (remain <= 7 ? '#f59e0b' : '#3eb27e')) + '">' + remain + '天</span>');
      var life = (b.pdate ? b.pdate : '—') + ' → ' + remainHtml + ' → ' + (b.exp ? b.exp : '—');
      return '<tr><td style="text-align:left;vertical-align:middle;padding:8px 10px;white-space:nowrap">' + msInvEsc(r.name) + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px;color:#8a93a3;white-space:nowrap">' + msInvEsc(r.code) + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px;white-space:nowrap">' + msInvEsc(b.no) + '</td>' +
        '<td style="text-align:left;vertical-align:middle;padding:8px 10px;white-space:nowrap">' + msInvEsc(specOf(r)) + '</td>' +
        '<td style="text-align:center;vertical-align:middle;padding:8px 6px;white-space:nowrap">' + (b.w || 0) + '</td><td style="text-align:center;vertical-align:middle;padding:8px 6px;white-space:nowrap">' + (b.s || 0) + '</td>' +
        '<td style="text-align:left;vertical-align:middle;padding:8px 10px;font-size:11px;color:#5b6472;white-space:nowrap">' + life + '</td>' +
        '<td style="text-align:left;vertical-align:middle;padding:8px 10px"><input id="ilb_' + i + '" type="number" min="0" class="ic-search" style="width:100%" placeholder="数量"></td></tr>';
    }).join('') + '</tbody></table></div>';
  msInvModal({ title: (type === 1 ? '补货至货架' : '退回至仓库'), width: 'min(1200px,98vw)', body: body,
    onOk: 'invListDoBatch()', okText: '确认' + (type === 1 ? '补货' : '退仓') });
}
function invListDoBatch() {
  var type = window._ilbType, list = window._ilbBatches || [], done = 0, errs = [];
  list.forEach(function (item, idx) {
    var inp = document.getElementById('ilb_' + idx); if (!inp) return;
    var qty = parseFloat(inp.value); if (!qty || qty <= 0) return;
    var r = item.g, b = item.b;
    var avail = type === 1 ? (b.w || 0) : (b.s || 0);
    if (qty > avail) { errs.push(r.name + ' 批次' + b.no + ' 超出可用（' + avail + r.unit + '）'); return; }
    if (type === 1) { b.w -= qty; b.s += qty; r.warehouse -= qty; r.shelf += qty; invFlowAdd(70, r.code, r.name, qty, '货架', '', b.no); }
    else { b.s -= qty; b.w += qty; r.shelf -= qty; r.warehouse += qty; invFlowAdd(80, r.code, r.name, -qty, '货架', '', b.no); }
    done++;
  });
  if (errs.length) msInvToast(errs.join('；'));
  if (done) { invListPersist(); msInvCloseModal(); msInvToast('已' + (type === 1 ? '补货' : '退仓') + ' ' + done + ' 个批次'); invListRender(); }
  else if (!errs.length) msInvToast('请输入有效数量');
}
// 整箱拆零 / 零货装箱（主品 ↔ 关联品）
function invListBoxOp(boxType) {
  var rows = invListCheckedRows();
  if (!rows.length || rows.length > 1) { msInvToast('请单选一种商品'); return; }
  var r = rows[0];
  var goodsOpts = msInvScopeFilter(INV_GOODS).filter(function (g) { return g.goodsId !== r.goodsId; })
    .map(function (g) { return '<option value="' + g.goodsId + '">' + msInvEsc(g.name) + '（仓库 ' + g.warehouse + '）</option>'; }).join('');
  var body =
    '<div style="display:flex;gap:16px;align-items:flex-start">' +
      '<div style="flex:1;border:1px solid #e9eef7;border-radius:6px;padding:12px;background:#fafbfd">' +
        '<div style="font-size:13px;font-weight:600;color:#0b1019;margin-bottom:10px">原商品（' + (boxType === 1 ? '拆整箱为散件' : '零货装整箱') + '）</div>' +
        '<div style="font-size:12px;color:#3a4252;margin-bottom:4px">' + msInvEsc(r.name) + ' · ' + msInvEsc(r.code) + '</div>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:10px">仓库数量 <b style="color:#0b1019">' + r.warehouse + '</b> · 货架 <b>' + r.shelf + '</b> · 单位 ' + r.unit + '</div>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">批次号（含效期信息）</div>' +
        '<select class="ic-search" style="width:100%;margin-bottom:6px" id="ilBoxBatch" onchange="invListBoxBatchInfo()">' +
          (r.batches.length ? r.batches.map(function (b) {
            var rm = msInvRemainDays(b.exp);
            var rmTxt = rm === null ? '无有效期' : (rm < 0 ? '已过期' + Math.abs(rm) + '天' : '剩' + rm + '天');
            return '<option value="' + b.no + '">' + b.no + ' · 仓' + b.w + '/架' + b.s + (b.exp ? ' · 效期至' + b.exp + '(' + rmTxt + ')' : '') + '</option>';
          }).join('') : '<option value="">— 无批次 —</option>') +
        '</select>' +
        '<div id="ilBoxBatchInfo" style="font-size:12px;color:#5b6472;margin-bottom:8px;min-height:18px;line-height:18px"></div>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">' + (boxType === 1 ? '拆箱数量（箱）' : '装箱数量（箱）') + '</div>' +
        '<input id="ilBoxNum" type="number" min="1" class="ic-search" style="width:100%" placeholder="请输入数量">' +
      '</div>' +
      '<div style="flex:1;border:1px solid #e9eef7;border-radius:6px;padding:12px;background:#fafbfd">' +
        '<div style="font-size:13px;font-weight:600;color:#0b1019;margin-bottom:10px">关联商品（' + (boxType === 1 ? '箱规子件' : '装入的商品') + '）</div>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">选择关联商品</div>' +
        '<select class="ic-search" style="width:100%;margin-bottom:8px" id="ilBoxGoods"><option value="">— 请选择 —</option>' + goodsOpts + '</select>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">' + (boxType === 1 ? '每箱件数（散件/箱）' : '单件装箱数量') + '</div>' +
        '<input id="ilBoxNum2" type="number" min="1" class="ic-search" style="width:100%" placeholder="请输入数量">' +
        '<div style="font-size:11px;color:#8a93a3;margin-top:10px;line-height:18px">演示说明：拆零=按箱规把整箱拆为散件（拆 n1 箱×每箱 n2 件→关联商品 +n1×n2 件）；装箱=把零货组合成整箱（装 n1 箱×每箱 n2 件→关联商品 +n1 箱）。库存按箱规守恒；按所选批次核销，目标货继承源批次效期。</div>' +
      '</div>' +
    '</div>';
  window._ilBoxType = boxType; window._ilBoxMain = r;
  msInvModal({ title: boxType === 1 ? '整箱拆为零货' : '零货装为整箱', width: 'min(960px,96vw)', body: body,
    onOk: 'invListDoBox()', okText: '确认' });
  invListBoxBatchInfo();
}
// 拆零/装箱：选中批次后，下方实时显示该批次效期信息（与批次弹窗口径一致）
function invListBoxBatchInfo() {
  var el = document.getElementById('ilBoxBatchInfo'); if (!el) return;
  var sel = document.getElementById('ilBoxBatch'); if (!sel) return;
  if (!sel.value) { el.innerHTML = '<span style="color:#909399">该商品暂无可用批次（确认后将按 FIFO 取最早生产日期批次）</span>'; return; }
  var g = window._ilBoxMain; if (!g) return;
  var b = msInvBatchByNo(g, sel.value); if (!b) { el.innerHTML = ''; return; }
  var rm = msInvRemainDays(b.exp), rmHtml;
  if (rm === null) rmHtml = '<span style="color:#909399">— 无有效期 —</span>';
  else if (rm < 0) rmHtml = '<span style="color:#ec2d30;font-weight:600">已过期 ' + Math.abs(rm) + ' 天</span>';
  else if (rm <= 3) rmHtml = '<span style="color:#f57316;font-weight:600">剩 ' + rm + ' 天</span>';
  else rmHtml = '<span style="color:#3eb27e">剩 ' + rm + ' 天</span>';
  el.innerHTML = '生产日期 ' + (b.pdate || '—') + ' · 有效期 ' + msInvLifeText(b) + ' · 有效期至 ' + (b.exp || '—') + ' · 剩余有效期 ' + rmHtml;
}
function invListDoBox() {
  var boxType = window._ilBoxType;
  var r = window._ilBoxMain; if (!r) return;
  var bsel = document.getElementById('ilBoxBatch'), n1 = parseFloat(document.getElementById('ilBoxNum').value);
  var gsel = document.getElementById('ilBoxGoods'), n2 = parseFloat(document.getElementById('ilBoxNum2').value);
  if (!n1 || n1 <= 0 || !n2 || n2 <= 0 || !gsel.value) { msInvToast('请完整填写数量与关联商品'); return; }
  var rel = null;
  INV_GOODS.forEach(function (g) { if (g.goodsId === gsel.value) rel = g; });
  if (!rel) return;
  // 数量守恒：拆零 整箱 −n1 箱 → 散件 +n1×n2 件；装箱 散件 −n1×n2 件 → 整箱 +n1 箱
  var mainDelta = boxType === 1 ? n1 : n1 * n2;
  var relDelta = boxType === 1 ? n1 * n2 : n1;
  // 源批次：优先用所选批次号，否则 FIFO（生产日期最早）取首个有仓库库存批次
  var srcBatch = null;
  if (bsel && bsel.value) srcBatch = msInvBatchByNo(r, bsel.value);
  if (!srcBatch && r.batches && r.batches.length) {
    var avail = r.batches.filter(function (b) { return (b.w || 0) > 0; }).sort(function (a, c) {
      return String(a.pdate || '').localeCompare(String(c.pdate || ''));
    });
    if (avail.length) srcBatch = avail[0];
  }
  if (srcBatch) { if (mainDelta > (srcBatch.w || 0)) { msInvToast(r.name + ' 所选批次仓库库存不足（需 ' + mainDelta + r.unit + '）'); return; } }
  else if (mainDelta > r.warehouse) { msInvToast(r.name + ' 库存不足（需 ' + mainDelta + r.unit + '）'); return; }
  // 1) 源批次核销 + 2) 聚合变动
  if (srcBatch) srcBatch.w -= mainDelta;
  r.warehouse -= mainDelta; rel.warehouse += relDelta;
  // 3) 目标货建/累加批次，继承源批次效期（pdate/exp/shelfLife）
  if (srcBatch && srcBatch.exp) {
    if (!rel.batches) rel.batches = [];
    var exist = null;
    for (var i = 0; i < rel.batches.length; i++) {
      if ((rel.batches[i].exp || '') === (srcBatch.exp || '') && (rel.batches[i].pdate || '') === (srcBatch.pdate || '')) { exist = rel.batches[i]; break; }
    }
    var nb = { no: 'BX' + msInvToday().replace(/-/g, '') + (boxType === 1 ? 'U' : 'B') + Math.floor(Math.random() * 900 + 100),
      pdate: srcBatch.pdate || '', shelfLife: srcBatch.shelfLife != null ? srcBatch.shelfLife : null,
      shelfLifeType: srcBatch.shelfLifeType || 1, exp: srcBatch.exp, w: relDelta, s: 0 };
    msInvNormBatch(nb);
    if (exist) exist.w = (exist.w || 0) + relDelta; else rel.batches.push(nb);
  }
  invFlowAdd(boxType === 1 ? 90 : 100, r.code, r.name, -mainDelta, '仓库', '', srcBatch ? srcBatch.no : '');
  invFlowAdd(boxType === 1 ? 90 : 100, rel.code, rel.name, relDelta, '仓库', '', '');
  invListPersist(); msInvCloseModal();
  msInvToast('操作成功：' + r.name + ' −' + mainDelta + r.unit + '，' + rel.name + ' +' + relDelta + rel.unit);
  invListRender();
}
// 剩余有效期天数：exp - today（返回整数，负数=已过期）
function msInvRemainDays(exp) {
  if (!exp || exp === '—') return null;
  var a = String(exp).split('-'); if (a.length !== 3) return null;
  var t = new Date(); t.setHours(0, 0, 0, 0);
  var e = new Date(+a[0], +a[1] - 1, +a[2]);
  return Math.round((e - t) / 86400000);
}
// 批次库存弹窗（点击商品名）
function invListOpenBatch(goodsId) {
  var g = null; INV_GOODS.forEach(function (r) { if (r.goodsId === goodsId) g = r; });
  if (!g) return;
  var b = g.batches || [];
  var rows = b.length ? b.map(function (x, i) {
    var remain = msInvRemainDays(x.exp);
    var remainHtml;
    if (remain === null) remainHtml = '<span style="color:#909399">—</span>';
    else if (remain < 0) remainHtml = '<span style="color:#ec2d30;font-weight:600">已过期 ' + Math.abs(remain) + ' 天</span>';
    else if (remain <= 3) remainHtml = '<span style="color:#f57316;font-weight:600">剩 ' + remain + ' 天</span>';
    else remainHtml = '<span style="color:#3eb27e">剩 ' + remain + ' 天</span>';
    return '<tr><td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + (i + 1) + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(x.no) + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + x.w + '</td><td style="text-align:right;vertical-align:middle;padding:8px 10px">' + x.s + '</td><td style="text-align:right;vertical-align:middle;padding:8px 10px">' + (x.w + x.s) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + (x.pdate || '—') + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvLifeText(x) + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px">' + (x.exp || '—') + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px">' + remainHtml + '</td></tr>';
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:#999;padding:24px">该商品暂无批次库存</td></tr>';
  var wsum = 0, ssum = 0; b.forEach(function (x) { wsum += x.w; ssum += x.s; });
  var body = '<div style="font-size:13px;font-weight:600;color:#0b1019;margin-bottom:2px">' + msInvEsc(g.name) + '</div>' +
    '<div style="font-size:12px;color:#8a93a3;margin-bottom:12px">' + msInvEsc(g.code) + ' · ' + msInvEsc(g.spec) + '/' + g.unit + ' · 共 ' + b.length + ' 个批次（FIFO 先产先出）</div>' +
    '<div style="max-height:360px;overflow:auto"><table style="width:100%;table-layout:fixed;border-collapse:collapse">' +
    '<thead><tr><th style="width:6%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th><th style="width:14%;text-align:left;vertical-align:middle;padding:8px 10px">入库单号</th><th style="width:10%;text-align:right;vertical-align:middle;padding:8px 10px">仓库数量</th><th style="width:10%;text-align:right;vertical-align:middle;padding:8px 10px">货架数量</th><th style="width:9%;text-align:right;vertical-align:middle;padding:8px 10px">小计</th><th style="width:13%;text-align:left;vertical-align:middle;padding:8px 10px">生产日期</th><th style="width:11%;text-align:left;vertical-align:middle;padding:8px 10px">有效期</th><th style="width:13%;text-align:left;vertical-align:middle;padding:8px 10px">有效期至</th><th style="width:14%;text-align:left;vertical-align:middle;padding:8px 10px">剩余有效期</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '<tfoot><tr style="background:#f7f9fc;font-weight:600"><td colspan="2" style="text-align:right;padding:8px 10px">合计</td><td style="text-align:right;padding:8px 10px">' + wsum + '</td><td style="text-align:right;padding:8px 10px">' + ssum + '</td><td style="text-align:right;padding:8px 10px">' + (wsum + ssum) + '</td><td colspan="4" style="padding:8px 10px"></td></tr></tfoot>' +
    '</table></div>';
  msInvModal({ title: '商品批次库存', width: 'min(860px,94vw)', body: body, onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}

/* ================================================================
 * 2) 入库单 inv-entry（Vue Inventoryrecord / Warehouseentry + RKPK_STATUS）
 * ================================================================ */
var INV_ENTRY_PAGE = 1, INV_ENTRY_SIZE = 10, INV_ENTRY_ST = '', INV_ENTRY_KW = '', INV_ENTRY_SUP = '';
var INV_ENTRY_SHOP = '', INV_ENTRY_DSTART = '', INV_ENTRY_DEND = '', INV_ENTRY_SEL = '';
var INV_ENTRY_SHOPS = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
var INV_ENTRY_KEY = 'tcm_inv_entry_v2';
// 最近一次采购价（已完成入库单中该商品最新一笔进货价；无则 null）
function invEntryLastPrice(code) {
  var hit = null, hitDate = '';
  for (var i = 0; i < INV_ENTRY.length; i++) {
    var r = INV_ENTRY[i]; if (String(r.status) !== '20') continue;
    for (var j = 0; j < r.items.length; j++) {
      if (r.items[j].code === code && r.date >= hitDate) { hit = r.items[j].price; hitDate = r.date; }
    }
  }
  return hit;
}
function invEntrySeed() {
  return [
    { no: 'RK20260902001', date: '2026-09-02', storeId: 'S2001', supplier: '青浦绿蔬合作社', items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: 'RK20260901001', pdate: '2026-09-01', shelfLife: 5, shelfLifeType: 1, qty: 40, price: 2.8 }, { name: '上海青', code: '6901234500024', spec: '400g/份', batch: 'RK20260901001', pdate: '2026-09-01', shelfLife: 4, shelfLifeType: 1, qty: 88, price: 2.2 }], cost: 305.6, status: 20 },
    { no: 'RK20260901004', date: '2026-09-01', storeId: 'S2001', supplier: '淀山湖水产', items: [{ name: '草鱼', code: '6901234500086', spec: '称重', batch: 'RK20260901004', pdate: '2026-09-01', shelfLife: 2, shelfLifeType: 1, qty: 26, price: 13.2 }], cost: 343.2, status: 20 },
    { no: 'RK20260901003', date: '2026-09-01', storeId: 'S2001', supplier: '正大肉品', items: [{ name: '五花肉', code: '6901234500062', spec: '称重', batch: 'RK20260901003', pdate: '2026-09-01', shelfLife: 3, shelfLifeType: 1, qty: 42, price: 24.5 }], cost: 1029.0, status: 20 },
    { no: 'RK20260901001', date: '2026-09-01', storeId: 'S2001', supplier: '青浦绿蔬合作社', items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: 'RK20260901001', pdate: '2026-09-01', shelfLife: 5, shelfLifeType: 1, qty: 40, price: 2.8 }, { name: '上海青', code: '6901234500024', spec: '400g/份', batch: 'RK20260901001', pdate: '2026-09-01', shelfLife: 4, shelfLifeType: 1, qty: 30, price: 2.2 }], cost: 178.0, status: 20 },
    { no: 'RK20260830001', date: '2026-08-30', storeId: 'S2002', supplier: '正大肉品', items: [{ name: '土鸡蛋', code: '6901234500079', spec: '30枚/盒', batch: 'RK20260830001', pdate: '2026-08-30', shelfLife: 45, shelfLifeType: 1, qty: 35, price: 18.8 }], cost: 658.0, status: 20 },
    { no: 'RK20260903001', date: '2026-09-03', storeId: 'S2001', supplier: '益海嘉里', items: [{ name: '金龙鱼调和油', code: '6901234500109', spec: '5L/瓶', batch: 'RK20260903001', pdate: '2026-08-10', shelfLife: 540, shelfLifeType: 1, qty: 20, price: 62.0 }], cost: 1240.0, status: 10 }
  ];
}
var INV_ENTRY = [];
function invEntryLoad() {
  // 价格校验按编码查商品档案；审批页等场景不加载档案时全走「未建档豁免」→ 状态与异常说明打架，这里兜底加载
  if (typeof invListLoad === 'function' && !INV_GOODS.length) invListLoad();
  try { var r = localStorage.getItem(INV_ENTRY_KEY); if (r) { INV_ENTRY = JSON.parse(r); } else { INV_ENTRY = invEntrySeed(); invEntryPersist(); } } catch (e) { INV_ENTRY = invEntrySeed(); } invEntryDemoMerge(); invEntryDemoMerge2(); invEntryDemoMerge3(); invEntryDemoMerge4(); invDemoFixtures(); invEntrySyncPriceStatus(); }
/* 待审单据状态 ↔ 实时校验对账（每次加载都跑，幂等）：
 * 先做编码自愈（档案里查不到的编码按品名复用/建档改写，保证校验不因档案漂移整批 skip），
 * 再做安全流转——15→25（仍需审批、不碰库存）、25→15（规则收紧出现异常行）。
 * 绝不自动 15→20：那等于绕过审批"凭空入库"（库存批次只在审批动作里加）。 */
function invEntrySyncPriceStatus() {
  if (typeof msSupplyCheckEntry !== 'function') return;
  var changed = false;
  for (var i = 0; i < INV_ENTRY.length; i++) {
    var r = INV_ENTRY[i];
    if (String(r.status) !== '15' && String(r.status) !== '25') continue;
    if (typeof msInvFindGoods === 'function' && typeof spDemoEnsureGoods === 'function') {
      (r.items || []).forEach(function (it) {
        if (!msInvFindGoods(it.code)) { it.code = spDemoEnsureGoods(it.name, it.code); changed = true; }
      });
    }
    var chk = msSupplyCheckEntry(r);
    r.priceCheck = { blocks: chk.blocks, results: chk.results, at: new Date().toLocaleString('zh-CN') };
    // 存量自愈（09-11 定稿 forbid 提交端拦截）：15 且仍含 forbid 行 = 提交端拦截上线前的遗留，
    // 退回待提交（库存从未动过，安全）；定价修好后由提交人重新提交
    var syncForbids = chk.blocks.filter(function (b) { return b.action === 'forbid'; });
    if (String(r.status) === '15' && syncForbids.length) { r.status = 10; changed = true; continue; }
    if (String(r.status) === '15' && chk.pass && chk.blocks.length === 0 && String(chk.nextStatus) === '25') { r.status = 25; changed = true; }
    else if (String(r.status) === '25' && chk.blocks.length > 0) { r.status = 15; changed = true; }
  }
  if (changed) invEntryPersist();
}
/* 演示数据：五花肉 08-15 入库 @¥23.80（落在采购定价 06-01~08-31 ¥23.80 旧价段内，
 * 与 09-01 起 ¥24.50 新价构成趋势图「改价前后定价 vs 实际入库」对照）。幂等，见 ms-supply-price.js spSeedMigrateV5Demo。 */
function invEntryDemoMerge() {
  try { if (localStorage.getItem('tcm_inv_entry_demo_v1')) return; } catch (e) { return; }
  try {
    var dup = false;
    for (var i = 0; i < INV_ENTRY.length; i++) if (INV_ENTRY[i].no === 'RK20260815001') { dup = true; break; }
    if (!dup) {
      INV_ENTRY.unshift({ no: 'RK20260815001', date: '2026-08-15', storeId: 'S2001', supplier: '正大肉品', items: [{ name: '五花肉', code: '6901234500062', spec: '称重', batch: 'RK20260815001', pdate: '2026-08-15', shelfLife: 3, shelfLifeType: 1, qty: 45, price: 23.8 }], cost: 1071.0, status: 20 });
      invEntryPersist();
    }
    localStorage.setItem('tcm_inv_entry_demo_v1', '1');
  } catch (e) {}
}
function invEntryPersist() { try { localStorage.setItem(INV_ENTRY_KEY, JSON.stringify(INV_ENTRY)); } catch (e) {} }
/* 演示数据 v2（09-10）：价格审批三单对照，幂等（标记 tcm_inv_entry_demo_v2）
 * A RK…901 未定价+审核后入库：铁棍山药（定价表无此商品）→ 15 队列，走 audit 可直接批准入库
 * B RK…902 高于定价+禁止入库：五花肉 @26.80 vs 定价 24.50 → 10 待提交（forbid 提交端拦截：提交时被拦，不会进审批队列）
 * C RK…903 价格正常+待入库审核：娃娃菜 2.80 / 上海青 2.20 精确合规 → 25，批准直接入库
 * 配套：新增商品「铁棍山药 g-13」；S2001 未定价规则切「审核后入库」（A 单可批的前提） */
function invEntryDemoMerge2() {
  try { if (localStorage.getItem('tcm_inv_entry_demo_v2')) return; } catch (e) { return; }
  try {
    if (typeof invListLoad === 'function' && !INV_GOODS.length) invListLoad();
    // 新商品：铁棍山药（不进定价表 → 真·未定价；编码 6901234500130，6901234500123 已被思念水饺 g-12 占用）
    var has = false;
    for (var i = 0; i < INV_GOODS.length; i++) if (INV_GOODS[i].code === '6901234500130') { has = true; break; }
    if (!has) {
      INV_GOODS.push({ goodsId: 'g-13', name: '铁棍山药', code: '6901234500130', cat: '蔬菜', catPath: '生鲜/蔬菜/根茎/铁棍山药', grade: '', unit: 'kg', spec: '称重', sale: 1, warehouse: 0, shelf: 0, avgCost: 8.9, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [] });
      if (typeof invListPersist === 'function') invListPersist();
    }
    // S2001 未定价规则切「审核后入库」：A 单走 audit 可批，与 B 单 forbid 拦截形成对照
    if (typeof spCcGet === 'function' && typeof spCcPersist === 'function') {
      var cc = spCcGet('S2001');
      if (cc && cc.noPriceAction !== 'audit') { cc.noPriceAction = 'audit'; cc.updatedBy = '演示数据'; cc.updatedAt = new Date().toLocaleString('zh-CN'); spCcPersist(); }
    }
    var today = msInvToday();
    var d = new Date(Date.now() - 86400000);
    var yday = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var dups = {};
    for (var j = 0; j < INV_ENTRY.length; j++) dups[INV_ENTRY[j].no] = 1;
    var noA = 'RK' + today.replace(/-/g, '') + '901', noB = 'RK' + today.replace(/-/g, '') + '902', noC = 'RK' + yday.replace(/-/g, '') + '903';
    var add = [
      { no: noA, date: today, storeId: 'S2001', supplier: '青浦绿蔬合作社',
        items: [{ name: '铁棍山药', code: '6901234500130', spec: '称重', batch: noA, pdate: today, shelfLife: 30, shelfLifeType: 1, qty: 30, price: 8.9 }],
        cost: 267.0, status: 15 },
      { no: noB, date: today, storeId: 'S2001', supplier: '正大肉品',
        items: [{ name: '五花肉', code: '6901234500062', spec: '称重', batch: noB, pdate: today, shelfLife: 3, shelfLifeType: 1, qty: 42, price: 26.8 }],
        cost: 1125.6, status: 10 },
      { no: noC, date: yday, storeId: 'S2001', supplier: '青浦绿蔬合作社',
        items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: noC, pdate: yday, shelfLife: 5, shelfLifeType: 1, qty: 40, price: 2.8 },
                { name: '上海青', code: '6901234500024', spec: '400g/份', batch: noC, pdate: yday, shelfLife: 4, shelfLifeType: 1, qty: 50, price: 2.2 }],
        cost: 222.0, status: 25 }
    ];
    for (var k = 0; k < add.length; k++) if (!dups[add[k].no]) INV_ENTRY.unshift(add[k]);
    invEntryPersist();
    localStorage.setItem('tcm_inv_entry_demo_v2', '1');
  } catch (e) {}
}
/* 演示数据 v3（09-10）：多门店多场景铺量，幂等（标记 tcm_inv_entry_demo_v3）。全部用门店现有配置，不再改管控配置：
 * D1 S2002 娃娃菜@3.50（定价2.95 高+18.6%）highAction=audit → 15 可批
 * D2 S2003 娃娃菜@2.30（定价2.90 低-20.7%）lowAction=audit  → 15 可批
 * D3 S2008 娃娃菜@2.30（定价2.75 低-16.4%）lowAction=entry_only+entryAudit开 → 25 可批，同时生成低价知会
 * D4 S2010 铁棍山药@8.50 未定价+forbid → 10 待提交（forbid 提交端拦截：提交时被拦演示单，不会进审批队列）
 * D5 S2002 土鸡蛋 拒收终态（30）；D6/D7 已完成（20）铺入库单列表 */
function invEntryDemoMerge3() {
  try { if (localStorage.getItem('tcm_inv_entry_demo_v3')) return; } catch (e) { return; }
  try {
    if (typeof invListLoad === 'function' && !INV_GOODS.length) invListLoad();
    var today = msInvToday();
    function dAgo(n) { var d = new Date(Date.now() - n * 86400000); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function noOf(dateStr, seq) { return 'RK' + dateStr.replace(/-/g, '') + seq; }
    var d1 = dAgo(0), d2 = dAgo(1), d3 = dAgo(2);
    var dups = {};
    for (var j = 0; j < INV_ENTRY.length; j++) dups[INV_ENTRY[j].no] = 1;
    var noD1 = noOf(d1, '911'), noD2 = noOf(d1, '912'), noD3 = noOf(d2, '913'), noD4 = noOf(d2, '914'), noD5 = noOf(d3, '915'), noD6 = noOf(d3, '916'), noD7 = noOf(d3, '917');
    var add = [
      { no: noD1, date: d1, storeId: 'S2002', supplier: '青浦绿蔬合作社',
        items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: noD1, pdate: d1, shelfLife: 5, shelfLifeType: 1, qty: 36, price: 3.5 }],
        cost: 126.0, status: 15 },
      { no: noD2, date: d1, storeId: 'S2003', supplier: '青浦绿蔬合作社',
        items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: noD2, pdate: d1, shelfLife: 5, shelfLifeType: 1, qty: 45, price: 2.3 }],
        cost: 103.5, status: 15 },
      { no: noD3, date: d2, storeId: 'S2008', supplier: '青浦绿蔬合作社',
        items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: noD3, pdate: d2, shelfLife: 5, shelfLifeType: 1, qty: 50, price: 2.3 }],
        cost: 115.0, status: 25 },
      { no: noD4, date: d2, storeId: 'S2010', supplier: '青浦绿蔬合作社',
        items: [{ name: '铁棍山药', code: '6901234500130', spec: '称重', batch: noD4, pdate: d2, shelfLife: 30, shelfLifeType: 1, qty: 25, price: 8.5 }],
        cost: 212.5, status: 10 },
      { no: noD5, date: d3, storeId: 'S2002', supplier: '正大肉品',
        items: [{ name: '土鸡蛋', code: '6901234500079', spec: '30枚/盒', batch: noD5, pdate: d3, shelfLife: 45, shelfLifeType: 1, qty: 20, price: 18.8 }],
        cost: 376.0, status: 30 },
      { no: noD6, date: d3, storeId: 'S2002', supplier: '青浦绿蔬合作社',
        items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: noD6, pdate: d3, shelfLife: 5, shelfLifeType: 1, qty: 30, price: 2.95 }],
        cost: 88.5, status: 20 },
      { no: noD7, date: d3, storeId: 'S2003', supplier: '青浦绿蔬合作社',
        items: [{ name: '白萝卜', code: '6901234500031', spec: '称重', batch: noD7, pdate: d3, shelfLife: 7, shelfLifeType: 1, qty: 60, price: 1.6 }],
        cost: 96.0, status: 20 }
    ];
    for (var k = 0; k < add.length; k++) if (!dups[add[k].no]) INV_ENTRY.unshift(add[k]);
    invEntryPersist();
    // 低价知会：D3 的 entry_only 差异（待处理）+ 一条历史已处理
    if (typeof SP_NOTICES !== 'undefined' && typeof spNoticePersist === 'function') {
      var hasN1 = false;
      for (var m = 0; m < SP_NOTICES.length; m++) if (SP_NOTICES[m].no === noD3) { hasN1 = true; break; }
      if (!hasN1) {
        SP_NOTICES.unshift({ noticeId: 'PN' + Date.now(), no: noD3, storeId: 'S2008', supplier: '青浦绿蔬合作社',
          name: '娃娃菜', refPrice: 2.75, price: 2.3, diff: -0.45, diffPct: -16.36, skip: false, status: 10, createdAt: d2 + ' 10:24:00' });
        SP_NOTICES.unshift({ noticeId: 'PN' + (Date.now() + 1), no: noD7, storeId: 'S2003', supplier: '青浦绿蔬合作社',
          name: '白萝卜', refPrice: 1.6, price: 1.55, diff: -0.05, diffPct: -3.13, skip: false, status: 20, createdAt: d3 + ' 16:40:00' });
        spNoticePersist();
      }
    }
    localStorage.setItem('tcm_inv_entry_demo_v3', '1');
  } catch (e) {}
}
/* 演示数据 v4（09-10，09-11 随 forbid 提交端拦截调整）：一单多商品混合结果（真实采购一车货，问题不会只有一个），幂等（标记 tcm_inv_entry_demo_v4）
 * 注意：定价按「商品+门店+供应商」隔离查价，单内商品必须都是该供应商体系，否则全判未定价。
 * E1 S2001 供应商=青浦绿蔬合作社，4 个商品混三种结果（**不含 forbid 行**——forbid 单提交端就被拦，见 D4/B 单）：
 *   铁棍山药@8.90 未定价 → audit（S2001 未定价=审核后入库，audit 行可批）
 *   娃娃菜@2.80 与定价精确一致 → 合规
 *   上海青@2.00（定价2.20 低-9.1%）→ lowAction=entry_only（不阻塞，生成低价知会）
 *   白萝卜@1.60 精确合规 → 正常入库
 * 演示路径：审批队列直接批（audit 行随单放行），上海青低价知会已在提交时记录 */
function invEntryDemoMerge4() {
  try { if (localStorage.getItem('tcm_inv_entry_demo_v4')) return; } catch (e) { return; }
  try {
    if (typeof invListLoad === 'function' && !INV_GOODS.length) invListLoad();
    // 自愈：早期版本山药编码 6901234500123 与思念水饺 g-12 撞码（建档被跳过、单据错关联）——改写为新码并补建档
    var hasYam = false;
    for (var y = 0; y < INV_GOODS.length; y++) if (INV_GOODS[y].code === '6901234500130') { hasYam = true; break; }
    if (!hasYam) {
      INV_GOODS.push({ goodsId: 'g-13', name: '铁棍山药', code: '6901234500130', cat: '蔬菜', catPath: '生鲜/蔬菜/根茎/铁棍山药', grade: '', unit: 'kg', spec: '称重', sale: 1, warehouse: 0, shelf: 0, avgCost: 8.9, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [] });
      if (typeof invListPersist === 'function') invListPersist();
    }
    var codeFixed = false;
    INV_ENTRY.forEach(function (e) {
      (e.items || []).forEach(function (it) {
        if (it.name === '铁棍山药' && it.code === '6901234500123') { it.code = '6901234500130'; codeFixed = true; }
      });
    });
    if (codeFixed) invEntryPersist();
    var today = msInvToday();
    var noE1 = 'RK' + today.replace(/-/g, '') + '921';
    var dups = {};
    for (var j = 0; j < INV_ENTRY.length; j++) dups[INV_ENTRY[j].no] = 1;
    if (!dups[noE1]) {
      INV_ENTRY.unshift({ no: noE1, date: today, storeId: 'S2001', supplier: '青浦绿蔬合作社',
        items: [
          { name: '铁棍山药', code: '6901234500130', spec: '称重', batch: noE1, pdate: today, shelfLife: 30, shelfLifeType: 1, qty: 30, price: 8.9 },
          { name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: noE1, pdate: today, shelfLife: 5, shelfLifeType: 1, qty: 40, price: 2.8 },
          { name: '上海青', code: '6901234500024', spec: '400g/份', batch: noE1, pdate: today, shelfLife: 4, shelfLifeType: 1, qty: 50, price: 2.0 },
          { name: '白萝卜', code: '6901234500031', spec: '称重', batch: noE1, pdate: today, shelfLife: 7, shelfLifeType: 1, qty: 60, price: 1.6 }
        ],
        cost: 548.6, status: 15 });
      invEntryPersist();
    }
    localStorage.setItem('tcm_inv_entry_demo_v4', '1');
  } catch (e) {}
}
/* 演示数据 v6（09-11）：演示夹具——演示场景自成体系，且单据状态与实时校验同源。
 * v5 教训：gid() 按编码查不到商品时静默 return，价格一条没写、v5 标记却照常置位——
 * 之后演示单的每个商品在校验时都解析失败（skip 豁免）→ 异常说明兜底成「价格正常」，
 * 而状态还是种子写死的 15/25 →「状态=价格异常、说明=价格正常」自相矛盾。
 * v6 三层保证：
 *  ① 商品可解析：按编码找 → 按品名复用（演示单据编码同步改成档案码）→ 都没有则建档；
 *  ② 价格与管控写入场景基准（v5 逻辑沿用）；
 *  ③ 状态对账不再在这里做——invEntrySyncPriceStatus 每次 invEntryLoad 都会安全对账。
 * v7：ccPlan 补锁 uniformPrice（被关掉会让整单校验短路成「无异常」）；标记升版以便已执行过 v6 的浏览器重跑。 */
var SP_DEMO_GOODS = [
  { name: '娃娃菜', code: '6901234500017', catPath: '生鲜/蔬菜/叶菜/娃娃菜', unit: 'kg', spec: '500g/份' },
  { name: '上海青', code: '6901234500024', catPath: '生鲜/蔬菜/叶菜/上海青', unit: 'kg', spec: '400g/份' },
  { name: '白萝卜', code: '6901234500031', catPath: '生鲜/蔬菜/根茎/白萝卜', unit: 'kg', spec: '称重' },
  { name: '五花肉', code: '6901234500062', catPath: '生鲜/肉禽蛋/猪肉/五花肉', unit: 'kg', spec: '称重' },
  { name: '铁棍山药', code: '6901234500130', catPath: '生鲜/蔬菜/根茎/铁棍山药', unit: 'kg', spec: '称重' }
];
/* 商品可解析：按编码找 → 按品名复用 → 都没有则建档；返回档案中该商品实际可用的编码 */
function spDemoEnsureGoods(name, code) {
  var i;
  for (i = 0; i < INV_GOODS.length; i++) if (INV_GOODS[i].code === code) return code;
  for (i = 0; i < INV_GOODS.length; i++) if (INV_GOODS[i].name === name) return INV_GOODS[i].code;
  var meta = null;
  for (i = 0; i < SP_DEMO_GOODS.length; i++) if (SP_DEMO_GOODS[i].name === name) meta = SP_DEMO_GOODS[i];
  INV_GOODS.push({ goodsId: 'g-dm' + code.slice(-4), name: name, code: code, catPath: meta ? meta.catPath : '', grade: '', unit: meta ? meta.unit : 'kg', spec: meta ? meta.spec : '', sale: 1, warehouse: 0, shelf: 0, avgCost: 0, supplier: '', storeId: 'S2001', batches: [] });
  if (typeof invListPersist === 'function') invListPersist();
  return code;
}
function invDemoFixtures() {
  try { if (localStorage.getItem('tcm_inv_entry_demo_v7')) return; } catch (e) { return; }
  try {
    if (typeof spCcGet === 'function' && typeof spCcPersist === 'function' && typeof SP_PRICES !== 'undefined') {
      if (typeof invListLoad === 'function' && !INV_GOODS.length) invListLoad();
      function gid(code) { for (var i = 0; i < INV_GOODS.length; i++) if (INV_GOODS[i].code === code) return INV_GOODS[i].goodsId; return null; }
      function upPrice(storeId, name, code, supplier, price) {
        code = spDemoEnsureGoods(name, code);
        var g = gid(code); if (!g) return;
        var hit = null;
        for (var j = 0; j < SP_PRICES.length; j++) { var p = SP_PRICES[j]; if (p.goodsId === g && p.storeId === storeId) { hit = p; break; } }
        if (hit) {
          hit.supplier = supplier; hit.price = price; hit.effFrom = '2026-01-01';
          hit.nextPrice = ''; hit.nextEffFrom = ''; hit.nextSupplier = '';
          hit.updatedBy = '演示数据'; hit.updatedAt = msInvToday();
        } else {
          SP_PRICES.push({ priceId: 'SPD' + Date.now() + j, goodsId: g, storeId: storeId, supplier: supplier, price: price, effFrom: '2026-01-01', nextPrice: '', nextEffFrom: '', nextSupplier: '', updatedBy: '演示数据', updatedAt: msInvToday() });
        }
      }
      /* ② 场景夹具：与演示单一一对应（铁棍山药故意不定价 → 未定价场景） */
      upPrice('S2001', '娃娃菜', '6901234500017', '青浦绿蔬合作社', 2.8);   // E1 娃娃菜@3.2 → 高 forbid
      upPrice('S2001', '上海青', '6901234500024', '青浦绿蔬合作社', 2.2);   // E1 上海青@2.0 → 低 entry_only
      upPrice('S2001', '白萝卜', '6901234500031', '青浦绿蔬合作社', 1.6);   // E1 白萝卜@1.6 → 合规
      upPrice('S2001', '五花肉', '6901234500062', '正大肉品', 24.5);        // B  五花肉@26.8 → 高 forbid
      upPrice('S2002', '娃娃菜', '6901234500017', '青浦绿蔬合作社', 2.95);  // D1 娃娃菜@3.5 → 高 audit
      upPrice('S2003', '娃娃菜', '6901234500017', '青浦绿蔬合作社', 2.9);   // D2 娃娃菜@2.3 → 低 audit
      upPrice('S2008', '娃娃菜', '6901234500017', '青浦绿蔬合作社', 2.75);  // D3 娃娃菜@2.3 → 低 entry_only
      if (typeof spPersist === 'function') spPersist();
      /* 管控配置锁定到场景设计值（C 单 25 待入库审核 = S2001 entryAudit 开；uniformPrice 关掉会让校验整单短路） */
      var ccPlan = {
        S2001: { uniformPrice: true, noPriceAction: 'audit', highAction: 'forbid', lowAction: 'entry_only', entryAudit: true },
        S2002: { uniformPrice: true, noPriceAction: 'forbid', highAction: 'audit', lowAction: 'entry_only', entryAudit: false },
        S2003: { uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'audit', entryAudit: false },
        S2008: { uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'entry_only', entryAudit: true },
        S2010: { uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'entry_only', entryAudit: false }
      };
      Object.keys(ccPlan).forEach(function (sid) {
        var cc = spCcGet(sid); if (!cc) return;
        var d = ccPlan[sid], changed = false;
        for (var k in d) { if (cc[k] !== d[k]) { cc[k] = d[k]; changed = true; } }
        if (changed) { cc.updatedBy = '演示数据'; cc.updatedAt = new Date().toLocaleString('zh-CN'); }
      });
      spCcPersist();
    }
    localStorage.setItem('tcm_inv_entry_demo_v7', '1');
  } catch (e) {}
}
/* 重置演示数据：审批演完单据就变成 20/30 终态，「只能看一遍」。
 * 清掉入库单存储 + 低价知会 + 演示标记 v1~v4，刷新后种子与演示单（含 E1 多商品异常单）按原逻辑重新注入。
 * 范围仅入库/审批演示数据：采购定价表、商品档案、管控配置不动，用户练手数据保留。 */
function invDemoReset() {
  if (!confirm('将清除全部入库单与低价知会，重新注入演示数据，并把演示涉及的价格与管控配置恢复为演示基准（范围外的数据不动）。确定重置吗？')) return;
  try {
    localStorage.removeItem(INV_ENTRY_KEY);
    if (typeof SP_NOTICE_KEY !== 'undefined') localStorage.removeItem(SP_NOTICE_KEY);
    localStorage.removeItem('tcm_inv_entry_demo_v1');
    localStorage.removeItem('tcm_inv_entry_demo_v2');
    localStorage.removeItem('tcm_inv_entry_demo_v3');
    localStorage.removeItem('tcm_inv_entry_demo_v4');
    localStorage.removeItem('tcm_inv_entry_demo_v5');
    localStorage.removeItem('tcm_inv_entry_demo_v6');
    localStorage.removeItem('tcm_inv_entry_demo_v7');
  } catch (e) {}
  location.reload();
}
var INV_ENTRY_EDIT_ITEMS = [];
function invEntryInit() {
  invEntryLoad();
  var el = document.getElementById('inv-entryContent');
  if (!el) { setTimeout(invEntryInit, 80); return; }
  el.innerHTML =
    // 搜索栏（对齐 Vue 入库记录：门店 + 供应商 + 状态 + 日期范围 + 关键词）
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">门店：</span>' +
      '<select class="ic-search" style="flex:0 1 180px" id="invEntryShop" onchange="invEntrySetShop(this.value)"><option value="">全部门店</option><option value="S2001">崧泽-青浦旗舰店</option><option value="S2002">崧泽-松江分店</option></select>' +
      '<span style="font-size:12px;color:#3a4252">供应商：</span>' +
      '<select class="ic-search" style="flex:0 1 180px" id="invEntrySup" onchange="invEntrySetSup(this.value)"><option value="">全部供应商</option><option>青浦绿蔬合作社</option><option>正大肉品</option><option>淀山湖水产</option><option>益海嘉里</option><option>光明乳业</option><option>思念食品</option></select>' +
      '<span style="font-size:12px;color:#3a4252">状态：</span>' +
      '<select class="ic-search" style="flex:0 1 150px" id="invEntrySt" onchange="invEntrySetSt(this.value)"><option value="">全部状态</option><option value="10">待提交</option><option value="15">待审核-价格异常</option><option value="25">待审核-入库审核</option><option value="20">已完成</option><option value="30">已拒收</option></select>' +
      '<span style="font-size:12px;color:#3a4252">入库日期：</span>' +
      '<input type="date" class="ic-search" style="flex:0 1 150px" id="invEntryDStart" onchange="invEntrySetDate()" value="' + msInvEsc(INV_ENTRY_DSTART) + '">' +
      '<span style="font-size:12px;color:#8a93a3">至</span>' +
      '<input type="date" class="ic-search" style="flex:0 1 150px" id="invEntryDEnd" onchange="invEntrySetDate()" value="' + msInvEsc(INV_ENTRY_DEND) + '">' +
      '<input class="ic-search" style="flex:0 1 200px" placeholder="入库单号 / 商品名称" value="' + msInvEsc(INV_ENTRY_KW) + '" onkeydown="if(event.key===\'Enter\')invEntryQuery()" id="invEntryKw">' +
      '<button class="ic-btn" onclick="invEntryReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invEntryQuery()">查询</button>' +
    '</div>' +
    // 工具栏（对齐 Vue：新增 / 编辑 / 删除 / 批量导入 / 打印，行选驱动）
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invEntryOpenEdit()">+ 新增入库</button>' +
      '<button class="ic-btn" onclick="invEntryToolbarEdit()">编辑</button>' +
      '<button class="ic-btn" onclick="invEntryToolbarDel()">删除</button>' +
      '<button class="ic-btn" onclick="invEntryImport()">📥 批量导入</button>' +
      '<button class="ic-btn" onclick="invEntryToolbarPrint()">打印</button>' +
      '<button class="ic-btn" onclick="invDemoReset()" title="清除全部入库单与知会，重新注入演示单据">↺ 重置演示数据</button>' +
      '<button class="ic-btn" onclick="window.open(\'../prd.html?doc=\'+encodeURIComponent(\'价格审批模块需求说明\'),\'_blank\')" title="查看价格审批模块需求说明（PRD）">📋 需求说明</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">勾选行后可编辑/删除/打印；已完成单锁定不可修改；提交后按批次(生产日期/保质期)上架入库</span>' +
    '</div>' +
    '<div id="invEntryCard" style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="min-width:1180px">' +
        '<thead><tr><th style="width:46px"></th><th style="width:56px">序号</th><th style="width:170px">入库单号</th><th style="width:110px">入库日期</th><th style="width:150px">供应商</th><th style="width:80px">商品数</th><th style="width:160px">入库商品</th><th style="width:120px">进货成本(元)</th><th style="width:110px">价格波动</th><th style="width:100px">状态</th><th style="width:150px">门店</th></tr></thead>' +
        '<tbody id="invEntryBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invEntryPager" style="flex-shrink:0"></div>' +
    '</div>';
  invEntryRender();
}
// 弹窗固定尺寸：对齐入库单列表容器，避免商品数少时弹窗高度塌陷
function invEntryModalSize() {
  var card = document.getElementById('invEntryCard');
  var w = card ? card.clientWidth : Math.min(window.innerWidth - 260, 1200);
  var h = card ? card.clientHeight : Math.min(window.innerHeight - 120, 760);
  return { w: Math.round(w) + 'px', h: Math.round(h) + 'px' };
}
// 盘点弹框尺寸：与入库一致，跟随盘点页白卡片（invCheckCard）的固定尺寸，不随视口缩放
function invCheckModalSize() {
  var card = document.getElementById('invCheckCard');
  var w = card ? card.clientWidth : Math.min(window.innerWidth - 260, 1200);
  var h = card ? card.clientHeight : Math.min(window.innerHeight - 120, 760);
  return { w: Math.round(w) + 'px', h: Math.round(h) + 'px' };
}/* ===== 入库审核设置（审核人员模型，2026-09-12 定）=====
 * 不做操作级 RBAC（工作量过大）；改为「审核开启时指定审核人员」的轻量模型。
 * 「是否开启审核」沿用已有的按门店 entryAudit 开关（ms-supply-price.js 驱动状态机 25/20）；
 * 此处只管「审核人」是谁。demo 不校验权限——仅记录审核人，作为审批的控制点（真实后端按此校验谁能审批）。
 * INV_AUDIT.approvers：审核人 userId 列表（取自 SY_USERS）。 */
var INV_AUDIT_KEY = 'tcm_inv_audit_cfg_v1';
var INV_AUDIT = { approvers: [] };
function invAuditLoad() {
  try { var r = localStorage.getItem(INV_AUDIT_KEY); if (r) { INV_AUDIT = JSON.parse(r); return; } } catch (e) {}
  INV_AUDIT = { approvers: [] };
}
function invAuditSave() { try { localStorage.setItem(INV_AUDIT_KEY, JSON.stringify(INV_AUDIT)); } catch (e) {} }
function invAuditNames() {
  if (!INV_AUDIT.approvers.length) return '';
  if (typeof SY_USERS === 'undefined') return '';
  return INV_AUDIT.approvers.map(function (uid) {
    var u = SY_USERS.filter(function (x) { return x.userId === uid; })[0];
    return u ? u.userName : uid;
  }).join('、');
}
function invAuditOpen() {
  invAuditLoad();
  if (typeof syUsrLoad === 'function') syUsrLoad();
  var users = (typeof SY_USERS !== 'undefined') ? SY_USERS : [];
  var opts = users.map(function (u) {
    var on = INV_AUDIT.approvers.indexOf(u.userId) >= 0;
    return '<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid #e9eef7;border-radius:4px;cursor:pointer">' +
      '<input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="invAuditToggle(\'' + u.userId + '\',this.checked)"> ' +
      '<span style="font-size:13px">' + msInvEsc(u.userName) + '</span>' +
      '<span style="font-size:12px;color:#8a93a3">（' + msInvEsc(u.userAccount) + '）</span></label>';
  }).join('');
  msInvModal({
    title: '入库审核设置', width: '560px',
    body: '<div style="font-size:13px;color:#5b6472;line-height:1.7">' +
      '<div style="font-size:12px;color:#8a93a3;margin-bottom:12px">「是否开启审核」按门店在采购定价管控设置中配置（entryAudit）；此处指定可审批的审核人。提交进入「待审核」的入库单将记录以下审核人（demo 不校验权限，仅作控制点展示）</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' + opts + '</div>' +
    '</div>',
    okText: '保存', cancelText: '取消', onOk: 'invAuditSaveModal()'
  });
}
function invAuditToggle(uid, on) {
  if (on) { if (INV_AUDIT.approvers.indexOf(uid) < 0) INV_AUDIT.approvers.push(uid); }
  else { INV_AUDIT.approvers = INV_AUDIT.approvers.filter(function (x) { return x !== uid; }); }
}
function invAuditSaveModal() {
  invAuditSave();
  msInvCloseModal();
  msInvToast('入库审核设置已保存（审核人：' + (invAuditNames() || '未选择') + '）');
}
function invEntryRows() {
  var rows = msInvScopeFilter(INV_ENTRY);
  if (INV_ENTRY_SHOP) rows = rows.filter(function (r) { return r.storeId === INV_ENTRY_SHOP; });
  if (INV_ENTRY_ST) rows = rows.filter(function (r) { return String(r.status) === INV_ENTRY_ST; });
  if (INV_ENTRY_SUP) rows = rows.filter(function (r) { return r.supplier === INV_ENTRY_SUP; });
  if (INV_ENTRY_DSTART) rows = rows.filter(function (r) { return r.date >= INV_ENTRY_DSTART; });
  if (INV_ENTRY_DEND) rows = rows.filter(function (r) { return r.date <= INV_ENTRY_DEND; });
  if (INV_ENTRY_KW) { var kw = INV_ENTRY_KW.toLowerCase(); rows = rows.filter(function (r) { return r.no.toLowerCase().indexOf(kw) > -1 || r.items.some(function (it) { return it.name.indexOf(kw) > -1; }); }); }
  return rows;
}
function invEntryRender() {
  var rows = invEntryRows(), tbody = document.getElementById('invEntryBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_ENTRY_SIZE) || 1;
  if (INV_ENTRY_PAGE > pages) INV_ENTRY_PAGE = pages; if (INV_ENTRY_PAGE < 1) INV_ENTRY_PAGE = 1;
  var start = (INV_ENTRY_PAGE - 1) * INV_ENTRY_SIZE, data = rows.slice(start, start + INV_ENTRY_SIZE);
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1;
    var st = msInvEntryStatusBadge(r.status);
    var names = r.items.map(function (it) { return it.name + '×' + it.qty; }).join('、');
    var sel = (INV_ENTRY_SEL === r.no) ? ' checked' : '';
    var bg = (INV_ENTRY_SEL === r.no) ? 'background:#eef4ff' : '';
    return '<tr style="' + bg + '">' +
      '<td style="text-align:center"><input type="radio" name="invEntrySel" value="' + r.no + '"' + sel + ' onchange="invEntrySelectRow(\'' + r.no + '\')"></td>' +
      '<td style="text-align:center;color:#999">' + seq + '</td>' +
      '<td><a style="color:#1677ff;cursor:pointer" onclick="' + (String(r.status) === '10' ? 'invEntryOpenEdit' : 'invEntryOpenView') + '(\'' + r.no + '\')">' + msInvEsc(r.no) + '</a></td>' +
      '<td>' + r.date + '</td><td>' + msInvEsc(r.supplier) + '</td>' +
      '<td style="text-align:center">' + r.items.length + '</td>' +
      '<td><span style="color:#5b6472;font-size:12px" title="' + msInvEsc(names) + '">' + msInvEsc(names.slice(0, 18)) + (names.length > 18 ? '…' : '') + '</span></td>' +
      '<td style="text-align:right;font-weight:600">¥' + r.cost.toFixed(2) + '</td>' +
      '<td>' + invEntryFluctCell(r) + '</td>' +
      '<td>' + st + '</td>' +
      '<td>' + (INV_ENTRY_SHOPS[r.storeId] || r.storeId) + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="11" style="text-align:center;color:#999;padding:36px 0">暂无入库记录</td></tr>';
  msInvPager(total, INV_ENTRY_PAGE, INV_ENTRY_SIZE, 'invEntryPager', 'invEntryGoPage');
}
/* ===== 入库单状态机：10 待提交 / 15 待审核-价格异常 / 20 已完成 / 25 待审核-入库审核 / 30 已拒收 ===== */
function msInvEntryStatusBadge(st) {
  // 2026-09-12 调整：价格异常/入库审核都是「待审核」的子情况，不再把「价格异常」作为一级状态
  var m = { '10': ['待提交', 'warn'], '15': ['待审核', 'warn'], '20': ['已完成', 'ok'], '25': ['待审核', 'warn'], '30': ['已拒收', 'err'] };
  var v = m[String(st)] || ['待提交', 'warn'];
  return msInvBadge(v[0], v[1]);
}
/* ===== 提醒位置③：列表「价格波动」列——采购经理每天看的是列表，不点详情也要能看到 ===== */
function invEntryFluctCell(r) {
  if (typeof msSupplyCheckItem !== 'function') return '<span style="color:#8a93a3">—</span>';
  var worst = null, cnt = 0;
  (r.items || []).forEach(function (it) {
    var x = msSupplyCheckItem(it, r.supplier, r.storeId, r.date);
    if (x.level === 'ok' || x.level === 'skip') return;
    cnt++;
    if (!worst || Math.abs(x.diffPct) > Math.abs(worst.diffPct)) worst = x;
  });
  if (!worst) return '<span style="color:#8a93a3">—</span>';
  return spFluctText(worst) + (cnt > 1 ? '<span style="color:#8a93a3;font-size:11px"> 等' + cnt + '项</span>' : '');
}
function invEntryGoPage(p) { INV_ENTRY_PAGE = p; invEntryRender(); }
function invEntrySetSup(v) { INV_ENTRY_SUP = v; INV_ENTRY_SEL = ''; INV_ENTRY_PAGE = 1; invEntryRender(); }
function invEntrySetSt(v) { INV_ENTRY_ST = v; INV_ENTRY_SEL = ''; INV_ENTRY_PAGE = 1; invEntryRender(); }
function invEntrySetShop(v) { INV_ENTRY_SHOP = v; INV_ENTRY_SEL = ''; INV_ENTRY_PAGE = 1; invEntryRender(); }
function invEntrySetDate() {
  var s = document.getElementById('invEntryDStart'), e = document.getElementById('invEntryDEnd');
  INV_ENTRY_DSTART = s ? s.value : ''; INV_ENTRY_DEND = e ? e.value : '';
  INV_ENTRY_SEL = ''; INV_ENTRY_PAGE = 1; invEntryRender();
}
// 行选（对齐 Vue 单选驱动工具栏 编辑/删除/打印）
function invEntrySelectRow(no) { INV_ENTRY_SEL = no; invEntryRender(); }
function invEntryQuery() { var el = document.getElementById('invEntryKw'); if (el) INV_ENTRY_KW = el.value.trim(); INV_ENTRY_PAGE = 1; invEntryRender(); }
function invEntryReset() { INV_ENTRY_KW = ''; INV_ENTRY_SUP = ''; INV_ENTRY_ST = ''; INV_ENTRY_SHOP = ''; INV_ENTRY_DSTART = ''; INV_ENTRY_DEND = ''; INV_ENTRY_SEL = ''; INV_ENTRY_PAGE = 1;
  var a = document.getElementById('invEntryKw'); if (a) a.value = '';
  var b = document.getElementById('invEntrySup'); if (b) b.value = '';
  var c = document.getElementById('invEntrySt'); if (c) c.value = '';
  var sh = document.getElementById('invEntryShop'); if (sh) sh.value = '';
  var ds = document.getElementById('invEntryDStart'); if (ds) ds.value = '';
  var de = document.getElementById('invEntryDEnd'); if (de) de.value = '';
  invEntryRender();
}
function invEntryNextNo() {
  var d = new Date(), y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
  return 'RK' + y + m + dd + String(100 + Math.floor(Math.random() * 900));
}
function invEntryOpenEdit(no) {
  var r = null;
  if (no) { INV_ENTRY.forEach(function (x) { if (x.no === no) r = x; }); }
  INV_ENTRY_EDIT_ITEMS = r ? invEntryItemsToDates(r.items) : [];
  window._ieNo = r ? r.no : invEntryNextNo();
  window._ieSup = r ? r.supplier : '青浦绿蔬合作社';
  window._ieStore = r ? r.storeId : msInvScopeStoreId('S2001');
  window._ieDate = r ? r.date : msInvToday();
  window._ieStatus = r ? String(r.status) : '10';
  invEntryEditRender();
}
function invEntryPriceCell(it, i) {
  var supplier = window._ieSup || '', storeId = window._ieStore || 'S2001', date = window._ieDate || '';
  // 提醒位置①：录入时实时对比**定价**（不是最近采购价——最近价≠协议价，不可信）；进货价为商品级共享
  var h = (typeof spHintHtml === 'function') ? spHintHtml({ name: it.name, code: it.code, price: it.price }, supplier, storeId, date) : { html: '', level: 'ok' };
  var last = invEntryLastPrice(it.code);
  var lastTxt = last != null ? '<div style="color:#8a93a3;font-size:11px;margin-top:2px">最近 ¥' + last.toFixed(2) + '</div>' : '';
  // 对齐 Vue price-above-last：新录入进货价高于最近采购价时，文字标红（边框仍由定价差异决定）
  var above = last != null && it.price != null && it.price !== '' && Number(it.price) > last;
  var bd = h.level === 'high' ? 'color:#fc4b52;border-color:#fc4b52' : ((h.level === 'low' || h.level === 'none') ? 'color:#d48806;border-color:#d48806' : '');
  if (above && h.level !== 'high') bd = 'color:#fc4b52;' + bd;
  // 进货价：商品级共享（同一批货采购价基本一致），rowspan 跨该商品所有生产日期行
  return '<td rowspan="' + (it.dates ? it.dates.length : 1) + '" style="vertical-align:middle"><input id="ie_price_' + i + '" type="number" min="0" step="0.01" class="ic-search" style="width:110px;height:28px;' + bd + '" value="' + (it.price == null ? '' : it.price) + '" oninput="invEntryRecalc();invEntryPriceHint(' + i + ')">' +
    '<div id="ie_hint_' + i + '" style="margin-top:4px;font-size:11px;line-height:16px">' + h.html + lastTxt + '</div></td>';
}
// 价格改动时实时刷新提示（不重渲染整表，避免输入框失焦）；商品级共享
function invEntryPriceHint(i) {
  var el = document.getElementById('ie_hint_' + i), p = document.getElementById('ie_price_' + i);
  var it = INV_ENTRY_EDIT_ITEMS[i];
  if (!el || !p || !it || typeof spHintHtml !== 'function') return;
  var v = parseFloat(p.value);
  if (isNaN(v)) { el.innerHTML = '<span style="color:#8a93a3;font-size:11px">请输入进货价</span>'; return; }
  var h = spHintHtml({ name: it.name, code: it.code, price: v }, window._ieSup || '', window._ieStore || 'S2001', window._ieDate || '');
  el.innerHTML = h.html;
  // 高于最近采购价 → 文字标红（对齐 Vue price-above-last）；边框跟随定价差异
  var last = invEntryLastPrice(it.code);
  if (last != null && v > last) { p.style.color = '#fc4b52'; }
  else p.style.color = h.level === 'high' ? '#fc4b52' : ((h.level === 'low' || h.level === 'none') ? '#d48806' : '');
  p.style.borderColor = h.level === 'high' ? '#fc4b52' : ((h.level === 'low' || h.level === 'none') ? '#d48806' : '');
}
function invEntryEditRender() {
  var storeLabel = msInvScopeStoreLabel();
  var isView = String(window._ieStatus) === '20' || String(window._ieStatus) === '30';
  var isExist = false; INV_ENTRY.forEach(function (x) { if (x.no === window._ieNo) isExist = true; });
  var rowsHtml = INV_ENTRY_EDIT_ITEMS.length ? INV_ENTRY_EDIT_ITEMS.map(function (it, i) {
    var dates = it.dates || [{}];
    var n = dates.length;
    // 效期管理：商品级标记（入库选商品时继承 INV_GOODS.expiryManaged；编辑已存单时回查商品主数据）
    var expOn = it.expiryManaged === true || ((msInvFindGoods(it.code) || {}).expiryManaged === true);
    var reqMark = expOn ? '<span style="color:#fc4b52;margin-right:2px">*</span>' : '';
    return dates.map(function (d, j) {
      var exp = d.exp || msInvCalcExp(d.pdate, d.shelfLife, d.shelfLifeType);
      var pv = it.price, qv = d.qty;
      var subTxt = (qv !== '' && qv != null && !isNaN(qv) && qv > 0 && pv != null && pv !== '' && !isNaN(pv) && pv >= 0) ? '¥' + (qv * pv).toFixed(2) : '—';
      // 商品名称/编码/规格/序号/进货价 首个生产日期合并(rowspan)，并露出「+ 添加生产日期」入口
      var headTd = (j === 0)
        ? '<td rowspan="' + n + '" style="text-align:center;color:#999;vertical-align:middle">' + (i + 1) + '</td>' +
          '<td rowspan="' + n + '" style="vertical-align:middle"><b>' + msInvEsc(it.name) + '</b><input type="hidden" id="ie_name_' + i + '" value="' + msInvEsc(it.name) + '">' +
            '<div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span style="display:inline-block;font-size:11px;color:#1677ff;background:#f0f6ff;border:1px dashed #91caff;border-radius:2px;padding:1px 8px;cursor:pointer;white-space:nowrap" onclick="invEntryAddDate(' + i + ')">＋ 添加生产日期</span>' + (expOn ? '<span style="font-size:11px;color:#0b7a52;background:#e8f7ef;border:1px solid #b7ebcf;border-radius:2px;padding:1px 5px;white-space:nowrap">效期管理</span>' : '') + '</div></td>' +
          '<td rowspan="' + n + '">' + msInvEsc(it.code) + '</td>' +
          '<td rowspan="' + n + '">' + msInvEsc(it.spec) + '</td>'
        : '';
      // 进货价：商品级共享（同一批货采购价基本一致），仅首个生产日期渲染(rowspan)
      var priceTd = (j === 0) ? invEntryPriceCell(it, i) : '';
      var opTd = (j === 0)
        ? '<a style="color:#1677ff;cursor:pointer;font-size:12px;white-space:nowrap" onclick="invEntryRemoveItem(' + i + ')">移除</a>'
        : '<a style="color:#1677ff;cursor:pointer;font-size:12px;white-space:nowrap" onclick="invEntryRemoveDate(' + i + ',' + j + ')">删除日期</a>';
      var dateLabel = n > 1 ? '<span style="display:inline-block;font-size:11px;color:#5b6472;background:#f1f2f5;border-radius:2px;padding:0 6px;height:20px;line-height:20px;margin-right:6px;vertical-align:middle">日期' + (j + 1) + '</span>' : '';
      return '<tr style="border-bottom:1px solid #f0f3fa">' + headTd + priceTd +
        '<td style="white-space:nowrap;vertical-align:middle">' + dateLabel + '<input id="ie_qty_' + i + '_' + j + '" type="number" min="0" step="0.001" class="ic-search" style="width:84px;height:28px" placeholder="入库数量" value="' + (d.qty == null ? '' : d.qty) + '" oninput="invEntryRecalc()"></td>' +
        '<td style="text-align:right;font-weight:600;color:#0b1019;vertical-align:middle" id="ie_sub_' + i + '_' + j + '">' + subTxt + '</td>' +
        '<td style="white-space:nowrap;vertical-align:middle">' + reqMark + '<input id="ie_pdate_' + i + '_' + j + '" type="date" class="ic-search" style="width:120px;height:28px" value="' + (d.pdate || '') + '" onchange="invEntryRecalc()"></td>' +
        '<td style="white-space:nowrap;vertical-align:middle">' + reqMark + '<input id="ie_life_' + i + '_' + j + '" type="number" min="0" step="1" class="ic-search" style="width:58px;height:28px" placeholder="保质期" value="' + (d.shelfLife != null && d.shelfLife !== '' ? d.shelfLife : '') + '" oninput="invEntryLifeInput(this,' + i + ',' + j + ')" onkeydown="return msInvIntKey(event)">' +
          '<select class="ic-search" style="width:60px;height:28px;margin-left:4px" id="ie_lifet_' + i + '_' + j + '" onchange="invEntryRecalc()">' +
          '<option value="1"' + (d.shelfLifeType === 2 ? '' : ' selected') + '>天</option><option value="2"' + (d.shelfLifeType === 2 ? ' selected' : '') + '>月</option><option value="3"' + (d.shelfLifeType === 3 ? ' selected' : '') + '>年</option>' +
          '</select></td>' +
        '<td style="color:#0b1019;font-size:12px;white-space:nowrap;vertical-align:middle" id="ie_exp_' + i + '_' + j + '">' + (exp || '<span style="color:#c0c4cc">—</span>') + '</td>' +
        '<td style="vertical-align:middle">' + opTd + '</td></tr>';
    }).join('');
  }).join('') : '<tr><td colspan="11" style="text-align:center;color:#999;padding:24px">尚未添加商品</td></tr>';
  var body =
    '<div style="display:flex;flex-direction:column;height:100%">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px 24px;margin-bottom:12px;font-size:12px;flex-shrink:0">' +
        '<div style="color:#5b6472">门店：<b style="color:#0b1019">' + (window._ieStore === 'S2002' ? '崧泽-松江分店' : (storeLabel === '全部门店' ? '崧泽-青浦旗舰店' : storeLabel)) + '</b></div>' +
        '<div style="color:#5b6472">供应商：<select class="ic-search" style="height:26px;padding:2px 8px;width:150px" id="ieSup" onchange="window._ieSup=this.value">' +
          '<option>青浦绿蔬合作社</option><option>正大肉品</option><option>淀山湖水产</option><option>益海嘉里</option><option>光明乳业</option><option>思念食品</option><option>崧泽基地直供</option><option>山东栖霞直供</option>' +
        '</select></div>' +
        '<div style="color:#5b6472">入库单号：<b style="color:#0b1019">' + window._ieNo + '</b><span style="color:#8a93a3">（系统生成）</span></div>' +
        '<div style="color:#5b6472">入库日期：<b style="color:#0b1019">' + window._ieDate + '</b><span style="color:#8a93a3">（系统生成）</span></div>' +
        '<div style="color:#5b6472">状态：' + msInvEntryStatusBadge(window._ieStatus) + '</div>' +
      '</div>' +
      '<div style="margin-bottom:8px;flex-shrink:0"><button class="ic-btn ic-btn-pri" onclick="invEntryPickGoods()">添加商品</button>' +
        '<span style="font-size:12px;color:#8a93a3;margin-left:10px" id="ieHint">保质期单位：天/月/年；保质期至 = 生产日期 + 保质期自动计算；<b style="color:#fc4b52">标 * 的效期管理商品，生产日期与保质期必填</b></span></div>' +
      '<div style="flex:1;min-height:0;overflow:auto;border:1px solid #e9eef7;border-radius:4px 4px 0 0"><table style="width:100%;min-width:1120px">' +
        '<thead><tr><th style="width:46px">序号</th><th>商品名称</th><th style="width:100px">编码/条码</th><th style="width:84px">商品规格</th><th style="width:160px">进货价(元)</th><th style="width:88px">入库数量</th><th style="width:130px">生产日期</th><th style="width:132px">保质期</th><th style="width:110px">保质期至</th><th style="width:100px">小计</th><th style="width:88px">操作</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table></div>' +
      '<div style="flex-shrink:0;display:flex;justify-content:flex-end;align-items:center;padding:10px 12px;border:1px solid #e9eef7;border-top:none;border-radius:0 0 4px 4px;background:#f7f9fc">' +
        '<span style="font-size:12px;color:#5b6472">合计金额</span>' +
        '<span style="font-size:13px;font-weight:600;color:#d4380d;margin-left:12px" id="ieTotal">¥0.00</span>' +
      '</div>' +
    '</div>';
  var sz = invEntryModalSize();
  msInvModal({ title: isView ? '查看入库单' : (isExist ? '编辑入库单' : '新增入库单'), width: sz.w, height: sz.h, bodyStyle: 'overflow:hidden;', body: body, footer: false });
  var supSel = document.getElementById('ieSup'); if (supSel) supSel.value = window._ieSup;
  invEntryRecalc();
  // 底部按钮组对齐 Vue Warehouseentry：查看=返回；编辑=取消 / 保存入库单(暂存) / 提交入库
  var foot = document.createElement('div'); foot.className = 'ic-modal-footer'; foot.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
  if (isView) {
    foot.innerHTML = '<span style="flex:1;font-size:12px;color:#8a93a3;align-self:center">已完成入库单不可修改，如需打印请在列表操作列选择「打印」</span>' +
      '<button class="btn-secondary" onclick="msInvCloseModal()">返回</button>';
  } else {
    foot.innerHTML = '<span style="flex:1;font-size:12px;color:#8a93a3;align-self:center">保存入库单=暂存待提交；提交入库=校验定价后库存生效、不可再改</span>' +
      '<button class="btn-secondary" onclick="msInvCloseModal()">取消</button>' +
      '<button class="btn-secondary" onclick="invEntrySaveDraft()">保存入库单</button>' +
      '<button class="btn-primary" onclick="invEntrySaveCommit()">提交入库</button>';
  }
  var m = document.getElementById('msInvModal'); if (m) m.appendChild(foot);
}
// 保质期输入：仅正整数，0 或空清空（对齐 Vue handleShelfLifeInput），随后联动重算保质期至
function invEntryLifeInput(el, i, j) {
  var cleaned = String(el.value == null ? '' : el.value).replace(/\D/g, '');
  el.value = (cleaned === '' || Number(cleaned) === 0) ? '' : cleaned;
  invEntryRecalc();
}
// 只允许整数键
function msInvIntKey(ev) {
  var k = ev.key; if (k === 'Backspace' || k === 'Delete' || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Tab') return true;
  if (/^\d$/.test(k)) return true; return false;
}
function invEntryRecalc() {
  var total = 0;
  INV_ENTRY_EDIT_ITEMS.forEach(function (it, i) {
    var p = document.getElementById('ie_price_' + i);
    var pv = p ? parseFloat(p.value) : it.price;
    // 进货价：商品级共享，逐商品读一次
    var okP = !isNaN(pv) && pv >= 0;
    if (okP) it.price = pv;
    (it.dates || []).forEach(function (d, j) {
      var q = document.getElementById('ie_qty_' + i + '_' + j);
      var pd = document.getElementById('ie_pdate_' + i + '_' + j), lf = document.getElementById('ie_life_' + i + '_' + j), lft = document.getElementById('ie_lifet_' + i + '_' + j);
      var expEl = document.getElementById('ie_exp_' + i + '_' + j), sub = document.getElementById('ie_sub_' + i + '_' + j);
      var qv = q ? parseFloat(q.value) : d.qty;
      // 对齐 Vue handleAmountChange：数量未填时金额置空，不显示 ¥NaN
      var okQ = !isNaN(qv) && qv > 0;
      if (okQ) d.qty = qv;
      // 小计 = 数量 × 商品级共享进货价（同一批货采购价基本一致）
      var s = (okQ ? qv : 0) * (okP ? pv : 0); total += s;
      if (sub) sub.textContent = (okQ && okP) ? '¥' + s.toFixed(2) : '—';
      // 保质期联动：pdate + life + unit → exp
      if (pd && lf && lft && expEl) {
        var exp = msInvCalcExp(pd.value, lf.value, lft.value);
        expEl.innerHTML = exp || '<span style="color:#c0c4cc">—</span>';
        d.pdate = pd.value; d.shelfLife = lf.value !== '' ? parseInt(lf.value, 10) : null; d.shelfLifeType = parseInt(lft.value, 10) || 1; d.exp = exp;
      }
    });
  });
  var t = document.getElementById('ieTotal'); if (t) t.textContent = '¥' + total.toFixed(2);
  window._ieTotal = total;
}
function invEntryRemoveItem(i) { INV_ENTRY_EDIT_ITEMS.splice(i, 1); invEntryEditRender(); }
// 删除某一生产日期（删除后该商品无日期则整行移除）
function invEntryRemoveDate(i, j) {
  var it = INV_ENTRY_EDIT_ITEMS[i]; if (!it || !it.dates) return;
  it.dates.splice(j, 1);
  if (!it.dates.length) INV_ENTRY_EDIT_ITEMS.splice(i, 1);
  invEntryEditRender();
}
// 为某商品追加一个生产日期（复制首批次的默认生产日期/保质期，进货价随商品级共享，方便同品多日期快速录入）
function invEntryAddDate(i) {
  var it = INV_ENTRY_EDIT_ITEMS[i]; if (!it) return;
  if (!it.dates) it.dates = [{}];
  var base = it.dates[0] || {};
  it.dates.push({ pdate: base.pdate || msInvToday(), shelfLife: base.shelfLife != null ? base.shelfLife : null, shelfLifeType: base.shelfLifeType || 1, exp: '', qty: '' });
  invEntryEditRender();
}
// 平铺 items（每 item 含 pdate/qty/price 单生产日期）→ 按 code 聚合：price 提到商品级，dates 数组承载多生产日期（编辑态用）
function invEntryItemsToDates(items) {
  var byCode = {}, order = [];
  (items || []).forEach(function (it) {
    if (!byCode[it.code]) { byCode[it.code] = { name: it.name, code: it.code, spec: it.spec, price: it.price, dates: [] }; order.push(it.code); }
    byCode[it.code].dates.push({ pdate: it.pdate || '', shelfLife: it.shelfLife != null ? it.shelfLife : null, shelfLifeType: it.shelfLifeType || 1, exp: it.exp || '', qty: it.qty });
  });
  return order.map(function (c) { return byCode[c]; });
}
/* 选择商品（对齐 Vue addGoods 弹窗）：分类筛选 + 关键词 + 多选表格；已添加的商品置灰去重 */
function invEntryPickGoods() {
  var cats = [], seen = {};
  INV_GOODS.forEach(function (g) { if (g.catPath && !seen[g.catPath]) { seen[g.catPath] = 1; cats.push(g.catPath); } });
  cats.sort();
  var body =
    '<div style="display:flex;gap:8px;margin-bottom:8px">' +
      '<select class="ic-search" style="flex:0 0 220px" id="iePickCat" onchange="invEntryPickRows()"><option value="">全部分类</option>' +
        cats.map(function (c) { return '<option value="' + msInvEsc(c) + '">' + msInvEsc(c) + '</option>'; }).join('') + '</select>' +
      '<input class="ic-search" style="flex:1" placeholder="名称或编码" id="iePickKw" oninput="invEntryPickRows()">' +
    '</div>' +
    '<div style="max-height:300px;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%">' +
      '<thead><tr><th style="width:70px"></th><th>商品名称</th><th style="width:130px">编码/条码</th><th style="width:110px">商品规格</th></tr></thead>' +
      '<tbody id="iePickBody"></tbody></table></div>' +
    '<div style="font-size:12px;color:#8a93a3;margin-top:6px">加入明细时自动去重，并回填最近采购价作为默认进货价</div>';
  msInvModal({ title: '选择商品', width: 'min(760px,94vw)', body: body, onOk: 'invEntryPickOk()', okText: '加入明细' });
  invEntryPickRows();
}
function invEntryPickRows() {
  var body = document.getElementById('iePickBody'); if (!body) return;
  var catEl = document.getElementById('iePickCat'), kwEl = document.getElementById('iePickKw');
  var cat = catEl ? catEl.value : '', kw = kwEl ? kwEl.value.trim().toLowerCase() : '';
  var rows = INV_GOODS.filter(function (g) {
    if (cat && g.catPath !== cat) return false;
    if (kw && (g.name + (g.code || '')).toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
  body.innerHTML = rows.length ? rows.map(function (g) {
    var dup = INV_ENTRY_EDIT_ITEMS.some(function (it) { return it.code === g.code; });
    return '<tr' + (dup ? ' style="color:#c0c4cc"' : '') + '>' +
      '<td style="text-align:center">' + (dup ? '<span style="font-size:11px">已添加</span>' : '<input type="checkbox" class="ie-pick-chk" value="' + g.goodsId + '" style="width:14px;height:14px">') + '</td>' +
      '<td>' + msInvEsc(g.name) + '</td><td>' + msInvEsc(g.code) + '</td><td>' + msInvEsc(g.spec) + '</td></tr>';
  }).join('') : '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px 0">没有符合条件的商品</td></tr>';
}
function invEntryPickOk() {
  var picked = [];
  Array.prototype.forEach.call(document.querySelectorAll('.ie-pick-chk'), function (cb) { if (cb.checked) picked.push(cb.value); });
  if (!picked.length) { msInvToast('请勾选商品'); return; }
  picked.forEach(function (gid) {
    var g = null; INV_GOODS.forEach(function (x) { if (x.goodsId === gid) g = x; });
    if (!g) return;
    var last = invEntryLastPrice(g.code);
    // 对齐 Vue onConfirm：数量/金额留空待填，进货价预填最近采购价；单品默认一个生产日期（支持「＋ 添加生产日期」多生产日期），进货价商品级共享
    INV_ENTRY_EDIT_ITEMS.push({ name: g.name, code: g.code, spec: (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit, price: (last != null ? last : g.avgCost), expiryManaged: g.expiryManaged === true, dates: [ { pdate: msInvToday(), shelfLife: null, shelfLifeType: 1, exp: '', qty: '' } ] });
  });
  msInvCloseModal(); invEntryEditRender();
}
function invEntrySaveDraft() { invEntrySave(10); }
function invEntrySaveCommit() { invEntrySave(20); }
function invEntrySave(status) {
  if (!INV_ENTRY_EDIT_ITEMS.length) { msInvToast('请先添加入库商品'); return; }
  // 行级校验（对齐 Vue handleSave）：同一商品可多生产日期；进货价为商品级共享、逐商品校验一次；数量逐日期校验、必填>0（称重最多3位小数 / 非称重整数）；进货价选填，填了须≥0且最多2位小数
  var firstErr = '';
  INV_ENTRY_EDIT_ITEMS.forEach(function (it, i) {
    var p = document.getElementById('ie_price_' + i);
    if (p) p.style.borderColor = '';
    var pRaw = p ? String(p.value).trim() : '';
    var pv = parseFloat(pRaw);
    // 进货价：商品级共享，逐商品校验一次
    if (pRaw !== '') {
      if (isNaN(pv) || pv < 0) { if (!firstErr) firstErr = (it.name + '：进货价必须大于等于0'); if (p) p.style.borderColor = '#fc4b52'; }
      else if (!/^\d+(\.\d{1,2})?$/.test(pRaw)) { if (!firstErr) firstErr = (it.name + '：进货价最多保留 2 位小数'); if (p) p.style.borderColor = '#fc4b52'; }
    }
    // 效期管理：商品级标记（继承 INV_GOODS.expiryManaged；编辑已存单回查主数据）；效期管理商品生产日期+保质期必填
    var expOn = it.expiryManaged === true || ((msInvFindGoods(it.code) || {}).expiryManaged === true);
    (it.dates || []).forEach(function (d, j) {
      var q = document.getElementById('ie_qty_' + i + '_' + j);
      if (q) q.style.borderColor = '';
      if (expOn) {
        var pdEl = document.getElementById('ie_pdate_' + i + '_' + j), lfEl = document.getElementById('ie_life_' + i + '_' + j);
        if (!pdEl || !pdEl.value) { if (!firstErr) firstErr = (it.name + '（效期管理商品）：必须填写生产日期'); if (pdEl) pdEl.style.borderColor = '#fc4b52'; }
        if (!lfEl || lfEl.value === '') { if (!firstErr) firstErr = (it.name + '（效期管理商品）：必须填写保质期'); if (lfEl) lfEl.style.borderColor = '#fc4b52'; }
      }
      var qRaw = q ? String(q.value).trim() : '';
      var qv = parseFloat(qRaw);
      var qBad = false;
      if (qRaw === '' || isNaN(qv) || qv <= 0) {
        qBad = true; if (!firstErr) firstErr = (it.name + (d.pdate ? '（生产日期 ' + d.pdate + '）' : '') + '：入库数量不能为空且必须大于0');
      } else if (/^称重/.test(it.spec || '')) {
        if (!/^\d+(\.\d{1,3})?$/.test(qRaw)) { qBad = true; if (!firstErr) firstErr = (it.name + '：称重商品入库数量最多保留 3 位小数'); }
      } else if (!/^\d+$/.test(qRaw)) {
        qBad = true; if (!firstErr) firstErr = (it.name + '：非称重商品入库数量只能输入整数');
      }
      if (qBad && q) q.style.borderColor = '#fc4b52';
    });
  });
  if (firstErr) { msInvToast(firstErr); return; }
  var isEdit = false, idx = -1;
  INV_ENTRY.forEach(function (x, i) { if (x.no === window._ieNo) { isEdit = true; idx = i; } });
  var cost = 0;
  // 多生产日期归一为平铺 items（每条生产日期独立成一行：独立 pdate/保质期/数量，金额=数量×商品级共享进货价），与库存/批次/列表既有逻辑兼容
  var items = [];
  INV_ENTRY_EDIT_ITEMS.forEach(function (it) {
    var pv = it.price;
    var okP = pv !== '' && pv != null && !isNaN(pv) && pv >= 0;
    (it.dates || []).forEach(function (d) {
      var qv = d.qty;
      var okQ = qv !== '' && qv != null && !isNaN(qv) && qv > 0;
      if (okQ && okP) cost += qv * pv;
      items.push({ name: it.name, code: it.code, spec: it.spec, batch: window._ieNo, pdate: d.pdate || '', shelfLife: d.shelfLife != null && d.shelfLife !== '' ? d.shelfLife : null, shelfLifeType: d.shelfLifeType || 1, exp: d.exp || '', qty: okQ ? qv : '', price: okP ? pv : '' });
    });
  });
  // 入库完成校验（对齐 Vue：仅确认未录进货价；价格管控校验在下方入库时执行）
  if (status === 20) {
    var noPrice = items.filter(function (x) { return x.price === ''; });
    if (noPrice.length && !confirm('有商品未录入进货价，确定提交吗？')) return;
  }
  var rec = { no: window._ieNo, date: window._ieDate || msInvToday(), storeId: window._ieStore || msInvScopeStoreId('S2001'), supplier: window._ieSup || '青浦绿蔬合作社', items: items, cost: Math.round(cost * 100) / 100, status: status };

  // ===== 价格校验：配置先行、入库时执行，且必须在库存变动之前 =====
  var finalStatus = status, chk = null;
  if (status === 20 && typeof msSupplyCheckEntry === 'function') {
    chk = msSupplyCheckEntry(rec);
    // 「禁止入库」在提交端拦截：注定不能批的单不进审批队列（09-11 定稿）
    var subForbids = chk.blocks.filter(function (b) { return b.action === 'forbid'; });
    if (subForbids.length) {
      alert('以下商品命中「禁止入库」规则，本单不能提交：\n\n' +
        subForbids.map(function (b) { return '· ' + b.name + '：' + b.why; }).join('\n') +
        '\n\n请先在采购定价模块维护定价后重试，或调整价格 / 移除该商品。');
      return;
    }
    finalStatus = chk.nextStatus;
    rec.priceCheck = { blocks: chk.blocks, results: chk.results, at: new Date().toLocaleString('zh-CN') };
    if (!chk.pass) {
      alert('以下商品价格不符合本店定价规则，库存未增加：\n\n' +
        chk.blocks.map(function (b) { return '· ' + b.name + '：' + b.why; }).join('\n') +
        '\n\n单据已置为「价格异常」，请走调价审批或拒收。');
    }
    // 提醒必做：低价「仅入库」不阻塞，但差异进价格波动台账
    if (chk.notices.length && typeof msPriceNoticeAdd === 'function') {
      chk.notices.forEach(function (n) { msPriceNoticeAdd(rec, n); });
    }
  }
  rec.status = finalStatus;
  if (isEdit) INV_ENTRY[idx] = rec; else INV_ENTRY.unshift(rec);
  // 提交入库时按 FIFO 追加库存与批次（批次号=入库单号，携带生产日期/保质期/有效期至）
  if (finalStatus === 20) {
    items.forEach(function (it) {
      var g = msInvFindGoods(it.code);
      if (!g) { g = { goodsId: 'gx' + Date.now(), name: it.name, code: it.code, cat: '粮油副食', catPath: '', grade: '', unit: 'kg', spec: it.spec, sale: 1, warehouse: 0, shelf: 0, avgCost: it.price, supplier: rec.supplier, storeId: rec.storeId, batches: [] }; INV_GOODS.push(g); }
      g.warehouse += it.qty; g.supplier = rec.supplier;
      var exist = msInvBatchByNo(g, rec.no);
      if (exist) exist.w += it.qty;
      else g.batches.unshift({ no: rec.no, pdate: it.pdate || '', shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType || 1, exp: it.exp || '', w: it.qty, s: 0, cost: it.price });
      invFlowAdd(10, it.code, it.name, it.qty, '仓库', rec.no, rec.no);
    });
    invListPersist();
  }
  invEntryPersist(); msInvCloseModal();
  msInvToast(finalStatus === 20 ? '入库单已提交，库存已更新并上架'
    : finalStatus === 25 ? '价格校验通过，已提交「待入库审核」，审核通过后库存才增加'
    : '价格异常：库存未增加，请走调价审批或拒收');
  invEntryRender();
}

/* ===== 价格异常 / 待入库审核：审批动作 =====
 * 三个动作：按入库价批准 / 改价入库（定价表不动）/ 驳回回 10
 * 「改价入库」与「同步更新定价（走调价单）」必须分开，否则定价表会被架空 */
function invEntryFind(no) { for (var i = 0; i < INV_ENTRY.length; i++) if (INV_ENTRY[i].no === no) return INV_ENTRY[i]; return null; }
function invEntryAddStock(r) {
  r.items.forEach(function (it) {
    var g = msInvFindGoods(it.code);
    if (!g) { g = { goodsId: 'gx' + Date.now(), name: it.name, code: it.code, cat: '粮油副食', catPath: '', grade: '', unit: 'kg', spec: it.spec, sale: 1, warehouse: 0, shelf: 0, avgCost: it.price, supplier: r.supplier, storeId: r.storeId, batches: [] }; INV_GOODS.push(g); }
    g.warehouse += it.qty; g.supplier = r.supplier;
    var exist = msInvBatchByNo(g, r.no);
    if (exist) exist.w += it.qty;
    else g.batches.unshift({ no: r.no, pdate: it.pdate || '', shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType || 1, exp: it.exp || '', w: it.qty, s: 0 });
    invFlowAdd(10, it.code, it.name, it.qty, '仓库', r.no, r.no);
  });
  invListPersist();
}
// 审批通过：newPrices 为 { index: 新价 }，不传表示原样入库
function invEntryApprove(no, newPrices, syncPrice) {
  var r = invEntryFind(no); if (!r) return;
  if (String(r.status) !== '15' && String(r.status) !== '25') { msInvToast('该单据不在待审批状态'); return; }
  // 影子单预演：把「本次改价」先套到副本上跑整单校验，规则不放行就不必让用户白确认一次
  var shadow = {
    no: r.no, storeId: r.storeId, supplier: r.supplier, date: r.date,
    items: r.items.map(function (it, i) {
      var cp = {}; for (var k in it) cp[k] = it[k];
      if (newPrices && newPrices[i] != null) cp.price = parseFloat(newPrices[i]);
      return cp;
    })
  };
  var chk = (typeof msSupplyCheckEntry === 'function') ? msSupplyCheckEntry(shadow) : null;
  // 系统规则优先于人工：改价后重算整单，仍存在「禁止入库」行则不放行
  // （audit 行可批；forbid 行只能先更新采购定价，或驳回/拒收）
  if (chk) {
    var forbids = chk.blocks.filter(function (b) { return b.action === 'forbid'; });
    if (forbids.length) {
      msInvToast('「禁止入库」规则未解除：' + forbids.map(function (b) { return b.name + '（' + b.why + '）'; }).join('、') + '——请先更新采购定价，或驳回/拒收');
      return;
    }
  }
  // 二次确认：批准即整单入库，库存变动不可撤销
  var newCost = Math.round(shadow.items.reduce(function (s, it) { return s + it.qty * it.price; }, 0) * 100) / 100;
  var chg = [];
  if (newPrices) shadow.items.forEach(function (it, i) {
    if (Math.abs(it.price - r.items[i].price) > 1e-9) chg.push(r.items[i].name + ' ¥' + r.items[i].price.toFixed(2) + ' → ¥' + it.price.toFixed(2));
  });
  // 同步更新定价：预演改价在定价表中能命中哪些记录（商品+门店+供应商三要素都一致才算命中）
  var syncList = [], skipSync = 0;
  if (syncPrice) {
    shadow.items.forEach(function (it, i) {
      // 改价入库路径只同步人工改过的项；按入库价批准则同步与定价有差异的项
      if (newPrices && Math.abs(it.price - r.items[i].price) <= 1e-9) return;
      var g = (typeof msInvFindGoods === 'function') ? msInvFindGoods(r.items[i].code) : null;
      var m = null;
      if (g && typeof SP_PRICES !== 'undefined') {
        for (var j = 0; j < SP_PRICES.length; j++) { var p = SP_PRICES[j]; if (p.goodsId === g.goodsId && p.storeId === r.storeId && p.supplier === r.supplier) { m = p; break; } }
      }
      if (m) { if (Math.abs(Number(m.price) - it.price) > 1e-9) syncList.push({ m: m, price: parseFloat(it.price) }); }
      else skipSync++;
    });
  }
  if (!confirm('确认批准入库单 ' + no + '？\n\n' +
    '门店：' + (typeof spStoreName === 'function' ? spStoreName(r.storeId) : r.storeId) + '　供应商：' + r.supplier + '\n' +
    '商品 ' + r.items.length + ' 项　合计 ¥' + newCost.toFixed(2) +
    (chg.length ? '\n本次改价：\n· ' + chg.join('\n· ') : '') +
    (syncList.length ? '\n\n同时更新采购定价 ' + syncList.length + ' 项（立即生效，原段自动写历史留痕）' : '') +
    (skipSync ? '\n另有 ' + skipSync + ' 项无对应定价记录（未定价/供应商不一致），已跳过同步' : '') +
    (chg.length && !syncPrice ? '\n\n改价仅作用于本单，不修改采购定价表' : '') +
    '\n\n批准后整单立即计入库存，不可撤销。')) return;
  if (newPrices) {
    shadow.items.forEach(function (it, i) { r.items[i].price = it.price; });
    r.cost = newCost;
  }
  // 同步更新定价表：旧段归档写历史，当前段写入审批确认的价（生效起=今天）
  if (syncList.length) {
    var syncDay = (typeof msInvToday === 'function') ? msInvToday() : new Date().toISOString().slice(0, 10);
    var nowStr = new Date().toLocaleString('zh-CN');
    syncList.forEach(function (s) {
      var priceChanged = Number(s.m.price) !== s.price;
      if (typeof spPriceArchive === 'function' && priceChanged) spPriceArchive(s.m, '调价(审批同步)', syncDay);
      s.m.price = s.price;
      if (priceChanged) s.m.effFrom = syncDay;
      s.m.updatedBy = '审批改价同步'; s.m.updatedAt = nowStr;
    });
    if (typeof spPersist === 'function') spPersist();
  }
  // 整单放行时补齐低价知会（改价入库可能新产生 entry_only 差异；同一单同一商品同一价不重复记）
  if (chk && chk.notices.length && typeof msPriceNoticeAdd === 'function' && typeof SP_NOTICES !== 'undefined') {
    chk.notices.forEach(function (n) {
      var dup = false;
      for (var i = 0; i < SP_NOTICES.length; i++) { var x = SP_NOTICES[i]; if (x.no === r.no && x.name === n.name && String(x.price) === String(n.price)) { dup = true; break; } }
      if (!dup) msPriceNoticeAdd(r, n);
    });
  }
  r.status = 20; r.approvedBy = '采购经理'; r.approvedAt = new Date().toLocaleString('zh-CN');
  invEntryAddStock(r);
  invEntryPersist(); msInvCloseModal();
  msInvToast('已审批通过，库存已更新');
  if (typeof invEntryRender === 'function') invEntryRender();
  if (typeof invApprRender === 'function') invApprRender();
}
/* 「按入库价批准」：按单据送货价整单入库，采购定价默认不动；可选「同步更新定价」
 * 把入库价写入采购定价表当前段（供应商确已调价的闭环：下次同价进货不再拦截）。 */
function invEntryApproveAsIs(no) {
  var r = invEntryFind(no); if (!r) return;
  // 详情页已逐行展示全部商品 定价/送货价/差异；此处只列「价格异常」项（与定价有差异），正常项不重复
  var oddRows = r.items.map(function (it) {
    var c = (typeof msSupplyCheckItem === 'function') ? msSupplyCheckItem(it, r.supplier, r.storeId, r.date) : null;
    var refTxt = c && c.refPrice != null ? '¥' + c.refPrice.toFixed(2) : '—';
    var diff = c && c.refPrice != null && Math.abs(it.price - c.refPrice) > 1e-9;
    return diff ? '<tr><td style="padding:6px 8px">' + msInvEsc(it.name) + '</td>' +
      '<td style="padding:6px 8px;text-align:right;color:#5b6472">' + refTxt + '</td>' +
      '<td style="padding:6px 8px;text-align:right;font-weight:600">¥' + it.price.toFixed(2) + '</td>' +
      '<td style="padding:6px 8px;text-align:right;color:#d48806">有差异</td></tr>' : '';
  }).filter(Boolean).join('');
  // 价格全部一致：无异常情况、无需改定价，直接统一二次确认弹窗后入库，不再弹详情框
  if (!oddRows) {
    invEntryApproveAsIsGo(no);
    return;
  }
  var body = '<div style="font-size:12px;color:#8a93a3;margin-bottom:10px;line-height:18px">按<b>单据入库价</b>批准整单入库，采购定价默认<b>不动</b>。若供应商<b>确已调价</b>，可勾选下方把入库价同步写入采购定价表当前段（原段自动写历史留痕，生效起=今天），下次同价进货不再拦截。</div>';
  if (oddRows) {
    body += '<table style="width:100%"><thead><tr><th>价格异常商品</th><th style="width:110px">定价</th><th style="width:130px">入库价</th><th style="width:70px">对比</th></tr></thead><tbody>' + oddRows + '</tbody></table>' +
      '<label style="display:flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;cursor:pointer"><input type="checkbox" id="ap_sync"> <span>同步更新采购定价（立即生效）</span></label>' +
      '<div style="font-size:11px;color:#c0c4cc;margin-top:4px">无对应定价记录的商品（未定价 / 供应商不一致）不会同步，需到采购定价模块处理</div>';
  } else {
    body += '<div style="font-size:12px;color:#5b6472;margin:4px 0 10px">本单所有商品与定价均一致，无价格异常项，直接按采购价入库即可。</div>';
  }
  msInvModal({
    title: '按入库价批准 · ' + no, width: '560px',
    body: body,
    onOk: 'invEntryApproveAsIsGo(\'' + no + '\')', okText: '确认入库', cancelText: '取消'
  });
}
// 统一二次确认弹窗：先捕获 ap_sync 勾选状态（详情框关闭后 DOM 会消失），再弹确认框
function invEntryApproveAsIsGo(no) {
  var el = document.getElementById('ap_sync');
  if (!window._apSyncNo) window._apSyncNo = {};
  window._apSyncNo[no] = !!(el && el.checked);
  var r = invEntryFind(no); if (!r) return;
  var storeName = INV_ENTRY_SHOPS[r.storeId] || r.storeId;
  var info = '<div style="font-size:14px;line-height:1.8">' +
    '<div>门店：<b style="color:#0b1019">' + msInvEsc(storeName) + '</b>　供应商：<b style="color:#0b1019">' + msInvEsc(r.supplier) + '</b></div>' +
    '<div>商品 <b>' + r.items.length + '</b> 项　合计 <b style="color:#0b1019">¥' + r.cost.toFixed(2) + '</b></div>' +
    '</div>' +
    '<div style="margin-top:12px;font-size:13px;color:#5b6472">批准后整单立即计入库存，不可撤销。</div>';
  msInvModal({
    title: '确认批准入库单 ' + no + '？', width: '520px',
    body: info,
    onOk: 'invEntryApproveAsIsOk(\'' + no + '\')', okText: '好', cancelText: '取消'
  });
}
function invEntryApproveAsIsOk(no) {
  var sync = window._apSyncNo && window._apSyncNo[no];
  invEntryApprove(no, null, !!sync);
}
/* 「改价入库」：改价默认只作用于本单；可选「同步更新定价」把改后价
 * 写入采购定价表当前段（旧段归档写历史，留痕 updatedBy=审批改价同步）。
 * 无对应定价记录（未定价/供应商不一致）的商品不会同步，需到采购定价模块处理。 */
function invEntryApprovePrice(no) {
  var r = invEntryFind(no); if (!r) return;
  var rows = r.items.map(function (it, i) {
    var c = (typeof msSupplyCheckItem === 'function') ? msSupplyCheckItem(it, r.supplier, r.storeId, r.date) : null;
    var refTxt = c && c.refPrice != null ? '¥' + c.refPrice.toFixed(2) : '—';
    return '<tr><td style="padding:6px 8px">' + msInvEsc(it.name) + '</td>' +
      '<td style="padding:6px 8px;text-align:right;color:#5b6472">' + refTxt + '</td>' +
      '<td style="padding:6px 8px;text-align:right"><input id="ap_p_' + i + '" type="number" step="0.01" class="ic-search" style="width:100px" value="' + it.price + '" oninput="invEntryApprovePriceSum()"></td></tr>';
  }).join('');
  window._apItems = r.items;
  msInvModal({
    title: '改价入库 · ' + no, width: '560px',
    body: '<div style="font-size:12px;color:#8a93a3;margin-bottom:10px;line-height:18px">改价默认<b>仅作用于本单</b>。若供应商<b>确已调价</b>，可勾选下方把改后价同步写入采购定价表当前段（原段自动写历史留痕，生效起=今天）。</div>' +
      '<table style="width:100%"><thead><tr><th>商品</th><th style="width:110px">定价</th><th style="width:130px">本次入库价</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<label style="display:flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;cursor:pointer"><input type="checkbox" id="ap_sync"> <span>同步更新采购定价（立即生效）</span></label>' +
      '<div style="font-size:11px;color:#c0c4cc;margin-top:4px">无对应定价记录的商品（未定价 / 供应商不一致）不会同步，需到采购定价模块处理</div>' +
      '<div id="ap_sum" style="margin-top:10px;font-size:12px;color:#5b6472"></div>',
    onOk: 'invEntryApprovePriceOk(\'' + no + '\')', okText: '确认入库', cancelText: '取消'
  });
  invEntryApprovePriceSum();
}
// 弹窗内实时汇总：让「确认入库」点下去之前就知道会改成什么
function invEntryApprovePriceSum() {
  var el = document.getElementById('ap_sum'); if (!el) return;
  var items = window._apItems || [], oldS = 0, newS = 0, chg = 0;
  items.forEach(function (it, i) {
    var inp = document.getElementById('ap_p_' + i);
    var p = (inp && !isNaN(parseFloat(inp.value))) ? parseFloat(inp.value) : it.price;
    oldS += it.qty * it.price; newS += it.qty * p;
    if (Math.abs(p - it.price) > 1e-9) chg++;
  });
  el.innerHTML = '原件合计 <b>¥' + oldS.toFixed(2) + '</b>　→　改后合计 <b style="color:#005cf5">¥' + newS.toFixed(2) + '</b>' +
    (chg ? '　<span style="color:#d48806">' + chg + ' 项价格已修改</span>' : '　<span style="color:#8a93a3">未修改任何价格（等同按入库价批准）</span>');
}
function invEntryApprovePriceOk(no) {
  var r = invEntryFind(no); if (!r) return;
  var np = {};
  r.items.forEach(function (it, i) {
    var el = document.getElementById('ap_p_' + i);
    if (el && !isNaN(parseFloat(el.value))) np[i] = parseFloat(el.value);
  });
  var syncEl = document.getElementById('ap_sync');
  invEntryApprove(no, np, !!(syncEl && syncEl.checked));
}
// 驳回：回 10 待提交（驳回 ≠ 拒收，可编辑后重提）
function invEntryReject(no) {
  var r = invEntryFind(no); if (!r) return;
  if (String(r.status) !== '15' && String(r.status) !== '25') { msInvToast('该单据不在待审批状态'); return; }
  if (!confirm('确认驳回入库单 ' + no + '？\n\n单据将退回「待提交」，库存不变；提交人可修改后重新提交。')) return;
  r.status = 10; r.rejectAt = new Date().toLocaleString('zh-CN');
  invEntryPersist(); msInvCloseModal(); msInvToast('已驳回，单据回到待提交，可修改后重提');
  if (typeof invEntryRender === 'function') invEntryRender();
  if (typeof invApprRender === 'function') invApprRender();
}
// 拒收：终态，库存不变，保留整单作为对账依据
function invEntryRefuse(no) {
  var r = invEntryFind(no); if (!r) return;
  if (String(r.status) !== '15' && String(r.status) !== '25') { msInvToast('该单据不在待审批状态'); return; }
  if (!confirm('确认拒收入库单 ' + no + '？\n\n拒收为终态：库存不会增加，单据保留供与供应商对账，之后不能再审批。')) return;
  r.status = 30; r.refuseAt = new Date().toLocaleString('zh-CN');
  invEntryPersist(); msInvCloseModal(); msInvToast('已标记拒收');
  if (typeof invEntryRender === 'function') invEntryRender();
  if (typeof invApprRender === 'function') invApprRender();
}
function invEntryOpenView(no) {
  var r = null; INV_ENTRY.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  // 提醒位置②：详情逐行展示 定价 / 送货价 / 差异，异常行置顶
  var rowObjs = r.items.map(function (it, i) {
    var c = (typeof msSupplyCheckItem === 'function') ? msSupplyCheckItem(it, r.supplier, r.storeId, r.date) : null;
    var refTxt = c && c.refPrice != null ? '¥' + c.refPrice.toFixed(2) : '—';
    var fl = c ? spFluctText(c) : '<span style="color:#8a93a3">—</span>';
    var odd = !!(c && (c.level === 'high' || c.level === 'none'));
    var expOn = (typeof msInvFindGoods === 'function') && ((msInvFindGoods(it.code) || {}).expiryManaged === true);
    var expTag = expOn ? ' <span style="font-size:11px;color:#0b7a52;background:#e8f7ef;border:1px solid #b7ebcf;border-radius:2px;padding:0 5px">效期管理</span>' : '';
    return {
      odd: odd, html:
      '<tr style="' + (odd ? 'background:#fff7f7' : '') + '"><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + expTag + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.spec) + '</td>' +
      '<td>' + (it.pdate || '—') + '</td><td>' + msInvLifeText({ shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType }) + '</td><td>' + (it.exp || '—') + '</td><td style="text-align:right">' + it.qty + '</td>' +
      '<td style="text-align:right;color:#5b6472">' + refTxt + '</td>' +
      '<td style="text-align:right;font-weight:600">¥' + it.price.toFixed(2) + '</td>' +
      '<td style="text-align:right">' + fl + '</td>' +
      '<td style="text-align:right">¥' + (it.qty * it.price).toFixed(2) + '</td></tr>'
    };
  });
  rowObjs.sort(function (a, b) { return (b.odd ? 1 : 0) - (a.odd ? 1 : 0); });
  var rows = rowObjs.map(function (x) { return x.html; }).join('');
  var hasOdd = rowObjs.some(function (x) { return x.odd; });
  var alertBar = hasOdd ? '<div style="margin-bottom:10px;padding:8px 12px;background:#fff7f7;border:1px solid #fde2e2;border-radius:4px;font-size:12px;color:#f56c6c">⚠ 本单存在价格异常行（已置顶显示），' +
    (String(r.status) === '15' || String(r.status) === '25' ? '库存尚未增加，需审批后才会入库。' : '请核对供应商送货价与定价。') + '</div>' : '';
  var footBtn = '', footNote = '';
  if (String(r.status) === '20') {
    footBtn = '<button class="btn-primary" onclick="invEntryPrint(\'' + r.no + '\')">🖨 打印</button>';
    footNote = '已完成入库单不可修改，如需打印请在下方操作';
  } else if (String(r.status) === '15' || String(r.status) === '25') {
    footBtn = '<button class="btn-primary" onclick="invEntryApproveAsIs(\'' + r.no + '\')">✓ 按入库价批准</button>' +
      '<button class="btn-secondary" onclick="invEntryApprovePrice(\'' + r.no + '\')">改价入库</button>' +
      '<button class="btn-secondary" onclick="invEntryReject(\'' + r.no + '\')">驳回</button>' +
      '<button class="btn-secondary" onclick="invEntryRefuse(\'' + r.no + '\')" style="color:#fc4b52">拒收</button>';
  } else if (String(r.status) === '30') {
    footNote = '该单已拒收，保留供与供应商对账';
  } else {
    // 对齐 Vue Warehouseentry：查看模式只有「返回/关闭」，编辑入口统一走列表页工具栏
    footBtn = '<button class="btn-primary" onclick="invEntryViewCommit()">提交入库</button>';
  }
  var sz = invEntryModalSize();
  msInvModal({ title: '查看入库单 · ' + r.no, width: sz.w, height: sz.h, footer: false, bodyStyle: 'overflow:hidden;', body:
    '<div style="display:flex;flex-direction:column;height:100%">' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;font-size:12px;color:#5b6472;flex-shrink:0">' +
        '<div>门店：<b style="color:#0b1019">' + (storeName[r.storeId] || r.storeId) + '</b></div><div>供应商：<b style="color:#0b1019">' + msInvEsc(r.supplier) + '</b></div>' +
        '<div>入库日期：<b style="color:#0b1019">' + r.date + '</b></div><div>状态：' + msInvEntryStatusBadge(r.status) + '</div>' +
        '<div>审核人：<b style="color:#0b1019">' + ((String(r.status) === '15' || String(r.status) === '25') ? (r.approver || '未指定') : '—') + '</b></div>' +
      '</div>' +
      (alertBar ? '<div style="flex-shrink:0">' + alertBar + '</div>' : '') +
      '<div style="flex:1;min-height:0;overflow:auto;border:1px solid #e9eef7;border-radius:4px 4px 0 0"><table style="width:100%;min-width:1100px">' +
      '<thead><tr><th style="width:50px">序号</th><th>商品名称</th><th style="width:110px">编码/条码</th><th style="width:80px">规格</th><th style="width:120px">生产日期</th><th style="width:70px">保质期</th><th style="width:120px">有效期至</th><th style="width:70px">入库数量</th><th style="width:90px">定价</th><th style="width:90px">送货价</th><th style="width:120px">差异</th><th style="width:100px">小计</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div style="flex-shrink:0;display:flex;justify-content:flex-end;align-items:center;padding:10px 12px;border:1px solid #e9eef7;border-top:none;border-radius:0 0 4px 4px;background:#f7f9fc">' +
        '<span style="font-size:12px;color:#5b6472">合计金额</span>' +
        '<span style="font-size:13px;font-weight:600;color:#d4380d;margin-left:12px">¥' + r.cost.toFixed(2) + '</span>' +
      '</div>' +
    '</div>' });
  // 详情页 footer：所有操作按钮与关闭放在同一行（对齐 Vue Warehouseentry）
  var viewFoot = document.createElement('div'); viewFoot.className = 'ic-modal-footer'; viewFoot.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
  viewFoot.innerHTML = '<span style="flex:1;font-size:12px;color:#8a93a3;align-self:center">' + footNote + '</span>' +
    footBtn + '<button class="btn-secondary" onclick="msInvCloseModal()">关闭</button>';
  var mv = document.getElementById('msInvModal'); if (mv) mv.appendChild(viewFoot);
  window._ieViewNo = no;
}
function invEntryViewCommit() {
  var no = window._ieViewNo, r = invEntryFind(no);
  if (!r) return;
  // 与编辑弹窗同一套校验：不能因为入口不同就绕过价格管控
  var finalStatus = 20;
  var chk = null;
  if (typeof msSupplyCheckEntry === 'function') {
    chk = msSupplyCheckEntry(r);
    // 「禁止入库」在提交端拦截：注定不能批的单不进审批队列（09-11 定稿）
    var vwForbids = chk.blocks.filter(function (b) { return b.action === 'forbid'; });
    if (vwForbids.length) {
      alert('以下商品命中「禁止入库」规则，本单不能提交：\n\n' +
        vwForbids.map(function (b) { return '· ' + b.name + '：' + b.why; }).join('\n') +
        '\n\n请先在采购定价模块维护定价后重新提交，或驳回 / 拒收。');
      return;
    }
    finalStatus = chk.nextStatus;
  }
  // 二次确认：提交即按校验结果落库存/挂审批，去向先说清楚
  var tip = (chk && !chk.pass)
    ? '本单存在价格异常，提交后库存不会增加，单据将置为「价格异常」待审批。'
    : (finalStatus === 25 ? '本店开启入库审核，提交后需审核通过才计入库存。' : '提交后整单立即计入库存，不可撤销。');
  if (!confirm('确认提交入库单 ' + r.no + '？\n\n' + tip)) return;
  if (chk) {
    r.priceCheck = { blocks: chk.blocks, results: chk.results, at: new Date().toLocaleString('zh-CN') };
    if (!chk.pass) {
      alert('以下商品价格不符合本店定价规则，库存未增加：\n\n' +
        chk.blocks.map(function (b) { return '· ' + b.name + '：' + b.why; }).join('\n') +
        '\n\n单据已置为「价格异常」，请走调价审批或拒收。');
    }
    if (chk.notices.length && typeof msPriceNoticeAdd === 'function') {
      chk.notices.forEach(function (n) { msPriceNoticeAdd(r, n); });
    }
  }
  r.status = finalStatus;
  if (finalStatus === 15 || finalStatus === 25) { invAuditLoad(); r.approver = invAuditNames(); }
  if (finalStatus === 20) invEntryAddStock(r);
  invEntryPersist(); msInvCloseModal();
  msInvToast(finalStatus === 20 ? '已提交入库，库存已更新'
    : finalStatus === 25 ? '已提交「待入库审核」，审核通过后库存才增加'
    : '价格异常：库存未增加，请走调价审批或拒收');
  invEntryRender();
}
function invEntryDel(no) {
  var r = null; INV_ENTRY.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  if (String(r.status) === '20') { msInvToast('已完成入库单不可删除'); return; }
  if (!confirm('确认删除入库单 ' + no + '？')) return;
  INV_ENTRY = INV_ENTRY.filter(function (x) { return x.no !== no; });
  invEntryPersist(); msInvToast('已删除'); invEntryRender();
}
// 打印入库单（A4，已完成单）
function invEntryPrint(no) {
  var r = null; INV_ENTRY.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var rows = r.items.map(function (it, i) {
    return '<tr><td>' + (i + 1) + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.spec) + '</td><td>' + (it.pdate || '—') + '</td><td>' + msInvLifeText({ shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType }) + '</td><td>' + (it.exp || '—') + '</td><td class="r">' + it.qty + '</td><td class="r">' + it.price.toFixed(2) + '</td><td class="r">' + (it.qty * it.price).toFixed(2) + '</td></tr>';
  }).join('');
  var head = '<tr><th style="width:40px">序号</th><th>商品编码</th><th>商品名称</th><th>规格</th><th>生产日期</th><th>保质期</th><th>有效期至</th><th class="r">数量</th><th class="r">进货价</th><th class="r">金额</th></tr>';
  var foot = '<tr><td colspan="9" class="r">合计（¥）</td><td class="r">' + r.cost.toFixed(2) + '</td></tr>';
  msInvPrint((storeName[r.storeId] || r.storeId) + ' · 入库单 ' + r.no, '供应商：' + r.supplier + '　·　入库日期：' + r.date + '　·　单据状态：已完成', head, rows, foot);
}
// ===== 工具栏行选操作（对齐 Vue 入库记录：新增/编辑/删除/批量导入/打印）=====
function invEntryToolbarEdit() {
  if (!INV_ENTRY_SEL) { msInvToast('请先勾选一条入库单'); return; }
  var r = invEntryFind(INV_ENTRY_SEL);
  if (!r) { msInvToast('该入库单不存在'); return; }
  if (String(r.status) === '20' || String(r.status) === '30') { msInvToast('已完成/已拒收入库单不允许修改'); return; }
  invEntryOpenEdit(INV_ENTRY_SEL);
}
function invEntryToolbarDel() {
  if (!INV_ENTRY_SEL) { msInvToast('请先勾选一条入库单'); return; }
  invEntryDel(INV_ENTRY_SEL);
  INV_ENTRY_SEL = '';
}
function invEntryToolbarPrint() {
  if (!INV_ENTRY_SEL) { msInvToast('请先勾选一条入库单'); return; }
  var r = invEntryFind(INV_ENTRY_SEL);
  if (!r) { msInvToast('该入库单不存在'); return; }
  if (String(r.status) !== '20') { msInvToast('仅已完成入库单可打印'); return; }
  invEntryPrint(INV_ENTRY_SEL);
}
function invEntryImport() {
  msInvModal({ title: '批量导入入库单', width: 'min(640px,94vw)', body:
    '<div style="border:1.5px dashed #b8c4d6;border-radius:8px;padding:28px 16px;text-align:center;background:#fafbfd">' +
      '<div style="font-size:26px;margin-bottom:8px">📥</div>' +
      '<div style="font-size:13px;color:#0b1019;margin-bottom:4px">拖拽 Excel 文件到此处，或点击选择文件</div>' +
      '<div style="font-size:12px;color:#8a93a3;margin-bottom:14px">支持 .xlsx / .xls，表头：商品名称、商品编码、商品规格、入库数量、进货价、生产日期、保质期、保质期单位、供应商</div>' +
      '<button class="ic-btn ic-btn-pri" onclick="msInvToast(\'文件已选择（演示）\')">选择文件</button>' +
    '</div>' +
    '<div style="font-size:12px;color:#8a93a3;margin-top:12px;line-height:20px">导入流程：解析文件 → 按供应商自动拆分为多张入库单（待提交）→ 逐单提交。<br>示例：2 个供应商 → 生成 2 张待提交入库单，可在「入库单」列表核对后提交。</div>',
    onOk: 'invEntryImportDo();msInvCloseModal()', okText: '开始导入', cancelText: '下载模板' });
}
// 演示导入：模拟两供应商拆分，生成 2 张待提交单
function invEntryImportDo() {
  var d = new Date(); var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
  function mk(no) { return 'RK' + y + m + dd + no; }
  var n1 = invEntryNextNo(), n2 = invEntryNextNo();
  INV_ENTRY.unshift({ no: n1, date: msInvToday(), storeId: 'S2001', supplier: '青浦绿蔬合作社', items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: n1, pdate: msInvToday(), shelfLife: 5, shelfLifeType: 1, exp: msInvCalcExp(msInvToday(), 5, 1), qty: 50, price: 2.6 }, { name: '上海青', code: '6901234500024', spec: '400g/份', batch: n1, pdate: msInvToday(), shelfLife: 4, shelfLifeType: 1, exp: msInvCalcExp(msInvToday(), 4, 1), qty: 60, price: 2.1 }], cost: 256.0, status: 10 });
  INV_ENTRY.unshift({ no: n2, date: msInvToday(), storeId: 'S2001', supplier: '正大肉品', items: [{ name: '五花肉', code: '6901234500062', spec: '称重', batch: n2, pdate: msInvToday(), shelfLife: 3, shelfLifeType: 1, exp: msInvCalcExp(msInvToday(), 3, 1), qty: 30, price: 24.0 }], cost: 720.0, status: 10 });
  invEntryPersist(); msInvToast('导入成功：已按供应商拆分为 2 张待提交入库单'); invEntryRender();
}

/* ================================================================
 * 3) 调拨记录 inv-transfer（Vue Inoroutrecord 调拨记录 / Stockinorout 调货单）
 * ================================================================ */
var INV_TF_PAGE = 1, INV_TF_SIZE = 10, INV_TF_ST = '', INV_TF_KW = '';
var INV_TF_KEY = 'tcm_inv_transfer_v1';
function invTfSeed() {
  return [
    { no: 'DB20260901001', date: '2026-09-01', fromStore: 'S2002', toStore: 'S2001', type: '店间调拨', items: [{ name: '红富士苹果', code: '6901234500093', qty: 20 }], amount: 152.0, status: 'shipped', createdAt: '2026-09-01 08:30' },
    { no: 'DB20260902001', date: '2026-09-02', fromStore: 'S2001', toStore: 'S2002', type: '店间调拨', items: [{ name: '土鸡蛋', code: '6901234500079', qty: 10 }], amount: 188.0, status: 'done', createdAt: '2026-09-02 10:12' },
    { no: 'DB20260902002', date: '2026-09-02', fromStore: 'S2001', toStore: 'S2001', type: '仓库补货', items: [{ name: '光明鲜牛奶', code: '6901234500116', qty: 12 }, { name: '金龙鱼调和油', code: '6901234500109', qty: 6 }], amount: 514.8, status: 'pending', createdAt: '2026-09-02 16:40' },
    { no: 'DB20260831001', date: '2026-08-31', fromStore: 'S2001', toStore: 'S2002', type: '店间调拨', items: [{ name: '娃娃菜', code: '6901234500017', qty: 30 }], amount: 84.0, status: 'done', createdAt: '2026-08-31 09:05' },
    { no: 'DB20260903001', date: '2026-09-03', fromStore: 'S2002', toStore: 'S2001', type: '店间调拨', items: [{ name: '思念水饺', code: '6901234500123', qty: 8 }], amount: 172.0, status: 'pending', createdAt: '2026-09-03 09:30' }
  ];
}
var INV_TF = [];
function invTfLoad() { try { var r = localStorage.getItem(INV_TF_KEY); if (r) { INV_TF = JSON.parse(r); return; } } catch (e) {} INV_TF = invTfSeed(); invTfPersist(); }
function invTfPersist() { try { localStorage.setItem(INV_TF_KEY, JSON.stringify(INV_TF)); } catch (e) {} }
function invTfInit() {
  invTfLoad();
  var el = document.getElementById('inv-transferContent');
  if (!el) { setTimeout(invTfInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">状态：</span>' +
      '<select class="ic-search" style="flex:0 1 130px" id="invTfSt" onchange="invTfSetSt(this.value)"><option value="">全部状态</option><option value="pending">待发货</option><option value="shipped">已发货</option><option value="done">已完成</option><option value="cancel">已取消</option></select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="调拨单号 / 商品名称" value="' + msInvEsc(INV_TF_KW) + '" onkeydown="if(event.key===\'Enter\')invTfQuery()" id="invTfKw">' +
      '<button class="ic-btn" onclick="invTfReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invTfQuery()">查询</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">调拨=门店/仓库之间库存划拨</span>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invTfOpenEdit()">+ 新增调拨</button>' +
      '<button class="ic-btn" onclick="msInvToast(\'已导出调拨记录（演示）\')">导出</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="width:100%;table-layout:fixed;border-collapse:collapse">' +
        '<thead><tr>' +
          '<th style="width:4%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th>' +
          '<th style="width:15%;text-align:left;vertical-align:middle;padding:8px 10px">调拨单号</th>' +
          '<th style="width:9%;text-align:left;vertical-align:middle;padding:8px 10px">调拨日期</th>' +
          '<th style="width:12%;text-align:left;vertical-align:middle;padding:8px 10px">调出方</th>' +
          '<th style="width:12%;text-align:left;vertical-align:middle;padding:8px 10px">调入方</th>' +
          '<th style="width:8%;text-align:left;vertical-align:middle;padding:8px 10px">类型</th>' +
          '<th style="width:12%;text-align:left;vertical-align:middle;padding:8px 10px">商品</th>' +
          '<th style="width:10%;text-align:right;vertical-align:middle;padding:8px 10px">调拨金额(元)</th>' +
          '<th style="width:8%;text-align:center;vertical-align:middle;padding:8px 6px">状态</th>' +
          '<th style="width:10%;text-align:left;vertical-align:middle;padding:8px 10px">操作</th>' +
        '</tr></thead>' +
        '<tbody id="invTfBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invTfPager" style="flex-shrink:0"></div>' +
    '</div>';
  invTfRender();
}
function invTfStoreName(id) { var m = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店', S2003: '崧泽-浦东社区店', WH: '中心仓库' }; return m[id] || id; }
function invTfStatusBadge(st) {
  var m = { pending: msInvBadge('待发货', 'warn'), shipped: msInvBadge('已发货', 'blue'), done: msInvBadge('已完成', 'ok'), cancel: msInvBadge('已取消', 'info') };
  return m[st] || msInvBadge(st, 'info');
}
function invTfRows() {
  var rows = INV_TF;
  if (INV_TF_ST) rows = rows.filter(function (r) { return r.status === INV_TF_ST; });
  if (INV_TF_KW) { var kw = INV_TF_KW.toLowerCase(); rows = rows.filter(function (r) { return r.no.toLowerCase().indexOf(kw) > -1 || r.items.some(function (it) { return it.name.indexOf(kw) > -1; }); }); }
  return rows;
}
function invTfRender() {
  var rows = invTfRows(), tbody = document.getElementById('invTfBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_TF_SIZE) || 1;
  if (INV_TF_PAGE > pages) INV_TF_PAGE = pages; if (INV_TF_PAGE < 1) INV_TF_PAGE = 1;
  var start = (INV_TF_PAGE - 1) * INV_TF_SIZE, data = rows.slice(start, start + INV_TF_SIZE);
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1;
    var names = r.items.map(function (it) { return it.name + '×' + it.qty; }).join('、');
    var act = '';
    if (r.status === 'pending') act = '<button class="ic-btn ic-btn-pri" style="height:24px;padding:0 8px" onclick="invTfDo(\'' + r.no + '\',\'ship\')">调拨发货</button> <button class="ic-btn" style="height:24px;padding:0 8px" onclick="invTfDo(\'' + r.no + '\',\'cancel\')">取消</button>';
    else if (r.status === 'shipped') act = '<button class="ic-btn" style="height:24px;padding:0 8px" onclick="invTfDo(\'' + r.no + '\',\'done\')">确认完成</button>';
    else act = '<span style="color:#c0c4cc">—</span>';
    return '<tr>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + seq + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px"><a style="color:#1677ff;cursor:pointer" onclick="invTfView(\'' + r.no + '\')">' + msInvEsc(r.no) + '</a></td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + r.date + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + invTfStoreName(r.fromStore) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + invTfStoreName(r.toStore) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.type) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px;font-size:12px" title="' + msInvEsc(names) + '">' + msInvEsc(names.slice(0, 18)) + (names.length > 18 ? '…' : '') + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px;font-weight:600;color:#0b1019">¥' + r.amount.toFixed(2) + '</td>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px">' + invTfStatusBadge(r.status) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + act + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="10" style="text-align:center;color:#999;padding:36px 0">暂无调拨记录</td></tr>';
  msInvPager(total, INV_TF_PAGE, INV_TF_SIZE, 'invTfPager', 'invTfGoPage');
}
function invTfGoPage(p) { INV_TF_PAGE = p; invTfRender(); }
function invTfSetSt(v) { INV_TF_ST = v; INV_TF_PAGE = 1; invTfRender(); }
function invTfQuery() { var el = document.getElementById('invTfKw'); if (el) INV_TF_KW = el.value.trim(); INV_TF_PAGE = 1; invTfRender(); }
function invTfReset() { INV_TF_KW = ''; INV_TF_ST = ''; INV_TF_PAGE = 1;
  var a = document.getElementById('invTfKw'); if (a) a.value = '';
  var b = document.getElementById('invTfSt'); if (b) b.value = '';
  invTfRender();
}
function invTfDo(no, act) {
  var r = null; INV_TF.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  if (act === 'ship') {
    // 真实扣减调出方库存（批次 FIFO 从仓库先扣）
    var lack = [];
    r.items.forEach(function (it) {
      var g = invTfFindGoods(r.fromStore, it.code);
      if (!g || g.warehouse < it.qty) lack.push(it.name + '(库存 ' + (g ? g.warehouse : 0) + ')');
    });
    if (lack.length) { msInvToast('调出方库存不足：' + lack.join('、')); return; }
    if (!confirm('确认调拨发货 ' + no + '？\n\n' + invTfStoreName(r.fromStore) + ' → ' + invTfStoreName(r.toStore) +
      '\n商品 ' + r.items.length + ' 项　金额 ¥' + r.amount.toFixed(2) + '\n\n发货后立即扣减调出方库存，不可撤销。')) return;
    r.items.forEach(function (it) {
      var g = invTfFindGoods(r.fromStore, it.code);
      if (g) { g.warehouse -= it.qty; invFlowAdd(40, it.code, it.name, -it.qty, '仓库', no, ''); }
    });
    invListPersist();
    r.status = 'shipped';
    msInvToast('已发货：' + no + '（已扣减调出方库存）');
  }
  else if (act === 'done') {
    if (!confirm('确认完成调拨单 ' + no + '？\n\n' + invTfStoreName(r.toStore) + ' 的库存将按本单增加，完成后不可撤销。')) return;
    // 调入方增加库存（无主档则建档，批次沿用原批次归属调入方）
    r.items.forEach(function (it) {
      var g = invTfFindGoods(r.toStore, it.code);
      if (!g) {
        var src = invTfFindGoods(r.fromStore, it.code);
        g = { goodsId: 'gx' + Date.now() + String(Math.floor(Math.random() * 999)), name: it.name, code: it.code, cat: src ? src.cat : '粮油副食', unit: src ? src.unit : 'kg', spec: src ? src.spec : '称重', sale: 1, warehouse: 0, shelf: 0, avgCost: it.price || (src ? src.avgCost : 0), supplier: src ? src.supplier : '', storeId: r.toStore, batches: [] };
        INV_GOODS.push(g);
      }
      g.warehouse += it.qty;
      invFlowAdd(30, it.code, it.name, it.qty, '仓库', no, '');
    });
    invListPersist();
    r.status = 'done';
    msInvToast('已确认完成：' + no + '（调入方库存已增加）');
  }
  else if (act === 'cancel') { if (!confirm('确认取消该调拨单？')) return; r.status = 'cancel'; msInvToast('已取消：' + no); }
  invTfPersist(); invTfRender();
}
function invTfFindGoods(storeId, code) {
  for (var i = 0; i < INV_GOODS.length; i++) { var g = INV_GOODS[i]; if (g.storeId === storeId && g.code === code) return g; }
  return null;
}
var INV_TF_EDIT_ITEMS = [];
function invTfOpenEdit() {
  INV_TF_EDIT_ITEMS = [];
  var d = new Date(); var no = 'DB' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + String(100 + Math.floor(Math.random() * 900));
  window._tfNo = no;
  invTfEditRender();
}
function invTfEditRender() {
  var rowsHtml = INV_TF_EDIT_ITEMS.length ? INV_TF_EDIT_ITEMS.map(function (it, i) {
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.spec) + '</td>' +
      '<td style="text-align:right">' + it.stock + '</td><td><input id="tfq_' + i + '" type="number" min="1" class="ic-search" style="width:90px" value="' + it.qty + '" oninput="invTfRecalc()"></td>' +
      '<td style="text-align:right" id="tfsub_' + i + '">¥' + (it.qty * it.price).toFixed(2) + '</td>' +
      '<td><button class="ic-btn" style="color:#fc4b52" onclick="invTfRemoveItem(' + i + ')">移除</button></td></tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px">尚未添加调拨商品</td></tr>';
  var body =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:12px">' +
      '<div style="font-size:12px;color:#5b6472">调拨单号：<b style="color:#0b1019">' + window._tfNo + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">调拨日期：<b style="color:#0b1019">' + msInvToday() + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">申请类型：<select class="ic-search" style="height:26px;padding:2px 8px;width:130px" id="tfType" onchange="invTfTypeChange()"><option>店间调拨</option><option>仓库补货</option><option>门店退货至仓</option></select></div>' +
      '<div style="font-size:12px;color:#5b6472">调出方：<select class="ic-search" style="height:26px;padding:2px 8px;width:170px" id="tfFrom" onchange="invTfFromChange()"><option value="S2001">崧泽-青浦旗舰店</option><option value="S2002">崧泽-松江分店</option></select></div>' +
      '<div style="font-size:12px;color:#5b6472">调入方：<select class="ic-search" style="height:26px;padding:2px 8px;width:170px" id="tfTo"><option value="S2001">崧泽-青浦旗舰店</option><option value="S2002">崧泽-松江分店</option></select></div>' +
      '<div style="font-size:12px;color:#8a93a3" id="tfTip">发货扣减调出方库存，确认完成后调入方库存增加</div>' +
    '</div>' +
    '<div style="font-size:12px;font-weight:600;color:#1a2233;margin-bottom:6px">调拨商品明细</div>' +
    '<div style="max-height:280px;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%;min-width:720px">' +
      '<thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th>规格</th><th style="width:90px">调出方库存</th><th style="width:110px">调拨数量</th><th style="width:110px">金额</th><th style="width:70px">操作</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '<tfoot><tr style="background:#f7f9fc"><td colspan="6" style="text-align:right;font-weight:600">合计金额</td><td style="text-align:right;font-weight:600;color:#d4380d" id="tfTotal">¥0.00</td><td></td></tr></tfoot>' +
    '</table></div>' +
    '<div style="margin-top:10px"><button class="ic-btn ic-btn-pri" onclick="invTfPickGoods()">+ 添加商品</button></div>' +
    '<div style="font-size:12px;color:#8a93a3;margin-top:8px;line-height:18px">仅显示调出方（' + invTfStoreName(document.getElementById && document.getElementById('tfFrom') ? (document.getElementById('tfFrom').value || 'S2001') : 'S2001') + '）有库存的商品。</div>';
  msInvModal({ title: '新增调拨单', width: 'min(900px,94vw)', body: body, onOk: 'invTfSave()', okText: '提交调拨' });
  var fromSel = document.getElementById('tfFrom'); if (fromSel) fromSel.value = msInvScopeStoreId('S2001');
  var toSel = document.getElementById('tfTo'); if (toSel) toSel.value = (msInvScopeStoreId('S2001') === 'S2001') ? 'S2002' : 'S2001';
  invTfRecalc();
}
function invTfRecalc() {
  var total = 0;
  INV_TF_EDIT_ITEMS.forEach(function (it, i) {
    var q = document.getElementById('tfq_' + i), sub = document.getElementById('tfsub_' + i);
    var qv = q ? parseFloat(q.value) : it.qty; if (!qv || qv <= 0) qv = it.qty;
    total += qv * it.price;
    if (sub) sub.textContent = '¥' + (qv * it.price).toFixed(2);
  });
  var t = document.getElementById('tfTotal'); if (t) t.textContent = '¥' + total.toFixed(2);
}
function invTfTypeChange() {
  var t = document.getElementById('tfType'), tip = document.getElementById('tfTip');
  if (tip) tip.textContent = (t && t.value === '店间调拨') ? '店间调拨：调出方仓库 → 调入方仓库，发货扣减、完成后增加' : '仓库补货/退货至仓：发货扣减调出方仓库，完成后增加调入方仓库';
}
function invTfFromChange() {
  // 清空已有明细，重新按调出方选品
  INV_TF_EDIT_ITEMS = [];
  invTfEditRender();
}
function invTfPickGoods() {
  var fromSel = document.getElementById('tfFrom'); var from = fromSel ? fromSel.value : msInvScopeStoreId('S2001');
  var opts = INV_GOODS.filter(function (g) { return g.storeId === from && !INV_TF_EDIT_ITEMS.some(function (it) { return it.code === g.code; }); })
    .map(function (g) { return '<option value="' + g.goodsId + '">' + msInvEsc(g.name) + ' / ' + msInvEsc(g.code) + '（仓库 ' + g.warehouse + '）</option>'; }).join('');
  msInvModal({ title: '选择调拨商品', width: 'min(560px,94vw)', body: '<div style="font-size:12px;color:#5b6472;margin-bottom:6px">调出方：' + invTfStoreName(from) + '</div><select class="ic-search" style="width:100%" id="tfPickSel"><option value="">— 请选择商品 —</option>' + opts + '</select>',
    onOk: 'invTfPickOk()', okText: '加入' });
}
function invTfPickOk() {
  var s = document.getElementById('tfPickSel'); if (!s.value) { msInvToast('请选择商品'); return; }
  var g = null; INV_GOODS.forEach(function (x) { if (x.goodsId === s.value) g = x; });
  if (!g) return;
  INV_TF_EDIT_ITEMS.push({ name: g.name, code: g.code, spec: (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit, stock: g.warehouse, qty: 1, price: g.avgCost });
  msInvCloseModal(); invTfEditRender();
}
function invTfRemoveItem(i) { INV_TF_EDIT_ITEMS.splice(i, 1); invTfEditRender(); }
function invTfSave() {
  if (!INV_TF_EDIT_ITEMS.length) { msInvToast('请添加调拨商品'); return; }
  var items = INV_TF_EDIT_ITEMS.map(function (it, i) {
    var q = document.getElementById('tfq_' + i); var qv = q ? parseFloat(q.value) : it.qty;
    return { name: it.name, code: it.code, spec: it.spec, qty: qv || it.qty, price: it.price };
  });
  // 调拨数量不能超过调出方库存
  for (var k = 0; k < items.length; k++) {
    var g = invTfFindGoods(window._tfFrom || msInvScopeStoreId('S2001'), items[k].code);
    if (g && items[k].qty > g.warehouse) { msInvToast(items[k].name + ' 调拨数量超过调出方库存(' + g.warehouse + ')'); return; }
  }
  var amount = 0; items.forEach(function (it) { amount += it.qty * it.price; });
  var typeSel = document.getElementById('tfType'), fromSel = document.getElementById('tfFrom'), toSel = document.getElementById('tfTo');
  window._tfFrom = fromSel ? fromSel.value : 'S2001';
  INV_TF.unshift({ no: window._tfNo, date: msInvToday(), fromStore: window._tfFrom, toStore: toSel ? toSel.value : 'S2002', type: typeSel ? typeSel.value : '店间调拨', items: items, amount: Math.round(amount * 100) / 100, status: 'pending', createdAt: msInvNow() });
  invTfPersist(); msInvCloseModal(); msInvToast('调拨单已提交（待发货）'); invTfRender();
}
function invTfView(no) {
  var r = null; INV_TF.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var rows = r.items.map(function (it, i) {
    return '<tr><td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + (i + 1) + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.name) + '</td><td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.code) + '</td><td style="text-align:right;vertical-align:middle;padding:8px 10px">' + it.qty + '</td></tr>';
  }).join('');
  msInvModal({ title: '调拨单详情 · ' + r.no, width: 'min(680px,94vw)', body:
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:#5b6472;margin-bottom:12px">' +
      '<div>申请类型：<b style="color:#0b1019">' + msInvEsc(r.type) + '</b></div><div>调拨日期：<b style="color:#0b1019">' + r.date + '</b></div>' +
      '<div>调出方：<b style="color:#0b1019">' + invTfStoreName(r.fromStore) + '</b></div><div>调入方：<b style="color:#0b1019">' + invTfStoreName(r.toStore) + '</b></div>' +
      '<div>状态：' + invTfStatusBadge(r.status) + '</div>' +
    '</div>' +
    '<div style="max-height:300px;overflow:auto"><table style="width:100%;table-layout:fixed;border-collapse:collapse"><thead><tr><th style="width:8%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th><th style="width:38%;text-align:left;vertical-align:middle;padding:8px 10px">商品名称</th><th style="width:34%;text-align:left;vertical-align:middle;padding:8px 10px">编码/条码</th><th style="width:20%;text-align:right;vertical-align:middle;padding:8px 10px">数量</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}

/* ================================================================
 * 4) 退货记录 inv-return（Vue Returnedrecord / Returnedgoods）
 * ================================================================ */
var INV_RT_PAGE = 1, INV_RT_SIZE = 10, INV_RT_ST = '', INV_RT_KW = '', INV_RT_SUP = '';
var INV_RT_KEY = 'tcm_inv_return_v2';
// 该商品对应已完成入库单的批次候选（来源：已完成入库单明细）
function invRtCandidates(code, supplier) {
  var out = [];
  for (var i = 0; i < INV_ENTRY.length; i++) {
    var r = INV_ENTRY[i];
    if (String(r.status) !== '20') continue;
    if (supplier && r.supplier !== supplier) continue;
    for (var j = 0; j < r.items.length; j++) {
      var it = r.items[j];
      if (it.code !== code) continue;
      var g = msInvFindGoods(code);
      var batch = g ? msInvBatchByNo(g, r.no) : null;
      var cur = batch ? batch.w + batch.s : (g ? g.warehouse : 0);
      out.push({ rkNo: r.no, batch: r.no, rkQty: it.qty, cost: it.price, cur: cur, pdate: it.pdate || '', shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType, exp: it.exp || '' });
    }
  }
  return out;
}
function invRtSeed() {
  return [
    { no: 'TH20260902001', date: '2026-09-02', storeId: 'S2001', supplier: '益海嘉里', items: [{ name: '金龙鱼调和油', code: '6901234500109', spec: '5L/瓶', rkNo: 'RK20260801001', batch: 'RK20260801001', pdate: '2026-08-01', shelfLife: 540, shelfLifeType: 1, exp: '2027-01-22', rkQty: 12, cur: 12, qty: 2, cost: 62.0, price: 62.0 }], amount: 124.0, reason: '临期退回', status: 20 },
    { no: 'TH20260831001', date: '2026-08-31', storeId: 'S2001', supplier: '青浦绿蔬合作社', items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', rkNo: 'RK20260901001', batch: 'RK20260901001', pdate: '2026-09-01', shelfLife: 5, shelfLifeType: 1, exp: '2026-09-06', rkQty: 40, cur: 40, qty: 10, cost: 2.8, price: 2.8 }, { name: '上海青', code: '6901234500024', spec: '400g/份', rkNo: 'RK20260901001', batch: 'RK20260901001', pdate: '2026-09-01', shelfLife: 4, shelfLifeType: 1, exp: '2026-09-05', rkQty: 30, cur: 30, qty: 8, cost: 2.2, price: 2.2 }], amount: 45.6, reason: '品质问题', status: 20 },
    { no: 'TH20260901001', date: '2026-09-01', storeId: 'S2002', supplier: '正大肉品', items: [{ name: '土鸡蛋', code: '6901234500079', spec: '30枚/盒', rkNo: 'RK20260830001', batch: 'RK20260830001', pdate: '2026-08-30', shelfLife: 45, shelfLifeType: 1, exp: '2026-10-14', rkQty: 35, cur: 35, qty: 5, cost: 18.8, price: 18.8 }], amount: 94.0, reason: '破损', status: 10 }
  ];
}
var INV_RT = [];
function invRtLoad() { try { var r = localStorage.getItem(INV_RT_KEY); if (r) { INV_RT = JSON.parse(r); return; } } catch (e) {} INV_RT = invRtSeed(); invRtPersist(); }
function invRtPersist() { try { localStorage.setItem(INV_RT_KEY, JSON.stringify(INV_RT)); } catch (e) {} }
function invRtInit() {
  invRtLoad();
  var el = document.getElementById('inv-returnContent');
  if (!el) { setTimeout(invRtInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">供应商：</span>' +
      '<select class="ic-search" style="flex:0 1 180px" id="invRtSup" onchange="invRtSetSup(this.value)"><option value="">全部供应商</option><option>青浦绿蔬合作社</option><option>正大肉品</option><option>益海嘉里</option><option>光明乳业</option></select>' +
      '<span style="font-size:12px;color:#3a4252">状态：</span>' +
      '<select class="ic-search" style="flex:0 1 120px" id="invRtSt" onchange="invRtSetSt(this.value)"><option value="">全部状态</option><option value="10">待提交</option><option value="20">已完成</option></select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="退货单号 / 商品名称" value="' + msInvEsc(INV_RT_KW) + '" onkeydown="if(event.key===\'Enter\')invRtQuery()" id="invRtKw">' +
      '<button class="ic-btn" onclick="invRtReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invRtQuery()">查询</button>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invRtOpenEdit()">+ 新增退货</button>' +
      '<button class="ic-btn" onclick="msInvToast(\'已导出退货记录（演示）\')">导出</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">退货按「供应商 + 原入库批次」结算，退货后对应批次库存回退</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="min-width:1000px">' +
        '<thead><tr><th style="width:56px">序号</th><th style="width:180px">退货单号</th><th style="width:110px">退货日期</th><th style="width:140px">门店</th><th style="width:150px">供应商</th><th style="width:80px">商品数</th><th style="width:120px">退货金额(元)</th><th style="width:110px">退货原因</th><th style="width:90px">状态</th><th>操作</th></tr></thead>' +
        '<tbody id="invRtBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invRtPager" style="flex-shrink:0"></div>' +
    '</div>';
  invRtRender();
}
function invRtRows() {
  var rows = msInvScopeFilter(INV_RT);
  if (INV_RT_ST) rows = rows.filter(function (r) { return String(r.status) === INV_RT_ST; });
  if (INV_RT_SUP) rows = rows.filter(function (r) { return r.supplier === INV_RT_SUP; });
  if (INV_RT_KW) { var kw = INV_RT_KW.toLowerCase(); rows = rows.filter(function (r) { return r.no.toLowerCase().indexOf(kw) > -1 || r.items.some(function (it) { return it.name.indexOf(kw) > -1; }); }); }
  return rows;
}
function invRtRender() {
  var rows = invRtRows(), tbody = document.getElementById('invRtBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_RT_SIZE) || 1;
  if (INV_RT_PAGE > pages) INV_RT_PAGE = pages; if (INV_RT_PAGE < 1) INV_RT_PAGE = 1;
  var start = (INV_RT_PAGE - 1) * INV_RT_SIZE, data = rows.slice(start, start + INV_RT_SIZE);
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1;
    var st = String(r.status) === '20' ? msInvBadge('已完成', 'ok') : msInvBadge('待提交', 'warn');
    var act;
    if (String(r.status) === '10') act = '<a style="color:#1677ff;cursor:pointer;margin-right:10px" onclick="invRtView(\'' + r.no + '\')">查看</a><a style="color:#1677ff;cursor:pointer;margin-right:10px" onclick="invRtOpenEdit(\'' + r.no + '\')">编辑</a><a style="color:#fc4b52;cursor:pointer" onclick="invRtDoCommit(\'' + r.no + '\')">提交</a>';
    else act = '<a style="color:#1677ff;cursor:pointer;margin-right:10px" onclick="invRtView(\'' + r.no + '\')">查看</a><a style="color:#1677ff;cursor:pointer" onclick="invRtPrint(\'' + r.no + '\')">打印</a>';
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + seq + '</td>' +
      '<td><a style="color:#1677ff;cursor:pointer" onclick="invRtView(\'' + r.no + '\')">' + msInvEsc(r.no) + '</a></td>' +
      '<td>' + r.date + '</td><td>' + (storeName[r.storeId] || r.storeId) + '</td><td>' + msInvEsc(r.supplier) + '</td>' +
      '<td style="text-align:center">' + r.items.length + '</td>' +
      '<td style="text-align:right;font-weight:600">¥' + r.amount.toFixed(2) + '</td>' +
      '<td>' + msInvEsc(r.reason) + '</td><td>' + st + '</td><td>' + act + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="10" style="text-align:center;color:#999;padding:36px 0">暂无退货记录</td></tr>';
  msInvPager(total, INV_RT_PAGE, INV_RT_SIZE, 'invRtPager', 'invRtGoPage');
}
function invRtGoPage(p) { INV_RT_PAGE = p; invRtRender(); }
function invRtSetSup(v) { INV_RT_SUP = v; INV_RT_PAGE = 1; invRtRender(); }
function invRtSetSt(v) { INV_RT_ST = v; INV_RT_PAGE = 1; invRtRender(); }
function invRtQuery() { var el = document.getElementById('invRtKw'); if (el) INV_RT_KW = el.value.trim(); INV_RT_PAGE = 1; invRtRender(); }
function invRtReset() { INV_RT_KW = ''; INV_RT_SUP = ''; INV_RT_ST = ''; INV_RT_PAGE = 1;
  var a = document.getElementById('invRtKw'); if (a) a.value = '';
  var b = document.getElementById('invRtSup'); if (b) b.value = '';
  var c = document.getElementById('invRtSt'); if (c) c.value = '';
  invRtRender();
}
var INV_RT_EDIT_ITEMS = [];
function invRtOpenEdit(no) {
  var r = null;
  if (no) { INV_RT.forEach(function (x) { if (x.no === no) r = x; }); }
  INV_RT_EDIT_ITEMS = r ? JSON.parse(JSON.stringify(r.items)) : [];
  window._rtNo = r ? r.no : (function () { var d = new Date(); return 'TH' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + String(100 + Math.floor(Math.random() * 900)); })();
  window._rtSup = r ? r.supplier : '青浦绿蔬合作社';
  window._rtReason = r ? r.reason : '品质问题';
  window._rtStatus = r ? String(r.status) : '10';
  invRtEditRender();
}
function invRtEditRender() {
  var storeLabel = msInvScopeStoreLabel();
  var rowsHtml = INV_RT_EDIT_ITEMS.length ? INV_RT_EDIT_ITEMS.map(function (it, i) {
    var maxQ = Math.min(it.rkQty, it.cur);
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td>' +
      '<td style="font-size:11px">' + msInvEsc(it.rkNo) + '<div style="color:#8a93a3;margin-top:2px">批次 ' + msInvEsc(it.batch) + '</div></td>' +
      '<td style="text-align:right">' + it.rkQty + '</td><td style="text-align:right">' + it.cur + '</td>' +
      '<td style="text-align:right;color:#1677ff;font-weight:600">' + maxQ + '</td>' +
      '<td><input id="rtq_' + i + '" type="number" min="1" class="ic-search" style="width:76px" value="' + it.qty + '" onblur="invRtQtyBlur(' + i + ')" oninput="invRtRecalc()"></td>' +
      '<td style="text-align:right">' + it.cost.toFixed(2) + '</td>' +
      '<td><input id="rtp_' + i + '" type="number" min="0" step="0.01" class="ic-search" style="width:80px" value="' + it.price + '" onblur="invRtPriceBlur(' + i + ')" oninput="invRtRecalc()"></td>' +
      '<td style="text-align:right" id="rtsub_' + i + '">¥' + (it.qty * it.price).toFixed(2) + '</td>' +
      '<td><button class="ic-btn" style="color:#fc4b52" onclick="invRtRemoveItem(' + i + ')">移除</button></td></tr>';
  }).join('') : '<tr><td colspan="12" style="text-align:center;color:#999;padding:24px">尚未添加退货商品，点击「按入库单选源」从已完成入库单的批次中选择</td></tr>';
  var body =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:12px">' +
      '<div style="font-size:12px;color:#5b6472">退货单号：<b style="color:#0b1019">' + window._rtNo + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">退货日期：<b style="color:#0b1019">' + msInvToday() + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">门店：<b style="color:#0b1019">' + (storeLabel === '全部门店' ? '崧泽-青浦旗舰店' : storeLabel) + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">供应商：<select class="ic-search" style="height:26px;padding:2px 8px;width:170px" id="rtSup" onchange="invRtSupChange(this.value)"><option>青浦绿蔬合作社</option><option>正大肉品</option><option>益海嘉里</option><option>光明乳业</option></select></div>' +
      '<div style="font-size:12px;color:#5b6472">退货原因：<select class="ic-search" style="height:26px;padding:2px 8px;width:160px" id="rtReason"><option>品质问题</option><option>临期退回</option><option>破损</option><option>多送退回</option><option>其他</option></select></div>' +
    '</div>' +
    '<div style="font-size:12px;font-weight:600;color:#1a2233;margin-bottom:6px">退货商品明细 <span style="color:#8a93a3;font-weight:400">（按已完成入库单+批次选源；最大可退=min(该批入库量, 当前库存)；退货价≤进货价）</span></div>' +
    '<div style="max-height:300px;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%;min-width:1100px">' +
      '<thead><tr><th style="width:46px">序号</th><th>商品名称</th><th>编码/条码</th><th style="width:180px">来源入库单/批次</th><th style="width:76px">该批入库</th><th style="width:76px">当前库存</th><th style="width:80px">最大可退</th><th style="width:84px">退货数量</th><th style="width:80px">进货价</th><th style="width:88px">退货价(≤进价)</th><th style="width:96px">金额</th><th style="width:64px">操作</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '<tfoot><tr style="background:#f7f9fc"><td colspan="10" style="text-align:right;font-weight:600">合计</td><td style="text-align:right;font-weight:600;color:#d4380d" id="rtTotal">¥0.00</td><td></td></tr></tfoot>' +
    '</table></div>' +
    '<div style="margin-top:10px"><button class="ic-btn ic-btn-pri" onclick="invRtPickGoods()">按入库单选源</button></div>';
  msInvModal({ title: (window._rtStatus === '20' ? '查看退货单(已完成·只读)' : (window._rtNo && (function () { var f = false; INV_RT.forEach(function (x) { if (x.no === window._rtNo) f = true; }); return f; })() ? '编辑退货单(待提交)' : '新增退货单')), width: 'min(1220px,96vw)', body: body, footer: false });
  var sup = document.getElementById('rtSup'); if (sup) sup.value = window._rtSup;
  var rs = document.getElementById('rtReason'); if (rs) rs.value = window._rtReason;
  invRtRecalc();
  var foot = document.createElement('div'); foot.className = 'ic-modal-footer'; foot.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
  if (window._rtStatus === '20') {
    foot.innerHTML = '<span style="flex:1;font-size:12px;color:#8a93a3;align-self:center">已完成退货单不可修改</span>' +
      '<button class="btn-secondary" onclick="msInvCloseModal()">关闭</button>';
  } else {
    foot.innerHTML = '<span style="flex:1;font-size:12px;color:#8a93a3;align-self:center">提交后对应批次库存回退、不可再改</span>' +
      '<button class="btn-secondary" onclick="invRtSaveDraft()">保存为待提交</button>' +
      '<button class="btn-primary" onclick="invRtSaveCommit()">提交退货</button>';
  }
  var m = document.getElementById('msInvModal'); if (m) m.appendChild(foot);
}
function invRtSupChange(v) {
  window._rtSup = v;
  // 换供应商清空已选（来源按供应商隔离）
  if (INV_RT_EDIT_ITEMS.length) { INV_RT_EDIT_ITEMS = []; invRtEditRender(); }
}
function invRtRecalc() {
  var total = 0;
  INV_RT_EDIT_ITEMS.forEach(function (it, i) {
    var q = document.getElementById('rtq_' + i), p = document.getElementById('rtp_' + i), sub = document.getElementById('rtsub_' + i);
    var qv = q ? parseFloat(q.value) : it.qty; var pv = p ? parseFloat(p.value) : it.price;
    if (!qv || qv <= 0) qv = it.qty; if (!pv || pv < 0) pv = it.price;
    total += qv * pv;
    if (sub) sub.textContent = '¥' + (qv * pv).toFixed(2);
  });
  var t = document.getElementById('rtTotal'); if (t) t.textContent = '¥' + total.toFixed(2);
}
function invRtQtyBlur(i) {
  var it = INV_RT_EDIT_ITEMS[i]; if (!it) return;
  var q = document.getElementById('rtq_' + i); if (!q) return;
  var maxQ = Math.min(it.rkQty, it.cur);
  var v = parseFloat(q.value);
  if (!v || v <= 0) { q.value = 1; invRtRecalc(); return; }
  if (v > maxQ) { q.value = maxQ; invRtRecalc(); msInvToast(it.name + ' 最大可退 ' + maxQ + '（min 入库 ' + it.rkQty + ' / 当前库存 ' + it.cur + '）'); return; }
  invRtRecalc();
}
function invRtPriceBlur(i) {
  var it = INV_RT_EDIT_ITEMS[i]; if (!it) return;
  var p = document.getElementById('rtp_' + i); if (!p) return;
  var v = parseFloat(p.value);
  if (!v || v < 0) { p.value = it.cost; invRtRecalc(); return; }
  if (v > it.cost) { p.value = it.cost; invRtRecalc(); msInvToast(it.name + ' 退货价不能高于进货价 ' + it.cost.toFixed(2)); return; }
  invRtRecalc();
}
function invRtRemoveItem(i) { INV_RT_EDIT_ITEMS.splice(i, 1); invRtEditRender(); }
function invRtPickGoods() {
  var sup = window._rtSup || '青浦绿蔬合作社';
  // 从已完成入库单按供应商汇总候选行（每个入库单×商品=一行，带批次）
  var rows = [];
  for (var i = 0; i < INV_ENTRY.length; i++) {
    var r = INV_ENTRY[i];
    if (String(r.status) !== '20' || (sup && r.supplier !== sup)) continue;
    for (var j = 0; j < r.items.length; j++) {
      var it = r.items[j];
      var g = msInvFindGoods(it.code);
      var batch = g ? msInvBatchByNo(g, r.no) : null;
      var cur = batch ? batch.w + batch.s : (g ? g.warehouse + g.shelf : 0);
      var already = INV_RT_EDIT_ITEMS.some(function (x) { return x.rkNo === r.no && x.batch === r.no && x.code === it.code; });
      if (already || cur <= 0) continue;
      rows.push({ rkNo: r.no, name: it.name, code: it.code, spec: it.spec || '', rkQty: it.qty, cur: cur, cost: it.price, pdate: it.pdate || '', shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType, exp: it.exp || '' });
    }
  }
  if (!rows.length) { msInvToast('供应商「' + sup + '」暂无已完成入库单批次可退'); return; }
  var list = rows.map(function (x, i) {
    var maxQ = Math.min(x.rkQty, x.cur);
    return '<tr><td style="text-align:center"><input type="checkbox" id="rtpick_' + i + '"></td><td>' + msInvEsc(x.name) + '</td><td>' + msInvEsc(x.code) + '</td>' +
      '<td style="font-size:11px">' + msInvEsc(x.rkNo) + '</td>' +
      '<td style="text-align:right">' + x.rkQty + '</td><td style="text-align:right">' + x.cur + '</td><td style="text-align:right;color:#1677ff">' + maxQ + '</td>' +
      '<td style="text-align:right">' + x.cost.toFixed(2) + '</td><td style="font-size:11px;color:#8a93a3">' + (x.pdate || '—') + (x.shelfLife != null ? ' / ' + msInvLifeText(x) : '') + '</td></tr>';
  }).join('');
  window._rtCand = rows;
  msInvModal({ title: '选择退货来源（已完成入库单批次）', width: 'min(1000px,94vw)', body:
    '<div style="font-size:12px;color:#5b6472;margin-bottom:8px">供应商：<b style="color:#0b1019">' + msInvEsc(sup) + '</b> · 勾选批次加入明细，可退上限 = min(该批入库数量, 当前批次库存)</div>' +
    '<div style="max-height:340px;overflow:auto"><table style="width:100%;min-width:860px">' +
    '<thead><tr><th style="width:40px"></th><th>商品名称</th><th>编码/条码</th><th style="width:170px">入库单号</th><th style="width:80px">入库数量</th><th style="width:80px">当前库存</th><th style="width:80px">最大可退</th><th style="width:90px">进货价</th><th style="width:160px">生产/保质期</th></tr></thead>' +
    '<tbody>' + list + '</tbody></table></div>',
    onOk: 'invRtPickOk()', okText: '加入选中' });
}
function invRtPickOk() {
  var cand = window._rtCand || [], added = 0;
  cand.forEach(function (x, i) {
    var cb = document.getElementById('rtpick_' + i);
    if (cb && cb.checked) {
      INV_RT_EDIT_ITEMS.push({ name: x.name, code: x.code, spec: x.spec, rkNo: x.rkNo, batch: x.rkNo, pdate: x.pdate, shelfLife: x.shelfLife, shelfLifeType: x.shelfLifeType, exp: x.exp, rkQty: x.rkQty, cur: x.cur, qty: 1, cost: x.cost, price: x.cost });
      added++;
    }
  });
  if (!added) { msInvToast('请勾选要退货的批次'); return; }
  msInvCloseModal(); invRtEditRender();
}
function invRtSaveDraft() { invRtSave(10); }
function invRtSaveCommit() { invRtSave(20); }
function invRtSave(status) {
  if (!INV_RT_EDIT_ITEMS.length) { msInvToast('请添加退货商品'); return; }
  var isEdit = false, idx = -1;
  INV_RT.forEach(function (x, i) { if (x.no === window._rtNo) { isEdit = true; idx = i; } });
  var items = INV_RT_EDIT_ITEMS.map(function (it, i) {
    var q = document.getElementById('rtq_' + i), p = document.getElementById('rtp_' + i);
    var qv = q ? parseFloat(q.value) : it.qty; var pv = p ? parseFloat(p.value) : it.price;
    if (!qv || qv <= 0) qv = 1; if (!pv || pv < 0) pv = it.cost;
    return { name: it.name, code: it.code, spec: it.spec || '', rkNo: it.rkNo, batch: it.batch || it.rkNo, pdate: it.pdate || '', shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType, exp: it.exp || '', rkQty: it.rkQty, cur: it.cur, qty: qv, cost: it.cost, price: pv };
  });
  if (status === 20) {
    // 提交前再次校验：数量超上限 / 价格超进价
    for (var k = 0; k < items.length; k++) {
      var maxQ = Math.min(items[k].rkQty, items[k].cur);
      if (items[k].qty > maxQ) { msInvToast(items[k].name + ' 超过最大可退 ' + maxQ); return; }
      if (items[k].price > items[k].cost) { msInvToast(items[k].name + ' 退货价不能高于进货价 ' + items[k].cost.toFixed(2)); return; }
    }
  }
  var amount = 0; items.forEach(function (it) { amount += it.qty * it.price; });
  var reasonSel = document.getElementById('rtReason');
  var rec = { no: window._rtNo, date: msInvToday(), storeId: window._rtStore || msInvScopeStoreId('S2001'), supplier: window._rtSup || '青浦绿蔬合作社', items: items, amount: Math.round(amount * 100) / 100, reason: reasonSel ? reasonSel.value : (window._rtReason || '品质问题'), status: status };
  if (isEdit) INV_RT[idx] = rec; else INV_RT.unshift(rec);
  if (status === 20) {
    // 精确扣减对应入库单批次库存
    items.forEach(function (it) {
      var g = msInvFindGoods(it.code);
      if (g) {
        g.warehouse = Math.max(0, g.warehouse - it.qty);
        var b = msInvBatchByNo(g, it.batch || it.rkNo);
        if (b) b.w = Math.max(0, b.w - it.qty);
        invFlowAdd(20, it.code, it.name, -it.qty, '仓库', rec.no, it.batch || it.rkNo);
      }
    });
    invListPersist();
  }
  invRtPersist(); msInvCloseModal(); msInvToast(status === 20 ? '退货已提交，批次库存已回退' : '退货单已保存为待提交'); invRtRender();
}
function invRtDoCommit(no) {
  var r = null; INV_RT.forEach(function (x, i) { if (x.no === no) r = x; });
  if (!r) return;
  r.status = 20; r.date = msInvToday();
  // 校验可退上限
  for (var k = 0; k < r.items.length; k++) {
    var it = r.items[k];
    var g = msInvFindGoods(it.code);
    var b = g ? msInvBatchByNo(g, it.batch || it.rkNo) : null;
    var cur = b ? b.w : (g ? g.warehouse : 0);
    var maxQ = Math.min(it.rkQty || it.qty, cur);
    if (it.qty > maxQ) { msInvToast(it.name + ' 超过最大可退 ' + maxQ); return; }
  }
  r.items.forEach(function (it) {
    var g = msInvFindGoods(it.code);
    if (g) {
      g.warehouse = Math.max(0, g.warehouse - it.qty);
      var b = msInvBatchByNo(g, it.batch || it.rkNo);
      if (b) b.w = Math.max(0, b.w - it.qty);
      invFlowAdd(20, it.code, it.name, -it.qty, '仓库', no, it.batch || it.rkNo);
    }
  });
  invListPersist(); invRtPersist(); msInvToast('退货已提交，批次库存已回退'); invRtRender();
}
function invRtView(no) {
  var r = null; INV_RT.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var rows = r.items.map(function (it, i) {
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td>' +
      '<td style="font-size:11px">' + msInvEsc(it.rkNo || it.batch) + '</td>' +
      '<td style="text-align:right">' + it.qty + '</td><td style="text-align:right">¥' + it.price.toFixed(2) + '</td><td style="text-align:right">¥' + (it.qty * it.price).toFixed(2) + '</td></tr>';
  }).join('');
  var footBtn = String(r.status) === '20' ? '<div style="margin-top:12px;text-align:right"><button class="ic-btn ic-btn-pri" onclick="invRtPrint(\'' + r.no + '\')">🖨 打印</button></div>' : '';
  msInvModal({ title: '退货单详情 · ' + r.no, width: 'min(900px,94vw)', body:
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px;color:#5b6472;margin-bottom:12px">' +
      '<div>门店：<b style="color:#0b1019">' + (storeName[r.storeId] || r.storeId) + '</b></div><div>供应商：<b style="color:#0b1019">' + msInvEsc(r.supplier) + '</b></div>' +
      '<div>退货日期：<b style="color:#0b1019">' + r.date + '</b></div><div>退货原因：<b style="color:#0b1019">' + msInvEsc(r.reason) + '</b></div>' +
      '<div>状态：' + (String(r.status) === '20' ? msInvBadge('已完成', 'ok') : msInvBadge('待提交', 'warn')) + '</div>' +
    '</div>' +
    '<div style="max-height:300px;overflow:auto"><table style="width:100%;min-width:700px"><thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th>来源入库单</th><th style="width:90px">数量</th><th style="width:90px">退货价</th><th style="width:100px">金额</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + footBtn,
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}
// 打印退货单（A4）
function invRtPrint(no) {
  var r = null; INV_RT.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var rows = r.items.map(function (it, i) {
    return '<tr><td>' + (i + 1) + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.rkNo || it.batch) + '</td><td class="r">' + it.qty + '</td><td class="r">' + it.price.toFixed(2) + '</td><td class="r">' + (it.qty * it.price).toFixed(2) + '</td></tr>';
  }).join('');
  var head = '<tr><th style="width:40px">序号</th><th>商品编码</th><th>商品名称</th><th>来源入库单</th><th class="r">数量</th><th class="r">退货价</th><th class="r">金额</th></tr>';
  var foot = '<tr><td colspan="6" class="r">合计（¥）</td><td class="r">' + r.amount.toFixed(2) + '</td></tr>';
  msInvPrint((storeName[r.storeId] || r.storeId) + ' · 退货单 ' + r.no, '供应商：' + r.supplier + '　·　退货日期：' + r.date + '　·　原因：' + r.reason + '　·　状态：' + (String(r.status) === '20' ? '已完成' : '待提交'), head, rows, foot);
}

/* ================================================================
 * 5) 盘点记录 inv-check（Vue Stocktakerecord / Stocktake / Inventrysnapshot）
 * ================================================================ */
var INV_CK_PAGE = 1, INV_CK_SIZE = 10, INV_CK_ST = '', INV_CK_KW = '', INV_CK_SHOP = '';
var INV_CK_KEY = 'tcm_inv_check_v6';
function invCkSeed() {
  // mode: 动态 账面=快照+变动(实时)；锁库 账面=开始冻结快照；速盘 即时回写、无快照。三种方式均覆盖，否则演示数据无法体现速盘路径。
  // 演示数据同时包含「开启效期管理（按到期日逐批盘，带 pdate/exp/batchNo）」与「无效期管理（盘总数）」两类，
  // 否则盘点列表/详情永远只显示盘总数，无法体现效期盘点差异。
  return [
    { no: 'PD20260830001', date: '2026-08-30', endDate: '2026-08-30', storeId: 'S2001', loc: '仓库', mode: '锁库', by: '陈明', diff: 1, diffQty: 2, diffAmt: 5.6, status: 'done', items: [
      { name: '娃娃菜', code: '6901234500017', spec: '500g/份', unit: '份', cost: 2.8, expiryManaged: false, snapshot: 120, real: 118, diff: 2 },
      { name: '五花肉', code: '6901234500062', spec: '称重', unit: 'kg', cost: 24.5, expiryManaged: true, batchNo: 'RK20260910003', pdate: '2026-09-10', exp: '2026-09-13', remain: 1, snapshot: 42, real: 42, diff: 0 }
    ] },
    { no: 'PD20260831001', date: '2026-08-31', endDate: '', storeId: 'S2001', loc: '货架', mode: '动态', by: '刘洋', diff: 0, diffQty: 0, diffAmt: 0, status: 'checking', items: [
      { name: '光明鲜牛奶', code: '6901234500116', spec: '950ml/盒', unit: '盒', cost: 11.9, expiryManaged: true, batchNo: 'RK20260911001', pdate: '2026-09-11', exp: '2026-09-18', remain: 6, snapshot: 24, real: 24, diff: 0 }
    ] },
    { no: 'PD20260901001', date: '2026-09-01', endDate: '2026-09-01', storeId: 'S2002', loc: '仓库', mode: '锁库', by: '黄丽', diff: 1, diffQty: 1, diffAmt: 21.5, status: 'done', items: [
      { name: '土豆', code: '6901234500048', spec: '称重', unit: 'kg', cost: 3.4, expiryManaged: false, snapshot: 260, real: 260, diff: 0 },
      { name: '思念水饺', code: '6901234500123', spec: '1kg/袋', unit: '袋', cost: 21.5, expiryManaged: true, batchNo: 'RK20260818001', pdate: '2026-08-18', exp: '2027-02-14', remain: 155, snapshot: 28, real: 27, diff: 1 }
    ] },
    { no: 'PD20260902001', date: '2026-09-02', endDate: '', storeId: 'S2001', loc: '货架', mode: '动态', by: '陈明', diff: 0, diffQty: 0, diffAmt: 0, status: 'checking', items: [
      { name: '西红柿', code: '6901234500055', spec: '称重', unit: 'kg', cost: 5.1, expiryManaged: false, snapshot: 18, real: 18, diff: 0 }
    ] },
    { no: 'PD20260903001', date: '2026-09-03', endDate: '2026-09-03', storeId: 'S2001', loc: '货架', mode: '速盘', by: '李娜', diff: 1, diffQty: 2, diffAmt: 6.4, status: 'done', items: [
      { name: '鲜鸡蛋', code: '6901234500087', spec: '30枚/盒', unit: '盒', cost: 3.2, expiryManaged: false, snapshot: 60, real: 58, diff: 2 },
      { name: '胡萝卜', code: '6901234500070', spec: '称重', unit: 'kg', cost: 2.1, expiryManaged: false, snapshot: 30, real: 30, diff: 0 }
    ] },
    { no: 'PD20260903002', date: '2026-09-03', endDate: '2026-09-03', storeId: 'S2001', loc: '货架', mode: '动态', by: '陈明', diff: 0, diffQty: 0, diffAmt: 0, status: 'done', items: [
      { name: '鲜鸡蛋', code: '6901234500087', spec: '30枚/盒', unit: '盒', cost: 3.2, expiryManaged: false, snapshot: 58, real: 58, diff: 0 },
      { name: '西红柿', code: '6901234500055', spec: '称重', unit: 'kg', cost: 5.1, expiryManaged: false, snapshot: 18, real: 18, diff: 0 }
    ] },
    { no: 'PD20260904001', date: '2026-09-04', endDate: '2026-09-04', storeId: 'S2002', loc: '仓库', mode: '速盘', by: '王芳', diff: 1, diffQty: 1, diffAmt: 9.8, status: 'done', items: [
      { name: '生姜', code: '6901234500094', spec: '称重', unit: 'kg', cost: 9.8, expiryManaged: false, snapshot: 15, real: 14, diff: 1 },
      { name: '大蒜', code: '6901234500100', spec: '称重', unit: 'kg', cost: 6.0, expiryManaged: false, snapshot: 22, real: 22, diff: 0 }
    ] }
  ];
}
var INV_CK = [];
function invCkLoad() { try { var r = localStorage.getItem(INV_CK_KEY); if (r) { INV_CK = JSON.parse(r); return; } } catch (e) {} INV_CK = invCkSeed(); invCkPersist(); }
function invCkPersist() { try { localStorage.setItem(INV_CK_KEY, JSON.stringify(INV_CK)); } catch (e) {} }
function invCkModeText(m) { return m === '速盘' ? '速盘' : (m === '锁库' ? '锁库' : (m === '动态' ? '动态' : (m === '全盘' ? '动态' : '锁库'))); }
/* 盘点快报：按门店+日期每日一份，聚合当日全部盘点终值（完成+进行中），多次盘点自动取最终值 */
var INV_RPT_SHOP = 'S2001', INV_RPT_DATE = '';
function invCkRptOpen() {
  invCkRptPickDefaults();
  msInvModal({ title: '盘点快报（每日一份 · 当日终值）', width: '720px', footer: false, body:
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-shrink:0">' +
      '<span style="font-size:12px;color:#3a4252">门店：</span>' +
      '<select class="ic-search" style="flex:0 0 180px" id="invRptShop" onchange="invCkRptSetShop(this.value)"><option value="S2001">崧泽-青浦旗舰店</option><option value="S2002">崧泽-松江分店</option></select>' +
      '<span style="font-size:12px;color:#3a4252">日期：</span>' +
      '<select class="ic-search" style="flex:0 0 150px" id="invRptDate" onchange="invCkRptSetDate(this.value)"></select>' +
      '<span style="flex:1"></span><span style="font-size:11px;color:#8a93a3">完成+进行中均计入；同商品多次盘点按最后一次为终值</span>' +
    '</div>' +
    '<div id="invRptBody" style="overflow:auto;max-height:60vh"></div>' });
  var ds = document.getElementById('invRptShop'), dt = document.getElementById('invRptDate');
  if (ds) ds.value = INV_RPT_SHOP;
  invCkRptRenderDates();
  if (dt) dt.value = INV_RPT_DATE;
  invCkRptRender();
}
function invCkRptPickDefaults() {
  var dates = INV_CK.filter(function (r) { return r.storeId === INV_RPT_SHOP; }).map(function (r) { return r.date; });
  dates.sort(); dates.reverse();
  INV_RPT_DATE = dates[0] || '';
}
function invCkRptDates() {
  var seen = {}, out = [];
  INV_CK.forEach(function (r) { if (r.storeId === INV_RPT_SHOP && !seen[r.date]) { seen[r.date] = 1; out.push(r.date); } });
  out.sort(); out.reverse();
  return out;
}
function invCkRptRenderDates() {
  var sel = document.getElementById('invRptDate'); if (!sel) return;
  sel.innerHTML = invCkRptDates().map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');
}
function invCkRptSetShop(v) { INV_RPT_SHOP = v; invCkRptPickDefaults(); invCkRptRenderDates(); var dt = document.getElementById('invRptDate'); if (dt) dt.value = INV_RPT_DATE; invCkRptRender(); }
function invCkRptSetDate(v) { INV_RPT_DATE = v; invCkRptRender(); }
function invCkRptAgg() {
  var docs = INV_CK.filter(function (r) { return r.storeId === INV_RPT_SHOP && r.date === INV_RPT_DATE; });
  var modeCnt = { '动态': 0, '锁库': 0, '速盘': 0 }, first = {}, final = {}, seq = {};
  docs.forEach(function (r, di) {
    modeCnt[invCkModeText(r.mode)] = (modeCnt[invCkModeText(r.mode)] || 0) + 1;
    (r.items || []).forEach(function (it) {
      var d = it.diff != null ? it.diff : Math.round((it.snapshot - it.real) * 100) / 100;
      if (!(it.code in first)) { first[it.code] = { name: it.name, diff: d, cost: it.cost || 0 }; }
      final[it.code] = { name: it.name, diff: d, cost: it.cost || 0, spec: it.spec || '', doc: r.no, status: r.status, mode: invCkModeText(r.mode) };
      seq[it.code] = (seq[it.code] || 0) + 1;
    });
  });
  var codes = Object.keys(final);
  var netQty = 0, netAmt = 0, diffCnt = 0;
  var rows = codes.map(function (c) {
    var f = final[c];
    var amt = Math.round(Math.abs(f.diff) * f.cost * 100) / 100;
    netQty += f.diff; netAmt += (f.diff > 0 ? 1 : -1) * amt; if (f.diff !== 0) diffCnt++;
    return { code: c, name: f.name, diff: f.diff, cost: f.cost, amt: amt, doc: f.doc, status: f.status, mode: f.mode, fixed: seq[c] > 1, firstDiff: first[c].diff };
  });
  netAmt = Math.round(netAmt * 100) / 100;
  rows.sort(function (a, b) { return b.amt - a.amt; });
  return { docs: docs, modeCnt: modeCnt, goodsCnt: codes.length, diffCnt: diffCnt, netQty: Math.round(netQty * 100) / 100, netAmt: netAmt, rows: rows };
}
function invCkRptRender() {
  var el = document.getElementById('invRptBody'); if (!el) return;
  if (!INV_RPT_DATE) { el.innerHTML = '<div style="text-align:center;color:#8a93a3;padding:36px 0;font-size:12px">该门店暂无盘点记录</div>'; return; }
  var a = invCkRptAgg();
  var h = '';
  h += '<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">';
  var cards = [
    { k: '盘点单数', v: a.docs.length + ' 张', sub: '动态 ' + (a.modeCnt['动态'] || 0) + ' · 锁库 ' + (a.modeCnt['锁库'] || 0) + ' · 速盘 ' + (a.modeCnt['速盘'] || 0) },
    { k: '覆盖商品', v: a.goodsCnt + ' 种', sub: '差异 ' + a.diffCnt + ' 种' },
    { k: '净差异量', v: (a.netQty > 0 ? '+' : '') + a.netQty, sub: '', c: a.netQty > 0 ? '#fc4b52' : (a.netQty < 0 ? '#3eb27e' : '#3a4252') },
    { k: '净差异金额', v: (a.netAmt > 0 ? '+' : '') + (a.netAmt < 0 ? '-' : '') + '¥' + Math.abs(a.netAmt).toFixed(2), sub: '盘盈为正', c: a.netAmt > 0 ? '#fc4b52' : (a.netAmt < 0 ? '#3eb27e' : '#3a4252') }
  ];
  cards.forEach(function (cd) {
    h += '<div style="flex:1;min-width:150px;background:#f7f9fd;border:1px solid #e9eef7;border-radius:4px;padding:10px 14px">' +
      '<div style="font-size:11px;color:#8a93a3">' + cd.k + '</div>' +
      '<div style="font-size:18px;font-weight:700;margin:2px 0;' + (cd.c ? 'color:' + cd.c : '') + '">' + cd.v + '</div>' +
      (cd.sub ? '<div style="font-size:11px;color:#8a93a3">' + cd.sub + '</div>' : '') + '</div>';
  });
  h += '</div>';
  var fixed = a.rows.filter(function (r) { return r.fixed && r.firstDiff !== r.diff; });
  if (fixed.length) {
    h += '<div style="font-size:12px;font-weight:600;color:#3a4252;margin-bottom:6px">⚠️ 过程修正（当日同商品多次盘点，差异已纠正）</div><div style="border:1px solid #f5d08c;background:#fffaf0;border-radius:4px;padding:8px 12px;margin-bottom:12px">';
    h += fixed.map(function (r) { return '<div style="font-size:12px;line-height:22px">' + msInvEsc(r.name) + '：首次 <b style="color:' + (r.firstDiff > 0 ? '#fc4b52' : (r.firstDiff < 0 ? '#3eb27e' : '#909399')) + '">' + (r.firstDiff > 0 ? '+' : '') + r.firstDiff + '</b> → 终值 <b style="color:' + (r.diff > 0 ? '#fc4b52' : (r.diff < 0 ? '#3eb27e' : '#909399')) + '">' + (r.diff > 0 ? '+' : '') + r.diff + '</b>（' + r.mode + ' ' + r.doc + (r.status === 'checking' ? ' · 盘点中' : '') + '）</div>'; }).join('');
    h += '</div>';
  }
  h += '<div style="font-size:12px;font-weight:600;color:#3a4252;margin-bottom:6px">盈亏明细（按差异金额排序）</div>';
  h += '<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr>' +
    '<th style="text-align:left;padding:6px 10px;background:#f7f9fd;border-bottom:1px solid #e9eef7">商品</th>' +
    '<th style="text-align:left;padding:6px 10px;background:#f7f9fd;border-bottom:1px solid #e9eef7">编码</th>' +
    '<th style="text-align:right;padding:6px 10px;background:#f7f9fd;border-bottom:1px solid #e9eef7">差异量</th>' +
    '<th style="text-align:right;padding:6px 10px;background:#f7f9fd;border-bottom:1px solid #e9eef7">差异金额</th>' +
    '<th style="text-align:left;padding:6px 10px;background:#f7f9fd;border-bottom:1px solid #e9eef7">终值来源</th>' +
    '</tr></thead><tbody>';
  if (!a.rows.length) h += '<tr><td colspan="5" style="text-align:center;color:#8a93a3;padding:24px 0">当日无盘点数据</td></tr>';
  a.rows.forEach(function (r) {
    var c = r.diff > 0 ? '#fc4b52' : (r.diff < 0 ? '#3eb27e' : '#909399');
    h += '<tr>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f0f3fa">' + msInvEsc(r.name) + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f0f3fa;color:#8a93a3">' + msInvEsc(r.code) + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f0f3fa;text-align:right;font-weight:600;color:' + c + '">' + (r.diff > 0 ? '+' : '') + r.diff + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f0f3fa;text-align:right;color:' + c + '">' + (r.amt ? (r.diff > 0 ? '+' : '-') + '¥' + r.amt.toFixed(2) : '¥0.00') + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #f0f3fa;color:#5b6472">' + r.mode + ' ' + r.doc + (r.status === 'checking' ? ' <span style="color:#f57316">盘点中(实时)</span>' : '') + '</td>' +
      '</tr>';
  });
  h += '</tbody></table>';
  el.innerHTML = h;
}
function invCkInit() {
  invCkLoad(); invListLoad();
  var el = document.getElementById('inv-checkContent');
  if (!el) { setTimeout(invCkInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">状态：</span>' +
      '<div class="segment" id="invCkStSeg">' +
        '<button class="segment-btn active" data-v="" onclick="invCkSetSt(\'\',this)">全部状态</button>' +
        '<button class="segment-btn" data-v="checking" onclick="invCkSetSt(\'checking\',this)">盘点中</button>' +
        '<button class="segment-btn" data-v="done" onclick="invCkSetSt(\'done\',this)">已完成</button>' +
      '</div>' +
      '<span style="font-size:12px;color:#3a4252">门店：</span>' +
      '<select class="ic-search" style="flex:0 1 180px" id="invCkShop" onchange="invCkSetShop(this.value)"><option value="">全部门店</option><option value="S2001">崧泽-青浦旗舰店</option><option value="S2002">崧泽-松江分店</option></select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="盘点单号" value="' + msInvEsc(INV_CK_KW) + '" onkeydown="if(event.key===\'Enter\')invCkQuery()" id="invCkKw">' +
      '<button class="ic-btn" onclick="invCkReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invCkQuery()">查询</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">动态=账面随售卖/补货刷新（理论=快照+变动）；锁库=冻结开始账面；差异金额=差异量×单位成本</span>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invCkOpenWizard()">+ 新增盘点</button>' +
      '<button class="ic-btn" onclick="invCkQuickOpen()">⚡ 单品速盘</button>' +
      '<button class="ic-btn" onclick="invCkRptOpen()">📋 盘点快报</button>' +
      '<button class="ic-btn" onclick="msInvToast(\'已导出盘点记录（演示）\')">导出</button>' +
    '</div>' +
    '<div id="invCheckCard" style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="width:100%;table-layout:fixed;border-collapse:collapse">' +
        '<thead><tr>' +
          '<th style="width:4%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th>' +
          '<th style="width:13%;text-align:left;vertical-align:middle;padding:8px 10px">盘点单号</th>' +
          '<th style="width:6%;text-align:left;vertical-align:middle;padding:8px 10px">区域</th>' +
          '<th style="width:7%;text-align:left;vertical-align:middle;padding:8px 10px">盘点方式</th>' +
          '<th style="width:8%;text-align:left;vertical-align:middle;padding:8px 10px">开始日期</th>' +
          '<th style="width:6%;text-align:left;vertical-align:middle;padding:8px 10px">完成日期</th>' +
          '<th style="width:6%;text-align:left;vertical-align:middle;padding:8px 10px">盘点人</th>' +
          '<th style="width:5%;text-align:right;vertical-align:middle;padding:8px 10px">差异品数</th>' +
          '<th style="width:6%;text-align:right;vertical-align:middle;padding:8px 10px">差异数量</th>' +
          '<th style="width:7%;text-align:right;vertical-align:middle;padding:8px 10px">差异金额(元)</th>' +
          '<th style="width:13%;text-align:left;vertical-align:middle;padding:8px 10px">商品（差异优先）</th>' +
          '<th style="width:8%;text-align:center;vertical-align:middle;padding:8px 6px">状态</th>' +
          '<th style="width:11%;text-align:left;vertical-align:middle;padding:8px 10px">操作</th>' +
        '</tr></thead>' +
        '<tbody id="invCkBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invCkPager" style="flex-shrink:0"></div>' +
    '</div>';
  var shopEl = document.getElementById('invCkShop'); if (shopEl) shopEl.value = INV_CK_SHOP;
  invCkRender();
}
function invCkRows() {
  var rows = msInvScopeFilter(INV_CK);
  if (INV_CK_ST) rows = rows.filter(function (r) { return r.status === INV_CK_ST; });
  if (INV_CK_SHOP) rows = rows.filter(function (r) { return r.storeId === INV_CK_SHOP; });
  if (INV_CK_KW) { var kw = INV_CK_KW.toLowerCase(); rows = rows.filter(function (r) { return r.no.toLowerCase().indexOf(kw) > -1; }); }
  return rows;
}
function invCkGoodsCell(r) {
  var items = r.items || [];
  if (!items.length) return '<span style="color:#8a93a3">—</span>';
  var diffs = [];
  items.forEach(function (it) {
    var d = it.diff != null ? it.diff : Math.round((it.snapshot - it.real) * 100) / 100;
    if (d !== 0) diffs.push({ name: it.name, d: d });
  });
  var full = items.map(function (it) { return it.name + (it.diff != null && it.diff !== 0 ? '（' + (it.diff > 0 ? '+' : '') + it.diff + '）' : ''); }).join('、');
  if (!diffs.length) return '<span style="color:#8a93a3;font-size:12px" title="' + msInvEsc(full) + '">无差异 · ' + items.length + '件</span>';
  var show = diffs.slice(0, 2).map(function (x) {
    var c = x.d > 0 ? '#fc4b52' : '#3eb27e';
    return msInvEsc(x.name) + ' <b style="color:' + c + '">' + (x.d > 0 ? '+' : '') + x.d + '</b>';
  }).join('、');
  var extra = diffs.length > 2 ? ' <span style="color:#8a93a3;font-size:11px">等' + diffs.length + '项</span>' : '';
  return '<span style="font-size:12px" title="' + msInvEsc(full) + '">' + show + extra + '</span>';
}
function invCkRender() {
  var rows = invCkRows(), tbody = document.getElementById('invCkBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_CK_SIZE) || 1;
  if (INV_CK_PAGE > pages) INV_CK_PAGE = pages; if (INV_CK_PAGE < 1) INV_CK_PAGE = 1;
  var start = (INV_CK_PAGE - 1) * INV_CK_SIZE, data = rows.slice(start, start + INV_CK_SIZE);
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1;
    var st = r.status === 'done' ? msInvBadge('已完成', 'ok') : msInvBadge('盘点中', 'blue');
    var act = r.status === 'checking'
      ? '<button class="ic-btn ic-btn-pri" style="height:24px;padding:0 8px" onclick="invCkDo(\'' + r.no + '\')">继续盘点</button>'
      : '<button class="ic-btn" style="height:24px;padding:0 8px" onclick="invCkView(\'' + r.no + '\')">查看</button>';
    if (invCkModeText(r.mode) === '动态') act += ' <button class="ic-btn" style="height:24px;padding:0 8px" onclick="invCkSnapView(\'' + r.no + '\')">快照</button>';
    return '<tr>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + seq + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px"><a style="color:#1677ff;cursor:pointer" onclick="invCkView(\'' + r.no + '\')">' + msInvEsc(r.no) + '</a></td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.loc || '仓库') + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + invCkModeText(r.mode) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + r.date + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + (r.endDate || '—') + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.by) + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px;' + (r.diff ? 'color:#fc4b52;font-weight:600' : '') + '">' + (r.diff ? r.diff : 0) + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px;' + (r.diffQty ? 'color:' + (r.diffQty > 0 ? '#fc4b52' : '#3eb27e') + ';font-weight:600' : '') + '">' + (r.diffQty ? (r.diffQty > 0 ? '+' : '') + r.diffQty : 0) + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px;' + (r.diffAmt ? 'color:#fc4b52;font-weight:600' : '') + '">' + (r.diffAmt ? '¥' + r.diffAmt.toFixed(2) : '¥0.00') + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + invCkGoodsCell(r) + '</td>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px">' + st + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + act + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="13" style="text-align:center;color:#999;padding:36px 0">暂无盘点记录</td></tr>';
  msInvPager(total, INV_CK_PAGE, INV_CK_SIZE, 'invCkPager', 'invCkGoPage');
}
function invCkGoPage(p) { INV_CK_PAGE = p; invCkRender(); }
function invCkSetSt(v, el) {
  INV_CK_ST = v; INV_CK_PAGE = 1;
  var seg = document.getElementById('invCkStSeg'); if (seg) {
    var btns = seg.querySelectorAll('.segment-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', el ? btns[i] === el : btns[i].getAttribute('data-v') === v);
  }
  invCkRender();
}
function invCkSetShop(v) { INV_CK_SHOP = v; INV_CK_PAGE = 1; invCkRender(); }
function invCkQuery() { var el = document.getElementById('invCkKw'); if (el) INV_CK_KW = el.value.trim(); INV_CK_PAGE = 1; invCkRender(); }
function invCkReset() { INV_CK_KW = ''; INV_CK_ST = ''; INV_CK_SHOP = ''; INV_CK_PAGE = 1;
  var a = document.getElementById('invCkKw'); if (a) a.value = '';
  var s = document.getElementById('invCkShop'); if (s) s.value = '';
  var seg = document.getElementById('invCkStSeg'); if (seg) { var btns = seg.querySelectorAll('.segment-btn'); for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', i === 0); }
  invCkRender();
}
// 当前实时数量（按盘点区域取 仓库/货架）
function invCkLiveQty(g, loc) { if (!g) return 0; return loc === '货架' ? g.shelf : g.warehouse; }
// 批次实时数量（按盘点区域取 b.w / b.s）
function invCkBatchQty(g, loc, batchNo) {
  if (!g || !g.batches) return 0;
  for (var i = 0; i < g.batches.length; i++) { if (g.batches[i].no === batchNo) return loc === '货架' ? g.batches[i].s : g.batches[i].w; }
  return 0;
}
// 新增盘点引导：区域 + 方式
function invCkOpenWizard() {
  msInvModal({ title: '新建盘点单', width: '520px', body:
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 20px;margin-top:6px">' +
      '<div><div style="font-size:12px;color:#5b6472;margin-bottom:6px">盘点区域</div>' +
      '<div style="display:flex;gap:0" id="ckLocTabs">' +
        '<button class="btn-tab active" data-v="仓库" onclick="invCkLocSel(this)">仓库盘点</button>' +
        '<button class="btn-tab" data-v="货架" onclick="invCkLocSel(this)">货架盘点</button></div></div>' +
      '<div><div style="font-size:12px;color:#5b6472;margin-bottom:6px">盘点方式</div>' +
      '<div style="display:flex;gap:0" id="ckModeTabs">' +
        '<button class="btn-tab" data-v="锁库" onclick="invCkModeSel(this)">锁库盘点</button>' +
        '<button class="btn-tab active" data-v="动态" onclick="invCkModeSel(this)">动态盘点</button></div></div>' +
    '</div>' +
    '<div style="font-size:11px;color:#8a93a3;line-height:20px;margin-top:16px;background:#f7f9fc;border:1px solid #eef1f6;border-radius:4px;padding:8px 10px">' +
      '<b>锁库</b>：冻结盘点开始时的库存账面，期间出入库不影响账面（无快照回看）；<br><b>动态</b>：盘点开始时记录开始快照，账面 = 开始快照 + 期间变动（补货/退仓/销售/售后等），售卖数据每分钟刷新，以提交时实时数据为准。<br><b>速盘</b>：便捷纠偏、无快照，录入实盘立即回写库存。<br>单据内有效期商品（按到期日逐批）与非有效期商品（盘总数）混合盘点，按商品各自的计数方式互不干扰。</div>',
    onOk: 'invCkOpenEdit()', okText: '下一步' });
  window._ckLoc = '仓库'; window._ckMode = '动态';
}
function invCkLocSel(el) {
  window._ckLoc = el.getAttribute('data-v');
  var els = document.querySelectorAll('#ckLocTabs .btn-tab'); for (var i = 0; i < els.length; i++) els[i].classList.toggle('active', els[i] === el);
}
function invCkModeSel(el) {
  window._ckMode = el.getAttribute('data-v');
  var els = document.querySelectorAll('#ckModeTabs .btn-tab'); for (var i = 0; i < els.length; i++) els[i].classList.toggle('active', els[i] === el);
}
// 盘点中单的临时录入项（real）
var INV_CK_EDIT = [], INV_CK_EDIT_TIMER = null;
function invCkOpenEdit(no) {
  var loc = window._ckLoc || '仓库', mode = window._ckMode || '动态', storeId = msInvScopeStoreId('S2001');
  var startDate = msInvToday(), editNo;
  if (no) {
    // 继续盘点：沿用原单区域/方式/快照，重开实时账面
    var r = null; INV_CK.forEach(function (x) { if (x.no === no) r = x; });
    if (!r) return;
    loc = r.loc || '仓库'; mode = invCkModeText(r.mode); storeId = r.storeId; startDate = r.date; editNo = r.no;
    INV_CK_EDIT = JSON.parse(JSON.stringify(r.items));
  } else {
    var d = new Date(); editNo = 'PD' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + String(100 + Math.floor(Math.random() * 900));
    INV_CK_EDIT = [];
    // 快照 = 该区域当前有库存商品；开启效期管理按批次展开（逐到期日盘），未开启盘总数
    for (var i = 0; i < INV_GOODS.length; i++) {
      var g = INV_GOODS[i];
      if (g.storeId !== storeId) continue;
      var spec = (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit;
      if (g.expiryManaged && g.batches && g.batches.length) {
        g.batches.forEach(function (b) {
          var bq = loc === '货架' ? b.s : b.w;
          if (bq <= 0) return;
          INV_CK_EDIT.push({ name: g.name, code: g.code, spec: spec, unit: g.unit, cost: g.avgCost, expiryManaged: true, batchNo: b.no, pdate: b.pdate || '', exp: b.exp || '', remain: msInvRemainDays(b.exp), snapshot: bq, real: bq });
        });
      } else {
        var q = invCkLiveQty(g, loc);
        if (q <= 0) continue;
        INV_CK_EDIT.push({ name: g.name, code: g.code, spec: spec, unit: g.unit, cost: g.avgCost, expiryManaged: false, snapshot: q, real: q });
      }
    }
  }
  window._ckNo = editNo; window._ckLoc = loc; window._ckMode = mode; window._ckStore = storeId; window._ckDate = startDate;
  invCkEditRender();
}
function invCkIsBatch(it) { return (it.expMode || (it.expiryManaged ? 'batch' : 'total')) === 'batch'; }
function invCkAddDays(pdate, days) { if (!pdate || isNaN(days)) return ''; var d = new Date(pdate + 'T00:00:00'); d.setDate(d.getDate() + days); var m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2); return d.getFullYear() + '-' + m + '-' + day; }
function invCkGoodsShelfLife(code) { var g = msInvFindGoods(code); if (!g || !g.batches) return null; for (var i = 0; i < g.batches.length; i++) { if (g.batches[i].shelfLife) return g.batches[i].shelfLife; } return null; }
function invCkToggleExp(i, mode) {
  var it = INV_CK_EDIT[i]; if (!it) return;
  it.expMode = mode;
  if (mode === 'batch') { if (!it.pdate) { it.pdate = ''; it.exp = ''; it.batchNo = ''; it.snapshot = 0; it.real = 0; } }
  else { var g = msInvFindGoods(it.code); it.pdate = ''; it.exp = ''; it.batchNo = ''; it.snapshot = (g && g.storeId === window._ckStore) ? invCkLiveQty(g, window._ckLoc) : it.snapshot; it.real = it.snapshot; }
  invCkEditRender();
}
function invCkAddBatchRow(code) {
  var g = msInvFindGoods(code); if (!g) return;
  var spec = (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit;
  INV_CK_EDIT.push({ name: g.name, code: g.code, spec: spec, unit: g.unit, cost: g.avgCost, expMode: 'batch', pdate: '', exp: '', batchNo: '', remain: null, snapshot: 0, real: 0 });
  invCkEditRender(); msInvToast('已新增批次行：请选择生产/到期日期（漏盘补录）');
}
function invCkSetPdate(i, v) {
  var it = INV_CK_EDIT[i]; if (!it) return; it.pdate = v;
  var sl = invCkGoodsShelfLife(it.code); if (sl && v) it.exp = invCkAddDays(v, sl);
  var eInp = document.getElementById('ckexp_' + i); if (eInp) eInp.value = it.exp || '';
  var rem = it.exp ? msInvRemainDays(it.exp) : null;
  var remEl = document.getElementById('ckrem_' + i); if (remEl) remEl.textContent = rem != null ? '(' + rem + '天)' : '';
}
function invCkSetExp(i, v) {
  var it = INV_CK_EDIT[i]; if (!it) return; it.exp = v;
  var rem = v ? msInvRemainDays(v) : null;
  var remEl = document.getElementById('ckrem_' + i); if (remEl) remEl.textContent = rem != null ? '(' + rem + '天)' : '';
}
function invCkAddGoodsOpen() {
  var storeId = window._ckStore;
  var opts = INV_GOODS.filter(function (g) { return g.storeId === storeId; }).map(function (g) { return '<option value="' + g.goodsId + '">' + msInvEsc(g.name) + ' / ' + msInvEsc(g.code) + (g.expiryManaged ? '（效期）' : '') + '</option>'; }).join('');
  msInvModal({ title: '添加盘点商品', width: '460px', body:
    '<div style="font-size:12px;color:#5b6472;margin-bottom:6px">选择商品（按名称/编码搜索）</div>' +
    '<input class="ic-search" id="ckAddKw" style="width:100%;margin-bottom:8px" placeholder="输入商品名称或编码筛选" oninput="invCkAddGoodsFilter()">' +
    '<select class="ic-search" id="ckAddSel" size="8" style="width:100%;height:210px">' + opts + '</select>',
    onOk: 'invCkAddGoodsConfirm()', okText: '添加' });
  invCkAddGoodsFilter();
}
function invCkAddGoodsFilter() {
  var kwEl = document.getElementById('ckAddKw'); if (!kwEl) return;
  var kw = kwEl.value.toLowerCase(); var sel = document.getElementById('ckAddSel'); if (!sel) return;
  for (var i = 0; i < sel.options.length; i++) { var t = sel.options[i].text.toLowerCase(); sel.options[i].style.display = (!kw || t.indexOf(kw) > -1) ? '' : 'none'; }
}
function invCkAddGoodsConfirm() {
  var sel = document.getElementById('ckAddSel'); if (!sel || !sel.value) { msInvToast('请选择商品'); return; }
  var g = null; INV_GOODS.forEach(function (x) { if (x.goodsId === sel.value) g = x; }); if (!g) return;
  var loc = window._ckLoc;
  function pushRow(b, pd, ex, snap) { INV_CK_EDIT.push({ name: g.name, code: g.code, spec: (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit, unit: g.unit, cost: g.avgCost, expMode: b ? 'batch' : 'total', pdate: pd || '', exp: ex || '', batchNo: b ? b.no : '', remain: ex ? msInvRemainDays(ex) : null, snapshot: snap, real: snap }); }
  if (g.expiryManaged && g.batches && g.batches.length) g.batches.forEach(function (bb) { pushRow(true, bb.pdate || '', bb.exp || '', loc === '货架' ? bb.s : bb.w); });
  else pushRow(false, '', '', invCkLiveQty(g, loc));
  msInvCloseModal(); invCkEditRender(); msInvToast('已添加：' + g.name);
}
function invCkEditRender() {
  var anyBatch = INV_CK_EDIT.some(function (it) { return invCkIsBatch(it); });
  var rowsHtml = INV_CK_EDIT.map(function (it, i) {
    var isBatch = invCkIsBatch(it);
    var g = msInvFindGoods(it.code);
    var live = 0;
    if (g && g.storeId === window._ckStore) live = isBatch ? invCkBatchQty(g, window._ckLoc, it.batchNo) : invCkLiveQty(g, window._ckLoc);
    var isLock = window._ckMode === '锁库';
    var snap = it.snapshot;
    var bookVal = isLock ? snap : live;
    var diff = Math.round((bookVal - it.real) * 100) / 100;
    var diffCls = diff === 0 ? 'color:#909399' : (diff < 0 ? 'color:#3eb27e' : 'color:#fc4b52');
    var diffAmt = Math.round(Math.abs(diff) * it.cost * 100) / 100;
    var modeCell = '<div style="display:flex;gap:0;white-space:nowrap">' +
      '<button class="btn-tab ' + (isBatch ? 'active' : '') + '" style="padding:2px 6px;font-size:11px" onclick="invCkToggleExp(' + i + ',\'batch\')">按效期</button>' +
      '<button class="btn-tab ' + (!isBatch ? 'active' : '') + '" style="padding:2px 6px;font-size:11px" onclick="invCkToggleExp(' + i + ',\'total\')">按总数</button></div>';
    var dateCell;
    if (isBatch) {
      var remain = it.exp ? msInvRemainDays(it.exp) : null;
      var remTxt = remain != null ? ' <span id="ckrem_' + i + '" style="color:' + (remain <= 0 ? '#ec2d30' : (remain <= 7 ? '#f57316' : '#3eb27e')) + '">(' + remain + '天)</span>' : '';
      dateCell = '<input type="date" id="ckpd_' + i + '" value="' + (it.pdate || '') + '" onchange="invCkSetPdate(' + i + ',this.value)" class="ic-search" style="width:118px"> <span style="color:#8a93a3">→</span> <input type="date" id="ckexp_' + i + '" value="' + (it.exp || '') + '" onchange="invCkSetExp(' + i + ',this.value)" class="ic-search" style="width:118px">' + remTxt + ' <button class="ic-btn" style="height:22px;padding:0 6px;font-size:11px" onclick="invCkAddBatchRow(\'' + it.code + '\')">+批</button>';
    } else { dateCell = '—'; }
    return '<tr>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + (i + 1) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.name) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.code) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.spec) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + modeCell + '</td>' +
      (anyBatch ? '<td style="text-align:left;vertical-align:middle;padding:8px 10px;font-size:12px">' + dateCell + '</td>' : '') +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + snap + '</td>' +
      (isLock ? '' : '<td style="text-align:right;vertical-align:middle;padding:8px 10px;color:#1677ff">' + (live - snap) + '</td>' +
        '<td style="text-align:right;vertical-align:middle;padding:8px 10px;font-weight:600">' + live + '</td>') +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px"><input id="ckreal_' + i + '" type="number" min="0" class="ic-search" style="width:100%" value="' + it.real + '" oninput="invCkDiff(' + i + ')"></td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px;font-weight:600;' + diffCls + '" id="ckdiff_' + i + '">' + (diff > 0 ? '+' : '') + diff + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px;font-weight:600;' + diffCls + '" id="ckamt_' + i + '">¥' + diffAmt.toFixed(2) + '</td>' +
    '</tr>';
  }).join('');
  var isLock = window._ckMode === '锁库';
  var locTxt = window._ckLoc === '货架' ? '货架' : '仓库';
  var body =
    '<div style="display:flex;flex-direction:column;height:100%">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;margin-bottom:12px;font-size:12px;color:#5b6472;flex-shrink:0">' +
      '<div>盘点单号：<b style="color:#0b1019">' + window._ckNo + '</b></div>' +
      '<div>盘点区域：<b style="color:#0b1019">' + (window._ckLoc === '货架' ? '货架' : '仓库') + '</b></div>' +
      '<div>盘点方式：<b style="color:#0b1019">' + window._ckMode + '</b></div>' +
      '<div>门店：<b style="color:#0b1019">' + (window._ckStore === 'S2002' ? '崧泽-松江分店' : '崧泽-青浦旗舰店') + '</b></div>' +
      '<div>开始日期：<b style="color:#0b1019">' + window._ckDate + '</b></div>' +
      '<div>盘点人：<b style="color:#0b1019">陈明</b></div>' +
    '</div>' +
    '<div style="font-size:11px;color:#8a93a3;background:#f7f9fc;border:1px solid #eef1f6;border-radius:4px;padding:6px 10px;margin-bottom:8px;flex-shrink:0">' +
      (isLock ? '🔒 锁库模式：账面 = 盘点开始冻结账面，' + locTxt + '出入库不影响差异。' : '📡 动态模式：账面 = 快照 + 期间变动（补货/退仓/销售/售后），随库存每分钟刷新，以提交时实时数据为准。') +
      ' 同单可混合有效期/非有效期商品（如食品与家具），各自按行级「计数方式」录入，互不影响；' + (anyBatch ? '开启效期的商品已按各到期日逐批展开，漏盘可点行内「+批」补日期。' : '') +
      ' 差异 = 账面 − 实盘；差异金额 = |差异量| × 单位成本。</div>' +
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-shrink:0"><button class="ic-btn" onclick="invCkAddGoodsOpen()">+ 添加商品</button><span style="flex:1"></span><span style="font-size:11px;color:#8a93a3">漏盘补录：效期行点「+批」补到期日；所选日期不在入库批次时，提交自动建主数据批次</span></div>' +
    '<div style="flex:1;min-height:0;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%;table-layout:fixed;border-collapse:collapse">' +
      '<thead><tr>' +
      '<th style="width:5%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">商品名称</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">编码/条码</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">规格</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">计数方式</th>' +
      (anyBatch ? '<th style="text-align:left;vertical-align:middle;padding:8px 10px">生产日期 → 到期日</th>' : '') +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">' + (isLock ? '冻结账面' : '开始快照') + '</th>' +
      (isLock ? '' : '<th style="text-align:right;vertical-align:middle;padding:8px 10px">变动</th><th style="text-align:right;vertical-align:middle;padding:8px 10px">理论库存</th>') +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">实盘数量</th>' +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">差异量</th>' +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">差异金额</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
    '</table></div>' +
    '</div>';
  var sz = invCheckModalSize();
  msInvModal({ title: (window._ckDate !== msInvToday() || INV_CK.some(function (x) { return x.no === window._ckNo && x.status === 'checking'; }) ? '继续盘点' : '新增盘点') + (isLock ? '（锁库）' : '（动态）'), width: sz.w, height: sz.h, bodyStyle: 'overflow:hidden;', body: body,
    onOk: 'invCkSaveCheckpoint()', okText: '保存盘点(暂存)', footer: false });
  var foot = document.createElement('div'); foot.className = 'ic-modal-footer';
  foot.innerHTML = '<span style="flex:1;font-size:12px;color:#8a93a3;align-self:center">保存=盘点中，可稍后继续；完成=差异修正库存并锁定</span>' +
    '<button class="btn-secondary" onclick="invCkSaveCheckpoint()">保存盘点(暂存)</button>' +
    '<button class="btn-primary" onclick="invCkSaveCommit()">完成盘点</button>';
  var m = document.getElementById('msInvModal'); if (m) m.appendChild(foot);
  invCkStartTimer();
}
function invCkStartTimer() {
  invCkStopTimer();
  // 动态模式：每 60s 重算账面（演示：读取当前库存作为实时值并刷新 UI）
  INV_CK_EDIT_TIMER = setInterval(function () {
    var rows = document.querySelectorAll('#msInvModal table tbody tr');
    if (!rows.length) { invCkStopTimer(); return; }
    INV_CK_EDIT.forEach(function (it, i) {
      var g = msInvFindGoods(it.code);
      var q = g ? (invCkIsBatch(it) ? invCkBatchQty(g, window._ckLoc, it.batchNo) : invCkLiveQty(g, window._ckLoc)) : it.snapshot;
      var realInp = document.getElementById('ckreal_' + i);
      var real = realInp ? parseFloat(realInp.value) : it.real; if (isNaN(real)) real = it.real;
      it.real = real;
      // 更新变动/理论列与差异
      if (window._ckMode === '动态') {
        var bookVal = q;
        var d = Math.round((bookVal - real) * 100) / 100;
        var diffEl = document.getElementById('ckdiff_' + i), amtEl = document.getElementById('ckamt_' + i);
        if (diffEl) diffEl.textContent = (d > 0 ? '+' : '') + d;
        if (amtEl) amtEl.textContent = '¥' + (Math.round(Math.abs(d) * it.cost * 100) / 100).toFixed(2);
      }
    });
  }, 60000);
}
function invCkStopTimer() { if (INV_CK_EDIT_TIMER) { clearInterval(INV_CK_EDIT_TIMER); INV_CK_EDIT_TIMER = null; } }
function invCkDiff(i) {
  var inp = document.getElementById('ckreal_' + i);
  if (!inp) return;
  var v = parseFloat(inp.value);
  if (isNaN(v)) v = 0;
  INV_CK_EDIT[i].real = v;
  var it = INV_CK_EDIT[i];
  var g = msInvFindGoods(it.code);
  var live = (g && g.storeId === window._ckStore) ? (invCkIsBatch(it) ? invCkBatchQty(g, window._ckLoc, it.batchNo) : invCkLiveQty(g, window._ckLoc)) : it.snapshot;
  var bookVal = window._ckMode === '锁库' ? it.snapshot : live;
  var diff = Math.round((bookVal - v) * 100) / 100;
  var diffEl = document.getElementById('ckdiff_' + i), amtEl = document.getElementById('ckamt_' + i);
  var dCls = diff === 0 ? 'color:#909399' : (diff < 0 ? 'color:#3eb27e' : 'color:#fc4b52');
  if (diffEl) { diffEl.style.cssText = 'text-align:right;vertical-align:middle;padding:8px 10px;font-weight:600;' + dCls; diffEl.textContent = (diff > 0 ? '+' : '') + diff; }
  if (amtEl) { amtEl.style.cssText = 'text-align:right;vertical-align:middle;padding:8px 10px;font-weight:600;' + dCls; amtEl.textContent = '¥' + (Math.round(Math.abs(diff) * it.cost * 100) / 100).toFixed(2); }
}
function invCkCollect() {
  // 汇总：差异品数=有差异的商品种数(去重)；差异数量=各行差异量合计；差异金额=各行|差异|×成本合计
  var diffCodes = {}, diffQty = 0, diffAmt = 0;
  var items = INV_CK_EDIT.map(function (it, i) {
    var g = msInvFindGoods(it.code);
    var live = (g && g.storeId === window._ckStore) ? (invCkIsBatch(it) ? invCkBatchQty(g, window._ckLoc, it.batchNo) : invCkLiveQty(g, window._ckLoc)) : it.snapshot;
    var bookVal = window._ckMode === '锁库' ? it.snapshot : live;
    var real = it.real;
    var d = Math.round((bookVal - real) * 100) / 100;
    var amt = Math.round(Math.abs(d) * it.cost * 100) / 100;
    if (d !== 0) { diffCodes[it.code] = 1; diffQty += d; diffAmt += amt; }
    return { name: it.name, code: it.code, spec: it.spec, unit: it.unit, cost: it.cost, expiryManaged: invCkIsBatch(it), pdate: it.pdate, exp: it.exp, batchNo: it.batchNo, snapshot: it.snapshot, real: real, diff: d };
  });
  diffAmt = Math.round(diffAmt * 100) / 100;
  return { items: items, diff: diffCodes.length, diffQty: Math.round(diffQty * 100) / 100, diffAmt: diffAmt };
}
function invCkSaveCheckpoint() {
  var d = invCkCollect();
  var exists = false, idx = -1;
  INV_CK.forEach(function (x, i) { if (x.no === window._ckNo) { exists = true; idx = i; } });
  var rec = { no: window._ckNo, date: window._ckDate, endDate: '', storeId: window._ckStore, loc: window._ckLoc, mode: window._ckMode, by: '陈明', diff: d.diff, diffQty: d.diffQty, diffAmt: d.diffAmt, status: 'checking', items: d.items };
  if (exists) INV_CK[idx] = rec; else INV_CK.unshift(rec);
  invCkPersist(); invCkStopTimer(); msInvCloseModal(); msInvToast('盘点已暂存（盘点中），可稍后继续'); invCkRender();
}
function invCkSaveCommit() {
  var d = invCkCollect();
  var exists = false, idx = -1;
  INV_CK.forEach(function (x, i) { if (x.no === window._ckNo) { exists = true; idx = i; } });
  var rec = { no: window._ckNo, date: window._ckDate, endDate: msInvToday(), storeId: window._ckStore, loc: window._ckLoc, mode: window._ckMode, by: '陈明', diff: d.diff, diffQty: d.diffQty, diffAmt: d.diffAmt, status: 'done', items: d.items };
  if (exists) INV_CK[idx] = rec; else INV_CK.unshift(rec);
  // 实盘数修正库存（按区域 + 只修正差异项；动态模式以当前实时为基准）
  d.items.forEach(function (it) {
    var g = msInvFindGoods(it.code);
    if (!g || g.storeId !== rec.storeId) return;
    var pos = rec.loc === '货架' ? '货架' : '仓库';
    if (it.expiryManaged) {
      // 按批次回写（开启效期：差异落在对应到期日批次）
      var b = null; for (var bi = 0; bi < g.batches.length; bi++) { if (g.batches[bi].no === it.batchNo) { b = g.batches[bi]; break; } }
      // 漏盘补录：所选日期(生产日期)在入库批次中不存在 → 自动在主数据新建批次（pdate/exp/实盘），补全主数据并修正库存
      if (!b && it.pdate) {
        var bno = 'RK' + it.pdate.replace(/-/g, '') + '-' + String(it.code).slice(-4) + (Math.floor(Math.random() * 90) + 10);
        b = { no: bno, pdate: it.pdate, shelfLife: invCkGoodsShelfLife(it.code), shelfLifeType: 1, exp: it.exp || '', w: 0, s: 0 };
        g.batches.push(b); it.batchNo = bno; invCkPersist();
      }
      if (!b) return;
      var cur = rec.loc === '货架' ? b.s : b.w;
      var delta = it.real - cur;
      if (delta === 0) return;
      if (rec.loc === '货架') b.s = Math.max(0, b.s + delta); else b.w = Math.max(0, b.w + delta);
      invFlowAdd(110, it.code, it.name, delta, pos, rec.no, b.no);
    } else {
      var cur = invCkLiveQty(g, rec.loc);
      var delta = it.real - cur;
      if (delta === 0) return;
      msInvFifoApply(g, rec.loc, delta);
      invFlowAdd(110, it.code, it.name, delta, pos, rec.no, '');
    }
  });
  invListPersist(); invCkPersist(); invCkStopTimer(); msInvCloseModal();
  msInvToast(d.diff ? '盘点完成，' + d.diff + ' 种商品差异（差异数量 ' + (d.diffQty > 0 ? '+' : '') + d.diffQty + '，金额 ¥' + d.diffAmt.toFixed(2) + '），库存已按实盘修正' : '盘点完成，无差异');
  invCkRender();
}
function invCkDo(no) {
  var r = null; INV_CK.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  window._ckLoc = r.loc || '仓库'; window._ckMode = invCkModeText(r.mode); window._ckStore = r.storeId; window._ckDate = r.date;
  invCkOpenEdit(no);
}
function invCkView(no, editMode) {
  var r = null; INV_CK.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var isLock = invCkModeText(r.mode) === '锁库';
  var anyExp = r.items.some(function (it) { return it.expiryManaged; });
  var rows = r.items.map(function (it, i) {
    var diff = it.diff != null ? it.diff : Math.round((it.snapshot - it.real) * 100) / 100;
    var diffHtml = diff === 0 ? '<span style="color:#909399">0</span>' : (diff > 0 ? '<span style="color:#fc4b52">+' + diff + '</span>' : '<span style="color:#3eb27e">' + diff + '</span>');
    var amt = Math.round(Math.abs(diff) * (it.cost || 0) * 100) / 100;
    var expCell = it.expiryManaged ? ((it.pdate ? it.pdate : '—') + ' → ' + (it.exp ? it.exp : '—')) : '—';
    return '<tr><td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + (i + 1) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.name) + '</td>' +
      (anyExp ? '<td style="text-align:left;vertical-align:middle;padding:8px 10px;font-size:12px">' + expCell + '</td>' : '') +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + it.snapshot + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + it.real + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + diffHtml + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">¥' + amt.toFixed(2) + '</td></tr>';
  }).join('');
  var sz = invCheckModalSize();
  msInvModal({ title: '盘点单详情 · ' + r.no, width: sz.w, height: sz.h, bodyStyle: 'overflow:hidden;', body:
    '<div style="display:flex;flex-direction:column;height:100%">' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px;color:#5b6472;margin-bottom:12px;flex-shrink:0">' +
      '<div>门店：<b style="color:#0b1019">' + (storeName[r.storeId] || r.storeId) + '</b></div><div>区域：<b style="color:#0b1019">' + msInvEsc(r.loc || '仓库') + '</b></div>' +
      '<div>方式：<b style="color:#0b1019">' + invCkModeText(r.mode) + '</b></div><div>盘点人：<b style="color:#0b1019">' + msInvEsc(r.by) + '</b></div>' +
      '<div>开始：<b style="color:#0b1019">' + r.date + '</b></div><div>完成：<b style="color:#0b1019">' + (r.endDate || '—') + '</b></div>' +
      '<div>差异品数：<b style="color:#0b1019">' + r.diff + '</b></div><div>差异数量：<b style="color:' + ((r.diffQty || 0) > 0 ? '#fc4b52' : ((r.diffQty || 0) < 0 ? '#3eb27e' : '#0b1019')) + '">' + ((r.diffQty || 0) > 0 ? '+' : '') + (r.diffQty || 0) + '</b></div><div>差异金额：<b style="color:#fc4b52">¥' + (r.diffAmt || 0).toFixed(2) + '</b></div>' +
    '</div>' +
    '<div style="flex:1;min-height:0;overflow:auto"><table style="width:100%;table-layout:fixed;border-collapse:collapse"><thead><tr>' +
      '<th style="width:5%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">商品名称</th>' +
      (anyExp ? '<th style="text-align:left;vertical-align:middle;padding:8px 10px">到期日(有效期至)</th>' : '') +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">' + (invCkModeText(r.mode) === '锁库' ? '冻结账面' : (invCkModeText(r.mode) === '速盘' ? '盘点账面' : '开始快照')) + '</th>' +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">实盘</th>' +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">差异量</th>' +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">差异金额</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '</div>',
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}
function invCkSnapView(no) {
  var r = null; INV_CK.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  if (invCkModeText(r.mode) !== '动态') { msInvToast('仅动态盘点单据可查看开始快照回看'); return; }
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var anyExp = r.items.some(function (it) { return it.expiryManaged; });
  var rows = r.items.map(function (it, i) {
    var diff = it.diff != null ? it.diff : Math.round((it.snapshot - it.real) * 100) / 100;
    var diffHtml = diff === 0 ? '<span style="color:#909399">0</span>' : (diff > 0 ? '<span style="color:#fc4b52">+' + diff + '</span>' : '<span style="color:#3eb27e">' + diff + '</span>');
    var expCell = it.expiryManaged ? ((it.pdate ? it.pdate : '—') + ' → ' + (it.exp ? it.exp : '—')) : '—';
    return '<tr><td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + (i + 1) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.name) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.code) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(it.spec || '') + '</td>' +
      (anyExp ? '<td style="text-align:left;vertical-align:middle;padding:8px 10px;font-size:12px">' + expCell + '</td>' : '') +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + it.snapshot + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + it.real + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + diffHtml + '</td></tr>';
  }).join('');
  var sz = invCheckModalSize();
  msInvModal({ title: '盘点快照 · ' + r.no, width: sz.w, height: sz.h, bodyStyle: 'overflow:hidden;', body:
    '<div style="display:flex;flex-direction:column;height:100%">' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px;color:#5b6472;margin-bottom:12px;flex-shrink:0">' +
      '<div>门店：<b style="color:#0b1019">' + (storeName[r.storeId] || r.storeId) + '</b></div><div>区域：<b style="color:#0b1019">' + msInvEsc(r.loc || '仓库') + '</b></div>' +
      '<div>盘点方式：<b style="color:#0b1019">' + invCkModeText(r.mode) + '</b></div>' +
      '<div>开始日期：<b style="color:#0b1019">' + r.date + '</b></div>' +
      (r.endDate ? '<div>完成日期：<b style="color:#0b1019">' + r.endDate + '</b></div><div>差异金额：<b style="color:#fc4b52">¥' + (r.diffAmt || 0).toFixed(2) + '</b></div>' : '') +
    '</div>' +
    '<div style="flex:1;min-height:0;overflow:auto"><table style="width:100%;table-layout:fixed;border-collapse:collapse"><thead><tr>' +
      '<th style="width:5%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">商品名称</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">编码/条码</th>' +
      '<th style="text-align:left;vertical-align:middle;padding:8px 10px">规格</th>' +
      (anyExp ? '<th style="text-align:left;vertical-align:middle;padding:8px 10px">到期日(有效期至)</th>' : '') +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">库存-快照</th>' +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">实盘</th>' +
      '<th style="text-align:right;vertical-align:middle;padding:8px 10px">差异</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '</div>',
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}
// 单品速盘（便捷盘点）：无快照，录入实盘立即回写库存；同日同区域自动合并为一整单
function invCkQuickOpen() {
  var storeId = msInvScopeStoreId('S2001');
  window._ckQLoc = '仓库';
  var opts = INV_GOODS.filter(function (g) { return g.storeId === storeId && (g.warehouse + g.shelf) > 0; })
    .map(function (g) { return '<option value="' + g.goodsId + '">' + msInvEsc(g.name) + ' / ' + msInvEsc(g.code) + (g.expiryManaged ? '（效期）' : '') + '</option>'; }).join('');
  var body =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 20px;margin-bottom:10px">' +
      '<div><div style="font-size:12px;color:#5b6472;margin-bottom:6px">盘点区域</div>' +
        '<select class="ic-search" style="width:100%;height:30px" id="ckQLoc" onchange="invCkQuickRenderReal()"><option value="仓库">仓库盘点</option><option value="货架">货架盘点</option></select></div>' +
      '<div><div style="font-size:12px;color:#5b6472;margin-bottom:6px">选择商品</div>' +
        '<select class="ic-search" style="width:100%;height:30px" id="ckQGoods" onchange="invCkQuickRenderReal()"><option value="">— 请选择商品 —</option>' + opts + '</select></div>' +
    '</div>' +
    '<div style="font-size:11px;color:#8a93a3;background:#f7f9fc;border:1px solid #eef1f6;border-radius:4px;padding:6px 10px;margin-bottom:8px">单品速盘：便捷纠偏、无快照，录入实盘数立即回写库存。同日同区域速盘自动合并为一整单（同商品取最新实盘覆盖）。开启效期商品按各到期日逐批录入，非效期商品盘总数；两种类型可混选、合并进同一张速盘单。</div>' +
    '<div id="ckQReal" style="max-height:300px;overflow:auto"></div>';
  msInvModal({ title: '⚡ 单品速盘', width: '720px', body: body, onOk: 'invCkQuickSubmit()', okText: '提交速盘' });
  invCkQuickRenderReal();
}
function invCkQuickRenderReal() {
  var realBox = document.getElementById('ckQReal'); if (!realBox) return;
  var gSel = document.getElementById('ckQGoods'), locSel = document.getElementById('ckQLoc');
  var gid = gSel ? gSel.value : '', loc = locSel ? locSel.value : '仓库';
  if (!gid) { realBox.innerHTML = '<div style="font-size:12px;color:#8a93a3;padding:20px;text-align:center">请选择商品后录入实盘数量</div>'; return; }
  var g = null; INV_GOODS.forEach(function (x) { if (x.goodsId === gid) g = x; }); if (!g) return;
  var pos = loc === '货架' ? '货架' : '仓库';
  if (g.expiryManaged && g.batches && g.batches.length) {
    var rows = g.batches.map(function (b) {
      var cur = loc === '货架' ? b.s : b.w;
      var remain = msInvRemainDays(b.exp);
      var expCell = (b.pdate ? b.pdate : '—') + ' → ' + (b.exp ? b.exp : '—') + (remain != null ? ' <span style="color:' + (remain <= 0 ? '#ec2d30' : (remain <= 7 ? '#f57316' : '#3eb27e')) + '">(' + remain + '天)</span>' : '');
      return '<tr>' +
        '<td style="text-align:left;vertical-align:middle;padding:8px 6px;font-size:12px">' + expCell + '</td>' +
        '<td style="text-align:right;vertical-align:middle;padding:8px 6px;color:#909399">' + cur + '</td>' +
        '<td style="text-align:left;vertical-align:middle;padding:8px 6px"><input id="ckQb_' + b.no + '" type="number" min="0" class="ic-search" style="width:90px" value="' + cur + '"></td></tr>';
    }).join('');
    realBox.innerHTML = '<div style="font-size:12px;font-weight:600;color:#1a2233;margin-bottom:6px">' + msInvEsc(g.name) + '（按到期日逐批录入）</div>' +
      '<table style="width:100%;table-layout:fixed;border-collapse:collapse"><thead><tr><th style="text-align:left;vertical-align:middle;padding:8px 6px">到期日(有效期至)</th><th style="width:90px;text-align:right;vertical-align:middle;padding:8px 6px">当前' + pos + '</th><th style="width:130px;text-align:left;vertical-align:middle;padding:8px 6px">实盘数量</th></tr></thead><tbody>' + rows + '</tbody></table>';
  } else {
    var cur = loc === '货架' ? g.shelf : g.warehouse;
    realBox.innerHTML = '<div style="font-size:12px;font-weight:600;color:#1a2233;margin-bottom:6px">' + msInvEsc(g.name) + '（盘总数）</div>' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="font-size:12px;color:#5b6472">当前' + pos + '：<b style="color:#0b1019">' + cur + '</b></span>' +
      '<span style="font-size:12px;color:#5b6472">实盘数量：</span>' +
      '<input id="ckQTotal" type="number" min="0" class="ic-search" style="width:110px" value="' + cur + '">' +
      '</div>';
  }
}
function invCkQuickSubmit() {
  var gSel = document.getElementById('ckQGoods'), locSel = document.getElementById('ckQLoc');
  if (!gSel || !gSel.value) { msInvToast('请选择商品'); return; }
  var loc = locSel ? locSel.value : '仓库', gid = gSel.value;
  var g = null; INV_GOODS.forEach(function (x) { if (x.goodsId === gid) g = x; }); if (!g) return;
  var pos = loc === '货架' ? '货架' : '仓库', storeId = g.storeId, today = msInvToday();
  var newItems = [];
  if (g.expiryManaged && g.batches && g.batches.length) {
    g.batches.forEach(function (b) {
      var inp = document.getElementById('ckQb_' + b.no); if (!inp) return;
      var real = parseFloat(inp.value); if (isNaN(real) || real < 0) real = 0;
      var cur = loc === '货架' ? b.s : b.w;
      var delta = real - cur;
      if (delta !== 0) { if (loc === '货架') b.s = Math.max(0, b.s + delta); else b.w = Math.max(0, b.w + delta); invFlowAdd(110, g.code, g.name, delta, pos, '速盘', b.no); }
      newItems.push({ name: g.name, code: g.code, spec: (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit, unit: g.unit, cost: g.avgCost, expiryManaged: true, batchNo: b.no, pdate: b.pdate || '', exp: b.exp || '', remain: msInvRemainDays(b.exp), snapshot: cur, real: real });
    });
  } else {
    var inp = document.getElementById('ckQTotal'); if (!inp) { msInvToast('请录入实盘数量'); return; }
    var real = parseFloat(inp.value); if (isNaN(real) || real < 0) real = 0;
    var cur = loc === '货架' ? g.shelf : g.warehouse;
    var delta = real - cur;
    if (delta !== 0) { if (loc === '货架') g.shelf = Math.max(0, g.shelf + delta); else g.warehouse = Math.max(0, g.warehouse + delta); invFlowAdd(110, g.code, g.name, delta, pos, '速盘', ''); }
    newItems.push({ name: g.name, code: g.code, spec: (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit, unit: g.unit, cost: g.avgCost, expiryManaged: false, snapshot: cur, real: real });
  }
  // 合并到同日同区域速盘整单（同商品/批次取最新实盘覆盖）
  var locCode = loc === '货架' ? 'H' : 'W';
  var no = 'PD' + today.replace(/-/g, '') + '-Q' + locCode;
  var order = null; INV_CK.forEach(function (x) { if (x.no === no) order = x; });
  if (!order) { order = { no: no, date: today, endDate: today, storeId: storeId, loc: loc, mode: '速盘', by: '陈明', status: 'done', src: 'quick', diff: 0, diffAmt: 0, items: [] }; INV_CK.unshift(order); }
  newItems.forEach(function (ni) {
    var key = ni.expiryManaged ? ni.code + '#' + ni.batchNo : ni.code;
    var idx = -1;
    order.items.forEach(function (oi, k) { if (oi.expiryManaged ? (oi.code + '#' + oi.batchNo === key) : (oi.code === key)) idx = k; });
    if (idx >= 0) order.items[idx] = ni; else order.items.push(ni);
  });
  var seen = {}, dc = 0, dq = 0, da = 0;
  order.items.forEach(function (it) { var d = Math.round((it.real - it.snapshot) * 100) / 100; if (d !== 0) { if (!seen[it.code]) { seen[it.code] = 1; dc++; } dq += d; da += Math.round(Math.abs(d) * (it.cost || 0) * 100) / 100; } });
  order.diff = dc; order.diffQty = Math.round(dq * 100) / 100; order.diffAmt = Math.round(da * 100) / 100; order.endDate = today;
  invCkPersist(); invListPersist(); msInvCloseModal();
  msInvToast('速盘已提交（合并至 ' + no + '）'); invCkRender();
}

/* ================================================================
 * 6) 库存明细 inv-detail（Vue Inventorydetails：全局变动流水账）
 * ================================================================ */
var INV_DETAIL_PAGE = 1, INV_DETAIL_SIZE = 10, INV_DETAIL_TYPE = '', INV_DETAIL_POS = '', INV_DETAIL_CAT = '', INV_DETAIL_KW = '';
var INV_DETAIL_STORES = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
function invFlowBackfill() {
  // 仅首次：把已存在的历史单据回放为流水（幂等：INV_FLOW 空才回放）
  invFlowLoad();
  if (INV_FLOW.length) return;
  try { invListLoad(); invEntryLoad(); invRtLoad(); invTfLoad(); } catch (e) {}
  INV_FLOW = [];
  INV_ENTRY.forEach(function (r) { if (String(r.status) !== '20') return; r.items.forEach(function (it) { invFlowAdd(10, it.code, it.name, it.qty, '仓库', r.no, r.no); }); });
  INV_RT.forEach(function (r) { if (String(r.status) !== '20') return; r.items.forEach(function (it) { invFlowAdd(20, it.code, it.name, -it.qty, '仓库', r.no, it.batch || r.no); }); });
  INV_TF.forEach(function (r) { if (r.status !== 'done') return; r.items.forEach(function (it) { invFlowAdd(40, it.code, it.name, -it.qty, '仓库', r.no, ''); }); });
}
function invDetailCatOptions() {
  var seen = {}, arr = [];
  INV_GOODS.forEach(function (g) { if (g.cat && !seen[g.cat]) { seen[g.cat] = 1; arr.push(g.cat); } });
  arr.sort();
  return '<option value="">全部分类</option>' + arr.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
}
function invDetailInit() {
  invFlowBackfill();
  var el = document.getElementById('inv-detailContent');
  if (!el) { setTimeout(invDetailInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">显示分类：</span>' +
      '<select class="ic-search" style="flex:0 1 150px" id="invDetailCat" onchange="invDetailSetCat(this.value)">' + invDetailCatOptions() + '</select>' +
      '<span style="font-size:12px;color:#3a4252">变动类型：</span>' +
      '<select class="ic-search" style="flex:0 1 150px" id="invDetailType" onchange="invDetailSetType(this.value)">' +
        '<option value="">全部类型</option>' + [10,20,30,40,50,60,70,80,90,100,110].map(function (t) { return '<option value="' + t + '">' + MS_INV_FLOW_TYPES[t] + '</option>'; }).join('') + '</select>' +
      '<span style="font-size:12px;color:#3a4252">位置：</span>' +
      '<select class="ic-search" style="flex:0 1 120px" id="invDetailPos" onchange="invDetailSetPos(this.value)"><option value="">全部位置</option><option>仓库</option><option>货架</option></select>' +
      '<button class="ic-btn" onclick="invDetailReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invDetailQuery()">查询</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">库存可信度审计：初始量→变动量→最新量 三段式全量流水</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="width:100%;table-layout:fixed;border-collapse:collapse">' +
        '<thead><tr>' +
          '<th style="width:5%;text-align:center;vertical-align:middle;padding:8px 6px">序号</th>' +
          '<th style="width:10%;text-align:left;vertical-align:middle;padding:8px 10px">商品名称</th>' +
          '<th style="width:11%;text-align:left;vertical-align:middle;padding:8px 10px">编码/条码</th>' +
          '<th style="width:8%;text-align:left;vertical-align:middle;padding:8px 10px">商品规格</th>' +
          '<th style="width:11%;text-align:left;vertical-align:middle;padding:8px 10px">入库单号</th>' +
          '<th style="width:9%;text-align:left;vertical-align:middle;padding:8px 10px">批次号</th>' +
          '<th style="width:7%;text-align:right;vertical-align:middle;padding:8px 10px">初始量</th>' +
          '<th style="width:7%;text-align:right;vertical-align:middle;padding:8px 10px">变动量</th>' +
          '<th style="width:7%;text-align:right;vertical-align:middle;padding:8px 10px">最新值</th>' +
          '<th style="width:8%;text-align:center;vertical-align:middle;padding:8px 6px">明细类型</th>' +
          '<th style="width:6%;text-align:center;vertical-align:middle;padding:8px 6px">点位</th>' +
          '<th style="width:11%;text-align:left;vertical-align:middle;padding:8px 10px">门店</th>' +
        '</tr></thead>' +
        '<tbody id="invDetailBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invDetailPager" style="flex-shrink:0"></div>' +
    '</div>';
  invDetailRender();
}
function invDetailRows() {
  var rows = INV_FLOW.slice();
  if (INV_DETAIL_CAT) rows = rows.filter(function (r) { return r.cat === INV_DETAIL_CAT; });
  if (INV_DETAIL_TYPE) rows = rows.filter(function (r) { return String(r.type) === INV_DETAIL_TYPE; });
  if (INV_DETAIL_POS) rows = rows.filter(function (r) { return r.pos === INV_DETAIL_POS; });
  return rows;
}
function invDetailRender() {
  var rows = invDetailRows(), tbody = document.getElementById('invDetailBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_DETAIL_SIZE) || 1;
  if (INV_DETAIL_PAGE > pages) INV_DETAIL_PAGE = pages; if (INV_DETAIL_PAGE < 1) INV_DETAIL_PAGE = 1;
  var start = (INV_DETAIL_PAGE - 1) * INV_DETAIL_SIZE, data = rows.slice(start, start + INV_DETAIL_SIZE);
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1;
    var inType = [10, 30, 70, 100].indexOf(r.type) > -1;
    var qtyHtml = '<span style="' + (inType ? 'color:#3eb27e' : 'color:#ec2d30') + ';font-weight:600">' + (r.qty > 0 ? '+' : '') + r.qty + '</span>';
    // 旧流水记录缺新字段时，从当前商品主数据兜底补全静态属性（规格/门店/分类）；初始量/最新值无法还原则显示 —
    var g = msInvFindGoods(r.code);
    var spec = r.spec || (g ? g.spec + '/' + g.unit : '—');
    var sid = r.storeId || (g ? g.storeId : '');
    var store = sid ? (INV_DETAIL_STORES[sid] || sid) : '—';
    return '<tr style="height:49px">' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px;color:#999">' + seq + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.name) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.code) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(spec) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.refNo) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(r.batch) + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + (r.init != null ? r.init : '—') + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + qtyHtml + '</td>' +
      '<td style="text-align:right;vertical-align:middle;padding:8px 10px">' + (r.latest != null ? r.latest : '—') + '</td>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px">' + msInvBadge(r.typeName, inType ? 'ok' : 'err') + '</td>' +
      '<td style="text-align:center;vertical-align:middle;padding:8px 6px">' + msInvEsc(r.pos) + '</td>' +
      '<td style="text-align:left;vertical-align:middle;padding:8px 10px">' + msInvEsc(store) + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="12" style="text-align:center;color:#999;padding:36px 0">暂无变动流水</td></tr>';
  msInvPager(total, INV_DETAIL_PAGE, INV_DETAIL_SIZE, 'invDetailPager', 'invDetailGoPage');
}
function invDetailGoPage(p) { INV_DETAIL_PAGE = p; invDetailRender(); }
function invDetailSetCat(v) { INV_DETAIL_CAT = v; INV_DETAIL_PAGE = 1; invDetailRender(); }
function invDetailSetType(v) { INV_DETAIL_TYPE = String(v); INV_DETAIL_PAGE = 1; invDetailRender(); }
function invDetailSetPos(v) { INV_DETAIL_POS = v; INV_DETAIL_PAGE = 1; invDetailRender(); }
function invDetailQuery() { INV_DETAIL_PAGE = 1; invDetailRender(); }
function invDetailReset() { INV_DETAIL_CAT = ''; INV_DETAIL_TYPE = ''; INV_DETAIL_POS = ''; INV_DETAIL_PAGE = 1;
  var a = document.getElementById('invDetailCat'); if (a) a.value = '';
  var b = document.getElementById('invDetailType'); if (b) b.value = '';
  var c = document.getElementById('invDetailPos'); if (c) c.value = '';
  invDetailRender();
}


/* ================================================================
 * 8) 入库查询 inv-inquiry（Vue Inventoryinquiry：已完成入库单 × 批次行查询）
 * ================================================================ */
var INV_INQ_PAGE = 1, INV_INQ_SIZE = 10, INV_INQ_SUP = '', INV_INQ_KW = '', INV_INQ_FROM = '', INV_INQ_TO = '';
function invInquiryInit() {
  invEntryLoad(); invListLoad();
  var el = document.getElementById('inv-inquiryContent');
  if (!el) { setTimeout(invInquiryInit, 80); return; }
  var supSet = [];
  INV_ENTRY.forEach(function (r) { if (String(r.status) === '20' && supSet.indexOf(r.supplier) < 0) supSet.push(r.supplier); });
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">供应商：</span>' +
      '<select class="ic-search" style="flex:0 1 170px" id="invInqSup" onchange="invInquirySetSup(this.value)"><option value="">全部供应商</option>' + supSet.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select>' +
      '<span style="font-size:12px;color:#3a4252">入库日期：</span>' +
      '<input type="date" class="ic-search" style="flex:0 1 140px" id="invInqFrom" value="' + INV_INQ_FROM + '" onchange="invInquirySetRange()">' +
      '<span style="color:#8a93a3;font-size:12px">至</span>' +
      '<input type="date" class="ic-search" style="flex:0 1 140px" id="invInqTo" value="' + INV_INQ_TO + '" onchange="invInquirySetRange()">' +
      '<input class="ic-search" style="flex:0 1 200px" placeholder="入库单号 / 商品名称 / 编码" value="' + msInvEsc(INV_INQ_KW) + '" onkeydown="if(event.key===\'Enter\')invInquiryQuery()" id="invInqKw">' +
      '<button class="ic-btn" onclick="invInquiryReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invInquiryQuery()">查询</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">已完成入库单的商品×批次行（含生产日期/保质期/有效期至）</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="min-width:1180px">' +
        '<thead><tr><th style="width:56px">序号</th><th style="width:170px">入库单号</th><th style="width:110px">入库日期</th><th style="width:150px">门店</th><th style="width:150px">供应商</th><th>商品名称</th><th>编码/条码</th><th style="width:90px">规格</th><th style="width:110px">生产日期</th><th style="width:90px">保质期</th><th style="width:110px">有效期至</th><th style="width:90px">数量</th><th style="width:100px">进货价</th><th style="width:110px">进货金额</th></tr></thead>' +
        '<tbody id="invInqBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invInqPager" style="flex-shrink:0"></div>' +
    '</div>';
  invInquiryRender();
}
function invInquiryRows() {
  var rows = [];
  INV_ENTRY.forEach(function (r) {
    if (String(r.status) !== '20') return;
    if (INV_INQ_SUP && r.supplier !== INV_INQ_SUP) return;
    if (INV_INQ_FROM && r.date < INV_INQ_FROM) return;
    if (INV_INQ_TO && r.date > INV_INQ_TO) return;
    r.items.forEach(function (it) { rows.push({ no: r.no, date: r.date, storeId: r.storeId, supplier: r.supplier, name: it.name, code: it.code, spec: it.spec || '', pdate: it.pdate || '', shelfLife: it.shelfLife, shelfLifeType: it.shelfLifeType, exp: it.exp || '', qty: it.qty, price: it.price }); });
  });
  if (INV_INQ_KW) { var kw = INV_INQ_KW.toLowerCase(); rows = rows.filter(function (x) { return x.no.toLowerCase().indexOf(kw) > -1 || x.name.toLowerCase().indexOf(kw) > -1 || x.code.indexOf(kw) > -1; }); }
  return rows;
}
function invInquiryRender() {
  var rows = invInquiryRows(), tbody = document.getElementById('invInqBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_INQ_SIZE) || 1;
  if (INV_INQ_PAGE > pages) INV_INQ_PAGE = pages; if (INV_INQ_PAGE < 1) INV_INQ_PAGE = 1;
  var start = (INV_INQ_PAGE - 1) * INV_INQ_SIZE, data = rows.slice(start, start + INV_INQ_SIZE);
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1;
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + seq + '</td>' +
      '<td>' + msInvEsc(r.no) + '</td><td>' + r.date + '</td><td>' + (storeName[r.storeId] || r.storeId) + '</td><td>' + msInvEsc(r.supplier) + '</td>' +
      '<td>' + msInvEsc(r.name) + '</td><td>' + msInvEsc(r.code) + '</td><td>' + msInvEsc(r.spec) + '</td>' +
      '<td>' + (r.pdate || '—') + '</td><td>' + msInvLifeText({ shelfLife: r.shelfLife, shelfLifeType: r.shelfLifeType }) + '</td><td>' + (r.exp || '—') + '</td>' +
      '<td style="text-align:right">' + r.qty + '</td><td style="text-align:right">¥' + r.price.toFixed(2) + '</td><td style="text-align:right">¥' + (r.qty * r.price).toFixed(2) + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="14" style="text-align:center;color:#999;padding:36px 0">暂无入库记录</td></tr>';
  msInvPager(total, INV_INQ_PAGE, INV_INQ_SIZE, 'invInqPager', 'invInquiryGoPage');
}
function invInquiryGoPage(p) { INV_INQ_PAGE = p; invInquiryRender(); }
function invInquirySetSup(v) { INV_INQ_SUP = v; INV_INQ_PAGE = 1; invInquiryRender(); }
function invInquirySetRange() {
  var a = document.getElementById('invInqFrom'), b = document.getElementById('invInqTo');
  INV_INQ_FROM = a ? a.value : ''; INV_INQ_TO = b ? b.value : ''; INV_INQ_PAGE = 1; invInquiryRender();
}
function invInquiryQuery() { var el = document.getElementById('invInqKw'); if (el) INV_INQ_KW = el.value.trim(); INV_INQ_PAGE = 1; invInquiryRender(); }
function invInquiryReset() { INV_INQ_KW = ''; INV_INQ_SUP = ''; INV_INQ_FROM = ''; INV_INQ_TO = ''; INV_INQ_PAGE = 1;
  var a = document.getElementById('invInqKw'); if (a) a.value = '';
  var b = document.getElementById('invInqSup'); if (b) b.value = '';
  var c = document.getElementById('invInqFrom'); if (c) c.value = '';
  var d = document.getElementById('invInqTo'); if (d) d.value = '';
  invInquiryRender();
}

// 页面初始化分发（由各页面 HTML 底部调用）
function initInventoryPage(pid) {
  if (pid === 'inv-list') invListInit();
  else if (pid === 'inv-entry') invEntryInit();
  else if (pid === 'inv-transfer') invTfInit();
  else if (pid === 'inv-return') invRtInit();
  else if (pid === 'inv-check') invCkInit();
  else if (pid === 'inv-detail') invDetailInit();
  else if (pid === 'inv-inquiry') invInquiryInit();
}
