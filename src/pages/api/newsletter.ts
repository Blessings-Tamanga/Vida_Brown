import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ detail: "Method not allowed" });

  const { email } = req.body;
  if (!email?.includes("@")) {
    return res.status(400).json({ detail: "Invalid email" });
  }

  try {
    await db.execute("INSERT INTO newsletter_subscribers (email) VALUES (?)", [email]);
    return res.status(200).json({ message: "Subscribed successfully!" });
  } catch (error) {
    if (error instanceof Error && error.message?.includes("UNIQUE")) {
      return res.status(400).json({ detail: "Email already subscribed" });
    }
    return res.status(500).json({ detail: "Subscription failed" });
  }
}
