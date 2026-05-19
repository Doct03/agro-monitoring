import { Request, Response } from "express";
import { geocodeLocation } from "../services/geocoding.service";

export const detectCoordinates = async (req: Request, res: Response) => {
  try {
    const { region, city } = req.body;

    if (!region && !city) {
      return res.status(400).json({
        message: "Region or city is required",
      });
    }

    const result = await geocodeLocation(region || "", city || "");

    return res.json({
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: result.displayName,
      source: result.source,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
};