import dotenv from "dotenv";
import app from "./app";
import { startCronJobs } from "./services/cron.service";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
   startCronJobs();
  //console.log(process.env.OPENWEATHER_API_KEY);
});