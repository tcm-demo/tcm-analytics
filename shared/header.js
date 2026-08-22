(function(){
var p=document.getElementById('headerRoot');if(!p)return;
p.innerHTML=`<div class="main">
  <div class="header">
    <div class="header-left">
      <button class="hamburger" onclick="toggleSidebar()" aria-label="菜单">☰</button>
      <div>
        <div class="page-title" id="headerTitle">经营概览</div>
        <div class="breadcrumb" id="headerBreadcrumb">核心看板 / 经营概览</div>
      </div>
    </div>
    <div class="header-right">
      <div class="update-time" id="updateTime">更新时间 —</div>
      <div style="display:flex;align-items:center;gap:12px;width:100%;justify-content:flex-end">
        <div class="update-ticker" id="updateTicker"><div class="ticker-wrap"><div class="ticker-track" id="tickerTrack"></div></div></div>
        <button class="concept-reopen hidden" id="conceptReopenBtn" onclick="openConceptBar()" title="显示指标说明">💡 指标说明</button>
      </div>
    </div>
  </div>

  <!-- ===== DATA SCOPE BAR ===== -->
  <div class="scope-bar" id="scopeBar">

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
