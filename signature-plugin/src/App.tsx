/**
 * App - 签字插件根组件
 * 整合签名画布、错误边界、主题管理、国际化
 * 遵循飞书 Base 设计规范，支持深浅色主题自动切换
 */

import React, { useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from './i18n';
import SignatureCanvas from './components/SignatureCanvas';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { useFeishu } from './hooks/useFeishu';
import { useSignature } from './hooks/useSignature';
import './App.css';

// 初始化国际化（默认中文）
initI18n('zh');

/** 加载中的占位组件 */
const LoadingView: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      color: 'var(--text-secondary, #999)',
      gap: '12px',
    }}
  >
    <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)' }} />
    <span style={{ fontSize: '13px' }}>加载中...</span>
  </div>
);

const App: React.FC = () => {
  // 感知飞书运行环境
  const { theme, isLoaded, existingSignatureUrl } = useFeishu();
  // 签名上传流程
  const { isUploading, saveSignature } = useSignature();

  // 根据主题设置 data-theme 属性到根元素
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.toLowerCase());
  }, [theme]);

  // 监听容器尺寸变化，计算可用宽度
  const [containerWidth, setContainerWidth] = React.useState(400);

  React.useEffect(() => {
    const updateWidth = () => {
      // 获取插件面板可用宽度
      const root = document.getElementById('root');
      if (root) {
        const width = root.clientWidth;
        setContainerWidth(width > 0 ? width : 400);
      }
    };

    updateWidth();

    // 使用 ResizeObserver 监听容器大小变化
    const root = document.getElementById('root');
    if (root && window.ResizeObserver) {
      const observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(root);
      return () => observer.disconnect();
    }

    // 降级方案：监听窗口大小变化
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 判断是否为加载态
  if (!isLoaded) {
    return (
      <I18nextProvider i18n={i18n}>
        <LoadingView />
      </I18nextProvider>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <ToastContainer />
        <div className="signature-app">
          {/* 标题区 */}
          <div className="signature-app__header">
            <h1 className="signature-app__title">
              {i18n.t('app.title')}
            </h1>
          </div>

          {/* 功能描述 */}
          <p className="signature-app__description">
            {i18n.t('app.description')}
          </p>

          {/* 签名画布区域 */}
          <SignatureCanvas
            onSave={saveSignature}
            containerWidth={containerWidth}
            disabled={isUploading}
            existingSignatureUrl={existingSignatureUrl}
          />
        </div>
      </ErrorBoundary>
    </I18nextProvider>
  );
};

export default App;
