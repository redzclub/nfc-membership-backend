const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");
const { checkLimiter } = require("../middleware/rateLimiter");

router.get("/:token", checkLimiter, async (req, res) => {
  const { token } = req.params;

  try {
    const member = await prisma.member.findUnique({ where: { token } });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Determine effective status (override to "expired" if past expiry)
    let status = member.status;
    if (member.expires_at && new Date(member.expires_at) < new Date()) {
      status = "expired";
    }

    res.json({
      full_name: member.full_name,
      photo_url: member.photo_url,
      status,
      expires_at: member.expires_at
        ? new Date(member.expires_at).toISOString().split("T")[0]
        : null,
    });
  } catch (err) {
    console.error("Check error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
