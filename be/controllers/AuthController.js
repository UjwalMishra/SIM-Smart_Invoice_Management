// controllers/authController.js

const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const User = require("../model/User");

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// 1. Redirect to Google's consent screen
const redirectToGoogleAuth = async (req, res) => {
  const oAuth2Client = createOAuthClient();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
  res.redirect(authUrl);
};

// 2. Handle the callback from Google
const handleGoogleCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get();

    const user = await User.findOneAndUpdate(
      { google_id: data.id },
      {
        email: data.email,
        name: data.name,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error("Error during authentication:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

module.exports = {
  redirectToGoogleAuth,
  handleGoogleCallback,
};
