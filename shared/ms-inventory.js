// ========== 库存管理域（对齐 Vue master Inventory 域，2026-09-03 补齐 demo） ==========
// 页面：inv-list 库存列表 / inv-entry 入库单 / inv-transfer 调拨记录 / inv-return 退货记录 / inv-check 盘点记录
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
  md.style.cssText = 'width:' + (opt.width || 'min(560px,94vw)') + ';';
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
 * 1) 库存列表 inv-list（Vue Inventorylist：仓库/货架库存 + 补货退仓 + 拆零装箱 + 批次弹窗）
 * ================================================================ */
var INV_LIST_PAGE = 1, INV_LIST_SIZE = 10, INV_LIST_KW = '', INV_LIST_SALE = '', INV_LIST_CAT = '', INV_LIST_CHECKED = {};
var INV_GOODS_KEY = 'tcm_inv_goods_v1';
var INV_GOODS_SEED = [
  { goodsId: 'g-01', name: '娃娃菜', code: '6901234500017', cat: '叶菜类', unit: 'kg', spec: '500g/份', sale: 1, warehouse: 120, shelf: 36, avgCost: 2.8, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [{ no: 'RK20260828001', pdate: '2026-08-28', life: '5天', exp: '2026-09-02', w: 80, s: 20 }, { no: 'RK20260901001', pdate: '2026-09-01', life: '5天', exp: '2026-09-06', w: 40, s: 16 }] },
  { goodsId: 'g-02', name: '上海青', code: '6901234500024', cat: '叶菜类', unit: 'kg', spec: '400g/份', sale: 1, warehouse: 88, shelf: 24, avgCost: 2.2, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [{ no: 'RK20260901001', pdate: '2026-09-01', life: '4天', exp: '2026-09-05', w: 88, s: 24 }] },
  { goodsId: 'g-03', name: '白萝卜', code: '6901234500031', cat: '根茎类', unit: 'kg', spec: '称重', sale: 1, warehouse: 64, shelf: 30, avgCost: 1.6, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [{ no: 'RK20260825001', pdate: '2026-08-25', life: '10天', exp: '2026-09-04', w: 64, s: 30 }] },
  { goodsId: 'g-04', name: '土豆', code: '6901234500048', cat: '根茎类', unit: 'kg', spec: '称重', sale: 1, warehouse: 200, shelf: 60, avgCost: 3.4, supplier: '崧泽基地直供', storeId: 'S2001', batches: [{ no: 'RK20260820002', pdate: '2026-08-20', life: '30天', exp: '2026-09-19', w: 200, s: 60 }] },
  { goodsId: 'g-05', name: '西红柿', code: '6901234500055', cat: '茄果类', unit: 'kg', spec: '称重', sale: 1, warehouse: 0, shelf: 0, avgCost: 5.1, supplier: '青浦绿蔬合作社', storeId: 'S2001', batches: [] },
  { goodsId: 'g-06', name: '五花肉', code: '6901234500062', cat: '肉禽蛋', unit: 'kg', spec: '称重', sale: 1, warehouse: 42, shelf: 18, avgCost: 24.5, supplier: '正大肉品', storeId: 'S2001', batches: [{ no: 'RK20260901003', pdate: '2026-09-01', life: '3天', exp: '2026-09-04', w: 42, s: 18 }] },
  { goodsId: 'g-07', name: '土鸡蛋', code: '6901234500079', cat: '肉禽蛋', unit: '盒', spec: '30枚/盒', sale: 1, warehouse: 35, shelf: 22, avgCost: 18.8, supplier: '正大肉品', storeId: 'S2002', batches: [{ no: 'RK20260830001', pdate: '2026-08-30', life: '45天', exp: '2026-10-14', w: 35, s: 22 }] },
  { goodsId: 'g-08', name: '草鱼', code: '6901234500086', cat: '水产', unit: 'kg', spec: '称重', sale: 1, warehouse: 26, shelf: 12, avgCost: 13.2, supplier: '淀山湖水产', storeId: 'S2001', batches: [{ no: 'RK20260901004', pdate: '2026-09-01', life: '2天', exp: '2026-09-03', w: 26, s: 12 }] },
  { goodsId: 'g-09', name: '红富士苹果', code: '6901234500093', cat: '水果', unit: 'kg', spec: '称重', sale: 1, warehouse: 150, shelf: 48, avgCost: 7.6, supplier: '山东栖霞直供', storeId: 'S2002', batches: [{ no: 'RK20260822001', pdate: '2026-08-22', life: '15天', exp: '2026-09-06', w: 150, s: 48 }] },
  { goodsId: 'g-10', name: '金龙鱼调和油', code: '6901234500109', cat: '粮油副食', unit: '瓶', spec: '5L/瓶', sale: 0, warehouse: 12, shelf: 6, avgCost: 62.0, supplier: '益海嘉里', storeId: 'S2001', batches: [{ no: 'RK20260801001', pdate: '2026-08-01', life: '540天', exp: '2027-01-22', w: 12, s: 6 }] },
  { goodsId: 'g-11', name: '光明鲜牛奶', code: '6901234500116', cat: '乳品烘焙', unit: '盒', spec: '950ml/盒', sale: 1, warehouse: 30, shelf: 24, avgCost: 11.9, supplier: '光明乳业', storeId: 'S2001', batches: [{ no: 'RK20260902001', pdate: '2026-09-02', life: '7天', exp: '2026-09-09', w: 30, s: 24 }] },
  { goodsId: 'g-12', name: '思念水饺', code: '6901234500123', cat: '冻品', unit: '袋', spec: '1kg/袋', sale: 1, warehouse: 18, shelf: 10, avgCost: 21.5, supplier: '思念食品', storeId: 'S2002', batches: [{ no: 'RK20260818001', pdate: '2026-08-18', life: '180天', exp: '2027-02-14', w: 18, s: 10 }] }
];
var INV_GOODS = [];
function invListLoad() { try { var r = localStorage.getItem(INV_GOODS_KEY); if (r) { INV_GOODS = JSON.parse(r); return; } } catch (e) {} INV_GOODS = JSON.parse(JSON.stringify(INV_GOODS_SEED)); invListPersist(); }
function invListPersist() { try { localStorage.setItem(INV_GOODS_KEY, JSON.stringify(INV_GOODS)); } catch (e) {} }
function invListCatName(id) { var m = { '': '全部', leaf: '叶菜类', root: '根茎类', sol: '茄果类', meat: '肉禽蛋', fish: '水产', fruit: '水果', oil: '粮油副食', milk: '乳品烘焙', ice: '冻品' }; return m[id] || id; }
function invListInit() {
  invListLoad();
  var el = document.getElementById('inv-listContent');
  if (!el) { setTimeout(invListInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">售品类型：</span>' +
      '<div style="display:flex;gap:0" id="invListSaleTabs">' +
        '<button class="btn-tab active" data-v="" onclick="invListSetSale(\'\',this)">全部商品</button>' +
        '<button class="btn-tab" data-v="1" onclick="invListSetSale(1,this)">可售</button>' +
        '<button class="btn-tab" data-v="0" onclick="invListSetSale(0,this)">不可售</button>' +
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
        '<table style="min-width:1180px">' +
          '<thead><tr>' +
            '<th style="width:44px;text-align:center"><input type="checkbox" onclick="invListCheckAll(this.checked)"></th>' +
            '<th style="width:54px">序号</th><th style="width:130px">商品名称</th><th style="width:140px">编码/条码</th>' +
            '<th style="width:110px">商品规格</th><th style="width:90px">仓库数量</th><th style="width:90px">货架数量</th>' +
            '<th style="width:90px">总库存量</th><th style="width:110px">总成本价(元)</th><th style="width:100px">平均进货价</th>' +
            '<th style="width:110px">门店</th><th style="width:140px">供应商</th><th style="width:90px">状态</th>' +
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
      '<td style="text-align:center"><input type="checkbox" ' + chk + ' onclick="invListCheckOne(\'' + r.goodsId + '\', this.checked)"></td>' +
      '<td style="text-align:center;color:#999">' + seq + '</td>' +
      '<td><a style="color:#1677ff;cursor:pointer" onclick="invListOpenBatch(\'' + r.goodsId + '\')">' + msInvEsc(r.name) + '</a></td>' +
      '<td>' + msInvEsc(r.code) + '</td>' +
      '<td>' + msInvEsc(spec) + '</td>' +
      '<td style="text-align:right">' + r.warehouse + '</td>' +
      '<td style="text-align:right">' + r.shelf + '</td>' +
      '<td style="text-align:right;font-weight:600;color:#0b1019">' + totalInv + '</td>' +
      '<td style="text-align:right">' + totalCost + '</td>' +
      '<td style="text-align:right">¥' + r.avgCost.toFixed(2) + '</td>' +
      '<td>' + (storeName[r.storeId] || r.storeId) + '</td>' +
      '<td>' + msInvEsc(r.supplier) + '</td>' +
      '<td>' + (r.sale === 1 ? msInvBadge('可售', 'ok') : msInvBadge('不可售', 'info')) + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="13" style="text-align:center;color:#999;padding:36px 0">暂无库存数据</td></tr>';
  invListUpdateCheckedTip();
  msInvPager(total, INV_LIST_PAGE, INV_LIST_SIZE, 'invListPager', 'invListGoPage');
}
function invListGoPage(p) { INV_LIST_PAGE = p; invListRender(); }
function invListSetSale(v, el) {
  INV_LIST_SALE = String(v); INV_LIST_PAGE = 1;
  var tabs = document.querySelectorAll('#invListSaleTabs .btn-tab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === el);
  invListRender();
}
function invListSetCat(v) { INV_LIST_CAT = v; INV_LIST_PAGE = 1; invListRender(); }
function invListQuery() { var el = document.getElementById('invListKw'); if (el) INV_LIST_KW = el.value.trim(); INV_LIST_PAGE = 1; invListRender(); }
function invListReset() { INV_LIST_KW = ''; INV_LIST_CAT = ''; INV_LIST_SALE = ''; INV_LIST_PAGE = 1;
  var iw = document.getElementById('invListKw'); if (iw) iw.value = '';
  var cs = document.getElementById('invListCatSel'); if (cs) cs.value = '';
  var tabs = document.querySelectorAll('#invListSaleTabs .btn-tab'); for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', i === 0);
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
// 货架补货 / 退回仓库
function invListBatchOp(type) {
  var rows = invListCheckedRows();
  if (!rows.length) { msInvToast('请先勾选商品'); return; }
  var body = '<div style="font-size:12px;color:#5b6472;margin-bottom:10px">' + (type === 1 ? '为选中商品从仓库补货至货架，请输入各商品补货数量：' : '将选中商品从货架退回仓库，请输入各商品退仓数量：') + '</div>' +
    '<div style="max-height:320px;overflow:auto"><table style="width:100%;min-width:560px">' +
    '<thead><tr><th style="width:60px">序号</th><th>商品名称</th><th>商品规格</th><th style="width:90px">仓库</th><th style="width:90px">货架</th><th style="width:150px">' + (type === 1 ? '补货数量' : '退仓数量') + '</th></tr></thead><tbody>' +
    rows.map(function (r, i) {
      var spec = (r.unit === 'kg' || r.unit === 'l') ? '称重/' + r.unit : r.spec + '/' + r.unit;
      return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(r.name) + '</td><td>' + msInvEsc(spec) + '</td>' +
        '<td style="text-align:right">' + r.warehouse + '</td><td style="text-align:right">' + r.shelf + '</td>' +
        '<td><input id="ilb_' + r.goodsId + '" type="number" min="0" class="ic-search" style="width:100%" placeholder="请输入数量"></td></tr>';
    }).join('') + '</tbody></table></div>';
  window._ilbType = type;
  window._ilbRows = rows;
  msInvModal({ title: (type === 1 ? '货架补货' : '退回仓库'), width: 'min(680px,94vw)', body: body,
    onOk: 'invListDoBatch()', okText: '确认' + (type === 1 ? '补货' : '退仓') });
}
function invListDoBatch() {
  var type = window._ilbType, rows = window._ilbRows || [], done = 0;
  rows.forEach(function (r) {
    var inp = document.getElementById('ilb_' + r.goodsId); if (!inp) return;
    var n = parseFloat(inp.value); if (!n || n <= 0) return;
    if (type === 1) { if (n > r.warehouse) { msInvToast(r.name + ' 仓库库存不足'); return; } r.warehouse -= n; r.shelf += n; }
    else { if (n > r.shelf) { msInvToast(r.name + ' 货架库存不足'); return; } r.shelf -= n; r.warehouse += n; }
    done++;
  });
  if (done) { invListPersist(); msInvCloseModal(); msInvToast('已' + (type === 1 ? '补货' : '退仓') + ' ' + done + ' 种商品'); invListRender(); }
  else msInvToast('请输入有效数量');
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
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">批次号</div>' +
        '<select class="ic-search" style="width:100%;margin-bottom:8px" id="ilBoxBatch">' +
          (r.batches.length ? r.batches.map(function (b) { return '<option value="' + b.no + '">' + b.no + '（仓 ' + b.w + ' / 架 ' + b.s + '）</option>'; }).join('') : '<option value="">— 无批次 —</option>') +
        '</select>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">' + (boxType === 1 ? '拆箱数量（箱）' : '装箱数量（件）') + '</div>' +
        '<input id="ilBoxNum" type="number" min="1" class="ic-search" style="width:100%" placeholder="请输入数量">' +
      '</div>' +
      '<div style="flex:1;border:1px solid #e9eef7;border-radius:6px;padding:12px;background:#fafbfd">' +
        '<div style="font-size:13px;font-weight:600;color:#0b1019;margin-bottom:10px">关联商品（' + (boxType === 1 ? '箱规子件' : '装入的商品') + '）</div>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">选择关联商品</div>' +
        '<select class="ic-search" style="width:100%;margin-bottom:8px" id="ilBoxGoods"><option value="">— 请选择 —</option>' + goodsOpts + '</select>' +
        '<div style="font-size:12px;color:#5b6472;margin-bottom:4px">' + (boxType === 1 ? '每箱件数（散件/箱）' : '单件装箱数量') + '</div>' +
        '<input id="ilBoxNum2" type="number" min="1" class="ic-search" style="width:100%" placeholder="请输入数量">' +
        '<div style="font-size:11px;color:#8a93a3;margin-top:10px;line-height:18px">演示说明：拆零=按箱规把整箱拆为散件销售；装箱=把零货组合成整箱库存。保存后按输入数量调整两商品库存。</div>' +
      '</div>' +
    '</div>';
  window._ilBoxType = boxType; window._ilBoxMain = r;
  msInvModal({ title: boxType === 1 ? '整箱拆零' : '零货装箱', width: 'min(820px,94vw)', body: body,
    onOk: 'invListDoBox()', okText: '确认' });
}
function invListDoBox() {
  var r = window._ilBoxMain; if (!r) return;
  var bsel = document.getElementById('ilBoxBatch'), n1 = parseFloat(document.getElementById('ilBoxNum').value);
  var gsel = document.getElementById('ilBoxGoods'), n2 = parseFloat(document.getElementById('ilBoxNum2').value);
  if (!n1 || n1 <= 0 || !n2 || n2 <= 0 || !gsel.value) { msInvToast('请完整填写数量与关联商品'); return; }
  var rel = null;
  INV_GOODS.forEach(function (g) { if (g.goodsId === gsel.value) rel = g; });
  if (!rel) return;
  if (n1 > r.warehouse) { msInvToast(r.name + ' 仓库库存不足'); return; }
  r.warehouse -= n1; rel.warehouse += n2;
  invListPersist(); msInvCloseModal();
  msInvToast('操作成功：' + r.name + ' −' + n1 + r.unit + '，' + rel.name + ' +' + n2 + rel.unit);
  invListRender();
}
// 批次库存弹窗（点击商品名）
function invListOpenBatch(goodsId) {
  var g = null; INV_GOODS.forEach(function (r) { if (r.goodsId === goodsId) g = r; });
  if (!g) return;
  var b = g.batches || [];
  var rows = b.length ? b.map(function (x, i) {
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(x.no) + '</td>' +
      '<td style="text-align:right">' + x.w + '</td><td style="text-align:right">' + x.s + '</td><td style="text-align:right">' + (x.w + x.s) + '</td>' +
      '<td>' + x.pdate + '</td><td>' + x.life + '</td><td>' + x.exp + '</td></tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px">该商品暂无批次库存</td></tr>';
  var wsum = 0, ssum = 0; b.forEach(function (x) { wsum += x.w; ssum += x.s; });
  var body = '<div style="font-size:13px;font-weight:600;color:#0b1019;margin-bottom:2px">' + msInvEsc(g.name) + '</div>' +
    '<div style="font-size:12px;color:#8a93a3;margin-bottom:12px">' + msInvEsc(g.code) + ' · ' + msInvEsc(g.spec) + '/' + g.unit + ' · 共 ' + b.length + ' 个批次（FIFO 先产先出）</div>' +
    '<div style="max-height:360px;overflow:auto"><table style="width:100%;min-width:640px">' +
    '<thead><tr><th style="width:56px">序号</th><th>入库单号</th><th style="width:100px">仓库数量</th><th style="width:100px">货架数量</th><th style="width:90px">小计</th><th style="width:110px">生产日期</th><th style="width:90px">保质期</th><th style="width:110px">有效期至</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '<tfoot><tr style="background:#f7f9fc;font-weight:600"><td colspan="2" style="text-align:right">合计</td><td style="text-align:right">' + wsum + '</td><td style="text-align:right">' + ssum + '</td><td style="text-align:right">' + (wsum + ssum) + '</td><td colspan="3"></td></tr></tfoot>' +
    '</table></div>';
  msInvModal({ title: '商品批次库存', width: 'min(760px,94vw)', body: body, onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}

/* ================================================================
 * 2) 入库单 inv-entry（Vue Inventoryrecord / Warehouseentry + RKPK_STATUS）
 * ================================================================ */
var INV_ENTRY_PAGE = 1, INV_ENTRY_SIZE = 10, INV_ENTRY_ST = '', INV_ENTRY_KW = '', INV_ENTRY_SUP = '';
var INV_ENTRY_KEY = 'tcm_inv_entry_v1';
function invEntrySeed() {
  return [
    { no: 'RK20260902001', date: '2026-09-02', storeId: 'S2001', supplier: '青浦绿蔬合作社', items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: 'RK20260901001', qty: 40, price: 2.8 }, { name: '上海青', code: '6901234500024', spec: '400g/份', batch: 'RK20260901001', qty: 88, price: 2.2 }], cost: 305.6, status: 20 },
    { no: 'RK20260901004', date: '2026-09-01', storeId: 'S2001', supplier: '淀山湖水产', items: [{ name: '草鱼', code: '6901234500086', spec: '称重', batch: 'RK20260901004', qty: 26, price: 13.2 }], cost: 343.2, status: 20 },
    { no: 'RK20260901003', date: '2026-09-01', storeId: 'S2001', supplier: '正大肉品', items: [{ name: '五花肉', code: '6901234500062', spec: '称重', batch: 'RK20260901003', qty: 42, price: 24.5 }], cost: 1029.0, status: 20 },
    { no: 'RK20260901001', date: '2026-09-01', storeId: 'S2001', supplier: '青浦绿蔬合作社', items: [{ name: '娃娃菜', code: '6901234500017', spec: '500g/份', batch: 'RK20260901001', qty: 40, price: 2.8 }, { name: '上海青', code: '6901234500024', spec: '400g/份', batch: 'RK20260901001', qty: 30, price: 2.2 }], cost: 178.0, status: 20 },
    { no: 'RK20260830001', date: '2026-08-30', storeId: 'S2002', supplier: '正大肉品', items: [{ name: '土鸡蛋', code: '6901234500079', spec: '30枚/盒', batch: 'RK20260830001', qty: 35, price: 18.8 }], cost: 658.0, status: 20 },
    { no: 'RK20260903001', date: '2026-09-03', storeId: 'S2001', supplier: '益海嘉里', items: [{ name: '金龙鱼调和油', code: '6901234500109', spec: '5L/瓶', batch: '—', qty: 20, price: 62.0 }], cost: 1240.0, status: 10 }
  ];
}
var INV_ENTRY = [];
function invEntryLoad() { try { var r = localStorage.getItem(INV_ENTRY_KEY); if (r) { INV_ENTRY = JSON.parse(r); return; } } catch (e) {} INV_ENTRY = invEntrySeed(); invEntryPersist(); }
function invEntryPersist() { try { localStorage.setItem(INV_ENTRY_KEY, JSON.stringify(INV_ENTRY)); } catch (e) {} }
var INV_ENTRY_EDIT_ITEMS = [];
function invEntryInit() {
  invEntryLoad();
  var el = document.getElementById('inv-entryContent');
  if (!el) { setTimeout(invEntryInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">供应商：</span>' +
      '<select class="ic-search" style="flex:0 1 180px" id="invEntrySup" onchange="invEntrySetSup(this.value)"><option value="">全部供应商</option><option>青浦绿蔬合作社</option><option>正大肉品</option><option>淀山湖水产</option><option>益海嘉里</option><option>光明乳业</option><option>思念食品</option></select>' +
      '<span style="font-size:12px;color:#3a4252">状态：</span>' +
      '<select class="ic-search" style="flex:0 1 120px" id="invEntrySt" onchange="invEntrySetSt(this.value)"><option value="">全部状态</option><option value="10">待提交</option><option value="20">已完成</option></select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="入库单号 / 商品名称" value="' + msInvEsc(INV_ENTRY_KW) + '" onkeydown="if(event.key===\'Enter\')invEntryQuery()" id="invEntryKw">' +
      '<button class="ic-btn" onclick="invEntryReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invEntryQuery()">查询</button>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invEntryOpenEdit()">+ 新增入库</button>' +
      '<button class="ic-btn" onclick="invEntryImport()">📥 批量导入</button>' +
      '<button class="ic-btn" onclick="msInvToast(\'已导出入库单（演示）\')">导出</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">待提交=已创建未生效；提交后自动上架并入库存（R-010 入库增强）</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="min-width:1000px">' +
        '<thead><tr><th style="width:56px">序号</th><th style="width:170px">入库单号</th><th style="width:110px">入库日期</th><th style="width:150px">门店</th><th style="width:150px">供应商</th><th style="width:90px">商品数</th><th style="width:130px">进货成本(元)</th><th style="width:90px">状态</th><th>操作</th></tr></thead>' +
        '<tbody id="invEntryBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invEntryPager" style="flex-shrink:0"></div>' +
    '</div>';
  invEntryRender();
}
function invEntryRows() {
  var rows = msInvScopeFilter(INV_ENTRY);
  if (INV_ENTRY_ST) rows = rows.filter(function (r) { return String(r.status) === INV_ENTRY_ST; });
  if (INV_ENTRY_SUP) rows = rows.filter(function (r) { return r.supplier === INV_ENTRY_SUP; });
  if (INV_ENTRY_KW) { var kw = INV_ENTRY_KW.toLowerCase(); rows = rows.filter(function (r) { return r.no.toLowerCase().indexOf(kw) > -1 || r.items.some(function (it) { return it.name.indexOf(kw) > -1; }); }); }
  return rows;
}
function invEntryRender() {
  var rows = invEntryRows(), tbody = document.getElementById('invEntryBody');
  if (!tbody) return;
  var total = rows.length, pages = Math.ceil(total / INV_ENTRY_SIZE) || 1;
  if (INV_ENTRY_PAGE > pages) INV_ENTRY_PAGE = pages; if (INV_ENTRY_PAGE < 1) INV_ENTRY_PAGE = 1;
  var start = (INV_ENTRY_PAGE - 1) * INV_ENTRY_SIZE, data = rows.slice(start, start + INV_ENTRY_SIZE);
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  tbody.innerHTML = data.length ? data.map(function (r, i) {
    var seq = start + i + 1;
    var st = String(r.status) === '20' ? msInvBadge('已完成', 'ok') : msInvBadge('待提交', 'warn');
    var names = r.items.map(function (it) { return it.name + '×' + it.qty; }).join('、');
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + seq + '</td>' +
      '<td><a style="color:#1677ff;cursor:pointer" onclick="invEntryOpenView(\'' + r.no + '\')">' + msInvEsc(r.no) + '</a></td>' +
      '<td>' + r.date + '</td><td>' + (storeName[r.storeId] || r.storeId) + '</td><td>' + msInvEsc(r.supplier) + '</td>' +
      '<td style="text-align:center">' + r.items.length + '</td>' +
      '<td style="text-align:right;font-weight:600">¥' + r.cost.toFixed(2) + '</td>' +
      '<td>' + st + '</td>' +
      '<td><span style="color:#5b6472;font-size:12px" title="' + msInvEsc(names) + '">' + msInvEsc(names.slice(0, 18)) + (names.length > 18 ? '…' : '') + '</span></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:#999;padding:36px 0">暂无入库单</td></tr>';
  msInvPager(total, INV_ENTRY_PAGE, INV_ENTRY_SIZE, 'invEntryPager', 'invEntryGoPage');
}
function invEntryGoPage(p) { INV_ENTRY_PAGE = p; invEntryRender(); }
function invEntrySetSup(v) { INV_ENTRY_SUP = v; INV_ENTRY_PAGE = 1; invEntryRender(); }
function invEntrySetSt(v) { INV_ENTRY_ST = v; INV_ENTRY_PAGE = 1; invEntryRender(); }
function invEntryQuery() { var el = document.getElementById('invEntryKw'); if (el) INV_ENTRY_KW = el.value.trim(); INV_ENTRY_PAGE = 1; invEntryRender(); }
function invEntryReset() { INV_ENTRY_KW = ''; INV_ENTRY_SUP = ''; INV_ENTRY_ST = ''; INV_ENTRY_PAGE = 1;
  var a = document.getElementById('invEntryKw'); if (a) a.value = '';
  var b = document.getElementById('invEntrySup'); if (b) b.value = '';
  var c = document.getElementById('invEntrySt'); if (c) c.value = '';
  invEntryRender();
}
function invEntryNextNo() {
  var d = new Date(), y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
  return 'RK' + y + m + dd + String(100 + Math.floor(Math.random() * 900));
}
function invEntryOpenEdit(no) {
  var r = null;
  if (no) { INV_ENTRY.forEach(function (x) { if (x.no === no) r = x; }); }
  INV_ENTRY_EDIT_ITEMS = r ? JSON.parse(JSON.stringify(r.items)) : [];
  window._ieNo = r ? r.no : invEntryNextNo();
  window._ieSup = r ? r.supplier : '青浦绿蔬合作社';
  invEntryEditRender();
}
function invEntryEditRender() {
  var storeLabel = msInvScopeStoreLabel();
  var rowsHtml = INV_ENTRY_EDIT_ITEMS.length ? INV_ENTRY_EDIT_ITEMS.map(function (it, i) {
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + (i + 1) + '</td>' +
      '<td>' + msInvEsc(it.name) + '<input type="hidden" id="ie_name_' + i + '" value="' + msInvEsc(it.name) + '"></td>' +
      '<td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.spec) + '</td>' +
      '<td><input class="ic-search" style="width:100%" value="' + msInvEsc(it.batch === '—' ? '' : it.batch) + '" placeholder="系统按生产日期生成" disabled></td>' +
      '<td><input id="ie_qty_' + i + '" type="number" min="1" class="ic-search" style="width:80px" value="' + it.qty + '" oninput="invEntryRecalc()"></td>' +
      '<td><input id="ie_price_' + i + '" type="number" min="0" step="0.01" class="ic-search" style="width:90px" value="' + it.price + '" oninput="invEntryRecalc()"></td>' +
      '<td style="text-align:right" id="ie_sub_' + i + '">¥' + (it.qty * it.price).toFixed(2) + '</td>' +
      '<td><button class="ic-btn" style="color:#fc4b52" onclick="invEntryRemoveItem(' + i + ')">移除</button></td></tr>';
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:#999;padding:24px">尚未添加商品</td></tr>';
  var body =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:12px">' +
      '<div style="font-size:12px;color:#5b6472">入库单号：<b style="color:#0b1019">' + window._ieNo + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">入库日期：<b style="color:#0b1019">2026-09-03</b></div>' +
      '<div style="font-size:12px;color:#5b6472">门店：<b style="color:#0b1019">' + storeLabel + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">供应商：<select class="ic-search" style="height:26px;padding:2px 8px;width:150px" id="ieSup" onchange="window._ieSup=this.value">' +
        '<option>青浦绿蔬合作社</option><option>正大肉品</option><option>淀山湖水产</option><option>益海嘉里</option><option>光明乳业</option><option>思念食品</option><option>崧泽基地直供</option><option>山东栖霞直供</option>' +
      '</select></div>' +
    '</div>' +
    '<div style="font-size:12px;font-weight:600;color:#1a2233;margin-bottom:6px">入库商品明细 <span style="color:#8a93a3;font-weight:400">（入库后自动上架，R-010）</span></div>' +
    '<div style="max-height:300px;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%;min-width:760px">' +
      '<thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th>规格</th><th style="width:170px">批次号</th><th style="width:100px">入库数量</th><th style="width:110px">进货价</th><th style="width:110px">小计</th><th style="width:70px">操作</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '<tfoot><tr style="background:#f7f9fc"><td colspan="7" style="text-align:right;font-weight:600">合计金额</td><td style="text-align:right;font-weight:600;color:#d4380d" id="ieTotal">¥0.00</td><td></td></tr></tfoot>' +
    '</table></div>' +
    '<div style="margin-top:10px;display:flex;gap:8px">' +
      '<button class="ic-btn ic-btn-pri" onclick="invEntryPickGoods()">+ 添加商品</button>' +
      '<button class="ic-btn" onclick="invEntryScan()">📷 扫码添加</button>' +
      '<span style="flex:1"></span>' +
      '<span style="font-size:12px;color:#8a93a3" id="ieHint"></span>' +
    '</div>';
  msInvModal({ title: (window._ieNo && (function () { var f = false; INV_ENTRY.forEach(function (x) { if (x.no === window._ieNo) f = true; }); return f; })()) ? '编辑入库单' : '新增入库单', width: 'min(980px,94vw)', body: body,
    footer: false });
  var supSel = document.getElementById('ieSup'); if (supSel) supSel.value = window._ieSup;
  invEntryRecalc();
  // 自定义底部（含「保存为待提交」与「直接提交入库」两档，演示 R-010 提交流程）
  var foot = document.createElement('div'); foot.className = 'ic-modal-footer'; foot.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
  foot.innerHTML = '<span style="flex:1;font-size:12px;color:#8a93a3;align-self:center">待提交可继续编辑；提交后库存生效、不可再改</span>' +
    '<button class="btn-secondary" onclick="invEntrySaveDraft()">保存为待提交</button>' +
    '<button class="btn-primary" onclick="invEntrySaveCommit()">提交入库</button>';
  var m = document.getElementById('msInvModal'); if (m) m.appendChild(foot);
}
function invEntryRecalc() {
  var total = 0;
  INV_ENTRY_EDIT_ITEMS.forEach(function (it, i) {
    var q = document.getElementById('ie_qty_' + i), p = document.getElementById('ie_price_' + i), sub = document.getElementById('ie_sub_' + i);
    var qv = q ? parseFloat(q.value) : it.qty, pv = p ? parseFloat(p.value) : it.price;
    if (!qv || qv <= 0) qv = it.qty; if (!pv || pv < 0) pv = it.price;
    var s = qv * pv; total += s;
    if (sub) sub.textContent = '¥' + s.toFixed(2);
  });
  var t = document.getElementById('ieTotal'); if (t) t.textContent = '¥' + total.toFixed(2);
  window._ieTotal = total;
}
function invEntryRemoveItem(i) { INV_ENTRY_EDIT_ITEMS.splice(i, 1); invEntryEditRender(); }
function invEntryPickGoods() {
  var opts = INV_GOODS.filter(function (g) { return !INV_ENTRY_EDIT_ITEMS.some(function (it) { return it.code === g.code; }); })
    .map(function (g) { return '<option value="' + g.goodsId + '">' + msInvEsc(g.name) + ' / ' + msInvEsc(g.code) + ' / ' + msInvEsc(g.spec) + '</option>'; }).join('');
  msInvModal({ title: '选择入库商品', width: 'min(520px,94vw)', body:
    '<div style="font-size:12px;color:#5b6472;margin-bottom:6px">从标品库选择（无此商品可先到「标准商品」建档）</div>' +
    '<select class="ic-search" style="width:100%;margin-bottom:10px" id="iePickSel"><option value="">— 请选择商品 —</option>' + opts + '</select>',
    onOk: 'invEntryPickOk()', okText: '加入明细' });
}
function invEntryPickOk() {
  var s = document.getElementById('iePickSel'); if (!s.value) { msInvToast('请选择商品'); return; }
  var g = null; INV_GOODS.forEach(function (x) { if (x.goodsId === s.value) g = x; });
  if (!g) return;
  INV_ENTRY_EDIT_ITEMS.push({ name: g.name, code: g.code, spec: (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit, batch: '—', qty: 1, price: g.avgCost });
  msInvCloseModal(); invEntryEditRender();
}
function invEntryScan() {
  msInvToast('扫码枪已就绪，请扫描商品条码（演示环境仅模拟）');
  invEntryPickGoods();
}
function invEntrySaveDraft() { invEntrySave(10); }
function invEntrySaveCommit() { invEntrySave(20); }
function invEntrySave(status) {
  if (!INV_ENTRY_EDIT_ITEMS.length) { msInvToast('请先添加入库商品'); return; }
  var isEdit = false, idx = -1;
  INV_ENTRY.forEach(function (x, i) { if (x.no === window._ieNo) { isEdit = true; idx = i; } });
  var cost = 0;
  var items = INV_ENTRY_EDIT_ITEMS.map(function (it, i) {
    var q = document.getElementById('ie_qty_' + i), p = document.getElementById('ie_price_' + i);
    var qv = q ? parseFloat(q.value) : it.qty, pv = p ? parseFloat(p.value) : it.price;
    cost += qv * pv;
    return { name: it.name, code: it.code, spec: it.spec, batch: '—', qty: qv, price: pv };
  });
  var rec = { no: window._ieNo, date: '2026-09-03', storeId: 'S2001', supplier: window._ieSup || '青浦绿蔬合作社', items: items, cost: Math.round(cost * 100) / 100, status: status };
  if (isEdit) INV_ENTRY[idx] = rec; else INV_ENTRY.unshift(rec);
  // 提交入库时按 FIFO 追加库存与批次（演示与库存列表联动）
  if (status === 20) {
    items.forEach(function (it) {
      var g = null; INV_GOODS.forEach(function (x) { if (x.code === it.code) g = x; });
      if (!g) { g = { goodsId: 'gx' + Date.now(), name: it.name, code: it.code, cat: '粮油副食', unit: 'kg', spec: it.spec, sale: 1, warehouse: 0, shelf: 0, avgCost: it.price, supplier: rec.supplier, storeId: 'S2001', batches: [] }; INV_GOODS.push(g); }
      g.warehouse += it.qty; g.supplier = rec.supplier;
      g.batches.unshift({ no: rec.no, pdate: rec.date, life: '待定', exp: '—', w: it.qty, s: 0 });
    });
    invListPersist();
  }
  invEntryPersist(); msInvCloseModal();
  msInvToast(status === 20 ? '入库单已提交，库存已更新并上架' : '已保存为待提交');
  invEntryRender();
}
function invEntryOpenView(no) {
  var r = null; INV_ENTRY.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var rows = r.items.map(function (it, i) {
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.spec) + '</td>' +
      '<td>' + msInvEsc(it.batch === '—' ? '' : it.batch) + '</td><td style="text-align:right">' + it.qty + '</td><td style="text-align:right">¥' + it.price.toFixed(2) + '</td><td style="text-align:right">¥' + (it.qty * it.price).toFixed(2) + '</td></tr>';
  }).join('');
  msInvModal({ title: '入库单详情 · ' + r.no, width: 'min(860px,94vw)', body:
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;font-size:12px;color:#5b6472">' +
      '<div>门店：<b style="color:#0b1019">' + (storeName[r.storeId] || r.storeId) + '</b></div><div>供应商：<b style="color:#0b1019">' + msInvEsc(r.supplier) + '</b></div>' +
      '<div>入库日期：<b style="color:#0b1019">' + r.date + '</b></div><div>入库单号：<b style="color:#0b1019">' + r.no + '</b></div>' +
      '<div>商品数：<b style="color:#0b1019">' + r.items.length + '</b></div><div>状态：' + (String(r.status) === '20' ? msInvBadge('已完成', 'ok') : msInvBadge('待提交', 'warn')) + '</div>' +
    '</div>' +
    '<div style="max-height:340px;overflow:auto"><table style="width:100%;min-width:700px">' +
    '<thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th>规格</th><th style="width:150px">批次号</th><th style="width:90px">入库数量</th><th style="width:100px">进货价</th><th style="width:110px">小计</th></tr></thead>' +
    '<tbody>' + rows + '</tbody><tfoot><tr style="background:#f7f9fc;font-weight:600"><td colspan="7" style="text-align:right">合计</td><td style="text-align:right">¥' + r.cost.toFixed(2) + '</td></tr></tfoot></table></div>' +
    (String(r.status) === '10' ? '<div style="margin-top:12px;text-align:right"><button class="ic-btn ic-btn-pri" onclick="invEntryViewCommit()">提交入库</button> <button class="ic-btn" onclick="invEntryOpenEdit(\'' + r.no + '\')">编辑</button></div>' : ''),
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
  window._ieViewNo = no;
}
function invEntryViewCommit() {
  var no = window._ieViewNo, r = null; INV_ENTRY.forEach(function (x, i) { if (x.no === no) { r = x; } });
  if (!r) return;
  r.status = 20;
  r.items.forEach(function (it) {
    var g = null; INV_GOODS.forEach(function (x) { if (x.code === it.code) g = x; });
    if (g) { g.warehouse += it.qty; g.batches.unshift({ no: r.no, pdate: r.date, life: '待定', exp: '—', w: it.qty, s: 0 }); }
  });
  invListPersist(); invEntryPersist(); msInvCloseModal(); msInvToast('已提交入库，库存已更新'); invEntryRender();
}
function invEntryImport() {
  msInvModal({ title: '批量导入入库单', width: 'min(560px,94vw)', body:
    '<div style="border:1.5px dashed #b8c4d6;border-radius:8px;padding:32px 16px;text-align:center;background:#fafbfd">' +
      '<div style="font-size:26px;margin-bottom:8px">📥</div>' +
      '<div style="font-size:13px;color:#0b1019;margin-bottom:4px">拖拽 Excel 文件到此处，或点击选择文件</div>' +
      '<div style="font-size:12px;color:#8a93a3;margin-bottom:14px">支持 .xlsx / .xls，表头：商品编码、入库数量、进货价、生产日期</div>' +
      '<button class="ic-btn ic-btn-pri" onclick="msInvToast(\'文件已选择（演示）\')">选择文件</button>' +
    '</div>' +
    '<div style="font-size:12px;color:#8a93a3;margin-top:10px">导入后生成「待提交」入库单，确认无误后提交生效；<a style="color:#1677ff;cursor:pointer" onclick="msInvToast(\'示例模板下载（演示）\')">下载模板</a></div>',
    onOk: 'msInvToast(\'演示：导入成功，共 2 条待提交入库单\');msInvCloseModal();invEntryRender()', okText: '开始导入' });
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
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">调拨=门店/仓库之间库存划拨（Vue 调货模块）</span>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invTfOpenEdit()">+ 新增调拨</button>' +
      '<button class="ic-btn" onclick="msInvToast(\'已导出调拨记录（演示）\')">导出</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="min-width:1060px">' +
        '<thead><tr><th style="width:56px">序号</th><th style="width:180px">调拨单号</th><th style="width:110px">调拨日期</th><th style="width:130px">调出方</th><th style="width:130px">调入方</th><th style="width:90px">类型</th><th style="width:130px">商品</th><th style="width:100px">调拨金额(元)</th><th style="width:90px">状态</th><th>操作</th></tr></thead>' +
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
      '<td style="text-align:center;color:#999">' + seq + '</td>' +
      '<td><a style="color:#1677ff;cursor:pointer" onclick="invTfView(\'' + r.no + '\')">' + msInvEsc(r.no) + '</a></td>' +
      '<td>' + r.date + '</td><td>' + invTfStoreName(r.fromStore) + '</td><td>' + invTfStoreName(r.toStore) + '</td>' +
      '<td>' + msInvEsc(r.type) + '</td>' +
      '<td style="font-size:12px" title="' + msInvEsc(names) + '">' + msInvEsc(names.slice(0, 16)) + (names.length > 16 ? '…' : '') + '</td>' +
      '<td style="text-align:right;font-weight:600">¥' + r.amount.toFixed(2) + '</td>' +
      '<td>' + invTfStatusBadge(r.status) + '</td><td>' + act + '</td>' +
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
  if (act === 'ship') { r.status = 'shipped'; msInvToast('已发货：' + no); }
  else if (act === 'done') { r.status = 'done'; msInvToast('已确认完成：' + no); }
  else if (act === 'cancel') { if (!confirm('确认取消该调拨单？')) return; r.status = 'cancel'; msInvToast('已取消：' + no); }
  invTfPersist(); invTfRender();
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
      '<td style="text-align:right">' + it.stock + '</td><td><input id="tfq_' + i + '" type="number" min="1" class="ic-search" style="width:90px" value="' + it.qty + '"></td>' +
      '<td style="text-align:right" id="tfsub_' + i + '">¥' + (it.qty * it.price).toFixed(2) + '</td>' +
      '<td><button class="ic-btn" style="color:#fc4b52" onclick="invTfRemoveItem(' + i + ')">移除</button></td></tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px">尚未添加调拨商品</td></tr>';
  var body =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:12px">' +
      '<div style="font-size:12px;color:#5b6472">调拨单号：<b style="color:#0b1019">' + window._tfNo + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">调拨日期：<b style="color:#0b1019">2026-09-03</b></div>' +
      '<div style="font-size:12px;color:#5b6472">申请类型：<select class="ic-search" style="height:26px;padding:2px 8px;width:120px" id="tfType"><option>店间调拨</option><option>仓库补货</option><option>门店退货至仓</option></select></div>' +
      '<div style="font-size:12px;color:#5b6472">调入方：<select class="ic-search" style="height:26px;padding:2px 8px;width:170px" id="tfTo"><option value="S2001">崧泽-青浦旗舰店</option><option value="S2002">崧泽-松江分店</option><option value="WH">中心仓库</option></select></div>' +
    '</div>' +
    '<div style="font-size:12px;font-weight:600;color:#1a2233;margin-bottom:6px">调拨商品明细</div>' +
    '<div style="max-height:280px;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%;min-width:720px">' +
      '<thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th>规格</th><th style="width:90px">调出方库存</th><th style="width:110px">调拨数量</th><th style="width:110px">金额</th><th style="width:70px">操作</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
    '</table></div>' +
    '<div style="margin-top:10px"><button class="ic-btn ic-btn-pri" onclick="invTfPickGoods()">+ 添加商品</button></div>' +
    '<div style="font-size:12px;color:#8a93a3;margin-top:8px;line-height:18px">调出方为当前范围门店（' + msInvScopeStoreLabel() + '）。提交后生成「待发货」调拨单，发货后库存实时划拨。</div>';
  msInvModal({ title: '新增调拨单', width: 'min(880px,94vw)', body: body, onOk: 'invTfSave()', okText: '提交调拨' });
}
function invTfPickGoods() {
  var opts = INV_GOODS.map(function (g) { return '<option value="' + g.goodsId + '">' + msInvEsc(g.name) + ' / ' + msInvEsc(g.code) + '（库存 ' + g.warehouse + '）</option>'; }).join('');
  msInvModal({ title: '选择调拨商品', width: 'min(520px,94vw)', body: '<select class="ic-search" style="width:100%" id="tfPickSel"><option value="">— 请选择商品 —</option>' + opts + '</select>',
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
    return { name: it.name, code: it.code, qty: qv || it.qty };
  });
  var amount = 0; INV_TF_EDIT_ITEMS.forEach(function (it, i) { var q = document.getElementById('tfq_' + i); var qv = q ? parseFloat(q.value) : it.qty; amount += (qv || it.qty) * it.price; });
  var typeSel = document.getElementById('tfType'), toSel = document.getElementById('tfTo');
  INV_TF.unshift({ no: window._tfNo, date: '2026-09-03', fromStore: 'S2001', toStore: toSel ? toSel.value : 'S2002', type: typeSel ? typeSel.value : '店间调拨', items: items, amount: Math.round(amount * 100) / 100, status: 'pending', createdAt: '2026-09-03 ' + new Date().toTimeString().slice(0, 5) });
  invTfPersist(); msInvCloseModal(); msInvToast('调拨单已提交（待发货）'); invTfRender();
}
function invTfView(no) {
  var r = null; INV_TF.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var rows = r.items.map(function (it, i) {
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td><td style="text-align:right">' + it.qty + '</td></tr>';
  }).join('');
  msInvModal({ title: '调拨单详情 · ' + r.no, width: 'min(680px,94vw)', body:
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:#5b6472;margin-bottom:12px">' +
      '<div>申请类型：<b style="color:#0b1019">' + msInvEsc(r.type) + '</b></div><div>调拨日期：<b style="color:#0b1019">' + r.date + '</b></div>' +
      '<div>调出方：<b style="color:#0b1019">' + invTfStoreName(r.fromStore) + '</b></div><div>调入方：<b style="color:#0b1019">' + invTfStoreName(r.toStore) + '</b></div>' +
      '<div>状态：' + invTfStatusBadge(r.status) + '</div>' +
    '</div>' +
    '<div style="max-height:300px;overflow:auto"><table style="width:100%"><thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th style="width:100px">数量</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}

/* ================================================================
 * 4) 退货记录 inv-return（Vue Returnedrecord / Returnedgoods）
 * ================================================================ */
var INV_RT_PAGE = 1, INV_RT_SIZE = 10, INV_RT_ST = '', INV_RT_KW = '', INV_RT_SUP = '';
var INV_RT_KEY = 'tcm_inv_return_v1';
function invRtSeed() {
  return [
    { no: 'TH20260902001', date: '2026-09-02', storeId: 'S2001', supplier: '益海嘉里', items: [{ name: '金龙鱼调和油', code: '6901234500109', batch: 'RK20260801001', qty: 2, price: 62.0 }], amount: 124.0, reason: '临期退回', status: 20 },
    { no: 'TH20260831001', date: '2026-08-31', storeId: 'S2001', supplier: '青浦绿蔬合作社', items: [{ name: '娃娃菜', code: '6901234500017', batch: 'RK20260828001', qty: 10, price: 2.8 }, { name: '上海青', code: '6901234500024', batch: 'RK20260901001', qty: 8, price: 2.2 }], amount: 45.6, reason: '品质问题', status: 20 },
    { no: 'TH20260901001', date: '2026-09-01', storeId: 'S2002', supplier: '正大肉品', items: [{ name: '土鸡蛋', code: '6901234500079', batch: 'RK20260830001', qty: 5, price: 18.8 }], amount: 94.0, reason: '破损', status: 10 }
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
    var act = String(r.status) === '10' ? '<button class="ic-btn ic-btn-pri" style="height:24px;padding:0 8px" onclick="invRtDoCommit(\'' + r.no + '\')">提交</button>' : '<button class="ic-btn" style="height:24px;padding:0 8px" onclick="invRtView(\'' + r.no + '\')">查看</button>';
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
function invRtOpenEdit() {
  INV_RT_EDIT_ITEMS = [];
  var d = new Date(); var no = 'TH' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + String(100 + Math.floor(Math.random() * 900));
  window._rtNo = no; window._rtSup = '青浦绿蔬合作社';
  invRtEditRender();
}
function invRtEditRender() {
  var rowsHtml = INV_RT_EDIT_ITEMS.length ? INV_RT_EDIT_ITEMS.map(function (it, i) {
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.batch) + '</td>' +
      '<td style="text-align:right">' + it.stock + '</td><td><input id="rtq_' + i + '" type="number" min="1" class="ic-search" style="width:80px" value="' + it.qty + '" oninput="invRtRecalc()"></td>' +
      '<td style="text-align:right">¥' + it.price.toFixed(2) + '</td><td style="text-align:right" id="rtsub_' + i + '">¥' + (it.qty * it.price).toFixed(2) + '</td>' +
      '<td><button class="ic-btn" style="color:#fc4b52" onclick="invRtRemoveItem(' + i + ')">移除</button></td></tr>';
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:#999;padding:24px">尚未添加退货商品</td></tr>';
  var body =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:12px">' +
      '<div style="font-size:12px;color:#5b6472">退货单号：<b style="color:#0b1019">' + window._rtNo + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">退货日期：<b style="color:#0b1019">2026-09-03</b></div>' +
      '<div style="font-size:12px;color:#5b6472">门店：<b style="color:#0b1019">' + msInvScopeStoreLabel() + '</b></div>' +
      '<div style="font-size:12px;color:#5b6472">供应商：<select class="ic-search" style="height:26px;padding:2px 8px;width:170px" id="rtSup" onchange="window._rtSup=this.value"><option>青浦绿蔬合作社</option><option>正大肉品</option><option>益海嘉里</option><option>光明乳业</option></select></div>' +
      '<div style="font-size:12px;color:#5b6472">退货原因：<select class="ic-search" style="height:26px;padding:2px 8px;width:160px" id="rtReason"><option>品质问题</option><option>临期退回</option><option>破损</option><option>多送退回</option><option>其他</option></select></div>' +
    '</div>' +
    '<div style="font-size:12px;font-weight:600;color:#1a2233;margin-bottom:6px">退货商品明细（按原入库批次退货）</div>' +
    '<div style="max-height:280px;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%;min-width:820px">' +
      '<thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th style="width:160px">来源入库批次</th><th style="width:90px">可退库存</th><th style="width:90px">退货数量</th><th style="width:90px">退货价</th><th style="width:100px">金额</th><th style="width:70px">操作</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '<tfoot><tr style="background:#f7f9fc"><td colspan="7" style="text-align:right;font-weight:600">合计</td><td style="text-align:right;font-weight:600;color:#d4380d" id="rtTotal">¥0.00</td><td></td></tr></tfoot>' +
    '</table></div>' +
    '<div style="margin-top:10px"><button class="ic-btn ic-btn-pri" onclick="invRtPickGoods()">+ 添加退货商品</button></div>';
  msInvModal({ title: '新增退货单', width: 'min(960px,94vw)', body: body, onOk: 'invRtSave()', okText: '保存为待提交' });
  var sup = document.getElementById('rtSup'); if (sup) sup.value = window._rtSup;
  invRtRecalc();
}
function invRtRecalc() {
  var total = 0;
  INV_RT_EDIT_ITEMS.forEach(function (it, i) {
    var q = document.getElementById('rtq_' + i), sub = document.getElementById('rtsub_' + i);
    var qv = q ? parseFloat(q.value) : it.qty; if (!qv || qv <= 0) qv = it.qty;
    total += qv * it.price;
    if (sub) sub.textContent = '¥' + (qv * it.price).toFixed(2);
  });
  var t = document.getElementById('rtTotal'); if (t) t.textContent = '¥' + total.toFixed(2);
}
function invRtRemoveItem(i) { INV_RT_EDIT_ITEMS.splice(i, 1); invRtEditRender(); }
function invRtPickGoods() {
  var opts = INV_GOODS.map(function (g) { return '<option value="' + g.goodsId + '">' + msInvEsc(g.name) + ' / ' + msInvEsc(g.code) + '</option>'; }).join('');
  msInvModal({ title: '选择退货商品', width: 'min(520px,94vw)', body:
    '<div style="font-size:12px;color:#5b6472;margin-bottom:6px">选择商品后取最早批次作为来源批次（FIFO）</div>' +
    '<select class="ic-search" style="width:100%" id="rtPickSel"><option value="">— 请选择商品 —</option>' + opts + '</select>',
    onOk: 'invRtPickOk()', okText: '加入' });
}
function invRtPickOk() {
  var s = document.getElementById('rtPickSel'); if (!s.value) { msInvToast('请选择商品'); return; }
  var g = null; INV_GOODS.forEach(function (x) { if (x.goodsId === s.value) g = x; });
  if (!g) return;
  var batchNo = (g.batches && g.batches.length) ? g.batches[0].no : '—';
  INV_RT_EDIT_ITEMS.push({ name: g.name, code: g.code, spec: '', batch: batchNo, stock: g.warehouse, qty: 1, price: g.avgCost });
  msInvCloseModal(); invRtEditRender();
}
function invRtSave() {
  if (!INV_RT_EDIT_ITEMS.length) { msInvToast('请添加退货商品'); return; }
  var items = INV_RT_EDIT_ITEMS.map(function (it, i) {
    var q = document.getElementById('rtq_' + i); var qv = q ? parseFloat(q.value) : it.qty;
    return { name: it.name, code: it.code, batch: it.batch, qty: qv || it.qty, price: it.price };
  });
  var amount = 0; items.forEach(function (it) { amount += it.qty * it.price; });
  var reasonSel = document.getElementById('rtReason');
  INV_RT.unshift({ no: window._rtNo, date: '2026-09-03', storeId: 'S2001', supplier: window._rtSup, items: items, amount: Math.round(amount * 100) / 100, reason: reasonSel ? reasonSel.value : '品质问题', status: 10 });
  invRtPersist(); msInvCloseModal(); msInvToast('退货单已保存为待提交'); invRtRender();
}
function invRtDoCommit(no) {
  var r = null; INV_RT.forEach(function (x, i) { if (x.no === no) r = x; });
  if (!r) return;
  r.status = 20;
  // 回退库存（对应批次数量减少）
  r.items.forEach(function (it) {
    var g = null; INV_GOODS.forEach(function (x) { if (x.code === it.code) g = x; });
    if (g) {
      g.warehouse = Math.max(0, g.warehouse - it.qty);
      if (g.batches && g.batches.length) {
        var b = g.batches[0];
        if (b.w >= it.qty) b.w -= it.qty; else { b.w = 0; }
      }
    }
  });
  invListPersist(); invRtPersist(); msInvToast('退货已提交，批次库存已回退'); invRtRender();
}
function invRtView(no) {
  var r = null; INV_RT.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var rows = r.items.map(function (it, i) {
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.batch) + '</td><td style="text-align:right">' + it.qty + '</td><td style="text-align:right">¥' + it.price.toFixed(2) + '</td><td style="text-align:right">¥' + (it.qty * it.price).toFixed(2) + '</td></tr>';
  }).join('');
  msInvModal({ title: '退货单详情 · ' + r.no, width: 'min(820px,94vw)', body:
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:12px;color:#5b6472;margin-bottom:12px">' +
      '<div>门店：<b style="color:#0b1019">' + (storeName[r.storeId] || r.storeId) + '</b></div><div>供应商：<b style="color:#0b1019">' + msInvEsc(r.supplier) + '</b></div>' +
      '<div>退货日期：<b style="color:#0b1019">' + r.date + '</b></div><div>退货原因：<b style="color:#0b1019">' + msInvEsc(r.reason) + '</b></div>' +
      '<div>状态：' + (String(r.status) === '20' ? msInvBadge('已完成', 'ok') : msInvBadge('待提交', 'warn')) + '</div>' +
    '</div>' +
    '<div style="max-height:300px;overflow:auto"><table style="width:100%;min-width:680px"><thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th>来源批次</th><th style="width:90px">数量</th><th style="width:90px">退货价</th><th style="width:100px">金额</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}

/* ================================================================
 * 5) 盘点记录 inv-check（Vue Stocktakerecord / Stocktake / Inventrysnapshot）
 * ================================================================ */
var INV_CK_PAGE = 1, INV_CK_SIZE = 10, INV_CK_ST = '', INV_CK_KW = '';
var INV_CK_KEY = 'tcm_inv_check_v1';
function invCkSeed() {
  return [
    { no: 'PD20260830001', date: '2026-08-30', endDate: '2026-08-30', storeId: 'S2001', area: '全店', mode: '全盘', by: '陈明', diff: 3, diffAmt: 12.4, status: 'done', items: [{ name: '娃娃菜', book: 156, real: 154 }, { name: '上海青', book: 112, real: 112 }, { name: '五花肉', book: 60, real: 61 }] },
    { no: 'PD20260831001', date: '2026-08-31', endDate: '', storeId: 'S2001', area: '仓库区', mode: '抽盘', by: '刘洋', diff: 0, diffAmt: 0, status: 'checking', items: [{ name: '金龙鱼调和油', book: 18, real: 18 }, { name: '思念水饺', book: 26, real: 26 }] },
    { no: 'PD20260901001', date: '2026-09-01', endDate: '2026-09-01', storeId: 'S2002', area: '全店', mode: '全盘', by: '黄丽', diff: 1, diffAmt: 21.5, status: 'done', items: [{ name: '思念水饺', book: 28, real: 27 }] },
    { no: 'PD20260902001', date: '2026-09-02', endDate: '', storeId: 'S2001', area: '生鲜冷藏区', mode: '抽盘', by: '陈明', diff: 0, diffAmt: 0, status: 'checking', items: [{ name: '光明鲜牛奶', book: 54, real: 54 }, { name: '草鱼', book: 38, real: 38 }] }
  ];
}
var INV_CK = [];
function invCkLoad() { try { var r = localStorage.getItem(INV_CK_KEY); if (r) { INV_CK = JSON.parse(r); return; } } catch (e) {} INV_CK = invCkSeed(); invCkPersist(); }
function invCkPersist() { try { localStorage.setItem(INV_CK_KEY, JSON.stringify(INV_CK)); } catch (e) {} }
function invCkInit() {
  invCkLoad();
  var el = document.getElementById('inv-checkContent');
  if (!el) { setTimeout(invCkInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">状态：</span>' +
      '<select class="ic-search" style="flex:0 1 130px" id="invCkSt" onchange="invCkSetSt(this.value)"><option value="">全部状态</option><option value="checking">盘点中</option><option value="done">已完成</option></select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="盘点单号" value="' + msInvEsc(INV_CK_KW) + '" onkeydown="if(event.key===\'Enter\')invCkQuery()" id="invCkKw">' +
      '<button class="ic-btn" onclick="invCkReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="invCkQuery()">查询</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">盘点差异以提交时实时数据为准（盘点快照）</span>' +
    '</div>' +
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<button class="ic-btn ic-btn-pri" onclick="invCkOpenEdit()">+ 新增盘点</button>' +
      '<button class="ic-btn" onclick="invCkSnapshot()">📸 盘点快照</button>' +
      '<button class="ic-btn" onclick="msInvToast(\'已导出盘点记录（演示）\')">导出</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="min-width:1020px">' +
        '<thead><tr><th style="width:56px">序号</th><th style="width:180px">盘点单号</th><th style="width:120px">盘点区域</th><th style="width:90px">盘点方式</th><th style="width:110px">开始日期</th><th style="width:110px">完成日期</th><th style="width:90px">盘点人</th><th style="width:100px">差异品数</th><th style="width:110px">差异金额(元)</th><th style="width:90px">状态</th><th>操作</th></tr></thead>' +
        '<tbody id="invCkBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="invCkPager" style="flex-shrink:0"></div>' +
    '</div>';
  invCkRender();
}
function invCkRows() {
  var rows = msInvScopeFilter(INV_CK);
  if (INV_CK_ST) rows = rows.filter(function (r) { return r.status === INV_CK_ST; });
  if (INV_CK_KW) { var kw = INV_CK_KW.toLowerCase(); rows = rows.filter(function (r) { return r.no.toLowerCase().indexOf(kw) > -1; }); }
  return rows;
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
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + seq + '</td>' +
      '<td><a style="color:#1677ff;cursor:pointer" onclick="invCkView(\'' + r.no + '\')">' + msInvEsc(r.no) + '</a></td>' +
      '<td>' + msInvEsc(r.area) + '</td><td>' + (r.mode === '全盘' ? '全盘' : '抽盘') + '</td>' +
      '<td>' + r.date + '</td><td>' + (r.endDate || '—') + '</td>' +
      '<td>' + msInvEsc(r.by) + '</td>' +
      '<td style="text-align:right;' + (r.diff ? 'color:#fc4b52;font-weight:600' : '') + '">' + (r.diff ? '+' + r.diff : 0) + '</td>' +
      '<td style="text-align:right;' + (r.diffAmt ? 'color:#fc4b52;font-weight:600' : '') + '">' + (r.diffAmt ? '¥' + r.diffAmt.toFixed(2) : '¥0.00') + '</td>' +
      '<td>' + st + '</td><td>' + act + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="11" style="text-align:center;color:#999;padding:36px 0">暂无盘点记录</td></tr>';
  msInvPager(total, INV_CK_PAGE, INV_CK_SIZE, 'invCkPager', 'invCkGoPage');
}
function invCkGoPage(p) { INV_CK_PAGE = p; invCkRender(); }
function invCkSetSt(v) { INV_CK_ST = v; INV_CK_PAGE = 1; invCkRender(); }
function invCkQuery() { var el = document.getElementById('invCkKw'); if (el) INV_CK_KW = el.value.trim(); INV_CK_PAGE = 1; invCkRender(); }
function invCkReset() { INV_CK_KW = ''; INV_CK_ST = ''; INV_CK_PAGE = 1;
  var a = document.getElementById('invCkKw'); if (a) a.value = '';
  var b = document.getElementById('invCkSt'); if (b) b.value = '';
  invCkRender();
}
// 新增盘点：实时盘点录入（账面=快照数据，录入实盘自动算差异）
var INV_CK_EDIT = [];
function invCkOpenEdit() {
  INV_CK_EDIT = INV_GOODS.filter(function (g) { return g.warehouse + g.shelf > 0; }).slice(0, 6).map(function (g) {
    return { name: g.name, code: g.code, spec: (g.unit === 'kg' || g.unit === 'l') ? '称重/' + g.unit : g.spec + '/' + g.unit, book: g.warehouse + g.shelf, real: null };
  });
  var d = new Date(); var no = 'PD' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + String(100 + Math.floor(Math.random() * 900));
  window._ckNo = no;
  invCkEditRender();
}
function invCkEditRender() {
  var rowsHtml = INV_CK_EDIT.map(function (it, i) {
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td>' + msInvEsc(it.code) + '</td><td>' + msInvEsc(it.spec) + '</td>' +
      '<td style="text-align:right">' + it.book + '</td>' +
      '<td><input id="ckreal_' + i + '" type="number" min="0" class="ic-search" style="width:90px" placeholder="录入实盘" oninput="invCkDiff(' + i + ')"></td>' +
      '<td style="text-align:right;color:#fc4b52;font-weight:600" id="ckdiff_' + i + '">—</td>' +
    '</tr>';
  }).join('');
  var body =
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;margin-bottom:12px;font-size:12px;color:#5b6472">' +
      '<div>盘点单号：<b style="color:#0b1019">' + window._ckNo + '</b></div>' +
      '<div>盘点区域：<select class="ic-search" style="height:26px;padding:2px 8px;width:150px" id="ckArea"><option>全店</option><option>仓库区</option><option>生鲜冷藏区</option><option>粮油货架区</option></select></div>' +
      '<div>盘点方式：<select class="ic-search" style="height:26px;padding:2px 8px;width:110px" id="ckMode"><option>全盘</option><option>抽盘</option></select></div>' +
      '<div>门店：<b style="color:#0b1019">' + msInvScopeStoreLabel() + '</b></div>' +
      '<div>开始日期：<b style="color:#0b1019">2026-09-03</b></div>' +
      '<div>盘点人：<b style="color:#0b1019">陈明</b></div>' +
    '</div>' +
    '<div style="font-size:11px;color:#8a93a3;background:#f7f9fc;border:1px solid #eef1f6;border-radius:4px;padding:6px 10px;margin-bottom:8px">⚠️ 账面数量为盘点开始时的快照；实盘录入后自动计算差异，提交后差异库存将同步修正（差异数据仅供参考，以提交时实时数据为准）。</div>' +
    '<div style="max-height:300px;overflow:auto;border:1px solid #e9eef7;border-radius:4px"><table style="width:100%;min-width:720px">' +
      '<thead><tr><th style="width:50px">序号</th><th>商品名称</th><th>编码/条码</th><th>规格</th><th style="width:90px">账面数量</th><th style="width:130px">实盘数量</th><th style="width:90px">差异</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
    '</table></div>';
  msInvModal({ title: '新增盘点单', width: 'min(860px,94vw)', body: body, onOk: 'invCkSave()', okText: '提交盘点' });
}
function invCkDiff(i) {
  var inp = document.getElementById('ckreal_' + i), out = document.getElementById('ckdiff_' + i);
  if (!inp || !out) return;
  var v = parseFloat(inp.value);
  if (v === '' || isNaN(v)) { out.textContent = '—'; return; }
  var d = Math.round((v - INV_CK_EDIT[i].book) * 100) / 100;
  out.textContent = (d > 0 ? '+' : '') + d;
}
function invCkSave() {
  var items = INV_CK_EDIT.map(function (it, i) {
    var inp = document.getElementById('ckreal_' + i);
    var v = inp && inp.value !== '' ? parseFloat(inp.value) : it.book;
    return { name: it.name, book: it.book, real: isNaN(v) ? it.book : v };
  });
  var diff = 0, diffAmt = 0;
  items.forEach(function (it) { var d = it.real - it.book; if (d !== 0) diff++; });
  var area = document.getElementById('ckArea'), mode = document.getElementById('ckMode');
  INV_CK.unshift({ no: window._ckNo, date: '2026-09-03', endDate: '2026-09-03', storeId: 'S2001', area: area ? area.value : '全店', mode: mode ? mode.value : '全盘', by: '陈明', diff: diff, diffAmt: diffAmt, status: 'done', items: items });
  // 实盘数同步修正库存（有差异的行）
  items.forEach(function (it) {
    var g = null; INV_GOODS.forEach(function (x) { if (x.code === it.code) g = x; });
    if (g && it.real !== it.book) {
      var delta = it.real - (g.warehouse + g.shelf);
      g.warehouse = Math.max(0, g.warehouse + delta);
    }
  });
  invListPersist(); invCkPersist(); msInvCloseModal();
  msInvToast(diff ? '盘点完成，发现 ' + diff + ' 项差异，库存已修正' : '盘点完成，无差异');
  invCkRender();
}
function invCkDo(no) {
  var r = null; INV_CK.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  msInvModal({ title: '继续盘点 · ' + r.no, width: 'min(560px,94vw)', body:
    '<div style="font-size:13px;color:#0b1019;margin-bottom:8px">当前盘点进行中</div>' +
    '<div style="font-size:12px;color:#5b6472;margin-bottom:16px;line-height:20px">盘点区域 <b>' + r.area + '</b> · 方式 <b>' + r.mode + '</b> · 开始于 <b>' + r.date + '</b>。完成实盘录入后提交，差异将同步修正库存。</div>' +
    '<div style="display:flex;gap:8px"><button class="ic-btn ic-btn-pri" onclick="invCkView(\'' + r.no + '\', true)">继续录入</button><button class="ic-btn" onclick="invCkFinish(\'' + r.no + '\')">直接按账面完成</button></div>',
    onOk: 'msInvCloseModal()', okText: '稍后处理', footer: false });
  var foot = document.createElement('div'); foot.className = 'ic-modal-footer';
  foot.innerHTML = '<button class="btn-secondary" onclick="msInvCloseModal()">关闭</button>';
  var m = document.getElementById('msInvModal'); if (m) m.appendChild(foot);
}
function invCkFinish(no) {
  var r = null; INV_CK.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  r.status = 'done'; r.endDate = '2026-09-03'; r.diff = 0; r.diffAmt = 0;
  invCkPersist(); msInvCloseModal(); msInvToast('盘点已完成（无差异）'); invCkRender();
}
function invCkView(no, editMode) {
  var r = null; INV_CK.forEach(function (x) { if (x.no === no) r = x; });
  if (!r) return;
  var storeName = { S2001: '崧泽-青浦旗舰店', S2002: '崧泽-松江分店' };
  var rows = r.items.map(function (it, i) {
    var d = it.real - it.book;
    var diffHtml = d === 0 ? '<span style="color:#909399">0</span>' : (d > 0 ? '<span style="color:#fc4b52">+' + d + '</span>' : '<span style="color:#3eb27e">' + d + '</span>');
    return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + msInvEsc(it.name) + '</td><td style="text-align:right">' + it.book + '</td><td style="text-align:right">' + it.real + '</td><td style="text-align:right">' + diffHtml + '</td></tr>';
  }).join('');
  msInvModal({ title: '盘点单详情 · ' + r.no, width: 'min(760px,94vw)', body:
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:12px;color:#5b6472;margin-bottom:12px">' +
      '<div>门店：<b style="color:#0b1019">' + (storeName[r.storeId] || r.storeId) + '</b></div><div>区域：<b style="color:#0b1019">' + msInvEsc(r.area) + '</b></div>' +
      '<div>方式：<b style="color:#0b1019">' + msInvEsc(r.mode) + '</b></div><div>盘点人：<b style="color:#0b1019">' + msInvEsc(r.by) + '</b></div>' +
      '<div>开始：<b style="color:#0b1019">' + r.date + '</b></div><div>完成：<b style="color:#0b1019">' + (r.endDate || '—') + '</b></div>' +
      '<div>状态：' + (r.status === 'done' ? msInvBadge('已完成', 'ok') : msInvBadge('盘点中', 'blue')) + '</div>' +
    '</div>' +
    '<div style="max-height:300px;overflow:auto"><table style="width:100%"><thead><tr><th style="width:50px">序号</th><th>商品名称</th><th style="width:100px">账面</th><th style="width:100px">实盘</th><th style="width:100px">差异</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}
function invCkSnapshot() {
  var now = new Date(); var label = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2) + ' ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
  var total = 0, sku = 0;
  INV_GOODS.forEach(function (g) { if (g.warehouse + g.shelf > 0) { sku++; total += g.warehouse + g.shelf; } });
  msInvModal({ title: '盘点快照（Inventrysnapshot）', width: 'min(640px,94vw)', body:
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">' +
      '<div style="background:#f0f7ff;border:1px solid #d9ecff;border-radius:6px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:700;color:#1677ff">' + sku + '</div><div style="font-size:12px;color:#5b6472;margin-top:4px">在库 SKU</div></div>' +
      '<div style="background:#f0f9eb;border:1px solid #e1f3d8;border-radius:6px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:700;color:#67c23a">' + total + '</div><div style="font-size:12px;color:#5b6472;margin-top:4px">总库存量</div></div>' +
      '<div style="background:#fdf6ec;border:1px solid #faecd8;border-radius:6px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:700;color:#e6a23c">0</div><div style="font-size:12px;color:#5b6472;margin-top:4px">未完成盘点</div></div>' +
    '</div>' +
    '<div style="font-size:12px;color:#5b6472;line-height:22px">快照时间：<b style="color:#0b1019">' + label + '</b>。快照冻结当前各商品仓库/货架数量，作为盘点差异计算的账面基准；盘点提交前售卖数据每分钟刷新，请以提交时实时数据为准。</div>' +
    '<div style="margin-top:12px;text-align:right"><button class="ic-btn ic-btn-pri" onclick="invCkOpenEdit()">基于快照新建盘点</button></div>',
    onOk: 'msInvCloseModal()', okText: '关闭', cancelText: '' });
}

// 页面初始化分发（由各页面 HTML 底部调用）
function initInventoryPage(pid) {
  if (pid === 'inv-list') invListInit();
  else if (pid === 'inv-entry') invEntryInit();
  else if (pid === 'inv-transfer') invTfInit();
  else if (pid === 'inv-return') invRtInit();
  else if (pid === 'inv-check') invCkInit();
}
