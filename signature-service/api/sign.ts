/**
 * Vercel Serverless Function — 签名图片生成
 * GET /api/sign?name=张三&style=cursive&color=1a56db&size=64
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SIGNATURE_STYLES, buildSignatureSVG } from '../lib/signature';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      name,
      style = 'cursive',
      color = '000000',
      size = '64',
    } = req.query as Record<string, string>;

    // 参数校验
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Missing required parameter: name' });
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

    // 缓存30分钟，减少重复生成
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  } catch (error) {
    console.error('签名生成错误:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
