(function(){
var p=document.getElementById('sidebarRoot');if(!p)return;
p.innerHTML=`<!-- ===== SIDEBAR ===== -->
<nav class="sidebar">
  <div class="sidebar-logo">
    <div class="brand">🥬 淘菜猫|智店</div>
    <div class="sub">鲜生活，智经营</div>
    <div class="sidebar-memo" onclick=\"navigateTo('product-memo')\" title="产品备忘">📝</div>
  </div>

  <div class="sidebar-nav">

  <div class="sidebar-section">应用场景</div>
  <div class="nav-item" data-page="scenario" onclick="navigateTo('scenario')">
    <span class="icon">🏬</span> 应用场景一览
  </div>

  <div class="sidebar-section">核心看板</div>
  <div class="nav-item active" onclick=\"navigateTo('overview')\">
    <span class="icon">📊</span> 经营概览
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('transaction')\">
    <span class="icon">💳</span> 交易分析
    <span class="nav-phase-tag">规划</span>
  </div>

  <div class="sidebar-section">销售分析</div>
  <div class="nav-item" id="nav-product" data-page="product" onclick=\"navigateTo('product')\">
    <span class="icon">🛒</span> 商品销售
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('category')\">
    <span class="icon">🗂️</span> 品类分析
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('product-detail')\">
    <span class="icon">🔍</span> 销售明细
  </div>
  <div class="nav-item" onclick=\"navigateTo('trend')\">
    <span class="icon">📈</span> 销售趋势
    <span class="nav-phase-tag">规划</span>
  </div>

  <div class="sidebar-section">财务分析</div>
  <div class="nav-item" onclick=\"navigateTo('profit')\">
    <span class="icon">💰</span> 利润分析
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('cost')\">
    <span class="icon">📉</span> 成本管控
    <span class="nav-phase-tag">规划</span>
  </div>

  <div class="sidebar-section">客户运营</div>
  <div class="nav-item" onclick=\"navigateTo('member')\">
    <span class="icon">👥</span> 会员分析
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('inventory')\">
    <span class="icon">📦</span> 库存预警
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('inventory-notify')\">
    <span class="icon">🔔</span> 库存提醒
    <span class="nav-phase-tag">规划</span>
  </div>

  <div class="sidebar-section">会员运营</div>
  <div class="nav-item" onclick=\"navigateTo('member-list')\">
    <span class="icon">👤</span> 会员列表
  </div>
  <div class="nav-item" onclick=\"navigateTo('member-record')\">
    <span class="icon">🧾</span> 会员记录
  </div>
  <div class="nav-item" onclick=\"navigateTo('member-store')\">
    <span class="icon">🎁</span> 权益商城
  </div>
  <div class="nav-item" onclick=\"navigateTo('member-exchange')\">
    <span class="icon">🔁</span> 兑换记录
  </div>
  <div class="nav-item" onclick=\"navigateTo('member-activate')\">
    <span class="icon">📱</span> 会员配置
  </div>
  <div class="nav-item" onclick=\"navigateTo('member-price')\">
    <span class="icon">🏷️</span> 会员价计划
  </div>

  <div class="sidebar-section">统计报表</div>
  <div class="nav-item" onclick=\"navigateTo('biz-stats')\">
    <span class="icon">📈</span> 经营统计
  </div>
  <div class="nav-item" onclick=\"navigateTo('sales-stats')\">
    <span class="icon">📊</span> 销售统计
  </div>
  <div class="nav-item" onclick=\"navigateTo('daily-report')\">
    <span class="icon">📋</span> 营业日报
  </div>

  <div class="sidebar-section">打印管理</div>
  <div class="nav-item" onclick=\"navigateTo('label-print')\">
    <span class="icon">🖨️</span> 价签打印
  </div>
  <div class="nav-item" onclick=\"navigateTo('print-plan')\">
    <span class="icon">📋</span> 打印计划
  </div>

  <div class="sidebar-section">销售管理</div>
  <div class="nav-item" onclick=\"navigateTo('order-list')\">
    <span class="icon">🧾</span> 订单列表
  </div>
  <div class="nav-item" onclick=\"navigateTo('item-code')\">
    <span class="icon">🏷️</span> 打码记录
  </div>
  <div class="nav-item" onclick=\"navigateTo('remove-guard')\">
    <span class="icon">🔐</span> 结算移除
  </div>
  <div class="nav-item" onclick=\"navigateTo('order-hold')\">
    <span class="icon">⏳</span> 挂单记录
  </div>
  <div class="nav-item" onclick=\"navigateTo('shift-handover')\">
    <span class="icon">🔄</span> 交班记录
  </div>
  <div class="nav-item" onclick=\"navigateTo('personal-shift')\">
    <span class="icon">👤</span> 交班记录
    <span class="nav-tag">称</span>
  </div>

  <div class="sidebar-section">商品管理</div>
  <div class="nav-item" onclick=\"navigateTo('goods-class')\">
    <span class="icon">📂</span> 商品分类
  </div>
  <div class="nav-item" onclick=\"navigateTo('goods-list')\">
    <span class="icon">📋</span> 商品列表
  </div>
  <div class="nav-item" onclick=\"navigateTo('goods-standard')\">
    <span class="icon">📚</span> 标准商品
  </div>
  <div class="nav-item" onclick=\"navigateTo('supplier-list')\">
    <span class="icon">🏭</span> 供应商列表
  </div>
  <div class="nav-item" onclick=\"navigateTo('goods-unit')\">
    <span class="icon">📏</span> 计量单位
  </div>
  <div class="nav-item" onclick=\"navigateTo('brand-library')\">
    <span class="icon">🏷️</span> 品牌库
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('price-log')\">
    <span class="icon">💲</span> 改价日志
  </div>

  <div class="sidebar-section">库存管理</div>
  <div class="nav-item" onclick=\"navigateTo('inv-list')\">
    <span class="icon">🗃️</span> 库存列表
  </div>
  <div class="nav-item" onclick=\"navigateTo('inv-entry')\">
    <span class="icon">📥</span> 入库单
  </div>
  <div class="nav-item" onclick=\"navigateTo('inv-transfer')\">
    <span class="icon">🔀</span> 调拨记录
  </div>
  <div class="nav-item" onclick=\"navigateTo('inv-return')\">
    <span class="icon">↩️</span> 退货记录
  </div>
  <div class="nav-item" onclick=\"navigateTo('inv-check')\">
    <span class="icon">🧮</span> 盘点记录
  </div>

  <div class="sidebar-section">营销管理</div>
  <div class="nav-item" onclick=\"navigateTo('marketing-price-rule')\">
    <span class="icon">🎯</span> 动态调价初始需求
    <span class="nav-phase-tag tag-liu">规划-刘</span>
  </div>
  <div class=\"nav-item\" onclick=\"navigateTo('dynamic-pricing')\">
    <span class=\"icon\">🎯</span> 动态调价
  </div>
  <div class="nav-item" onclick=\"navigateTo('sale-activity')\">
    <span class="icon">🏷️</span> 打折活动
  </div>

  <div class="sidebar-section">优惠券</div>
  <div class="nav-item" onclick=\"navigateTo('cp-template')\">
    <span class="icon">🎫</span> 优惠券模板
  </div>
  <div class="nav-item" onclick=\"navigateTo('cp-plan')\">
    <span class="icon">🗓️</span> 优惠券计划
  </div>
  <div class="nav-item" onclick=\"navigateTo('cp-record')\">
    <span class="icon">📒</span> 优惠券记录
  </div>

  <div class="sidebar-section">系统管理</div>
  <div class="nav-item" onclick=\"navigateTo('user-list')\">
    <span class="icon">👤</span> 用户管理
  </div>
  <div class="nav-item" onclick=\"navigateTo('role-list')\">
    <span class="icon">🛡️</span> 角色管理
  </div>
  <div class="nav-item" onclick=\"navigateTo('function-tree')\">
    <span class="icon">🗂️</span> 功能菜单
  </div>
  <div class="nav-item" onclick=\"navigateTo('group-manage')\">
    <span class="icon">🏢</span> 企业管理
  </div>
  <div class="nav-item" onclick=\"navigateTo('store-manage')\">
    <span class="icon">🏪</span> 门店管理
  </div>

  <div class="sidebar-section">数据大屏</div>
  <div class="nav-item" onclick=\"window.open('../bigscreen.html','_blank')\">
    <span class="icon">🖥️</span> 数字大屏系统
  </div>
  <div class="nav-item" onclick=\"window.open('../bigscreen-fluid.html','_blank')\">
    <span class="icon">📐</span> 大屏·流式自适应
  </div>

  <div class="sidebar-section">智慧零售云</div>
  <div class="nav-item" onclick=\"navigateTo('file-store')\">
    <span class="icon">📁</span> 文件库
    <span class="nav-phase-tag tag-meitian">美天</span>
  </div>

  </div><!-- .sidebar-nav -->

  <div class="sidebar-footer">
    <div class="store-name">🏪 崧泽大道中心店</div>
    <div class="store-info" id="sidebarDate">今日 2026-05-27 · 营业中</div>
  </div>
</nav>`;
// highlight active item (先清除所有 active，再给当前页加，避免模板里写死的 active 残留导致多处高亮)
var items=p.querySelectorAll('.nav-item');
for(var i=0;i<items.length;i++){ items[i].classList.remove('active'); }
for(var i=0;i<items.length;i++){
  var oc=items[i].getAttribute('onclick')||'';
  if(oc.indexOf("'"+CURRENT_PAGE+"'")>=0){items[i].classList.add('active');break;}
}
// 导航后让当前激活项保持在侧栏可视区域内（避免深层级菜单项被滚出视图，回到最上方）
var _nav=p.querySelector('.sidebar-nav');
var _active=p.querySelector('.nav-item.active');
if(_nav && _active && typeof _active.scrollIntoView==='function'){ _active.scrollIntoView({block:'nearest'}); }
})();
