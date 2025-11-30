const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/auth");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const { generateToken } = require("../utils/tokenGenerator");
const csv = require("csv-parse");
const { prisma } = require("../lib/prisma");

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/members (protected)
router.get("/", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const per = parseInt(req.query.per || "50", 10);
  const skip = (page - 1) * per;

  try {
    const members = await prisma.member.findMany({
      skip,
      take: per,
      orderBy: { created_at: "desc" },
    });
    res.json({ members });
  } catch (err) {
    console.error("Members list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/members/:id (protected)
router.get("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json({ member });
  } catch (err) {
    console.error("Member get error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members (protected)
router.post("/", adminAuth, upload.single("photo"), async (req, res) => {
  try {
    const { full_name, status, expires_at, photo_url, token } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: "Missing full_name" });
    }

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
    const existingMember = await prisma.member.findUnique({
      where: { token: memberToken },
    });

    if (existingMember) {
      return res.status(400).json({ error: "Token already exists" });
    }

    const created = await prisma.member.create({
      data: {
        token: memberToken,
        full_name,
        photo_url: finalPhoto || "",
        status: status || "active",
        expires_at: expires_at ? new Date(expires_at) : null,
      },
    });

    res.json({ member: created });
  } catch (err) {
    console.error("Create member error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/members/:id (protected)
router.put("/:id", adminAuth, upload.single("photo"), async (req, res) => {
  const { id } = req.params;
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

    const updated = await prisma.member.update({
      where: { id },
      data: {
        full_name,
        status,
        expires_at: expires_at ? new Date(expires_at) : null,
        updated_at: new Date(),
        ...(finalPhoto ? { photo_url: finalPhoto } : {}),
      },
    });

    res.json({ member: updated });
  } catch (err) {
    console.error("Update member error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members/import (protected) CSV upload
router.post("/import", adminAuth, upload.single("csv"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing CSV file" });
  }

  try {
    const csvText = req.file.buffer.toString("utf8");

    // Parse CSV
    csv.parse(csvText, { columns: true, trim: true }, async (err, records) => {
      if (err) {
        console.error("CSV parse error:", err);
        return res.status(400).json({ error: "Invalid CSV" });
      }

      const results = { created: 0, updated: 0, skipped: 0, errors: [] };

      for (const row of records) {
        try {
          const token = (row.token && row.token.trim()) || generateToken(10);
          const fullName = (row.full_name || "").trim();
          const photoUrl = (row.photo_url || "").trim();
          const status = (row.status || "active").trim().toLowerCase();
          const expiresAt = row.expires_at ? new Date(row.expires_at) : null;

          // Validate required fields and status
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

          // Check if member with token exists
          const existing = await prisma.member.findUnique({
            where: { token },
          });

          if (existing) {
            await prisma.member.update({
              where: { token },
              data: {
                full_name: fullName,
                photo_url: photoUrl,
                status,
                expires_at: expiresAt,
                updated_at: new Date(),
              },
            });
            results.updated++;
          } else {
            await prisma.member.create({
              data: {
                token,
                full_name: fullName,
                photo_url: photoUrl,
                status,
                expires_at: expiresAt,
              },
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
    console.error("CSV import error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
