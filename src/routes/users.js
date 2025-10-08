const express = require("express");
const { users, roles, branches } = require("../data/dummy");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// GET all users
router.get("/users", authMiddleware, (req, res) => {
  const { search } = req.query;
  let result = users;
  if (search) {
    result = users.filter(
      (u) => u.username.includes(search) || u.email.includes(search)
    );
  }
  return res
    .status(200)
    .json({ code: 200, data: result, message: "Successfully Get User" });
});

// GET one user
router.get("/users/:id", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user)
    return res
      .status(404)
      .json({ code: 404, message: `User with ID ${req.params.id} not found.` });
  return res.status(200).json({
    code: 200,
    data: {
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      is_active: user.is_active,
      branches: user.branches,
    },
    message: "Successfully Get User",
  });
});

// Create new user
router.post("/users", authMiddleware, (req, res) => {
  const {
    username,
    full_name,
    email,
    password,
    role_id,
    branches: br,
  } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ code: 400, message: "Username or Password are required" });
  if (users.find((u) => u.email === email))
    return res
      .status(401)
      .json({ code: 401, message: "User with this email already exists." });

  const newUser = {
    id: `user-${users.length + 1}`,
    username,
    full_name,
    email,
    role_id,
    role_name: roles.find((r) => r.Id === role_id)?.Name || "User",
    is_active: true,
    branches: br,
  };
  users.push(newUser);
  return res
    .status(200)
    .json({ code: 200, message: `User ${newUser.id} Successfully Created` });
});

// Update user
router.patch("/users/:id", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user)
    return res
      .status(404)
      .json({ code: 404, message: `User with ID ${req.params.id} not found.` });
  Object.assign(user, req.body);
  return res
    .status(200)
    .json({ code: 200, message: `User ${req.params.id} Successfully Updated` });
});

// Deactivate user
router.patch("/users/:id/deactivate", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user)
    return res
      .status(404)
      .json({ code: 404, message: `User with ID ${req.params.id} not found.` });
  user.is_active = false;
  return res.status(200).json({
    code: 200,
    message: `User ${req.params.id} Successfully Deactivate`,
  });
});

// Get roles
router.get("/roles/list", authMiddleware, (req, res) => {
  return res
    .status(200)
    .json({ code: 200, data: roles, message: "Successfully Get Role" });
});

// Get branches
router.get("/branchs/list", authMiddleware, (req, res) => {
  return res
    .status(200)
    .json({ code: 200, data: branches, message: "Successfully Get Branch" });
});

module.exports = router;
