/**
 * SignaturePad - 手写签名画布核心组件
 * 负责Canvas渲染、鼠标/触摸事件处理、笔迹绘制
 * 支持压力感应模拟和多点触摸
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { IPoint } from '../types';
import {
  initCanvasContext,
  getCanvasPoint,
  drawSmoothLine,
  getDistance,
  getDynamicLineWidth,
  PEN_CONFIG,
} from '../utils/canvas';

interface ISignaturePadProps {
  /** 画布CSS宽度 */
  width: number;
  /** 画布CSS高度 */
  height: number;
  /** 画笔颜色 */
  penColor?: string;
  /** 画笔宽度 */
  penWidth?: number;
  /** 是否禁用绘制 */
  disabled?: boolean;
  /** Canvas就绪回调，暴露canvas引用给父组件 */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const SignaturePad: React.FC<ISignaturePadProps> = ({
  width,
  height,
  penColor = PEN_CONFIG.color,
  penWidth = PEN_CONFIG.width,
  disabled = false,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 记录绘制状态
  const isDrawingRef = useRef(false);
  // 记录上一个绘制点位置（用于计算速度和压感）
  const lastPointRef = useRef<IPoint | null>(null);
  // 记录上一个点的时间戳（用于计算绘制速度）
  const lastTimeRef = useRef<number>(0);

  const dpr = window.devicePixelRatio || 1;

  /**
   * 初始化画布：设置尺寸、DPR缩放、绘图样式
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置Canvas物理像素尺寸（高清屏适配）
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    initCanvasContext(ctx, penColor, penWidth);

    // 暴露canvas引用给父组件
    onCanvasReady?.(canvas);
  }, [width, height, dpr, penColor, penWidth, onCanvasReady]);

  /**
   * 获取Canvas上下文
   */
  const getCtx = useCallback((): CanvasRenderingContext2D | null => {
    return canvasRef.current?.getContext('2d') || null;
  }, []);

  /**
   * 开始绘制：记录起始位置和时间
   */
  const startDrawing = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      const canvas = canvasRef.current;
      if (!canvas || !getCtx()) return;

      const point = getCanvasPoint(canvas, clientX, clientY);
      isDrawingRef.current = true;
      lastPointRef.current = point;
      lastTimeRef.current = Date.now();
    },
    [disabled, getCtx]
  );

  /**
   * 绘制过程：计算速度→动态线宽→绘制平滑线段
   */
  const draw = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawingRef.current || disabled) return;
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;

      const currentPoint = getCanvasPoint(canvas, clientX, clientY);
      const prevPoint = lastPointRef.current!;
      const prevTime = lastTimeRef.current;
      const now = Date.now();

      // 计算绘制速度（用于压感模拟）
      const distance = getDistance(prevPoint, currentPoint);
      const timeDelta = Math.max(now - prevTime, 1);
      const speed = distance / timeDelta; // px/ms

      // 根据速度动态调整线宽：慢则粗，快则细
      const dynamicWidth = getDynamicLineWidth(speed, penWidth);
      ctx.lineWidth = dynamicWidth;

      // 绘制平滑线段
      drawSmoothLine(ctx, prevPoint, currentPoint);

      // 更新上一次的位置和时间
      lastPointRef.current = currentPoint;
      lastTimeRef.current = now;
    },
    [disabled, getCtx, penWidth]
  );

  /**
   * 结束绘制：重置状态
   */
  const endDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    lastTimeRef.current = 0;
  }, []);

  // ========== 鼠标事件处理 ==========
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      startDrawing(e.clientX, e.clientY);
    },
    [startDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      draw(e.clientX, e.clientY);
    },
    [draw]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      endDrawing();
    },
    [endDrawing]
  );

  const handleMouseLeave = useCallback(() => {
    if (isDrawingRef.current) endDrawing();
  }, [endDrawing]);

  // ========== 触摸事件处理（移动端/手写板） ==========
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        // 检查是否支持压力感应
        startDrawing(touch.clientX, touch.clientY);
      }
    },
    [startDrawing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        draw(touch.clientX, touch.clientY);
      }
    },
    [draw]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      endDrawing();
    },
    [endDrawing]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: disabled ? 'not-allowed' : 'crosshair',
        borderRadius: '4px',
        border: '1px solid var(--border-color, #dee0e3)',
        backgroundColor: 'var(--canvas-bg, #ffffff)',
        touchAction: 'none', // 阻止浏览器默认触摸行为（如滚动）
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export default React.memo(SignaturePad);
