// ========== 商品标签域（v2.0.1）：通用标签 / 分类标签，一张表 ==========
// 页面：goods-tag（标签维护）/ goods-list（打标下拉、分类下标签筛选）
// 依赖 layout.js：GOODS_CATEGORIES / getCategoryName / getCategoryItemCount / GL_MOCK_DATA /
//                escapeHtml / showToast / glPersistGoods / glRenderTable（均运行时取，不 require 顺序）
// 规则见《商品标签功能需求说明》：标签双轨（displayClassId 空=通用 / 非空=挂唯一一级分类）、
// 商品单选打标（tagId，可空）、停用不出现在打标与筛选但已打标商品保留显示、删除先查引用。
var MS_TAG_LOADED = true;

/* ===== 开发者设计说明块（DEV NOTE）=====
   产品页面可以展示设计口径，但必须与产品 UI 明确隔离，避免被当成给用户的产品说明：
   ① 橙色 DEV NOTE 徽章 + 橙色「设计说明」标题（彩色即已表明面向技术人员，不再加解释性副标题）；
   ② 灰蓝虚线框 / 浅底 + 橙色左竖条，视觉上区别于白底产品卡片和主蓝「后续需求」块；
   ③ 默认收起不挤占操作区，展开后首行再声明「PRD 摘录、正式交付可整体隐藏或移除」。
   商品标签页与摊位管理页共用本函数（标识与文案单一来源），正文口径出自《商品标签功能需求说明》。 */
function tgDevNote(id, title, bodyHtml) {
  return '<div style="flex-shrink:0;margin:8px 10px 10px;border:1px dashed #b9c8dc;border-left:3px solid #e07b14;border-radius:4px;background:#f7f9fc">' +
    '<div onclick="tgDevNoteToggle(\'' + id + '\')" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:12px;color:#5b6472;user-select:none">' +
      '<span style="flex-shrink:0;padding:1px 7px;border-radius:3px;background:#e07b14;color:#fff;font-family:Menlo,Consolas,monospace;font-size:11px;font-weight:600;letter-spacing:.5px">DEV NOTE</span>' +
      '<b style="color:#c25e00;font-weight:600">设计说明 · ' + title + '</b>' +
      '<span style="color:#8a93a3">点击展开全文</span>' +
      '<span style="flex:1"></span><span id="' + id + 'Arrow" style="color:#e07b14">▸</span>' +
    '</div>' +
    '<div id="' + id + '" style="display:none;padding:0 14px 12px;font-size:12px;line-height:1.8;color:#5b6472">' +
      '<div style="margin-bottom:8px;padding:6px 8px;background:#eef2f8;border-radius:3px;color:#8a93a3">本区块为 PRD 设计口径摘录，供研发对齐实现，不属于产品功能与操作提示；正式交付可整体隐藏或移除。</div>' +
      bodyHtml +
    '</div>' +
  '</div>';
}
function tgDevNoteToggle(id) {
  var box = document.getElementById(id), arrow = document.getElementById(id + 'Arrow');
  if (!box) return;
  var open = box.style.display === 'none';
  box.style.display = open ? 'block' : 'none';
  if (arrow) arrow.textContent = open ? '▾' : '▸';
}

var TAG_KEY = 'tcm_goods_tag_v1';
var TAG_BACKFILL_FLAG = 'tcm_goods_tag_backfill_v1';
var GOODS_TAGS = [];          // 标签主档：{ tagId, tagName, displayClassId(''=通用), sort, status('0'启用/'1'停用), createdAt }
var TAG_FILTER = '';          // 商品列表当前标签筛选（''=全部；仅选中分类后可用）
var TG_READY = false;

/* 演示种子：通用 3 + 蔬菜 4（含 1 个停用示例）+ 水果/肉禽蛋/水产 各 1 */
var TAG_SEED = [
  { tagId: 'T0001', tagName: '热销',   displayClassId: '',   sort: 1, status: '0', createdAt: '2026-11-01 09:00' },
  { tagId: 'T0002', tagName: '新品',   displayClassId: '',   sort: 2, status: '0', createdAt: '2026-11-01 09:01' },
  { tagId: 'T0003', tagName: '本地菜', displayClassId: '',   sort: 3, status: '0', createdAt: '2026-11-01 09:02' },
  { tagId: 'T1001', tagName: '叶菜',   displayClassId: 'c1', sort: 1, status: '0', createdAt: '2026-11-01 09:10' },
  { tagId: 'T1002', tagName: '根茎',   displayClassId: 'c1', sort: 2, status: '0', createdAt: '2026-11-01 09:11' },
  { tagId: 'T1003', tagName: '菌菇',   displayClassId: 'c1', sort: 3, status: '0', createdAt: '2026-11-01 09:12' },
  { tagId: 'T1004', tagName: '净菜',   displayClassId: 'c1', sort: 4, status: '1', createdAt: '2026-11-01 09:13' },
  { tagId: 'T2001', tagName: '进口水果', displayClassId: 'c2', sort: 1, status: '0', createdAt: '2026-11-01 09:20' },
  { tagId: 'T3001', tagName: '冷鲜肉', displayClassId: 'c3', sort: 1, status: '0', createdAt: '2026-11-01 09:30' },
  { tagId: 'T4001', tagName: '活鲜',   displayClassId: 'c4', sort: 1, status: '0', createdAt: '2026-11-01 09:40' }
];

function msTagLoad() {
  if (TG_READY) return;
  try { var r = localStorage.getItem(TAG_KEY); if (r) { GOODS_TAGS = JSON.parse(r); TG_READY = true; return; } } catch (e) {}
  GOODS_TAGS = JSON.parse(JSON.stringify(TAG_SEED));
  msTagPersist();
  TG_READY = true;
}
function msTagPersist() { try { localStorage.setItem(TAG_KEY, JSON.stringify(GOODS_TAGS)); } catch (e) {} }
function msTagById(id) { msTagLoad(); for (var i = 0; i < GOODS_TAGS.length; i++) if (GOODS_TAGS[i].tagId === id) return GOODS_TAGS[i]; return null; }
function msTagName(id) { var t = msTagById(id); return t ? t.tagName : ''; }
function msTagNextId() { msTagLoad(); var max = 0; GOODS_TAGS.forEach(function (t) { var n = parseInt((t.tagId || '').replace('T', ''), 10); if (n > max) max = n; }); return 'T' + ('000' + (max + 1)).slice(-4); }
/* 同节点内唯一（不同分类允许同名） */
function msTagNameExists(name, displayClassId, excludeId) {
  msTagLoad();
  var key = displayClassId || '';
  return GOODS_TAGS.some(function (t) {
    return t.tagId !== excludeId && (t.displayClassId || '') === key && t.tagName === name;
  });
}
/* 引用商品数：主档里 tagId 命中的商品数 */
function msTagRefNum(tagId) {
  if (typeof GL_MOCK_DATA === 'undefined' || !GL_MOCK_DATA) return 0;
  return GL_MOCK_DATA.filter(function (r) { return r.tagId === tagId; }).length;
}
/* 节点标签列表：includeDisabled=false 只出启用；排序 sort 升序、同号按创建时间 */
function msTagNodeTags(displayClassId, includeDisabled) {
  msTagLoad();
  var key = displayClassId || '';
  return GOODS_TAGS.filter(function (t) {
    return (t.displayClassId || '') === key && (includeDisabled || t.status === '0');
  }).sort(function (a, b) { return (a.sort - b.sort) || String(a.createdAt).localeCompare(String(b.createdAt)); });
}
function msTagCatTags(classId, includeDisabled) { return classId ? msTagNodeTags(classId, includeDisabled) : []; }
function msTagGeneralTags(includeDisabled) { return msTagNodeTags('', includeDisabled); }
/* 分类删除/停用联动：其下分类标签一并停用（不物理删），通用标签不受影响 */
function msTagDisableByClass(classId) {
  msTagLoad();
  var changed = false;
  GOODS_TAGS.forEach(function (t) { if (t.displayClassId === classId && t.status !== '1') { t.status = '1'; changed = true; } });
  if (changed) msTagPersist();
}

/* 存量商品一次性回填 tagId（确定性分配，演示筛选/计数用；只跑一次，不覆盖用户后续改动） */
function msTagBackfillGoods() {
  try { if (localStorage.getItem(TAG_BACKFILL_FLAG)) return; } catch (e) { return; }
  msTagLoad();
  if (typeof GL_MOCK_DATA === 'undefined' || !GL_MOCK_DATA || !GL_MOCK_DATA.length) return;
  var gen = msTagGeneralTags(false);
  GL_MOCK_DATA.forEach(function (r, i) {
    if (r.tagId) return;
    var catTags = msTagCatTags(r.categoryId, false);
    if (i % 5 === 4) return;                       /* 留出「未打标」桶，计数可对账 */
    if (catTags.length) r.tagId = catTags[i % catTags.length].tagId;
    else if (gen.length && i % 2 === 0) r.tagId = gen[Math.floor(i / 2) % gen.length].tagId;
  });
  if (typeof glPersistGoods === 'function') { try { glPersistGoods(); } catch (e) {} }
  try { localStorage.setItem(TAG_BACKFILL_FLAG, '1'); } catch (e) {}
}

function msTagToast(m) { try { showToast(m); } catch (e) { alert(m); } }
function msTagBadge(text, kind) {
  var map = {
    ok: 'background:#f0f9eb;color:#67c23a;border:1px solid #e1f3d8',
    err: 'background:#fef0f0;color:#f56c6c;border:1px solid #fde2e2',
    info: 'background:#f4f4f5;color:#909399;border:1px solid #e9e9eb',
    blue: 'background:#ecf5ff;color:#409eff;border:1px solid #d9ecff'
  };
  return '<span style="display:inline-block;padding:1px 10px;border-radius:10px;font-size:12px;line-height:18px;white-space:nowrap;' + (map[kind] || map.info) + '">' + text + '</span>';
}

/* ================================================================
 * 商品标签维护页 goods-tag
 * ================================================================ */
var TG_CUR_NODE = '_general';   /* '_general' = 通用标签节点，其余为一级分类 id */
var TG_PAGE = 1, TG_SIZE = 10;
var TG_DRAFT = null;
/* 视角授权（v2.0.1）：标签维护按登录账号层级收敛。
 * 通用标签全店共享，摊位账号若能改名/停用/删除会波及所有摊位与销售系统终端 → 摊位只读；
 * 分类标签摊位可自建，但只能建/改「本摊位经营范围内分类」的。静态演示用视角切换模拟登录账号。 */
var TG_VIEW = { persona: 'admin', boothId: '' };   /* persona: 'admin' = 门店级及以上；'booth' = 摊位账号 */

