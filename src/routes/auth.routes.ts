import { Router } from "express";
import { telegramAuthController } from "../controller/telegram.controller"
import { walletConnectController } from "../wallet/controller/wallet.controller";
import { testController } from "../controller/test.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { WalletNonseController } from "../controller/wallet.nonce.controller";
// import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/telegram", telegramAuthController);
router.post("/wallet/connect", authMiddleware, walletConnectController);
router.post("/wallet/nonce", authMiddleware, WalletNonseController);

export default router;
