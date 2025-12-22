import { Request, Response } from "express";
import { telegramAuthSchema, telegramUserScheme } from "../schemes/telegram.scheme";
import { telegramService } from "../services/telegram.auth.service";
import { walletService } from "../wallet/service/wallet.service";

export async function telegramAuthController(req: Request, res: Response) {
  const parsed = telegramAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { initData } = parsed.data;

  console.log("Received Telegram initData:", initData);

  // Validate Telegram signature & extract user info
  const telegramUserInfo = await telegramService.verify(initData);

  // Create JWT
  const token = walletService.generateToken({
    telegramId: telegramUserInfo.user?.id,
    username: telegramUserInfo.user?.username,
  });

  // Save user to DB (or update last seen)
  const user = await telegramService.syncUser(telegramUserInfo.user);

  return res.status(200).json({ token, user });
}
