// FILE: backend/src/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { sql } from '../config/database';
import { deleteFighter, deleteOrganization, syncFighter, syncOrganization, syncFight, deleteFight, handleFightCreatedService, handleFightCompletedService } from './webhook.service';

interface StrapiEntryPayload {
  entry?: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Log all webhooks
const logWebhook = async (
  eventType: string,
  model: string,
  payload: StrapiEntryPayload
) => {
  try {
    await sql`
      INSERT INTO webhook_logs (event_type, model, strapi_entry_id, payload, processed)
       VALUES (${eventType}, ${model}, ${payload.entry?.id}, ${JSON.stringify(payload)}, false)
    `;
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
};

// Mark webhook as processed
const markWebhookProcessed = async (
  eventType: string,
  strapiId?: string,
  error: string | null = null
) => {
  try {
    await sql`
      UPDATE webhook_logs 
       SET processed = true, processed_at = NOW(), error = ${error}
       WHERE event_type = ${eventType} AND strapi_entry_id = ${strapiId} AND processed = false
    `;
  } catch (err) {
    console.error('Error marking webhook processed:', err);
  }
};

// ============================================
// ORGANIZATION WEBHOOKS
// ============================================
export const handleOrganizationCreated = async (req: Request, res: Response) => {
  try {
    await logWebhook('organization.created', 'organization', req.body);

    const { entry } = req.body;
    await syncOrganization(entry);

    await markWebhookProcessed('organization.created', entry.id);

    res.json({ success: true, message: 'Organization created and synced' });
  } catch (error: any) {
    console.error('Organization created webhook error:', error);
    await markWebhookProcessed(
      'organization.created',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

export const handleOrganizationUpdated = async (req: Request, res: Response) => {
  try {
    await logWebhook('organization.updated', 'organization', req.body);

    const { entry } = req.body;
    await syncOrganization(entry);

    await markWebhookProcessed('organization.updated', entry.id);

    res.json({ success: true, message: 'Organization updated and synced' });
  } catch (error: any) {
    console.error('Organization updated webhook error:', error);
    await markWebhookProcessed(
      'organization.updated',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

export const handleOrganizationDeleted = async (req: Request, res: Response) => {
  try {
    await logWebhook('organization.deleted', 'organization', req.body);

    const { entry } = req.body;
    await deleteOrganization(entry.id);

    await markWebhookProcessed('organization.deleted', entry.id);

    res.json({ success: true, message: 'Organization deleted' });
  } catch (error: any) {
    console.error('Organization deleted webhook error:', error);
    await markWebhookProcessed(
      'organization.deleted',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// FIGHTER WEBHOOKS
// ============================================
export const handleFighterCreated = async (req: Request, res: Response) => {
  try {
    await logWebhook('fighter.created', 'fighter', req.body);

    const { entry } = req.body;
    await syncFighter(entry);

    await markWebhookProcessed('fighter.created', entry.id);

    res.json({ success: true, message: 'Fighter created and synced' });
  } catch (error: any) {
    console.error('Fighter created webhook error:', error);
    await markWebhookProcessed(
      'fighter.created',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

export const handleFighterUpdated = async (req: Request, res: Response) => {
  try {
    await logWebhook('fighter.updated', 'fighter', req.body);

    const { entry } = req.body;
    await syncFighter(entry);

    await markWebhookProcessed('fighter.updated', entry.id);

    res.json({ success: true, message: 'Fighter updated and synced' });
  } catch (error: any) {
    console.error('Fighter updated webhook error:', error);
    await markWebhookProcessed(
      'fighter.updated',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

export const handleFighterDeleted = async (req: Request, res: Response) => {
  try {
    await logWebhook('fighter.deleted', 'fighter', req.body);

    const { entry } = req.body;
    await deleteFighter(entry.id);

    await markWebhookProcessed('fighter.deleted', entry.id);

    res.json({ success: true, message: 'Fighter deleted' });
  } catch (error: any) {
    console.error('Fighter deleted webhook error:', error);
    await markWebhookProcessed(
      'fighter.deleted',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// FIGHT WEBHOOKS
// ============================================
export const handleFightCreated = async (req: Request, res: Response) => {
  try {
    await logWebhook('fight.created', 'fight', req.body);

    const { entry } = req.body;

    // Sync fight and deploy contract
    const result = await handleFightCreatedService(entry);

    await markWebhookProcessed('fight.created', entry.id);

    res.json({
      success: true,
      message: 'Fight created, synced, and contract deployed',
      contractAddress: result.contractAddress
    });
  } catch (error: any) {
    console.error('Fight created webhook error:', error);
    await markWebhookProcessed(
      'fight.created',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

export const handleFightUpdated = async (req: Request, res: Response) => {
  try {
    await logWebhook('fight.updated', 'fight', req.body);

    const { entry } = req.body;

    if (entry.status === 'completed' && entry.winner) {
      await handleFightCompletedService(entry);
    } else {
      await syncFight(entry);
    }

    await markWebhookProcessed('fight.updated', entry.id);

    res.json({ success: true, message: 'Fight updated and synced' });
  } catch (error: any) {
    console.error('Fight updated webhook error:', error);
    await markWebhookProcessed(
      'fight.updated',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

export const handleFightDeleted = async (req: Request, res: Response) => {
  try {
    await logWebhook('fight.deleted', 'fight', req.body);

    const { entry } = req.body;
    await deleteFight(entry.id);

    await markWebhookProcessed('fight.deleted', entry.id);

    res.json({ success: true, message: 'Fight deleted' });
  } catch (error: any) {
    console.error('Fight deleted webhook error:', error);
    await markWebhookProcessed(
      'fight.deleted',
      req.body.entry?.id,
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};
