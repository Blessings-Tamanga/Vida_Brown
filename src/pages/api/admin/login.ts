import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ detail: "Method not allowed" });

  const { password } = req.body;

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ detail: "Server config error: ADMIN_PASSWORD not set" });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ detail: "Invalid credentials" });
  }

  const token = process.env.ADMIN_TOKEN;
  if (!token) return res.status(500).json({ detail: "Server config error: ADMIN_TOKEN not set" });

  res.status(200).json({ token });
}   