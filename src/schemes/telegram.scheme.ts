import { z } from "zod";
import { JwtPayload } from "jsonwebtoken";


export const telegramAuthSchema = z.object({
  initData: z.string().min(10),
});

export const telegramUserScheme = z.object({
  id: z.number(),
  username: z.string().optional(),
  first_name: z.string().optional(),
});


declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        id: string | number;
      }// type according to your decoded JWT
    }
  }
}

