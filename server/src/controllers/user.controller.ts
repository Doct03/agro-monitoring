import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, region } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        region,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        plots: true,
      },
    });

    return res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};