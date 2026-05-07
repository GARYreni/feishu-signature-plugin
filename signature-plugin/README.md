# 飞书多维表格手写签名插件

一款功能完整的飞书多维表格（Base）侧边栏插件，提供手写签名采集与附件自动上传功能。支持鼠标、触控笔及触摸屏输入，自动适配深浅色主题。

## 功能概览

- **手写签名** — 使用 HTML5 Canvas 实现流畅的签名绘制，支持压感模拟
- **一键保存** — 点击保存按钮自动将签名转为透明背景 PNG 并上传到当前记录的附件字段
- **清空重签** — 一键清除画布，重新签名
- **签名预览** — 已上传的签名以缩略图形式展示
- **主题切换** — 自动跟随多维表格的浅色/深色模式
- **国际化** — 支持中文、英文、日文三种语言
- **错误处理** — 全面的异常捕获与友好的用户提示

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| 签名绘制 | HTML5 Canvas API |
| 飞书集成 | @lark-base-open/js-sdk 0.3.x |
| 国际化 | react-i18next |
| 测试 | Vitest + Testing Library |

## 快速开始

### 环境要求

- **Node.js**: 16.19.0（推荐，飞书部署环境版本）
- **npm**: 8.19.3
- **现代浏览器**: Chrome 80+, Edge 80+, Safari 13+, 飞书客户端内置浏览器

### 安装依赖

```bash
cd signature-plugin
npm install
```

### 本地开发

```bash
npm run dev
```

启动后会输出一个本地地址（如 `http://localhost:5173`），将此地址填入多维表格插件即可调试。

### 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 项目结构

```
signature-plugin/
├── public/                    # 静态资源
├── src/
│   ├── api/
│   │   └── feishu.ts          # 飞书 API 服务层（附件上传、权限检查等）
│   ├── components/
│   │   ├── ErrorBoundary.tsx   # React 错误边界
│   │   ├── SignatureCanvas.tsx # 签名画布主组件（含操作按钮和状态）
│   │   ├── SignaturePad.tsx    # Canvas 手写绘制核心组件
│   │   └── Toast.tsx           # 消息提示组件（支持全局调用）
│   ├── hooks/
│   │   ├── useFeishu.ts        # 飞书环境感知 Hook（主题、选中状态等）
│   │   └── useSignature.ts     # 签名业务流程 Hook
│   ├── i18n/
│   │   ├── index.ts            # i18n 初始化
│   │   ├── zh.json             # 中文语言包
│   │   ├── en.json             # 英文语言包
│   │   └── ja.json             # 日文语言包
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   ├── utils/
│   │   ├── canvas.ts           # Canvas 绘制工具（高清适配、压感模拟等）
│   │   └── index.ts            # 通用工具函数
│   ├── App.css                 # 全局样式（含主题变量）
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 入口文件
│   └── vite-env.d.ts          # Vite 类型声明
├── index.html                  # HTML 模板
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 飞书开发者后台配置

### 1. 获取应用凭证

由于前端插件直接运行在飞书环境中，无需单独的应用凭证。插件通过 Base JS SDK 自动获取当前用户的身份和权限。

### 2. 多维表格准备

在使用签名插件前，确保多维表格满足以下条件：

1. **添加附件字段** — 在目标数据表中创建一个附件类型字段（建议命名为"签名"或"Signature"）
2. **选中记录** — 签名将保存到当前选中的记录中

### 3. 添加插件

1. 打开多维表格，点击右侧「插件」面板
2. 点击「自定义插件」→「+新增插件」
3. 输入插件运行地址（本地开发为 `http://localhost:5173`，正式部署需 HTTPS 地址）
4. 点击「确定」加载插件

## 核心 API 说明

### 签名画布组件

```tsx
<SignatureCanvas
  onSave={saveSignature}      // 保存回调，返回 Promise<IUploadResult>
  containerWidth={400}        // 容器宽度（px），用于自适应
  disabled={false}            // 是否禁用
  existingSignatureUrl={null} // 已有签名URL（显示缩略图）
/>
```

### 飞书 API 模块

```typescript
// 上传签名
const result = await uploadSignature(dataURL);
// result: { success: boolean, error?: string, fileToken?: string }

// 查询已有签名
const url = await getExistingSignature();
// url: string | null

// 检查编辑权限
const canEdit = await checkEditPermission();
// canEdit: boolean
```

## 本地调试

### 方法一：直接在飞书中调试

1. 执行 `npm run dev` 启动本地服务
2. 打开飞书多维表格，进入插件面板
3. 添加自定义插件，填入 `http://localhost:5173`
4. 打开浏览器开发者工具（F12），查看 Console 日志和 Network 请求
5. 修改代码后 Vite 自动热更新，刷新插件即可看到效果

### 方法二：浏览器单独调试

1. 执行 `npm run dev` 启动服务
2. 在浏览器中打开 `http://localhost:5173`
3. 画布绘制功能可直接测试，但飞书 API 需要在多维表格环境中才能调用

## 发布流程

### 1. 代码准备

```bash
# 确保 Node.js 版本为 16.19.0
node -v

# 清理并重新安装依赖
rm -rf node_modules
npm install

# 构建项目
npm run build
```

### 2. 部署服务

- 将 `dist/` 目录部署到任意 HTTPS 服务器
- 推荐使用 Replit、Vercel 或自有服务器
- 确保 `vite.config.ts` 中 `base: './'` 未被移除

### 3. 发布到插件中心

1. 将项目代码提交到 GitHub
2. 填写[发布到插件中心表单](https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e)
3. 提供插件名称、描述、类别、图标、使用录屏
4. 等待官方审核

## 安全说明

- **无本地存储** — 所有签名数据直接上传至飞书服务器，不在浏览器本地存储任何敏感数据
- **权限控制** — 插件的操作权限与当前登录用户在飞书中的权限一致
- **HTTPS 传输** — 生产环境强制使用 HTTPS 协议
- **无数据外传** — 除飞书开放 API 外，不向任何第三方发送数据

## 常见问题

### Q: 保存时提示"没有附件字段"？

需要在当前数据表中添加一个**附件类型**的字段。建议命名为"签名"，插件会自动识别并使用。

### Q: 签名图片背景是白色的？

插件生成的 PNG 图片使用透明背景。如果在某些查看器中显示白色，那是查看器的默认背景色。

### Q: 如何切换插件的语言？

插件自动跟随飞书的语言设置。目前支持中文（zh）、英文（en）、日文（ja）。

### Q: 触摸屏上签名不流畅？

请确保使用的是现代浏览器（Chrome 80+ 或 Safari 13+）。在飞书客户端内置浏览器中可获得最佳体验。

### Q: 部署后插件无法加载？

1. 检查部署地址是否支持 HTTPS
2. 确认 `vite.config.ts` 中 `base: './'` 未被删除
3. 确认 Node.js 版本为 16.19.0 且构建成功

### Q: 保存签名时报权限错误？

您需要具有当前多维表格的编辑权限。请联系表格的所有者或管理员授予权限。

## 维护与更新

- 使用语义化版本号（SemVer）
- 更新后重新构建并部署
- SDK 版本更新时需同步更新 `@lark-base-open/js-sdk` 依赖
- 建议定期查看[Base JS SDK 更新日志](https://lark-base-team.github.io/js-sdk-docs/zh/)

## License

MIT
