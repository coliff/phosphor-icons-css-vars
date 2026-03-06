#!/usr/bin/env node

/**
 * Build CSS variables for Phosphor Icons.
 * Downloads phosphor-icons.zip, extracts SVGs, and generates dist/ phosphor-icons-{regular,fill,duotone,thin,light,bold}.css
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { optimize } from "svgo";
import yauzl from "yauzl";

const PHOSPHOR_ZIP_URL =
  "https://github.com/phosphor-icons/homepage/releases/download/v2.1.0/phosphor-icons.zip";
const DIST_DIR = path.join(process.cwd(), "dist");
const TEMP_DIR = path.join(tmpdir(), "phosphor-css-vars-build");

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode} ${res.statusMessage}`));
        return;
      }
      resolve(res);
    }).on("error", reject);
  });
}

const WEIGHTS_INCLUDED = new Set(["regular", "fill", "duotone", "thin", "light", "bold"]);

function weightFromPath(entryPath) {
  const parts = entryPath.replace(/\\/g, "/").split("/");
  const weightDir = parts.length > 1 ? parts[parts.length - 2] : "";
  return weightDir.toLowerCase().replace(/[^a-z]/g, "");
}

function slugFromPath(entryPath) {
  // Zip paths use forward slashes; e.g. "Phosphor Icons/Regular/Address Book.svg" or "Phosphor Icons/Fill/Address Book Fill.svg"
  const parts = entryPath.replace(/\\/g, "/").split("/");
  const fileName = parts[parts.length - 1] || "";
  let name = fileName.replace(/\.svg$/i, "");
  const weightDir = parts.length > 1 ? parts[parts.length - 2] : "";
  const weight = weightDir.toLowerCase().replace(/[^a-z]/g, "");
  // Avoid duplicate weight suffix: source filenames often end with " Fill", " Duotone", " Thin", etc.
  if (weight === "fill") {
    name = name.replace(/\s+fill$/i, "");
  } else if (weight === "duotone") {
    name = name.replace(/\s+duotone$/i, "");
  } else if (weight === "thin") {
    name = name.replace(/\s+thin$/i, "");
  } else if (weight === "light") {
    name = name.replace(/\s+light$/i, "");
  } else if (weight === "bold") {
    name = name.replace(/\s+bold$/i, "");
  }
  let slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (weight && weight !== "regular") {
    // If slug already ends with the weight (e.g. "acorn-fill"), don't append again
    if (slug.endsWith(`-${weight}`)) {
      return slug;
    }
    return `${slug}-${weight}`;
  }
  return slug;
}

function minifySvg(svg, pathHint = "") {
  const result = optimize(svg, {
    path: pathHint,
    js2svg: { pretty: false },
  });
  return result.data;
}

function escapeSvgForCssUrl(svg) {
  // Collapse any remaining whitespace, then escape for use inside double-quoted url(): " -> \", \ -> \\
  const trimmed = svg.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
  return trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function openZip(buffer) {
  return new Promise((resolve, reject) => {
    const opt = { lazyEntries: true };
    yauzl.fromBuffer(buffer, opt, (err, zipfile) => {
      if (err) reject(err);
      else resolve(zipfile);
    });
  });
}

async function extractSvgsFromZip(zipPath) {
  const buffer = fs.readFileSync(zipPath);
  const zipfile = await openZip(buffer);
  const svgByVarName = new Map();
  let svgCount = 0;
  let totalCount = 0;

  await new Promise((resolve, reject) => {
    zipfile.on("entry", (entry) => {
      totalCount++;
      const normalizedPath = entry.fileName.replace(/\\/g, "/").toLowerCase();
      if (path.extname(entry.fileName).toLowerCase() !== ".svg") {
        zipfile.readEntry();
        return;
      }
      if (normalizedPath.startsWith("fonts/")) {
        zipfile.readEntry();
        return;
      }
      const weight = weightFromPath(entry.fileName);
      if (!WEIGHTS_INCLUDED.has(weight)) {
        zipfile.readEntry();
        return;
      }
      zipfile.openReadStream(entry, (err, readStream) => {
        if (err) {
          zipfile.readEntry();
          return;
        }
        const chunks = [];
        readStream.on("data", (chunk) => chunks.push(chunk));
        readStream.on("end", () => {
          const slug = slugFromPath(entry.fileName);
          const varName = `--ph-icon-${slug}`;
          if (!svgByVarName.has(varName)) {
            const raw = Buffer.concat(chunks).toString("utf8");
            const minified = minifySvg(raw, entry.fileName);
            svgByVarName.set(varName, minified);
            svgCount++;
          }
          zipfile.readEntry();
        });
        readStream.on("error", () => zipfile.readEntry());
      });
    });
    zipfile.on("end", () => resolve(svgByVarName));
    zipfile.on("error", reject);
    zipfile.readEntry();
  });

  console.log(`Zip has ${totalCount} total entries, ${svgCount} unique icon variables.`);
  zipfile.close();
  return svgByVarName;
}

async function main() {
  console.log("Downloading phosphor-icons.zip...");
  const res = await download(PHOSPHOR_ZIP_URL);
  const zipPath = path.join(TEMP_DIR, "phosphor-icons.zip");
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  await pipeline(res, createWriteStream(zipPath));
  console.log("Extracting and building CSS variables...");

  const svgByVarName = await extractSvgsFromZip(zipPath);

  const regular = [];
  const fill = [];
  const duotone = [];
  const thin = [];
  const light = [];
  const bold = [];
  for (const [varName, svg] of svgByVarName) {
    try {
      const escaped = escapeSvgForCssUrl(svg);
      const line = `  ${varName}: url("data:image/svg+xml;utf8,${escaped}");`;
      if (varName.endsWith("-fill")) {
        fill.push(line);
      } else if (varName.endsWith("-duotone")) {
        duotone.push(line);
      } else if (varName.endsWith("-thin")) {
        thin.push(line);
      } else if (varName.endsWith("-light")) {
        light.push(line);
      } else if (varName.endsWith("-bold")) {
        bold.push(line);
      } else {
        regular.push(line);
      }
    } catch (err) {
      console.warn(`Skip ${varName}:`, err.message);
    }
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const docsDir = path.join(process.cwd(), "docs");
  fs.mkdirSync(docsDir, { recursive: true });

  const regularCss = ":root {\n" + regular.join("\n") + "\n}\n";
  const fillCss = ":root {\n" + fill.join("\n") + "\n}\n";
  const duotoneCss = ":root {\n" + duotone.join("\n") + "\n}\n";
  const thinCss = ":root {\n" + thin.join("\n") + "\n}\n";
  const lightCss = ":root {\n" + light.join("\n") + "\n}\n";
  const boldCss = ":root {\n" + bold.join("\n") + "\n}\n";

  const regularPath = path.join(DIST_DIR, "phosphor-icons-regular.css");
  const fillPath = path.join(DIST_DIR, "phosphor-icons-fill.css");
  const duotonePath = path.join(DIST_DIR, "phosphor-icons-duotone.css");
  const thinPath = path.join(DIST_DIR, "phosphor-icons-thin.css");
  const lightPath = path.join(DIST_DIR, "phosphor-icons-light.css");
  const boldPath = path.join(DIST_DIR, "phosphor-icons-bold.css");
  fs.writeFileSync(regularPath, regularCss, "utf8");
  fs.writeFileSync(fillPath, fillCss, "utf8");
  fs.writeFileSync(duotonePath, duotoneCss, "utf8");
  fs.writeFileSync(thinPath, thinCss, "utf8");
  fs.writeFileSync(lightPath, lightCss, "utf8");
  fs.writeFileSync(boldPath, boldCss, "utf8");
  console.log(`Wrote ${regularPath} with ${regular.length} regular icon variables.`);
  console.log(`Wrote ${fillPath} with ${fill.length} fill icon variables.`);
  console.log(`Wrote ${duotonePath} with ${duotone.length} duotone icon variables.`);
  console.log(`Wrote ${thinPath} with ${thin.length} thin icon variables.`);
  console.log(`Wrote ${lightPath} with ${light.length} light icon variables.`);
  console.log(`Wrote ${boldPath} with ${bold.length} bold icon variables.`);

  fs.copyFileSync(regularPath, path.join(docsDir, "phosphor-icons-regular.css"));
  fs.copyFileSync(fillPath, path.join(docsDir, "phosphor-icons-fill.css"));
  fs.copyFileSync(duotonePath, path.join(docsDir, "phosphor-icons-duotone.css"));
  fs.copyFileSync(thinPath, path.join(docsDir, "phosphor-icons-thin.css"));
  fs.copyFileSync(lightPath, path.join(docsDir, "phosphor-icons-light.css"));
  fs.copyFileSync(boldPath, path.join(docsDir, "phosphor-icons-bold.css"));

  const iconList = [...svgByVarName.keys()].map((k) => k.replace(/^--ph-icon-/, ""));
  fs.writeFileSync(
    path.join(docsDir, "icon-list.json"),
    JSON.stringify(iconList.sort(), null, 0),
    "utf8"
  );

  // Cleanup (keep zip for debugging: comment out to inspect)
  try {
    fs.unlinkSync(zipPath);
    fs.rmdirSync(TEMP_DIR);
  } catch {
    // ignore
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
