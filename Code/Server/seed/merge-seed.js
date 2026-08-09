#!/usr/bin/env node
/*
 * Git merge driver cho file seek JSON.
 * Gop 2 ban theo id: giu tat ca dong, trung id thi lay ban co version cao hon
 * (neu cung version thi lay ban dang merge vao - "theirs").
 *
 * Git goi: node merge-seed.js %O %A %B
 *   %O = ban goc (base), %A = ban cua minh (ours, se bi ghi de bang ket qua),
 *   %B = ban kia (theirs).
 * Cau hinh trong .gitconfig (xem huong dan cuoi file).
 */
const fs = require('fs');

function readJson(path) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const [, , , oursPath, theirsPath] = process.argv;
const ours = readJson(oursPath);
const theirs = readJson(theirsPath);

// Neu 1 ben khong doc duoc -> giu ben con lai (khong lam hong)
if (!ours) {
  if (theirs) fs.writeFileSync(oursPath, JSON.stringify(theirs, null, 2));
  process.exit(0);
}
if (!theirs) {
  process.exit(0); // giu ours
}

const table = ours.table || theirs.table;
const version = Math.max(Number(ours.version) || 0, Number(theirs.version) || 0);

// Gop rows theo id
const byId = new Map();
for (const row of ours.rows || []) byId.set(String(row.id), row);
for (const row of theirs.rows || []) byId.set(String(row.id), row); // theirs de len khi trung

const merged = {
  table,
  version,
  rows: Array.from(byId.values()),
};

fs.writeFileSync(oursPath, JSON.stringify(merged, null, 2));
process.exit(0);
