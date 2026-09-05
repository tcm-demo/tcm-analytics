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
    <div class="mobile-tab active" onclick="mobileSwitchTab('scenario', this)">
      <span class="mt-icon">🏬</span> 应用场景
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
  <div class="mobile-more-section">核心看板</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('overview')">
    <span class="mm-icon">📊</span> 经营概览
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('product-memo')">
    <span class="mm-icon">📝</span> 产品备忘
  </div>

  <div class="mobile-more-section">统计报表</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('biz-stats')">
    <span class="mm-icon">📈</span> 经营统计
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('sales-stats')">
    <span class="mm-icon">📊</span> 销售统计
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('daily-report')">
    <span class="mm-icon">📋</span> 营业日报
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('product-detail')">
    <span class="mm-icon">📋</span> 销售明细
  </div>
  <div class="mobile-more-section">分析工具</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('category')">
    <span class="mm-icon">🗂️</span> 品类分析
    <span class="mm-phase-tag">规划</span>
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('trend')">
    <span class="mm-icon">📈</span> 销售趋势
    <span class="mm-phase-tag">规划</span>
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('profit')">
    <span class="mm-icon">💵</span> 利润分析
    <span class="mm-phase-tag">规划</span>
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('cost')">
    <span class="mm-icon">📉</span> 成本管控
    <span class="mm-phase-tag">规划</span>
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member')">
    <span class="mm-icon">👥</span> 会员分析
    <span class="mm-phase-tag">规划</span>
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('inventory')">
    <span class="mm-icon">📦</span> 库存预警
    <span class="mm-phase-tag">规划</span>
  </div>
  <div class="mobile-more-section">打印管理</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('label-print')">
    <span class="mm-icon">🖨️</span> 价签打印
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('print-plan')">
    <span class="mm-icon">📋</span> 打印计划
  </div>

  <div class="mobile-more-section">销售管理</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('order-list')">
    <span class="mm-icon">🧾</span> 订单列表
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('item-code')">
    <span class="mm-icon">🏷️</span> 打码记录
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('remove-guard')">
    <span class="mm-icon">🔐</span> 结算移除
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('order-hold')">
    <span class="mm-icon">⏳</span> 挂单记录
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('shift-handover')">
    <span class="mm-icon">🔄</span> 交班记录
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('personal-shift')">
    <span class="mm-icon">👤</span> 交班记录
    <span class="mm-tag">称</span>
  </div>
  <div class="mobile-more-section">商品管理</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('goods-class')">
    <span class="mm-icon">📂</span> 商品分类
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('goods-list')">
    <span class="mm-icon">📋</span> 商品列表
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('goods-standard')">
    <span class="mm-icon">📚</span> 标准商品
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('supplier-list')">
    <span class="mm-icon">🏭</span> 供应商列表
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('goods-unit')">
    <span class="mm-icon">📏</span> 计量单位
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('brand-library')">
    <span class="mm-icon">🏷️</span> 品牌库
    <span class="mm-phase-tag">规划</span>
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('price-log')">
    <span class="mm-icon">💲</span> 改价日志
  </div>
  <div class="mobile-more-section">库存管理</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('inv-list')">
    <span class="mm-icon">🗃️</span> 库存列表
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('inv-entry')">
    <span class="mm-icon">📥</span> 入库单
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('inv-transfer')">
    <span class="mm-icon">🔀</span> 调拨记录
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('inv-return')">
    <span class="mm-icon">↩️</span> 退货记录
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('inv-check')">
    <span class="mm-icon">🧮</span> 盘点记录
  </div>
  <div class="mobile-more-section">会员运营</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member-list')">
    <span class="mm-icon">👤</span> 会员列表
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member-record')">
    <span class="mm-icon">🧾</span> 会员记录
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member-store')">
    <span class="mm-icon">🎁</span> 权益商城
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member-exchange')">
    <span class="mm-icon">🔁</span> 兑换记录
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member-activate')">
    <span class="mm-icon">📱</span> 会员配置
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('member-price')">
    <span class="mm-icon">🏷️</span> 会员价计划
  </div>
  <div class="mobile-more-section">营销管理</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('marketing-price-rule')">
    <span class="mm-icon">🎯</span> 动态调价初始需求
    <span class="mm-phase-tag tag-liu">规划-刘</span>
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('dynamic-pricing')">
    <span class="mm-icon">🎯</span> 动态调价
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('sale-activity')">
    <span class="mm-icon">🏷️</span> 打折活动
  </div>
  <div class="mobile-more-section">优惠券</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('cp-template')">
    <span class="mm-icon">🎫</span> 优惠券模板
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('cp-plan')">
    <span class="mm-icon">🗓️</span> 优惠券计划
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('cp-record')">
    <span class="mm-icon">📒</span> 优惠券记录
  </div>
  <div class="mobile-more-section">系统管理</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('user-list')">
    <span class="mm-icon">👤</span> 用户管理
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('role-list')">
    <span class="mm-icon">🛡️</span> 角色管理
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('function-tree')">
    <span class="mm-icon">🗂️</span> 功能菜单
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('group-manage')">
    <span class="mm-icon">🏢</span> 企业管理
  </div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('store-manage')">
    <span class="mm-icon">🏪</span> 门店管理
  </div>
  <div class="mobile-more-section">智慧零售云</div>
  <div class="mobile-more-item" onclick="mobileMoreSelect('file-store')">
    <span class="mm-icon">📁</span> 文件库
    <span class="mm-phase-tag tag-meitian">美天</span>
  </div>
</div>
`;
})();
