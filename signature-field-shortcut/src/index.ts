/**
 * 签名字段捷径（FaaS版）入口文件
 *
 * 功能：将输入的文本（签名人姓名）转换为签名风格图片，
 *       作为附件保存到当前记录中。
 *
 * 架构：字段捷径(FaaS) → context.fetch() → 签名生成微服务 → 返回PNG → 写入附件字段
 *
 * 运行环境：飞书 FaaS 沙箱（Node.js 14.16.0, 1核1G）
 */

import {
  basekit,
  FieldType,
  field,
  FieldComponent,
  FieldCode,
} from '@lark-opdev/block-basekit-server-api';

const { t } = field;

// ============================================================
// 签名生成服务的部署地址（需要替换为实际部署地址）
// 推荐使用 Vercel、Railway、Replit 等平台部署 signature-service
// ============================================================
const SIGNATURE_SERVICE_URL = 'https://signature-service-sigma.vercel.app/api/sign';

// 添加签名服务的域名白名单
basekit.addDomainList(['signature-service-sigma.vercel.app', 'localhost']);

basekit.addField({
  // ========== 国际化配置 ==========
  i18n: {
    messages: {
      'zh-CN': {
        'signer_name': '签名人姓名',
        'signer_name_placeholder': '请输入签名人姓名',
        'font_style': '签名风格',
        'style_cursive': '行书风格',
        'style_regular': '楷书风格',
        'style_elegant': '草书风格',
        'pen_color': '笔迹颜色',
        'color_black': '黑色',
        'color_blue': '蓝色',
        'color_red': '红色',
        'font_size': '字号大小',
        'size_small': '小',
        'size_medium': '中',
        'size_large': '大',
        'attachment_name': '签名图片',
        'error_empty_name': '请输入签名人姓名',
        'error_generate_failed': '签名生成失败，请稍后重试',
        'error_service_unavailable': '签名服务不可用，请检查服务状态',
      },
      'en-US': {
        'signer_name': 'Signer Name',
        'signer_name_placeholder': 'Enter signer name',
        'font_style': 'Signature Style',
        'style_cursive': 'Cursive',
        'style_regular': 'Regular Script',
        'style_elegant': 'Elegant',
        'pen_color': 'Pen Color',
        'color_black': 'Black',
        'color_blue': 'Blue',
        'color_red': 'Red',
        'font_size': 'Font Size',
        'size_small': 'Small',
        'size_medium': 'Medium',
        'size_large': 'Large',
        'attachment_name': 'Signature',
        'error_empty_name': 'Please enter signer name',
        'error_generate_failed': 'Signature generation failed, please try again',
        'error_service_unavailable': 'Signature service unavailable',
      },
      'ja-JP': {
        'signer_name': '署名者名',
        'signer_name_placeholder': '署名者名を入力',
        'font_style': '署名スタイル',
        'style_cursive': '筆記体',
        'style_regular': '楷書体',
        'style_elegant': '草書体',
        'pen_color': 'ペンの色',
        'color_black': '黒',
        'color_blue': '青',
        'color_red': '赤',
        'font_size': 'フォントサイズ',
        'size_small': '小',
        'size_medium': '中',
        'size_large': '大',
        'attachment_name': '署名画像',
        'error_empty_name': '署名者名を入力してください',
        'error_generate_failed': '署名の生成に失敗しました',
        'error_service_unavailable': '署名サービスが利用できません',
      },
    },
  },

  // ========== 表单配置（用户在配置字段时看到的UI） ==========
  formItems: [
    {
      key: 'signerName',
      label: t('signer_name'),
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Text],
        placeholder: t('signer_name_placeholder'),
      },
      validator: {
        required: true,
      },
      tooltips: [
        {
          type: 'text',
          content: '选择一个文本字段作为签名人姓名',
        },
      ],
    },
    {
      key: 'fontStyle',
      label: t('font_style'),
      component: FieldComponent.SingleSelect,
      props: {
        options: [
          { label: t('style_cursive'), value: 'cursive' },
          { label: t('style_regular'), value: 'regular' },
          { label: t('style_elegant'), value: 'elegant' },
        ],
      },
      validator: {
        required: false,
      },
    },
    {
      key: 'penColor',
      label: t('pen_color'),
      component: FieldComponent.SingleSelect,
      props: {
        options: [
          { label: t('color_black'), value: '000000' },
          { label: t('color_blue'), value: '1a56db' },
          { label: t('color_red'), value: 'dc2626' },
        ],
      },
      validator: {
        required: false,
      },
    },
    {
      key: 'fontSize',
      label: t('font_size'),
      component: FieldComponent.SingleSelect,
      props: {
        options: [
          { label: t('size_small'), value: '48' },
          { label: t('size_medium'), value: '64' },
          { label: t('size_large'), value: '80' },
        ],
      },
      validator: {
        required: false,
      },
    },
  ],

  // ========== 返回结果类型：附件字段 ==========
  resultType: {
    type: FieldType.Attachment,
  },

  // ========== 执行函数：调用签名服务生成图片 → 返回附件 ==========
  execute: async (formItemParams: {
    signerName?: { text: string }[];
    fontStyle?: { label: string; value: string };
    penColor?: { label: string; value: string };
    fontSize?: { label: string; value: string };
  }, context) => {
    // 提取参数
    const signerNameField = formItemParams.signerName;
    const fontStyle = formItemParams.fontStyle?.value || 'cursive';
    const penColor = formItemParams.penColor?.value || '000000';
    const fontSize = formItemParams.fontSize?.value || '64';

    // 获取签名人姓名文本
    const nameSegments = Array.isArray(signerNameField) ? signerNameField : [];
    const signerName = nameSegments
      .map((seg: { text?: string }) => seg.text || '')
      .join('')
      .trim();

    if (!signerName) {
      return {
        code: FieldCode.InvalidArgument,
        msg: t('error_empty_name'),
      };
    }

    try {
      // 构建签名服务URL
      const params = new URLSearchParams({
        name: signerName,
        style: fontStyle,
        color: penColor,
        size: fontSize,
      });

      const serviceUrl = `${SIGNATURE_SERVICE_URL}?${params.toString()}`;

      // 调用签名生成服务
      const response = await context.fetch(serviceUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          code: FieldCode.Error,
          msg: `===签名字段捷径: 服务返回错误 status=${response.status}`,
        };
      }

      // 获取图片的 Content-Type
      const contentType = response.headers.get('content-type') || 'image/png';

      // 返回附件结果
      return {
        code: FieldCode.Success,
        data: [
          {
            name: `${signerName}_签名.png`,
            content: serviceUrl, // 签名图片的直接下载URL
            contentType: 'attachment/url',
            // SVG生成的可缩放图片，提供合适的宽高
            width: 320,
            height: 160,
          },
        ],
      };
    } catch (error: any) {
      console.log('===签名字段捷径: 调用签名服务失败', String(error));
      return {
        code: FieldCode.Error,
        msg: t('error_generate_failed'),
      };
    }
  },

  // ========== 字段配置 ==========
  options: {
    // 签名生成通常较快，保持自动更新
    disableAutoUpdate: false,
  },
});

export default basekit;
