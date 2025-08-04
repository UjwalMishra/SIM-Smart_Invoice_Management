// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AuthCallback from "./pages/AuthCallback";
import InvoiceDetail from "./pages/InvoiceDetail";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
      </Routes>
    </div>
  );
}

export default App;
