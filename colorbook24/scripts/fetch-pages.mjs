// Haalt de kleurplaten op, maakt ze strak zwart-wit en klein, en schrijft public/pages/index.json
import fs from 'node:fs/promises';
import sharp from 'sharp';
const src = JSON.parse(await fs.readFile('data/pages-src.json', 'utf8'));
await fs.mkdir('public/pages', { recursive: true });
const out = [];
for (const p of src) {
  const file = p.id + '.png', path = 'public/pages/' + file;
  try {
    await fs.access(path);
  } catch {
    try {
      const r = await fetch(p.url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      await sharp(buf).flatten({ background: '#ffffff' }).resize({ width: 2000, height: 1500, fit: 'contain', background: '#ffffff' })
        .grayscale().normalise().png({ palette: true, colors: 16, compressionLevel: 9 }).toFile(path);
      console.log('ok', p.id, p.title);
    } catch (e) { console.warn('mislukt', p.id, e.message); continue; }
  }
  out.push({ id: p.id, title: p.title, cat: p.cat, level: p.level, file });
}
await fs.writeFile('public/pages/index.json', JSON.stringify(out));
console.log(out.length, 'kleurplaten');
