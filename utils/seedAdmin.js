require("dotenv").config();
const bcrypt = require("bcrypt");
const { db, tables } = require("../db");
const { eq } = require("drizzle-orm");

/**
 * Seeds or updates the admin account
 */
async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "pw123456";
    const hashed = await bcrypt.hash(password, 10);

    const found = await db
      .select()
      .from(tables.admins)
      .where(eq(tables.admins.email, email))
      .limit(1);

    if (found && found.length > 0) {
      await db
        .update(tables.admins)
        .set({ password: hashed })
        .where(eq(tables.admins.email, email));
      // console.log("Admin updated:", email);
    } else {
      await db.insert(tables.admins).values({ email, password: hashed });
      // console.log("Admin created:", email);
    }
  } catch (err) {
    console.error("seed admin error:", err);
  }
}

module.exports = seedAdmin;
