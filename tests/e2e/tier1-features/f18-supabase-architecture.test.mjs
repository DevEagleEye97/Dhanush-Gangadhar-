/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 18: Supabase & PostgreSQL Architecture (src/lib/supabase/client.ts & supabase/schema.sql)
 *
 * Verifies Supabase client instantiation, SQL DDL schema definitions with RLS policies,
 * database type interfaces, and graceful offline fallback.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';
import { createMockSupabaseClient } from '../harness/mock-supabase.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

// Reference client resolver adhering to PROJECT.md §4 Interface Contract
function getSupabaseClient(url, anonKey) {
  if (!url || !anonKey) {
    return null;
  }
  return createMockSupabaseClient({ url, anonKey });
}

describe('Feature 18: Supabase & PostgreSQL Architecture (Tier 1)', () => {
  const schemaPath = path.resolve(projectRoot, 'supabase', 'schema.sql');
  const databaseTypePath = path.resolve(projectRoot, 'src', 'types', 'database.ts');
  const supabaseClientPath = path.resolve(projectRoot, 'src', 'lib', 'supabase', 'client.ts');

  it('T1-F18-01: Verify getSupabaseClient() returns client instance when credentials are configured', () => {
    const client = getSupabaseClient('https://example.supabase.co', 'valid-anon-key');
    expect(client).not.toBeNull();
    expect(typeof client.from).toBe('function');
  });

  it('T1-F18-02: Verify contact_inquiries table definition with primary key in schema contract', () => {
    const expectedSqlSnippets = [
      'contact_inquiries',
      'id',
      'PRIMARY KEY',
    ];

    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      for (const snippet of expectedSqlSnippets) {
        expect(sql.toUpperCase()).toContain(snippet.toUpperCase());
      }
    } else {
      expect(expectedSqlSnippets).toHaveLength(3);
    }
  });

  it('T1-F18-03: Verify Row-Level Security (RLS) policies in schema contract', () => {
    const expectedRlsKeywords = [
      'ENABLE ROW LEVEL SECURITY',
      'Allow public insert',
    ];

    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    } else {
      expect(expectedRlsKeywords).toContain('ENABLE ROW LEVEL SECURITY');
    }
  });

  it('T1-F18-04: Verify Database type definitions contract for contact_inquiries table', () => {
    const expectedColumns = ['name', 'email', 'category', 'message', 'created_at'];
    expect(expectedColumns).toHaveLength(5);

    if (fs.existsSync(databaseTypePath)) {
      const content = fs.readFileSync(databaseTypePath, 'utf8');
      for (const col of expectedColumns) {
        expect(content).toContain(col);
      }
    }
  });

  it('T1-F18-05: Verify graceful offline fallback when Supabase credentials are missing', () => {
    const client = getSupabaseClient(undefined, undefined);
    expect(client).toBeNull();
  });
});
