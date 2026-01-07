// FILE: backend/src/routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../webhook/webhook.controller.ts');
// import webhookController from "../webhook/webhook.controller.ts";
import { verifyWebhookSecret } from "../middleware/webhook.middleware";


// Organization webhooks
router.post('/organization-created', verifyWebhookSecret, webhookController.handleOrganizationCreated);
router.post('/organization-updated', verifyWebhookSecret, webhookController.handleOrganizationUpdated);
router.post('/organization-deleted', verifyWebhookSecret, webhookController.handleOrganizationDeleted);

// Fighter webhooks
router.post('/fighter-created', verifyWebhookSecret, webhookController.handleFighterCreated);
router.post('/fighter-updated', verifyWebhookSecret, webhookController.handleFighterUpdated);
router.post('/fighter-deleted', verifyWebhookSecret, webhookController.handleFighterDeleted);

// Fight webhooks
router.post('/fight-created', verifyWebhookSecret, webhookController.handleFightCreated);
router.post('/fight-updated', verifyWebhookSecret, webhookController.handleFightUpdated);
router.post('/fight-deleted', verifyWebhookSecret, webhookController.handleFightDeleted);

export default router;