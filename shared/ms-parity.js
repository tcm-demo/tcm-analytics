/* ============================================================
   平价菜（中台）· pages/parity-veg.html
   布局：筛选栏 + 左侧 2×2 图表（整体压缩 1/3 宽度）+ 右侧达标统计列表
   数据范围：默认近两周（14 天）
   数据：确定性伪随机演示数据（基于市场序号 + 日期天数做种子，刷新不变）
   ============================================================ */

var PV_CHARTS = {};
var PV_MARKETS = ['乐山菜市场', '唐兴市集', '新随市集', '睿中市集', '乌中市集', '高安市集', '凌桥市集', '北园市集'];
/* 日销平价菜基线（kg/天）：前几家常年达标，末两家呈现部分达标 / 不达标 */
var PV_BASE = [820, 640, 500, 420, 300, 46, 28, 15];
/* 达标口径：日销 >30kg 达标 / 15~30kg 部分达标 / <15kg 不达标 */
/* 补贴核算（二级页保留）：达标 100 元 / 部分达标 50 元 / 不达标 0 元 */
var PV_SUB_FULL = 100, PV_SUB_PART = 50;
var PV_START = '', PV_END = '', PV_MARKET = '';
var PV_VEGS = ['青菜', '大白菜', '白萝卜', '土豆', '西红柿', '黄瓜', '卷心菜', '鸡毛菜'];
var PV_VEG = '';   /* 蔬菜品种筛选（''=全部） */
var PV_MOD_START = '', PV_MOD_END = '', PV_MOD_DAYS = [];   /* 达标统计 二级页的时间范围（DAYS = 实际生效日集合） */
var PV_MOD_MODE = 'day';                  /* day 按日查看（默认，带入主页周期）/ month 按月查看（多选月份） */
var PV_MOD_MONTHS = [];                   /* 按月模式：已选月份（可多选，双月面板点选切换） */

/* ---------- 工具 ---------- */
function pvRand(seed) { var x = Math.sin(seed) * 43758.5453; return x - Math.floor(x); }
function pvPad(n) { return (n < 10 ? '0' : '') + n; }
function pvFmt(d) { return d.getFullYear() + '-' + pvPad(d.getMonth() + 1) + '-' + pvPad(d.getDate()); }
function pvShort(d) { return pvPad(d.getMonth() + 1) + '-' + pvPad(d.getDate()); }
function pvAddDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function pvDayNum(key) { return Math.floor(new Date(key.replace(/-/g, '/')).getTime() / 86400000); }
function pvRound2(v) { return Math.round(v * 100) / 100; }

function pvDays(startStr, endStr) {
  var out = [], cur = new Date(startStr.replace(/-/g, '/')), end = new Date(endStr.replace(/-/g, '/'));
  if (isNaN(cur.getTime()) || isNaN(end.getTime()) || cur > end) return out;
  while (cur <= end) {
    out.push({ key: pvFmt(cur), label: pvShort(cur) });
    cur = pvAddDays(cur, 1);
  }
  return out;
}

/* ---------- 演示数据（确定性） ---------- */
/* 品种筛选偏移：选具体品种时数据随之变化（确定性，不引新数据域） */
function pvVOff() { return PV_VEG === '' ? 0 : (parseInt(PV_VEG, 10) + 1) * 1009; }
/* 当日是否缺报（~5.5%）：缺报日不计销售天数、不参与三档判定 */
function pvMiss(mIdx, day) { return pvRand(mIdx * 97 + pvDayNum(day.key) * 13 + pvVOff() + 1) < 0.055; }
function pvSales(mIdx, day) {
  if (pvMiss(mIdx, day)) return null;
  var s = pvRand(mIdx * 97 + pvDayNum(day.key) * 13 + pvVOff() + 2);
  return Math.round(PV_BASE[mIdx] * (0.72 + s * 0.62));
}
function pvPrice(day, mIdx) { /* 元/斤，mIdx<0 = 全部菜场汇总 */
  var s = pvRand((mIdx < 0 ? 5 : mIdx * 17) + pvDayNum(day.key) * 13 + pvVOff() + 3);
  var base = mIdx < 0 ? 2.05 : 1.88 + (mIdx % 5) * 0.05;
  return pvRound2(Math.max(1.4, base + (s - 0.45) * 0.5));
}
function pvPriceSeries(days, mIdx) { return days.map(function (d) { return pvPrice(d, mIdx); }); }
function pvSupplySeries(days, mIdx) { /* kg，mIdx<0 = 全部菜场合计 */
  return days.map(function (d) {
    if (mIdx >= 0) return pvSales(mIdx, d) || 0;
    var t = 0;
    for (var i = 0; i < PV_MARKETS.length; i++) t += (pvSales(i, d) || 0);
    return t;
  });
}
function pvMarketAvgPrice(mIdx, days) {
  var s = pvPriceSeries(days, mIdx);
  return pvRound2(s.reduce(function (a, b) { return a + b; }, 0) / Math.max(s.length, 1));
}
function pvMarketSupply(mIdx, days) {
  return pvSupplySeries(days, mIdx).reduce(function (a, b) { return a + b; }, 0);
}
/* 达标统计（列表行）：missShort = 缺失日期（主页用，月-日、顿号连缀）；missList = 缺失日明细（二级页可编辑补充说明 / 导出用） */
function pvAgg(mIdx, days) {
  var sale = 0, full = 0, part = 0, none = 0;
  var missList = pvMissList(mIdx, days);
  for (var i = 0; i < days.length; i++) {
    var d = days[i];
    if (pvMiss(mIdx, d)) continue;
    sale++;
    var v = pvSales(mIdx, d) || 0;
    if (v > 30) full++; else if (v >= 15) part++; else none++;
  }
  return {
    name: PV_MARKETS[mIdx], sale: sale, full: full, part: part, none: none,
    sub: full * PV_SUB_FULL + part * PV_SUB_PART,
    missList: missList,
    missShort: missList.length ? missList.map(function (o) { return o.label; }).join('、') : '—'
  };
}

