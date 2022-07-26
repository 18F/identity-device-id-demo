import crypto from "crypto";
import { Request, Response } from "express";

export function getSessionId(req: Request, res: Response): string {
  console.log(req);
  let id = req.cookies["sessionId"];
  if (!id) {
    id = crypto.randomUUID();
    res.cookie("sessionId", id);
  }
  return id;
}
