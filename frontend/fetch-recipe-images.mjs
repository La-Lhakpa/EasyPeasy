// fetch-recipe-images.mjs
//
// Downloads one local photo per recipe from Pexels and rewrites the `image`
// field in src/data/easypeasy_recipes.json to point at the local file.
//
// Usage (run from the frontend/ folder):
//   PEXELS_API_KEY=PEXELS_API_KEY= 
//  fetch-recipe-images.mjs
//
// Free key: https://www.pexels.com/api/
//
// Notes:
//  - Images already present in public/recipe-images/ are kept (not re-fetched),
//    so you can safely re-run this and so manually-added photos (PART 6) win.
//  - Dishes Pexels can't match still get their `image` set to the local slug
//    path, so you only have to drop a file at public/recipe-images/<slug>.jpg
//    later and it works on the next load — no need to re-run this script.

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PEXELS_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_KEY) {
  console.error("Set PEXELS_API_KEY first. Free key: https://www.pexels.com/api/");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Adjust these paths if your project structure is different:
const RECIPES_PATH = resolve(__dirname, "src/data/easypeasy_recipes.json");
const OUT_DIR = resolve(__dirname, "public/recipe-images");
const PUBLIC_PREFIX = "/recipe-images";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const exists = async (p) =>
  access(p, constants.F_OK).then(() => true).catch(() => false);

async function findPhoto(query) {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
    `&per_page=1&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = await res.json();
  return data.photos?.[0]?.src?.large || null;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

const raw = JSON.parse(await readFile(RECIPES_PATH, "utf8"));
const recipes = Array.isArray(raw) ? raw : raw.recipes || [];

await mkdir(OUT_DIR, { recursive: true });

let ok = 0;
let skipped = 0;
let missed = [];
for (const recipe of recipes) {
  const slug = slugify(recipe.name);
  const localPath = `${PUBLIC_PREFIX}/${slug}.jpg`;
  const dest = resolve(OUT_DIR, `${slug}.jpg`);

  // Already have this photo (downloaded before or added by hand)? Keep it.
  if (await exists(dest)) {
    recipe.image = localPath;
    skipped++;
    console.log(`= ${recipe.name} (already have it)`);
    continue;
  }

  const query = `${recipe.name} food dish`;
  try {
    const photoUrl = await findPhoto(query);
    if (!photoUrl) {
      // Point at where a manual photo should go; the app falls back to the
      // placeholder until that file exists.
      recipe.image = localPath;
      missed.push(recipe.name);
      console.warn(`?  no photo for "${recipe.name}" — add ${slug}.jpg manually`);
      continue;
    }
    await download(photoUrl, dest);
    recipe.image = localPath;
    ok++;
    console.log(`✓ ${recipe.name}`);
  } catch (err) {
    recipe.image = localPath;
    missed.push(recipe.name);
    console.warn(`✗ ${recipe.name}: ${err.message} — add ${slug}.jpg manually`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

await writeFile(RECIPES_PATH, JSON.stringify(raw, null, 2) + "\n");
console.log(
  `\nDone. ${ok} downloaded, ${skipped} already present. ${missed.length} need manual photos:`
);
if (missed.length) {
  for (const name of missed) console.log(`  - ${name}  ->  ${slugify(name)}.jpg`);
}
