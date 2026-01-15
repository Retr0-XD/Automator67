# Specification: Storage Manager Service

**Component**: Distributed file storage and replication  
**Language**: Node.js + TypeScript  
**Version**: 1.0  
**Status**: Specification - Ready for Review

---

## 1. Component Purpose

The Storage Manager is responsible for:
- Managing file uploads/downloads from users
- Distributing files across multiple cloud providers
- Handling file replication and redundancy
- Managing file chunks and reassembly
- Providing transparent failover if providers fail
- Garbage collection of unused files
- Encryption for data privacy
- Monitoring storage quota per user

### Key Principle
**Files are transparently distributed** - Users upload once, files automatically replicate across multiple providers for redundancy and geographic distribution.

---

## 2. Responsibilities & Boundaries

### ✅ Storage Manager IS Responsible For:
1. **File Upload Management**
   - Receiving file uploads from dashboard
   - Chunking large files
   - Calculating checksums
   - Storing metadata

2. **Distributed Storage**
   - Distributing chunks across nodes
   - Managing which node has which chunk
   - Handling node failures
   - Replicating for redundancy

3. **File Download**
   - Reassembling chunks on demand
   - Streaming to users
   - Handling incomplete downloads
   - Cache optimization

4. **Replication Management**
   - Deciding replication factor
   - Tracking replica status
   - Detecting failed replicas
   - Re-replicating when needed

5. **Encryption**
   - Encrypting files at rest
   - Key management
   - Per-file encryption keys

6. **Garbage Collection**
   - Tracking file usage
   - Deleting unused files
   - Reclaiming storage space
   - Quota enforcement

### ❌ Storage Manager IS NOT Responsible For:
- File format validation (client responsibility)
- Virus/malware scanning (user responsibility)
- Access control (handled by controller)
- File version control (not in MVP)
- Backup/archival (handled by providers)

---

## 3. Data Models

### 3.1 File Metadata Model

```
FileMetadata {
  id: UUID (primary key)
  user_id: UUID (foreign key to users)
  path: string (e.g., "/documents/project/file.pdf")
  filename: string
  size_bytes: number
  mime_type: string (e.g., "application/pdf")
  
  checksum: string (SHA-256 of entire file)
  created_at: timestamp
  modified_at: timestamp
  last_accessed: timestamp
  accessed_count: number
  
  encryption: {
    algorithm: string (AES-256-GCM)
    key_id: UUID (for key rotation)
    iv: string (hex-encoded)
    aad: string (additional authenticated data)
  }
  
  status: string enum (uploading, ready, failed, deleted)
  
  tags: string[] (user-defined tags for organization)
  is_public: boolean (shareable link exists)
  public_link_token: string (null if not public)
}

Storage: PostgreSQL
  Table: file_metadata
  Indices:
    - PRIMARY KEY (id)
    - UNIQUE (user_id, path)
    - INDEX (user_id)
    - INDEX (status)
    - INDEX (created_at)
    - INDEX (last_accessed)
```

### 3.2 File Chunk Model

```
FileChunk {
  id: UUID (primary key)
  file_id: UUID (foreign key to FileMetadata)
  chunk_index: number (0, 1, 2, ...)
  
  size_bytes: number (chunk size, typically 5MB)
  checksum: string (SHA-256 of chunk)
  
  distribution: [
    {
      node_id: UUID
      provider: string (render, railway, fly.io, etc.)
      storage_path: string (provider-specific path)
      status: string enum (uploaded, verified, failed, deleted)
      uploaded_at: timestamp
      last_verified: timestamp
    }
  ]
  
  replication_factor: number (how many nodes have this chunk)
  required_replication: number (minimum copies needed)
  
  created_at: timestamp
}

Storage: PostgreSQL
  Table: file_chunks
  Indices:
    - PRIMARY KEY (id)
    - INDEX (file_id, chunk_index)
    - INDEX (node_id) for location lookup
```

### 3.3 Storage Quota Model

