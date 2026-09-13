/* ================================================================
 * 采购定价 + 成本控制（数据层）
 * 对应文档：采购定价与入库价格管控说明.md v1.20
 * 存储（v1.20 重构）：
 *   tcm_supply_price_v1       采购定价「商品主表」：每条 = (商品+门店+供应商)
 *                              字段：price/goodsId/storeId/supplier/effFrom +
 *                              nextSupplier/nextPrice/nextEffFrom（待生效，可空）
 *   tcm_supply_price_history   变更历史：每次调价/换供应商/停用，旧段写一条历史（不可变）
 *   tcm_cost_control_v1        门店成本控制配置
 *   tcm_cost_control_log_v1    配置改动留痕
 *   tcm_price_change_v1        调价单留痕（冗余，从 history 派生，保留兼容老 UI）
 *   tcm_price_notice_v1        低价知会
 * ================================================================ */
var SP_PRICE_KEY = 'tcm_supply_price_v1';
var SP_HISTORY_KEY = 'tcm_supply_price_history_v1';
var SP_CC_KEY = 'tcm_cost_control_v1';
var SP_CCLOG_KEY = 'tcm_cost_control_log_v1';
var SP_CHANGE_KEY = 'tcm_price_change_v1'; // 已废弃：v1.20 起调价历史走 SP_HISTORY，此 key 不再读写
var SP_NOTICE_KEY = 'tcm_price_notice_v1';

var SP_PRICES = [], SP_HISTORY = [], SP_CC = [], SP_CCLOG = [], SP_NOTICES = [];

/* ---------- 种子：采购定价（T11）----------
 * 定价对象统一为**商品**（refType='goods'）。
 * 分类定价已废弃（2026-09-08 用户定）：四级分类的 L4 已细到单品粒度（79% 的 L3 下只有一个 L4），
 * 定在分类上等价于定在单品上，却要为此维护父子继承与五级降级，得不偿失。
 * 多个商品同价（如 4 种白菜统货价）用「批量添加」实现，落库仍是每条商品一条定价。
 * 分类退化为筛选维度（批量选商品、列表过滤），不再是定价对象。
 */
function spSeed() {
  return [
    // —— S2001 崧泽-青浦旗舰店 ——
    spRow('青浦绿蔬合作社', 'goods', 'g-01', 'S2001', 2.80),
    spRow('青浦绿蔬合作社', 'goods', 'g-02', 'S2001', 2.20),
    spRow('青浦绿蔬合作社', 'goods', 'g-03', 'S2001', 1.60),
    // 土豆三条构成完整时间轴：已失效 → 生效中 → 待生效（演示历史价可查）
    spRow('崧泽基地直供', 'goods', 'g-04', 'S2001', 3.40, '2026-01-01', '2026-08-31'),
    spRow('崧泽基地直供', 'goods', 'g-04', 'S2001', 3.55, '2026-09-01', '2026-09-30'),
    spRow('崧泽基地直供', 'goods', 'g-04', 'S2001', 3.60, '2026-10-01', '9999-12-31'),
    spRow('青浦绿蔬合作社', 'goods', 'g-05', 'S2001', 5.10),
    spRow('正大肉品', 'goods', 'g-06', 'S2001', 24.50),
    spRow('淀山湖水产', 'goods', 'g-08', 'S2001', 13.20),
    spRow('益海嘉里', 'goods', 'g-10', 'S2001', 62.00),
    spRow('光明乳业', 'goods', 'g-11', 'S2001', 11.90),
    // —— S2002 崧泽-松江分店 ——
    spRow('正大肉品', 'goods', 'g-07', 'S2002', 18.80),
    spRow('山东栖霞直供', 'goods', 'g-09', 'S2002', 7.60),
    spRow('思念食品', 'goods', 'g-12', 'S2002', 21.50),
    spRow('青浦绿蔬合作社', 'goods', 'g-01', 'S2002', 2.95),
    // —— S2003 浦东社区店 / S2008 唐镇店 / S2009 正育菜市场 / S2010 五莲路店 ——
    // 这 4 家成本控制默认 uniformPrice=true，若不建定价，「未定价禁止入库」会让全店无法入库
    spRow('青浦绿蔬合作社', 'goods', 'g-01', 'S2003', 2.90),
    spRow('青浦绿蔬合作社', 'goods', 'g-02', 'S2003', 2.30),
    spRow('崧泽基地直供', 'goods', 'g-04', 'S2003', 3.50),
    spRow('青浦绿蔬合作社', 'goods', 'g-05', 'S2003', 5.30),
    spRow('正大肉品', 'goods', 'g-07', 'S2003', 19.20),
    spRow('青浦绿蔬合作社', 'goods', 'g-01', 'S2008', 2.75),
    spRow('青浦绿蔬合作社', 'goods', 'g-03', 'S2008', 1.55),
    spRow('正大肉品', 'goods', 'g-06', 'S2008', 24.80),
    spRow('淀山湖水产', 'goods', 'g-08', 'S2008', 13.50),
    spRow('益海嘉里', 'goods', 'g-10', 'S2008', 62.00),
    spRow('青浦绿蔬合作社', 'goods', 'g-01', 'S2009', 2.70),
    spRow('青浦绿蔬合作社', 'goods', 'g-05', 'S2009', 5.00),
    spRow('正大肉品', 'goods', 'g-07', 'S2009', 18.60),
    spRow('思念食品', 'goods', 'g-12', 'S2009', 21.80),
    spRow('山东栖霞直供', 'goods', 'g-09', 'S2009', 7.40),
    spRow('青浦绿蔬合作社', 'goods', 'g-01', 'S2010', 2.85),
    spRow('崧泽基地直供', 'goods', 'g-04', 'S2010', 3.45),
    spRow('正大肉品', 'goods', 'g-06', 'S2010', 25.20),
    spRow('光明乳业', 'goods', 'g-11', 'S2010', 11.90),
    spRow('山东栖霞直供', 'goods', 'g-09', 'S2010', 7.80)
  ];
}
// 分类路径 → 商品 id：仅用于把历史 cat 定价迁移到 goods（新数据不再产生 cat 记录）
var SP_CAT2GOODS = {
  '生鲜/蔬菜/叶菜/娃娃菜': 'g-01', '生鲜/蔬菜/叶菜/上海青': 'g-02', '生鲜/蔬菜/根茎/白萝卜': 'g-03',
  '生鲜/蔬菜/根茎/土豆': 'g-04', '生鲜/蔬菜/茄果/西红柿': 'g-05', '生鲜/肉禽蛋/猪肉/五花肉': 'g-06',
  '生鲜/肉禽蛋/蛋品/鸡蛋': 'g-07', '生鲜/水产/淡水鱼/草鱼': 'g-08', '生鲜/水果/仁果/红富士苹果': 'g-09',
  '食品/粮油调味/食用油/调和油': 'g-10', '乳品/乳制品/牛奶/鲜牛奶': 'g-11', '食品/方便食品/速冻食品/水饺': 'g-12'
};
function spRow(supplier, refType, refId, storeId, price, effFrom, effTo) {
  return {
    priceId: 'SP' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    supplier: supplier, supId: '',
    refType: refType, refId: refId, grade: '',
    scope: 'store', storeId: storeId,
    price: price, taxRate: 0,
    effFrom: effFrom || '2026-01-01', effTo: effTo || '9999-12-31',
    source: 'init', status: 20,
    createdBy: '系统种子', createdAt: '2026-09-08'
  };
}
/* ---------- 种子：门店成本控制配置 ---------- */
function spCcSeed() {
  return [
    { storeId: 'S2001', uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'entry_only', entryAudit: false, auditor: '采购经理', tolAmount: 0.05, tolPct: 1, updatedBy: '系统种子', updatedAt: '2026-09-08' },
    { storeId: 'S2002', uniformPrice: true, noPriceAction: 'forbid', highAction: 'audit', lowAction: 'entry_only', entryAudit: false, auditor: '采购经理', tolAmount: 0.05, tolPct: 1, updatedBy: '系统种子', updatedAt: '2026-09-08' },
    { storeId: 'S2003', uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'audit', entryAudit: false, auditor: '采购经理', tolAmount: 0.05, tolPct: 1, updatedBy: '系统种子', updatedAt: '2026-09-08' },
    { storeId: 'S2008', uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'entry_only', entryAudit: true, auditor: '采购经理', tolAmount: 0.05, tolPct: 1, updatedBy: '系统种子', updatedAt: '2026-09-08' },
    { storeId: 'S2009', uniformPrice: true, noPriceAction: 'forbid', highAction: 'audit', lowAction: 'entry_only', entryAudit: false, auditor: '采购经理', tolAmount: 0.05, tolPct: 1, updatedBy: '系统种子', updatedAt: '2026-09-08' },
    { storeId: 'S2010', uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'entry_only', entryAudit: false, auditor: '采购经理', tolAmount: 0.05, tolPct: 1, updatedBy: '系统种子', updatedAt: '2026-09-08' }
  ];
}
/* ---------- 读写 ---------- */
function spLoad() {
  try { var r = localStorage.getItem(SP_PRICE_KEY); if (r) { SP_PRICES = JSON.parse(r); } else { SP_PRICES = spSeed(); spPersist(); } } catch (e) { SP_PRICES = spSeed(); }
  try { var h = localStorage.getItem(SP_HISTORY_KEY); if (h) SP_HISTORY = JSON.parse(h); } catch (e) { SP_HISTORY = []; }
  try { var c = localStorage.getItem(SP_CC_KEY); if (c) { SP_CC = JSON.parse(c); } else { SP_CC = spCcSeed(); spCcPersist(); } } catch (e) { SP_CC = spCcSeed(); }
  try { var l = localStorage.getItem(SP_CCLOG_KEY); if (l) SP_CCLOG = JSON.parse(l); } catch (e) { SP_CCLOG = []; }
  try { var n = localStorage.getItem(SP_NOTICE_KEY); if (n) SP_NOTICES = JSON.parse(n); } catch (e) { SP_NOTICES = []; }
  spSeedMigrateV3();        // 老分类定价→商品（保留兼容）
  spSeedMigrateV4ToMaster();// 老时间轴多段 → 商品主表+历史
  spSeedMigrateV5Demo();    // 演示数据：五花肉中间改价（配套入库单在 ms-inventory.js）
  spSeedMerge();            // 种子补种
  spCleanOrphans();         // 旧模型种子遗留（refId 结构）清理
  spPromoteNext();          // 下一段到期 → 自动晋升为当前（含修复历史脏数据）
}
/* 旧模型孤儿清理：早期 spSeed() 的 refId 结构记录被主表迁移覆盖后仍残留表内，
 * 查价按 goodsId 匹配不会命中（无害），但会污染定价列表与统计。仅移除已确认有主表孪生的记录，无孪生的保留。 */
