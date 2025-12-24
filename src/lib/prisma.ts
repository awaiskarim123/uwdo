

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, PoolConfig } from 'pg';

/**
 * Validate DATABASE_URL environment variable
 * @throws Error if DATABASE_URL is missing or invalid
 */
function validateDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please configure it in your .env file.'
    );
  }

  // Validate URL format
  try {
    const url = new URL(databaseUrl);
    
    // Ensure it's a PostgreSQL connection string
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must be a PostgreSQL connection string (postgresql:// or postgres://)');
    }

    // Ensure required components are present
    if (!url.hostname || !url.pathname) {
      throw new Error('DATABASE_URL is missing required components (hostname or database name)');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('DATABASE_URL is not a valid URL format');
    }
    throw error;
  }

  return databaseUrl;
}

/**
 * Get database pool configuration with security and performance settings
 */
function getPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
    
    // Retry configuration
    maxUses: 7500, // Close (and replace) a connection after it has been used this many times
    
    // SSL configuration (use SSL in production)
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: true }
      : false,
  };
}

// Validate DATABASE_URL at startup (fail fast if misconfigured)
const databaseUrl = validateDatabaseUrl();

// Declare a global variable to store Prisma Client
// This prevents creating multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Create PostgreSQL connection pool with explicit configuration
const pool =
  globalForPrisma.pool ??
  new Pool(getPoolConfig(databaseUrl));

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  // Don't exit the process - let the application handle the error
});

// Create Prisma adapter using the connection pool
const adapter = new PrismaPg(pool);

// Create Prisma Client instance with adapter
// Prisma 7 requires an adapter when using prisma.config.ts
// If it already exists globally (in development), use it
// Otherwise, create a new one
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// In development, save the instance to global to prevent multiple connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
