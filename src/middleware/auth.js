const jwt = require("jsonwebtoken");

const secret = "secretKeyDummy"; // ganti sesuai kebutuhan

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ code: 401, error: "Invalid or Expired Token" });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, error: "Invalid or Expired Token" });
  }
}

module.exports = { authMiddleware, secret };
