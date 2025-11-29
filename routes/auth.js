const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db, tables } = require("../db");
const { eq } = require("drizzle-orm");
require("dotenv").config();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

  try {
    const rows = await db
      .select()
      .from(tables.admins)
      .where(eq(tables.admins.email, email))
      .limit(1);
    const admin = rows && rows[0];
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.json({ token, email: admin.email });
  } catch (err) {
    console.error("auth error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
