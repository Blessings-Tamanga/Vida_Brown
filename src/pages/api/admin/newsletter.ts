import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ detail: "Method not allowed" });

  const { email } = req.body;
  if (!email?.includes("@")) {
    return res.status(400).json({ detail: "Invalid email" });
  }

  try {
    await db.execute("INSERT INTO newsletter_subscribers (email) VALUES (?)", [email]);

    // Auto‑reply (only if Resend is configured)
    if (resend) {
      await resend.emails.send({
        from: "Vida Brown <newsletter@yourdomain.com>",
        to: email,
        subject: "Welcome to the Vida Brown community!",
        html: "<p>Thanks for subscribing! Stay tuned for the latest music.</p>",
      });
    }

    res.status(200).json({ message: "Subscribed successfully!" });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE")) {
      return res.status(400).json({ detail: "Email already subscribed" });
    }
    res.status(500).json({ detail: "Subscription failed" });
  }
}