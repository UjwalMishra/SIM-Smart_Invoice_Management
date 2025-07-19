const express = require("express");
const session = require("express-session");
const { google } = require("googleapis");

const gmailApiServices = require("./services/gmailApiServices");
const DBConnect = require("./config/db");
const User = require("./model/User");

require("dotenv").config();

// --- Mongoose/MongoDB Integration ---
DBConnect();

const app = express();
const port = 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// --- ROUTES ---

//home
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.send(`
            <h1>Welcome!</h1>
            <p>You are logged in.</p>
            <form action="/api/emails" method="get" style="line-height: 2.5;">
                <label for="q">Search Term:</label><br>
                <input type="text" id="q" name="q" placeholder="e.g., from:somebody" size="50"/><br>

                <label for="startDate">Start Date:</label><br>
                <input type="date" id="startDate" name="startDate"><br>

                <label for="endDate">End Date:</label><br>
                <input type="date" id="endDate" name="endDate"><br>

                <button type="submit">Search Emails</button>
            </form>
            <br>
            <a href="/logout">Logout</a>
        `);
  } else {
    res.send(
      '<h1>Welcome to Gmail Reader</h1><a href="/auth/google">Login with Google</a>'
    );
  }
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

    req.session.userId = user._id;
    res.redirect("/");
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).send("Authentication failed.");
  }
});

app.get("/api/emails", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Unauthorized. Please login first.");
  }

  // Extract query and date parameters from the request
  const searchQuery = req.query.q || "";
  const startDate = req.query.startDate
    ? req.query.startDate.replace(/-/g, "/")
    : null;
  const endDate = req.query.endDate
    ? req.query.endDate.replace(/-/g, "/")
    : null;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send("User not found in database.");
    }

    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
    });

    // Pass the date parameters to the service function
    const emails = await gmailApiServices.searchEmails(
      oAuth2Client,
      searchQuery,
      startDate,
      endDate
    );

    // The rest of this route (rendering HTML) remains the same
    let html = `<h1>Search Results</h1> <a href="/">Back to Search</a>`;
    if (emails.length === 0) {
      html += "<p>No emails found for your criteria.</p>";
    } else {
      html += emails
        .map((email) => {
          let attachmentsHtml = "No attachments";
          if (email.attachments && email.attachments.length > 0) {
            attachmentsHtml = "<ul>";
            attachmentsHtml += email.attachments
              .map((att) => {
                const downloadUrl = `/api/download/attachment?messageId=${
                  email.id
                }&attachmentId=${
                  att.attachmentId
                }&filename=${encodeURIComponent(att.filename)}`;
                return `<li><a href="${downloadUrl}">${
                  att.filename
                }</a> (${Math.round(att.size / 1024)} KB)</li>`;
              })
              .join("");
            attachmentsHtml += "</ul>";
          }

          return `
                <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                    <p><b>From:</b> ${email.from}</p>
                    <p><b>Subject:</b> ${email.subject}</p>
                    <p><i>${email.body}</i></p>
                    <p><b>Attachments:</b></p>
                    ${attachmentsHtml}
                </div>
            `;
        })
        .join("");
    }

    res.send(html);
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    res.status(500).send("Error fetching emails.");
  }
});

//  ROUTE: For downloading a specific attachment
app.get("/api/download/attachment", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Unauthorized. Please login first.");
  }

  const { messageId, attachmentId, filename } = req.query;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send("User not found in database.");
    }

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

    // Set headers to trigger a download in the browser
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fileData.length);

    // Send the file data
    res.send(fileData);
  } catch (error) {
    console.error("Failed to download attachment:", error);
    res.status(500).send("Error downloading attachment.");
  }
});

// logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
