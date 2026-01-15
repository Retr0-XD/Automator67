# Specification: Database Router Service

**Component**: Distributed query routing and schema federation  
**Language**: Node.js + TypeScript  
**Version**: 1.0  
**Status**: Specification - Ready for Review

---

## 1. Component Purpose

The Database Router is responsible for:
- Parsing SQL queries into analyzable AST (Abstract Syntax Tree)
- Identifying which database shards contain required data
- Rewriting queries for shard-specific execution
- Executing queries in parallel across shards
- Aggregating results from multiple shards
- Maintaining schema information across all databases
- Supporting various sharding strategies (hash, range, directory)
- Handling shard failures and fallbacks
- Optimizing queries for distributed execution

### Key Principle
**Router is distribution-aware** - Applications think they're querying one database, but queries are silently distributed across multiple providers and shards.

---

## 2. Responsibilities & Boundaries

### ✅ Database Router IS Responsible For:
1. **SQL Query Analysis**
   - Parse SQL into AST
   - Extract table names
   - Extract column references
   - Extract WHERE conditions
   - Extract JOINs
   - Extract GROUP BY, ORDER BY, LIMIT

2. **Shard Identification**
   - Determine which shards contain data
   - Use sharding strategy to map data to shards
   - Identify cross-shard queries

3. **Query Rewriting**
   - Rewrite queries for individual shards
   - Add shard-specific table filters
   - Handle shard-specific limitations
   - Generate execution plan

4. **Query Execution**
   - Execute rewritten queries in parallel
   - Manage connection pools
   - Handle query timeouts
   - Retry on failures
   - Collect metrics

5. **Result Aggregation**
   - Merge results from multiple shards
   - Handle duplicate rows (DISTINCT)
   - Apply GROUP BY/aggregation
   - Apply ORDER BY across shards
   - Apply LIMIT correctly

6. **Schema Management**
   - Store schema information per database
   - Track table locations (which shard)
   - Cache schema for performance
   - Detect schema changes
   - Support schema migration

### ❌ Database Router IS NOT Responsible For:
- Storing user data (database providers do this)
- Executing queries directly (database nodes do this)
- Creating databases (user creates them)
- Managing database credentials (controller stores these)
- Replicating data between shards (handled elsewhere)

---

## 3. Data Models

### 3.1 Schema Registry Model

```
SchemaRegistry {
  database_id: UUID
  provider: string (supabase, mongodb, postgresql, etc.)
  tables: [
    {
      name: string
      columns: [
        {
          name: string
          type: string (int, varchar, timestamp, etc.)
          nullable: boolean
          is_primary_key: boolean
          is_foreign_key: boolean (if true, has foreign_key_ref)
          is_index: boolean
          sharding_key: boolean (is this the sharding column?)
        }
      ]
      primary_key: string[] (column names)
      indices: [
        {
          name: string
          columns: string[]
          unique: boolean
        }
      ]
      foreign_keys: [
        {
          column: string
          references_table: string
          references_column: string
        }
      ]
    }
  ]
  
  sharding: {
    strategy: string enum (hash, range, directory)
    sharding_column: string (which column is sharded on)
    shard_count: number
    
    // For hash sharding
    hash_function: string enum (murmur3, fnv1a, crc32)
    
    // For range sharding
    range_boundaries: [
      {
        min: any
        max: any
        shard_id: number
      }
    ]
    
    // For directory sharding
    directory: Record<any, number> (value → shard_id)
  }
  
  created_at: timestamp
  last_synced: timestamp
  cache_ttl_seconds: number
}

Storage: PostgreSQL
  Table: schema_registries
  Indices:
    - PRIMARY KEY (database_id)
    - UNIQUE (database_id)
```

### 3.2 Query Plan Model

