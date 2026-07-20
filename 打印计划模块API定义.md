# 打印计划模块 接口定义（API）

> 本文档定义打印计划模块的数据结构与接口契约，与《打印计划模块需求说明》配套使用：需求背景、功能交互、业务规则见需求说明文档；本文档聚焦数据模型与接口规范。
> 字段命名对齐现有 `/mnmart` 接口体系（小驼峰）。凡现有接口已定义的字段（商品 `goods*`、门店 `shop*`、批次 `batchNo/productionDate` 等）一律沿用，不重新发明。

---

## 0. 配套说明

- **需求侧文档**：《打印计划模块需求说明》（背景、用户场景、功能交互、业务规则、名词解释）。
- **演示态说明**：当前 MVP 为前端演示态，采用前端内置浏览器端 Mock（无需后端）；同时提供 GitHub Pages 托管的线上静态 JSON Mock 供其他技术人员调试（详见 §14）。
- **字段命名映射**：前端演示态为前端友好采用简化命名，与后端原生字段一一映射，详见 §6.5、§6.6 注。

---

## 6. 数据结构

### 6.1 实体关系
```
Shop(门店) 1─* PrintPlan(打印计划) 1─* PlanItem(计划项)
Goods(商品主数据,mart体系) 1─* Batch(批次,复用库存批次)
Template(价签模板,前端渲染概念) 1─* PlanItem(打印时引用)
```

### 6.2 门店 `Shop`（复用现有）
| 字段 | 类型 | 说明 | 来源 |
| --- | --- | --- | --- |
| `shopId` | string | 门店 ID | `POST /mnmart/shop/list` |
| `shopName` | string | 门店名称 | 同上 |
| `companyId` | string | 所属企业 ID | 同上 |
| `status` | int | 门店状态 0-启用 1-禁用 2-生效中 3-已过期 | 同上 |

### 6.3 商品主数据 `Goods`（复用现有 `POST /mnmart/goods/list`）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `goodsId` | string | 是 | 商品 ID（唯一键，打码/计划关联用） |
| `goodsName` | string | 是 | 商品名称 |
| `goodsCode` | string | 是 | 商品编码（价签条码展示用） |
| `goodsSpec` | string | 是 | 规格，如 `500g/袋` |
| `goodsUnitId` | string | 否 | 单位 ID |
| `goodsUnitName` | string | 否 | 计价单位名，如 `kg`/`份` |
| `goodsListPrice` | decimal | 否 | 原价/吊牌价（价签"原价"列） |
| `goodsPrice` | decimal | 是 | 当前售价 |
| `vipPrice` | decimal | 否 | 会员价 |
| `type` | int | 否 | 商品类型 0-非标品 1-标品 |
| `enable` | int | 否 | 上下架 0-上架 1-下架 |
| `status` | int | 否 | 状态 0-启用 1-禁用 |
| `saleType` | int | 否 | 销售类型 0-非售品 1-售品 |
| `imgUrl` | string | 否 | 图片 URL |
| `shelfLifeType` | int | 否 | 保质期类型 1-天 2-月 3-年 |
| `shelfLife` | int | 否 | 保质期 |
| `storageMethod` | string | 否 | 贮藏方式 |
| `purchasePrice` | decimal | 否 | 最新进货价 |
| `goodsBrand` | string | 否 | 品牌 |
| `displayClassId` | string | 否 | 显示分类 ID（添加商品筛选用） |

### 6.4 批次 `Batch`（复用现有 `POST /mnmart/inventory/batchListByGoodsIdCode`）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `batchInventoryId` | string | 批次库存 ID |
| `goodsId` | string | 商品 ID |
| `goodsCode` | string | 商品编码 |
| `batchNo` | string | 批次号 |
| `productionDate` | string | 生产日期 `yyyy-MM-dd` |
| `expirationDate` | string | 过期日期 `yyyy-MM-dd` |
| `shelfLifeType` | int | 保质期类型 |
| `shelfLife` | int | 保质期 |
| `inventory` | decimal | 批次库存数量 |
| `purchasePrice` | decimal | 进货单价 |

### 6.5 打印计划 `PrintPlan`（新增）

