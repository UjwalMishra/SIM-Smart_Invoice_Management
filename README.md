# 📄 SIM — Smart Invoice Management

*SIM* is a web application that automates invoice extraction from user's email accounts and stores the structured data into their Google Sheets. It features a beautiful dashboard where users can view and manage all their fetched invoices with a curated and user-friendly UI.

## ✨ Features

- 🔍 *Automated Invoice Extraction* from Gmail inbox
- 📑 *Smart PDF Parsing* using Gemini (Google AI)
- 📊 *Google Sheets Integration* for storing structured invoice data
- 🧾 *Invoice Dashboard* to view and manage parsed invoices
- 🔐 *OAuth2-based Privacy & Security* via Google APIs
- 🕒 *Daily Background Automation* using Cron Jobs

## 🖥️ Dashboard UI

SIM comes with a modern, curated dashboard interface that allows users to:

- View all fetched invoices in a clean view
- See parsed details like vendor, amount, invoice date, and due date
- Filter and sort invoices easily
- Access synced Google Sheet directly from the UI

## 🛠 Tech Stack

- *Frontend*: React.js  
- *Backend*: Node.js, Express.js  
- *Database*: MongoDB  
- *AI*: Gemini (Google AI)  
- *APIs*: Gmail API, Google Sheets API, Google OAuth2  
- *Scheduler*: Cron

## ⚙️ How It Works

1. User authenticates with Google (OAuth2)
2. SIM scans Gmail for invoice emails
3. Gemini parses invoice PDFs for structured data
4. Data is stored in Google Sheets and SIM database
5. A cron job runs daily to automate this process
6. Users view and manage invoices from the dashboard
