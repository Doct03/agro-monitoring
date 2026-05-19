import cron from "node-cron";
import { runWeatherMonitoring } from "./weather-monitor.service";

export const startCronJobs = () => {
  // кожну годину
  cron.schedule("* * * * *", async () => {
    console.log("Running scheduled weather monitoring...");
    await runWeatherMonitoring();
  });

  console.log("Cron jobs started");
};