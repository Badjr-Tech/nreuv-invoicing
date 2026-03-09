import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema'; // Import all schema definitions

const connectionString = 
  process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')
    ? process.env.DATABASE_URL
    : 'postgresql://dummy:dummy@ep-dummy-123456.us-east-2.aws.neon.tech/dummy?sslmode=require';

const sql = neon(connectionString);

// Create the Drizzle client with all schema definitions
export const db = drizzle(sql, { schema });