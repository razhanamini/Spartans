import { Request, Response, NextFunction } from "express";
import { walletService } from "../wallet/service/wallet.service";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing Authorization" });

  const token = header.split(" ")[1];

  try {
    const decoded = walletService.verifyToken(token);
    req.user = decoded as any;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
