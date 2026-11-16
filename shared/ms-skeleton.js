/* ============================================================
   加载与骨架屏演示（pages/skeleton-demo.html）
   场景：经营统计页「一个接口返回整页数据」下的加载体验设计
   内容：首屏骨架屏 / 三档重查策略对比（保留旧数据 · 退回骨架 · 整页白屏）
         延迟阈值 300ms / 加载态最短展示 300ms / 竞态取消 / 布局偏移检测
   ============================================================ */

var SKD = {
  cfg: { refilter: 'keep', delay: 2000 },
  state: { store: 'all', period: 'today', date: '2026-10-15' },
  storeNames: ['唐镇店', '周浦店', '航头店', '康桥店'],
  storeK: [0.62, 0.44, 0.28, 0.21],
  base: { biz: 53932.98, ord: 1631, sale: 6353.22 },
  charts: {}, seq: 0, dropped: 0, loaded: false,
  snap: null, finalSnap: null, shownAt: 0, preview: false
};
var SKD_NAMES = { k0: 'KPI 卡1', k1: 'KPI 卡2', k2: 'KPI 卡3', k3: 'KPI 卡4', c1: '营业趋势', c2: '订单状态分布', c3: '品类营收占比', c4: '销售量趋势', tb: '门店对比表' };

/* ---------- 样式（幂等注入；类名统一 skd- 前缀，避免与 layout.css 冲突） ---------- */
function skdEnsureStyle() {
  if (document.getElementById('skdStyle')) return;
  var st = document.createElement('style'); st.id = 'skdStyle';
  st.textContent =
    '.skd-sk{background:linear-gradient(90deg,#eef1f6 25%,#e4e9f1 37%,#eef1f6 63%);background-size:400% 100%;border-radius:4px;animation:skdSk 1.4s ease infinite}' +
    '@keyframes skdSk{0%{background-position:100% 50%}100%{background-position:0 50%}}' +
    '@media (prefers-reduced-motion:reduce){.skd-sk{animation:none}}' +
    '.skd-bar{height:12px;border-radius:3px}' +
    '.skd-t{width:56px;height:17px}.skd-v{width:62%;height:37px;margin:8px 0 6px;border-radius:4px}.skd-s{width:78%;height:17px}' +
    '.skd-cols{display:flex;align-items:flex-end;gap:8px;height:100%;padding-top:6px}.skd-cols i{flex:1;border-radius:3px 3px 0 0}' +
    '.skd-line{height:100%;display:flex;flex-direction:column;justify-content:center;gap:14px}.skd-line i{height:10px;border-radius:3px}' +
    '.skd-donut{display:flex;align-items:center;gap:20px;height:100%}.skd-ring{width:150px;height:150px;border-radius:50%;flex-shrink:0}' +
    '.skd-legend{flex:1;display:flex;flex-direction:column;gap:12px}.skd-legend i{height:10px;border-radius:3px;display:block}' +
    '.skd-row{display:flex;gap:10px;align-items:center;height:39px;border-bottom:1px solid #f3f5f9}' +
    '.skd-row.hd{height:37px;border-bottom-color:#eef1f6;background:#fafbfd}.skd-row .skd-bar{flex:1}' +
    '.skd-spin{position:absolute;top:13px;right:14px;width:13px;height:13px;border:2px solid #e2e8f2;border-top-color:#005cf5;border-radius:50%;animation:skdSp .8s linear infinite;z-index:6}' +
    '@keyframes skdSp{to{transform:rotate(360deg)}}' +
    '.skd-pgbar{position:fixed;top:0;left:0;height:2px;width:34%;background:#005cf5;z-index:30;opacity:0;border-radius:0 2px 2px 0}' +
    '.skd-pgbar.on{opacity:1;animation:skdPg 1.1s ease-in-out infinite}' +
    '@keyframes skdPg{0%{transform:translateX(-100%)}100%{transform:translateX(290%)}}' +
    '.skd-dim{opacity:.72;transition:opacity .15s}' +
    '.skd-seg{display:flex;border:1px solid #dfe3ed;border-radius:4px;overflow:hidden;height:32px}' +
    '.skd-seg span{padding:0 12px;line-height:30px;font-size:12px;color:#5b6472;cursor:pointer;border-right:1px solid #dfe3ed;white-space:nowrap}' +
    '.skd-seg span:last-child{border-right:0}.skd-seg span.on{background:#e8f0ff;color:#005cf5;font-weight:500}' +
    '.skd-tabs{display:flex;border:1px solid #dfe3ed;border-radius:4px;overflow:hidden;height:32px}' +
    '.skd-tabs span{padding:0 14px;line-height:30px;font-size:12px;color:#5b6472;cursor:pointer;border-right:1px solid #dfe3ed}' +
    '.skd-tabs span:last-child{border-right:0}.skd-tabs span.on{background:#005cf5;color:#fff}' +
    '.skd-sel{width:230px;height:32px;border:1px solid #dfe3ed;border-radius:4px;font-size:12px;color:#1f2733;padding:0 8px;background:#fff}' +
    '.skd-kpi-t{font-size:12px;color:#8a93a3;line-height:17px}' +
    '.skd-kpi-v{font-size:26px;font-weight:600;color:#1f2733;line-height:37px;margin:8px 0 6px;letter-spacing:-.5px;white-space:nowrap}' +
    '.skd-kpi-s{font-size:12px;color:#8a93a3;line-height:17px}' +
    '.skd-empty{height:100%;min-height:150px;display:flex;align-items:center;justify-content:center;color:#b4b2a9;font-size:12px}' +
    '.skd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.skd-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}' +
    /* 筛选栏：上行业务条件 / 下行演示控制（虚线分隔，视觉分层） */
    '.skd-frow{display:flex;align-items:center;gap:10px;padding:11px 0;flex-wrap:wrap}' +
    '.skd-frow2{border-top:1px solid #f0f2f6}' +
    '.skd-flabel{font-size:12px;color:#8a93a3;flex-shrink:0}' +
    /* 指标条：chip 式排布，竖线分隔 */
    '.skd-perf{display:flex;align-items:center;flex-wrap:wrap;font-size:12px;color:#5b6472}' +
    '.skd-pm{padding:0 16px;border-left:1px solid #eef1f6;line-height:21px;white-space:nowrap}' +
    '.skd-pm:first-child{padding-left:0;border-left:0}' +
    '.skd-pm b{font-size:13px;color:#1f2733;font-weight:600;margin-left:6px}' +
    /* cmp 文案会随查询清空/填充，锁死行高，避免空文本时把下方模块顶起 */
    '.skd-perf #skdPCmp{flex:1;min-width:240px;text-align:right;min-height:21px;line-height:21px}' +
    '.skd-up{color:#fc4b52}.skd-down{color:#2fa46b}' +
    '.skd-ok{color:#2fa46b}.skd-bad{color:#d4537e}.skd-warn{color:#cf8a1b}' +
    '.skd-note{flex-shrink:0;font-size:12px;color:#5b6472;line-height:1.75;padding:2px 4px}' +
    '.skd-note code{background:#f2f5fa;padding:1px 4px;border-radius:3px;color:#185fa5}' +
    '.skd-kpicard{min-height:109px}' +
    '.skd-holder{min-height:193px}';
  document.head.appendChild(st);
}

