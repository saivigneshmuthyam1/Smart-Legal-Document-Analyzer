const colors = {
  'on-tertiary-fixed': '#00174b',
  'primary-fixed-dim': '#bec6e0',
  'surface-container-high': '#e6e8ea',
  'on-surface': '#191c1e',
  'inverse-primary': '#bec6e0',
  'surface-container-highest': '#e0e3e5',
  'on-surface-variant': '#45464d',
  'tertiary-fixed': '#dbe1ff',
  'primary-container': '#131b2e',
  'on-error-container': '#93000a',
  'primary': '#000000',
  'on-secondary-fixed-variant': '#3a485c',
  'on-tertiary': '#ffffff',
  'on-primary-fixed': '#131b2e',
  'secondary-fixed': '#d5e3fd',
  'surface-dim': '#d8dadc',
  'on-tertiary-fixed-variant': '#003ea8',
  'on-secondary-fixed': '#0d1c2f',
  'secondary-fixed-dim': '#b9c7e0',
  'surface': '#f7f9fb',
  'inverse-on-surface': '#eff1f3',
  'surface-container': '#eceef0',
  'on-primary-container': '#7c839b',
  'on-primary': '#ffffff',
  'on-error': "#ffffff",
  'inverse-surface': '#2d3133',
  'tertiary-fixed-dim': '#b4c5ff',
  'outline': '#76777d',
  'surface-container-low': '#f2f4f6',
  'on-tertiary-container': '#497cff',
  'surface-tint': '#565e74',
  'outline-variant': '#c6c6cd',
  'error': '#ba1a1a',
  'background': '#f7f9fb',
  'on-background': '#191c1e',
  'secondary-container': '#d5e3fd',
  'on-secondary-container': '#57657b',
  'tertiary': '#000000',
  'tertiary-container': '#00174b',
  'error-container': '#ffdad6',
  'surface-variant': '#e0e3e5',
  'surface-bright': '#f7f9fb',
  'on-primary-fixed-variant': '#3f465c',
  'on-secondary': '#ffffff',
  'secondary': '#515f74',
  'surface-container-lowest': '#ffffff',
  'primary-fixed': '#dae2fd'
};

// Simple dark palette mapping for common properties (approximations)
const darkColors = {
  'on-surface': '#e2e2e6',
  'surface': '#111315',
  'surface-container-lowest': '#0d0f11',
  'surface-container-low': '#191b1d',
  'surface-container': '#1d2022',
  'surface-container-high': '#282a2c',
  'surface-container-highest': '#333537',
  'on-surface-variant': '#c4c6cf',
  'outline': '#8d9199',
  'outline-variant': '#43474e',
  'primary': '#a9c7ff',
  'on-primary': '#003062',
  'primary-container': '#00468a',
  'on-primary-container': '#d6e3ff',
  'background': '#111315',
  'on-background': '#e2e2e6',
  'secondary': '#bdc7dc',
  'secondary-container': '#3d4758',
  'on-secondary-container': '#d9e3f9',
  'error': '#ffb4ab',
  'error-container': '#93000a',
  'on-error-container': '#ffdad6',
  'on-error': '#690005',
};

const hexToRgb = (hex) => {
  if (!hex) return '0 0 0';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
};

let rootVars = '@layer base {\\n  :root {\\n';
for (const [key, value] of Object.entries(colors)) {
  rootVars += `    --color-${key}: ${hexToRgb(value)};\\n`;
}
rootVars += '  }\\n\\n  .dark {\\n';

for (const [key, value] of Object.entries(colors)) {
  const darkHex = darkColors[key] || value; // fallback to light if not explicitly set
  rootVars += `    --color-${key}: ${hexToRgb(darkHex)};\\n`;
}
rootVars += '  }\\n}';

let twConfig = 'colors: {\\n';
for (const [key] of Object.entries(colors)) {
  twConfig += `  '${key}': 'rgb(var(--color-${key}) / <alpha-value>)',\\n`;
}
twConfig += '}';

const fs = require('fs');
fs.writeFileSync('tailwind-vars.txt', rootVars + '\\n\\n' + twConfig);
console.log('done');
