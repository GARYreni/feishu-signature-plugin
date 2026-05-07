/**
 * Toast - 轻量级消息提示组件
 * 支持成功、错误、警告、信息、加载五种类型
 * 自动销毁，支持多条同时显示
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ToastType } from '../types';
import type { IToastConfig } from '../types';

interface IToastItem extends IToastConfig {
  id: number;
  /** 是否正在离开（动画） */
  leaving?: boolean;
}

/** Toast管理器的全局状态（模块级单例） */
let toastIdCounter = 0;
let setToastList: React.Dispatch<React.SetStateAction<IToastItem[]>> | null = null;

/**
 * 显示Toast消息（全局函数，可在任何地方调用）
 */
export function showToast(config: IToastConfig): number {
  const id = ++toastIdCounter;
  const item: IToastItem = { ...config, id };

  setToastList?.((prev) => [...prev, item]);

  // 设置自动关闭
  if (config.duration !== 0) {
    const duration = config.duration || getDefaultDuration(config.message);
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

/** 便捷方法 */
export const toast = {
  success: (message: string, duration?: number) =>
    showToast({ message, type: ToastType.Success, duration }),
  error: (message: string, duration?: number) =>
    showToast({ message, type: ToastType.Error, duration }),
  warning: (message: string, duration?: number) =>
    showToast({ message, type: ToastType.Warning, duration }),
  info: (message: string, duration?: number) =>
    showToast({ message, type: ToastType.Info, duration }),
  loading: (message: string) =>
    showToast({ message, type: ToastType.Loading, duration: 0 }),
};

/**
 * 关闭指定Toast
 */
export function dismissToast(id: number): void {
  setToastList?.((prev) =>
    prev.map((item) => (item.id === id ? { ...item, leaving: true } : item))
  );
  // 动画结束后移除
  setTimeout(() => {
    setToastList?.((prev) => prev.filter((item) => item.id !== id));
  }, 300);
}

/**
 * 根据消息长度计算合理的显示时长
 * 中文约每秒阅读4-5个字
 */
function getDefaultDuration(message: string): number {
  const charCount = message.length;
  const readTime = Math.ceil(charCount / 5) * 1000;
  return Math.min(Math.max(readTime, 2000), 8000); // 2s-8s之间
}

/** Toast类型对应的图标 */
const TOAST_ICONS: Record<ToastType, string> = {
  [ToastType.Success]: '✓',
  [ToastType.Error]: '✕',
  [ToastType.Warning]: '⚠',
  [ToastType.Info]: 'ℹ',
  [ToastType.Loading]: '⏳',
};

/** Toast类型对应的颜色 */
const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  [ToastType.Success]: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
  [ToastType.Error]: { bg: '#fbe9e7', border: '#f44336', text: '#c62828' },
  [ToastType.Warning]: { bg: '#fff8e1', border: '#ff9800', text: '#e65100' },
  [ToastType.Info]: { bg: '#e3f2fd', border: '#2196f3', text: '#0d47a1' },
  [ToastType.Loading]: { bg: '#f3e5f5', border: '#9c27b0', text: '#6a1b9a' },
};

/**
 * Toast容器组件（挂载在App根节点）
 */
const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<IToastItem[]>([]);

  useEffect(() => {
    setToastList = setToasts;
    return () => {
      setToastList = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((item) => {
        const colors = TOAST_COLORS[item.type];
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '6px',
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: '14px',
              lineHeight: '20px',
              maxWidth: '360px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              pointerEvents: 'auto',
              opacity: item.leaving ? 0 : 1,
              transform: item.leaving ? 'translateY(-10px)' : 'translateY(0)',
              transition: 'opacity 0.3s, transform 0.3s',
            }}
            role="alert"
          >
            <span style={{ fontSize: '16px', flexShrink: 0 }}>
              {TOAST_ICONS[item.type]}
            </span>
            <span style={{ flex: 1 }}>{item.message}</span>
            {item.type !== ToastType.Loading && (
              <button
                onClick={() => dismissToast(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.text,
                  opacity: 0.6,
                  fontSize: '14px',
                  padding: '0 2px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
