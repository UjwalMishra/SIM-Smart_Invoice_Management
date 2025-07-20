const express = require("express");
const cors = require("cors");
const DBConnect = require("./config/db");
require("dotenv").config();

//Import Routes
const authRoutes = require("./routes/AuthRoutes");
const invoiceRoutes = require("./routes/InvoiceRoutes");
const userRoutes = require("./routes/UserRoutes");

//Mongoose/MongoDB Integration
DBConnect();

const app = express();
const port = process.env.PORT || 3001;

//Core Middleware
app.use(express.json());
app.use(cors());

//API Routes
// For authentication endpoints
app.use("/auth", authRoutes);

//For invoices
app.use("/api/invoices", invoiceRoutes);

//For google-sheet
app.use("/api/user", userRoutes);

// --- Server Startup ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
