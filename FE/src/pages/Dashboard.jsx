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
    navigate("/login");
  };

  if (isLoading) {
    return <div className="text-center mt-20">Loading Dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Google Sheets Integration
        </h2>
        <p className="text-gray-600 mb-4">
          Paste the ID of your Google Sheet below to automatically sync new
          invoices. The ID is the long string in the middle of the sheet's URL.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Enter Google Sheet ID"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            className="flex-grow block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
          <button
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Process Invoices</h2>
        <p className="text-gray-600 mb-4">
          Click "Sync New Invoices" to automatically fetch invoices since your
          last sync. Or, select a date range for a historical search.
        </p>

        {/* --- NEW DATE INPUTS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>
        </div>

        <button
          onClick={handleProcessEmails}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:bg-gray-400"
        >
          {isProcessing
            ? "Processing..."
            : startDate && endDate
            ? "Process Date Range"
            : "Sync New Invoices"}
        </button>
        {message && (
          <p className="mt-4 text-blue-700 bg-blue-100 p-3 rounded">
            {message}
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Processed Invoices</h2>
        <div className="space-y-4">
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <Link
                to={`/invoices/${invoice._id}`}
                key={invoice._id}
                className="block border p-4 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">
                      {invoice.parties.supplier.name}
                    </p>
                    <p className="text-gray-500">
                      Invoice #{invoice.metadata.number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">
                      Rs {invoice.amounts.total.toFixed(2)}
                    </p>
                    <p className="text-gray-500">
                      {new Date(invoice.metadata.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>No invoices found. Try processing your emails!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