/* ---------- 挂载 ---------- */
function skdInit() {
  var box = document.getElementById('skeletonDemoContent');
  if (!box) return;
  skdEnsureStyle();
  /* 顶部固定进度条（全局刷新信号） */
  if (!document.getElementById('skdPgbar')) {
    var pg = document.createElement('div'); pg.className = 'skd-pgbar'; pg.id = 'skdPgbar';
    document.body.appendChild(pg);
  }
  box.innerHTML =
    '<div id="skdBody" style="flex:1;min-height:0;overflow:auto;padding:14px 20px;display:flex;flex-direction:column;gap:10px;background:#F1F2F5">' +
      /* 筛选栏：上行 = 业务条件，下行 = 演示控制 */
      '<div class="stats-panel" style="padding:0 16px;flex-shrink:0">' +
        '<div class="skd-frow">' +
          '<select class="skd-sel" id="skdStoreSel" onchange="skdOnCond()">' +
            '<option value="all">上海正鲜优生鲜超市 · 全部门店</option>' +
            SKD.storeNames.map(function (n, i) { return '<option value="' + i + '">' + n + '</option>'; }).join('') +
          '</select>' +
          '<div class="skd-tabs" id="skdTabs">' +
            '<span class="on" data-p="today" onclick="skdPickPeriod(this)">今日</span>' +
            '<span data-p="week" onclick="skdPickPeriod(this)">本周</span>' +
            '<span data-p="month" onclick="skdPickPeriod(this)">本月</span>' +
          '</div>' +
          '<input class="skd-sel" id="skdDateInput" style="width:150px" type="date" value="2026-10-15" onchange="skdOnCond()">' +
          '<button class="ic-btn-pri" id="skdQbtn" onclick="skdQuery(\'user\')">查询</button>' +
          '<div style="flex:1"></div>' +
        '</div>' +
        '<div class="skd-frow skd-frow2">' +
          '<span class="skd-flabel">重查策略</span>' +
          '<div class="skd-seg" id="skdRefilterSeg">' +
            '<span class="on" data-r="keep" onclick="skdPickRefilter(this)">保留旧数据</span>' +
            '<span data-r="skeleton" onclick="skdPickRefilter(this)">退回骨架</span>' +
            '<span data-r="blank" onclick="skdPickRefilter(this)">整页白屏</span>' +
          '</div>' +
          '<span class="skd-flabel">模拟耗时</span>' +
          '<div class="skd-seg" id="skdDelays">' +
            '<span data-d="800" onclick="skdPickDelay(this)">0.8s</span>' +
            '<span class="on" data-d="2000" onclick="skdPickDelay(this)">2s</span>' +
            '<span data-d="3500" onclick="skdPickDelay(this)">3.5s</span>' +
            '<span data-d="60" onclick="skdPickDelay(this)">缓存命中 60ms</span>' +
          '</div>' +
          '<div style="flex:1"></div>' +
          '<button class="ic-btn" id="skdSkbtn" onclick="skdTogglePreview()">骨架预览</button>' +
          '<button class="ic-btn" onclick="skdBurst()" title="模拟用户快速连续切换条件">连点换条件 ×3</button>' +
        '</div>' +
      '</div>' +
      /* 性能指标条（chip 式） */
      '<div class="stats-panel" style="padding:10px 16px;flex-shrink:0">' +
        '<div class="skd-perf">' +
          '<span class="skd-pm">本次策略<b id="skdPMode">—</b></span>' +
          '<span class="skd-pm">首屏可见<b id="skdPFirst">—</b></span>' +
          '<span class="skd-pm">数据就绪<b id="skdPFull">—</b></span>' +
          '<span class="skd-pm">布局偏移<b id="skdPShift">—</b></span>' +
          '<span class="skd-pm">过期丢弃<b id="skdPDrop">0</b></span>' +
          '<span id="skdPCmp" class="skd-note" style="padding:0"></span>' +
        '</div>' +
      '</div>' +
      /* KPI */
      '<div class="skd-kpis">' +
        '<div class="stats-panel skd-kpicard" id="skdK0"></div>' +
        '<div class="stats-panel skd-kpicard" id="skdK1"></div>' +
        '<div class="stats-panel skd-kpicard" id="skdK2"></div>' +
        '<div class="stats-panel skd-kpicard" id="skdK3"></div>' +
      '</div>' +
      /* 图表 2×2 */
      '<div class="skd-grid2">' +
        '<div class="stats-panel" id="skdW1"><div class="stats-panel-title" style="margin-bottom:10px">营业趋势</div><div style="height:250px;position:relative" id="skdC1"></div></div>' +
        '<div class="stats-panel" id="skdW2"><div class="stats-panel-title" style="margin-bottom:10px">订单状态分布</div><div style="height:250px;position:relative" id="skdC2"></div></div>' +
      '</div>' +
      '<div class="skd-grid2">' +
        '<div class="stats-panel" id="skdW3"><div class="stats-panel-title" style="margin-bottom:10px">品类营收占比</div><div style="height:250px;position:relative" id="skdC3"></div></div>' +
        '<div class="stats-panel" id="skdW4"><div class="stats-panel-title" style="margin-bottom:10px">销售量趋势</div><div style="height:250px;position:relative" id="skdC4"></div></div>' +
      '</div>' +
      /* 门店对比表 */
      '<div class="stats-panel" id="skdW5"><div class="stats-panel-title" style="margin-bottom:10px">各门店经营数据对比</div><div class="skd-holder" id="skdTb"></div></div>' +
      /* 说明 */
      '<div class="skd-note">' +
        '<b>演示说明</b>：改动门店 / 时间 / 日期即触发重查。首次进入为<b>全页骨架屏</b>，之后由「重查策略」决定——' +
        '<code>保留旧数据</code>（默认，推荐）：旧内容原地不动，只出顶部细进度条 + 卡片角标小 spinner；' +
        '<code>退回骨架</code>：内容换成骨架再出现；<code>整页白屏</code>：清空等接口，最差体验。' +
        '300ms 内返回不出任何加载态（试「缓存命中 60ms」）；加载态最短展示 300ms 防闪烁；连点换条件时旧响应自动丢弃，只有最后一次生效；' +
        '骨架与最终结构同尺寸，可用「骨架预览」对照确认零布局偏移。' +
      '</div>' +
    '</div>';
  skdQuery('first');
}

