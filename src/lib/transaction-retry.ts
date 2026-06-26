type PostgresErrorCode = '40P01' | '57P03' | '40001' | '08006' | '08001' | '08004';

type IsolationLevel = 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

const POSTGRES_ERROR_CODES: Record<PostgresErrorCode, string> = {
  '40P01': 'deadlock_detected',
  '57P03': 'cannot_connect_now',
  '40001': 'serialization_failure',
  '08006': 'connection_failure',
  '08001': 'sqlclient_unable_to_establish_sqlconnection',
  '08004': 'server_rejected_establishment_of_sqlconnection',
};

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  isolationLevel?: IsolationLevel;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
  retryableErrors: [
    'deadlock',
    'timeout',
    'connection',
    'serialization',
    'could not serialize',
    '40P01',
    '57P03',
    '40001',
  ],
  isolationLevel: 'READ COMMITTED',
};

export class TransactionRetryError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly attemptNumber: number,
    public readonly totalAttempts: number
  ) {
    super(message);
    this.name = 'TransactionRetryError';
  }
}

function isDeadlockError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const code = (error as any).code;
  return (
    message.includes('deadlock') ||
    message.includes('could not serialize') ||
    code === '40P01' ||
    code === '40001'
  );
}

function isConnectionError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const code = (error as any).code;
  return (
    message.includes('connection') ||
    message.includes('timeout') ||
    code === '57P03' ||
    code === '08006' ||
    code === '08001' ||
    code === '08004'
  );
}

function calculateDelay(attempt: number, opts: RetryOptions): number {
  const baseDelay = Math.min(
    opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
    opts.maxDelay
  );
  const jitter = baseDelay * 0.1 * Math.random();
  return Math.floor(baseDelay + jitter);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = (error as Error).message.toLowerCase();
      const errorCode = (error as any).code;

      const isDeadlock = isDeadlockError(error as Error);
      const isConnection = isConnectionError(error as Error);
      const isRetryable = isDeadlock || isConnection || opts.retryableErrors?.some(
        (retryableError) => errorMessage.includes(retryableError.toLowerCase()) ||
          errorCode === retryableError
      );

      if (!isRetryable || attempt === opts.maxRetries) {
        throw new TransactionRetryError(
          `Transaction failed after ${attempt + 1} attempt(s)`,
          error as Error,
          attempt + 1,
          opts.maxRetries + 1
        );
      }

      const delay = calculateDelay(attempt, opts);

      console.warn(
        `Transaction attempt ${attempt + 1} failed (${isDeadlock ? 'deadlock' : isConnection ? 'connection' : 'retryable'}), retrying in ${delay}ms...`,
        { error: errorMessage, code: errorCode }
      );

      await sleep(delay);
    }
  }

  throw new TransactionRetryError(
    'Transaction failed after all retries',
    lastError!,
    opts.maxRetries + 1,
    opts.maxRetries + 1
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withAdvisoryLock<T>(
  lockKey: string,
  operation: () => Promise<T>,
  supabase: any,
  options: { timeout?: number; retryDelay?: number } = {}
): Promise<T> {
  const { timeout = 5000, retryDelay = 100 } = options;
  const lockId = generateLockId(lockKey);
  const startTime = Date.now();

  try {
    while (Date.now() - startTime < timeout) {
      const { data: locked, error: acquireError } = await supabase.rpc(
        'pg_try_advisory_xact_lock',
        { lock_id: lockId }
      );

      if (acquireError) {
        throw new Error(`Failed to acquire advisory lock: ${acquireError.message}`);
      }

      if (locked) {
        try {
          return await operation();
        } finally {
          const { error: releaseError } = await supabase.rpc('pg_advisory_unlock', {
            lock_id: lockId,
          });

          if (releaseError) {
            console.error('Failed to release advisory lock:', releaseError);
          }
        }
      }

      await sleep(retryDelay);
    }

    throw new Error(`Failed to acquire advisory lock for ${lockKey} after ${timeout}ms`);
  } catch (error) {
    const { error: releaseError } = await supabase.rpc('pg_advisory_unlock', {
      lock_id: lockId,
    });

    if (releaseError) {
      console.error('Failed to release advisory lock after error:', releaseError);
    }

    throw error;
  }
}

function generateLockId(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const RETRY_CONFIG = {
  CRITICAL: {
    maxRetries: 5,
    initialDelay: 50,
    maxDelay: 10000,
  },
  STANDARD: DEFAULT_RETRY_OPTIONS,
  NON_CRITICAL: {
    maxRetries: 2,
    initialDelay: 200,
    maxDelay: 2000,
  },
};

export async function withTransaction<T>(
  operation: (supabase: any) => Promise<T>,
  supabase: any,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };

  return withRetry(async () => {
    const { data, error } = await supabase.rpc('begin_transaction', {
      isolation_level: opts.isolationLevel || 'READ COMMITTED',
    });

    if (error) {
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }

    try {
      const result = await operation(supabase);

      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        throw new Error(`Failed to commit transaction: ${commitError.message}`);
      }

      return result;
    } catch (error) {
      const { error: rollbackError } = await supabase.rpc('rollback_transaction');
      if (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
      throw error;
    }
  }, opts);
}

export async function withDeadlockSafeOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    ...RETRY_CONFIG.CRITICAL,
    ...options,
  });
}