/* ---------- 缺失说明 · 用户补充（二级页可编辑；日期由系统生成、不可删除） ---------- */
/* 说明按「市场 + 具体日期」存储，格式固定为「月-日 + 用户补充内容」，以顿号分隔 */
var PV_MISS_NOTES = null;
function pvMissNotes() {
  if (PV_MISS_NOTES) return PV_MISS_NOTES;
  PV_MISS_NOTES = {};
  try {
    var raw = localStorage.getItem('tcm_parity_miss_notes_v1');
    if (raw) PV_MISS_NOTES = JSON.parse(raw) || {};
  } catch (e) { PV_MISS_NOTES = {}; }
  return PV_MISS_NOTES;
}
function pvMissNotesSave() {
  try { localStorage.setItem('tcm_parity_miss_notes_v1', JSON.stringify(pvMissNotes())); } catch (e) {}
}
function pvMissList(mIdx, days) {
  var out = [];
  for (var i = 0; i < days.length; i++) if (pvMiss(mIdx, days[i])) out.push({ label: days[i].label, key: days[i].key });
  return out;
}
/* 展示文本：10-02网络异常、10-09 （未补充时仅 10-02、10-09） */
function pvMissText(mIdx, list) {
  var notes = pvMissNotes();
  return list.map(function (o) { return o.label + (notes[mIdx + '|' + o.key] || ''); }).join('、');
}
/* 单元格（仅二级页）：展示 + 「录入」入口 */
function pvMissHTML(mIdx, list) {
  if (!list.length) return '<span style="color:#8a93a3">—</span>';
  return '<span style="color:#5b6472">' + pvMissText(mIdx, list) + '</span>' +
    '<span style="color:#2f7bf6;cursor:pointer;margin-left:8px;white-space:nowrap" onclick="pvMissOpen(' + mIdx + ')">录入</span>';
}
function pvEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* 录入弹窗：按缺失日期逐条填写原因（日期固定不可删，可留空） */
function pvMissOpen(mIdx) {
  var days = PV_MOD_DAYS.length ? PV_MOD_DAYS : pvDays(PV_MOD_START, PV_MOD_END);
  var list = pvMissList(mIdx, days);
  if (!list.length) { pvToast('该市场本期无缺失日期'); return; }
  var notes = pvMissNotes();
  var rangeTxt = (PV_MOD_MODE === 'month' && PV_MOD_MONTHS.length)
    ? (PV_MOD_MONTHS.slice().sort().join('、'))
    : (PV_MOD_START + ' ~ ' + PV_MOD_END);
  var body = '<div style="font-size:12px;color:#8a93a3;margin-bottom:10px">' +
    '市场：<span style="color:#1f2733">' + PV_MARKETS[mIdx] + '</span>　周期：' + rangeTxt +
    '　缺失 <span style="color:#fa8c16;font-weight:600">' + list.length + '</span> 天</div>';
  body += '<div style="display:flex;flex-direction:column;gap:8px">';
  for (var i = 0; i < list.length; i++) {
    body += '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="width:56px;font-size:12px;color:#5b6472">' + list[i].label + '</span>' +
      '<input type="text" data-dkey="' + list[i].key + '" maxlength="30" placeholder="请填写缺失原因（可留空）"' +
      ' value="' + pvEsc(notes[mIdx + '|' + list[i].key] || '') + '"' +
      ' style="flex:1;height:32px;padding:0 8px;border:1px solid var(--border);border-radius:4px;font-size:12px">' +
      '</div>';
  }
  body += '</div>' +
    '<div style="margin-top:10px;font-size:12px;color:#8a93a3;line-height:1.7">日期由系统生成、不可删除；仅可填写原因，留空即不显示。</div>' +
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">' +
      '<button class="ic-btn" onclick="pvCloseModal()">取消</button>' +
      '<button class="ic-btn-pri" onclick="pvMissSave(' + mIdx + ')">保存</button>' +
    '</div>';
  pvModal(PV_MARKETS[mIdx] + ' · 缺失说明录入', body, 'min(520px,94vw)');
}
function pvMissSave(mIdx) {
  var notes = pvMissNotes();
  var ins = document.querySelectorAll('#pvModalWrap input[data-dkey]');
  for (var i = 0; i < ins.length; i++) {
    var k = mIdx + '|' + ins[i].getAttribute('data-dkey');
    var v = String(ins[i].value || '').replace(/、/g, '').replace(/\s+/g, ' ').trim();  /* 顿号为条目分隔符，不可输入 */
    if (v) notes[k] = v; else delete notes[k];
  }
  pvMissNotesSave();
  pvCloseModal();
  pvMQuery();
  pvToast('缺失说明已保存');
}

