import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const role = (req as any).role;

  if (role !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied. Admin only.",
    });
  }

  next();
};