```
QueryPlan {
  query_id: UUID (unique per query execution)
  original_query: string
  parsed_ast: object (AST representation)
  
  analysis: {
    query_type: string enum (select, insert, update, delete)
    tables_referenced: string[]
    columns_referenced: string[]
    aggregations: string[] (SUM, COUNT, AVG, etc.)
    grouping: string[] (GROUP BY columns)
    ordering: [
      {
        column: string
        direction: string (ASC, DESC)
      }
    ]
    limit: number | null
    offset: number | null
    where_conditions: [
      {
        column: string
        operator: string (=, >, <, IN, LIKE, etc.)
        value: any | any[]
      }
    ]
  }
  
  sharding_analysis: {
    sharding_column: string
    sharding_values: any[] | null (if known)
    affected_shards: number[] (shard IDs to query)
    is_cross_shard: boolean (queries multiple shards?)
    push_down_possible: boolean (can filter at shard level?)
  }
  
  rewritten_queries: [
    {
      shard_id: number
      rewritten_sql: string
      affected_rows_estimate: number
    }
  ]
  
  aggregation_plan: {
    needs_aggregation: boolean
    aggregation_type: string enum (none, partial, full)
    group_by_columns: string[]
    aggregation_functions: [
      {
        function: string (COUNT, SUM, AVG, etc.)
        column: string | null
        output_column: string
      }
    ]
  }
  
  execution_order: {
    parallel: boolean (can execute shards in parallel?)
    dependencies: number[] (shard IDs this depends on)
  }
  
  created_at: timestamp
  execution_start: timestamp
  execution_end: timestamp
}

Storage: In-memory cache
  TTL: 1 hour
  Key: hash(query)
  Size limit: 10,000 plans
  Eviction: LRU
```

### 3.3 Query Execution Result Model

```
QueryResult {
  query_id: UUID
  original_query: string
  execution_time_ms: number
  
  status: string enum (success, partial, failed)
  
  columns: [
    {
      name: string
      type: string
      size_bytes: number (estimated)
    }
  ]
  
  rows: any[][] (array of rows, each row is array of columns)
  row_count: number
  
  shard_results: [
    {
      shard_id: number
      status: string enum (success, failed, timeout)
      row_count: number
      execution_time_ms: number
      error_message: string | null
    }
  ]
  
  aggregation_applied: boolean
  ordering_applied: boolean
  limit_applied: boolean
  
  truncated: boolean (did we stop at LIMIT?)
  
  metadata: {
    shards_queried: number
    shards_failed: number
    total_bytes_transferred: number
    cache_hit: boolean
  }
}

Storage: In-memory (stream to client)
  Large results: Stream rows instead of buffering
  Max buffered rows: 10,000
  Then: Stream remaining rows
```

### 3.4 Shard Location Model

```
ShardLocation {
  database_id: UUID
  shard_id: number
  
  primary: {
    provider: string (postgresql, mongodb, supabase)
    endpoint: string
    database_name: string
    credentials_id: UUID (reference to encrypted creds)
    port: number
    ssl_required: boolean
  }
  
  replicas: [
    {
      provider: string
      endpoint: string
      database_name: string
      credentials_id: UUID
      port: number
      ssl_required: boolean
      preferred_for_reads: boolean
    }
  ]
  
  status: string enum (healthy, degraded, failed)
  last_health_check: timestamp
  
  statistics: {
    row_count: number
    size_bytes: number
    last_analyze: timestamp
  }
}

Storage: PostgreSQL
  Table: shard_locations
  Indices:
    - PRIMARY KEY (database_id, shard_id)
    - INDEX (status)
```

---

## 4. Core Processes & Flows

### 4.1 SQL Parsing & Analysis Flow

