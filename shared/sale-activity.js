// ========== PAGE: 打折活动 (Sale Activity) ==========
// 依赖：layout.js 中的 GL_MOCK_DATA / GOODS_CATEGORIES / getCategoryName / getVisibleCategories / showToast / escapeHtml
var SA_KEY = 'SA_ACTIVITIES_v1';
var SA_DATA = [];
var SA_FILTER_STATUS = '';   // ''=全部, running=进行中, pending=未开始, ended=已结束, disabled=已停用（基于 saEffectiveStatus 动态状态）
var SA_FILTER_TYPE = '';     // ''=全部, discount=时段折扣, fixed=商品一口价
var SA_FILTER_KEYWORD = '';
var SA_FILTER_STORE = '';   // ''=全部门店，否则门店 shopId
var SA_PAGE = 1;
var SA_PAGE_SIZE = 10;
var SA_EDIT_ID = null;       // 编辑中的活动 id（null=新增）
var SA_EDIT_SCOPE = 'goods'; // 弹窗范围类型: goods | category
var SA_EDIT_GOODS = {};      // 选中商品 id -> true
var SA_EDIT_CATS = {};       // 选中分类 id -> true
var SA_EDIT_DATETYPE = 'daily';
var SA_EDIT_MODE = 'discount'; // 活动类型: discount(时段折扣) | fixed(商品一口价)
var SA_EDIT_TIMETYPE = 'allday'; // 一口价模式生效方式: allday(全天生效) | slots(指定时段)
var SA_EDIT_PRICES = {};     // 一口价模式：商品id -> 目标售价(字符串)，商品/分类范围统一使用
var SA_EDIT_CATPRICE = '';   // 一口价模式：旧版分类统一售价(字符串)，仅用于数据迁移兼容
var SA_EDIT_AUDIENCE = 'all'; // 适用人群: all(全部顾客) | member(仅会员) | new(仅新人)
var SA_EDIT_LIMITTYPE = 'none'; // 购买限制: none(不限购) | per(每人限购N件)
var SA_EDIT_LIMITN = 2;       // 每人限购件数
var SA_GOODS_KW = '';        // 弹窗内商品搜索词
var SA_CHECKED = {};         // 列表选中活动 id -> true（批量操作）
// 演示用买家身份（结算演示），真实系统应由登录态决定 member/newUser
var SA_DEMO_BUYER = { member: true, newUser: false };

// 立即从 localStorage 加载活动数据（供打折活动页之外的页面如商品列表计算折后价）
saLoad();

// ===== 数据加载 / 持久化（localStorage，演示态） =====
function saLoad() {
  try {
    var raw = localStorage.getItem(SA_KEY);
    if (raw) { SA_DATA = JSON.parse(raw); return; }
  } catch (e) {}
  SA_DATA = saSeed();
  saPersist();
}
function saPersist() {
  try { localStorage.setItem(SA_KEY, JSON.stringify(SA_DATA)); } catch (e) {}
}
// 预置示例活动
function saSeed() {
  return [
    {
      id: 'sa-demo-1',
      name: '早市分时段折扣',
      scopeType: 'category',
      categoryIds: ['c1', 'c2', 'c3'],
      goodsIds: [],
      slots: [
        { start: '07:30', end: '08:00', discount: 7 },
        { start: '08:00', end: '08:30', discount: 6 },
        { start: '08:30', end: '09:00', discount: 5 }
      ],
      dateType: 'daily',
      dateStart: '', dateEnd: '',
      status: '1',
      storeId: 'S2001',
      createdAt: '2026-05-20 09:15'
    },
    {
      id: 'sa-demo-2',
      name: '晚间生鲜清仓',
      scopeType: 'goods',
      goodsIds: ['g-21', 'g-22', 'g-17'],
      categoryIds: [],
      slots: [{ start: '20:00', end: '21:00', discount: 8 }],
      dateType: 'daily',
      dateStart: '', dateEnd: '',
      status: '1',
      storeId: 'S2002',
      createdAt: '2026-05-22 16:40'
    },
    {
      id: 'sa-demo-3',
      name: '会员日特惠',
      scopeType: 'category',
      categoryIds: ['c6', 'c8'],
      goodsIds: [],
      slots: [{ start: '09:00', end: '12:00', discount: 9 }],
      dateType: 'range',
      dateStart: '2026-08-01', dateEnd: '2026-08-31',
      status: '0',
      storeId: 'S2003',
      createdAt: '2026-07-28 10:02'
    },
    {
      id: 'sa-demo-4',
      name: '生鲜直供一口价',
      mode: 'fixed',
      timeType: 'allday',
      scopeType: 'goods',
      categoryIds: [],
      goodsIds: ['g-21', 'g-22', 'g-17'],
      priceMap: { 'g-21': 3.50, 'g-22': 5.90, 'g-17': 9.90 },
      slots: [],
      dateType: 'daily',
      dateStart: '', dateEnd: '',
      status: '1',
      storeId: 'S2004',
      createdAt: '2026-07-30 11:20'
    }
  ];
}

