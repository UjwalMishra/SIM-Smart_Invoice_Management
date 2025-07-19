const { google } = require("googleapis");

async function listOfLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.list({
    userId: "me",
  });

  const labels = res.data.labels;
  if (!labels || labels.length == 0) {
    console.log("No labels found");
  }

  console.log("Labels : ");
  labels.forEach((label) => {
    console.log(` - ${label.name}`);
  });

  return labels;
}

async function sendEmail(auth, content) {
  const gmail = google.gmail({ version: "v1", auth });
  const encodedMsg = Buffer.from(content)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMsg },
  });
  console.log(res.data);
  return res.data;
}

function findBody(payload) {
  // Case 1: The payload itself has the body data (simple, non-multipart messages)
  if (payload.body && payload.body.data) {
    return payload.body.data;
  }

  // Case 2: The message is multipart, so we need to search the parts
  if (payload.parts && payload.parts.length > 0) {
    // Look for the plain text part first
    const plainTextPart = payload.parts.find(
      (part) => part.mimeType === "text/plain"
    );
    if (plainTextPart && plainTextPart.body && plainTextPart.body.data) {
      return plainTextPart.body.data;
    }

    // Fallback to the HTML part if plain text is not found
    const htmlPart = payload.parts.find(
      (part) => part.mimeType === "text/html"
    );
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      return htmlPart.body.data;
    }

    // If the body is nested in a multipart/alternative part, recurse
    for (const part of payload.parts) {
      const result = findBody(part);
      if (result) {
        return result;
      }
    }
  }

  // Return null if no body is found
  return null;
}

//this will fetch attachments from the mail
async function getAttachments(auth, messageId, parts) {
  const attachments = [];

  for (const part of parts) {
    // Find parts that are explicitly attachments and have an attachmentId
    if (part.filename && part.filename.length > 0 && part.body.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
        attachmentId: part.body.attachmentId,
      });
    }

    // Recursively check nested parts
    if (part.parts && part.parts.length > 0) {
      const nestedAttachments = await getAttachments(
        auth,
        messageId,
        part.parts
      );

      attachments.push(...nestedAttachments);
    }
  }

  return attachments;
}

// fetches attachments in addition to email details.

async function searchEmails(auth, query = "", startDate, endDate) {
  const gmail = google.gmail({ version: "v1", auth });

  // --- Date Query Logic ---
  let searchQuery = query;
  if (startDate) {
    searchQuery += ` after:${startDate}`;
  }
  if (endDate) {
    searchQuery += ` before:${endDate}`;
  }
  // --- End Date Query Logic ---

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: searchQuery.trim(), // Use the combined search query
    maxResults: 50, // Increased max results for broader date searches
  });

  const messages = listResponse.data.messages;
  if (!messages || messages.length === 0) {
    console.log("No messages found for this query.");
    return [];
  }

  // Fetch details for each message in parallel
  const emailPromises = messages.map(async (msg) => {
    if (!msg || !msg.id) {
      return null;
    }
    const messageContent = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    if (!messageContent || !messageContent.data) {
      console.warn(
        `Warning: Could not fetch content for message ID ${msg.id}. Skipping.`
      );
      return null;
    }

    const payload = messageContent.data.payload;
    if (!payload || !payload.headers) return null;

    const headers = payload.headers;
    const subject =
      headers.find((h) => h.name === "Subject")?.value || "No Subject";
    const from =
      headers.find((h) => h.name === "From")?.value || "Unknown Sender";
    const bodyData = findBody(payload);
    const body = bodyData
      ? Buffer.from(bodyData, "base64").toString("utf8")
      : "No Body";

    // --- ATTACHMENT LOGIC ---
    let attachments = [];
    if (payload.parts && payload.parts.length > 0) {
      attachments = await getAttachments(auth, msg.id, payload.parts);
    }
    // --- END ATTACHMENT LOGIC ---

    return {
      id: msg.id,
      threadId: msg.threadId,
      from,
      subject,
      body: body,
      attachments: attachments, // Add attachments to the result
    };
  });

  // Wait for all email details to be fetched
  const emails = await Promise.all(emailPromises);
  return emails.filter((e) => e !== null); // Filter out any that failed
}

module.exports = { listOfLabels, sendEmail, searchEmails };
