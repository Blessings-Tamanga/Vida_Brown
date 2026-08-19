import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    const tracks = await db.execute("SELECT * FROM tracks ORDER BY track_number");
    return res.json(tracks.rows);
  }

  if (req.method === "POST") {
    const { track_number, title, artist_name, featured_artist, year, streams, track_type, artist_id } = req.body;
    if (!title || !artist_name || !track_number) {
      return res.status(400).json({ detail: "Missing required fields" });
    }
    await db.execute(
      `INSERT INTO tracks (track_number, title, artist_name, featured_artist, year, streams, track_type, artist_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [track_number, title, artist_name, featured_artist || null, year || null, streams || 0, track_type, artist_id || null]
    );
    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ detail: "Method not allowed" });
}