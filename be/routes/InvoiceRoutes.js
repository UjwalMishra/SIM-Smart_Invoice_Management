const express = require("express");
const router = express.Router();
const {
  processEmailsForInvoices,
  getInvoices,
  getInvoiceById,
} = require("../controllers/InvoiceController");
const { authenticateToken } = require("../middlewares/Auth");

// All routes here are protected
router.use(authenticateToken);

router.post("/process-emails", processEmailsForInvoices);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);

module.exports = router;
