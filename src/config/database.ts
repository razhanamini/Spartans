import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_j5QZIhSf4XYA@ep-blue-pine-a11kpf0g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
