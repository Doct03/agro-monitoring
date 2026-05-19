import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const notificationId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};