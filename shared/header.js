const pageTitles = {
  scenario: '应用场景一览', overview: '经营概览', transaction: '交易分析', product: '商品销售',
  category: '品类分析', trend: '销售趋势', profit: '利润分析',
  cost: '成本管控', member: '会员分析', inventory: '库存预警',
  'biz-stats': '经营统计', 'sales-stats': '销售统计', 'daily-report': '营业日报',
  'product-detail': '销售明细', 'label-print': '价签打印', 'print-plan': '打印计划', 'file-store': '文件库',
  'item-code': '打码记录', 'remove-guard': '结算移除',
  'order-hold': '挂单记录', 'shift-handover': '交班记录', 'personal-shift': '交班记录',
  'price-log': '改价日志', 'goods-class': '商品分类', 'goods-list': '商品列表', 'sale-activity': '打折活动',
  'group-manage': '企业管理', 'store-manage': '门店管理', 'group-form': '企业管理', 'store-form': '门店管理', 'product-memo': '产品备忘',
  'inventory-notify': '库存提醒',
  'inv-list': '库存列表', 'inv-entry': '入库单', 'inv-transfer': '调拨记录',
  'inv-return': '退货记录', 'inv-check': '盘点记录',
  'member-list': '会员列表', 'member-record': '会员记录', 'member-store': '权益商城',
  'member-exchange': '兑换记录', 'member-activate': '会员配置', 'member-price': '会员价计划',
  'cp-template': '优惠券模板', 'cp-plan': '优惠券计划', 'cp-record': '优惠券记录',
  'goods-standard': '标准商品', 'supplier-list': '供应商列表', 'goods-unit': '计量单位',
  'brand-library': '品牌库', 'order-list': '订单列表',
  'user-list': '用户管理', 'role-list': '角色管理', 'function-tree': '功能菜单',
  'marketing-price-rule': '动态调价初始需求', 'dynamic-pricing': '动态调价'
};
// 不需要 scope-bar（企业/门店/日期 tab）的页面（单一数据源，layout.js 复用）
const NO_SCOPE_PAGES = [
  'label-print', 'print-plan', 'file-store', 'price-log', 'goods-class', 'goods-list',
  'sale-activity', 'group-manage', 'store-manage', 'group-form', 'store-form',
  'remove-guard', 'order-hold', 'shift-handover', 'daily-report', 'personal-shift',
  'product-memo', 'item-code', 'marketing-price-rule', 'dynamic-pricing',
  'inventory-notify', 'scenario',
  'inv-list', 'inv-entry', 'inv-transfer', 'inv-return', 'inv-check',
  'member-list', 'member-record', 'member-store', 'member-exchange', 'member-activate', 'member-price',
  'cp-template', 'cp-plan', 'cp-record',
  'goods-standard', 'supplier-list', 'goods-unit', 'brand-library', 'order-list',
  'user-list', 'role-list', 'function-tree'
];
const PAGE_GROUPS = {
  scenario: '应用场景', overview: '核心看板', transaction: '核心看板',
  product: '销售分析', category: '销售分析', 'product-detail': '销售分析', trend: '销售分析',
  profit: '财务分析', cost: '财务分析',
  member: '客户运营', inventory: '客户运营', 'inventory-notify': '客户运营',
  'biz-stats': '统计报表', 'sales-stats': '统计报表', 'daily-report': '统计报表',
  'label-print': '打印管理', 'print-plan': '打印管理', 'file-store': '智慧零售云',
  'item-code': '销售管理', 'remove-guard': '销售管理', 'order-hold': '销售管理', 'shift-handover': '销售管理', 'personal-shift': '销售管理',
  'price-log': '商品管理', 'goods-class': '商品管理', 'goods-list': '商品管理',
  'sale-activity': '营销管理',
  'group-manage': '系统管理', 'store-manage': '系统管理', 'group-form': '系统管理', 'store-form': '系统管理', 'product-memo': '产品管理',
  'user-list': '系统管理', 'role-list': '系统管理', 'function-tree': '系统管理',
  'marketing-price-rule': '营销管理', 'dynamic-pricing': '营销管理',
  'inv-list': '库存管理', 'inv-entry': '库存管理', 'inv-transfer': '库存管理',
  'inv-return': '库存管理', 'inv-check': '库存管理',
  'member-list': '会员运营', 'member-record': '会员运营', 'member-store': '会员运营',
  'member-exchange': '会员运营', 'member-activate': '会员运营', 'member-price': '会员运营',
  'cp-template': '优惠券', 'cp-plan': '优惠券', 'cp-record': '优惠券',
  'order-list': '销售管理',
  'goods-standard': '商品管理', 'supplier-list': '商品管理', 'goods-unit': '商品管理', 'brand-library': '商品管理'
};
(function(){
var p=document.getElementById('headerRoot');if(!p)return;
  var _pid = (typeof CURRENT_PAGE !== 'undefined') ? CURRENT_PAGE : 'overview';
  // 提前判断 hide：当前页属于 NO_SCOPE_PAGES 时，整条 scope-bar 直接 inline display:none，首帧即不渲染 → 避免"刷一下闪出 scope-bar 后被延迟隐藏"的闪烁
  var _hideScope = NO_SCOPE_PAGES.indexOf(_pid) >= 0;
  var _scopeDisplay = _hideScope ? 'display:none' : '';
  var _title = pageTitles[_pid] || _pid;
  var _group = PAGE_GROUPS[_pid] || '';
  var _titleHtml = _title + (_pid === 'personal-shift' ? ' <span style="font-size:10px;font-weight:500;display:inline-block;padding:2px 8px;border-radius:3px;background:#fff3e0;color:#e65100;border:1px solid #ffe0b2;vertical-align:middle;margin-left:4px">电子秤终端</span>' : '');
p.innerHTML=`<div class="main">
  <div class="header">
    <div class="header-left">
      <button class="hamburger" onclick="toggleSidebar()" aria-label="菜单">☰</button>
      <div>
        <div class="page-title" id="headerTitle">${_titleHtml}</div>
        <div class="breadcrumb" id="headerBreadcrumb">${_group} / ${_title}</div>
      </div>
    </div>
    <div class="header-right">
      <div style="display:flex;align-items:center;gap:10px"><div class="update-time" id="updateTime">更新时间 —</div></div>
      <div style="display:flex;align-items:center;gap:12px;width:100%;justify-content:flex-end">
        <div class="update-ticker" id="updateTicker"><div class="ticker-wrap"><div class="ticker-track" id="tickerTrack"></div></div></div>
        <button class="concept-reopen hidden" id="conceptReopenBtn" onclick="openConceptBar()" title="显示指标说明">💡 指标说明</button>
      </div>
    </div>
  </div>

  <!-- ===== DATA SCOPE BAR ===== -->
  <div class="scope-bar" id="scopeBar" style="${_scopeDisplay}">

    <div class="scope-item" id="scopeEnterprise" onclick="toggleEnterpriseDropdown(event)">
      <span class="scope-val" id="scopeEnterpriseName">好滋味餐饮</span>
      <span class="scope-arrow">▼</span>
      <div class="scope-dropdown" id="scopeEnterpriseDropdown"></div>
    </div>
    <span class="scope-sep">›</span>
    <div class="scope-item" id="scopeStore" onclick="toggleStoreDropdown(event)">
      <span class="scope-val" id="scopeStoreLabel">全部门店</span>
      <span class="scope-count hidden" id="scopeStoreCount"></span>
      <span class="scope-arrow">▼</span>
      <div class="scope-dropdown" id="scopeStoreDropdown"></div>
    </div>
    <span class="scope-spacer"></span>
    <div class="picker-overlay" id="pickerOverlay" onclick="hidePicker()"></div>
    <div class="period-picker" id="periodPicker"></div>
    <div class="scope-datetime">
      <div class="tab-group" id="dateTabGroup">
        <button class="btn-tab active" id="tabToday" onclick="switchTab('today', this)">今日</button>
        <button class="btn-tab" id="tabWeek" onclick="switchTab('week', this)">本周</button>
        <button class="btn-tab" id="tabMonth" onclick="switchTab('month', this)">本月</button>
        <button class="btn-tab" id="tabYear" onclick="switchTab('year', this)">本年</button>
        <button class="btn-tab" id="tabCustom" onclick="switchTab('custom', this)">自定义</button>
      </div>
      <div class="period-nav">
        <button class="nav-arrow-btn" onclick="navPeriod(-1)" title="上一时段">◀</button>
        <div class="date-range" id="dateDisplay" onclick="openPeriodPicker(currentRange)" title="点击选择日期">📅 2026-05-27（今日）</div>
        <button class="nav-arrow-btn" onclick="navPeriod(1)" title="下一时段">▶</button>
      </div>
    </div>
  </div>
`;
})();
