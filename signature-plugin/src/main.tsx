/**
 * 签字插件入口文件
 * 挂载React应用到DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 挂载根组件
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('找不到根元素 #root，请检查 index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
