const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma"); // adjust if needed
const { logLimiter } = require("../middleware/rateLimiter");

router.post("/", logLimiter, async (req, res) => {
  const { token, action, staff_name } = req.body;

  if (!token || !action) {
    return res.status(400).json({ error: "Missing token or action" });
  }

  if (!["admit", "deny"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    // Find member by unique token
    const member = await prisma.member.findUnique({
      where: { token },
    });

    if (!member) {
      return res.status(4).json({ error: "Member not found" });
    }

    // Create log entry
    const log = await prisma.log.create({
      data: {
        member_id: member.id,
        action,
        staff_name: staff_name || null,
        ip: req.ip,
      },
    });

    res.json({ success: true, id: log.id });
  } catch (err) {
    console.error("Log error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