/* ---------- 交互 ---------- */
function skdPickSeg(el) { var p = el.parentNode; [].forEach.call(p.children, function (c) { c.classList.remove('on'); }); el.classList.add('on'); }
function skdPickPeriod(el) { skdPickSeg(el); SKD.state.period = el.getAttribute('data-p'); skdOnCond(); }
function skdPickRefilter(el) { skdPickSeg(el); SKD.cfg.refilter = el.getAttribute('data-r'); }
function skdPickDelay(el) { skdPickSeg(el); SKD.cfg.delay = parseInt(el.getAttribute('data-d'), 10); }
function skdOnCond() {
  SKD.state.store = document.getElementById('skdStoreSel').value;
  SKD.state.date = document.getElementById('skdDateInput').value || '2026-10-15';
  skdQuery('refilter');
}

/* ---------- 演示数据（随条件确定性变化） ---------- */
function skdSeed() {
  var s = SKD.state.store + '|' + SKD.state.period + '|' + SKD.state.date, h = 7;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}
function skdRnd(i) { var x = Math.sin(skdSeed() + i * 97.13) * 43758.5453; return x - Math.floor(x); }
function skdPad(n) { return (n < 10 ? '0' : '') + n; }
function skdAxis() {
  var d = new Date(SKD.state.date.replace(/-/g, '/')), out = [], i, t;
  if (SKD.state.period === 'today') { for (i = 8; i <= 20; i++) out.push(skdPad(i)); return out; }
  if (SKD.state.period === 'week') {
    for (i = 6; i >= 0; i--) { t = new Date(d.getTime()); t.setDate(t.getDate() - i); out.push(skdPad(t.getMonth() + 1) + '-' + skdPad(t.getDate())); }
    return out;
  }
  var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  for (i = 1; i <= last; i++) out.push(skdPad(d.getMonth() + 1) + '-' + skdPad(i));
  return out;
}
function skdDb(v) { return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'; }
function skdModel() {
  var labels = skdAxis(), n = labels.length, i, t;
  var k = SKD.state.store === 'all' ? 1 : SKD.storeK[parseInt(SKD.state.store, 10)];
  var span = SKD.state.period === 'today' ? 1 : (SKD.state.period === 'week' ? 6.4 : 27.5);
  var f = k * span * (0.9 + skdRnd(1) * 0.2);
  var biz = SKD.base.biz * f, ord = SKD.base.ord * f, sale = SKD.base.sale * f;
  var bizS = [], ordS = [], saleS = [];
  var hourW = [0.16, 0.20, 0.19, 0.13, 0.04, 0.025, 0.045, 0.07, 0.06, 0.07, 0.10, 0.085, 0.025];
  for (i = 0; i < n; i++) {
    t = SKD.state.period === 'today' ? hourW[i] : (0.8 + Math.sin(i * 0.9 + skdSeed() % 7) * 0.25 + skdRnd(20 + i) * 0.25) / n * 1.05;
    bizS.push(Math.round(biz * t));
    ordS.push(Math.round(ord * t * (0.9 + skdRnd(40 + i) * 0.2)));
    saleS.push(Math.round(sale * t * (0.9 + skdRnd(60 + i) * 0.2)));
  }
  var cats = [['爱心摊位', 21], ['生鲜蔬菜', 18], ['禽蛋', 9], ['肉类', 9], ['干菜', 6], ['调味品', 5], ['水果', 5], ['鲜果', 4], ['百货', 4], ['鲜蛋', 3], ['冷藏', 2], ['食用菌', 2]]
    .map(function (c) { return [c[0], Math.max(1, Math.round(c[1] * (0.8 + skdRnd(c[0].length + c[1]) * 0.4)))]; });
  var stores = [];
  if (SKD.state.store === 'all') {
    for (i = 0; i < SKD.storeNames.length; i++) {
      var kk = SKD.storeK[i] * span * (0.94 + skdRnd(80 + i) * 0.12);
      var b2 = SKD.base.biz * kk, o2 = SKD.base.ord * kk, s2 = SKD.base.sale * kk;
      stores.push([SKD.storeNames[i], b2.toFixed(2), Math.round(o2).toString(), s2.toFixed(2), (b2 / o2).toFixed(2), '—']);
    }
  } else {
    var idx = parseInt(SKD.state.store, 10);
    stores.push([SKD.storeNames[idx], biz.toFixed(2), Math.round(ord).toString(), sale.toFixed(2), (biz / ord).toFixed(2), '—']);
  }
  return {
    labels: labels, biz: bizS, ord: ordS, sale: saleS, cats: cats, stores: stores,
    bizTotal: biz, ordTotal: Math.round(ord),
    kpis: [
      { t: '营业额', v: '¥' + biz.toFixed(2), s: '较上期 ' + skdDb(skdRnd(2) * 120 - 30) },
      { t: '订单数', v: Math.round(ord).toLocaleString(), s: '较上期 ' + skdDb(skdRnd(3) * 90 - 60) },
      { t: '销售量', v: sale.toFixed(2), s: '较上期 ' + skdDb(skdRnd(4) * 150 - 20) },
      { t: '客单价', v: '¥' + (biz / ord).toFixed(2), s: '较上期 ' + skdDb(skdRnd(5) * 40 - 12) }
    ]
  };
}

/* ---------- 骨架屏（与最终结构同尺寸） ---------- */
function skdSkKPI() { return '<div class="skd-sk skd-bar skd-t"></div><div class="skd-sk skd-v"></div><div class="skd-sk skd-bar skd-s"></div>'; }
function skdSkLine() {
  var h = [42, 58, 66, 48, 30, 24, 34, 40, 36, 38, 50, 44, 22], s = '<div class="skd-line">';
  for (var i = 0; i < h.length; i++) s += '<i class="skd-sk" style="width:' + (30 + h[i]) + '%"></i>';
  return s + '</div>';
}
function skdSkBars() {
  var h = [78, 92, 80, 52, 30, 26, 46, 42, 44, 38, 18, 12, 16], s = '<div class="skd-cols">';
  for (var i = 0; i < h.length; i++) s += '<i class="skd-sk" style="height:' + h[i] + '%"></i>';
  return s + '</div>';
}
function skdSkDonut() {
  var w = [100, 76, 62, 84, 54, 70, 46, 58], s = '<div class="skd-donut"><div class="skd-sk skd-ring"></div><div class="skd-legend">';
  for (var i = 0; i < w.length; i++) s += '<i class="skd-sk" style="width:' + w[i] + '%"></i>';
  return s + '</div></div>';
}
function skdSkTable() {
  var w = [46, 64, 52, 58, 44, 40], r, s = '<div class="skd-row hd">' + w.map(function (x) { return '<div class="skd-sk skd-bar" style="max-width:' + (x * 1.5) + 'px;background:#e9edf4"></div>'; }).join('') + '</div>';
  for (r = 0; r < 4; r++) s += '<div class="skd-row">' + w.map(function (x, k) { return '<div class="skd-sk skd-bar" style="max-width:' + (x * 1.5 - r * 3 - k) + 'px"></div>'; }).join('') + '</div>';
  return s;
}
function skdRenderSkeleton() {
  for (var i = 0; i < 4; i++) document.getElementById('skdK' + i).innerHTML = skdSkKPI();
  document.getElementById('skdC1').innerHTML = skdSkLine();
  document.getElementById('skdC2').innerHTML = skdSkDonut();
  document.getElementById('skdC3').innerHTML = skdSkDonut();
  document.getElementById('skdC4').innerHTML = skdSkBars();
  document.getElementById('skdTb').innerHTML = skdSkTable();
}
function skdRenderBlank() {
  var e = '<div class="skd-empty">加载中…</div>';
  for (var i = 0; i < 4; i++) document.getElementById('skdK' + i).innerHTML = '<div style="height:74px"></div>';
  document.getElementById('skdC1').innerHTML = e;
  document.getElementById('skdC2').innerHTML = e;
  document.getElementById('skdC3').innerHTML = e;
  document.getElementById('skdC4').innerHTML = e;
  document.getElementById('skdTb').innerHTML = '<div style="height:160px"></div>';
}

/* ---------- 真实数据渲染 ---------- */
function skdMkChart(id, cfg) {
  var el = document.getElementById(id); if (!el) return;
  var old = SKD.charts[id];
  if (old && old.canvas && !old.canvas.isConnected) { try { old.destroy(); } catch (e) {} old = SKD.charts[id] = null; }
  if (old) { old.data = cfg.data; old.options = cfg.options; old.$skdBig = cfg.big || ''; old.$skdSmall = cfg.small || ''; old.update('none'); return; }
  var inst = new Chart(el, cfg);
  inst.$skdBig = cfg.big || ''; inst.$skdSmall = cfg.small || '';
  if (cfg.big) inst.update('none');   /* 构造时已同步渲染过一次，补重绘让中心指标出现 */
  SKD.charts[id] = inst;
}
/* 环形图中心指标（afterDraw 画在圆心；构造时同步渲染，故优先读 config 兜底） */
var skdCenterText = {
  id: 'skdCenterText',
  afterDraw: function (chart) {
    var big = (chart.$skdBig != null && chart.$skdBig !== '') ? chart.$skdBig : (chart.config && chart.config.big) || '';
    if (!big) return;
    var small = chart.$skdSmall || (chart.config && chart.config.small) || '';
    var meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data[0]) return;
    var x = meta.data[0].x, y = meta.data[0].y, c = chart.ctx;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '600 20px "PingFang SC","Microsoft YaHei",sans-serif'; c.fillStyle = '#1f2733';
    c.fillText(big, x, y - 9);
    c.font = '11px "PingFang SC","Microsoft YaHei",sans-serif'; c.fillStyle = '#8a93a3';
    c.fillText(small, x, y + 13);
    c.restore();
  }
};
function skdWan(v) { return v >= 10000 ? ((v / 10000).toFixed(1).replace(/\.0$/, '')) + '万' : String(Math.round(v)); }
function skdRenderKPI(m) {
  for (var i = 0; i < 4; i++) {
    var s = m.kpis[i].s, neg = s.indexOf('-') >= 0;   /* 涨红跌绿（国内惯例） */
    var pct = s.replace('较上期', '').replace(/[+\-\s]/g, '');
    document.getElementById('skdK' + i).innerHTML =
      '<div class="skd-kpi-t">' + m.kpis[i].t + '</div><div class="skd-kpi-v">' + m.kpis[i].v + '</div>' +
      '<div class="skd-kpi-s">较上期 <b class="' + (neg ? 'skd-down' : 'skd-up') + '">' + (neg ? '↓ ' : '↑ ') + pct + '</b></div>';
  }
}
function skdRenderCharts(m) {
  ['skdC1', 'skdC2', 'skdC3', 'skdC4'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && !el.querySelector('canvas')) el.innerHTML = '<canvas id="' + id + 'Cv"></canvas>';
  });
  var opt = { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, boxHeight: 6, padding: 12, font: { size: 11 } } } } };
  skdMkChart('skdC1Cv', {
    type: 'line',
    data: { labels: m.labels, datasets: [
      { label: '营业额', data: m.biz, borderColor: '#005cf5', backgroundColor: 'rgba(0,92,245,.06)', fill: true, tension: .35, borderWidth: 2, pointRadius: m.labels.length > 20 ? 0 : 2, yAxisID: 'y' },
      { label: '订单数', data: m.ord, borderColor: '#2fa46b', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, yAxisID: 'y1', fill: false }
    ] },
    options: Object.assign({}, opt, { interaction: { mode: 'index', intersect: false }, scales: {
      y: { beginAtZero: true, grid: { color: '#f0f2f6' }, ticks: { font: { size: 10 } } },
      y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true } } } })
  });
  skdMkChart('skdC2Cv', {
    type: 'doughnut',
    plugins: [skdCenterText],
    big: m.ordTotal.toLocaleString(), small: '订单总数',
    data: { labels: ['已配送 98.67%', '待处理 0.33%', '已退款 1.03%'], datasets: [{ data: [98.67, 0.33, 1.03], backgroundColor: ['#3fbf7f', '#8fd6b4', '#1f7d55'], borderWidth: 0 }] },
    options: Object.assign({}, opt, { cutout: '68%' })
  });
  skdMkChart('skdC3Cv', {
    type: 'doughnut',
    plugins: [skdCenterText],
    big: '¥' + skdWan(m.bizTotal), small: '营业额',
    data: { labels: m.cats.map(function (c) { return c[0] + ' ' + c[1] + '%'; }), datasets: [{ data: m.cats.map(function (c) { return c[1]; }), backgroundColor: ['#005cf5', '#2b7cf5', '#4f97f7', '#74b0f9', '#9ac9fb', '#b7d8fc', '#cfe3fd', '#e0ecfe', '#4fc3a1', '#7fd4b8', '#a8e2ce', '#c9ecdf'], borderWidth: 0 }] },
    options: Object.assign({}, opt, { cutout: '62%', plugins: { legend: { position: 'right', labels: { boxWidth: 8, boxHeight: 8, font: { size: 11 }, padding: 8 } } } })
  });
  skdMkChart('skdC4Cv', {
    type: 'bar',
    data: { labels: m.labels, datasets: [{ label: '销售量', data: m.sale, backgroundColor: '#7fb4f8', borderRadius: 4, barPercentage: .55 }] },
    options: Object.assign({}, opt, { plugins: { legend: { display: false } }, scales: {
      y: { beginAtZero: true, grid: { color: '#f0f2f6' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true } } } })
  });
}
function skdRenderTable(m) {
  document.getElementById('skdTb').innerHTML = '<table style="width:100%;border-collapse:collapse"><thead><tr>' +
    ['门店名称', '营业额', '订单数', '销售量', '客单价', '毛利率'].map(function (h, i) { return '<th style="text-align:' + (i ? 'right' : 'left') + ';font-size:12px;font-weight:500;color:#1f2733;height:36px;padding:0 14px 0 10px;border-bottom:1px solid #eef1f6;background:#fafbfd">' + h + '</th>'; }).join('') +
    '</tr></thead><tbody>' +
    m.stores.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td style="text-align:' + (i ? 'right' : 'left') + ';font-size:13px;color:#1f2733;height:39px;padding:0 14px 0 10px;border-bottom:1px solid #f3f5f9">' + c + '</td>'; }).join('') + '</tr>'; }).join('') +
    '</tbody></table>';
}

