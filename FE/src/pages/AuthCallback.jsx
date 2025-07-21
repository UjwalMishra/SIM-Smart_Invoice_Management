// src/pages/AuthCallback.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("authToken", token);
      navigate("/");
    } else {
      // Handle login failure
      navigate("/login");
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-xl">
      Authenticating...
    </div>
  );
};

export default AuthCallback;