/* ---------- 页面骨架 ---------- */
/* 图表卡片的「查看更多 / 导出」仅保留入口样式、不提供具体功能（10-15） */
function pvLink(key, noExport) {
  var exp = noExport ? '' :
    '<span style="color:#d5dbe4">|</span>' +
    '<span style="color:#2f7bf6">导出</span>';
  return '<div style="display:flex;gap:10px;font-size:12px;flex-shrink:0">' +
    '<span style="color:#2f7bf6">查看更多</span>' + exp +
    '</div>';
}
function pvPanel(key, title) {
  return '<div class="stats-panel" style="display:flex;flex-direction:column;min-height:0">' +
    '<div class="stats-panel-header">' +
      '<div><div class="stats-panel-title">' + title + '</div></div>' + pvLink(key) +
    '</div>' +
    '<div style="flex:1;min-height:0;position:relative;padding:6px 10px 10px"><canvas id="pvChart-' + key + '"></canvas></div>' +
  '</div>';
}
function pvMonthOptions(sel) {
  var now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1, opts = '';
  for (var i = 0; i < 12; i++) {
    var yy = y, mm = m - i;
    while (mm <= 0) { mm += 12; yy--; }
    var key = yy + '-' + (mm < 10 ? '0' + mm : '' + mm);
    opts += '<option value="' + key + '"' + (key === sel ? ' selected' : '') + '>' + key + '</option>';
  }
  return opts;
}
/* 右侧达标统计列表（withSub=true = 二级页版：带「补贴金额」列 + 缺失说明显示详情；主页版只显示缺失日期） */
function pvAggTableHTML(days, withSub) {
  var th = 'padding:9px 4px;text-align:center;font-weight:500;font-size:12px;color:#1f2733;background:#fff;border-bottom:1px solid #eef1f6;white-space:normal;line-height:1.4';
  var td = 'padding:10px 6px;text-align:center;font-size:12px;border-bottom:1px solid #f3f5f9;color:#1f2733';
  var sub = 'font-size:11px;font-weight:400;color:#8a93a3';
  var nw = '<span style="white-space:nowrap">';
  /* 列宽规划：数值列等宽，市场名称 / 统计周期 / 补贴金额 / 缺失说明占其余 */
  var w = withSub
    ? ['12%', '9%', '8%', '8%', '9%', '8%', '8%', '11%', '']       /* 二级页 9 列 */
    : ['14%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', ''];    /* 主页 7 列 */
  var wh = function (i) { return w[i] ? ';width:' + w[i] : ''; };
  var h = '<table style="min-width:' + (withSub ? 800 : 520) + 'px;width:100%;border-collapse:collapse">' +
    '<thead><tr>' +
      '<th style="' + th + wh(0) + ';text-align:left;padding-left:12px">' + nw + '市场名称</span></th>' +
      (withSub ? '<th style="' + th + wh(1) + '">' + nw + '统计周期</span></th>' : '') +
      '<th style="' + th + wh(withSub ? 2 : 1) + '">' + nw + '销售天数</span><br><span style="' + sub + '">&gt;0 kg</span></th>' +
      '<th style="' + th + wh(withSub ? 3 : 2) + '">' + nw + '达标</span><br><span style="' + sub + '">&gt;30kg</span></th>' +
      '<th style="' + th + wh(withSub ? 4 : 3) + '">' + nw + '部分达标</span><br><span style="' + sub + '">15~30kg</span></th>' +
      '<th style="' + th + wh(withSub ? 5 : 4) + '">' + nw + '不达标</span><br><span style="' + sub + '">&lt;15kg</span></th>' +
      '<th style="' + th + wh(withSub ? 6 : 5) + '">' + nw + '缺失天数</span><br><span style="' + sub + '">0 kg</span></th>' +
      (withSub ? '<th style="' + th + wh(7) + ';text-align:right;padding-right:14px">' + nw + '补贴金额（元）</span><br><span style="' + sub + '">' + PV_SUB_FULL + '/' + PV_SUB_PART + '/0</span></th>' : '') +
      '<th style="' + th + (withSub ? wh(8) : wh(6)) + ';text-align:left">' + nw + '缺失说明</span>' + (withSub ? '<br><span style="' + sub + '">点击录入补充</span>' : '') + '</th>' +
    '</tr></thead><tbody>';
  for (var i = 0; i < PV_MARKETS.length; i++) {
    var r = pvAgg(i, days);
    /* 主页：只显示缺失日期（紧凑），已录入详情的悬浮显示完整说明；二级页：只读文本 + 「录入」入口 */
    var missCell;
    if (withSub) {
      missCell = pvMissHTML(i, r.missList);
    } else {
      var detail = r.missList.length ? pvMissText(i, r.missList) : '';
      var hasNote = !!detail && detail !== r.missShort;   /* 有录入的详情才挂悬浮提示 */
      missCell = '<span' + (hasNote ? ' data-tip="' + pvEsc(detail) + '"' : '') +
        ' style="color:' + (r.missShort === '—' ? '#8a93a3' : '#5b6472') +
        (hasNote ? ';cursor:default;border-bottom:1px dashed #cfd6e0' : '') + '">' + r.missShort + '</span>';
    }
    h += '<tr>' +
      '<td style="' + td + ';text-align:left;padding-left:12px;white-space:nowrap">' + r.name + '</td>' +
      (withSub ? '<td style="' + td + '">' + days.length + '</td>' : '') +
      '<td style="' + td + '">' + r.sale + '</td>' +
      '<td style="' + td + (r.full ? ';color:#3EB27E;font-weight:600' : '') + '">' + r.full + '</td>' +
      '<td style="' + td + (r.part ? ';color:#fa8c16;font-weight:600' : '') + '">' + r.part + '</td>' +
      '<td style="' + td + (r.none ? ';color:#fc4b52;font-weight:600' : '') + '">' + r.none + '</td>' +
      '<td style="' + td + (r.missList.length ? ';color:#fa8c16;font-weight:600' : '') + '">' + r.missList.length + '</td>' +
      (withSub ? '<td style="' + td + ';text-align:right;padding-right:14px">' + r.sub.toFixed(2) + '</td>' : '') +
      '<td style="' + td + ';text-align:left;line-height:1.5">' + missCell + '</td>' +
    '</tr>';
  }
  return h + '</tbody></table>';
}
function pvTableHTML(days) {
  return '<div style="flex:1;min-height:0;overflow:auto">' + pvAggTableHTML(days) + '</div>';
}

/* ============================================================
   日历选择器（参照 Element Plus range 形式：双月面板 + 触发器）
   —— 日期范围（主页 / 二级页按日查看）与月份多选（二级页按月查看）共用
   ============================================================ */
