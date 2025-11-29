const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const { members, logs, admins } = require("./schema");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  // ssl:
  //   process.env.NODE_ENV === "production"
  //     ? { rejectUnauthorized: false }
  //     : false,
  ssl: "require",
  onnotice: () => {},
});

const db = drizzle(sql, { schema: { members, logs, admins } });

module.exports = { db, sql, tables: { members, logs, admins } };
