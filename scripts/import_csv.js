// scripts/import_csv.js
// Usage: node scripts/import_csv.js path/to/file.csv
const fs = require("fs");
const csv = require("csv-parse");
const { db, tables } = require("../db");
const { generateToken } = require("../utils/tokenGenerator");
const { eq } = require("drizzle-orm");

if (!process.argv[2]) {
  console.log("Usage: node scripts/import_csv.js path/to/file.csv");
  process.exit(1);
}

const path = process.argv[2];
const text = fs.readFileSync(path, "utf8");

csv.parse(text, { columns: true, trim: true }, async (err, records) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  for (const row of records) {
    const token =
      row.token && row.token.trim() ? row.token.trim() : generateToken(10);
    try {
      const existing = await db
        .select()
        .from(tables.members)
        .where(eq(tables.members.token, token))
        .limit(1);
      if (existing && existing.length > 0) {
        await db
          .update(tables.members)
          .set({
            full_name: row.full_name,
            photo_url: row.photo_url,
            status: row.status || "active",
            expires_at: row.expires_at ? new Date(row.expires_at) : null,
            updated_at: new Date(),
          })
          .where(eq(tables.members.token, token));
        console.log("updated", token);
      } else {
        await db.insert(tables.members).values({
          token,
          full_name: row.full_name,
          photo_url: row.photo_url,
          status: row.status || "active",
          expires_at: row.expires_at ? new Date(row.expires_at) : null,
        });
        console.log("created", token);
      }
    } catch (e) {
      console.error("failed row", row, e.message);
    }
  }
  process.exit(0);
});
