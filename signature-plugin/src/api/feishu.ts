/**
 * 飞书多维表格 API 服务模块
 * 封装飞书 Base JS SDK 调用，处理签名附件的上传逻辑
 * 注意：所有数据均在飞书服务器端处理，本地不存储敏感信息
 */

import { bitable, FieldType } from '@lark-base-open/js-sdk';
import type {
  ITable,
  IAttachmentField,
  IFieldMeta,
} from '@lark-base-open/js-sdk';
import type {
  IUploadResult,
  ISignatureContext,
} from '../types';
import { generateFileName } from '../utils';

/**
 * 获取当前多维表格的上下文信息
 * 包括表格ID、记录ID、视图ID等
 */
export async function getSignatureContext(): Promise<ISignatureContext> {
  const selection = await bitable.base.getSelection();
  const table = await bitable.base.getActiveTable();
  const tableMeta = await table.getMeta();

  if (!selection.recordId) {
    throw new Error('请先选中一条记录，再使用签名功能');
  }

  return {
    baseId: selection.baseId || '',
    tableId: tableMeta.id,
    viewId: selection.viewId || '',
    recordId: selection.recordId,
    attachmentFieldId: '',
  };
}

/**
 * 查找表格中的附件类型字段
 * 用于确定签名图片上传到哪个字段
 * 优先返回最近的附件字段，若无则抛出异常提示用户手动添加
 */
export async function findAttachmentField(table: ITable): Promise<IFieldMeta> {
  const fieldMetaList = await table.getFieldMetaList();

  // 筛选附件类型字段
  const attachmentFields = fieldMetaList.filter(
    (field) => field.type === FieldType.Attachment
  );

  if (attachmentFields.length === 0) {
    throw new Error(
      '当前表格中没有附件字段，请先添加一个附件类型字段用于存储签名图片'
    );
  }

  // 如果只有一个附件字段，直接返回
  if (attachmentFields.length === 1) {
    return attachmentFields[0];
  }

  // 优先选择名称中包含"签名"的字段
  const signatureField = attachmentFields.find(
    (field) =>
      field.name.includes('签名') ||
      field.name.toLowerCase().includes('signature') ||
      field.name.toLowerCase().includes('sign')
  );

  return signatureField || attachmentFields[0];
}

/**
 * 将签名图片DataURL转为File对象
 */
export function dataURLToFile(dataURL: string): File | null {
  try {
    const blob = dataURLToBlob(dataURL);
    if (!blob) return null;
    const fileName = generateFileName();
    return new File([blob], fileName, { type: 'image/png' });
  } catch {
    return null;
  }
}

/**
 * 内联工具：将Base64 DataURL转为Blob
 */
function dataURLToBlob(dataURL: string): Blob | null {
  const parts = dataURL.split(',');
  if (parts.length !== 2) return null;
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binaryStr = atob(parts[1]);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * 检查当前用户是否有编辑权限
 */
export async function checkEditPermission(): Promise<boolean> {
  try {
    return await bitable.base.isEditable();
  } catch {
    return false;
  }
}

/**
 * 上传签名图片到当前记录的附件字段
 *
 * 流程：
 * 1. 获取附件字段实例
 * 2. 获取当前记录已有的附件
 * 3. 将签名图片添加到现有附件列表
 * 4. 更新记录附件字段值
 */
export async function uploadSignature(
  dataURL: string
): Promise<IUploadResult> {
  try {
    // 1. 获取当前表格上下文
    const table = await bitable.base.getActiveTable();
    const selection = await bitable.base.getSelection();

    if (!selection.recordId) {
      return {
        success: false,
        error: '请先选中一条记录',
      };
    }

    // 2. 检查编辑权限
    const isEditable = await checkEditPermission();
    if (!isEditable) {
      return {
        success: false,
        error: '您没有编辑权限，请联系表格管理员',
      };
    }

    // 3. 查找附件字段
    const attachmentFieldMeta = await findAttachmentField(table);
    const attachmentField = await table.getField<IAttachmentField>(
      attachmentFieldMeta.id
    );

    // 4. 将签名DataURL转为File对象
    const signatureFile = dataURLToFile(dataURL);
    if (!signatureFile) {
      return {
        success: false,
        error: '图片转换失败，请重试',
      };
    }

    // 5. 上传文件到飞书（Base JS SDK 批量上传）
    const fileTokens = await bitable.base.batchUploadFile([signatureFile]);

    if (!fileTokens || fileTokens.length === 0) {
      return {
        success: false,
        error: '文件上传失败，请重试',
      };
    }

    const fileToken = fileTokens[0];

    // 6. 直接上传签名文件作为附件字段值
    // Base JS SDK 的 setValue 支持直接传入 File 对象
    await attachmentField.setValue(selection.recordId, signatureFile as any);

    return {
      success: true,
      fileToken,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '签名上传失败';
    console.error('[签字插件] 上传失败:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 获取已上传签名附件的下载URL
 * 用于在插件中显示已存在的签名缩略图
 */
export async function getExistingSignature(): Promise<string | null> {
  try {
    const table = await bitable.base.getActiveTable();
    const selection = await bitable.base.getSelection();

    if (!selection.recordId) return null;

    const attachmentFieldMeta = await findAttachmentField(table);
    const attachmentField = await table.getField<IAttachmentField>(
      attachmentFieldMeta.id
    );

    const value = await attachmentField.getValue(selection.recordId);
    const attachments = Array.isArray(value) ? value : [];

    if (attachments.length === 0) return null;

    // 返回最后一个附件（即最近的签名）的缩略图URL
    const lastAttachment = attachments[attachments.length - 1];

    // 通过 SDK 获取附件临时下载URL
    const tokens = attachments.map(
      (a: any) => a.file_token || ''
    );
    const urls = await table.getCellAttachmentUrls(
      tokens,
      attachmentFieldMeta.id,
      selection.recordId
    );

    return urls.length > 0 ? urls[urls.length - 1] : null;
  } catch {
    return null;
  }
}
