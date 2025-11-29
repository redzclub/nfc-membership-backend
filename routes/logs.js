const express = require("express");
const router = express.Router();
const { db, tables } = require("../db");
const { logLimiter } = require("../middleware/rateLimiter");
const { eq } = require("drizzle-orm");

router.post("/", logLimiter, async (req, res) => {
  const { token, action, staff_name } = req.body;
  if (!token || !action)
    return res.status(400).json({ error: "Missing token or action" });
  if (!["admit", "deny"].includes(action))
    return res.status(400).json({ error: "Invalid action" });

  try {
    const rows = await db
      .select()
      .from(tables.members)
      .where(eq(tables.members.token, token))
      .limit(1);
    const member = rows && rows[0];
    if (!member) return res.status(404).json({ error: "Member not found" });

    const inserted = await db
      .insert(tables.logs)
      .values({
        member_id: member.id,
        action,
        staff_name: staff_name || null,
        ip: req.ip,
      })
      .returning();

    res.json({ success: true, id: inserted[0].id });
  } catch (err) {
    console.error("log error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
