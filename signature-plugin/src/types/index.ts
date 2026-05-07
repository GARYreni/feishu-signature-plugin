/**
 * 签字插件核心类型定义
 */

/** 画布绘制坐标点 */
export interface IPoint {
  x: number;
  y: number;
}

/** 签名上下文 - 当前多维表格环境信息 */
export interface ISignatureContext {
  /** 当前表格ID */
  tableId: string;
  /** 当前视图ID */
  viewId: string;
  /** 当前选中记录ID */
  recordId: string;
  /** 当前多维表格ID */
  baseId: string;
  /** 附件字段ID（用于上传签名） */
  attachmentFieldId: string;
}

/** 签名画布组件Props */
export interface ISignatureCanvasProps {
  /** 画布宽度（px），默认自适应容器 */
  width?: number;
  /** 画布高度（px），默认200 */
  height?: number;
  /** 线条颜色 */
  penColor?: string;
  /** 线条宽度 */
  penWidth?: number;
  /** 签名完成回调 */
  onSave?: (dataUrl: string) => void | Promise<void>;
  /** 签名清空回调 */
  onClear?: () => void;
  /** 是否禁用绘制 */
  disabled?: boolean;
}

/** 签名画布状态 */
export interface ISignatureState {
  /** 是否正在绘制 */
  isDrawing: boolean;
  /** 是否有签名内容 */
  hasContent: boolean;
  /** 上一个绘图位置 */
  lastPoint: IPoint | null;
}

/** 签名Pad组件Props */
export interface ISignaturePadProps {
  /** 画布宽度 */
  canvasWidth: number;
  /** 画布高度 */
  canvasHeight: number;
  /** 线条颜色 */
  penColor: string;
  /** 线条宽度 */
  penWidth: number;
  /** 是否禁用 */
  disabled: boolean;
  /** Canvas引用回调 */
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

/** Toast消息类型 */
export enum ToastType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Loading = 'loading',
}

/** Toast配置 */
export interface IToastConfig {
  /** 消息内容 */
  message: string;
  /** 消息类型 */
  type: ToastType;
  /** 显示时长(ms)，0表示不自动关闭 */
  duration?: number;
  /** 关闭回调 */
  onClose?: () => void;
}

/** 插件数据存储键名常量 */
export const enum StorageKey {
  /** 已上传签名URL缓存 */
  SignatureUrl = 'signature_url',
  /** 上次使用的附件字段ID */
  LastFieldId = 'last_attachment_field_id',
}

/** 上传结果 */
export interface IUploadResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 上传后的附件token */
  fileToken?: string;
}

/** 主题模式 */
export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

/** 运行环境信息 */
export interface IRuntimeEnv {
  /** 当前主题模式 */
  theme: ThemeMode;
  /** 当前用户ID */
  userId: string;
  /** 是否有编辑权限 */
  isEditable: boolean;
}