> **字段命名说明（MVP 演示态）**：前端与线上静态 Mock（`mock/`）为前端友好，采用简化命名；后端原生契约按字段语义一一映射，对接真实后端时由前端适配层转换。映射关系：`id` ↔ `printPlanId`、`name` ↔ `planName`、`store` ↔ `shopName`（含 `shopId`/`companyId` 租户隔离，演示态省略）、`type`（`manual`/`price-change`）↔ `type`（int `0`/`1`）、`status`（`pending`/`partial`/`done`）↔ `status`（int `0`/`1`/`2`）。以下以演示态命名为准。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 计划唯一 ID（对应后端 `printPlanId`） |
| `name` | string | 是 | 计划名称（对应后端 `planName`） |
| `store` | string | 是 | 门店名称（快照，对应后端 `shopName`；后端原生另有 `shopId`/`companyId` 租户字段） |
| `type` | string | 是 | `manual` 手动创建 / `price-change` 调价自动（对应后端 int `0`/`1`） |
| `status` | string | 是 | `pending` 待打印 / `partial` 部分打印 / `done` 已完成（对应后端 int `0`/`1`/`2`） |
| `totalCount` | int | 是 | 商品总数 |
| `pendingCount` | int | 是 | 待打印数 |
| `printedCount` | int | 是 | 已打印数 |
| `createdAt` | string | 是 | 创建时间 `yyyy-MM-dd HH:mm:ss` |
| `createdBy` | string | 否 | 创建人 |
| `items` | PlanItem[] | 是 | 计划内商品项（见 §6.6；**`printPlan/list` 列表接口亦返回完整 `items`**，供列表页直接渲染「计划商品」列与计数） |

### 6.6 计划项 `PlanItem`（新增）

> **字段命名说明（MVP 演示态）**：`id` ↔ `itemId`、`name` ↔ `goodsName`、`barcode` ↔ `goodsCode`、`spec` ↔ `goodsSpec`、`unit` ↔ `goodsUnitName`、`price` ↔ `goodsPrice`、`origPrice` ↔ `goodsListPrice`、`memberPrice` ↔ `vipPrice`、`produceDate` ↔ `productionDate`。演示态无 `source` 字段（来源由 `type`=price-change 的计划隐含）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 项 ID（对应后端 `itemId`） |
| `name` | string | 是 | 商品名称（快照，加入时固化，对应后端 `goodsName`） |
| `barcode` | string | 是 | 商品编码 / 价签条码（对应后端 `goodsCode`） |
| `price` | decimal | 是 | 售价（快照，对应后端 `goodsPrice`） |
| `origPrice` | decimal | 否 | 原价 / 吊牌价（快照，对应后端 `goodsListPrice`） |
| `memberPrice` | decimal | 否 | 会员价（快照，对应后端 `vipPrice`） |
| `unit` | string | 否 | 单位名（对应后端 `goodsUnitName`） |
| `spec` | string | 是 | 规格（快照，对应后端 `goodsSpec`） |
| `origin` | string | 否 | 产地 |
| `produceDate` | string | 否 | 生产日期 `yyyy-MM-dd`（FIFO 取最早批次，多批次时动态计算，对应后端 `productionDate`） |
| `batchCount` | int | 否 | 批次数量（多批次角标；需求2 由 `addGoods` 响应返回） |
| `batches` | array | 否 | 批次明细 `[{ "produceDate": "yyyy-MM-dd", "qty": int }]`（需求2 由 `addGoods` 响应返回） |
| `printQty` | int | 是 | 打印份数，默认 1，下限 1 |
| `printed` | boolean | 是 | 是否已打印 |
| `printedAt` | string\|null | 否 | 最近打印时间 `yyyy-MM-dd HH:mm`，无则 null |

### 6.7 价签模板 `Template`（前端渲染概念）
> 模板选择为前端价签渲染概念；价签由客户端直接基于计划项字段渲染并输出到打印机（与称重打码 `code/printCode` 无关），模板决定展示元素（`price`/`origPrice`/`memberPrice`/`barcode`/`name`/`spec`）。服务端不参与打印执行。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `templateId` | string | 模板 ID，如 `tpl-01` 标准价签 |
| `templateName` | string | 模板名称 |
| `elements` | string[] | 包含元素：`price` `origPrice` `memberPrice` `barcode` `name` `spec` |

### 6.8 完整 JSON 示例（PrintPlan 视角）

```json
{
  "id": "plan-101",
  "name": "崧泽大道中心店 调价打印",
  "store": "崧泽大道中心店",
  "type": "price-change",
  "status": "partial",
  "totalCount": 2,
  "pendingCount": 1,
  "printedCount": 1,
  "createdAt": "2026-07-20 09:30:00",
  "createdBy": "系统自动",
  "items": [
    {
      "id": "item-1001",
      "name": "大白菜",
      "barcode": "6901234567012",
      "price": 3.5, "origPrice": 5.0, "memberPrice": 3.0,
      "unit": "斤", "spec": "约500g", "origin": "山东寿光",
      "produceDate": "2026-06-03", "batchCount": 2,
      "batches": [ { "produceDate": "2026-06-03", "qty": 12 }, { "produceDate": "2026-06-10", "qty": 8 } ],
      "printQty": 2, "printed": true, "printedAt": "2026-07-20 10:15:00"
    },
    {
      "id": "item-1002",
      "name": "番茄",
      "barcode": "6901234567036",
      "price": 5.8, "origPrice": 8.0, "memberPrice": 4.8,
      "unit": "斤", "spec": "约500g", "origin": "云南昆明",
      "produceDate": "2026-05-28", "batchCount": 3,
      "batches": [ { "produceDate": "2026-05-28", "qty": 5 }, { "produceDate": "2026-06-04", "qty": 15 }, { "produceDate": "2026-06-11", "qty": 10 } ],
      "printQty": 1, "printed": false, "printedAt": null
    }
  ]
}
```

> 说明：商品主数据（含多批次 `produceDate`）来自 `POST /mnmart/goods/list` 与 `POST /mnmart/inventory/batchListByGoodsIdCode`；本示例省略 Goods/Batch 原文，以其现有返回为准。

### 6.9 演示态 Mock（临时占位，非产品方案）
> 说明：当前前端 MVP（最小可行产品）仅为**演示/调试目的**，采用**前端内置浏览器端 Mock**：所有 `printPlan/*` 读写由 `index.html` 中的 `PPApi` 适配层在浏览器内存中完成（默认模式），**无需任何后端**，GitHub Pages 静态托管下开箱即用。
> **正式方案**：数据持久化由服务端数据库负责（见 §9 接口契约），前端不落盘、以接口读写为准，确保多端一致与审计可追溯。前端人员联调真实接口时，可使用线上静态 Mock（`?api=1` 开启，数据来自 `mock/` 目录托管的 JSON，详见 §14）。

---

## 7. 接口通用规范（统一约定）

> 本章节为**全模块统一约定**，所有接口（含复用与新增）均遵守。规范取自现有 `/mnmart` 接口体系。

- **基础路径**：`/mnmart`。
- **协议 / 编码**：HTTPS，`Content-Type: application/json`，字符 UTF-8。
- **请求方法**：**统一 `POST`**（列表、查询、详情、写操作均用 POST，与现有体系一致）。
- **鉴权**：`POST /mnmart/user/login` 登录后返回 `jwtToken`；后续请求在 Header 携带 `Authorization: Bearer {jwtToken}`（与现有 `/mnmart` 接口鉴权一致；具体 header 名以网关为准，统一走 JWT）。
- **请求包体（统一）**：
  ```json
  {
    "data": { "...业务参数..." },
    "requestPage": { "currentPage": 1, "pageSize": 10 }
  }
  ```
  - 列表/分页接口带 `requestPage`；单条查询/写操作可省略 `requestPage`。
  - 通用上下文：几乎所有接口需携带 `companyId`、`shopId`（租户 + 门店隔离）；`shopId` 缺省表示跨门店/总部视角。
- **响应包体（统一）**：
  ```json
  {
    "code": 0,
    "message": "success",
    "data": [ "...或对象..." ],
    "pageInfo": { "pageSize": 10, "currentPage": 1, "totalPages": 1, "totalRecord": 1 }
  }
  ```
  - 列表接口：`data` 为数组，`pageInfo` 返回分页信息（`pageSize`/`currentPage`/`totalPages`/`totalRecord`）。
  - 单条/对象接口：`data` 为对象，无 `pageInfo`。
  - **成功判定**：以 `code === 0` 为准；`message` 为提示文案（现有体系成功时可能为 `"success"` 或具体成功文案，仅作展示，不应用于逻辑分支）。
- **字段命名**：小驼峰（camelCase），与现有 `goods*`、`shop*`、`batch*` 等保持一致。
- **时间格式**：`yyyy-MM-dd HH:mm:ss`（字符串）；纯日期 `yyyy-MM-dd`。
- **金额**：`decimal`（元，两位小数），JSON 数字（如 `3.99`）。

