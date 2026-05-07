/**
 * useSignature - 签名业务流程 Hook
 * 管理签名保存的完整生命周期：上下文获取 → 权限检查 → 上传 → 状态更新
 */

import { useState, useCallback, useRef } from 'react';
import { uploadSignature } from '../api/feishu';
import { ToastType } from '../types';
import type { IUploadResult } from '../types';
import { toast } from '../components/Toast';

interface IUseSignatureReturn {
  /** 是否正在上传 */
  isUploading: boolean;
  /** 上次上传结果 */
  lastResult: IUploadResult | null;
  /** 错误信息 */
  error: string | null;
  /** 保存签名 */
  saveSignature: (dataUrl: string) => Promise<IUploadResult>;
  /** 重置状态 */
  reset: () => void;
}

export function useSignature(): IUseSignatureReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [lastResult, setLastResult] = useState<IUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 使用ref防止重复提交
  const savingRef = useRef(false);

  /**
   * 保存签名到飞书多维表格
   */
  const saveSignature = useCallback(
    async (dataUrl: string): Promise<IUploadResult> => {
      // 防止重复提交
      if (savingRef.current) {
        return { success: false, error: '正在保存中，请稍候...' };
      }

      savingRef.current = true;
      setIsUploading(true);
      setError(null);

      try {
        const result = await uploadSignature(dataUrl);
        setLastResult(result);

        if (!result.success) {
          setError(result.error || '保存失败');
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : '保存签名时发生未知错误';
        setError(errorMsg);

        const failedResult: IUploadResult = {
          success: false,
          error: errorMsg,
        };
        setLastResult(failedResult);
        return failedResult;
      } finally {
        savingRef.current = false;
        setIsUploading(false);
      }
    },
    []
  );

  /** 重置所有状态 */
  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
    setIsUploading(false);
    savingRef.current = false;
  }, []);

  return {
    isUploading,
    lastResult,
    error,
    saveSignature,
    reset,
  };
}
