const cron = require("node-cron");
const User = require("../model/User");
const { processInvoicesForUser } = require("../services/automatedTaskService");

const scheduleDailyInvoiceProcessing = () => {
  cron.schedule(
    "0 2 * * *",
    async () => {
      console.log(
        "\n[CRON JOB] --- Kicking off daily invoice processing job ---"
      );

      const usersToProcess = await User.find({ refresh_token: { $ne: null } });

      if (!usersToProcess || usersToProcess.length === 0) {
        console.log("[CRON JOB] No users to process. Job finished.");
        return;
      }

      console.log(
        `[CRON JOB] Found ${usersToProcess.length} user(s) for automated processing.`
      );

      for (const user of usersToProcess) {
        await processInvoicesForUser(user);
      }

      console.log(
        "[CRON JOB] --- Daily invoice processing job finished --- \n"
      );
    },
    {
      scheduled: true,
      timezone: "UTC", // It's best practice to run cron jobs in UTC.
    }
  );
};

module.exports = { scheduleDailyInvoiceProcessing };