function spCleanOrphans() {
  var changed = false;
  SP_PRICES = SP_PRICES.filter(function (p) {
    if (p.goodsId || !p.refId) return true;
    for (var i = 0; i < SP_PRICES.length; i++) {
      var q = SP_PRICES[i];
      if (q.goodsId === p.refId && q.storeId === p.storeId && q.supplier === p.supplier) { changed = true; return false; }
    }
    return true;
  });
  if (changed) spPersist();
}
// 本文件自带的日期助手：不依赖 ms-inventory 的加载顺序（迁移逻辑必须拿得到真实日期，
// 早期版本回退 '' 导致「所有段被当成待生效」的分类事故——见 2026-09-09 修复记录）
function spTodaySafe() {
  var n = new Date();
  return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2);
}
/* 下一段到期晋升：nextEffFrom <= 今天 → 当前段写历史，next 升为当前。
 * 每次加载都跑（幂等）：
 *  - 正常场景 = 「到点自动切换」的落地——页面不用等任何后台任务；
 *  - 修复场景 = 老版本迁移 bug 把已到期段错误归入 next 的脏数据，刷新一次即自愈。
 * 纯未来段主表（当前价为空）到期时直接晋升，不写历史。 */
function spPromoteNext() {
  var today = spTodaySafe(); if (!today) return;
  var changed = false;
  SP_PRICES.forEach(function (m) {
    if (!m.nextEffFrom || m.nextEffFrom > today) return;
    if (m.price) {
      SP_HISTORY.unshift({
        historyId: 'PH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
        priceId: m.priceId, goodsId: m.goodsId, storeId: m.storeId,
        supplier: m.supplier, price: m.price, effFrom: m.effFrom, effTo: m.nextEffFrom,
        closedBy: '新价生效', closedAt: m.nextEffFrom, operator: '系统自动切换'
      });
    }
    if (m.nextSupplier) m.supplier = m.nextSupplier;
    m.price = m.nextPrice; m.effFrom = m.nextEffFrom;
    m.nextSupplier = ''; m.nextPrice = ''; m.nextEffFrom = '';
    changed = true;
  });
  if (changed) { spPersist(); spHistoryPersist(); }
}
/* v3 迁移：把历史「分类定价」转成「商品定价」（分类定价已废弃）。
 * 老 localStorage 里存的是 refType='cat' 的记录，不转换的话新 seed 会被当成新数据重复补进来。 */
function spSeedMigrateV3() {
  try { if (localStorage.getItem('tcm_supply_price_migrate_v3')) return; } catch (e) { return; }
  try {
    var changed = false;
    SP_PRICES.forEach(function (p) {
      if (p.refType !== 'cat') return;
      var gid = SP_CAT2GOODS[p.refId];
      if (gid) { p.refType = 'goods'; p.refId = gid; changed = true; }
    });
    if (changed) spPersist();
    localStorage.setItem('tcm_supply_price_migrate_v3', '1');
  } catch (e) {}
}
/* v4 迁移：v1.19 的「时间轴多段」模型 → v1.20 的「商品主表 + 历史」。
 * 主表主键：(goodsId+storeId)，一个商品在同一店只有一条主表。
 * 合并规则（按今天 today=2026-09-08 切分）：
 *   - 当前生效段（含今天的段）：取 effFrom 最早覆盖重叠；同时记录 supplier
 *   - 待生效段（effFrom>今天）：写入 next 字段
 *   - 已失效段（effTo<今天）：写历史
 * 种子数据细节：有的"当前价段"effTo='9999-12-31'，有的写成具体日期（被早期闭合过）。
 * 两者按"包含今天"判断：effFrom<=today<=effTo。
 * 已迁移过则跳过（标记位 tcm_supply_price_migrate_v4）。*/
function spSeedMigrateV4ToMaster() {
  try { if (localStorage.getItem('tcm_supply_price_migrate_v4')) return; } catch (e) { return; }
  try {
    var masterMap = {};
    var today = spTodaySafe();
    SP_PRICES.forEach(function (p) {
      var gid = p.refType === 'goods' ? p.refId : (p.goodsId || '');
      if (!gid) return;
      var key = gid + '|' + p.storeId;
      var m = masterMap[key];
      if (!m) {
        m = { priceId: p.priceId, goodsId: gid, storeId: p.storeId,
              supplier: '', price: 0, effFrom: p.effFrom,
              nextSupplier: '', nextPrice: '', nextEffFrom: '',
              updatedBy: '', updatedAt: '迁移自时间轴' };
        masterMap[key] = m;
      }
      if (p.effFrom <= today && p.effTo >= today) {
        // 当前生效段：取最早 effFrom 覆盖（多条说明有重叠），记录 supplier
        if (!m.price || p.effFrom < m.effFrom) {
          m.price = p.price; m.effFrom = p.effFrom; m.supplier = p.supplier;
        } else if (!m.supplier) m.supplier = p.supplier;
      } else if (p.effFrom > today) {
        // 待生效段
        m.nextSupplier = p.supplier; m.nextPrice = p.price; m.nextEffFrom = p.effFrom;
      } else {
        // 已失效段（effTo<今天）→ 写历史
        SP_HISTORY.unshift({
          historyId: 'PH' + Math.random().toString(36).slice(2, 8).toUpperCase(),
          priceId: p.priceId, goodsId: gid, storeId: p.storeId, supplier: p.supplier,
          price: p.price, effFrom: p.effFrom, effTo: p.effTo,
          closedBy: '调价/换供应商', closedAt: p.effTo, operator: '迁移自时间轴'
        });
      }
    });
    SP_PRICES = Object.keys(masterMap).map(function (k) { return masterMap[k]; });
    spPersist(); spHistoryPersist();
    localStorage.setItem('tcm_supply_price_migrate_v4', '1');
  } catch (e) {}
}
function spHistoryPersist() { try { localStorage.setItem(SP_HISTORY_KEY, JSON.stringify(SP_HISTORY)); } catch (e) {} }
// 种子补种：老 localStorage 里没有后补的门店定价（S2003/S2008/S2009/S2010），按唯一键补齐一次。
// 用标记位保证只补一次——否则用户删掉某条种子价后刷新又会自己长回来。
/* v5 演示数据：五花肉 g-06/S2001 中间改价——06-01~08-31 ¥23.80（写历史），09-01 起 ¥24.50（当前）。
 * 配套入库单 RK20260815001（08-15 @¥23.80，落在旧价段内）在 ms-inventory.js 的 invEntryDemoMerge()。
 * 只对仍是种子默认值（effFrom=2026-01-01）的记录生效：用户真实改过价就跳过，幂等
 * （标记位 tcm_supply_price_migrate_v5）。 */
function spSeedMigrateV5Demo() {
  try { if (localStorage.getItem('tcm_supply_price_migrate_v5')) return; } catch (e) { return; }
  try {
    var m = null;
    for (var i = 0; i < SP_PRICES.length; i++) {
      var gid = SP_PRICES[i].goodsId || (SP_PRICES[i].refType === 'goods' ? SP_PRICES[i].refId : '');
      if (gid === 'g-06' && SP_PRICES[i].storeId === 'S2001') { m = SP_PRICES[i]; break; }
    }
    if (m && (m.effFrom === '2026-01-01' || !m.effFrom)) {
      m.effFrom = '2026-09-01';
      m.updatedAt = '演示改价数据';
      SP_HISTORY.unshift({
        historyId: 'PH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
        priceId: m.priceId, goodsId: 'g-06', storeId: 'S2001', supplier: '正大肉品',
        price: 23.80, effFrom: '2026-06-01', effTo: '2026-08-31',
        closedBy: '调价', closedAt: '2026-09-01', operator: '系统种子'
      });
      spPersist(); spHistoryPersist();
    }
    localStorage.setItem('tcm_supply_price_migrate_v5', '1');
  } catch (e) {}
}
function spSeedMerge() {
  try { if (localStorage.getItem('tcm_supply_price_seed_v3') || localStorage.getItem('tcm_supply_price_seed_v2')) return; } catch (e) { return; }
  try {
    var key = function (p) { return p.supplier + '|' + p.refType + '|' + p.refId + '|' + p.storeId + '|' + (p.grade || ''); };
    var have = {};
    SP_PRICES.forEach(function (p) { have[key(p)] = 1; });
    var add = spSeed().filter(function (p) { return !have[key(p)]; });
    if (add.length) { SP_PRICES = SP_PRICES.concat(add); spPersist(); }
    localStorage.setItem('tcm_supply_price_seed_v2', '1');
  } catch (e) {}
}
function spPersist() { try { localStorage.setItem(SP_PRICE_KEY, JSON.stringify(SP_PRICES)); } catch (e) {} }
function spCcPersist() { try { localStorage.setItem(SP_CC_KEY, JSON.stringify(SP_CC)); } catch (e) {} }
function spLogPersist() { try { localStorage.setItem(SP_CCLOG_KEY, JSON.stringify(SP_CCLOG)); } catch (e) {} }
function spNoticePersist() { try { localStorage.setItem(SP_NOTICE_KEY, JSON.stringify(SP_NOTICES)); } catch (e) {} }

/* ---------- 成本控制配置 ---------- */
function spCcGet(storeId) {
  for (var i = 0; i < SP_CC.length; i++) if (SP_CC[i].storeId === storeId) return SP_CC[i];
  var d = { storeId: storeId, uniformPrice: true, noPriceAction: 'forbid', highAction: 'forbid', lowAction: 'entry_only', entryAudit: false, auditor: '采购经理', tolAmount: 0.05, tolPct: 1, updatedBy: '', updatedAt: '' };
  SP_CC.push(d); spCcPersist();
  return d;
}
// 配置改动留痕：谁、何时、从什么值改成什么值
function spCcLog(storeId, field, oldV, newV, who) {
  SP_CCLOG.unshift({ storeId: storeId, field: field, oldValue: String(oldV), newValue: String(newV), by: who || '当前用户', at: new Date().toLocaleString('zh-CN') });
  if (SP_CCLOG.length > 500) SP_CCLOG.length = 500;
  spLogPersist();
}
/* 配置改动留痕（进价端 + 售价端共一张表，field 展示名查下表） */
/* auditor（审核人）2026-09-08 起废弃：原按门店指定个人，后改由角色权限决定。
 * 2026-09-12 定：不做操作级 RBAC，改为「审核设置」中指定审核人（全局池，demo 不校验权限，仅记录控制点）。
 * 字段名保留在这里，只为让旧留痕记录还能显示中文名；UI 与保存逻辑均已移除。 */
var SP_CC_FIELDS = {
  uniformPrice: '统一定价开关', noPriceAction: '未定价商品', highAction: '高价处理规则',
  lowAction: '低价处理规则', entryAudit: '入库审核开关', auditor: '审核人（已废弃）',
  tolAmount: '单行容差金额', tolPct: '单行容差比例',
  inventorySwitch: '库存开关', cashierPriceMode: '收银改价', codingPriceMode: '打码改价'
};

/* ---------- 取价：商品级精确匹配 ----------
 * 定价对象统一为商品，不再有父子继承与五级降级（分类定价已废弃，见 spSeed 注释）。
 * 匹配条件：供应商 + 商品 + 门店 + 品质 + 日期落在 [effFrom, effTo] 区间内。
 * 同一组合在时间轴上可能有多条（历史价 / 当前价 / 待生效价），区间不重叠，取命中那一条；
 * 万一区间有重叠取生效日最晚的，保证结果唯一。
 */
