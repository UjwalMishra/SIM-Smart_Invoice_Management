const jwt = require("jsonwebtoken");
const User = require("../model/User");

exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);

    try {
      const userFromDb = await User.findById(user.id);
      if (!userFromDb) {
        return res.status(404).json({ message: "User not found." });
      }
      req.user = userFromDb;
      next();
    } catch (error) {
      console.error("Error fetching user from DB in middleware:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  });
};
