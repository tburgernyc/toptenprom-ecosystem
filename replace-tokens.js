const fs = require('fs');
const path = require('path');

const replacements = {
  '--color-surface-overlay': '--color-bg-glass',
  '--color-surface-brand': '--color-primary-subtle',
  '--color-surface-elevated': '--color-bg-elevated',
  '--color-surface': '--color-bg',
  '--color-foreground-on-brand': '--color-text-inverse',
  '--color-foreground-subtle': '--color-text-subtle',
  '--color-foreground-muted': '--color-text-muted',
  '--color-foreground': '--color-text',
  '--color-border-strong': '--color-border-glow',
  '--color-border-brand': '--color-primary-glow',
  '--color-brand-primary': '--color-primary'
};

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const [oldToken, newToken] of Object.entries(replacements)) {
        if (content.includes(oldToken)) {
          content = content.replaceAll(oldToken, newToken);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(process.argv[2]);