/* ---------- 取价（v1.20 商品主表模型）----------
 * 主表 SP_PRICES 每条 = (goodsId+storeId 一条)，含当前 (supplier/price/effFrom) 与下一段 (nextSupplier/nextPrice/nextEffFrom)。
 * 同一商品在同一店只有一条主表——"换供应商"会替换 supplier 字段（当前段的旧 supplier 写历史）。
 * 取价逻辑：
 *   1. 找 supplier 命中当前段的主表 → 若 nextEffFrom 已到且 nextSupplier==supplier，返回 nextPrice
 *   2. 找 supplier 命中 nextSupplier 的主表 → 若 nextEffFrom 已到，返回 nextPrice
 *   3. 都没有 → null
 * 当前价格字段为空/falsy 表示该主表只有下一段（待生效），当前不算定价 → 返回 null。
 * 返回 {price, priceId, supplier, effFrom, source:'current'|'next'} */
function msSupplyGetPrice(supplier, goodsId, catPath, storeId, date) {
  if (!goodsId || !supplier || !storeId) return null;
  date = date || '';
  for (var i = 0; i < SP_PRICES.length; i++) {
    var m = SP_PRICES[i];
    if (m.goodsId !== goodsId || m.storeId !== storeId) continue;
    // 路径1：supplier 命中当前段
    if (m.supplier === supplier) {
      var nextHit = m.nextEffFrom && (!date || m.nextEffFrom <= date) && m.nextSupplier === supplier;
      if (nextHit) return { price: m.nextPrice, priceId: m.priceId, supplier: supplier, effFrom: m.effFrom, source: 'next' };
      // 当前价格有效才返回（price 是 0/空字符串 视为"无当前价"）
      if (m.price !== '' && m.price != null && !isNaN(m.price) && Number(m.price) > 0) {
        return { price: m.price, priceId: m.priceId, supplier: supplier, effFrom: m.effFrom, source: 'current' };
      }
      continue;
    }
    // 路径2：supplier 命中下一段（换供应商场景或纯未来段）
    if (m.nextSupplier === supplier && m.nextEffFrom && (!date || m.nextEffFrom <= date)) {
      return { price: m.nextPrice, priceId: m.priceId, supplier: supplier, effFrom: m.nextEffFrom, source: 'next' };
    }
  }
  return null;
}

/* ---------- 单商品校验 ----------
 * 返回 { level:'none'|'high'|'low'|'ok'|'skip', refPrice, diff, diffPct, action }
 * level 只描述"差异事实"；action 由门店配置决定（提醒永远要做，处理才分档）
 */
function msSupplyCheckItem(item, supplier, storeId, date) {
  var cc = spCcGet(storeId);
  var g = typeof msInvFindGoods === 'function' ? msInvFindGoods(item.code) : null;
  var catPath = (g && g.catPath) || item.catPath || '';
  var res = { level: 'ok', refPrice: null, refFrom: '', diff: 0, diffPct: 0, action: '', catPath: catPath, goodsId: (g && g.goodsId) || '' };
  // 商品未建档（按编码在系统里查不到）：兜底豁免，只记录不拦截
  if (!g) { res.level = 'skip'; res.action = 'allow'; return res; }
  var ref = msSupplyGetPrice(supplier, g.goodsId, catPath, storeId, date);
  if (!ref) {
    // 已建档但未定价：按门店「未定价商品」规则处理
    res.level = 'none';
    res.action = cc.noPriceAction;
    return res;
  }
  res.refPrice = ref.price;
  res.refFrom = '商品定价';
  var d = (item.price == null ? 0 : item.price) - ref.price;
  res.diff = Math.round(d * 100) / 100;
  res.diffPct = ref.price ? Math.round(d / ref.price * 10000) / 100 : 0;
  var tol = Math.max(cc.tolAmount || 0.05, ref.price * (cc.tolPct || 1) / 100);
  if (Math.abs(d) <= tol) { res.level = 'ok'; res.action = 'pass'; return res; }
  if (d > 0) { res.level = 'high'; res.action = cc.highAction; }
  else { res.level = 'low'; res.action = cc.lowAction; }
  return res;
}

/* ---------- 整单校验（在库存变动前调用）----------
 * 返回 { pass, nextStatus, blocks:[], notices:[], results:[] }
 *   pass=false → 进 15 价格异常（库存不变）
 *   pass=true  + entryAudit 开 → 进 25 待入库审核
 *   pass=true  + entryAudit 关 → 直接 20 已完成
 */
function msSupplyCheckEntry(rec) {
  var cc = spCcGet(rec.storeId);
  var out = { pass: true, nextStatus: 20, blocks: [], notices: [], results: [], uniform: cc.uniformPrice, audit: cc.entryAudit };
  if (!cc.uniformPrice) { out.nextStatus = cc.entryAudit ? 25 : 20; return out; }
  (rec.items || []).forEach(function (it, i) {
    var r = msSupplyCheckItem(it, rec.supplier, rec.storeId, rec.date);
    r.idx = i; r.name = it.name; r.price = it.price; r.qty = it.qty;
    out.results.push(r);
    if (r.level === 'none' && r.action === 'forbid') { out.pass = false; out.blocks.push({ idx: i, name: it.name, why: '未定价', action: 'forbid' }); }
    else if (r.level === 'none' && r.action === 'audit') { out.pass = false; out.blocks.push({ idx: i, name: it.name, why: '未定价（审核后可入库）', action: 'audit' }); }
    else if (r.level === 'high' && r.action === 'forbid') { out.pass = false; out.blocks.push({ idx: i, name: it.name, why: '高于定价 ¥' + r.refPrice.toFixed(2) + '（+¥' + r.diff.toFixed(2) + ' / +' + r.diffPct + '%）', action: 'forbid' }); }
    else if (r.level === 'high' && r.action === 'audit') { out.pass = false; out.blocks.push({ idx: i, name: it.name, why: '高于定价 ¥' + r.refPrice.toFixed(2) + '（+¥' + r.diff.toFixed(2) + ' / +' + r.diffPct + '%）', action: 'audit' }); }
    else if (r.level === 'low' && r.action === 'forbid') { out.pass = false; out.blocks.push({ idx: i, name: it.name, why: '低于定价 ¥' + r.refPrice.toFixed(2) + '（' + r.diff.toFixed(2) + ' / ' + r.diffPct + '%）', action: 'forbid' }); }
    else if (r.level === 'low' && r.action === 'audit') { out.pass = false; out.blocks.push({ idx: i, name: it.name, why: '低于定价 ¥' + r.refPrice.toFixed(2) + '（' + r.diff.toFixed(2) + ' / ' + r.diffPct + '%）', action: 'audit' }); }
    else if (r.level === 'low' && r.action === 'entry_only') { out.notices.push({ idx: i, name: it.name, refPrice: r.refPrice, price: it.price, diff: r.diff, diffPct: r.diffPct }); }
    else if (r.level === 'skip') { out.notices.push({ idx: i, name: it.name, refPrice: null, price: it.price, diff: 0, diffPct: 0, skip: true }); }
  });
  out.nextStatus = out.pass ? (cc.entryAudit ? 25 : 20) : 15;
  return out;
}

/* ---------- 低价知会（P1 用的结构先建好）---------- */
function msPriceNoticeAdd(rec, n) {
  SP_NOTICES.unshift({
    noticeId: 'PN' + Date.now(), no: rec.no, storeId: rec.storeId, supplier: rec.supplier,
    name: n.name, refPrice: n.refPrice, price: n.price, diff: n.diff, diffPct: n.diffPct,
    skip: !!n.skip, status: 10, createdAt: new Date().toLocaleString('zh-CN')
  });
  spNoticePersist();
}

/* ---------- 工具 ---------- */
function spMoney(v) { return '¥' + (v == null ? '—' : Number(v).toFixed(2)); }
// 波动文案：↑12% / ↓5%，供列表与详情复用
function spFluctText(r) {
  if (!r || r.level === 'ok' || r.level === 'skip') return '<span style="color:#8a93a3">—</span>';
  if (r.level === 'none') return '<span style="color:#fc4b52">未定价</span>';
  var up = r.diff > 0;
  var c = up ? '#fc4b52' : '#d48806';
  return '<span style="color:' + c + ';font-weight:600">' + (up ? '↑' : '↓') + Math.abs(r.diffPct) + '%</span>' +
    '<span style="color:#8a93a3;font-size:11px"> ' + (up ? '+' : '') + r.diff.toFixed(2) + '</span>';
}
// 录入时实时提示（价格框旁）
function spHintHtml(item, supplier, storeId, date) {
  var r = msSupplyCheckItem(item, supplier, storeId, date);
  if (r.level === 'ok') return { html: r.refPrice != null ? '<span style="color:#52c41a;font-size:11px">定价 ' + spMoney(r.refPrice) + ' ✓</span>' : '', level: 'ok' };
  if (r.level === 'skip') return { html: '<span style="color:#8a93a3;font-size:11px">未纳入定价</span>', level: 'skip' };
  if (r.level === 'none') return { html: '<span style="color:#fc4b52;font-size:11px">未定价</span>', level: 'none' };
  var up = r.diff > 0;
  return {
    html: '<span style="color:' + (up ? '#fc4b52' : '#d48806') + ';font-size:11px;font-weight:600">定价 ' + spMoney(r.refPrice) +
      '（' + (up ? '+' : '') + r.diff.toFixed(2) + ' / ' + (up ? '+' : '') + r.diffPct + '%）</span>',
    level: r.level
  };
}

/* ================================================================
 * 页面 1：采购定价（pages/supply-price.html）
 * ================================================================ */