/* ---------- 重查提示（轻量：顶部进度条 + 卡片角标 spinner + 内容微淡） ---------- */
function skdMark(on) {
  var wraps = ['skdW1', 'skdW2', 'skdW3', 'skdW4', 'skdW5'], i;
  if (on) {
    SKD.shownAt = performance.now();
    for (i = 0; i < 4; i++) document.getElementById('skdK' + i).classList.add('skd-dim');
    wraps.forEach(function (id) {
      var w = document.getElementById(id);
      if (!w || w.querySelector('.skd-spin')) return;
      var s = document.createElement('div'); s.className = 'skd-spin';
      w.style.position = 'relative';
      w.appendChild(s);
    });
    document.getElementById('skdTb').classList.add('skd-dim');
    var bar = document.getElementById('skdPgbar'); if (bar) bar.className = 'skd-pgbar on';
  } else {
    SKD.shownAt = 0;
    for (i = 0; i < 4; i++) document.getElementById('skdK' + i).classList.remove('skd-dim');
    document.querySelectorAll('.skd-spin').forEach(function (s) { s.parentNode.removeChild(s); });
    document.getElementById('skdTb').classList.remove('skd-dim');
    var bar2 = document.getElementById('skdPgbar'); if (bar2) bar2.className = 'skd-pgbar';
  }
}

