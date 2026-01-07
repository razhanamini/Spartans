import { sql } from '../config/database';
import { redis } from "../controller/wallet.nonce.controller";

interface StrapiFile {
  data?: {
    attributes?: {
      url?: string;
    };
    url?: string;
  };
  url?: string;
}

interface StrapiOrganization {
  id: string;
  name: string;
  logo?: StrapiFile;
  country?: string;
  [key: string]: any;
}

interface StrapiFighter {
  id: string;
  name: string;
  photo?: StrapiFile;
  record?: string;
  weight_class?: string;
  [key: string]: any;
}

interface StrapiFight {
  id: string;
  organization?: { data: StrapiOrganization };
  fighter_a?: { data: StrapiFighter };
  fighter_b?: { data: StrapiFighter };
  fight_date: string;
  status?: string;
  winner?: { data: StrapiFighter };
  [key: string]: any;
}

interface ContractResult {
  address: string;
}

//
// ============================================
// ORGANIZATION SYNC
// ============================================
export const syncOrganization = async (strapiOrg: StrapiOrganization) => {
  const logoUrl =
    strapiOrg.logo?.data?.attributes?.url ||
    strapiOrg.logo?.url ||
    null;

  await sql`
    INSERT INTO organizations (
      strapi_id, name, logo_url, country, last_synced_at
    )
    VALUES (
      ${strapiOrg.id},
      ${strapiOrg.name},
      ${logoUrl},
      ${strapiOrg.country},
      NOW()
    )
    ON CONFLICT (strapi_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      logo_url = EXCLUDED.logo_url,
      country = EXCLUDED.country,
      last_synced_at = NOW()
  `;

  await redis.del('organizations');
  console.log(`✅ Synced organization: ${strapiOrg.name}`);
};

export const deleteOrganization = async (strapiId: string) => {
  await sql`
    DELETE FROM organizations
    WHERE strapi_id = ${strapiId}
  `;
  await redis.del('organizations');
  console.log(`🗑️ Deleted organization: ${strapiId}`);
};

//
// ============================================
// FIGHTER SYNC
// ============================================
export const syncFighter = async (strapiFighter: StrapiFighter) => {
  const photoUrl =
    strapiFighter.photo?.data?.attributes?.url ||
    strapiFighter.photo?.url ||
    null;

  await sql`
    INSERT INTO fighters (
      strapi_id, name, photo_url, record, weight_class, last_synced_at
    )
    VALUES (
      ${strapiFighter.id},
      ${strapiFighter.name},
      ${photoUrl},
      ${strapiFighter.record},
      ${strapiFighter.weight_class},
      NOW()
    )
    ON CONFLICT (strapi_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      photo_url = EXCLUDED.photo_url,
      record = EXCLUDED.record,
      weight_class = EXCLUDED.weight_class,
      last_synced_at = NOW()
  `;

  console.log(`✅ Synced fighter: ${strapiFighter.name}`);
};


export const handleFightCompletedService = async (strapiFight: StrapiFight) => {
  try {
    console.log(`🏁 Fight completed: ${strapiFight.id}`);

    await syncFight(strapiFight);

    // Mock this part for now because paymentsModule is not imported
    // await paymentsModule.processFightPayouts(strapiFight.id);

    console.log(`✅ Payout process initiated for fight ${strapiFight.id}`);
  } catch (error) {
    console.error('Handle fight completed error:', error);
    throw error;
  }
};


export const deleteFighter = async (strapiId: string) => {
  await sql`
    DELETE FROM fighters
    WHERE strapi_id = ${strapiId}
  `;
  console.log(`🗑️ Deleted fighter: ${strapiId}`);
};

//
// ============================================
// FIGHT CREATION (TRANSACTION)
// ============================================
export const handleFightCreatedService = async (
  strapiFight: StrapiFight
): Promise<{ fightId: number; contractAddress: string }> => {

  
    console.log(`🥊 Processing fight ${strapiFight.id}`);

    if (strapiFight.organization?.data) {
      await syncOrganization(strapiFight.organization.data);
    }
    if (strapiFight.fighter_a?.data) {
      await syncFighter(strapiFight.fighter_a.data);
    }
    if (strapiFight.fighter_b?.data) {
      await syncFighter(strapiFight.fighter_b.data);
    }

    const [org] = await sql`
      SELECT id FROM organizations
      WHERE strapi_id = ${strapiFight.organization?.data?.id}
    `;
    const [fa] = await sql`
      SELECT id FROM fighters
      WHERE strapi_id = ${strapiFight.fighter_a?.data?.id}
    `;
    const [fb] = await sql`
      SELECT id FROM fighters
      WHERE strapi_id = ${strapiFight.fighter_b?.data?.id}
    `;

    if (!org || !fa || !fb) {
      throw new Error('Missing related entities for fight');
    }

    const [fight] = await sql`
      INSERT INTO fights (
        strapi_id,
        organization_id,
        fighter_a_id,
        fighter_b_id,
        fight_date,
        status,
        last_synced_at
      )
      VALUES (
        ${strapiFight.id},
        ${org.id},
        ${fa.id},
        ${fb.id},
        ${strapiFight.fight_date},
        ${strapiFight.status ?? 'upcoming'},
        NOW()
      )
      RETURNING id
    `;

    const fightId = fight.id;

    // Mock contract deployment
    const contractResult: ContractResult = {
      address: '0xMockContractAddress'
    };

    await sql`
      UPDATE fights
      SET escrow_contract_address = ${contractResult.address},
          contract_deployed_at = NOW()
      WHERE id = ${fightId}
    `;

    await redis.del('upcoming_fights');

    console.log(`🎉 Fight ${fightId} ready`);
    return { fightId, contractAddress: contractResult.address };
  
};

//
// ============================================
// FIGHT UPDATE
// ============================================
export const syncFight = async (strapiFight: StrapiFight) => {
  let winnerId: number | null = null;

  if (strapiFight.winner?.data) {
    const [winner] = await sql`
      SELECT id FROM fighters
      WHERE strapi_id = ${strapiFight.winner.data.id}
    `;
    if (winner) winnerId = winner.id;
  }

  const isLocked = ['completed', 'cancelled', 'live']
    .includes(strapiFight.status ?? '');

  await sql`
    UPDATE fights
    SET status = ${strapiFight.status},
        winner_fighter_id = ${winnerId},
        is_locked = ${isLocked},
        last_synced_at = NOW()
    WHERE strapi_id = ${strapiFight.id}
  `;

  await redis.del('upcoming_fights');
  console.log(`✅ Fight updated: ${strapiFight.id}`);
};

//
// ============================================
// DELETE FIGHT
// ============================================
export const deleteFight = async (strapiId: string) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM bets b
    JOIN fights f ON b.fight_id = f.id
    WHERE f.strapi_id = ${strapiId}
  `;

  if (count > 0) {
    throw new Error('Cannot delete fight with existing bets');
  }

  await sql`
    DELETE FROM fights
    WHERE strapi_id = ${strapiId}
  `;

  await redis.del('upcoming_fights');
  console.log(`🗑️ Deleted fight: ${strapiId}`);
};