var SP_PRICE_PAGE = 1, SP_PRICE_SIZE = 10, SP_PRICE_STORE = '', SP_PRICE_SUP = '';
// 批量添加的商品选择暂存（勾选 id 与逐行价格）
var SP_BATCH = null;
function spStoreOpts(sel) {
  var arr = (typeof STORE_DATA !== 'undefined' && STORE_DATA) ? STORE_DATA : [];
  return arr.map(function (s) { return '<option value="' + s.shopId + '"' + (sel === s.shopId ? ' selected' : '') + '>' + (s.shopShortName || s.shopName) + '</option>'; }).join('');
}
function spStoreName(id) {
  var arr = (typeof STORE_DATA !== 'undefined' && STORE_DATA) ? STORE_DATA : [];
  for (var i = 0; i < arr.length; i++) if (arr[i].shopId === id) return arr[i].shopShortName || arr[i].shopName;
  return id;
}
// 供应商候选：入库单实际用到的 + 供应商档案
function spSupOpts(sel) {
  var set = {}, out = [];
  if (typeof INV_ENTRY !== 'undefined') INV_ENTRY.forEach(function (r) { if (r.supplier) set[r.supplier] = 1; });
  if (typeof GD_SUP !== 'undefined') GD_SUP.forEach(function (s) { if (s.name) set[s.name] = 1; });
  SP_PRICES.forEach(function (p) { if (p.supplier) set[p.supplier] = 1; });
  for (var k in set) out.push(k);
  out.sort();
  return out.map(function (n) { return '<option value="' + n + '"' + (sel === n ? ' selected' : '') + '>' + n + '</option>'; }).join('');
}
// 商品档案（按 goodsId 查，不区分门店：定价可能引用他店建档的同编码商品）
function spGoodsById(gid) {
  if (typeof INV_GOODS === 'undefined') return null;
  for (var i = 0; i < INV_GOODS.length; i++) if (INV_GOODS[i].goodsId === gid) return INV_GOODS[i];
  return null;
}
/* ---------- 定价页自带的商品目录（演示数据自成体系，不依赖其他功能页面）----------
 * 列表要展示的销售品名/系统品名/编码/规格/分类，原本全靠「商品档案」+「标准商品库」两个页面。
 * 那两个页面的数据被清过、goodsId 方案不同、或还没加载时，定价行会整片渲染成
 * 「商品不存在…建议删除」——演示直接失效。这里内置一份与种子定价一一对应的目录兜底。
 * 取值优先级：商品档案（实时，改动即时可见）→ 本目录 → 只显示 id。 */
var SP_GOOD_INFO = {
  'g-01': { sale: '娃娃菜', std: '娃娃菜', code: '6901234500017', spec: '称重/kg', cat: '娃娃菜' },
  'g-02': { sale: '上海青', std: '上海青', code: '6901234500024', spec: '称重/kg', cat: '上海青' },
  'g-03': { sale: '白萝卜', std: '白萝卜', code: '6901234500031', spec: '称重/kg', cat: '白萝卜' },
  'g-04': { sale: '土豆', std: '马铃薯', code: '6901234500048', spec: '称重/kg', cat: '土豆' },
  'g-05': { sale: '西红柿', std: '番茄', code: '6901234500055', spec: '称重/kg', cat: '西红柿' },
  'g-06': { sale: '五花肉', std: '带皮五花肉', code: '6901234500062', spec: '称重/kg', cat: '五花肉' },
  'g-07': { sale: '土鸡蛋', std: '鲜鸡蛋', code: '6901234500079', spec: '30枚/盒', cat: '鸡蛋' },
  'g-08': { sale: '草鱼', std: '草鱼', code: '6901234500086', spec: '称重/kg', cat: '草鱼' },
  'g-09': { sale: '红富士苹果', std: '苹果(红富士)', code: '6901234500093', spec: '称重/kg', cat: '红富士苹果' },
  'g-10': { sale: '金龙鱼调和油', std: '食用调和油', code: '6901234500109', spec: '5L/瓶', cat: '调和油' },
  'g-11': { sale: '光明鲜牛奶', std: '鲜牛奶', code: '6901234500116', spec: '950ml/盒', cat: '鲜牛奶' },
  'g-12': { sale: '思念水饺', std: '速冻水饺', code: '6901234500123', spec: '1kg/袋', cat: '水饺' }
};
// 系统品名：优先标准商品库（实时），未关联/未加载时回落内置目录——不因别的页面数据状态而变「未关联」
function spStdLabel(m) {
  var g = spGoodsById(m.goodsId);
  if (g && typeof gdStdOfGoods === 'function') { var s = gdStdOfGoods(g); if (s && s.name) return s.name; }
  var k = SP_GOOD_INFO[m.goodsId];
  return k ? k.std : '';
}
// 列表一行所需的商品展示信息（永不返回空，档案缺失时回落到内置目录）
function spGoodsInfo(m) {
  var g = spGoodsById(m.goodsId), k = SP_GOOD_INFO[m.goodsId] || null;
  var std = spStdLabel(m);
  return {
    sale: g ? spSaleName(g) : (k ? k.sale : '<span style="color:#8a93a3">' + (m.goodsId || '—') + '</span>'),
    std: std ? std : '<span style="color:#c0c4cc">未关联</span>',
    code: (g && g.code) || (k && k.code) || '—',
    spec: g ? spSpecText(g) : (k ? k.spec : '—'),
    cat: ((g && g.catPath) || '').split('/').slice(-1)[0] || (k ? k.cat : '—')
  };
}
// 纯文本品名（弹窗标题、趋势图标题用）
function spGoodsLabel(m) {
  var g = spGoodsById(m.goodsId);
  if (g) return spSaleName(g);
  var k = SP_GOOD_INFO[m.goodsId];
  return k ? k.sale : (m.goodsId || '—');
}
// 销售品名 = 门店商品名（可带品牌与俗称）；系统品名 = 关联的标准商品规范名
function spSaleName(g) { return g ? g.name : '—'; }
function spStdName(g) {
  if (!g) return '—';
  var s = (typeof gdStdOfGoods === 'function') ? gdStdOfGoods(g) : null;
  return s ? s.name : '<span style="color:#c0c4cc">未关联</span>';
}
// 规格：称重类（kg/L）显示「称重/单位」，标品显示「规格/单位」（与库存查询口径一致）
function spSpecText(g) {
  if (!g) return '—';
  if (g.unit === 'kg' || g.unit === 'l') return '称重/' + g.unit;
  return (g.spec ? g.spec : '—') + (g.unit ? '/' + g.unit : '');
}
/* ---------- 时间轴状态：按「今天」算，不依赖 status 字段 ----------
 * status 是手工标记，会与实际生效区间脱节（比如到了生效日没人去改它）。
 * 状态一律由 effFrom / effTo 与今天比较得出，保证「列表看到的」=「入库时真正取到的」。
 */
function spPriceToday() { return (typeof msInvToday === 'function') ? msInvToday() : ''; }
/* ---------- 列表 v1.20：商品聚合视图 ----------
 * 每行一个商品（按 goodsId+storeId 唯一），列展开「当前」+「下一段」两段数据；
 * 往期调价/换供应商记录在历史弹窗里看，趋势图看价格曲线。
 */
function spPriceInit() {
  var el = document.getElementById('supplyPriceContent');
  if (!el) { setTimeout(spPriceInit, 80); return; }
  if (typeof gdStdLoad === 'function' && (typeof GD_STD === 'undefined' || !GD_STD.length)) gdStdLoad();
  if (typeof invListLoad === 'function' && (typeof INV_GOODS === 'undefined' || !INV_GOODS.length)) invListLoad();
  if (typeof invEntryLoad === 'function' && (typeof INV_ENTRY === 'undefined' || !INV_ENTRY.length)) invEntryLoad();
  if (!SP_PRICE_STORE) SP_PRICE_STORE = (typeof msInvScopeStoreId === 'function') ? msInvScopeStoreId('S2001') : 'S2001';
  el.innerHTML =
    '<div style="flex-shrink:0;padding:10px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="font-size:12px;color:#3a4252">门店：</span><span style="position:relative;display:inline-flex;align-items:center;flex:0 1 190px">' +
        '<select id="spStore" onchange="spPriceSetStore(this.value)" style="width:100%;appearance:none;-webkit-appearance:none;padding:5px 24px 5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;color:#005cf5;background:#fff;outline:none;cursor:pointer"><option value="">全部门店</option>' + spStoreOpts(SP_PRICE_STORE) + '</select>' +
        '<span style="position:absolute;right:9px;font-size:10px;color:#8a93a3;pointer-events:none">▼</span></span>' +
      '<span style="font-size:12px;color:#3a4252">供应商：</span><span style="position:relative;display:inline-flex;align-items:center;flex:0 1 190px">' +
        '<select id="spSup" onchange="SP_PRICE_SUP=this.value;SP_PRICE_PAGE=1;spPriceRender()" style="width:100%;appearance:none;-webkit-appearance:none;padding:5px 24px 5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;color:#005cf5;background:#fff;outline:none;cursor:pointer"><option value="">全部供应商</option>' + spSupOpts(SP_PRICE_SUP) + '</select>' +
        '<span style="position:absolute;right:9px;font-size:10px;color:#8a93a3;pointer-events:none">▼</span></span>' +
      '<button class="ic-btn" onclick="spPriceReset()">重置</button>' +
      '<span style="flex:1"></span>' +
      '<button class="ic-btn" onclick="window.open(\'../prd.html?doc=\'+encodeURIComponent(\'采购定价模块需求说明\'),\'_blank\')" title="查看采购定价模块需求说明（PRD）">📋 需求说明</button>' +
      '<button class="ic-btn ic-btn-pri" onclick="spPriceOpenBatch()">批量添加</button>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0"><table style="min-width:1100px">' +
        '<thead><tr>' +
          '<th style="width:50px">序号</th>' +
          '<th style="width:110px">销售品名</th>' +
          '<th style="width:110px">系统品名</th>' +
          '<th style="width:110px">编码</th>' +
          '<th style="width:80px">规格</th>' +
          '<th style="width:90px">分类</th>' +
          '<th>当前定价（供应商 / 价格 / 生效起）</th>' +
          '<th>下一段（供应商 / 价格 / 生效日）</th>' +
          '<th style="width:140px">操作</th>' +
          '<th style="width:90px">门店</th>' +
        '</tr></thead>' +
        '<tbody id="spPriceBody"></tbody>' +
      '</table></div>' +
      '<div class="pagination-bar" id="spPricePager" style="flex-shrink:0"></div>' +
    '</div>';
  spPriceRender();
}
function spPriceSetStore(v) { SP_PRICE_STORE = v; SP_PRICE_PAGE = 1; spPriceRender(); }
function spPriceReset() { SP_PRICE_SUP = ''; SP_PRICE_PAGE = 1; spPriceInit(); }
/* 主表按 (goodsId+storeId) 唯一，状态由主表字段直接判断：
 *   current = 有当前价（supplier/price/effFrom 都有效）
 *   pending = 没当前价但有下一段（纯未来段：例如「已规划 10-01 起 ¥3.80 但当前还没生效」）
 *   empty   = 都没（罕见，应被前端筛掉） */
