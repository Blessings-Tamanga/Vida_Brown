import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    const rows = await db.execute("SELECT * FROM site_content ORDER BY slug");
    return res.json(rows.rows);
  }

  if (req.method === "PUT") {
    const { slug, title, subtitle, body, image_url, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url } = req.body;

    if (!slug) {
      return res.status(400).json({ detail: "Missing slug" });
    }

    await db.execute(
      `INSERT INTO site_content (slug, title, subtitle, body, image_url, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         subtitle = excluded.subtitle,
         body = excluded.body,
         image_url = excluded.image_url,
         cta_primary_label = excluded.cta_primary_label,
         cta_primary_url = excluded.cta_primary_url,
         cta_secondary_label = excluded.cta_secondary_label,
         cta_secondary_url = excluded.cta_secondary_url,
         updated_at = datetime('now')`,
      [slug, title ?? null, subtitle ?? null, body ?? null, image_url ?? null, cta_primary_label ?? null, cta_primary_url ?? null, cta_secondary_label ?? null, cta_secondary_url ?? null]
    );

    return res.json({ success: true });
  }

  return res.status(405).json({ detail: "Method not allowed" });
}
