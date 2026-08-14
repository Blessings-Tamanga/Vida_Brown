import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    const rows = await db.execute("SELECT * FROM site_content");
    return res.json(rows.rows);
  }

  if (req.method === "PUT") {
    const { slug, title, subtitle, body, image_url, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url } = req.body;
    if (!slug) return res.status(400).json({ detail: "slug is required" });
    await db.execute(
      `INSERT OR REPLACE INTO site_content (slug, title, subtitle, body, image_url, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?, datetime('now'))`,
      [slug, title, subtitle, body, image_url, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url]
    );
    return res.json({ success: true });
  }

  res.status(405).json({ detail: "Method not allowed" });
}