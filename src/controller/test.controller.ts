import { Request, Response } from "express";
export async function testController(req: Request, res: Response) {
    console.log("Telegram auth request body:", req.body);
    const token = "test-token";
    const user = { id: 1, username: "test-user" };
    return res.json({ token, user });

}