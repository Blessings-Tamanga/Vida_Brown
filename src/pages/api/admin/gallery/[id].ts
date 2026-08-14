import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  const rawId = req.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return res.status(400).json({ detail: "Missing item id" });
  }

  if (req.method === "DELETE") {
    try {
      const { permanent } = req.body;
      if (permanent) {
        await db.execute("DELETE FROM gallery_images WHERE id = ?", [id]);
        return res.json({ deleted: true });
      } else {
        await db.execute("UPDATE gallery_images SET is_active = 0 WHERE id = ?", [id]);
        return res.json({ deactivated: true });
      }
    } catch (error: any) {
      return res.status(500).json({ detail: error.message });
    }
  }

  if (req.method === "PUT") {
    const { url, alt_text, order, is_active } = req.body;
    try {
      await db.execute(
        `UPDATE gallery_images SET url=?, alt_text=?, "order"=?, is_active=? WHERE id=?`,
        [url, alt_text, order, is_active, id]
      );
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ detail: error.message });
    }
  }

  res.status(405).json({ detail: "Method not allowed" });
}