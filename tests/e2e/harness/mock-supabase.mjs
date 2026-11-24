/**
 * In-Memory Supabase Client Mock for E2E Test Suite
 * Emulates @supabase/supabase-js query builder with offline simulation,
 * table state inspection, and resilient fallback verification
 */

class MockQueryBuilder {
  constructor(table, client, mode = 'select') {
    this.table = table;
    this.client = client;
    this.mode = mode;
    this.insertPayload = null;
    this.updatePayload = null;
    this.selectColumns = '*';
    this.filters = [];
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
  }

  insert(data) {
    this.mode = 'insert';
    this.insertPayload = Array.isArray(data) ? data : [data];
    return this;
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  update(data) {
    this.mode = 'update';
    this.updatePayload = data;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  order() {
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async _execute() {
    // 1. Simulate offline or network failure
    if (this.client.isOffline) {
      return {
        data: null,
        error: {
          message: 'TypeError: fetch failed (ECONNREFUSED) - Supabase is offline',
          code: 'ECONNREFUSED',
          details: 'Supabase instance unreachable in offline mode',
        },
      };
    }

    if (this.client.simulatedError) {
      return {
        data: null,
        error: this.client.simulatedError,
      };
    }

    const tableRows = this.client._ensureTable(this.table);

    // 2. Handle Insert
    if (this.mode === 'insert') {
      const inserted = [];
      for (const row of this.insertPayload) {
        const rowWithMeta = {
          id: row.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          created_at: row.created_at || new Date().toISOString(),
          ...row,
        };
        tableRows.push(rowWithMeta);
        inserted.push(rowWithMeta);
      }
      const data = this.isSingle ? inserted[0] : inserted;
      return { data, error: null };
    }

    // 3. Handle Select
    let rows = [...tableRows];
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      if (rows.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: rows[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: rows[0] || null, error: null };
    }

    return { data: rows, error: null };
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }
}

export class MockSupabaseClient {
  constructor(options = {}) {
    this.isOffline = Boolean(options.offline);
    this.simulatedError = options.error || null;
    this.tables = new Map();
  }

  _ensureTable(tableName) {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    return this.tables.get(tableName);
  }

  from(table) {
    return new MockQueryBuilder(table, this);
  }

  get auth() {
    return {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    };
  }

  setOffline(offline = true) {
    this.isOffline = Boolean(offline);
    return this;
  }

  setSimulatedError(error) {
    this.simulatedError = error;
    return this;
  }

  getInsertedRows(table) {
    return this.tables.get(table) ? [...this.tables.get(table)] : [];
  }

  clearTable(table) {
    if (this.tables.has(table)) {
      this.tables.set(table, []);
    }
  }

  reset() {
    this.isOffline = false;
    this.simulatedError = null;
    this.tables.clear();
  }
}

export function createMockSupabaseClient(options = {}) {
  return new MockSupabaseClient(options);
}

export default MockSupabaseClient;
