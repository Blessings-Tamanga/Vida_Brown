import type { NextApiRequest, NextApiResponse } from "next";
import { isAdmin } from "@/lib/adminAuth";
import path from "path";
import fs from "fs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const { dataUrl, filename } = req.body;

    if (!dataUrl || !filename) {
      return res.status(400).json({ detail: "Missing dataUrl or filename" });
    }

    const base64 = dataUrl.split(",")[1];
    if (!base64) {
      return res.status(400).json({ detail: "Invalid dataUrl" });
    }

    const buffer = Buffer.from(base64, "base64");
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    fs.writeFileSync(filePath, buffer);

    return res.status(200).json({ url: `/uploads/${safeFilename}` });
  } catch (error) {
    return res.status(500).json({ detail: error instanceof Error ? error.message : "Upload failed" });
  }
}
