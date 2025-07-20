const express = require("express");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const cors = require("cors");
const gmailApiServices = require("./services/gmailApiServices");
const DBConnect = require("./config/db");
const User = require("./model/User");

require("dotenv").config();

// --- Mongoose/MongoDB Integration ---
DBConnect();

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// --- NEW: JWT Authentication Middleware ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);

    try {
      const userFromDb = await User.findById(user.id);
      if (!userFromDb) {
        return res.status(404).json({ message: "User not found." });
      }
      req.user = userFromDb;
      next();
    } catch (error) {
      console.error("Error fetching user from DB in middleware:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  });
};

// --- ROUTES ---

//home
app.get("/", (req, res) => {
  res.send("<h1>Welcome to Gmail Reader API</h1>");
});

// 1. Start the authentication process
app.get("/auth/google", async (req, res) => {
  const oAuth2Client = await createOAuthClient();
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
});

// Google callback route using Mongoose
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const oAuth2Client = await createOAuthClient();
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

    // Create JWT
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // res.json({
    //   message: "Authentication successful!",
    //   token: jwtToken,
    //   user: {
    //     name: user.name,
    //     email: user.email,
    //   },
    // });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error("Error during authentication:", error);
    // res.status(500).json({ message: "Authentication failed." });
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
});

app.get("/api/emails", authenticateToken, async (req, res) => {
  const searchQuery = req.query.q || "";
  const startDate = req.query.startDate
    ? req.query.startDate.replace(/-/g, "/")
    : null;
  const endDate = req.query.endDate
    ? req.query.endDate.replace(/-/g, "/")
    : null;

  try {
    const user = req.user; // User is attached from the middleware

    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
    });

    const emails = await gmailApiServices.searchEmails(
      oAuth2Client,
      searchQuery,
      startDate,
      endDate
    );

    res.json(emails);
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    res.status(500).json({ message: "Error fetching emails." });
  }
});

//  ROUTE: For downloading a specific attachment
app.get("/api/download/attachment", authenticateToken, async (req, res) => {
  const { messageId, attachmentId, filename } = req.query;

  if (!messageId || !attachmentId || !filename) {
    return res
      .status(400)
      .json({ message: "Missing required query parameters." });
  }

  try {
    const user = req.user;

    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: messageId,
      id: attachmentId,
    });

    const fileData = Buffer.from(attachment.data.data, "base64");

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      attachment.data.mimeType || "application/octet-stream"
    );
    res.setHeader("Content-Length", fileData.length);

    res.send(fileData);
  } catch (error) {
    console.error("Failed to download attachment:", error);
    res.status(500).json({ message: "Error downloading attachment." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
