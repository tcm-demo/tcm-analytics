/* ===== 演示数据导出 / 导入 =====
 * 用途：把当前浏览器 localStorage 里的演示数据打包成 JSON 文件；别人在同样的演示地址
 *      导入后，看到的数据与你完全一致。
 * 为什么要整包迁移：localStorage 里除了业务数据，还有一堆「种子已注入」标记
 *      （tcm_inv_entry_demo_v8 / tcm_supply_price_seed_v2 / tcm_goods_std_seed_v2 ...）。
 *      只导业务数据的话，对方首次加载会重跑种子把数据覆盖回演示初始态。
 * 入口：侧栏底部「导出数据 / 导入数据」。本文件由 sidebar.js 自动注入，无需每个壳页引用。
 * 口径：localStorage 是「域名 : 端口」级共享，任意页面导出的都是全量数据。
 */
(function () {
  'use strict';
  if (window.__DIO_READY__) return;
  window.__DIO_READY__ = true;

  var APP_TAG = 'caidian-demo';
  var SCHEMA = 1;
  var BACKUP_KEY = 'tcm_data_io_backup_v1';   // 导入前自动备份（本身不进导出、不进统计）
  var FLASH_KEY = 'dio_flash';                // 刷新后回显导入结果
  // 纯界面偏好：导出时可选择不带，让对方保留自己的界面习惯
  var UI_KEYS = ['tcm_sidebar_collapsed', 'tcm_nav_ver_filter', 'tcm_firstview_scenario_v1', 'lb_show_builtin'];

  var _view = 'export';       // export | import
  var _impMode = 'replace';   // replace | merge
  var _pending = null;        // { data:{k:v}, count, meta }
  var _pendingName = '';
  var _includeUi = false;

  /* ================= 基础工具 ================= */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function stamp(d) {
    return '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes());
  }
  function fmtSize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function byteLen(s) {
    try { return new Blob([s]).size; } catch (e) { return String(s).length; }
  }
  function readAll() {
    var out = {}, i, k, v;
    try {
      for (i = 0; i < localStorage.length; i++) {
        k = localStorage.key(i);
        if (!k || k === BACKUP_KEY) continue;
        v = localStorage.getItem(k);
        if (v !== null) out[k] = v;
      }
    } catch (e) {}
    return out;
  }
  function isUiKey(k) { return UI_KEYS.indexOf(k) >= 0; }

  /* ================= 样式（幂等注入） ================= */
  function injectCss() {
    if (document.getElementById('dioCss')) return;
    var css = document.createElement('style');
    css.id = 'dioCss';
    css.textContent = [
      '#dioModal{width:min(620px,94vw)}',
      '#dioModal .ic-modal-body{padding:16px 20px 4px}',
      '.dio-lead{font-size:12px;line-height:1.8;color:#5b6472;margin-bottom:14px}',
      '.dio-stats{display:flex;gap:8px;margin-bottom:14px}',
      '.dio-stat{flex:1;background:#f6f8fc;border:1px solid #e8eef9;border-radius:4px;padding:10px 12px;text-align:center}',
      '.dio-stat b{display:block;font-size:17px;font-weight:600;color:#1f2733;line-height:1.2}',
      '.dio-stat span{display:block;font-size:11px;color:#8a93a3;margin-top:3px}',
      '.dio-check{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:#3a4252;cursor:pointer;margin-bottom:14px;line-height:1.7}',
      '.dio-check input{margin:2px 0 0;width:13px;height:13px;accent-color:#005cf5;cursor:pointer;flex-shrink:0}',
      '.dio-check-sub{color:#8a93a3;font-weight:400}',
      '.dio-sub{font-size:12px;font-weight:500;color:#1f2733;margin:0 0 8px}',
      '.dio-list{border:1px solid #eef0f5;border-radius:4px;max-height:210px;overflow:auto}',
      '.dio-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 10px;border-bottom:1px solid #f4f6fa;font-size:12px}',
      '.dio-row:last-child{border-bottom:none}',
      '.dio-k{color:#3a4252;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dio-v{color:#8a93a3;font-style:normal;flex-shrink:0;font-size:11px}',
      '.dio-dim{opacity:.45}',
      '.dio-tag{display:inline-block;margin-left:6px;padding:0 5px;font-size:10px;font-style:normal;color:#8a93a3;background:#f1f2f5;border-radius:2px;line-height:15px;vertical-align:1px}',
      '.dio-drop{border:1px dashed #d5dbe6;border-radius:6px;background:#fafbfd;padding:26px 16px;text-align:center;cursor:pointer;transition:border-color .18s,background .18s}',
      '.dio-drop:hover,.dio-drop.over{border-color:#005cf5;background:#f4f7fe}',
      '.dio-drop-ic{font-size:22px;line-height:1;color:#8a93a3;margin-bottom:8px}',
      '.dio-drop-main{font-size:13px;color:#1f2733;margin-bottom:4px}',
      '.dio-drop-sub{font-size:11px;color:#8a93a3}',
      '.dio-file{display:flex;align-items:center;gap:10px;border:1px solid #e8eef9;background:#f6f8fc;border-radius:4px;padding:10px 12px;margin-bottom:14px}',
      '.dio-file-ic{font-size:18px;line-height:1}',
      '.dio-file-main{flex:1;min-width:0}',
      '.dio-file-name{font-size:12px;color:#1f2733;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dio-file-meta{font-size:11px;color:#8a93a3;margin-top:3px;line-height:1.6}',
      '.dio-file-x{border:none;background:none;color:#8a93a3;cursor:pointer;font-size:13px;padding:2px 4px;border-radius:3px}',
      '.dio-file-x:hover{background:#e9edf6;color:#3a4252}',
      '.dio-modes{display:flex;gap:8px;margin-bottom:12px}',
      '.dio-mode{flex:1;border:1px solid #e3e7f0;border-radius:4px;padding:9px 11px;cursor:pointer;transition:border-color .15s,background .15s}',
      '.dio-mode:hover{border-color:#b9cdf4}',
      '.dio-mode.on{border-color:#005cf5;background:#f4f7fe}',
      '.dio-mode-t{font-size:12px;color:#1f2733;font-weight:500;display:flex;align-items:center;gap:6px}',
      '.dio-mode-t i{width:12px;height:12px;border:1px solid #c6cede;border-radius:50%;display:inline-block;flex-shrink:0}',
      '.dio-mode.on .dio-mode-t i{border:4px solid #005cf5}',
      '.dio-mode-d{font-size:11px;color:#8a93a3;line-height:1.65;margin-top:5px}',
      '.dio-warn{font-size:11px;color:#8a6d3b;background:#fffaf0;border:1px solid #ffefd0;border-radius:4px;padding:8px 11px;line-height:1.7;margin-bottom:6px}',
      '.dio-err{font-size:12px;color:#fc4b52;background:#fef3f3;border:1px solid #fbd9da;border-radius:4px;padding:8px 11px;line-height:1.7;margin-bottom:10px}',
      '.dio-link{background:none;border:none;padding:0;font-size:12px;color:#8a93a3;cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
      '.dio-link:hover{color:#005cf5}',
      '.dio-foot-left{margin-right:auto;display:flex;align-items:center}'
    ].join('\n');
    document.head.appendChild(css);
  }

  /* ================= 弹窗骨架 ================= */
  function ensureModal() {
    injectCss();
    if (document.getElementById('dioModal')) return;
    var bd = document.createElement('div');
    bd.className = 'ic-modal-backdrop';
    bd.id = 'dioBackdrop';
    bd.onclick = function (e) { if (e.target === bd) dataIoClose(); };
    var md = document.createElement('div');
    md.className = 'ic-modal';
    md.id = 'dioModal';
    md.innerHTML = '<div class="ic-modal-header"><span id="dioTitle">导出数据</span>'
      + '<button class="ic-modal-close" onclick="dataIoClose()">✕</button></div>'
      + '<div class="ic-modal-body" id="dioBody"></div>'
      + '<div class="ic-modal-footer" id="dioFoot"></div>';
    document.body.appendChild(bd);
    document.body.appendChild(md);
  }

  function bodyEl() { return document.getElementById('dioBody'); }

  function render() {
    var t = document.getElementById('dioTitle');
    var b = bodyEl();
    var f = document.getElementById('dioFoot');
    if (!b || !f) return;
    if (_view === 'export') {
      if (t) t.textContent = '导出数据';
      b.innerHTML = vExport();
      f.innerHTML = '<button class="btn-secondary" onclick="dataIoClose()">取消</button>'
        + '<button class="btn-primary" onclick="dataIoExport()">导出文件</button>';
    } else {
      if (t) t.textContent = '导入数据';
      b.innerHTML = vImport();
      var hasBak = !!localStorage.getItem(BACKUP_KEY);
      f.innerHTML = '<div class="dio-foot-left">'
        + (hasBak ? '<button class="dio-link" onclick="dataIoRestore()">撤销上一次导入</button>' : '')
        + '</div>'
        + '<button class="btn-secondary" onclick="dataIoClose()">取消</button>'
        + '<button class="btn-primary" onclick="dataIoDoImport()">导入并刷新</button>';
    }
    bindDrop();
  }

  function rerender() {
    var b = bodyEl();
    var top = b ? b.scrollTop : 0;
    render();
    var b2 = bodyEl();
    if (b2) b2.scrollTop = top;
  }

  /* ================= 视图：导出 ================= */
  function buildPayload(all, includeUi) {
    var data = {}, k;
    for (k in all) {
      if (!Object.prototype.hasOwnProperty.call(all, k)) continue;
      if (!includeUi && isUiKey(k)) continue;
      data[k] = all[k];
    }
    var now = new Date();
    return {
      app: APP_TAG,
      schema: SCHEMA,
      exportedAt: now.toISOString(),
      exportedAtText: fmtTime(now),
      origin: location.origin + location.pathname.replace(/\/pages\/[^\/]*$/, '/'),
      count: Object.keys(data).length,
      data: data
    };
  }

  function vExport() {
    var all = readAll();
    var keys = Object.keys(all);
    var uiCount = keys.filter(isUiKey).length;
    var payload = buildPayload(all, _includeUi);
    var size = byteLen(JSON.stringify(payload, null, 1));
    var count = payload.count;

    var rows = keys.map(function (k) { return { k: k, n: byteLen(all[k]) }; })
      .sort(function (a, b) { return b.n - a.n; })
      .map(function (r) {
        var ui = isUiKey(r.k);
        var dim = ui && !_includeUi;
        return '<div class="dio-row' + (dim ? ' dio-dim' : '') + '">'
          + '<span class="dio-k" title="' + esc(r.k) + '">' + esc(r.k)
          + (ui ? '<i class="dio-tag">界面偏好</i>' : '') + '</span>'
          + '<em class="dio-v">' + fmtSize(r.n) + '</em></div>';
      }).join('');

    return ''
      + '<div class="dio-lead">把当前浏览器里的演示数据打包成一个 JSON 文件。对方在同一个演示地址打开后导入这个文件，看到的数据就和你完全一样——包括商品、库存、入库单、门店配置等。</div>'
      + '<div class="dio-stats">'
      + '<div class="dio-stat"><b>' + count + '</b><span>导出的数据项</span></div>'
      + '<div class="dio-stat"><b>' + fmtSize(size) + '</b><span>文件大小</span></div>'
      + '<div class="dio-stat"><b>' + keys.length + '</b><span>本地数据总项</span></div>'
      + '</div>'
      + '<label class="dio-check"><input type="checkbox" id="dioIncUi"' + (_includeUi ? ' checked' : '')
      + ' onchange="dataIoToggleUi(this.checked)"> 包含界面偏好'
      + '<span class="dio-check-sub">（侧栏收起状态、顶部版本筛选等 ' + uiCount + ' 项；不勾选则对方保留自己的界面习惯）</span></label>'
      + '<div class="dio-sub">包含的数据（按体积排序）</div>'
      + '<div class="dio-list">' + (rows || '<div class="dio-row"><span class="dio-k">暂无本地数据</span></div>') + '</div>';
  }

  /* ================= 视图：导入 ================= */
  function vImport() {
    var drop = '<div class="dio-drop" id="dioDrop">'
      + '<div class="dio-drop-ic">⬆</div>'
      + '<div class="dio-drop-main">点击选择文件，或把 .json 拖到这里</div>'
      + '<div class="dio-drop-sub">支持本系统「导出数据」生成的 JSON 文件</div>'
      + '</div>'
      + '<input type="file" id="dioFile" accept=".json,application/json" style="display:none">';

    if (!_pending) {
      return '<div class="dio-lead">选择别人导出的 JSON 文件，导入到当前浏览器。导入会替换掉你现在的演示数据，导入前系统会自动备份一份，可随时撤销。</div>'
        + drop
        + (_pendingName ? '<div class="dio-err" style="margin-top:12px">文件读取失败：' + esc(_pendingName) + '</div>' : '');
    }

    var m = _pending.meta || {};
    var when = m.exportedAt ? String(m.exportedAt).replace('T', ' ').slice(0, 16) : '';
    var metaLine = _pending.count + ' 项数据'
      + (when ? ' · 导出于 ' + esc(when) : '')
      + (m.origin ? ' · 来源 ' + esc(m.origin) : '');
    var fileCard = '<div class="dio-file">'
      + '<div class="dio-file-ic">📄</div>'
      + '<div class="dio-file-main"><div class="dio-file-name">' + esc(_pendingName) + '</div>'
      + '<div class="dio-file-meta">' + metaLine + '</div></div>'
      + '<button class="dio-file-x" onclick="dataIoClearFile()" title="重新选择">✕</button>'
      + '</div>';

    var modes = '<div class="dio-sub">导入方式</div><div class="dio-modes">'
      + '<div class="dio-mode' + (_impMode === 'replace' ? ' on' : '') + '" onclick="dataIoSetMode(\'replace\')">'
      + '<div class="dio-mode-t"><i></i>覆盖当前数据</div>'
      + '<div class="dio-mode-d">先清空本机现有演示数据，再写入文件内容。结果与导出方完全一致，推荐。</div></div>'
      + '<div class="dio-mode' + (_impMode === 'merge' ? ' on' : '') + '" onclick="dataIoSetMode(\'merge\')">'
      + '<div class="dio-mode-t"><i></i>合并到当前数据</div>'
      + '<div class="dio-mode-d">保留本机独有的数据，同名的键用文件里的值覆盖。</div></div>'
      + '</div>';

    return '<div class="dio-lead">导入别人导出的数据文件。</div>'
      + fileCard + modes
      + '<div class="dio-warn">导入前会自动备份当前数据到本地（只保留最近一次），导入后可用弹窗左下角「撤销上一次导入」恢复。</div>'
      + '<div style="display:none">' + drop + '</div>';
  }

  function bindDrop() {
    var d = document.getElementById('dioDrop');
    var inp = document.getElementById('dioFile');
    if (!d || !inp) return;
    d.onclick = function () { inp.click(); };
    inp.onchange = function () { if (this.files && this.files[0]) handleFile(this.files[0]); };
    d.addEventListener('dragover', function (e) { e.preventDefault(); d.classList.add('over'); });
    d.addEventListener('dragleave', function () { d.classList.remove('over'); });
    d.addEventListener('drop', function (e) {
      e.preventDefault(); d.classList.remove('over');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
  }

  /* ================= 文件解析 ================= */
  function normalize(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('文件内容不是有效的 JSON 对象');
    var data = obj.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      // 容错：也接受「裸键值对象」
      if (obj.app === APP_TAG) throw new Error('这个文件里没有任何数据（data 为空）');
      data = obj;
    }
    var out = {}, n = 0;
    Object.keys(data).forEach(function (k) {
      var v = data[k];
      if (v === null || v === undefined) return;
      out[k] = (typeof v === 'string') ? v : JSON.stringify(v);
      n++;
    });
    if (!n) throw new Error('文件里没有任何数据');
    return {
      data: out,
      count: n,
      meta: { exportedAt: obj.exportedAtText || obj.exportedAt || '', origin: obj.origin || '' }
    };
  }

  function handleFile(file) {
    if (file.size > 30 * 1024 * 1024) {
      _pending = null; _pendingName = '文件超过 30 MB，浏览器本地存储装不下'; rerender(); return;
    }
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var obj = JSON.parse(String(fr.result || ''));
        _pending = normalize(obj);
        _pendingName = file.name;
      } catch (e) {
        _pending = null;
        _pendingName = (e && e.message) ? e.message : '不是有效的 JSON';
      }
      rerender();
    };
    fr.onerror = function () { _pending = null; _pendingName = '文件读取失败'; rerender(); };
    fr.readAsText(file, 'utf-8');
  }

  function clearAllExceptBackup() {
    var del = [], i, k;
    for (i = 0; i < localStorage.length; i++) {
      k = localStorage.key(i);
      if (k && k !== BACKUP_KEY) del.push(k);
    }
    del.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
  }

  /* ================= 对外动作 ================= */
  window.dataIoOpen = function (mode) {
    _view = (mode === 'import') ? 'import' : 'export';
    _pending = null; _pendingName = '';
    _impMode = 'replace';
    ensureModal();
    render();
  };

  window.dataIoClose = function () {
    var b = document.getElementById('dioBackdrop'); if (b) b.remove();
    var m = document.getElementById('dioModal'); if (m) m.remove();
  };

  window.dataIoToggleUi = function (on) {
    _includeUi = !!on;
    rerender();
  };

  window.dataIoSetMode = function (m) {
    _impMode = (m === 'merge') ? 'merge' : 'replace';
    rerender();
  };

  window.dataIoClearFile = function () {
    _pending = null; _pendingName = '';
    rerender();
  };

  window.dataIoExport = function () {
    var all = readAll();
    var payload = buildPayload(all, _includeUi);
    if (!payload.count) { toast('没有可导出的数据'); return; }
    var json = JSON.stringify(payload, null, 1);
    var name = '菜猫智店demo-数据-' + stamp(new Date()) + '.json';
    try {
      var blob = new Blob([json], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    } catch (e) {
      toast('导出失败：' + (e && e.message ? e.message : '浏览器不支持'));
      return;
    }
    dataIoClose();
    toast('已导出 ' + payload.count + ' 项数据');
  };

  window.dataIoDoImport = function () {
    if (!_pending) { toast('请先选择一个数据文件'); return; }
    if (_impMode === 'replace') {
      var ok = window.confirm('「覆盖当前数据」会清空本机现有的全部演示数据，然后写入文件内容。\n当前数据会自动备份，可撤销一次。确定继续？');
      if (!ok) return;
    }
    // 1) 备份当前数据（单槽，只留最近一次）
    var bakOk = true;
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: Date.now(), atText: fmtTime(new Date()), data: readAll() }));
    } catch (e) { bakOk = false; }
    // 2) 覆盖模式先清空
    if (_impMode === 'replace') clearAllExceptBackup();
    // 3) 写入
    var n = 0, fail = 0;
    Object.keys(_pending.data).forEach(function (k) {
      try { localStorage.setItem(k, _pending.data[k]); n++; } catch (e) { fail++; }
    });
    if (!n) {
      toast('导入失败：浏览器本地存储空间不足');
      return;
    }
    var msg = '已导入 ' + n + ' 项数据' + (fail ? '（' + fail + ' 项因空间不足未写入）' : '') + (bakOk ? '' : '；备份失败');
    try { sessionStorage.setItem(FLASH_KEY, msg); } catch (e) {}
    location.reload();
  };

  window.dataIoRestore = function () {
    var raw = null;
    try { raw = localStorage.getItem(BACKUP_KEY); } catch (e) {}
    if (!raw) { toast('没有可恢复的备份'); return; }
    var bak;
    try { bak = JSON.parse(raw); } catch (e) { toast('备份已损坏'); return; }
    if (!bak || !bak.data) { toast('备份已损坏'); return; }
    var when = bak.atText || '';
    if (!window.confirm('恢复「' + when + '」导入前的数据？\n当前数据会被替换。')) return;
    clearAllExceptBackup();
    var n = 0;
    Object.keys(bak.data).forEach(function (k) {
      try { localStorage.setItem(k, bak.data[k]); n++; } catch (e) {}
    });
    try { sessionStorage.setItem(FLASH_KEY, '已恢复导入前的数据（' + n + ' 项）'); } catch (e) {}
    location.reload();
  };

  /* 弹窗渲染 + 刷新后回显导入结果 */
  function boot() {
    if (document.getElementById('modalRoot') === null && !document.body) return;
    var f = null;
    try { f = sessionStorage.getItem(FLASH_KEY); if (f) sessionStorage.removeItem(FLASH_KEY); } catch (e) {}
    if (f) setTimeout(function () { toast(f); }, 400);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(boot, 0);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  }
})();
