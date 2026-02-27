import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Next.js evaluates this file at build time. If DATABASE_URL is missing or is the old SQLite one,
// neon() will throw an error. We provide a dummy valid Neon Postgres URL to satisfy the build.
// At runtime, the correct DATABASE_URL from .env.local or Vercel will be used.
const connectionString = 
  process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')
    ? process.env.DATABASE_URL
    : 'postgresql://dummy:dummy@ep-dummy-123456.us-east-2.aws.neon.tech/dummy?sslmode=require';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });