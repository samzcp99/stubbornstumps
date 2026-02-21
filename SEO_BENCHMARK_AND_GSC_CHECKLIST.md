# SEO Benchmark & GSC Checklist (2026-02-21)

## 1) 同类型网站对比（基于公开搜索结果样本）

本次对比来源：
- `southerntreecareltd.com`
- `awltree.co.nz`
- `treeremovalservices.co.nz/locations/southland/invercargill/`
- `treescape.co.nz/stump-removal-and-grinding/`
- `cutabovetrees.co.nz/stump-grinding-services-otago-and-southland-tree-services/`

### 他们做得好的点
- 城市+服务词重复覆盖明显（如 “Tree Services Invercargill”, “Stump Grinding Southland”）。
- 服务页内容较长，常见「流程」「优势」「FAQ」「多次CTA」。
- 明确本地服务范围（Invercargill / Southland / Otago 等）与联系方式。
- 大站会用FAQ模块补充长尾问题（例如 stump removal vs stump grinding）。

### 他们常见短板
- 文案重复和堆词较多，阅读体验一般。
- 部分站技术SEO不完整（结构化数据/页面一致性一般）。
- 图片与页面性能、语义化结构并不一定优。

### 我们的领先策略
- 保持可读性，不做生硬堆词。
- 用结构化数据（LocalBusiness + Service + FAQPage + Breadcrumb）拿富结果机会。
- 用真实案例图库+清晰服务区域，提升本地相关性和转化信任。

## 2) 本轮已完成优化（已落地）

- `services.html`
	- H1升级为本地搜索意图：Invercargill + Southland。
	- 增加「Stump Grinding FAQs」内容模块（4个高意图问题）。
	- 新增 FAQPage 结构化数据并并入现有 Service/Breadcrumb schema。
- `sitemap.xml`
	- 全站核心URL `lastmod` 更新到 2026-02-21。
- `robots.txt`
	- 保留全站可抓取，新增：
		- `Disallow: /api/`
		- `Disallow: /storage/`

## 3) Google Search Console 执行清单（你要做的）

### Step A — 修复 HTML 验证文件被 rewrite 的问题（关键）

你的网站已有验证文件：
- `/google772416919407220d.html`

但线上被 rewrite 到首页时，GSC 会验证失败。需要在服务器配置里“放行真实文件”。

#### Nginx 示例（放在通用 rewrite 前）

```nginx
location = /google772416919407220d.html {
		try_files $uri =404;
		default_type text/html;
}
```

如果你还有其他站点验证文件，可再加：

```nginx
location ~* ^/(google[a-zA-Z0-9]+\.html|BingSiteAuth\.xml)$ {
		try_files $uri =404;
}
```

改完后执行：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

#### Apache (.htaccess) 示例

```apache
RewriteEngine On
RewriteRule ^google772416919407220d\.html$ - [L]
```

并确保此规则在“全站跳转到 index.html”之前。

### Step B — 验证是否已修复

浏览器访问：
- `https://stubbornstumps.co.nz/google772416919407220d.html`

预期：
- 返回验证文件原文内容（不是首页HTML）。

### Step C — 在 GSC 点击 Verify

- 进入 Search Console 属性后重新验证。
- 成功后提交 sitemap：
	- `https://stubbornstumps.co.nz/sitemap.xml`

### Step D — 首周监控（建议）

- 每 2 天看一次：
	- Indexing > Pages（是否有抓取异常）
	- Enhancements / Rich Results（FAQ是否识别）
	- Performance > Queries（`stump grinding invercargill`, `stump removal southland`）

## 4) 下一步可继续冲排名（可选）

- 新增独立页面：`/stump-grinding-invercargill.html`（专门打核心词）。
- 新增 `service-area` 页面（Invercargill / Winton / Gore / Riverton 各小段落）。
- 接入真实评价（含评分与文本），后续可扩展为 Review schema（需真实可见数据）。
