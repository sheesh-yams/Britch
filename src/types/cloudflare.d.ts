// Cloudflare Workers global types
// These are provided at runtime by the Workers runtime

interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  TURNSTILE_SECRET_KEY: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  RESEND_API_KEY: string;
  R2_PUBLIC_URL: string;  // Public base URL for R2 assets, e.g. https://pub-xxx.r2.dev
  NEXT_PUBLIC_APP_URL: string;
}

// Make env available on process in Next.js
declare global {
  // Cloudflare D1
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1ExecResult>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
  }
  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    error?: string;
    meta: object;
  }
  interface D1ExecResult {
    count: number;
    duration: number;
  }

  // Cloudflare KV
  interface KVNamespace {
    get(key: string, options?: { type?: "text" | "json" | "arrayBuffer" | "stream" }): Promise<string | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }

  // Cloudflare R2
  interface R2Bucket {
    get(key: string): Promise<R2ObjectBody | null>;
    put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
    delete(key: string): Promise<void>;
  }
  interface R2ObjectBody {
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T>(): Promise<T>;
    body: ReadableStream;
    headers: Headers;
    key: string;
  }
}
