import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nacl from "tweetnacl";
import { sha256 } from "@noble/hashes/sha256";
import { ProofValue } from "../schemes/wallet.scheme";
import { TonClient } from "ton";
import { Address, Cell, contractAddress, loadStateInit } from "@ton/core";
import { Buffer } from "buffer";
import { createHash } from "crypto";
import { TonClient4} from "@ton/ton";
import {CHAIN} from "@tonconnect/ui-react";



dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const TON_RPC_URL = process.env.TON_RPC_URL!;


const client = new TonClient({
  endpoint: TON_RPC_URL,
  apiKey: process.env.TON_CENTER_API_KEY,
});


export const walletService = {
  generateToken: (payload: object) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  },

  verifyToken: (token: string) => {
    return jwt.verify(token, JWT_SECRET);
  },

  getWalletPublicKey: (address: string) =>{
    return TonApiService.create(CHAIN.MAINNET).getWalletPublicKey(address);
  }
};



export class TonApiService {

  public static create(client: TonClient4 | CHAIN): TonApiService {
    if (client === CHAIN.MAINNET) {
      client = new TonClient4({
        endpoint: 'https://mainnet-v4.tonhubapi.com'
      });
    }
    if (client === CHAIN.TESTNET) {
      client = new TonClient4({
        endpoint: 'https://testnet-v4.tonhubapi.com'
      });
    }
    return new TonApiService(client);
  }

  private readonly client: TonClient4;

  private constructor(client: TonClient4) {
    this.client = client;
  }

  /**
   * Get wallet public key by address.
   */
  public async getWalletPublicKey(address: string): Promise<Buffer> {
    const masterAt = await this.client.getLastBlock();
    const result = await this.client.runMethod(
      masterAt.last.seqno, Address.parse(address), 'get_public_key', []);
    return Buffer.from(result.reader.readBigNumber().toString(16).padStart(64, '0'), 'hex');
  }

  /**
   * Get account info by address.
   */
  public async getAccountInfo(address: string): Promise<ReturnType<TonClient4['getAccount']>> {
    const masterAt = await this.client.getLastBlock();
    return await this.client.getAccount(masterAt.last.seqno, Address.parse(address));
  }

}