function pvEnsureCalStyle() {
  if (document.getElementById('pvCalStyle')) return;
  var st = document.createElement('style'); st.id = 'pvCalStyle';
  st.textContent =
    '.pv-cal{position:fixed;z-index:9999;background:#fff;border:1px solid #e4e7ed;border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.12);display:flex;font-size:12px;color:#1f2733;user-select:none}' +
    '.pv-side{width:248px;padding:8px 12px 12px}' +
    '.pv-head{height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:500;position:relative}' +
    '.pv-nav{position:absolute;top:0;height:36px;display:flex;align-items:center;gap:6px;color:#a3abb8}' +
    '.pv-nav span{cursor:pointer;padding:2px 3px}' +
    '.pv-nav span:hover{color:#005cf5}' +
    '.pv-cal table{border-collapse:collapse;table-layout:fixed;width:100%}' +
    '.pv-cal th{font-weight:400;color:#5b6472;height:28px}' +
    '.pv-cal td{height:28px;text-align:center;cursor:pointer}' +
    '.pv-cal td.out{color:#c0c4cc}' +
    '.pv-cal td.insel{background:#f0f5ff}' +
    '.pv-cal td .d{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:50%;border:1px solid transparent;box-sizing:border-box}' +
    '.pv-cal td.endp .d{background:#005cf5;color:#fff}' +
    '.pv-cal td:not(.endp):hover .d{border-color:#005cf5;color:#005cf5}' +
    '.pv-cal td.out:not(.endp):hover .d{border-color:#dcdfe6;color:#c0c4cc}' +
    '.pv-mcell{height:52px;text-align:center;cursor:pointer}' +
    '.pv-mcell .m{display:inline-flex;min-width:52px;height:26px;padding:0 8px;align-items:center;justify-content:center;border-radius:4px;box-sizing:border-box}' +
    '.pv-mcell:hover .m{background:#f0f5ff}' +
    '.pv-mcell.on .m{background:#005cf5;color:#fff}' +
    '.pv-rtg{display:inline-flex;align-items:stretch;height:32px;border:1px solid #dcdfe6;border-radius:4px;background:#fff;cursor:pointer;overflow:hidden;vertical-align:middle}' +
    '.pv-rtg:hover{border-color:#c0c4cc}' +
    '.pv-rtg-txt{display:flex;align-items:center;padding:0 10px;font-size:12px;gap:8px;white-space:nowrap}' +
    '.pv-rtg-ic{width:32px;background:#f5f7fa;border-left:1px solid #dcdfe6;display:flex;align-items:center;justify-content:center}';
  document.head.appendChild(st);
}
function pvCalIcon() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005cf5" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>';
}
/* 触发器：文本 + 日历图标按钮（点击弹双月面板；样式随触发器注入，保证边框一直存在） */
function pvRangeTriggerHTML(id) {
  pvEnsureCalStyle();
  return '<div class="pv-rtg" id="' + id + '" onclick="pvCalToggle(\'' + id + '\',event)">' +
    '<span class="pv-rtg-txt" id="' + id + 'Text"></span>' +
    '<span class="pv-rtg-ic">' + pvCalIcon() + '</span></div>';
}
function pvRangeText(id, s, e) {
  var t = document.getElementById(id + 'Text');
  if (t) t.innerHTML = (s || '开始日期') + '<span style="color:#c0c4cc">-</span>' + (e || '结束日期');
}
/* 双月日历（日期范围）：绑定主页与二级页两组起止状态 */
var PV_CAL = { id: '', tmpS: '', tmpE: '', yl: 0, ml: 1 };
/* 时间修改后（选完终点 / 面板收起）直接查询：set 里回写状态并触发对应页的查询 */
var PV_RANGES = {
  pvPRange: {
    get: function () { return [PV_START, PV_END]; },
    set: function (s, e) {
      PV_START = s; PV_END = e; pvRangeText('pvPRange', s, e);
      if (typeof pvPQuery === 'function') pvPQuery();
    }
  },
  pvMRange: {
    get: function () { return [PV_MOD_START, PV_MOD_END]; },
    set: function (s, e) {
      PV_MOD_START = s; PV_MOD_END = e; pvRangeText('pvMRange', s, e);
      if (PV_MOD_MODE === 'day' && typeof pvMQuery === 'function') pvMQuery();
    }
  }
};
function pvClosePanels() { pvCalClose(); pvMonClose(); }
function pvCalToggle(id, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (PV_CAL.id === id) { pvCalClose(); return; }
  pvClosePanels();
  var cfg = PV_RANGES[id]; if (!cfg) return;
  var anchor = document.getElementById(id); if (!anchor) return;
  pvEnsureCalStyle();
  var se = cfg.get(), base = se[0] || pvFmt(new Date());
  PV_CAL = { id: id, tmpS: se[0] || '', tmpE: se[1] || '', yl: parseInt(base.slice(0, 4), 10), ml: parseInt(base.slice(5, 7), 10) };
  var p = document.createElement('div');
  p.className = 'pv-cal'; p.id = 'pvCalPanel';
  p.onclick = function (e) { if (e.stopPropagation) e.stopPropagation(); };
  document.body.appendChild(p);
  pvCalDraw(); pvPanelPlace('pvCalPanel', anchor);
  setTimeout(function () {
    document.addEventListener('click', pvCalDocClick);
    window.addEventListener('scroll', pvCalClose, true);
  }, 0);
}
function pvPanelPlace(pid, anchor) {
  var p = document.getElementById(pid); if (!p || !anchor) return;
  var r = anchor.getBoundingClientRect();
  var left = Math.max(8, Math.min(r.left, window.innerWidth - p.offsetWidth - 8));
  var top = r.bottom + 6;
  if (top + p.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - p.offsetHeight - 6);
  p.style.left = left + 'px'; p.style.top = top + 'px';
}
function pvCalNext(y, m, k) { var t = y * 12 + (m - 1) + k; return [Math.floor(t / 12), t % 12 + 1]; }
function pvCalNav(k) { var n = pvCalNext(PV_CAL.yl, PV_CAL.ml, k); PV_CAL.yl = n[0]; PV_CAL.ml = n[1]; pvCalDraw(); }
function pvCalHead(y, m, side) {
  var nav = side === 'l'
    ? '<div class="pv-nav" style="left:4px"><span onclick="pvCalNav(-12)">«</span><span onclick="pvCalNav(-1)">‹</span></div>'
    : '<div class="pv-nav" style="right:4px"><span onclick="pvCalNav(1)">›</span><span onclick="pvCalNav(12)">»</span></div>';
  return '<div class="pv-head">' + nav + y + ' 年 ' + m + ' 月</div>';
}
function pvCalDraw() {
  var p = document.getElementById('pvCalPanel'); if (!p) return;
  var rm = pvCalNext(PV_CAL.yl, PV_CAL.ml, 1);
  p.innerHTML =
    '<div class="pv-side">' + pvCalHead(PV_CAL.yl, PV_CAL.ml, 'l') + pvCalGridHTML(PV_CAL.yl, PV_CAL.ml) + '</div>' +
    '<div style="width:1px;background:#e4e7ed;margin:8px 0"></div>' +
    '<div class="pv-side">' + pvCalHead(rm[0], rm[1], 'r') + pvCalGridHTML(rm[0], rm[1]) + '</div>';
}
function pvCalGridHTML(y, m) {
  var sN = PV_CAL.tmpS ? pvDayNum(PV_CAL.tmpS) : -1;
  var eN = PV_CAL.tmpE ? pvDayNum(PV_CAL.tmpE) : -1;
  var lo = Math.min(sN, eN), hi = Math.max(sN, eN);
  var wkan = ['日', '一', '二', '三', '四', '五', '六'];
  var h = '<table><thead><tr>';
  for (var i = 0; i < 7; i++) h += '<th>' + wkan[i] + '</th>';
  h += '</tr></thead><tbody>';
  var first = new Date(y, m - 1, 1);
  var d = pvAddDays(first, -first.getDay());
  for (var r = 0; r < 6; r++) {
    h += '<tr>';
    for (var c = 0; c < 7; c++) {
      var key = pvFmt(d), out = (d.getMonth() + 1) !== m, n = pvDayNum(key);
      var cls = out ? 'out' : '';
      if (n === sN || n === eN) cls += ' endp';
      else if (sN >= 0 && eN >= 0 && n > lo && n < hi) cls += ' insel';
      h += '<td class="' + cls + '" onclick="pvCalPick(\'' + key + '\')"><span class="d">' + d.getDate() + '</span></td>';
      d = pvAddDays(d, 1);
    }
    h += '</tr>';
  }
  return h + '</tbody></table>';
}
/* 点选：第一下选起点、第二下选终点（早于起点则重设起点），完成后写回并收起 */
function pvCalPick(key) {
  if (PV_CAL.tmpS && PV_CAL.tmpE) { PV_CAL.tmpS = key; PV_CAL.tmpE = ''; }
  else if (!PV_CAL.tmpS || key < PV_CAL.tmpS) { PV_CAL.tmpS = key; }
  else {
    PV_CAL.tmpE = key;
    var cfg = PV_RANGES[PV_CAL.id];
    if (cfg) cfg.set(PV_CAL.tmpS, PV_CAL.tmpE);
    pvCalClose(); return;
  }
  pvCalDraw();
}
function pvCalDocClick() { pvCalClose(); }
function pvCalClose() {
  var p = document.getElementById('pvCalPanel');
  if (p) p.parentNode.removeChild(p);
  document.removeEventListener('click', pvCalDocClick);
  window.removeEventListener('scroll', pvCalClose, true);
  PV_CAL.id = '';
}

