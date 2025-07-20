const express = require("express");
const router = express.Router();
const {
  getUserDetails,
  updateUserSettings,
} = require("../controllers/UserController");
const { authenticateToken } = require("../middlewares/Auth");

// All routes here are protected
router.use(authenticateToken);

router.get("/me", getUserDetails);
router.put("/settings", updateUserSettings);

module.exports = router;
