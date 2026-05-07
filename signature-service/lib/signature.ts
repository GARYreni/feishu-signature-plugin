/**
 * 签名 SVG 生成核心库
 * 共享于 Express 服务和 Vercel Serverless 函数
 */

export interface ISignatureStyle {
  fontFamily: string;
  slant: number;
  letterSpacing: number;
  underline: boolean;
  strokeWidth: number;
}

export const SIGNATURE_STYLES: Record<string, ISignatureStyle> = {
  cursive: {
    fontFamily:
      "'Segoe Script', 'Brush Script MT', 'Apple Chancery', 'Comic Sans MS', 'KaiTi', 'STKaiti', cursive, sans-serif",
    slant: -8,
    letterSpacing: 2,
    underline: true,
    strokeWidth: 1.5,
  },
  regular: {
    fontFamily:
      "'KaiTi', 'STKaiti', 'FangSong', 'SimSun', 'Noto Serif CJK SC', serif",
    slant: -3,
    letterSpacing: 4,
    underline: false,
    strokeWidth: 2,
  },
  elegant: {
    fontFamily:
      "'Snell Roundhand', 'Savoye LET', 'Brush Script MT', 'STKaiti', 'KaiTi', cursive, serif",
    slant: -12,
    letterSpacing: 3,
    underline: true,
    strokeWidth: 1,
  },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

export function hasChinese(text: string): boolean {
  return /[一-鿿㐀-䶿]/.test(text);
}

export function calculateFontSize(
  text: string,
  baseSize: number,
  maxWidth: number
): number {
  const len = text.length;
  const scaleFactor = Math.max(
    0.5,
    Math.min(1, maxWidth / (len * baseSize * 0.6))
  );
  return Math.round(baseSize * scaleFactor);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSignatureSVG(params: {
  name: string;
  style: string;
  color: string;
  size: number;
}): { svg: string; width: number; height: number } {
  const { name, color, size } = params;
  const styleConfig = SIGNATURE_STYLES[params.style] || SIGNATURE_STYLES.cursive;

  const isChinese = hasChinese(name);
  const maxWidth = 600;
  const maxHeight = 200;
  const fontSize = calculateFontSize(name, size, maxWidth);

  const estimatedTextWidth = isChinese
    ? fontSize * name.length * 0.9
    : fontSize * name.length * 0.55;

  const paddingX = 30;
  const paddingY = 40;
  const svgWidth = Math.min(
    Math.max(estimatedTextWidth + paddingX * 2, 200),
    maxWidth
  );
  const svgHeight = maxHeight;
  const centerX = svgWidth / 2;
  const baselineY = svgHeight - paddingY;

  const { r, g, b } = hexToRgb(color);
  const inkColor = `rgb(${r},${g},${b})`;
  const inkColorLight = `rgba(${r},${g},${b},0.15)`;

  const underlinePath = styleConfig.underline
    ? `
    <path d="M ${centerX - estimatedTextWidth / 2 - 10} ${baselineY + 15}
             Q ${centerX - estimatedTextWidth / 4} ${baselineY + 25},
               ${centerX} ${baselineY + 20}
             T ${centerX + estimatedTextWidth / 2 + 10} ${baselineY + 15}"
          fill="none" stroke="${inkColorLight}" stroke-width="2"
          stroke-linecap="round" opacity="0.5" />`
    : '';

  return {
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${svgWidth}" height="${svgHeight}"
     viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    <filter id="inkEffect" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5"
                         xChannelSelector="R" yChannelSelector="G" result="displaced" />
      <feGaussianBlur in="displaced" stdDeviation="0.3" result="blurred" />
      <feMerge>
        <feMergeNode in="blurred" />
        <feMergeNode in="SourceGraphic" opacity="0.85" />
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="transparent" />
  ${underlinePath}
  <text x="${centerX}" y="${baselineY}"
        font-family="${styleConfig.fontFamily}"
        font-size="${fontSize}px"
        font-style="italic"
        font-weight="500"
        fill="${inkColor}"
        text-anchor="middle"
        dominant-baseline="alphabetic"
        letter-spacing="${styleConfig.letterSpacing}"
        transform="rotate(${styleConfig.slant}, ${centerX}, ${baselineY})"
        filter="url(#inkEffect)"
        style="paint-order: stroke fill;
               stroke: ${inkColorLight};
               stroke-width: ${styleConfig.strokeWidth};
               stroke-linejoin: round;">
    ${escapeXml(name)}
  </text>
</svg>`,
    width: svgWidth,
    height: svgHeight,
  };
}