/* ---------- 月份多选 · 双月面板（左右各一年、点选切换；沿用多选语义） ---------- */
var PV_MON = { y: 0 };
var PV_MON_DIRTY = false;   /* 面板内发生过选/清空 → 收起（失去焦点）时自动查询 */
function pvMonthTriggerHTML() {
  pvEnsureCalStyle();
  return '<div class="pv-rtg" id="pvMMonth" onclick="pvMonToggle(event)">' +
    '<span class="pv-rtg-txt" id="pvMMonthText" style="color:' + (PV_MOD_MONTHS.length ? '#1f2733' : '#8a93a3') + '">' + pvMonLabelHTML() + '</span>' +
    '<span class="pv-rtg-ic">' + pvCalIcon() + '</span></div>';
}
function pvMonRefreshText() {
  var t = document.getElementById('pvMMonthText');
  if (t) { t.innerHTML = pvMonLabelHTML(); t.style.color = PV_MOD_MONTHS.length ? '#1f2733' : '#8a93a3'; }
}
function pvMonToggle(ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (document.getElementById('pvMonPanel')) { pvMonClose(); return; }
  pvClosePanels();
  var anchor = document.getElementById('pvMMonth'); if (!anchor) return;
  pvEnsureCalStyle();
  var base = PV_MOD_MONTHS.length ? PV_MOD_MONTHS[0] : pvFmt(new Date());
  PV_MON.y = parseInt(base.slice(0, 4), 10);
  var p = document.createElement('div');
  p.className = 'pv-cal'; p.id = 'pvMonPanel'; p.style.flexDirection = 'column';
  p.onclick = function (e) { if (e.stopPropagation) e.stopPropagation(); };
  document.body.appendChild(p);
  pvMonDraw(); pvPanelPlace('pvMonPanel', anchor);
  setTimeout(function () {
    document.addEventListener('click', pvMonDocClick);
    window.addEventListener('scroll', pvMonClose, true);
  }, 0);
}
function pvMonDraw() {
  var p = document.getElementById('pvMonPanel'); if (!p) return;
  var yl = PV_MON.y, yr = PV_MON.y + 1;
  var head = function (y, side) {
    var nav = side === 'l'
      ? '<div class="pv-nav" style="left:4px"><span onclick="pvMonNav(-10)">«</span><span onclick="pvMonNav(-1)">‹</span></div>'
      : '<div class="pv-nav" style="right:4px"><span onclick="pvMonNav(1)">›</span><span onclick="pvMonNav(10)">»</span></div>';
    return '<div class="pv-head">' + nav + y + ' 年</div>';
  };
  p.innerHTML =
    '<div style="display:flex">' +
      '<div class="pv-side">' + head(yl, 'l') + pvMonGridHTML(yl) + '</div>' +
      '<div style="width:1px;background:#e4e7ed;margin:8px 0"></div>' +
      '<div class="pv-side">' + head(yr, 'r') + pvMonGridHTML(yr) + '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 14px;border-top:1px solid #f0f2f6">' +
      '<span style="font-size:11px;color:#8a93a3">已选 ' + PV_MOD_MONTHS.length + ' 个月</span>' +
      '<span style="font-size:12px;color:#2f7bf6;cursor:pointer" onclick="pvMonClear()">清空</span></div>';
}
function pvMonGridHTML(y) {
  var h = '<table><tbody>';
  for (var r = 0; r < 4; r++) {
    h += '<tr>';
    for (var c = 0; c < 3; c++) {
      var mm = r * 3 + c + 1, key = y + '-' + (mm < 10 ? '0' + mm : '' + mm);
      h += '<td class="pv-mcell' + (PV_MOD_MONTHS.indexOf(key) >= 0 ? ' on' : '') + '" onclick="pvMonPick(\'' + key + '\')"><span class="m">' + mm + ' 月</span></td>';
    }
    h += '</tr>';
  }
  return h + '</tbody></table>';
}
function pvMonNav(k) { PV_MON.y += k; pvMonDraw(); }
function pvMonPick(key) {
  var i = PV_MOD_MONTHS.indexOf(key);
  if (i >= 0) PV_MOD_MONTHS.splice(i, 1); else PV_MOD_MONTHS.push(key);
  PV_MON_DIRTY = true;
  pvMonRefreshText(); pvMonDraw();
}
function pvMonClear() { PV_MOD_MONTHS = []; PV_MON_DIRTY = true; pvMonRefreshText(); pvMonDraw(); }
function pvMonDocClick() { pvMonClose(); }
function pvMonClose() {
  var p = document.getElementById('pvMonPanel');
  if (p) p.parentNode.removeChild(p);
  document.removeEventListener('click', pvMonDocClick);
  window.removeEventListener('scroll', pvMonClose, true);
  if (PV_MON_DIRTY) {   /* 失去焦点：月份有改动则直接查询 */
    PV_MON_DIRTY = false;
    if (PV_MOD_MODE === 'month' && typeof pvMQuery === 'function') pvMQuery();
  }
}

