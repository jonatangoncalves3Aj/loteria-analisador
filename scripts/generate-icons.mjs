// Gera ícones PNG para o PWA a partir de um SVG
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1d4ed8"/>
  <rect x="136" y="200" width="240" height="180" rx="16" fill="none" stroke="white" stroke-width="24"/>
  <path d="M196 200v-28a28 28 0 0 1 28-28h64a28 28 0 0 1 28 28v28" fill="none" stroke="white" stroke-width="24" stroke-linecap="round"/>
  <line x1="256" y1="200" x2="256" y2="380" stroke="white" stroke-width="24" stroke-linecap="round"/>
  <line x1="136" y1="280" x2="376" y2="280" stroke="white" stroke-width="24"/>
</svg>`;

const svgBuf = Buffer.from(svg);

const sizes = [64, 192, 512, 180];

for (const size of sizes) {
  const png = await sharp(svgBuf).resize(size, size).png().toBuffer();
  const name =
    size === 180 ? 'apple-touch-icon-180x180.png'
    : size === 64 ? 'pwa-64x64.png'
    : `pwa-${size}x${size}.png`;
  writeFileSync(join(publicDir, name), png);
  console.log(`✓ ${name}`);
}

// maskable icon (sem bordas arredondadas)
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1d4ed8"/>
  <rect x="136" y="200" width="240" height="180" rx="16" fill="none" stroke="white" stroke-width="24"/>
  <path d="M196 200v-28a28 28 0 0 1 28-28h64a28 28 0 0 1 28 28v28" fill="none" stroke="white" stroke-width="24" stroke-linecap="round"/>
  <line x1="256" y1="200" x2="256" y2="380" stroke="white" stroke-width="24" stroke-linecap="round"/>
  <line x1="136" y1="280" x2="376" y2="280" stroke="white" stroke-width="24"/>
</svg>`;

const maskablePng = await sharp(Buffer.from(svgMaskable)).resize(512, 512).png().toBuffer();
writeFileSync(join(publicDir, 'maskable-icon-512x512.png'), maskablePng);
console.log('✓ maskable-icon-512x512.png');

console.log('\nÍcones PWA gerados com sucesso!');
