// db/schema.js
const {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} = require("drizzle-orm/pg-core");

// Status enum
const statusEnum = pgEnum("status", ["active", "expired", "banned"]);

// Members table
const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull(),
  full_name: text("full_name").notNull(),
  photo_url: text("photo_url").notNull(),
  status: statusEnum("status").notNull(),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Logs table
const logs = pgTable("logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  member_id: uuid("member_id")
    .notNull()
    .references(() => members.id),
  action: text("action").notNull(),
  staff_name: text("staff_name"),
  ip: text("ip"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Admins table
const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

module.exports = { members, logs, admins, statusEnum };
