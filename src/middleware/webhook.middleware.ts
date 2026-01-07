import { NextFunction, Request, Response } from "express";

export const verifyWebhookSecret = (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.STRAPI_WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
    }
    next();
};