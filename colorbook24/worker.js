// Colorbook24 worker: serveert de app en maakt AI-kleurplaten (Workers AI)
const MODEL_TXT = '@cf/meta/llama-3.1-8b-instruct';
const MODEL_IMG = '@cf/black-forest-labs/flux-1-schnell';
const BLOCK = /(bloed|dood|doden|vermoord|wapen|pistool|geweer|mes |bom|naakt|bloot|sex|seks|drugs|alcohol|sigaret|horror|eng lijk|zelfmoord|nazi|hakenkruis|gun|blood|kill|naked|nude|weapon)/i;

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

function okOrigin(req) {
  const o = req.headers.get('origin') || '';
  return !o || o.endsWith('twentyfourmedia.nl') || o.includes('localhost');
}

async function idee(env, text) {
  text = String(text || '').slice(0, 200).trim();
  if (!text) return { ok: false, reden: 'leeg' };
  if (BLOCK.test(text)) return { ok: false, reden: 'ongepast' };
  const sys = 'You help young children (4-10) make coloring pages. The child said something in Dutch. ' +
    'Reply ONLY with compact JSON: {"ok":true|false,"nl":"...","en":"..."}. ' +
    'ok=false if the request is not suitable for young children (violence, gore, weapons, scary, adult, real famous people, brands or copyrighted characters). ' +
    '"nl": a short friendly Dutch phrase naming what will be drawn, starting with "een" or "twee" etc, max 10 words, no question mark. ' +
    '"en": a short English description of the scene for an image generator, max 25 words, no style words.';
  let out = null;
  try {
    const r = await env.AI.run(MODEL_TXT, { messages: [{ role: 'system', content: sys }, { role: 'user', content: text }], max_tokens: 160 });
    const s = (r && (r.response || r.result || '')) + '';
    const m = s.match(/\{[\s\S]*\}/);
    if (m) out = JSON.parse(m[0]);
  } catch (e) { out = null; }
  if (!out) return { ok: true, nl: text, en: text };
  if (out.ok === false) return { ok: false, reden: 'ongepast' };
  return { ok: true, nl: String(out.nl || text).slice(0, 80), en: String(out.en || text).slice(0, 200) };
}

async function maak(env, en, n) {
  en = String(en || '').slice(0, 200);
  if (!en || BLOCK.test(en)) return { ok: false };
  const prompt = 'Children\'s coloring book page: ' + en + '. Clean bold black outlines on a pure white background, simple cute cartoon style, ' +
    'large closed shapes, no shading, no gray, no color, no text, no letters, no border, centered, friendly.';
  const jobs = [];
  for (let i = 0; i < Math.min(3, n || 3); i++) {
    jobs.push(env.AI.run(MODEL_IMG, { prompt, steps: 6, seed: Math.floor(Math.random() * 1e9) }).then(r => r && r.image).catch(() => null));
  }
  const imgs = (await Promise.all(jobs)).filter(Boolean);
  return { ok: imgs.length > 0, images: imgs };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      if (req.method !== 'POST' || !okOrigin(req)) return json({ ok: false }, 403);
      let body = {};
      try { body = await req.json(); } catch (e) {}
      try {
        if (url.pathname === '/api/idee') return json(await idee(env, body.text));
        if (url.pathname === '/api/maak') return json(await maak(env, body.en, body.n));
      } catch (e) { return json({ ok: false, fout: String(e && e.message || e) }, 500); }
      return json({ ok: false }, 404);
    }
    return env.ASSETS.fetch(req);
  }
};