/* ---------- 布局偏移检测（锚定内容容器，排除页面头部/滚动条等外部因素） ---------- */
function skdSnap() {
  var o = {}, host = document.getElementById('skdBody');
  var base = host ? (host.getBoundingClientRect().top - host.scrollTop) : window.scrollY;
  Object.keys(SKD_NAMES).forEach(function (k) {
    var el = document.getElementById('skd' + k.charAt(0).toUpperCase() + k.slice(1));
    if (!el) return;
    var r = el.getBoundingClientRect();
    o[k] = { t: Math.round(r.top - base), h: Math.round(r.height) };
  });
  o.doc = host ? Math.round(host.scrollHeight) : Math.round(document.body.scrollHeight);
  return o;
}
function skdTakeSnap() { requestAnimationFrame(function () { SKD.snap = skdSnap(); }); }
function skdReportShift() {
  requestAnimationFrame(function () {
    var el = document.getElementById('skdPShift');
    if (!SKD.snap) { el.textContent = '—'; return; }
    var now = skdSnap(), max = 0, where = '';
    Object.keys(SKD_NAMES).forEach(function (k) {
      if (!now[k] || !SKD.snap[k]) return;
      var d = Math.max(Math.abs(now[k].t - SKD.snap[k].t), Math.abs(now[k].h - SKD.snap[k].h));
      if (d > max) { max = d; where = SKD_NAMES[k]; }
    });
    var dd = Math.abs((now.doc || 0) - (SKD.snap.doc || 0));
    el.className = (max <= 2 && dd <= 2) ? 'skd-ok' : 'skd-bad';
    el.textContent = (max <= 2 && dd <= 2) ? '0 px（无抖动）' : max + ' px · ' + where + ' / 文档 ' + dd + ' px';
  });
}
function skdFmt(ms) { return ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s'; }

/* ---------- 骨架预览 ---------- */
function skdSkBtn(on) {
  var b = document.getElementById('skdSkbtn');
  if (!b) return;
  b.textContent = on ? '退出骨架预览' : '骨架预览';
  b.className = on ? 'ic-btn-pri' : 'ic-btn';
}
function skdExitPreview() { if (SKD.preview) { SKD.preview = false; skdSkBtn(false); } }
function skdTogglePreview() {
  if (SKD.preview) { skdExitPreview(); skdQuery('user'); return; }
  SKD.preview = true;
  SKD.seq++;                        /* 让在途请求的响应失效 */
  skdMark(false);
  skdRenderSkeleton();
  document.getElementById('skdTb').classList.remove('skd-dim');
  skdSkBtn(true);
  document.getElementById('skdPMode').textContent = '骨架预览（未发起请求）';
  document.getElementById('skdPMode').className = '';
  document.getElementById('skdPFull').textContent = '—';
  document.getElementById('skdPShift').textContent = '—';
  document.getElementById('skdPShift').className = '';
  skdCmpSkeleton();
}
function skdCmpSkeleton() {
  var el = document.getElementById('skdPCmp');
  var n = document.querySelectorAll('.skd-sk').length;
  if (!SKD.finalSnap) {
    el.innerHTML = '<span class="skd-warn">骨架共 ' + n + ' 个占位元素；先「查询」加载一次数据，即可对照骨架与最终渲染的尺寸</span>';
    return;
  }
  var now = skdSnap(), bad = [];
  Object.keys(SKD_NAMES).forEach(function (k) {
    if (!now[k] || !SKD.finalSnap[k]) return;
    var d = now[k].h - SKD.finalSnap[k].h;
    if (Math.abs(d) > 2) bad.push(SKD_NAMES[k] + ' ' + (d > 0 ? '+' : '') + d + 'px');
  });
  el.innerHTML = bad.length
    ? '<span class="skd-bad">骨架与最终尺寸不一致：' + bad.join('、') + '</span>'
    : '<span class="skd-ok">骨架 ' + n + ' 个占位元素，与最终渲染 9 个模块高度差全部为 0 px</span>';
}

/* ---------- 查询主流程 ---------- */
function skdQuery(reason) {
  skdExitPreview();
  var seq = ++SKD.seq;
  var t0 = performance.now();
  var first = !SKD.loaded;
  var mode = first ? 'skeleton' : SKD.cfg.refilter;
  var modeName = first ? '首屏 · 骨架屏' : (mode === 'keep' ? '重查 · 保留旧数据' : (mode === 'skeleton' ? '重查 · 退回骨架' : '重查 · 整页白屏'));
  document.getElementById('skdPMode').textContent = modeName;
  document.getElementById('skdPMode').className = (mode === 'keep') ? 'skd-ok' : (mode === 'blank' ? 'skd-bad' : '');
  document.getElementById('skdPCmp').textContent = '';
  if (first) { document.getElementById('skdPFirst').textContent = '—'; document.getElementById('skdPFirst').className = ''; }
  document.getElementById('skdPFull').textContent = '—';

  if (mode === 'skeleton') skdRenderSkeleton();
  else if (mode === 'blank') skdRenderBlank();
  else skdMark(false);
  skdTakeSnap();
  if (mode === 'skeleton') {
    var f = document.getElementById('skdPFirst');
    requestAnimationFrame(function () { f.textContent = skdFmt(performance.now() - t0); f.className = 'skd-ok'; });
  }

  var showTm = null;
  if (mode === 'keep') {
    showTm = setTimeout(function () {
      if (seq !== SKD.seq) return;     /* 已被更新的请求取代，不再提示 */
      skdMark(true);
    }, 300);
  }

  setTimeout(function () {
    if (seq !== SKD.seq) {             /* 竞态：过期响应丢弃 */
      SKD.dropped++;
      document.getElementById('skdPDrop').textContent = SKD.dropped;
      return;
    }
    if (showTm) clearTimeout(showTm);
    var m = skdModel();
    var shown = SKD.shownAt;
    var apply = function () {
      skdRenderKPI(m); skdRenderCharts(m); skdRenderTable(m);
      SKD.loaded = true;
      var full = performance.now() - t0;
      if (mode === 'blank') { var bf = document.getElementById('skdPFirst'); bf.textContent = skdFmt(full); bf.className = 'skd-bad'; }
      document.getElementById('skdPFull').textContent = skdFmt(full);
      if (mode === 'blank') document.getElementById('skdPCmp').innerHTML = '<span class="skd-bad">整页白屏 ' + skdFmt(full) + '，用户失去全部上下文</span>';
      else if (mode === 'skeleton' && !first) document.getElementById('skdPCmp').innerHTML = '<span class="skd-warn">已有数据被换成骨架，内容二次消失又出现</span>';
      else if (mode === 'keep') document.getElementById('skdPCmp').innerHTML = shown ? '<span class="skd-ok">加载态在 300ms 阈值后出现，旧数据全程可见</span>' : '<span class="skd-ok">请求 ' + skdFmt(full) + ' 返回（小于 300ms 阈值），未出现任何加载态</span>';
      skdReportShift();
      SKD.finalSnap = skdSnap();
    };
    if (SKD.shownAt) {
      var held = performance.now() - SKD.shownAt;
      if (held < 300) setTimeout(function () { skdMark(false); apply(); }, 300 - held);
      else { skdMark(false); apply(); }
    } else apply();
  }, SKD.cfg.delay);
}

/* 模拟用户快速连续切换条件：只有最后一次生效，其余被丢弃 */
function skdBurst() {
  [['all', 'today'], ['1', 'week'], ['2', 'month']].forEach(function (p, i) {
    setTimeout(function () {
      document.getElementById('skdStoreSel').value = p[0];
      SKD.state.store = p[0]; SKD.state.period = p[1];
      [].forEach.call(document.querySelectorAll('#skdTabs span'), function (s) { s.classList.toggle('on', s.getAttribute('data-p') === SKD.state.period); });
      skdQuery('burst');
    }, i * 120);
  });
}