// ===== 辅助函数 =====
// 门店下拉选项（复用 layout.js 的 STORE_DATA）
function saStoreOptions(selected) {
  var opts = '<option value="">全部门店</option>';
  if (typeof STORE_DATA !== 'undefined') {
    STORE_DATA.forEach(function(s) {
      opts += '<option value="' + s.shopId + '"' + (s.shopId === selected ? ' selected' : '') + '>' + escapeHtml(s.shopShortName) + '</option>';
    });
  }
  return opts;
}
// 门店名展示
function saStoreName(id) {
  if (!id) return '<span style="color:#c0c4cc">-</span>';
  if (typeof STORE_DATA === 'undefined') return escapeHtml(id);
  var f = STORE_DATA.filter(function(s){ return s.shopId === id; })[0];
  return f ? escapeHtml(f.shopShortName) : escapeHtml(id);
}
function saCountByCategory(catId) {
  if (typeof GL_MOCK_DATA === 'undefined') return 0;
  return GL_MOCK_DATA.filter(function(it) { return it.categoryId === catId; }).length;
}
// 活动覆盖的商品数（分类模式展开统计）
function saCoverCount(act) {
  var n = 0;
  if (act.scopeType === 'goods') {
    n = act.goodsIds.length;
  } else {
    (act.categoryIds || []).forEach(function(cid) { n += saCountByCategory(cid); });
  }
  return n;
}
// 折扣数字格式化：7 -> "7折"，7.5 -> "7.5折"
function saFmtDisc(d) {
  var v = parseFloat(d);
  if (isNaN(v)) return '';
  return (String(v).replace(/\.0$/, '')) + '折';
}
function saSlotSummary(slots) {
  if (!slots || !slots.length) return '<span style="color:#c0c4cc">-</span>';
  return slots.map(function(s) {
    return '<span class="sa-slot-tag">' + escapeHtml(s.start) + '-' + escapeHtml(s.end) + ' <b>' + saFmtDisc(s.discount) + '</b></span>';
  }).join('');
}
// 列表「定价/折扣」列通用展示：discount 显示时段折扣，fixed 显示一口价
function saPriceSummary(act) {
  if (act.mode === 'fixed') {
    var slotInfo = '';
    if (act.timeType === 'slots' && act.slots && act.slots.length) {
      slotInfo = act.slots.map(function(s) {
        return '<span class="sa-slot-tag">' + escapeHtml(s.start) + '-' + escapeHtml(s.end) + '</span>';
      }).join('');
    } else {
      slotInfo = '<span class="sa-slot-tag">全天</span>';
    }
    var pm = act.priceMap || {};
    var ids = Object.keys(pm);
    var tag;
    if (!ids.length) {
      // 兼容旧版分类统一售价
      if (act.categoryPrice != null && act.categoryPrice !== '') tag = '分类一口价 <b>¥' + parseFloat(act.categoryPrice).toFixed(2) + '</b>';
      else tag = '未设价';
    } else if (act.scopeType === 'category') {
      var vals = ids.map(function(id) { return parseFloat(pm[id]); }).filter(function(v) { return !isNaN(v); });
      var lo = vals.length ? Math.min.apply(null, vals) : null;
      tag = '分类一口价 · ' + ids.length + ' 个分类';
      if (lo != null) tag += '（¥' + lo.toFixed(2) + ' 起）';
    } else {
      var vals = ids.map(function(id) { return parseFloat(pm[id]); }).filter(function(v) { return !isNaN(v); });
      var lo = vals.length ? Math.min.apply(null, vals) : null;
      tag = '商品一口价 · ' + ids.length + ' 件';
      if (lo != null) tag += '（¥' + lo.toFixed(2) + ' 起）';
    }
    // 适用人群 / 购买限制 标签
    var extra = '';
    if (act.audience === 'member') extra += '<span class="sa-slot-tag" style="background:#f3e5f5;color:#8e24aa;border-color:#e1bee7">仅会员</span>';
    else if (act.audience === 'new') extra += '<span class="sa-slot-tag" style="background:#e8f5e9;color:#2e7d32;border-color:#c8e6c9">仅新人</span>';
    if (act.limitType === 'per' && act.limitN) extra += '<span class="sa-slot-tag" style="background:#fff3e0;color:#e65100;border-color:#ffe0b2">限购' + act.limitN + '件</span>';
    return '<span class="sa-slot-tag">' + tag + '</span>' + slotInfo + extra;
  }
  return saSlotSummary(act.slots);
}
function saScopeText(act) {
  if (act.scopeType === 'category') {
    var cats = (act.categoryIds || []).map(function(cid) { return getCategoryName(cid); });
    return '<span class="sa-scope-tag sa-scope-cat">' + cats.map(escapeHtml).join('</span><span class="sa-scope-tag sa-scope-cat">') + '</span>' +
      '<span style="color:#999;font-size:12px;margin-left:6px">共 ' + saCoverCount(act) + ' 个商品</span>';
  }
  var goods = (act.goodsIds || []).map(function(gid) {
    var it = (typeof GL_MOCK_DATA !== 'undefined') ? GL_MOCK_DATA.find(function(g) { return g.goodsId === gid; }) : null;
    return it ? it.goodsName : gid;
  });
  var head = goods.slice(0, 3).map(escapeHtml).join('、');
  var more = goods.length > 3 ? ' 等 ' + goods.length + ' 个商品' : (goods.length ? '（' + goods.length + ' 个商品）' : '');
  return '<span style="font-size:12px">' + head + '</span>' + '<span style="color:#999;font-size:12px">' + more + '</span>';
}
function saDateText(act) {
  if (act.dateType === 'range') {
    return '<span style="font-size:12px">' + escapeHtml(act.dateStart) + ' ~ ' + escapeHtml(act.dateEnd) + '</span>';
  }
  return '<span style="font-size:12px">每天生效</span>';
}
function saNow() {
  var d = new Date();
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

// 活动实时生效状态（派生，不存库）
//  disabled=手动停用  running=进行中  pending=未开始  ended=已结束  idle=今日未到时段
function saEffectiveStatus(act, when) {
  when = when || new Date();
  if (!act) return 'disabled';
  if (act.status === '0') return 'disabled';
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  var today = when.getFullYear() + '-' + p(when.getMonth() + 1) + '-' + p(when.getDate());
  if (act.dateType === 'range') {
    if (today < act.dateStart) return 'pending';
    if (today > act.dateEnd) return 'ended';
  }
  if (act.mode === 'fixed') {
    if (act.timeType === 'slots') {
      var curHM2 = p(when.getHours()) + ':' + p(when.getMinutes());
      var running2 = false;
      (act.slots || []).forEach(function(s) {
        if (curHM2 >= s.start && curHM2 < s.end) running2 = true;
      });
      return running2 ? 'running' : 'idle';
    }
    return 'running'; // 一口价全天生效（启用且在日期内）
  }
  var curHM = p(when.getHours()) + ':' + p(when.getMinutes());
  var running = false;
  (act.slots || []).forEach(function(s) {
    if (curHM >= s.start && curHM < s.end) running = true;
  });
  return running ? 'running' : 'idle';
}

// 状态 badge 渲染
function saStatusBadge(act) {
  var eff = saEffectiveStatus(act);
  if (eff === 'disabled') return '<span class="gl-tag gl-tag-danger">已停用</span>';
  if (eff === 'running') return '<span class="gl-tag gl-tag-success">进行中</span>';
  if (eff === 'pending') return '<span class="gl-tag gl-tag-info">未开始</span>';
  if (eff === 'ended') return '<span class="gl-tag gl-tag-muted">已结束</span>';
  return '<span class="gl-tag gl-tag-warning">今日未到时段</span>';
}

// 结束日期距今天数（今天 00:00 起算）；无结束日期返回 null
function saDaysLeft(dateEnd) {
  if (!dateEnd) return null;
  var d = new Date(dateEnd + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  var t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}

// 过期 / 临近结束提醒（状态列内追加小标）：按结束日期计算，与是否当前处于折扣时段无关
function saExpireHint(a) {
  var eff = saEffectiveStatus(a);
  if (eff === 'disabled') return '';          // 已停用不显示过期提醒
  if (a.dateType === 'range' && a.dateEnd) {
    var days = saDaysLeft(a.dateEnd);
    if (days == null) return '';
    if (days < 0) return '<div style="margin-top:4px;font-size:11px;color:#f56c6c;line-height:1.4">已过期</div>';
    if (days <= 3) return '<div style="margin-top:4px;font-size:11px;color:#f56c6c;line-height:1.4">剩 ' + days + ' 天</div>';
    return '<div style="margin-top:4px;font-size:11px;color:#909399;line-height:1.4">剩 ' + days + ' 天</div>';
  }
  return '';
}

// 当前时刻最低折扣（读取弹窗内已配置的时段）
function saCurrentMinDiscount() {
  var rows = document.querySelectorAll('#saSlotsList .sa-slot-row');
  var min = 99;
  rows.forEach(function(r) {
    var d = parseFloat(r.querySelector('.sa-slot-disc').value);
    if (!isNaN(d) && d > 0 && d < min) min = d;
  });
  return min === 99 ? null : min;
}

// 弹窗底部实时折后价汇总
function saPreviewHtml(min) {
  var scopeCount, goodsCount;
  if (SA_EDIT_SCOPE === 'goods') {
    var ids = Object.keys(SA_EDIT_GOODS);
    scopeCount = ids.length; goodsCount = ids.length;
  } else {
    var catIds = Object.keys(SA_EDIT_CATS);
    scopeCount = catIds.length;
    goodsCount = catIds.reduce(function(s, c) { return s + saCountByCategory(c); }, 0);
  }
  var txt = '参与范围：' + (SA_EDIT_SCOPE === 'goods' ? scopeCount + ' 个商品' : scopeCount + ' 个分类（共 ' + goodsCount + ' 个商品）');
  if (SA_EDIT_MODE === 'fixed') {
    if (SA_EDIT_SCOPE === 'goods') {
      var setN = Object.keys(SA_EDIT_PRICES).filter(function(k) { return SA_EDIT_PRICES[k] !== '' && !isNaN(parseFloat(SA_EDIT_PRICES[k])); }).length;
      txt += ' · 一口价：已设 ' + setN + ' / ' + scopeCount + ' 件';
    } else {
      var catIds = Object.keys(SA_EDIT_CATS);
      var setN = catIds.filter(function(cid) { var v = SA_EDIT_PRICES[cid]; return v != null && v !== '' && !isNaN(parseFloat(v)); }).length;
      txt += ' · 一口价：已设 ' + setN + ' / ' + catIds.length + ' 个分类';
    }
  } else {
    txt += ' · 最低折扣：' + (min ? min + ' 折' : '未设置');
  }
  return txt;
}

// ===== 主页面渲染 =====
function initSaleActivity() {
  var el = document.getElementById('saleActivityContent');
  if (!el) return;
  saLoad();
  el.innerHTML =
    '<div style="display:flex;flex:1;flex-direction:column;min-height:0;overflow:hidden">' +
      // 顶部说明
      '<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #f0f0f0;padding:12px 24px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<span style="font-size:13px;font-weight:600;color:#0b1019">🏷️ 打折活动</span>' +
        '<span style="font-size:12px;color:#909399">支持分时段折扣（如早市 7:30-8:00 七折）或指定商品一口价（生鲜按品定价），加速临期商品出清</span>' +
      '</div>' +
      // 筛选栏
      '<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;padding:12px 24px;gap:10px;flex-wrap:wrap;margin-top:0">' +
        '<div class="gl-radio-group" id="saFilterStatus">' +
          '<span class="gl-radio-btn' + (SA_FILTER_STATUS === '' ? ' active' : '') + '" onclick="saSetStatus(\'\',this)">全部</span>' +
          '<span class="gl-radio-btn' + (SA_FILTER_STATUS === 'running' ? ' active' : '') + '" onclick="saSetStatus(\'running\',this)">进行中</span>' +
          '<span class="gl-radio-btn' + (SA_FILTER_STATUS === 'pending' ? ' active' : '') + '" onclick="saSetStatus(\'pending\',this)">未开始</span>' +
          '<span class="gl-radio-btn' + (SA_FILTER_STATUS === 'ended' ? ' active' : '') + '" onclick="saSetStatus(\'ended\',this)">已结束</span>' +
          '<span class="gl-radio-btn' + (SA_FILTER_STATUS === 'disabled' ? ' active' : '') + '" onclick="saSetStatus(\'disabled\',this)">已停用</span>' +
        '</div>' +
        '<div class="gl-radio-group" id="saFilterType">' +
          '<span class="gl-radio-btn' + (SA_FILTER_TYPE === '' ? ' active' : '') + '" onclick="saSetType(\'\',this)">全部类型</span>' +
          '<span class="gl-radio-btn' + (SA_FILTER_TYPE === 'discount' ? ' active' : '') + '" onclick="saSetType(\'discount\',this)">时段折扣</span>' +
          '<span class="gl-radio-btn' + (SA_FILTER_TYPE === 'fixed' ? ' active' : '') + '" onclick="saSetType(\'fixed\',this)">商品一口价</span>' +
        '</div>' +
        '<select id="saFilterStore" onchange="saSetStore(this.value)" title="按门店筛选" style="height:32px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;padding:0 8px;outline:none;background:#fff;max-width:170px">'
          + saStoreOptions(SA_FILTER_STORE) +
        '</select>' +

        '<div style="position:relative;flex:0 1 260px">' +
          '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#bbb;font-size:12px">🔍</span>' +
          '<input type="text" id="saFilterKeyword" placeholder="搜索活动名称" ' +
            'style="width:100%;height:32px;padding:0 10px 0 28px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box" ' +
            'value="' + escapeHtml(SA_FILTER_KEYWORD) + '" onkeydown="if(event.key===\'Enter\')saSearch()">' +
        '</div>' +
        '<button class="ic-btn" onclick="saReset()" style="font-size:12px">重置</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="saSearch()">查询</button>' +
      '</div>' +
      // 操作工具条（放在搜索条件下方）
      '<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #f0f0f0;padding:10px 24px;display:flex;align-items:center;gap:10px">' +
        '<button class="ic-btn ic-btn-pri" onclick="saOpenAdd()">+ 新增活动</button>' +
        '<button class="ic-btn" id="saTopEdit" onclick="saTopEditAct()">编辑</button>' +
        '<button class="ic-btn" id="saTopClone" onclick="saTopCloneAct()">复制</button>' +
        '<button class="ic-btn" id="saTopDisable" onclick="saTopDisable()">停用</button>' +
        '<button class="ic-btn" id="saTopEnable" onclick="saTopEnable()">启用</button>' +
        '<button class="ic-btn" style="color:#f56c6c" id="saTopDelete" onclick="saTopDelete()">删除</button>' +
      '</div>' +
      // 表格
      '<div style="flex:1;min-height:0;padding:8px;overflow:hidden">' +
        '<div style="height:100%;background:#fff;border-radius:4px;overflow:hidden;display:flex;flex-direction:column">' +
          '<div class="table-wrap" style="flex:1;overflow-y:auto;min-height:0">' +
            '<table>' +
              '<thead><tr>' +
                '<th style="width:36px;text-align:center"><input type="checkbox" id="saCheckAll" onchange="saCheckAll(this)" title="全选本页"></th>' +
                '<th style="width:210px">活动名称</th>' +
                '<th style="width:250px">适用范围</th>' +
                '<th style="width:290px">定价 / 折扣</th>' +
                '<th style="width:130px">生效时间</th>' +
                '<th style="width:96px">状态</th>' +
                '<th style="width:140px">适用门店</th>' +
                '<th style="width:120px">创建时间</th>' +
              '</tr></thead>' +
              '<tbody id="saTableBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="pagination-bar" id="saPagination" style="flex-shrink:0"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  saRenderTable();
}


function saFiltered() {
  var list = SA_DATA.slice();
  if (SA_FILTER_STATUS) list = list.filter(function(a) { return saEffectiveStatus(a) === SA_FILTER_STATUS; });
  if (SA_FILTER_TYPE) list = list.filter(function(a) { return (a.mode || 'discount') === SA_FILTER_TYPE; });
  if (SA_FILTER_KEYWORD) list = list.filter(function(a) { return a.name.indexOf(SA_FILTER_KEYWORD) >= 0; });
  if (SA_FILTER_STORE) list = list.filter(function(a) { return a.storeId === SA_FILTER_STORE; });
  return list;
}

function saRenderTable() {
  var filtered = saFiltered();
  var total = filtered.length;
  var totalPages = Math.ceil(total / SA_PAGE_SIZE) || 1;
  if (SA_PAGE > totalPages) SA_PAGE = totalPages;
  var start = (SA_PAGE - 1) * SA_PAGE_SIZE;
  var pageData = filtered.slice(start, start + SA_PAGE_SIZE);

  var tbody = document.getElementById('saTableBody');
  if (!tbody) return;
  tbody.innerHTML = pageData.map(function(a, i) {
    var checked = SA_CHECKED[a.id] ? ' checked' : '';
    return '<tr>' +
      '<td style="width:36px;text-align:center"><input type="checkbox" class="sa-row-check" data-id="' + a.id + '"' + checked + ' onchange="saToggleCheck(\'' + a.id + '\',this)"></td>' +
      '<td><span style="color:#0b1019;font-weight:600;cursor:pointer" onclick="saOpenEdit(\'' + a.id + '\')">' + escapeHtml(a.name) + '</span></td>' +
      '<td>' + saScopeText(a) + '</td>' +
      '<td>' + saPriceSummary(a) + '</td>' +
      '<td>' + saDateText(a) + '</td>' +
      '<td>' + saStatusBadge(a) + saExpireHint(a) + '</td>' +
      '<td style="font-size:12px;color:#666">' + saStoreName(a.storeId) + '</td>' +
      '<td style="font-size:12px;color:#666">' + escapeHtml(a.createdAt) + '</td>' +
      '</tr>';
  }).join('');
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:60px 0;color:#999">' +
      '暂无活动，点击上方「+ 新增活动」创建第一个打折活动</td></tr>';
  }

  saSyncHeadCheck();
  saUpdateTopBar();

  var pagEl = document.getElementById('saPagination');
  if (!pagEl) return;
  var html = '<span class="page-info">共 ' + total + ' 条</span>' +
    '<div class="page-btns">' +
      '<button class="page-btn" onclick="saGoPage(' + (SA_PAGE - 1) + ')" ' + (SA_PAGE <= 1 ? 'disabled' : '') + '>‹</button>';
  var pages = [];
  for (var p = 1; p <= totalPages; p++) {
    if (p <= 3 || p > totalPages - 2 || Math.abs(p - SA_PAGE) <= 1) {
      if (pages.length > 0 && p - pages[pages.length - 1] > 1) pages.push('...');
      pages.push(p);
    }
  }
  for (var pi = 0; pi < pages.length; pi++) {
    var pg = pages[pi];
    if (pg === '...') { html += '<span class="page-num" style="opacity:0.4">...</span>'; }
    else { html += '<button class="page-btn" style="' + (pg === SA_PAGE ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="saGoPage(' + pg + ')">' + pg + '</button>'; }
  }
  html += '<button class="page-btn" onclick="saGoPage(' + (SA_PAGE + 1) + ')" ' + (SA_PAGE >= totalPages ? 'disabled' : '') + '>›</button></div>' +
    '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666">' +
      SA_PAGE_SIZE + '条/页 跳至 <input type="number" id="saJumpInput" min="1" max="' + totalPages + '" value="' + SA_PAGE + '" ' +
      'style="width:42px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center" ' +
      'onkeydown="if(event.key===\'Enter\')saGoPage(parseInt(this.value))"> 页' +
    '</div>';
  pagEl.innerHTML = html;
}

function saGoPage(p) {
  if (p < 1) p = 1;
  SA_PAGE = p;
  saRenderTable();
  var wrap = document.querySelector('#page-sale-activity .table-wrap');
  if (wrap) wrap.scrollTop = 0;
}
function saSetStatus(v, el) {
  SA_FILTER_STATUS = v;
  SA_PAGE = 1;
  document.querySelectorAll('#saFilterStatus .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  saRenderTable();
}
function saSetType(v, el) {
  SA_FILTER_TYPE = v;
  SA_PAGE = 1;
  document.querySelectorAll('#saFilterType .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  saRenderTable();
}
function saSetStore(v) {
  SA_FILTER_STORE = v;
  SA_PAGE = 1;
  saRenderTable();
}
function saSearch() {
  var kw = document.getElementById('saFilterKeyword');
  SA_FILTER_KEYWORD = kw ? kw.value.trim() : '';
  SA_PAGE = 1;
  saRenderTable();
}
function saReset() {
  SA_FILTER_STATUS = '';
  SA_FILTER_TYPE = '';
  SA_FILTER_KEYWORD = '';
  SA_FILTER_STORE = '';
  SA_PAGE = 1;
  var sf = document.getElementById('saFilterStore');
  if (sf) sf.value = '';
  document.querySelectorAll('#saFilterStatus .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  var first = document.querySelector('#saFilterStatus .gl-radio-btn');
  if (first) first.classList.add('active');
  document.querySelectorAll('#saFilterType .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  var firstType = document.querySelector('#saFilterType .gl-radio-btn');
  if (firstType) firstType.classList.add('active');
  var kw = document.getElementById('saFilterKeyword');
  if (kw) kw.value = '';
  saRenderTable();
}

// ===== 新增 / 编辑弹窗 =====
function saOpenAdd() {
  SA_EDIT_ID = null;
  SA_EDIT_SCOPE = 'goods';
  SA_EDIT_GOODS = {};
  SA_EDIT_CATS = {};
  SA_EDIT_DATETYPE = 'range';
  SA_EDIT_MODE = 'discount';
  SA_EDIT_TIMETYPE = 'allday';
  SA_EDIT_PRICES = {};
  SA_EDIT_CATPRICE = '';
  SA_EDIT_AUDIENCE = 'all';
  SA_EDIT_LIMITTYPE = 'none';
  SA_EDIT_LIMITN = 2;
  SA_GOODS_KW = '';
  saOpenModal('新增打折活动', null);
}
function saOpenEdit(id) {
  var act = SA_DATA.find(function(a) { return a.id === id; });
  if (!act) return;
  SA_EDIT_ID = id;
  SA_EDIT_SCOPE = act.scopeType;
  SA_EDIT_GOODS = {};
  (act.goodsIds || []).forEach(function(g) { SA_EDIT_GOODS[g] = true; });
  SA_EDIT_CATS = {};
  (act.categoryIds || []).forEach(function(c) { SA_EDIT_CATS[c] = true; });
  SA_EDIT_DATETYPE = act.dateType;
  SA_EDIT_MODE = act.mode || 'discount';
  SA_EDIT_TIMETYPE = act.timeType || 'allday';
  SA_EDIT_PRICES = act.priceMap ? JSON.parse(JSON.stringify(act.priceMap)) : {};
  SA_EDIT_CATPRICE = (act.categoryPrice != null) ? act.categoryPrice : '';
  SA_EDIT_AUDIENCE = act.audience || 'all';
  SA_EDIT_LIMITTYPE = act.limitType || 'none';
  SA_EDIT_LIMITN = (act.limitN != null) ? act.limitN : 2;
  SA_GOODS_KW = '';
  // 分类一口价迁移：旧数据用 categoryPrice，按分类拆入 priceMap
  if (act.mode === 'fixed' && act.scopeType === 'category' && (!act.priceMap || !Object.keys(act.priceMap).length) && act.categoryPrice != null && act.categoryPrice !== '') {
    var m = {};
    (act.categoryIds || []).forEach(function(cid) { m[cid] = act.categoryPrice; });
    SA_EDIT_PRICES = m;
  }
  saOpenModal('编辑打折活动', act);
}

function saOpenModal(title, act) {
  var existing = document.getElementById('saModalOverlay');
  if (existing) existing.remove();

  // 默认日期范围：今天 ~ 今天+7天（新建活动时预填，用户可直接修改）
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  var saToday = new Date();
  var saDefStart = saToday.getFullYear() + '-' + p2(saToday.getMonth() + 1) + '-' + p2(saToday.getDate());
  var saNext = new Date(saToday.getTime() + 7 * 86400000);
  var saDefEnd = saNext.getFullYear() + '-' + p2(saNext.getMonth() + 1) + '-' + p2(saNext.getDate());

  var overlay = document.createElement('div');
  overlay.id = 'saModalOverlay';
  overlay.className = 'gl-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) saCloseModal(); };

  var slotsHtml = (act && act.slots && act.slots.length ? act.slots : [
    { start: '07:30', end: '08:00', discount: 7 },
    { start: '08:00', end: '08:30', discount: 6 },
    { start: '08:30', end: '09:00', discount: 5 }
  ]).map(function(s, i) { return saSlotRow(i, s.start, s.end, s.discount, 'discount'); }).join('');

  var fixedSlotsHtml = (act && act.mode === 'fixed' && act.timeType === 'slots' && act.slots && act.slots.length)
    ? act.slots.map(function(s, i) { return saSlotRow(i, s.start, s.end, null, 'fixed'); }).join('')
    : saSlotRow(0, '07:30', '08:00', null, 'fixed');

  overlay.innerHTML =
    '<div class="gl-modal" style="width:min(880px,95vw)">' +
      '<div class="gl-modal-header">' +
        '<span class="gl-modal-title">' + title + '</span>' +
        '<button class="gl-modal-close" onclick="saCloseModal()">✕</button>' +
      '</div>' +
      '<div class="gl-modal-body gl-modal-body-scroll" style="max-height:calc(85vh - 100px)">' +
        // 活动名称
        '<div class="gl-form-item">' +
          '<span class="gl-form-label"><span class="required">*</span>活动名称</span>' +
          '<div class="gl-form-control">' +
            '<input type="text" id="saName" placeholder="如：早市分时段折扣 / 晚间生鲜清仓" maxlength="30" ' +
              'value="' + escapeHtml(act ? act.name : '') + '" ' +
              'style="width:100%;max-width:480px;height:32px;padding:0 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px;outline:none;box-sizing:border-box">' +
          '</div>' +
        '</div>' +
        // 活动类型
        '<div class="gl-form-item">' +
          '<span class="gl-form-label"><span class="required">*</span>活动类型</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-radio-group" id="saModeRadio">' +
              '<span class="gl-radio-btn' + (SA_EDIT_MODE === 'discount' ? ' active' : '') + '" onclick="saSwitchMode(\'discount\',this)">时段折扣</span>' +
              '<span class="gl-radio-btn' + (SA_EDIT_MODE === 'fixed' ? ' active' : '') + '" onclick="saSwitchMode(\'fixed\',this)">商品一口价</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // 适用范围类型
        '<div class="gl-form-item">' +
          '<span class="gl-form-label"><span class="required">*</span>适用范围</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-radio-group" id="saScopeRadio">' +
              '<span class="gl-radio-btn' + (SA_EDIT_SCOPE === 'goods' ? ' active' : '') + '" onclick="saSwitchScope(\'goods\',this)">指定商品</span>' +
              '<span class="gl-radio-btn' + (SA_EDIT_SCOPE === 'category' ? ' active' : '') + '" onclick="saSwitchScope(\'category\',this)">指定分类</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // 范围选择区
        '<div class="gl-form-item gl-form-item-block">' +
          '<span class="gl-form-label"></span>' +
          '<div class="gl-form-control">' +
            '<div id="saScopePanel"></div>' +
          '</div>' +
        '</div>' +
        // 时段折扣（discount 模式）
        '<div class="gl-form-item gl-form-item-block" id="saDiscountSection">' +
          '<span class="gl-form-label"><span class="required">*</span>时段折扣</span>' +
          '<div class="gl-form-control">' +
            '<div id="saSlotsList">' + slotsHtml + '</div>' +
            '<button class="ic-btn" onclick="saAddSlot()" style="font-size:12px;margin-top:8px">+ 添加时段</button>' +
            '<div style="font-size:12px;color:#909399;margin-top:6px">折扣填数字，如 7 = 7 折（按原价 ×0.7 结算），支持一位小数如 8.5</div>' +
          '</div>' +
        '</div>' +
        // 商品一口价（fixed 模式）
        '<div class="gl-form-item gl-form-item-block" id="saFixedSection" style="display:' + (SA_EDIT_MODE === 'fixed' ? 'flex' : 'none') + '">' +
          '<span class="gl-form-label"><span class="required">*</span>商品定价</span>' +
          '<div class="gl-form-control">' +
            '<div id="saFixedPanel"></div>' +
          '</div>' +
        '</div>' +
        // 生效日期
        '<div class="gl-form-item">' +
          '<span class="gl-form-label"><span class="required-placeholder">*</span>生效日期</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-radio-group" id="saDateRadio" style="display:inline-flex;margin-right:12px">' +
              '<span class="gl-radio-btn' + (SA_EDIT_DATETYPE === 'daily' ? ' active' : '') + '" onclick="saSwitchDateType(\'daily\',this)">每天生效</span>' +
              '<span class="gl-radio-btn' + (SA_EDIT_DATETYPE === 'range' ? ' active' : '') + '" onclick="saSwitchDateType(\'range\',this)">指定日期范围</span>' +
            '</div>' +
            '<span id="saDateRange" style="display:' + (SA_EDIT_DATETYPE === 'daily' ? 'none' : 'inline-flex') + ';align-items:center;gap:6px">' +
              '<input type="date" id="saDateStart" value="' + (act && act.dateStart ? act.dateStart : saDefStart) + '"' + (SA_EDIT_DATETYPE === 'daily' ? ' disabled' : '') + ' style="height:30px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px">' +
              '<span style="color:#999">至</span>' +
              '<input type="date" id="saDateEnd" value="' + (act && act.dateEnd ? act.dateEnd : saDefEnd) + '"' + (SA_EDIT_DATETYPE === 'daily' ? ' disabled' : '') + ' style="height:30px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px">' +
            '</span>' +
          '</div>' +
        '</div>' +
        // 一口价生效时段
        '<div class="gl-form-item gl-form-item-block" id="saFixedTimeSection" style="display:' + (SA_EDIT_MODE === 'fixed' ? 'flex' : 'none') + '">' +
          '<span class="gl-form-label"><span class="required-placeholder">*</span>生效时段</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-radio-group" id="saFixedTimeRadio" style="margin-bottom:10px">' +
              '<span class="gl-radio-btn' + (SA_EDIT_TIMETYPE === 'allday' ? ' active' : '') + '" onclick="saSwitchFixedTimeType(\'allday\',this)">全天生效</span>' +
              '<span class="gl-radio-btn' + (SA_EDIT_TIMETYPE === 'slots' ? ' active' : '') + '" onclick="saSwitchFixedTimeType(\'slots\',this)">指定时段</span>' +
            '</div>' +
            '<div id="saFixedSlotsWrap" style="display:' + (SA_EDIT_TIMETYPE === 'slots' ? 'block' : 'none') + '">' +
              '<div id="saFixedSlotsList">' + fixedSlotsHtml + '</div>' +
              '<button class="ic-btn" onclick="saAddFixedSlot()" style="font-size:12px;margin-top:8px">+ 添加时段</button>' +
            '</div>' +
            '<div style="font-size:12px;color:#909399;margin-top:6px">默认全天生效；选择「指定时段」后仅在所选时段内按一口价结算</div>' +
          '</div>' +
        '</div>' +
        // 适用人群
        '<div class="gl-form-item">' +
          '<span class="gl-form-label"><span class="required-placeholder">*</span>适用人群</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-radio-group" id="saAudienceRadio">' +
              '<span class="gl-radio-btn' + (SA_EDIT_AUDIENCE === 'all' ? ' active' : '') + '" onclick="saSwitchAudience(\'all\',this)">全部顾客</span>' +
              '<span class="gl-radio-btn' + (SA_EDIT_AUDIENCE === 'member' ? ' active' : '') + '" onclick="saSwitchAudience(\'member\',this)">仅会员</span>' +
              '<span class="gl-radio-btn' + (SA_EDIT_AUDIENCE === 'new' ? ' active' : '') + '" onclick="saSwitchAudience(\'new\',this)">仅新人</span>' +
            '</div>' +
            '<span style="font-size:12px;color:#909399;margin-left:8px">仅会员 / 仅新人：非目标人群不享受该活动价</span>' +
          '</div>' +
        '</div>' +
        // 购买限制
        '<div class="gl-form-item">' +
          '<span class="gl-form-label"><span class="required-placeholder">*</span>购买限制</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-radio-group" id="saLimitRadio" style="display:inline-flex;margin-right:12px">' +
              '<span class="gl-radio-btn' + (SA_EDIT_LIMITTYPE === 'none' ? ' active' : '') + '" onclick="saSwitchLimit(\'none\',this)">不限购</span>' +
              '<span class="gl-radio-btn' + (SA_EDIT_LIMITTYPE === 'per' ? ' active' : '') + '" onclick="saSwitchLimit(\'per\',this)">每人限购</span>' +
            '</div>' +
            '<span id="saLimitNWrap" style="display:' + (SA_EDIT_LIMITTYPE === 'per' ? 'inline-flex' : 'none') + ';align-items:center;gap:6px">' +
              '<input type="number" id="saLimitN" min="1" step="1" value="' + (SA_EDIT_LIMITN || 2) + '" ' +
                'style="width:72px;height:30px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px">' +
              '<span style="font-size:12px;color:#606266">件</span>' +
            '</span>' +
            '<span style="font-size:12px;color:#909399;margin-left:8px">超过限购数量的商品按原价结算</span>' +
          '</div>' +
        '</div>' +
        // 状态
        '<div class="gl-form-item">' +
          '<span class="gl-form-label"><span class="required-placeholder">*</span>活动状态</span>' +
          '<div class="gl-form-control">' +
            '<div class="gl-radio-group" id="saStatusRadio">' +
              '<span class="gl-radio-btn' + (act && act.status === '0' ? '' : ' active') + '" onclick="saSetModalStatus(\'1\',this)">启用</span>' +
              '<span class="gl-radio-btn' + (act && act.status === '0' ? ' active' : '') + '" onclick="saSetModalStatus(\'0\',this)">停用</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="saPreview" style="padding:10px 16px;background:#fafbfc;border-top:1px solid #f0f0f0;font-size:12px;color:#606266"></div>' +
      '<div class="gl-modal-footer">' +
        '<button class="ic-btn" onclick="saCloseModal()">取消</button>' +
        '<button class="ic-btn ic-btn-pri" onclick="saSave()">保存</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  saRenderScopePanel();
  saRenderFixedPanel();
}

function saCloseModal() {
  var o = document.getElementById('saModalOverlay');
  if (o) o.remove();
}

// ===== 范围选择面板 =====
function saRenderScopePanel() {
  var panel = document.getElementById('saScopePanel');
  if (!panel) return;

  // 拆分 header（固定，避免中文输入时 DOM 被替换）和 list（可变）
  var header = document.getElementById('saScopeHeader');
  var listEl = document.getElementById('saScopeList');
  var needBind = false;
  if (!header || header.getAttribute('data-scope') !== SA_EDIT_SCOPE) {
    panel.innerHTML =
      '<div id="saScopeHeader" data-scope="' + SA_EDIT_SCOPE + '" style="margin-bottom:8px"></div>' +
      '<div id="saScopeList" style="border:1px solid #ebeef5;border-radius:4px;max-height:230px;overflow-y:auto;padding:4px 0"></div>';
    header = document.getElementById('saScopeHeader');
    listEl = document.getElementById('saScopeList');
    needBind = true;
  }

  if (SA_EDIT_SCOPE === 'goods') {
    var kw = SA_GOODS_KW;
    var list = (typeof GL_MOCK_DATA !== 'undefined') ? GL_MOCK_DATA.slice() : [];
    if (kw) {
      list = list.filter(function(g) {
        return (g.goodsName || '').indexOf(kw) >= 0 || (g.goodsCode || '').indexOf(kw) >= 0;
      });
    }
    var selN = Object.keys(SA_EDIT_GOODS).length;

    if (needBind) {
      // 首次渲染：创建搜索框并绑定事件
      header.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<div style="position:relative;flex:0 1 260px">' +
            '<span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:#bbb;font-size:12px">🔍</span>' +
            '<input type="text" id="saGoodsKw" placeholder="搜索商品名称/编码" value="' + escapeHtml(kw) + '" ' +
              'style="width:100%;height:30px;padding:0 10px 0 26px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;outline:none;box-sizing:border-box">' +
          '</div>' +
          '<span id="saGoodsCount" style="font-size:12px;color:#909399">共 ' + list.length + ' 个商品</span>' +
          '<span style="flex:1"></span>' +
          '<span id="saGoodsSelected" style="font-size:12px;color:#005CF5;font-weight:600">已选 ' + selN + ' 项</span>' +
        '</div>';
      saBindGoodsSearch();
    } else {
      // 仅更新统计数字，不重建搜索框，保证中文输入法不中断
      var cntEl = document.getElementById('saGoodsCount');
      var selEl = document.getElementById('saGoodsSelected');
      if (cntEl) cntEl.textContent = '共 ' + list.length + ' 个商品';
      if (selEl) selEl.textContent = '已选 ' + selN + ' 项';
    }

    listEl.innerHTML = list.length === 0
      ? '<div style="padding:24px;text-align:center;color:#c0c4cc;font-size:12px">未找到匹配商品</div>'
      : list.map(function(g) {
          var checked = SA_EDIT_GOODS[g.goodsId] ? ' checked' : '';
          var priceInput = '';
          if (SA_EDIT_MODE === 'fixed' && SA_EDIT_GOODS[g.goodsId]) {
            var dv = (SA_EDIT_PRICES[g.goodsId] != null && SA_EDIT_PRICES[g.goodsId] !== '') ? SA_EDIT_PRICES[g.goodsId] : (g.goodsPrice != null ? g.goodsPrice.toFixed(2) : '');
            priceInput = '<input type="number" min="0" step="0.01" class="sa-goods-price" data-id="' + g.goodsId + '" value="' + dv + '" onchange="saSetGoodsPrice(\'' + g.goodsId + '\',this.value)" placeholder="目标售价" style="width:92px;height:28px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px">';
          }
          return '<label style="display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;font-size:12px" ' +
            'onmouseover="this.style.background=\'#f5f7fa\'" onmouseout="this.style.background=\'\'">' +
            '<input type="checkbox" style="cursor:pointer" ' + checked + ' onchange="saToggleGoods(\'' + g.goodsId + '\',this)">' +
            '<span style="color:#0b1019">' + escapeHtml(g.goodsName) + '</span>' +
            '<span style="color:#c0c4cc">' + escapeHtml(g.goodsCode) + '</span>' +
            '<span style="color:#005CF5">¥' + (g.goodsPrice != null ? g.goodsPrice.toFixed(2) : '-') + '</span>' +
            '<span class="gl-tag gl-tag-info">' + escapeHtml(getCategoryName(g.categoryId)) + '</span>' +
            priceInput +
          '</label>';
        }).join('');
  } else {
    var cats = getVisibleCategories();
    var selN = Object.keys(SA_EDIT_CATS).length;
    header.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:12px;color:#909399">勾选参与' + (SA_EDIT_MODE === 'fixed' ? '一口价' : '打折') + '的商品分类</span>' +
        '<span style="flex:1"></span>' +
        '<span style="font-size:12px;color:#005CF5;font-weight:600">已选 ' + selN + ' 个分类</span>' +
      '</div>';
    listEl.innerHTML = cats.map(function(c) {
      var checked = SA_EDIT_CATS[c.id] ? ' checked' : '';
      var priceInput = '';
      if (SA_EDIT_MODE === 'fixed' && SA_EDIT_CATS[c.id]) {
        var ph = '统一售价';
        var dv = (SA_EDIT_PRICES[c.id] != null && SA_EDIT_PRICES[c.id] !== '') ? SA_EDIT_PRICES[c.id] : '';
        priceInput = '<input type="number" min="0" step="0.01" class="sa-cat-price" data-id="' + c.id + '" value="' + dv + '" ' +
          'onchange="saSetCatPrice(\'' + c.id + '\',this.value)" placeholder="' + ph + '" ' +
          'style="width:90px;height:26px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px">';
      }
      return '<label style="display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;font-size:12px" ' +
        'onmouseover="this.style.background=\'#f5f7fa\'" onmouseout="this.style.background=\'\'">' +
        '<input type="checkbox" style="cursor:pointer" ' + checked + ' onchange="saToggleCat(\'' + c.id + '\',this)">' +
        '<span style="width:10px;height:10px;border-radius:2px;background:' + (c.color || '#ccc') + ';display:inline-block"></span>' +
        '<span style="color:#0b1019">' + escapeHtml(c.name) + '</span>' +
        priceInput +
        '<span style="color:#c0c4cc;margin-left:auto">' + saCountByCategory(c.id) + ' 个商品</span>' +
        '</label>';
    }).join('');
  }
  var prev = document.getElementById('saPreview');
  if (prev) prev.innerHTML = saPreviewHtml(saCurrentMinDiscount());
}

function saSwitchScope(type, el) {
  SA_EDIT_SCOPE = type;
  document.querySelectorAll('#saScopeRadio .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  saRenderScopePanel();
  saRenderFixedPanel();
}
// 活动类型切换：discount(时段折扣) / fixed(商品一口价)
function saSwitchMode(mode, el) {
  SA_EDIT_MODE = mode;
  document.querySelectorAll('#saModeRadio .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  var disc = document.getElementById('saDiscountSection');
  var fixed = document.getElementById('saFixedSection');
  var fixedTime = document.getElementById('saFixedTimeSection');
  if (disc) disc.style.display = (mode === 'discount') ? 'flex' : 'none';
  if (fixed) fixed.style.display = (mode === 'fixed') ? 'flex' : 'none';
  if (fixedTime) fixedTime.style.display = (mode === 'fixed') ? 'flex' : 'none';
  saRenderScopePanel();
  saRenderFixedPanel();
  var prev = document.getElementById('saPreview');
  if (prev) prev.innerHTML = saPreviewHtml(saCurrentMinDiscount());
}
// 一口价生效时段切换
function saSwitchFixedTimeType(t, el) {
  SA_EDIT_TIMETYPE = t;
  document.querySelectorAll('#saFixedTimeRadio .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  var wrap = document.getElementById('saFixedSlotsWrap');
  if (wrap) wrap.style.display = (t === 'slots') ? 'block' : 'none';
}
// 适用人群切换
function saSwitchAudience(a, el) {
  SA_EDIT_AUDIENCE = a;
  document.querySelectorAll('#saAudienceRadio .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
}
// 购买限制切换
function saSwitchLimit(t, el) {
  SA_EDIT_LIMITTYPE = t;
  document.querySelectorAll('#saLimitRadio .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  var wrap = document.getElementById('saLimitNWrap');
  if (wrap) wrap.style.display = (t === 'per') ? 'inline-flex' : 'none';
}
// 一口价面板：goods 范围提示在列表内逐件填价；category 范围保留区块但不在面板内重复计数
function saRenderFixedPanel() {
  var panel = document.getElementById('saFixedPanel');
  var section = document.getElementById('saFixedSection');
  if (!panel) return;
  if (SA_EDIT_MODE !== 'fixed') {
    if (section) section.style.display = 'none';
    panel.innerHTML = '';
    return;
  }
  if (section) section.style.display = 'flex';
  if (SA_EDIT_SCOPE === 'category') {
    var cats = Object.keys(SA_EDIT_CATS);
    var goodsCount = cats.reduce(function(s, cid) { return s + saCountByCategory(cid); }, 0);
    panel.innerHTML = '<div style="font-size:12px;color:#606266;padding:6px 0">已选 <b style="color:#005CF5">' + cats.length + '</b> 个分类（共 ' + goodsCount + ' 个商品），请在上方列表中为每个分类填写「统一售价」</div>' +
      '<div style="font-size:12px;color:#909399;padding:0 0 6px">为一口价活动的参与商品设置目标售价（直降价），结算时按该价，不与折扣叠加</div>';
    return;
  }
  var n = Object.keys(SA_EDIT_GOODS).length;
  panel.innerHTML = '<div style="font-size:12px;color:#606266;padding:6px 0">已选 <b style="color:#005CF5">' + n + '</b> 个商品，请在上方列表中为每个商品填写「目标售价」（默认等于原价）</div>';
}
function saSetGoodsPrice(id, val) {
  SA_EDIT_PRICES[id] = val;
  var prev = document.getElementById('saPreview');
  if (prev) prev.innerHTML = saPreviewHtml(saCurrentMinDiscount());
}
function saSetCatPrice(id, val) {
  SA_EDIT_PRICES[id] = val;
  var prev = document.getElementById('saPreview');
  if (prev) prev.innerHTML = saPreviewHtml(saCurrentMinDiscount());
}
function saGoodsSearch(v) {
  SA_GOODS_KW = (v || '').trim();
  saRenderScopePanel();
}
// 监听商品搜索框输入，兼容中文输入法（composition 期间不搜索，上屏后再搜）
function saBindGoodsSearch() {
  var input = document.getElementById('saGoodsKw');
  if (!input) return;
  var composing = false;
  input.addEventListener('compositionstart', function() { composing = true; });
  input.addEventListener('compositionend', function() {
    composing = false;
    saGoodsSearch(input.value);
  });
  input.addEventListener('input', function() {
    if (!composing) saGoodsSearch(input.value);
  });
  input.addEventListener('keyup', function() {
    if (!composing) saGoodsSearch(input.value);
  });
}
function saToggleGoods(id, cb) {
  if (cb.checked) SA_EDIT_GOODS[id] = true;
  else delete SA_EDIT_GOODS[id];
  saRenderScopePanel();
}
function saToggleCat(id, cb) {
  if (cb.checked) SA_EDIT_CATS[id] = true;
  else delete SA_EDIT_CATS[id];
  saRenderScopePanel();
  saRenderFixedPanel();
}

// ===== 时段折扣行 =====
// mode: 'discount' 带折扣输入；'fixed' 仅时间范围
function saSlotRow(i, start, end, discount, mode) {
  mode = mode || 'discount';
  var discHtml = '';
  if (mode === 'discount') {
    discHtml =
      '<input type="number" min="0.1" max="9.9" step="0.1" value="' + (discount != null ? discount : 8) + '" class="sa-slot-disc" ' +
        'style="width:70px;height:30px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;text-align:center" title="折扣：7 表示 7 折">' +
      '<span style="font-size:12px;color:#606266">折</span>';
  }
  return '<div class="sa-slot-row" data-i="' + i + '" data-mode="' + mode + '" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
    '<input type="time" value="' + (start || '07:30') + '" class="sa-slot-start" ' +
      'style="width:110px;height:30px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px">' +
    '<span style="color:#909399">至</span>' +
    '<input type="time" value="' + (end || '08:00') + '" class="sa-slot-end" ' +
      'style="width:110px;height:30px;padding:0 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px">' +
    discHtml +
    '<button class="sa-act-btn" style="color:#f56c6c" onclick="saRemoveSlot(this)">移除</button>' +
    '</div>';
}
function saAddSlot() {
  var list = document.getElementById('saSlotsList');
  if (!list) return;
  var idx = list.children.length;
  list.insertAdjacentHTML('beforeend', saSlotRow(idx, '09:00', '10:00', 9, 'discount'));
}
function saAddFixedSlot() {
  var list = document.getElementById('saFixedSlotsList');
  if (!list) return;
  var idx = list.children.length;
  list.insertAdjacentHTML('beforeend', saSlotRow(idx, '09:00', '10:00', null, 'fixed'));
}
function saRemoveSlot(btn) {
  var row = btn.closest('.sa-slot-row');
  if (row) row.remove();
}

// ===== 生效日期 / 状态 =====
function saSwitchDateType(t, el) {
  SA_EDIT_DATETYPE = t;
  document.querySelectorAll('#saDateRadio .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active'); else {
    document.querySelectorAll('#saDateRadio .gl-radio-btn').forEach(function(b) {
      if (b.textContent.indexOf('每天生效') !== -1 && t === 'daily') b.classList.add('active');
      if (b.textContent.indexOf('指定日期范围') !== -1 && t === 'range') b.classList.add('active');
    });
  }
  var s = document.getElementById('saDateStart'), e = document.getElementById('saDateEnd');
  var r = document.getElementById('saDateRange');
  if (s) s.disabled = (t === 'daily');
  if (e) e.disabled = (t === 'daily');
  if (r) r.style.display = (t === 'daily') ? 'none' : 'inline-flex';
}
var SA_MODAL_STATUS = '1';
function saSetModalStatus(v, el) {
  SA_MODAL_STATUS = v;
  document.querySelectorAll('#saStatusRadio .gl-radio-btn').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
}

// ===== 保存 =====
// 跨活动冲突检测：范围相交 + 时段重叠 + 日期可能重叠
function saConflictCheck(scopeType, ids, slots, excludeId, cand) {
  var conflicts = [];
  var candMode = (cand && cand.mode) || 'discount';
  var candTimeType = (cand && cand.timeType) || 'slots';
  var candHasSlots = slots && slots.length > 0;
  var catOf = {};
  if (typeof GL_MOCK_DATA !== 'undefined') GL_MOCK_DATA.forEach(function(g) { catOf[g.goodsId] = g.categoryId; });
  var scopeSet = {}; ids.forEach(function(id) { scopeSet[id] = true; });
  var candRange = (cand && cand.dateType === 'range') ? [cand.dateStart, cand.dateEnd] : null;
  SA_DATA.forEach(function(act) {
    if (act.id === excludeId) return;
    if (act.status !== '1') return; // 仅启用中活动参与冲突
    // 日期区间是否可能重叠（都限定范围且无交集则跳过）
    var actRange = act.dateType === 'range' ? [act.dateStart, act.dateEnd] : null;
    if (candRange && actRange && (candRange[0] > actRange[1] || actRange[0] > candRange[1])) return;
    // 范围是否相交
    var inter = false;
    if (scopeType === 'goods' && act.scopeType === 'goods') {
      inter = (act.goodsIds || []).some(function(id) { return scopeSet[id]; });
    } else if (scopeType === 'category' && act.scopeType === 'category') {
      inter = (act.categoryIds || []).some(function(id) { return scopeSet[id]; });
    } else {
      var goodsSet = scopeType === 'goods' ? ids : (act.goodsIds || []);
      var catSet = scopeType === 'goods' ? (act.categoryIds || []) : ids;
      inter = goodsSet.some(function(gid) { return catSet.indexOf(catOf[gid]) !== -1; });
    }
    if (!inter) return;

    var actMode = act.mode || 'discount';
    var actTimeType = act.timeType || 'allday';

    // 两个固定价活动：范围/日期重叠即冲突（避免同一商品出现两个明确售价）
    if (candMode === 'fixed' && actMode === 'fixed') {
      conflicts.push({ name: act.name, overlap: ['范围/日期重叠'] });
      return;
    }

    // 固定全天 vs 折扣活动：可并存，结算取低
    if (candMode === 'fixed' && candTimeType === 'allday') return;
    if (actMode === 'fixed' && actTimeType === 'allday') return;

    // 其余有明确时段的场景（折扣 vs 折扣、折扣 vs 固定时段、固定时段 vs 固定时段已在上面处理）：检查时段重叠
    if (!candHasSlots) return; // 候选无时段，后续不会再冲突
    var overlap = [];
    (act.slots || []).forEach(function(os) {
      slots.forEach(function(s) {
        if (s.start < os.end && os.start < s.end) overlap.push(s.start + '-' + s.end + ' 与 ' + os.start + '-' + os.end);
      });
    });
    if (overlap.length) conflicts.push({ name: act.name, overlap: overlap });
  });
  return conflicts;
}

function saSave() {
  var nameEl = document.getElementById('saName');
  var name = nameEl ? nameEl.value.trim() : '';
  if (!name) { showToast('请填写活动名称'); nameEl && nameEl.focus(); return; }

  // 收集定价信息（按活动类型分支）
  var slots = [];
  var priceMap = {};
  if (SA_EDIT_MODE === 'discount') {
    var rows = document.querySelectorAll('#saSlotsList .sa-slot-row');
    if (rows.length === 0) { showToast('请至少添加一个折扣时段'); return; }
    var ok = true;
    rows.forEach(function(r) {
      var s = r.querySelector('.sa-slot-start').value;
      var e = r.querySelector('.sa-slot-end').value;
      var d = parseFloat(r.querySelector('.sa-slot-disc').value);
      if (!s || !e) { showToast('请选择完整的开始/结束时间'); ok = false; return; }
      if (isNaN(d) || d < 0.1 || d > 9.9) { showToast('折扣需在 0.1 ~ 9.9 之间'); ok = false; return; }
      if (s >= e) { showToast('时段结束时间必须晚于开始时间'); ok = false; return; }
      slots.push({ start: s, end: e, discount: d });
    });
    if (!ok) return;
    // 时段重叠校验
    for (var i = 0; i < slots.length; i++) {
      for (var j = i + 1; j < slots.length; j++) {
        if (slots[i].start < slots[j].end && slots[j].start < slots[i].end) {
          showToast('时段 ' + slots[i].start + '-' + slots[i].end + ' 与 ' + slots[j].start + '-' + slots[j].end + ' 重叠，请调整');
          return;
        }
      }
    }
  } else {
    // 商品一口价：收集售价
    if (SA_EDIT_SCOPE === 'goods') {
      var bad = false;
      Object.keys(SA_EDIT_GOODS).forEach(function(gid) {
        var v = (SA_EDIT_PRICES[gid] != null && SA_EDIT_PRICES[gid] !== '') ? parseFloat(SA_EDIT_PRICES[gid]) : null;
        if (v == null || isNaN(v) || v < 0) { bad = true; }
        else priceMap[gid] = +v.toFixed(2);
      });
      if (bad) { showToast('请为已选商品填写有效的目标售价（≥0）'); return; }
    } else {
      // 分类一口价：每个分类一个统一售价
      var cats = Object.keys(SA_EDIT_CATS);
      var bad = false;
      cats.forEach(function(cid) {
        var v = (SA_EDIT_PRICES[cid] != null && SA_EDIT_PRICES[cid] !== '') ? parseFloat(SA_EDIT_PRICES[cid]) : null;
        if (v == null || isNaN(v) || v < 0) { bad = true; }
        else priceMap[cid] = +v.toFixed(2);
      });
      if (bad) { showToast('请为每个已选分类填写有效的统一售价（≥0）'); return; }
    }
    // 商品一口价：指定时段时收集时段
    if (SA_EDIT_TIMETYPE === 'slots') {
      var fRows = document.querySelectorAll('#saFixedSlotsList .sa-slot-row');
      if (fRows.length === 0) { showToast('请至少添加一个一口价时段，或切换为「全天生效」'); return; }
      var fOk = true;
      fRows.forEach(function(r) {
        var s = r.querySelector('.sa-slot-start').value;
        var e = r.querySelector('.sa-slot-end').value;
        if (!s || !e) { showToast('请选择完整的开始/结束时间'); fOk = false; return; }
        if (s >= e) { showToast('时段结束时间必须晚于开始时间'); fOk = false; return; }
        slots.push({ start: s, end: e });
      });
      if (!fOk) return;
      // 时段重叠校验
      for (var fi = 0; fi < slots.length; fi++) {
        for (var fj = fi + 1; fj < slots.length; fj++) {
          if (slots[fi].start < slots[fj].end && slots[fj].start < slots[fi].end) {
            showToast('时段 ' + slots[fi].start + '-' + slots[fi].end + ' 与 ' + slots[fj].start + '-' + slots[fj].end + ' 重叠，请调整');
            return;
          }
        }
      }
    }
  }

  // 范围校验
  var scopeIds = [];
  if (SA_EDIT_SCOPE === 'goods') {
    scopeIds = Object.keys(SA_EDIT_GOODS);
    if (!scopeIds.length) { showToast('请至少选择一个商品'); return; }
  } else {
    scopeIds = Object.keys(SA_EDIT_CATS);
    if (!scopeIds.length) { showToast('请至少选择一个商品分类'); return; }
  }

  // 日期范围
  var dateType = SA_EDIT_DATETYPE;
  var dateStart = '', dateEnd = '';
  if (dateType === 'range') {
    dateStart = document.getElementById('saDateStart').value;
    dateEnd = document.getElementById('saDateEnd').value;
    if (!dateStart || !dateEnd) { showToast('请选择生效日期范围'); return; }
    if (dateStart > dateEnd) { showToast('开始日期不能晚于结束日期'); return; }
  }

  // 跨活动冲突检测（同一商品/分类 + 时段重叠 + 日期可能重叠）
  var conflicts = saConflictCheck(SA_EDIT_SCOPE, scopeIds, slots, SA_EDIT_ID, { mode: SA_EDIT_MODE, timeType: SA_EDIT_TIMETYPE, dateType: dateType, dateStart: dateStart, dateEnd: dateEnd });
  if (conflicts.length) {
    var c = conflicts[0];
    showToast('与活动「' + c.name + '」范围/时段重叠：' + c.overlap[0] + '，请调整');
    return;
  }

  if (SA_EDIT_ID) {
    var act = SA_DATA.find(function(a) { return a.id === SA_EDIT_ID; });
    if (act) {
      act.name = name;
      act.mode = SA_EDIT_MODE;
      act.timeType = SA_EDIT_MODE === 'fixed' ? SA_EDIT_TIMETYPE : 'slots';
      act.scopeType = SA_EDIT_SCOPE;
      act.goodsIds = SA_EDIT_SCOPE === 'goods' ? scopeIds : [];
      act.categoryIds = SA_EDIT_SCOPE === 'category' ? scopeIds : [];
      act.slots = slots;
      act.priceMap = SA_EDIT_MODE === 'fixed' ? priceMap : {};
      act.categoryPrice = '';
      act.audience = SA_EDIT_AUDIENCE;
      act.limitType = SA_EDIT_LIMITTYPE;
      act.limitN = SA_EDIT_LIMITTYPE === 'per' ? (parseInt(SA_EDIT_LIMITN, 10) || 0) : 0;
      act.dateType = dateType;
      act.dateStart = dateStart;
      act.dateEnd = dateEnd;
      act.status = SA_MODAL_STATUS;
    }
    showToast('保存成功');
  } else {
    SA_DATA.unshift({
      id: 'sa-' + Date.now(),
      name: name,
      mode: SA_EDIT_MODE,
      timeType: SA_EDIT_MODE === 'fixed' ? SA_EDIT_TIMETYPE : 'slots',
      scopeType: SA_EDIT_SCOPE,
      goodsIds: SA_EDIT_SCOPE === 'goods' ? scopeIds : [],
      categoryIds: SA_EDIT_SCOPE === 'category' ? scopeIds : [],
      slots: slots,
      priceMap: SA_EDIT_MODE === 'fixed' ? priceMap : {},
      categoryPrice: '',
      audience: SA_EDIT_AUDIENCE,
      limitType: SA_EDIT_LIMITTYPE,
      limitN: SA_EDIT_LIMITTYPE === 'per' ? (parseInt(SA_EDIT_LIMITN, 10) || 0) : 0,
      dateType: dateType,
      dateStart: dateStart,
      dateEnd: dateEnd,
      status: SA_MODAL_STATUS,
      createdAt: saNow()
    });
    showToast('新增成功');
  }
  saPersist();
  saCloseModal();
  saRenderTable();
}

// ===== 列表操作 =====
function saToggleActivity(id) {
  var act = SA_DATA.find(function(a) { return a.id === id; });
  if (!act) return;
  act.status = act.status === '1' ? '0' : '1';
  saPersist();
  saRenderTable();
  showToast(act.status === '1' ? '已启用活动「' + act.name + '」' : '已停用活动「' + act.name + '」');
}
function saDelete(id) {
  var act = SA_DATA.find(function(a) { return a.id === id; });
  if (!act) return;
  if (act.status === '1') { showToast('启用中的活动不可删除，请先停用'); return; }
  if (!window.confirm('确定删除活动「' + act.name + '」？删除后不可恢复。')) return;
  SA_DATA = SA_DATA.filter(function(a) { return a.id !== id; });
  saPersist();
  saRenderTable();
  showToast('已删除');
}

// ===== 批量操作 / 顶部操作工具条 =====
function saToggleCheck(id, cb) {
  if (cb.checked) SA_CHECKED[id] = true; else delete SA_CHECKED[id];
  saUpdateTopBar();
  saSyncHeadCheck();
}
function saCheckAll(cb) {
  document.querySelectorAll('.sa-row-check').forEach(function(el) {
    var id = el.getAttribute('data-id');
    if (cb.checked) SA_CHECKED[id] = true; else delete SA_CHECKED[id];
    el.checked = cb.checked;
  });
  saUpdateTopBar();
  saSyncHeadCheck();
}
function saClearCheck() { SA_CHECKED = {}; saRenderTable(); }

// 表头全选框状态同步（checked / indeterminate）
function saSyncHeadCheck() {
  var headCheck = document.getElementById('saCheckAll');
  if (!headCheck) return;
  var pageIds = Array.prototype.map.call(document.querySelectorAll('.sa-row-check'), function(el) { return el.getAttribute('data-id'); });
  var allChecked = pageIds.length > 0 && pageIds.every(function(id) { return SA_CHECKED[id]; });
  headCheck.checked = allChecked;
  headCheck.indeterminate = !allChecked && pageIds.some(function(id) { return SA_CHECKED[id]; });
}

// 顶部操作工具条按钮保持可用，空选时点击提示
function saUpdateTopBar() {
  // 按钮始终可用，不再根据选中状态禁用
}

function saTopEditAct() {
  var ids = Object.keys(SA_CHECKED);
  if (ids.length === 0) { showToast('请选择一个活动'); return; }
  if (ids.length > 1) { showToast('编辑仅支持单个活动，请只选择一项'); return; }
  saOpenEdit(ids[0]);
}
function saTopCloneAct() {
  var ids = Object.keys(SA_CHECKED);
  if (ids.length === 0) { showToast('请选择一个活动'); return; }
  if (ids.length > 1) { showToast('复制仅支持单个活动，请只选择一项'); return; }
  saCloneActivity(ids[0]);
}
function saTopDisable() {
  if (Object.keys(SA_CHECKED).length === 0) { showToast('请至少选择一个活动'); return; }
  saBatchSetStatus('0');
}
function saTopEnable() {
  if (Object.keys(SA_CHECKED).length === 0) { showToast('请至少选择一个活动'); return; }
  saBatchSetStatus('1');
}
function saTopDelete() {
  if (Object.keys(SA_CHECKED).length === 0) { showToast('请至少选择一个活动'); return; }
  saBatchDelete();
}

function saBatchSetStatus(v) {
  var ids = Object.keys(SA_CHECKED);
  if (!ids.length) return;
  var n = 0;
  SA_DATA.forEach(function(a) { if (SA_CHECKED[a.id]) { a.status = v; n++; } });
  SA_CHECKED = {};
  saPersist();
  saRenderTable();
  showToast((v === '1' ? '已启用 ' : '已停用 ') + n + ' 个活动');
}
function saBatchEnable() { saBatchSetStatus('1'); }
function saBatchDisable() { saBatchSetStatus('0'); }
function saBatchDelete() {
  var ids = Object.keys(SA_CHECKED);
  if (!ids.length) return;
  var enabledIds = ids.filter(function(id){ var a = SA_DATA.find(function(x){ return x.id === id; }); return a && a.status === '1'; });
  var deletableIds = ids.filter(function(id){ return enabledIds.indexOf(id) < 0; });
  if (deletableIds.length === 0) {
    showToast('所选活动均为启用中，不可删除（请先停用）');
    return;
  }
  var msg = '确定删除选中的 ' + deletableIds.length + ' 个活动？删除后不可恢复。';
  if (enabledIds.length) msg += '（' + enabledIds.length + ' 个启用中活动已跳过）';
  if (!window.confirm(msg)) return;
  SA_DATA = SA_DATA.filter(function(a) { return !(SA_CHECKED[a.id] && enabledIds.indexOf(a.id) < 0); });
  SA_CHECKED = {};
  saPersist();
  saRenderTable();
  showToast('已删除 ' + deletableIds.length + ' 个活动' + (enabledIds.length ? ('，跳过 ' + enabledIds.length + ' 个启用中活动') : ''));
}

// ===== 复制活动 =====
function saCloneActivity(id) {
  var act = SA_DATA.find(function(a) { return a.id === id; });
  if (!act) return;
  var copy = JSON.parse(JSON.stringify(act));
  copy.id = 'sa-' + Date.now();
  copy.name = act.name + '（副本）';
  copy.status = '0';
  copy.createdAt = saNow();
  SA_DATA.unshift(copy);
  saPersist();
  saRenderTable();
  showToast('已复制活动「' + act.name + '」，请编辑后启用');
  saOpenEdit(copy.id);
}

// ===== 折后价计算（供商品列表/结算消费） =====
// 策略：活动折扣价 与 会员价 取较低者；返回 {price, original, source, detail, actName}
//  source: none | activity | member | both-activity | both-member
function saCalcPrice(goodsId, when) {
  when = when || new Date();
  var goods = (typeof GL_MOCK_DATA !== 'undefined') ? GL_MOCK_DATA.find(function(g) { return g.goodsId === goodsId; }) : null;
  if (!goods) return null;
  var price = goods.goodsPrice;
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  var today = p(when.getFullYear()) + '-' + p(when.getMonth() + 1) + '-' + p(when.getDate());
  var curHM = p(when.getHours()) + ':' + p(when.getMinutes());
  var actPrice = null, actDisc = null, actLimit = null;
  SA_DATA.forEach(function(act) {
    if (act.status !== '1') return; // 仅启用中
    if (act.dateType === 'range') {
      if (today < act.dateStart || today > act.dateEnd) return;
    }
    // 适用人群：非目标人群跳过
    if (act.audience === 'member' && !SA_DEMO_BUYER.member) return;
    if (act.audience === 'new' && !SA_DEMO_BUYER.newUser) return;
    var matched = false;
    if (act.scopeType === 'goods') matched = (act.goodsIds || []).indexOf(goodsId) !== -1;
    else matched = (act.categoryIds || []).indexOf(goods.categoryId) !== -1;
    if (!matched) return;
    var inSlot = false, disc = null, fixedPrice = null;
    if (act.mode === 'fixed') {
      // 一口价：取设定售价（商品范围用 goodsId；分类范围用 categoryId；兼容旧版 categoryPrice）
      var pm = act.priceMap || {};
      if (act.scopeType === 'goods') {
        fixedPrice = pm[goodsId] != null ? parseFloat(pm[goodsId]) : null;
      } else {
        fixedPrice = pm[goods.categoryId] != null ? parseFloat(pm[goods.categoryId]) : (act.categoryPrice != null && act.categoryPrice !== '' ? parseFloat(act.categoryPrice) : null);
      }
      if (fixedPrice == null || isNaN(fixedPrice)) return;
      var actTimeType = act.timeType || 'allday';
      if (actTimeType === 'slots') {
        (act.slots || []).forEach(function(s) {
          if (curHM >= s.start && curHM < s.end) inSlot = true;
        });
        if (!inSlot) return;
      } else {
        inSlot = true;
      }
    } else {
      (act.slots || []).forEach(function(s) {
        if (curHM >= s.start && curHM < s.end) { inSlot = true; disc = disc == null ? s.discount : Math.min(disc, s.discount); }
      });
      if (!inSlot) return;
    }
    var ap;
    if (act.mode === 'fixed') ap = +fixedPrice.toFixed(2);
    else ap = +(price * disc / 10).toFixed(2);
    if (actPrice == null || ap < actPrice) {
      actPrice = ap; actDisc = disc;
      actLimit = (act.limitType === 'per' && act.limitN) ? act.limitN : null;
    }
  });
  var member = goods.memberPrice;
  var finalPrice = price, source = 'none', detail = '', limit = actLimit;
  if (actPrice != null && member != null) {
    if (actPrice <= member) { finalPrice = actPrice; source = 'both-activity'; detail = (actDisc != null ? ('活动' + actDisc + '折') : ('一口价¥' + actPrice.toFixed(2))) + '·会员价¥' + member.toFixed(2); }
    else { finalPrice = member; source = 'both-member'; detail = '会员价¥' + member.toFixed(2) + '·' + (actDisc != null ? ('活动' + actDisc + '折') : ('一口价¥' + actPrice.toFixed(2))); }
  } else if (actPrice != null) {
    finalPrice = actPrice; source = 'activity'; detail = (actDisc != null ? ('活动' + actDisc + '折') : ('一口价¥' + actPrice.toFixed(2)));
  } else if (member != null) {
    finalPrice = member; source = 'member'; detail = '会员价';
  }
  if (limit) detail += ' · 限购' + limit + '件';
  return { price: finalPrice, original: price, source: source, detail: detail, limit: limit };
}
