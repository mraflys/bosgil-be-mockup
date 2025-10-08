const express = require("express");
const jwt = require("jsonwebtoken");
const { secret } = require("../middleware/auth");
const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ code: 400, message: "Invalid JSON payload" });
  }

  // Dummy credentials
  if (email === "johndoe@gmail.com" && password === "strongpassword123") {
    const token = jwt.sign({ email }, secret, { expiresIn: "1h" });
    return res.status(200).json({
      code: 200,
      message: "Success Login",
      data: { token, expires: 3600 },
    });
  }

  return res.status(401).json({ code: 401, error: "Invalid credentials" });
});

module.exports = router;