function initParityVeg() {
  var box = document.getElementById('parityVegContent');
  if (!box) return;
  var today = new Date();
  PV_END = pvFmt(today);
  PV_START = pvFmt(pvAddDays(today, -13));   /* 默认近两周（14 天） */
  PV_MARKET = '';
  PV_VEG = '';

  box.innerHTML =
    '<div style="flex:1;min-height:0;overflow:auto;padding:14px 20px;display:flex;flex-direction:column;gap:10px;background:#F1F2F5">' +
      /* 顶部筛选栏（按原型：起止日期 + 菜场 + 蔬菜品种 + 查询），整页跟随 */
      '<div class="stats-panel" style="padding:12px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-shrink:0">' +
        pvRangeTriggerHTML('pvPRange') +
        '<select id="pvMarketSel" style="width:169px;height:32px;font-size:12px;color:' + (PV_MARKET === '' ? '#8a93a3' : '#1f2733') + '" onchange="this.style.color=this.value?\'#1f2733\':\'#8a93a3\'">' +
          '<option value=""' + (PV_MARKET === '' ? ' selected' : '') + '>请选择菜场</option>' +
          PV_MARKETS.map(function (n, i) { return '<option value="' + i + '"' + (PV_MARKET === String(i) ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
        '</select>' +
        '<select id="pvVegSel" style="width:169px;height:32px;font-size:12px;color:' + (PV_VEG === '' ? '#8a93a3' : '#1f2733') + '" onchange="this.style.color=this.value?\'#1f2733\':\'#8a93a3\'">' +
          '<option value=""' + (PV_VEG === '' ? ' selected' : '') + '>请选择</option>' +
          PV_VEGS.map(function (n, i) { return '<option value="' + i + '"' + (PV_VEG === String(i) ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
        '</select>' +
        '<div style="flex:1"></div>' +
        '<button class="ic-btn-pri" onclick="pvPQuery()">查询</button>' +
      '</div>' +
      '<div style="display:flex;gap:10px;flex:1;min-height:0;align-items:stretch">' +
        /* 左：2×2 图表（整体压缩 1/3 宽度，flex:2） */
        '<div style="flex:2;min-width:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px">' +
          pvPanel('price', '价格趋势') +
          pvPanel('avg', '各市场均价对比') +
          pvPanel('supply', '供应总量') +
          pvPanel('supcmp', '各市场供应对比') +
        '</div>' +
        /* 右：达标统计列表（占用压缩让出的 1/3） */
        '<div class="stats-panel" style="flex:1;min-width:520px;display:flex;flex-direction:column;min-height:0">' +
          '<div class="stats-panel-header">' +
            '<div><div class="stats-panel-title">达标统计</div><div class="stats-panel-sub">按市场逐日统计平价菜销售量</div></div>' +
            '<div style="display:flex;gap:10px;font-size:12px;flex-shrink:0"><span style="color:#2f7bf6;cursor:pointer" onclick="pvGoTable()">查看更多</span></div>' +
          '</div>' +
          '<div id="pvTableBox" style="flex:1;min-height:0;display:flex;flex-direction:column"></div>' +
        '</div>' +
      '</div>' +
      '<div style="flex-shrink:0;font-size:12px;color:#5b6472;line-height:1.75;padding:2px 4px">' +
        '四类图表与达标统计均跟随顶部筛选条件（起止日期默认近两周）；选择具体菜场时，价格趋势 / 供应总量展示该市场序列。未报送数据的日期不计入销售天数，在缺失说明列列出。' +
      '</div>' +
    '</div>';

  pvRangeText('pvPRange', PV_START, PV_END);
  pvRender();
}

/* ---------- 渲染 ---------- */
function pvChart(id, cfg) {
  if (typeof Chart === 'undefined') return;
  if (PV_CHARTS[id]) { try { PV_CHARTS[id].destroy(); } catch (e) {} }
  var el = document.getElementById(id);
  if (!el) return;
  PV_CHARTS[id] = new Chart(el, cfg);
}
function pvBarColors(kind) { /* kind: blue / green 渐变柱 */
  return function (ctx) {
    var c = ctx.chart.ctx;
    var h = ctx.chart.chartArea ? ctx.chart.chartArea.height : 200;
    var g = c.createLinearGradient(0, 0, 0, h);
    if (kind === 'blue') { g.addColorStop(0, '#6ea3f5'); g.addColorStop(1, '#2f6fe0'); }
    else { g.addColorStop(0, '#7fd8a8'); g.addColorStop(1, '#2fa46b'); }
    return g;
  };
}
var PV_GRID = { color: '#f0f2f6' };
var PV_LEGEND = { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, boxHeight: 6, padding: 12, font: { size: 11 } } };

function pvFortnightDays() {
  var t = new Date();
  return pvDays(pvFmt(pvAddDays(t, -13)), pvFmt(t));
}
function pvRender() {
  var mIdx = PV_MARKET === '' ? -1 : parseInt(PV_MARKET, 10);

  /* 四个图表 + 达标统计均跟随顶部所选时间范围（PV_START ~ PV_END）；无有效周期时兜底近两周 */
  var days = pvDays(PV_START, PV_END);
  if (!days.length) days = pvFortnightDays();
  var labels = days.map(function (d) { return d.label; });

    /* ① 价格趋势（元/斤） */
    var prices = pvPriceSeries(days, mIdx);
  var avg = pvRound2(prices.reduce(function (a, b) { return a + b; }, 0) / prices.length);
  pvChart('pvChart-price', {
    type: 'line',
    data: { labels: labels, datasets: [
      { label: '供应均价(元/斤)', data: prices, borderColor: '#2f7bf6', backgroundColor: 'rgba(47,123,246,0.08)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2.5, pointBackgroundColor: '#2f7bf6' },
      { label: '周期均价 ' + avg.toFixed(2), data: labels.map(function () { return avg; }), borderColor: '#b3bcc9', borderDash: [6, 4], borderWidth: 1.2, pointRadius: 0, fill: false }
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true } },
                y: { beginAtZero: true, suggestedMax: 4, grid: PV_GRID, ticks: { font: { size: 10 } } } },
      plugins: { legend: PV_LEGEND, tooltip: { callbacks: { label: function (c) { return c.datasetIndex === 0 ? c.parsed.y.toFixed(2) + ' 元/斤' : null; } } } } }
  });

  /* ② 各市场均价对比 */
  var avgByM = PV_MARKETS.map(function (_, i) { return pvMarketAvgPrice(i, days); });
  pvChart('pvChart-avg', {
    type: 'bar',
    data: { labels: PV_MARKETS, datasets: [{ label: '周期均价(元/斤)', data: avgByM, backgroundColor: pvBarColors('blue'), borderRadius: 5, barPercentage: 0.45, categoryPercentage: 0.6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 40, autoSkip: false } },
                y: { beginAtZero: true, suggestedMax: 5, grid: PV_GRID, ticks: { font: { size: 10 } } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.parsed.y.toFixed(2) + ' 元/斤'; } } } } }
  });

  /* ③ 供应总量（kg） */
  var sup = pvSupplySeries(days, mIdx);
  pvChart('pvChart-supply', {
    type: 'line',
    data: { labels: labels, datasets: [{ label: '供应量(kg)', data: sup, borderColor: '#2fa46b', backgroundColor: 'rgba(47,164,107,0.08)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2.5, pointBackgroundColor: '#2fa46b' }] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true } },
                y: { beginAtZero: true, grid: PV_GRID, ticks: { font: { size: 10 }, callback: function (v) { return v.toLocaleString() + 'kg'; } } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.parsed.y.toLocaleString() + ' kg'; } } } } }
  });

  /* ④ 各市场供应对比 */
  var supByM = PV_MARKETS.map(function (_, i) { return pvMarketSupply(i, days); });
  pvChart('pvChart-supcmp', {
    type: 'bar',
    data: { labels: PV_MARKETS, datasets: [{ label: '周期供应量(kg)', data: supByM, backgroundColor: pvBarColors('green'), borderRadius: 5, barPercentage: 0.45, categoryPercentage: 0.6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 40, autoSkip: false } },
                y: { beginAtZero: true, grid: PV_GRID, ticks: { font: { size: 10 }, callback: function (v) { return v.toLocaleString(); } } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.parsed.y.toLocaleString() + ' kg'; } } } } }
  });

  /* 右侧达标统计列表：与图表同一时间范围 */
  var tb = document.getElementById('pvTableBox');
  if (tb) tb.innerHTML = pvTableHTML(days);
}