function spPriceRows() {
  return SP_PRICES.filter(function (m) {
    if (SP_PRICE_STORE && m.storeId !== SP_PRICE_STORE) return false;
    if (SP_PRICE_SUP) {
      // 供应商筛选匹配当前或下一段任一即可（按当前为空时不显示）
      if (m.supplier !== SP_PRICE_SUP && m.nextSupplier !== SP_PRICE_SUP) return false;
    }
    return true;
  }).sort(function (a, b) {
    if (a.goodsId !== b.goodsId) return a.goodsId < b.goodsId ? -1 : 1;
    return a.storeId < b.storeId ? -1 : (a.storeId > b.storeId ? 1 : 0);
  });
}
function spPriceRender() {
  var tbody = document.getElementById('spPriceBody'); if (!tbody) return;
  var rows = spPriceRows(), total = rows.length, pages = Math.ceil(total / SP_PRICE_SIZE) || 1;
  if (SP_PRICE_PAGE > pages) SP_PRICE_PAGE = pages; if (SP_PRICE_PAGE < 1) SP_PRICE_PAGE = 1;
  var start = (SP_PRICE_PAGE - 1) * SP_PRICE_SIZE, data = rows.slice(start, start + SP_PRICE_SIZE);
  tbody.innerHTML = data.length ? data.map(function (m, i) {
    // 商品信息一律走兜底（档案 → 内置目录），不因别的页面数据状态而变形
    var info = spGoodsInfo(m);
    var curCell = m.price ? spCurCell(m) : '<span style="color:#c0c4cc">— 未生效 —</span>';
    var nextCell = m.nextEffFrom ? spNextCell(m) : '<span style="color:#c0c4cc">— 未设置 —</span>';
    return '<tr>' +
      '<td style="text-align:center;color:#999">' + (start + i + 1) + '</td>' +
      '<td>' + info.sale + '</td>' +
      '<td style="color:#5b6472">' + info.std + '</td>' +
      '<td style="color:#5b6472">' + info.code + '</td>' +
      '<td style="color:#5b6472">' + info.spec + '</td>' +
      '<td style="color:#5b6472;font-size:11px">' + info.cat + '</td>' +
      '<td>' + curCell + '</td>' +
      '<td>' + nextCell + '</td>' +
      '<td>' + spOpCell(m) + '</td>' +
      '<td style="color:#5b6472">' + spStoreName(m.storeId) + '</td></tr>';
  }).join('') : '<tr><td colspan="10" style="text-align:center;color:#999;padding:36px 0">该门店暂无定价，新增后入库单才会校验价格</td></tr>';
  if (typeof msInvPager === 'function') msInvPager(total, SP_PRICE_PAGE, SP_PRICE_SIZE, 'spPricePager', 'spPriceGoPage');
}
function spCurCell(m) {
  return '<div style="font-weight:600;color:#0b1019">¥' + Number(m.price).toFixed(2) + '</div>' +
    '<div style="font-size:11px;color:#5b6472;margin-top:2px">' + m.supplier + '</div>' +
    '<div style="font-size:11px;color:#8a93a3">' + m.effFrom + ' 起</div>';
}
function spNextCell(m) {
  return '<div style="color:#d48806;font-weight:600">¥' + Number(m.nextPrice).toFixed(2) + '</div>' +
    '<div style="font-size:11px;color:#5b6472;margin-top:2px">' + m.nextSupplier + '</div>' +
    '<div style="font-size:11px;color:#d48806">' + m.nextEffFrom + ' 起</div>';
}
function spOpCell(m) {
  return     '<a style="color:#1677ff;cursor:pointer;margin-right:6px" onclick="spPriceOpenEdit(\'' + m.priceId + '\')">编辑</a>' +
    '<a style="color:#1677ff;cursor:pointer" onclick="spPriceOpenChart(\'' + m.priceId + '\')">趋势</a>';
}
function spPriceGoPage(p) { SP_PRICE_PAGE = p; spPriceRender(); }
function spPriceOpenChart(id) {
  spChartRender(id);
}
/* 趋势图：定价是「阶梯线」——每段定价从生效日起水平延续到下一段生效日（或今天），
 * 变价日竖直跳变（stepped），绝不把两个变价点斜线相连；今天之后到待生效日的延续段画虚线。
 * 叠加入库事件散点（菱形，位置=入库日/实际入库价）。横轴 = 变价日 ∪ 入库日 ∪ 今天。 */
var SP_CHART_INSTANCE = null;
// 日期 ↔ 毫秒时间戳：趋势图用 linear 轴按真实时间比例布点（分类轴会让 8 个月和 1 天等宽）
function spTs(d) { var t = new Date(d + 'T00:00:00'); return isNaN(t.getTime()) ? 0 : t.getTime(); }
function spFmtTs(ts) {
  var t = new Date(ts);
  var m = String(t.getMonth() + 1); if (m.length < 2) m = '0' + m;
  var dd = String(t.getDate()); if (dd.length < 2) dd = '0' + dd;
  return t.getFullYear() + '-' + m + '-' + dd;
}
function spChartRender(id) {
  var m = null;
  for (var i = 0; i < SP_PRICES.length; i++) if (SP_PRICES[i].priceId === id) m = SP_PRICES[i];
  if (!m) { alert('主表不存在'); return; }
  var g = spGoodsById(m.goodsId);
  // 价格段（升序）：历史段 + 当前段 + 待生效段。定价是阶梯函数——每段生效后一直延续到下一段，
  // 所以画图必须以「段」为单位，而不是只画变价点。
  var segs = [];
  SP_HISTORY.filter(function (h) { return h.goodsId === m.goodsId && h.storeId === m.storeId; })
    .forEach(function (h) { segs.push({ from: h.effFrom, price: h.price, supplier: h.supplier, kind: '历史' }); });
  if (m.price) segs.push({ from: m.effFrom, price: m.price, supplier: m.supplier, kind: '当前' });
  if (m.nextEffFrom) segs.push({ from: m.nextEffFrom, price: m.nextPrice, supplier: m.nextSupplier, kind: '待生效' });
  segs.sort(function (a, b) { return a.from < b.from ? -1 : (a.from > b.from ? 1 : 0); });
  var today = (typeof msInvToday === 'function') ? msInvToday() : '';
  // 某天的生效价 = 生效日时间戳 <= 该天的最后一段
  function segAtTs(ts) { var hit = null; for (var i = 0; i < segs.length; i++) if (spTs(segs[i].from) <= ts) hit = segs[i]; return hit; }
  // 入库事件散点：从入库单取该商品的实际入库记录（同店 + 同编码），点位置 = (入库日, 入库价)
  // 编码优先取商品档案，档案缺失时用内置目录——散点不受别的页面数据状态影响
  var gCode = (g && g.code) || (SP_GOOD_INFO[m.goodsId] || {}).code || '';
  var gName = spGoodsLabel(m);
  var entries = [];
  if (typeof INV_ENTRY !== 'undefined') {
    INV_ENTRY.forEach(function (e) {
      if (m.storeId && e.storeId !== m.storeId) return;
      (e.items || []).forEach(function (it) {
        if ((gCode && it.code === gCode) || it.name === gName) {
          entries.push({ x: e.date, price: Number(it.price), qty: it.qty, no: e.no, supplier: e.supplier });
        }
      });
    });
  }
  entries.sort(function (a, b) { return a.x < b.x ? -1 : (a.x > b.x ? 1 : 0); });
  // 供应商配色（按段首次出现顺序）
  var palette = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];
  var supplierNames = [];
  var supColor = {};
  segs.forEach(function (s) {
    if (!supColor[s.supplier]) { supColor[s.supplier] = palette[supplierNames.length % palette.length]; supplierNames.push(s.supplier); }
  });
  // 真实时间轴（linear + 毫秒值）：按日期实际间隔布点
  var hasFuture = !!(m.nextEffFrom && today && m.nextEffFrom > today);
  var todayTs = today ? spTs(today) : 0;
  // 折线点：每段 (生效日, 价) 水平延续到 (下一段生效日或今天, 价)，成对点在变价日形成竖直跳变；
  // 有待生效价时在「今天」插一个点，今天之后的延续段由 borderDash 画虚线
  var linePts = [];
  segs.forEach(function (s, i) {
    var p = Number(s.price), fTs = spTs(s.from);
    var next = segs[i + 1];
    var endTs = next ? spTs(next.from) : (todayTs > fTs ? todayTs : 0);
    linePts.push({ x: fTs, y: p });
    if (endTs && todayTs > fTs && todayTs < endTs) linePts.push({ x: todayTs, y: p });
    if (endTs) linePts.push({ x: endTs, y: p });
  });
  // 变价日圆点：只在 (x=生效日, y=该段价) 的点上画
  var changeMap = {};
  segs.forEach(function (s) { var t = spTs(s.from); if (!(t in changeMap)) changeMap[t] = s; });
  var entryPts = entries.map(function (e) { return { x: spTs(e.x), y: e.price }; });
  var datasets = [
    {
      label: '定价',
      data: linePts,
      borderColor: '#1677ff',
      borderWidth: 2,
      pointRadius: linePts.map(function (pt) {
        var s = changeMap[pt.x];
        return (s && pt.y === Number(s.price)) ? 5 : 0;
      }),
      pointHitRadius: linePts.map(function (pt) {
        var s = changeMap[pt.x];
        return (s && pt.y === Number(s.price)) ? 5 : 0;
      }),
      pointHoverRadius: 7,
      pointBackgroundColor: linePts.map(function (pt) {
        var s = changeMap[pt.x];
        return (s && pt.y === Number(s.price)) ? (supColor[s.supplier] || '#1677ff') : 'transparent';
      }),
      segment: {
        borderColor: function (ctx) {
          var s = segAtTs(linePts[ctx.p0DataIndex].x);
          return s ? (supColor[s.supplier] || '#1677ff') : '#1677ff';
        },
        borderDash: function (ctx) {
          return (hasFuture && todayTs && linePts[ctx.p0DataIndex].x >= todayTs) ? [6, 4] : undefined;
        }
      }
    },
    {
      label: '入库',
      data: entryPts,
      showLine: false,
      pointStyle: 'rectRot',
      pointRadius: 5, pointHoverRadius: 7,
      pointBackgroundColor: '#5b6472',
      pointBorderColor: '#5b6472'
    }
  ];
  var empty = segs.length === 0 && entries.length === 0;
  var keyHtml = supplierNames.map(function (sup) {
    return '<span style="margin-right:12px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + supColor[sup] + ';margin-right:4px;vertical-align:middle"></span>' + sup + '</span>';
  }).join('');
  var body =
    '<div style="font-size:12px;color:#5b6472;margin-bottom:10px">' +
      '<b style="color:#0b1019">' + spGoodsLabel(m) + '</b>' +
      '（' + spGoodsInfo(m).std + '　' + spGoodsInfo(m).code + '　' + spStoreName(m.storeId) + '）' +
      '　' + keyHtml +
    '</div>' +
    (empty
      ? '<div style="padding:60px 0;text-align:center;color:#999;font-size:12px">暂无定价与入库记录，无趋势可绘</div>'
      : '<div style="position:relative;height:380px"><canvas id="spChartCanvas"></canvas></div>');
  if (typeof msInvModal === 'function') {
    msInvModal({ title: '价格趋势 · ' + spGoodsLabel(m), width: 'min(820px,94vw)', body: body, okText: '关闭', onOk: 'spChartClose()' });
  } else { alert('弹窗组件未加载'); return; }
  if (empty) return;
  setTimeout(function () {
    var canvas = document.getElementById('spChartCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    if (SP_CHART_INSTANCE) { SP_CHART_INSTANCE.destroy(); SP_CHART_INSTANCE = null; }
    SP_CHART_INSTANCE = new Chart(canvas, {
      type: 'line',
      data: { datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: true },
        scales: {
          x: { type: 'linear',
               ticks: { callback: function (v) { return spFmtTs(v); }, maxTicksLimit: 8, font: { size: 12 } },
               title: { display: true, text: '日期', font: { size: 12 } } },
          y: { title: { display: true, text: '价格 (元)', font: { size: 12 } },
               ticks: { callback: function (v) { return '¥' + Number(v).toFixed(2); } } }
        },
        plugins: {
          tooltip: { callbacks: {
              title: function (items) { return items.length ? spFmtTs(items[0].parsed.x) : ''; },
              label: function (ctx) {
                if (ctx.datasetIndex === 1) {
                  var e = entries[ctx.dataIndex];
                  return e ? '入库 ' + (e.qty || '?') + ' × ¥' + e.price.toFixed(2) + '（' + (e.no || '') + '）' : '';
                }
                var pt = linePts[ctx.dataIndex], s = changeMap[pt.x];
                if (s) return s.supplier + '（' + s.kind + '）：¥' + Number(s.price).toFixed(2);
                return '定价延续：¥' + Number(ctx.parsed.y).toFixed(2);
              }
            } },
          legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12 } }
        }
      }
    });
  }, 50);
}
function spChartClose() {
  if (SP_CHART_INSTANCE) { SP_CHART_INSTANCE.destroy(); SP_CHART_INSTANCE = null; }
  if (typeof msInvCloseModal === 'function') msInvCloseModal();
}
// 日期减一天（用于把旧价的 effTo 收到新价生效的前一天，区间不留缝也不重叠）
function spPrevDay(d) {
  if (!d) return d;
  var t = new Date(d + 'T00:00:00');
  if (isNaN(t.getTime())) return d;
  t.setDate(t.getDate() - 1);
  var m = String(t.getMonth() + 1); if (m.length < 2) m = '0' + m;
  var dd = String(t.getDate()); if (dd.length < 2) dd = '0' + dd;
  return t.getFullYear() + '-' + m + '-' + dd;
}
/* 调价前归档：把当前段写一条历史（不可变），主表字段后续由调用方更新。
 * closedBy: '调价'（同供应商改价）|'换供应商'|'停用'（删除时调用）
 * 调用方传入的 newEffFrom 是新段的生效起；如果不传，默认用今天。
 * 如果新段也是同一供应商（同价调价），closedAt 仍是 newEffFrom 前一天；
 * 如果新段不同供应商（换供应商），closedAt 也是 newEffFrom 前一天——切换点明确。*/
