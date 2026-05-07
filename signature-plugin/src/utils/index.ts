/**
 * 通用工具函数
 */

import type { IToastConfig } from '../types';
import { ToastType } from '../types';

/** 延迟等待 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成唯一的签名文件名
 * 格式: signature_YYYYMMDD_HHmmss_随机串.png
 */
export function generateFileName(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:]/g, '').slice(0, 15);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `signature_${dateStr}_${randomStr}.png`;
}

/**
 * 校验图片大小是否在合理范围
 */
export function validateImageSize(dataURL: string, maxSizeKB = 500): boolean {
  const base64Length = dataURL.length - dataURL.indexOf(',') - 1;
  // Base64 编码后的字节数 ≈ 原始字节数 * 4/3
  const sizeInBytes = (base64Length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  return sizeInKB <= maxSizeKB;
}

/**
 * 压缩图片质量直到满足大小限制
 */
export function compressImage(
  dataURL: string,
  maxSizeKB: number = 500
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 从高质量开始逐步降低，直到满足大小要求
      let quality = 0.92;
      let result = canvas.toDataURL('image/png');

      // PNG 是无损格式，quality 参数对 PNG 无效
      // 如果需要压缩 PNG，需要缩小画布尺寸
      if (!validateImageSize(result, maxSizeKB)) {
        const scale = 0.8;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        result = canvas.toDataURL('image/png');
      }

      resolve(result);
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataURL;
  });
}

/**
 * 获取Canvas容器尺寸
 * 响应式计算可用宽高
 */
export function getContainerSize(
  containerWidth: number
): { width: number; height: number } {
  const minHeight = 200;
  const maxHeight = 400;
  // 宽高比约 3:1（横向签名区域）
  const idealHeight = Math.min(
    Math.max(containerWidth / 3, minHeight),
    maxHeight
  );
  return {
    width: containerWidth,
    height: Math.round(idealHeight),
  };
}

/**
 * 从base64 DataURL估算图片文件大小 (KB)
 */
export function estimateImageSize(dataURL: string): number {
  const base64Length = dataURL.length - dataURL.indexOf(',') - 1;
  return Math.round(((base64Length * 3) / 4 / 1024) * 100) / 100;
}
