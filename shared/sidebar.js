(function(){
var p=document.getElementById('sidebarRoot');if(!p)return;
p.innerHTML=`<!-- ===== SIDEBAR ===== -->
<nav class="sidebar">
  <div class="sidebar-logo">
    <div class="brand">🥬 淘菜猫|智店</div>
    <div class="sub">鲜生活，智经营</div>
  </div>

  <div class="sidebar-nav">

  <div class="sidebar-section">产品工作台</div>
  <div class="nav-item" onclick=\"navigateTo('product-memo')\">
    <span class="icon">📝</span> 产品备忘
  </div>

  <div class="sidebar-section">核心看板</div>
  <div class="nav-item active" onclick=\"navigateTo('overview')\">
    <span class="icon">📊</span> 经营概览
  </div>
  <div class="nav-item" onclick=\"navigateTo('transaction')\">
    <span class="icon">💳</span> 交易分析
  </div>

  <div class="sidebar-section">销售分析</div>
  <div class="nav-item" id="nav-product" data-page="product" onclick=\"navigateTo('product')\">
    <span class="icon">🛒</span> 商品销售
  </div>
  <div class="nav-item" onclick=\"navigateTo('category')\">
    <span class="icon">🗂️</span> 品类分析
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('product-detail')\">
    <span class="icon">🔍</span> 销售明细
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('trend')\">
    <span class="icon">📈</span> 销售趋势
  </div>

  <div class="sidebar-section">财务分析</div>
  <div class="nav-item" onclick=\"navigateTo('profit')\">
    <span class="icon">💰</span> 利润分析
  </div>
  <div class="nav-item" onclick=\"navigateTo('cost')\">
    <span class="icon">📉</span> 成本管控
  </div>

  <div class="sidebar-section">客户运营</div>
  <div class="nav-item" onclick=\"navigateTo('member')\">
    <span class="icon">👥</span> 会员分析
  </div>
  <div class="nav-item" onclick=\"navigateTo('inventory')\">
    <span class="icon">📦</span> 库存预警
  </div>

  <div class="sidebar-section">统计报表</div>
  <div class="nav-item phase-one" onclick=\"navigateTo('biz-stats')\">
    <span class="icon">📈</span> 经营统计
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('sales-stats')\">
    <span class="icon">📊</span> 销售统计
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('daily-report')\">
    <span class="icon">📋</span> 营业日报
    <span class="nav-phase-tag">一期</span>
  </div>

  <div class="sidebar-section">打印管理</div>
  <div class="nav-item phase-one" onclick=\"navigateTo('label-print')\">
    <span class="icon">🖨️</span> 价签打印
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('print-plan')\">
    <span class="icon">📋</span> 打印计划
    <span class="nav-phase-tag">一期</span>
  </div>

  <div class="sidebar-section">销售管理</div>
  <div class="nav-item phase-one" onclick=\"navigateTo('item-code')\">
    <span class="icon">🏷️</span> 打码记录
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('remove-guard')\">
    <span class="icon">🔐</span> 结算移除
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('order-hold')\">
    <span class="icon">🧾</span> 挂单记录
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('shift-handover')\">
    <span class="icon">🔄</span> 交班记录
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('personal-shift')\">
    <span class="icon">👤</span> 交班记录
    <span class="nav-tag">称</span>
    <span class="nav-phase-tag">一期</span>
  </div>

  <div class="sidebar-section">商品管理</div>
  <div class="nav-item phase-one" onclick=\"navigateTo('goods-class')\">
    <span class="icon">📂</span> 商品分类
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('goods-list')\">
    <span class="icon">📋</span> 商品列表
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('price-log')\">
    <span class="icon">💲</span> 改价日志
    <span class="nav-phase-tag">一期</span>
  </div>

  <div class="sidebar-section">系统管理</div>
  <div class="nav-item phase-one" onclick=\"navigateTo('group-manage')\">
    <span class="icon">🏢</span> 企业管理
    <span class="nav-phase-tag">一期</span>
  </div>
  <div class="nav-item phase-one" onclick=\"navigateTo('store-manage')\">
    <span class="icon">🏪</span> 门店管理
    <span class="nav-phase-tag">一期</span>
  </div>

  <div class="sidebar-section">智慧零售云</div>
  <div class="nav-item phase-one" onclick=\"navigateTo('file-store')\">
    <span class="icon">📁</span> 文件库
    <span class="nav-phase-tag tag-meitian">美天</span>
  </div>

  </div><!-- .sidebar-nav -->

  <div class="sidebar-footer">
    <div class="store-name">🏪 崧泽大道中心店</div>
    <div class="store-info" id="sidebarDate">今日 2026-05-27 · 营业中</div>
  </div>
</nav>`;
// highlight active item
var items=p.querySelectorAll('.nav-item');
for(var i=0;i<items.length;i++){
  var oc=items[i].getAttribute('onclick')||'';
  if(oc.indexOf("'"+CURRENT_PAGE+"'")>=0){items[i].classList.add('active');break;}
}
})();
