const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const loginRoute = require("./routes/login");
const homeRoute = require("./routes/home");
const userRoute = require("./routes/users");
const omzetRoute = require("./routes/omzet");
const coaRoute = require("./routes/coa");
const pengeluaranRoute = require("./routes/pengeluaran");

const app = express();
app.use(cors()); // Tambahkan ini untuk mengizinkan semua origin
app.use(bodyParser.json());

app.use("/api", loginRoute);
app.use("/api", homeRoute);
app.use("/api", userRoute);
app.use("/api", omzetRoute);
app.use("/api", coaRoute);
app.use("/api", pengeluaranRoute);

// Global error handler (optional)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    code: 500,
    error: "An unexpected error occurred. Please try again.",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
