# MBTI 测试 H5

移动端优先的 36 题 MBTI 测试单页应用。实现了四维度独立计分、正反向题、7 级李克特量表、进度本地缓存和结果历史保存。

## 本地运行

```bash
npm install
npm run dev
```

> 直接运行 Vite 只能预览前端。昵称/手机号后台记录和分享结果读取依赖 Netlify Functions，完整联调请使用 Netlify CLI：

```bash
npx netlify dev
```

## 构建

```bash
npm run build
```

构建产物会生成到 `dist/`，可部署到任意静态托管服务。

## Netlify 部署

项目已包含 `netlify.toml` 和 `netlify/functions/results.mjs`：

- 静态产物发布目录：`dist`
- Functions 目录：`netlify/functions`
- API 路径：`/api/results`
- 后台记录：Netlify Blobs store `mbti-results`

登录 Netlify 后可部署：

```bash
npx netlify login
npx netlify deploy --prod --build
```

如果使用 token：

```bash
NETLIFY_AUTH_TOKEN=你的_token npx netlify deploy --prod --build
```

## GitHub 自动部署到 Netlify

可以把项目源码上传到 GitHub，然后让 Netlify 连接这个 GitHub 仓库自动部署。

上传到 GitHub 时请包含这些文件和目录：

```text
src/
netlify/
index.html
netlify.toml
package.json
package-lock.json
vite.config.js
tailwind.config.js
postcss.config.js
eslint.config.js
README.md
.gitignore
```

不要上传：

```text
node_modules/
dist/
```

Netlify 后台设置：

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

如果 Netlify 读取到了 `netlify.toml`，这些设置会自动生效。部署完成后，昵称、手机号和测试结果会通过 Netlify Function 写入 Netlify Blobs，分享链接形如：

```text
https://你的站点.netlify.app/?result=结果ID
```

## 功能清单

- 36 题题库，四个维度各 9 题
- 每题 1-7 分量表，反向题按 `8 - 原始分` 计分
- 输出 4 字母类型和四维度倾向强度百分比
- 倾向强度低于 10% 时提示该维度倾向不明显
- `localStorage` 保存未完成进度和最多 5 条历史结果
- 看结果前填写昵称和手机号
- 提交后写入 Netlify 后台，并生成可转发结果链接
- 结果页可复制分享链接、生成 PNG 分享海报
