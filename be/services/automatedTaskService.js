const User = require("../model/User");
const { google } = require("googleapis");
const gmailApiServices = require("./gmailApiServices");
const invoiceProcessorService = require("./invoiceProcessorService");

// This function creates a fresh OAuth client for each user task.
function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

const processInvoicesForUser = async (user) => {
  console.log(`[AUTOMATION] Starting task for user: ${user.email}`);

  try {
    // 1. Authenticate using the user's stored refresh token.
    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials({ refresh_token: user.refresh_token });

    // 2. Build the smart Gmail search query.
    let gmailQuery = "subject:(invoice OR bill OR receipt) has:attachment";

    // If the user has been synced before, only get emails since the last sync.
    if (user.lastInvoiceSync) {
      const lastSyncDate = new Date(user.lastInvoiceSync)
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "/");
      gmailQuery += ` after:${lastSyncDate}`;
      console.log(
        `[AUTOMATION] Searching for emails after ${lastSyncDate} for ${user.email}`
      );
    } else {
      console.log(
        `[AUTOMATION] Performing first-time sync for user ${user.email}`
      );
    }

    // 3. Fetch the list of emails that match the query.
    const emails = await gmailApiServices.searchEmails(
      oAuth2Client,
      gmailQuery
    );

    if (!emails || emails.length === 0) {
      console.log(
        `[AUTOMATION] No new invoice emails found for ${user.email}.`
      );
      await User.findByIdAndUpdate(user._id, { lastInvoiceSync: new Date() });
      return;
    }

    console.log(
      `[AUTOMATION] Found ${emails.length} potential new invoices for ${user.email}.`
    );

    // 4. Process each email using your existing InvoiceProcessorService.
    let processedCount = 0;
    for (const email of emails) {
      const result = await invoiceProcessorService.processInvoiceFromEmail(
        user,
        oAuth2Client,
        email
      );
      if (result) processedCount++;
    }

    // 5. IMPORTANT: Update the user's last sync timestamp to now.
    await User.findByIdAndUpdate(user._id, { lastInvoiceSync: new Date() });

    console.log(
      `[AUTOMATION] Successfully processed ${processedCount} new invoices for ${user.email}. Task finished.`
    );
  } catch (error) {
    console.error(`[AUTOMATION] CRITICAL ERROR for user ${user.email}:`, error);
  }
};

module.exports = { processInvoicesForUser };