```
StorageQuota {
  user_id: UUID (primary key, foreign key to users)
  
  limits: {
    storage_limit_gb: number
    max_file_size_gb: number
    max_files: number
    replication_factor: number (default 2)
  }
  
  current: {
    storage_used_gb: number
    file_count: number
    chunk_count: number
    bandwidth_used_gb_this_month: number
  }
  
  billing: {
    tier: string enum (free, pro, enterprise)
    plan_start: timestamp
    plan_end: timestamp
    auto_renewal: boolean
  }
  
  last_updated: timestamp
}

Storage: PostgreSQL
  Table: storage_quotas
  Indices:
    - PRIMARY KEY (user_id)
    - INDEX (tier)
```

### 3.4 Transfer Status Model

```
TransferStatus {
  transfer_id: UUID
  file_id: UUID
  user_id: UUID
  
  transfer_type: string enum (upload, download)
  status: string enum (pending, in_progress, paused, completed, failed)
  
  started_at: timestamp
  completed_at: timestamp | null
  
  progress: {
    total_bytes: number
    transferred_bytes: number
    percent_complete: number
    chunks_total: number
    chunks_completed: number
  }
  
  speed: {
    bytes_per_second: number (current)
    estimated_time_remaining_seconds: number
  }
  
  error: {
    error_message: string | null
    failed_chunks: number[]
    retry_count: number
  }
}

Storage: In-memory + Redis
  Key: transfer:{transfer_id}
  TTL: Until completion or 24 hours (whichever first)
```

---

## 4. Core Processes & Flows

### 4.1 File Upload Flow

```
Sequence: Browser Upload → Chunk → Encrypt → Distribute → Replicate → Verify

1. User initiates upload:
   POST /api/v1/files/upload-init
   Body: {
     filename: string
     size_bytes: number
     mime_type: string
   }
   
   Response: {
     upload_id: UUID
     chunk_size: number (5MB)
     total_chunks: number
     encryption_key: {key_id, iv, aad}
   }

2. Browser calculates chunks:
   - Split file into 5MB chunks
   - Calculate SHA-256 for each chunk
   - Prepare chunk data

3. Browser uploads chunks in parallel:
   FOR EACH chunk IN parallel:
     a) Encrypt chunk (AES-256-GCM)
     b) Send to controller:
        POST /api/v1/files/{upload_id}/chunks/{chunk_index}
        Body: encrypted_chunk_data
        Headers: X-Checksum: {sha256}
     
     c) Controller receives chunk:
        - Verify checksum
        - Select N nodes for replication
        - Upload to all nodes in parallel
        - Wait for all uploads to complete
        - Respond with success/failure

4. Controller selects replica nodes:
   a) Get all healthy nodes available to user
   b) Run load balancer algorithm
   c) Select N nodes (default 2)
   d) Ensure geographic distribution
   e) Verify each node has disk space

5. Upload to nodes in parallel:
   FOR EACH selected_node IN parallel:
     a) POST /node/{node_id}/api/store-chunk
        Body: {
          file_id, chunk_index,
          encrypted_data,
          checksum
        }
     b) Node verifies checksum
     c) Node stores locally
     d) Node responds with status

6. Verify replication:
   a) Confirm all replicas received chunk
   b) If node failed:
      - Select alternate node
      - Retry upload
   c) Verify checksums on all replicas
   d) Mark chunk status as 'uploaded'

7. Finalize upload:
   POST /api/v1/files/{upload_id}/complete
   Body: {
     filename,
     path,
     total_checksum
   }
   
   Controller:
     a) Verify all chunks received
     b) Create FileMetadata record
     c) Create FileChunk records
     d) Update user quota
     e) Mark status as 'ready'
     f) Return file URL

8. Return to user:
   {
     file_id: UUID
     status: 'ready'
     url: 'https://automator67.io/files/{file_id}'
   }

Error Scenarios:
- Chunk checksum mismatch → Retry upload
- All replica nodes fail → Select alternate nodes, retry
- User quota exceeded → Return 403 Insufficient Storage
- File too large → Return 400 File Too Large
- Timeout during upload → Allow resume from checkpoint
```

### 4.2 File Download Flow

