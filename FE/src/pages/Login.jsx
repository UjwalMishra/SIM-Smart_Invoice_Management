// src/pages/Login.jsx
import React from "react";

const Login = () => {
  const BACKEND_AUTH_URL = "http://localhost:3001/auth/google";

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center p-10 bg-white shadow-xl rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Invoice Extractor</h1>
        <p className="text-gray-600 mb-8">Automate your invoice data entry.</p>
        <a
          href={BACKEND_AUTH_URL}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 inline-block"
        >
          Sign In with Google
        </a>
      </div>
    </div>
  );
};

export default Login;
