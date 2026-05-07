/**
 * Canvas 签名绘制工具函数
 * 处理手写签名的核心绘制逻辑
 */

import type { IPoint } from '../types';

/** 默认画笔配置 */
export const PEN_CONFIG = {
  /** 默认线条颜色 */
  color: '#000000',
  /** 默认线条宽度 */
  width: 2.5,
  /** 线条端点样式 */
  lineCap: 'round' as CanvasLineCap,
  /** 线条连接样式 */
  lineJoin: 'round' as CanvasLineJoin,
  /** 最小线条宽度（模拟压感） */
  minWidth: 1.5,
  /** 最大线条宽度（模拟压感） */
  maxWidth: 3.5,
};

/**
 * 初始化画布样式
 * 设置Canvas上下文的基础绘制属性
 */
export function initCanvasContext(
  ctx: CanvasRenderingContext2D,
  color: string = PEN_CONFIG.color,
  width: number = PEN_CONFIG.width
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = PEN_CONFIG.lineCap;
  ctx.lineJoin = PEN_CONFIG.lineJoin;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

/**
 * 获取画布上鼠标/触摸事件的坐标位置
 * 自动处理设备像素比(DPR)，确保高清屏清晰度
 */
export function getCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): IPoint {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // 计算相对于canvas的实际坐标（含DPR缩放）
  const x = (clientX - rect.left) * dpr;
  const y = (clientY - rect.top) * dpr;

  return { x, y };
}

/**
 * 在两点之间绘制平滑曲线
 * 使用二次贝塞尔曲线实现流畅的笔迹
 */
export function drawSmoothLine(
  ctx: CanvasRenderingContext2D,
  from: IPoint,
  to: IPoint
): void {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

/**
 * 计算两点之间的距离（用于压感模拟）
 */
export function getDistance(a: IPoint, b: IPoint): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * 根据绘制速度动态调整线条宽度（模拟压感）
 */
export function getDynamicLineWidth(
  speed: number,
  baseWidth: number = PEN_CONFIG.width,
  minWidth: number = PEN_CONFIG.minWidth,
  maxWidth: number = PEN_CONFIG.maxWidth
): number {
  // 速度越快线条越细，速度越慢线条越粗（模拟真实书写）
  const speedFactor = Math.min(Math.max(speed / 10, 0), 1);
  const width = maxWidth - speedFactor * (maxWidth - minWidth);
  return Math.min(Math.max(width, minWidth), maxWidth);
}

/**
 * 将Canvas内容转为带透明背景的PNG DataURL
 */
export function canvasToPNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * 将DataURL转为Blob（用于上传）
 */
export function dataURLToBlob(dataURL: string): Blob | null {
  try {
    const parts = dataURL.split(',');
    if (parts.length !== 2) return null;
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch {
    return null;
  }
}

/**
 * 创建高清Canvas并设置尺寸（处理DPR）
 */
export function createHiDPICanvas(
  width: number,
  height: number
): HTMLCanvasElement {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  initCanvasContext(ctx);

  return canvas;
}

/**
 * 判断画布是否为空（无有效签名内容）
 */
export function isCanvasEmpty(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;
  const pixelData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  ).data;
  // 检查是否有非透明像素
  for (let i = 3; i < pixelData.length; i += 4) {
    if (pixelData[i] !== 0) return false;
  }
  return true;
}

/**
 * 清空画布内容
 */
export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
