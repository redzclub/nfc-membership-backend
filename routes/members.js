const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/auth");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const { generateToken } = require("../utils/tokenGenerator");
const csv = require("csv-parse");
const { db, tables } = require("../db");
const { eq } = require("drizzle-orm");

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/members (protected)
router.get("/", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const per = parseInt(req.query.per || "50", 10);
  const offset = (page - 1) * per;
  try {
    const rows = await db
      .select()
      .from(tables.members)
      .limit(per)
      .offset(offset)
      .orderBy(tables.members.created_at, "desc");
    res.json({ members: rows });
  } catch (err) {
    console.error("members list error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/members/:id (protected)
router.get("/:id", adminAuth, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const rows = await db
      .select()
      .from(tables.members)
      .where(eq(tables.members.id, id))
      .limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    res.json({ member: rows[0] });
  } catch (err) {
    console.error("member get error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members (protected)
router.post("/", adminAuth, upload.single("photo"), async (req, res) => {
  try {
    const { full_name, status, expires_at, photo_url, token } = req.body;
    if (!full_name) return res.status(400).json({ error: "Missing full_name" });

    let finalPhoto = photo_url || null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "members" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      finalPhoto = result.secure_url;
    }

    const memberToken = token || generateToken(10);

    // Check if token already exists
    const existingMember = await db
      .select()
      .from(tables.members)
      .where(eq(tables.members.token, memberToken))
      .limit(1);

    if (existingMember.length > 0) {
      return res.status(400).json({ error: "Token already exists" });
    }

    const [created] = await db
      .insert(tables.members)
      .values({
        token: memberToken,
        full_name,
        photo_url: finalPhoto || "",
        status: status || "active",
        expires_at: expires_at ? new Date(expires_at) : null,
      })
      .returning();

    res.json({ member: created });
  } catch (err) {
    console.error("create member error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/members/:id (protected)
router.put("/:id", adminAuth, upload.single("photo"), async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const { full_name, status, expires_at, photo_url } = req.body;

    let finalPhoto = photo_url || null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "members" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      finalPhoto = result.secure_url;
    }

    const updated = await db
      .update(tables.members)
      .set({
        full_name,
        status,
        expires_at: expires_at ? new Date(expires_at) : null,
        updated_at: new Date(),
        ...(finalPhoto ? { photo_url: finalPhoto } : {}),
      })
      .where(eq(tables.members.id, id))
      .returning();

    res.json({ member: updated[0] });
  } catch (err) {
    console.error("update member error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members/import (protected) CSV upload
router.post("/import", adminAuth, upload.single("csv"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing csv file" });
  try {
    const csvText = req.file.buffer.toString("utf8");
    csv.parse(csvText, { columns: true, trim: true }, async (err, records) => {
      if (err) {
        console.error("csv parse error", err);
        return res.status(400).json({ error: "Invalid CSV" });
      }
      const results = { created: 0, updated: 0, skipped: 0, errors: [] };

      for (const row of records) {
        try {
          const token =
            row.token && row.token.trim()
              ? row.token.trim()
              : generateToken(10);
          const fullName = (row.full_name || "").trim();
          const photoUrl = (row.photo_url || "").trim();
          const status = (row.status || "active").trim().toLowerCase();
          const expiresAt = row.expires_at ? new Date(row.expires_at) : null;

          if (
            !fullName ||
            !photoUrl ||
            !["active", "expired", "banned"].includes(status)
          ) {
            results.skipped++;
            results.errors.push({
              row,
              error: "Missing required fields or invalid status",
            });
            continue;
          }

          const found = await db
            .select()
            .from(tables.members)
            .where(eq(tables.members.token, token))
            .limit(1);
          const existing = found && found[0];

          if (existing) {
            await db
              .update(tables.members)
              .set({
                full_name: fullName,
                photo_url: photoUrl,
                status,
                expires_at: expiresAt,
                updated_at: new Date(),
              })
              .where(eq(tables.members.token, token));
            results.updated++;
          } else {
            await db.insert(tables.members).values({
              token,
              full_name: fullName,
              photo_url: photoUrl,
              status,
              expires_at: expiresAt,
            });
            results.created++;
          }
        } catch (e) {
          results.errors.push({ row, error: e.message });
        }
      }

      res.json({ results });
    });
  } catch (err) {
    console.error("csv import error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
