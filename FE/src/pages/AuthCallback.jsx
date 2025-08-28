import { useEffect } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("authToken", token);
      toast.success("Successfully logged in!");
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-xl">
      Authenticating...
    </div>
  );
};

export default AuthCallback;