```
Sequence: User Request → Find Chunks → Fetch → Decrypt → Stream

1. User requests download:
   GET /api/v1/files/{file_id}
   
   Controller:
     a) Verify user owns file
     b) Verify file exists and status = 'ready'
     c) If not authorized: Return 403 Forbidden
     d) If not found: Return 404 Not Found
     e) If not ready: Return 503 Still Uploading

2. Lookup file chunks:
   SELECT * FROM file_chunks WHERE file_id = {file_id}
   ORDER BY chunk_index
   
   Result: List of chunks and their replica locations

3. Select optimal chunk sources:
   FOR EACH chunk:
     a) Get list of healthy replicas
     b) Select closest replica (lowest latency)
     c) If no healthy replicas:
        - Mark chunk as degraded
        - Use any available replica

4. Fetch chunks in parallel:
   FOR EACH chunk IN parallel:
     a) Request from selected node:
        GET /node/{node_id}/api/chunks/{chunk_id}
     
     b) Stream chunk data to browser
     c) Verify checksum
     d) Decrypt chunk (using keys from metadata)

5. Reassemble file:
   a) As chunks arrive, concatenate
   b) Maintain chunk order
   c) Decrypt and stream to user

6. Return file:
   - Content-Type: {mime_type}
   - Content-Length: {size_bytes}
   - Content-Disposition: attachment; filename={filename}
   - Stream encrypted chunks, decrypted in-transit

7. Update access statistics:
   a) Increment accessed_count
   b) Update last_accessed timestamp
   c) Add to download tracking

Error Scenarios:
- File not found → 404 Not Found
- User unauthorized → 403 Forbidden
- All replicas unavailable → 503 Service Unavailable
- Chunk corrupted → Retry from different replica
- Timeout during download → Allow resume from checkpoint
```

### 4.3 Replication Management Flow

```
Continuous Process: Monitor Replicas → Repair Degraded → Rebalance

1. Health checker monitors all nodes:
   Every 1 hour:
     FOR EACH node:
       a) Request chunk status
       b) Verify chunk checksums
       c) Check replication factor
       d) Mark failures

2. Identify degraded chunks:
   FOR EACH file_chunk WHERE replication_factor < required_replication:
     a) Chunk is under-replicated
     b) Add to repair queue
     c) Priority: Recently accessed files first

3. Repair degraded chunks:
   FOR EACH degraded_chunk IN repair_queue:
     a) Select healthy replica as source
     b) Select new node as destination
     c) Replicate chunk:
        - Copy from source to destination
        - Verify checksum
        - Update distribution list
        - Increment replication_factor
     d) Mark as completed

4. Detect failed nodes:
   IF node becomes unavailable:
     a) Mark all its chunks as needing replication
     b) Add to high-priority repair queue
     c) Replicate all chunks from this node

5. Rebalance storage:
   IF node is overloaded:
     a) Identify least-accessed chunks
     b) Move to less-loaded nodes
     c) Maintain replication factor
     d) Update distribution list

Error Scenarios:
- Repair node fails → Mark chunk still degraded, retry later
- Source becomes unavailable → Use different source
- No capacity on nodes → Return error, alert admin
```

### 4.4 Garbage Collection Flow

```
Continuous Process: Daily

1. Identify deletable files:
   SELECT * FROM file_metadata
   WHERE status = 'deleted'
   AND deleted_at < now() - 30 days
   
   (Keep deleted files for 30 days for recovery)

2. For each deletable file:
   a) Get all chunks: SELECT * FROM file_chunks WHERE file_id = {id}
   b) Delete all chunks from all nodes:
      FOR EACH chunk:
        FOR EACH replica_node:
          DELETE /node/{node_id}/api/chunks/{chunk_id}
   
   c) Delete metadata:
      DELETE FROM file_chunks WHERE file_id = {id}
      DELETE FROM file_metadata WHERE id = {id}
   
   d) Update user quota:
      quota.storage_used_gb -= file.size_bytes

3. Clean up unused files:
   SELECT * FROM file_metadata
   WHERE last_accessed < now() - 180 days
   AND accessed_count = 0
   
   (Archive or suggest deletion to user)

4. Reclaim orphaned storage:
   FOR EACH node:
     a) List all stored chunks
     b) Verify each chunk is in metadata
     c) Delete orphaned chunks
     d) Log cleanup

Error Scenarios:
- Node unavailable during deletion → Log for later retry
- Deletion fails on one node → Retry with different node
```

