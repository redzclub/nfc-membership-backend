const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const checkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => {
    // Use ipKeyGenerator to handle IPv6, plus your token logic
    const ip = ipKeyGenerator(req);
    return `${ip}|${req.params.token || ""}`;
  },
  handler: (req, res) =>
    res.status(429).json({ error: "Too many requests, try again later" }),
});

const logLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  handler: (req, res) => res.status(429).json({ error: "Too many requests" }),
});

module.exports = { checkLimiter, logLimiter };
