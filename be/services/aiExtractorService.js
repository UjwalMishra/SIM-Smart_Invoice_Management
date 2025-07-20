const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//promt for ai
const generateExtractionPrompt = (rawText) => {
  return `
    You are an expert data extraction AI. Your task is to analyze the following raw text from an invoice and extract its information into a structured JSON object.

    The desired JSON structure is as follows. Do not add any fields that are not in this structure.
    If a value is not found, use an empty string "" for string fields, 0 for number fields, or an empty object for nested address/tax/contact schemas. The 'items' array can be empty if no line items are found. The 'parties' objects (supplier, customer) must always be present.

    {
      "metadata": {
        "number": "string",
        "date": "string (YYYY-MM-DD format)",
        "dueDate": "string (YYYY-MM-DD format)",
        "currency": "string (e.g., INR, USD)"
      },
      "parties": {
        "supplier": { "name": "string", "taxInfo": { "gstin": "string" }, "address": { "line1": "string", "city": "string", "state": "string", "country": "string" } },
        "customer": { "name": "string", "taxInfo": { "gstin": "string" }, "address": { "line1": "string", "city": "string", "state": "string", "country": "string" } }
      },
      "amounts": {
        "subtotal": "number",
        "tax": { "total": "number" },
        "total": "number (this is the final grand total)"
      },
      "items": [
        {
          "description": "string",
          "quantity": "number",
          "rate": "number",
          "amount": "number"
        }
      ]
    }

    Here is the raw text from the invoice:
    ---
    ${rawText}
    ---

    Please provide only the JSON object as the output, without any additional commentary or explanations.
  `;
};

const extractInvoiceData = async (rawText) => {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Raw text for extraction cannot be empty.");
  }

  const prompt = generateExtractionPrompt(rawText);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Basic validation to ensure it's a valid JSON
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    throw new Error("Failed to extract data using AI service.");
  }
};

module.exports = { extractInvoiceData };
