// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/AuthController");

// Redirects user to Google's consent screen
router.get("/google", authController.redirectToGoogleAuth);

// Handles the callback after user has given consent
router.get("/google/callback", authController.handleGoogleCallback);

module.exports = router;
