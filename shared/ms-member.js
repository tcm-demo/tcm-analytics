// ========== 会员运营域（对齐 Vue origin/master Member 域，2026-09-03 补齐 demo） ==========
// 页面：member-list 会员列表 / member-record 会员记录 / member-store 权益商城
//      member-exchange 兑换记录 / member-activate 会员配置 / member-price 会员价计划
// 依赖 layout.js：showToast / initTicker；共享样式 layout.css（ic-btn/ic-search/ic-modal/page-*）
var MS_MEMBER_LOADED = true;
function msMbrEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function msMbrToast(m) { try { showToast(m); } catch (e) { alert(m); } }
// 状态徽标（对齐 demo 既有色系）
function msMbrBadge(text, kind) {
  var map = {
    ok: 'background:#f0f9eb;color:#67c23a;border:1px solid #e1f3d8',
    warn: 'background:#fdf6ec;color:#e6a23c;border:1px solid #faecd8',
    err: 'background:#fef0f0;color:#f56c6c;border:1px solid #fde2e2',
    info: 'background:#f4f4f5;color:#909399;border:1px solid #e9e9eb',
    blue: 'background:#ecf5ff;color:#409eff;border:1px solid #d9ecff',
    gold: 'background:#fdf6ec;color:#b8860b;border:1px solid #f5dfae'
  };
  return '<span style="display:inline-block;padding:1px 10px;border-radius:10px;font-size:12px;line-height:18px;white-space:nowrap;' + (map[kind] || map.info) + '">' + text + '</span>';
}
// 通用弹窗骨架（复用 ic-modal 体系，独立 id 避免与其它模块冲突）
function msMbrModal(opt) {
  msMbrCloseModal();
  var bd = document.createElement('div'); bd.className = 'ic-modal-backdrop'; bd.id = 'msMbrBackdrop';
  bd.onclick = function (e) { if (e.target === this && opt.allowClose !== false) msMbrCloseModal(); };
  var md = document.createElement('div'); md.className = 'ic-modal'; md.id = 'msMbrModal';
  md.style.cssText = 'width:' + (opt.width || 'min(560px,94vw)') + ';';
  md.innerHTML = '<div class="ic-modal-header"><span>' + (opt.title || '') + '</span><button class="ic-modal-close" onclick="msMbrCloseModal()">✕</button></div>'
    + '<div class="ic-modal-body" style="' + (opt.bodyStyle || '') + '">' + opt.body + '</div>'
    + (opt.footer === false ? '' : '<div class="ic-modal-footer">'
      + (opt.footLeft || '')
      + '<button class="btn-secondary" onclick="msMbrCloseModal()">' + (opt.cancelText || '取消') + '</button>'
      + '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>'
      + '</div>');
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msMbrCloseModal() {
  var b = document.getElementById('msMbrBackdrop'); if (b) b.remove();
  var m = document.getElementById('msMbrModal'); if (m) m.remove();
}
// 分页渲染：写 #xxxPager，调用 cb(page)
function msMbrPager(total, page, size, pagerId, cbName) {
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
function msMbrStoreName(id) { return id === 'S2001' ? '崧泽-青浦旗舰店' : (id === 'S2002' ? '崧泽-松江分店' : (id || '全部门店')); }
function msMbrScopeStoreLabel() {
  try {
    if (window.DATA_SCOPE && !DATA_SCOPE.storeAll && (DATA_SCOPE.storeIds || []).length === 1) {
      return msMbrStoreName(DATA_SCOPE.storeIds[0]);
    }
  } catch (e) {}
  return '全部门店';
}
function msMbrDate(d) { var n = new Date(d); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }

/* ================================================================
 * 1) 会员列表 member-list（Vue Member/List.vue：新增/编辑/禁用/注销）
 * ================================================================ */
var MBR_LIST_PAGE = 1, MBR_LIST_SIZE = 10, MBR_KW = '', MBR_STATUS = '';
var MBR_KEY = 'tcm_mbr_members_v1';
var MBR_STORE_SEED = [
  { no: 'HY2026001', nick: '张阿姨', mobile: '138****2216', level: '金卡', points: 2680, balance: 2680, cost: 12680.5, storeId: 'S2001', regDate: '2025-11-02', status: '正常', lastVisit: '2026-09-02' },
  { no: 'HY2026002', nick: '王先生', mobile: '139****8803', level: '银卡', points: 860, balance: 860, cost: 3860.0, storeId: 'S2001', regDate: '2026-01-18', status: '正常', lastVisit: '2026-09-01' },
  { no: 'HY2026003', nick: '李奶奶', mobile: '136****3347', level: '普通', points: 420, balance: 420, cost: 1530.0, storeId: 'S2002', regDate: '2026-03-09', status: '正常', lastVisit: '2026-08-30' },
  { no: 'HY2026004', nick: '陈小姐', mobile: '135****7721', level: '金卡', points: 5120, balance: 4980, cost: 22680.0, storeId: 'S2001', regDate: '2025-06-15', status: '正常', lastVisit: '2026-09-02' },
  { no: 'HY2026005', nick: '刘师傅', mobile: '137****9902', level: '普通', points: 120, balance: 120, cost: 980.0, storeId: 'S2002', regDate: '2026-05-21', status: '禁用', lastVisit: '2026-07-30' },
  { no: 'HY2026006', nick: '赵女士', mobile: '133****5526', level: '银卡', points: 1750, balance: 1750, cost: 7240.5, storeId: 'S2001', regDate: '2025-12-08', status: '正常', lastVisit: '2026-08-29' },
  { no: 'HY2026007', nick: '孙大爷', mobile: '158****1120', level: '普通', points: 60, balance: 0, cost: 640.0, storeId: 'S2001', regDate: '2026-07-02', status: '注销', lastVisit: '2026-08-12' },
  { no: 'HY2026008', nick: '周同学', mobile: '150****4478', level: '银卡', points: 980, balance: 930, cost: 4120.0, storeId: 'S2002', regDate: '2026-02-26', status: '正常', lastVisit: '2026-08-31' },
  { no: 'HY2026009', nick: '吴阿姨', mobile: '139****6653', level: '金卡', points: 3320, balance: 3320, cost: 15890.0, storeId: 'S2001', regDate: '2025-09-19', status: '正常', lastVisit: '2026-09-02' },
  { no: 'HY2026010', nick: '郑先生', mobile: '186****9918', level: '普通', points: 200, balance: 200, cost: 1150.0, storeId: 'S2002', regDate: '2026-06-11', status: '正常', lastVisit: '2026-09-01' },
  { no: 'HY2026011', nick: '冯姐', mobile: '187****3341', level: '银卡', points: 1460, balance: 1400, cost: 6890.0, storeId: 'S2001', regDate: '2026-01-05', status: '正常', lastVisit: '2026-08-28' },
  { no: 'HY2026012', nick: '何先生', mobile: '188****7723', level: '普通', points: 0, balance: 0, cost: 0.0, storeId: 'S2001', regDate: '2026-08-30', status: '正常', lastVisit: '—' }
];
var MEMBERS = [];
function mbrListLoad() { try { var r = localStorage.getItem(MBR_KEY); if (r) { MEMBERS = JSON.parse(r); return; } } catch (e) {} MEMBERS = JSON.parse(JSON.stringify(MBR_STORE_SEED)); mbrListPersist(); }
function mbrListPersist() { try { localStorage.setItem(MBR_KEY, JSON.stringify(MEMBERS)); } catch (e) {} }
function mbrListInit() {
  mbrListLoad();
  var el = document.getElementById('member-listContent');
  if (!el) { setTimeout(mbrListInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">会员状态：</span>' +
      '<div style="display:flex;gap:0" id="mbrStatusTabs">' +
        '<button class="btn-tab active" data-v="" onclick="mbrListSetStatus(\'\',this)">全部</button>' +
        '<button class="btn-tab" data-v="正常" onclick="mbrListSetStatus(\'正常\',this)">正常</button>' +
        '<button class="btn-tab" data-v="禁用" onclick="mbrListSetStatus(\'禁用\',this)">禁用</button>' +
        '<button class="btn-tab" data-v="注销" onclick="mbrListSetStatus(\'注销\',this)">注销</button>' +
      '</div>' +
      '<input class="ic-search" style="flex:0 1 240px" placeholder="会员号 / 昵称 / 手机号" value="' + msMbrEsc(MBR_KW) + '" onkeydown="if(event.key===\'Enter\')mbrListQuery()" id="mbrListKw">' +
      '<button class="ic-btn" onclick="mbrListReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="mbrListQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="mbrListEdit(null)">＋ 新增会员</button>' +
      '<span style="font-size:12px;color:#8a93a3">范围：' + msMbrScopeStoreLabel() + '（随顶栏门店联动）</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1120px">' +
          '<thead><tr>' +
            '<th style="width:54px">序号</th><th style="width:120px">会员号</th><th style="width:110px">昵称</th>' +
            '<th style="width:120px">手机号</th><th style="width:90px">等级</th><th style="width:100px">累计积分</th>' +
            '<th style="width:100px">当前积分</th><th style="width:110px">累计消费(元)</th><th style="width:130px">注册门店</th>' +
            '<th style="width:110px">注册时间</th><th style="width:90px">状态</th><th style="width:150px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="mbrListBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="mbrListPager" style="flex-shrink:0"></div>' +
    '</div>';
  mbrListRender();
}
function mbrListSetStatus(v, btn) {
  MBR_STATUS = v;
  var tabs = document.querySelectorAll('#mbrStatusTabs .btn-tab');
  tabs.forEach(function (b) { b.classList.toggle('active', b === btn); });
  MBR_LIST_PAGE = 1; mbrListRender();
}
function mbrListQuery() { var i = document.getElementById('mbrListKw'); MBR_KW = i ? i.value.trim() : ''; MBR_LIST_PAGE = 1; mbrListRender(); }
function mbrListReset() { MBR_KW = ''; MBR_STATUS = ''; MBR_LIST_PAGE = 1; var i = document.getElementById('mbrListKw'); if (i) i.value = ''; var tabs = document.querySelectorAll('#mbrStatusTabs .btn-tab'); tabs.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-v') === ''); }); mbrListRender(); }
function mbrListRows() {
  var rows = MEMBERS.slice();
  if (MBR_STATUS) rows = rows.filter(function (m) { return m.status === MBR_STATUS; });
  if (MBR_KW) rows = rows.filter(function (m) { return (m.no + m.nick + m.mobile).indexOf(MBR_KW) >= 0; });
  rows.sort(function (a, b) { return a.no < b.no ? 1 : -1; });
  return rows;
}
function mbrListRender(page) {
  if (page) MBR_LIST_PAGE = page;
  var rows = mbrListRows();
  var pages = Math.ceil(rows.length / MBR_LIST_SIZE) || 1;
  if (MBR_LIST_PAGE > pages) MBR_LIST_PAGE = pages;
  if (MBR_LIST_PAGE < 1) MBR_LIST_PAGE = 1;
  var slice = rows.slice((MBR_LIST_PAGE - 1) * MBR_LIST_SIZE, MBR_LIST_PAGE * MBR_LIST_SIZE);
  var body = document.getElementById('mbrListBody');
  if (!body) return;
  body.innerHTML = slice.map(function (m, i) {
    var st = m.status === '正常' ? msMbrBadge('正常', 'ok') : (m.status === '禁用' ? msMbrBadge('禁用', 'warn') : msMbrBadge('注销', 'info'));
    var lv = m.level === '金卡' ? '<span style="color:#b8860b">' + m.level + '</span>' : m.level;
    var op = '';
    op += '<button class="ic-op-link" onclick="mbrListEdit(\'' + m.no + '\')">编辑</button>';
    if (m.status === '正常') op += '<button class="ic-op-link" style="color:#e6a23c" onclick="mbrListToggle(\'' + m.no + '\',\'禁用\')">禁用</button>';
    if (m.status === '禁用') op += '<button class="ic-op-link" style="color:#67c23a" onclick="mbrListToggle(\'' + m.no + '\',\'正常\')">启用</button>';
    if (m.status !== '注销') op += '<button class="ic-op-link" style="color:#f56c6c" onclick="mbrListLogout(\'' + m.no + '\')">注销</button>';
    return '<tr><td style="text-align:center;color:#999">' + ((MBR_LIST_PAGE - 1) * MBR_LIST_SIZE + i + 1) + '</td>' +
      '<td>' + m.no + '</td><td>' + msMbrEsc(m.nick) + '</td><td>' + m.mobile + '</td><td>' + lv + '</td>' +
      '<td style="text-align:right">' + m.points + '</td><td style="text-align:right">' + m.balance + '</td>' +
      '<td style="text-align:right">¥' + m.cost.toFixed(2) + '</td><td>' + msMbrStoreName(m.storeId) + '</td>' +
      '<td>' + m.regDate + '</td><td>' + st + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="12" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msMbrPager(rows.length, MBR_LIST_PAGE, MBR_LIST_SIZE, 'mbrListPager', 'mbrListRender');
}
function mbrListToggle(no, to) {
  var m = null; MEMBERS.forEach(function (x) { if (x.no === no) m = x; });
  if (!m) return;
  m.status = to;
  mbrListPersist(); msMbrToast('会员 ' + no + ' 已' + (to === '禁用' ? '禁用' : '启用')); mbrListRender();
}
function mbrListLogout(no) {
  var m = null; MEMBERS.forEach(function (x) { if (x.no === no) m = x; });
  if (!m) return;
  msMbrModal({ title: '注销会员 · ' + no, width: 'min(460px,94vw)', body:
    '<div style="font-size:13px;color:#0b1019;margin-bottom:6px">确认注销该会员？</div>' +
    '<div style="font-size:12px;color:#5b6472;line-height:20px">会员 <b>' + msMbrEsc(m.nick) + '</b>（' + no + '）注销后：当前积分 <b>' + m.balance + '</b> 清零，不可再登录消费；注册手机号保留。会员记录不可恢复。</div>',
    onOk: 'mbrListLogoutDo(\'' + no + '\')', okText: '确认注销' });
}
function mbrListLogoutDo(no) {
  var m = null; MEMBERS.forEach(function (x) { if (x.no === no) m = x; });
  if (!m) return;
  m.status = '注销'; m.balance = 0;
  mbrListPersist(); msMbrCloseModal(); msMbrToast('会员 ' + no + ' 已注销'); mbrListRender();
}
function mbrNextNo() {
  var max = 0; MEMBERS.forEach(function (m) { var n = parseInt(m.no.replace('HY', ''), 10); if (n > max) max = n; });
  return 'HY' + (max + 1);
}
function mbrListEdit(no) {
  var m = null;
  if (no) MEMBERS.forEach(function (x) { if (x.no === no) m = x; });
  var isNew = !m;
  if (isNew) m = { no: mbrNextNo(), nick: '', mobile: '', level: '普通', points: 0, balance: 0, cost: 0, storeId: 'S2001', regDate: msMbrDate(Date.now()), status: '正常', lastVisit: '—' };
  var lvOpt = ['普通', '银卡', '金卡'].map(function (l) { return '<option' + (m.level === l ? ' selected' : '') + '>' + l + '</option>'; }).join('');
  var stOpt = ['正常', '禁用'].map(function (s) { return '<option' + (m.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('');
  var storeOpt = ['S2001', 'S2002'].map(function (s) { return '<option value="' + s + '"' + (m.storeId === s ? ' selected' : '') + '>' + msMbrStoreName(s) + '</option>'; }).join('');
  msMbrModal({ title: (isNew ? '新增会员' : '编辑会员 · ' + m.no), width: 'min(640px,94vw)', body:
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;font-size:12px">' +
      '<div><div style="color:#5b6472;margin-bottom:6px">会员号 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" disabled value="' + m.no + '"></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">昵称 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" id="mbrFNick" value="' + msMbrEsc(m.nick) + '" placeholder="请输入昵称"></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">手机号 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" id="mbrFMobile" value="' + msMbrEsc(m.mobile) + '" placeholder="请输入手机号"></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">会员等级</div><select class="ic-input" style="width:100%" id="mbrFLevel">' + lvOpt + '</select></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">注册门店</div><select class="ic-input" style="width:100%" id="mbrFStore">' + storeOpt + '</select></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">状态</div><select class="ic-input" style="width:100%" id="mbrFStatus">' + stOpt + '</select></div>' +
      '<div style="grid-column:1/-1;color:#8a93a3;line-height:18px">累计积分 ' + m.points + ' · 当前积分 ' + m.balance + ' · 累计消费 ¥' + m.cost.toFixed(2) + ' · 注册于 ' + m.regDate + '（积分与消费由交易产生，此处不手工调整）</div>' +
    '</div>',
    onOk: 'mbrListSave(' + (isNew ? 'null' : '\'' + no + '\'') + ')', okText: '保存' });
}
function mbrListSave(no) {
  var nick = (document.getElementById('mbrFNick') || {}).value;
  var mobile = (document.getElementById('mbrFMobile') || {}).value;
  var level = (document.getElementById('mbrFLevel') || {}).value;
  var storeId = (document.getElementById('mbrFStore') || {}).value;
  var status = (document.getElementById('mbrFStatus') || {}).value;
  if (!nick || !mobile) { msMbrToast('请填写昵称与手机号'); return; }
  if (no) {
    var m = null; MEMBERS.forEach(function (x) { if (x.no === no) m = x; });
    if (!m) return;
    m.nick = nick; m.mobile = mobile; m.level = level; m.storeId = storeId; m.status = status;
  } else {
    MEMBERS.unshift({ no: mbrNextNo(), nick: nick, mobile: mobile, level: level, points: 0, balance: 0, cost: 0, storeId: storeId, regDate: msMbrDate(Date.now()), status: '正常', lastVisit: '—' });
  }
  mbrListPersist(); msMbrCloseModal(); msMbrToast(no ? '会员已更新' : '新增会员成功'); mbrListRender();
}
/* ================================================================
 * 2) 会员记录 member-record（Vue Member/Memberrecord.vue：单会员积分概览 + 变动明细）
 * ================================================================ */
var MBR_REC_NO = 'HY2026001';
var POINT_KEY = 'tcm_mbr_points_v1';
var POINT_SEED = [
  { no: 'HY2026001', date: '2026-08-01', type: '注册赠送', delta: 500, balance: 500, remark: '新会员注册赠送' },
  { no: 'HY2026001', date: '2026-08-04', type: '消费获得', delta: 126, balance: 626, remark: '订单 NO202608041203' },
  { no: 'HY2026001', date: '2026-08-06', type: '积分抵扣', delta: -58, balance: 568, remark: '订单 NO202608061077 抵扣 ¥5.80' },
  { no: 'HY2026001', date: '2026-08-11', type: '消费获得', delta: 342, balance: 910, remark: '订单 NO202608113044' },
  { no: 'HY2026001', date: '2026-08-18', type: '兑换扣减', delta: -300, balance: 610, remark: '兑换 抽纸一提（2 卷装）' },
  { no: 'HY2026001', date: '2026-08-25', type: '消费获得', delta: 220, balance: 830, remark: '订单 NO202608257102' },
  { no: 'HY2026001', date: '2026-09-01', type: '消费获得', delta: 185, balance: 1015, remark: '订单 NO20260901088' },
  { no: 'HY2026001', date: '2026-09-02', type: '积分抵扣', delta: -60, balance: 955, remark: '订单 NO202609021132 抵扣 ¥6.00' },
  { no: 'HY2026004', date: '2026-08-03', type: '消费获得', delta: 480, balance: 480, remark: '订单 NO202608032410' },
  { no: 'HY2026004', date: '2026-08-15', type: '兑换扣减', delta: -500, balance: 0, remark: '兑换 金龙鱼调和油 5L' },
  { no: 'HY2026004', date: '2026-08-20', type: '消费获得', delta: 300, balance: 300, remark: '订单 NO20260820915' }
];
var POINTS = [];
function mbrRecLoad() { try { var r = localStorage.getItem(POINT_KEY); if (r) { POINTS = JSON.parse(r); return; } } catch (e) {} POINTS = JSON.parse(JSON.stringify(POINT_SEED)); mbrRecPersist(); }
function mbrRecPersist() { try { localStorage.setItem(POINT_KEY, JSON.stringify(POINTS)); } catch (e) {} }
function mbrRecMember(no) { var m = null; MEMBERS.forEach(function (x) { if (x.no === no) m = x; }); return m; }
function mbrRecInit() {
  mbrListLoad(); mbrRecLoad();
  var el = document.getElementById('member-recordContent');
  if (!el) { setTimeout(mbrRecInit, 80); return; }
  var opt = MEMBERS.map(function (m) { return '<option value="' + m.no + '"' + (m.no === MBR_REC_NO ? ' selected' : '') + '>' + m.no + ' · ' + msMbrEsc(m.nick) + '</option>'; }).join('');
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">会员：</span>' +
      '<select class="ic-search" style="flex:0 1 260px" id="mbrRecSel" onchange="mbrRecSwitch(this.value)">' + opt + '</select>' +
      '<span style="font-size:12px;color:#8a93a3">选择会员后展示其积分概览与变动明细</span>' +
      '<span style="flex:1"></span>' +
      '<span style="font-size:12px;color:#8a93a3">范围：' + msMbrScopeStoreLabel() + '</span>' +
    '</div>' +
    '<div style="flex-shrink:0;margin:10px 10px 0;display:grid;grid-template-columns:repeat(5,1fr);gap:10px" id="mbrRecCards"></div>' +
    '<div style="flex:1;min-height:0;margin:10px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:860px">' +
          '<thead><tr><th style="width:120px">发生时间</th><th style="width:130px">类型</th><th style="width:110px">积分变动</th>' +
          '<th style="width:110px">变动后积分</th><th>说明 / 关联单号</th></tr></thead>' +
          '<tbody id="mbrRecBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="mbrRecPager" style="flex-shrink:0"></div>' +
    '</div>';
  mbrRecRender();
}
function mbrRecSwitch(no) { MBR_REC_NO = no; mbrRecRender(); }
function mbrRecCards(no) {
  var m = mbrRecMember(no);
  var rows = POINTS.filter(function (p) { return p.no === no; });
  var earned = 0; rows.forEach(function (p) { if (p.delta > 0) earned += p.delta; });
  var card = function (label, val, color, sub) {
    return '<div style="background:#fff;border:1px solid #e9eef7;border-radius:6px;padding:12px 16px"><div style="font-size:12px;color:#8a93a3">' + label + '</div>' +
      '<div style="font-size:20px;font-weight:700;color:' + color + ';margin-top:6px">' + val + '</div>' +
      (sub ? '<div style="font-size:11px;color:#b6bdc9;margin-top:4px">' + sub + '</div>' : '') + '</div>';
  };
  var el = document.getElementById('mbrRecCards');
  if (!el) return;
  el.innerHTML =
    card('会员', '<span style="font-size:15px;color:#0b1019">' + (m ? msMbrEsc(m.nick) : no) + '</span>', '#0b1019', '会员号 ' + no + ' · ' + (m ? m.mobile : '')) +
    card('累计积分', m ? m.points : 0, '#1677ff', '历史累计获得') +
    card('当前积分', m ? m.balance : 0, '#67c23a', '可用余额') +
    card('积分抵扣', m ? ('¥' + Math.round((m.balance || 0) * 0.1) + '.00') : '¥0.00', '#e6a23c', '按 10 积分抵 1 元') +
    card('注册时间', m ? m.regDate : '—', '#5b6472', '等级 ' + (m ? m.level : '—'));
}
function mbrRecRender(page) {
  if (page) MBR_REC_PAGE = page;
  mbrRecCards(MBR_REC_NO);
  var rows = POINTS.filter(function (p) { return p.no === MBR_REC_NO; }).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var size = 10;
  var pages = Math.ceil(rows.length / size) || 1;
  if (!MBR_REC_PAGE || MBR_REC_PAGE > pages) MBR_REC_PAGE = 1;
  var slice = rows.slice((MBR_REC_PAGE - 1) * size, MBR_REC_PAGE * size);
  var body = document.getElementById('mbrRecBody');
  if (!body) return;
  body.innerHTML = slice.map(function (p) {
    var t = { '注册赠送': 'blue', '消费获得': 'ok', '积分抵扣': 'err', '兑换扣减': 'warn', '手动调整': 'info', '过期作废': 'info' }[p.type] || 'info';
    var d = p.delta > 0 ? '<span style="color:#fc4b52">+' + p.delta + '</span>' : '<span style="color:#3eb27e">' + p.delta + '</span>';
    return '<tr><td>' + p.date + '</td><td>' + msMbrBadge(p.type, t) + '</td><td style="text-align:right">' + d + '</td><td style="text-align:right">' + p.balance + '</td><td style="color:#5b6472">' + msMbrEsc(p.remark) + '</td></tr>';
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:#909399;padding:40px">该会员暂无积分变动记录</td></tr>';
  msMbrPager(rows.length, MBR_REC_PAGE, size, 'mbrRecPager', 'mbrRecRender');
}
var MBR_REC_PAGE = 1;

/* ================================================================
 * 3) 权益商城 member-store（Vue Member/Memberstore.vue：优惠券/商品券/虚拟物品）
 * ================================================================ */
var STORE_PAGE = 1, STORE_SIZE = 10, STORE_KW = '', STORE_TYPE = '';
var STORE_KEY = 'tcm_mbr_store_v1';
var STORE_SEED = [
  { id: 'b-01', type: '优惠券', name: '满 50 减 5 券', sub: '全场通用满减券', points: 500, stock: 200, rule: '每单限用 1 张；兑换后 30 天有效', status: '启用', emoji: '🎫' },
  { id: 'b-02', type: '优惠券', name: '满 100 减 12 券', sub: '全场通用满减券', points: 1000, stock: 100, rule: '每单限用 1 张；兑换后 30 天有效', status: '启用', emoji: '🎫' },
  { id: 'b-03', type: '商品券', name: '土鸡蛋 30 枚装', sub: '正大肉品 · 30枚/盒', points: 1800, stock: 30, rule: '到店自提；限 7 天内核销', status: '启用', emoji: '🥚' },
  { id: 'b-04', type: '商品券', name: '光明鲜牛奶 950ml', sub: '光明乳业 · 950ml/盒', points: 600, stock: 80, rule: '到店自提；限 3 天内核销', status: '启用', emoji: '🥛' },
  { id: 'b-05', type: '虚拟物品', name: '停车券 2 小时', sub: '门店停车场免费 2 小时', points: 300, stock: 999, rule: '兑换后 7 天内使用，出场时出示', status: '启用', emoji: '🅿️' },
  { id: 'b-06', type: '虚拟物品', name: '环保购物袋', sub: '加厚无纺布购物袋 1 只', points: 150, stock: 500, rule: '到服务台领取', status: '启用', emoji: '👜' },
  { id: 'b-07', type: '优惠券', name: '第二件半价券', sub: '烘焙区指定商品', points: 800, stock: 0, rule: '兑换后 14 天有效；指定商品以券面为准', status: '禁用', emoji: '🎫' },
  { id: 'b-08', type: '商品券', name: '金龙鱼调和油 5L', sub: '益海嘉里 · 5L/瓶', points: 4500, stock: 15, rule: '到店自提；限 7 天内核销', status: '启用', emoji: '🛢️' }
];
var STORE_RIGHTS = [];
function storeLoad() { try { var r = localStorage.getItem(STORE_KEY); if (r) { STORE_RIGHTS = JSON.parse(r); return; } } catch (e) {} STORE_RIGHTS = JSON.parse(JSON.stringify(STORE_SEED)); storePersist(); }
function storePersist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE_RIGHTS)); } catch (e) {} }
function storeInit() {
  storeLoad();
  var el = document.getElementById('member-storeContent');
  if (!el) { setTimeout(storeInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">权益类型：</span>' +
      '<div style="display:flex;gap:0" id="storeTypeTabs">' +
        '<button class="btn-tab active" data-v="" onclick="storeSetType(\'\',this)">全部</button>' +
        '<button class="btn-tab" data-v="优惠券" onclick="storeSetType(\'优惠券\',this)">优惠券</button>' +
        '<button class="btn-tab" data-v="商品券" onclick="storeSetType(\'商品券\',this)">商品券</button>' +
        '<button class="btn-tab" data-v="虚拟物品" onclick="storeSetType(\'虚拟物品\',this)">虚拟物品</button>' +
      '</div>' +
      '<input class="ic-search" style="flex:0 1 200px" placeholder="权益名称" value="' + msMbrEsc(STORE_KW) + '" onkeydown="if(event.key===\'Enter\')storeQuery()" id="storeKw">' +
      '<button class="ic-btn" onclick="storeReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="storeQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="storeEdit(null)">＋ 新增权益</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1040px">' +
          '<thead><tr><th style="width:54px">序号</th><th style="width:120px">权益图片</th><th style="width:150px">权益名称</th>' +
          '<th style="width:90px">类型</th><th style="width:160px">关联内容</th><th style="width:110px">所需积分</th>' +
          '<th style="width:100px">兑换库存</th><th>兑换规则</th><th style="width:90px">状态</th><th style="width:140px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="storeBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="storePager" style="flex-shrink:0"></div>' +
    '</div>';
  storeRender();
}
function storeSetType(v, btn) {
  STORE_TYPE = v;
  var tabs = document.querySelectorAll('#storeTypeTabs .btn-tab');
  tabs.forEach(function (b) { b.classList.toggle('active', b === btn); });
  STORE_PAGE = 1; storeRender();
}
function storeQuery() { var i = document.getElementById('storeKw'); STORE_KW = i ? i.value.trim() : ''; STORE_PAGE = 1; storeRender(); }
function storeReset() { STORE_KW = ''; STORE_TYPE = ''; STORE_PAGE = 1; var i = document.getElementById('storeKw'); if (i) i.value = ''; var tabs = document.querySelectorAll('#storeTypeTabs .btn-tab'); tabs.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-v') === ''); }); storeRender(); }
function storeRows() {
  var rows = STORE_RIGHTS.slice();
  if (STORE_TYPE) rows = rows.filter(function (r) { return r.type === STORE_TYPE; });
  if (STORE_KW) rows = rows.filter(function (r) { return (r.name + r.sub).indexOf(STORE_KW) >= 0; });
  return rows;
}
function storeRender(page) {
  if (page) STORE_PAGE = page;
  var rows = storeRows();
  var pages = Math.ceil(rows.length / STORE_SIZE) || 1;
  if (STORE_PAGE > pages) STORE_PAGE = pages;
  if (STORE_PAGE < 1) STORE_PAGE = 1;
  var slice = rows.slice((STORE_PAGE - 1) * STORE_SIZE, STORE_PAGE * STORE_SIZE);
  var body = document.getElementById('storeBody');
  if (!body) return;
  body.innerHTML = slice.map(function (r, i) {
    var op = '<button class="ic-op-link" onclick="storeEdit(\'' + r.id + '\')">编辑</button>';
    op += r.status === '启用'
      ? '<button class="ic-op-link" style="color:#e6a23c" onclick="storeToggle(\'' + r.id + '\')">禁用</button>'
      : '<button class="ic-op-link" style="color:#67c23a" onclick="storeToggle(\'' + r.id + '\')">启用</button>';
    return '<tr><td style="text-align:center;color:#999">' + ((STORE_PAGE - 1) * STORE_SIZE + i + 1) + '</td>' +
      '<td><div style="width:64px;height:64px;border-radius:6px;background:#f2f6ff;border:1px solid #e3ecff;display:flex;align-items:center;justify-content:center;font-size:28px">' + r.emoji + '</div></td>' +
      '<td>' + msMbrEsc(r.name) + '</td><td>' + msMbrBadge(r.type, r.type === '优惠券' ? 'blue' : (r.type === '商品券' ? 'ok' : 'gold')) + '</td>' +
      '<td style="color:#5b6472">' + msMbrEsc(r.sub) + '</td><td style="text-align:right;color:#1677ff;font-weight:600">' + r.points + '</td>' +
      '<td style="text-align:right">' + (r.stock === 0 ? '<span style="color:#f56c6c">已兑完</span>' : r.stock) + '</td>' +
      '<td style="color:#8a93a3">' + msMbrEsc(r.rule) + '</td>' +
      '<td>' + (r.status === '启用' ? msMbrBadge('启用', 'ok') : msMbrBadge('禁用', 'info')) + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msMbrPager(rows.length, STORE_PAGE, STORE_SIZE, 'storePager', 'storeRender');
}
function storeToggle(id) {
  var r = null; STORE_RIGHTS.forEach(function (x) { if (x.id === id) r = x; });
  if (!r) return;
  r.status = r.status === '启用' ? '禁用' : '启用';
  storePersist(); msMbrToast('权益「' + r.name + '」已' + r.status); storeRender();
}
function storeEdit(id) {
  var r = null;
  if (id) STORE_RIGHTS.forEach(function (x) { if (x.id === id) r = x; });
  var isNew = !r;
  if (isNew) r = { id: 'b-' + Date.now(), type: '优惠券', name: '', sub: '', points: 100, stock: 0, rule: '', status: '启用', emoji: '🎫' };
  var typeOpt = ['优惠券', '商品券', '虚拟物品'].map(function (t) { return '<option' + (r.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('');
  var stOpt = ['启用', '禁用'].map(function (s) { return '<option' + (r.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('');
  msMbrModal({ title: (isNew ? '新增权益' : '编辑权益'), width: 'min(720px,94vw)', body:
    '<div style="display:flex;gap:16px">' +
      '<div style="flex-shrink:0"><div style="width:148px;height:148px;border:1px dashed #c9d3e0;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8a93a3;font-size:12px;gap:4px;cursor:pointer;background:#fafbfc" onclick="storeEmojiPick()"><span style="font-size:30px" id="storeEmojiPrev">' + r.emoji + '</span>点击选择图标</div></div>' +
      '<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;font-size:12px">' +
        '<div style="grid-column:1/-1"><div style="color:#5b6472;margin-bottom:6px">权益名称 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" id="storeFName" value="' + msMbrEsc(r.name) + '" placeholder="请输入权益名称"></div>' +
        '<div><div style="color:#5b6472;margin-bottom:6px">权益类型</div><select class="ic-input" style="width:100%" id="storeFType" onchange="storeTypeHint()">' + typeOpt + '</select></div>' +
        '<div><div style="color:#5b6472;margin-bottom:6px">状态</div><select class="ic-input" style="width:100%" id="storeFStatus">' + stOpt + '</select></div>' +
        '<div style="grid-column:1/-1"><div style="color:#5b6472;margin-bottom:6px">关联内容 <span style="color:#fc4b52">*</span><span style="color:#b6bdc9;margin-left:6px" id="storeTypeHint">优惠券模板 / 商品范围 / 虚拟物品说明</span></div><input class="ic-input" style="width:100%" id="storeFSub" value="' + msMbrEsc(r.sub) + '" placeholder="请输入关联内容"></div>' +
        '<div><div style="color:#5b6472;margin-bottom:6px">所需积分 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" id="storeFPoints" type="number" min="0" value="' + r.points + '"></div>' +
        '<div><div style="color:#5b6472;margin-bottom:6px">兑换库存</div><input class="ic-input" style="width:100%" id="storeFStock" type="number" min="0" value="' + r.stock + '"></div>' +
        '<div style="grid-column:1/-1"><div style="color:#5b6472;margin-bottom:6px">兑换规则</div><input class="ic-input" style="width:100%" id="storeFRule" value="' + msMbrEsc(r.rule) + '" placeholder="如：每单限兑 1 份；兑换后 X 天有效"></div>' +
      '</div>' +
    '</div>',
    onOk: 'storeSave(' + (isNew ? 'null' : '\'' + r.id + '\'') + ')', okText: '保存' });
  var prev = document.getElementById('storeEmojiPrev'); if (prev) prev.textContent = r.emoji;
  window.__storeEmoji = r.emoji;
}
function storeEmojiPick() {
  var emojis = ['🎫', '🥚', '🥛', '🛢️', '🅿️', '👜', '🍎', '🧻', '🎁', '🍚', '🧴', '☕'];
  msMbrModal({ title: '选择权益图标', width: 'min(460px,94vw)', body:
    '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px" id="emojiGrid">' +
    emojis.map(function (e) { return '<div style="height:52px;display:flex;align-items:center;justify-content:center;font-size:26px;border:1px solid #e9eef7;border-radius:6px;cursor:pointer;background:#fff" onclick="storeEmojiSet(\'' + e + '\')">' + e + '</div>'; }).join('') + '</div>',
    onOk: 'msMbrCloseModal()', okText: '关闭', cancelText: '' });
}
function storeEmojiSet(e) { window.__storeEmoji = e; var p = document.getElementById('storeEmojiPrev'); if (p) p.textContent = e; msMbrCloseModal(); }
function storeTypeHint() {
  var t = (document.getElementById('storeFType') || {}).value;
  var h = document.getElementById('storeTypeHint');
  if (h) h.textContent = t === '优惠券' ? '选择优惠券模板（如：满 50 减 5 券）' : (t === '商品券' ? '商品名称 / 规格范围' : '虚拟物品说明');
}
function storeSave(id) {
  var name = (document.getElementById('storeFName') || {}).value;
  var type = (document.getElementById('storeFType') || {}).value;
  var status = (document.getElementById('storeFStatus') || {}).value;
  var sub = (document.getElementById('storeFSub') || {}).value;
  var points = parseInt((document.getElementById('storeFPoints') || {}).value, 10) || 0;
  var stock = parseInt((document.getElementById('storeFStock') || {}).value, 10) || 0;
  var rule = (document.getElementById('storeFRule') || {}).value;
  if (!name || !sub) { msMbrToast('请填写权益名称与关联内容'); return; }
  if (id) {
    var r = null; STORE_RIGHTS.forEach(function (x) { if (x.id === id) r = x; });
    if (!r) return;
    r.name = name; r.type = type; r.status = status; r.sub = sub; r.points = points; r.stock = stock; r.rule = rule; r.emoji = window.__storeEmoji || r.emoji;
  } else {
    STORE_RIGHTS.unshift({ id: 'b-' + Date.now(), type: type, name: name, sub: sub, points: points, stock: stock, rule: rule, status: '启用', emoji: window.__storeEmoji || '🎫' });
  }
  storePersist(); msMbrCloseModal(); msMbrToast(id ? '权益已更新' : '新增权益成功'); storeRender();
}

/* ================================================================
 * 4) 兑换记录 member-exchange（Vue Member/Exchangerecord.vue）
 * ================================================================ */
var EXCH_PAGE = 1, EXCH_SIZE = 10, EXCH_RANGE = 90, EXCH_STATUS = '';
var EXCH_KEY = 'tcm_mbr_exch_v1';
var EXCH_SEED = [
  { exNo: 'DH20260901001', no: 'HY2026001', rightName: '满 50 减 5 券', type: '优惠券', points: 500, date: '2026-09-01 09:12', status: '已兑换', ticket: '未使用', storeId: 'S2001' },
  { exNo: 'DH20260901002', no: 'HY2026004', rightName: '光明鲜牛奶 950ml', type: '商品券', points: 600, date: '2026-09-01 10:40', status: '已兑换', ticket: '已使用', storeId: 'S2001' },
  { exNo: 'DH20260901003', no: 'HY2026009', rightName: '停车券 2 小时', type: '虚拟物品', points: 300, date: '2026-09-01 15:26', status: '已兑换', ticket: '未使用', storeId: 'S2001' },
  { exNo: 'DH20260831001', no: 'HY2026002', rightName: '满 100 减 12 券', type: '优惠券', points: 1000, date: '2026-08-31 18:03', status: '已兑换', ticket: '已使用', storeId: 'S2002' },
  { exNo: 'DH20260830001', no: 'HY2026008', rightName: '环保购物袋', type: '虚拟物品', points: 150, date: '2026-08-30 11:20', status: '已兑换', ticket: '已使用', storeId: 'S2002' },
  { exNo: 'DH20260828001', no: 'HY2026001', rightName: '土鸡蛋 30 枚装', type: '商品券', points: 1800, date: '2026-08-28 16:44', status: '已兑换', ticket: '已作废', storeId: 'S2001' },
  { exNo: 'DH20260825001', no: 'HY2026006', rightName: '满 50 减 5 券', type: '优惠券', points: 500, date: '2026-08-25 09:02', status: '已兑换', ticket: '已使用', storeId: 'S2001' },
  { exNo: 'DH20260820001', no: 'HY2026003', rightName: '停车券 2 小时', type: '虚拟物品', points: 300, date: '2026-08-20 13:35', status: '已兑换', ticket: '已使用', storeId: 'S2002' },
  { exNo: 'DH20260815001', no: 'HY2026009', rightName: '金龙鱼调和油 5L', type: '商品券', points: 4500, date: '2026-08-15 10:11', status: '已兑换', ticket: '未使用', storeId: 'S2001' },
  { exNo: 'DH20260810001', no: 'HY2026002', rightName: '环保购物袋', type: '虚拟物品', points: 150, date: '2026-08-10 17:52', status: '已兑换', ticket: '已使用', storeId: 'S2001' },
  { exNo: 'DH20260728001', no: 'HY2026010', rightName: '满 50 减 5 券', type: '优惠券', points: 500, date: '2026-07-28 12:09', status: '已兑换', ticket: '已使用', storeId: 'S2002' },
  { exNo: 'DH20260618001', no: 'HY2026011', rightName: '土鸡蛋 30 枚装', type: '商品券', points: 1800, date: '2026-06-18 14:27', status: '已兑换', ticket: '已作废', storeId: 'S2001' },
  { exNo: 'DH20260505001', no: 'HY2026007', rightName: '满 100 减 12 券', type: '优惠券', points: 1000, date: '2026-05-05 10:58', status: '已兑换', ticket: '已使用', storeId: 'S2001' },
  { exNo: 'DH20260620001', no: 'HY2026005', rightName: '环保购物袋', type: '虚拟物品', points: 150, date: '2026-06-20 15:31', status: '未兑换', ticket: '—', storeId: 'S2002' },
  { exNo: 'DH20260701001', no: 'HY2026003', rightName: '停车券 2 小时', type: '虚拟物品', points: 300, date: '2026-07-01 11:16', status: '未兑换', ticket: '—', storeId: 'S2002' }
];
var EXCH = [];
function exchLoad() { try { var r = localStorage.getItem(EXCH_KEY); if (r) { EXCH = JSON.parse(r); return; } } catch (e) {} EXCH = JSON.parse(JSON.stringify(EXCH_SEED)); exchPersist(); }
function exchPersist() { try { localStorage.setItem(EXCH_KEY, JSON.stringify(EXCH)); } catch (e) {} }
function exchInit() {
  mbrListLoad(); exchLoad();
  var el = document.getElementById('member-exchangeContent');
  if (!el) { setTimeout(exchInit, 80); return; }
  var now = Date.now();
  var rangeOpt = [{ v: 7, l: '近7天' }, { v: 30, l: '近30天' }, { v: 90, l: '近90天' }, { v: 0, l: '全部' }].map(function (r) {
    return '<button class="btn-tab' + (EXCH_RANGE === r.v ? ' active' : '') + '" onclick="exchSetRange(' + r.v + ',this)">' + r.l + '</button>';
  }).join('');
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">兑换时长：</span>' +
      '<div style="display:flex;gap:0" id="exchRangeTabs">' + rangeOpt + '</div>' +
      '<span style="width:1px;height:18px;background:#e2e6ee"></span>' +
      '<span style="font-size:12px;color:#3a4252">状态：</span>' +
      '<select class="ic-search" style="flex:0 1 140px" onchange="exchSetStatus(this.value)">' +
        '<option value="">全部状态</option><option value="已兑换"' + (EXCH_STATUS === '已兑换' ? ' selected' : '') + '>已兑换</option><option value="未兑换"' + (EXCH_STATUS === '未兑换' ? ' selected' : '') + '>未兑换</option>' +
      '</select>' +
      '<button class="ic-btn" onclick="exchReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="exchRender()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<span style="font-size:12px;color:#8a93a3">已兑换含券/凭证状态：未使用 · 已使用 · 已作废</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:980px">' +
          '<thead><tr><th style="width:54px">序号</th><th style="width:150px">兑换单号</th><th style="width:130px">会员</th>' +
          '<th style="width:200px">权益名称</th><th style="width:90px">类型</th><th style="width:110px">消耗积分</th>' +
          '<th style="width:130px">兑换时间</th><th style="width:100px">兑换状态</th><th style="width:110px">券/凭证状态</th><th style="width:130px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="exchBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="exchPager" style="flex-shrink:0"></div>' +
    '</div>';
  exchRender();
}
function exchSetRange(v, btn) {
  EXCH_RANGE = v; EXCH_PAGE = 1;
  var tabs = document.querySelectorAll('#exchRangeTabs .btn-tab');
  tabs.forEach(function (b) { b.classList.toggle('active', b === btn); });
  exchRender();
}
function exchSetStatus(v) { EXCH_STATUS = v; EXCH_PAGE = 1; exchRender(); }
function exchReset() { EXCH_STATUS = ''; EXCH_RANGE = 90; EXCH_PAGE = 1; var s = document.querySelector('#member-exchangeContent select'); if (s) s.value = ''; var tabs = document.querySelectorAll('#exchRangeTabs .btn-tab'); tabs.forEach(function (b, i) { b.classList.toggle('active', i === 2); }); exchRender(); }
function exchRows() {
  var cutoff = EXCH_RANGE > 0 ? Date.now() - EXCH_RANGE * 86400000 : 0;
  return EXCH.filter(function (r) {
    var t = new Date(r.date.replace(' ', 'T')).getTime();
    if (cutoff && t < cutoff) return false;
    if (EXCH_STATUS && r.status !== EXCH_STATUS) return false;
    return true;
  }).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}
function exchRender(page) {
  if (page) EXCH_PAGE = page;
  var rows = exchRows();
  var pages = Math.ceil(rows.length / EXCH_SIZE) || 1;
  if (EXCH_PAGE > pages) EXCH_PAGE = pages;
  if (EXCH_PAGE < 1) EXCH_PAGE = 1;
  var slice = rows.slice((EXCH_PAGE - 1) * EXCH_SIZE, EXCH_PAGE * EXCH_SIZE);
  var body = document.getElementById('exchBody');
  if (!body) return;
  body.innerHTML = slice.map(function (r, i) {
    var m = mbrRecMember(r.no);
    var tBadge = r.type === '优惠券' ? msMbrBadge(r.type, 'blue') : (r.type === '商品券' ? msMbrBadge(r.type, 'ok') : msMbrBadge(r.type, 'gold'));
    var ticket = r.status === '未兑换' ? '<span style="color:#909399">—</span>' : (r.ticket === '未使用' ? msMbrBadge('未使用', 'blue') : (r.ticket === '已使用' ? msMbrBadge('已使用', 'info') : msMbrBadge('已作废', 'err')));
    var op = '';
    if (r.status === '已兑换' && r.ticket === '未使用') op += '<button class="ic-op-link" style="color:#e6a23c" onclick="exchVoid(\'' + r.exNo + '\')">作废</button>';
    if (r.status === '未兑换') op += '<button class="ic-op-link" onclick="exchRedeem(\'' + r.exNo + '\')">补兑换</button>';
    if (!op) op = '<span style="color:#c9cfdb">—</span>';
    return '<tr><td style="text-align:center;color:#999">' + ((EXCH_PAGE - 1) * EXCH_SIZE + i + 1) + '</td>' +
      '<td>' + r.exNo + '</td><td>' + msMbrEsc((m ? m.nick : '') + '') + '<div style="font-size:11px;color:#b6bdc9">' + r.no + (m ? ' · ' + m.mobile : '') + '</div></td>' +
      '<td>' + msMbrEsc(r.rightName) + '</td><td>' + tBadge + '</td><td style="text-align:right;color:#1677ff;font-weight:600">' + r.points + '</td>' +
      '<td>' + r.date + '</td><td>' + (r.status === '已兑换' ? msMbrBadge('已兑换', 'ok') : msMbrBadge('未兑换', 'warn')) + '</td>' +
      '<td>' + ticket + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:#909399;padding:40px">该时间范围内暂无兑换记录</td></tr>';
  msMbrPager(rows.length, EXCH_PAGE, EXCH_SIZE, 'exchPager', 'exchRender');
}
function exchVoid(exNo) {
  var r = null; EXCH.forEach(function (x) { if (x.exNo === exNo) r = x; });
  if (!r) return;
  msMbrModal({ title: '作废兑换 · ' + exNo, width: 'min(460px,94vw)', body:
    '<div style="font-size:13px;color:#0b1019;margin-bottom:6px">确认作废该兑换单？</div>' +
    '<div style="font-size:12px;color:#5b6472;line-height:20px">权益 <b>' + msMbrEsc(r.rightName) + '</b> 的券/凭证将标记为「已作废」，<span style="color:#e6a23c">已消耗积分不退回</span>。请先在收银端完成线下核销沟通。</div>',
    onOk: 'exchVoidDo(\'' + exNo + '\')', okText: '确认作废' });
}
function exchVoidDo(exNo) {
  var r = null; EXCH.forEach(function (x) { if (x.exNo === exNo) r = x; });
  if (!r) return;
  r.ticket = '已作废'; exchPersist(); msMbrCloseModal(); msMbrToast('兑换单 ' + exNo + ' 已作废'); exchRender();
}
function exchRedeem(exNo) {
  var r = null; EXCH.forEach(function (x) { if (x.exNo === exNo) r = x; });
  if (!r) return;
  r.status = '已兑换'; r.ticket = '未使用'; exchPersist(); msMbrToast('兑换单 ' + exNo + ' 已补记为已兑换'); exchRender();
}
/* ================================================================
 * 5) 会员配置 member-activate（Vue Member/Activation.vue：开通/积分规则 + 下载会员码）
 * ================================================================ */
var CFG_KEY = 'tcm_mbr_cfg_v1';
var CFG_SEED = {
  company: '好滋味餐饮', enable: true, nick: '会员', regPoints: 500,
  payPer: 1, payUnit: '分', noRegiftOnRereg: true, deductOn: true,
  deductMode: 'fixed', fixedVal: 5, ratioVal: 10, maxVal: 20
};
var MBR_CFG = null;
function cfgLoad() { try { var r = localStorage.getItem(CFG_KEY); if (r) { MBR_CFG = JSON.parse(r); return; } } catch (e) {} MBR_CFG = JSON.parse(JSON.stringify(CFG_SEED)); cfgPersist(); }
function cfgPersist() { try { localStorage.setItem(CFG_KEY, JSON.stringify(MBR_CFG)); } catch (e) {} }
function cfgInit() {
  cfgLoad();
  var el = document.getElementById('member-activateContent');
  if (!el) { setTimeout(cfgInit, 80); return; }
  var c = MBR_CFG;
  var field = function (label, inner, hint, wide) {
    return '<div' + (wide ? ' style="grid-column:1/-1"' : '') + '><div style="color:#5b6472;margin-bottom:6px">' + label + '</div>' + inner + (hint ? '<div style="font-size:11px;color:#b6bdc9;margin-top:4px">' + hint + '</div>' : '') + '</div>';
  };
  var on = ' style="accent-color:#1677ff"';
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">企业：</span>' +
      '<span style="font-size:13px;font-weight:600;color:#0b1019">' + msMbrEsc(c.company) + '</span>' +
      '<span style="font-size:12px;color:#8a93a3">会员开通与积分/抵扣规则将作用于旗下全部门店</span>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="cfgDownload()">⤓ 下载会员码</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;overflow:auto;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start">' +
      '<div style="background:#fff;border:1px solid #e9eef7;border-radius:6px;padding:16px 20px">' +
        '<div style="font-size:14px;font-weight:600;color:#0b1019;border-left:3px solid #005cf5;padding-left:8px;margin-bottom:14px">会员开通与积分</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px">' +
          field('开通会员', '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#3a4252"><input type="checkbox" id="cfgFEnable"' + (c.enable ? ' checked' : '') + on + '> 允许顾客注册开通会员</label>') +
          field('会员昵称', '<input class="ic-input" style="width:100%" id="cfgFNick" value="' + msMbrEsc(c.nick) + '">', '新会员默认昵称，可后续修改', true) +
          field('注册积分', '<input class="ic-input" style="width:100%" id="cfgFReg" type="number" min="0" value="' + c.regPoints + '">', '新会员注册时赠送积分') +
          field('支付积分', '<input class="ic-input" style="width:100%" id="cfgFPay" type="number" min="0" value="' + c.payPer + '">', '顾客付款 1 元可获得积分') +
          field('二次注册', '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#3a4252"><input type="checkbox" id="cfgFRereg"' + (c.noRegiftOnRereg ? ' checked' : '') + on + '> 注销后二次注册不再赠送积分</label>', '', true) +
        '</div>' +
      '</div>' +
      '<div style="background:#fff;border:1px solid #e9eef7;border-radius:6px;padding:16px 20px">' +
        '<div style="font-size:14px;font-weight:600;color:#0b1019;border-left:3px solid #005cf5;padding-left:8px;margin-bottom:14px">积分抵扣设置</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px">' +
          field('积分抵扣', '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#3a4252"><input type="checkbox" id="cfgFDeductOn"' + (c.deductOn ? ' checked' : '') + on + '> 收银时允许积分抵扣金额</label>', '', true) +
          field('抵扣方式', '<select class="ic-input" style="width:100%" id="cfgFMode" onchange="cfgModeHint()">' +
            '<option value="fixed"' + (c.deductMode === 'fixed' ? ' selected' : '') + '>按固定金额</option>' +
            '<option value="ratio"' + (c.deductMode === 'ratio' ? ' selected' : '') + '>按订单金额比例</option></select>') +
          field('抵扣值', '<input class="ic-input" style="width:100%" id="cfgFVal" type="number" min="0" value="' + c.fixedVal + '">', '<span id="cfgValHint">每笔订单固定抵扣 ' + c.fixedVal + ' 元</span>') +
          field('按订单比例', '<input class="ic-input" style="width:100%" id="cfgFRatio" type="number" min="0" max="100" value="' + c.ratioVal + '">', '订单金额的 ' + c.ratioVal + '%') +
          field('最大可抵扣金额', '<input class="ic-input" style="width:100%" id="cfgFMax" type="number" min="0" value="' + c.maxVal + '">', '每笔订单抵扣上限（元），两种方式通用', true) +
        '</div>' +
      '</div>' +
      '<div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;background:#fff;border:1px solid #e9eef7;border-radius:6px;padding:12px 20px">' +
        '<button class="ic-btn" onclick="cfgReset()">恢复默认</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="cfgSave()">保存配置</button>' +
      '</div>' +
    '</div>';
  cfgModeHint();
}
function cfgModeHint() {
  var v = (document.getElementById('cfgFMode') || {}).value;
  var h = document.getElementById('cfgValHint');
  var ratioBox = document.getElementById('cfgFRatio');
  if (h) h.textContent = v === 'fixed' ? '每笔订单固定抵扣（元）' : '每笔订单按订单金额抵扣（%）';
  if (ratioBox) ratioBox.parentElement.parentElement.style.display = v === 'fixed' ? 'none' : '';
}
function cfgVal() { return { company: MBR_CFG.company, enable: (document.getElementById('cfgFEnable') || {}).checked, nick: (document.getElementById('cfgFNick') || {}).value, regPoints: parseInt((document.getElementById('cfgFReg') || {}).value, 10) || 0, payPer: parseInt((document.getElementById('cfgFPay') || {}).value, 10) || 0, noRegiftOnRereg: (document.getElementById('cfgFRereg') || {}).checked, deductOn: (document.getElementById('cfgFDeductOn') || {}).checked, deductMode: (document.getElementById('cfgFMode') || {}).value, fixedVal: parseFloat((document.getElementById('cfgFVal') || {}).value) || 0, ratioVal: parseFloat((document.getElementById('cfgFRatio') || {}).value) || 0, maxVal: parseFloat((document.getElementById('cfgFMax') || {}).value) || 0 }; }
function cfgSave() {
  var v = cfgVal();
  if (!v.nick) { msMbrToast('请填写会员昵称'); return; }
  if (v.maxVal <= 0 && v.deductOn) { msMbrToast('请设置最大可抵扣金额（大于 0）'); return; }
  MBR_CFG = v; cfgPersist(); msMbrToast('会员配置已保存');
}
function cfgReset() {
  msMbrModal({ title: '恢复默认配置', width: 'min(460px,94vw)', body: '<div style="font-size:13px;color:#0b1019">确认将开通/积分/抵扣规则恢复为系统默认值？</div>', onOk: 'cfgResetDo()', okText: '确认恢复' });
}
function cfgResetDo() { MBR_CFG = JSON.parse(JSON.stringify(CFG_SEED)); cfgPersist(); msMbrCloseModal(); cfgInit(); msMbrToast('已恢复默认配置'); }
function cfgDownload() {
  cfgSave();
  var c = MBR_CFG;
  var cells = '';
  for (var y = 0; y < 9; y++) { for (var x = 0; x < 9; x++) { var on = ((x * 7 + y * 13 + ((x + y) % 3)) % 2 === 0) && !((x === 4 && y === 4) || (x === 4 && y === 5) || (x === 5 && y === 4)); cells += '<span style="width:10px;height:10px;background:' + (on ? '#0b1019' : '#fff') + '"></span>'; } }
  msMbrModal({ title: '会员码 · ' + msMbrEsc(c.company), width: 'min(400px,94vw)', body:
    '<div style="display:flex;flex-direction:column;align-items:center;padding:8px 0">' +
      '<div style="padding:14px;border:1px solid #e9eef7;border-radius:8px;background:#fff;display:grid;grid-template-columns:repeat(9,10px);gap:1px">' + cells + '</div>' +
      '<div style="font-size:12px;color:#5b6472;margin-top:10px">企业会员码 · 顾客微信扫码注册</div>' +
      '<div style="font-size:13px;font-weight:600;color:#0b1019;margin-top:2px">' + msMbrEsc(c.company) + '</div>' +
      '<div style="font-size:12px;color:#8a93a3;margin-top:8px;line-height:18px;text-align:center">开通会员赠送 ' + c.regPoints + ' 积分 · 每 ¥1 得 ' + c.payPer + ' 积分<br>' + (c.deductOn ? '积分抵扣已开启（单笔最高 ¥' + c.maxVal + '）' : '积分抵扣未开启') + '</div>' +
    '</div>',
    onOk: 'msMbrCloseModal()', okText: '关闭', cancelText: '' });
}

/* ================================================================
 * 6) 会员价计划 member-price（Vue Member/Goodsplan.vue + Newplan.vue + Membergoods.vue）
 * ================================================================ */
var PLAN_PAGE = 1, PLAN_SIZE = 10, PLAN_KW = '', PLAN_STORE = '', PLAN_STATUS = '';
var PLAN_KEY = 'tcm_mbr_plans_v1';
var PLAN_GOODS_POOL = [
  { code: '6901234500017', name: '娃娃菜', spec: '500g/份', price: 5.6 }, { code: '6901234500024', name: '上海青', spec: '400g/份', price: 4.5 },
  { code: '6901234500048', name: '土豆', spec: '称重', price: 3.4 }, { code: '6901234500055', name: '西红柿', spec: '称重', price: 5.1 },
  { code: '6901234500062', name: '五花肉', spec: '称重', price: 24.5 }, { code: '6901234500079', name: '土鸡蛋', spec: '30枚/盒', price: 18.8 },
  { code: '6901234500086', name: '草鱼', spec: '称重', price: 13.2 }, { code: '6901234500093', name: '红富士苹果', spec: '称重', price: 7.6 },
  { code: '6901234500116', name: '光明鲜牛奶', spec: '950ml/盒', price: 11.9 }, { code: '6901234500123', name: '思念水饺', spec: '1kg/袋', price: 21.5 }
];
var PLAN_SEED = [
  { id: 'p1', no: 'MP202608001', name: '开学季蔬菜会员价', storeId: 'S2001', start: '2026-08-25', end: '2026-09-15', status: '进行中', goods: [{ code: '6901234500017', name: '娃娃菜', spec: '500g/份' }, { code: '6901234500024', name: '上海青', spec: '400g/份' }, { code: '6901234500055', name: '西红柿', spec: '称重' }], rules: [{ level: '普通会员', mode: '会员价', val: '4.9' }, { level: '金卡会员', mode: '会员价', val: '4.5' }] },
  { id: 'p2', no: 'MP202608002', name: '中秋肉蛋会员专享', storeId: 'S2001', start: '2026-09-05', end: '2026-09-25', status: '进行中', goods: [{ code: '6901234500062', name: '五花肉', spec: '称重' }, { code: '6901234500079', name: '土鸡蛋', spec: '30枚/盒' }], rules: [{ level: '银卡会员', mode: '折扣', val: '95' }, { level: '金卡会员', mode: '折扣', val: '92' }] },
  { id: 'p3', no: 'MP202607011', name: '夏季饮品冰品价', storeId: 'S2002', start: '2026-07-01', end: '2026-08-31', status: '已关闭', goods: [{ code: '6901234500116', name: '光明鲜牛奶', spec: '950ml/盒' }], rules: [{ level: '普通会员', mode: '折扣', val: '97' }] },
  { id: 'p4', no: 'MP202608003', name: '松江店水产日', storeId: 'S2002', start: '2026-08-28', end: '2026-09-10', status: '已暂停', goods: [{ code: '6901234500086', name: '草鱼', spec: '称重' }], rules: [{ level: '金卡会员', mode: '立减', val: '2' }] },
  { id: 'p5', no: 'MP202608004', name: '粮油囤货节', storeId: 'S2001', start: '2026-08-20', end: '2026-09-08', status: '进行中', goods: [{ code: '6901234500123', name: '思念水饺', spec: '1kg/袋' }, { code: '6901234500048', name: '土豆', spec: '称重' }, { code: '6901234500093', name: '红富士苹果', spec: '称重' }], rules: [{ level: '普通会员', mode: '折扣', val: '96' }, { level: '银卡会员', mode: '折扣', val: '93' }, { level: '金卡会员', mode: '折扣', val: '90' }] }
];
var PLANS = [];
function planLoad() { try { var r = localStorage.getItem(PLAN_KEY); if (r) { PLANS = JSON.parse(r); return; } } catch (e) {} PLANS = JSON.parse(JSON.stringify(PLAN_SEED)); planPersist(); }
function planPersist() { try { localStorage.setItem(PLAN_KEY, JSON.stringify(PLANS)); } catch (e) {} }
function planRuleTxt(rs) { return (rs || []).map(function (r) { return r.level.replace('会员', '') + (r.mode === '折扣' ? r.val + '折' : (r.mode === '立减' ? '减¥' + r.val : '¥' + r.val)); }).join(' · '); }
function planStatusBadge(s) { return s === '进行中' ? msMbrBadge('进行中', 'ok') : (s === '已暂停' ? msMbrBadge('已暂停', 'warn') : msMbrBadge('已关闭', 'info')); }
function planInit() {
  planLoad();
  var el = document.getElementById('member-priceContent');
  if (!el) { setTimeout(planInit, 80); return; }
  var stOpt = ['', '进行中', '已暂停', '已关闭'].map(function (s) { return '<option value="' + s + '"' + (PLAN_STATUS === s ? ' selected' : '') + '>' + (s || '全部状态') + '</option>'; }).join('');
  var stSelOpt = ['', 'S2001', 'S2002'].map(function (s) { return '<option value="' + s + '"' + (PLAN_STORE === s ? ' selected' : '') + '>' + (s ? msMbrStoreName(s) : '全部门店') + '</option>'; }).join('');
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="活动名称" value="' + msMbrEsc(PLAN_KW) + '" onkeydown="if(event.key===\'Enter\')planQuery()" id="planKw">' +
      '<select class="ic-search" style="flex:0 1 150px" id="planStoreSel" onchange="planSetStore(this.value)">' + stSelOpt + '</select>' +
      '<select class="ic-search" style="flex:0 1 130px" id="planStatusSel" onchange="planSetStatus(this.value)">' + stOpt + '</select>' +
      '<button class="ic-btn" onclick="planReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="planQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<span style="font-size:12px;color:#8a93a3">会员价 = 会员等级价（结算时自动按价签规则取最低价）</span>' +
      '<button class="ic-btn ic-btn-pri" onclick="planEdit(null)">＋ 新增计划</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1060px">' +
          '<thead><tr><th style="width:54px">序号</th><th style="width:130px">计划编号</th><th style="width:170px">活动名称</th>' +
          '<th style="width:140px">活动门店</th><th style="width:200px">活动日期</th><th style="width:90px">商品数</th>' +
          '<th style="width:230px">会员价规则</th><th style="width:90px">状态</th><th style="width:170px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="planBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="planPager" style="flex-shrink:0"></div>' +
    '</div>';
  planRender();
}
function planQuery() { var i = document.getElementById('planKw'); PLAN_KW = i ? i.value.trim() : ''; PLAN_PAGE = 1; planRender(); }
function planSetStore(v) { PLAN_STORE = v; PLAN_PAGE = 1; planRender(); }
function planSetStatus(v) { PLAN_STATUS = v; PLAN_PAGE = 1; planRender(); }
function planReset() { PLAN_KW = ''; PLAN_STORE = ''; PLAN_STATUS = ''; PLAN_PAGE = 1; var i = document.getElementById('planKw'); if (i) i.value = ''; var s1 = document.getElementById('planStoreSel'); if (s1) s1.value = ''; var s2 = document.getElementById('planStatusSel'); if (s2) s2.value = ''; planRender(); }
function planRows() {
  return PLANS.filter(function (p) {
    if (PLAN_STATUS && p.status !== PLAN_STATUS) return false;
    if (PLAN_STORE && p.storeId !== PLAN_STORE) return false;
    if (PLAN_KW && p.name.indexOf(PLAN_KW) < 0) return false;
    return true;
  }).slice().sort(function (a, b) { return a.no < b.no ? 1 : -1; });
}
function planRender(page) {
  if (page) PLAN_PAGE = page;
  var rows = planRows();
  var pages = Math.ceil(rows.length / PLAN_SIZE) || 1;
  if (PLAN_PAGE > pages) PLAN_PAGE = pages;
  if (PLAN_PAGE < 1) PLAN_PAGE = 1;
  var slice = rows.slice((PLAN_PAGE - 1) * PLAN_SIZE, PLAN_PAGE * PLAN_SIZE);
  var body = document.getElementById('planBody');
  if (!body) return;
  body.innerHTML = slice.map(function (p, i) {
    var op = '<button class="ic-op-link" onclick="planEdit(\'' + p.id + '\')">编辑</button>';
    if (p.status === '进行中') op += '<button class="ic-op-link" style="color:#e6a23c" onclick="planSet(\'' + p.id + '\',\'已暂停\')">暂停</button><button class="ic-op-link" style="color:#909399" onclick="planSet(\'' + p.id + '\',\'已关闭\')">关闭</button>';
    else if (p.status === '已暂停') op += '<button class="ic-op-link" style="color:#67c23a" onclick="planSet(\'' + p.id + '\',\'进行中\')">恢复</button><button class="ic-op-link" style="color:#909399" onclick="planSet(\'' + p.id + '\',\'已关闭\')">关闭</button>';
    op += '<button class="ic-op-link" style="color:#f56c6c" onclick="planDel(\'' + p.id + '\')">删除</button>';
    return '<tr><td style="text-align:center;color:#999">' + ((PLAN_PAGE - 1) * PLAN_SIZE + i + 1) + '</td>' +
      '<td>' + p.no + '</td><td>' + msMbrEsc(p.name) + '</td><td>' + msMbrStoreName(p.storeId) + '</td>' +
      '<td>' + p.start + ' ~ ' + p.end + '</td><td style="text-align:right">' + (p.goods || []).length + '</td>' +
      '<td style="color:#5b6472">' + msMbrEsc(planRuleTxt(p.rules)) + '</td><td>' + planStatusBadge(p.status) + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="9" style="text-align:center;color:#909399;padding:40px">暂无计划</td></tr>';
  msMbrPager(rows.length, PLAN_PAGE, PLAN_SIZE, 'planPager', 'planRender');
}
function planSet(id, to) {
  var p = null; PLANS.forEach(function (x) { if (x.id === id) p = x; });
  if (!p) return;
  p.status = to; planPersist(); msMbrToast('计划「' + p.name + '」已' + (to === '进行中' ? '恢复进行' : to)); planRender();
}
function planDel(id) {
  var p = null; PLANS.forEach(function (x) { if (x.id === id) p = x; });
  if (!p) return;
  msMbrModal({ title: '删除计划 · ' + p.no, width: 'min(460px,94vw)', body: '<div style="font-size:13px;color:#0b1019;margin-bottom:6px">确认删除该会员价计划？</div><div style="font-size:12px;color:#5b6472;line-height:20px">计划「' + msMbrEsc(p.name) + '」删除后，会员结算将不再应用其价格规则。已产生的历史订单不受影响。</div>', onOk: 'planDelDo(\'' + id + '\')', okText: '确认删除' });
}
function planDelDo(id) {
  var idx = -1; PLANS.forEach(function (x, i) { if (x.id === id) idx = i; });
  if (idx < 0) return;
  PLANS.splice(idx, 1); planPersist(); msMbrCloseModal(); msMbrToast('计划已删除'); planRender();
}
// —— 计划编辑弹窗（含商品选择 & 规则设置，对齐 Newplan.vue）——
var PLAN_EDIT_ID = null, PLAN_EDIT_GOODS = [], PLAN_EDIT_RULES = [], PLAN_EDIT_DRAFT = {}, PLAN_EDIT_NO = '';
function planEdit(id) {
  var p = null;
  if (id) PLANS.forEach(function (x) { if (x.id === id) p = x; });
  var isNew = !p;
  if (isNew) p = { id: 'p' + Date.now(), no: 'MP' + msMbrDate(Date.now()).replace(/-/g, '').substring(0, 6) + String(PLANS.length + 1).padStart(3, '0'), name: '', storeId: 'S2001', start: '', end: '', status: '进行中', goods: [], rules: [] };
  PLAN_EDIT_ID = id || null;
  PLAN_EDIT_GOODS = JSON.parse(JSON.stringify(p.goods || []));
  PLAN_EDIT_RULES = JSON.parse(JSON.stringify(p.rules || []));
  if (!PLAN_EDIT_RULES.length) PLAN_EDIT_RULES = [{ level: '普通会员', mode: '会员价', val: '' }];
  PLAN_EDIT_DRAFT = { name: p.name, storeId: p.storeId, start: p.start, end: p.end };
  PLAN_EDIT_NO = p.no;
  planModalBody();
}
function planModalBody() {
  var p = PLAN_EDIT_DRAFT || { name: '', storeId: 'S2001', start: '', end: '' };
  var no = PLAN_EDIT_NO || '';
  var stOpt = ['S2001', 'S2002'].map(function (s) { return '<option value="' + s + '"' + (p.storeId === s ? ' selected' : '') + '>' + msMbrStoreName(s) + '</option>'; }).join('');
  var goodsHtml = PLAN_EDIT_GOODS.map(function (g, i) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #e9eef7;border-radius:4px;margin-bottom:6px;background:#fafbfc">' +
      '<span style="flex:1;font-size:12px;color:#0b1019">' + msMbrEsc(g.name) + '<span style="color:#b6bdc9"> · ' + msMbrEsc(g.spec) + '</span></span>' +
      '<span style="font-size:11px;color:#b6bdc9">' + g.code + '</span>' +
      '<button class="ic-op-link" style="color:#f56c6c" onclick="planModalRemoveGoods(' + i + ')">移除</button></div>';
  }).join('') || '<div style="font-size:12px;color:#b6bdc9;padding:8px 0">尚未添加活动商品</div>';
  var rulesHtml = PLAN_EDIT_RULES.map(function (r, i) {
    var lvOpt = ['普通会员', '银卡会员', '金卡会员'].map(function (l) { return '<option' + (r.level === l ? ' selected' : '') + '>' + l + '</option>'; }).join('');
    var mdOpt = ['会员价', '折扣', '立减'].map(function (m) { return '<option' + (r.mode === m ? ' selected' : '') + '>' + m + '</option>'; }).join('');
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
      '<select class="ic-input" style="flex:0 1 120px" onchange="planModalRule(' + i + ',\'level\',this.value)">' + lvOpt + '</select>' +
      '<select class="ic-input" style="flex:0 1 100px" onchange="planModalRule(' + i + ',\'mode\',this.value)">' + mdOpt + '</select>' +
      '<input class="ic-input" style="flex:1" value="' + msMbrEsc(r.val) + '" placeholder="' + (r.mode === '折扣' ? '如 95 = 95 折' : (r.mode === '立减' ? '立减金额（元）' : '会员价（元）')) + '" oninput="planModalRule(' + i + ',\'val\',this.value)">' +
      '<button class="ic-op-link" style="color:#f56c6c" onclick="planModalDelRule(' + i + ')">移除</button></div>';
  }).join('');
  msMbrModal({ title: (PLAN_EDIT_ID ? '编辑计划 · ' + no : '新增会员价计划'), width: 'min(820px,94vw)', bodyStyle: 'max-height:62vh;overflow:auto',
    body:
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;margin-bottom:14px">' +
      '<div><div style="color:#5b6472;margin-bottom:6px">活动名称 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" id="planFName" value="' + msMbrEsc(p.name) + '" placeholder="请输入活动名称" oninput="planModalField(\'name\',this.value)"></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">活动门店 <span style="color:#fc4b52">*</span></div><select class="ic-input" style="width:100%" id="planFStore" onchange="planModalField(\'storeId\',this.value)">' + stOpt + '</select></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">开始日期 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" type="date" id="planFStart" value="' + p.start + '" onchange="planModalField(\'start\',this.value)"></div>' +
      '<div><div style="color:#5b6472;margin-bottom:6px">结束日期 <span style="color:#fc4b52">*</span></div><input class="ic-input" style="width:100%" type="date" id="planFEnd" value="' + p.end + '" onchange="planModalField(\'end\',this.value)"></div>' +
    '</div>' +
    '<div style="font-size:13px;font-weight:600;color:#0b1019;border-left:3px solid #005cf5;padding-left:8px;margin:12px 0 8px">活动商品（' + PLAN_EDIT_GOODS.length + '）</div>' + goodsHtml +
    '<div style="margin-bottom:14px"><button class="ic-btn" onclick="planModalPickGoods()">＋ 添加商品</button></div>' +
    '<div style="font-size:13px;font-weight:600;color:#0b1019;border-left:3px solid #005cf5;padding-left:8px;margin:12px 0 8px">会员价规则</div>' +
    '<div id="planRulesBox">' + rulesHtml + '</div>' +
    '<div style="margin:8px 0 4px"><button class="ic-btn" onclick="planModalAddRule()">＋ 设置规则</button>' +
    '<span style="font-size:11px;color:#b6bdc9;margin-left:8px">会员价=直接填价；折扣=95 即 95 折；立减=每 kg/份减（元）。多等级并存时取对会员最有利价。</span></div>',
    onOk: 'planSave()', okText: '保存计划' });
}
function planModalRule(i, k, v) { if (PLAN_EDIT_RULES[i]) PLAN_EDIT_RULES[i][k] = v; }
function planModalField(k, v) { if (PLAN_EDIT_DRAFT) PLAN_EDIT_DRAFT[k] = v; }
function planModalAddRule() { PLAN_EDIT_RULES.push({ level: '普通会员', mode: '折扣', val: '' }); planModalBody(); }
function planModalDelRule(i) { PLAN_EDIT_RULES.splice(i, 1); planModalBody(); }
function planModalRemoveGoods(i) { PLAN_EDIT_GOODS.splice(i, 1); planModalBody(); }
function planModalPickGoods() {
  var exist = PLAN_EDIT_GOODS.map(function (g) { return g.code; });
  var rows = PLAN_GOODS_POOL.filter(function (g) { return exist.indexOf(g.code) < 0; });
  var grid = '<div style="max-height:300px;overflow:auto;border:1px solid #e9eef7;border-radius:4px">' +
    '<table style="width:100%"><thead><tr><th style="width:44px"></th><th style="width:200px">商品名称</th><th style="width:140px">规格</th><th style="width:150px">标准价(元)</th></tr></thead><tbody>' +
    rows.map(function (g, i) {
      return '<tr data-code="' + g.code + '"><td style="text-align:center"><input type="checkbox" class="planPickCb" value="' + g.code + '"></td><td>' + msMbrEsc(g.name) + '</td><td>' + msMbrEsc(g.spec) + '</td><td>¥' + g.price.toFixed(2) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  if (!rows.length) grid = '<div style="padding:24px;text-align:center;color:#909399;font-size:12px">商品池中暂无未添加商品</div>';
  msMbrModal({ title: '添加活动商品', width: 'min(680px,94vw)', body: grid, onOk: 'planPickConfirm()', okText: '加入计划', cancelText: '取消' });
}
function planPickConfirm() {
  var cbs = document.querySelectorAll('.planPickCb:checked');
  var added = 0;
  cbs.forEach(function (cb) {
    var code = cb.value;
    var g = null; PLAN_GOODS_POOL.forEach(function (x) { if (x.code === code) g = x; });
    if (!g) return;
    var dup = false; PLAN_EDIT_GOODS.forEach(function (x) { if (x.code === code) dup = true; });
    if (!dup) { PLAN_EDIT_GOODS.push({ code: g.code, name: g.name, spec: g.spec }); added++; }
  });
  msMbrCloseModal(); msMbrToast(added ? '已加入 ' + added + ' 个商品' : '未选择新商品');
  if (added) planModalBody();
}
function planSave() {
  var name = (document.getElementById('planFName') || {}).value;
  var storeId = (document.getElementById('planFStore') || {}).value;
  var start = (document.getElementById('planFStart') || {}).value;
  var end = (document.getElementById('planFEnd') || {}).value;
  if (!name) { msMbrToast('请填写活动名称'); return; }
  if (!start || !end) { msMbrToast('请选择活动日期'); return; }
  if (start > end) { msMbrToast('开始日期不能晚于结束日期'); return; }
  if (!PLAN_EDIT_GOODS.length) { msMbrToast('请至少添加一个活动商品'); return; }
  var ruleOk = PLAN_EDIT_RULES.every(function (r) { return r.val !== '' && r.val != null; });
  if (!ruleOk) { msMbrToast('请补全会员价规则数值'); return; }
  var nameDup = PLANS.some(function (x) { return x.name === name && x.id !== PLAN_EDIT_ID; });
  if (nameDup) { msMbrToast('已存在同名活动计划'); return; }
  if (PLAN_EDIT_ID) {
    var p = null; PLANS.forEach(function (x) { if (x.id === PLAN_EDIT_ID) p = x; });
    if (!p) return;
    p.name = name; p.storeId = storeId; p.start = start; p.end = end; p.goods = JSON.parse(JSON.stringify(PLAN_EDIT_GOODS)); p.rules = JSON.parse(JSON.stringify(PLAN_EDIT_RULES));
    if (p.status === '已关闭') p.status = '进行中';
  } else {
    var now = msMbrDate(Date.now()).replace(/-/g, '');
    PLANS.unshift({ id: 'p' + Date.now(), no: 'MP' + now + String(PLANS.length + 1).padStart(3, '0'), name: name, storeId: storeId, start: start, end: end, status: '进行中', goods: JSON.parse(JSON.stringify(PLAN_EDIT_GOODS)), rules: JSON.parse(JSON.stringify(PLAN_EDIT_RULES)) });
  }
  planPersist(); msMbrCloseModal(); msMbrToast(PLAN_EDIT_ID ? '计划已更新' : '新增计划成功'); planRender();
}

// 页面初始化分发（由各页面 HTML 底部调用）
function initMemberPage(pid) {
  if (pid === 'member-list') mbrListInit();
  else if (pid === 'member-record') mbrRecInit();
  else if (pid === 'member-store') storeInit();
  else if (pid === 'member-exchange') exchInit();
  else if (pid === 'member-activate') cfgInit();
  else if (pid === 'member-price') planInit();
}


