import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import Lottie from "lottie-react";
import dataAnimation from "../assets/data-animation.json";
import Navbar from "../components/Navbar";

const Login = () => {
  const BACKEND_AUTH_URL = import.meta.env.VITE_BACKEND_AUTH_URL;

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 0px 15px rgba(168, 85, 247, 0.6)",
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="">
        <Navbar />
      </div>
      <motion.div
        className="mt-16 flex flex-col md:flex-row max-w-6xl w-full bg-gray-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-700"
        style={{ minHeight: "600px" }}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Side: Lottie Animation */}
        <div className="w-full md:w-1/2 bg-gray-900/60 p-8 flex items-center justify-center">
          <Lottie
            animationData={dataAnimation}
            loop={true}
            autoplay={true}
            className="w-full max-w-md"
          />
        </div>

        {/* Right Side: Login Section */}
        <div className="w-full md:w-1/2 p-12 md:p-16 flex flex-col justify-center text-white space-y-6">
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-teal-400 drop-shadow-md"
            variants={itemVariants}
          >
            Invoice Extractor
          </motion.h1>

          <motion.p className="text-gray-300 text-xl" variants={itemVariants}>
            Easily convert your unstructured invoices into structured insights
            using advanced AI.
          </motion.p>

          <motion.ul
            className="text-gray-400 text-md space-y-2 pl-5 list-disc"
            variants={itemVariants}
          >
            <motion.li variants={itemVariants}>
              Smart data parsing with 98% accuracy
            </motion.li>
            <motion.li variants={itemVariants}>
              Instant Google Sheet Access
            </motion.li>
            <motion.li variants={itemVariants}>
              Secure Google OAuth login
            </motion.li>
            <motion.li variants={itemVariants}>
              Free for monthly usage
            </motion.li>
          </motion.ul>

          <motion.a
            href={BACKEND_AUTH_URL}
            className="mt-6 bg-purple-600 text-white font-bold py-4 px-8 rounded-lg inline-flex items-center justify-center gap-3 text-lg self-start transition-all duration-300 hover:bg-purple-700"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FaGoogle size={22} />
            Sign In with Google
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
