require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const seedAdmin = require("./utils/seedAdmin");

const authRoutes = require("./routes/auth");
const membersRoutes = require("./routes/members");
const checkRoutes = require("./routes/check");
const logsRoutes = require("./routes/logs");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/check", checkRoutes);
app.use("/api/log", logsRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);

  // Seed admin asynchronously
  seedAdmin().catch((err) => {
    console.error("Failed to seed admin:", err);
  });
});
