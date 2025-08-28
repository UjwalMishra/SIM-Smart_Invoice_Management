import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // STATE FOR DATE RANGES
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // STATE FOR saving sheetId
  const [sheetId, setSheetId] = useState("");
  const [user, setUser] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await api.get("/invoices");
      setInvoices(response.data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setMessage("Could not load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get("/user/me");
      setUser(response.data);
      setSheetId(response.data.googleSheetId || "");
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      toast.error("Login first!");
      navigate("/");
      return;
    }
    fetchInvoices();
    fetchUserData();
  }, [navigate, fetchInvoices, fetchUserData]);

  const handleSaveSettings = async () => {
    try {
      await api.put("/user/settings", { googleSheetId: sheetId });
      toast.success("Saved");
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to save settings.");
      console.error(error);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleProcessEmails = async () => {
    setIsProcessing(true);
    setMessage("Processing... This may take a moment.");

    const requestBody = startDate && endDate ? { startDate, endDate } : {};

    try {
      const response = await api.post("/invoices/process-emails", requestBody);
      setMessage(response.data.message);
      setStartDate("");
      setEndDate("");
      fetchInvoices();
      toast.success("Invoices fetched successfully");
    } catch (error) {
      console.error("Failed to process emails:", error);
      toast.error("An error occurs while fetching invoices");
      setMessage("An error occurred during processing.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Categorize invoices based on due dates
  const categorizeInvoices = () => {
    const today = new Date();
    const categories = {
      overdue: [],
      dueSoon: [], // Due within 7 days
      pending: [], // Due within 30 days
      all: invoices,
    };

    invoices.forEach((invoice) => {
      const dueDate = invoice.metadata?.dueDate
        ? new Date(invoice.metadata.dueDate)
        : null;

      if (dueDate) {
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
          categories.overdue.push(invoice);
        } else if (daysDiff <= 7) {
          categories.dueSoon.push(invoice);
        } else if (daysDiff <= 30) {
          categories.pending.push(invoice);
        } else {
          categories.pending.push(invoice); // Default to pending
        }
      } else {
        categories.pending.push(invoice); // No due date, assume pending
      }
    });

    return categories;
  };

  // Calculate statistics
  const getStatistics = () => {
    const categories = categorizeInvoices();
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (inv.amounts?.total || 0),
      0
    );
    const overdueAmount = categories.overdue.reduce(
      (sum, inv) => sum + (inv.amounts?.total || 0),
      0
    );
    const pendingAmount = categories.pending.reduce(
      (sum, inv) => sum + (inv.amounts?.total || 0),
      0
    );

    return {
      total: invoices.length,
      totalAmount,
      overdue: categories.overdue.length,
      overdueAmount,
      pending: categories.pending.length,
      pendingAmount,
      dueSoon: categories.dueSoon.length,
    };
  };

  const stats = getStatistics();
  const categories = categorizeInvoices();

  // Data for charts
  const pieData = [
    {
      name: "Overdue",
      value: stats.overdue,
      color: "#ef4444",
      amount: stats.overdueAmount,
    },
    {
      name: "Due Soon",
      value: stats.dueSoon,
      color: "#f59e0b",
      amount: categories.dueSoon.reduce(
        (sum, inv) => sum + (inv.amounts?.total || 0),
        0
      ),
    },
    {
      name: "Pending",
      value: stats.pending,
      color: "#3b82f6",
      amount: stats.pendingAmount,
    },
  ].filter((item) => item.value > 0);

  const barData = [
    {
      name: "Overdue",
      count: stats.overdue,
      amount: stats.overdueAmount / 1000,
    },
    {
      name: "Due Soon",
      count: stats.dueSoon,
      amount:
        categories.dueSoon.reduce(
          (sum, inv) => sum + (inv.amounts?.total || 0),
          0
        ) / 1000,
    },
    {
      name: "Pending",
      count: stats.pending,
      amount: stats.pendingAmount / 1000,
    },
  ];

  const InvoiceCard = ({ invoice, category }) => {
    const getCategoryColor = () => {
      switch (category) {
        case "overdue":
          return "from-red-500/20 to-red-600/20 border-red-500/30";
        case "dueSoon":
          return "from-yellow-500/20 to-orange-600/20 border-yellow-500/30";
        case "pending":
          return "from-blue-500/20 to-blue-600/20 border-blue-500/30";
        default:
          return "from-gray-500/20 to-gray-600/20 border-gray-500/30";
      }
    };

    const getCategoryBadge = () => {
      const badges = {
        overdue: { text: "OVERDUE", class: "bg-red-500 text-white" },
        dueSoon: { text: "DUE SOON", class: "bg-yellow-500 text-black" },
        pending: { text: "PENDING", class: "bg-blue-500 text-white" },
      };
      return (
        badges[category] || { text: "UNKNOWN", class: "bg-gray-500 text-white" }
      );
    };

    const badge = getCategoryBadge();

    return (
      <Link
        to={`/invoices/${invoice._id}`}
        className="block group transform transition-all duration-300 hover:scale-105"
      >
        <div
          className={`relative bg-gradient-to-r ${getCategoryColor()} backdrop-blur-sm border p-4 rounded-xl hover:shadow-lg transition-all duration-300`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg mb-1 group-hover:text-blue-300 transition-colors">
                {invoice.parties?.supplier?.name || "Unknown Supplier"}
              </h3>
              <p className="text-gray-300 text-sm">
                Invoice #{invoice.metadata?.number || "N/A"}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold ${badge.class}`}
            >
              {badge.text}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold text-white">
                ₹{(invoice.amounts?.total || 0).toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm">
                {invoice.metadata?.date
                  ? new Date(invoice.metadata.date).toLocaleDateString()
                  : "No date"}
              </p>
            </div>
            {invoice.metadata?.dueDate && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Due Date</p>
                <p className="text-sm text-gray-300">
                  {new Date(invoice.metadata.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-16 animate-slideDown">
          <div>
            <Navbar />
          </div>
        </header>

        <div className="flex flex-col justify-center items-center">
          <div className="inline-block animate-pulse">
            <span className="text-sm px-4 py-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-full font-medium tracking-wide">
              ● Smart Invoice Processing
            </span>
          </div>

          <h1 className="text-5xl mt-4 md:text-7xl font-extrabold mb-6 leading-tight">
            Smart{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              Invoice
            </span>{" "}
            Management
          </h1>

          <p className="text-xl text-center max-w-3xl mx-auto text-gray-300 mb-10">
            SIM simplifies your invoice workflow.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="flex justify-center gap-x-8 m-4">
          {[
            {
              title: "Total Invoices",
              value: stats.total,
              amount: stats.totalAmount,
              color: "from-blue-500 to-blue-600",
              icon: "📊",
            },
            {
              title: "Overdue",
              value: stats.overdue,
              amount: stats.overdueAmount,
              color: "from-red-500 to-red-600",
              icon: "⚠️",
            },
            {
              title: "Due Soon",
              value: stats.dueSoon,
              amount: categories.dueSoon.reduce(
                (sum, inv) => sum + (inv.amounts?.total || 0),
                0
              ),
              color: "from-yellow-500 to-orange-600",
              icon: "⏰",
            },
          ].map((stat, index) => (
            <div
              key={stat.title}
              className={`w-[300px] mb-8 bg-gradient-to-r ${stat.color} p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 animate-slideUp`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">{stat.title}</h3>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-white/80 text-sm">
                ₹{stat.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 mb-8">
          {/* Pie Chart */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-2xl animate-slideUp">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mr-3"></span>
              Invoice Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} invoices (₹${props.payload.amount.toLocaleString()})`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid rgba(75, 85, 99, 0.5)",
                    borderRadius: "12px",
                    color: "white",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-2xl animate-slideUp"
            style={{ animationDelay: "0.1s" }}
          >
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg mr-3"></span>
              Amount Overview (₹K)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(75, 85, 99, 0.3)"
                />
                <XAxis dataKey="name" stroke="rgba(156, 163, 175, 1)" />
                <YAxis stroke="rgba(156, 163, 175, 1)" />
                <Tooltip
                  formatter={(value, name) => [
                    name === "amount"
                      ? `₹${(value * 1000).toLocaleString()}`
                      : value,
                    name === "amount" ? "Amount" : "Count",
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.9)",
                    border: "1px solid rgba(75, 85, 99, 0.5)",
                    borderRadius: "12px",
                    color: "white",
                  }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Google Sheets Integration */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-2xl animate-slideUp">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">
                Google Sheets Integration
              </h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Connect your Google Sheet to automatically sync invoice data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Enter Google Sheet ID"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                className="flex-grow bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              />
              <button
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Save
              </button>
            </div>
          </div>

          {/* Process Invoices */}
          <div
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-2xl animate-slideUp"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">
                Process New Invoices
              </h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Sync new invoices or process a specific date range.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <button
              onClick={handleProcessEmails}
              disabled={isProcessing}
              className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:from-gray-600 disabled:to-gray-700 disabled:hover:scale-100 ${
                isProcessing ? "animate-pulse" : ""
              }`}
            >
              {isProcessing
                ? "Processing..."
                : startDate && endDate
                ? "Process Date Range"
                : "Sync New Invoices"}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 rounded-xl animate-fadeIn backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
              {message}
            </div>
          </div>
        )}

        {/* Invoice Categories */}
        <div className="space-y-8">
          {categories.overdue.length > 0 && (
            <div className="animate-slideUp">
              <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                Overdue Invoices ({categories.overdue.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.overdue.map((invoice, index) => (
                  <div
                    key={invoice._id}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <InvoiceCard invoice={invoice} category="overdue" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {categories.dueSoon.length > 0 && (
            <div className="animate-slideUp" style={{ animationDelay: "0.1s" }}>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3 animate-pulse"></span>
                Due Soon ({categories.dueSoon.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.dueSoon.map((invoice, index) => (
                  <div
                    key={invoice._id}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <InvoiceCard invoice={invoice} category="dueSoon" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {categories.pending.length > 0 && (
            <div className="animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></span>
                Pending Invoices ({categories.pending.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.pending.map((invoice, index) => (
                  <div
                    key={invoice._id}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <InvoiceCard invoice={invoice} category="pending" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoices.length === 0 && (
            <div className="text-center py-16 animate-fadeIn">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl">📄</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">
                No Invoices Found
              </h3>
              <p className="text-gray-500 text-lg">
                Try processing your emails to get started!
              </p>
            </div>
          )}
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
          .animate-slideDown {
            animation: slideDown 0.6s ease-out;
          }
          .animate-slideUp {
            animation: slideUp 0.6s ease-out;
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.4s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Dashboard;
