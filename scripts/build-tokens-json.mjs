// 从 css/tokens.css 生成 tokens.json（W3C Design Tokens 草案格式），tokens.css 是唯一来源。
// 用法：node scripts/build-tokens-json.mjs（生成） / node scripts/build-tokens-json.mjs --check（只校验）
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const css = readFileSync(root + 'css/tokens.css', 'utf8').replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '');

function block(selector) {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`找不到选择器 ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const vars = {};
  for (const m of css.slice(open + 1, close).matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const dark = block(':root,\n:root[data-theme="dark"]');
const light = block(':root[data-theme="light"]');
const media = block(':root:not([data-theme="dark"])');
for (const k of Object.keys(light)) {
  if (light[k] !== media[k]) throw new Error(`浅色块与跟随系统块不一致：--${k}`);
}
const scale = block(':root {\n  ');

const color = vars => Object.fromEntries(
  Object.entries(vars)
    .filter(([k]) => !['shadow-1'].includes(k))
    .map(([k, v]) => [k, { $type: 'color', $value: v }])
);
const pick = (prefix, type) => Object.fromEntries(
  Object.entries(scale)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => [k.slice(prefix.length), { $type: type, $value: v }])
);
const bezier = v => v.match(/-?[\d.]+/g).map(Number);
const dims = ['ctl-h', 'ctl-h-sm', 'row-h', 'header-h', 'sidebar-w', 'sidebar-w-rail', 'page-pad', 'panel-gap'];

const out = {
  $description: '青钢 QING / STEEL design tokens，由 scripts/build-tokens-json.mjs 从 css/tokens.css 生成，请勿手改。',
  seed: { $type: 'color', $value: '#0F819E' },
  color: { dark: color(dark), light: color(light) },
  shadow: {
    dark: { 1: { $type: 'shadow', $value: dark['shadow-1'] } },
    light: { 1: { $type: 'shadow', $value: light['shadow-1'] } }
  },
  font: {
    sans: { $type: 'fontFamily', $value: scale['font-sans'] },
    mono: { $type: 'fontFamily', $value: scale['font-mono'] }
  },
  text: Object.fromEntries(
    Object.entries(scale)
      .filter(([k]) => k.startsWith('text-'))
      .map(([k, v]) => {
        const [, weight, size, line, fam] = v.match(/^(\d+)\s+([\d.]+px)\/([\d.]+px)\s+var\(--font-(\w+)\)$/);
        return [k.slice(5), { $type: 'typography', $value: { fontFamily: `{font.${fam}}`, fontWeight: Number(weight), fontSize: size, lineHeight: line } }];
      })
  ),
  radius: pick('r-', 'dimension'),
  space: pick('space-', 'dimension'),
  size: Object.fromEntries(dims.map(k => [k, { $type: 'dimension', $value: scale[k] }])),
  duration: pick('dur-', 'duration'),
  easing: Object.fromEntries(
    Object.entries(scale)
      .filter(([k]) => k.startsWith('ease-'))
      .map(([k, v]) => [k.slice(5), { $type: 'cubicBezier', $value: bezier(v) }])
  )
};

const json = JSON.stringify(out, null, 2) + '\n';
if (process.argv.includes('--check')) {
  const current = readFileSync(root + 'tokens.json', 'utf8').replace(/\r\n/g, '\n');
  if (current !== json) { console.error('tokens.json 与 css/tokens.css 不一致，请运行 npm run tokens'); process.exit(1); }
  console.log('tokens.json 与 css/tokens.css 一致');
} else {
  writeFileSync(root + 'tokens.json', json);
  console.log('tokens.json 已生成');
}
