const { google } = require("googleapis");

const getSheetsClient = (oAuth2Client) => {
  return google.sheets({ version: "v4", auth: oAuth2Client });
};

const appendInvoiceToSheet = async (oAuth2Client, sheetId, invoiceData) => {
  const sheets = getSheetsClient(oAuth2Client);

  // 1. Define the headers for your sheet. This ensures consistency.
  const headers = [
    "Invoice Date",
    "Invoice Number",
    "Supplier Name",
    "Supplier GSTIN",
    "Customer Name",
    "Subtotal",
    "Tax Total",
    "Grand Total",
    "Currency",
  ];

  // 2. Format the invoice data into a flat array that matches the header order.
  const newRow = [
    invoiceData.metadata.date,
    invoiceData.metadata.number,
    invoiceData.parties.supplier.name,
    invoiceData.parties.supplier.taxInfo?.gstin || "",
    invoiceData.parties.customer.name,
    invoiceData.amounts.subtotal,
    invoiceData.amounts.tax.total,
    invoiceData.amounts.total,
    invoiceData.metadata.currency,
  ];

  try {
    // 3. Check if the sheet has headers. If not, add them.
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:I1",
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Sheet1!A1",
        valueInputOption: "RAW",
        requestBody: {
          values: [headers],
        },
      });
      console.log("Added headers to the sheet.");
    }

    // 4. Append the new invoice row to the sheet.
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:A", // 'A:A' tells Sheets to find the first empty row.
      valueInputOption: "USER_ENTERED", // Formats dates and numbers correctly.
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [newRow],
      },
    });

    console.log(
      `Successfully appended invoice #${invoiceData.metadata.number} to sheet ID ${sheetId}`
    );
  } catch (error) {
    // This is often a permissions error or an invalid sheet ID.
    console.error("Error writing to Google Sheet:", error.message);
    // We don't throw an error here, as failing to write to the sheet
    // shouldn't stop the whole invoice processing flow.
  }
};

module.exports = { appendInvoiceToSheet };
