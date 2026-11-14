/* ================================================================
 * 销售系统终端（v2.0.1）—— 对齐真机：Android 电子秤
 * 2026-11-09：按 Android 项目（git.taocaimall.com/android/vegetable_store，sf_主分支）
 * 的 XML 布局与配色全量重做渲染层，域逻辑（摊位/商品范围/订单/交班/设置）不变。
 * 设计还原（res/layout/activity_main_cashier.xml 等，1pt→1px，设备 960×600）：
 *   · 主绿 #059669（c_02307e）/ 面板深绿 #065F46 / 顶黑条 #242424
 *   · 结算·现金按钮 #FF4B0F（按下 #C33809）/ 价格红 #DF1D1E / 会员价 #0063F7
 *   · 分类 tab 选中 #059669 白字、未选 #C6CACD；图像识别 tab 橙描边 #E7532B
 *   · 销售界面 = 左 412（黑条/称重条/明细/合计/会员/挂单·车·车·更多+结算+现金）+
 *     右 548（搜索+营业员chip=管理入口 / 分类条38 / 商品网格卡片126）
 *   · 管理界面 = 左 112（返回销售38 + #242424 菜单48/项）+ 右（#E3EFE9 顶栏38 + 顶部 tab 随左菜单变：
 *     商品管理=商品管理|上架商品|商品打码、订单管理=交易查询|营业日报、交接班、设置=设置|更新商品）
 *     + 内容（商品管理=分类条+上下架筛选+3列商品卡+分页、上架商品=整页表单、商品打码=打码记录台账
 *     （fragment_code_record）、交易查询=左420列表+右明细（fragment_trade_two）、营业日报=
 *     交易额/营业额/营收+支付方式（fragment_daily_result）、交接班、设置三页签）
 *   · 展示形式 = 设置→软件版本→「销售版面」（layoutName），设备本地生效
 * 数据范围：登录账号 = 摊位绑定账号，只加载该摊位经营范围内商品；结算生成打码记录（待核销）。
 * 依赖：layout.js（GL_MOCK_DATA / 分类）、ms-goods-tag.js（标签 / 摊位）、ms-system.js（账号）。
 * ================================================================ */
var TM_STATE = { boothId: '', view: 'sale', managePage: 'goods', goodsTab: 'list', orderTab: 'trade', setTab: 'ver', codeTab: '全部', codeKw: '', codeDate: '', shiftTab: '全部', kw: '', mode: '1', catId: '', tagId: '', cart: [], held: [], mngCat: '', mngStatus: '全部', tradeDate: '', tradeSel: '', dailyDate: '' };
var TM_CFG = { displayMode: '1', round: '抹分', autoRound: false, brand: '七华', codeMode: '收银', ticketType: '单个', ticketSize: 1, deviceType: '46', sellCats: [], receipt: false, quickPrice: false, cashPay: false, version: '1.02.8' };
var TM_ORDERS = [];   /* 结算产生的秤端订单（待核销 → 已核销 / 已销毁） */
var TM_SHIFTS = [];   /* 交班记录 */
var TM_READY = false;
var TM_ORD_KEY = 'tcm_terminal_orders_v1';
var TM_SEED_VER = 2;   /* 演示种子版本：变更后自动重建 TM_ORDERS/TM_SHIFTS */
var TM_CFG_KEY = 'tcm_terminal_cfg_v1';
var TM_W = null;      /* 称重弹窗草稿 {goodsId, price, weight} */
var TM_PAY = null;    /* 收款弹窗 {due, paid, roundOff} */

/* 真机配色（values/colors.xml 提取） */
var TM_C = { root: '#059669', green: '#065F46', black: '#242424', red: '#DF1D1E', org: '#FF4B0F', orgD: '#C33809', txt: '#059669', vip: '#0063F7', topbar: '#E3EFE9', ink: '#040B29', txsb: '#E7532B', tabOff: '#C6CACD' };

function tmLoad() {
  if (TM_READY) return;
  try { var c = JSON.parse(localStorage.getItem(TM_CFG_KEY) || 'null'); if (c) TM_CFG = Object.assign(TM_CFG, c); } catch (e) {}
  try { var o = JSON.parse(localStorage.getItem(TM_ORD_KEY) || 'null'); if (o) { TM_ORDERS = o.orders || []; TM_SHIFTS = o.shifts || []; } } catch (e) {}
  if (!o || o.seedVer !== TM_SEED_VER) { TM_ORDERS = []; TM_SHIFTS = []; }   /* 种子版本不符 → 重建演示数据 */
  TM_READY = true;
}
function tmPersist() {
  try { localStorage.setItem(TM_CFG_KEY, JSON.stringify(TM_CFG)); } catch (e) {}
  try { localStorage.setItem(TM_ORD_KEY, JSON.stringify({ seedVer: TM_SEED_VER, orders: TM_ORDERS.slice(-200), shifts: TM_SHIFTS.slice(-100) })); } catch (e) {}
}
function tmEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function tmMoney(n) { return '¥' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); }
function tmToast(msg) { msTagToast(msg); }
function tmNow() { var d = new Date(); function p(x) { return ('0' + x).slice(-2); } return d.getFullYear() + '年' + p(d.getMonth() + 1) + '月' + p(d.getDate()) + '日 ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }

/* ---------- 登录摊位（演示：可切换，真机为绑定账号固定） ---------- */
function tmCands() {
  msBtLoad();
  return BOOTHS.filter(function (b) {
    if (b.status !== '0' || msBtUnbound(b)) return false;
    return (b.accountIds || []).some(function (id) { var u = msBtUserById(id); return u && String(u.status) === '0'; });
  });
}
function tmBooth() {
  tmLoad();
  var b = msBtById(TM_STATE.boothId);
  if (b && b.status === '0' && !msBtUnbound(b)) return b;
  var list = tmCands();
  TM_STATE.boothId = list.length ? list[0].boothId : '';
  return list.length ? list[0] : null;
}
function tmAccName(b) {
  var ids = (b && b.accountIds) || [];
  for (var i = 0; i < ids.length; i++) { var u = msBtUserById(ids[i]); if (u && String(u.status) === '0') return (u.userName || '') + '员工' + (u.account || ''); }
  return '';
}
function tmGoods(b) { return msBtGoodsIn(b, null); }
function tmCatList(b) { return (b.classIds || []).slice(); }
/* 按标签视图的标签桶：分类标签 / 通用标签分开设置（共用 tagIds，按 displayClassId 区分）。
     分类标签：一个都没勾 = 默认可用本摊范围全部；勾了 = 只出子集；
     通用标签：只出显式勾选（tagIds 中）的，未选用不列出，避免全店共享标签串摊。
   只列有商品的；「全部」桶由渲染层另加。 */
function tmTagBuckets(b) {
  var goods = tmGoods(b);
  var catSel = {}, genSel = {}, catN = 0;
  (b.tagIds || []).forEach(function (id) {
    var t = msTagById(id);
    if (!t) return;
    if (t.displayClassId) { catSel[id] = 1; catN++; } else { genSel[id] = 1; }
  });
  var list = [];
  (b.classIds || []).forEach(function (cid) {
    msTagCatTags(cid, true).forEach(function (t) { if (!catN || catSel[t.tagId]) list.push(t); });
  });
  msTagGeneralTags(true).forEach(function (t) { if (genSel[t.tagId]) list.push(t); });
  var seen = {};
  return list.filter(function (t) {
    if (seen[t.tagId]) return false; seen[t.tagId] = 1;
    return goods.some(function (g) { return g.tagId === t.tagId; });
  });
}

/* ================= 渲染入口：演示工具条 + 960×600 设备画布（等比缩放） ================= */
function initTerminalPage() {
  tmLoad();
  var el = document.getElementById('terminalContent');
  if (!el) { setTimeout(initTerminalPage, 80); return; }
  if (!tmBooth()) {
    el.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#5b6472;font-size:13px;background:#F1F2F5">暂无可登录摊位：请先在「摊位管理」启用摊位并绑定可用账号</div>';
    return;
  }
  tmRender();
  if (!initTerminalPage._tick) {
    initTerminalPage._tick = setInterval(function () {
      var c = document.getElementById('tmClock'); if (c) c.textContent = tmNow();
    }, 1000);
  }
}

function tmRender() {
  var el = document.getElementById('terminalContent'); if (!el) return;
  el.innerHTML =
    '<div style="flex-shrink:0;background:#0b1019;display:flex;align-items:center;gap:10px;padding:7px 14px">' +
      '<span style="font-size:12px;color:#fff;font-weight:600">🏬 销售系统终端</span>' +
      '<span style="font-size:11px;color:rgba(255,255,255,.5)">真机为 Android 电子秤（vegetable_store sf_主分支），画布 960×600 等比缩放</span>' +
      '<span style="flex:1"></span>' + tmDemoBar() +
    '</div>' +
    '<div id="tmStage" style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#2b2f36">' +
      '<div id="tmFrame" style="flex:none;width:960px;height:600px;transform-origin:center center;box-shadow:0 8px 30px rgba(0,0,0,.4)">' +
        (TM_STATE.view === 'sale' ? tmSaleHtml() : tmManageHtml()) +
      '</div>' +
    '</div>';
  setTimeout(tmFitFrame, 0);
}
function tmFitFrame() {
  var stage = document.getElementById('tmStage'), f = document.getElementById('tmFrame');
  if (!stage || !f) return;
  var s = Math.min(stage.clientWidth / 960, stage.clientHeight / 600, 1);
  f.style.transform = 'scale(' + s + ')';
}
window.addEventListener('resize', tmFitFrame);

/* ---------- 顶部演示工具条（真机无此元素：切换登录摊位） ---------- */
function tmDemoBar() {
  return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,.72)">演示切摊' +
    '<select onchange="tmSwitchBooth(this.value)" style="font-size:11px;padding:3px 6px;border-radius:3px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.14);color:#fff;outline:none">' +
    tmCands().map(function (b) { return '<option value="' + b.boothId + '"' + (TM_STATE.boothId === b.boothId ? ' selected' : '') + ' style="color:#0b1019">' + tmEsc(b.boothName) + '</option>'; }).join('') +
    '</select></span>' +
    '<span style="margin-left:12px;font-size:11px;color:rgba(255,255,255,.72)">当前：' + (TM_CFG.codeMode === '打码' ? '打码秤' : '收银秤') + '（设置→收银打码 切换）</span>';
}
function tmSwitchBooth(id) {
  TM_STATE.boothId = id; TM_STATE.catId = ''; TM_STATE.tagId = ''; TM_STATE.kw = ''; TM_STATE.cart = [];
  if (TM_STATE.managePage !== 'setting') TM_STATE.managePage = 'goods';
  tmRender();
}

