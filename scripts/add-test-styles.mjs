import fs from 'fs';
import path from 'path';

const oemDir = path.resolve('data/oems');

const files = fs.readdirSync(oemDir).filter((file) => file.endsWith('.json'));

const BASE_STYLE = {
  borderRadius: '6px',
  textTransform: 'uppercase',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px',
  marginTop: '6px',
  marginBottom: '6px',
  letterSpacing: '0.08em',
  borderWidth: '2px',
  transition: 'all 0.3s ease'
};

const clamp = (value) => Math.min(255, Math.max(0, value));

const shiftChannel = (channel, percent) => clamp(Math.round(channel + (255 * percent)));

function translate(hex) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function shade(hex, percent) {
  const { r, g, b } = translate(hex);
  const adjustedPercent = percent / 100;
  const newR = percent >= 0 ? shiftChannel(r, adjustedPercent) : clamp(Math.round(r * (1 + adjustedPercent)));
  const newG = percent >= 0 ? shiftChannel(g, adjustedPercent) : clamp(Math.round(g * (1 + adjustedPercent)));
  const newB = percent >= 0 ? shiftChannel(b, adjustedPercent) : clamp(Math.round(b * (1 + adjustedPercent)));
  return `#${[newR, newG, newB].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

files.forEach((file) => {
  const filePath = path.join(oemDir, file);
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const brandColor = (json.brandColor || '#1d1d1d').toLowerCase();

  json.styles = json.styles || {};

  if (!json.styles.oemTestFilled) {
    json.styles.oemTestFilled = {
      label: 'OEM 1 TEST',
      backgroundColor: brandColor,
      textColor: '#ffffff',
      hoverBackgroundColor: shade(brandColor, 15),
      hoverTextColor: '#ffffff',
      borderColor: brandColor,
      ...BASE_STYLE
    };
  }

  if (!json.styles.oemTestOutline) {
    json.styles.oemTestOutline = {
      label: 'OEM 2 TEST',
      backgroundColor: 'transparent',
      textColor: brandColor,
      hoverBackgroundColor: brandColor,
      hoverTextColor: '#ffffff',
      borderColor: brandColor,
      ...BASE_STYLE
    };
  }

  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`Updated ${file}`);
});
