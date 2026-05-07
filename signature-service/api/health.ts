/**
 * Vercel Serverless Function — 健康检查
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    service: 'signature-image-service',
    timestamp: new Date().toISOString(),
  });
}