---

## 8. 复用现有接口（不重新定义字段）

> 下列接口**已存在于现有 `/mnmart` 体系**，打印计划模块直接复用，字段以 YApi 导出定义为准，**不重新定义**。此处仅标注用途与本模块对应关系。

| 接口 | 方法 | 本模块用途 | 关键入参 `data` | 关键返回 `data` |
| --- | --- | --- | --- | --- |
| `/mnmart/goods/list` | POST | 添加商品数据源（§4.4） | `keyword`/`status`/`enable`/`saleType`/`shopId`/`companyId`/`displayClassId` + `requestPage` | `goodsId`/`goodsName`/`goodsCode`/`goodsSpec`/`goodsUnitName`/`goodsListPrice`/`goodsPrice`/`vipPrice`/… |
| `/mnmart/goods/detail` | POST | 商品详情（必要时） | `goodsId` | 商品完整字段 |
| `/mnmart/goods/listGoodsPriceRecord` | POST | 改价日志数据源（§4.7） | `companyId`/`shopId`/`startTime`/`endTime`/`keyword` + `requestPage` | `goodsId`/`goodsName`/`goodsCode`/`goodsSpec`/`goodsUnitName`/`goodsListPrice`(原价)/`goodsPrice`(改前价)/`goodsAfterPrice`(改后价)/`operator`/`recordTime` |
| `/mnmart/shop/list` | POST | 门店列表（§4.1 门店 Picker） | `keyword`/`status`/`companyId` + `requestPage` | `shopId`/`shopName`/`status`/`companyId`/… |
| `/mnmart/dropdown` | POST | 企业&门店联动下拉（顶部筛选） | `type`(0企业&门店 1企业 2门店)/`companyId` | 树形 `id`/`name`/`status`/`children` |
| `/mnmart/inventory/batchListByGoodsIdCode` | POST | 批次/生产日期（FIFO，§5.1） | `goodsCode`/`goodsIds[]` | `batchInventoryId`/`goodsId`/`goodsCode`/`batchNo`/`productionDate`/`expirationDate`/`shelfLifeType`/`shelfLife`/`inventory` |

> 注：`/mnmart/code/*`（如 `code/printCode`/`code/list`/`code/loadCodeInfo`）属于**称重打码 / 秤端标签**能力，与本文的「价格标签打印」是不同功能，打印计划模块**不复用**该系列接口。

---

## 9. 新增打印计划接口

> 仅打印计划领域特有的接口需新增，统一置于 `/mnmart/printPlan/*`（建议归入「商品管理」分组或独立分组）。所有接口遵守 §7 通用规范（POST + `{data, requestPage?}` + `{code, message, data, pageInfo?}`）。字段命名沿用现有体系（小驼峰）。

### 9.1 通用说明
- 所有写接口需在 `data` 中携带 `shopId`、`companyId`（与现有体系一致）。
- 业务校验失败返回 `code ≠ 0` 并附 `message` 文案（见 §10）。

### 9.2 计划列表 `POST /mnmart/printPlan/list`

**请求 `data`**
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `shopId` | string | 否 | 门店 ID，缺省=全部 |
| `companyId` | string | 否 | 企业 ID |
| `type` | string | 否 | `manual` 手动 / `price-change` 调价，缺省=全部（MVP 演示态为字符串枚举；后端原生为 int `0`/`1`，见 §6.5 映射） |
| `status` | string | 否 | `pending` 待打印 / `partial` 部分 / `done` 已完成，缺省=全部（后端原生 int `0`/`1`/`2`） |
| `startTime` | string | 否 | 创建时间起始 `yyyy-MM-dd HH:mm:ss`，与 `endTime` 成对，缺省=全部（对应筛选栏「时间」Segment：今天/本周/本月由前端按当前日期算出后传入） |
| `endTime` | string | 否 | 创建时间截止 `yyyy-MM-dd HH:mm:ss` |
| `keyword` | string | 否 | 计划名称模糊匹配 |

**响应 `data`**（数组，附 `pageInfo`）

> ⚠️ **`list` 返回完整 `PrintPlan`（含 `items`）**：每个计划对象直接携带其 `items` 计划商品数组（字段见 §6.6），列表页据此渲染「计划商品」列、商品数、待打印/已打印计数，**无需逐行调用 `detail`**（`detail` 仅用于查看单个计划明细或后端分页超大数据量场景）。

