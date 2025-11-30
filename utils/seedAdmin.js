require("dotenv").config();
const bcrypt = require("bcrypt");
const { prisma } = require("../lib/prisma");

/**
 * Seeds or updates the admin account
 */
async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "pw123456";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      // Update password if admin already exists
      await prisma.admin.update({
        where: { email },
        data: { password: hashedPassword },
      });
    } else {
      // Create new admin
      await prisma.admin.create({
        data: { email, password: hashedPassword },
      });
    }
  } catch (err) {
    console.error("Seed admin error:", err);
  }
}

module.exports = seedAdmin;
