/**
 * useFeishu - 飞书多维表格环境感知 Hook
 * 获取当前表格上下文、主题模式、权限等信息
 * 监听表格选中状态和主题变化
 */

import { useState, useEffect, useCallback } from 'react';
import { bitable, ThemeModeType } from '@lark-base-open/js-sdk';
import { getExistingSignature } from '../api/feishu';
import { ThemeMode } from '../types';

interface IUseFeishuReturn {
  /** 当前主题模式 */
  theme: ThemeMode;
  /** 是否已加载环境信息 */
  isLoaded: boolean;
  /** 已存在的签名URL */
  existingSignatureUrl: string | null;
  /** 选中记录是否已变更 */
  selectionChanged: boolean;
}

export function useFeishu(): IUseFeishuReturn {
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [isLoaded, setIsLoaded] = useState(false);
  const [existingSignatureUrl, setExistingSignatureUrl] = useState<string | null>(null);
  const [selectionChanged, setSelectionChanged] = useState(false);

  /**
   * 初始化：获取主题、查询已有签名
   */
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // 获取当前主题
        const currentTheme = await bitable.bridge.getTheme();
        if (isMounted) {
          setTheme(
            currentTheme === ThemeModeType.DARK
              ? ThemeMode.DARK
              : ThemeMode.LIGHT
          );
        }

        // 查询已存在的签名
        const existingUrl = await getExistingSignature();
        if (isMounted) {
          setExistingSignatureUrl(existingUrl);
        }
      } catch (err) {
        console.error('[签字插件] 初始化失败:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    init();

    // 监听主题切换
    const unsubTheme = bitable.bridge.onThemeChange((event) => {
      if (isMounted) {
        setTheme(
          event.data.theme === ThemeModeType.DARK
            ? ThemeMode.DARK
            : ThemeMode.LIGHT
        );
      }
    });

    // 监听选中状态变化
    const unsubSelection = bitable.base.onSelectionChange(() => {
      if (isMounted) {
        setSelectionChanged((prev) => !prev); // 触发重新查询
        // 选中变化时重新查询已有签名
        getExistingSignature().then((url) => {
          if (isMounted) setExistingSignatureUrl(url);
        });
      }
    });

    return () => {
      isMounted = false;
      unsubTheme();
      unsubSelection();
    };
  }, []);

  return {
    theme,
    isLoaded,
    existingSignatureUrl,
    selectionChanged,
  };
}
