import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cataloguePath = path.join(root, "data", "catalogue.json");
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const allowedCategories = new Set(["full_body", "upper_body", "outerwear"]);
const required = ["id", "title", "sourceImageUrl", "productUrl", "licenceRecordUrl", "garmentCategory", "composition", "verifiedFacts", "preBuyChecks"];

if (!Array.isArray(catalogue) || catalogue.length < 12 || catalogue.length > 18) throw new Error(`Expected 12–18 catalogue records, got ${catalogue.length}`);
const ids = new Set();
for (const item of catalogue) {
  for (const field of required) if (!item[field]) throw new Error(`${item.id || "unknown"} is missing ${field}`);
  if (ids.has(item.id)) throw new Error(`Duplicate catalogue id: ${item.id}`);
  ids.add(item.id);
  if (!allowedCategories.has(item.garmentCategory)) throw new Error(`${item.id} has an invalid garment category`);
  if (!item.sourceImageUrl.startsWith("/catalog/")) throw new Error(`${item.id} must use a local /catalog/ reference image`);
  const localPath = path.join(root, "public", item.sourceImageUrl);
  if (!fs.existsSync(localPath)) throw new Error(`${item.id} references missing asset ${localPath}`);
  if (!Array.isArray(item.verifiedFacts) || item.verifiedFacts.length === 0) throw new Error(`${item.id} needs verified facts`);
  if (!Array.isArray(item.preBuyChecks) || item.preBuyChecks.length === 0) throw new Error(`${item.id} needs a pre-buy check`);
}
console.log(`Catalogue valid: ${catalogue.length} records, ${ids.size} unique IDs, all local reference assets present.`);
