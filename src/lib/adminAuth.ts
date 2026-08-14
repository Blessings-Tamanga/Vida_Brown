import type { NextApiRequest, NextApiResponse } from "next";

export function isAdmin(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ detail: "Unauthorized" });
    return false;
  }
  return true;
}