/* 摊位视角：当前摊位（启用 + 至少一个可用账号，与终端登录口径一致） */
function tgViewBooth() {
  if (TG_VIEW.persona !== 'booth') return null;
  var b = msBtById(TG_VIEW.boothId);
  if (!b || b.status !== '0' || msBtUnbound(b)) return null;
  return b;
}
/* 摊位视角可维护的分类标签节点（= 经营范围内分类）；通用标签不在内（只读） */
function tgViewClasses(b) {
  if (!b) return [];
  return (b.classIds || []).filter(function (id) {
    return typeof getVisibleCategories !== 'function' || getVisibleCategories().some(function (c) { return c.id === id; });
  });
}
/* 视角下拉选项：门店管理员 + 各可用摊位（启用且绑了账号） */
function tgViewBooths() {
  msBtLoad();
  return BOOTHS.filter(function (b) {
    if (b.status !== '0' || msBtUnbound(b)) return false;
    return !(msBtBadAccounts(b) || []).length || (b.accountIds || []).some(function (id) { var u = msBtUserById(id); return u && String(u.status) === '0'; });
  });
}
function tgSetView(v) {
  if (v === 'admin') { TG_VIEW = { persona: 'admin', boothId: '' }; }
  else {
    var b = msBtById(v); if (!b) return;
    TG_VIEW = { persona: 'booth', boothId: b.boothId };
    TG_CUR_NODE = (b.classIds || [])[0] || '_general';
  }
  TG_PAGE = 1;
  tgRenderNodes(); tgRender(); tgSyncViewBar();
}

function tgEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function tgDlg(opt) {
  var b = document.getElementById('tgBackdrop'), m = document.getElementById('tgModal');
  if (b) b.remove(); if (m) m.remove();
  var bd = document.createElement('div'); bd.className = 'ic-modal-backdrop'; bd.id = 'tgBackdrop';
  bd.onclick = function (e) { if (e.target === this) tgClose(); };
  var md = document.createElement('div'); md.className = 'ic-modal'; md.id = 'tgModal';
  /* 统一加一层 92vw 上限：弹框适度加宽后小屏仍不溢出（inline 覆盖 .ic-modal 的 min(440px,92vw)）。
     opt.height：整框固定高度（内部候选框保持自适应），勾选分类重算候选时弹框尺寸 / 位置恒定，不再上下跳。 */
  md.style.cssText = 'width:min(' + (opt.width || '560px') + ',92vw);' + (opt.height ? 'height:' + opt.height + ';' : '');
  var foot = opt.noFoot ? '' : ('<div class="ic-modal-footer">' +
    '<button class="btn-secondary" onclick="tgClose()">取消</button>' +
    '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '保存') + '</button></div>');
  md.innerHTML = '<div class="ic-modal-header"><span>' + opt.title + '</span><button class="ic-modal-close" onclick="tgClose()">✕</button></div>' +
    '<div class="ic-modal-body" style="max-height:70vh;overflow:auto">' + opt.body + '</div>' + foot;
  document.body.appendChild(bd); document.body.appendChild(md);
}
function tgClose() { var b = document.getElementById('tgBackdrop'), m = document.getElementById('tgModal'); if (b) b.remove(); if (m) m.remove(); }
function tgConfirm(title, html, okName, okText) {
  tgDlg({ title: title, width: '460px', okText: okText || '确认删除', onOk: okName + '()', body: '<p style="font-size:12px;line-height:1.8;color:#5b6472">' + html + '</p>' });
}

function initGoodsTagPage() {
  msTagLoad(); msTagBackfillGoods();
  var el = document.getElementById('goodsTagContent');
  if (!el) { setTimeout(initGoodsTagPage, 80); return; }
  el.innerHTML =
    '<div style="display:flex;flex:1;min-height:0;overflow:hidden;gap:8px;padding:8px;background:#F1F2F5">' +
      /* 左侧：通用标签 + 一级分类侧边栏（复用商品列表分类侧边栏样式） */
      '<div style="width:200px;flex-shrink:0;background:#fff;border-radius:4px;display:flex;flex-direction:column;overflow:hidden">' +
        '<div id="tgNodeList" style="flex:1;overflow-y:auto;padding:12px 0"></div>' +
      '</div>' +
      /* 右侧：标签表格 */
      '<div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden">' +
        '<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #f0f2f5;display:flex;align-items:center;gap:10px;padding:10px 16px">' +
          '<span id="tgNodeTitle" style="font-size:13px;font-weight:600;color:#0b1019"></span>' +
          '<span id="tgViewTip" style="font-size:12px;color:#8a93a3"></span>' +
          '<span style="flex:1"></span>' +
          /* 视角切换（静态演示：模拟登录账号层级） */
          '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#5b6472">登录视角' +
            '<select class="ic-input" id="tgViewSel" onchange="tgSetView(this.value)" style="width:190px;padding:4px 8px">' +
              '<option value="admin">门店管理员（门店级）</option>' +
              tgViewBooths().map(function (b) { return '<option value="' + b.boothId + '"' + (TG_VIEW.persona === 'booth' && TG_VIEW.boothId === b.boothId ? ' selected' : '') + '>' + tgEsc(b.boothName) + '（摊位账号）</option>'; }).join('') +
            '</select>' +
          '</span>' +
          '<button class="ic-btn ic-btn-pri" id="tgAddBtn" onclick="tgOpen(\'new\')">＋ 新增标签</button>' +
        '</div>' +
        '<div style="flex:1;min-height:0;background:#fff;display:flex;flex-direction:column;overflow:hidden">' +
          '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
            '<table style="min-width:760px">' +
              '<thead><tr>' +
                '<th style="width:52px">序号</th><th style="width:180px">标签名称</th><th style="width:140px">类型</th>' +
                '<th style="width:80px">排序号</th><th style="width:100px">关联商品数</th><th style="width:90px">状态</th><th style="width:190px">操作</th>' +
              '</tr></thead>' +
              '<tbody id="tgBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="pagination-bar" id="tgPager" style="flex-shrink:0"></div>' +
          tgDevNote('tgDevNoteBox', '商品标签 v2.0.1',
            '<b>两种标签，一张表</b>：分类标签挂唯一一级分类（该分类内部的结构细分，如 蔬菜 → 叶菜 / 根茎），通用标签跨分类使用（如 热销 / 新品 / 本地菜）。<br>' +
            '<b>同节点内唯一</b>：同一分类（或通用）下标签名不可重复；不同分类允许同名（如蔬菜和水果各建「本地菜」）。<br>' +
            '<b>删除规则</b>：先查引用商品数——为 0 直接删；大于 0 二次确认后删除，这些商品变为「未打标」。<br>' +
            '<b>分类联动</b>：删除一级分类时，其下分类标签一并停用（不物理删），通用标签不受影响。<br>' +
            '<b>打标</b>：商品新增 / 编辑弹窗单选打标（可空），可选项 = 本分类标签（排前）+ 通用标签（排后）；未选分类只能选通用标签。<br>' +
            '<b>可用标签（摊位账号视角）</b>：通用标签全店共享、摊位账号只读（维护仅门店级及以上）；分类标签摊位可自建，但只能维护本摊位经营范围内分类；打标不受限，可用标签 = 本摊范围分类标签（按 §5.4 默认全部或子集）+ <b>已选用</b>通用标签（未选用不出现）。<br>' +
            '<span style="color:#8a93a3">口径出处：《商品标签功能需求说明》§5.2 / §5.6。</span>') +
        '</div>' +
      '</div>' +
    '</div>';
  tgRenderNodes();
  tgRender();
  tgSyncViewBar();
}

/* 视角提示条：说明当前登录视角能做什么 */
function tgSyncViewBar() {
  var tip = document.getElementById('tgViewTip'); if (!tip) return;
  var b = tgViewBooth();
  if (!b) { tip.textContent = '停用的标签不出现在打标下拉与筛选条，已打标商品保留显示'; return; }
  var cls = tgViewClasses(b).map(function (id) { return typeof getCategoryName === 'function' ? getCategoryName(id) : id; }).join('、');
  tip.innerHTML = '当前以摊位账号登录：<b style="color:#0b1019">' + tgEsc(b.boothName) + '</b>，可维护分类「' + tgEsc(cls) + '」的分类标签；通用标签只读';
}

/* 左侧节点侧边栏：通用标签 + 一级分类（各带商品数）；摊位视角只出经营范围内分类，通用标签标只读 */
function tgRenderNodes() {
  var box = document.getElementById('tgNodeList'); if (!box) return;
  msTagLoad();
  var vb = tgViewBooth();
  var genNum = msTagGeneralTags(true).length;
  var allCats = (typeof getVisibleCategories === 'function') ? getVisibleCategories() : [];
  var cats = vb ? allCats.filter(function (c) { return (vb.classIds || []).indexOf(c.id) >= 0; }) : allCats;
  var genStyle = 'padding:9px 16px;font-size:12px;cursor:' + (vb ? 'default' : 'pointer') + ';display:flex;align-items:center;justify-content:space-between';
  var genClick = vb ? '' : ' onclick="tgPickNode(\'_general\',this)"';
  var genDot = vb
    ? '<span style="width:6px;height:6px;border-radius:50%;background:#c0c4cc;flex-shrink:0"></span><span>通用标签 <span style="font-size:10px;color:#e6a23c">（只读）</span></span>'
    : '<span style="display:flex;align-items:center;gap:8px"><span style="width:6px;height:6px;border-radius:50%;background:#005CF5;flex-shrink:0"></span><span>通用标签</span></span>';
  var html =
    '<div class="gc-sidebar-item' + (TG_CUR_NODE === '_general' ? ' active' : '') + '"' + genClick +
      ' style="' + genStyle + '">' +
      '<span style="display:flex;align-items:center;gap:8px">' + genDot + '</span>' +
      '<span style="font-size:11px;color:#999;background:#f0f0f0;padding:1px 7px;border-radius:8px">' + genNum + '</span>' +
    '</div>';
  html += cats.map(function (cat) {
    var count = (typeof getCategoryItemCount === 'function') ? getCategoryItemCount(cat.id) : 0;
    var isActive = TG_CUR_NODE === cat.id;
    var style = 'padding:9px 16px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between';
    if (isActive) style += ';background:#F0F6FF;color:#005CF5;font-weight:500';
    return '<div class="gc-sidebar-item' + (isActive ? ' active' : '') + '" onclick="tgPickNode(\'' + cat.id + '\',this)" style="' + style + '">' +
      '<span style="display:flex;align-items:center;gap:8px">' +
        '<span style="width:6px;height:6px;border-radius:50%;background:' + (cat.color || '#ccc') + ';flex-shrink:0"></span>' +
        '<span>' + tgEsc(cat.name) + '</span>' +
      '</span>' +
      '<span style="font-size:11px;' + (isActive ? 'color:#005CF5;background:rgba(0,92,245,0.08)' : 'color:#999;background:#f0f0f0') + ';padding:1px 7px;border-radius:8px">' + count + '</span>' +
    '</div>';
  }).join('');
  box.innerHTML = html + '<style>.gc-sidebar-item.active{background:#F0F6FF;color:#005CF5;font-weight:500}</style>';
  var title = document.getElementById('tgNodeTitle');
  if (title) title.textContent = TG_CUR_NODE === '_general' ? '通用标签' : (typeof getCategoryName === 'function' ? getCategoryName(TG_CUR_NODE) : '') + ' · 分类标签';
}
function tgPickNode(nodeId, el) {
  TG_CUR_NODE = nodeId; TG_PAGE = 1;
  var items = document.querySelectorAll('#tgNodeList .gc-sidebar-item');
  items.forEach(function (it) { it.classList.remove('active'); });
  if (el) el.classList.add('active');
  var title = document.getElementById('tgNodeTitle');
  if (title) title.textContent = nodeId === '_general' ? '通用标签' : (typeof getCategoryName === 'function' ? getCategoryName(nodeId) : '') + ' · 分类标签';
  tgRender();
}

function tgRender(page) {
  if (page) TG_PAGE = page;
  var rows = msTagNodeTags(TG_CUR_NODE === '_general' ? '' : TG_CUR_NODE, true);
  var pages = Math.ceil(rows.length / TG_SIZE) || 1;
  if (TG_PAGE > pages) TG_PAGE = pages; if (TG_PAGE < 1) TG_PAGE = 1;
  var slice = rows.slice((TG_PAGE - 1) * TG_SIZE, TG_PAGE * TG_SIZE);
  var body = document.getElementById('tgBody'); if (!body) return;
  var nodeLabel = TG_CUR_NODE === '_general' ? '通用标签' : (typeof getCategoryName === 'function' ? getCategoryName(TG_CUR_NODE) : '');
  body.innerHTML = slice.map(function (t, i) {
    var ref = msTagRefNum(t.tagId);
    var isGen = !t.displayClassId;
    var typeCell = isGen ? msTagBadge('通用标签', 'info') : msTagBadge(tgEsc((typeof getCategoryName === 'function' ? getCategoryName(t.displayClassId) : t.displayClassId)), 'blue');
    var statusCell = t.status === '0' ? msTagBadge('启用', 'ok') : msTagBadge('停用', 'err');
    /* 摊位视角：通用标签全店共享，只读（打标可用，维护仅门店级及以上） */
    var op = (TG_VIEW.persona === 'booth' && isGen)
      ? '<span style="font-size:11px;color:#c0c4cc" title="通用标签全店共享，由门店统一维护；摊位账号打标时仍可选用">—（门店维护）</span>'
      : '<button class="ic-op-link" onclick="tgOpen(\'edit\',\'' + t.tagId + '\')">编辑</button>' +
        (t.status === '0'
          ? '<button class="ic-op-link" style="color:#e6a23c" onclick="tgToggle(\'' + t.tagId + '\',\'1\')">停用</button>'
          : '<button class="ic-op-link" style="color:#67c23a" onclick="tgToggle(\'' + t.tagId + '\',\'0\')">启用</button>') +
        '<button class="ic-op-link" style="color:#f56c6c" onclick="tgDel(\'' + t.tagId + '\')">删除</button>';
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + ((TG_PAGE - 1) * TG_SIZE + i + 1) + '</td>' +
      '<td style="font-weight:500">' + tgEsc(t.tagName) + (t.status === '1' ? ' <span style="font-size:11px;color:#c0c4cc">（已停用）</span>' : '') + '</td>' +
      '<td>' + typeCell + '</td>' +
      '<td>' + t.sort + '</td>' +
      '<td>' + (ref > 0 ? '<span style="color:#005CF5;font-weight:500">' + ref + '</span>' : '<span style="color:#c0c4cc">0</span>') + '</td>' +
      '<td>' + statusCell + '</td>' +
      '<td>' + op + '</td>' +
      '</tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#909399;padding:40px">' +
    (TG_VIEW.persona === 'booth' && TG_CUR_NODE === '_general'
      ? '通用标签由门店统一维护，摊位账号只读'
      : '当前节点暂无标签' + (TG_CUR_NODE !== '_general' ? '（新增时类型将自动带上「' + tgEsc(nodeLabel) + '」）' : '')) +
    '</td></tr>';
  tgPager(rows.length);
}
function tgPager(total) {
  var bar = document.getElementById('tgPager'); if (!bar) return;
  var pages = Math.ceil(total / TG_SIZE) || 1;
  var page = TG_PAGE;
  var html = '<span class="page-info">共 ' + total + ' 条</span><div class="page-btns">';
  html += '<button class="page-btn" onclick="tgRender(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
  for (var p = 1; p <= pages; p++) html += '<button class="page-btn" style="' + (p === page ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="tgRender(' + p + ')">' + p + '</button>';
  html += '<button class="page-btn" onclick="tgRender(' + (page + 1) + ')" ' + (page >= pages ? 'disabled' : '') + '>›</button></div>';
  bar.innerHTML = html;
}

/* 新增/编辑弹窗：编辑时类型不可改 */
function tgOpen(mode, id) {
  msTagLoad();
  var isEdit = mode === 'edit';
  var t = isEdit ? msTagById(id) : null;
  if (isEdit && !t) return;
  TG_DRAFT = t ? JSON.parse(JSON.stringify(t)) : {
    tagId: msTagNextId(), tagName: '', displayClassId: TG_CUR_NODE === '_general' ? '' : TG_CUR_NODE,
    sort: (msTagNodeTags(TG_CUR_NODE === '_general' ? '' : TG_CUR_NODE, true).length + 1), status: '0', createdAt: ''
  };
  var cats = (typeof getVisibleCategories === 'function') ? getVisibleCategories() : [];
  var vb = tgViewBooth();
  var vbClasses = tgViewClasses(vb);
  /* 摊位视角：分类下拉只出经营范围内分类（新增默认当前节点 / 第一个范围内分类） */
  var optCats = vb ? cats.filter(function (c) { return vbClasses.indexOf(c.id) >= 0; }) : cats;
  var catOpts = '<option value="">请选择一级分类</option>' + optCats.map(function (c) {
    return '<option value="' + c.id + '"' + (TG_DRAFT.displayClassId === c.id ? ' selected' : '') + '>' + tgEsc(c.name) + '</option>';
  }).join('');
  if (!isEdit && vb && !TG_DRAFT.displayClassId) {
    TG_DRAFT.displayClassId = (vbClasses.indexOf(TG_CUR_NODE) >= 0 ? TG_CUR_NODE : (vbClasses[0] || ''));
  }
  var typeBlock;
  if (isEdit) {
    var typeText = !TG_DRAFT.displayClassId ? '通用标签' : ('分类标签 · ' + (typeof getCategoryName === 'function' ? getCategoryName(TG_DRAFT.displayClassId) : TG_DRAFT.displayClassId));
    typeBlock = '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">类型</div>' +
      '<input class="ic-input" value="' + tgEsc(typeText) + '" readonly title="类型创建后不可修改">' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:4px">类型创建后不可修改</div></div>';
  } else if (vb) {
    /* 摊位账号：只能新增分类标签（挂本摊位经营范围内分类），不能建通用标签 */
    typeBlock = '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">类型</div>' +
      '<input class="ic-input" value="分类标签" readonly>' +
      '<div id="tgClassWrap" style="margin-top:8px"><select class="ic-input" id="tgClassSel" onchange="tgDraftClass(this.value)">' + catOpts + '</select></div>' +
      '<div style="font-size:11px;color:#e6a23c;margin-top:4px">摊位账号只能新增本摊位经营范围内分类的分类标签；通用标签全店共享，由门店统一维护</div></div>';
  } else {
    var isGen = !TG_DRAFT.displayClassId;
    typeBlock = '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">类型 <span style="color:#fc4b52">*</span></div>' +
      '<div style="display:flex;gap:18px;font-size:12px;color:#0b1019">' +
        '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="tgType" value="general"' + (isGen ? ' checked' : '') + ' onchange="tgOnTypeChange()" style="accent-color:#005CF5"> 通用标签</label>' +
        '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="tgType" value="class"' + (!isGen ? ' checked' : '') + ' onchange="tgOnTypeChange()" style="accent-color:#005CF5"> 分类标签</label>' +
      '</div>' +
      '<div id="tgClassWrap" style="margin-top:8px;display:' + (isGen ? 'none' : 'block') + '"><select class="ic-input" id="tgClassSel" onchange="tgDraftClass(this.value)">' + catOpts + '</select></div>' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:4px">分类标签挂在唯一一级分类下，是该分类内部的结构细分</div></div>';
  }
  var h = '<div style="font-size:12px;color:#0b1019">' +
    '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">标签名称 <span style="color:#fc4b52">*</span></div>' +
      '<input class="ic-input" id="tgNameInput" maxlength="20" placeholder="不超过 20 字；同节点内唯一" value="' + tgEsc(TG_DRAFT.tagName) + '" oninput="TG_DRAFT.tagName=this.value"></div>' +
    typeBlock +
    '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">排序号 <span style="color:#fc4b52">*</span></div>' +
      '<input type="number" min="1" step="1" class="ic-input" style="width:120px" value="' + (TG_DRAFT.sort || 1) + '" oninput="TG_DRAFT.sort=parseInt(this.value)||1">' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:4px">正整数，影响打标下拉与筛选条顺序；同号按创建时间</div></div>' +
    '<div><div style="color:#5b6472;margin-bottom:6px">状态</div>' +
      '<label style="display:inline-flex;align-items:center;gap:10px;cursor:pointer">' +
        '<span id="tgStatusSwitch" data-on="' + (TG_DRAFT.status === '0' ? '1' : '0') + '" onclick="tgToggleStatusSwitch()" style="position:relative;width:42px;height:22px;border-radius:11px;background:' + (TG_DRAFT.status === '0' ? '#005CF5' : '#c0c4cc') + ';transition:background .2s;flex-shrink:0">' +
          '<span style="position:absolute;top:2px;' + (TG_DRAFT.status === '0' ? 'left:22px' : 'left:2px') + ';width:18px;height:18px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .2s"></span>' +
        '</span>' +
        '<span id="tgStatusText" style="font-size:12px;color:#5b6472">' + (TG_DRAFT.status === '0' ? '启用' : '停用') + '</span>' +
      '</label>' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:4px">停用后不出现在打标下拉与筛选条，已打标商品的标签保留显示</div></div>' +
    '</div>';
  tgDlg({ title: isEdit ? '编辑标签 · ' + t.tagId : '新增标签', width: '560px', body: h, okText: '保存', onOk: 'tgSave(\'' + (isEdit ? id : 'new') + '\')' });
}
function tgOnTypeChange() {
  var v = (document.querySelector('input[name="tgType"]:checked') || {}).value || 'general';
  TG_DRAFT.displayClassId = v === 'general' ? '' : (TG_DRAFT.displayClassId || (TG_CUR_NODE === '_general' ? '' : TG_CUR_NODE));
  var wrap = document.getElementById('tgClassWrap');
  if (wrap) wrap.style.display = v === 'general' ? 'none' : 'block';
  if (v === 'general') TG_DRAFT.displayClassId = '';
}
function tgDraftClass(v) { TG_DRAFT.displayClassId = v || ''; }
function tgToggleStatusSwitch() {
  var el = document.getElementById('tgStatusSwitch'); if (!el) return;
  var on = el.getAttribute('data-on') !== '0'; on = !on;
  el.setAttribute('data-on', on ? '1' : '0');
  el.style.background = on ? '#005CF5' : '#c0c4cc';
  var knob = el.querySelector('span'); if (knob) knob.style.left = on ? '22px' : '2px';
  var txt = document.getElementById('tgStatusText'); if (txt) txt.textContent = on ? '启用' : '停用';
}
function tgSave(mode) {
  var d = TG_DRAFT;
  var name = (document.getElementById('tgNameInput') || {}).value || '';
  d.tagName = name.trim();
  if (mode !== 'new') {
    /* 编辑：类型不可改，回读开关 */
    d.status = document.getElementById('tgStatusSwitch').getAttribute('data-on') === '1' ? '0' : '1';
  } else {
    var sw = document.getElementById('tgStatusSwitch');
    d.status = sw && sw.getAttribute('data-on') === '0' ? '1' : '0';
    if (d.displayClassId && typeof GOODS_CATEGORIES !== 'undefined') {
      var cat = GOODS_CATEGORIES.filter(function (c) { return c.id === d.displayClassId; })[0];
      if (!cat) { msTagToast('请选择一级分类'); return; }
    }
  }
  if (!d.tagName) { msTagToast('请输入标签名称'); return; }
  if (d.tagName.length > 20) { msTagToast('标签名称不超过 20 字'); return; }
  if (!d.sort || d.sort < 1) { msTagToast('排序号须为正整数'); return; }
  if (mode === 'new' && !d.displayClassId && (document.querySelector('input[name="tgType"]:checked') || {}).value === 'class') { msTagToast('请选择一级分类'); return; }
  /* 视角授权兜底（对应服务端权限校验）：摊位账号不能建/改通用标签，分类标签只能挂经营范围内分类 */
  var vb = tgViewBooth();
  if (vb) {
    if (!d.displayClassId) { msTagToast('摊位账号不能维护通用标签'); return; }
    if (tgViewClasses(vb).indexOf(d.displayClassId) < 0) { msTagToast('分类超出本摊位经营范围'); return; }
  }
  if (msTagNameExists(d.tagName, d.displayClassId, mode === 'new' ? null : mode)) { msTagToast('同节点下已存在同名标签'); return; }
  if (mode === 'new') {
    d.createdAt = (function () { var n = new Date(); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2) + ' ' + ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); })();
    GOODS_TAGS.push(JSON.parse(JSON.stringify(d)));
    msTagToast('新增成功');
  } else {
    var t = msTagById(mode); if (!t) return;
    var idx = GOODS_TAGS.indexOf(t);
    GOODS_TAGS[idx] = JSON.parse(JSON.stringify(d));
    msTagToast('保存成功');
  }
  msTagPersist(); tgClose(); tgRender();
}
function tgToggle(id, to) {
  var t = msTagById(id); if (!t) return;
  var vb = tgViewBooth();
  if (vb && (!t.displayClassId || tgViewClasses(vb).indexOf(t.displayClassId) < 0)) { msTagToast('无权限修改该标签'); return; }
  t.status = to; msTagPersist(); tgRender();
  msTagToast(to === '0' ? '已启用' : '已停用（已打标商品的标签保留显示）');
}
function tgDel(id) {
  var t = msTagById(id); if (!t) return;
  var vb = tgViewBooth();
  if (vb && (!t.displayClassId || tgViewClasses(vb).indexOf(t.displayClassId) < 0)) { msTagToast('无权限删除该标签'); return; }
  var ref = msTagRefNum(id);
  if (ref > 0) {
    tgConfirm('删除确认', '标签「<b>' + tgEsc(t.tagName) + '</b>」下有 <b style="color:#f56c6c">' + ref + '</b> 个商品，删除后这些商品将变为<b>未打标</b>。确认删除吗？', 'tgDelDo(\'' + id + '\')');
  } else {
    tgConfirm('删除确认', '确认删除标签「<b>' + tgEsc(t.tagName) + '</b>」吗？', 'tgDelDo(\'' + id + '\')');
  }
}
function tgDelDo(id) {
  var t = msTagById(id); if (!t) return;
  /* 解绑：已打标商品变为未打标 */
  if (typeof GL_MOCK_DATA !== 'undefined' && GL_MOCK_DATA) {
    GL_MOCK_DATA.forEach(function (r) { if (r.tagId === id) r.tagId = ''; });
    if (typeof glPersistGoods === 'function') { try { glPersistGoods(); } catch (e) {} }
  }
  GOODS_TAGS = GOODS_TAGS.filter(function (x) { return x.tagId !== id; });
  msTagPersist(); tgClose(); tgRender();
  msTagToast('已删除');
}

/* ================================================================
 * 摊位管理（v2.0.1）
 * 定位：摊位**不是用户层级**——用户体系仍为「平台-集团」两级，角色等级为「平台-企业-门店」，
 *      都不下探到摊位。摊位是「门店下的经营范围单元」，用来给外包摊位（水产 / 水果等）收敛数据范围：
 *      绑定一级分类 → 该摊位只能查看 / 修改这些分类下的商品。
 * 标签：沿用现有标签体系（分类标签 + 通用标签），不为摊位新造标签；
 *      可选绑定标签子集，仅决定终端「按标签」导航列哪些，不影响可见范围。
 * 展示方式：**不在云端配置**（2026-11-09 定稿）——由设备终端本地切换，同步作用于终端的商品管理与销售界面。
 * 绑定账号：账号无「门店级」概念（用户等级仅 平台 / 企业），须绑定带门店级角色的账号才生效，
 *          否则只会是一条空配置（表格与页头提示未绑定摊位）。
 * 停用的绑定标签 / 停用账号 / 角色失效：配置页标黄提示、不自动删除。
 * ================================================================ */
var BOOTH_KEY = 'tcm_cashier_booth_v1';   /* 键保持不变：换键会丢本地演示数据 */
var BOOTHS = [];
var BT_READY = false;
var BT_PAGE = 1, BT_SIZE = 10;
var BT_DRAFT = null;

var BOOTH_SEED = [
  { boothId: 'B001', boothName: '蔬菜摊 A', shopName: '崧泽-青浦旗舰店', classIds: ['c1'], tagIds: ['T1001'], accountIds: ['U102'], status: '0' },
  { boothId: 'B002', boothName: '蔬菜摊 B', shopName: '崧泽-青浦旗舰店', classIds: ['c1'], tagIds: ['T1002', 'T1003'], accountIds: ['U103'], status: '0' },
  { boothId: 'B003', boothName: '水果摊', shopName: '崧泽-青浦旗舰店', classIds: ['c2'], tagIds: [], accountIds: ['U104'], status: '0' },
  { boothId: 'B004', boothName: '肉禽蛋摊', shopName: '崧泽-青浦旗舰店', classIds: ['c3'], tagIds: [], accountIds: [], status: '1' },
  { boothId: 'B005', boothName: '水产摊', shopName: '崧泽-青浦旗舰店', classIds: ['c4'], tagIds: ['T4001'], accountIds: ['U202'], status: '0' }
];
/* 旧数据兼容：v1 单分类 classId → classIds；展示方式已移到终端本地，云端字段直接丢弃 */
function msBtMigrate(b) {
  if (!b) return b;
  if (!b.classIds) b.classIds = b.classId ? [b.classId] : [];
  if (b.classId) delete b.classId;
  if (b.displayMode) delete b.displayMode;
  if (!b.tagIds) b.tagIds = [];
  if (!b.accountIds) b.accountIds = [];
  return b;
}
function msBtLoad() {
  if (BT_READY) return;
  try {
    var r = localStorage.getItem(BOOTH_KEY);
    if (r) {
      BOOTHS = JSON.parse(r).map(msBtMigrate);
      /* 老演示数据回填：早期版本没有 accountIds，按 boothId 用种子里的绑定账号补上，
         否则升级后所有摊位都变成「未绑定」而终端直接不可用（只补空的，不覆盖用户已选） */
      BOOTHS.forEach(function (b) {
        if ((b.accountIds || []).length) return;
        for (var i = 0; i < BOOTH_SEED.length; i++) {
          if (BOOTH_SEED[i].boothId === b.boothId) { b.accountIds = BOOTH_SEED[i].accountIds.slice(); break; }
        }
      });
      msBtPersist();
      BT_READY = true; return;
    }
  } catch (e) {}
  BOOTHS = JSON.parse(JSON.stringify(BOOTH_SEED));
  msBtPersist();
  BT_READY = true;
}
function msBtPersist() { try { localStorage.setItem(BOOTH_KEY, JSON.stringify(BOOTHS)); } catch (e) {} }
function msBtById(id) { msBtLoad(); for (var i = 0; i < BOOTHS.length; i++) if (BOOTHS[i].boothId === id) return BOOTHS[i]; return null; }
function msBtNextId() { msBtLoad(); var max = 0; BOOTHS.forEach(function (b) { var n = parseInt((b.boothId || '').replace('B', ''), 10); if (n > max) max = n; }); return 'B' + ('000' + (max + 1)).slice(-3); }
/* ===== 绑定账号（摊位生效的前提）=====
   账号本身没有「门店级」：用户等级只有 平台(0) / 企业(1)（SY_USER_TYPES）；
   「门店级」是角色等级（SY_ROLES.level=2，如门店店长 / 门店收银员 / 门店店员）。
   ⇒ 判断能否绑定摊位 = 账号 roleIds 中至少有一个「启用且等级=门店」的角色。
   账号 status 只决定生效与否：禁用仍列在候选里并标黄，不自动解绑。
   账号 shopIds 必须覆盖摊位当前所选门店（2026-11-09 定稿）：门店下拉来自商品主档 STORE_DATA，
   账号 shopIds 来自系统管理 st-xxx，两套 id 不互通 → 按门店名称对齐（简称先换 shopName 全称）。
   候选先按门店过滤，切换门店自动移除不匹配绑定，保存前再硬校验一次，跨门店账号不落库。
   绑定后该账号登录终端，可见商品收敛到本摊位范围。未绑定 = 摊位不生效。
   角色域未加载的页面降级为原 level=1 口径，避免误杀。 */
function msBtShopRoleIds() {
  try { if (typeof syRoleLoad === 'function') syRoleLoad(); } catch (e) {}
  if (typeof SY_ROLES === 'undefined' || !SY_ROLES || !SY_ROLES.length) return null;
  var ids = SY_ROLES.filter(function (r) {
    return String(r.level) === '2' && (r.status == null || String(r.status) === '0');
  }).map(function (r) { return r.roleId; });
  return ids.length ? ids : null;
}
function msBtHasShopRole(u) {
  var ids = msBtShopRoleIds();
  if (!ids) return String(u.level) === '1';   /* 降级：角色数据不可用 */
  var own = u.roleIds || [];
  return ids.some(function (rid) { return own.indexOf(rid) >= 0; });
}
/* 候选项展示用：只列出命中的门店级角色名，便于看出「凭什么可绑」 */
function msBtShopRoleNames(u) {
  var ids = msBtShopRoleIds();
  if (!ids) return '';
  return (u.roleIds || []).filter(function (rid) { return ids.indexOf(rid) >= 0; })
    .map(function (rid) {
      var r = SY_ROLES.filter(function (x) { return x.roleId === rid; })[0];
      return r ? r.roleName : rid;
    }).join('、');
}
function msBtUserAll() {
  try { if (typeof syUsrLoad === 'function') syUsrLoad(); } catch (e) {}
  if (typeof SY_USERS === 'undefined' || !SY_USERS) return [];
  return SY_USERS;
}
/* 摊位门店名 → 系统管理门店 id：两套主档 id 不互通，按名称对齐。
   下拉存的是 shopShortName（如「唐镇店」），先补上 STORE_DATA 的 shopName 全称
   （如「正育生鲜中心菜场唐镇」），再与系统管理门店名比对。 */
function msBtShopNames(shopName) {
  var names = [];
  if (!shopName) return names;
  var key = String(shopName).trim();
  names.push(key);
  try {
    if (typeof STORE_DATA !== 'undefined' && STORE_DATA) {
      STORE_DATA.forEach(function (s) {
        var shortN = String(s.shopShortName || '').trim(), fullN = String(s.shopName || '').trim();
        if (shortN !== key && fullN !== key) return;
        if (fullN && names.indexOf(fullN) < 0) names.push(fullN);
        if (shortN && names.indexOf(shortN) < 0) names.push(shortN);
      });
    }
  } catch (e) {}
  return names;
}
function msBtShopStoreIds(shopName) {
  var names = msBtShopNames(shopName), ids = [];
  try {
    if (typeof msSyEnts !== 'function') return ids;
    msSyEnts().forEach(function (e) {
      (e.stores || []).forEach(function (s) {
        var n = String(s.name || '').trim();
        if (!n) return;
        var hit = names.some(function (x) { return x && (n === x || n.indexOf(x) >= 0 || x.indexOf(n) >= 0); });
        if (hit && ids.indexOf(s.id) < 0) ids.push(s.id);
      });
    });
  } catch (e) {}
  return ids;
}
/* 账号能否绑定当前门店：shopIds 含 ALL = 全部门店；否则至少一个 id 落在映射出的门店集合里。
   名称对不上任何系统管理门店时只放行 ALL 账号，避免候选全空。 */
function msBtAccShopOk(u, shopName) {
  if (!shopName) return false;
  var ids = u.shopIds || [];
  if (ids.indexOf('ALL') >= 0) return true;
  var own = msBtShopStoreIds(shopName);
  return own.length ? ids.some(function (id) { return own.indexOf(id) >= 0; }) : false;
}
function msBtUserCands(shopName) {
  return msBtUserAll().filter(function (u) {
    return msBtHasShopRole(u) && (!shopName || msBtAccShopOk(u, shopName));
  });
}
/* 反查已绑定账号走全量表：角色被改动也不至于显示成「未知账号」，由 msBtBadAccounts 标黄 */
function msBtUserById(id) {
  var arr = msBtUserAll();
  for (var i = 0; i < arr.length; i++) if (arr[i].userId === id) return arr[i];
  return null;
}
function msBtAccNames(b) { return (b.accountIds || []).map(function (id) { var u = msBtUserById(id); return u ? u.userName : '未知账号'; }); }
function msBtUnbound(b) { return !(b.accountIds || []).length; }
/* 绑定了但账号已禁用 / 不存在 / 已不带门店级角色的（标黄提示） */
function msBtBadAccounts(b) {
  return (b.accountIds || []).filter(function (id) {
    var u = msBtUserById(id);
    return !u || String(u.status) !== '0' || !msBtHasShopRole(u);
  });
}
/* 摊位门店匹配：摊位存的是门店展示名（全称），商品行存的是简称，两者需容错匹配 */
function msBtShopMatch(b, r) {
  if (!b.shopName || !r.shopName) return true;
  if (r.shopName === b.shopName) return true;
  if (r.storeId && typeof glStoreIdByName === 'function') {
    var sid = glStoreIdByName(b.shopName);
    if (sid && sid === r.storeId) return true;
  }
  return r.shopName.indexOf(b.shopName) >= 0 || b.shopName.indexOf(r.shopName) >= 0;
}
/* 摊位可见范围内的商品（分类范围 [+ 门店]）；tagId 传 '' 计未打标，null 计全部 */
function msBtGoodsIn(b, tagId) {
  if (typeof GL_MOCK_DATA === 'undefined' || !GL_MOCK_DATA) return [];
  var ids = b.classIds || [];
  return GL_MOCK_DATA.filter(function (r) {
    if (ids.indexOf(r.categoryId) === -1) return false;
    if (!msBtShopMatch(b, r)) return false;
    if (tagId === null) return true;
    if (tagId === '') return !r.tagId;
    return r.tagId === tagId;
  });
}
function btEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* ===== 列表筛选：企业 → 门店 级联（页内状态，不跨页传值）=====
   数据源与「企业管理 / 门店管理」同源：GROUP_DATA(companyId) + STORE_DATA(shopName/companyId)。
   摊位只存门店展示名（历史数据全称、新增存简称，两者混用），故按名称反查门店主档取 companyId；
   门店下拉与「新增摊位」弹窗同源（glShopDisplayName），匹配复用 msBtShopMatch 做全称/简称容错。 */
var BT_FILTER_COMPANY = 'all', BT_FILTER_SHOP = 'all';
function btCompanyOptions() {
  var h = '<option value="all">全部企业</option>';
  try {
    if (typeof GROUP_DATA !== 'undefined') GROUP_DATA.forEach(function (g) {
      h += '<option value="' + btEsc(g.companyId) + '"' + (BT_FILTER_COMPANY === g.companyId ? ' selected' : '') + '>' + btEsc(g.companyName) + '</option>';
    });
  } catch (e) {}
  return h;
}
function btShopOptions(companyId) {
  var h = '<option value="all">全部门店</option>';
  try {
    if (typeof STORE_DATA !== 'undefined') STORE_DATA.forEach(function (s) {
      if (companyId && companyId !== 'all' && String(s.companyId) !== String(companyId)) return;
      var nm = (typeof glShopDisplayName === 'function' ? glShopDisplayName(s) : s.shopName) || s.shopName;
      h += '<option value="' + btEsc(nm) + '"' + (BT_FILTER_SHOP === nm ? ' selected' : '') + '>' + btEsc(nm) + '</option>';
    });
  } catch (e) {}
  return h;
}
/* 摊位 → 企业：按门店展示名反查门店主档，再取 companyId（找不到企业的摊位在按企业筛选时不显示） */
function btBoothCompanyId(b) {
  var sid = (typeof glStoreIdByName === 'function') ? glStoreIdByName(b.shopName) : '';
  if (!sid) return '';
  try {
    if (typeof STORE_DATA !== 'undefined') {
      for (var i = 0; i < STORE_DATA.length; i++) if (STORE_DATA[i].shopId === sid) return String(STORE_DATA[i].companyId || '');
    }
  } catch (e) {}
  return '';
}
function btFilterRows() {
  return BOOTHS.filter(function (b) {
    if (BT_FILTER_COMPANY !== 'all' && btBoothCompanyId(b) !== BT_FILTER_COMPANY) return false;
    if (BT_FILTER_SHOP !== 'all' && !msBtShopMatch(b, { shopName: BT_FILTER_SHOP })) return false;
    return true;
  });
}
function btFilterCompanyChange(v) {
  BT_FILTER_COMPANY = v || 'all';
  BT_FILTER_SHOP = 'all';           /* 切企业清门店，避免跨企业残留 */
  BT_PAGE = 1;
  var sel = document.getElementById('btFilterShop');
  if (sel) sel.innerHTML = btShopOptions(BT_FILTER_COMPANY);
  btRender();
}
function btFilterReset() {
  BT_FILTER_COMPANY = 'all'; BT_FILTER_SHOP = 'all'; BT_PAGE = 1;
  var c = document.getElementById('btFilterCompany'); if (c) c.value = 'all';
  var s = document.getElementById('btFilterShop'); if (s) s.innerHTML = btShopOptions('all');
  btRender();
}

function initBoothPage() {
  msTagLoad(); msBtLoad();
  var el = document.getElementById('boothManageContent');
  if (!el) { setTimeout(initBoothPage, 80); return; }
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden">' +
      '<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;padding:10px 20px;flex-wrap:wrap">' +
        '<span style="font-size:12px;color:#8a93a3">企业</span>' +
        '<select class="ic-input" style="width:169px" id="btFilterCompany" onchange="btFilterCompanyChange(this.value)">' + btCompanyOptions() + '</select>' +
        '<span style="font-size:12px;color:#8a93a3">门店</span>' +
        '<select class="ic-input" style="width:169px" id="btFilterShop" onchange="BT_FILTER_SHOP=this.value;BT_PAGE=1;btRender()">' + btShopOptions(BT_FILTER_COMPANY) + '</select>' +
        '<button class="ic-btn" onclick="btFilterReset()">重置</button>' +
        '<span style="flex:1"></span>' +
        '<button class="ic-btn ic-btn-pri" onclick="btOpen(\'new\')">＋ 新增摊位</button>' +
      '</div>' +
      '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
        '<div id="btWarn" style="flex-shrink:0"></div>' +
        '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
          '<table style="min-width:1220px">' +
            '<thead><tr>' +
              '<th style="width:52px">序号</th><th style="width:130px">摊位名称</th>' +
              '<th style="width:210px" title="多值用「A / B / C」斜杠平铺；异常值加 ⚠ 标记；悬浮看全部">经营范围（一级分类）</th>' +
              '<th style="width:180px" title="分类标签 / 通用标签分开设置：分类标签不选 = 默认全部；通用标签须勾选才可使用。列表按两类各一行显示策略摘要（全部 / 子集 + 前 2 个标签 + 余量徽标），停用标签 ⚠ 优先；完整值在编辑弹框">可用标签</th>' +
              '<th style="width:190px" title="多值用「A / B / C」斜杠平铺；异常值加 ⚠ 标记；悬浮看全部">绑定账号</th>' +
              '<th style="width:96px">范围内商品</th><th style="width:80px">状态</th><th style="width:150px">所属门店</th><th style="width:210px">操作</th>' +
            '</tr></thead>' +
            '<tbody id="btBody"></tbody>' +
          '</table>' +
        '</div>' +
        '<div class="pagination-bar" id="btPager" style="flex-shrink:0"></div>' +
      '</div>' +
      tgDevNote('btDevNoteBox', '摊位管理 v2.0.1',
        '<b>定位与生效</b>：摊位 = 门店下的经营范围单元，不新增用户层级或角色（用户体系「平台-集团」、角色「平台-企业-门店」均不下探）；账号本身只有平台 / 企业两级，须绑定<b>带门店级角色（角色等级=门店）</b>的账号才生效；<b>账号门店范围必须覆盖当前所选门店</b>（「全部门店」账号通用），商品主档与系统管理两套门店 id 不互通，按门店名称对齐，候选先按门店过滤、切换门店自动剔除错配账号、保存再硬校验一次。账号禁用或角色失效加 ⚠ 标记、不自动解绑。<br>' +
        '<b>数据范围</b>：可绑多个一级分类，绑定后只能查看 / 修改这些分类商品；标签沿用现有体系，仅决定终端「按标签」导航列哪些、<b>不影响可见范围</b>；展示形式由终端本地切换、不在此配置，且同时作用于商品管理与销售。<br>' +
        '<b>可用标签分开设置</b>：分类标签与通用标签分开勾选（共用 tagIds 一个数组，按 displayClassId 区分类型）——<b>分类标签不选 = 默认可用本摊范围全部</b>，勾选才收敛为子集；<b>通用标签必须显式勾选才可使用</b>，不选则终端不列出（通用标签全店共享，默认放开会让各摊位串数据）。两者都不改变商品可见范围。<br>' +
        '<b>分工与边界</b>：外包摊位（水产、水果等）自维护本摊商品与标签，未设摊位的分类由门店统一维护；本版仅摊位配置与后台展示，终端收敛范围与商品增改的完整链路见「销售系统终端」页。<br>' +
        '<b>列表实现口径</b>：多值按「A / B / C」斜杠平铺（A、B、C 是具体的值，不是显示档位），异常值加 ⚠ 标记、悬浮看全部，行高固定 42px；<b>「可用标签」列改为策略摘要</b>——真实数据下一个摊位的可用标签可达几十上百个（分类标签不勾 = 默认本摊范围全部），列表不枚举全部值，改为分类 / 通用各一行：未勾显示「全部（默认）+ 实际标签数」或「未选用」，已勾显示前 2 个标签名 + 「+N」余量徽标，停用标签 ⚠ 优先前置，完整值在编辑弹框（候选同序、分类名作浅色括号后缀，标签名在前，多分类摊位可区分同名标签）；筛选按企业 → 门店级联，摊位门店名全称 / 简称混用需反查 STORE_DATA 容错匹配。<br>' +
        '<span style="color:#8a93a3">口径出处：《商品标签功能需求说明》§5.4 / §5.6。</span>') +
    '</div>';
  btRender();
}
/* 多值单元格显示（v2.0.1）：A / B / C 指的是「具体的值」用斜杠平铺，不是三种显示类型。
   例：水产 / 冷冻 / 蔬果、张三 / 李四 / 王五。单行不换行，超长省略，悬浮 title 看全部。
   异常值（账号禁用、标签停用）在该值上加 ⚠ 特殊标记并标橙，详情进 title。
   容器固定 22px、单元格固定 42px，行高不随值的数量变化。
   界面提示见表格下方一行与表头 title，改这里请一并改那两处。
   注意：产品/设计口径（定位、数据范围、授权规则等）以《商品标签功能需求说明》为准；
   页面上如需展示，必须走 tgDevNote() 的「DEV NOTE 设计说明」块（面向开发者、与产品 UI 隔离），
   不得混进给用户的「备注说明」长文块。 */
/* 多分类摊位下，同名分类标签无法分辨归属 → 分类标签一律带所属一级分类名。
   标签名是主信息放前面，分类名作浅色括号后缀：弹窗候选「叶菜（蔬菜）」、
   列表列「分类·叶菜（蔬菜）」，共用这里，口径单一。
   标签被删 / 分类被删时按 id / 原分类 id 回显，不丢已选值。 */
function btTagCatName(t) {
  if (!t || !t.displayClassId) return '';
  return typeof getCategoryName === 'function' ? getCategoryName(t.displayClassId) : t.displayClassId;
}
function btTagCellText(t, id) {
  var name = t ? t.tagName : id;
  if (t && t.displayClassId) {
    var cn = btTagCatName(t);
    return '分类·' + name + (cn ? '（' + cn + '）' : '');
  }
  return '通用·' + name;
}
function btValueLine(vals) {
  if (!vals || !vals.length) return '';
  var html = vals.map(function (v, i) {
    var t = btEsc(v.text);
    if (v.abnormal) t = '<span style="color:#e6a23c" title="' + btEsc(v.tip || '异常') + '">⚠ ' + t + '</span>';
    return (i ? '<span style="color:#c8cfda;margin:0 5px">/</span>' : '') + t;
  }).join('');
  var full = vals.map(function (v) { return v.text + (v.abnormal ? ' ⚠' + (v.tip || '') : ''); }).join(' / ');
  return '<div style="height:22px;line-height:22px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + btEsc(full) + '">' + html + '</div>';
}
/* 可用标签列（2026-11-09）：真实数据下一个摊位的可用标签可能几十上百个
   （分类标签不勾 = 默认本摊范围全部），列表列只回答「用了什么策略 / 涉及多少标签」，
   不枚举全部值（完整值在编辑弹框，且已按分类 / 通用分组、带所属分类名）。
   两类各一行、固定两行高，行高仍 42px：每行「前 2 个值 + 余量徽标」，
   停用 / 已删的异常值优先前置，避免被省略号淹没；悬浮 title 给出分组全量文本。 */
function btTagSummary(b) {
  var catSel = [], genSel = [];
  (b.tagIds || []).forEach(function (id) {
    var t = msTagById(id), cn = t ? btTagCatName(t) : '';
    var name = t ? t.tagName : id;
    var v = {
      name: name,
      /* 分类标签仍带所属一级分类名，主信息（标签名）在前，与弹窗候选同序 */
      short: name + (cn ? '（' + cn + '）' : ''),
      abnormal: !t || t.status === '1', tip: '标签已停用或已被删除'
    };
    (t && t.displayClassId ? catSel : genSel).push(v);
  });
  /* 分类标签未勾 = 默认全部：数量取本摊经营范围下的实际分类标签集合，与弹框候选同源 */
  var seen = {}, allCatNum = 0;
  (b.classIds || []).forEach(function (cid) {
    msTagCatTags(cid, false).forEach(function (t) { if (!seen[t.tagId]) { seen[t.tagId] = 1; allCatNum++; } });
  });
  function chip(text, kind) {
    var st = kind === 'blue' ? 'background:#eef4ff;color:#005cf5;border:1px solid #dbe7ff'
      : 'background:#f4f5f7;color:#8a93a3;border:1px solid #e9edf3';
    return '<span style="display:inline-block;padding:0 6px;border-radius:9px;font-size:11px;line-height:15px;white-space:nowrap;' + st + '">' + btEsc(text) + '</span>';
  }
  function line(label, vals, emptyText, countText) {
    /* 异常值排前，保证 ⚠ 不被截断；只显示前 2 个，其余折成 +N */
    var sorted = vals.slice().sort(function (x, y) { return (y.abnormal ? 1 : 0) - (x.abnormal ? 1 : 0); });
    var shown = sorted.slice(0, 2), rest = sorted.length - shown.length;
    var txt = shown.map(function (v) {
      return (v.abnormal ? '<span style="color:#e6a23c" title="' + btEsc(v.tip) + '">⚠ </span>' : '') +
        btEsc(v.short);
    }).join('<span style="color:#c8cfda;margin:0 4px">/</span>');
    return '<div style="height:16px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      '<span style="color:#8a93a3;font-size:11px;margin-right:5px">' + label + '</span>' +
      (vals.length ? txt : '<span style="color:#a8b0bd;font-size:11px">' + emptyText + '</span>') +
      (countText ? ' ' + chip(countText, 'blue') : '') +
      (rest > 0 ? ' ' + chip('+' + rest, 'blue') : '') + '</div>';
  }
  var catLine = catSel.length
    ? line('分类', catSel, '', '')
    : line('分类', [], '全部（默认）', allCatNum + ' 个');
  var genLine = genSel.length
    ? line('通用', genSel, '', '')
    : line('通用', [], '未选用', '');
  var full = '分类标签：' + (catSel.length
      ? catSel.length + ' 个 · ' + catSel.map(function (v) { return v.short + (v.abnormal ? '（⚠ 停用）' : ''); }).join('、')
      : '默认全部（' + allCatNum + ' 个）') +
    '　／　通用标签：' + (genSel.length
      ? genSel.length + ' 个 · ' + genSel.map(function (v) { return v.name + (v.abnormal ? '（⚠ 停用）' : ''); }).join('、')
      : '未选用');
  return '<div title="' + btEsc(full) + '">' + catLine + genLine + '</div>';
}
/* 行内单元格统一行高：内容不换行、不堆叠，多账号/多分类都不改变 42px 行高 */
var BT_TD = 'height:42px;padding:8px 12px;vertical-align:middle;white-space:nowrap;overflow:hidden';

function btRender(page) {
  if (page) BT_PAGE = page;
  msBtLoad();
  var rows = btFilterRows();
  var pages = Math.ceil(rows.length / BT_SIZE) || 1;
  if (BT_PAGE > pages) BT_PAGE = pages; if (BT_PAGE < 1) BT_PAGE = 1;
  var slice = rows.slice((BT_PAGE - 1) * BT_SIZE, BT_PAGE * BT_SIZE);
  var body = document.getElementById('btBody'); if (!body) return;
  /* 未绑定账号的摊位不生效 → 表格上方统一提示（跟随当前筛选范围，避免提示别的门店） */
  var unbound = rows.filter(function (b) { return b.status === '0' && msBtUnbound(b); });
  var warn = document.getElementById('btWarn');
  if (warn) {
    warn.innerHTML = unbound.length
      ? '<div style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fdf6ec;border-bottom:1px solid #faecd8;font-size:12px;color:#b88230">' +
          '<span>⚠</span><span>有 <b>' + unbound.length + '</b> 个摊位未绑定账号，暂不生效：' +
          unbound.map(function (x) { return btEsc(x.boothName); }).join('、') +
          '</span><span style="flex:1"></span><span style="color:#c8a15a">请编辑摊位补上绑定账号</span></div>'
      : '';
  }
  body.innerHTML = slice.map(function (b, i) {
    /* 可用标签列走摘要（真实数据下标签可达几十上百个，不在列表里枚举） */
    var tagCell = btTagSummary(b);
    var accCell;
    if (!(b.accountIds || []).length) {
      accCell = '<span style="color:#e6a23c" title="⚠ 未绑定带门店级角色的账号，该摊位不生效">⚠ 未绑定</span>';
    } else {
      var accVals = [];
      b.accountIds.forEach(function (id) {
        var u = msBtUserById(id);
        accVals.push({ text: u ? u.userName : '未知账号', abnormal: !u || String(u.status) !== '0', tip: '账号已禁用或不存在，需重新绑定' });
      });
      accCell = btValueLine(accVals);
    }
    var catVals = [];
    (b.classIds || []).forEach(function (cid) {
      catVals.push({ text: typeof getCategoryName === 'function' ? getCategoryName(cid) : cid });
    });
    var catCell = catVals.length ? btValueLine(catVals) : '<span style="color:#c0c4cc">未设置</span>';
    var scopeNum = msBtGoodsIn(b, null).length;
    var op =
      '<button class="ic-op-link" onclick="btOpen(\'edit\',\'' + b.boothId + '\')">编辑</button>' +
      (b.status === '0'
        ? '<button class="ic-op-link" style="color:#e6a23c" onclick="btToggle(\'' + b.boothId + '\',\'1\')">停用</button>'
        : '<button class="ic-op-link" style="color:#67c23a" onclick="btToggle(\'' + b.boothId + '\',\'0\')">启用</button>') +
      '<button class="ic-op-link" style="color:#f56c6c" onclick="btDel(\'' + b.boothId + '\')">删除</button>';
    return '<tr>' +
      '<td style="' + BT_TD + ';text-align:center;color:#999">' + ((BT_PAGE - 1) * BT_SIZE + i + 1) + '</td>' +
      '<td style="' + BT_TD + ';font-weight:500">' + btEsc(b.boothName) + '</td>' +
      '<td style="' + BT_TD + '">' + catCell + '</td>' +
      '<td style="' + BT_TD + ';padding:4px 12px">' + tagCell + '</td>' +
      '<td style="' + BT_TD + '">' + accCell + '</td>' +
      '<td style="' + BT_TD + '">' + scopeNum + '</td>' +
      '<td style="' + BT_TD + '">' + (b.status === '0' ? msTagBadge('启用', 'ok') : msTagBadge('停用', 'err')) + '</td>' +
      '<td style="' + BT_TD + '">' + btEsc(b.shopName || '-') + '</td>' +
      '<td style="' + BT_TD + '">' + op + '</td>' +
      '</tr>';
  }).join('') || '<tr><td colspan="9" style="text-align:center;color:#909399;padding:40px">当前筛选条件下暂无摊位</td></tr>';
  btPager(rows.length);
}
function btPager(total) {
  var bar = document.getElementById('btPager'); if (!bar) return;
  var pages = Math.ceil(total / BT_SIZE) || 1, page = BT_PAGE;
  var html = '<span class="page-info">共 ' + total + ' 条</span><div class="page-btns">';
  html += '<button class="page-btn" onclick="btRender(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
  for (var p = 1; p <= pages; p++) html += '<button class="page-btn" style="' + (p === page ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="btRender(' + p + ')">' + p + '</button>';
  html += '<button class="page-btn" onclick="btRender(' + (page + 1) + ')" ' + (page >= pages ? 'disabled' : '') + '>›</button></div>';
  bar.innerHTML = html;
}

function btOpen(mode, id) {
  msTagLoad(); msBtLoad();
  var isEdit = mode === 'edit';
  var b = isEdit ? msBtById(id) : null;
  if (isEdit && !b) return;
  BT_DRAFT = b ? JSON.parse(JSON.stringify(b)) : {
    /* 当前按门店筛选时，新增摊位预选该门店，保存后仍在可见范围内 */
    boothId: msBtNextId(), boothName: '', shopName: BT_FILTER_SHOP === 'all' ? '' : BT_FILTER_SHOP,
    classIds: [], tagIds: [], accountIds: [], status: '0'
  };
  if (!BT_DRAFT.classIds) BT_DRAFT.classIds = [];
  /* 老数据摊位存门店全称，下拉值是 shopShortName → 打开时规范到下拉口径，
     保证门店回显与账号门店过滤用的是同一个值（记忆：摊位全称 / 商品行简称混用） */
  if (BT_DRAFT.shopName) {
    try {
      if (typeof STORE_DATA !== 'undefined' && STORE_DATA) {
        var curShop = BT_DRAFT.shopName;
        for (var si = 0; si < STORE_DATA.length; si++) {
          var sd = STORE_DATA[si];
          if (sd.shopName === curShop || sd.shopShortName === curShop) {
            if (typeof glShopDisplayName === 'function') BT_DRAFT.shopName = glShopDisplayName(sd);
            break;
          }
        }
      }
    } catch (e) {}
  }
  /* 历史数据 / 门店变更后残留的跨门店绑定：编辑时先按当前门店剔除，避免保存被硬校验卡住 */
  if (BT_DRAFT.shopName) {
    BT_DRAFT.accountIds = (BT_DRAFT.accountIds || []).filter(function (id) {
      var u = msBtUserById(id);
      return !!u && msBtAccShopOk(u, BT_DRAFT.shopName);
    });
  }
  var shops = (typeof glShopListData === 'function') ? glShopListData() : [];
  var shopOpts = '<option value="">请选择门店</option>' + shops.map(function (s) {
    return '<option value="' + btEsc(s.value) + '"' + (BT_DRAFT.shopName === s.value ? ' selected' : '') + '>' + btEsc(s.label) + '</option>';
  }).join('');
  var h = '<div style="font-size:12px;color:#0b1019">' +
    /* 摊位名称 / 所属门店并列一行；窄屏（弹框 min(720px,92vw)）自动换行，输入框不被压扁 */
    '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px">' +
      '<div style="flex:1 1 240px;min-width:0"><div style="color:#5b6472;margin-bottom:6px">摊位名称 <span style="color:#fc4b52">*</span></div>' +
        '<input class="ic-input" id="btNameInput" maxlength="20" placeholder="如 水产摊" value="' + btEsc(BT_DRAFT.boothName) + '" oninput="BT_DRAFT.boothName=this.value"></div>' +
      '<div style="flex:1 1 240px;min-width:0"><div style="color:#5b6472;margin-bottom:6px">所属门店 <span style="color:#fc4b52">*</span></div>' +
        '<select class="ic-input" onchange="btDraftShop(this)">' + shopOpts + '</select></div>' +
    '</div>' +
    /* 三个候选框都按内容自适应（max-height），不给单个框硬撑高度留大片空白。
       勾选 / 取消经营范围会重算「可用标签」候选，跳动改由整框固定高度（tgDlg height）兜住：
       弹框尺寸与位置恒定，候选增减只在框内消化。 */
    '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">经营范围（一级分类，可多选）<span style="color:#fc4b52"> *</span></div>' +
      '<div id="btClassBox" style="border:1px solid #e4e9f2;border-radius:4px;padding:8px 10px;max-height:132px;overflow:auto"></div>' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:4px">摊位只能查看/修改所选分类下的商品（数据范围）；取消某分类会移除该分类下的已绑标签，通用标签保留</div></div>' +
    '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">可用标签（分类标签 / 通用标签分开设置）</div>' +
      '<div id="btTagBox" style="border:1px solid #e4e9f2;border-radius:4px;padding:8px 10px;max-height:180px;overflow:auto"></div>' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:4px">分类标签不选 = 默认可用本摊范围全部；通用标签须勾选才可使用，不选则不列出。只影响终端「按标签」导航，不改变可见范围</div></div>' +
    '<div><div style="color:#5b6472;margin-bottom:6px">绑定账号（须带门店级角色，必选）<span style="color:#fc4b52"> *</span></div>' +
      '<div id="btAccBox" style="border:1px solid #e4e9f2;border-radius:4px;padding:0;min-height:96px;max-height:150px;overflow:auto"></div>' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:4px">账号须带门店级角色，且门店范围包含当前所选门店（「全部门店」账号通用）；未关联该门店的账号不列出，切换门店会自动移除不匹配的已绑账号，禁用 / 角色失效的账号标黄。绑定后该账号登录终端只见本摊位范围商品。<b style="color:#e6a23c">未绑定账号的摊位不生效</b></div></div>' +
    '<div style="font-size:11px;color:#8a93a3;line-height:1.7;margin-top:12px;padding-top:10px;border-top:1px dashed #eef1f6">展示形式（按分类 / 按标签）不在云端配置，由销售系统终端本地切换，同时作用于终端的商品管理与销售界面。</div>' +
    '</div>';
  tgDlg({ title: isEdit ? '编辑摊位 · ' + b.boothId : '新增摊位', width: '720px', height: 'min(720px,88vh)', body: h, okText: '保存', onOk: 'btSave(\'' + (isEdit ? id : 'new') + '\')' });
  btRenderClassBox();
  btRenderTagBox();
  btRenderAccBox();
}
/* 绑定账号候选：带门店级角色 + 门店范围包含当前所选门店。
   一行一条、整行不换行（账号 / 角色 / 门店信息多，chips 自动换行会显得很乱），超长只省略。 */
function btRenderAccBox() {
  var box = document.getElementById('btAccBox'); if (!box) return;
  var d = BT_DRAFT;
  if (!d.shopName) {
    box.innerHTML = '<div style="min-height:96px;display:flex;align-items:center;justify-content:center;padding:8px;color:#a8b0bd;font-size:12px;text-align:center">请先选择所属门店，账号按门店范围过滤</div>';
    return;
  }
  var cand = msBtUserCands(d.shopName);
  /* 已绑定但角色 / 状态已失效的账号也列出并标黄；跨门店账号已被过滤，不再显示 */
  (d.accountIds || []).forEach(function (id) {
    if (!cand.some(function (u) { return u.userId === id; })) {
      var old = msBtUserById(id);
      if (old && msBtAccShopOk(old, d.shopName)) cand.push(old);
    }
  });
  if (!cand.length) {
    box.innerHTML = '<div style="min-height:96px;display:flex;align-items:center;justify-content:center;padding:8px;color:#a8b0bd;font-size:12px;text-align:center">' +
      (msBtShopRoleIds() ? '当前门店暂无可绑定账号，请在「用户管理」为账号分配门店级角色并关联该门店' : '未取到用户数据，请检查「用户管理」') + '</div>';
    return;
  }
  cand = cand.slice().sort(function (a, b) { return (String(a.status) === '0' ? 0 : 1) - (String(b.status) === '0' ? 0 : 1); });
  box.innerHTML = cand.map(function (u) {
    var checked = (d.accountIds || []).indexOf(u.userId) !== -1;
    var isDis = String(u.status) !== '0';
    var roleLost = !msBtHasShopRole(u), bad = isDis || roleLost;
    var shopTxt = '', roleTxt = msBtShopRoleNames(u);
    try { shopTxt = typeof syUsrShopsText === 'function' ? syUsrShopsText(u).replace(/<[^>]+>/g, '') : ''; } catch (e) {}
    var detail = btEsc(u.userAccount) + (roleTxt ? ' · ' + btEsc(roleTxt) : '') +
      (shopTxt && shopTxt !== '—' ? ' · ' + btEsc(shopTxt) : '');
    var note = isDis ? '已禁用' : (roleLost ? '无门店级角色' : '');
    var tip = roleLost ? '该账号已不带门店级角色，需重新分配角色或改绑' : (isDis ? '该账号已禁用' : detail);
    return '<label style="display:flex;align-items:center;gap:8px;min-height:32px;padding:5px 8px;border-bottom:1px solid #f2f4f8;font-size:12px;cursor:pointer;white-space:nowrap;color:#0b1019;' +
      (bad ? 'background:#fdf6ec;' : '') + '" title="' + btEsc(tip) + '">' +
      '<input type="checkbox" value="' + u.userId + '"' + (checked ? ' checked' : '') + ' onchange="btDraftAcc(this)" style="flex:none;cursor:pointer;accent-color:#005CF5">' +
      '<span style="flex:none;font-weight:500">' + btEsc(u.userName) + '</span>' +
      '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:#8a93a3">' + detail + '</span>' +
      (note ? '<span style="flex:none;color:#e6a23c">⚠ ' + note + '</span>' : '') + '</label>';
  }).join('');
}
/* 切换所属门店：候选按新门店重算，已绑但不属于新门店的账号一并移除（否则保存会被拦） */
function btDraftShop(sel) {
  BT_DRAFT.shopName = sel.value;
  var before = (BT_DRAFT.accountIds || []).length;
  BT_DRAFT.accountIds = (BT_DRAFT.accountIds || []).filter(function (id) {
    var u = msBtUserById(id);
    return !!u && msBtAccShopOk(u, sel.value);
  });
  var removed = before - BT_DRAFT.accountIds.length;
  btRenderAccBox();
  if (removed) msTagToast('已移除 ' + removed + ' 个不属于该门店的账号');
}
function btDraftAcc(cb) {
  var arr = BT_DRAFT.accountIds || (BT_DRAFT.accountIds = []);
  var i = arr.indexOf(cb.value);
  if (cb.checked && i === -1) arr.push(cb.value);
  if (!cb.checked && i !== -1) arr.splice(i, 1);
}
/* 经营范围：一级分类多选（数据范围） */
function btRenderClassBox() {
  var box = document.getElementById('btClassBox'); if (!box) return;
  var cats = (typeof getVisibleCategories === 'function') ? getVisibleCategories() : [];
  box.innerHTML = cats.map(function (c) {
    var checked = (BT_DRAFT.classIds || []).indexOf(c.id) !== -1;
    return '<label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 8px;margin:2px;border-radius:3px;cursor:pointer;background:#f7f9fc;border:1px solid #e9eef7;color:#0b1019">' +
      '<input type="checkbox" value="' + c.id + '"' + (checked ? ' checked' : '') + ' onchange="btDraftClass(this)" style="cursor:pointer;accent-color:#005CF5">' +
      btEsc(c.name) + '</label>';
  }).join('') || '<div style="padding:8px;color:#a8b0bd;font-size:12px">暂无可用分类</div>';
}
function btDraftClass(cb) {
  var arr = BT_DRAFT.classIds || (BT_DRAFT.classIds = []);
  var i = arr.indexOf(cb.value);
  if (cb.checked && i === -1) arr.push(cb.value);
  if (!cb.checked && i !== -1) arr.splice(i, 1);
  /* 取消某分类后，该分类的分类标签不再适用 → 从绑定里剔除；通用标签保留 */
  var keepCatTags = {};
  arr.forEach(function (cid) { msTagCatTags(cid, false).forEach(function (t) { keepCatTags[t.tagId] = 1; }); });
  BT_DRAFT.tagIds = (BT_DRAFT.tagIds || []).filter(function (id) {
    var t = msTagById(id);
    return !t || !t.displayClassId || keepCatTags[id];
  });
  btRenderTagBox();
}
/* 可用标签候选（v2.0.1）：分类标签 / 通用标签分开设置，共用 tagIds 一个数组、按标签类型区分语义：
     分类标签：一个都没勾 = 默认可用本摊范围全部；勾了 = 只出勾中的子集；
     通用标签：只有显式勾选的才可使用，不勾 = 不列出。
   两类都只影响终端「按标签」导航，不改变可见范围。停用但已选用仍展示（标黄保留勾选）。 */
function btRenderTagBox() {
  var box = document.getElementById('btTagBox'); if (!box) return;
  var d = BT_DRAFT;
  var noClass = !(d.classIds || []).length;
  /* 重绘 innerHTML 会把框内滚动位置清零，勾选/取消分类时先存后还，内容不跳回顶部 */
  var keepTop = box.scrollTop;
  function put(html) { box.innerHTML = html; box.scrollTop = keepTop; }
  var cat = [], gen = [], seen = {};
  /* 未选经营范围：分类标签组留占位，通用标签组照常可勾，不让整框塌成一句提示 */
  if (!noClass) {
    (d.classIds || []).forEach(function (cid) {
      msTagCatTags(cid, false).forEach(function (t) { if (!seen[t.tagId]) { seen[t.tagId] = 1; cat.push(t); } });
    });
  }
  msTagGeneralTags(false).forEach(function (t) { if (!seen[t.tagId]) { seen[t.tagId] = 1; gen.push(t); } });
  (d.tagIds || []).forEach(function (id) {
    var t = msTagById(id);
    if (t && t.status === '1' && !seen[id]) { seen[id] = 1; (t.displayClassId ? cat : gen).push(t); }
  });
  function item(t) {
    var checked = (d.tagIds || []).indexOf(t.tagId) !== -1;
    var isDis = t.status === '1';
    var st = 'display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 8px;margin:2px;border-radius:3px;cursor:pointer;color:#0b1019;' +
      (isDis ? 'background:#fdf6ec;color:#e6a23c;border:1px solid #faecd8' : '');
    /* 标签名在前（主信息），所属一级分类名作浅色括号后缀，多分类摊位可区分同名标签 */
    var cn = btTagCatName(t);
    var label = btEsc(t.tagName) +
      (cn ? '<span style="color:' + (isDis ? '#c8a15a' : '#8a93a3') + '">（' + btEsc(cn) + '）</span>' : '');
    return '<label style="' + st + '"' + (isDis ? ' title="该标签已停用，按标签视图不再列出"' : '') + '>' +
      '<input type="checkbox" value="' + t.tagId + '"' + (checked ? ' checked' : '') + ' onchange="btDraftTag(this)" style="cursor:pointer;accent-color:#005CF5">' +
      label + (isDis ? '（停用）' : '') + '</label>';
  }
  function sec(label, tip, list, placeholder) {
    return '<div style="font-size:11px;color:#5b6472;margin:2px 0 4px"><b style="font-weight:600">' + label + '</b> <span style="color:#a8b0bd">' + tip + '</span></div>' +
      (list.length ? list.map(item).join('') : (placeholder || '<div style="font-size:11px;color:#a8b0bd;padding:2px 8px">暂无可用标签</div>'));
  }
  var catPlaceholder = noClass
    ? '<div style="font-size:11px;color:#8a93a3;line-height:1.7;padding:8px 10px;margin:2px 0;background:#fafbfc;border:1px dashed #e4e9f2;border-radius:3px">请先选择上方「经营范围」分类，分类标签会按所选分类列出；通用标签可在下方直接勾选</div>'
    : '';
  put(sec('分类标签', '（不选 = 默认全部；括号内为所属分类）', cat, catPlaceholder) +
    '<div style="border-top:1px dashed #eef1f6;margin:8px 0 6px"></div>' +
    sec('通用标签', '（勾选后才可使用，不选 = 不列出）', gen));
}
function btDraftTag(cb) {
  var arr = BT_DRAFT.tagIds || (BT_DRAFT.tagIds = []);
  var i = arr.indexOf(cb.value);
  if (cb.checked && i === -1) arr.push(cb.value);
  if (!cb.checked && i !== -1) arr.splice(i, 1);
}
function btSave(mode) {
  var d = BT_DRAFT;
  d.boothName = ((document.getElementById('btNameInput') || {}).value || '').trim();
  if (!d.boothName) { msTagToast('请输入摊位名称'); return; }
  if (!d.shopName) { msTagToast('请选择所属门店'); return; }
  if (!(d.classIds || []).length) { msTagToast('请选择经营范围分类'); return; }
  if (!(d.accountIds || []).length) { msTagToast('请绑定至少一个关联当前门店、且带门店级角色的账号，否则摊位不生效'); return; }
  /* 门店范围硬校验：跨门店账号授权无效，不落库；正常路径下切换门店已自动剔除，这里只兜底 */
  var badShop = (d.accountIds || []).filter(function (id) {
    var u = msBtUserById(id);
    return !u || !msBtAccShopOk(u, d.shopName);
  });
  if (badShop.length) { msTagToast('存在 ' + badShop.length + ' 个未关联「' + d.shopName + '」的账号，请重新选择'); btRenderAccBox(); return; }
  if (mode === 'new') { BOOTHS.unshift(JSON.parse(JSON.stringify(d))); msTagToast('新增成功'); }
  else { var b = msBtById(mode); if (!b) return; var idx = BOOTHS.indexOf(b); BOOTHS[idx] = JSON.parse(JSON.stringify(d)); msTagToast('保存成功'); }
  msBtPersist(); tgClose(); btRender();
}
function btToggle(id, to) {
  var b = msBtById(id); if (!b) return;
  b.status = to; msBtPersist(); btRender(); msTagToast(to === '0' ? '已启用' : '已停用');
}
function btDel(id) {
  var b = msBtById(id); if (!b) return;
  tgConfirm('删除确认', '确认删除摊位「<b>' + btEsc(b.boothName) + '</b>」吗？<div style="font-size:12px;color:#8a93a3;margin-top:6px">删除后该摊位的数据范围不再生效，其商品由门店统一维护。</div>', 'btDelDo(\'' + id + '\')');
}
function btDelDo(id) {
  BOOTHS = BOOTHS.filter(function (b) { return b.boothId !== id; });
  msBtPersist(); tgClose(); btRender(); msTagToast('已删除');
}
