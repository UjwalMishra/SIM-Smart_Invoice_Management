// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AuthCallback from "./pages/AuthCallback";
import InvoiceDetail from "./pages/InvoiceDetail";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen font-sans">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/landing" element={<LandingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
