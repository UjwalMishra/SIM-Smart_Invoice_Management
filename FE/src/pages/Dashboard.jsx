// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useCallback } from "react";

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
  const [user, setUser] = useState(null); // To store user settings

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
      // We need a new endpoint for this! We will create it next.
      const response = await api.get("/user/me");
      setUser(response.data);
      setSheetId(response.data.googleSheetId || "");
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  }, []);

  useEffect(() => {
    // Check for token on load, if none, redirect to login
    if (!localStorage.getItem("authToken")) {
      navigate("/login");
      return;
    }
    fetchInvoices();
    fetchUserData();
  }, [navigate, fetchInvoices, fetchUserData]);

  const handleSaveSettings = async () => {
    try {
      await api.put("/user/settings", { googleSheetId: sheetId });
      setMessage("Settings saved successfully!");
    } catch (error) {
      setMessage("Failed to save settings.");
      console.error(error);
    }
  };

  const handleProcessEmails = async () => {
    setIsProcessing(true);

    setMessage("Processing... This may take a moment.");

    const requestBody = startDate && endDate ? { startDate, endDate } : {};

    try {
      const response = await api.post("/invoices/process-emails", requestBody);

      setMessage(response.data.message);
      setStartDate(""); // Clear dates after processing
      setEndDate("");
      fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error("Failed to process emails:", error);
      setMessage("An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/landing");
  };

  if (isLoading) {
    return <div className="text-center mt-20">Loading Dashboard...</div>;
  }





return (
 <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
  <div className="container mx-auto p-8 animate-fadeIn">
    {/* Header remains the same, spanning the full width */}
    <header className="flex justify-between items-center mb-12 animate-slideDown">
      <div className="relative">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <div className="absolute -bottom-2 left-0 w-32 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"></div>
      </div>
      <button
        onClick={handleLogout}
        className="group relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 animate-slideLeft"
      >
        <span className="relative z-10">Logout</span>
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </header>

    {/* --- NEW: Grid container for the layout --- */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* --- Card 1: Google Sheets Integration --- */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-2xl animate-slideUp hover:shadow-blue-500/10 transition-all duration-300">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mr-3 animate-pulse"></div>
          <h2 className="text-2xl font-semibold text-white">
            Google Sheets Integration
          </h2>
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Paste the ID of your Google Sheet below to automatically sync new
          invoices.
        </p>
        <div className="flex items-center gap-4">
          <div className="relative flex-grow group">
            <input
              type="text"
              placeholder="Enter Google Sheet ID"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 group-hover:bg-gray-700/70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          <button
            onClick={handleSaveSettings}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Save
          </button>
        </div>
      </div>

      {/* --- Card 2: Process Invoices --- */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-2xl animate-slideUp hover:shadow-purple-500/10 transition-all duration-300" style={{animationDelay: '0.1s'}}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mr-3 animate-pulse"></div>
          <h2 className="text-2xl font-semibold text-white">Process Invoices</h2>
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Sync new invoices or select a date range for a historical search.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="group">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 group-hover:bg-gray-700/70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
          <div className="group">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 group-hover:bg-gray-700/70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>

        <button
          onClick={handleProcessEmails}
          disabled={isProcessing}
          className={`relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:from-gray-600 disabled:to-gray-700 disabled:hover:scale-100 disabled:hover:shadow-none ${isProcessing ? 'animate-pulse' : ''}`}
        >
          <span className="relative z-10">
            {isProcessing
              ? "Processing..."
              : startDate && endDate
              ? "Process Date Range"
              : "Sync New Invoices"}
          </span>
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse"></div>
          )}
        </button>

        {message && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 rounded-xl animate-fadeIn backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
              {message}
            </div>
          </div>
        )}
      </div>

      {/* --- Card 3: Processed Invoices (Spans full width on large screens) --- */}
      <div className="lg:col-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-2xl animate-slideUp hover:shadow-cyan-500/10 transition-all duration-300" style={{animationDelay: '0.2s'}}>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg mr-3 animate-pulse"></div>
          <h2 className="text-2xl font-semibold text-white">Processed Invoices</h2>
        </div>
        <div className="space-y-4">
          {invoices.length > 0 ? (
            invoices.map((invoice, index) => (
              <Link
                to={`/invoices/${invoice._id}`}
                key={invoice._id}
                className="block group"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="relative bg-gradient-to-r from-gray-700/30 to-gray-800/30 border border-gray-600/30 p-5 rounded-xl hover:from-gray-600/40 hover:to-gray-700/40 hover:border-gray-500/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg animate-fadeInUp backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors duration-300">
                        {invoice.parties.supplier.name}
                      </p>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        Invoice #{invoice.metadata.number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-white group-hover:text-green-300 transition-colors duration-300">
                        Rs {invoice.amounts.total.toFixed(2)}
                      </p>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        {new Date(invoice.metadata.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 animate-fadeIn">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 text-lg">No invoices found. Try processing your emails!</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* CSS keyframes remain unchanged */}
    <style jsx>{`
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      .animate-slideDown { animation: slideDown 0.6s ease-out; }
      .animate-slideUp { animation: slideUp 0.6s ease-out; }
      .animate-slideLeft { animation: slideLeft 0.6s ease-out; }
      .animate-fadeInUp { animation: fadeInUp 0.4s ease-out; }
    `}</style>
  </div>
</div>
);

}



export default Dashboard;