```
Sequence: SQL Query → Tokenizer → Parser → AST → Analyzer → QueryPlan

1. Receive SQL query:
   "SELECT users.name, COUNT(*) as count
    FROM users
    WHERE users.user_id = 123
    GROUP BY users.name"

2. Check query cache:
   - Generate cache key: hash(sql_query)
   - Lookup in cache
   - If hit: Return cached plan
   - If miss: Continue parsing

3. Tokenize query:
   - Split into tokens: SELECT, users, ., name, FROM, ...
   - Remove whitespace/comments
   - Identify keywords

4. Parse into AST:
   ```
   QueryAST {
     type: 'SELECT',
     select_list: [
       {type: 'column', table: 'users', column: 'name'},
       {type: 'aggregate', function: 'COUNT', args: ['*'], alias: 'count'}
     ],
     from: 'users',
     where: {
       type: 'condition',
       column: {table: 'users', column: 'user_id'},
       operator: '=',
       value: 123
     },
     group_by: [
       {table: 'users', column: 'name'}
     ]
   }
   ```

5. Validate table/column references:
   - Lookup schema registry
   - Verify all tables exist
   - Verify all columns exist in those tables
   - Check column types match operations
   
   If invalid:
     - Return error with details
     - "Column 'invalid_column' not found in table 'users'"

6. Analyze for aggregations:
   - Identify aggregate functions (COUNT, SUM, AVG, MAX, MIN)
   - Check if query has GROUP BY
   - Determine aggregation strategy

7. Analyze for sharding:
   - Identify sharding column for each table
   - Check if WHERE clause filters on sharding column
   - If yes: Can push filter to shard level
   - If no: Must query all shards

8. Create execution plan:
   - List tables and shards
   - List rewrite rules
   - Determine aggregation strategy
   - Cache the plan

Error Scenarios:
- SQL syntax error → Return error at first token mismatch
- Table not found → Return "Table 'x' not found"
- Column type mismatch → Return "Cannot compare string with number"
- Unsupported syntax → Return "Unsupported: X"
```

### 4.2 Shard Identification Flow

```
Sequence: WHERE Clause → Sharding Column → Calculate Hash → Identify Shards

Scenario 1: Hash Sharding with Shard Key in WHERE

1. Query: "SELECT * FROM users WHERE user_id = 123"
2. Schema: users table is hash-sharded on 'user_id' with 4 shards
3. Extract sharding value: user_id = 123
4. Apply hash function:
   shard_id = murmur3_hash(123) % 4
   shard_id = 3 (example)
5. Result: Query only shard_id=3
   - Efficiency: 75% reduction (query 1/4 of data)

Scenario 2: Hash Sharding without Shard Key in WHERE

1. Query: "SELECT * FROM users WHERE name = 'John'"
2. Schema: users table is hash-sharded on 'user_id' (but WHERE doesn't filter on it)
3. Cannot determine which shards contain 'John'
4. Result: Query ALL shards (1, 2, 3, 4)
   - Efficiency: None (query all data)

Scenario 3: Range Sharding

1. Query: "SELECT * FROM events WHERE created_at > '2024-01-01'"
2. Schema: events table is range-sharded on 'created_at' with boundaries:
   - Shard 0: [min, 2023-12-01)
   - Shard 1: [2023-12-01, 2024-01-01)
   - Shard 2: [2024-01-01, 2024-02-01)
   - Shard 3: [2024-02-01, max]
3. Condition: created_at > '2024-01-01'
4. Affected shards: 2, 3 (events on/after 2024-01-01)
5. Result: Query only shards 2, 3

Scenario 4: Directory Sharding

1. Query: "SELECT * FROM users WHERE region = 'us-east'"
2. Schema: users table is directory-sharded on 'region':
   - 'us-east' → shard 0
   - 'us-west' → shard 1
   - 'eu-west' → shard 2
   - 'ap-south' → shard 3
3. Condition: region = 'us-east'
4. Result: Query only shard 0

Scenario 5: Multiple Tables (JOIN)

1. Query: "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE u.id = 123"
2. Schema:
   - users: hash-sharded on 'id' with 4 shards
   - orders: hash-sharded on 'user_id' with 4 shards
3. Shard for users: hash(123) % 4 = 3
4. Shard for orders: hash(123) % 4 = 3 (same!)
5. Both tables in same shard: Execute JOIN within one shard
6. Result: Simple single-shard query

Scenario 6: Multiple Tables (Different Sharding)

1. Query: "SELECT u.name, p.content FROM users u JOIN posts p ON u.id = p.author_id WHERE u.id = 123"
2. Schema:
   - users: hash-sharded on 'id' with 4 shards
   - posts: hash-sharded on 'author_id' with 8 shards
3. Shard for users: hash(123) % 4 = 3
4. Shard for posts: hash(123) % 8 = 3 or 4 (different possible values)
5. Tables in different shards: Cross-shard JOIN required
6. Result: Complex multi-shard query with application-level join

Error Scenarios:
- Unparseable WHERE condition → Query all shards
- Operator not supported for sharding → Query all shards
- Invalid shard key value → Return error
```

