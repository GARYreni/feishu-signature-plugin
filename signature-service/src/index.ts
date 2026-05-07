/**
 * 签名图片生成微服务 (Express 版)
 *
 * 用于 Railway / Replit / 自有服务器部署
 * 启动：npm run dev  或  npm start
 * 调用：GET /api/sign?name=张三&style=cursive&color=000000&size=64
 *
 * 如果部署到 Vercel，请使用 api/ 目录下的 Serverless Functions
 */

import express, { Request, Response } from 'express';
import { SIGNATURE_STYLES, buildSignatureSVG } from '../lib/signature';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// API 路由
// ============================================================

/** 健康检查 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'signature-image-service' });
});

/** 签名图片生成 */
app.get('/api/sign', (req: Request, res: Response) => {
  try {
    const {
      name,
      style = 'cursive',
      color = '000000',
      size = '64',
    } = req.query as Record<string, string>;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Missing required parameter: name' });
      return;
    }

    const trimmedName = name.trim();
    const colorHex = /^[0-9a-fA-F]{6}$/.test(color) ? color : '000000';
    const styleKey = SIGNATURE_STYLES[style] ? style : 'cursive';
    const fontSize = Math.min(Math.max(parseInt(size, 10) || 64, 24), 120);

    const { svg } = buildSignatureSVG({
      name: trimmedName,
      style: styleKey,
      color: colorHex,
      size: fontSize,
    });

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    console.error('签名生成错误:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// 启动
// ============================================================
app.listen(PORT, () => {
  console.log(`✍️  签名图片生成服务已启动: http://localhost:${PORT}`);
  console.log(`   示例: http://localhost:${PORT}/api/sign?name=张三&style=cursive&color=000000`);
});

export default app;
