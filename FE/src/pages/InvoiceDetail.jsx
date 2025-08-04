import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  DollarSign,
  ArrowLeft,
  Building,
  User,
  MapPin,
  Hash,
  CreditCard,
} from "lucide-react";
import api from "../services/api";

const DetailItem = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <Icon className="text-indigo-400 mt-1" size={18} />
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-medium text-white">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ invoice }) => {
  const getStatusInfo = () => {
    if (!invoice.metadata.dueDate)
      return { color: "bg-gray-500/20 text-gray-400", text: "No Due Date" };

    const today = new Date();
    const dueDate = new Date(invoice.metadata.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: "bg-red-500/20 text-red-400", text: "Overdue" };
    } else if (diffDays <= 7) {
      return { color: "bg-amber-500/20 text-amber-400", text: "Due Soon" };
    } else {
      return { color: "bg-green-500/20 text-green-400", text: "On Time" };
    }
  };

  const { color, text } = getStatusInfo();

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      {text}
    </span>
  );
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/invoices/${id}`);
        setInvoice(response.data);
      } catch (error) {
        console.error("Failed to fetch invoice details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    const currency = invoice?.metadata?.currency || "USD";
    return `${currency} ${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading Invoice Details...</p>
        </motion.div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xl text-red-400 mb-4">Invoice not found.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl text-white font-medium transition-all"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto p-4 md:p-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b border-gray-700">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 mb-2">
                Invoice #{invoice.metadata.number || "N/A"}
              </h1>
              <p className="text-gray-400">
                {invoice.metadata.description || "Invoice Details"}
              </p>
            </div>
            <StatusBadge invoice={invoice} />
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Invoice Information */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-medium text-gray-300 mb-4">
                Invoice Details
              </h3>
              <div className="space-y-4">
                <DetailItem
                  icon={Calendar}
                  label="Issue Date"
                  value={formatDate(invoice.metadata.date)}
                />
                <DetailItem
                  icon={Clock}
                  label="Due Date"
                  value={formatDate(invoice.metadata.dueDate)}
                />
                <DetailItem
                  icon={CreditCard}
                  label="Currency"
                  value={invoice.metadata.currency || "N/A"}
                />
                <DetailItem
                  icon={FileText}
                  label="Invoice Type"
                  value={invoice.metadata.type || "Standard"}
                />
              </div>
            </motion.div>

            {/* Supplier Information */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-medium text-gray-300 mb-4">
                Supplier
              </h3>
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Building className="text-indigo-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="font-medium text-white">
                      {invoice.parties?.supplier?.name || "Unknown"}
                    </p>
                  </div>
                </div>
                {invoice.parties?.supplier?.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-indigo-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="font-medium text-white">
                        {invoice.parties.supplier.address.line1}
                        {invoice.parties.supplier.address.city && (
                          <>, {invoice.parties.supplier.address.city}</>
                        )}
                        {invoice.parties.supplier.address.state && (
                          <>, {invoice.parties.supplier.address.state}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {invoice.parties?.supplier?.taxInfo?.gstin && (
                  <div className="flex items-start gap-3">
                    <Hash className="text-indigo-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-400">GSTIN</p>
                      <p className="font-medium text-white">
                        {invoice.parties.supplier.taxInfo.gstin}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Customer Information */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-medium text-gray-300 mb-4">
                Customer
              </h3>
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <User className="text-indigo-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-gray-400">Customer</p>
                    <p className="font-medium text-white">
                      {invoice.parties?.customer?.name || "Unknown"}
                    </p>
                  </div>
                </div>
                {invoice.parties?.customer?.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-indigo-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="font-medium text-white">
                        {invoice.parties.customer.address.line1}
                        {invoice.parties.customer.address.city && (
                          <>, {invoice.parties.customer.address.city}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {invoice.parties?.customer?.taxInfo?.gstin && (
                  <div className="flex items-start gap-3">
                    <Hash className="text-indigo-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-400">GSTIN</p>
                      <p className="font-medium text-white">
                        {invoice.parties.customer.taxInfo.gstin}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Line Items */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-medium text-gray-300 mb-4">
              Line Items
            </h3>
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="text-left font-semibold p-4 text-gray-300">
                        Description
                      </th>
                      <th className="text-right font-semibold p-4 text-gray-300">
                        Quantity
                      </th>
                      <th className="text-right font-semibold p-4 text-gray-300">
                        Rate
                      </th>
                      <th className="text-right font-semibold p-4 text-gray-300">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => (
                        <motion.tr
                          key={index}
                          className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <td className="p-4">{item.description || "N/A"}</td>
                          <td className="text-right p-4">
                            {item.quantity || 0}
                          </td>
                          <td className="text-right p-4">
                            {formatCurrency(item.rate || 0)}
                          </td>
                          <td className="text-right p-4 font-medium">
                            {formatCurrency(item.amount || 0)}
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center p-8 text-gray-400"
                        >
                          No line items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Totals */}
          <motion.div
            className="flex justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="w-full max-w-md bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="space-y-3">
                <div className="flex justify-between py-2 text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.amounts?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-300">
                  <span>Tax Total</span>
                  <span>
                    {formatCurrency(invoice.amounts?.tax?.total || 0)}
                  </span>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between py-2">
                    <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                      Grand Total
                    </span>
                    <span className="font-bold text-xl text-white">
                      {formatCurrency(invoice.amounts?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          {invoice.system?.processedAt && (
            <motion.div
              className="border-t border-gray-700 pt-6 mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-sm text-gray-400">
                Processed:{" "}
                {new Date(invoice.system.processedAt).toLocaleDateString()} at{" "}
                {new Date(invoice.system.processedAt).toLocaleTimeString()}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