```json
[
  {
    "id": "plan-101",
    "name": "崧泽大道中心店 调价打印",
    "store": "崧泽大道中心店",
    "type": "price-change",
    "status": "partial",
    "totalCount": 3, "pendingCount": 1, "printedCount": 2,
    "createdAt": "2026-07-20 09:30:00",
    "createdBy": "系统自动",
    "items": [
      {
        "id": "item-1001",
        "name": "大白菜",
        "barcode": "6901234567012",
        "price": 3.5, "origPrice": 5.0, "memberPrice": 3.0,
        "unit": "斤", "spec": "约500g", "origin": "山东寿光",
        "produceDate": "2026-06-03", "batchCount": 2,
        "batches": [ { "produceDate": "2026-06-03", "qty": 12 }, { "produceDate": "2026-06-10", "qty": 8 } ],
        "printQty": 2, "printed": true, "printedAt": "2026-07-20 10:15:00"
      },
      {
        "id": "item-1002",
        "name": "番茄",
        "barcode": "6901234567036",
        "price": 5.8, "origPrice": 8.0, "memberPrice": 4.8,
        "unit": "斤", "spec": "约500g", "origin": "云南昆明",
        "produceDate": "2026-05-28", "batchCount": 3,
        "batches": [ { "produceDate": "2026-05-28", "qty": 5 }, { "produceDate": "2026-06-04", "qty": 15 }, { "produceDate": "2026-06-11", "qty": 10 } ],
        "printQty": 1, "printed": false, "printedAt": null
      }
    ]
  }
]
```

### 9.3 新建计划 `POST /mnmart/printPlan/add`

**请求 `data`**
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `shopId` | string | 是 | 门店 ID |
| `companyId` | string | 是 | 企业 ID |
| `type` | int | 是 | `0` 手动 / `1` 调价 |
| `planName` | string | 否 | 计划名称，缺省由服务端按"门店+类型+日期"生成 |

**响应 `data`**：完整 `PrintPlan`（§6.5，含空 `items`）。

### 9.4 计划详情 `POST /mnmart/printPlan/detail`

**请求 `data`**：`{ "printPlanId": "pl_20260701_a1b2" }`
**响应 `data`**：完整 `PrintPlan`（含 `items`，字段见 §6.6）。

### 9.5 删除计划 `POST /mnmart/printPlan/delete`

**请求 `data`**：`{ "printPlanId": "pl_20260701_a1b2" }`
**业务说明**：**仅「待打印」（`status='pending'`）的计划允许删除**。若计划已存在打印记录（`status='partial'` 部分打印 / `status='done'` 已完成），服务端拒绝删除并返回业务错误（见 §10 错误码，`code≠0` 并附 `message` 说明，如"仅待打印计划可删除"）；前端在列表操作列已对 `status≠'pending'` 隐藏/禁用删除按钮作为前置校验。
**响应 `data`**：`null`（需求3：以 `code === 0` 判定业务成功，`data` 内不含任何冗余字段，不再返回 `{ "deleted": true }` 之类的盘点参数）。

### 9.6 添加商品到计划 `POST /mnmart/printPlan/addGoods`

**请求 `data`**
```json
{
  "printPlanId": "pl_20260701_a1b2",
  "shopId": "1810933789769904128",
  "companyId": "1810928032239439872",
  "goodsList": [
    {
      "goodsId": "1824610137569304576",
      "goodsName": "有机小白菜",
      "goodsListPrice": 5.50,
      "goodsPrice": 3.99,
      "vipPrice": 3.59,
      "printQty": 1
    }
  ]
}
```
- `goodsName`/`goodsListPrice`(原价)/`goodsPrice`(售价)/`vipPrice`(会员价) 为**新增请求字段**（需求2）：服务端据此落库商品快照信息，前端无需额外查询商品主数据。
**业务校验**：
- `goodsId` 不存在 → `code ≠ 0`（提示"商品无效"）。
- 商品已在计划：按 §5.3 处理（同价不重复、异价更新），非错误。

**响应 `data`**：更新后的完整 `PrintPlan`（`items` 中每项**包含批次快照**：`productionDate`（FIFO 最早批次）、`batchCount`（批次数）、`batches`（批次数组），需求2）——批次数据在此随响应返回，前端不再单独调用批次查询接口。

### 9.7 移除计划项 `POST /mnmart/printPlan/removeGoods`

