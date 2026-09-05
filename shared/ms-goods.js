// ========== 商品资料域（标准商品/供应商/单位/品牌库） ==========
// 页面：goods-standard / supplier-list / goods-unit / brand-library
// 依赖 layout.js：showToast / initTicker
var MS_GOODS_LOADED = true;
function msGdEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function msGdToast(m) { try { showToast(m); } catch (e) { alert(m); } }
function msGdBadge(text, kind) {
  var map = {
    ok: 'background:#f0f9eb;color:#67c23a;border:1px solid #e1f3d8',
    warn: 'background:#fdf6ec;color:#e6a23c;border:1px solid #faecd8',
    err: 'background:#fef0f0;color:#f56c6c;border:1px solid #fde2e2',
    info: 'background:#f4f4f5;color:#909399;border:1px solid #e9e9eb',
    blue: 'background:#ecf5ff;color:#409eff;border:1px solid #d9ecff'
  };
  return '<span style="display:inline-block;padding:1px 10px;border-radius:10px;font-size:12px;line-height:18px;white-space:nowrap;' + (map[kind] || map.info) + '">' + text + '</span>';
}
function msGdDlg(opt) {
  var b = document.getElementById('msGdBackdrop'), m = document.getElementById('msGdModal');
  if (b) b.remove(); if (m) m.remove();
  var bd = document.createElement('div'); bd.className = 'ic-modal-backdrop'; bd.id = 'msGdBackdrop';
  bd.onclick = function (e) { if (e.target === this) { bd.remove(); md.remove(); } };
  var md = document.createElement('div'); md.className = 'ic-modal'; md.id = 'msGdModal';
  md.style.cssText = 'width:' + (opt.width || 'min(720px,94vw)') + ';';
  var foot = '';
  if (opt.footer !== false) {
    foot = '<div class="ic-modal-footer">' + (opt.footLeft || '');
    if (opt.cancelText !== null) foot += '<button class="btn-secondary" onclick="var b=document.getElementById(\'msGdBackdrop\'),m=document.getElementById(\'msGdModal\');if(b)b.remove();if(m)m.remove();">' + (opt.cancelText || '取消') + '</button>';
    if (opt.onOk) foot += '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>';
    foot += '</div>';
  }
  md.innerHTML = '<div class="ic-modal-header"><span>' + opt.title + '</span><button class="ic-modal-close" onclick="var b=document.getElementById(\'msGdBackdrop\'),m=document.getElementById(\'msGdModal\');if(b)b.remove();if(m)m.remove();">✕</button></div>'
    + '<div class="ic-modal-body" id="msGdBody" style="' + (opt.bodyStyle || 'max-height:70vh;overflow:auto;') + '">' + opt.body + '</div>' + foot;
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msGdBody(html) { var b = document.getElementById('msGdBody'); if (b) b.innerHTML = html; }
function msGdClose() { var b = document.getElementById('msGdBackdrop'), m = document.getElementById('msGdModal'); if (b) b.remove(); if (m) m.remove(); }
function msGdPopClose() { var b = document.getElementById('msGdPopBackdrop'), m = document.getElementById('msGdPop'); if (b) b.remove(); if (m) m.remove(); }
function msGdPop(opt) {
  var b = document.getElementById('msGdPopBackdrop'), m = document.getElementById('msGdPop');
  if (b) b.remove(); if (m) m.remove();
  var bd = document.createElement('div'); bd.id = 'msGdPopBackdrop';
  bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9400;';
  bd.onclick = function (e) { if (e.target === this) { bd.remove(); md.remove(); } };
  var md = document.createElement('div'); md.id = 'msGdPop';
  md.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:' + (opt.width || 'min(640px,90vw)') + ';max-height:78vh;display:flex;flex-direction:column;background:#fff;border-radius:6px;box-shadow:0 12px 48px rgba(0,0,0,.22);z-index:9401;';
  md.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #eef1f6;font-size:14px;font-weight:600;color:#0b1019;flex-shrink:0"><span>' + opt.title + '</span><button onclick="var b=document.getElementById(\'msGdPopBackdrop\'),m=document.getElementById(\'msGdPop\');if(b)b.remove();if(m)m.remove();" style="border:none;background:none;font-size:16px;color:#909399;cursor:pointer">✕</button></div>'
    + '<div style="flex:1;overflow:auto;min-height:0" id="msGdPopBody">' + opt.body + '</div>'
    + (opt.footer === false ? '' : '<div style="display:flex;justify-content:flex-end;gap:10px;padding:12px 18px;border-top:1px solid #eef1f6;flex-shrink:0"><button class="btn-secondary" onclick="var b=document.getElementById(\'msGdPopBackdrop\'),m=document.getElementById(\'msGdPop\');if(b)b.remove();if(m)m.remove();">' + (opt.cancelText || '取消') + '</button>' + (opt.onOk ? '<button class="btn-primary" onclick="' + opt.onOk + '">' + (opt.okText || '确定') + '</button>' : '') + '</div>');
  document.body.appendChild(bd); document.body.appendChild(md);
}
function msGdPager(total, page, size, pagerId, cbName) {
  var bar = document.getElementById(pagerId); if (!bar) return;
  var pages = Math.ceil(total / size) || 1;
  if (page > pages) page = pages; if (page < 1) page = 1;
  var html = '<span class="page-info">共 ' + total + ' 条</span><div class="page-btns">';
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
  var s = Math.max(1, page - 2), e = Math.min(pages, page + 2);
  for (var p = s; p <= e; p++) html += '<button class="page-btn' + (p === page ? ' active' : '') + '" style="' + (p === page ? 'background:#005CF5;color:#fff;border-color:#005CF5' : '') + '" onclick="' + cbName + '(' + p + ')">' + p + '</button>';
  html += '<button class="page-btn" onclick="' + cbName + '(' + (page + 1) + ')" ' + (page >= pages ? 'disabled' : '') + '>›</button></div>';
  bar.innerHTML = html;
}
function msGdNum(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function msGdDateStr(d) { var n = new Date(d); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }

/* ================================================================
 * 共享数据
 * ================================================================ */
var GD_UNITS = [];
var GD_UNIT_KEY = 'tcm_goods_units_v1';
function gdUnitLoad() {
  try { var r = localStorage.getItem(GD_UNIT_KEY); if (r) { GD_UNITS = JSON.parse(r); return; } } catch (e) {}
  GD_UNITS = [
    { unitId: 'U001', unitName: '个', otherName: '个/只' },
    { unitId: 'U002', unitName: '斤', otherName: '市斤' },
    { unitId: 'U003', unitName: '公斤', otherName: 'kg' },
    { unitId: 'U004', unitName: '克', otherName: 'g' },
    { unitId: 'U005', unitName: '瓶', otherName: '瓶/罐' },
    { unitId: 'U006', unitName: '包', otherName: '包/袋' },
    { unitId: 'U007', unitName: '箱', otherName: '件' },
    { unitId: 'U008', unitName: '盒', otherName: '盒/套' },
    { unitId: 'U009', unitName: '提', otherName: '捆' },
    { unitId: 'U010', unitName: '桶', otherName: '桶/壶' },
    { unitId: 'U011', unitName: '袋', otherName: '袋/包' },
    { unitId: 'U012', unitName: '千克', otherName: 'KG' },
    { unitId: 'U013', unitName: '升', otherName: 'L' },
    { unitId: 'U014', unitName: '毫升', otherName: 'ml' },
    { unitId: 'U015', unitName: '支', otherName: '支/根' },
    { unitId: 'U016', unitName: '卷', otherName: '卷/筒' }
  ];
  try { localStorage.setItem(GD_UNIT_KEY, JSON.stringify(GD_UNITS)); } catch (e) {}
}
function gdUnitName(id) { var u = GD_UNITS.filter(function (x) { return x.unitId === id || x.unitName === id; })[0]; return u ? u.unitName : (id || ''); }
function gdUnitOptions(sel) {
  return GD_UNITS.map(function (u) { return '<option value="' + u.unitName + '"' + (sel === u.unitName ? ' selected' : '') + '>' + u.unitName + '</option>'; }).join('');
}

var GD_CATS = [
  { l1: '生鲜', l2: '蔬菜', l3: '叶菜', l4: '青菜' },
  { l1: '生鲜', l2: '蔬菜', l3: '根茎', l4: '土豆' },
  { l1: '生鲜', l2: '水果', l3: '热带水果', l4: '榴莲' },
  { l1: '生鲜', l2: '水果', l3: '柑橘', l4: '橙子' },
  { l1: '生鲜', l2: '肉禽蛋', l3: '猪肉', l4: '五花肉' },
  { l1: '生鲜', l2: '肉禽蛋', l3: '禽类', l4: '三黄鸡' },
  { l1: '生鲜', l2: '水产', l3: '淡水鱼', l4: '鲈鱼' },
  { l1: '食品', l2: '粮油调味', l3: '大米', l4: '东北大米' },
  { l1: '食品', l2: '粮油调味', l3: '食用油', l4: '花生油' },
  { l1: '食品', l2: '休闲食品', l3: '饼干', l4: '苏打饼干' },
  { l1: '食品', l2: '方便食品', l3: '方便面', l4: '红烧牛肉面' },
  { l1: '百货', l2: '纸品个护', l3: '卷纸', l4: '无芯卷纸' },
  { l1: '百货', l2: '家居日用', l3: '清洁', l4: '洗洁精' },
  { l1: '乳品', l2: '乳制品', l3: '牛奶', l4: '鲜牛奶' },
  { l1: '乳品', l2: '乳制品', l3: '酸奶', l4: '原味酸奶' }
];

var GD_BRAND_LIB = {
  '饮料': { '碳酸饮料': ['可口可乐', '百事可乐', '雪碧', '芬达'], '果汁饮料': ['汇源', '农夫果园', '味全每日C'], '茶饮料': ['康师傅', '统一', '农夫山泉茶π', '三得利'] },
  '乳制品': { '液态奶': ['蒙牛', '伊利', '光明', '认养一头牛'], '酸奶': ['安慕希', '纯甄', '莫斯利安', '君乐宝'], '奶粉': ['飞鹤', '爱他美', '惠氏'] },
  '酒类': { '白酒': ['茅台', '五粮液', '洋河', '泸州老窖'], '啤酒': ['青岛', '雪花', '百威', '燕京'], '红酒': ['张裕', '长城'] },
  '粮油副食': { '大米': ['五常大米', '金龙鱼', '福临门'], '食用油': ['鲁花', '胡姬花', '多力', '西王'], '调味品': ['海天', '李锦记', '太太乐', '厨邦'] },
  '方便食品': { '方便面': ['康师傅', '统一', '今麦郎', '白象'], '速冻食品': ['湾仔码头', '三全', '思念', '安井'] },
  '休闲零食': { '坚果炒货': ['三只松鼠', '良品铺子', '百草味'], '巧克力': ['德芙', '费列罗', '好时'], '薯片': ['乐事', '可比克', '上好佳'] },
  '预制菜': { '半成品菜': ['味知香', '好得睐', '珍味小梅园'], '料理包': ['谷言', '新雅'] },
  '肉蛋': { '冷鲜肉': ['双汇', '雨润', '金锣'], '鸡蛋': ['德青源', '圣迪乐'] },
  '生鲜': { '水果': ['佳农', '都乐', '褚橙'], '蔬菜': ['寿光蔬菜'], '水产': ['獐子岛', '国联水产'] },
  '日化家清': { '洗护': ['宝洁', '联合利华', '立白'], '纸品': ['维达', '清风', '心相印', '洁柔'] },
  '家居': { '厨具': ['苏泊尔', '爱仕达', '九阳'], '收纳': ['宜家', '太力'] },
  '母婴': { '奶粉': ['飞鹤', '爱他美', '惠氏'], '尿裤': ['帮宝适', '好奇', '花王'] }
};

/* ================================================================
 * 1) 标准商品 goods-standard
 * ================================================================ */
var GD_STD_KEY = 'tcm_goods_standard_v1';
var GD_STD_PAGE = 1, GD_STD_SIZE = 10, GD_STD_KW = '', GD_STD_ST = '';
var GD_STD_L1 = '', GD_STD_L2 = '', GD_STD_L3 = '', GD_STD_L4 = '';
var GD_STD_DRAFT = null;
var GD_STD = [];
var STD_SEED = [
  { stdId: 'STD001', barcode: '6901234500011', name: '宁夏硒砂瓜', brand: '佳农', unit: '公斤', spec: '2.5', l1: '生鲜', l2: '水果', l3: '瓜类', l4: '西瓜', shelfLife: 7, shelfUnit: '天', storage: '冷藏', image: '', status: '0', operator: '王 admin', related: [] },
  { stdId: 'STD002', barcode: '6901234500028', name: '妃子笑荔枝', brand: '都乐', unit: '斤', spec: '500', l1: '生鲜', l2: '水果', l3: '热带水果', l4: '荔枝', shelfLife: 5, shelfUnit: '天', storage: '冷藏', image: '', status: '0', operator: '王 admin', related: [] },
  { stdId: 'STD003', barcode: '6901234500035', name: '金枕榴莲', brand: '佳农', unit: '公斤', spec: '1.5', l1: '生鲜', l2: '水果', l3: '热带水果', l4: '榴莲', shelfLife: 3, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '王 admin', related: [] },
  { stdId: 'STD004', barcode: '6901234500042', name: '云南夏黑葡萄', brand: '都乐', unit: '斤', spec: '500', l1: '生鲜', l2: '水果', l3: '葡萄', l4: '夏黑', shelfLife: 7, shelfUnit: '天', storage: '冷藏', image: '', status: '0', operator: '王 admin', related: [] },
  { stdId: 'STD005', barcode: '6901234500059', name: '鲜鸡蛋(30枚)', brand: '德青源', unit: '盒', spec: '30枚', l1: '肉蛋', l2: '蛋品', l3: '鸡蛋', l4: '盒装蛋', shelfLife: 30, shelfUnit: '天', storage: '冷藏', image: '', status: '0', operator: '李 admin', related: [] },
  { stdId: 'STD006', barcode: '6901234500066', name: '猪前腿肉', brand: '双汇', unit: '公斤', spec: '1.0', l1: '生鲜', l2: '肉禽蛋', l3: '猪肉', l4: '前腿肉', shelfLife: 3, shelfUnit: '天', storage: '冷冻', image: '', status: '0', operator: '李 admin', related: [] },
  { stdId: 'STD007', barcode: '6901234500073', name: '三黄鸡(整只)', brand: '圣农', unit: '只', spec: '1只约1.2kg', l1: '生鲜', l2: '肉禽蛋', l3: '禽类', l4: '整鸡', shelfLife: 2, shelfUnit: '天', storage: '冷藏', image: '', status: '0', operator: '李 admin', related: [] },
  { stdId: 'STD008', barcode: '6901234500080', name: '鲈鱼(鲜活)', brand: '国联水产', unit: '条', spec: '约500g', l1: '生鲜', l2: '水产', l3: '淡水鱼', l4: '鲈鱼', shelfLife: 1, shelfUnit: '天', storage: '冷藏', image: '', status: '0', operator: '李 admin', related: [] },
  { stdId: 'STD009', barcode: '6901234500097', name: '东北大米5kg', brand: '五常大米', unit: '袋', spec: '5000', l1: '食品', l2: '粮油调味', l3: '大米', l4: '东北米', shelfLife: 365, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '张 admin', related: [] },
  { stdId: 'STD010', barcode: '6901234500103', name: '卷纸(12卷)', brand: '维达', unit: '提', spec: '12卷', l1: '百货', l2: '纸品个护', l3: '卷纸', l4: '无芯卷纸', shelfLife: 1095, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '张 admin', related: [] },
  { stdId: 'STD011', barcode: '6901234500110', name: '鲜牛奶(1L)', brand: '光明', unit: '瓶', spec: '1000', l1: '乳品', l2: '乳制品', l3: '液态奶', l4: '巴氏奶', shelfLife: 7, shelfUnit: '天', storage: '冷藏', image: '', status: '0', operator: '张 admin', related: [] },
  { stdId: 'STD012', barcode: '6901234500127', name: '原味酸奶(100gx8)', brand: '安慕希', unit: '组', spec: '8杯', l1: '乳品', l2: '乳制品', l3: '酸奶', l4: '风味酸奶', shelfLife: 21, shelfUnit: '天', storage: '冷藏', image: '', status: '1', operator: '张 admin', related: [] },
  { stdId: 'STD013', barcode: '6901234500134', name: '花生油(5L)', brand: '鲁花', unit: '桶', spec: '5000', l1: '食品', l2: '粮油调味', l3: '食用油', l4: '花生油', shelfLife: 540, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '张 admin', related: [] },
  { stdId: 'STD014', barcode: '6901234500141', name: '红烧牛肉面(5连包)', brand: '康师傅', unit: '袋', spec: '5包', l1: '食品', l2: '方便食品', l3: '方便面', l4: '袋面', shelfLife: 180, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '张 admin', related: [] },
  { stdId: 'STD015', barcode: '6901234500158', name: '海天生抽(500ml)', brand: '海天', unit: '瓶', spec: '500', l1: '食品', l2: '粮油调味', l3: '调味品', l4: '酱油', shelfLife: 540, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '张 admin', related: [] },
  { stdId: 'STD016', barcode: '6901234500165', name: '乐事原味薯片', brand: '乐事', unit: '袋', spec: '70', l1: '食品', l2: '休闲食品', l3: '薯片', l4: '原味薯片', shelfLife: 270, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '赵 admin', related: [] },
  { stdId: 'STD017', barcode: '6901234500172', name: '可口可乐(330mlx6)', brand: '可口可乐', unit: '组', spec: '6罐', l1: '饮料', l2: '碳酸饮料', l3: '汽水', l4: '可乐', shelfLife: 365, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '赵 admin', related: [] },
  { stdId: 'STD018', barcode: '6901234500189', name: '青岛啤酒(500mlx12)', brand: '青岛', unit: '箱', spec: '12瓶', l1: '酒类', l2: '啤酒', l3: '瓶装啤酒', l4: '黄啤', shelfLife: 365, shelfUnit: '天', storage: '常温', image: '', status: '1', operator: '赵 admin', related: [] },
  { stdId: 'STD019', barcode: '6901234500196', name: '三只松鼠每日坚果', brand: '三只松鼠', unit: '袋', spec: '25', l1: '食品', l2: '休闲食品', l3: '坚果', l4: '每日坚果', shelfLife: 240, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '赵 admin', related: [] },
  { stdId: 'STD020', barcode: '6901234500202', name: '帮宝适纸尿裤M码', brand: '帮宝适', unit: '包', spec: '54片', l1: '母婴', l2: '尿裤', l3: '纸尿裤', l4: 'M码', shelfLife: 1095, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: '赵 admin', related: [] }
];
function gdStdLoad() { try { var r = localStorage.getItem(GD_STD_KEY); if (r) { GD_STD = JSON.parse(r); return; } } catch (e) {} GD_STD = JSON.parse(JSON.stringify(STD_SEED)); gdStdPersist(); }
function gdStdPersist() { try { localStorage.setItem(GD_STD_KEY, JSON.stringify(GD_STD)); } catch (e) {} }
function gdStdById(id) { for (var i = 0; i < GD_STD.length; i++) if (GD_STD[i].stdId === id) return GD_STD[i]; return null; }
function gdStdNextId() { var max = 0; GD_STD.forEach(function (s) { var n = parseInt((s.stdId || '').replace('STD', ''), 10); if (n > max) max = n; }); return 'STD' + ('00' + (max + 1)).slice(-3); }
function gdStdCatOptions(level, parentPath) {
  var set = {}, arr = [];
  GD_CATS.forEach(function (c) {
    var p = [c.l1, c.l2, c.l3, c.l4];
    var ok = true;
    for (var i = 0; i < level - 1; i++) { if (p[i] !== parentPath[i]) { ok = false; break; } }
    if (ok && !set[p[level - 1]]) { set[p[level - 1]] = true; arr.push(p[level - 1]); }
  });
  arr.sort();
  return '<option value="">全部' + (level === 1 ? '一级' : (level === 2 ? '二级' : (level === 3 ? '三级' : '四级'))) + '</option>' + arr.map(function (x) { return '<option value="' + x + '">' + x + '</option>'; }).join('');
}
function gdStdCatText(s) { return s.l1 + ' / ' + s.l2 + ' / ' + s.l3 + ' / ' + s.l4; }
function gdStdSpecText(s) { return s.spec + (s.unit === '称重' ? '' : '/' + s.unit) + (s.unit === '称重' ? '（称重）' : ''); }
function gdStdStatusBadge(s) { return String(s) === '0' ? msGdBadge('启用', 'ok') : msGdBadge('禁用', 'err'); }
function gdStdInit() {
  gdUnitLoad(); gdStdLoad();
  var el = document.getElementById('goods-standardContent');
  if (!el) { setTimeout(gdStdInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<select class="ic-input" style="width:120px" id="gdStdL1" onchange="gdStdCatChange(1)">' + gdStdCatOptions(1, []) + '</select>' +
      '<select class="ic-input" style="width:120px" id="gdStdL2" onchange="gdStdCatChange(2)">' + gdStdCatOptions(2, [GD_STD_L1]) + '</select>' +
      '<select class="ic-input" style="width:120px" id="gdStdL3" onchange="gdStdCatChange(3)">' + gdStdCatOptions(3, [GD_STD_L1, GD_STD_L2]) + '</select>' +
      '<select class="ic-input" style="width:120px" id="gdStdL4" onchange="gdStdCatChange(4)">' + gdStdCatOptions(4, [GD_STD_L1, GD_STD_L2, GD_STD_L3]) + '</select>' +
      '<input class="ic-search" style="flex:0 1 220px" placeholder="品名/编码/品牌" value="' + msGdEsc(GD_STD_KW) + '" onkeydown="if(event.key===\'Enter\')gdStdQuery()" id="gdStdKw">' +
      '<button class="ic-btn" onclick="gdStdReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="gdStdQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="gdStdOpen(\'new\',null)">＋ 新增标准商品</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1260px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:130px">标品编码</th><th style="width:170px">品名</th><th style="width:120px">品牌</th><th style="width:80px">单位</th>' +
            '<th style="width:120px">规格</th><th style="width:80px">图片</th><th style="width:90px">贮藏</th><th style="width:110px">保质期</th><th style="width:100px">操作人</th><th style="width:80px">状态</th><th style="width:180px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="gdStdBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="gdStdPager" style="flex-shrink:0"></div>' +
    '</div>';
  document.getElementById('gdStdL1').value = GD_STD_L1;
  document.getElementById('gdStdL2').value = GD_STD_L2;
  document.getElementById('gdStdL3').value = GD_STD_L3;
  document.getElementById('gdStdL4').value = GD_STD_L4;
  gdStdRender();
}
function gdStdCatChange(level) {
  var l1 = document.getElementById('gdStdL1'), l2 = document.getElementById('gdStdL2'), l3 = document.getElementById('gdStdL3'), l4 = document.getElementById('gdStdL4');
  if (level === 1) { GD_STD_L1 = l1.value; GD_STD_L2 = ''; GD_STD_L3 = ''; GD_STD_L4 = ''; }
  if (level === 2) { GD_STD_L2 = l2.value; GD_STD_L3 = ''; GD_STD_L4 = ''; }
  if (level === 3) { GD_STD_L3 = l3.value; GD_STD_L4 = ''; }
  if (level === 4) { GD_STD_L4 = l4.value; }
  l2.innerHTML = gdStdCatOptions(2, [GD_STD_L1]); l2.value = GD_STD_L2;
  l3.innerHTML = gdStdCatOptions(3, [GD_STD_L1, GD_STD_L2]); l3.value = GD_STD_L3;
  l4.innerHTML = gdStdCatOptions(4, [GD_STD_L1, GD_STD_L2, GD_STD_L3]); l4.value = GD_STD_L4;
}
function gdStdReset() { GD_STD_KW = ''; GD_STD_ST = ''; GD_STD_L1 = ''; GD_STD_L2 = ''; GD_STD_L3 = ''; GD_STD_L4 = ''; GD_STD_PAGE = 1; gdStdInit(); }
function gdStdQuery() { var k = document.getElementById('gdStdKw'); GD_STD_KW = k ? k.value.trim() : ''; GD_STD_PAGE = 1; gdStdRender(); }
function gdStdRows() {
  var kw = GD_STD_KW.toLowerCase();
  return GD_STD.filter(function (s) {
    if (GD_STD_ST !== '' && String(s.status) !== GD_STD_ST) return false;
    if (GD_STD_L1 && s.l1 !== GD_STD_L1) return false;
    if (GD_STD_L2 && s.l2 !== GD_STD_L2) return false;
    if (GD_STD_L3 && s.l3 !== GD_STD_L3) return false;
    if (GD_STD_L4 && s.l4 !== GD_STD_L4) return false;
    if (kw && s.name.toLowerCase().indexOf(kw) < 0 && s.barcode.toLowerCase().indexOf(kw) < 0 && s.brand.toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
}
function gdStdRender(page) {
  if (page) GD_STD_PAGE = page;
  var rows = gdStdRows();
  var pages = Math.ceil(rows.length / GD_STD_SIZE) || 1;
  if (GD_STD_PAGE > pages) GD_STD_PAGE = pages; if (GD_STD_PAGE < 1) GD_STD_PAGE = 1;
  var slice = rows.slice((GD_STD_PAGE - 1) * GD_STD_SIZE, GD_STD_PAGE * GD_STD_SIZE);
  var body = document.getElementById('gdStdBody');
  if (!body) return;
  body.innerHTML = slice.map(function (s, i) {
    var op = '<button class="ic-op-link" onclick="gdStdOpen(\'view\',\'' + s.stdId + '\')">查看</button>' +
      '<button class="ic-op-link" onclick="gdStdOpen(\'edit\',\'' + s.stdId + '\')">编辑</button>';
    if (String(s.status) === '0') op += '<button class="ic-op-link" style="color:#f56c6c" onclick="gdStdToggle(\'' + s.stdId + '\',\'1\')">禁用</button>';
    else op += '<button class="ic-op-link" style="color:#67c23a" onclick="gdStdToggle(\'' + s.stdId + '\',\'0\')">启用</button>';
    op += '<button class="ic-op-link" style="color:#f56c6c" onclick="gdStdDel(\'' + s.stdId + '\')">删除</button>';
    return '<tr><td style="text-align:center;color:#999">' + ((GD_STD_PAGE - 1) * GD_STD_SIZE + i + 1) + '</td>' +
      '<td><button class="ic-op-link" style="font-weight:600" onclick="gdStdOpen(\'edit\',\'' + s.stdId + '\')">' + s.stdId + '</button></td>' +
      '<td>' + msGdEsc(s.name) + '</td><td>' + msGdEsc(s.brand) + '</td><td>' + msGdEsc(s.unit) + '</td>' +
      '<td style="text-align:center">' + (s.image ? '<img src="' + s.image + '" alt="" style="width:34px;height:34px;object-fit:cover;border-radius:3px;vertical-align:middle">' : '<span style="color:#c0c4cc">—</span>') + '</td>' +
      '<td>' + msGdEsc(s.storage) + '</td><td>' + s.shelfLife + s.shelfUnit + '</td>' +
      '<td>' + msGdEsc(s.operator) + '</td><td>' + gdStdStatusBadge(s.status) + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="12" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msGdPager(rows.length, GD_STD_PAGE, GD_STD_SIZE, 'gdStdPager', 'gdStdRender');
}
function gdStdToggle(id, to) { var s = gdStdById(id); if (!s) return; s.status = to; gdStdPersist(); gdStdRender(); msGdToast(to === '0' ? '已启用' : '已禁用'); }
function gdStdDel(id) {
  var s = gdStdById(id); if (!s) return;
  msGdDlg({ title: '删除确认', width: '420px', body: '<p style="font-size:12px">确认删除标准商品 <b>' + msGdEsc(s.name) + '</b> 吗？</p>', onOk: 'gdStdDelDo(\'' + id + '\')', okText: '确认删除' });
}
function gdStdDelDo(id) { GD_STD = GD_STD.filter(function (s) { return s.stdId !== id; }); gdStdPersist(); msGdClose(); gdStdRender(); msGdToast('已删除'); }
function gdStdOpen(mode, id) {
  var s = id ? gdStdById(id) : null;
  GD_STD_DRAFT = s ? JSON.parse(JSON.stringify(s)) : {
    stdId: gdStdNextId(), barcode: '', name: '', brand: '', unit: '个', spec: '', l1: '生鲜', l2: '水果', l3: '瓜类', l4: '西瓜',
    shelfLife: 7, shelfUnit: '天', storage: '常温', image: '', status: '0', operator: 'admin', related: []
  };
  var ro = mode === 'view';
  msGdDlg({ title: (ro ? '查看标准商品' : (id ? '编辑标准商品' : '新增标准商品')) + (s ? ' · ' + s.stdId : ''), width: 'min(1000px,94vw)', body: gdStdForm(ro), bodyStyle: 'max-height:76vh;overflow:auto;', onOk: ro ? null : 'gdStdSave(\'' + (id || 'new') + '\')', okText: '保存', cancelText: ro ? '关闭' : '取消' });
}
function gdStdForm(ro) {
  var d = GD_STD_DRAFT; var dis = ro ? ' disabled' : '';
  var cat1 = gdStdCatOptions(1, []), cat2 = gdStdCatOptions(2, [d.l1]), cat3 = gdStdCatOptions(3, [d.l1, d.l2]), cat4 = gdStdCatOptions(4, [d.l1, d.l2, d.l3]);
  var units = gdUnitOptions(d.unit);
  var brands = []; Object.keys(GD_BRAND_LIB).forEach(function (k) { for (var sc in GD_BRAND_LIB[k]) GD_BRAND_LIB[k][sc].forEach(function (b) { if (brands.indexOf(b) < 0) brands.push(b); }); });
  brands.sort();
  var brandOpts = '<option value="">请选择品牌</option>' + brands.map(function (b) { return '<option value="' + b + '"' + (d.brand === b ? ' selected' : '') + '>' + b + '</option>'; }).join('');
  var rel = (d.related || []).map(function (r, i) {
    return '<tr><td style="padding:6px 10px">' + msGdEsc(r.barcode) + '</td><td style="padding:6px 10px">' + msGdEsc(r.name) + '</td><td style="padding:6px 10px">' + msGdEsc(r.unit) + '</td><td style="padding:6px 10px">' + msGdEsc(r.spec) + '</td><td style="padding:6px 10px">' + msGdEsc(r.brand) + '</td><td style="padding:6px 10px">' + (r.ratio || 1) + '</td><td style="padding:6px 10px">' + (ro ? '' : '<button class="ic-op-link" style="color:#f56c6c" onclick="gdStdRelDel(' + i + ')">移除</button>') + '</td></tr>';
  }).join('');
  var h = '<div style="font-size:12px;color:#0b1019">';
  h += '<div style="display:grid;grid-template-columns:120px 1fr 1fr 1fr;gap:14px 16px;align-items:start">';
  h += '<div style="grid-row:span 2"><div style="color:#5b6472;margin-bottom:6px">商品图片</div>' + gdStdImgBox(ro) + '</div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">条码 <span style="color:#fc4b52">*</span></div><input class="ic-input" placeholder="扫码或输入条码" value="' + msGdEsc(d.barcode) + '"' + dis + ' oninput="gdStdD(\'barcode\',this.value)" id="gdStdF_barcode"></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">品名 <span style="color:#fc4b52">*</span></div><input class="ic-input" placeholder="请输入品名" value="' + msGdEsc(d.name) + '"' + dis + ' oninput="gdStdD(\'name\',this.value)"></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">单位 <span style="color:#fc4b52">*</span></div><select class="ic-input"' + dis + ' onchange="gdStdD(\'unit\',this.value)">' + units + '</select></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">规格 <span style="color:#fc4b52">*</span></div><div style="display:flex;align-items:center;gap:6px"><input class="ic-input" style="flex:1" placeholder="如 500" value="' + msGdEsc(d.spec) + '"' + dis + ' oninput="gdStdD(\'spec\',this.value)"><span style="color:#5b6472;white-space:nowrap">' + (d.unit === '称重' ? '（称重）' : d.unit) + '</span></div></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">品牌 <span style="color:#fc4b52">*</span></div><select class="ic-input"' + dis + ' onchange="gdStdD(\'brand\',this.value)">' + brandOpts + '</select></div>';
  h += '<div><div style="color:#5b6472;margin-bottom:6px">贮藏</div><select class="ic-input"' + dis + ' onchange="gdStdD(\'storage\',this.value)"><option value="常温"' + (d.storage === '常温' ? ' selected' : '') + '>常温</option><option value="冷藏"' + (d.storage === '冷藏' ? ' selected' : '') + '>冷藏</option><option value="冷冻"' + (d.storage === '冷冻' ? ' selected' : '') + '>冷冻</option></select></div>';
  h += '</div>';
  h += '<div style="margin-top:14px"><div style="color:#5b6472;margin-bottom:6px">分类</div><div style="display:flex;gap:10px"><select class="ic-input" style="width:160px"' + dis + ' onchange="gdStdCatPick(1,this.value)">' + cat1.replace(' value="' + d.l1 + '"', ' value="' + d.l1 + '" selected') + '</select><select class="ic-input" style="width:160px"' + dis + ' onchange="gdStdCatPick(2,this.value)">' + cat2.replace(' value="' + d.l2 + '"', ' value="' + d.l2 + '" selected') + '</select><select class="ic-input" style="width:160px"' + dis + ' onchange="gdStdCatPick(3,this.value)">' + cat3.replace(' value="' + d.l3 + '"', ' value="' + d.l3 + '" selected') + '</select><select class="ic-input" style="width:160px"' + dis + ' onchange="gdStdCatPick(4,this.value)">' + cat4.replace(' value="' + d.l4 + '"', ' value="' + d.l4 + '" selected') + '</select></div></div>';
  h += '<div style="margin-top:14px"><div style="color:#5b6472;margin-bottom:6px">保质期</div><div style="display:flex;align-items:center;gap:8px"><input type="number" min="1" class="ic-input" style="width:90px" value="' + d.shelfLife + '"' + dis + ' oninput="gdStdD(\'shelfLife\',this.value)"><select class="ic-input" style="width:80px"' + dis + ' onchange="gdStdD(\'shelfUnit\',this.value)"><option value="天"' + (d.shelfUnit === '天' ? ' selected' : '') + '>天</option><option value="月"' + (d.shelfUnit === '月' ? ' selected' : '') + '>月</option><option value="年"' + (d.shelfUnit === '年' ? ' selected' : '') + '>年</option></select></div></div>';
  h += '<div style="margin-top:18px;padding-top:14px;border-top:1px solid #eef1f6"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="color:#0b1019;font-weight:600">关联商品</span><span style="color:#8a93a3;font-size:11px">（一方转换比例必须为 1）</span></div>';
  if (d.related && d.related.length) {
    h += '<div style="border:1px solid #e9eef7;border-radius:4px;overflow:hidden"><table style="width:100%;font-size:12px"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:6px 10px;text-align:left">条码</th><th style="padding:6px 10px;text-align:left">品名</th><th style="padding:6px 10px">单位</th><th style="padding:6px 10px">规格</th><th style="padding:6px 10px">品牌</th><th style="padding:6px 10px">转换比例</th><th style="padding:6px 10px;width:60px">操作</th></tr></thead><tbody>' + rel + '</tbody></table></div>';
  } else { h += '<div style="padding:14px;text-align:center;color:#a8b0bd;border:1px dashed #dfe3ed;border-radius:4px">尚未添加关联商品</div>'; }
  if (!ro) h += '<button class="ic-btn ic-btn-pri" style="margin-top:8px" onclick="gdStdRelOpen()">＋ 新增关联</button>';
  h += '</div></div>';
  return h;
}
function gdStdD(path, v) { GD_STD_DRAFT[path] = v; }
function gdStdImgBox(ro) {
  var d = GD_STD_DRAFT;
  var inner = d.image ? '<img src="' + d.image + '" alt="" style="width:96px;height:96px;object-fit:cover;border-radius:4px;display:block">' : '<div style="width:96px;height:96px;border:1px dashed #c0c4cc;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#909399;font-size:12px;background:#f7f9fc">上传</div>';
  return ro ? inner : '<label style="display:block;cursor:pointer" title="点击上传图片">' + inner + '<input type="file" accept="image/*" style="display:none" onchange="gdStdImgFile(this)"></label>';
}
function gdStdImgFile(input) {
  var f = input && input.files && input.files[0]; if (!f) return;
  if (f.type.indexOf('image/') !== 0) { msGdToast('请选择图片文件'); return; }
  var r = new FileReader();
  r.onload = function () {
    if (String(r.result).indexOf('data:image/') !== 0) { msGdToast('图片读取失败'); return; }
    GD_STD_DRAFT.image = String(r.result);
    msGdBody(gdStdForm(false));
  };
  r.readAsDataURL(f);
}
function gdStdCatPick(level, v) {
  if (level === 1) GD_STD_DRAFT.l1 = v;
  if (level === 2) GD_STD_DRAFT.l2 = v;
  if (level === 3) GD_STD_DRAFT.l3 = v;
  if (level === 4) GD_STD_DRAFT.l4 = v;
  msGdBody(gdStdForm(false));
}
function gdStdRelDel(i) { GD_STD_DRAFT.related.splice(i, 1); msGdBody(gdStdForm(false)); }
function gdStdRelOpen() {
  var rows = GD_STD.filter(function (s) { return s.stdId !== GD_STD_DRAFT.stdId; }).map(function (s) {
    var has = GD_STD_DRAFT.related.some(function (r) { return r.stdId === s.stdId; });
    return '<tr><td style="padding:8px 12px">' + s.stdId + '</td><td style="padding:8px 12px">' + msGdEsc(s.name) + '</td><td style="padding:8px 12px">' + msGdEsc(s.brand) + '</td><td style="padding:8px 12px">' + msGdEsc(s.spec) + '/' + msGdEsc(s.unit) + '</td><td style="padding:8px 12px;text-align:center">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="gdStdRelAdd(\'' + s.stdId + '\',1)">添加</button>') + '</td></tr>';
  }).join('');
  msGdPop({ title: '新增关联商品', width: 'min(720px,90vw)', body: '<div style="margin-bottom:8px"><input class="ic-search" style="width:260px" placeholder="搜索品名/编码" onkeydown="if(event.key===\'Enter\')gdStdRelFilter(this.value)"></div><table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f7f9fc;color:#5b6472"><th style="padding:8px 12px;text-align:left">标品编码</th><th style="padding:8px 12px;text-align:left">品名</th><th style="padding:8px 12px;text-align:left">品牌</th><th style="padding:8px 12px;text-align:left">规格</th><th style="padding:8px 12px;width:70px">操作</th></tr></thead><tbody id="gdStdRelList">' + rows + '</tbody></table>', footer: false });
}
function gdStdRelFilter(kw) {
  var k = kw.toLowerCase();
  var rows = GD_STD.filter(function (s) { return s.stdId !== GD_STD_DRAFT.stdId && (!k || s.name.toLowerCase().indexOf(k) >= 0 || s.stdId.toLowerCase().indexOf(k) >= 0); }).map(function (s) {
    var has = GD_STD_DRAFT.related.some(function (r) { return r.stdId === s.stdId; });
    return '<tr><td style="padding:8px 12px">' + s.stdId + '</td><td style="padding:8px 12px">' + msGdEsc(s.name) + '</td><td style="padding:8px 12px">' + msGdEsc(s.brand) + '</td><td style="padding:8px 12px">' + msGdEsc(s.spec) + '/' + msGdEsc(s.unit) + '</td><td style="padding:8px 12px;text-align:center">' + (has ? '<span style="color:#909399">已添加</span>' : '<button class="ic-op-link" onclick="gdStdRelAdd(\'' + s.stdId + '\',1)">添加</button>') + '</td></tr>';
  }).join('');
  var b = document.getElementById('gdStdRelList'); if (b) b.innerHTML = rows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#909399">无匹配</td></tr>';
}
function gdStdRelAdd(stdId, ratio) {
  var s = gdStdById(stdId); if (!s) return;
  if (GD_STD_DRAFT.related.some(function (r) { return r.stdId === stdId; })) { msGdToast('该商品已关联'); return; }
  GD_STD_DRAFT.related.push({ stdId: s.stdId, barcode: s.barcode, name: s.name, unit: s.unit, spec: s.spec, brand: s.brand, ratio: ratio });
  msGdPopClose(); msGdBody(gdStdForm(false));
}
function gdStdSave(mode) {
  var d = GD_STD_DRAFT;
  if (!d.barcode.trim()) { msGdToast('请输入条码'); return; }
  if (!d.name.trim()) { msGdToast('请输入品名'); return; }
  if (!d.brand) { msGdToast('请选择品牌'); return; }
  if (!d.spec.trim()) { msGdToast('请输入规格'); return; }
  if (mode === 'new') { GD_STD.unshift(JSON.parse(JSON.stringify(d))); msGdToast('新增成功'); }
  else { var s = gdStdById(mode); if (!s) return; var idx = GD_STD.indexOf(s); GD_STD[idx] = JSON.parse(JSON.stringify(d)); msGdToast('保存成功'); }
  gdStdPersist(); msGdClose(); gdStdRender();
}

/* ================================================================
 * 2) 供应商 supplier-list
 * ================================================================ */
var GD_SUP_KEY = 'tcm_goods_supplier_v1';
var GD_SUP_PAGE = 1, GD_SUP_SIZE = 10, GD_SUP_KW = '';
var GD_SUP_DRAFT = null;
var GD_SUP = [];
var SUP_SEED = [
  { supId: 'SUP001', name: '佳农水果批发', address: '上海市青浦区华新镇蔬菜批发市场A-101', contact: '陈经理', phone: '13800138001', status: '0' },
  { supId: 'SUP002', name: '双汇生鲜配送中心', address: '上海市松江区沪松公路2999号', contact: '王经理', phone: '021-61234567', status: '0' },
  { supId: 'SUP003', name: '光明乳业直营', address: '上海市闵行区莘松路855号', contact: '李业务', phone: '13900139002', status: '0' },
  { supId: 'SUP004', name: '维达纸业华东仓', address: '江苏省苏州市吴中区甪直镇', contact: '赵小姐', phone: '13700137003', status: '0' },
  { supId: 'SUP005', name: '海天调味品经销', address: '上海市嘉定区江桥镇曹安公路2020号', contact: '孙经理', phone: '13600136004', status: '0' },
  { supId: 'SUP006', name: '三只松鼠上海办', address: '上海市长宁区金钟路968号', contact: '周业务', phone: '13500135005', status: '1' },
  { supId: 'SUP007', name: '青岛啤酒上海分公司', address: '上海市浦东新区金海路1357号', contact: '吴经理', phone: '021-58888888', status: '0' },
  { supId: 'SUP008', name: '康师傅上海经销商', address: '上海市宝山区顾村镇陆翔路111号', contact: '郑经理', phone: '13300133006', status: '0' },
  { supId: 'SUP009', name: '宝洁（中国）上海仓', address: '上海市浦东新区康桥东路1088号', contact: '冯业务', phone: '021-50630630', status: '0' },
  { supId: 'SUP010', name: '帮宝适华东总代', address: '浙江省杭州市下沙经济开发区', contact: '陈小姐', phone: '15000150007', status: '0' },
  { supId: 'SUP011', name: '国联水产上海冷链', address: '上海市宝山区泰和路1088号', contact: '刘经理', phone: '13800138008', status: '1' },
  { supId: 'SUP012', name: '鲁花食用油上海仓', address: '上海市闵行区虹梅南路1755号', contact: '王业务', phone: '15800158009', status: '0' }
];
function gdSupLoad() { try { var r = localStorage.getItem(GD_SUP_KEY); if (r) { GD_SUP = JSON.parse(r); return; } } catch (e) {} GD_SUP = JSON.parse(JSON.stringify(SUP_SEED)); gdSupPersist(); }
function gdSupPersist() { try { localStorage.setItem(GD_SUP_KEY, JSON.stringify(GD_SUP)); } catch (e) {} }
function gdSupById(id) { for (var i = 0; i < GD_SUP.length; i++) if (GD_SUP[i].supId === id) return GD_SUP[i]; return null; }
function gdSupNextId() { var max = 0; GD_SUP.forEach(function (s) { var n = parseInt((s.supId || '').replace('SUP', ''), 10); if (n > max) max = n; }); return 'SUP' + ('00' + (max + 1)).slice(-3); }
function gdSupStatusBadge(s) { return String(s) === '0' ? msGdBadge('启用', 'ok') : msGdBadge('禁用', 'err'); }
function gdSupInit() {
  gdSupLoad();
  var el = document.getElementById('supplier-listContent');
  if (!el) { setTimeout(gdSupInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<input class="ic-search" style="flex:0 1 240px" placeholder="供应商名称" value="' + msGdEsc(GD_SUP_KW) + '" onkeydown="if(event.key===\'Enter\')gdSupQuery()" id="gdSupKw">' +
      '<button class="ic-btn" onclick="gdSupReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="gdSupQuery()">查询</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn ic-btn-pri" onclick="gdSupOpen(\'new\',null)">＋ 新增供应商</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:1080px">' +
          '<thead><tr>' +
            '<th style="width:52px">序号</th><th style="width:200px">供应商名称</th><th style="width:120px">供应商编码</th>' +
            '<th style="width:260px">通讯地址</th><th style="width:100px">联系人</th><th style="width:140px">联系电话</th><th style="width:80px">状态</th><th style="width:180px">操作</th>' +
          '</tr></thead>' +
          '<tbody id="gdSupBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="gdSupPager" style="flex-shrink:0"></div>' +
    '</div>';
  gdSupRender();
}
function gdSupReset() { GD_SUP_KW = ''; GD_SUP_PAGE = 1; var k = document.getElementById('gdSupKw'); if (k) k.value = ''; gdSupRender(); }
function gdSupQuery() { var k = document.getElementById('gdSupKw'); GD_SUP_KW = k ? k.value.trim() : ''; GD_SUP_PAGE = 1; gdSupRender(); }
function gdSupRows() {
  var kw = GD_SUP_KW.toLowerCase();
  return GD_SUP.filter(function (s) {
    if (kw && (s.name || '').toLowerCase().indexOf(kw) < 0 && (s.supId || '').toLowerCase().indexOf(kw) < 0) return false;
    return true;
  });
}
function gdSupRender(page) {
  if (page) GD_SUP_PAGE = page;
  var rows = gdSupRows();
  var pages = Math.ceil(rows.length / GD_SUP_SIZE) || 1;
  if (GD_SUP_PAGE > pages) GD_SUP_PAGE = pages; if (GD_SUP_PAGE < 1) GD_SUP_PAGE = 1;
  var slice = rows.slice((GD_SUP_PAGE - 1) * GD_SUP_SIZE, GD_SUP_PAGE * GD_SUP_SIZE);
  var body = document.getElementById('gdSupBody'); if (!body) return;
  body.innerHTML = slice.map(function (s, i) {
    var op = '<button class="ic-op-link" onclick="gdSupOpen(\'edit\',\'' + s.supId + '\')">编辑</button>';
    if (String(s.status) === '0') op += '<button class="ic-op-link" style="color:#f56c6c" onclick="gdSupToggle(\'' + s.supId + '\',\'1\')">禁用</button>';
    else op += '<button class="ic-op-link" style="color:#67c23a" onclick="gdSupToggle(\'' + s.supId + '\',\'0\')">启用</button>';
    op += '<button class="ic-op-link" style="color:#f56c6c" onclick="gdSupDel(\'' + s.supId + '\')">删除</button>';
    return '<tr><td style="text-align:center;color:#999">' + ((GD_SUP_PAGE - 1) * GD_SUP_SIZE + i + 1) + '</td>' +
      '<td><button class="ic-op-link" style="font-weight:600" onclick="gdSupOpen(\'edit\',\'' + s.supId + '\')">' + msGdEsc(s.name) + '</button></td>' +
      '<td>' + s.supId + '</td><td>' + msGdEsc(s.address) + '</td><td>' + msGdEsc(s.contact) + '</td><td>' + msGdEsc(s.phone) + '</td>' +
      '<td>' + gdSupStatusBadge(s.status) + '</td><td>' + op + '</td></tr>';
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msGdPager(rows.length, GD_SUP_PAGE, GD_SUP_SIZE, 'gdSupPager', 'gdSupRender');
}
function gdSupToggle(id, to) { var s = gdSupById(id); if (!s) return; s.status = to; gdSupPersist(); gdSupRender(); msGdToast(to === '0' ? '已启用' : '已禁用'); }
function gdSupDel(id) { var s = gdSupById(id); if (!s) return; msGdDlg({ title: '删除确认', width: '420px', body: '<p style="font-size:12px">确认删除供应商 <b>' + msGdEsc(s.name) + '</b> 吗？</p>', onOk: 'gdSupDelDo(\'' + id + '\')', okText: '确认删除' }); }
function gdSupDelDo(id) { GD_SUP = GD_SUP.filter(function (s) { return s.supId !== id; }); gdSupPersist(); msGdClose(); gdSupRender(); msGdToast('已删除'); }
function gdSupOpen(mode, id) {
  var s = id ? gdSupById(id) : null;
  GD_SUP_DRAFT = s ? JSON.parse(JSON.stringify(s)) : { supId: gdSupNextId(), name: '', address: '', contact: '', phone: '', status: '0' };
  var ro = mode === 'view';
  var inp = function (label, ph, val, path) { return '<div style="margin-bottom:14px"><div style="color:#5b6472;margin-bottom:6px">' + label + '</div><input class="ic-input" placeholder="' + ph + '" value="' + msGdEsc(val) + '" ' + (ro ? 'disabled' : 'oninput="gdSupD(\'' + path + '\',this.value)"') + '></div>'; };
  var h = '<div style="font-size:12px;color:#0b1019">' +
    inp('供应商名称 <span style="color:#fc4b52">*</span>', '2-30字符', GD_SUP_DRAFT.name, 'name') +
    inp('通讯地址', '不超过50字', GD_SUP_DRAFT.address, 'address') +
    inp('联系人', '不超过20字', GD_SUP_DRAFT.contact, 'contact') +
    inp('联系电话', '手机或座机', GD_SUP_DRAFT.phone, 'phone') +
    '</div>';
  msGdDlg({ title: (ro ? '查看供应商' : (id ? '编辑供应商' : '新增供应商')) + (s ? ' · ' + s.supId : ''), width: '560px', body: h, onOk: ro ? null : 'gdSupSave(\'' + (id || 'new') + '\')', okText: '保存', cancelText: ro ? '关闭' : '取消' });
}
function gdSupD(path, v) { GD_SUP_DRAFT[path] = v; }
function gdSupSave(mode) {
  var d = GD_SUP_DRAFT;
  if (!d.name.trim() || d.name.length < 2 || d.name.length > 30) { msGdToast('供应商名称需 2-30 字符'); return; }
  var phoneOk = !d.phone || /^1[3-9]\d{9}$/.test(d.phone) || /^0\d{2,3}-?\d{7,8}$/.test(d.phone);
  if (d.phone && !phoneOk) { msGdToast('联系电话格式不正确'); return; }
  if (mode === 'new') { GD_SUP.unshift(JSON.parse(JSON.stringify(d))); msGdToast('新增成功'); }
  else { var s = gdSupById(mode); if (!s) return; var idx = GD_SUP.indexOf(s); GD_SUP[idx] = JSON.parse(JSON.stringify(d)); msGdToast('保存成功'); }
  gdSupPersist(); msGdClose(); gdSupRender();
}

/* ================================================================
 * 3) 单位列表 goods-unit（只读）
 * ================================================================ */
function gdUnitInit() {
  gdUnitLoad();
  var el = document.getElementById('goods-unitContent');
  if (!el) { setTimeout(gdUnitInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#8a93a3">单位资料供标准商品选择，当前仅支持查看</span>' +
      '<span style="flex:1"></span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0">' +
        '<table style="min-width:680px">' +
          '<thead><tr><th style="width:52px">序号</th><th style="width:140px">编码</th><th style="width:180px">单位</th><th style="width:180px">其他相同单位</th></tr></thead>' +
          '<tbody id="gdUnitBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="pagination-bar" id="gdUnitPager" style="flex-shrink:0"></div>' +
    '</div>';
  gdUnitRender();
}
function gdUnitRender(page) {
  var size = 10, pageNo = page || 1;
  var rows = GD_UNITS;
  var pages = Math.ceil(rows.length / size) || 1;
  if (pageNo > pages) pageNo = pages; if (pageNo < 1) pageNo = 1;
  var slice = rows.slice((pageNo - 1) * size, pageNo * size);
  var body = document.getElementById('gdUnitBody'); if (!body) return;
  body.innerHTML = slice.map(function (u, i) {
    return '<tr><td style="text-align:center;color:#999">' + ((pageNo - 1) * size + i + 1) + '</td><td>' + u.unitId + '</td><td>' + msGdEsc(u.unitName) + '</td><td>' + msGdEsc(u.otherName) + '</td></tr>';
  }).join('') || '<tr><td colspan="4" style="text-align:center;color:#909399;padding:40px">暂无数据</td></tr>';
  msGdPager(rows.length, pageNo, size, 'gdUnitPager', 'gdUnitRender');
}

/* ================================================================
 * 4) 品牌库 brand-library（只读目录，规划）
 * ================================================================ */
var GD_BRAND_KW = '';
function gdBrandInit() {
  var el = document.getElementById('brand-libraryContent');
  if (!el) { setTimeout(gdBrandInit, 80); return; }
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<input class="ic-search" style="flex:0 1 260px" placeholder="搜索品牌" value="' + msGdEsc(GD_BRAND_KW) + '" onkeydown="if(event.key===\'Enter\')gdBrandQuery()" id="gdBrandKw">' +
      '<button class="ic-btn" onclick="gdBrandReset()">重置</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="gdBrandQuery()">查询</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">按 12 大类归集，仅作标准商品品牌候选参考</span>' +
    '</div>' +
    '<div id="gdBrandBody" style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;border:1px solid #e9eef7;overflow:auto;padding:16px"></div>';
  gdBrandRender();
}
function gdBrandReset() { GD_BRAND_KW = ''; var k = document.getElementById('gdBrandKw'); if (k) k.value = ''; gdBrandRender(); }
function gdBrandQuery() { var k = document.getElementById('gdBrandKw'); GD_BRAND_KW = k ? k.value.trim() : ''; gdBrandRender(); }
function gdBrandRender() {
  var kw = GD_BRAND_KW.toLowerCase();
  var b = document.getElementById('gdBrandBody'); if (!b) return;
  var html = '';
  Object.keys(GD_BRAND_LIB).forEach(function (big) {
    var subs = GD_BRAND_LIB[big];
    var any = false;
    var subHtml = Object.keys(subs).map(function (sub) {
      var brands = subs[sub].filter(function (x) { return !kw || x.toLowerCase().indexOf(kw) >= 0; });
      if (!brands.length) return '';
      any = true;
      return '<div style="margin-bottom:10px"><div style="font-size:13px;font-weight:600;color:#3a4252;margin-bottom:6px">' + sub + '</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + brands.map(function (x) { return '<span style="display:inline-block;padding:3px 10px;background:#f4f5f7;border:1px solid #e9e9eb;border-radius:10px;font-size:12px;color:#5b6472">' + msGdEsc(x) + '</span>'; }).join('') + '</div></div>';
    }).join('');
    if (any) html += '<div style="margin-bottom:18px;border-bottom:1px solid #f0f0f0;padding-bottom:12px"><div style="font-size:15px;font-weight:700;color:#0b1019;margin-bottom:8px">' + big + '</div>' + subHtml + '</div>';
  });
  b.innerHTML = html || '<div style="padding:40px;text-align:center;color:#909399">无匹配品牌</div>';
}

function initGoodsPage(pid) {
  if (pid === 'goods-standard') gdStdInit();
  else if (pid === 'supplier-list') gdSupInit();
  else if (pid === 'goods-unit') gdUnitInit();
  else if (pid === 'brand-library') gdBrandInit();
}
