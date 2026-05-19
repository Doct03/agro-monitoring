import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes";
import plotRoutes from "./routes/plot.routes";
import cropRoutes from "./routes/crop.routes";
import moistureRoutes from "./routes/moisture.routes";
import weatherRoutes from "./routes/weather.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import forecastRoutes from "./routes/forecast.routes";
import systemRoutes from "./routes/system.routes";
import aiRoutes from "./routes/ai.routes";
import geocodingRoutes from "./routes/geocoding.routes";
import cropReferenceRoutes from "./routes/crop-reference.routes";
import recommendationAiRoutes from "./routes/recommendation-ai.routes";
import authRoutes from "./routes/auth.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import notificationRoutes from "./routes/notification.routes";
import iotRoutes from "./routes/iot.routes";
import adminRoutes from "./routes/admin.routes";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ message: "API is working" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/plots", authMiddleware, plotRoutes);
app.use("/api/crops", authMiddleware, cropRoutes);
app.use("/api/moisture", authMiddleware, moistureRoutes);
app.use("/api/weather", authMiddleware, weatherRoutes);
app.use("/api/recommendations", authMiddleware, recommendationRoutes);
app.use("/api/forecasts", authMiddleware, forecastRoutes);

app.use("/api/system", systemRoutes);

app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/geocoding", authMiddleware, geocodingRoutes);
app.use("/api/recommendation-ai", authMiddleware, recommendationAiRoutes);

app.use("/api/crop-reference", authMiddleware, cropReferenceRoutes);
app.use("/api/crop-references", authMiddleware, cropReferenceRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use("/api/iot", iotRoutes);
// Якщо старі userRoutes більше не потрібні, краще залишити вимкненими.
// app.use("/api/users", authMiddleware, userRoutes);

export default app;