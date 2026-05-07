/**
 * ErrorBoundary - 全局错误边界组件
 * 捕获React组件树中的未处理异常，展示友好的错误提示
 * 同时记录错误日志供排查
 */

import React from 'react';

interface IErrorBoundaryProps {
  children: React.ReactNode;
  /** 自定义错误提示 */
  fallback?: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<IErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误信息（仅在开发环境使用console，生产环境可接入日志平台）
    this.setState({ errorInfo });
    console.error('[签字插件错误]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  /** 重试：重置错误状态，尝试重新渲染 */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-secondary, #666)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text-primary, #333)' }}>
            插件运行出现异常
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: 1.6 }}>
            请尝试刷新页面或联系插件开发者
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1456f0',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
