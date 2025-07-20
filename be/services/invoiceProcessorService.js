// services/invoiceProcessorService.js

const { google } = require("googleapis");
const pdf = require("pdf-parse");
const Invoice = require("../model/Invoice");
const { extractInvoiceData } = require("./aiExtractorService");

// Helper to get an authenticated Gmail instance
const getGmailClient = (oAuth2Client) => {
  return google.gmail({ version: "v1", auth: oAuth2Client });
};

const processInvoiceFromEmail = async (user, oAuth2Client, emailData) => {
  const gmail = getGmailClient(oAuth2Client);

  // 1. We only care about emails with attachments for now
  if (!emailData.attachments || emailData.attachments.length === 0) {
    console.log(`Skipping email ID ${emailData.id} - no attachments.`);
    return null;
  }

  for (const attachment of emailData.attachments) {
    // 2. Filter for PDF files
    if (attachment.mimeType !== "application/pdf") {
      console.log(`Skipping attachment ${attachment.filename} - not a PDF.`);
      continue;
    }

    try {
      // 3. Download the attachment data
      const attachmentResponse = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: emailData.id,
        id: attachment.attachmentId,
      });
      const fileBuffer = Buffer.from(attachmentResponse.data.data, "base64");

      // 4. Parse raw text from the PDF buffer
      const pdfData = await pdf(fileBuffer);
      const rawText = pdfData.text;

      // 5. Use the AI service to extract structured data
      const extractedData = await extractInvoiceData(rawText);

      // 6. Check for duplicates before saving
      const existingInvoice = await Invoice.findOne({
        user: user._id,
        "metadata.number": extractedData.metadata.number,
        "parties.supplier.name": extractedData.parties.supplier.name,
      });

      if (existingInvoice) {
        console.log(
          `Skipping duplicate invoice: #${extractedData.metadata.number}`
        );
        continue;
      }

      // 7. Create and save the new invoice document
      const newInvoice = new Invoice({
        ...extractedData,
        user: user._id,
        system: {
          source: "email",
          originalFilename: attachment.filename,
          processedAt: new Date(),
        },
        raw: {
          text: rawText,
        },
      });

      await newInvoice.save();
      console.log(
        `Successfully processed and saved invoice #${newInvoice.metadata.number}`
      );
      return newInvoice;
    } catch (error) {
      console.error(
        `Failed to process attachment ${attachment.filename} from email ${emailData.id}:`,
        error
      );
      continue; // Continue to the next attachment
    }
  }

  return null;
};

module.exports = { processInvoiceFromEmail };
