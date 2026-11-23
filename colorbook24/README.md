# Colorbook24

Teken- en kleurapp voor iPad (werkt ook offline). Komt live op **colorbook24.twentyfourmedia.nl**.

## Online zetten (eenmalig, ±3 minuten)

1. **GitHub** → rechtsboven **+** → **New repository** → naam `colorbook24` → Private → **Create repository**.
2. Klik op **uploading an existing file** en sleep **de inhoud van deze map** erin (de mappen `data`, `public`, `scripts` en de bestanden `package.json`, `wrangler.jsonc`, `README.md`) → **Commit changes**.
3. **Cloudflare** → **Workers & Pages** → **Create** → **Import a repository** → kies `colorbook24`.
   - **Build command:** `npm install && npm run build`
   - **Deploy command:** laat staan (`npx wrangler deploy`)
   - **Deploy**.
4. Klaar. De app staat na ±1 minuut op https://colorbook24.twentyfourmedia.nl. Het subdomein wordt automatisch gekoppeld (staat in `wrangler.jsonc`).

Bij elke build haalt `scripts/fetch-pages.mjs` de 60 AI-kleurplaten op uit `data/pages-src.json`, maakt ze strak zwart-wit en zet ze in `public/pages/`.

## Op de iPad zetten

Open de link in **Safari** → deel-knop → **Zet op beginscherm**. Open de app één keer met internet; daarna werkt alles offline. Tekeningen blijven op de iPad zelf.

## Meer kleurplaten toevoegen

Zet een regel bij in `data/pages-src.json` (id, title, cat, level 1-3, url naar een zwart-wit PNG). Bij de volgende deploy staat hij erin.
