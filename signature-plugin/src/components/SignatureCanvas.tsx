/**
 * SignatureCanvas - 签名画布主组件
 * 组合签名画布、操作按钮和状态管理
 * 处理签名图片的生成、压缩和保存流程
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import SignaturePad from './SignaturePad';
import { toast } from './Toast';
import { PEN_CONFIG, isCanvasEmpty, canvasToPNG } from '../utils/canvas';
import { compressImage, validateImageSize } from '../utils';
import type { IUploadResult } from '../types';

interface ISignatureCanvasProps {
  /** 签名保存回调：返回签名图片的DataURL */
  onSave: (dataUrl: string) => Promise<IUploadResult>;
  /** 容器宽度（用于自适应计算画布尺寸） */
  containerWidth: number;
  /** 是否禁用组件 */
  disabled?: boolean;
  /** 已有的签名URL（用于显示已保存的缩略图） */
  existingSignatureUrl?: string | null;
}

const SignatureCanvas: React.FC<ISignatureCanvasProps> = ({
  onSave,
  containerWidth,
  disabled = false,
  existingSignatureUrl = null,
}) => {
  // Canvas引用
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 是否有签名内容
  const [hasContent, setHasContent] = useState(false);
  // 是否正在保存中
  const [isSaving, setIsSaving] = useState(false);
  // 已上传的签名URL缩略图
  const [savedUrl, setSavedUrl] = useState<string | null>(existingSignatureUrl);
  // 错误信息
  const [error, setError] = useState<string | null>(null);

  /** 画布尺寸计算（响应式） */
  const canvasWidth = Math.max(containerWidth - 16, 240); // 最小240px
  const canvasHeight = Math.round(canvasWidth / 3); // 3:1 宽高比

  // 同步外部传入的URL
  useEffect(() => {
    if (existingSignatureUrl !== undefined) {
      setSavedUrl(existingSignatureUrl);
    }
  }, [existingSignatureUrl]);

  /**
   * Canvas就绪回调
   */
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    setHasContent(false);
    setError(null);
  }, []);

  /**
   * 清空画布：清除所有签名内容，重置状态
   */
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 重置状态
    setHasContent(false);
    setError(null);
  }, []);

  /**
   * 监听鼠标/触摸抬起以更新内容状态
   */
  const handleInteractionEnd = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasContent(!isCanvasEmpty(canvas));
  }, []);

  /**
   * 保存签名：生成图片→压缩→上传
   */
  const handleSave = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 检查画布是否为空
    if (isCanvasEmpty(canvas)) {
      toast.warning('请先在画布上签名后再保存', 2500);
      return;
    }

    // 防止重复提交
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      // 1. 将Canvas转为PNG DataURL
      let dataUrl = canvasToPNG(canvas);

      // 2. 校验图片大小
      if (!validateImageSize(dataUrl)) {
        // 压缩图片
        dataUrl = await compressImage(dataUrl);
        if (!validateImageSize(dataUrl)) {
          toast.warning('签名图片过大，请适当减小签名面积', 3000);
          setIsSaving(false);
          return;
        }
      }

      // 3. 调用父组件的保存回调（上传到飞书）
      const result = await onSave(dataUrl);

      if (result.success) {
        setSavedUrl(dataUrl);
        toast.success('签名保存成功', 2500);
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存签名时发生未知错误';
      setError(errorMsg);
      toast.error(errorMsg, 4000);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSave]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '8px 0',
        width: '100%',
      }}
    >
      {/* 画布区域 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '6px',
          overflow: 'hidden',
        }}
        onMouseUp={handleInteractionEnd}
        onTouchEnd={handleInteractionEnd}
      >
        <SignaturePad
          width={canvasWidth}
          height={canvasHeight}
          penColor={PEN_CONFIG.color}
          penWidth={PEN_CONFIG.width}
          disabled={disabled || isSaving}
          onCanvasReady={handleCanvasReady}
        />

        {/* 无内容时的引导提示 */}
        {!hasContent && !savedUrl && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              color: 'var(--text-placeholder, #bbb)',
              fontSize: '16px',
              userSelect: 'none',
            }}
          >
            请在此处签名
          </div>
        )}
      </div>

      {/* 操作按钮行 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}
      >
        {/* 清空按钮 */}
        <button
          onClick={handleClear}
          disabled={disabled || isSaving || (!hasContent && !savedUrl)}
          style={{
            padding: '8px 20px',
            border: '1px solid var(--border-color, #dee0e3)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary, #666)',
            fontSize: '14px',
            cursor: disabled || isSaving || (!hasContent && !savedUrl) ? 'not-allowed' : 'pointer',
            opacity: disabled || isSaving || (!hasContent && !savedUrl) ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          清空
        </button>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={disabled || isSaving || !hasContent}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'var(--primary-color, #1456f0)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: disabled || isSaving || !hasContent ? 'not-allowed' : 'pointer',
            opacity: disabled || isSaving || !hasContent ? 0.5 : 1,
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isSaving ? (
            <>
              {/* 加载旋转图标 */}
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              保存中...
            </>
          ) : (
            '保存签名'
          )}
        </button>
      </div>

      {/* 已保存的签名缩略图 */}
      {savedUrl && (
        <div
          style={{
            border: '1px solid var(--border-color, #e3e5e8)',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: 'var(--bg-light, #fafafa)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #999)',
              marginBottom: '8px',
            }}
          >
            已保存的签名
          </div>
          <img
            src={savedUrl}
            alt="已保存的签名"
            style={{
              maxWidth: '100%',
              maxHeight: '80px',
              display: 'block',
              borderRadius: '4px',
              border: '1px solid var(--border-color, #f0f0f0)',
              backgroundColor: '#fff',
            }}
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* 加载动画关键帧 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SignatureCanvas;