### 4.3 Query Rewriting Flow

```
Sequence: AST + Shard Info → Rewrite → Shard-Specific SQL

Example: Original Query
SELECT users.name, COUNT(*) as count
FROM users
WHERE users.user_id IN (123, 456)
GROUP BY users.name

Shard Identification:
- hash(123) % 4 = 3
- hash(456) % 4 = 2
- Affected shards: 2, 3

For Shard 2:

1. Identify which values belong to shard 2:
   - Only user_id 456 belongs to shard 2

2. Rewrite WHERE clause:
   Original: WHERE users.user_id IN (123, 456)
   Rewritten: WHERE users.user_id IN (456)

3. Add shard filter (if using shard-specific table names):
   Original table: users
   Rewritten table: users_shard_2 (or users partition)
   
   Rewritten query:
   SELECT users_shard_2.name, COUNT(*) as count
   FROM users_shard_2
   WHERE users_shard_2.user_id IN (456)
   GROUP BY users_shard_2.name

For Shard 3:

1. Values that belong to shard 3:
   - Only user_id 123 belongs to shard 3

2. Rewritten query:
   SELECT users_shard_3.name, COUNT(*) as count
   FROM users_shard_3
   WHERE users_shard_3.user_id IN (123)
   GROUP BY users_shard_3.name

Execution Plan:
```
[
  {
    shard_id: 2,
    rewritten_sql: "SELECT users_shard_2.name, COUNT(*) as count FROM users_shard_2 WHERE users_shard_2.user_id IN (456) GROUP BY users_shard_2.name"
  },
  {
    shard_id: 3,
    rewritten_sql: "SELECT users_shard_3.name, COUNT(*) as count FROM users_shard_3 WHERE users_shard_3.user_id IN (123) GROUP BY users_shard_3.name"
  }
]
```

Error Scenarios:
- Rewrite invalid → Return error with original and rewritten query
- Shard not found → Return error "Shard not found"
- Table doesn't exist on shard → Return error with shard-specific details
```

### 4.4 Parallel Query Execution Flow

```
Sequence: Execute on All Shards → Collect Results → Aggregate

1. Get execution plan (from previous steps)

2. Execute queries in parallel:
   FOR EACH shard in plan IN PARALLEL:
     a) Lookup shard location (primary/replicas)
     b) Establish connection to shard database
     c) Execute rewritten query
     d) Timeout: 30 seconds per shard
     e) Collect results (streaming if large)

   Example execution:
   ```
   Shard 2: SELECT COUNT(*) = 542
   Shard 3: SELECT COUNT(*) = 789
   ```

3. Handle failures:
   FOR EACH shard:
     a) If success: Add results to collection
     b) If timeout:
        - Retry once
        - If still timeout: Mark as failed, continue
     c) If connection error:
        - Try replica (if available)
        - If no replicas: Mark as failed, continue
     d) If SQL error:
        - Return error with shard details
        - Stop execution

4. Track execution metrics:
   - Per-shard execution time
   - Per-shard row count
   - Total bytes transferred
   - Shard failures

Error Scenarios:
- Shard unavailable → Try replica or fail
- Query timeout → Retry once, then mark as failed
- SQL error on shard → Return error with shard-specific message
- All shards fail → Return 503 Service Unavailable
```

