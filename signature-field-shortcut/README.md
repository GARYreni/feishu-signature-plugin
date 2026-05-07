# 签名字段捷径（FaaS 版）

将文本（签名人姓名）自动转换为签名风格图片附件，作为飞书多维表格字段捷径使用。

## 功能说明

配置「签名字段捷径」后，选择一个文本字段作为签名人姓名，字段捷径会自动：

1. 读取文本字段的内容（签名人姓名）
2. 调用签名生成微服务，渲染为手写风格的签名图片
3. 将签名图片作为附件保存到记录中

用户只需填写姓名，签名图片自动生成，无需手动绘图。

## 架构

```
多维表格记录
  └─ 文本字段（签名人姓名，如"张三"）
       ↓ 字段捷径自动触发
  └─ FaaS execute() 函数
       ↓ context.fetch()
  └─ 签名生成微服务（SVG渲染）
       ↓ 返回签名图片
  └─ 附件字段（签名图片附件）
```

## 部署步骤

### 第一步：部署签名生成微服务

签名生成微服务 (`signature-service/`) 需要部署到公网可访问的 HTTPS 服务器。

**方案 A：Vercel 部署（推荐，免费）**

```bash
cd signature-service
npm install
npx vercel --prod
```

**方案 B：Railway / Replit 部署**

将 `signature-service/` 导入 Railway 或 Replit，设置启动命令 `npm start`。

**方案 C：自有服务器**

```bash
cd signature-service
npm install
npm run build
npm start  # 默认监听 3000 端口
```

部署后获得服务地址，例如 `https://signature-service.vercel.app`。

### 第二步：配置字段捷径

1. 编辑 `signature-field-shortcut/src/index.ts`
2. 修改 `SIGNATURE_SERVICE_URL` 为实际的服务地址：
   ```typescript
   const SIGNATURE_SERVICE_URL = 'https://your-service.vercel.app/api/sign';
   ```
3. 更新 `addDomainList` 中的域名：
   ```typescript
   basekit.addDomainList(['your-service.vercel.app']);
   ```

### 第三步：本地调试

```bash
cd signature-field-shortcut
npm install
npm run start
```

在飞书多维表格中：
1. 添加「字段捷径调试助手」插件
2. 点击调试，验证签名生成效果

### 第四步：发布

```bash
npm run pack
```

上传 `output/output.zip` 到[多维表格捷径插件表单](https://feishu.feishu.cn/share/base/form/shrcnwTXnFVAbMPOSeaOFwIAnbf)。

## 签名风格

| 风格 | 效果 | 适用场景 |
|------|------|----------|
| 行书 (cursive) | 流畅连笔，自然倾斜 | 中文签名、日常文档 |
| 楷书 (regular) | 端正清晰，笔画分明 | 正式文档、合同 |
| 草书 (elegant) | 艺术感强，个性化 | 英文签名、创意场景 |

## 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| signerName | FieldSelect→Text | 签名人姓名字段 |
| fontStyle | SingleSelect | 签名风格（cursive/regular/elegant） |
| penColor | SingleSelect | 笔迹颜色（黑/蓝/红） |
| fontSize | SingleSelect | 字号大小（48/64/80px） |

## PNG 输出支持

默认使用 SVG 格式输出。如需 PNG 格式，在 signature-service 中安装：

```bash
cd signature-service
npm install @resvg/resvg-js
```

然后修改服务端代码，将 SVG 转为 PNG 后返回 `Content-Type: image/png`。

## 注意事项

- 签名服务必须部署在 **HTTPS** 地址（飞书要求）
- 服务响应时间应 < 30 秒（FaaS 执行超时 15 分钟）
- 建议配置 CDN 缓存以减少重复生成
- 签名图片文件名格式：`{姓名}_签名.svg`
- 单个附件大小限制 10MB