---

## 5. API Contract Specifications

### 5.1 Upload Endpoints

**POST /api/v1/files/upload-init**
- **Purpose**: Initialize file upload
- **Request Body**:
  ```
  {
    filename: string
    size_bytes: number
    mime_type: string
  }
  ```
- **Response (200)**:
  ```
  {
    upload_id: UUID
    chunk_size: number
    total_chunks: number
    encryption_key: {key_id, iv, aad}
  }
  ```

**POST /api/v1/files/{upload_id}/chunks/{chunk_index}**
- **Purpose**: Upload file chunk
- **Request**: Multipart with encrypted data
- **Response (200)**:
  ```
  {
    chunk_index: number
    status: 'received'
  }
  ```

**POST /api/v1/files/{upload_id}/complete**
- **Purpose**: Complete upload
- **Request Body**:
  ```
  {
    filename: string
    path: string
    total_checksum: string
  }
  ```
- **Response (200)**:
  ```
  {
    file_id: UUID
    status: 'ready'
    url: string
  }
  ```

### 5.2 Download Endpoints

**GET /api/v1/files/{file_id}**
- **Purpose**: Download file
- **Response (200)**: File binary stream

**GET /api/v1/files/{file_id}/metadata**
- **Purpose**: Get file metadata without downloading
- **Response (200)**:
  ```
  {
    filename: string
    size_bytes: number
    mime_type: string
    created_at: timestamp
    accessed_count: number
  }
  ```

### 5.3 Management Endpoints

**DELETE /api/v1/files/{file_id}**
- **Purpose**: Delete file
- **Response (204)**: No content

**GET /api/v1/storage/quota**
- **Purpose**: Get storage quota info
- **Response (200)**:
  ```
  {
    limit_gb: number
    used_gb: number
    percent_used: number
    file_count: number
  }
  ```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```
Test Files:

1. upload/uploadManager.test.ts
   - Test chunk splitting
   - Test checksum calculation
   - Test quota enforcement

2. replication/replicationManager.test.ts
   - Test replica selection
   - Test replication status tracking
   - Test repair workflow

3. download/downloadManager.test.ts
   - Test chunk retrieval
   - Test reassembly
   - Test checksum verification

4. gc/garbageCollector.test.ts
   - Test deletion identification
   - Test orphan detection
   - Test quota updates

Coverage: 80%
```

### 6.2 Integration Tests

```
Scenarios:

1. Upload large file (>100MB)
2. Download and verify checksum
3. Simulate node failure during replication
4. Repair degraded chunk
5. Parallel uploads and downloads
6. Garbage collection

Coverage: 60%
```

---

## 7. Performance Targets

- **Chunk upload**: < 10 seconds for 5MB chunk
- **Chunk download**: < 10 seconds for 5MB chunk
- **Parallel chunk transfers**: 3-5 concurrent
- **Replication**: Auto-complete within 1 hour
- **Garbage collection**: < 1GB/minute deletion rate
- **Max file size**: 10GB
- **Default replication factor**: 2

---

## 8. Key Open Questions

1. **Q**: Should we support file versioning in MVP?
   - Current assumption: No, simple overwrite
   - **Answer needed**: _______________

2. **Q**: What should be the default replication factor?
   - Current assumption: 2 (balance between redundancy and cost)
   - **Answer needed**: _______________

3. **Q**: How long should we keep deleted files before permanent deletion?
   - Current assumption: 30 days
   - **Answer needed**: _______________

4. **Q**: Should we support sharing files with other users?
   - Current assumption: Public links only (no direct sharing)
   - **Answer needed**: _______________

5. **Q**: What's the max file size we should support?
   - Current assumption: 10GB
   - **Answer needed**: _______________

---

**Document Version**: 1.0  
**Created**: January 14, 2026  
**Status**: Ready for Review & Question Resolution
