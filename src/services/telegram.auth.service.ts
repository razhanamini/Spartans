import crypto from "crypto";
import { record } from "zod";
import { validate, parse, type InitData } from "@tma.js/init-data-node";
import { sql } from "../config/database";

export const telegramService = {
  verify: async (initData: string) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    try {
      // Validate the initData using Telegram rules
      validate(initData, process.env.TELEGRAM_BOT_TOKEN!, {
      });

      // Parse and return normalized Telegram init data
      const data = parse(initData);
        console.log("Auth success returning data object: ", data);

      return data;
    } catch (e: any) {
      console.error("Telegram validation failed:", e.message);
      throw new Error("Invalid Telegram initData Authentication failed");
    }

  },

  syncUser: async (telegramUser: any) => {
    // TODO: implement connection with database

    const { id: telegramId, username, first_name, last_name } = telegramUser;

    const result = await sql`
    INSERT INTO users (
      telegram_id, username, first_name, last_name
    )
    VALUES (
      ${telegramId}, ${username}, ${first_name}, ${last_name}
    )
    ON CONFLICT (telegram_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW()
    RETURNING *;
  `;

    return result[0];
  },
  
};
