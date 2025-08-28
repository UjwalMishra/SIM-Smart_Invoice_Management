const Invoice = require("../model/Invoice");
const gmailApiServices = require("../services/gmailApiServices");
const invoiceProcessorService = require("../services/invoiceProcessorService");
const { google } = require("googleapis");
const User = require("../model/User");

// Reusable helper
function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

const processEmailsForInvoices = async (req, res) => {
  // --- 1. Get User and Optional Manual Dates ---
  const user = req.user;
  let { startDate, endDate } = req.body; // For manual historical fetches
  const isManualFetch = startDate && endDate;

  //will remove this line later on
  endDate = "2025-07-01";

  try {
    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
    });

    // --- 2. Build the Smart Search Query ---
    let gmailQuery = "subject:(invoice OR bill OR receipt) has:attachment";

    if (isManualFetch) {
      // Manual Run: Use the user-provided dates
      console.log(
        `Performing manual fetch for user ${user.email} from ${startDate} to ${endDate}`
      );
      gmailQuery += ` after:${startDate.replace(
        /-/g,
        "/"
      )} before:${endDate.replace(/-/g, "/")}`;
    } else if (user.lastInvoiceSync) {
      // Automatic Run: Use the last sync date
      const lastSyncDate = new Date(user.lastInvoiceSync)
        .toISOString()
        .split("T")[0];
      console.log(
        `Performing smart sync for user ${user.email} after ${lastSyncDate}`
      );
      gmailQuery += ` after:${lastSyncDate.replace(/-/g, "/")}`;
    } else {
      // First-ever Run: Fetch all historical invoices
      console.log(`Performing first-time sync for user ${user.email}`);
    }

    // --- 3. Fetch and Process Emails (Logic remains the same) ---
    const emails = await gmailApiServices.searchEmails(
      oAuth2Client,
      gmailQuery
    );

    if (!emails || emails.length === 0) {
      return res.json({
        message: "No new emails with invoices found for the selected period.",
      });
    }

    let processedCount = 0;
    for (const email of emails) {
      const result = await invoiceProcessorService.processInvoiceFromEmail(
        user,
        oAuth2Client,
        email
      );
      if (result) processedCount++;
    }

    // --- 4. Update the Last Sync Date (ONLY for automatic runs) ---
    if (!isManualFetch) {
      await User.findByIdAndUpdate(user._id, { lastInvoiceSync: new Date() });
      console.log(`Updated lastInvoiceSync for user ${user.email}`);
    }

    res.json({
      message: `Processing complete. Found ${emails.length} potential invoices, successfully saved ${processedCount} new invoices.`,
    });
  } catch (error) {
    console.error("Error during batch invoice processing:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing emails." });
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort({
      "metadata.date": -1,
    });
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Failed to fetch invoices." });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }
    res.json(invoice);
  } catch (error) {
    console.error("Error fetching single invoice:", error);
    res.status(500).json({ message: "Failed to fetch invoice." });
  }
};

module.exports = {
  processEmailsForInvoices,
  getInvoices,
  getInvoiceById,
};
