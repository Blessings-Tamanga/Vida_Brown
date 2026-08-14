import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    try {
      const images = await db.execute("SELECT * FROM gallery_images ORDER BY \"order\"");
      return res.json(images.rows);
    } catch (error: any) {
      return res.status(500).json({ detail: error.message });
    }
  }

  if (req.method === "POST") {
    const { url, alt_text, order } = req.body;
    if (!url || !alt_text) {
      return res.status(400).json({ detail: "url and alt_text are required" });
    }
    try {
      await db.execute(
        `INSERT INTO gallery_images (url, alt_text, "order", is_active) VALUES (?,?,?,1)`,
        [url, alt_text, order || 0]
      );
      return res.status(201).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ detail: error.message });
    }
  }

  res.status(405).json({ detail: "Method not allowed" });
}