**请求 `data`**（二选一）
```json
{ "printPlanId": "pl_20260701_a1b2", "itemIds": ["it_001","it_002"] }
```
或移除全部未打印：
```json
{ "printPlanId": "pl_20260701_a1b2", "removeAllUnprinted": true }
```
**响应 `data`**：`null`（需求4：删除类接口精简，以 `code === 0` 判定成功，`data` 不含冗余字段）。

### 9.8 打印记录通知（客户端打印完成后上报）`POST /mnmart/printPlan/print`

> ⚠️ **本接口不做打印执行**：打印由客户端本地完成。本接口仅用于客户端在打印完成后**通知服务端记录**本次打印动作并回写计划项状态。

**请求 `data`**
```json
{
  "printPlanId": "pl_20260701_a1b2",
  "itemIds": ["it_001","it_002"],
  "templateId": "tpl-01",
  "copies": { "it_001": 2, "it_002": 1 }
}
```
**业务说明**：服务端按 `itemIds` 记录本次打印动作（打印项、份数、模板、时间、操作人），回写各计划项 `printed=true`、`printedAt=now`；**不调用 `code/printCode`、不执行任何打印输出**。

**响应 `data`**：`null` 或最小对象（需求4：精简响应，以 `code === 0` 判定成功；如确需扩展可返回 `{ "recordedItems": [...] }`，但前端不依赖 `data` 内容）。

### 9.9 调价自动入计划（服务端内部接口）`POST /mnmart/printPlan/autoAddFromPriceChange`

> ⚠️ **调用方**：仅服务端在改价事件完成时调用，**前端不直接暴露、无用户入口**（对应 §4.6）。用户侧主动/自动加入请使用 §9.10。

**请求 `data`**
```json
{
  "shopId": "1810933789769904128",
  "companyId": "1810928032239439872",
  "goodsList": [
    { "goodsId": "1824610137569304576", "goodsPrice": 3.99, "goodsListPrice": 5.50, "vipPrice": 3.59 }
  ]
}
```
**业务规则**：执行 §5.3 调价归集逻辑（三层决策树：优选当天「调价自动」计划，次选当天未完成计划，否则新建「调价自动」计划；同商品比对价格，异价更新并视情况重置已打印）。

**响应 `data`**
```json
{ "planId": "pl_20260701_a1b2", "added": 0, "updated": 1, "resetPrinted": 1 }
```
- `added`：新增商品数；`updated`：价格更新数；`resetPrinted`：已打印被重置为待打印数。

### 9.10 从改价日志加入（用户侧 / 开关自动触发）`POST /mnmart/printPlan/addFromPriceChanges`

> ✅ **v1.5 恢复**（对应 §4.7 用户主动操作已重新上架）；**v1.7 改为开关自动触发**（§4.7）：开关打开时本接口由前端自动调用，归集已变更调价商品。调价归集同时可由服务端自动（§9.9）或本接口（用户主动 / 开关自动）触发，两者执行同一套 §5.3 归集逻辑。数据源为 `POST /mnmart/goods/listGoodsPriceRecord`（§8）。

**请求 `data`**
```json
{
  "target": "latest",
  "shopId": "1810933789769904128",
  "companyId": "1810928032239439872",
  "goodsList": [
    { "goodsId": "1824610137569304576", "goodsAfterPrice": 3.99, "goodsListPrice": 5.50, "vipPrice": 3.59, "recordTime": "2026-07-17 11:20:00" }
  ]
}
```
**`target` 取值**：
- `latest`：加入当天最新调价计划，无则自动新建（类型 `price-change`，`type=1`）。
- `new`：新建当天调价计划再加入。
- `{printPlanId}`：加入指定计划 ID。

**业务规则**：执行 §5.3 调价归集逻辑（默认归属当天「调价自动」计划，或按 `target` 指定计划；同商品比对价格，异价更新并视情况重置已打印）。

**响应 `data`**
```json
{ "planId": "pl_20260701_a1b2", "added": 0, "updated": 1, "resetPrinted": 1 }
```

---

## 10. 错误码约定

- 与现有 `/mnmart` 体系一致：**`code === 0` 成功**；`code ≠ 0` 为业务/系统错误，`message` 带回可读文案（前端直接提示 `message`）。
- 具体业务码值（如计划不存在、商品已在计划、已打印不可改份数等）**以服务端定义为准**，前端按 `message` 提示，必要时刷新列表/详情。
- 建议业务码分段（与现有风格对齐，非强制）：`1xxx` 参数类、`2xxx` 业务校验类、`5xxx` 服务端异常。示例：

