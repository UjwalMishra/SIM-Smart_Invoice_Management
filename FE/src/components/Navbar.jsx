import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { TbInvoice } from "react-icons/tb";
import toast from "react-hot-toast";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation();

  // Effect for navbar background on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Effect for authentication check
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      if (location.pathname === "/dashboard") {
        toast.error("Please log in to access your dashboard.");
        navigate("/");
      }
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    // Find the link that matches the current pathname
    const linkFromPath = navLinks.find((l) => l.path === location.pathname);

    if (location.hash) {
      const id = location.hash.substring(1);
      // Use a timeout to ensure the element is available in the DOM after navigation
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          const linkFromHash = navLinks.find((l) => l.path === `/#${id}`);
          if (linkFromHash) {
            setActiveLink(linkFromHash.title);
          }
        }
      }, 100);
    } else if (linkFromPath) {
      setActiveLink(linkFromPath.title);
    } else {
      setActiveLink("Home");
    }
  }, [location]);

  // Effect for Scroll Spy on the homepage
  useEffect(() => {
    const handleScrollSpy = () => {
      if (location.pathname !== "/") return;

      let currentSection = "Home";
      const sections = navLinks
        .map((link) =>
          link.path.startsWith("/#")
            ? document.getElementById(link.path.substring(2))
            : null
        )
        .filter((el) => el);

      sections.forEach((section) => {
        if (section) {
          const sectionTop = section.offsetTop - 150; // Add a 150px offset
          if (window.scrollY >= sectionTop) {
            const link = navLinks.find((l) => l.path === `/#${section.id}`);
            if (link) currentSection = link.title;
          }
        }
      });
      setActiveLink(currentSection);
    };

    window.addEventListener("scroll", handleScrollSpy);
    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    toast.success("Logged out. See you soon!");
    navigate("/");
  };

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
  }, [isMenuOpen]);

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    setIsMenuOpen(false);
    navigate(path);
  };

  const navLinks = [
    { title: "Home", path: "/#hero-section" },
    { title: "Dashboard", path: "/dashboard" },
    { title: "Features", path: "/#features" },
    { title: "How It Works", path: "/#how-it-works" },
    { title: "Pricing", path: "/#pricing" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0f172a]/80 backdrop-blur-lg shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center ">
          <NavLink
            to="/"
            className="text-2xl font-bold text-white flex justify-center items-center"
            onClick={() => setActiveLink("Home")}
          >
            <div className="text-3xl mr-2 text-teal-400">
              <TbInvoice />
            </div>
            S
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              I
            </span>
            M
          </NavLink>

          <div className="hidden md:flex items-center space-x-8">
            <ul className="flex space-x-6">
              {navLinks.map((link) => (
                <li key={link.title}>
                  <a
                    href={link.path}
                    onClick={(e) => handleLinkClick(e, link.path)}
                    className={`transition-colors duration-300 font-medium cursor-pointer ${
                      activeLink === link.title
                        ? "text-teal-400"
                        : "text-gray-300 hover:text-teal-400"
                    }`}
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center space-x-4">
              {!isLoggedIn ? (
                <NavLink to={"/login"}>
                  <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:shadow-teal-500/25 transition duration-300 transform hover:-translate-y-0.5 cursor-pointer">
                    Get Started
                  </button>
                </NavLink>
              ) : (
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:shadow-teal-500/25 transition duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-white text-2xl"
              aria-label="Open menu"
            >
              <FaBars />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-[#0f172a] z-50 flex flex-col items-center justify-center p-6 md:hidden"
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 text-white text-3xl"
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
            <motion.ul
              variants={menuVariants}
              className="flex flex-col items-center space-y-8"
            >
              {navLinks.map((link) => (
                <motion.li key={link.title} variants={menuItemVariants}>
                  <a
                    href={link.path}
                    onClick={(e) => handleLinkClick(e, link.path)}
                    className={`text-3xl font-medium transition-colors ${
                      activeLink === link.title
                        ? "text-teal-400"
                        : "text-gray-200 hover:text-teal-400"
                    }`}
                  >
                    {link.title}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <motion.div
              variants={menuItemVariants}
              className="flex flex-col items-center space-y-6 mt-12 w-full"
            >
              {/* ... (no changes to login/logout buttons in mobile menu) ... */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
