// Haalt de kleurplaten op (zwart-wit lijnen + ingekleurde referentie voor "op nummer"),
// maakt ze klein en schrijft public/pages/index.json
import fs from 'node:fs/promises';
import sharp from 'sharp';
const src = JSON.parse(await fs.readFile('data/pages-src.json', 'utf8'));
await fs.mkdir('public/pages', { recursive: true });

async function have(path) { try { await fs.access(path); return true; } catch { return false; } }
async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

async function one(p) {
  const file = p.id + '.png', path = 'public/pages/' + file;
  if (!(await have(path))) {
    if (!p.url) { console.warn('ontbreekt', p.id); return null; }
    try {
      await sharp(await get(p.url)).flatten({ background: '#ffffff' })
        .resize({ width: 2000, height: 1500, fit: 'contain', background: '#ffffff' })
        .grayscale().normalise().png({ palette: true, colors: 16, compressionLevel: 9 }).toFile(path);
      console.log('ok', p.id, p.title);
    } catch (e) { console.warn('mislukt', p.id, e.message); return null; }
  }
  const rec = { id: p.id, title: p.title, cat: p.cat, level: p.level, file };
  if (p.color) {
    const cf = p.id + 'c.jpg', cp = 'public/pages/' + cf;
    let ok = await have(cp);
    if (!ok) {
      try {
        await sharp(await get(p.color)).flatten({ background: '#ffffff' })
          .resize({ width: 1000, height: 750, fit: 'contain', background: '#ffffff' })
          .jpeg({ quality: 82 }).toFile(cp);
        ok = true; console.log('kleur ok', p.id);
      } catch (e) { console.warn('kleur mislukt', p.id, e.message); }
    }
    if (ok) rec.color = cf;
  }
  return rec;
}

const out = new Array(src.length);
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < src.length) { const k = i++; out[k] = await one(src[k]); }
}));
const list = out.filter(Boolean);
await fs.writeFile('public/pages/index.json', JSON.stringify(list));
console.log(list.length, 'kleurplaten,', list.filter(x => x.color).length, 'met kleurreferentie');