function spPriceArchive(master, closedBy, newEffFrom) {
  if (!master || !master.price) return;
  var closedAt = newEffFrom || (typeof msInvToday === 'function') ? msInvToday() : '';
  if (closedAt && master.effFrom && closedAt <= master.effFrom) {
    // 新段生效日 ≤ 当前段生效起 = 错误时序，不归档（让调用方决定怎么处理）
    return;
  }
  SP_HISTORY.unshift({
    historyId: 'PH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
    priceId: master.priceId, goodsId: master.goodsId, storeId: master.storeId, supplier: master.supplier,
    price: master.price, effFrom: master.effFrom, effTo: spPrevDay(closedAt),
    closedBy: closedBy, closedAt: closedAt, operator: (typeof CURRENT_USER_NAME !== 'undefined' && CURRENT_USER_NAME) || ''
  });
  spHistoryPersist();
}
function spPriceDel(id) {
  if (!confirm('确认删除该定价？删除后相关商品入库将按「未定价」规则处理；当前段会保留可查。')) return false;
  // 删除前归档当前段（保留历史可追溯）
  var today = (typeof msInvToday === 'function') ? msInvToday() : '';
  for (var i = 0; i < SP_PRICES.length; i++) {
    if (SP_PRICES[i].priceId === id && SP_PRICES[i].price) {
      spPriceArchive(SP_PRICES[i], '停用', today);
    }
  }
  SP_PRICES = SP_PRICES.filter(function (p) { return p.priceId !== id; });
  spPersist(); spPriceRender();
  return true;
}
/* 编辑主表（新增入口已砍：新增统一走「批量添加」）。
 * 新 supplier != 旧 supplier = 换供应商，旧段写历史。 */
function spPriceOpenEdit(id) {
  var m = null;
  for (var i = 0; i < SP_PRICES.length; i++) if (SP_PRICES[i].priceId === id) m = SP_PRICES[i];
  if (!m) { alert('主表不存在'); return; }
  var initial = m;
  var goodsOpts = '', gFound = false;
  if (typeof INV_GOODS !== 'undefined') {
    INV_GOODS.forEach(function (g) {
      var std = (typeof gdStdOfGoods === 'function') ? gdStdOfGoods(g) : null;
      var label = g.name + (std && std.name !== g.name ? '（' + std.name + '）' : '') + '　' + (g.code || '');
      if (initial.goodsId === g.goodsId) gFound = true;
      goodsOpts += '<option value="' + g.goodsId + '"' + (initial.goodsId === g.goodsId ? ' selected' : '') + '>' + label + '</option>';
    });
  }
  // 档案里没有这个商品时补一条占位选项：否则下拉会回落到第一项，保存时把商品改错（跨页面数据不一致的隐患）
  if (!gFound) {
    var k = SP_GOOD_INFO[initial.goodsId];
    goodsOpts = '<option value="' + initial.goodsId + '" selected>' +
      (k ? k.sale + '　' + k.code : (initial.goodsId || '—')) + '（不在商品档案，按原值保留）</option>' + goodsOpts;
  }
  var body =
    '<div style="font-size:12px;color:#5b6472;margin-bottom:10px">一个商品在一店一条主表。改价或换供应商 = 旧段写历史、主表更新。</div>' +
    '<div style="display:grid;grid-template-columns:88px 1fr;gap:10px 12px;align-items:center;font-size:12px">' +
      '<span style="color:#5b6472">商品</span><span><select id="spEditRef" disabled style="width:340px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;background:#fff">' + goodsOpts + '</select></span>' +
      '<span style="color:#5b6472">门店</span><span><select id="spEditStore" disabled style="width:340px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;background:#fff">' + spStoreOpts(initial.storeId) + '</select></span>' +
      '<span style="color:#5b6472">供应商</span><span><input id="spEditSup" list="spSupList" value="' + initial.supplier + '" style="width:340px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px" placeholder="默认延续当前供应商，改了即换供应商">' +
        '<datalist id="spSupList">' + spSupOpts('') + '</datalist></span>' +
      '<span style="color:#5b6472">当前价(元)</span><span><input id="spEditPrice" type="number" step="0.01" value="' + (initial.price || '') + '" style="width:160px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px">' +
        '<span style="color:#8a93a3;margin-left:8px">原价 ¥' + Number(initial.price).toFixed(2) + '（' + initial.supplier + ' · ' + initial.effFrom + ' 起）</span></span>' +
      '<span style="color:#5b6472">生效日期</span><span><input id="spEditFrom" type="date" value="' + (initial.effFrom || '') + '" style="width:160px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px"></span>' +
    '</div>' +
    '<div style="margin-top:12px;padding:8px 12px;background:#f7f9fc;border-radius:4px;font-size:12px;color:#5b6472">' +
      '<b>下一段</b>（可空）：提前填好未来某天启用，<b>到期前不会生效</b>，到点自动切换。' +
      '<div style="display:grid;grid-template-columns:88px 1fr;gap:10px 12px;align-items:center;margin-top:8px">' +
        '<span style="color:#5b6472">下一供应商</span><input id="spEditNextSup" list="spSupList" value="' + (initial.nextSupplier || initial.supplier || '') + '" style="width:340px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px" placeholder="默认延续当前供应商">' +
        '<span style="color:#5b6472">下一价(元)</span><input id="spEditNextPrice" type="number" step="0.01" value="' + (initial.nextPrice || '') + '" style="width:160px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px">' +
        '<span style="color:#5b6472">下一起效日</span><input id="spEditNextFrom" type="date" value="' + (initial.nextEffFrom || '') + '" style="width:160px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px">' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:14px;display:flex;justify-content:flex-end;border-top:1px solid #f0f2f5;padding-top:12px">' +
      '<button class="ic-btn" style="color:#fc4b52" onclick="if(spPriceDel(\'' + id + '\')) msInvCloseModal()">删除（写历史）</button>' +
    '</div>';
  if (typeof msInvModal === 'function') {
    msInvModal({ title: '编辑定价 · ' + spGoodsLabel(initial), width: 'min(720px,94vw)', body: body, onOk: 'spPriceSave(\'' + id + '\')', okText: '保存', cancelText: '取消' });
  } else { alert('弹窗组件未加载'); }
}
function spPriceSave(id) {
  var goodsId = (document.getElementById('spEditRef') || {}).value || '';
  var storeId = (document.getElementById('spEditStore') || {}).value || SP_PRICE_STORE;
  var supplier = (document.getElementById('spEditSup') || {}).value || '';
  var price = parseFloat((document.getElementById('spEditPrice') || {}).value);
  var effFrom = (document.getElementById('spEditFrom') || {}).value || (typeof msInvToday === 'function' ? msInvToday() : '');
  var nextSupplier = (document.getElementById('spEditNextSup') || {}).value || '';
  var nextPrice = parseFloat((document.getElementById('spEditNextPrice') || {}).value);
  var nextEffFrom = (document.getElementById('spEditNextFrom') || {}).value || '';
  if (!goodsId) { alert('请选择商品'); return; }
  if (!supplier) { alert('请填写当前供应商'); return; }
  if (isNaN(price) || price < 0) { alert('请填写有效的当前价'); return; }
  if (nextEffFrom && (!nextSupplier || isNaN(nextPrice))) {
    alert('设了下一段生效日就必须填供应商和价格'); return;
  }
  var today = (typeof msInvToday === 'function') ? msInvToday() : '';
  if (nextEffFrom && nextEffFrom <= today) { alert('下一段生效日必须晚于今天（已生效的去改当前段）'); return; }
  if (effFrom > nextEffFrom && nextEffFrom) { alert('当前段生效起不能晚于下一段生效日'); return; }
  var who = (typeof CURRENT_USER_NAME !== 'undefined' && CURRENT_USER_NAME) || '当前用户';
  var now = new Date().toLocaleString('zh-CN');
  // 找主表
  var m = null;
  for (var i = 0; i < SP_PRICES.length; i++) {
    if (id && SP_PRICES[i].priceId === id) { m = SP_PRICES[i]; break; }
    if (!id && SP_PRICES[i].goodsId === goodsId && SP_PRICES[i].storeId === storeId) { m = SP_PRICES[i]; break; }
  }
  if (!m) {
    // 新建主表
    m = { priceId: 'SP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
          goodsId: goodsId, storeId: storeId,
          supplier: supplier, price: price, effFrom: effFrom,
          nextSupplier: nextEffFrom ? nextSupplier : '', nextPrice: nextEffFrom ? nextPrice : '', nextEffFrom: nextEffFrom,
          updatedBy: who, updatedAt: now };
    SP_PRICES.unshift(m);
  } else {
    // 编辑主表：旧段写历史
    if (m.supplier !== supplier) {
      spPriceArchive(m, '换供应商', effFrom);
      // 换供应商时旧 supplier 的 next 段也一并归档（避免取价时还命中旧 next）
      if (m.nextEffFrom) {
        SP_HISTORY.unshift({
          historyId: 'PH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
          priceId: m.priceId, goodsId: m.goodsId, storeId: m.storeId, supplier: m.nextSupplier,
          price: m.nextPrice, effFrom: m.nextEffFrom, effTo: spPrevDay(effFrom) || '9999-12-31',
          closedBy: '换供应商(连带)', closedAt: effFrom, operator: who
        });
        spHistoryPersist();
      }
    } else if (Number(m.price) !== price) {
      spPriceArchive(m, '调价', effFrom);
    }
    m.supplier = supplier; m.price = price; m.effFrom = effFrom;
    m.nextSupplier = nextEffFrom ? nextSupplier : '';
    m.nextPrice = nextEffFrom ? nextPrice : '';
    m.nextEffFrom = nextEffFrom;
    m.updatedBy = who; m.updatedAt = now;
  }
  spPersist();
  if (typeof msInvCloseModal === 'function') msInvCloseModal();
  spPriceRender();
}

