(function(){
var p=document.getElementById('modalRoot');if(!p)return;
p.innerHTML=`</div><!-- /main -->

<!-- ===== 订单详情 Modal ===== -->
<div id="orderDetailBackdrop" onclick="closeOrderDetail()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;"></div>
<div id="orderDetailModal" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(680px,95vw);max-height:80vh;overflow-y:auto;background:#fff;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,0.18);z-index:9001;padding:24px;">
  <div id="orderDetailInner"></div>
</div>

<!-- ===== MOBILE BOTTOM TAB BAR ===== -->
<div class="mobile-tabs" id="mobileTabs">
  <div class="mobile-tabs-inner">
    <div class="mobile-tab active" onclick="mobileSwitchTab('overview', this)">
      <span class="mt-icon">🏠</span> 概览
    </div>
    <div class="mobile-tab" onclick="mobileSwitchTab('transaction', this)">
      <span class="mt-icon">💰</span> 交易
    </div>
    <div class="mobile-tab" onclick="mobileSwitchTab('product', this)">
      <span class="mt-icon">🛒</span> 商品
    </div>
    <div class="mobile-tab" id="mobileMoreTab" onclick="toggleMobileMoreMenu()">
      <span class="mt-icon">⋯</span> 更多
    </div>
  </div>
</div>

<!-- ===== MOBILE MORE MENU ===== -->
<div class="mobile-more-backdrop" id="mobileMoreBackdrop" onclick="closeMobileMoreMenu()"></div>
<div class="mobile-more-menu" id="mobileMoreMenu">
  <div class="mobile-more-section">产品工作台</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('product-memo')">
    <span class="mm-icon">📝</span> 产品备忘
  </div>

  <div class="mobile-more-section">统计报表</div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('biz-stats')">
    <span class="mm-icon">📈</span> 经营统计
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('sales-stats')">
    <span class="mm-icon">📊</span> 销售统计
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('daily-report')">
    <span class="mm-icon">📋</span> 营业日报
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('product-detail')">
    <span class="mm-icon">📋</span> 销售明细
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-section">分析工具</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('category')">
    <span class="mm-icon">🗂️</span> 品类分析
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('trend')">
    <span class="mm-icon">📈</span> 销售趋势
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('profit')">
    <span class="mm-icon">💵</span> 利润分析
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('cost')">
    <span class="mm-icon">📉</span> 成本管控
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member')">
    <span class="mm-icon">👥</span> 会员分析
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('inventory')">
    <span class="mm-icon">📦</span> 库存预警
  </div>
  <div class="mobile-more-section">打印管理</div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('label-print')">
    <span class="mm-icon">🖨️</span> 价签打印
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('print-plan')">
    <span class="mm-icon">📋</span> 打印计划
    <span class="mm-phase-tag">一期</span>
  </div>

  <div class="mobile-more-section">销售管理</div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('item-code')">
    <span class="mm-icon">🏷️</span> 打码记录
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('remove-guard')">
    <span class="mm-icon">🔐</span> 结算移除
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('order-hold')">
    <span class="mm-icon">🧾</span> 挂单记录
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('shift-handover')">
    <span class="mm-icon">🔄</span> 交班记录
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('personal-shift')">
    <span class="mm-icon">👤</span> 交班记录
    <span class="mm-tag">称</span>
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-section">商品管理</div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('goods-class')">
    <span class="mm-icon">📂</span> 商品分类
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('goods-list')">
    <span class="mm-icon">📋</span> 商品列表
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('price-log')">
    <span class="mm-icon">💲</span> 改价日志
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-section">系统管理</div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('group-manage')">
    <span class="mm-icon">🏢</span> 企业管理
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('store-manage')">
    <span class="mm-icon">🏪</span> 门店管理
    <span class="mm-phase-tag">一期</span>
  </div>
  <div class="mobile-more-section">智慧零售云</div>
  <div class="mobile-more-item phase-one" onclick="mobileMoreSelect('file-store')">
    <span class="mm-icon">📁</span> 文件库
    <span class="mm-phase-tag tag-meitian">美天</span>
  </div>
</div>
`;
})();