/* ---------- 查看更多弹窗 ---------- */
function pvToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(pvToast._tm);
  pvToast._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
}

function pvModal(title, bodyHTML, width) {
  pvCloseModal();
  var bd = document.createElement('div');
  bd.className = 'ic-modal-backdrop'; bd.id = 'pvModalWrap';
  bd.onclick = function (e) { if (e.target === this) pvCloseModal(); };
  var w = width ? width : 'min(680px,94vw)';
  bd.innerHTML = '<div class="ic-modal" style="width:' + w + '">' +
    '<div class="ic-modal-header"><span>' + title + '</span><button class="ic-modal-close" onclick="pvCloseModal()">✕</button></div>' +
    '<div class="ic-modal-body" style="font-size:12px">' + bodyHTML + '</div></div>';
  document.body.appendChild(bd);
}
function pvCloseModal() { var b = document.getElementById('pvModalWrap'); if (b) b.parentNode.removeChild(b); }

/* ---------- 导出下载（CSV · UTF-8 BOM；二级页达标统计导出使用） ---------- */
function pvDownload(fname, rows) {
  var csv = '\uFEFF' + rows.map(function (r) {
    return r.map(function (c) {
      c = String(c);
      return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
    }).join(',');
  }).join('\r\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 300);
}

/* ---------- 达标统计 · 二级页（全宽展示） ---------- */
/* 时间范围：默认带入主页所选周期（按日查看）；可切「按月查看」单选月份 */
function initParityVegTable() {
  var box = document.getElementById('parityVegTableContent');
  if (!box) return;
  var today = new Date();
  var pStart = (typeof urlParam === 'function') ? urlParam('start') : '';
  var pEnd = (typeof urlParam === 'function') ? urlParam('end') : '';
  if (pStart && pEnd && pStart <= pEnd) { PV_MOD_START = pStart; PV_MOD_END = pEnd; }   /* 带入主页周期 */
  else { PV_MOD_END = pvFmt(today); PV_MOD_START = pvFmt(pvAddDays(today, -13)); }
  PV_MOD_MODE = 'day';
  PV_MOD_MONTHS = [PV_MOD_END.slice(0, 7)];   /* 按月模式默认选中当前周期末月 */
  PV_MON_DIRTY = false;
  box.innerHTML =
    '<div style="flex:1;min-height:0;overflow:auto;padding:14px 20px;display:flex;flex-direction:column;gap:10px;background:#F1F2F5">' +
      /* 顶部：返回 + 标题 */
      '<div style="display:flex;align-items:center;gap:12px;flex-shrink:0">' +
        '<button class="ic-btn" onclick="navigateTo(\'parity-veg\')">← 返回平价菜</button>' +
        '<div style="font-size:15px;font-weight:600;color:#1f2733">达标统计</div>' +
        '<div style="flex:1"></div>' +
        '<span style="font-size:12px;color:#8a93a3">按市场逐日统计平价菜销售量</span>' +
      '</div>' +
      /* 筛选栏：按日查看 / 按月查看 */
      '<div class="stats-panel" style="padding:12px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-shrink:0;overflow:visible">' +
        '<span id="pvMTabDay" onclick="pvMSetPeriod(\'day\')" style="font-size:12px;cursor:pointer">按日查看</span>' +
        '<span style="color:#d5dbe4">|</span>' +
        '<span id="pvMTabMonth" onclick="pvMSetPeriod(\'month\')" style="font-size:12px;cursor:pointer">按月查看</span>' +
        '<span id="pvMDateWrap">' + pvRangeTriggerHTML('pvMRange') + '</span>' +
        '<span id="pvMMonthWrap" style="display:none">' + pvMonthTriggerHTML() + '</span>' +
        '<div style="flex:1"></div>' +
        '<button class="ic-btn-pri" onclick="pvMQuery()">查询</button>' +
        '<button class="ic-btn" onclick="pvMReset()">重置</button>' +
        '<button class="ic-btn" onclick="pvMExport()">导出</button>' +
      '</div>' +
      /* 全宽表格 */
      '<div class="stats-panel" style="flex:1;min-height:0;display:flex;flex-direction:column">' +
        '<div id="pvModalTable" style="flex:1;min-height:0;overflow:auto;padding:4px 0"></div>' +
      '</div>' +
      /* 口径说明 */
      '<div style="flex-shrink:0;font-size:12px;color:#5b6472;line-height:1.7;padding:2px 4px">缺失日期由系统生成、不可删除，点击缺失说明列的「录入」可为每个缺失日期填写原因（可留空）；未报送数据的日期不计入销售天数；补贴金额 = 达标天数×' + PV_SUB_FULL + ' 元 + 部分达标天数×' + PV_SUB_PART + ' 元。</div>' +
    '</div>';
  pvRangeText('pvMRange', PV_MOD_START, PV_MOD_END);
  pvMTabs();
  pvMQuery();
}
function pvMTabs() {
  var d = document.getElementById('pvMTabDay'), m = document.getElementById('pvMTabMonth');
  var on = ';color:#005cf5;font-weight:600', off = ';color:#5b6472;font-weight:400';
  if (d) d.setAttribute('style', 'font-size:12px;cursor:pointer' + (PV_MOD_MODE === 'day' ? on : off));
  if (m) m.setAttribute('style', 'font-size:12px;cursor:pointer' + (PV_MOD_MODE === 'month' ? on : off));
  var fw = document.getElementById('pvMDateWrap'), fm = document.getElementById('pvMMonthWrap');
  if (fw) fw.style.display = (PV_MOD_MODE === 'month') ? 'none' : '';
  if (fm) fm.style.display = (PV_MOD_MODE === 'month') ? '' : 'none';
  if (PV_MOD_MODE === 'month') pvMonRefreshText();
}
function pvMSetPeriod(mode) {
  PV_MOD_MODE = (mode === 'month') ? 'month' : 'day';
  PV_MON_DIRTY = false;   /* 切模式不触发自动查询 */
  pvClosePanels();
  pvMTabs();
}
/* ---------- 月份多选（双月面板：标签文案 + 多选月份 → 天集合） ---------- */
/* 触发器文案：统一为月份范围（不区分单月/多月）——空=请选择月份；否则 最早月 - 最晚月（单月即 2026-09 - 2026-09） */
function pvMonthsLabel() {
  if (!PV_MOD_MONTHS.length) return '请选择月份';
  var s = PV_MOD_MONTHS.slice().sort();
  return s[0] + ' - ' + s[s.length - 1];
}
/* 触发器 HTML 文案：范围分隔「-」与日期触发器同款灰色 */
function pvMonLabelHTML() {
  return pvMonthsLabel().replace(' - ', '<span style="color:#c0c4cc"> - </span>');
}
/* 多选月份 → 天集合（并集、去重、升序；跨月不连续时也按实际所选月份取数） */
function pvMonthsDays(months) {
  var map = {}, i, j, ds;
  var sorted = months.slice().sort();
  for (i = 0; i < sorted.length; i++) {
    var p = sorted[i].split('-'), y = parseInt(p[0], 10), m = parseInt(p[1], 10);
    var last = new Date(y, m, 0).getDate();
    var end = sorted[i] + '-' + (last < 10 ? '0' + last : '' + last);
    ds = pvDays(sorted[i] + '-01', end);
    for (j = 0; j < ds.length; j++) map[ds[j].key] = ds[j];
  }
  return Object.keys(map).sort().map(function (k) { return map[k]; });
}
function pvMQuery() {
  if (PV_MOD_MODE === 'month') {
    if (!PV_MOD_MONTHS.length) { pvToast('请选择月份'); return; }
    PV_MOD_DAYS = pvMonthsDays(PV_MOD_MONTHS);
    if (!PV_MOD_DAYS.length) { pvToast('请选择有效的月份'); return; }
    PV_MOD_START = PV_MOD_DAYS[0].key;
    PV_MOD_END = PV_MOD_DAYS[PV_MOD_DAYS.length - 1].key;
  } else {
    if (!PV_MOD_START || !PV_MOD_END) { pvToast('请选择开始与结束日期'); return; }
    if (PV_MOD_START > PV_MOD_END) { pvToast('开始日期不能晚于结束日期'); return; }
    PV_MOD_DAYS = pvDays(PV_MOD_START, PV_MOD_END);
  }
  var days = PV_MOD_DAYS;
  var box = document.getElementById('pvModalTable');
  if (box) box.innerHTML = days.length ? pvAggTableHTML(days, true) : '<div style="padding:20px;text-align:center;color:#8a93a3">该时间范围内无数据</div>';
}
function pvMReset() {
  PV_MOD_MODE = 'day';
  PV_MON_DIRTY = false;
  pvClosePanels();
  var t = new Date(); PV_MOD_END = pvFmt(t); PV_MOD_START = pvFmt(pvAddDays(t, -13));
  PV_MOD_MONTHS = [PV_MOD_END.slice(0, 7)];
  pvRangeText('pvMRange', PV_MOD_START, PV_MOD_END);
  pvMonRefreshText();
  pvMTabs();
  pvMQuery();
}
function pvMExport() {
  var days = PV_MOD_DAYS.length ? PV_MOD_DAYS : pvDays(PV_MOD_START, PV_MOD_END);
  if (!days.length) { pvToast('请先选择有效的时间范围'); return; }
  var range = days[0].key.replace(/-/g, '') + '-' + days[days.length - 1].key.replace(/-/g, '');
  var rows = [['市场名称', '统计周期', '销售天数', '达标(>30kg)', '部分达标(15~30kg)', '不达标(<15kg)', '缺失天数', '补贴金额（元）', '缺失说明']];
  for (var i = 0; i < PV_MARKETS.length; i++) {
    var r = pvAgg(i, days);
    rows.push([r.name, days.length, r.sale, r.full, r.part, r.none, r.missList.length, r.sub.toFixed(2),
      r.missList.length ? pvMissText(i, r.missList) : '—']);
  }
  pvDownload('平价菜_达标统计_' + range + '.csv', rows);
}

/* ---------- 平价菜主页 · 顶部筛选（按原型：起止日期 + 菜场 + 品种 + 查询，整页跟随） ---------- */
function pvPQuery() {
  if (!PV_START || !PV_END) { pvToast('请选择开始与结束日期'); return; }
  if (PV_START > PV_END) { pvToast('开始日期不能晚于结束日期'); return; }
  var m = document.getElementById('pvMarketSel'); PV_MARKET = m ? m.value : '';
  var v = document.getElementById('pvVegSel'); PV_VEG = v ? v.value : '';
  pvRender();
}
/* 达标统计「查看更多」：携带主页当前所选周期跳二级页 */
function pvGoTable() { navigateTo('parity-veg-table?start=' + PV_START + '&end=' + PV_END); }
