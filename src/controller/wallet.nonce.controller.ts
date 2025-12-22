import { Request, Response } from "express";
import Redis from "ioredis";
import crypto from "crypto"; // Import the crypto module

export const redis = new Redis(6379, "localhost"); // 192.168.1.1:6379

export async function WalletNonseController(req: Request, res: Response) {

    try {
        if (!req.user?.telegramId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const previousNonce = await redis.get(`ton_proof_nonce:${req.user.telegramId}`);
        if (previousNonce) {
            console.log("Reusing existing nonce for user:", req.user);
            return res.status(200).json({ nonce: previousNonce });
        }

        console.log("Generating nonce for user:", req.user);


        const userId = req.user.telegramId;

        // Create nonce
        const nonce = crypto.randomUUID() + "-" + Date.now();

        // Save nonce with TTL
        await redis.setex(`ton_proof_nonce:${userId}`, 600, nonce);

        res.status(200).json({ nonce });
    } catch (err) {
        console.error("Nonce generation error:", err);
        res.status(500).json({ error: "Server error" });
    }
}