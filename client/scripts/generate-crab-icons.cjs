// generate-crab-icons.cjs — 直接用 sharp 绘制像素螃蟹 Coco 图标
// 完全匹配 CrabCharacter.jsx 中的 BASE 16×14 像素网格
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 颜色常量 (与 CrabCharacter.jsx 完全一致)
const CLR = {
  D: '#E89878',
  O: '#FFB088',
  L: '#FFD0B8',
  W: '#FFFFFF',
  B: '#3D2B2B',
  S: '#FFFFFF',
  P: '#FFC8C8',
  M: '#D08070',
};

const BASE = [
  ['t','t','t','t','t','D','D','D','D','D','D','t','t','t','t','t'],
  ['t','t','t','t','D','O','O','O','O','O','O','D','t','t','t','t'],
  ['t','t','t','D','O','O','O','O','O','O','O','O','D','t','t','t'],
  ['t','t','D','O','O','O','L','O','O','L','O','O','O','D','t','t'],
  ['t','t','D','O','O','L','O','O','O','O','L','O','O','D','t','t'],
  ['t','D','O','O','O','D','D','D','D','D','D','O','O','O','D','t'],
  ['t','D','O','O','D','W','W','W','W','W','W','D','O','O','D','t'],
  ['t','D','O','L','D','W','B','B','S','B','W','D','L','O','D','t'],
  ['t','D','O','O','D','W','B','B','B','B','W','D','O','O','D','t'],
  ['t','t','D','O','D','W','W','W','W','W','W','D','O','D','t','t'],
  ['t','t','D','O','O','D','D','D','D','D','D','O','O','D','t','t'],
  ['t','t','t','D','O','O','O','P','P','O','O','O','D','t','t','t'],
  ['t','t','t','t','D','O','O','O','M','O','O','D','t','t','t','t'],
  ['t','t','t','t','t','D','D','D','O','D','D','t','t','t','t','t'],
];

const LCLAW = [
  ['t','t','D','D'],
  ['t','D','O','D'],
  ['D','O','O','D'],
  ['D','O','O','t'],
  ['t','D','D','t'],
];

const RCLAW = [
  ['D','D','t','t'],
  ['D','O','D','t'],
  ['D','O','O','D'],
  ['t','O','O','D'],
  ['t','D','D','t'],
];

const LLEGS = [[2,9],[1,10],[2,11]];
const RLEGS = [[13,9],[14,10],[13,11]];

async function generateIcon(size) {
  const P = Math.floor(size / 22);
  const totalW = 22 * P;
  const totalH = 18 * P;
  const BW = 16;

  let svgRects = '';

  function addRect(gx, gy, color) {
    if (!color) return;
    const x = gx * P;
    const y = gy * P;
    svgRects += `<rect x="${x}" y="${y}" width="${P}" height="${P}" fill="${color}" shape-rendering="crispEdges"/>\n`;
  }

  LLEGS.forEach(([x, y]) => addRect(x, y, CLR.D));
  RLEGS.forEach(([x, y]) => addRect(x, y, CLR.D));

  for (let y = 0; y < LCLAW.length; y++) {
    for (let x = 0; x < LCLAW[y].length; x++) {
      const c = LCLAW[y][x];
      if (c !== 't' && CLR[c]) { addRect(-4 + x, 2 + y, CLR[c]); }
    }
  }

  for (let y = 0; y < RCLAW.length; y++) {
    for (let x = 0; x < RCLAW[y].length; x++) {
      const c = RCLAW[y][x];
      if (c !== 't' && CLR[c]) { addRect(BW + x, 2 + y, CLR[c]); }
    }
  }

  for (let y = 0; y < BASE.length; y++) {
    for (let x = 0; x < BASE[y].length; x++) {
      const c = BASE[y][x];
      if (c !== 't' && CLR[c]) { addRect(x, y, CLR[c]); }
    }
  }

  const centerX = totalW / 2;
  const centerY = totalH / 2;
  const radius = Math.min(totalW, totalH) * 0.46;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
<defs>
  <radialGradient id="bg" cx="50%" cy="48%" r="50%">
    <stop offset="0%" stop-color="#FFF5EE"/>
    <stop offset="100%" stop-color="#FFE8D6"/>
  </radialGradient>
</defs>
<rect width="${totalW}" height="${totalH}" fill="#FFF5EE"/>
<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="url(#bg)" stroke="#E89878" stroke-width="${Math.max(1, P * 0.3)}"/>
${svgRects}
</svg>`;

  const outputPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}.png`);

  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 245, b: 238, alpha: 0 } })
    .png()
    .toFile(outputPath);

  console.log(`✓ icon-${size}.png 生成完成 (${size}x${size})`);
}

async function main() {
  await generateIcon(192);
  await generateIcon(512);
  console.log('\n✅ 螃蟹图标全部生成完毕!');
}

main().catch(err => { console.error('❌ 生成失败:', err); process.exit(1); });