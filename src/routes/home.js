const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.get("/home", authMiddleware, (req, res) => {
  return res.status(200).json({
    code: 200,
    message: "Success Login",
    data: {
      user: {
        user_id: "user-1",
        username: "johndoe",
        full_name: "John Doe",
        email: "johndoe@gmail.com",
        role: {
          role_id: "role-1",
          role_name: "Admin",
          menus: [
            { menu_id: "menu-1", menu_name: "Dashboard", path: "/dashboard" },
            {
              menu_id: "menu-2",
              menu_name: "Transactions",
              path: "/transactions",
            },
            {
              menu_id: "menu-3",
              menu_name: "Omzet",
              path: "/omzet",
            },
            { menu_id: "menu-4", menu_name: "Users Managment", path: "/users" },
          ],
          role_access: ["C", "R", "U", "D"],
        },
      },
    },
  });
});

module.exports = router;