| code | 含义 | 处理建议 |
| --- | --- | --- |
| 0 | 成功 | — |
| （业务码） | 计划不存在 | 提示并刷新列表 |
| （业务码） | 商品/条码不存在 | 提示商品无效 |
| （业务码） | 商品已在计划（手动场景） | 提示或自动定位 |
| （业务码） | 已打印项不可改份数 | 禁用控件 |
| （非 0） | 服务端异常 | 重试 / 上报 |

---

## 14. 接口 Mock 服务（前端调试）

> 本章节说明打印计划新增接口（`/mnmart/printPlan/*`）的 Mock 方案，满足前端人员接口调试需求（需求5）。无需任何本地服务或后端，全部以静态文件托管。

### 14.1 两种模式

| 模式 | 触发 | 数据来源 | 适用场景 |
| --- | --- | --- | --- |
| **前端内置 Mock（默认）** | 访问静态页（不带 `?api=1`） | `index.html` 内 `PPApi` 适配层的浏览器内存 | **GitHub Pages 静态托管演示/生产**，开箱即用，无需任何后端；「自动加入」开关等页面交互即用此模式 |
| **线上静态 Mock 联调** | URL 加 `?api=1` | GitHub Pages 托管的静态 JSON（`mock/` 目录） | **给其他技术人员调试页面与参数**：直接打开页面即可看到接口返回并核对入参，无需安装任何运行环境 |

### 14.2 前端内置 Mock（GitHub Pages 默认可用）

- 部署在 GitHub Pages（纯静态托管，无法运行后端）时，**默认即走前端内置 Mock**：所有读写由 `index.html` 的 `PPApi` 适配层在浏览器内存完成，请求/响应契约与 §9 完全一致，前端功能完整可演示。
- 该模式下前端**不依赖任何服务器**，刷新即重置为初始演示数据。

### 14.3 线上静态 Mock（GitHub Pages 托管 JSON，无需起服务）

> 全部接口响应以静态 JSON 文件随站点一起托管在 GitHub Pages，其他技术人员**无需安装任何运行环境、无需起服务**，直接用浏览器打开即可调试。

- 文件位置：项目根 `mock/` 目录，部署后位于站点 `/mock/` 下。结构与接口路径一一对应：
  - `mock/mnmart/printPlan/list.json`、`add.json`、`detail.json`、`delete.json`、`addGoods.json`、`removeGoods.json`、`print.json`、`autoAddFromPriceChange.json`、`addFromPriceChanges.json`
  - `mock/mnmart/goods/list.json`、`mock/mnmart/inventory/batchListByGoodsIdCode.json`
- 调试方式（给其他开发人员）：
  1. **直接查看响应**：浏览器打开 `https://tcm-demo.github.io/tcm-analytics/mock/mnmart/printPlan/list.json` 等，即可看到规范 JSON 响应（list 含完整 `items`，addGoods 含批次，delete/print 的 `data` 为 `null`）。
  2. **页面联调**：打开 `https://tcm-demo.github.io/tcm-analytics/index.html?api=1`，前端 `PPApi` 会 `GET` 上述静态 JSON 填充页面；**每次请求的参数会 `console.log` 输出**（前缀 `[PPApi mock]`），便于核对入参。
- 契约要点（与 §9 对齐）：
  - 响应统一 `{ "code": 0, "message": "success", "data": ... }`（删除类 `data` 为 `null`，以 `code===0` 判成功，需求3/4）。
  - **`addGoods`**：响应 `PrintPlan.items` 含批次快照 `productionDate`/`batchCount`/`batches`（需求2）。
  - **`list`**：响应 `data` 为完整 `PrintPlan` 数组，**每项直接携带 `items` 计划商品**（字段同 §6.6），列表页据此渲染「计划商品」列与计数，无需逐行调 `detail`（§9.2）。
  - **`print`**：响应 `data` 可空（需求4）。
- **参数化动态响应（可选）**：静态 JSON 为固定样例，无法随参数变化。如需按参数返回不同数据，将 `index.html` 中 `PPApi.MOCK_BASE` 改为任意在线 mock 服务基址（如 Beeceptor / Apifox / Postman Mock Server），并保证其按 `/mnmart/printPlan/{接口}.json` 路径返回上述结构即可，前端无需其它改动。
