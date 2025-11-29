const express = require("express");
const router = express.Router();
const { db, tables } = require("../db");
const { checkLimiter } = require("../middleware/rateLimiter");
const { eq } = require("drizzle-orm");

router.get("/:token", checkLimiter, async (req, res) => {
  const { token } = req.params;
  try {
    const rows = await db
      .select()
      .from(tables.members)
      .where(eq(tables.members.token, token))
      .limit(1);
    const member = rows && rows[0];
    if (!member) return res.status(404).json({ error: "Member not found" });

    let status = member.status;
    if (member.expires_at && new Date(member.expires_at) < new Date())
      status = "expired";

    res.json({
      full_name: member.full_name,
      photo_url: member.photo_url,
      status,
      expires_at: member.expires_at
        ? new Date(member.expires_at).toISOString().split("T")[0]
        : null,
    });
  } catch (err) {
    console.error("check error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
