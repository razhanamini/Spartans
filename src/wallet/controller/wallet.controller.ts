import { Request, Response } from "express";
import { CheckProofRequest } from "../schemes/wallet.scheme";
import { redis } from "../../controller/wallet.nonce.controller";
import { sql } from "../../config/database";
import { walletService } from "../service/wallet.service";
import { TonProofService } from "../service/ton-proof-service";
import dotenv from "dotenv";
import { CHAIN } from "@tonconnect/ui-react";
dotenv.config();

const EXPECTED_WALLET_DOMAIN = process.env.EXPECTED_WALLET_DOMAIN!;
const checkProof = new TonProofService().checkProof.bind(new TonProofService());

export async function walletConnectController(req: Request, res: Response) {
  let walletVerified: boolean = true;
  console.log("Received wallet connect request:", req.body);

  const userId = req.user?.telegramId;
  if (!userId) {
    console.log("Unauthorized access attempt:", req.user);
    return res.status(401).json({ error: "Unauthorized" });}

  const parseResult = CheckProofRequest.safeParse(req.body);
  if (!parseResult.success) {
    console.log("Invalid request body:", parseResult.error);
    console.log("Request body received:", req.body);
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { address, proof, public_key } = parseResult.data;

  console.log("Wallet connect request for user:", req.user, "with wallet:", address);
  console.log("Request body data:", parseResult.data);

  const redisKey = `ton_proof_nonce:${userId}`;
  const storedNonce = await redis.get(redisKey);

  if (!storedNonce || storedNonce !== proof.payload) {
    return res.status(400).json({ error: "Invalid or expired nonce" });
  }

  console.log("Fetching public key for wallet address:", address);
  // const publicKeyFetchResult = await walletService.getWalletPublicKey(address);
  // if (!publicKeyFetchResult) {
  //   walletVerified = false;
  //   // return res.status(400).json({ error: "Failed to retrieve wallet public key" });
  // }

  console.log("Verifying proof with public key:", public_key);
  const isValid = await checkProof(
    {
      address: address,
      network: CHAIN.MAINNET,
      public_key: public_key,
      proof: proof,
      payloadToken: storedNonce
    },
    (address) => walletService.getWalletPublicKey(address)
  );
  if (!isValid) {
    console.log("Invalid wallet proof for user:", req.user, "with wallet:", address);
    return res.status(401).json({ error: "Invalid wallet proof" });
  }

  console.log("Wallet proof verified for user:", req.user, "with wallet:", address);

  await redis.del(redisKey);

  const [updatedUser] = await sql`
    UPDATE users
    SET ton_wallet_address = ${address},
        wallet_connected_at = NOW(),
        updated_at = NOW(),
        wallet_verified = ${walletVerified}
    WHERE telegram_id = ${userId}
    RETURNING *;
  `;

  return res.status(200).json({ success: true, user: updatedUser });
}
