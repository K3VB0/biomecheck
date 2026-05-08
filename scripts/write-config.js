const fs = require('fs');
const path = require('path');

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  API_BASE_URL: process.env.API_BASE_URL || '',
};

const target = path.join(__dirname, '..', 'js', 'config.js');
const body = `window.BIOMECHECK_CONFIG = ${JSON.stringify(config, null, 2)};\n`;

fs.writeFileSync(target, body, 'utf8');
console.log(`Wrote ${path.relative(process.cwd(), target)}`);