### 4.5 Result Aggregation Flow

```
Sequence: Shard Results → Aggregate (if needed) → Apply ORDER/LIMIT → Return

Scenario 1: No Aggregation Needed (Simple SELECT)

Query: "SELECT id, name FROM users WHERE id > 100 LIMIT 10"

Results from shards:
```
Shard 1: [(101, 'Alice'), (103, 'Bob'), ...]
Shard 2: [(102, 'Charlie'), (105, 'David'), ...]
Shard 3: [(104, 'Eve'), ...]
```

Steps:
1. Collect all rows: 
   [(101, 'Alice'), (102, 'Charlie'), (103, 'Bob'), (104, 'Eve'), (105, 'David'), ...]

2. Apply ORDER BY (if present):
   Original: No ORDER BY specified
   Result: Return first 10 as they arrive

3. Apply LIMIT:
   LIMIT 10: Return first 10 rows

4. Stream to client:
   [(101, 'Alice'), (102, 'Charlie'), (103, 'Bob'), (104, 'Eve'), (105, 'David'), (101, 'Frank'), ...]

Scenario 2: Aggregation Needed (COUNT, SUM, etc.)

Query: "SELECT region, SUM(sales) FROM transactions GROUP BY region"

Results from shards:
```
Shard 1: [('us-east', 1000), ('us-west', 500)]
Shard 2: [('us-east', 1500), ('eu-west', 200)]
Shard 3: [('us-west', 700), ('eu-west', 300)]
```

Steps:
1. Identify GROUP BY columns: ['region']
2. Identify aggregation: SUM(sales)
3. Merge results by group:
   ```
   'us-east': 1000 + 1500 = 2500
   'us-west': 500 + 700 = 1200
   'eu-west': 200 + 300 = 500
   ```
4. Result: [('us-east', 2500), ('us-west', 1200), ('eu-west', 500)]

Scenario 3: DISTINCT Values

Query: "SELECT DISTINCT email FROM users"

Results from shards:
```
Shard 1: ['alice@example.com', 'bob@example.com', 'alice@example.com']
Shard 2: ['charlie@example.com', 'alice@example.com']
```

Steps:
1. Collect all values: 
   ['alice@example.com', 'bob@example.com', 'alice@example.com', 'charlie@example.com', 'alice@example.com']
2. Remove duplicates:
   Set: {'alice@example.com', 'bob@example.com', 'charlie@example.com'}
3. Return unique values

Scenario 4: ORDER BY Across Shards

Query: "SELECT id, name FROM users ORDER BY name DESC LIMIT 5"

Results from shards (unordered):
```
Shard 1: [(101, 'Alice'), (103, 'Bob')]
Shard 2: [(102, 'Charlie'), (105, 'David')]
Shard 3: [(104, 'Eve'), (106, 'Frank')]
```

Steps:
1. Collect all rows
2. Sort by 'name' DESC:
   [(106, 'Frank'), (104, 'Eve'), (102, 'Charlie'), (105, 'David'), (103, 'Bob'), (101, 'Alice')]
3. Apply LIMIT 5:
   [(106, 'Frank'), (104, 'Eve'), (102, 'Charlie'), (105, 'David'), (103, 'Bob')]

Error Scenarios:
- Aggregation function unsupported → Return error
- Column type mismatch in aggregation → Return error
- Too many rows to aggregate → Return error (set limit on size)
```

---

## 5. API Contract Specifications

### 5.1 Query Endpoint

