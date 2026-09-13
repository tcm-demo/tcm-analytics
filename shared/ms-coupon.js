// ========== 优惠券域（对齐 Vue origin/master coupon 域，2026-09-03 补齐 demo） ==========
// 页面：cp-template 优惠券模板 / cp-plan 优惠券计划 / cp-record 优惠券记录
// 数据链：模板(券定义) → 计划(券+人群+规则) → 记录(发放到会员的券实例)
// 依赖 layout.js：showToast / initTicker；共享样式 layout.css（ic-btn/ic-modal/ic-input/ic-op-link/btn-*）
var MS_COUPON_LOADED = true;
function msCpEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function msCpToast(m) { try { showToast(m); } catch (e) { alert(m); } }
function msCpStoreName(id) { if (!id || id === 'ALL') return '全部门店可用'; return id === 'S2001' ? '崧泽-青浦旗舰店' : (id === 'S2002' ? '崧泽-松江分店' : id); }
function msCpTypeName(t) { return t === 'cash' ? '代金券' : (t === 'discount' ? '折扣券' : '兑换券'); }
function msCpD(d) { var n = new Date(d); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
function msCpNum(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function msCpBadge(text, kind) {
  var map = {
    ok: 'background:#f0f9eb;color:#67c23a;border:1px solid #e1f3d8',
    warn: 'background:#fdf6ec;color:#e6a23c;border:1px solid #faecd8',
    err: 'background:#fef0f0;color:#f56c6c;border:1px solid #fde2e2',
    info: 'background:#f4f4f5;color:#909399;border:1px solid #e9e9eb',
    blue: 'background:#ecf5ff;color:#409eff;border:1px solid #d9ecff'
  };
  return '<span style="display:inline-block;padding:1px 10px;border-radius:10px;font-size:12px;line-height:18px;white-space:nowrap;' + (map[kind] || map.info) + '">' + text + '</span>';
}
// 通用弹窗（主弹窗，一次仅一个）
function msCpDlg(opt) {
  msCpClose();
  var bd = document.createElement('div'); bd.className = 'ic-modal-backdrop'; bd.id = 'msCpBackdrop';
  bd.onclick = function (e) { if (e.target === this) msCpClose(); };
  var md = document.createElement('div'); md.className = 'ic-modal'; md.id = 'msCpModal';
  md.style.cssText = 'width:' + (opt.width || 'min(720px,94vw)') + ';';
  var foot = '';
  if (opt.footer !== false) {
    foot = '<div class="ic-modal-footer">' + (opt.footLeft || '');
    if (opt.cancelText !== null) foot += '<button class="btn-secondary" onclick="msCpClose()">' + (opt.cancelText || '取消') + '</button>';
    if (opt.onOk) foot += '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>';
    foot += '</div>';
  }
  md.innerHTML = '<div class="ic-modal-header"><span>' + opt.title + '</span><button class="ic-modal-close" onclick="msCpClose()">✕</button></div>'
    + '<div class="ic-modal-body" id="msCpBody" style="' + (opt.bodyStyle || 'max-height:70vh;overflow:auto;') + '">' + opt.body + '</div>' + foot;
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msCpClose() {
  var b = document.getElementById('msCpBackdrop'); if (b) b.remove();
  var m = document.getElementById('msCpModal'); if (m) m.remove();
}
function msCpBody(html) { var b = document.getElementById('msCpBody'); if (b) b.innerHTML = html; }
// 嵌套小弹层（选择器），压在主弹窗之上，关闭不销毁主弹窗
function msCpPop(opt) {
  msCpPopClose();
  var bd = document.createElement('div'); bd.id = 'msCpPopBackdrop';
  bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9400;';
  bd.onclick = function (e) { if (e.target === this) msCpPopClose(); };
  var md = document.createElement('div'); md.id = 'msCpPop';
  md.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:' + (opt.width || 'min(640px,90vw)') + ';max-height:78vh;display:flex;flex-direction:column;background:#fff;border-radius:6px;box-shadow:0 12px 48px rgba(0,0,0,.22);z-index:9401;';
  md.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #eef1f6;font-size:14px;font-weight:600;color:#0b1019;flex-shrink:0"><span>' + opt.title + '</span><button onclick="msCpPopClose()" style="border:none;background:none;font-size:16px;color:#909399;cursor:pointer">✕</button></div>'
    + '<div style="flex:1;overflow:auto;min-height:0" id="msCpPopBody">' + opt.body + '</div>'
    + (opt.footer === false ? '' : '<div style="display:flex;justify-content:flex-end;gap:10px;padding:12px 18px;border-top:1px solid #eef1f6;flex-shrink:0"><button class="btn-secondary" onclick="msCpPopClose()">' + (opt.cancelText || '取消') + '</button>' + (opt.onOk ? '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>' : '') + '</div>');
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msCpPopClose() {
  var b = document.getElementById('msCpPopBackdrop'); if (b) b.remove();
  var m = document.getElementById('msCpPop'); if (m) m.remove();
}
function msCpPopBody(html) { var b = document.getElementById('msCpPopBody'); if (b) b.innerHTML = html; }
// 分页渲染
function msCpPager(total, page, size, pagerId, cbName) {
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
/* ================================================================
 * 共享种子数据
 * ================================================================ */
var CP_GOODS = [
  { code: '6901234500011', name: '宁夏硒砂瓜', price: 4.98, unit: 'kg' },
  { code: '6901234500028', name: '妃子笑荔枝', price: 26.8, unit: 'kg' },
  { code: '6901234500035', name: '金枕榴莲', price: 39.9, unit: 'kg' },
  { code: '6901234500042', name: '云南夏黑葡萄', price: 15.8, unit: 'kg' },
  { code: '6901234500059', name: '鲜鸡蛋(30枚)', price: 19.9, unit: '盒' },
  { code: '6901234500066', name: '猪前腿肉', price: 23.8, unit: 'kg' },
  { code: '6901234500073', name: '三黄鸡', price: 21.5, unit: '只' },
  { code: '6901234500080', name: '鲈鱼', price: 32.0, unit: 'kg' },
  { code: '6901234500097', name: '东北大米5kg', price: 42.9, unit: '袋' },
  { code: '6901234500103', name: '卷纸(12卷)', price: 29.9, unit: '提' }
];
var CP_USERS = [
  { n: '张阿姨', m: '138****2216' }, { n: '王先生', m: '139****8803' }, { n: '李奶奶', m: '136****3347' },
  { n: '陈小姐', m: '135****7721' }, { n: '刘师傅', m: '137****9902' }, { n: '赵女士', m: '133****5526' },
  { n: '孙大爷', m: '158****1120' }, { n: '周同学', m: '150****4478' }, { n: '吴阿姨', m: '139****6653' }, { n: '郑先生', m: '186****9918' }
];
var CP_CATS = [{ p: '生鲜', c: ['蔬菜', '水果', '肉禽', '水产'] }, { p: '百货', c: ['粮油调味', '休闲食品', '纸品个护', '家居日用'] }];
function msCpGoodsByCode(code) { for (var i = 0; i < CP_GOODS.length; i++) if (CP_GOODS[i].code === code) return CP_GOODS[i]; return null; }
/* ================================================================
 * 1) 优惠券模板 cp-template（Vue Templatelist + Coupontemplate）
 * ================================================================ */
var CP_TPL_KEY = 'tcm_cp_templates_v1';
var CP_TPL_PAGE = 1, CP_TPL_SIZE = 10, CP_TPL_ST = '', CP_TPL_D1 = '', CP_TPL_D2 = '';
var CP_TPL_DRAFT = null;
var TPL_SEED = [
  { templateId: 'TPL001', name: '新人专享券', type: 'cash', rule: { kind: 'reduce', full: 50, value: 8 }, scope: { kind: 'all', cat1: '生鲜', cat2: '蔬菜', prods: [] }, shop: 'ALL', effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 30, date: '' }, overlayCoupon: true, overlayActivity: true, status: '0', createdAt: '2026-06-20' },
  { templateId: 'TPL002', name: '果蔬满减券', type: 'cash', rule: { kind: 'reduce', full: 30, value: 5 }, scope: { kind: 'cat', cat1: '生鲜', cat2: '蔬菜', prods: [] }, shop: 'ALL', effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 30, date: '' }, overlayCoupon: true, overlayActivity: false, status: '0', createdAt: '2026-07-01' },
  { templateId: 'TPL003', name: '肉禽88折券', type: 'discount', rule: { kind: 'discount', full: 20, value: 8.8 }, scope: { kind: 'cat', cat1: '生鲜', cat2: '肉禽', prods: [] }, shop: 'ALL', effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 30, date: '' }, overlayCoupon: false, overlayActivity: true, status: '0', createdAt: '2026-07-10' },
  { templateId: 'TPL004', name: '全场95折券', type: 'discount', rule: { kind: 'discount', full: 0, value: 9.5 }, scope: { kind: 'all', cat1: '生鲜', cat2: '蔬菜', prods: [] }, shop: 'ALL', effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 30, date: '' }, overlayCoupon: true, overlayActivity: true, status: '1', createdAt: '2026-07-15' },
  { templateId: 'TPL005', name: '会员生日礼券', type: 'cash', rule: { kind: 'reduce', full: 100, value: 20 }, scope: { kind: 'all', cat1: '生鲜', cat2: '蔬菜', prods: [] }, shop: 'ALL', effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 30, date: '' }, overlayCoupon: false, overlayActivity: true, status: '0', createdAt: '2026-08-01' },
  { templateId: 'TPL006', name: '榴莲兑换券', type: 'exchange', rule: { kind: 'threshold', full: 0, value: 1 }, scope: { kind: 'prod', cat1: '生鲜', cat2: '水果', prods: [{ code: '6901234500035', name: '金枕榴莲', price: 39.9, unit: 'kg' }] }, shop: 'ALL', effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 7, date: '' }, overlayCoupon: true, overlayActivity: false, status: '0', createdAt: '2026-08-05' },
  { templateId: 'TPL007', name: '满200减30大促券', type: 'cash', rule: { kind: 'reduce', full: 200, value: 30 }, scope: { kind: 'all', cat1: '生鲜', cat2: '蔬菜', prods: [] }, shop: 'ALL', effective: { kind: 'date', days: 1, date: '2026-09-05' }, expiry: { kind: 'days', days: 15, date: '' }, overlayCoupon: false, overlayActivity: false, status: '0', createdAt: '2026-08-10' },
  { templateId: 'TPL008', name: '老客9折回馈券', type: 'discount', rule: { kind: 'discount', full: 100, value: 9 }, scope: { kind: 'all', cat1: '生鲜', cat2: '蔬菜', prods: [] }, shop: 'S2001', effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 45, date: '' }, overlayCoupon: true, overlayActivity: true, status: '1', createdAt: '2026-08-15' }
];
var CP_TPL = [];
function cpTplLoad() { try { var r = localStorage.getItem(CP_TPL_KEY); if (r) { CP_TPL = JSON.parse(r); return; } } catch (e) {} CP_TPL = JSON.parse(JSON.stringify(TPL_SEED)); cpTplPersist(); }
function cpTplPersist() { try { localStorage.setItem(CP_TPL_KEY, JSON.stringify(CP_TPL)); } catch (e) {} }
function cpTplById(id) { for (var i = 0; i < CP_TPL.length; i++) if (CP_TPL[i].templateId === id) return CP_TPL[i]; return null; }
function cpTplNextId() { var max = 0; CP_TPL.forEach(function (t) { var n = parseInt((t.templateId || '').replace('TPL', ''), 10); if (n > max) max = n; }); return 'TPL' + ('00' + (max + 1)).slice(-3); }
function cpTplType(t) { return t.type === 'cash' ? '代金券' : (t.type === 'discount' ? '折扣券' : '兑换券'); }
function cpTplRuleInfo(t) {
  var r = t.rule, full = msCpNum(r.full), v = msCpNum(r.value);
  if (r.kind === 'reduce') return (full > 0 ? '满' + full + '减' + v : '无门槛减' + v) + '元';
  if (r.kind === 'discount') return (full > 0 ? '满' + full + '元享' : '无门槛') + v + '折';
  return full > 0 ? '满' + full + '元可用' : '无门槛可用';
}
function cpTplScopeText(t) {
  var s = t.scope;
  if (s.kind === 'all') return '全场通用';
  if (s.kind === 'cat') return '限分类·' + s.cat2;
  return '指定商品 ' + (s.prods || []).length + ' 件';
}
function cpTplUsageText(t) {
  var s = cpTplScopeText(t);
  var o = [];
  if (t.overlayCoupon) o.push('可叠券');
  if (t.overlayActivity) o.push('可叠活动');
  return o.length ? s + ' · ' + o.join('+') : s + ' · 不可叠加';
}
function cpTplActivePlan(templateId) {
  var names = [];
  try {
    var plans = JSON.parse(localStorage.getItem('tcm_cp_plans_v1') || '[]');
    plans.forEach(function (p) { if (String(p.status) === '0' && p.coupons) p.coupons.forEach(function (c) { if (c.templateId === templateId && names.indexOf(p.name) < 0) names.push(p.name); }); });
  } catch (e) {}
  return names.join('、') || '—';
}
function cpTplInit() {
  cpTplLoad();
  var el = document.getElementById('cp-templateContent');
  if (!el) { setTimeout(cpTplInit, 80); return; }
  function tab(v, label) { return '<button class="btn-tab' + (CP_TPL_ST === v ? ' active' : '') + '" onclick="cpTplSetSt(\'' + v + '\')">' + label + '</button>'; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">模板状态：</span>' +
      '<div style="display:flex;gap:0">' + tab('', '全部') + tab('0', '启用') + tab('1', '禁用') + '</div>' +
      '<span style="font-size:12px;color:#8a93a3;margin-left:6px">创建时间</span>' +
      '<input type="date" class="ic-input" style="width:148px" id="cpTplD1" value="' + CP_TPL_D1 + '">' +
      '<span style="color:#8a93a3">—</span>' +
      '<input type="date" class="ic-input" style="width:148px" id="cpTplD2" value="' + CP_TPL_D2 + '">' +
      '<button class="ic-btn" onclick="cpTplReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="cpTplQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="cpTplOpen(\'new\', null)">＋ 新增模板</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1240px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:100px">模板ID</th><th style="width:140px">模板名称</th><th style="width:80px">券类型</th>' +
            '<th style="width:140px">优惠信息</th><th style="width:170px">使用限制</th><th style="width:110px">可用门店</th>' +
            '<th style="width:130px">进行中活动</th><th style="width:100px">创建时间</th><th style="width:70px">状态</th><th style="width:170px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="cpTplBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="cpTplPager" style="flex-shrink:0"></div>' +
    '</div>';
  cpTplRender();
}
function cpTplSetSt(v) { CP_TPL_ST = v; var el = document.getElementById('cp-templateContent'); if (el) { var bs = el.querySelectorAll('.btn-tab'); for (var i = 0; i < bs.length; i++) bs[i].classList.remove('active'); } var all = el ? el.querySelectorAll('[onclick^="cpTplSetSt"]') : []; for (var j = 0; j < all.length; j++) { if ((all[j].getAttribute('onclick') || '').indexOf("'" + v + "'") >= 0) all[j].classList.add('active'); } cpTplRender(); }
function cpTplReset() {
  CP_TPL_ST = ''; CP_TPL_D1 = ''; CP_TPL_D2 = ''; CP_TPL_PAGE = 1;
  var d1 = document.getElementById('cpTplD1'), d2 = document.getElementById('cpTplD2');
  if (d1) d1.value = ''; if (d2) d2.value = '';
  var el = document.getElementById('cp-templateContent'); if (el) { var bs = el.querySelectorAll('.btn-tab'); for (var i = 0; i < bs.length; i++) bs[i].classList.remove('active'); if (bs[0]) bs[0].classList.add('active'); }
  cpTplRender();
}
function cpTplQuery() {
  var d1 = document.getElementById('cpTplD1'), d2 = document.getElementById('cpTplD2');
  CP_TPL_D1 = d1 ? d1.value : ''; CP_TPL_D2 = d2 ? d2.value : '';
  CP_TPL_PAGE = 1; cpTplRender();
}
function cpTplRows() {
  var k1 = CP_TPL_D1, k2 = CP_TPL_D2;
  return CP_TPL.filter(function (t) {
    if (CP_TPL_ST !== '' && String(t.status) !== CP_TPL_ST) return false;
    if (k1 && t.createdAt < k1) return false;
    if (k2 && t.createdAt > k2) return false;
    return true;
  });
}
function cpTplRender(page) {
  if (page) CP_TPL_PAGE = page;
  var rows = cpTplRows();
  var pages = Math.ceil(rows.length / CP_TPL_SIZE) || 1;
  if (CP_TPL_PAGE > pages) CP_TPL_PAGE = pages;
  if (CP_TPL_PAGE < 1) CP_TPL_PAGE = 1;
  var slice = rows.slice((CP_TPL_PAGE - 1) * CP_TPL_SIZE, CP_TPL_PAGE * CP_TPL_SIZE);
  var body = document.getElementById('cpTplBody');
  if (!body) return;
  body.innerHTML = slice.map(function (t, i) {
    var st = String(t.status) === '0' ? msCpBadge('启用', 'ok') : msCpBadge('禁用', 'err');
    var op = '';
    op += '<button class="ic-op-link" onclick="cpTplOpen(\'view\',\'' + t.templateId + '\')">查看</button>';
    op += '<button class="ic-op-link" onclick="cpTplOpen(\'edit\',\'' + t.templateId + '\')">编辑</button>';
    if (String(t.status) === '0') op += '<button class="ic-op-link" style="color:#e6a23c" onclick="cpTplToggle(\'' + t.templateId + '\',\'1\')">禁用</button>';
    else op += '<button class="ic-op-link" style="color:#67c23a" onclick="cpTplToggle(\'' + t.templateId + '\',\'0\')">启用</button>';
    op += '<button class="ic-op-link" onclick="cpTplIssue(\'' + t.templateId + '\')">指定发放</button>';
    op += '<button class="ic-op-link" style="color:#f56c6c" onclick="cpTplDel(\'' + t.templateId + '\')">删除</button>';
    return '<tr><td style="text-align:center;color:#999">' + ((CP_TPL_PAGE - 1) * CP_TPL_SIZE + i + 1) + '</td>' +
      '<td>' + t.templateId + '</td>' +
      '<td><button class="ic-op-link" style="font-weight:600" onclick="cpTplOpen(\'view\',\'' + t.templateId + '\')">' + msCpEsc(t.name) + '</button></td>' +
      '<td>' + cpTplType(t) + '</td>' +
      '<td>' + cpTplRuleInfo(t) + '</td>' +
      '<td style="font-size:11px;color:#5b6472">' + msCpEsc(cpTplUsageText(t)) + '</td>' +
      '<td>' + msCpStoreName(t.shop) + '</td>' +
      '<td style="font-size:11px">' + msCpEsc(cpTplActivePlan(t.templateId)) + '</td>' +
      '<td style="color:#5b6472">' + t.createdAt + '</td>' +
      '<td>' + st + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="11" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msCpPager(rows.length, CP_TPL_PAGE, CP_TPL_SIZE, 'cpTplPager', 'cpTplRender');
}
function cpTplToggle(id, to) {
  var t = cpTplById(id); if (!t) return;
  t.status = to; cpTplPersist();
  msCpToast('模板 ' + id + ' 已' + (to === '0' ? '启用' : '禁用')); cpTplRender();
}
function cpTplDel(id) {
  var t = cpTplById(id); if (!t) return;
  msCpDlg({ title: '删除模板 · ' + id, width: 'min(460px,94vw)', body:
    '<div style="font-size:13px;color:#0b1019;margin-bottom:6px">确认删除该优惠券模板？</div>' +
    '<div style="font-size:12px;color:#5b6472;line-height:20px">模板「' + msCpEsc(t.name) + '」删除后不可恢复；已加入发放计划中的该券批次不受影响，历史记录保留。</div>',
    onOk: 'cpTplDelDo(\'' + id + '\')', okText: '确认删除' });
}
function cpTplDelDo(id) {
  CP_TPL = CP_TPL.filter(function (t) { return t.templateId !== id; });
  cpTplPersist(); msCpClose(); msCpToast('模板已删除'); cpTplRender();
}
// 模板表单（新增/编辑/查看）
function cpTplOpen(mode, id) {
  var t = id ? cpTplById(id) : null;
  var isNew = !t;
  CP_TPL_DRAFT = t ? JSON.parse(JSON.stringify(t)) : {
    templateId: cpTplNextId(), name: '', type: 'cash', rule: { kind: 'reduce', full: 50, value: 8 },
    scope: { kind: 'all', cat1: '生鲜', cat2: '蔬菜', prods: [] }, shop: 'ALL',
    effective: { kind: 'immediate', days: 1, date: '' }, expiry: { kind: 'days', days: 30, date: '' },
    overlayCoupon: true, overlayActivity: true, status: '0', createdAt: msCpD(Date.now())
  };
  var ro = mode === 'view';
  msCpDlg({
    title: (ro ? '查看优惠券模板' : (isNew ? '新增优惠券模板' : '编辑优惠券模板 · ' + id)) + (ro ? '（' + (t ? msCpEsc(t.name) : '') + '）' : ''),
    width: 'min(920px,94vw)',
    body: cpTplForm(ro),
    bodyStyle: 'max-height:70vh;overflow:auto;',
    onOk: ro ? null : 'cpTplSave(\'' + (isNew ? 'new' : id) + '\')', okText: '保存',
    cancelText: ro ? '关闭' : '取消'
  });
}
function cpTplFormRedraw() { msCpBody(cpTplForm(false)); }
function cpTplD(path, v) { var p = path.split('.'), o = CP_TPL_DRAFT; for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }
function cpTplForm(ro) {
  var d = CP_TPL_DRAFT; if (!d) return '';
  var dis = ro ? ' disabled' : '';
  var rad = function (name, val, cur, label) { return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:16px;cursor:pointer;white-space:nowrap"><input type="radio" name="' + name + '"' + (cur === val ? ' checked' : '') + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'' + name + '\',\'' + val + '\')') + '">' + label + '</label>'; };
  // 分类二级选项
  var cat1Opt = '', cat2Opt = '';
  for (var ci = 0; ci < CP_CATS.length; ci++) cat1Opt += '<option value="' + CP_CATS[ci].p + '"' + (d.scope.cat1 === CP_CATS[ci].p ? ' selected' : '') + '>' + CP_CATS[ci].p + '</option>';
  var cat2Arr = []; for (var ci2 = 0; ci2 < CP_CATS.length; ci2++) if (CP_CATS[ci2].p === d.scope.cat1) cat2Arr = CP_CATS[ci2].c;
  for (var cj = 0; cj < cat2Arr.length; cj++) cat2Opt += '<option value="' + cat2Arr[cj] + '"' + (d.scope.cat2 === cat2Arr[cj] ? ' selected' : '') + '>' + cat2Arr[cj] + '</option>';
  // 指定商品子表
  var prodHtml = '';
  var prods = d.scope.prods || [];
  if (prods.length) {
    prodHtml = '<div style="margin-top:8px;border:1px solid #e9eef7;border-radius:4px;overflow:hidden"><table style="width:100%;font-size:12px"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:6px 10px;text-align:left">商品名称</th><th style="padding:6px 10px;text-align:left">编码/条码</th><th style="padding:6px 10px;text-align:left">销售价</th><th style="padding:6px 10px;width:60px">操作</th></tr></thead><tbody>';
    prods.forEach(function (g, i) {
      prodHtml += '<tr><td style="padding:6px 10px">' + msCpEsc(g.name) + '</td><td style="padding:6px 10px;color:#8a93a3">' + msCpEsc(g.code) + '</td><td style="padding:6px 10px">¥' + msCpNum(g.price).toFixed(2) + '/' + g.unit + '</td><td style="padding:6px 10px">' + (ro ? '' : '<button class="ic-op-link" style="color:#f56c6c" onclick="cpTplProdDel(' + i + ')">移除</button>') + '</td></tr>';
    });
    prodHtml += '</tbody></table></div>';
  }
  var h = '<div style="font-size:12px;color:#0b1019">';
  // 基础信息
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px">';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">模板名称 <span style="color:#fc4b52">*</span></div><input class="ic-input" placeholder="请输入模板名称" value="' + msCpEsc(d.name) + '" oninput="cpTplD(\'name\',this.value)"' + dis + '></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">模板ID</div><input class="ic-input" value="' + msCpEsc(d.templateId) + '" oninput="cpTplD(\'templateId\',this.value)"' + dis + '></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">优惠券类型</div><select class="ic-input"' + dis + ' onchange="cpTplD(\'type\',this.value)"><option value="cash"' + (d.type === 'cash' ? ' selected' : '') + '>代金券</option><option value="discount"' + (d.type === 'discount' ? ' selected' : '') + '>折扣券</option><option value="exchange"' + (d.type === 'exchange' ? ' selected' : '') + '>兑换券</option></select></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">可用门店</div><select class="ic-input"' + dis + ' onchange="cpTplD(\'shop\',this.value)"><option value="ALL"' + (d.shop === 'ALL' ? ' selected' : '') + '>全部门店可用</option><option value="S2001"' + (d.shop === 'S2001' ? ' selected' : '') + '>崧泽-青浦旗舰店</option><option value="S2002"' + (d.shop === 'S2002' ? ' selected' : '') + '>崧泽-松江分店</option></select></div>';
  h += '</div>';
  // 生效与有效期
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6"><div style="color:#0b1019;font-weight:600;margin-bottom:8px">生效与有效期</div>';
  h += '<div style="display:flex;align-items:center;flex-wrap:wrap;margin-bottom:8px"><span style="color:#5b6472;width:90px;flex-shrink:0">生效日期</span>' +
    rad('cpEff', 'immediate', d.effective.kind, '领取后立即生效');
  if (d.effective.kind === 'days') {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:16px"><input type="radio" name="cpEff" checked' + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'cpEff\',\'days\')') + '">领取后<input type="number" min="1" class="ic-input" style="width:64px;display:inline-block" value="' + d.effective.days + '"' + (ro ? ' disabled' : '') + ' oninput="cpTplD(\'effective.days\',this.value)">天内生效</span>';
  } else {
    h += rad('cpEff', 'days', d.effective.kind, '领取后 N 天内生效');
  }
  if (d.effective.kind === 'date') {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:16px"><input type="radio" name="cpEff" checked' + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'cpEff\',\'date\')') + '">指定日期<input type="date" class="ic-input" style="width:148px;display:inline-block" value="' + d.effective.date + '"' + (ro ? ' disabled' : '') + ' onchange="cpTplD(\'effective.date\',this.value)">起生效</span>';
  } else {
    h += rad('cpEff', 'date', d.effective.kind, '指定日期生效');
  }
  h += '</div>';
  h += '<div style="display:flex;align-items:center;flex-wrap:wrap"><span style="color:#5b6472;width:90px;flex-shrink:0">有效期至</span>';
  if (d.expiry.kind === 'days') {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:16px"><input type="radio" name="cpExp" checked' + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'cpExp\',\'days\')') + '">有效<input type="number" min="1" class="ic-input" style="width:64px;display:inline-block" value="' + d.expiry.days + '"' + (ro ? ' disabled' : '') + ' oninput="cpTplD(\'expiry.days\',this.value)">天</span>';
  } else {
    h += rad('cpExp', 'days', d.expiry.kind, '有效 N 天');
  }
  if (d.expiry.kind === 'date') {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:16px"><input type="radio" name="cpExp" checked' + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'cpExp\',\'date\')') + '">至<input type="date" class="ic-input" style="width:148px;display:inline-block" value="' + d.expiry.date + '"' + (ro ? ' disabled' : '') + ' onchange="cpTplD(\'expiry.date\',this.value)"></span>';
  } else {
    h += rad('cpExp', 'date', d.expiry.kind, '指定日期');
  }
  h += '</div></div>';
  // 参与商品
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6"><div style="color:#0b1019;font-weight:600;margin-bottom:8px">参与商品</div>';
  h += '<div style="margin-bottom:8px">' + rad('cpScope', 'all', d.scope.kind, '全场通用') + rad('cpScope', 'cat', d.scope.kind, '指定分类') + rad('cpScope', 'prod', d.scope.kind, '指定商品') + '</div>';
  if (d.scope.kind === 'cat') {
    h += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span style="color:#5b6472">分类</span><select class="ic-input" style="width:160px"' + dis + ' onchange="cpTplCat1(this.value)">' + cat1Opt + '</select><select class="ic-input" style="width:160px"' + dis + ' onchange="cpTplD(\'scope.cat2\',this.value)">' + cat2Opt + '</select></div>';
  }
  if (d.scope.kind === 'prod') {
    h += '<div style="color:#5b6472;margin-bottom:6px">可用商品（该券仅限以下商品核销）</div>' + prodHtml;
    if (!ro) h += '<button class="ic-btn" style="margin-top:8px" onclick="cpTplPickGoods()">＋ 添加商品</button>';
  }
  h += '</div>';
  // 优惠规则
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6"><div style="color:#0b1019;font-weight:600;margin-bottom:8px">优惠规则</div>';
  h += '<div style="margin-bottom:8px;display:flex;align-items:center;flex-wrap:wrap;gap:6px 0">';
  if (d.rule.kind === 'reduce') {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:14px"><input type="radio" name="cpRule" checked' + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'cpRule\',\'reduce\')') + '">满</span>';
    h += '<input type="number" min="0" class="ic-input" style="width:72px" value="' + d.rule.full + '"' + (ro ? ' disabled' : '') + ' oninput="cpTplD(\'rule.full\',this.value)"><span style="margin:0 4px">元 减</span>';
    h += '<input type="number" min="0" class="ic-input" style="width:72px" value="' + d.rule.value + '"' + (ro ? ' disabled' : '') + ' oninput="cpTplD(\'rule.value\',this.value)"><span style="margin:0 4px">元</span>';
  } else if (d.rule.kind === 'discount') {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:14px"><input type="radio" name="cpRule" checked' + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'cpRule\',\'discount\')') + '">满</span>';
    h += '<input type="number" min="0" class="ic-input" style="width:72px" value="' + d.rule.full + '"' + (ro ? ' disabled' : '') + ' oninput="cpTplD(\'rule.full\',this.value)"><span style="margin:0 4px">元 享</span>';
    h += '<input type="number" min="0.1" max="10" step="0.1" class="ic-input" style="width:72px" value="' + d.rule.value + '"' + (ro ? ' disabled' : '') + ' oninput="cpTplD(\'rule.value\',this.value)"><span style="margin:0 4px">折</span>';
  } else {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:14px"><input type="radio" name="cpRule" checked' + dis + ' onclick="' + (ro ? '' : 'cpTplFormRadio(\'cpRule\',\'threshold\')') + '">满</span>';
    h += '<input type="number" min="0" class="ic-input" style="width:72px" value="' + d.rule.full + '"' + (ro ? ' disabled' : '') + ' oninput="cpTplD(\'rule.full\',this.value)"><span style="margin:0 4px">元可用（如兑换券/赠品券）</span>';
  }
  h += '</div>';
  if (!ro && d.rule.kind !== 'threshold') h += '<div style="display:flex;gap:8px;margin-top:6px">' +
    '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="cpRule"' + (d.rule.kind === 'reduce' ? ' checked' : '') + ' onclick="cpTplFormRadio(\'cpRule\',\'reduce\')">满减券</label>' +
    '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="cpRule"' + (d.rule.kind === 'discount' ? ' checked' : '') + ' onclick="cpTplFormRadio(\'cpRule\',\'discount\')">折扣券</label>' +
    '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="cpRule"' + (d.rule.kind === 'threshold' ? ' checked' : '') + ' onclick="cpTplFormRadio(\'cpRule\',\'threshold\')">门槛券</label></div>';
  h += '</div>';
  // 叠加
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6;display:flex;flex-wrap:wrap;gap:4px 20px">';
  h += '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox"' + (d.overlayCoupon ? ' checked' : '') + dis + ' onchange="cpTplD(\'overlayCoupon\',this.checked)">可与其他优惠券叠加使用</label>';
  h += '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox"' + (d.overlayActivity ? ' checked' : '') + dis + ' onchange="cpTplD(\'overlayActivity\',this.checked)">可同时参与其他优惠活动</label>';
  h += '</div>';
  h += '</div>';
  return h;
}
function cpTplFormRadio(group, val) {
  if (group === 'cpEff') cpTplD('effective.kind', val);
  else if (group === 'cpExp') cpTplD('expiry.kind', val);
  else if (group === 'cpScope') { cpTplD('scope.kind', val); if (val !== 'prod') cpTplD('scope.prods', []); }
  else if (group === 'cpRule') cpTplD('rule.kind', val);
  cpTplFormRedraw();
}
function cpTplCat1(v) { cpTplD('scope.cat1', v); cpTplD('scope.cat2', CP_CATS.filter(function (c) { return c.p === v; })[0].c[0]); cpTplFormRedraw(); }
function cpTplProdDel(i) { var a = CP_TPL_DRAFT.scope.prods; a.splice(i, 1); cpTplFormRedraw(); }
// 商品选择弹层
function cpTplPickGoods() {
  var cur = CP_TPL_DRAFT.scope.prods || [];
  var body = '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">商品名称</th><th style="padding:8px 12px;text-align:left">编码/条码</th><th style="padding:8px 12px;text-align:right">销售价</th><th style="padding:8px 12px;width:70px">操作</th></tr></thead><tbody>' +
    CP_GOODS.map(function (g) {
      var has = cur.some(function (x) { return x.code === g.code; });
      return '<tr><td style="padding:8px 12px">' + msCpEsc(g.name) + '</td><td style="padding:8px 12px;color:#8a93a3">' + g.code + '</td><td style="padding:8px 12px;text-align:right">¥' + g.price.toFixed(2) + '/' + g.unit + '</td><td style="padding:8px 12px">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="cpTplPickGoodsAdd(\'' + g.code + '\')">添加</button>') + '</td></tr>';
    }).join('') + '</tbody></table>';
  msCpPop({ title: '添加可用商品', width: 'min(640px,90vw)', body: body, onOk: 'cpTplPickGoodsDone()', okText: '完成' });
}
function cpTplPickGoodsAdd(code) {
  var cur = CP_TPL_DRAFT.scope.prods;
  var g = msCpGoodsByCode(code);
  if (!g) return;
  if (!cur.some(function (x) { return x.code === code; })) cur.push({ code: g.code, name: g.name, price: g.price, unit: g.unit });
  msCpPopBody('<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">商品名称</th><th style="padding:8px 12px;text-align:left">编码/条码</th><th style="padding:8px 12px;text-align:right">销售价</th><th style="padding:8px 12px;width:70px">操作</th></tr></thead><tbody>' +
    CP_GOODS.map(function (x) {
      var has = CP_TPL_DRAFT.scope.prods.some(function (p) { return p.code === x.code; });
      return '<tr><td style="padding:8px 12px">' + msCpEsc(x.name) + '</td><td style="padding:8px 12px;color:#8a93a3">' + x.code + '</td><td style="padding:8px 12px;text-align:right">¥' + x.price.toFixed(2) + '/' + x.unit + '</td><td style="padding:8px 12px">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="cpTplPickGoodsAdd(\'' + x.code + '\')">添加</button>') + '</td></tr>';
    }).join('') + '</tbody></table>');
}
function cpTplPickGoodsDone() { msCpPopClose(); cpTplFormRedraw(); }
function cpTplSave(mode) {
  var d = CP_TPL_DRAFT;
  if (!d.name.trim()) { msCpToast('请填写模板名称'); return; }
  if (d.rule.kind === 'discount') { var v = msCpNum(d.rule.value); if (v <= 0 || v > 10) { msCpToast('折扣折数须在 0~10 之间'); return; } }
  if (mode === 'new') {
    var dup = CP_TPL.some(function (t) { return t.templateId === d.templateId; });
    if (dup) { msCpToast('模板ID ' + d.templateId + ' 已存在，请更换'); return; }
    CP_TPL.unshift(JSON.parse(JSON.stringify(d)));
    msCpToast('新增模板成功');
  } else {
    var t = cpTplById(mode); if (!t) return;
    var fields = JSON.parse(JSON.stringify(d));
    fields.templateId = t.templateId; fields.createdAt = t.createdAt; fields.status = t.status;
    var idx = CP_TPL.indexOf(t); CP_TPL[idx] = fields;
    msCpToast('模板已保存');
  }
  cpTplPersist(); msCpClose(); cpTplRender();
}
function cpTplIssue(templateId) {
  // 指定发放 → 跳到优惠券计划页并自动打开「新增计划」，预置该券
  var t = cpTplById(templateId); if (!t) return;
  var url = 'cp-plan.html?issue=' + encodeURIComponent(t.templateId);
  try { navigateTo(url); } catch (e) { location.href = url; }
}
/* ================================================================
 * 2) 优惠券计划 cp-plan（Vue Planlist + Newplan）
 * ================================================================ */
var CP_PLAN_KEY = 'tcm_cp_plans_v1';
var CP_PLAN_PAGE = 1, CP_PLAN_SIZE = 10, CP_PLAN_KW = '', CP_PLAN_ST = '';
var CP_PLAN_DRAFT = null, CP_PLAN_EDIT_ID = null;
var PLAN_SEED = [
  { planId: 'PL2026001', name: '新人首单礼', shop: 'ALL', target: { kind: 'all' }, claim: 'login', method: 'auto_grant', start: '2026-08-01', end: '2026-12-31', dailyCap: 100, dailyUsed: 37, totalCap: 1000, totalUsed: 177, ppDaily: { en: true, count: 1 }, ppAct: { en: true, count: 1 }, coupons: [{ templateId: 'TPL001', name: '新人专享券', type: 'cash', faceText: '满50减8元', total: 1000, remain: 823 }], status: '0', createdAt: '2026-07-30' },
  { planId: 'PL2026002', name: '周末果蔬惠', shop: 'ALL', target: { kind: 'old', oldMode: 'buy', buyDays: 7, buyTimes: 1 }, claim: 'order', method: 'auto_claim', start: '2026-08-08', end: '2026-12-31', dailyCap: 300, dailyUsed: 58, totalCap: 2000, totalUsed: 346, ppDaily: { en: false, count: 1 }, ppAct: { en: true, count: 2 }, coupons: [{ templateId: 'TPL002', name: '果蔬满减券', type: 'cash', faceText: '满30减5元', total: 2000, remain: 1654 }], status: '0', createdAt: '2026-08-05' },
  { planId: 'PL2026003', name: '肉禽专享促销', shop: 'S2001', target: { kind: 'all' }, claim: 'none', method: 'instant', start: '2026-09-01', end: '2026-10-31', dailyCap: 0, dailyUsed: 0, totalCap: 500, totalUsed: 0, ppDaily: { en: false, count: 1 }, ppAct: { en: true, count: 1 }, coupons: [{ templateId: 'TPL003', name: '肉禽88折券', type: 'discount', faceText: '满20享8.8折', total: 500, remain: 500 }], status: '1', createdAt: '2026-08-28' },
  { planId: 'PL2026004', name: '会员生日回馈', shop: 'ALL', target: { kind: 'spec', members: [{ n: '张阿姨', m: '138****2216' }, { n: '陈小姐', m: '135****7721' }, { n: '吴阿姨', m: '139****6653' }] }, claim: 'login', method: 'auto_grant', start: '2026-08-15', end: '2026-12-31', dailyCap: 50, dailyUsed: 3, totalCap: 300, totalUsed: 12, ppDaily: { en: true, count: 1 }, ppAct: { en: true, count: 1 }, coupons: [{ templateId: 'TPL005', name: '会员生日礼券', type: 'cash', faceText: '满100减20元', total: 300, remain: 288 }], status: '0', createdAt: '2026-08-10' },
  { planId: 'PL2026005', name: '榴莲季限时兑换', shop: 'S2002', target: { kind: 'all' }, claim: 'none', method: 'auto_claim', start: '2026-07-20', end: '2026-08-20', dailyCap: 0, dailyUsed: 0, totalCap: 200, totalUsed: 14, ppDaily: { en: false, count: 1 }, ppAct: { en: true, count: 1 }, coupons: [{ templateId: 'TPL006', name: '榴莲兑换券', type: 'exchange', faceText: '兑换1份', total: 200, remain: 186 }], status: '2', createdAt: '2026-07-18' },
  { planId: 'PL2026006', name: '中秋大促礼', shop: 'ALL', target: { kind: 'all' }, claim: 'none', method: 'auto_grant', start: '2026-09-05', end: '2026-09-21', dailyCap: 100, dailyUsed: 0, totalCap: 1100, totalUsed: 159, ppDaily: { en: false, count: 1 }, ppAct: { en: false, count: 1 }, coupons: [{ templateId: 'TPL007', name: '满200减30大促券', type: 'cash', faceText: '满200减30元', total: 800, remain: 641 }, { templateId: 'TPL003', name: '肉禽88折券', type: 'discount', faceText: '满20享8.8折', total: 300, remain: 300 }], status: '0', createdAt: '2026-09-01' }
];
var CP_PLAN = [];
function cpPlanLoad() { try { var r = localStorage.getItem(CP_PLAN_KEY); if (r) { CP_PLAN = JSON.parse(r); return; } } catch (e) {} CP_PLAN = JSON.parse(JSON.stringify(PLAN_SEED)); cpPlanPersist(); }
function cpPlanPersist() { try { localStorage.setItem(CP_PLAN_KEY, JSON.stringify(CP_PLAN)); } catch (e) {} }
function cpPlanById(id) { for (var i = 0; i < CP_PLAN.length; i++) if (CP_PLAN[i].planId === id) return CP_PLAN[i]; return null; }
function cpPlanNextId() { var max = 0; CP_PLAN.forEach(function (p) { var n = parseInt((p.planId || '').replace('PL', ''), 10); if (n > max) max = n; }); return 'PL' + (max + 1); }
function cpPlanTargetText(p) {
  var t = p.target, k = t.kind;
  if (k === 'all') return '全部用户';
  if (k === 'new') return String(t.validType) === '0' ? '新用户(当日)' : '新用户(注册≤' + (t.tDays || 7) + '天)';
  if (k === 'old') {
    var o = t;
    if (o.oldMode === 'gap') return '老用户(连续' + (o.gapDays || 30) + '天未购)';
    if (o.oldMode === 'reg') return '老用户(注册超' + (o.regDays || 365) + '天)';
    return '老用户(近' + (o.buyDays || 7) + '天购≥' + (o.buyTimes || 1) + '次)';
  }
  return '指定用户(' + ((t.members || []).length || (t.fileName ? '名单导入' : '未设')) + ')';
}
function cpPlanClaimText(c) { return c === 'register' ? '注册' : (c === 'login' ? '登录' : (c === 'order' ? '下单' : '不限制')); }
function cpPlanMethodText(m) { return m === 'auto_claim' ? '自动领取' : (m === 'auto_grant' ? '自动发放' : '立即发放'); }
function cpPlanCapText(p, isDaily) { var cap = isDaily ? p.dailyCap : p.totalCap, used = isDaily ? p.dailyUsed : p.totalUsed; return (cap > 0 ? used + ' / ' + cap : '—'); }
function cpPlanInit() {
  cpPlanLoad();
  cpTplLoad(); // 选券弹层依赖启用模板（模板→计划→记录数据链）
  var el = document.getElementById('cp-planContent');
  if (!el) { setTimeout(cpPlanInit, 80); return; }
  function tab(v, label) { return '<button class="btn-tab' + (CP_PLAN_ST === v ? ' active' : '') + '" onclick="cpPlanSetSt(\'' + v + '\')">' + label + '</button>'; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">活动状态：</span>' +
      '<div style="display:flex;gap:0">' + tab('', '全部') + tab('0', '启用') + tab('1', '暂停') + tab('2', '关闭') + '</div>' +
      '<input class="ic-search" style="flex:0 1 240px" placeholder="活动ID / 活动名称" value="' + msCpEsc(CP_PLAN_KW) + '" onkeydown="if(event.key===\'Enter\')cpPlanQuery()" id="cpPlanKw">' +
      '<button class="ic-btn" onclick="cpPlanReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="cpPlanQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="cpPlanOpen(\'new\', null)">＋ 新增计划</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1180px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:104px">活动ID</th><th style="width:140px">活动名称</th><th style="width:150px">适用人群</th>' +
            '<th style="width:80px">领取方式</th><th style="width:180px">活动周期</th><th style="width:104px">日限额(已领/限)</th>' +
            '<th style="width:112px">总限额(已领/限)</th><th style="width:70px">状态</th><th style="width:170px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="cpPlanBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="cpPlanPager" style="flex-shrink:0"></div>' +
    '</div>';
  cpPlanRender();
  cpPlanHandleIssueParam();
}
function cpPlanSetSt(v) { CP_PLAN_ST = v; var el = document.getElementById('cp-planContent'); if (el) { var bs = el.querySelectorAll('.btn-tab'); for (var i = 0; i < bs.length; i++) bs[i].classList.remove('active'); var all = el.querySelectorAll('[onclick^="cpPlanSetSt"]'); for (var j = 0; j < all.length; j++) { if ((all[j].getAttribute('onclick') || '').indexOf("'" + v + "'") >= 0) all[j].classList.add('active'); } } cpPlanRender(); }
function cpPlanReset() {
  CP_PLAN_ST = ''; CP_PLAN_KW = ''; CP_PLAN_PAGE = 1;
  var kw = document.getElementById('cpPlanKw'); if (kw) kw.value = '';
  var el = document.getElementById('cp-planContent'); if (el) { var bs = el.querySelectorAll('.btn-tab'); for (var i = 0; i < bs.length; i++) bs[i].classList.remove('active'); if (bs[0]) bs[0].classList.add('active'); }
  cpPlanRender();
}
function cpPlanQuery() { var kw = document.getElementById('cpPlanKw'); CP_PLAN_KW = kw ? kw.value.trim() : ''; CP_PLAN_PAGE = 1; cpPlanRender(); }
function cpPlanRows() {
  var kw = CP_PLAN_KW.toLowerCase();
  return CP_PLAN.filter(function (p) {
    if (CP_PLAN_ST !== '' && String(p.status) !== CP_PLAN_ST) return false;
    if (kw && (String(p.planId).toLowerCase().indexOf(kw) < 0) && (p.name || '').toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
}
function cpPlanStatusBadge(s) {
  s = String(s);
  if (s === '0') return msCpBadge('启用', 'ok');
  if (s === '1') return msCpBadge('暂停', 'warn');
  return msCpBadge('关闭', 'info');
}
function cpPlanRender(page) {
  if (page) CP_PLAN_PAGE = page;
  var rows = cpPlanRows();
  var pages = Math.ceil(rows.length / CP_PLAN_SIZE) || 1;
  if (CP_PLAN_PAGE > pages) CP_PLAN_PAGE = pages;
  if (CP_PLAN_PAGE < 1) CP_PLAN_PAGE = 1;
  var slice = rows.slice((CP_PLAN_PAGE - 1) * CP_PLAN_SIZE, CP_PLAN_PAGE * CP_PLAN_SIZE);
  var body = document.getElementById('cpPlanBody');
  if (!body) return;
  body.innerHTML = slice.map(function (p, i) {
    var op = '';
    op += '<button class="ic-op-link" onclick="cpPlanOpen(\'view\',\'' + p.planId + '\')">查看</button>';
    if (String(p.status) !== '2') {
      op += '<button class="ic-op-link" onclick="cpPlanOpen(\'edit\',\'' + p.planId + '\')">编辑</button>';
      if (String(p.status) === '0') op += '<button class="ic-op-link" style="color:#e6a23c" onclick="cpPlanSetStPlan(\'' + p.planId + '\',\'1\')">暂停</button>';
      else op += '<button class="ic-op-link" style="color:#67c23a" onclick="cpPlanSetStPlan(\'' + p.planId + '\',\'0\')">恢复</button>';
      op += '<button class="ic-op-link" style="color:#909399" onclick="cpPlanClose(\'' + p.planId + '\')">关闭</button>';
    }
    op += '<button class="ic-op-link" style="color:#f56c6c" onclick="cpPlanDel(\'' + p.planId + '\')">删除</button>';
    return '<tr><td style="text-align:center;color:#999">' + ((CP_PLAN_PAGE - 1) * CP_PLAN_SIZE + i + 1) + '</td>' +
      '<td>' + p.planId + '</td>' +
      '<td><button class="ic-op-link" style="font-weight:600" onclick="cpPlanOpen(\'view\',\'' + p.planId + '\')">' + msCpEsc(p.name) + '</button></td>' +
      '<td style="font-size:11px;color:#3a4252">' + msCpEsc(cpPlanTargetText(p)) + '</td>' +
      '<td>' + cpPlanMethodText(p.method) + '</td>' +
      '<td style="font-size:11px;color:#5b6472">' + p.start + ' ~ ' + p.end + '</td>' +
      '<td>' + cpPlanCapText(p, true) + '</td>' +
      '<td>' + cpPlanCapText(p, false) + '</td>' +
      '<td>' + cpPlanStatusBadge(p.status) + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msCpPager(rows.length, CP_PLAN_PAGE, CP_PLAN_SIZE, 'cpPlanPager', 'cpPlanRender');
}
function cpPlanSetStPlan(id, to) {
  var p = cpPlanById(id); if (!p) return;
  if (to === '1') { p.status = '1'; msCpToast('计划 ' + id + ' 已暂停，暂停期间用户不可领取'); }
  else { p.status = '0'; msCpToast('计划 ' + id + ' 已恢复'); }
  cpPlanPersist(); cpPlanRender();
}
function cpPlanClose(id) {
  var p = cpPlanById(id); if (!p) return;
  msCpDlg({ title: '关闭计划 · ' + id, width: 'min(460px,94vw)', body:
    '<div style="font-size:13px;color:#0b1019;margin-bottom:6px">确认关闭该发放计划？</div>' +
    '<div style="font-size:12px;color:#5b6472;line-height:20px">计划「' + msCpEsc(p.name) + '」关闭后用户将无法再领取；已发放到会员手中的券不受影响，可继续核销至有效期结束。</div>',
    onOk: 'cpPlanCloseDo(\'' + id + '\')', okText: '确认关闭' });
}
function cpPlanCloseDo(id) { var p = cpPlanById(id); if (!p) return; p.status = '2'; cpPlanPersist(); msCpClose(); msCpToast('计划已关闭'); cpPlanRender(); }
function cpPlanDel(id) {
  var p = cpPlanById(id); if (!p) return;
  msCpDlg({ title: '删除计划 · ' + id, width: 'min(460px,94vw)', body:
    '<div style="font-size:13px;color:#0b1019;margin-bottom:6px">确认删除该发放计划？</div>' +
    '<div style="font-size:12px;color:#5b6472;line-height:20px">删除后活动记录不可恢复；已发放的券实例记录将保留在「优惠券记录」中。</div>',
    onOk: 'cpPlanDelDo(\'' + id + '\')', okText: '确认删除' });
}
function cpPlanDelDo(id) { CP_PLAN = CP_PLAN.filter(function (p) { return p.planId !== id; }); cpPlanPersist(); msCpClose(); msCpToast('计划已删除'); cpPlanRender(); }
// 计划表单
function cpPlanOpen(mode, id) {
  var p = id ? cpPlanById(id) : null;
  var isNew = !p;
  CP_PLAN_EDIT_ID = id || null;
  CP_PLAN_DRAFT = p ? JSON.parse(JSON.stringify(p)) : {
    planId: cpPlanNextId(), name: '', shop: 'ALL', target: { kind: 'all', validType: '0', tDays: 7, oldMode: 'buy', buyDays: 7, buyTimes: 1, gapDays: 30, regDays: 365, specType: 'byTag', fileName: '', members: [] },
    claim: 'none', method: 'auto_claim', start: msCpD(Date.now()), end: '2026-12-31',
    ppDaily: { en: false, count: 1 }, ppAct: { en: false, count: 1 }, coupons: [], status: '0', createdAt: msCpD(Date.now())
  };
  var ro = mode === 'view';
  var readOnlyCoupons = !isNew;
  msCpDlg({
    title: (ro ? '查看发放计划' : (isNew ? '新增发放计划' : '编辑发放计划 · ' + id)),
    width: 'min(940px,94vw)',
    body: cpPlanForm(ro, readOnlyCoupons),
    bodyStyle: 'max-height:72vh;overflow:auto;',
    onOk: ro ? null : 'cpPlanSave(\'' + (isNew ? 'new' : id) + '\')', okText: '保存',
    cancelText: ro ? '关闭' : '取消'
  });
}
function cpPlanFormRedraw() { msCpBody(cpPlanForm(false, !!CP_PLAN_EDIT_ID)); }
function cpPlanForm(ro, couponsRo) {
  var d = CP_PLAN_DRAFT; if (!d) return '';
  var dis = ro ? ' disabled' : '';
  var rad = function (name, val, cur, label) { return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:14px;cursor:pointer;white-space:nowrap"><input type="radio" name="' + name + '"' + (cur === val ? ' checked' : '') + dis + ' onclick="' + (ro ? '' : 'cpPlanFormRadio(\'' + name + '\',\'' + val + '\')') + '">' + label + '</label>'; };
  var h = '<div style="font-size:12px;color:#0b1019">';
  // 基础
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px">';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">活动名称 <span style="color:#fc4b52">*</span></div><input class="ic-input" placeholder="请输入活动名称" value="' + msCpEsc(d.name) + '" oninput="cpPlanD(\'name\',this.value)"' + dis + '></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">活动门店</div><select class="ic-input"' + dis + ' onchange="cpPlanD(\'shop\',this.value)"><option value="ALL"' + (d.shop === 'ALL' ? ' selected' : '') + '>全部门店</option><option value="S2001"' + (d.shop === 'S2001' ? ' selected' : '') + '>崧泽-青浦旗舰店</option><option value="S2002"' + (d.shop === 'S2002' ? ' selected' : '') + '>崧泽-松江分店</option></select></div>';
  h += '</div>';
  // 适用人群
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6"><div style="color:#0b1019;font-weight:600;margin-bottom:8px">适用人群</div>';
  h += '<div style="margin-bottom:8px">' + rad('cpTg', 'all', d.target.kind, '全部用户') + rad('cpTg', 'new', d.target.kind, '新用户') + rad('cpTg', 'old', d.target.kind, '老用户') + rad('cpTg', 'spec', d.target.kind, '指定用户') + '</div>';
  if (d.target.kind === 'new') {
    h += '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px;margin:6px 0 2px 14px">' +
      '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="cpNewV"' + (String(d.target.validType) === '0' ? ' checked' : '') + dis + ' onclick="' + (ro ? '' : 'cpPlanD(\'target.validType\',\'0\')') + '">当日注册</label>' +
      '<span style="display:inline-flex;align-items:center;gap:4px">注册≤<input type="number" min="1" class="ic-input" style="width:64px;display:inline-block" value="' + d.target.tDays + '"' + (ro ? ' disabled' : '') + ' oninput="cpPlanD(\'target.tDays\',this.value)">天内（含当天）</span></div>';
  }
  if (d.target.kind === 'old') {
    var m = d.target.oldMode || 'buy';
    h += '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;margin:6px 0 2px 14px">';
    h += '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="cpOldM"' + (m === 'buy' ? ' checked' : '') + dis + ' onclick="' + (ro ? '' : 'cpPlanD(\'target.oldMode\',\'buy\')') + '">近</label><input type="number" min="1" class="ic-input" style="width:60px;display:inline-block" value="' + d.target.buyDays + '"' + (ro ? ' disabled' : '') + ' oninput="cpPlanD(\'target.buyDays\',this.value)"><span>天内有购买≥</span><input type="number" min="1" class="ic-input" style="width:60px;display:inline-block" value="' + d.target.buyTimes + '"' + (ro ? ' disabled' : '') + ' oninput="cpPlanD(\'target.buyTimes\',this.value)"><span>次</span>';
    h += '<span style="margin:0 4px"></span><label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="cpOldM"' + (m === 'gap' ? ' checked' : '') + dis + ' onclick="' + (ro ? '' : 'cpPlanD(\'target.oldMode\',\'gap\')') + '">连续</label><input type="number" min="1" class="ic-input" style="width:60px;display:inline-block" value="' + d.target.gapDays + '"' + (ro ? ' disabled' : '') + ' oninput="cpPlanD(\'target.gapDays\',this.value)"><span>天未购买</span>';
    h += '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;margin-left:8px"><input type="radio" name="cpOldM"' + (m === 'reg' ? ' checked' : '') + dis + ' onclick="' + (ro ? '' : 'cpPlanD(\'target.oldMode\',\'reg\')') + '">注册超过</label><input type="number" min="1" class="ic-input" style="width:60px;display:inline-block" value="' + d.target.regDays + '"' + (ro ? ' disabled' : '') + ' oninput="cpPlanD(\'target.regDays\',this.value)"><span>天</span>';
    h += '</div>';
  }
  if (d.target.kind === 'spec') {
    h += '<div style="margin:6px 0 2px 14px">' + rad('cpSpecT', 'byTag', d.target.specType, '导入名单文件') + rad('cpSpecT', 'byId', d.target.specType, '选择用户') + '</div>';
    if (d.target.specType === 'byTag') {
      h += '<div style="margin:4px 0 0 14px;display:flex;align-items:center;gap:8px">';
      if (ro) {
        h += '<span style="color:#5b6472">' + (d.target.fileName ? '名单：' + msCpEsc(d.target.fileName) : '未上传名单') + '</span>';
      } else {
        h += '<label class="ic-btn" style="cursor:pointer">📄 上传用户名单<input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="cpPlanSetFile(this)"></label>';
        h += '<span style="color:#5b6472">' + (d.target.fileName ? '已选：' + msCpEsc(d.target.fileName) : '支持 xlsx/csv，≤10 个文件') + '</span>';
      }
      h += '</div>';
    } else {
      var mem = d.target.members || [];
      if (mem.length) {
        h += '<div style="margin:4px 0 0 14px;border:1px solid #e9eef7;border-radius:4px;overflow:hidden"><table style="width:100%;font-size:12px"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:6px 10px;text-align:left">姓名</th><th style="padding:6px 10px;text-align:left">手机号</th><th style="padding:6px 10px;width:60px">操作</th></tr></thead><tbody>' +
          mem.map(function (u, i) { return '<tr><td style="padding:6px 10px">' + msCpEsc(u.n) + '</td><td style="padding:6px 10px;color:#8a93a3">' + u.m + '</td><td style="padding:6px 10px">' + (ro ? '' : '<button class="ic-op-link" style="color:#f56c6c" onclick="cpPlanUserDel(' + i + ')">移除</button>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      if (!ro) h += '<button class="ic-btn" style="margin-top:6px;margin-left:14px" onclick="cpPlanPickUsers()">＋ 添加用户</button>';
    }
  }
  h += '</div>';
  // 领取条件 + 领取方式
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6;display:flex;flex-wrap:wrap;row-gap:8px">';
  h += '<div style="margin-right:40px"><div style="color:#0b1019;font-weight:600;margin-bottom:8px">领取条件</div>' + rad('cpClaim', 'register', d.claim, '注册') + rad('cpClaim', 'login', d.claim, '登录') + rad('cpClaim', 'order', d.claim, '下单') + rad('cpClaim', 'none', d.claim, '不限制') + '</div>';
  h += '<div><div style="color:#0b1019;font-weight:600;margin-bottom:8px">领取方式</div>' + rad('cpMethod', 'auto_claim', d.method, '自动领取(券包入口)') + rad('cpMethod', 'auto_grant', d.method, '自动发放(达标即发)') + rad('cpMethod', 'instant', d.method, '立即发放(结算后立得)') + '</div>';
  h += '</div>';
  // 发放周期
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="color:#0b1019;font-weight:600">发放周期</span><span style="color:#5b6472;margin-left:8px">开始日期</span><input type="date" class="ic-input" style="width:148px" value="' + d.start + '"' + dis + ' onchange="cpPlanD(\'start\',this.value)"><span style="color:#5b6472">结束日期</span><input type="date" class="ic-input" style="width:148px" value="' + d.end + '"' + dis + ' onchange="cpPlanD(\'end\',this.value)"></div>';
  // 领取频次限制
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6"><div style="color:#0b1019;font-weight:600;margin-bottom:8px">领取频次限制（每人）</div>';
  h += '<label style="display:inline-flex;align-items:center;gap:6px;margin-right:24px;cursor:pointer"><input type="checkbox"' + (d.ppDaily.en ? ' checked' : '') + dis + ' onchange="cpPlanD(\'ppDaily.en\',this.checked)">每人每天可领取</label><input type="number" min="1" class="ic-input" style="width:64px;display:inline-block"' + (d.ppDaily.en && !ro ? '' : ' disabled') + ' value="' + d.ppDaily.count + '" oninput="cpPlanD(\'ppDaily.count\',this.value)"><span>次</span>';
  h += '<label style="display:inline-flex;align-items:center;gap:6px;margin-left:24px;margin-right:6px;cursor:pointer"><input type="checkbox"' + (d.ppAct.en ? ' checked' : '') + dis + ' onchange="cpPlanD(\'ppAct.en\',this.checked)">活动期间可领取</label><input type="number" min="1" class="ic-input" style="width:64px;display:inline-block"' + (d.ppAct.en && !ro ? '' : ' disabled') + ' value="' + d.ppAct.count + '" oninput="cpPlanD(\'ppAct.count\',this.value)"><span>次</span>';
  h += '</div>';
  // 券清单
  h += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eef1f6"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="color:#0b1019;font-weight:600">活动优惠券</span><span style="color:#8a93a3;font-size:11px">（' + (couponsRo ? '编辑/查看态不可调整批次，保存保留原发放进度' : '每张券为一个发放批次，发放后剩余数量自动递减') + '）</span></div>';
  var cs = d.coupons || [];
  if (!cs.length) {
    h += '<div style="padding:14px;text-align:center;color:#a8b0bd;border:1px dashed #dfe3ed;border-radius:4px;margin-bottom:6px">尚未添加优惠券' + (ro ? '' : '，点击下方「添加优惠券」从启用模板中选择') + '</div>';
  } else {
    h += '<div style="border:1px solid #e9eef7;border-radius:4px;overflow:hidden"><table style="width:100%;font-size:12px;min-width:560px"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:6px 10px;text-align:left">优惠券名称</th><th style="padding:6px 10px">券类型</th><th style="padding:6px 10px">优惠信息</th><th style="padding:6px 10px">发放数量</th><th style="padding:6px 10px">剩余数量</th><th style="padding:6px 10px;width:60px">操作</th></tr></thead><tbody>';
    cs.forEach(function (c, i) {
      var editable = !ro && !couponsRo;
      h += '<tr><td style="padding:6px 10px">' + msCpEsc(c.name) + '</td><td style="padding:6px 10px;text-align:center">' + msCpTypeName(c.type) + '</td><td style="padding:6px 10px;text-align:center;color:#5b6472">' + msCpEsc(c.faceText) + '</td>' +
        '<td style="padding:6px 10px;text-align:center">' + (editable ? '<input type="number" min="1" class="ic-input" style="width:84px;display:inline-block" value="' + c.total + '" oninput="cpPlanCouponTotal(' + i + ',this.value)">' : c.total) + '</td>' +
        '<td style="padding:6px 10px;text-align:center;color:#5b6472">' + c.remain + '</td>' +
        '<td style="padding:6px 10px;text-align:center">' + (editable ? '<button class="ic-op-link" style="color:#f56c6c" onclick="cpPlanCouponDel(' + i + ')">移除</button>' : '—') + '</td></tr>';
    });
    h += '</tbody></table></div>';
  }
  if (!ro && !couponsRo) h += '<button class="ic-btn ic-btn-pri" style="margin-top:8px" onclick="cpPlanPickCoupons()">＋ 添加优惠券</button>';
  h += '</div></div>';
  return h;
}
function cpPlanFormRadio(group, val) {
  var d = CP_PLAN_DRAFT;
  if (group === 'cpTg') cpPlanD('target.kind', val);
  else if (group === 'cpClaim') cpPlanD('claim', val);
  else if (group === 'cpMethod') cpPlanD('method', val);
  else if (group === 'cpSpecT') cpPlanD('target.specType', val);
  cpPlanFormRedraw();
}
function cpPlanD(path, v) { var p = path.split('.'), o = CP_PLAN_DRAFT; for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }
function cpPlanSetFile(inp) {
  var f = inp.files && inp.files[0];
  if (f) { cpPlanD('target.fileName', f.name); msCpToast('已选择名单文件：' + f.name); cpPlanFormRedraw(); }
}
function cpPlanUserDel(i) { CP_PLAN_DRAFT.target.members.splice(i, 1); cpPlanFormRedraw(); }
function cpPlanCouponDel(i) { CP_PLAN_DRAFT.coupons.splice(i, 1); cpPlanFormRedraw(); }
function cpPlanCouponTotal(i, v) { var c = CP_PLAN_DRAFT.coupons[i]; if (!c) return; var n = Math.max(1, msCpNum(v)); c.total = n; if (c.remain === 0 || c.remain === c.total) c.remain = n; }
// 添加用户弹层
function cpPlanPickUsers() {
  var mem = CP_PLAN_DRAFT.target.members || [];
  msCpPop({ title: '选择用户（发放对象）', width: 'min(560px,90vw)', body:
    '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">姓名</th><th style="padding:8px 12px;text-align:left">手机号</th><th style="padding:8px 12px;width:70px">操作</th></tr></thead><tbody>' +
    CP_USERS.map(function (u) {
      var has = mem.some(function (x) { return x.m === u.m; });
      return '<tr><td style="padding:8px 12px">' + u.n + '</td><td style="padding:8px 12px;color:#8a93a3">' + u.m + '</td><td style="padding:8px 12px">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="cpPlanPickUserAdd(\'' + u.n + '\',\'' + u.m + '\')">添加</button>') + '</td></tr>';
    }).join('') + '</tbody></table>',
    onOk: 'cpPlanPickUsersDone()', okText: '完成' });
}
function cpPlanPickUserAdd(n, m) {
  var mem = CP_PLAN_DRAFT.target.members;
  if (!mem.some(function (x) { return x.m === m; })) mem.push({ n: n, m: m });
  msCpPopBody('<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">姓名</th><th style="padding:8px 12px;text-align:left">手机号</th><th style="padding:8px 12px;width:70px">操作</th></tr></thead><tbody>' +
    CP_USERS.map(function (u) {
      var has = CP_PLAN_DRAFT.target.members.some(function (x) { return x.m === u.m; });
      return '<tr><td style="padding:8px 12px">' + u.n + '</td><td style="padding:8px 12px;color:#8a93a3">' + u.m + '</td><td style="padding:8px 12px">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="cpPlanPickUserAdd(\'' + u.n + '\',\'' + u.m + '\')">添加</button>') + '</td></tr>';
    }).join('') + '</tbody></table>');
}
function cpPlanPickUsersDone() { msCpPopClose(); cpPlanFormRedraw(); }
// 选择优惠券（来自启用模板）
function cpPlanPickCoupons() {
  var tpls = CP_TPL.filter(function (t) { return String(t.status) === '0'; });
  var have = CP_PLAN_DRAFT.coupons || [];
  if (!tpls.length) { msCpToast('暂无启用的优惠券模板，请先到「优惠券模板」页启用'); return; }
  msCpPop({ title: '选择优惠券（可多选，来自启用模板）', width: 'min(720px,90vw)', body:
    '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">模板ID</th><th style="padding:8px 12px;text-align:left">券名称</th><th style="padding:8px 12px">券类型</th><th style="padding:8px 12px">优惠信息</th><th style="padding:8px 12px;width:70px">操作</th></tr></thead><tbody>' +
    tpls.map(function (t) {
      var has = have.some(function (c) { return c.templateId === t.templateId; });
      return '<tr><td style="padding:8px 12px">' + t.templateId + '</td><td style="padding:8px 12px">' + msCpEsc(t.name) + '</td><td style="padding:8px 12px;text-align:center">' + cpTplType(t) + '</td><td style="padding:8px 12px;text-align:center;color:#5b6472">' + cpTplRuleInfo(t) + '</td><td style="padding:8px 12px;text-align:center">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="cpPlanPickCouponAdd(\'' + t.templateId + '\')">添加</button>') + '</td></tr>';
    }).join('') + '</tbody></table>',
    onOk: 'cpPlanPickCouponsDone()', okText: '完成' });
}
function cpPlanFace(t) {
  var r = t.rule, v = msCpNum(r.value);
  if (t.type === 'exchange') return '兑换' + (r.full > 0 ? '(满' + msCpNum(r.full) + '可用)' : '1份');
  if (t.type === 'discount') return v + '折';
  return r.kind === 'reduce' ? (msCpNum(r.full) > 0 ? '满' + msCpNum(r.full) + '减' + v + '元' : '减' + v + '元') : (msCpNum(r.full) > 0 ? '满' + msCpNum(r.full) + '可用' : '无门槛');
}
function cpPlanPickCouponAdd(templateId) {
  var t = cpTplById(templateId); if (!t) return;
  var have = CP_PLAN_DRAFT.coupons;
  if (have.some(function (c) { return c.templateId === templateId; })) { msCpToast('该券已在活动中，请勿重复添加'); return; }
  have.push({ templateId: t.templateId, name: t.name, type: t.type, faceText: cpPlanFace(t), total: 100, remain: 100 });
  msCpPopBody(buildCouponPopBody());
}
function buildCouponPopBody() {
  var tpls = CP_TPL.filter(function (t) { return String(t.status) === '0'; });
  var have = CP_PLAN_DRAFT.coupons;
  return '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">模板ID</th><th style="padding:8px 12px;text-align:left">券名称</th><th style="padding:8px 12px">券类型</th><th style="padding:8px 12px">优惠信息</th><th style="padding:8px 12px;width:70px">操作</th></tr></thead><tbody>' +
    tpls.map(function (t) {
      var has = have.some(function (c) { return c.templateId === t.templateId; });
      return '<tr><td style="padding:8px 12px">' + t.templateId + '</td><td style="padding:8px 12px">' + msCpEsc(t.name) + '</td><td style="padding:8px 12px;text-align:center">' + cpTplType(t) + '</td><td style="padding:8px 12px;text-align:center;color:#5b6472">' + cpTplRuleInfo(t) + '</td><td style="padding:8px 12px;text-align:center">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="cpPlanPickCouponAdd(\'' + t.templateId + '\')">添加</button>') + '</td></tr>';
    }).join('') + '</tbody></table>';
}
function cpPlanPickCouponsDone() { msCpPopClose(); cpPlanFormRedraw(); }
function cpPlanSave(mode) {
  var d = CP_PLAN_DRAFT;
  if (!d.name.trim()) { msCpToast('请填写活动名称'); return; }
  if (d.start > d.end) { msCpToast('结束日期不能早于开始日期'); return; }
  if (!d.coupons.length) { msCpToast('请至少添加一张优惠券'); return; }
  if (mode === 'new') {
    CP_PLAN.unshift(JSON.parse(JSON.stringify(d)));
    msCpToast('新增计划成功');
  } else {
    var p = cpPlanById(mode); if (!p) return;
    var idx = CP_PLAN.indexOf(p);
    var keep = { planId: p.planId, createdAt: p.createdAt, status: p.status, dailyCap: p.dailyCap, dailyUsed: p.dailyUsed, totalCap: p.totalCap, totalUsed: p.totalUsed };
    var merged = {};
    for (var k in p) merged[k] = p[k];
    merged.name = d.name; merged.shop = d.shop; merged.target = d.target; merged.claim = d.claim; merged.method = d.method;
    merged.start = d.start; merged.end = d.end; merged.ppDaily = d.ppDaily; merged.ppAct = d.ppAct; merged.coupons = d.coupons;
    CP_PLAN[idx] = merged;
    msCpToast('计划已保存');
  }
  cpPlanPersist(); msCpClose(); cpPlanRender();
}
// 从模板「指定发放」跳转而来：自动打开新增计划并预置该券
function cpPlanHandleIssueParam() {
  var m = (location.search || '').match(/[?&]issue=([^&]+)/);
  if (!m) return;
  var templateId = decodeURIComponent(m[1]);
  try { history.replaceState({}, '', location.pathname); } catch (e) {}
  cpTplLoad();
  var t = cpTplById(templateId);
  if (t && String(t.status) === '0') {
    cpPlanOpen('new', null);
    if (CP_PLAN_DRAFT) {
      CP_PLAN_DRAFT.coupons = [{ templateId: t.templateId, name: t.name, type: t.type, faceText: cpPlanFace(t), total: 100, remain: 100 }];
      msCpBody(cpPlanForm(false, false));
      var hint = document.createElement('div');
      hint.id = 'cpIssueHint';
      hint.style.cssText = 'margin:10px 20px 0;padding:8px 12px;background:#f0f6ff;border:1px solid #d6e4ff;color:#005cf5;font-size:12px;border-radius:4px;';
      hint.textContent = '已从「优惠券模板 ' + t.templateId + ' ' + t.name + '」指定发放：活动券已预置，填写人群与周期后保存即可。';
      var content = document.getElementById('cp-planContent');
      if (content) content.insertBefore(hint, content.firstChild);
    }
  }
}
/* ================================================================
 * 3) 优惠券记录 cp-record（Vue Recordlist，券实例明细）
 * ================================================================ */
var CP_REC_KEY = 'tcm_cp_records_v1';
var CP_REC_PAGE = 1, CP_REC_SIZE = 10, CP_REC_ST = '', CP_REC_D1 = '', CP_REC_D2 = '';
var REC_SEED = [
  { recordId: 'REC20260001', couponId: 'CPN2026001001', templateId: 'TPL001', memberName: '张阿姨', memberAccount: '138****2216', channel: '新会员注册', receiveTime: '2026-08-10 09:30:22', startTime: '2026-08-10 09:30:22', endTime: '2026-09-09 09:30:22', status: '0', orderNo: '' },
  { recordId: 'REC20260002', couponId: 'CPN2026002001', templateId: 'TPL002', memberName: '王先生', memberAccount: '139****8803', channel: '活动领取', receiveTime: '2026-08-12 14:05:11', startTime: '2026-08-12 14:05:11', endTime: '2026-09-11 14:05:11', status: '0', orderNo: '' },
  { recordId: 'REC20260003', couponId: 'CPN2026003001', templateId: 'TPL003', memberName: '李奶奶', memberAccount: '136****3347', channel: '门店扫码', receiveTime: '2026-08-14 10:47:02', startTime: '2026-08-14 10:47:02', endTime: '2026-09-13 10:47:02', status: '1', orderNo: 'ORD20260822001' },
  { recordId: 'REC20260004', couponId: 'CPN2026001002', templateId: 'TPL001', memberName: '陈小姐', memberAccount: '135****7721', channel: '新会员注册', receiveTime: '2026-07-20 16:20:45', startTime: '2026-07-20 16:20:45', endTime: '2026-08-19 16:20:45', status: '2', orderNo: '' },
  { recordId: 'REC20260005', couponId: 'CPN2026002002', templateId: 'TPL002', memberName: '刘师傅', memberAccount: '137****9902', channel: '积分兑换', receiveTime: '2026-08-18 11:08:30', startTime: '2026-08-18 11:08:30', endTime: '2026-09-17 11:08:30', status: '0', orderNo: '' },
  { recordId: 'REC20260006', couponId: 'CPN2026005001', templateId: 'TPL005', memberName: '张阿姨', memberAccount: '138****2216', channel: '会员生日推送', receiveTime: '2026-08-16 08:00:00', startTime: '2026-08-16 08:00:00', endTime: '2026-09-15 08:00:00', status: '0', orderNo: '' },
  { recordId: 'REC20260007', couponId: 'CPN2026007001', templateId: 'TPL007', memberName: '王先生', memberAccount: '139****8803', channel: '活动领取', receiveTime: '2026-08-21 19:44:18', startTime: '2026-08-21 19:44:18', endTime: '2026-09-05 19:44:18', status: '1', orderNo: 'ORD20260901023' },
  { recordId: 'REC20260008', couponId: 'CPN2026003002', templateId: 'TPL003', memberName: '赵女士', memberAccount: '133****5526', channel: '门店扫码', receiveTime: '2026-08-25 12:31:56', startTime: '2026-08-25 12:31:56', endTime: '2026-09-24 12:31:56', status: '3', orderNo: '' },
  { recordId: 'REC20260009', couponId: 'CPN2026002003', templateId: 'TPL002', memberName: '吴阿姨', memberAccount: '139****6653', channel: '自动发放', receiveTime: '2026-08-27 10:15:40', startTime: '2026-08-27 10:15:40', endTime: '2026-09-26 10:15:40', status: '1', orderNo: 'ORD20260901031' },
  { recordId: 'REC20260010', couponId: 'CPN2026001003', templateId: 'TPL001', memberName: '郑先生', memberAccount: '186****9918', channel: '活动领取', receiveTime: '2026-08-29 15:52:09', startTime: '2026-08-29 15:52:09', endTime: '2026-09-28 15:52:09', status: '0', orderNo: '' },
  { recordId: 'REC20260011', couponId: 'CPN2026006001', templateId: 'TPL006', memberName: '孙大爷', memberAccount: '158****1120', channel: '门店兑换', receiveTime: '2026-08-06 09:12:33', startTime: '2026-08-06 09:12:33', endTime: '2026-08-13 09:12:33', status: '1', orderNo: 'ORD20260810088' },
  { recordId: 'REC20260012', couponId: 'CPN2026004001', templateId: 'TPL004', memberName: '陈小姐', memberAccount: '135****7721', channel: '新会员注册', receiveTime: '2026-07-28 13:26:11', startTime: '2026-07-28 13:26:11', endTime: '2026-08-27 13:26:11', status: '2', orderNo: '' }
];
var CP_REC = [];
function cpRecLoad() { try { var r = localStorage.getItem(CP_REC_KEY); if (r) { CP_REC = JSON.parse(r); return; } } catch (e) {} CP_REC = JSON.parse(JSON.stringify(REC_SEED)); cpRecPersist(); }
function cpRecPersist() { try { localStorage.setItem(CP_REC_KEY, JSON.stringify(CP_REC)); } catch (e) {} }
function cpRecById(id) { for (var i = 0; i < CP_REC.length; i++) if (CP_REC[i].recordId === id) return CP_REC[i]; return null; }
function cpRecStatusName(s) { s = String(s); return s === '0' ? '未使用' : (s === '1' ? '已使用' : (s === '2' ? '已过期' : '已作废')); }
function cpRecStatusBadge(s) { s = String(s); return s === '0' ? msCpBadge('未使用', 'ok') : (s === '1' ? msCpBadge('已使用', 'info') : (s === '2' ? msCpBadge('已过期', 'warn') : msCpBadge('已作废', 'err'))); }
function cpRecInit() {
  cpRecLoad();
  cpTplLoad();
  var el = document.getElementById('cp-recordContent');
  if (!el) { setTimeout(cpRecInit, 80); return; }
  function stOpt(v, label) { return '<option value="' + v + '"' + (CP_REC_ST === v ? ' selected' : '') + '>' + label + '</option>'; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">券状态：</span>' +
      '<select class="ic-input" style="width:130px" onchange="cpRecSetSt(this.value)">' + stOpt('', '全部') + stOpt('0', '未使用') + stOpt('1', '已使用') + stOpt('2', '已过期') + stOpt('3', '已作废') + '</select>' +
      '<span style="font-size:12px;color:#8a93a3;margin-left:6px">领取时间</span>' +
      '<input type="date" class="ic-input" style="width:148px" id="cpRecD1" value="' + CP_REC_D1 + '">' +
      '<span style="color:#8a93a3">—</span>' +
      '<input type="date" class="ic-input" style="width:148px" id="cpRecD2" value="' + CP_REC_D2 + '">' +
      '<button class="ic-btn" onclick="cpRecReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="cpRecQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<span style="font-size:12px;color:#8a93a3">券实例明细由各发放计划产生，此处仅作查看与延期管理</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1240px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:130px">券ID/券码</th><th style="width:170px">优惠券</th><th style="width:150px">会员信息</th>' +
            '<th style="width:100px">模板ID</th><th style="width:150px">领取时间</th><th style="width:210px">有效期</th>' +
            '<th style="width:120px">获取渠道</th><th style="width:80px">状态</th><th style="width:130px">关联订单</th><th style="width:140px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="cpRecBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="cpRecPager" style="flex-shrink:0"></div>' +
    '</div>';
  cpRecRender();
}
function cpRecSetSt(v) { CP_REC_ST = v; CP_REC_PAGE = 1; cpRecRender(); }
function cpRecReset() { CP_REC_ST = ''; CP_REC_D1 = ''; CP_REC_D2 = ''; CP_REC_PAGE = 1; var d1 = document.getElementById('cpRecD1'), d2 = document.getElementById('cpRecD2'); if (d1) d1.value = ''; if (d2) d2.value = ''; var sel = document.querySelector('#cp-recordContent select'); if (sel) sel.value = ''; cpRecRender(); }
function cpRecQuery() { var d1 = document.getElementById('cpRecD1'), d2 = document.getElementById('cpRecD2'); CP_REC_D1 = d1 ? d1.value : ''; CP_REC_D2 = d2 ? d2.value : ''; CP_REC_PAGE = 1; cpRecRender(); }
function cpRecRows() {
  return CP_REC.filter(function (r) {
    if (CP_REC_ST !== '' && String(r.status) !== CP_REC_ST) return false;
    var day = r.receiveTime.slice(0, 10);
    if (CP_REC_D1 && day < CP_REC_D1) return false;
    if (CP_REC_D2 && day > CP_REC_D2) return false;
    return true;
  });
}
function cpRecRender(page) {
  if (page) CP_REC_PAGE = page;
  var rows = cpRecRows();
  var pages = Math.ceil(rows.length / CP_REC_SIZE) || 1;
  if (CP_REC_PAGE > pages) CP_REC_PAGE = pages;
  if (CP_REC_PAGE < 1) CP_REC_PAGE = 1;
  var slice = rows.slice((CP_REC_PAGE - 1) * CP_REC_SIZE, CP_REC_PAGE * CP_REC_SIZE);
  var body = document.getElementById('cpRecBody');
  if (!body) return;
  body.innerHTML = slice.map(function (r, i) {
    var t = cpTplById(r.templateId);
    var typeName = t ? cpTplType(t) : '—';
    var op = '';
    op += '<button class="ic-op-link" onclick="cpRecCard(\'' + r.recordId + '\')">查看券面</button>';
    if (String(r.status) === '0' || String(r.status) === '2') op += '<button class="ic-op-link" style="color:#e6a23c" onclick="cpRecDelay(\'' + r.recordId + '\')">延期</button>';
    else op += '<button class="ic-op-link" style="color:#c0c4cc;cursor:not-allowed" onclick="msCpToast(\'仅未使用/已过期的券可延期\')">延期</button>';
    var order = r.orderNo ? '<button class="ic-op-link" onclick="cpRecOrder(\'' + r.orderNo + '\')">' + r.orderNo + '</button>' : '<span style="color:#c0c4cc">—</span>';
    return '<tr><td style="text-align:center;color:#999">' + ((CP_REC_PAGE - 1) * CP_REC_SIZE + i + 1) + '</td>' +
      '<td style="font-family:Menlo,monospace;font-size:11px">' + r.couponId + '</td>' +
      '<td><div style="line-height:18px">' + (t ? msCpEsc(t.name) : '—') + '</div><div style="font-size:11px;color:#8a93a3">' + typeName + '</div></td>' +
      '<td><div style="line-height:18px">' + msCpEsc(r.memberName) + '</div><div style="font-size:11px;color:#8a93a3">' + r.memberAccount + '</div></td>' +
      '<td style="color:#5b6472">' + r.templateId + '</td>' +
      '<td style="color:#5b6472;font-size:11px">' + r.receiveTime + '</td>' +
      '<td style="color:#5b6472;font-size:11px">' + r.startTime + '<br>~ ' + r.endTime + '</td>' +
      '<td>' + r.channel + '</td>' +
      '<td>' + cpRecStatusBadge(r.status) + '</td>' +
      '<td>' + order + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="11" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msCpPager(rows.length, CP_REC_PAGE, CP_REC_SIZE, 'cpRecPager', 'cpRecRender');
}
function cpRecOrder(orderNo) { msCpToast('订单 ' + orderNo + '：订单列表模块建设中'); }
// 券面卡片（对齐 Vue CouponCard 视觉）
function cpRecCardData(r) {
  var t = cpTplById(r.templateId);
  var d = { num: '8', unit: '折', cond: '满100可用', title: r.templateId, typeName: '代金券', start: r.startTime, end: r.endTime, shopText: msCpStoreName('ALL'), goodsText: '', overlayText: '', code: r.couponId };
  if (!t) return d;
  var rule = t.rule || { kind: 'threshold', full: 0, value: 1 };
  var full = msCpNum(rule.full), v = msCpNum(rule.value);
  d.cond = full > 0 ? '满' + full + '元可用' : '无门槛';
  d.title = t.name;
  d.typeName = cpTplType(t);
  d.shopText = msCpStoreName(t.shop);
  var g = [];
  if (t.scope.kind === 'prod') g = (t.scope.prods || []).map(function (p) { return p.name; });
  else if (t.scope.kind === 'cat') g = [t.scope.cat1 + '·' + t.scope.cat2];
  d.goodsText = t.scope.kind === 'all' ? '' : '仅限' + g.join('、');
  var o = [];
  if (t.overlayCoupon) o.push('可与其他券叠加');
  if (t.overlayActivity) o.push('可参与其他活动');
  d.overlayText = o.length ? o.join('；') : '不可叠加使用';
  if (t.type === 'cash') { d.num = t.rule.kind === 'threshold' ? String(v) : String(v); d.unit = '元'; if (t.rule.kind !== 'threshold') d.cond = full > 0 ? '满' + full + '元可用' : '无门槛'; }
  else if (t.type === 'discount') { d.num = String(v); d.unit = '折'; }
  else { d.num = t.rule.kind === 'threshold' ? String(v) : String(v); d.unit = '份'; d.cond = full > 0 ? '满' + full + '元可用' : '到店兑换'; }
  return d;
}
function msCpCardHtml(d) {
  var leftW = 118;
  return '<div style="display:flex;background:#fff;border:1px solid #D4D9E2;border-radius:4px;box-shadow:0 3px 8px rgba(0,0,0,.10);overflow:hidden;font-size:12px;color:#0b1019">' +
    '<div style="width:' + leftW + 'px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:14px 6px;background:linear-gradient(180deg,#fff7f7,#fef0f0)">' +
      '<div style="font-size:32px;font-weight:800;color:#c8161d;line-height:1.05;text-align:center;word-break:break-all">' + msCpEsc(d.num) + '</div>' +
      '<div style="font-size:12px;color:#c8161d">' + msCpEsc(d.unit) + '</div>' +
      '<div style="font-size:11px;color:#8a93a3;text-align:center;line-height:16px;margin-top:4px">' + msCpEsc(d.cond) + '</div>' +
    '</div>' +
    '<div style="width:0;border-left:1px dashed #e3e6ec;flex-shrink:0"></div>' +
    '<div style="flex:1;min-width:0;padding:14px 16px;display:flex;flex-direction:column;gap:5px">' +
      '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:15px;font-weight:700">' + msCpEsc(d.title) + '</span><span style="font-size:10px;padding:1px 8px;border-radius:9px;background:#fdf0ef;color:#c8161d;border:1px solid #f7d8d6;white-space:nowrap">' + msCpEsc(d.typeName) + '</span></div>' +
      '<div style="color:#5b6472;line-height:16px"><span style="color:#0b1019">有效期：</span>' + msCpEsc(d.start) + '<br>至 ' + msCpEsc(d.end) + '</div>' +
      (d.shopText ? '<div style="color:#5b6472"><span style="color:#0b1019">可用门店：</span>' + msCpEsc(d.shopText) + '</div>' : '') +
      (d.goodsText ? '<div style="color:#5b6472"><span style="color:#0b1019">可用商品：</span>' + msCpEsc(d.goodsText) + '</div>' : '') +
      '<div style="color:#909399;font-size:11px">' + msCpEsc(d.overlayText) + '</div>' +
      '<div style="color:#c0c4cc;font-size:10px;margin-top:auto;font-family:Menlo,monospace">' + msCpEsc(d.code) + '</div>' +
    '</div></div>';
}
function cpRecCard(recordId) {
  var r = cpRecById(recordId); if (!r) return;
  var d = cpRecCardData(r);
  msCpDlg({ title: '券面预览 · ' + r.recordId, width: 'min(560px,94vw)', body: msCpCardHtml(d) + '<div style="margin-top:10px;font-size:12px;color:#8a93a3;text-align:center">会员 ' + msCpEsc(r.memberName) + '（' + r.memberAccount + '）· 状态：' + cpRecStatusName(r.status) + '</div>', cancelText: '关闭' });
}
function cpRecDelay(recordId) {
  var r = cpRecById(recordId); if (!r) return;
  var d = cpRecCardData(r);
  var daysOpt = [7, 15, 30].map(function (n) { return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;cursor:pointer"><input type="radio" name="cpDelay" value="' + n + '">' + n + '天</label>'; }).join('');
  msCpDlg({ title: '优惠券延期 · ' + r.couponId, width: 'min(560px,94vw)', body:
    '<div style="margin-bottom:12px">' + msCpCardHtml(d) + '</div>' +
    '<div style="font-size:12px;color:#5b6472;margin-bottom:6px">延期方案（自原有效期结束后顺延）</div>' +
    '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px">' + daysOpt +
      '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="cpDelay" value="custom" checked>自定义</label>' +
      '<input type="number" min="1" class="ic-input" style="width:80px" value="7" oninput="document.getElementById(\'cpDelayDays\').value=this.value" id="cpDelayDays">天' +
    '</div>' +
    '<div style="font-size:11px;color:#8a93a3;line-height:18px">延期后有效期更新为该券新结束时间；已过期券延期后自动恢复为「未使用」。</div>',
    onOk: 'cpRecDelayDo(\'' + recordId + '\')', okText: '确认延期' });
}
function cpRecDelayDo(recordId) {
  var r = cpRecById(recordId); if (!r) return;
  var n = 7;
  var radios = document.getElementsByName('cpDelay');
  for (var i = 0; i < radios.length; i++) if (radios[i].checked) {
    n = radios[i].value === 'custom' ? Math.max(1, msCpNum(document.getElementById('cpDelayDays').value)) : msCpNum(radios[i].value);
  }
  var base = new Date(r.endTime.replace(/-/g, '/'));
  base.setDate(base.getDate() + n);
  function f2(x) { return ('0' + x).slice(-2); }
  var nd = base.getFullYear() + '-' + f2(base.getMonth() + 1) + '-' + f2(base.getDate()) + ' ' + f2(base.getHours()) + ':' + f2(base.getMinutes()) + ':' + f2(base.getSeconds());
  r.endTime = nd;
  if (String(r.status) === '2') r.status = '0';
  cpRecPersist(); msCpClose(); msCpToast('已延期 ' + n + ' 天，新有效期至 ' + nd); cpRecRender();
}
/* ================================================================
 * 入口分发
 * ================================================================ */
function initCouponPage(pid) {
  if (pid === 'cp-template') cpTplInit();
  else if (pid === 'cp-plan') cpPlanInit();
  else if (pid === 'cp-record') cpRecInit();
}