/* ================= 销售界面（activity_main_cashier.xml） ================= */
function tmSpecText(g) {
  var spec = String(g.goodsSpec || '');
  var unit = String(g.goodsUnitId || '');
  if (spec.indexOf('称重') >= 0) return '称重/kg';
  if (spec && spec.indexOf('/') >= 0) return spec;      /* 规格自带单位（如 500g/包）不重复追加 */
  return (spec || '标准') + (unit ? '/' + unit : '');
}
function tmSaleGoods(b) {
  var kw = TM_STATE.kw.trim().toLowerCase();
  return tmGoods(b).filter(function (g) {
    if (TM_CFG.displayMode === '2') {
      if (TM_STATE.tagId !== '' && g.tagId !== TM_STATE.tagId) return false;
    } else if (g.categoryId !== TM_STATE.catId) return false;
    if (kw && (String(g.goodsName || '') + String(g.goodsCode || '')).toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
}
/* 分类条：图像识别 + 分类 tabs（或按标签时的 全部 + 标签 tabs） */
function tmClassfyBar(b) {
  var tab = function (id, label, active, kind) {
    /* kind: 'cls' 分类 tab（选中 #059669 白字 / 未选 #C6CACD 黑字）；'ai' 图像识别（橙描边） */
    var bg, bd, col;
    if (kind === 'ai') { bd = active ? TM_C.txsb : 'rgba(231,83,43,.4)'; bg = active ? 'rgba(231,83,43,.08)' : 'transparent'; col = TM_C.txsb; }
    else { bg = active ? TM_C.txt : TM_C.tabOff; col = active ? '#fff' : '#000'; bd = 'transparent'; }
    return '<div onclick="tmSetDim(\'' + id + '\')" style="flex:none;width:84px;height:34px;display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;border-radius:1px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';box-sizing:border-box">' + tmEsc(label) + '</div>';
  };
  var inner;
  if (TM_CFG.displayMode === '2') {
    var buckets = tmTagBuckets(b);
    if (!TM_STATE.tagId && TM_STATE.tagId !== '') TM_STATE.tagId = '';
    inner = tab('', '全部', TM_STATE.tagId === '', 'cls') +
      buckets.map(function (t) { return tab(t.tagId, t.tagName, TM_STATE.tagId === t.tagId, 'cls'); }).join('');
  } else {
    if (!TM_STATE.catId) TM_STATE.catId = '_ai';
    inner = tab('_ai', '图像识别', TM_STATE.catId === '_ai', 'ai') +
      tmCatList(b).filter(function (cid) { return !TM_CFG.sellCats || !TM_CFG.sellCats.length || TM_CFG.sellCats.indexOf(cid) >= 0; }).map(function (cid) { return tab(cid, getCategoryName(cid), TM_STATE.catId === cid, 'cls'); }).join('');
  }
  return '<div style="flex:none;height:38px;background:#fff;border-radius:1px;display:flex;align-items:center;padding:2px;overflow-x:auto">' + inner + '</div>';
}
/* 商品卡片（item_goods_main_cashier_local.xml：高126，白卡 1px 圆角，绿底 1px 缝） */
function tmGoodsGrid(goods) {
  if (!goods.length) return '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.6);font-size:13px">该分类下暂无商品</div>';
  return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px">' +
    goods.map(function (g) {
      var weigh = String(g.goodsSpec || '').indexOf('称重') >= 0 || String(g.goodsUnitId || '') === '千克';
      var hasVip = g.memberPrice != null && Number(g.memberPrice) > 0;
      var old = Number(g.goodsListPrice) > Number(g.goodsPrice) ? '<span style="text-decoration:line-through;color:rgba(0,0,0,.51);font-size:9px;margin-left:3px">' + (Number(g.goodsListPrice) || 0).toFixed(2) + '</span>' : '';
      return '<div onclick="tmQuickAdd(\'' + g.goodsId + '\')" style="height:126px;background:#fff;cursor:pointer;display:flex;box-sizing:border-box">' +
        '<div style="flex:none;width:56px;height:56px;margin:35px 0 0 2px;display:flex;align-items:center;justify-content:center;background:#f2f3f5;border-radius:2px;overflow:hidden">' +
          '<span style="font-size:22px;color:#b9c0c7">🖼</span>' +
        '</div>' +
        '<div style="flex:1;min-width:0;padding:6px 8px 6px 2px;display:flex;flex-direction:column">' +
          '<div style="font-size:14px;color:#000;line-height:1.3;height:38px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + tmEsc(g.goodsName) + '</div>' +
          (hasVip ? '<div style="display:flex;align-items:center;gap:3px"><span style="font-size:8px;color:#fff;background:' + TM_C.vip + ';border-radius:2px;padding:0 3px">VIP</span><span style="font-size:9px;color:' + TM_C.vip + '">会员价' + Number(g.memberPrice).toFixed(2) + '</span></div>' : '') +
          '<div style="margin-top:auto;font-size:10px;color:' + TM_C.red + ';white-space:nowrap">¥' + (Number(g.goodsPrice) || 0).toFixed(2) + (weigh ? '/kg' : '') + old + '</div>' +
          '<div style="font-size:9px;color:rgba(0,0,0,.4);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(tmSpecText(g)) + '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
}
/* 图像识别空态（ivChange：请将商品放置在秤盘上） */
function tmAiHtml() {
  return '<div style="height:100%;display:flex;flex-direction:column;align-items:center;padding-top:25px;box-sizing:border-box">' +
    '<div style="font-size:14px;color:#fff">请将商品放置在秤盘上</div>' +
    '<div style="margin-top:45px;width:180px;height:60px;border-radius:50%;border:6px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);position:relative">' +
      '<div style="position:absolute;left:50%;top:-26px;width:3px;height:26px;background:rgba(255,255,255,.35);transform:translateX(-50%)"></div>' +
    '</div>' +
    '<div style="margin-top:26px;font-size:11px;color:rgba(255,255,255,.5)">图像识别（AI 视觉识别果蔬）· 演示环境无摄像头</div>' +
  '</div>';
}
/* 购物明细行（item_cart_goods.xml：序号 | 名称+删除 | 小计） */
function tmCartRows() {
  if (!TM_STATE.cart.length) return '<tr><td colspan="3" style="text-align:center;color:#c0c4cc;font-size:12px;padding:40px 0">点击右侧商品加入明细</td></tr>';
  return TM_STATE.cart.map(function (c, i) {
    return '<tr onclick="tmOpenWeigh(\'' + c.goodsId + '\',' + i + ')" title="点击修改单价/重量" style="border-bottom:1px solid #f2f4f3;cursor:pointer">' +
      '<td style="width:40px;text-align:center;font-size:16px;color:' + TM_C.ink + ';padding:6px 0">' + (i + 1) + '</td>' +
      '<td style="padding:4px 0"><div style="display:flex;align-items:center;gap:6px">' +
        '<div style="flex:1;min-width:0"><div style="font-size:14px;color:' + TM_C.ink + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(c.name) + '</div>' +
        '<div style="font-size:10px;color:#8a93a3">¥' + c.price.toFixed(2) + (c.weigh ? '/kg × ' + c.weight.toFixed(3) : ' × ' + c.weight) + '</div></div>' +
        '<span onclick="event.stopPropagation();tmDelCart(' + i + ')" title="删除" style="flex:none;cursor:pointer;font-size:13px;color:#9aa3ad;padding-right:4px">✕</span>' +
      '</div></td>' +
      '<td style="width:64px;text-align:right;font-size:12px;color:' + TM_C.ink + ';padding-right:9px">' + tmMoney(c.amount).slice(1) + '</td>' +
    '</tr>';
  }).join('') ;
}
/* 销售主界面（点击顶部黑条日期区可切换左右布局） */
function tmSaleHtml() {
  var b = tmBooth(); if (!b) return '';
  var acc = tmAccName(b);
  var total = TM_STATE.cart.reduce(function (s, c) { return s + c.amount; }, 0);
  var dmMode = TM_CFG.codeMode === '打码';
  /* ===== 左列 412 ===== */
  var leftCol =
    '<div style="flex:none;width:412px;height:100%;display:flex;flex-direction:column">' +
      /* 黑条 37（点击切换左右布局） */
      '<div onclick="tmFlip()" title="点击切换左右布局" style="flex:none;height:37px;background:' + TM_C.black + ';display:flex;align-items:center;padding:0 11px;cursor:pointer">' +
        '<span id="tmClock" style="font-size:11px;color:#fff">' + tmNow() + '</span>' +
        '<span style="flex:1"></span><span style="font-size:11px;color:#fff">超时未结数：' + TM_ORDERS.filter(function (o) { return o.status === '超时未结'; }).length + '</span>' +
        '<span style="font-size:10px;color:rgba(255,255,255,.55);margin-left:8px">⇄</span>' +
      '</div>' +
      /* 称重条 66 #065F46 */
      '<div style="flex:none;height:66px;background:' + TM_C.green + ';display:flex;align-items:center">' +
        '<div style="margin-left:8px">' +
          '<div style="display:flex;align-items:flex-end;height:44px">' +
            '<span style="font-size:40px;line-height:1;color:rgba(255,255,255,.2);letter-spacing:1px;font-family:Consolas,Menlo,monospace">0</span>' +
            '<span id="tmWeightBig" style="font-size:40px;line-height:1;color:#fff;letter-spacing:1px;font-family:Consolas,Menlo,monospace">' + (TM_STATE.cart.length ? TM_STATE.cart[TM_STATE.cart.length - 1].weigh ? TM_STATE.cart[TM_STATE.cart.length - 1].weight.toFixed(3) : '' : '0.000') + '</span>' +
            '<span style="font-size:10px;color:#fff;margin-left:3px;margin-bottom:2px">kg</span>' +
          '</div>' +
          '<div style="font-size:10px;color:#d5d5d5;margin-top:1px">皮重：0.000</div>' +
        '</div>' +
        '<span style="flex:1"></span>' +
        '<div style="margin-right:12px;display:flex;flex-direction:column;gap:10px">' +
          '<button onclick="tmToast(\'去皮（演示）\')" style="border:none;background:#fff;color:' + TM_C.green + ';font-size:13px;padding:2px 14px;cursor:pointer;border-bottom:1px solid ' + TM_C.green + '">去皮</button>' +
          '<button onclick="tmToast(\'置零（演示）\')" style="border:none;background:#fff;color:' + TM_C.green + ';font-size:13px;padding:2px 14px;cursor:pointer;border-bottom:1px solid ' + TM_C.green + '">置零</button>' +
        '</div>' +
      '</div>' +
      /* 明细表头 21 */
      '<div style="flex:none;height:21px;background:#fff;display:flex;align-items:center">' +
        '<span style="width:46px;text-align:center;font-size:12px;color:rgba(0,0,0,.85)">序号</span>' +
        '<span style="flex:1;font-size:12px;color:rgba(0,0,0,.85)">名称</span>' +
        '<span style="width:64px;text-align:right;font-size:12px;color:rgba(0,0,0,.85);padding-right:9px">小计</span>' +
      '</div>' +
      '<div style="flex:none;height:1.5px;background:#e8e8e8"></div>' +
      /* 明细列表 */
      '<div style="flex:1;min-height:0;background:#fff;overflow-y:auto"><table style="width:100%;border-collapse:collapse"><tbody id="tmCartBody">' + tmCartRows() + '</tbody></table></div>' +
      '<div style="flex:none;height:1px;background:#d1d5db"></div>' +
      /* 合计 32 */
      '<div style="flex:none;height:32px;background:#f3f3f3;display:flex;align-items:center;padding:0 11px">' +
        '<span style="font-size:13px;color:' + TM_C.ink + '">合计</span><span style="flex:1"></span>' +
        '<span style="font-size:20px;font-weight:700;color:' + TM_C.red + '">' + tmMoney(total) + '</span>' +
      '</div>' +
      '<div style="flex:none;height:1px;background:#d1d5db"></div>' +
      /* 会员 32（打码秤账号真机隐藏 llMemberDis，仅收银秤显示） */
      (dmMode ? '' :
      '<div onclick="tmToast(\'会员功能（后续版本）\')" style="flex:none;height:32px;background:#f3f3f3;display:flex;align-items:center;padding:0 11px;cursor:pointer">' +
        '<span style="font-size:12px;color:#000">会员:</span><span style="flex:1;text-align:right;font-size:12px;color:#000">选择会员</span>' +
        '<span style="margin-left:6px;color:#999;font-size:11px">›</span>' +
      '</div>') +
      /* 底部 50：挂单盒 + 结算 + 现金（打码模式显示 打码|改价改量） */
      '<div style="flex:none;height:50px;background:#fff;display:flex;align-items:center;padding:0 2px">' +
        (dmMode
          ? '<div onclick="tmToast(\'打码（演示）\')" style="flex:2;height:46px;display:flex;align-items:center;justify-content:center;font-size:14px;color:' + TM_C.txt + ';border:1px solid #c6cacd;border-radius:1px;cursor:pointer;margin-left:1px">打码</div>' +
            '<div onclick="tmToast(\'改价/改量：在商品管理中编辑（演示）\')" style="flex:1;height:46px;display:flex;align-items:center;justify-content:center;font-size:14px;color:' + TM_C.txt + ';border:1px solid #c6cacd;border-radius:1px;cursor:pointer;margin-left:2px">改价/改量</div>'
          : '<div style="flex:none;width:148px;height:46px;display:flex;border:1px solid rgba(0,0,0,.4);border-radius:1px;margin-left:1px;box-sizing:border-box">' +
              '<div onclick="tmHold()" style="width:54px;display:flex;align-items:center;justify-content:center;font-size:15px;color:#000;cursor:pointer">挂单' + (TM_STATE.held.length ? '(' + TM_STATE.held.length + ')' : '') + '</div>' +
              '<div style="width:1.5px;background:rgba(0,0,0,.4)"></div>' +
              '<div onclick="tmOpenHeld()" style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer">' +
                '<span style="font-size:10px;font-weight:700;color:' + TM_C.red + '">🛒 ' + (TM_STATE.held[0] ? TM_STATE.held[0].reduce(function (s, c) { return s + c.amount; }, 0).toFixed(2).slice(0, 7) : '0.00') + '</span></div>' +
              '<div style="width:1.5px;background:rgba(0,0,0,.4)"></div>' +
              '<div onclick="tmOpenHeld()" style="flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer">' +
                '<span style="font-size:10px;font-weight:700;color:' + TM_C.red + '">🛒 ' + (TM_STATE.held[1] ? TM_STATE.held[1].reduce(function (s, c) { return s + c.amount; }, 0).toFixed(2).slice(0, 7) : '0.00') + '</span></div>' +
              '<div style="width:1.5px;background:rgba(0,0,0,.4)"></div>' +
              '<div onclick="tmOpenHeld()" style="flex:.8;display:flex;align-items:center;justify-content:center;font-size:15px;color:' + TM_C.txt + ';cursor:pointer;position:relative;white-space:nowrap">更多' +
                (TM_STATE.held.length ? '<span style="position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:' + TM_C.txt + ';color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center">' + TM_STATE.held.length + '</span>' : '') + '</div>' +
            '</div>' +
            '<div onclick="tmOpenPay()" style="flex:none;width:130px;height:46px;margin-left:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:' + TM_C.org + ';cursor:pointer">' +
              '<span style="font-size:14px;color:#fff">结算</span><span style="font-size:9px;color:#fff;line-height:1.1">' + (total > 0 ? tmMoney(total) : '¥0.00') + '</span></div>' +
            '<div onclick="tmOpenPay()" style="flex:none;width:126px;height:46px;margin-left:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:' + TM_C.org + ';cursor:pointer">' +
              '<span style="font-size:14px;color:#fff">现金</span><span style="font-size:10px;color:#fff">抹零: ' + (TM_CFG.round === '抹分' ? '¥0.00' : tmMoney(tmRoundDiff(total))) + '</span></div>'
        ) +
      '</div>' +
    '</div>';
  /* ===== 右列 548 ===== */
  var rightCol =
    '<div style="flex:none;width:548px;height:100%;display:flex;flex-direction:column;padding:2px;box-sizing:border-box">' +
      /* 搜索 + 营业员 chip（= 管理入口） */
      '<div style="flex:none;height:33px;display:flex;margin:2px 0">' +
        '<div style="flex:1;position:relative">' +
          '<input id="tmKwInput" value="' + tmEsc(TM_STATE.kw) + '" oninput="tmKw(this.value)" placeholder="商品名称/编码" style="width:100%;height:33px;box-sizing:border-box;font-size:11px;padding:0 7px 0 22px;border:none;outline:none;background:' + TM_C.green + ';color:#fff;border-radius:1px">' +
          '<span style="position:absolute;left:7px;top:9px;font-size:12px;color:rgba(255,255,255,.7)">🔍</span>' +
        '</div>' +
        '<div onclick="tmOpenManage()" title="点击门店名称进入管理界面" style="flex:none;width:226px;height:33px;margin-left:3px;background:' + TM_C.green + ';display:flex;align-items:center;padding:0 6px;cursor:pointer;border-radius:1px">' +
          '<span style="font-size:14px">🏪</span>' +
          '<span style="flex:1;text-align:center;font-size:11px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(b.shopName) + ' · ' + tmEsc(acc) + '</span>' +
          '<span style="font-size:10px;color:rgba(255,255,255,.7)">›</span>' +
        '</div>' +
      '</div>' +
      /* 商品区 #065F46 */
      '<div style="flex:1;min-height:0;background:' + TM_C.green + ';padding:2px;display:flex;flex-direction:column;box-sizing:border-box">' +
        tmClassfyBar(b) +
        '<div id="tmGoodsGrid" style="flex:1;min-height:0;overflow-y:auto;margin-top:2px">' +
          (!TM_CFG.displayMode || TM_CFG.displayMode !== '2' && TM_STATE.catId === '_ai' ? tmAiHtml() : tmGoodsGrid(tmSaleGoods(b))) +
        '</div>' +
      '</div>' +
    '</div>';
  return '<div style="width:960px;height:600px;background:' + TM_C.root + ';display:flex;overflow:hidden">' +
    (TM_STATE.flip === '1' ? rightCol + leftCol : leftCol + rightCol) +
  '</div>';
}
function tmFlip() { TM_STATE.flip = TM_STATE.flip === '1' ? '' : '1'; tmRender(); msTagToast(TM_STATE.flip === '1' ? '已切换：商品区在左 / 明细在右' : '已切换：明细在左 / 商品区在右'); }
/* 挂单/更多弹窗：挂单列表（恢复）+ 清空明细 */
function tmOpenHeld() {
  var total = TM_STATE.cart.reduce(function (s, c) { return s + c.amount; }, 0);
  var rows = TM_STATE.held.map(function (h, i) {
    var amt = h.reduce(function (s, c) { return s + c.amount; }, 0);
    return '<div style="display:flex;align-items:center;padding:8px 4px;border-bottom:1px solid #f0f2f5;font-size:12px">' +
      '<span>挂单 ' + (i + 1) + '（' + h.length + '件 / ' + tmMoney(amt) + '）</span><span style="flex:1"></span>' +
      '<button onclick="tmResumeHeld(' + i + ')" style="border:none;background:' + TM_C.txt + ';color:#fff;font-size:12px;padding:4px 12px;border-radius:2px;cursor:pointer;margin-right:6px">取单</button>' +
      '<button onclick="tmDropHeld(' + i + ')" style="border:none;background:#fff;border:1px solid #c6cacd;color:#666;font-size:12px;padding:4px 12px;border-radius:2px;cursor:pointer">丢弃</button></div>';
  }).join('') || '<div style="text-align:center;color:#8a93a3;font-size:12px;padding:24px 0">暂无挂单</div>';
  tgDlg({
    title: '挂单 / 明细操作', width: '440px', okText: '', onOk: 'void(0)', noFoot: true,
    body: '<div style="font-size:12px;color:#0b1019">' +
      '<div style="display:flex;align-items:center;margin-bottom:6px"><span>当前明细 ' + TM_STATE.cart.length + ' 件 · ' + tmMoney(total) + '</span><span style="flex:1"></span>' +
      '<button onclick="tgClose();tmClearCart()" style="border:none;background:#fff;border:1px solid ' + TM_C.red + ';color:' + TM_C.red + ';font-size:12px;padding:4px 12px;border-radius:2px;cursor:pointer">清空明细</button></div>' +
      '<div style="margin-top:8px">' + rows + '</div>' +
      '<div style="font-size:11px;color:#8a93a3;margin-top:10px">真机最多保留两笔挂单直接显示在底栏，「更多」弹窗管理全部挂单。</div></div>'
  });
}
function tmResumeHeld(i) { TM_STATE.cart = TM_STATE.held.splice(i, 1)[0]; tgClose(); tmRender(); msTagToast('已恢复挂单'); }
function tmDropHeld(i) { TM_STATE.held.splice(i, 1); tgClose(); tmRender(); msTagToast('已丢弃'); }

/* ---------- 销售交互 ---------- */
function tmSetDim(id) {
  if (TM_CFG.displayMode === '2') TM_STATE.tagId = id; else TM_STATE.catId = id;
  TM_STATE.kw = ''; tmRender();
}
function tmKw(v) {
  TM_STATE.kw = v || '';
  var b = tmBooth(); if (!b) return;
  var grid = document.getElementById('tmGoodsGrid'); if (!grid) return;
  var ai = TM_CFG.displayMode !== '2' && TM_STATE.catId === '_ai';
  grid.innerHTML = ai ? tmAiHtml() : tmGoodsGrid(tmSaleGoods(b));
}
function tmOpenWeigh(goodsId, idx) {
  var b = tmBooth(); if (!b) return;
  var g = tmGoods(b).filter(function (x) { return x.goodsId === goodsId; })[0]; if (!g) return;
  var weigh = String(g.goodsSpec || '').indexOf('称重') >= 0 || String(g.goodsUnitId || '') === '千克';
  var row = idx != null ? TM_STATE.cart[idx] : null;
  TM_W = { goodsId: g.goodsId, name: g.goodsName, price: row ? row.price : (Number(g.goodsPrice) || 0), weight: row ? row.weight : (weigh ? 0.5 : 1), weigh: weigh, code: g.goodsCode || '', idx: idx != null ? idx : null };
  var keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '清空'];
  tgDlg({
    title: tmEsc(g.goodsName) + (row ? '（修改明细）' : ''), width: '420px', okText: '', onOk: 'void(0)', noFoot: true,
    body: '<div style="font-size:12px;color:#0b1019">' +
      '<div style="display:flex;gap:10px;margin-bottom:12px">' +
        '<div style="flex:1"><div style="color:#5b6472;margin-bottom:5px">单价</div><input id="tmWPrice" class="ic-input" style="text-align:left;font-size:15px" value="' + TM_W.price.toFixed(2) + '" onfocus="tmWFocus(\'price\')" oninput="tmWInput()"></div>' +
        '<div style="flex:1"><div style="color:#5b6472;margin-bottom:5px">' + (weigh ? '重量(kg)' : '数量') + '</div><input id="tmWWeight" class="ic-input" style="font-size:15px" value="' + (weigh ? '0.500' : '1') + '" onfocus="tmWFocus(\'weight\')" oninput="tmWInput()"></div>' +
        '<div style="flex:1"><div style="color:#5b6472;margin-bottom:5px">小计</div><input id="tmWSum" class="ic-input" readonly style="background:#f5f6f8;color:' + TM_C.red + ';font-weight:600;font-size:15px"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px" id="tmWKeys">' +
        keys.map(function (k) { return '<button onclick="tmWKey(\'' + k + '\')" style="border:none;background:' + TM_C.black + ';color:#fff;font-size:16px;padding:13px 0;border-radius:3px;cursor:pointer">' + k + '</button>'; }).join('') +
        '<button onclick="tmWKey(\'del\')" style="border:none;background:' + TM_C.black + ';color:#fff;font-size:16px;padding:13px 0;border-radius:3px;cursor:pointer">⌫</button>' +
        '<button onclick="tmWConfirm()" style="grid-column:span 2;grid-row:span 4;border:none;background:' + TM_C.org + ';color:#fff;font-size:16px;padding:0;border-radius:3px;cursor:pointer;writing-mode:vertical-rl;letter-spacing:8px">确 定</button>' +
      '</div></div>'
  });
  TM_W._cur = 'price';
  tmWInput();
}
/* 点商品卡 = 按当前默认量直接加入明细（称重 0.5kg / 计件 1），改量在明细行点开键盘 */
function tmQuickAdd(goodsId) {
  var b = tmBooth(); if (!b) return;
  var g = tmGoods(b).filter(function (x) { return x.goodsId === goodsId; })[0]; if (!g) return;
  var weigh = String(g.goodsSpec || '').indexOf('称重') >= 0 || String(g.goodsUnitId || '') === '千克';
  var w = weigh ? 0.5 : 1;
  TM_STATE.cart.push({ goodsId: g.goodsId, name: g.goodsName, price: Number(g.goodsPrice) || 0, weight: w, weigh: weigh, amount: Math.round((Number(g.goodsPrice) || 0) * w * 100) / 100, code: g.goodsCode || '' });
  tmRender();
}
function tmWFocus(which) { TM_W._cur = which; }
function tmWInput() {
  var p = parseFloat((document.getElementById('tmWPrice') || {}).value) || 0;
  var w = parseFloat((document.getElementById('tmWWeight') || {}).value) || 0;
  TM_W.price = p; TM_W.weight = w;
  var sum = document.getElementById('tmWSum');
  if (sum) sum.value = (Math.round(p * w * 100) / 100).toFixed(2);
}
function tmWKey(k) {
  var el = document.getElementById(TM_W._cur === 'price' ? 'tmWPrice' : 'tmWWeight');
  if (!el) return;
  var v = el.value;
  if (k === '清空') v = '';
  else if (k === 'del') v = v.slice(0, -1);
  else if (k === '.') { if (v.indexOf('.') < 0) v += '.'; }
  else v += k;
  el.value = v; tmWInput();
}
function tmWConfirm() {
  tmWInput();
  if (!TM_W.weight || TM_W.weight <= 0) { msTagToast('请输入有效' + (TM_W.weigh ? '重量' : '数量')); return; }
  var amt = Math.round(TM_W.price * TM_W.weight * 100) / 100;
  var item = { goodsId: TM_W.goodsId, name: TM_W.name, price: TM_W.price, weight: TM_W.weight, weigh: TM_W.weigh, amount: amt, code: TM_W.code };
  if (TM_W.idx != null && TM_STATE.cart[TM_W.idx]) TM_STATE.cart[TM_W.idx] = item;
  else TM_STATE.cart.push(item);
  tgClose(); tmRender();
}
function tmDelCart(i) { TM_STATE.cart.splice(i, 1); tmRender(); }
function tmClearCart() { if (!TM_STATE.cart.length) return; TM_STATE.cart = []; tmRender(); msTagToast('已清空'); }
function tmHold() {
  if (!TM_STATE.cart.length) {
    if (!TM_STATE.held.length) { msTagToast('暂无挂单'); return; }
    TM_STATE.cart = TM_STATE.held.pop(); tmRender(); msTagToast('已恢复挂单'); return;
  }
  TM_STATE.held.push(TM_STATE.cart); TM_STATE.cart = []; tmRender();
  msTagToast('已挂单（点「更多」取单）');
}

/* ---------- 现金收款弹窗（dialog_input_cash.xml） ---------- */
function tmOpenPay() {
  if (!TM_STATE.cart.length) return;
  var total = TM_STATE.cart.reduce(function (s, c) { return s + c.amount; }, 0);
  TM_PAY = { due: total, paid: 0, roundOff: false };
  var numBtn = function (k) { return '<button onclick="tmPayKey(\'' + k + '\')" class="tmk">' + k + '</button>'; };
  tgDlg({
    title: '请扫描客户付款码或者使用现金支付', width: '520px', okText: '', onOk: 'void(0)', noFoot: true,
    body: '<div style="font-size:12px;color:#0b1019">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
        '<span style="font-size:13px;color:#5b6472">应收</span>' +
        '<span id="tmPayDue" style="font-size:24px;font-weight:700;color:#0b1019">' + tmMoney(total) + '</span>' +
        '<label style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#5b6472;cursor:pointer"><input type="checkbox" id="tmPayRound" onchange="tmPayRound(this.checked)"> 现金抹零</label>' +
      '</div>' +
      '<div style="display:flex;gap:10px;margin-bottom:12px">' +
        '<div style="flex:1.4"><div style="color:#5b6472;margin-bottom:5px">已收</div><input id="tmPayPaid" class="ic-input" style="font-size:18px" value="" readonly></div>' +
        '<div style="flex:1"><div style="color:#5b6472;margin-bottom:5px">找零</div><input id="tmPayChange" class="ic-input" readonly style="background:#f5f6f8" value="0.00"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">' +
        numBtn('7') + numBtn('8') + numBtn('9') + numBtn('￥100') +
        numBtn('4') + numBtn('5') + numBtn('6') + numBtn('￥50') +
        numBtn('1') + numBtn('2') + numBtn('3') + numBtn('￥20') +
        numBtn('0') + numBtn('.') + numBtn('清空') + numBtn('￥10') +
        '<button onclick="tmPayKey(\'挂单\')" class="tmk" style="grid-column:span 2">挂单</button>' +
        '<button onclick="tmPayCash()" style="grid-column:span 2;border:none;background:' + TM_C.org + ';color:#fff;font-size:15px;font-weight:700;border-radius:3px;cursor:pointer;line-height:1.4">现金<br>收款</button>' +
      '</div>' +
      '<style>.tmk{border:none;background:' + TM_C.black + ';color:#fff;font-size:16px;padding:13px 0;border-radius:3px;cursor:pointer}.tmk:hover{background:#3a3a3a}</style></div>'
  });
  tmPaySync();
}
function tmRoundDiff(total) { return TM_CFG.round === '1元内' ? (total - Math.floor(total)) : (TM_CFG.round === '0.5元内' ? (total - Math.floor(total * 2) / 2) : 0); }
function tmPayDueNow() { return TM_PAY.roundOff ? Math.max(0, Math.round((TM_PAY.due - tmRoundDiff(TM_PAY.due)) * 100) / 100) : TM_PAY.due; }
function tmPayRound(on) { TM_PAY.roundOff = !!on; tmPaySync(); }
function tmPaySync() {
  var due = tmPayDueNow();
  var d = document.getElementById('tmPayDue'); if (d) d.textContent = tmMoney(due);
  var paid = TM_PAY.paid || 0;
  var p = document.getElementById('tmPayPaid'); if (p) p.value = paid ? paid.toFixed(2) : '';
  var c = document.getElementById('tmPayChange'); if (c) c.value = (paid > due ? (paid - due) : 0).toFixed(2);
}
function tmPayKey(k) {
  if (k === '挂单') { tgClose(); tmHold(); return; }
  var v = String(TM_PAY.paid ? (Math.round(TM_PAY.paid * 100) / 100) : '');
  if (v === '0') v = '';
  if (k === '清空') v = '';
  else if (k === 'del') v = v.slice(0, -1);
  else if (k.indexOf('¥') === 0 || k.indexOf('￥') === 0) v = String((parseFloat(v || '0') || 0) + parseFloat(k.slice(1)));
  else if (k === '.') { if (v.indexOf('.') < 0) v += '.'; }
  else v += k;
  TM_PAY.paid = parseFloat(v || '0') || 0;
  tmPaySync();
}
function tmPayCash() {
  var due = tmPayDueNow();
  if (!(TM_PAY.paid >= due)) { msTagToast('已收金额不足应收'); return; }
  var b = tmBooth();
  var totalW = TM_STATE.cart.reduce(function (s, c) { return s + (c.weigh ? c.weight : 0); }, 0);
  TM_ORDERS.unshift({
    orderId: 'DM' + String(Date.now()).slice(-11), shopName: b.shopName, acc: tmAccName(b),
    items: TM_STATE.cart.slice(),
    name: TM_STATE.cart[0].name + (TM_STATE.cart.length > 1 ? ' 等' + TM_STATE.cart.length + '件' : ''),
    weight: Math.round(totalW * 1000) / 1000, price: TM_STATE.cart[0].price,
    amount: due, discount: 0, paid: TM_PAY.paid, pay: '现金', code: '69' + String(Date.now()).slice(-11), goodsCode: TM_STATE.cart[0].code,
    status: '待核销', time: tmNow(), settledAt: Date.now()
  });
  TM_STATE.cart = []; tmPersist(); tgClose(); tmRender();
  msTagToast('收款成功，已生成打码记录（待核销）');
}

/* ================= 管理界面（activity_manager_all.xml） ================= */
var TM_MANAGE_MENUS = [
  { key: 'goods', label: '商品管理' },
  { key: 'orders', label: '订单管理' },
  { key: 'shift', label: '交接班' },
  { key: 'setting', label: '设置' },
  { key: 'logout', label: '退出登陆' }
];
/* 顶部 tab 随左侧菜单变化（ManagerAllActivity.iniTopBtn）：
 * 商品管理 = 商品管理 | 上架商品 | 商品打码；订单管理 = 交易查询 | 营业日报；
 * 交接班 = 交接班；设置 = 设置 | 更新商品（真机点它弹「更新商品」确认框，不是页面） */
var TM_TOP_TABS = {
  goods: [['list', '商品管理'], ['add', '上架商品'], ['code', '商品打码']],
  orders: [['trade', '交易查询'], ['daily', '营业日报']],
  shift: [['shift', '交接班']],
  setting: [['setting', '设置'], ['update', '更新商品']]
};
function tmTabCur() {
  if (TM_STATE.managePage === 'goods') return TM_STATE.goodsTab;
  if (TM_STATE.managePage === 'orders') return TM_STATE.orderTab;
  return TM_STATE.managePage;
}
function tmTopTo(key) {
  if (key === 'update') { tmUpdateGoods(); return; }
  if (key === 'list' || key === 'add' || key === 'code') TM_STATE.goodsTab = key;
  else if (key === 'trade' || key === 'daily') TM_STATE.orderTab = key;
  tmRender();
}
function tmManageHtml() {
  var b = tmBooth(); if (!b) return '';
  var menu = TM_MANAGE_MENUS.map(function (m) {
    var active = TM_STATE.managePage === m.key;
    /* shape_leftline：选中 = 左 2px 绿条 + #E3EFE9 底 + 绿字；未选白字 */
    return '<div onclick="tmManageTo(\'' + m.key + '\')" style="flex:none;width:112px;height:48px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:' + (active ? TM_C.txt : '#fff') + ';background:' + (active ? 'linear-gradient(to right,' + TM_C.txt + ' 2px,' + TM_C.topbar + ' 2px)' : 'transparent') + '">' + m.label + '</div>';
  }).join('');
  var tabs = TM_TOP_TABS[TM_STATE.managePage] || [];
  var cur = tmTabCur();
  var topInner = tabs.map(function (t, i) {
    var active = cur === t[0];
    return (i ? '<span style="width:1px;height:20px;background:#666666;flex:none"></span>' : '') +
      '<div onclick="tmTopTo(\'' + t[0] + '\')" style="padding:0 10px;min-width:82px;height:48px;display:flex;align-items:center;justify-content:center;font-size:13px;white-space:nowrap;color:' + (active ? TM_C.txt : '#333') + ';cursor:pointer">' + t[1] + '</div>';
  }).join('');
  var body;
  if (TM_STATE.managePage === 'goods') body = TM_STATE.goodsTab === 'code' ? tmCodeHtml(b) : (TM_STATE.goodsTab === 'add' ? tmGoodsAddHtml(b) : tmGoodsListHtml(b));
  else if (TM_STATE.managePage === 'orders') body = TM_STATE.orderTab === 'daily' ? tmDailyHtml(b) : tmTradeHtml(b);
  else if (TM_STATE.managePage === 'shift') body = tmShiftHtml(b);
  else body = tmSettingHtml();
  return '<div style="width:960px;height:600px;background:' + TM_C.root + ';display:flex;overflow:hidden">' +
    /* 左列 112：返回销售 + 深色菜单（填满整列） */
    '<div style="flex:none;width:112px;display:flex;flex-direction:column">' +
      '<div onclick="tmBackSale()" style="flex:none;width:112px;height:38px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;background:' + TM_C.green + ';cursor:pointer">‹ 返回销售</div>' +
      '<div style="flex:1;width:112px;background:' + TM_C.black + ';display:flex;flex-direction:column">' + menu + '</div>' +
    '</div>' +
    /* 右侧 */
    '<div style="flex:1;min-width:0;margin-left:2px;display:flex;flex-direction:column">' +
      '<div style="flex:none;height:38px;background:' + TM_C.topbar + ';display:flex;align-items:center;overflow:hidden">' + topInner +
        '<span style="flex:1"></span>' +
        '<span style="font-size:11px;color:#666;margin-right:12px;white-space:nowrap">' + tmEsc(b.boothName) + ' · ' + tmEsc(tmAccName(b)) + '</span>' +
      '</div>' +
      '<div style="flex:none;height:2px"></div>' +
      '<div style="flex:1;min-height:0;background:#fff;overflow-y:auto">' + body + '</div>' +
    '</div>' +
  '</div>';
}
function tmOpenManage() { TM_STATE.view = 'manage'; TM_STATE.managePage = 'goods'; TM_STATE.goodsTab = 'list'; TM_STATE.kw = ''; tmRender(); }
function tmManageTo(key) {
  if (key === 'logout') { msTagToast('退出登陆（演示：真机返回登录页）'); return; }
  TM_STATE.view = 'manage'; TM_STATE.managePage = key;
  if (key === 'goods') TM_STATE.goodsTab = 'list';
  if (key === 'orders') TM_STATE.orderTab = 'trade';
  tmRender();
}
function tmBackSale() { TM_STATE.view = 'sale'; tmRender(); }
/* 更新商品：PutawayDialog「更新商品\n注意：必须更新完成才能继续销售？」*/
function tmUpdateGoods() {
  tgConfirm('更新商品', '注意：必须更新完成才能继续销售。确认后从总部下载最新商品资料。', 'tmUpdateGoodsDo()', '确定');
}
function tmUpdateGoodsDo() { tgClose(); msTagToast('商品资料已更新（演示）'); }

/* ---------- 商品管理（fragment_taocaimao_goods.xml + item_goods.xml：分类条 + 上下架筛选 + 3 列商品卡 + 分页） ---------- */
function tmGoodsListHtml(b) {
  var cats = tmCatList(b);
  var kw = (TM_STATE.kw || '').trim().toLowerCase();
  var st = TM_STATE.mngStatus || '全部';
  var cat = TM_STATE.mngCat || '';
  var goods = tmGoods(b).filter(function (g) {
    if (cat && g.categoryId !== cat) return false;
    if (st === '上架' && String(g.status) === '1') return false;
    if (st === '下架' && String(g.status) !== '1') return false;
    if (kw && (String(g.goodsName || '') + String(g.goodsCode || '')).toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
  var catTab = function (id, label) {
    var on = cat === id;
    return '<div onclick="tmMngCatTo(\'' + id + '\')" style="flex:none;height:28px;display:flex;align-items:center;padding:0 10px;font-size:13px;cursor:pointer;color:' + (on ? TM_C.txt : '#333') + ';border-bottom:2px solid ' + (on ? TM_C.txt : 'transparent') + ';box-sizing:border-box">' + tmEsc(label) + '</div>';
  };
  var cards = goods.map(function (g) {
    var off = String(g.status) === '1';
    return '<div onclick="tmGoodsAddOpen(\'' + g.goodsId + '\')" title="点击编辑" style="height:85px;background:#fff;border-right:1px solid #f5f5f9;border-bottom:1px solid #f5f5f9;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;opacity:' + (off ? '.42' : '1') + '">' +
      '<div style="width:54px;height:41px;background:#f2f3f5;display:flex;align-items:center;justify-content:center;margin-bottom:2px"><span style="font-size:18px;color:#b9c0c7">🖼</span></div>' +
      '<div style="max-width:100%;padding:0 6px;box-sizing:border-box;font-size:12px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(g.goodsName) + '</div>' +
      '<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#8a93a3;max-width:100%;padding:0 4px;box-sizing:border-box"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(tmSpecText(g)) + '</span><span style="flex:none;color:' + TM_C.red + '">¥' + (Number(g.goodsPrice) || 0).toFixed(2) + '</span></div>' +
    '</div>';
  }).join('');
  return '<div style="height:100%;display:flex;flex-direction:column">' +
    /* 顶部 28：分类条 + 上/下架筛选 + 搜索 */
    '<div style="flex:none;height:28px;display:flex;align-items:center;border-bottom:1px solid #dfe3ed">' +
      '<div style="flex:1;min-width:0;display:flex;overflow-x:auto">' + catTab('', '全部') + cats.map(function (c) { return catTab(c, getCategoryName(c)); }).join('') + '</div>' +
      '<select onchange="tmMngStatusTo(this.value)" style="flex:none;height:21px;margin-right:5px;font-size:10px;border:1px solid #dfe3ed;border-radius:2px;outline:none;background:#fff">' +
        ['全部', '上架', '下架'].map(function (o) { return '<option' + (st === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>' +
      '<input id="tmMngKw" value="' + tmEsc(TM_STATE.kw || '') + '" oninput="tmMngKwInput(this.value)" placeholder="请输入商品名称/编码" style="flex:none;width:140px;height:21px;margin-right:5px;box-sizing:border-box;font-size:10px;padding:0 7px;border:1px solid #3380FF;border-radius:2px;outline:none">' +
    '</div>' +
    '<div style="flex:1;min-height:0;overflow-y:auto;background:#fff">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr)">' + (cards || '<div style="grid-column:span 3;height:120px;display:flex;align-items:center;justify-content:center;color:#b9c0c7;font-size:12px">暂无商品</div>') + '</div>' +
    '</div>' +
    /* 底部 32：上架商品 + 分页 */
    '<div style="flex:none;height:32px;display:flex;align-items:center;padding:0 6px;border-top:1px solid #f5f5f9">' +
      '<span onclick="tmTopTo(\'add\')" style="font-size:11px;color:' + TM_C.txt + ';border:1px solid #059669;border-radius:2px;padding:1px 10px;cursor:pointer">上架商品</span>' +
      '<span style="flex:1"></span>' +
      '<span style="font-size:11px;color:#8a93a3;margin-right:8px">共 ' + goods.length + ' 条</span>' +
      '<span style="font-size:11px;color:#8a93a3;margin-right:10px">上一页</span><span style="font-size:11px;color:rgba(0,0,0,.25)">下一页</span>' +
    '</div>' +
  '</div>';
}
function tmMngCatTo(id) { TM_STATE.mngCat = id; tmRender(); }
function tmMngStatusTo(v) { TM_STATE.mngStatus = v; tmRender(); }
function tmMngKwInput(v) {
  TM_STATE.kw = v || '';
  var b = tmBooth(); if (!b) return;
  clearTimeout(tmMngKwInput._t);
  tmMngKwInput._t = setTimeout(function () { tmRenderKeepFocus('tmMngKw'); }, 250);
}
function tmRenderKeepFocus(inputId) {
  var pos = null;
  var el = document.getElementById(inputId);
  if (el) { pos = el.selectionStart; el.value = TM_STATE.kw; }
  tmRender();
  el = document.getElementById(inputId);
  if (el && pos != null) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} }
}
function tmToggleStatus(goodsId, to) {
  var g = GL_MOCK_DATA.filter(function (x) { return x.goodsId === goodsId; })[0]; if (!g) return;
  g.status = to;
  if (typeof glPersistGoods === 'function') { try { glPersistGoods(); } catch (e) {} }
  tmRender(); msTagToast(to === '1' ? '已下架' : '已上架');
}

/* ---------- 上架商品（frag2_add_edit_goods.xml：整页表单 + 底部 取消/保存） ---------- */
var TM_DRAFT = null;
function tmGoodsAddOpen(goodsId) {
  var b = tmBooth(); if (!b) return;
  var g = goodsId ? GL_MOCK_DATA.filter(function (x) { return x.goodsId === goodsId; })[0] : null;
  TM_DRAFT = g ? {
    goodsId: g.goodsId, goodsName: g.goodsName, salesName: g.salesName || g.goodsName, goodsCode: g.goodsCode || '',
    goodsUnitId: g.goodsUnitId || '', supplierName: g.supplierName || '', categoryId: g.categoryId || '',
    goodsBrand: g.goodsBrand || '', goodsSpec: g.goodsSpec || '', storage: g.storage || '',
    goodsPrice: g.goodsPrice, goodsListPrice: g.goodsListPrice
  } : {
    goodsId: '', goodsName: '', salesName: '', goodsCode: 'SP' + String(Date.now()).slice(-6),
    goodsUnitId: '千克', supplierName: '', categoryId: (b.classIds || []).length === 1 ? b.classIds[0] : '',
    goodsBrand: '', goodsSpec: '称重', storage: '', goodsPrice: '', goodsListPrice: ''
  };
  TM_STATE.goodsTab = 'add';
  tmRender();
}
var TM_INP = 'width:220px;height:28px;box-sizing:border-box;font-size:12px;padding:0 8px;border:1px solid #dfe3ed;border-radius:2px;outline:none;background:#fff';
function tmFormRow(label, inner, req) {
  return '<div style="display:flex;align-items:center;min-height:40px;border-bottom:1px solid #f0f2f5">' +
    '<div style="flex:none;width:96px;font-size:12px;color:#5b6472;text-align:right;padding-right:12px">' + (req ? '<span style="color:#fc4b52">*</span> ' : '') + label + '</div>' +
    '<div style="flex:1;min-width:0">' + inner + '</div></div>';
}
function tmGoodsAddHtml(b) {
  if (!TM_DRAFT) tmGoodsAddOpen('');
  var d = TM_DRAFT;
  var cats = tmCatList(b);
  var sysOpts = '<option value="">请选择系统商品</option>' + GL_MOCK_DATA.map(function (g) {
    return '<option value="' + tmEsc(g.goodsName) + '"' + (d.goodsName === g.goodsName ? ' selected' : '') + '>' + tmEsc(g.goodsName) + (g.goodsBrand ? ' · ' + tmEsc(g.goodsBrand) : '') + '</option>';
  }).join('');
  var catOpts = '<option value="">请选择商品分类</option>' + cats.map(function (cid) {
    return '<option value="' + cid + '"' + (d.categoryId === cid ? ' selected' : '') + '>' + tmEsc(getCategoryName(cid)) + '</option>';
  }).join('');
  var sec = function (t) { return '<div style="height:24px;display:flex;align-items:center;background:#f5f7f6;margin-top:8px"><span style="width:2px;height:12px;background:' + TM_C.txt + ';margin-left:10px"></span><span style="font-size:12px;color:#0b1019;margin-left:6px;font-weight:600">' + t + '</span></div>'; };
  return '<div style="height:100%;display:flex;flex-direction:column">' +
    '<div style="flex:1;min-height:0;overflow-y:auto;padding:0 12px">' +
      /* 图片 */
      '<div style="display:flex;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f0f2f5">' +
        '<div style="flex:none;width:96px;font-size:12px;color:#5b6472;text-align:right;padding-right:12px;padding-top:6px">图片：</div>' +
        '<div style="width:120px;height:88px;border:1px dashed #c6cacd;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#aab2ba;cursor:pointer" onclick="tmToast(\'选择图片（演示）\')">' +
          '<span style="font-size:20px;line-height:1">＋</span><span style="font-size:10px;margin-top:4px">上传商品图</span></div>' +
      '</div>' +
      tmFormRow('系统商品：', '<select onchange="tmAddPickSys(this.value)" style="' + TM_INP + '">' + sysOpts + '</select>') +
      tmFormRow('销售名称：', '<input id="tmDName" value="' + tmEsc(d.salesName || d.goodsName) + '" placeholder="请输入品名" maxlength="30" style="' + TM_INP + '">', true) +
      tmFormRow('商品编码：', '<input id="tmDCode" value="' + tmEsc(d.goodsCode) + '" style="' + TM_INP + '">') +
      tmFormRow('单位：', '<input id="tmDUnit" value="' + tmEsc(d.goodsUnitId) + '" placeholder="未指定" style="' + TM_INP + '">') +
      tmFormRow('供应商：', '<input id="tmDSupplier" value="' + tmEsc(d.supplierName) + '" style="' + TM_INP + '">') +
      tmFormRow('商品分类：', '<select id="tmDCat" style="' + TM_INP + '">' + catOpts + '</select>', true) +
      tmFormRow('品牌：', '<input id="tmDBrand" value="' + tmEsc(d.goodsBrand) + '" placeholder="请输入品牌" style="' + TM_INP + '">') +
      tmFormRow('规格：', '<input id="tmDSpec" value="' + tmEsc(d.goodsSpec) + '" placeholder="请输入规格" style="' + TM_INP + '">') +
      tmFormRow('存储方式：', '<input id="tmDStorage" value="' + tmEsc(d.storage) + '" placeholder="请输入存储方式" style="' + TM_INP + '">') +
      sec('销售信息') +
      tmFormRow('销售价：', '<div style="display:flex;align-items:center;gap:6px"><input id="tmDPrice" value="' + tmEsc(d.goodsPrice) + '" placeholder="请输入" style="' + TM_INP + ';width:150px"><span style="font-size:12px;color:#5b6472">元</span></div>', true) +
      tmFormRow('原价：', '<div style="display:flex;align-items:center;gap:6px"><input id="tmDList" value="' + tmEsc(d.goodsListPrice) + '" placeholder="请输入" style="' + TM_INP + ';width:150px"><span style="font-size:12px;color:#5b6472">元</span></div>') +
      '<div style="height:10px"></div>' +
    '</div>' +
    '<div style="flex:none;height:44px;border-top:1px solid #e6e8ec;display:flex;align-items:center;justify-content:center;gap:10px;background:#fff">' +
      '<button onclick="tmTopTo(\'list\')" style="width:88px;height:28px;border:1px solid #c6cacd;background:#fff;color:#333;font-size:12px;border-radius:2px;cursor:pointer">取消</button>' +
      '<button onclick="tmAddSave()" style="width:88px;height:28px;border:none;background:' + TM_C.txt + ';color:#fff;font-size:12px;border-radius:2px;cursor:pointer">保存</button>' +
    '</div>' +
  '</div>';
}
function tmAddPickSys(name) {
  var g = GL_MOCK_DATA.filter(function (x) { return x.goodsName === name; })[0]; if (!g || !TM_DRAFT) return;
  TM_DRAFT.goodsName = g.goodsName; TM_DRAFT.salesName = g.salesName || g.goodsName;
  TM_DRAFT.goodsUnitId = g.goodsUnitId || TM_DRAFT.goodsUnitId; TM_DRAFT.goodsSpec = g.goodsSpec || TM_DRAFT.goodsSpec;
  TM_DRAFT.goodsBrand = g.goodsBrand || ''; TM_DRAFT.supplierName = g.supplierName || '';
  TM_DRAFT.categoryId = (TM_DRAFT.categoryId || g.categoryId || ''); TM_DRAFT.goodsPrice = g.goodsPrice;
  TM_DRAFT.goodsListPrice = g.goodsListPrice;
  tmRender();
}
function tmAddSave() {
  var b = tmBooth(); if (!b || !TM_DRAFT) return;
  var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
  var name = g('tmDName').trim();
  var cat = g('tmDCat');
  var price = parseFloat(g('tmDPrice'));
  if (!name) { msTagToast('请输入销售名称'); return; }
  if (!cat) { msTagToast('请选择商品分类'); return; }
  if ((b.classIds || []).indexOf(cat) < 0) { msTagToast('商品分类超出本摊位经营范围'); return; }
  if (!price || isNaN(price) || price <= 0) { msTagToast('请填写有效销售价'); return; }
  var listPrice = parseFloat(g('tmDList')) || price;
  if (TM_DRAFT.goodsId) {
    var old = GL_MOCK_DATA.filter(function (x) { return x.goodsId === TM_DRAFT.goodsId; })[0]; if (!old) return;
    old.goodsName = name; old.salesName = name; old.goodsCode = g('tmDCode'); old.goodsUnitId = g('tmDUnit');
    old.supplierName = g('tmDSupplier'); old.categoryId = cat; old.goodsBrand = g('tmDBrand');
    old.goodsSpec = g('tmDSpec'); old.goodsPrice = price; old.goodsListPrice = listPrice;
    msTagToast('保存成功');
  } else {
    GL_MOCK_DATA.push({
      goodsId: 'g-t' + Date.now(), goodsName: name, salesName: name, goodsCode: g('tmDCode'),
      goodsUnitId: g('tmDUnit') || '千克', goodsSpec: g('tmDSpec') || '称重',
      goodsPrice: price, goodsListPrice: listPrice, status: '0', enable: 0,
      companyName: '崧泽集团', shopName: b.shopName, supplierName: g('tmDSupplier'), picUrl: '',
      categoryId: cat, goodsBrand: g('tmDBrand'), isSellable: 1, isMarked: 0, goodsTag: '', memberPrice: null,
      tagId: TM_DRAFT.tagId || '', expiryManaged: false
    });
    msTagToast('上架成功');
  }
  if (typeof glPersistGoods === 'function') { try { glPersistGoods(); } catch (e) {} }
  TM_DRAFT = null; TM_STATE.goodsTab = 'list'; tmRender();
}
/* ---------- 商品打码（fragment_code_record.xml + item_goodscodechange.xml） ----------
 * 打码记录台账：状态分段（全部/待核销/超时未结/已核销/已销毁）+ 日期 + 搜索；
 * 卡片 = 商品名 + 状态角标 / 条码·重量·单价·金额·商品码 / 时间 + 打码·销毁；底部五项统计。 */
var TM_CODE_TABS = ['全部', '待核销', '超时未结', '已核销', '已销毁'];
function tmD(d) { function p(x) { return ('0' + x).slice(-2); } return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
function tmNowStr(d) { function p(x) { return ('0' + x).slice(-2); } return tmD(d) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }
/* 演示台账种子：按摊位经营范围商品生成近 7 天的打码/交易记录 + 近 3 天交班记录 */
function tmCodeSeed() {
  if (TM_ORDERS.length) return;
  var b = tmBooth(); if (!b) return;
  var gs = tmGoods(b); if (!gs.length) return;
  var seed = 20261109;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  /* 单笔订单：1~2 个商品、随机重量/数量、优惠、支付方式 */
  function mkOrder(di, hh, mm) {
    var d = new Date(); d.setDate(d.getDate() - di); d.setHours(hh, mm, Math.floor(rnd() * 60), 0);
    var n = Math.min(gs.length, rnd() < 0.28 ? 2 : 1);
    var items = [];
    for (var k = 0; k < n; k++) {
      var g = gs[Math.floor(rnd() * gs.length)];
      var weigh = String(g.goodsSpec || '').indexOf('称重') >= 0 || String(g.goodsUnitId || '') === '千克';
      var w = weigh ? Math.round((0.3 + rnd() * 2.2) * 1000) / 1000 : (1 + Math.floor(rnd() * 3));
      var p = Number(g.goodsPrice) || 0;
      items.push({ name: g.goodsName, price: p, weight: w, weigh: weigh, amount: Math.round(p * w * 100) / 100, code: g.goodsCode || '' });
    }
    var amount = Math.round(items.reduce(function (s, it) { return s + it.amount; }, 0) * 100) / 100;
    return {
      orderId: 'JC' + d.getTime(), items: items, name: items[0].name, weight: items[0].weight, price: items[0].price,
      amount: amount, discount: rnd() < 0.2 ? Math.round(rnd() * 150) / 100 : 0,
      pay: pick(['现金', '现金', '现金', '微信', '支付宝', '储值卡']), acc: tmAccName(b),
      code: '69' + String(d.getTime()).slice(-11), goodsCode: items[0].code,
      time: tmNowStr(d), settledAt: d.getTime()
    };
  }
  /* 每天笔数与状态分布（今天偏多、历史多为已核销） */
  var plan = [10, 6, 5, 7, 4, 6, 5];
  var sts = [
    ['待核销', '已核销', '待核销', '超时未结', '已核销', '已核销', '待核销', '已核销', '已销毁', '已核销'],
    ['已核销', '已核销', '已销毁', '已核销', '已核销', '已核销'],
    ['已核销', '已核销', '已核销', '已核销', '已核销'],
    ['已核销', '已销毁', '已核销', '已核销', '已核销', '已核销', '已核销'],
    ['已核销', '已核销', '已核销', '已核销'],
    ['已核销', '已核销', '已核销', '已核销', '已核销', '已核销'],
    ['已核销', '已核销', '已销毁', '已核销', '已核销']
  ];
  var nowH = new Date().getHours();
  plan.forEach(function (n, di) {
    for (var i = 0; i < n; i++) {
      var o = mkOrder(di, di === 0 ? 7 + Math.floor(rnd() * Math.max(1, nowH - 6)) : 7 + Math.floor(rnd() * 12), Math.floor(rnd() * 60));
      o.status = sts[di][i % sts[di].length];
      if (di === 0 && i === 2) o.refund = o.amount;            /* 今日退款演示 */
      if (di === 1 && i < 2) o.refund = o.amount;              /* 往日订单退款演示 */
      o.paid = o.amount;
      TM_ORDERS.push(o);
    }
  });
  TM_ORDERS.sort(function (a, c) { return a.settledAt - c.settledAt; });
  /* 交班演示记录：近 3 天 */
  if (!TM_SHIFTS.length) {
    var mkShift = function (di, hh, mm, amt, cnt, mins) {
      var d = new Date(); d.setDate(d.getDate() - di); d.setHours(hh, mm, 0, 0);
      var s = new Date(d.getTime() - mins * 60000);
      return { ts: d.getTime(), time: tmNowStr(d), start: tmNowStr(s), shop: b.shopName, amount: amt, count: cnt, mins: mins, durTxt: Math.floor(mins / 60) + '小时' + (mins % 60) + '分', device: 'DEMO-SCALE-01' };
    };
    TM_SHIFTS.push(mkShift(0, 13, 20, 286.40, 9, 350), mkShift(1, 18, 35, 486.50, 23, 645), mkShift(2, 18, 42, 512.20, 26, 662));
  }
  tmPersist();
}
function tmCodeHtml(b) {
  tmCodeSeed();
  var tab = TM_STATE.codeTab;
  var kw = (TM_STATE.codeKw || '').trim().toLowerCase();
  var day = TM_STATE.codeDate || tmD(new Date());
  var rows = TM_ORDERS.filter(function (o) {
    if (tab !== '全部' && o.status !== tab) return false;
    if (kw && (String(o.name || '') + String(o.code || '') + String(o.goodsCode || '')).toLowerCase().indexOf(kw) < 0) return false;
    if (day && String(o.time || '').slice(0, 10) !== day) return false;
    return true;
  });
  var cnt = function (s) { return TM_ORDERS.filter(function (o) { return o.status === s; }).length; };
  var okAmt = TM_ORDERS.filter(function (o) { return o.status === '已核销'; }).reduce(function (s, o) { return s + o.amount; }, 0);
  var stCol = { '待核销': '#FF8156', '超时未结': '#FF8156', '已核销': '#0C9D61', '已销毁': 'rgba(0,0,0,.6)' };
  var stBg = { '待核销': 'rgba(255,129,86,.12)', '超时未结': 'rgba(255,129,86,.12)', '已核销': 'rgba(12,157,97,.12)', '已销毁': 'rgba(0,0,0,.06)' };
  var seg = TM_CODE_TABS.map(function (t, i) {
    var on = tab === t;
    return '<div onclick="tmCodeTabTo(\'' + t + '\')" style="height:30px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0 10px;font-size:14px;cursor:pointer;background:' + (on ? TM_C.txt : '#fff') + ';color:' + (on ? '#fff' : '#333') + ';border:1px solid #d5d9e0;' + (i ? 'margin-left:-1px;' : '') + (i === 0 ? 'border-radius:1px 0 0 1px;' : '') + (i === TM_CODE_TABS.length - 1 ? 'border-radius:0 1px 1px 0;' : '') + '">' + t + '</div>';
  }).join('');
  var cards = rows.map(function (o) {
    return '<div style="background:#fff;height:105px;box-sizing:border-box;display:flex;flex-direction:column;padding:8px 11px 0">' +
      '<div style="display:flex;align-items:flex-start;gap:6px">' +
        '<div style="flex:1;min-width:0;font-size:13px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + tmEsc(o.name) + '">' + tmEsc(o.name) + '</div>' +
        '<span style="flex:none;font-size:9px;line-height:1.6;padding:0 4px;color:' + stCol[o.status] + ';background:' + stBg[o.status] + '">' + o.status + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:5px">' +
        '<div style="flex:none;width:45px;height:39px;background:#f2f3f5;display:flex;align-items:center;justify-content:center"><span style="font-size:11px;color:#aab2ba">图</span></div>' +
        '<div style="flex:1;min-width:0;font-size:10px;color:#333;line-height:1.55">' +
          '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">条码:' + tmEsc(o.code) + '</div>' +
          '<div style="display:flex;gap:8px"><span style="flex:1">重量:' + (o.weight || 0).toFixed(3) + '</span><span style="flex:1">单价:' + (o.price || 0).toFixed(2) + '</span></div>' +
          '<div style="display:flex;gap:8px"><span style="flex:1">金额:' + (o.amount || 0).toFixed(2) + '</span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">商品码:' + tmEsc(o.goodsCode || '-') + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:auto;display:flex;align-items:center;padding-bottom:6px">' +
        '<span style="flex:1;font-size:10px;color:#8a93a3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(o.time) + '</span>' +
        ((o.status === '待核销' || o.status === '超时未结')
          ? '<span onclick="tmCodePrint(\'' + o.orderId + '\')" style="font-size:10px;color:#3380FF;border:1px solid #3380FF;padding:0 6px;margin-right:6px;cursor:pointer">打码</span>' +
            '<span onclick="tmCodeDestroy(\'' + o.orderId + '\')" style="font-size:10px;color:#3380FF;border:1px solid #3380FF;padding:0 6px;cursor:pointer">销毁</span>'
          : '') +
      '</div>' +
    '</div>';
  }).join('');
  return '<div style="height:100%;display:flex;flex-direction:column;background:#fff">' +
    /* 顶部筛选 36：状态分段 + 日期 144 + 搜索 140 */
    '<div style="flex:none;height:36px;display:flex;align-items:center;padding-left:10px">' + seg +
      '<input type="date" value="' + day + '" onchange="tmCodeDateTo(this.value)" style="flex:none;width:120px;height:30px;margin-left:8px;box-sizing:border-box;font-size:11px;padding:0 6px;border:1px solid #d5d9e0;background:#fff;color:#333;outline:none">' +
      '<span style="flex:1"></span>' +
      '<input id="tmCodeKw" value="' + tmEsc(TM_STATE.codeKw || '') + '" oninput="tmCodeKwInput(this.value)" placeholder="请输入商品名称/编码" style="flex:none;width:140px;height:30px;margin-right:10px;box-sizing:border-box;font-size:11px;padding:0 7px;border:1px solid #3380FF;border-radius:2px;outline:none">' +
    '</div>' +
    /* 卡片区（3 列，1px 灰缝） */
    '<div style="flex:1;min-height:0;overflow-y:auto;background:#DADADA;padding:1px 0 0 1px">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px">' +
        (cards || '<div style="grid-column:span 3;background:#fff;height:120px;display:flex;align-items:center;justify-content:center;color:#b9c0c7;font-size:12px">暂无打码记录</div>') +
      '</div>' +
    '</div>' +
    /* 底部分页 + 五项统计 */
    '<div style="flex:none;height:36px;background:#fff;display:flex;align-items:center;padding:0 12px">' +
      '<span style="font-size:11px;color:#5b6472">‹ 上一页</span>' +
      '<span style="margin:0 8px;font-size:11px;color:' + TM_C.txt + '">1</span>' +
      '<span style="font-size:11px;color:#5b6472">下一页 ›</span>' +
      '<span style="margin-left:10px;font-size:11px;color:#8a93a3">共 ' + rows.length + ' 条</span>' +
      '<span style="flex:1"></span>' +
      [['待核销数', cnt('待核销')], ['超时未结数', cnt('超时未结')], ['已核销数', cnt('已核销')], ['已销毁数', cnt('已销毁')], ['已核销金额', okAmt.toFixed(2)]].map(function (x) {
        return '<span style="font-size:11px;color:#222;margin-left:10px">' + x[0] + ':<b style="font-size:14px">' + x[1] + '</b></span>';
      }).join('') +
    '</div>' +
  '</div>';
}
function tmCodeTabTo(t) { TM_STATE.codeTab = t; tmRender(); }
function tmCodeDateTo(v) { TM_STATE.codeDate = v; tmRender(); }
function tmCodeKwInput(v) {
  TM_STATE.codeKw = v || '';
  clearTimeout(tmCodeKwInput._t);
  tmCodeKwInput._t = setTimeout(function () { tmRenderKeepFocus('tmCodeKw'); }, 250);
}
function tmCodePrint(id) {
  var o = TM_ORDERS.filter(function (x) { return x.orderId === id; })[0]; if (!o) return;
  msTagToast('已发送打印指令：条码 ' + o.code);
}
function tmCodeDestroy(id) {
  var o = TM_ORDERS.filter(function (x) { return x.orderId === id; })[0]; if (!o) return;
  tgConfirm('销毁确认', '确定要销毁么？销毁后条码 <b>' + tmEsc(o.code) + '</b> 不可再用。', 'tmCodeDestroyDo(\'' + id + '\')', '销毁');
}
function tmCodeDestroyDo(id) {
  var o = TM_ORDERS.filter(function (x) { return x.orderId === id; })[0]; if (!o) return;
  o.status = '已销毁'; tmPersist(); tmRender(); msTagToast('已销毁');
}

/* ---------- 订单管理 · 交易查询（fragment_trade_two.xml：左 420 列表 + 右交易明细） ---------- */
function tmTradeList() {
  tmCodeSeed();
  var day = TM_STATE.tradeDate || tmD(new Date());
  return TM_ORDERS.filter(function (o) { return String(o.time || '').slice(0, 10) === day; })
    .sort(function (a, b) { return (b.settledAt || 0) - (a.settledAt || 0); });
}
function tmTradeStat(o) { return o.status === '超时未结' ? '超时未结' : (o.status === '已销毁' ? '已废单' : '已完成'); }
function tmTradePick(id) { TM_STATE.tradeSel = id; tmRender(); }
function tmTradeHtml() {
  var list = tmTradeList();
  var cur = list.filter(function (o) { return o.orderId === TM_STATE.tradeSel; })[0] || list[0] || null;
  var sum = list.reduce(function (s, o) { return s + o.amount; }, 0);
  var stCol = function (s) { return s === '已完成' ? TM_C.txt : (s === '超时未结' ? '#FF8156' : '#8a93a3'); };
  var rows = list.map(function (o) {
    var st = tmTradeStat(o);
    var on = cur && cur.orderId === o.orderId;
    return '<div onclick="tmTradePick(\'' + o.orderId + '\')" style="display:flex;align-items:center;height:33px;font-size:11px;color:#333;cursor:pointer;background:' + (on ? '#EFF5F2' : '#fff') + ';border-bottom:1px solid #f0f2f5;border-left:2px solid ' + (on ? TM_C.txt : 'transparent') + '">' +
      '<span style="width:34%;padding-left:6px;box-sizing:border-box">' + String(o.time || '').slice(11) + '</span>' +
      '<span style="width:34%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(o.orderId) + '</span>' +
      '<span style="width:16%;color:' + stCol(st) + '">' + st + '</span>' +
      '<span style="flex:1;text-align:right;padding-right:8px;color:' + TM_C.red + ';font-weight:600">' + (o.amount || 0).toFixed(2) + '</span>' +
    '</div>';
  }).join('');
  var detail;
  if (!cur) {
    detail = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#c0c4cc;font-size:12px">暂无交易</div>';
  } else {
    var st = tmTradeStat(cur);
    var kv = function (k, v, color) { return '<div style="display:flex;height:24px;align-items:center;font-size:11px;border-bottom:1px dashed #f0f2f5"><span style="flex:none;width:84px;color:#8a93a3">' + k + '</span><span style="flex:1;color:' + (color || '#0b1019') + '">' + tmEsc(v) + '</span></div>'; };
    detail = '<div style="height:100%;display:flex;flex-direction:column">' +
      '<div style="flex:1;min-height:0;overflow-y:auto;padding:6px 10px">' +
        /* 商品明细 */
        /* 商品明细（支持多商品订单） */
        '<div style="display:flex;height:24px;align-items:center;background:#f0f1f2;font-size:11px;color:#333;padding:0 6px">' +
          '<span style="flex:2">商品名称</span><span style="flex:1;text-align:center">单价</span><span style="flex:1;text-align:center">重量</span><span style="flex:1;text-align:right">金额</span></div>' +
        (cur.items && cur.items.length ? cur.items : [{ name: cur.name, price: cur.price, weight: cur.weight, amount: cur.amount }]).map(function (it) {
          return '<div style="display:flex;height:28px;align-items:center;font-size:11px;border-bottom:1px solid #f0f2f5;padding:0 6px">' +
            '<span style="flex:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(it.name) + '</span>' +
            '<span style="flex:1;text-align:center">' + (it.price || 0).toFixed(2) + '</span>' +
            '<span style="flex:1;text-align:center">' + (it.weight || 0).toFixed(3) + '</span>' +
            '<span style="flex:1;text-align:right;color:' + TM_C.red + '">' + (it.amount || 0).toFixed(2) + '</span></div>';
        }).join('') +
        '<div style="height:26px;display:flex;align-items:center;font-size:12px;color:#000;margin-top:4px">订单信息</div>' +
        kv('订单号', cur.orderId) + kv('下单时间', cur.time) + kv('营业员', cur.acc || tmAccName(tmBooth())) +
        kv('订单状态', st, stCol(st)) + kv('订单来源', '线下') +
        '<div style="height:26px;display:flex;align-items:center;font-size:12px;color:#000;margin-top:4px">结算信息</div>' +
        kv('应收金额', tmMoney(cur.amount)) + kv('优惠金额', tmMoney(cur.discount || 0)) +
        kv('实收金额', tmMoney(cur.paid != null ? cur.paid : cur.amount)) +
        kv('找零', tmMoney(0)) + kv('支付方式', cur.pay || '现金') + kv('抹零', tmMoney(0)) +
      '</div>' +
      '<div style="flex:none;height:35px;border-top:1px solid #e6e8ec;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:0 10px">' +
        '<button onclick="tmTradeVoid(\'' + cur.orderId + '\')" style="height:22px;padding:0 12px;border:1px solid #c6cacd;background:#fff;color:#333;font-size:11px;border-radius:2px;cursor:pointer">废单</button>' +
        '<button onclick="tmToast(\'退款（演示）\')" style="height:22px;padding:0 12px;border:1px solid #c6cacd;background:#fff;color:#333;font-size:11px;border-radius:2px;cursor:pointer">退款</button>' +
        '<button onclick="tmToast(\'已发送打印指令\')" style="height:22px;padding:0 12px;border:none;background:#3380FF;color:#fff;font-size:11px;border-radius:2px;cursor:pointer">打印小票</button>' +
      '</div>' +
    '</div>';
  }
  return '<div style="height:100%;display:flex;flex-direction:column;background:#fff">' +
    /* 顶部 38：日期 */
    '<div style="flex:none;height:38px;display:flex;align-items:center;padding:0 4px">' +
      '<input type="date" value="' + (TM_STATE.tradeDate || tmD(new Date())) + '" onchange="TM_STATE.tradeDate=this.value;TM_STATE.tradeSel=\'\';tmRender()" style="width:144px;height:30px;box-sizing:border-box;font-size:12px;padding:0 6px;border:1px solid #dfe3ed;border-radius:2px;background:#fff;color:#333;outline:none">' +
      '<span style="flex:1"></span><span style="font-size:11px;color:#8a93a3">共 ' + list.length + ' 笔交易</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;display:flex;background:#DADADA;padding:2px 2px 3px">' +
      /* 左 420 列表 */
      '<div style="flex:none;width:420px;background:#fff;display:flex;flex-direction:column">' +
        '<div style="flex:none;height:26px;display:flex;align-items:center;background:#f0f1f2;font-size:11px;color:#333">' +
          '<span style="width:34%;padding-left:6px;box-sizing:border-box">下单时间</span><span style="width:34%">订单号</span><span style="width:16%">订单状态</span><span style="flex:1;text-align:right;padding-right:8px">收款金额</span></div>' +
        '<div style="flex:1;min-height:0;overflow-y:auto">' + (rows || '<div style="height:120px;display:flex;align-items:center;justify-content:center;color:#c0c4cc;font-size:12px">当日暂无交易</div>') + '</div>' +
        '<div style="flex:none;height:34px;display:flex;align-items:center;justify-content:space-between;border-top:1.5px solid #d3d2d2;padding:0 8px">' +
          '<span style="font-size:10px;color:#8a93a3">上一页　1　下一页</span>' +
          '<span style="font-size:10px;color:#313131">总金额：' + tmMoney(sum) + '</span></div>' +
      '</div>' +
      '<div style="flex:1;min-width:0;margin-left:2px;background:#fff">' + detail + '</div>' +
    '</div>' +
  '</div>';
}
function tmTradeVoid(id) {
  var o = TM_ORDERS.filter(function (x) { return x.orderId === id; })[0]; if (!o) return;
  tgConfirm('废单确认', '确认将交易「<b>' + tmEsc(o.orderId) + '</b>」（' + tmMoney(o.amount) + '）置为废单吗？', 'tmTradeVoidDo(\'' + id + '\')', '确认废单');
}
function tmTradeVoidDo(id) {
  var o = TM_ORDERS.filter(function (x) { return x.orderId === id; })[0]; if (!o) return;
  o.status = '已销毁'; tmPersist(); tmRender(); msTagToast('已置为废单');
}

/* ---------- 订单管理 · 营业日报（fragment_daily_result.xml：交易额/营业额/营收 + 支付方式） ---------- */
function tmDailyHtml() {
  tmCodeSeed();
  var day = TM_STATE.dailyDate || tmD(new Date());
  var list = TM_ORDERS.filter(function (o) { return String(o.time || '').slice(0, 10) === day && o.status !== '已销毁'; });
  var jye = list.reduce(function (s, o) { return s + (o.amount || 0); }, 0);
  var discount = list.reduce(function (s, o) { return s + (o.discount || 0); }, 0);   /* 优惠金额 */
  var todayRef = list.reduce(function (s, o) { return s + (o.refund || 0); }, 0);     /* 当日订单退款 */
  var yestRef = 0;                                                                     /* 往日订单退款 */
  if (day === tmD(new Date())) {
    var yd = tmD(new Date(Date.now() - 86400000));
    yestRef = TM_ORDERS.filter(function (o) { return String(o.time || '').slice(0, 10) === yd; })
      .reduce(function (s, o) { return s + (o.refund || 0); }, 0);
  }
  var yee = jye - discount - todayRef;
  var ys = yee - yestRef;
  var money = function (n) { return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); };
  var block = function (label, val, sub) {
    return '<div style="padding:10px 14px;border-bottom:1px solid #f0f2f5">' +
      '<div style="display:flex;align-items:flex-end">' +
        '<span style="font-size:13px;color:#313131">' + label + '</span>' +
        '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3;margin-right:2px">¥</span>' +
        '<span style="font-size:22px;font-weight:600;color:' + TM_C.red + ';line-height:1">' + money(val) + '</span></div>' +
      (sub ? '<div style="margin-top:6px;display:flex;gap:16px;font-size:11px;color:#8a93a3">' + sub + '</div>' : '') +
    '</div>';
  };
  var pays = ['现金', '微信', '支付宝', '储值卡', '云闪付', '美团会员卡'].map(function (pn) {
    return [pn, list.filter(function (o) { return (o.pay || '现金') === pn; }).reduce(function (s, o) { return s + (o.amount || 0) - (o.refund || 0); }, 0)];
  });
  var payRows = pays.map(function (p, i) {
    return '<div style="display:flex;align-items:center;height:26px;font-size:11px;color:#333;border-bottom:' + (i === pays.length - 1 ? 'none' : '1px solid #f5f5f9') + '">' +
      '<span style="flex:1;padding-left:14px">' + p[0] + '</span><span style="padding-right:14px;color:' + (p[1] ? TM_C.red : '#8a93a3') + '">¥' + money(p[1]) + '</span></div>';
  }).join('');
  return '<div style="height:100%;display:flex;flex-direction:column;background:#fff">' +
    '<div style="flex:none;height:38px;display:flex;align-items:center;padding:0 4px">' +
      '<input type="date" value="' + day + '" onchange="TM_STATE.dailyDate=this.value;tmRender()" style="width:144px;height:30px;box-sizing:border-box;font-size:12px;padding:0 6px;border:1px solid #dfe3ed;border-radius:2px;background:#fff;color:#333;outline:none">' +
      '<span style="flex:1"></span><span style="font-size:11px;color:#8a93a3">' + list.length + ' 笔交易</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;overflow-y:auto">' +
      block('交易额', jye, '<span>优惠金额：¥' + money(discount) + '</span>') +
      block('营业额', yee, '<span>今日订单退款：¥' + money(todayRef) + '</span>') +
      block('营收', ys, '<span>往日订单退款：¥' + money(yestRef) + '</span>') +
      '<div style="height:24px;display:flex;align-items:center;background:#f5f7f6;margin-top:8px"><span style="width:2px;height:12px;background:' + TM_C.txt + ';margin-left:10px"></span><span style="font-size:12px;color:#0b1019;margin-left:6px;font-weight:600">支付方式</span></div>' +
      payRows +
      '<div style="height:10px"></div>' +
    '</div>' +
  '</div>';
}
/* ---------- 交接班（fragment_handover.xml） ---------- */
var TM_SHIFT_TABS = ['全部', '今天', '昨天', '近7天', '近30天'];
function tmShiftHtml() {
  var cnt = TM_SHIFTS.length;
  var cash = TM_SHIFTS.reduce(function (s, x) { return s + x.amount; }, 0);
  var durMin = TM_SHIFTS.reduce(function (s, x) { return s + x.mins; }, 0);
  var durTxt = Math.floor(durMin / 60) + '小时' + (durMin % 60) + '分';
  var stat = function (label, val, color) {
    return '<div style="flex:1;background:#fff;border:1px solid #e3efe9;padding:12px;text-align:center">' +
      '<div style="font-size:11px;color:#8a93a3">' + label + '</div><div style="font-size:20px;font-weight:600;color:' + (color || '#0b1019') + ';margin-top:5px">' + val + '</div></div>';
  };
  var rows = TM_SHIFTS.map(function (x, i) {
    return '<tr style="border-bottom:1px solid #f0f2f5">' +
      '<td style="padding:8px 10px;font-size:12px;color:#333">' + (i + 1) + '</td>' +
      '<td style="padding:8px 10px;font-size:12px;color:#0b1019">' + x.time.slice(0, 10) + '</td>' +
      '<td style="padding:8px 10px;font-size:12px;color:#333">' + tmEsc(x.shop) + '</td>' +
      '<td style="padding:8px 10px;font-size:12px;color:#333">' + x.start.slice(11) + '</td>' +
      '<td style="padding:8px 10px;font-size:12px;color:#333">' + x.time.slice(11) + '</td>' +
      '<td style="padding:8px 10px;font-size:12px;color:#333">' + x.durTxt + '</td>' +
      '<td style="padding:8px 10px;font-size:12px;color:' + TM_C.red + ';font-weight:600">' + tmMoney(x.amount) + '</td>' +
      '<td style="padding:8px 10px;font-size:12px;color:#333">' + x.count + '笔</td>' +
      '<td style="padding:8px 10px;font-size:11px;color:#8a93a3">交接正常 · ' + tmEsc(x.device) + '</td>' +
    '</tr>';
  }).join('');
  return '<div style="padding:10px">' +
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">' +
      '<button onclick="tmDoShift()" style="border:none;background:' + TM_C.txt + ';color:#fff;font-size:12px;padding:7px 22px;border-radius:3px;cursor:pointer">交班</button>' +
      '<span style="font-size:11px;color:#8a93a3">交班 = 汇总上次交班以来的已结算订单并上交现金</span>' +
      '<span style="flex:1"></span>' +
      TM_SHIFT_TABS.map(function (t) {
        var active = TM_STATE.shiftTab === t;
        return '<span onclick="TM_STATE.shiftTab=\'' + t + '\';tmRender()" style="font-size:12px;padding:5px 12px;cursor:pointer;color:' + (active ? '#fff' : '#333') + ';background:' + (active ? TM_C.txt : '#fff') + ';border:1px solid ' + (active ? TM_C.txt : '#dfe3ed') + ';border-radius:3px">' + t + '</span>';
      }).join('') +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:10px">' +
      stat('交班次数', cnt) + stat('在岗时长', durTxt, TM_C.txt) + stat('收款合计', tmMoney(cash), TM_C.txt) + stat('现金收款', tmMoney(cash), TM_C.txt) +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f5f7f6">' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left;width:48px">序号</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">日期</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">门店</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">上班时间</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">交班时间</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">在岗时长</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">实缴金额</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">订单笔数</th>' +
      '<th style="padding:8px 10px;font-size:12px;color:#5b6472;text-align:left">备注 / 终端</th>' +
    '</tr></thead><tbody>' +
    (rows || '<tr><td colspan="9" style="text-align:center;color:#c0c4cc;padding:44px;font-size:12px">暂无交班记录</td></tr>') +
    '</tbody></table></div>';
}
function tmDoShift() {
  var b = tmBooth();
  var last = TM_SHIFTS.length ? TM_SHIFTS[0].ts : 0;
  var list = TM_ORDERS.filter(function (o) { return o.settledAt > last && o.status !== '已销毁'; });
  if (!list.length) { msTagToast('本次交班无结算订单'); return; }
  var amount = list.reduce(function (s, o) { return s + o.amount; }, 0);
  var now = Date.now();
  var mins = Math.max(1, Math.round((now - (last || now - 30 * 60000)) / 60000));
  TM_SHIFTS.unshift({ ts: now, time: tmNow(), start: last ? new Date(last).toLocaleString('zh-CN', { hour12: false }) : tmNow(), shop: b.shopName, amount: Math.round(amount * 100) / 100, count: list.length, mins: mins, durTxt: Math.floor(mins / 60) + '小时' + (mins % 60) + '分', device: 'DEMO-SCALE-01' });
  tmPersist(); tmRender(); msTagToast('交班完成：' + list.length + '笔 / ' + tmMoney(amount));
}

/* ---------- 设置（数据项 = SettingFragment / fragment_setting.xml，视觉重排版） ----------
 * 卡片化分组 + 行内次级说明 + 圆角段选/动画开关；数据项与真机一一对应：
 * 版本升级 / 销售分类展示选择 / 销售小票 / 快捷改价 / 现金便捷收款 /
 * 收银打码（互斥切换；打码时展开 打码方式 单个|批量 + 标签尺寸 50×30|60×40|40×30）/ 秤品牌切换 / 现金抹零(+自动抹零)。 */
function tmSettingHtml() {
  var group = function (icon, title, desc, rows) {
    return '<div style="background:#fff;border-radius:6px;margin-bottom:10px;box-shadow:0 1px 3px rgba(11,16,25,.05);overflow:hidden">' +
      '<div style="display:flex;align-items:center;gap:8px;padding:11px 14px 9px;border-bottom:1px solid #f0f3f1">' +
        '<span style="flex:none;width:22px;height:22px;border-radius:5px;background:#e6f3ee;color:' + TM_C.txt + ';font-size:13px;display:flex;align-items:center;justify-content:center">' + icon + '</span>' +
        '<span style="font-size:13px;font-weight:600;color:#1f2733">' + title + '</span>' +
        '<span style="font-size:11px;color:#98a2ae;margin-left:auto">' + desc + '</span>' +
      '</div>' + rows.join('') + '</div>';
  };
  var row = function (label, sub, ctrl) {
    return '<div style="display:flex;align-items:center;min-height:52px;padding:8px 14px;border-bottom:1px solid #f5f7f6;box-sizing:border-box">' +
      '<div style="min-width:0"><div style="font-size:13px;color:#1f2733;line-height:1.4">' + label + '</div>' +
      (sub ? '<div style="font-size:11px;color:#98a2ae;line-height:1.5;margin-top:2px">' + sub + '</div>' : '') + '</div>' +
      '<span style="flex:1"></span>' + ctrl + '</div>';
  };
  /* 圆角段选：选中实底绿白字，未选白底灰框 */
  var rbs = function (opts, cur, fn, w) {
    w = w || 88;
    return '<div style="display:flex;background:#f4f6f5;border-radius:5px;padding:2px">' + opts.map(function (o) {
      var on = String(cur) === String(o.v);
      return '<div onclick="' + fn + '(\'' + o.v + '\')" style="width:' + w + 'px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;border-radius:4px;box-sizing:border-box;background:' + (on ? TM_C.txt : 'transparent') + ';color:' + (on ? '#fff' : '#5b6472') + ';font-weight:' + (on ? '600' : '400') + '">' + o.t + '</div>';
    }).join('') + '</div>';
  };
  /* 动画开关：右侧文字状态 */
  var swt = function (on, fn, onTxt, offTxt) {
    return '<span style="display:inline-flex;align-items:center;gap:9px">' +
      '<span style="font-size:12px;color:' + (on ? TM_C.txt : '#98a2ae') + '">' + (on ? (onTxt || '开启') : (offTxt || '关闭')) + '</span>' +
      '<span onclick="' + fn + '" style="position:relative;width:44px;height:24px;border-radius:12px;background:' + (on ? TM_C.txt : '#cfd6d2') + ';cursor:pointer;transition:background .25s;display:inline-block;box-sizing:border-box"><span style="position:absolute;top:2px;left:' + (on ? '22px' : '2px') + ';width:20px;height:20px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .25s"></span></span></span>';
  };
  var chev = '<span style="margin-left:10px;color:#b8c1bb;font-size:15px">›</span>';
  var isDM = TM_CFG.codeMode === '打码';
  var body =
    /* ① 终端模式 */
    group('⇄', '终端模式', '打码 / 收银互斥，切换后销售界面同步生效', [
      row('收银打码', isDM ? '打码秤：打印价签码，底栏 = 打码 / 改价改量（无会员、无挂单）' : '收银秤：现金/扫码收款，底栏 = 挂单 / 结算 / 现金',
        rbs([{ v: '打码', t: '打码' }, { v: '收银', t: '收银' }], TM_CFG.codeMode, 'tmSetCodeMode', 76)),
      ].concat(isDM ? [
        row('打码方式', '价签码按单个商品或批量生成', rbs([{ v: '单个', t: '单个' }, { v: '批量', t: '批量' }], TM_CFG.ticketType, 'tmSetTicketType', 76)),
        row('标签尺寸', '标签打印机耗材规格', rbs([{ v: 0, t: '50×30' }, { v: 1, t: '60×40' }, { v: 2, t: '40×30' }], TM_CFG.ticketSize, 'tmSetTicketSize', 76))
      ] : [])) +
    /* ② 销售与收银 */
    group('¥', '销售与收银', '核心销售行为 · 高频', [
      row('快捷改价', '销售时对商品快速改价', swt(TM_CFG.quickPrice, 'tmTgl(\'quickPrice\')')),
      row('现金便捷收款', '收款界面优先展示现金收款', swt(TM_CFG.cashPay, 'tmTgl(\'cashPay\')')),
      row('现金抹零', '现金收款金额抹零规则', rbs([{ v: '抹分', t: '抹分' }, { v: '0.5元内', t: '0.5元内抹零' }, { v: '1元内', t: '1元内抹零' }], TM_CFG.round, 'tmSetRound', 76)),
      row('自动抹零', '按上述规则结算时自动执行', swt(TM_CFG.autoRound, 'tmTgl(\'autoRound\')')),
      row('销售小票', '收款完成后自动打印小票', swt(TM_CFG.receipt, 'tmTgl(\'receipt\')', '自动打印', '不自动打印'))
    ]) +
    /* ③ 商品展示 */
    group('▦', '商品展示', '销售界面商品的导航方式与展示范围', [
      row('展示形式', '按分类导航或按标签导航，销售界面与商品管理界面同步生效（本机新增能力）',
        rbs([{ v: '1', t: '按分类' }, { v: '2', t: '按标签' }], TM_CFG.displayMode, 'tmSetDisplay', 76)),
      row('销售分类展示选择', '按分类展示时，勾选在销售界面展示的商品分类，至少一个',
        '<span onclick="tmOpenCatSel()" style="cursor:pointer;display:inline-flex;align-items:center;font-size:12px;color:' + TM_C.txt + '">' +
        (TM_CFG.sellCats && TM_CFG.sellCats.length ? '已选 ' + TM_CFG.sellCats.length + ' 个分类' : '全部分类') + '</span>' +
        '<span onclick="tmOpenCatSel()" style="cursor:pointer">' + chev + '</span>')
    ]) +
    /* ④ 设备与版本 */
    group('⚙', '设备与版本', '秤品牌与终端基础信息', [
      row('秤品牌切换', '切换后应用将重启生效', rbs([{ v: '镨沃', t: '镨沃' }, { v: '多米', t: '多米' }, { v: '七华', t: '七华' }], TM_CFG.brand, 'tmSetBrand', 76)),
      row('版本升级（' + TM_CFG.version + '）', '点击检查并安装新版本',
        '<span onclick="tmCheckVer()" style="cursor:pointer;display:inline-flex;align-items:center;font-size:12px;color:' + TM_C.txt + '">当前已是最新版本</span><span onclick="tmCheckVer()" style="cursor:pointer">' + chev + '</span>')
    ]);
  return '<div style="height:100%;background:#f1f4f2;overflow-y:auto;padding:10px;box-sizing:border-box">' + body + '</div>';
}
function tmCheckVer() { msTagToast('当前已是最新版本（' + TM_CFG.version + '）'); }
/* 展示形式 = 按分类 / 按标签（本机新增能力，保存在本设备；销售界面与商品管理界面同步生效） */
function tmSetDisplay(v) {
  v = v === '2' ? '2' : '1';
  if (TM_CFG.displayMode === v) return;
  TM_CFG.displayMode = v;
  TM_STATE.catId = ''; TM_STATE.tagId = '';
  tmPersist(); tmRender();
  msTagToast('展示形式：' + (v === '2' ? '按标签' : '按分类') + '（销售界面与商品管理界面已同步）');
}
function tmSetTicketType(v) { TM_CFG.ticketType = v === '批量' ? '批量' : '单个'; tmPersist(); tmRender(); }
function tmSetTicketSize(v) { TM_CFG.ticketSize = Number(v); tmPersist(); tmRender(); }
/* 收银打码 = 打码/收银自主切换（rgUserType → setUserType，互斥：一台终端要么打码要么收银） */
function tmSetCodeMode(v) {
  v = v === '打码' ? '打码' : '收银';
  if (TM_CFG.codeMode === v) return;
  TM_CFG.codeMode = v; tmPersist(); tmRender();
  msTagToast(v === '打码' ? '收银打码 → 打码（销售底栏=打码/改价改量，无会员无挂单）' : '收银打码 → 收银（销售底栏=挂单/结算/现金）');
}
/* 秤品牌切换（setDeviceType 17=镨沃 / 46=多米 / 42=七华，切换后 reStartMain 重启应用） */
function tmSetBrand(v) {
  if (TM_CFG.brand === v) return;
  TM_CFG.brand = v; tmPersist(); tmRender();
  msTagToast('秤品牌：' + v + '（应用将重启以应用新品牌）');
}
function tmSetRound(v) { TM_CFG.round = v; tmPersist(); tmRender(); msTagToast('现金抹零：' + v); }
function tmTgl(key) { TM_CFG[key] = !TM_CFG[key]; tmPersist(); tmRender(); }

/* 销售分类展示选择 → ClassfySelectDialog：标题「选择分类」+ 全选/反选 + 分类网格勾选 + 取消/确定，至少选一个 */
var TM_CATSEL = null;
function tmOpenCatSel() { TM_CATSEL = null; tmCatDlg(); }
function tmCatDlg() {
  var b = tmBooth(); if (!b) return;
  var ids = tmCatList(b);
  if (!TM_CATSEL) TM_CATSEL = (TM_CFG.sellCats && TM_CFG.sellCats.length ? TM_CFG.sellCats.slice() : ids.slice());
  var allOn = ids.every(function (cid) { return TM_CATSEL.indexOf(cid) >= 0; });
  var grid = ids.map(function (cid) {
    var on = TM_CATSEL.indexOf(cid) >= 0;
    return '<div onclick="tmCatSelTog(\'' + cid + '\')" style="display:flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid ' + (on ? TM_C.txt : '#dfe3ed') + ';border-radius:3px;cursor:pointer;background:' + (on ? '#f0f7f4' : '#fff') + '">' +
      '<span style="width:14px;height:14px;flex:none;border-radius:2px;border:1px solid ' + (on ? TM_C.txt : '#c0c4cc') + ';background:' + (on ? TM_C.txt : '#fff') + ';color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center">' + (on ? '✓' : '') + '</span>' +
      '<span style="font-size:12px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + tmEsc(getCategoryName(cid)) + '</span></div>';
  }).join('');
  tgDlg({
    title: '选择分类', width: '560px', noFoot: true, onOk: 'void(0)', okText: '',
    body: '<div style="display:flex;align-items:center;padding:0 2px 8px">' +
        '<span style="font-size:12px;color:#8a93a3">勾选在销售界面展示的分类（至少一个）</span><span style="flex:1"></span>' +
        '<span id="tmCatAll" onclick="tmCatSelAll()" style="font-size:12px;color:' + TM_C.txt + ';cursor:pointer">' + (allOn ? '反选' : '全选') + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' + grid + '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px">' +
        '<span onclick="tgClose()" style="font-size:13px;padding:7px 22px;border:1px solid #c6cacd;border-radius:3px;cursor:pointer;color:#333;background:#fff">取消</span>' +
        '<span onclick="tmCatSelOk()" style="font-size:13px;padding:7px 22px;border-radius:3px;cursor:pointer;color:#fff;background:' + TM_C.txt + '">确定</span>' +
      '</div>'
  });
}
function tmCatSelTog(cid) {
  var i = TM_CATSEL.indexOf(cid);
  if (i >= 0) TM_CATSEL.splice(i, 1); else TM_CATSEL.push(cid);
  tmCatDlg();
}
function tmCatSelAll() {
  var b = tmBooth(); if (!b) return;
  var ids = tmCatList(b);
  var all = ids.every(function (cid) { return TM_CATSEL.indexOf(cid) >= 0; });
  TM_CATSEL = all ? [] : ids.slice();
  tmCatDlg();
}
function tmCatSelOk() {
  var b = tmBooth(); if (!b) return;
  if (!TM_CATSEL.length) { msTagToast('请至少选择一个分类'); return; }
  TM_CFG.sellCats = TM_CATSEL.slice();
  TM_CATSEL = null;
  tmPersist(); tgClose(); tmRender();
  msTagToast('销售分类展示已更新（' + TM_CFG.sellCats.length + ' 个分类）');
}
function tmSetRound(v) { TM_CFG.round = v; tmPersist(); tmRender(); msTagToast('现金抹零：' + v); }
function tmTgl(key) { TM_CFG[key] = !TM_CFG[key]; tmPersist(); tmRender(); }
