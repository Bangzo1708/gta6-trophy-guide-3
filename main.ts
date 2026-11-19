// Vice Nights — a gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// The guide itself is plain static files under app/: index.html, style.css,
// app.js and data/trophies.json (the 55 official trophies with our own guides).
// It opens in a desktop browser and works with the network off.
//
// This program is the handover: it copies app/ and screenshots/ from beside
// this file into the output directory and writes output/dossier.json with the
// vendored make.fun library, so the judge can read the guide from its
// screenshots and its file outline. The vendor library must stay exactly as
// the kit ships it — the scorer compares the dossier against its own copy.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Preflight: the guide is only worth handing in with its whole trophy list.
// Fail loudly here, before anything is copied, if the data file is missing
// or does not name all 55 official trophies.
const dataPath = join(here, 'app', 'data', 'trophies.json');
const trophies = JSON.parse(readFileSync(dataPath, 'utf8')).trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`expected 55 trophies in ${dataPath}, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
}
for (const t of trophies) {
  if (typeof t.name !== 'string' || !t.name || typeof t.guide !== 'string' || !t.guide.trim()) {
    throw new Error(`trophy ${JSON.stringify(t)} is missing a name or a guide`);
  }
}

// The guide first: everything under app/ goes over whole.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// Then the screenshots, when they exist (the cover first, by name).
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier, with the scorer's own caps from the kit's reference/gate.json:
// at most 4 screenshots of 256 KiB each, the text outline capped at 160 KiB,
// app/ at most 993 files and 48 MiB in total.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
