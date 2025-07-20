const User = require("../model/User");

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email googleSheetId"
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to get user details." });
  }
};

const updateUserSettings = async (req, res) => {
  try {
    const { googleSheetId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { googleSheetId },
      { new: true }
    );
    res.json({ message: "Settings updated successfully.", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings." });
  }
};

module.exports = { getUserDetails, updateUserSettings };