/* ================================================================
 * 批量添加：勾选多个商品 → 一次建多条商品级定价
 * 存在意义：替代被废弃的「分类定价」——多个商品同价（如 4 种白菜统货价）
 * 用批量勾选实现，落库仍是每条商品一条，取价时精确匹配，不用跑继承降级。
 * ================================================================ */
function spBatchCurrentPrice(gid, storeId) {
  // 主表模型下，按 (goodsId+storeId) 唯一查，与供应商无关
  for (var i = 0; i < SP_PRICES.length; i++) {
    var m = SP_PRICES[i];
    if (m.goodsId !== gid || m.storeId !== storeId) continue;
    if (m.price) return m;
    if (m.nextEffFrom) return m; // 纯未来段也算"已规划"
  }
  return null;
}
function spBatchCatOpts() {
  var set = {}, out = [];
  if (typeof INV_GOODS !== 'undefined') {
    INV_GOODS.forEach(function (g) { if (g.catPath && !set[g.catPath]) { set[g.catPath] = 1; out.push(g.catPath); } });
  }
  out.sort();
  return '<option value="">全部分类</option>' + out.map(function (c) {
    return '<option value="' + c + '"' + (SP_BATCH.cat === c ? ' selected' : '') + '>' + c + '</option>';
  }).join('');
}
function spBatchGoods() {
  var b = SP_BATCH;
  var arr = (typeof INV_GOODS !== 'undefined') ? INV_GOODS : [];
  return arr.filter(function (g) {
    if (b.cat && g.catPath !== b.cat) return false;
    if (b.kw) {
      var s = (g.name + (g.code || '') + (g.catPath || '')).toLowerCase();
      if (s.indexOf(b.kw.toLowerCase()) < 0) return false;
    }
    return true;
  });
}
function spBatchCount() {
  var n = 0, priced = 0;
  for (var k in SP_BATCH.sel) {
    n++;
    var v = parseFloat(SP_BATCH.sel[k]);
    if (!isNaN(v) && v >= 0) priced++;
  }
  var el = document.getElementById('spBatchCount');
  if (el) el.innerHTML = '已选 <b style="color:#1a2233">' + n + '</b> 个商品' + (n && priced < n ? '（<span style="color:#d48806">' + (n - priced) + ' 个未填价</span>）' : '');
}
function spBatchRows() {
  var wrap = document.getElementById('spBatchRows');
  if (!wrap) return;
  var list = spBatchGoods(), b = SP_BATCH;
  wrap.innerHTML = list.length ? list.map(function (g) {
    var std = (typeof gdStdOfGoods === 'function') ? gdStdOfGoods(g) : null;
    var cur = spBatchCurrentPrice(g.goodsId, b.storeId);
    // 勾选态以 key 是否存在为准（空串 = 已勾未填价），不能用真值判断，否则勾选立即"弹回"
    var sel = (g.goodsId in b.sel);
    return '<tr' + (sel ? ' style="background:#f5f9ff"' : '') + '>' +
      '<td style="text-align:center"><input type="checkbox" ' + (sel ? 'checked' : '') +
        ' onchange="spBatchToggle(\'' + g.goodsId + '\',this.checked)" style="width:14px;height:14px"></td>' +
      '<td>' + g.name + '</td>' +
      '<td style="color:#5b6472">' + (std ? std.name : '<span style="color:#c0c4cc">未关联</span>') + '</td>' +
      '<td style="color:#5b6472">' + (g.code || '—') + '</td>' +
      '<td style="color:#5b6472">' + spSpecText(g) + '</td>' +
      '<td style="color:#5b6472;font-size:11px">' + (g.catPath || '—') + '</td>' +
      '<td style="text-align:right;color:' + (cur ? '#d48806' : '#c0c4cc') + '">' + (cur ? '¥' + Number(cur.price).toFixed(2) : '—') + '</td>' +
      '<td><input type="number" step="0.01" id="bp_' + g.goodsId + '" value="' + (b.sel[g.goodsId] || '') + '"' +
        ' oninput="spBatchInput(\'' + g.goodsId + '\',this)" placeholder="0.00"' +
        ' style="width:88px;height:28px;padding:0 6px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;text-align:right"></td>' +
      '</tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px 0">没有符合条件的商品</td></tr>';
  spBatchCount();
}
// 填写本次定价 = 自动勾选（填价却不勾会在保存时被静默跳过，逻辑上不该出现）
function spBatchInput(gid, el) {
  SP_BATCH.sel[gid] = el.value;
  var cb = el.parentNode.parentNode.querySelector('input[type=checkbox]');
  if (cb) cb.checked = true;
  spBatchCount();
}
function spBatchToggle(gid, on) {
  if (on) {
    var inp = document.getElementById('bp_' + gid);
    if (!SP_BATCH.sel[gid] && inp && inp.value) SP_BATCH.sel[gid] = inp.value;
    else if (!SP_BATCH.sel[gid]) SP_BATCH.sel[gid] = '';
  } else {
    delete SP_BATCH.sel[gid];
  }
  spBatchRows();
}
function spBatchSelAll(on) {
  var list = spBatchGoods();
  list.forEach(function (g) {
    if (on) { if (!SP_BATCH.sel[g.goodsId]) SP_BATCH.sel[g.goodsId] = ''; }
    else delete SP_BATCH.sel[g.goodsId];
  });
  spBatchRows();
}
// 统一价：填入所有已勾选商品（未勾选的不动），直接改 DOM 值避免重绘丢焦点
function spBatchFill() {
  var v = (document.getElementById('spBatchAllPrice') || {}).value;
  var fv = parseFloat(v);
  if (v === '' || isNaN(fv) || fv < 0) { alert('请先填写有效的统一价'); return; }
  var n = 0;
  for (var gid in SP_BATCH.sel) {
    n++;
    SP_BATCH.sel[gid] = v;
    var inp = document.getElementById('bp_' + gid);
    if (inp) inp.value = v;
  }
  if (!n) { alert('请先勾选商品'); return; }
  spBatchCount();
}
function spPriceOpenBatch() {
  SP_BATCH = {
    supplier: '', storeId: SP_PRICE_STORE || 'S2001',
    effFrom: (typeof msInvToday === 'function' ? msInvToday() : ''),
    sel: {}, kw: '', cat: ''
  };
  var body =
    '<div style="font-size:12px;color:#5b6472;margin-bottom:10px">勾选多个商品批量定价；同价可用「统一价填充」，也可逐个改。<b>已有当前定价的商品会标黄</b>，保存时旧价自动闭合，历史价保留可查。<b>生效日期晚于今天 = 待生效</b>（只写下一段，当前价不动）。</div>' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;padding-bottom:10px;border-bottom:1px solid #eef1f6">' +
      '<span style="color:#5b6472">门店</span><span style="position:relative;display:inline-flex;align-items:center">' +
        '<select id="spBatchStore" onchange="SP_BATCH.storeId=this.value;SP_BATCH.sel={};spBatchRows()"' +
        ' style="appearance:none;-webkit-appearance:none;padding:5px 24px 5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;color:#005cf5;background:#fff;outline:none;max-width:180px;cursor:pointer">' + spStoreOpts(SP_BATCH.storeId) + '</select>' +
        '<span style="position:absolute;right:9px;font-size:10px;color:#8a93a3;pointer-events:none">▼</span></span>' +
      '<span style="color:#dfe3ed;font-weight:300;user-select:none">&gt;</span>' +
      '<span style="color:#5b6472">供应商</span><span style="position:relative;display:inline-flex;align-items:center">' +
        '<input id="spBatchSup" list="spSupList2" value="" onchange="SP_BATCH.supplier=this.value;spBatchRows()"' +
        ' style="appearance:none;-webkit-appearance:none;padding:5px 24px 5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;color:#005cf5;background:#fff;outline:none;min-width:130px" placeholder="选择供应商">' +
        '<span style="position:absolute;right:9px;font-size:10px;color:#8a93a3;pointer-events:none">▼</span>' +
        '<datalist id="spSupList2">' + spSupOpts('') + '</datalist></span>' +
      '<span style="color:#5b6472">生效日期</span><input id="spBatchFrom" type="date" value="' + SP_BATCH.effFrom + '" onchange="SP_BATCH.effFrom=this.value"' +
        ' style="width:150px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px">' +
      '<span style="flex:1"></span>' +
      '<span style="color:#5b6472">统一价</span><input id="spBatchAllPrice" type="number" step="0.01" placeholder="0.00"' +
        ' style="width:88px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;text-align:right">' +
      '<button class="ic-btn" onclick="spBatchFill()">填充到已选</button>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;font-size:12px">' +
      '<select onchange="SP_BATCH.cat=this.value;spBatchRows()" style="width:220px;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px;background:#fff">' + spBatchCatOpts() + '</select>' +
      '<input id="spBatchKw" value="" oninput="SP_BATCH.kw=this.value;spBatchRows();var e=document.getElementById(\'spBatchKw\');e.focus();e.value=SP_BATCH.kw"' +
        ' placeholder="搜索品名 / 编码 / 分类" style="flex:1;height:30px;padding:0 8px;border:1px solid #e8e8e8;border-radius:4px;font-size:12px">' +
      '<button class="ic-btn" onclick="spBatchSelAll(true)">全选</button>' +
      '<button class="ic-btn" onclick="spBatchSelAll(false)">清空</button>' +
      '<span id="spBatchCount" style="color:#5b6472"></span>' +
    '</div>' +
    '<div style="height:340px;overflow:auto;border:1px solid #e9eef7;border-radius:4px;background:#fff"><table style="width:100%">' +
      '<thead><tr><th style="width:44px"></th><th>销售品名</th><th>系统品名</th><th style="width:110px">编码</th><th style="width:80px">规格</th><th>分类</th><th style="width:90px">当前定价</th><th style="width:100px">本次定价</th></tr></thead>' +
      '<tbody id="spBatchRows"></tbody>' +
    '</table></div>';
  if (typeof msInvModal === 'function') {
    msInvModal({ title: '批量添加采购定价', width: 'min(960px,94vw)', body: body, onOk: 'spPriceSaveBatch()', okText: '保存', cancelText: '取消' });
  } else { alert('弹窗组件未加载'); return; }
  spBatchRows();
}
function spPriceSaveBatch() {
  var b = SP_BATCH;
  if (!b) return;
  var sup = (document.getElementById('spBatchSup') || {}).value || b.supplier;
  var storeId = (document.getElementById('spBatchStore') || {}).value || b.storeId;
  var effFrom = (document.getElementById('spBatchFrom') || {}).value || b.effFrom ||
    ((typeof msInvToday === 'function') ? msInvToday() : '');
  if (!sup) { alert('请填写供应商'); return; }
  var ok = [], skip = 0;
  for (var gid in b.sel) {
    var v = parseFloat(b.sel[gid]);
    if (isNaN(v) || v < 0) { skip++; continue; }
    ok.push({ gid: gid, price: v });
  }
  if (!ok.length) { alert(skip ? '已勾选的商品都没有填写定价' : '请先勾选商品并填写定价'); return; }
  if (skip && !confirm('有 ' + skip + ' 个已勾选商品未填价，将跳过。继续保存 ' + ok.length + ' 条？')) return;
  var who = (typeof CURRENT_USER_NAME !== 'undefined' && CURRENT_USER_NAME) || '当前用户';
  var now = new Date().toLocaleString('zh-CN');
  var today = (typeof msInvToday === 'function') ? msInvToday() : '';
  ok.forEach(function (it) {
    var m = null;
    for (var i = 0; i < SP_PRICES.length; i++) {
      if (SP_PRICES[i].goodsId === it.gid && SP_PRICES[i].storeId === storeId) { m = SP_PRICES[i]; break; }
    }
    var isFuture = today && effFrom > today;
    if (!m && isFuture) {
      // 新商品 + 未来生效日：只建「待生效」主表（纯下一段），当前价保持为空
      m = { priceId: 'SP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
            goodsId: it.gid, storeId: storeId,
            supplier: '', price: '', effFrom: '',
            nextSupplier: sup, nextPrice: it.price, nextEffFrom: effFrom,
            updatedBy: who, updatedAt: now };
      SP_PRICES.unshift(m);
    } else if (!m) {
      // 新商品 + 今天/过去生效日：直接建当前价
      m = { priceId: 'SP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
            goodsId: it.gid, storeId: storeId, supplier: sup, price: it.price, effFrom: effFrom,
            nextSupplier: '', nextPrice: '', nextEffFrom: '',
            updatedBy: who, updatedAt: now };
      SP_PRICES.unshift(m);
    } else if (isFuture) {
      // 已有主表 + 未来生效日：只写下一段（待生效），当前段不动、不归档
      m.nextSupplier = sup; m.nextPrice = it.price; m.nextEffFrom = effFrom;
      m.updatedBy = who; m.updatedAt = now;
    } else {
      // 已有主表 + 今天/过去生效日：旧段写历史 + 主表更新（同步处理"换供应商连带 next"）
      if (m.supplier !== sup) {
        spPriceArchive(m, '换供应商', effFrom);
        if (m.nextEffFrom) {
          SP_HISTORY.unshift({
            historyId: 'PH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
            priceId: m.priceId, goodsId: m.goodsId, storeId: m.storeId, supplier: m.nextSupplier,
            price: m.nextPrice, effFrom: m.nextEffFrom, effTo: spPrevDay(effFrom) || '9999-12-31',
            closedBy: '换供应商(连带)', closedAt: effFrom, operator: who
          });
          spHistoryPersist();
        }
      } else if (Number(m.price) !== it.price) {
        spPriceArchive(m, '调价', effFrom);
      }
      m.supplier = sup; m.price = it.price; m.effFrom = effFrom;
      m.nextSupplier = ''; m.nextPrice = ''; m.nextEffFrom = '';
      m.updatedBy = who; m.updatedAt = now;
    }
  });
  spPersist();
  if (typeof msInvCloseModal === 'function') msInvCloseModal();
  SP_PRICE_STORE = storeId;
  spPriceRender();
}

/* ================================================================
 * 页面 2：价格审批（pages/price-approval.html）
 * 入库价格异常（15）+ 待入库审核（25）+ 低价知会
 * 注：调价单不进审批队列——调价人员具有调价权限，暂不设置调价审批流程（2026-09-12 定）
 * ================================================================ */
var INV_APPR_TAB = 'entry';
function invApprInit() {
  var el = document.getElementById('priceApprovalContent');
  if (!el) { setTimeout(invApprInit, 80); return; }
  if (typeof invEntryLoad === 'function') invEntryLoad();
  el.innerHTML =
    '<div style="flex-shrink:0;padding:8px 20px;background:#fff;border-bottom:1px solid #dfe3ed;display:flex;align-items:center;gap:10px">' +
      '<div class="segment" id="invApprTabs">' +
        '<button class="segment-btn' + (INV_APPR_TAB === 'entry' ? ' active' : '') + '" onclick="invApprTab(\'entry\')">入库审批</button>' +
        '<button class="segment-btn' + (INV_APPR_TAB === 'notice' ? ' active' : '') + '" onclick="invApprTab(\'notice\')">低价知会</button>' +
      '</div>' +
      '<button class="ic-btn" style="margin-left:10px" onclick="invDemoReset()" title="清除全部入库单与知会，重新注入演示单据">↺ 重置演示数据</button>' +
      '<button class="ic-btn" style="margin-left:6px" onclick="window.open(\'../prd.html?doc=\'+encodeURIComponent(\'价格审批模块需求说明\'),\'_blank\')" title="查看价格审批模块需求说明（PRD）">📋 需求说明</button>' +
      '<button class="ic-btn" style="margin-left:6px" onclick="invAuditOpen()" title="设置入库审核的开启与审核人员">⚙ 审核设置</button>' +
      '<span style="flex:1"></span><span style="font-size:12px;color:#8a93a3">系统规则优先于人工：配成「禁止入库」的单不会被审批放行；人工只在规则允许的范围内决定</span>' +
    '</div>' +
    '<div style="flex:1;min-height:0;margin:10px 10px 4px;background:#fff;border-radius:4px;display:flex;flex-direction:column;border:1px solid #e9eef7;overflow:hidden">' +
      '<div class="table-wrap" style="flex:1;overflow:auto;min-height:0" id="invApprWrap"></div>' +
    '</div>';
  invApprRender();
}
function invApprTab(t) { INV_APPR_TAB = t; invApprInit(); }
function invApprRender() {
  var wrap = document.getElementById('invApprWrap'); if (!wrap) return;
  if (INV_APPR_TAB === 'notice') return invApprRenderNotice(wrap);
  var rows = (typeof INV_ENTRY !== 'undefined' ? INV_ENTRY : []).filter(function (r) { return String(r.status) === '15' || String(r.status) === '25'; });
  if (!rows.length) { wrap.innerHTML = '<div style="text-align:center;color:#999;padding:60px 0;font-size:13px">暂无待审批的入库单</div>'; return; }
  wrap.innerHTML = '<table style="min-width:1180px"><thead><tr>' +
    '<th style="width:56px">序号</th><th style="width:170px">入库单号</th><th style="width:110px">日期</th><th style="width:150px">门店</th><th style="width:150px">供应商</th>' +
    '<th style="width:110px">波动</th><th style="width:100px">状态</th><th style="width:120px">审核人</th><th>异常说明</th><th style="width:260px">操作</th></tr></thead><tbody>' +
    rows.map(function (r, i) {
      var chk = (typeof msSupplyCheckEntry === 'function') ? msSupplyCheckEntry(r) : { blocks: [] };
      var why = chk.blocks.length ? chk.blocks.map(function (b) { return b.name + '：' + b.why; }).join('；')
        : (String(r.status) === '25' ? '<span style="color:#5b6472">价格正常</span>' : '<span style="color:#d48806">按当前定价已无异常，可直接批准</span>');
      return '<tr>' +
        '<td style="text-align:center;color:#999">' + (i + 1) + '</td>' +
        '<td><a style="color:#1677ff;cursor:pointer" onclick="invEntryOpenView(\'' + r.no + '\')">' + r.no + '</a></td>' +
        '<td>' + r.date + '</td><td>' + spStoreName(r.storeId) + '</td><td>' + r.supplier + '</td>' +
        '<td style="text-align:right">' + (typeof invEntryFluctCell === 'function' ? invEntryFluctCell(r) : '—') + '</td>' +
        '<td>' + (typeof msInvEntryStatusBadge === 'function' ? msInvEntryStatusBadge(r.status) : r.status) + '</td>' +
        '<td style="color:#5b6472;font-size:12px">' + (r.approver || '—') + '</td>' +
        '<td style="color:#f56c6c;font-size:12px">' + why + '</td>' +
        '<td><a style="color:#1677ff;cursor:pointer;margin-right:10px" onclick="invEntryApproveAsIs(\'' + r.no + '\')">按入库价批准</a>' +
        '<a style="color:#1677ff;cursor:pointer;margin-right:10px" onclick="invEntryApprovePrice(\'' + r.no + '\')">仅本次改价</a>' +
        '<a style="color:#8a93a3;cursor:pointer;margin-right:10px" onclick="invEntryReject(\'' + r.no + '\')">驳回</a>' +
        '<a style="color:#fc4b52;cursor:pointer" onclick="invEntryRefuse(\'' + r.no + '\')">拒收</a></td></tr>';
    }).join('') + '</tbody></table>';
}
function invApprRenderNotice(wrap) {
  if (!SP_NOTICES.length) { wrap.innerHTML = '<div style="text-align:center;color:#999;padding:60px 0;font-size:13px">暂无低价知会</div>'; return; }
  wrap.innerHTML = '<table style="min-width:1000px"><thead><tr>' +
    '<th style="width:56px">序号</th><th style="width:170px">入库单号</th><th style="width:150px">门店</th><th style="width:150px">供应商</th><th>商品</th>' +
    '<th style="width:100px">定价</th><th style="width:100px">实收价</th><th style="width:110px">差异</th><th style="width:120px">状态</th></tr></thead><tbody>' +
    SP_NOTICES.map(function (n, i) {
      return '<tr><td style="text-align:center;color:#999">' + (i + 1) + '</td><td>' + n.no + '</td><td>' + spStoreName(n.storeId) + '</td><td>' + n.supplier + '</td><td>' + n.name + '</td>' +
        '<td style="text-align:right">' + (n.refPrice != null ? spMoney(n.refPrice) : '—') + '</td>' +
        '<td style="text-align:right">' + spMoney(n.price) + '</td>' +
        '<td style="text-align:right;color:#d48806">' + (n.skip ? '未纳入定价' : (n.diff > 0 ? '+' : '') + n.diff.toFixed(2)) + '</td>' +
        '<td>' + (String(n.status) === '10' ? '<span style="color:#f56c6c">待处理</span>' : '<span style="color:#67c23a">已处理</span>') + '</td></tr>';
    }).join('') + '</tbody></table>';
}

spLoad();
