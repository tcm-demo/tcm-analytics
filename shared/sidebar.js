/* 演示数据导出 / 导入：以 sidebar.js 自身 URL 推导同目录路径加载（各壳页层级不同，不能写死相对路径），
   这样 70 多个壳页不用逐个加 <script>，新增页面也自动具备该能力。 */
(function(){
  if(window.__DIO_LOADED__)return;window.__DIO_LOADED__=true;
  var src='';
  try{ src=(document.currentScript&&document.currentScript.src)||''; }catch(e){}
  var url=src?src.replace(/sidebar\.js(\?.*)?$/,'ms-data-io.js'):'../shared/ms-data-io.js';
  var s=document.createElement('script');s.src=url;document.head.appendChild(s);
})();

(function(){
var p=document.getElementById('sidebarRoot');if(!p)return;

/* ===== 版本标签配置（单一来源） =====
   一个页面可挂多个版本（数组按顺序从左到右渲染），用于标出「这一页属于哪个版本的改动」。
   约定：
   ① 版本需求全部上线、验收通过后，把该页对应的版本从数组里删掉即完成「标签移除」；
      数组空了就整行删除（不留空数组）。
   ② 只标「本次版本真正改到的页面」，不标受影响的相邻页面。
   ③ 标签是描边胶囊（.tag-ver），与「优化 / 新功能 / 规划」等实底状态标签并存，互不覆盖。
   当前：库存 V2.0（入库自动拆零 / 入库自动补货 / 拆零装箱双位置 / 单一候选自动完成 / 销售优先扣本规格） */
var NAV_VER_TAGS = {
  'inv-list':       ['2.0'],   /* 库存查询：拆零装箱双位置、单一候选自动完成、模拟销售出库 */
  'inv-detail':     ['2.0'],   /* 库存明细：新增「销售」流水类型与仓库/货架双位置流水 */
  'inv-entry':      ['2.0'],   /* 入库记录：入库落账后入库自动拆零 + 入库自动补货 */
  'store-manage':   ['2.0'],   /* 门店管理：管控配置新增「库存配置 V2.0」页签 */
  'goods-list':     ['2.0']    /* 商品列表（门店商品）：关联商品可编辑——拆零关系来源（商品库不承载） */
};
/* 暴露给 modals.js 的移动端菜单复用同一份配置，避免两处维护导致桌面/移动标签不一致 */
window.NAV_VER_TAGS = NAV_VER_TAGS;
/* 版本名（顶部滚动条展示用；键须与 NAV_VER_TAGS 中的版本号一致） */
var NAV_VER_NAMES = { '2.0': '库存管理升级' };
window.NAV_VER_NAMES = NAV_VER_NAMES;

/* ===== 版本 → 需求说明文档（仅作映射备用；版本标签点击已改为「只筛选」，不再打开 PRD） =====
   值 = 根目录 md 文件名（不含 .md），与 prd.html 的 ?doc= 一致；
   md 改名时必须同步改这里，否则标签点了打不开对应文档。 */
var NAV_VER_PRD = { '2.0': '库存管理V2.0需求说明' };
window.NAV_VER_PRD = NAV_VER_PRD;

/* 打开对应版本的需求说明：所有业务页都在 pages/ 下，prd.html 在根目录 */
window.openVerPrd = function(ver, ev){
  if (ev && ev.stopPropagation) ev.stopPropagation();
  var doc = (window.NAV_VER_PRD || {})[ver];
  if (!doc) return;
  var base = /\/pages\//.test(location.pathname) ? '../prd.html' : 'prd.html';
  window.open(base + '?doc=' + encodeURIComponent(doc), '_blank');
};

/* ===== 顶部滚动条的「版本批次」（只列这三条） =====
   ① tags 为空 = 页面来自 NAV_VER_TAGS（有版本号的正式版本，目前只有 2.0）；
   ② tags 有值 = 按侧栏 .nav-phase-tag 文案聚合页面（标签改了这里自动跟随，不用两处维护）；
   ③ 想加/减滚动条上的批次，只改这个数组；某项聚合到 0 个页面时自动不显示。 */
var NAV_VER_BUCKETS = [
  { key: '2.0', label: 'V2.0', name: '库存管理升级' },
  { key: 'opt', label: '优化+新功能', name: '', tags: ['优化', '新功能'] },
  { key: 'oct', label: '10月优化', name: '', tags: ['10月优化', '10月新增'] }
];
window.NAV_VER_BUCKETS = NAV_VER_BUCKETS;

/* key → 页面 id 数组；渲染时算一次后缓存（筛选会把导航项隐藏，不能边筛边算） */
var NAV_VER_PAGES = {};
window.NAV_VER_PAGES = NAV_VER_PAGES;

function navItemPageId(it){
  var dp=it.getAttribute('data-page');if(dp)return dp;
  var oc=it.getAttribute('onclick')||'';
  var m=oc.match(/navigateTo\('([^']+)'/);
  return m?m[1]:'';
}

function navBuildVerPages(){
  var nav=p.querySelector('.sidebar-nav');if(!nav)return;
  var items=nav.querySelectorAll('.nav-item');
  NAV_VER_BUCKETS.forEach(function(b){
    var list=[];
    if(b.tags&&b.tags.length){
      for(var i=0;i<items.length;i++){
        var it=items[i];
        var tag=it.querySelector('.nav-phase-tag:not(.tag-ver)');
        if(!tag)continue;
        var txt=(tag.textContent||'').replace(/\s+/g,'');
        if(b.tags.indexOf(txt)<0)continue;
        var pid=navItemPageId(it);
        if(pid&&list.indexOf(pid)<0)list.push(pid);
      }
    }else{
      var map=window.NAV_VER_TAGS||{};
      Object.keys(map).forEach(function(pid){
        if((map[pid]||[]).indexOf(b.key)>=0&&list.indexOf(pid)<0)list.push(pid);
      });
    }
    NAV_VER_PAGES[b.key]=list;
  });
}
window.navBuildVerPages=navBuildVerPages;

/* ===== 按版本筛选侧边栏 =====
   localStorage 'tcm_nav_ver_filter' 存当前筛选版本号（跳页后由本函数自动恢复）；
   筛选时只显示 NAV_VER_TAGS[ver] 涉及的导航项，空的分组/子组标题一并隐藏，
   并在导航顶部插入提示条（点击可清除）。ver 为空 = 清除筛选、恢复全量。 */
function navApplyVerFilter(){
  var nav=p.querySelector('.sidebar-nav');if(!nav)return;
  var ver=null;
  try{ver=localStorage.getItem('tcm_nav_ver_filter');}catch(e){}
  /* 页面集合来自 NAV_VER_PAGES（版本批次：正式版本号 + 侧栏标签聚合批次） */
  var pids=(ver&&NAV_VER_PAGES[ver])||[];
  if(ver&&!pids.length)ver=null;
  var tip=nav.querySelector('.nav-ver-tip');if(tip)tip.remove();
  var items=nav.querySelectorAll('.nav-item');
  var kept=[];
  for(var i=0;i<items.length;i++){
    var it=items[i],show=!ver;
    if(ver){var oc=it.getAttribute('onclick')||'';
      for(var j=0;j<pids.length;j++){if(oc.indexOf("'"+pids[j]+"'")>=0){show=true;break;}}}
    it.style.display=show?'':'none';
    if(show)kept.push(it);
  }
  // 空分组隐藏：先全藏，再按「组内是否有可见项」逐一点亮
  // （subtitle 只看自己到下一个标题之间的项；section 看自己到下一个 section 之间的项）
  var heads=nav.querySelectorAll('.sidebar-section,.sidebar-subtitle');
  for(var k=0;k<heads.length;k++)heads[k].style.display=ver?'none':'';
  if(ver){
    for(var k=0;k<heads.length;k++){
      var h=heads[k],isSub=h.classList.contains('sidebar-subtitle');
      var e=h.nextElementSibling,has=false;
      while(e){
        if(e.classList.contains('sidebar-section'))break;
        if(e.classList.contains('sidebar-subtitle')){
          if(isSub)break; /* subtitle 只看自己到下一个标题之间的项，不越界 */
          var e2=e.nextElementSibling,sub=false;
          while(e2&&!e2.classList.contains('sidebar-section')&&!e2.classList.contains('sidebar-subtitle')){
            if(e2.classList.contains('nav-item')&&e2.style.display!=='none')sub=true;
            e2=e2.nextElementSibling;
          }
          e.style.display=sub?'':'none';
          if(sub)has=true;e=e2;continue;
        }
        if(e.classList.contains('nav-item')&&e.style.display!=='none')has=true;
        e=e.nextElementSibling;
      }
      h.style.display=has?'':'none';
    }
    /* 标题取批次文案：V2.0 / 优化+新功能 / 10月优化 */
    var bk=null;
    (window.NAV_VER_BUCKETS||[]).forEach(function(x){if(x.key===ver)bk=x;});
    var bkLabel=bk?bk.label:('V'+ver);
    var bkName=bk?(bk.name||''):((window.NAV_VER_NAMES&&NAV_VER_NAMES[ver])||'');
    var tipEl=document.createElement('div');
    tipEl.className='nav-ver-tip';
    /* 该批次有需求说明时，提示条里给一个 PRD 入口（新窗口打开，不影响筛选态） */
    var prdDoc=(window.NAV_VER_PRD||{})[ver];
    tipEl.innerHTML='<div class="nav-ver-row1"><b>'+bkLabel+'</b>'
      +(bkName?' '+bkName:'')+'</div>'
      +'<div class="nav-ver-row2"><span class="nav-ver-cnt">'+kept.length+' 项功能</span>'
      +(prdDoc?'<span class="nav-ver-prd" onclick="openVerPrd(\''+ver+'\', event)" title="查看 V'+ver+' 需求说明">📄 PRD</span>':'')
      +'<span class="nav-ver-clear" onclick="navClearVerFilter()">✕ 清除筛选</span></div>';
    nav.insertBefore(tipEl,nav.firstChild);
  }
}
window.navApplyVerFilter=navApplyVerFilter;
window.navClearVerFilter=function(){
  try{localStorage.removeItem('tcm_nav_ver_filter');}catch(e){}
  navApplyVerFilter();
  if(typeof window.syncTickerVerActive==='function')window.syncTickerVerActive();
};

/* 把版本标签挂到对应导航项：已有的单标签先收进 .nav-tags 容器，再追加版本标签，
   多点挂载也不会出现「两个 margin-left:auto 各占一半、标签被撑散」的问题。 */
function navApplyVerTags(root){
  Object.keys(NAV_VER_TAGS).forEach(function(pid){
    var vers=NAV_VER_TAGS[pid];if(!vers||!vers.length)return;
    var item=root.querySelector('.nav-item[onclick*="\''+pid+'\'"]');if(!item)return;
    var box=item.querySelector('.nav-tags');
    if(!box){
      box=document.createElement('span');box.className='nav-tags';
      for(var i=item.children.length-1;i>=0;i--){
        var c=item.children[i];
        if(c.classList&&c.classList.contains('nav-phase-tag')){box.insertBefore(c,box.firstChild);}
      }
      item.appendChild(box);
    }
    vers.forEach(function(v){
      var t=document.createElement('span');
      t.className='nav-phase-tag tag-ver';
      t.setAttribute('data-ver',v);
      t.textContent='V'+v;
      /* 版本标签只做筛选：点击把侧边栏筛到该版本涉及的页面，再点取消。
         不再打开需求说明文档（PRD 直接访问 prd.html），阻止冒泡避免顺带跳到该页 */
      t.className+=' tag-ver-link';
      t.title='筛选 V'+v+' 涉及的功能页（再点取消）';
      t.addEventListener('click',function(e){
        e.stopPropagation();
        if(typeof window.toggleVerFilter==='function')window.toggleVerFilter(v);
      });
      box.appendChild(t);
    });
  });
}

p.innerHTML=`<!-- ===== SIDEBAR ===== -->
<nav class="sidebar">
  <div class="sidebar-logo">
    <div class="brand"><span class="brand-icon">🥬</span><span class="brand-text"> 淘菜猫|智店</span></div>
    <div class="sub">鲜生活，智经营</div>
    <div class="sidebar-memo" onclick=\"navigateTo('product-memo')\" title="产品备忘">📝</div>
  </div>

  <div class="sidebar-nav">

  <div class="sidebar-section">应用场景</div>
  <div class="nav-item" data-page="scenario" onclick="navigateTo('scenario')">
    <span class="icon">🏬</span> 应用场景一览
  </div>
  <div class="nav-item" onclick=\"navigateTo('skeleton-demo')\">
    <span class="icon">⚡</span> 加载与骨架屏
    <span class="nav-phase-tag tag-month">10月新增</span>
  </div>

  <div class="sidebar-section">统计分析</div>

  <div class="sidebar-subtitle">统计看板</div>
  <div class="nav-item" onclick=\"navigateTo('overview')\">
    <span class="icon">📊</span> 经营概览
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('biz-stats')\">
    <span class="icon">📈</span> 经营统计
  </div>
  <div class="nav-item" onclick=\"navigateTo('transaction')\">
    <span class="icon">💳</span> 交易分析
    <span class="nav-phase-tag">规划</span>
  </div>

  <div class="sidebar-subtitle">销售分析</div>
  <div class="nav-item" onclick=\"navigateTo('sales-stats')\">
    <span class="icon">📊</span> 销售统计
  </div>
  <div class="nav-item" id="nav-product" data-page="product" onclick=\"navigateTo('product')\">
    <span class="icon">🛒</span> 商品销售
    <span class="nav-phase-tag tag-v2">商品销售2.0</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('category')\">
    <span class="icon">🗂️</span> 品类分析
    <span class="nav-phase-tag">规划</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('trend')\">
    <span class="icon">📈</span> 销售趋势
    <span class="nav-phase-tag">规划</span>
  </div>

  <div class="sidebar-subtitle">统计报表</div>
  <div class="nav-item" onclick=\"navigateTo('sales-report')\">
    <span class="icon">📑</span> 销售报表
    <span class="nav-phase-tag tag-month">10月新增</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('daily-report')\">
    <span class="icon">📋</span> 营业日报
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

  <div class="sidebar-section">运营分析</div>
  <div class="nav-item" onclick=\"navigateTo('member')\">
    <span class="icon">👥</span> 会员分析
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
    <span class="nav-phase-tag tag-month">10月优化</span>
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

  <div class="sidebar-subtitle">库存管理</div>
  <div class="nav-item" onclick=\"navigateTo('inv-list')\">
    <span class="icon">🗃️</span> 库存查询
  </div>
  <div class="nav-item" onclick=\"navigateTo('inv-detail')\">
    <span class="icon">📋</span> 库存明细
  </div>

  <div class="sidebar-subtitle">预警提醒</div>
  <div class="nav-item" onclick=\"navigateTo('inventory')\">
    <span class="icon">📦</span> 库存预警
    <span class="nav-phase-tag tag-new">新功能</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('inventory-notify')\">
    <span class="icon">🔔</span> 货架补货提醒
    <span class="nav-phase-tag tag-new">新功能</span>
  </div>

  <div class="sidebar-subtitle">入库管理</div>
  <div class="nav-item" onclick=\"navigateTo('inv-entry')\">
    <span class="icon">📥</span> 入库记录<span class="nav-phase-tag tag-opt">优化</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('inv-inquiry')\">
    <span class="icon">🧾</span> 入库查询
  </div>
  <div class="nav-item" onclick=\"navigateTo('supply-price')\">
    <span class="icon">🏷️</span> 进货定价<span class="nav-phase-tag tag-new">新功能</span>
  </div>
  <div class="nav-item" onclick=\"navigateTo('price-approval')\">
    <span class="icon">✅</span> 价格审批<span class="nav-phase-tag tag-new">新功能</span>
  </div>

  <div class="sidebar-subtitle">调货管理</div>
  <div class="nav-item" onclick=\"navigateTo('inv-transfer')\">
    <span class="icon">🔀</span> 调拨记录
    <span class="nav-phase-tag tag-plan">规划</span>
  </div>

  <div class="sidebar-subtitle">退货管理</div>
  <div class="nav-item" onclick=\"navigateTo('inv-return')\">
    <span class="icon">↩️</span> 退货记录<span class="nav-phase-tag tag-opt">优化</span>
  </div>

  <div class="sidebar-subtitle">盘货管理</div>
  <div class="nav-item" onclick=\"navigateTo('inv-check')\">
    <span class="icon">🧮</span> 盘点记录
    <span class="nav-phase-tag tag-opt">优化</span>
  </div>

  <div class="sidebar-section">营销管理</div>
  <div class="nav-item" onclick=\"navigateTo('marketing-price-rule')\">
    <span class="icon">🎯</span> 动态调价初始需求
    <span class="nav-phase-tag tag-liu">规划-刘</span>
  </div>
  <div class=\"nav-item\" onclick=\"navigateTo('dynamic-pricing')\">
    <span class=\"icon\">🎯</span> 动态调价·体验版
  </div>
  <div class=\"nav-item\" onclick=\"navigateTo('dynamic-pricing-full')\">
    <span class=\"icon\">🎯</span> 动态调价·完整版
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
    <span class="nav-phase-tag tag-opt">优化</span>
  </div>

  <div class="sidebar-section">数据大屏</div>
  <div class="nav-item" onclick=\"window.open('../bigscreen.html','_blank')\">
    <span class="icon">🖥️</span> 数字大屏系统
  </div>
  <div class="nav-item" onclick=\"window.open('../bigscreen-fluid.html','_blank')\">
    <span class="icon">📐</span> 大屏·流式自适应
  </div>

  <div class="sidebar-section">中台</div>
  <div class="nav-item" onclick=\"navigateTo('parity-veg')\">
    <span class="icon">🥕</span> 平价菜
    <span class="nav-phase-tag tag-month">10月新增</span>
  </div>

  <div class="sidebar-section">智慧零售云</div>
  <div class="nav-item" onclick=\"navigateTo('file-store')\">
    <span class="icon">📁</span> 文件库
    <span class="nav-phase-tag tag-meitian">美天</span>
  </div>

  </div><!-- .sidebar-nav -->

  <div class="sidebar-footer">
    <div class="sidebar-data-io">
      <button type="button" class="sdio-btn" onclick="dataIoOpen('export')" title="把本地演示数据导出为 JSON 文件"><span class="sdio-ic">⬇</span><span class="sdio-tx">导出数据</span></button>
      <button type="button" class="sdio-btn" onclick="dataIoOpen('import')" title="从 JSON 文件导入演示数据"><span class="sdio-ic">⬆</span><span class="sdio-tx">导入数据</span></button>
    </div>
    <div class="store-name">🏪 崧泽大道中心店</div>
    <div class="store-info" id="sidebarDate">今日 2026-05-27 · 营业中</div>
  </div>
  <div class="sidebar-collapse-bar" onclick="toggleSidebarCollapse()" title="收起菜单">
    <span class="collapse-icon"></span><span class="collapse-text">收起菜单</span>
  </div>
</nav>`;
// 挂版本标签（在渲染后注入，配置项删除即标签消失；不改动模板里的状态标签）
navApplyVerTags(p);

/* ===== 收起态 hover tooltip（fixed 浮层，避开 sidebar-nav overflow 裁剪） =====
   仅 body.sidebar-collapsed 时显示：鼠标悬浮图标 → 右侧浮出「名称 + 标签胶囊」。
   名称取 nav-item 的裸文本节点（排除 .icon / 标签 span）；标签取 .nav-phase-tag + .nav-tag。
   事件委托挂在 .sidebar-nav 上，轻量不逐项绑定。 */
var _tip=document.createElement('div');
_tip.className='nav-collapsed-tip';
document.body.appendChild(_tip);
function _ncpName(it){
  var s='';
  for(var i=0;i<it.childNodes.length;i++){
    var n=it.childNodes[i];
    if(n.nodeType===3) s+=n.textContent;
  }
  return s.replace(/\s+/g,'').trim();
}
function _ncpShow(it){
  if(!document.body.classList.contains('sidebar-collapsed'))return;
  var name=_ncpName(it);if(!name)return;
  var tags=it.querySelectorAll('.nav-phase-tag,.nav-tag');
  var h='<span class="ncp-name">'+name+'</span>';
  if(tags.length){
    h+='<span class="ncp-tags">';
    for(var i=0;i<tags.length;i++){
      var t=tags[i],cls=t.className.replace('nav-phase-tag','').replace('nav-tag','').trim();
      h+='<span class="nav-phase-tag'+(cls?' '+cls:'')+'">'+t.textContent.replace(/\s+/g,'')+'</span>';
    }
    h+='</span>';
  }
  _tip.innerHTML=h;_tip.classList.add('show');
  var r=it.getBoundingClientRect();
  _tip.style.left=(r.right+8)+'px';
  _tip.style.top=(r.top+r.height/2-_tip.offsetHeight/2)+'px';
}
function _ncpHide(){ _tip.classList.remove('show'); }
var _navEl=p.querySelector('.sidebar-nav');
if(_navEl){
  _navEl.addEventListener('mouseover',function(e){
    var it=e.target.closest('.nav-item');if(it)_ncpShow(it);
  });
  _navEl.addEventListener('mouseout',function(e){
    var it=e.target.closest('.nav-item');
    if(it){var rel=e.relatedTarget;if(!rel||!it.contains(rel))_ncpHide();}
  });
  /* 滚动时隐藏（fixed 定位不跟随，避免错位） */
  _navEl.addEventListener('scroll',_ncpHide,{passive:true});
}

// 先算出各批次涉及的页面，再恢复上次的筛选状态（跳页不丢，直到点「清除筛选」）
navBuildVerPages();
navApplyVerFilter();
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
// 恢复侧边栏收起态（桌面端，跨页保持）：localStorage 存 '1' 即给 body 加 sidebar-collapsed 类，
// CSS 自动把 --sidebar-w 收窄并隐藏文字/标题/footer，只留图标列。
try{
  if(localStorage.getItem('tcm_sidebar_collapsed')==='1'){
    document.body.classList.add('sidebar-collapsed');
    var _cb=p.querySelector('.sidebar-collapse-bar');
    if(_cb)_cb.setAttribute('title','展开菜单');
  }
}catch(e){}
})();
