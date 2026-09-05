// ========== 系统权限域（用户管理/角色管理/功能菜单） ==========
// 页面：user-list / role-list / function-tree
// 依赖 layout.js：showToast / initTicker / ENTERPRISES(企业门店数据源)
var MS_SYSTEM_LOADED = true;
function msSyEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function msSyToast(m) { try { showToast(m); } catch (e) { alert(m); } }
function msSyBadge(text, kind) {
  var map = {
    ok: 'background:#f0f9eb;color:#67c23a;border:1px solid #e1f3d8',
    warn: 'background:#fdf6ec;color:#e6a23c;border:1px solid #faecd8',
    err: 'background:#fef0f0;color:#f56c6c;border:1px solid #fde2e2',
    info: 'background:#f4f4f5;color:#909399;border:1px solid #e9e9eb',
    blue: 'background:#ecf5ff;color:#409eff;border:1px solid #d9ecff'
  };
  return '<span style="display:inline-block;padding:1px 10px;border-radius:10px;font-size:12px;line-height:18px;white-space:nowrap;' + (map[kind] || map.info) + '">' + text + '</span>';
}
/* 弹窗（单层） */
function msSyDlg(opt) {
  var b = document.getElementById('msSyBackdrop'), m = document.getElementById('msSyModal');
  if (b) b.remove(); if (m) m.remove();
  var bd = document.createElement('div'); bd.className = 'ic-modal-backdrop'; bd.id = 'msSyBackdrop';
  bd.onclick = function (e) { if (e.target === this) { bd.remove(); md.remove(); } };
  var md = document.createElement('div'); md.className = 'ic-modal'; md.id = 'msSyModal';
  md.style.cssText = 'width:' + (opt.width || 'min(720px,94vw)') + ';';
  var foot = '';
  if (opt.footer !== false) {
    foot = '<div class="ic-modal-footer">' + (opt.footLeft || '');
    if (opt.cancelText !== null) foot += '<button class="btn-secondary" onclick="var b=document.getElementById(\'msSyBackdrop\'),m=document.getElementById(\'msSyModal\');if(b)b.remove();if(m)m.remove();">' + (opt.cancelText || '取消') + '</button>';
    if (opt.onOk) foot += '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>';
    foot += '</div>';
  }
  md.innerHTML = '<div class="ic-modal-header"><span>' + opt.title + '</span><button class="ic-modal-close" onclick="var b=document.getElementById(\'msSyBackdrop\'),m=document.getElementById(\'msSyModal\');if(b)b.remove();if(m)m.remove();">✕</button></div>'
    + '<div class="ic-modal-body" id="msSyBody" style="' + (opt.bodyStyle || 'max-height:70vh;overflow:auto;') + '">' + opt.body + '</div>' + foot;
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msSyBody(html) { var b = document.getElementById('msSyBody'); if (b) b.innerHTML = html; }
function msSyClose() { var b = document.getElementById('msSyBackdrop'), m = document.getElementById('msSyModal'); if (b) b.remove(); if (m) m.remove(); }
/* 二级弹层（叠在主弹窗上 / 独立下拉选择） */
function msSyPop(opt) {
  var b = document.getElementById('msSyPopBackdrop'), m = document.getElementById('msSyPop');
  if (b) b.remove(); if (m) m.remove();
  var bd = document.createElement('div'); bd.id = 'msSyPopBackdrop';
  bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9400;';
  bd.onclick = function (e) { if (e.target === this) { bd.remove(); md.remove(); } };
  var md = document.createElement('div'); md.id = 'msSyPop';
  md.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:' + (opt.width || 'min(640px,90vw)') + ';max-height:80vh;display:flex;flex-direction:column;background:#fff;border-radius:6px;box-shadow:0 12px 48px rgba(0,0,0,.22);z-index:9401;';
  md.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #eef1f6;font-size:14px;font-weight:600;color:#0b1019;flex-shrink:0"><span>' + opt.title + '</span><button onclick="var b=document.getElementById(\'msSyPopBackdrop\'),m=document.getElementById(\'msSyPop\');if(b)b.remove();if(m)m.remove();" style="border:none;background:none;font-size:16px;color:#909399;cursor:pointer">✕</button></div>'
    + '<div style="flex:1;overflow:auto;min-height:0" id="msSyPopBody">' + opt.body + '</div>'
    + (opt.footer === false ? '' : '<div style="display:flex;justify-content:flex-end;gap:10px;padding:12px 18px;border-top:1px solid #eef1f6;flex-shrink:0">' + (opt.footLeft || '') + '<button class="btn-secondary" onclick="var b=document.getElementById(\'msSyPopBackdrop\'),m=document.getElementById(\'msSyPop\');if(b)b.remove();if(m)m.remove();">' + (opt.cancelText || '取消') + '</button>' + (opt.onOk ? '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>' : '') + '</div>');
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msSyPopClose() { var b = document.getElementById('msSyPopBackdrop'), m = document.getElementById('msSyPop'); if (b) b.remove(); if (m) m.remove(); }
function msSyPager(total, page, size, pagerId, cbName) {
  var bar = document.getElementById(pagerId); if (!bar) return;
  var pages = Math.ceil(total / size) || 1;
  if (page > pages) page = pages; if (page < 1) page = 1;
  var html = '<span class="page-info">共 ' + total + ' 条</span><div class="page-btns">';
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
  var s = Math.max(1, page - 2), e = Math.min(pages, page + 2);
  for (var p = s; p <= e; p++) html += '<button class="page-btn' + (p === page ? ' active' : '') + '" style="' + (p === page ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="' + cbName + '(' + p + ')">' + p + '</button>';
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page + 1) + ')" ' + (page >= pages ? 'disabled' : '') + '>›</button></div>';
  bar.innerHTML = html;
}
function msSyNum(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
/* 企业/门店数据源：优先 layout.js 的 ENTERPRISES，缺失时回落内置同构数据 */
var SY_ENT_FB = [
  { id: 'ent-001', name: '好滋味餐饮', stores: [ { id: 'st-001', name: '崧泽大道中心店' }, { id: 'st-002', name: '华新镇农贸店' }, { id: 'st-003', name: '重固镇菜场店' }, { id: 'st-004', name: '徐泾东社区店' } ] },
  { id: 'ent-002', name: '鲜百味生鲜', stores: [ { id: 'st-005', name: '泗泾大润发店' }, { id: 'st-006', name: '九亭农贸店' }, { id: 'st-007', name: '新桥镇中心店' } ] },
  { id: 'ent-003', name: '绿康源供应链', stores: [ { id: 'st-008', name: '安亭老街店' }, { id: 'st-009', name: '南翔印象城店' } ] },
  { id: 'ent-004', name: '上海正鲜优生鲜超市有限公司', stores: [ { id: 'st-010', name: '正育生鲜中心菜场唐镇' }, { id: 'st-011', name: '正育生鲜中心菜市场' }, { id: 'st-012', name: '正育生鲜中心菜场五莲路店' } ] }
];
function msSyEnts() { try { if (typeof ENTERPRISES !== 'undefined' && ENTERPRISES && ENTERPRISES.length) return ENTERPRISES; } catch (e) {} return SY_ENT_FB; }
function msSyEntName(id) { var e = msSyEnts().filter(function (x) { return x.id === id; })[0]; return e ? e.name : ''; }
function msSyEntOptions(sel) {
  var h = '<option value="">全部企业</option>';
  h += msSyEnts().map(function (e) { return '<option value="' + e.id + '"' + (sel === e.id ? ' selected' : '') + '>' + msSyEsc(e.name) + '</option>'; }).join('');
  return h;
}
function msSyStoresOfEnt(entId) { var e = msSyEnts().filter(function (x) { return x.id === entId; })[0]; return e ? e.stores : []; }
function msSyStoreName(id) {
  var all = [];
  msSyEnts().forEach(function (e) { all = all.concat(e.stores); });
  var s = all.filter(function (x) { return x.id === id; })[0];
  return s ? s.name : '';
}
function msSyTagsChips(tags) {
  if (!tags || !tags.length) return '<span style="color:#c0c4cc">—</span>';
  return tags.map(function (t) { return '<span style="display:inline-block;padding:0 8px;line-height:18px;border-radius:9px;background:#f4f4f5;color:#606266;font-size:12px;margin-right:4px">' + msSyEsc(t) + '</span>'; }).join('');
}
/* 通用多选弹层 */
function msSyPick(opt) {
  SY_PICK_CFG = opt;
  var items = opt.items || [];
  msSyPop({
    title: opt.title || '请选择', width: opt.width || 'min(520px,90vw)', cancelText: '取消',
    onOk: 'msSyPickOk()', okText: '确定',
    body: '<div style="padding:6px 2px">' +
      (opt.searchable ? '<input class="ic-search" style="width:100%;margin-bottom:10px" placeholder="' + (opt.searchPh || '搜索…') + '" oninput="msSyPickFilter(this.value)" id="msSyPickKw">' : '') +
      '<div id="msSyPickList" style="max-height:300px;overflow:auto">' + msSyPickRows('') + '</div></div>'
  });
}
var SY_PICK_CFG = null;
var SY_PICK_SEL = {};
function msSyPickRows(kw) {
  var opt = SY_PICK_CFG; if (!opt) return '';
  var all = opt._all || opt.items || [];
  kw = (kw || '').toLowerCase();
  var list = kw ? all.filter(function (it) { return (it.l + ' ' + (it.sub || '')).toLowerCase().indexOf(kw) >= 0; }) : all;
  if (!list.length) return '<div style="text-align:center;color:#c0c4cc;padding:30px">无匹配项</div>';
  return list.map(function (it) {
    var on = !!SY_PICK_SEL[it.v];
    var dis = it.dis ? ' disabled' : '';
    return '<label style="display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:4px;cursor:pointer' + (dis ? ';opacity:.5' : '') + '">' +
      '<input type="checkbox" style="width:14px;height:14px" ' + (on ? 'checked' : '') + dis + ' onchange="msSyPickToggle(\'' + it.v + '\',this.checked)">' +
      '<span style="flex:1;color:#303133">' + msSyEsc(it.l) + '</span>' +
      (it.sub ? '<span style="color:#909399;font-size:12px">' + msSyEsc(it.sub) + '</span>' : '') + '</label>';
  }).join('');
}
function msSyPickFilter(kw) { var b = document.getElementById('msSyPickList'); if (b) b.innerHTML = msSyPickRows(kw); }
function msSyPickToggle(v, on) { SY_PICK_SEL[v] = !!on; }
function msSyPickOk() {
  var opt = SY_PICK_CFG; if (!opt) return;
  var vals = opt.items.filter(function (it) { return SY_PICK_SEL[it.v]; }).map(function (it) { return it.v; });
  msSyPopClose();
  if (opt.onOk) opt.onOk(vals);
}

/* ================================================================
 * 公共常量：用户等级 / 角色等级 / 状态（对齐 Vue baseConfig）
 * ================================================================ */
var SY_USER_TYPES = [ { value: 0, label: '平台' }, { value: 1, label: '企业' } ];
var SY_LEVEL_TYPES = [ { value: 0, label: '平台' }, { value: 1, label: '企业' }, { value: 2, label: '门店' } ];
var SY_STATUS_OPTS = [ { value: 0, label: '启用' }, { value: 1, label: '禁用' } ];

/* ================================================================
 * 1) 用户管理 user-list
 * ================================================================ */
var SY_USER_KEY = 'tcm_sys_users_v1';
var SY_USERS = [];
var USR_PAGE = 1, USR_SIZE = 10, USR_KW = '', USR_CID = '';
var SY_USR_DRAFT = null;
var SY_USER_SEED = [
  { userId: 'U001', userName: '系统管理员', userAccount: 'admin', level: 0, companyId: '', roleIds: ['R001'], shopIds: [], tags: ['内置'], status: 0 },
  { userId: 'U002', userName: '平台运营', userAccount: '13800000002', level: 0, companyId: '', roleIds: ['R002'], shopIds: [], tags: ['运营'], status: 0 },
  { userId: 'U101', userName: '王店长', userAccount: '13810000001', level: 1, companyId: 'ent-001', roleIds: ['R101', 'R103'], shopIds: ['ALL'], tags: ['VIP'], status: 0 },
  { userId: 'U102', userName: '李收银', userAccount: '13810000002', level: 1, companyId: 'ent-001', roleIds: ['R102'], shopIds: ['st-001'], tags: ['收银'], status: 0 },
  { userId: 'U103', userName: '张阿姨', userAccount: '13810000003', level: 1, companyId: 'ent-001', roleIds: ['R102'], shopIds: ['st-002', 'st-003'], tags: [], status: 0 },
  { userId: 'U104', userName: '陈师傅', userAccount: '13810000004', level: 1, companyId: 'ent-001', roleIds: ['R102', 'R103'], shopIds: ['st-004'], tags: ['兼职'], status: 1 },
  { userId: 'U201', userName: '刘经理', userAccount: '13820000001', level: 1, companyId: 'ent-002', roleIds: ['R201'], shopIds: ['ALL'], tags: [], status: 0 },
  { userId: 'U202', userName: '赵店员', userAccount: '13820000002', level: 1, companyId: 'ent-002', roleIds: ['R202'], shopIds: ['st-005'], tags: [], status: 0 },
  { userId: 'U203', userName: '孙店员', userAccount: '13820000003', level: 1, companyId: 'ent-002', roleIds: ['R202'], shopIds: ['st-006', 'st-007'], tags: [], status: 0 },
  { userId: 'U301', userName: '周主管', userAccount: '13830000001', level: 1, companyId: 'ent-003', roleIds: ['R301'], shopIds: ['ALL'], tags: ['供应链'], status: 0 },
  { userId: 'U302', userName: '吴调度', userAccount: '13830000002', level: 1, companyId: 'ent-003', roleIds: ['R302'], shopIds: ['st-008'], tags: [], status: 0 },
  { userId: 'U401', userName: '郑店长', userAccount: '13840000001', level: 1, companyId: 'ent-004', roleIds: ['R401'], shopIds: ['ALL'], tags: ['VIP', '老店'], status: 0 },
  { userId: 'U402', userName: '冯店员', userAccount: '13840000002', level: 1, companyId: 'ent-004', roleIds: ['R402'], shopIds: ['st-010', 'st-011', 'st-012'], tags: [], status: 0 },
  { userId: 'U403', userName: '褚店员', userAccount: '13840000003', level: 1, companyId: 'ent-004', roleIds: ['R402'], shopIds: ['st-011'], tags: [], status: 1 }
];
function syUsrLoad() {
  try { var r = localStorage.getItem(SY_USER_KEY); if (r) { SY_USERS = JSON.parse(r); return; } } catch (e) {}
  SY_USERS = JSON.parse(JSON.stringify(SY_USER_SEED));
  try { localStorage.setItem(SY_USER_KEY, JSON.stringify(SY_USERS)); } catch (e) {}
}
function syUsrPersist() { try { localStorage.setItem(SY_USER_KEY, JSON.stringify(SY_USERS)); } catch (e) {} }
function syUsrLevelName(lv) { var t = SY_USER_TYPES.filter(function (x) { return x.value === lv; })[0]; return t ? t.label : '企业'; }
function syUsrShopsText(u) {
  if (u.level === 0) return '—';
  if (u.shopIds && u.shopIds[0] === 'ALL') return '<span style="color:#409eff">全部门店</span>';
  if (!u.shopIds || !u.shopIds.length) return '—';
  return u.shopIds.map(msSyStoreName).join('、');
}
function syUsrRoleNames(u) {
  if (!u.roleIds || !u.roleIds.length) return '—';
  return u.roleIds.map(function (rid) {
    var r = SY_ROLES.filter(function (x) { return x.roleId === rid; })[0];
    return r ? r.roleName : rid;
  }).join('、');
}
function syUsrInit() {
  syUsrLoad(); syRoleLoad();
  var el = document.getElementById('user-listContent');
  if (!el) { setTimeout(syUsrInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<select class="ic-input" style="width:200px" id="syUsrCid">' + msSyEntOptions(USR_CID) + '</select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="用户名/账号" value="' + msSyEsc(USR_KW) + '" onkeydown="if(event.key===\'Enter\')syUsrQuery()" id="syUsrKw">' +
      '<button class="ic-btn" onclick="syUsrReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="syUsrQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="syUsrOpen(\'new\',null)">＋ 新增用户</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1080px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:160px">用户名</th><th style="width:160px">账号</th><th style="width:100px">用户等级</th><th style="width:200px">所属企业</th>' +
            '<th style="width:220px">关联门店</th><th style="width:140px">角色授权</th><th style="width:140px">用户标签</th><th style="width:80px">状态</th><th style="width:180px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="syUsrBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="syUsrPager" style="flex-shrink:0"></div>' +
    '</div>';
  syUsrRender();
}
function syUsrRows() {
  var kw = USR_KW.toLowerCase();
  return SY_USERS.filter(function (u) {
    if (USR_CID && u.companyId !== USR_CID) return false;
    if (kw && u.userName.toLowerCase().indexOf(kw) < 0 && String(u.userAccount).toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
}
function syUsrQuery() { var k = document.getElementById('syUsrKw'); USR_KW = k ? k.value.trim() : ''; USR_PAGE = 1; syUsrRender(); }
function syUsrReset() { USR_KW = ''; USR_CID = ''; USR_PAGE = 1; syUsrInit(); }
function syUsrRender() {
  var cid = document.getElementById('syUsrCid'); if (cid) USR_CID = cid.value;
  var rows = syUsrRows();
  var pages = Math.ceil(rows.length / USR_SIZE) || 1;
  if (USR_PAGE > pages) USR_PAGE = pages;
  var slice = rows.slice((USR_PAGE - 1) * USR_SIZE, USR_PAGE * USR_SIZE);
  var body = document.getElementById('syUsrBody'); if (!body) return;
  body.innerHTML = slice.map(function (u, i) {
    var op = '';
    op += '<button class="ic-op-link" onclick="syUsrOpen(\'edit\',\'' + u.userId + '\')">编辑</button>';
    op += String(u.status) === '0'
      ? '<button class="ic-op-link" style="color:#f56c6c" onclick="syUsrToggle(\'' + u.userId + '\',1)">禁用</button>'
      : '<button class="ic-op-link" style="color:#67c23a" onclick="syUsrToggle(\'' + u.userId + '\',0)">启用</button>';
    if (u.userId !== 'U001') op += '<button class="ic-op-link" style="color:#909399" onclick="syUsrDel(\'' + u.userId + '\')">删除</button>';
    return '<tr>' +
      '<td>' + ((USR_PAGE - 1) * USR_SIZE + i + 1) + '</td>' +
      '<td><button class="ic-op-link" style="font-weight:600" onclick="syUsrOpen(\'edit\',\'' + u.userId + '\')">' + msSyEsc(u.userName) + '</button></td>' +
      '<td>' + msSyEsc(u.userAccount) + '</td>' +
      '<td>' + syUsrLevelName(u.level) + '</td>' +
      '<td>' + (u.companyId ? msSyEsc(msSyEntName(u.companyId)) : '—') + '</td>' +
      '<td>' + syUsrShopsText(u) + '</td>' +
      '<td style="color:#606266">' + msSyEsc(syUsrRoleNames(u)) + '</td>' +
      '<td>' + msSyTagsChips(u.tags) + '</td>' +
      '<td>' + (String(u.status) === '0' ? msSyBadge('启用', 'ok') : msSyBadge('禁用', 'err')) + '</td>' +
      '<td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msSyPager(rows.length, USR_PAGE, USR_SIZE, 'syUsrPager', 'syUsrGo');
}
function syUsrGo(p) { USR_PAGE = p; syUsrRender(); }
function syUsrOpen(mode, id) {
  var u = null;
  if (mode === 'edit') {
    u = SY_USERS.filter(function (x) { return x.userId === id; })[0];
    if (!u) return;
    u = JSON.parse(JSON.stringify(u));
  } else {
    u = { userId: '', userName: '', userAccount: '', level: 1, companyId: USR_CID || '', roleIds: [], shopIds: [], tags: [], status: 0 };
    if (!u.companyId && msSyEnts().length) u.companyId = msSyEnts()[0].id;
  }
  SY_USR_DRAFT = u;
  msSyDlg({
    title: mode === 'edit' ? '编辑用户' : '新增用户', width: '560px',
    okText: mode === 'edit' ? '保存' : '创建', onOk: "syUsrSave('" + mode + "')",
    body: syUsrFormHTML(mode)
  });
}
function syUsrFormHTML(mode) {
  var d = SY_USR_DRAFT; if (!d) return '';
  var entSel = '<option value="">请选择所属企业</option>' + msSyEnts().map(function (e) {
    return '<option value="' + e.id + '"' + (d.companyId === e.id ? ' selected' : '') + '>' + msSyEsc(e.name) + '</option>';
  }).join('');
  var lvDisabled = mode === 'edit' ? ' disabled' : '';
  var lvRadios = SY_USER_TYPES.map(function (t) {
    return '<label style="margin-right:16px;cursor:pointer"><input type="radio" name="syUsrLv" value="' + t.value + '"' + (String(d.level) === String(t.value) ? ' checked' : '') + lvDisabled + ' onchange="syUsrD(\'level\',parseInt(this.value))"> ' + t.label + '</label>';
  }).join('');
  var roleTxt = d.roleIds && d.roleIds.length ? syUsrRoleNames(d) : '<span style="color:#c0c4cc">未选择</span>';
  var shopTxt = d.shopIds && d.shopIds[0] === 'ALL' ? '全部门店' : (d.shopIds && d.shopIds.length ? d.shopIds.map(msSyStoreName).join('、') : '<span style="color:#c0c4cc">未选择</span>');
  var shopDisabled = String(d.level) === '0' ? ' disabled' : '';
  return '<div style="display:grid;grid-template-columns:88px 1fr;row-gap:14px;align-items:center;font-size:13px">' +
    '<div style="color:#5b6472">用户名 <span style="color:#fc4b52">*</span></div><div><input class="ic-input" style="width:100%" placeholder="请输入用户名" value="' + msSyEsc(d.userName) + '" oninput="syUsrD(\'userName\',this.value)"></div>' +
    '<div style="color:#5b6472">手机号/账号 <span style="color:#fc4b52">*</span></div><div><input class="ic-input" style="width:100%" placeholder="请务必填写有效的手机号码，必要时需进行短信验证" value="' + msSyEsc(d.userAccount) + '"' + (mode === 'edit' ? ' disabled' : '') + ' oninput="syUsrD(\'userAccount\',this.value)"></div>' +
    '<div style="color:#5b6472">密码</div><div><input class="ic-input" style="width:100%;background:#f5f7fa" value="123456" disabled></div>' +
    '<div style="color:#5b6472">用户等级</div><div>' + lvRadios + '</div>' +
    '<div style="color:#5b6472">所属企业</div><div><select class="ic-input" style="width:100%" onchange="syUsrD(\'companyId\',this.value)" id="syUsrCmp">' + entSel + '</select></div>' +
    '<div style="color:#5b6472">角色授权</div><div style="display:flex;align-items:center;gap:8px"><span style="flex:1;padding:4px 10px;border:1px solid #e0e3ea;border-radius:4px;background:#fafbfc;min-height:30px;box-sizing:border-box;display:flex;align-items:center;flex-wrap:wrap;gap:4px">' + roleTxt + '</span><button class="ic-btn" onclick="syUsrPickRoles()">选择</button></div>' +
    '<div style="color:#5b6472">授权门店</div><div style="display:flex;align-items:center;gap:8px"><span style="flex:1;padding:4px 10px;border:1px solid #e0e3ea;border-radius:4px;background:#fafbfc;min-height:30px;box-sizing:border-box;display:flex;align-items:center;flex-wrap:wrap;gap:4px">' + shopTxt + '</span><button class="ic-btn"' + shopDisabled + ' onclick="syUsrPickShops()">选择</button><label style="cursor:pointer;white-space:nowrap"' + shopDisabled + '><input type="checkbox" id="syUsrAllShop"' + (d.shopIds && d.shopIds[0] === 'ALL' ? ' checked' : '') + ' onchange="syUsrAllShops(this.checked)"> 全部门店</label></div>' +
    '<div style="color:#5b6472">标签</div><div><input class="ic-input" style="width:100%" placeholder="多个标签用逗号分隔，如：VIP,收银" value="' + msSyEsc((d.tags || []).join(',')) + '" oninput="syUsrD(\'tagsInput\',this.value)"></div>' +
  '</div>';
}
function syUsrD(path, v) {
  if (!SY_USR_DRAFT) return;
  if (path === 'level') { SY_USR_DRAFT.level = parseInt(v, 10); }
  else if (path === 'tagsInput') { SY_USR_DRAFT.tags = v ? String(v).split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean) : []; }
  else if (path === 'shopIds') { SY_USR_DRAFT.shopIds = v; }
  else { SY_USR_DRAFT[path] = v; }
  if (path === 'level' || path === 'companyId') syUsrRefreshForm();
}
function syUsrRefreshForm() {
  var body = document.getElementById('msSyBody');
  var mode = SY_USR_DRAFT && SY_USR_DRAFT.userId ? 'edit' : 'new';
  if (body) body.innerHTML = syUsrFormHTML(mode);
}
function syUsrPickRoles() {
  syRoleLoad();
  var items = SY_ROLES.map(function (r) { return { v: r.roleId, l: r.roleName, sub: (SY_LEVEL_TYPES.filter(function (x) { return x.value === r.level; })[0] || {}).label }; });
  SY_PICK_SEL = {}; (SY_USR_DRAFT.roleIds || []).forEach(function (rid) { SY_PICK_SEL[rid] = true; });
  msSyPick({
    title: '选择角色授权', searchable: true, searchPh: '搜索角色名称', items: items, width: 'min(460px,90vw)',
    onOk: function (vals) { SY_USR_DRAFT.roleIds = vals; syUsrRefreshForm(); }
  });
}
function syUsrPickShops() {
  var stores = msSyStoresOfEnt(SY_USR_DRAFT.companyId);
  if (!SY_USR_DRAFT.companyId) { msSyToast('请先选择所属企业'); return; }
  if (!stores.length) { msSyToast('该企业暂未配置门店'); return; }
  var items = stores.map(function (s) { return { v: s.id, l: s.name }; });
  var cur = SY_USR_DRAFT.shopIds && SY_USR_DRAFT.shopIds[0] === 'ALL' ? stores.map(function (s) { return s.id; }) : (SY_USR_DRAFT.shopIds || []);
  SY_PICK_SEL = {}; cur.forEach(function (sid) { SY_PICK_SEL[sid] = true; });
  msSyPick({
    title: '选择授权门店（' + msSyEntName(SY_USR_DRAFT.companyId) + '）', searchable: true, searchPh: '搜索门店名称', items: items,
    onOk: function (vals) { SY_USR_DRAFT.shopIds = vals; var c = document.getElementById('syUsrAllShop'); if (c) c.checked = false; syUsrRefreshForm(); }
  });
}
function syUsrAllShops(on) { SY_USR_DRAFT.shopIds = on ? ['ALL'] : []; syUsrRefreshForm(); }
function syUsrSave(mode) {
  var d = SY_USR_DRAFT; if (!d) return;
  if (!d.userName || !String(d.userName).trim()) { msSyToast('请输入用户名'); return; }
  if (!/^1[3-9]\d{9}$/.test(String(d.userAccount)) && String(d.userAccount) !== 'admin') { msSyToast('请填写有效的手机号/账号'); return; }
  if (mode === 'new') {
    var dup = SY_USERS.filter(function (x) { return String(x.userAccount) === String(d.userAccount); })[0];
    if (dup) { msSyToast('该账号已存在'); return; }
  }
  if (String(d.level) === '1' && !d.companyId) { msSyToast('用户等级为「企业」时，所属企业必填'); return; }
  if (String(d.level) === '0') { d.companyId = ''; d.shopIds = []; }
  var u = JSON.parse(JSON.stringify(d)); delete u.tagsInput;
  if (mode === 'new') {
    var maxId = 0;
    SY_USERS.forEach(function (x) { var n = parseInt(String(x.userId).replace('U', ''), 10); if (!isNaN(n) && n > maxId) maxId = n; });
    u.userId = 'U' + (maxId + 1);
    SY_USERS.push(u);
    msSyToast('新增用户成功');
  } else {
    var idx = SY_USERS.map(function (x) { return x.userId; }).indexOf(u.userId);
    if (idx < 0) return;
    SY_USERS[idx] = u;
    msSyToast('保存成功');
  }
  syUsrPersist(); syUsrRender(); msSyClose();
}
function syUsrToggle(id, st) {
  var u = SY_USERS.filter(function (x) { return x.userId === id; })[0];
  if (!u) return;
  if (u.userId === 'U001' && st === 1) { msSyToast('系统管理员不能禁用'); return; }
  u.status = st; syUsrPersist(); syUsrRender();
  msSyToast(st === 0 ? '已启用' : '已禁用');
}
function syUsrDel(id) {
  var u = SY_USERS.filter(function (x) { return x.userId === id; })[0];
  if (!u) return;
  if (u.userId === 'U001') { msSyToast('系统管理员不能删除'); return; }
  if (!window.confirm('确定删除用户「' + u.userName + '」？')) return;
  SY_USERS = SY_USERS.filter(function (x) { return x.userId !== id; });
  syUsrPersist(); syUsrRender(); msSyToast('已删除');
}

/* ================================================================
 * 2) 角色管理 role-list
 * ================================================================ */
var SY_ROLE_KEY = 'tcm_sys_roles_v1';
var SY_ROLES = [];
var ROLE_PAGE = 1, ROLE_SIZE = 10, ROLE_KW = '', ROLE_LV = '', ROLE_ST = '';
var SY_ROLE_DRAFT = null;
var SY_ROLE_SEED = [
  { roleId: 'R001', roleName: '超级管理员', level: 0, companyId: '', status: 0, menuIds: [] },
  { roleId: 'R002', roleName: '平台运营', level: 0, companyId: '', status: 0, menuIds: [] },
  { roleId: 'R101', roleName: '企业管理员', level: 1, companyId: 'ent-001', status: 0, menuIds: [] },
  { roleId: 'R102', roleName: '门店收银员', level: 2, companyId: 'ent-001', status: 0, menuIds: [] },
  { roleId: 'R103', roleName: '门店店长', level: 2, companyId: 'ent-001', status: 0, menuIds: [] },
  { roleId: 'R201', roleName: '企业管理员', level: 1, companyId: 'ent-002', status: 0, menuIds: [] },
  { roleId: 'R202', roleName: '门店店员', level: 2, companyId: 'ent-002', status: 0, menuIds: [] },
  { roleId: 'R301', roleName: '企业主管', level: 1, companyId: 'ent-003', status: 0, menuIds: [] },
  { roleId: 'R302', roleName: '调度员', level: 2, companyId: 'ent-003', status: 0, menuIds: [] },
  { roleId: 'R401', roleName: '企业管理员', level: 1, companyId: 'ent-004', status: 0, menuIds: [] },
  { roleId: 'R402', roleName: '门店店员', level: 2, companyId: 'ent-004', status: 0, menuIds: [] },
  { roleId: 'R901', roleName: '临时收银', level: 2, companyId: 'ent-001', status: 1, menuIds: [] }
];
function syRoleLoad() {
  try { var r = localStorage.getItem(SY_ROLE_KEY); if (r) { SY_ROLES = JSON.parse(r); return; } } catch (e) {}
  SY_ROLES = JSON.parse(JSON.stringify(SY_ROLE_SEED));
  try { localStorage.setItem(SY_ROLE_KEY, JSON.stringify(SY_ROLES)); } catch (e) {}
}
function syRolePersist() { try { localStorage.setItem(SY_ROLE_KEY, JSON.stringify(SY_ROLES)); } catch (e) {} }
function syRoleLevelName(lv) { var t = SY_LEVEL_TYPES.filter(function (x) { return x.value === lv; })[0]; return t ? t.label : ''; }
function syRoleLevelOptions(sel, withAll) {
  var h = withAll ? '<option value="">角色等级</option>' : '';
  h += SY_LEVEL_TYPES.map(function (t) { return '<option value="' + t.value + '"' + (String(sel) === String(t.value) ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
  return h;
}
function syRoleStatusOptions(sel, withAll) {
  var h = withAll ? '<option value="">角色状态</option>' : '';
  h += SY_STATUS_OPTS.map(function (t) { return '<option value="' + t.value + '"' + (String(sel) === String(t.value) ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
  return h;
}
function syRoleInit() {
  syRoleLoad(); syUsrLoad(); // 已授权用户弹层依赖用户数据（数据链：用户→角色）
  var el = document.getElementById('role-listContent');
  if (!el) { setTimeout(syRoleInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<select class="ic-input" style="width:130px" id="syRoleLv">' + syRoleLevelOptions(ROLE_LV, true) + '</select>' +
      '<select class="ic-input" style="width:130px" id="syRoleSt">' + syRoleStatusOptions(ROLE_ST, true) + '</select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="请输入角色名称" value="' + msSyEsc(ROLE_KW) + '" onkeydown="if(event.key===\'Enter\')syRoleQuery()" id="syRoleKw">' +
      '<button class="ic-btn" onclick="syRoleReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="syRoleQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="syRoleOpen(\'new\',null)">＋ 新增角色</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1080px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:180px">角色名称</th><th style="width:120px">角色等级</th><th style="width:260px">关联企业</th>' +
            '<th style="width:100px">状态</th><th style="width:200px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="syRoleBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="syRolePager" style="flex-shrink:0"></div>' +
    '</div>';
  syRoleRender();
}
function syRoleRows() {
  var kw = ROLE_KW.toLowerCase();
  return SY_ROLES.filter(function (r) {
    if (ROLE_LV !== '' && String(r.level) !== ROLE_LV) return false;
    if (ROLE_ST !== '' && String(r.status) !== ROLE_ST) return false;
    if (kw && r.roleName.toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
}
function syRoleQuery() { var k = document.getElementById('syRoleKw'); ROLE_KW = k ? k.value.trim() : ''; ROLE_PAGE = 1; syRoleRender(); }
function syRoleReset() { ROLE_KW = ''; ROLE_LV = ''; ROLE_ST = ''; ROLE_PAGE = 1; syRoleInit(); }
function syRoleRender() {
  var lv = document.getElementById('syRoleLv'), st = document.getElementById('syRoleSt');
  if (lv) ROLE_LV = lv.value; if (st) ROLE_ST = st.value;
  var rows = syRoleRows();
  var pages = Math.ceil(rows.length / ROLE_SIZE) || 1;
  if (ROLE_PAGE > pages) ROLE_PAGE = pages;
  var slice = rows.slice((ROLE_PAGE - 1) * ROLE_SIZE, ROLE_PAGE * ROLE_SIZE);
  var body = document.getElementById('syRoleBody'); if (!body) return;
  body.innerHTML = slice.map(function (r, i) {
    var op = '';
    op += '<button class="ic-op-link" onclick="syRolePerm(\'' + r.roleId + '\')">权限配置</button>';
    op += '<button class="ic-op-link" onclick="syRoleAuth(\'' + r.roleId + '\')">已授权用户</button>';
    return '<tr>' +
      '<td>' + ((ROLE_PAGE - 1) * ROLE_SIZE + i + 1) + '</td>' +
      '<td><button class="ic-op-link" style="font-weight:600" onclick="syRoleOpen(\'edit\',\'' + r.roleId + '\')">' + msSyEsc(r.roleName) + '</button></td>' +
      '<td>' + syRoleLevelName(r.level) + '</td>' +
      '<td>' + (r.companyId ? msSyEsc(msSyEntName(r.companyId)) : '—') + '</td>' +
      '<td>' + (String(r.status) === '0' ? msSyBadge('启用', 'ok') : msSyBadge('禁用', 'err')) + '</td>' +
      '<td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msSyPager(rows.length, ROLE_PAGE, ROLE_SIZE, 'syRolePager', 'syRoleGo');
}
function syRoleGo(p) { ROLE_PAGE = p; syRoleRender(); }
function syRoleOpen(mode, id) {
  var r = null;
  if (mode === 'edit') {
    r = SY_ROLES.filter(function (x) { return x.roleId === id; })[0];
    if (!r) return;
    r = JSON.parse(JSON.stringify(r));
  } else {
    r = { roleId: '', roleName: '', level: 1, companyId: msSyEnts().length ? msSyEnts()[0].id : '', status: 0, menuIds: [] };
  }
  SY_ROLE_DRAFT = r;
  msSyDlg({
    title: mode === 'edit' ? '编辑角色' : '新增角色', width: '560px',
    okText: mode === 'edit' ? '保存' : '创建', onOk: "syRoleSave('" + mode + "')",
    body: syRoleFormHTML(mode)
  });
}
function syRoleFormHTML(mode) {
  var d = SY_ROLE_DRAFT; if (!d) return '';
  var entSel = '<option value="">请选择关联企业</option>' + msSyEnts().map(function (e) {
    return '<option value="' + e.id + '"' + (d.companyId === e.id ? ' selected' : '') + '>' + msSyEsc(e.name) + '</option>';
  }).join('');
  return '<div style="display:grid;grid-template-columns:88px 1fr;row-gap:14px;align-items:center;font-size:13px">' +
    '<div style="color:#5b6472">角色名称 <span style="color:#fc4b52">*</span></div><div><input class="ic-input" style="width:100%" maxlength="10" placeholder="请输入角色名称（限 10 字）" value="' + msSyEsc(d.roleName) + '" oninput="syRoleD(\'roleName\',this.value)"></div>' +
    '<div style="color:#5b6472">角色等级 <span style="color:#fc4b52">*</span></div><div><select class="ic-input" style="width:100%" onchange="syRoleD(\'level\',parseInt(this.value))">' + syRoleLevelOptions(d.level, false) + '</select></div>' +
    '<div style="color:#5b6472">关联企业</div><div><select class="ic-input" style="width:100%" onchange="syRoleD(\'companyId\',this.value)">' + entSel + '</select></div>' +
    '<div style="color:#5b6472">状态</div><div><select class="ic-input" style="width:100%" onchange="syRoleD(\'status\',parseInt(this.value))">' + syRoleStatusOptions(d.status, false) + '</select></div>' +
    '<div style="color:#909399;grid-column:2">门店等级（level=2）角色必须关联企业</div>' +
  '</div>';
}
function syRoleD(path, v) { if (SY_ROLE_DRAFT) SY_ROLE_DRAFT[path] = v; }
function syRoleSave(mode) {
  var d = SY_ROLE_DRAFT; if (!d) return;
  if (!d.roleName || !String(d.roleName).trim()) { msSyToast('请输入角色名称'); return; }
  if (String(d.level) === '2' && !d.companyId) { msSyToast('角色等级为「门店」时，必须关联企业'); return; }
  if (String(d.level) !== '2') d.companyId = d.companyId || '';
  var r = JSON.parse(JSON.stringify(d));
  if (mode === 'new') {
    if (SY_ROLES.filter(function (x) { return x.roleName === r.roleName; }).length) { msSyToast('角色名称已存在'); return; }
    r.roleId = 'R' + (SY_ROLES.length + 900 + 1);
    while (SY_ROLES.filter(function (x) { return x.roleId === r.roleId; }).length) { r.roleId = 'R' + (parseInt(String(r.roleId).replace('R', ''), 10) + 1); }
    SY_ROLES.push(r);
    msSyToast('新增角色成功');
  } else {
    var idx = SY_ROLES.map(function (x) { return x.roleId; }).indexOf(r.roleId);
    if (idx < 0) return;
    SY_ROLES[idx] = r;
    msSyToast('保存成功');
  }
  syRolePersist(); syRoleRender(); msSyClose();
}
function syRoleToggle(id, st) {
  var r = SY_ROLES.filter(function (x) { return x.roleId === id; })[0];
  if (!r) return;
  if (r.level === 0 && st === 1) { msSyToast('系统角色不能禁用'); return; }
  r.status = st; syRolePersist(); syRoleRender();
  msSyToast(st === 0 ? '已启用' : '已禁用');
}
/* 权限配置弹窗（功能树授权） */
var SY_PERM_CHECK = null;
var SY_PERM_ROLE_ID = null;
function syRolePerm(roleId) {
  syMenuLoad();
  var r = SY_ROLES.filter(function (x) { return x.roleId === roleId; })[0];
  if (!r) return;
  SY_PERM_ROLE_ID = roleId;
  SY_PERM_CHECK = {};
  syMenuFlatAll().forEach(function (n) { SY_PERM_CHECK[n.id] = false; });
  var owned = r.menuIds && r.menuIds.length ? r.menuIds : syMenuDefaultIds(r);
  owned.forEach(function (mid) { if (SY_PERM_CHECK[mid] !== undefined) SY_PERM_CHECK[mid] = true; });
  msSyPop({
    title: '权限配置 — ' + r.roleName, width: 'min(1080px,94vw)', cancelText: '取消',
    onOk: 'syRolePermSave()', okText: '保存',
    body: syRolePermTableHTML()
  });
}
function syRolePermTableHTML() {
  var flat = syMenuFlatAll();
  if (!flat.length) return '<div style="padding:30px;text-align:center;color:#909399">暂无功能菜单</div>';
  var h = '<div style="border:1px solid #e9eef7;border-radius:4px;overflow:auto;max-height:60vh">' +
    '<table style="width:100%;font-size:12px;min-width:860px"><thead><tr style="background:#f7f9fc;color:#5b6472">' +
    '<th style="padding:8px 10px;text-align:left;width:300px">目录名称</th><th style="padding:8px 10px;text-align:left;width:90px">序列编码</th>' +
    '<th style="padding:8px 10px;text-align:center;width:86px">系统后台</th><th style="padding:8px 10px;text-align:center;width:86px">电子秤</th><th style="padding:8px 10px;text-align:center;width:86px">小程序</th>' +
    '<th style="padding:8px 10px;text-align:center;width:70px">平台</th><th style="padding:8px 10px;text-align:center;width:70px">企业</th><th style="padding:8px 10px;text-align:center;width:70px">门店</th>' +
    '<th style="padding:8px 10px;text-align:center;width:70px">授权</th></tr></thead><tbody>';
  flat.forEach(function (n) {
    var on = !!SY_PERM_CHECK[n.id];
    var pad = n._d * 22;
    h += '<tr style="' + (String(n.status) === '1' ? 'opacity:.55' : '') + ';cursor:pointer" onclick="syRolePermRowClick(\'' + n.id + '\')">' +
      '<td style="padding:6px 10px;text-align:left"><span style="display:inline-block;padding-left:' + pad + 'px">' + (n._d > 0 ? '└ ' : '') + msSyEsc(n.name) + '</span>' + (String(n.status) === '1' ? msSyBadge('禁用', 'info') : '') + '</td>' +
      '<td style="padding:6px 10px;color:#606266">' + msSyEsc(n.code) + '</td>' +
      '<td style="padding:6px 10px;text-align:center">' + (n.web ? '<span style="color:#67c23a">✓</span>' : '<span style="color:#c0c4cc">✕</span>') + '</td>' +
      '<td style="padding:6px 10px;text-align:center">' + (n.apk ? '<span style="color:#67c23a">✓</span>' : '<span style="color:#c0c4cc">✕</span>') + '</td>' +
      '<td style="padding:6px 10px;text-align:center">' + (n.mp ? '<span style="color:#67c23a">✓</span>' : '<span style="color:#c0c4cc">✕</span>') + '</td>' +
      '<td style="padding:6px 10px;text-align:center">' + (String(n.level) === '0' ? '<span style="color:#005cf5">●</span>' : '<span style="color:#dcdfe6">○</span>') + '</td>' +
      '<td style="padding:6px 10px;text-align:center">' + (String(n.level) === '1' ? '<span style="color:#005cf5">●</span>' : '<span style="color:#dcdfe6">○</span>') + '</td>' +
      '<td style="padding:6px 10px;text-align:center">' + (String(n.level) === '2' ? '<span style="color:#005cf5">●</span>' : '<span style="color:#dcdfe6">○</span>') + '</td>' +
      '<td style="padding:6px 10px;text-align:center" onclick="event.stopPropagation()"><input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="syRolePermToggle(\'' + n.id + '\',this.checked)"></td>' +
      '</tr>';
  });
  h += '</tbody></table></div>' +
    '<div style="margin-top:8px;font-size:12px;color:#909399">勾选父目录将同时勾选其下全部子目录；保存后角色立即按新权限生效。</div>';
  return h;
}
function syRolePermRowClick(nid) {
  var n = syMenuFind(nid); if (!n) return;
  syRolePermToggle(nid, !SY_PERM_CHECK[nid]);
}
function syRolePermToggle(nid, on) {
  SY_PERM_CHECK[nid] = !!on;
  var n = syMenuFind(nid);
  if (n && n.children) {
    (function walk(nodes, val) {
      nodes.forEach(function (c) { SY_PERM_CHECK[c.id] = val; if (c.children && c.children.length) walk(c.children, val); });
    })(n.children, !!on);
  }
  var body = document.getElementById('msSyPopBody');
  if (body) body.innerHTML = syRolePermTableHTML();
}
function syRolePermSave() {
  if (!SY_PERM_ROLE_ID) return;
  var r = SY_ROLES.filter(function (x) { return x.roleId === SY_PERM_ROLE_ID; })[0];
  if (!r) return;
  r.menuIds = Object.keys(SY_PERM_CHECK).filter(function (k) { return SY_PERM_CHECK[k]; });
  syRolePersist();
  msSyPopClose();
  msSyToast('权限保存成功');
}
function syMenuDefaultIds(r) {
  // 无授权记录时按角色等级给默认勾选（平台=全量；企业/门店=其下全部企业可用节点）
  var all = syMenuFlatAll();
  if (r.level === 0) return all.map(function (n) { return n.id; });
  var set = {};
  all.forEach(function (n) {
    if (r.level === 1 && (String(n.level) === '1' || String(n.level) === '2')) set[n.id] = true;
    if (r.level === 2 && String(n.level) === '2') set[n.id] = true;
  });
  // 门店级补父链，保证勾选节点可显示
  all.forEach(function (n) { if (set[n.id]) { var p = n.pid; while (p) { set[p] = true; p = syMenuFind(p) ? syMenuFind(p).pid : null; } } });
  return Object.keys(set);
}
/* 已授权用户弹窗 */
function syRoleAuth(roleId) {
  syUsrLoad();
  var r = SY_ROLES.filter(function (x) { return x.roleId === roleId; })[0];
  if (!r) return;
  msSyPop({
    title: '已授权用户 — ' + r.roleName, width: 'min(800px,92vw)', cancelText: '关闭',
    body: syRoleAuthHTML(roleId)
  });
}
function syRoleAuthHTML(roleId) {
  var list = SY_USERS.filter(function (u) { return u.roleIds && u.roleIds.indexOf(roleId) >= 0; });
  if (!list.length) return '<div style="text-align:center;color:#909399;padding:40px">该角色暂无授权用户</div>';
  var h = '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472">' +
    '<th style="padding:9px 12px;text-align:left;width:60px">序号</th><th style="padding:9px 12px;text-align:left">用户名</th><th style="padding:9px 12px;text-align:left">账号</th>' +
    '<th style="padding:9px 12px;text-align:left">所属企业</th><th style="padding:9px 12px;text-align:left;width:90px">状态</th><th style="padding:9px 12px;text-align:left;width:80px">操作</th></tr></thead><tbody>';
  list.forEach(function (u, i) {
    h += '<tr style="border-bottom:1px solid #f0f2f7">' +
      '<td style="padding:9px 12px">' + (i + 1) + '</td>' +
      '<td style="padding:9px 12px">' + msSyEsc(u.userName) + '</td>' +
      '<td style="padding:9px 12px">' + msSyEsc(u.userAccount) + '</td>' +
      '<td style="padding:9px 12px">' + (u.companyId ? msSyEsc(msSyEntName(u.companyId)) : '—') + '</td>' +
      '<td style="padding:9px 12px">' + (String(u.status) === '0' ? msSyBadge('启用', 'ok') : msSyBadge('禁用', 'err')) + '</td>' +
      '<td style="padding:9px 12px"><button class="ic-op-link" style="color:#f56c6c" onclick="syRoleAuthRm(\'' + roleId + '\',\'' + u.userId + '\')">移除</button></td></tr>';
  });
  h += '</tbody></table>';
  return h;
}
function syRoleAuthRm(roleId, userId) {
  if (!window.confirm('确定将该用户移出此角色？')) return;
  var u = SY_USERS.filter(function (x) { return x.userId === userId; })[0];
  if (!u) return;
  u.roleIds = (u.roleIds || []).filter(function (rid) { return rid !== roleId; });
  syUsrPersist();
  var body = document.getElementById('msSyPopBody');
  if (body) body.innerHTML = syRoleAuthHTML(roleId);
  msSyToast('已移除');
}

/* ================================================================
 * 3) 功能菜单 function-tree
 * ================================================================ */
var SY_MENU_KEY = 'tcm_sys_menu_v1';
var SY_MENU = [];
var SY_MENU_SEL = null;      // 当前选中节点
var SY_MENU_MODE = 'view';   // view | addRoot | addSub | edit
var SY_MENU_SEED = [
  { id: 'm001', pid: '', code: '001', name: '应用场景', path: '/scenario', web: true, apk: false, mp: true, level: 1, icon: '', tags: '', status: 0, children: [
    { id: 'm00101', pid: 'm001', code: '001001', name: '应用场景一览', path: '/scenario', web: true, apk: false, mp: true, level: 1, icon: '', tags: '', status: 0, children: [] }
  ]},
  { id: 'm002', pid: '', code: '002', name: '核心看板', path: '', web: true, apk: false, mp: true, level: 1, icon: '', tags: '规划', status: 0, children: [
    { id: 'm00201', pid: 'm002', code: '002001', name: '经营概览', path: '/overview', web: true, apk: false, mp: false, level: 1, icon: '', tags: '规划', status: 0, children: [] },
    { id: 'm00202', pid: 'm002', code: '002002', name: '交易分析', path: '/transaction', web: true, apk: false, mp: false, level: 1, icon: '', tags: '规划', status: 0, children: [] }
  ]},
  { id: 'm003', pid: '', code: '003', name: '销售分析', path: '', web: true, apk: false, mp: false, level: 1, icon: '', tags: '规划', status: 0, children: [
    { id: 'm00301', pid: 'm003', code: '003001', name: '商品销售', path: '/product', web: true, apk: false, mp: false, level: 1, icon: '', tags: '规划', status: 0, children: [] },
    { id: 'm00302', pid: 'm003', code: '003002', name: '品类分析', path: '/category', web: true, apk: false, mp: false, level: 1, icon: '', tags: '规划', status: 0, children: [] },
    { id: 'm00303', pid: 'm003', code: '003003', name: '销售趋势', path: '/trend', web: true, apk: false, mp: false, level: 1, icon: '', tags: '规划', status: 0, children: [] }
  ]},
  { id: 'm004', pid: '', code: '004', name: '销售管理', path: '', web: true, apk: true, mp: false, level: 2, icon: '', tags: '', status: 0, children: [
    { id: 'm00401', pid: 'm004', code: '004001', name: '订单列表', path: '/order-list', web: true, apk: false, mp: false, level: 2, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00402', pid: 'm004', code: '004002', name: '打码记录', path: '/item-code', web: true, apk: true, mp: false, level: 2, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00403', pid: 'm004', code: '004003', name: '挂单记录', path: '/order-hold', web: true, apk: true, mp: false, level: 2, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00404', pid: 'm004', code: '004004', name: '个人交班', path: '/shift-personal', web: true, apk: true, mp: false, level: 2, icon: '', tags: '', status: 0, children: [] }
  ]},
  { id: 'm005', pid: '', code: '005', name: '商品管理', path: '', web: true, apk: false, mp: true, level: 1, icon: '', tags: '', status: 0, children: [
    { id: 'm00501', pid: 'm005', code: '005001', name: '商品列表', path: '/goods-list', web: true, apk: false, mp: true, level: 2, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00502', pid: 'm005', code: '005002', name: '标准商品', path: '/goods-standard', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00503', pid: 'm005', code: '005003', name: '供应商列表', path: '/supplier-list', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00504', pid: 'm005', code: '005004', name: '品牌库', path: '/brand-library', web: true, apk: false, mp: false, level: 1, icon: '', tags: '规划', status: 0, children: [] }
  ]},
  { id: 'm006', pid: '', code: '006', name: '库存管理', path: '', web: true, apk: false, mp: true, level: 1, icon: '', tags: '规划', status: 0, children: [
    { id: 'm00601', pid: 'm006', code: '006001', name: '库存列表', path: '/inv-list', web: true, apk: false, mp: true, level: 2, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00602', pid: 'm006', code: '006002', name: '入库单', path: '/inv-entry', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00603', pid: 'm006', code: '006003', name: '库存盘点', path: '/inv-check', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00604', pid: 'm006', code: '006004', name: '库存预警', path: '/inventory-notify', web: true, apk: false, mp: true, level: 1, icon: '', tags: '', status: 0, children: [] }
  ]},
  { id: 'm007', pid: '', code: '007', name: '营销管理', path: '', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [
    { id: 'm00701', pid: 'm007', code: '007001', name: '动态调价', path: '/dynamic-pricing', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] }
  ]},
  { id: 'm008', pid: '', code: '008', name: '优惠券', path: '', web: true, apk: false, mp: true, level: 1, icon: '', tags: '', status: 0, children: [
    { id: 'm00801', pid: 'm008', code: '008001', name: '优惠券模板', path: '/cp-template', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00802', pid: 'm008', code: '008002', name: '优惠券计划', path: '/cp-plan', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00803', pid: 'm008', code: '008003', name: '优惠券记录', path: '/cp-record', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] }
  ]},
  { id: 'm009', pid: '', code: '009', name: '会员运营', path: '', web: true, apk: false, mp: true, level: 1, icon: '', tags: '', status: 0, children: [
    { id: 'm00901', pid: 'm009', code: '009001', name: '会员列表', path: '/member-list', web: true, apk: false, mp: true, level: 1, icon: '', tags: '', status: 0, children: [] },
    { id: 'm00902', pid: 'm009', code: '009002', name: '会员价计划', path: '/member-price', web: true, apk: false, mp: false, level: 1, icon: '', tags: '', status: 0, children: [] }
  ]},
  { id: 'm010', pid: '', code: '010', name: '系统管理', path: '', web: true, apk: false, mp: false, level: 0, icon: '', tags: '', status: 0, children: [
    { id: 'm01001', pid: 'm010', code: '010001', name: '用户管理', path: '/user-list', web: true, apk: false, mp: false, level: 0, icon: '', tags: '', status: 0, children: [] },
    { id: 'm01002', pid: 'm010', code: '010002', name: '角色管理', path: '/role-list', web: true, apk: false, mp: false, level: 0, icon: '', tags: '', status: 0, children: [] },
    { id: 'm01003', pid: 'm010', code: '010003', name: '功能菜单', path: '/function-tree', web: true, apk: false, mp: false, level: 0, icon: '', tags: '', status: 0, children: [] },
    { id: 'm01004', pid: 'm010', code: '010004', name: '企业管理', path: '/group-manage', web: true, apk: false, mp: false, level: 0, icon: '', tags: '', status: 0, children: [] },
    { id: 'm01005', pid: 'm010', code: '010005', name: '门店管理', path: '/store-manage', web: true, apk: false, mp: false, level: 0, icon: '', tags: '', status: 0, children: [] }
  ]}
];
function syMenuLoad() {
  try { var r = localStorage.getItem(SY_MENU_KEY); if (r) { SY_MENU = JSON.parse(r); return; } } catch (e) {}
  SY_MENU = JSON.parse(JSON.stringify(SY_MENU_SEED));
  try { localStorage.setItem(SY_MENU_KEY, JSON.stringify(SY_MENU)); } catch (e) {}
}
function syMenuPersist() { try { localStorage.setItem(SY_MENU_KEY, JSON.stringify(SY_MENU)); } catch (e) {} }
function syMenuFind(id) {
  var found = null;
  (function walk(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) { found = nodes[i]; return; }
      if (nodes[i].children && nodes[i].children.length) walk(nodes[i].children);
      if (found) return;
    }
  })(SY_MENU);
  return found;
}
function syMenuFlatAll() {
  var out = [];
  (function walk(nodes, d) {
    nodes.forEach(function (n) { n._d = d; out.push(n); if (n.children && n.children.length) walk(n.children, d + 1); });
  })(SY_MENU, 0);
  return out;
}
function syMenuInit() {
  syMenuLoad();
  var el = document.getElementById('function-treeContent');
  if (!el) { setTimeout(syMenuInit, 80); return; }
  SY_MENU_SEL = null; SY_MENU_MODE = 'view';
  el.innerHTML =
    '<div style="flex:1;display:flex;min-height:0;gap:10px;padding:10px">' +
      '<div style="flex:1;min-width:0;background:#fff;border:1px solid #e9eef7;border-radius:4px;display:flex;flex-direction:column;overflow:hidden">' +
        '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
          '<table style="width:100%;min-width:880px;font-size:12px">' +
            '<thead><tr>' +
              '<th style="padding:10px 12px;text-align:left;width:auto">目录名称</th><th style="padding:10px 12px;text-align:left;width:100px">序列编码</th>' +
              '<th style="padding:10px 12px;text-align:center;width:90px">系统后台</th><th style="padding:10px 12px;text-align:center;width:90px">电子秤</th><th style="padding:10px 12px;text-align:center;width:90px">小程序</th>' +
              '<th style="padding:10px 12px;text-align:center;width:70px">平台</th><th style="padding:10px 12px;text-align:center;width:70px">企业</th><th style="padding:10px 12px;text-align:center;width:70px">门店</th>' +
            '</tr></thead>' +
            '<tbody id="syMenuTreeBody"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
      '<div style="width:400px;flex-shrink:0;background:#fff;border:1px solid #e9eef7;border-radius:4px;display:flex;flex-direction:column;overflow:hidden">' +
        syMenuSideHTML() +
      '</div>' +
    '</div>';
  syMenuTreeRender();
}
function syMenuTreeRender() {
  var body = document.getElementById('syMenuTreeBody'); if (!body) return;
  var flat = syMenuFlatAll();
  if (!flat.length) { body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#909399;padding:40px">暂无功能菜单</td></tr>'; return; }
  body.innerHTML = flat.map(function (n) {
    var pad = n._d * 22;
    var sel = SY_MENU_SEL && SY_MENU_SEL.id === n.id;
    var rowBg = sel ? 'background:#ecf5ff' : (String(n.status) === '1' ? 'background:#fafafa' : '');
    var hasChild = n.children && n.children.length;
    var arrow = hasChild ? '<span style="color:#909399;font-size:10px;margin-right:4px;display:inline-block;transform:rotate(90deg)">▶</span>' : '';
    return '<tr style="' + rowBg + ';cursor:pointer;' + (String(n.status) === '1' ? 'opacity:.6' : '') + '" onclick="syMenuSelect(\'' + n.id + '\')">' +
      '<td style="padding:8px 12px;text-align:left"><span style="display:inline-block;padding-left:' + pad + 'px">' + arrow + msSyEsc(n.name) + '</span>' + (String(n.status) === '1' ? msSyBadge('禁用', 'info') : '') + '</td>' +
      '<td style="padding:8px 12px;color:#606266">' + msSyEsc(n.code) + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + (n.web ? '<span style="color:#67c23a">✓</span>' : '<span style="color:#c0c4cc">✕</span>') + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + (n.apk ? '<span style="color:#67c23a">✓</span>' : '<span style="color:#c0c4cc">✕</span>') + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + (n.mp ? '<span style="color:#67c23a">✓</span>' : '<span style="color:#c0c4cc">✕</span>') + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + (String(n.level) === '0' ? '<span style="color:#005cf5">●</span>' : '<span style="color:#dcdfe6">○</span>') + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + (String(n.level) === '1' ? '<span style="color:#005cf5">●</span>' : '<span style="color:#dcdfe6">○</span>') + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + (String(n.level) === '2' ? '<span style="color:#005cf5">●</span>' : '<span style="color:#dcdfe6">○</span>') + '</td>' +
      '</tr>';
  }).join('');
}
var SY_MENU_ICONS = { '🏠': '首页', '📊': '看板', '🛒': '销售', '📦': '商品', '📋': '单据', '🧾': '收银', '🏷️': '标签', '🎟️': '营销', '👥': '会员', '🏢': '企业', '🏪': '门店', '🔧': '系统', '📈': '报表', '📤': '打码' };
function syMenuSideHTML() {
  var h = '<div style="padding:12px 16px;border-bottom:1px solid #eef1f6;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">' +
    '<span style="font-size:14px;font-weight:600;color:#0b1019">目录编辑</span>' +
    '<span id="syMenuMode" style="font-size:12px;color:#909399"></span></div>' +
    '<div style="padding:12px 16px;border-bottom:1px solid #eef1f6;display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0">' +
      '<button class="ic-btn ic-btn-pri" onclick="syMenuModeSet(\'addRoot\')">新增根目录</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="syMenuModeSet(\'addSub\')">新增下级目录</button>' +
      '<button class="ic-btn" onclick="syMenuModeSet(\'edit\')">编辑目录</button>' +
      '<button class="ic-btn" style="color:#67c23a" onclick="syMenuToggle(0)">启用</button>' +
      '<button class="ic-btn" style="color:#f56c6c" onclick="syMenuToggle(1)">禁用</button>' +
    '</div>' +
    '<div style="padding:14px 16px;display:grid;grid-template-columns:84px 1fr;row-gap:13px;align-items:center;font-size:13px;align-content:start">' +
      '<div style="color:#5b6472">上级目录</div><div><input class="ic-input" style="width:100%;background:#f5f7fa" id="syMenuParent" readonly placeholder="自动填充"></div>' +
      '<div style="color:#5b6472">序列号编码 <span style="color:#fc4b52">*</span></div><div><input class="ic-input" style="width:100%;background:#f5f7fa" id="syMenuCode" readonly placeholder="自动生成"></div>' +
      '<div style="color:#5b6472">目录名称 <span style="color:#fc4b52">*</span></div><div><input class="ic-input" style="width:100%" id="syMenuName" placeholder="请输入目录名称" disabled></div>' +
      '<div style="color:#5b6472">目录地址</div><div><input class="ic-input" style="width:100%" id="syMenuPath" placeholder="请输入目录地址" disabled></div>' +
      '<div style="color:#5b6472">功能终端</div><div style="display:flex;gap:14px" id="syMenuTermBox">' +
        '<label style="cursor:pointer"><input type="checkbox" id="syMenuWeb" value="1" disabled> 系统后台</label>' +
        '<label style="cursor:pointer"><input type="checkbox" id="syMenuApk" value="1" disabled> 电子秤</label>' +
        '<label style="cursor:pointer"><input type="checkbox" id="syMenuMp" value="1" disabled> 小程序</label></div>' +
      '<div style="color:#5b6472">建议层级</div><div id="syMenuLvBox">' +
        '<label style="margin-right:14px;cursor:pointer"><input type="radio" name="syMenuLv" value="0" disabled> 平台</label>' +
        '<label style="margin-right:14px;cursor:pointer"><input type="radio" name="syMenuLv" value="1" disabled> 企业</label>' +
        '<label style="cursor:pointer"><input type="radio" name="syMenuLv" value="2" disabled> 门店</label></div>' +
      '<div style="color:#5b6472">标签</div><div><input class="ic-input" style="width:100%" id="syMenuTags" placeholder="请输入标签" disabled></div>' +
      '<div style="color:#5b6472">ICON</div><div><select class="ic-input" style="width:100%" id="syMenuIcon" disabled><option value="">请选择图标</option>' +
        Object.keys(SY_MENU_ICONS).map(function (k) { return '<option value="' + k + '">' + k + ' ' + SY_MENU_ICONS[k] + '</option>'; }).join('') +
        '</select></div>' +
      '<div style="color:#5b6472">状态</div><div id="syMenuStBox">—</div>' +
      '<div style="grid-column:2;display:flex;gap:10px;padding-top:4px">' +
        '<button class="ic-btn ic-btn-pri" id="syMenuSaveBtn" style="display:none" onclick="syMenuSave()">保存</button>' +
        '<button class="ic-btn" id="syMenuCancelBtn" style="display:none" onclick="syMenuModeSet(\'view\')">取消</button></div>' +
    '</div>';
  return h;
}
function syMenuModeSet(mode) {
  if (mode === 'addRoot') {
    if (!window.confirm('新增根目录？系统将自动生成一级序列编码。')) return;
    SY_MENU_SEL = null;
    SY_MENU_MODE = 'addRoot';
    syMenuFormFill({
      id: '', parentId: '', parentName: '根目录', code: syMenuNextCode(null), name: '', path: '',
      web: true, apk: false, mp: false, level: 1, tags: '', icon: ''
    });
  } else if (mode === 'addSub') {
    if (!SY_MENU_SEL) { msSyToast('请先在左侧选择上级目录'); return; }
    var p = syMenuFind(SY_MENU_SEL.id); if (!p) return;
    if (!p.children) p.children = [];
    SY_MENU_MODE = 'addSub';
    syMenuFormFill({
      id: '', parentId: p.id, parentName: p.name, code: syMenuNextCode(p), name: '', path: '',
      web: p.web, apk: p.apk, mp: p.mp, level: p.level, tags: '', icon: ''
    });
  } else if (mode === 'edit') {
    if (!SY_MENU_SEL) { msSyToast('请先在左侧选择目录'); return; }
    SY_MENU_MODE = 'edit';
    syMenuFillForm(SY_MENU_SEL);
  } else {
    SY_MENU_MODE = 'view';
    if (SY_MENU_SEL) syMenuFillForm(SY_MENU_SEL); else syMenuFormReset();
  }
}
function syMenuSelect(id) {
  var n = syMenuFind(id); if (!n) return;
  SY_MENU_SEL = n;
  SY_MENU_MODE = 'view';
  syMenuFillForm(n);
  syMenuTreeRender();
}
function syMenuNextCode(parent) {
  var flat = syMenuFlatAll();
  var len = parent ? 6 : 3;
  var prefix = parent ? String(parent.code) : '';
  var max = 0;
  flat.forEach(function (n) {
    if (n.code && n.code.length === len && (!prefix || n.code.indexOf(prefix) === 0)) {
      var num = parseInt(n.code.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  });
  var next = String(max + 1);
  while (next.length < (len - prefix.length)) next = '0' + next;
  return prefix + next;
}
function syMenuFillForm(n) {
  if (!n) return;
  var d = { parentId: n.pid, parentName: n.pid ? (syMenuFind(n.pid) || {}).name : '根目录', code: n.code, name: n.name, path: n.path || '', web: n.web, apk: n.apk, mp: n.mp, level: String(n.level), tags: n.tags || '', icon: n.icon || '' };
  syMenuFormFill(d);
}
function syMenuFormFill(d) {
  var editing = SY_MENU_MODE !== 'view';
  function setV(id, v) { var el = document.getElementById(id); if (el) el.value = v == null ? '' : v; }
  setV('syMenuParent', d.parentName || '根目录');
  setV('syMenuCode', d.code);
  setV('syMenuName', d.name);
  setV('syMenuPath', d.path);
  setV('syMenuTags', d.tags);
  setV('syMenuIcon', d.icon);
  var nameEl = document.getElementById('syMenuName'), pathEl = document.getElementById('syMenuPath'), tagsEl = document.getElementById('syMenuTags'), iconEl = document.getElementById('syMenuIcon');
  [nameEl, pathEl, tagsEl, iconEl].forEach(function (el) { if (el) el.disabled = !editing; });
  // ICON 仅一级目录(code 长度 3) 且编辑态可选
  if (iconEl) iconEl.disabled = !(editing && String(d.code).length === 3);
  var web = document.getElementById('syMenuWeb'), apk = document.getElementById('syMenuApk'), mp = document.getElementById('syMenuMp');
  [web, apk, mp].forEach(function (el) { if (el) { el.disabled = !editing; el.checked = !!(d[el.id.replace('syMenu', '').toLowerCase()]); } });
  var radios = document.querySelectorAll('input[name="syMenuLv"]');
  for (var i = 0; i < radios.length; i++) { radios[i].disabled = !editing; radios[i].checked = String(radios[i].value) === String(d.level); }
  var stEl = document.getElementById('syMenuStBox');
  if (stEl) stEl.innerHTML = editing ? '<span style="color:#909399;font-size:12px">保存后生效</span>' : (String(SY_MENU_SEL ? SY_MENU_SEL.status : 0) === '0' ? msSyBadge('启用', 'ok') : msSyBadge('禁用', 'err'));
  var modeEl = document.getElementById('syMenuMode');
  if (modeEl) modeEl.textContent = SY_MENU_MODE === 'addRoot' ? '新增根目录' : SY_MENU_MODE === 'addSub' ? '新增下级目录' : SY_MENU_MODE === 'edit' ? '编辑目录' : '只读查看';
  var saveBtn = document.getElementById('syMenuSaveBtn'), cancelBtn = document.getElementById('syMenuCancelBtn');
  if (saveBtn) saveBtn.style.display = editing ? 'inline-block' : 'none';
  if (cancelBtn) cancelBtn.style.display = editing ? 'inline-block' : 'none';
  var codeEl = document.getElementById('syMenuCode');
  if (codeEl) codeEl.style.background = editing ? '#fff' : '#f5f7fa';
  var parentEl = document.getElementById('syMenuParent');
  if (parentEl) parentEl.style.background = '#f5f7fa';
}
function syMenuFormReset() {
  SY_MENU_MODE = 'view';
  var d = { parentName: '', code: '', name: '', path: '', web: false, apk: false, mp: false, level: '1', tags: '', icon: '' };
  syMenuFormFill(d);
  var modeEl = document.getElementById('syMenuMode');
  if (modeEl) modeEl.textContent = '只读查看';
  var saveBtn = document.getElementById('syMenuSaveBtn'), cancelBtn = document.getElementById('syMenuCancelBtn');
  if (saveBtn) saveBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = 'none';
}
function syMenuGather() {
  function v(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function c(id) { var el = document.getElementById(id); return !!(el && el.checked); }
  var lv = '1';
  var radios = document.querySelectorAll('input[name="syMenuLv"]');
  for (var i = 0; i < radios.length; i++) { if (radios[i].checked) lv = radios[i].value; }
  return { name: v('syMenuName').trim(), path: v('syMenuPath').trim(), tags: v('syMenuTags').trim(), icon: v('syMenuIcon'), web: c('syMenuWeb'), apk: c('syMenuApk'), mp: c('syMenuMp'), level: parseInt(lv, 10) };
}
function syMenuSave() {
  var g = syMenuGather();
  if (!g.name) { msSyToast('请输入目录名称'); return; }
  var node = null, parent = null;
  if (SY_MENU_MODE === 'edit') node = SY_MENU_SEL;
  else if (SY_MENU_MODE === 'addSub') { parent = SY_MENU_SEL; node = null; }
  else { parent = null; node = null; }
  if (node) {
    node.name = g.name; node.path = g.path; node.web = g.web; node.apk = g.apk; node.mp = g.mp; node.level = g.level; node.tags = g.tags; node.icon = g.icon;
    msSyToast('目录已保存');
  } else {
    var flat = syMenuFlatAll();
    var isRoot = SY_MENU_MODE === 'addRoot';
    var pid = isRoot ? '' : (SY_MENU_SEL ? SY_MENU_SEL.id : '');
    var parentNode = isRoot ? null : (SY_MENU_SEL ? syMenuFind(SY_MENU_SEL.id) : null);
    if (!parentNode && !isRoot) { msSyToast('未找到上级目录'); return; }
    var code = syMenuNextCode(parentNode);
    var nid = 'm' + code.replace(/^0+/, '') + (isRoot ? '' : code);
    while (syMenuFind(nid)) nid = nid + 'x';
    var nnode = { id: nid, pid: pid, code: code, name: g.name, path: g.path, web: g.web, apk: g.apk, mp: g.mp, level: g.level, tags: g.tags, icon: isRoot ? g.icon : '', status: 0, children: [] };
    if (isRoot) SY_MENU.push(nnode); else { if (!parentNode.children) parentNode.children = []; parentNode.children.push(nnode); }
    SY_MENU_SEL = nnode;
    msSyToast(isRoot ? '根目录已新增' : '下级目录已新增');
  }
  syMenuPersist();
  SY_MENU_MODE = 'view';
  syMenuFillForm(SY_MENU_SEL || { pid: '', parentName: '根目录', code: '', name: '', path: '', web: true, apk: false, mp: false, level: 1, tags: '', icon: '', status: 0 });
  syMenuTreeRender();
}
function syMenuToggle(st) {
  if (!SY_MENU_SEL) { msSyToast('请先在左侧选择目录'); return; }
  if (SY_MENU_SEL.level === 0 && st === 1) { msSyToast('平台级目录不可禁用'); return; }
  SY_MENU_SEL.status = st;
  syMenuPersist(); syMenuTreeRender();
  var stEl = document.getElementById('syMenuStBox');
  if (stEl) stEl.innerHTML = st === 0 ? msSyBadge('启用', 'ok') : msSyBadge('禁用', 'err');
  msSyToast(st === 0 ? '已启用' : '已禁用');
}

/* ================================================================
 * 入口分发
 * ================================================================ */
function initSystemPage(pid) {
  if (pid === 'user-list') syUsrInit();
  else if (pid === 'role-list') syRoleInit();
  else if (pid === 'function-tree') syMenuInit();
}