**POST /api/v1/databases/{database_id}/query**
- **Purpose**: Execute SQL query
- **Authentication**: User token validation
- **Request Body**:
  ```
  {
    query: string (SQL)
    explain: boolean (optional, return execution plan only)
  }
  ```
- **Response (200)**:
  ```
  {
    query: string
    execution_time_ms: number
    rows_returned: number
    shards_queried: number
    shards_failed: number
    columns: [
      {name: string, type: string}
    ]
    data: any[][]
  }
  ```
- **Error Responses**:
  - 400: SQL syntax error
  - 403: User doesn't own database
  - 504: Query timeout

### 5.2 Query Explain Endpoint

**POST /api/v1/databases/{database_id}/query-explain**
- **Purpose**: Show query execution plan without executing
- **Response (200)**:
  ```
  {
    query: string
    shards_affected: number[]
    shards_queried: number
    estimated_rows: number
    rewritten_queries: [{shard_id, sql}]
    aggregation_needed: boolean
  }
  ```

### 5.3 Schema Endpoint

**GET /api/v1/databases/{database_id}/schema**
- **Purpose**: Get database schema
- **Response (200)**:
  ```
  {
    tables: [
      {
        name: string
        columns: [{name, type, nullable}]
      }
    ]
  }
  ```

---

## 6. Caching Strategy

```
Query Plan Cache:
- Key: SHA-256(sql_query)
- TTL: 1 hour
- Size limit: 10,000 plans
- Eviction: LRU

Schema Cache:
- Key: database_id
- TTL: 24 hours (refresh on schema change)
- Size limit: 1,000 schemas
- Eviction: LRU

Shard Location Cache:
- Key: database_id:shard_id
- TTL: 1 hour
- Refresh: On health check
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```
Test Files:

1. parser/sqlParser.test.ts
   - Test SELECT parsing
   - Test WHERE clause parsing
   - Test JOINs
   - Test aggregations
   - Test GROUP BY/ORDER BY

2. sharding/shardIdentifier.test.ts
   - Test hash sharding
   - Test range sharding
   - Test directory sharding
   - Test multi-table sharding

3. rewriting/queryRewriter.test.ts
   - Test query rewriting
   - Test WHERE clause rewriting
   - Test table name replacement

4. aggregation/resultAggregator.test.ts
   - Test GROUP BY aggregation
   - Test DISTINCT
   - Test ORDER BY
   - Test LIMIT

Coverage: 80%
```

### 7.2 Integration Tests

```
Scenarios:

1. Simple SELECT with shard filtering
2. Multi-shard aggregation
3. JOIN across shards
4. DISTINCT across shards
5. ORDER BY across shards
6. Large result set streaming
7. Query with shard failure (fallback to replica)
8. Complex query with multiple conditions

Coverage: 60%
```

---

## 8. Performance Targets

- **Query parsing**: < 10ms
- **Shard identification**: < 5ms
- **Query rewriting**: < 5ms
- **Parallel execution**: < 30s per shard
- **Result aggregation**: < 100ms
- **Total latency**: < 200ms (for typical query)
- **Max result size**: 1GB (streamed)

---

## 9. Key Open Questions

1. **Q**: Should we cache query results or only query plans?
   - Current assumption: Only cache plans (safer for data consistency)
   - **Answer needed**: _______________

2. **Q**: How should we handle cross-shard JOINs?
   - Current assumption: Fetch from both shards, join in application
   - **Answer needed**: _______________

3. **Q**: Should we support stored procedures/functions?
   - Current assumption: Not in MVP
   - **Answer needed**: _______________

4. **Q**: How should transactions work across shards?
   - Current assumption: Not supported in MVP (eventually consistent only)
   - **Answer needed**: _______________

5. **Q**: What's the maximum number of rows we should buffer in memory?
   - Current assumption: 10,000 rows
   - **Answer needed**: _______________

---

**Document Version**: 1.0  
**Created**: January 14, 2026  
**Status**: Ready for Review & Question Resolution
