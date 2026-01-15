# Automator67: All Open Questions (41 Total)

**Project**: Automator67 - Distributed Cloud Orchestration Platform  
**Status**: User Answers Captured (41/41)  
**Total Questions**: 41 across 6 specifications  
**Date**: January 14, 2026

> Note: Answers are recorded below for reference and have been applied to the specs. Use this file as historical context, not as a request for further input.

---

## How to Provide Answers

For each question below, provide one of:

1. **Simple Answer**: Yes/No/Number
   ```
   Q1: Answer
   ```

2. **Specific Guidance**: Implementation details
   ```
   Q4: Answer with additional context if needed
   ```

3. **Defer to Default**: Use the current assumption
   ```
   Q8: Use default
   ```

---

## SPEC-01: Frontend Dashboard Questions (15 Total)

### Authentication & Security (3 Questions)

**Q1**: Should dashboard support OAuth login (Google, GitHub) or only email/password?
- **Current Assumption**: Both OAuth and email/password supported
- **Impact**: Authentication system design, third-party integrations
- **Your Answer**: yes, I think oauth & oauth only can be added either way this is going to run local which means one user but yeah it's good to have multiple users as which might help user to utilize multiple setups in their name. 

**Q2**: How should refresh token rotation be handled?
- **Current Assumption**: Automatic rotation every 7 days
- **Impact**: Token management, security posture
- **Your Answer**: use Default

**Q3**: Should master password be stored anywhere (even hashed)?
- **Current Assumption**: No - zero-knowledge model, never store even hashed
- **Impact**: Password reset flow, account recovery
- **Your Answer**: refer Q1,

### Deployment & Scaling (3 Questions)

**Q4**: Should users deploy from Git repositories directly?
- **Current Assumption**: Yes, support GitHub, GitLab, Gitea
- **Impact**: Dashboard features, integration complexity
- **Your Answer**: yes we get code from scm

**Q5**: Should deployment history/versioning be supported?
- **Current Assumption**: Yes, keep last 10 versions
- **Impact**: Storage requirements, UI complexity
- **Your Answer**: yes but keep it as backlog for now, let's add it later

**Q6**: Should rollback be automatic or manual?
- **Current Assumption**: Manual rollback to previous version
- **Impact**: Deployment workflow, safety mechanisms
- **Your Answer**: yes but keep it as backlog for now, let's add it later


Also keep a table where what are all implemented now and what are all backlogs. for better tracking.

### Metrics & Monitoring (3 Questions)

**Q7**: Should metrics update via WebSocket or polling?
- **Current Assumption**: WebSocket for real-time, polling fallback for browsers that don't support it
- **Impact**: Performance, browser compatibility
- **Your Answer**: yes;

**Q8**: How far back should historical metrics be retained?
- **Current Assumption**: 7 days in dashboard cache, unlimited in controller
- **Impact**: Storage, performance, UI responsiveness
- **Your Answer**: yes;

**Q9**: Should dashboard support setting up alerts/notifications?
- **Current Assumption**: Yes, email + webhook alerts
- **Impact**: Feature scope, integration complexity
- **Your Answer**: yes;

### Database Interface (3 Questions)

**Q10**: Should dashboard support saved queries/templates?
- **Current Assumption**: Yes, users can save and reuse queries
- **Impact**: Database schema, UI features
- **Your Answer**: yes;

**Q11**: Should query results be paginated or show all?
- **Current Assumption**: Paginated (100 rows per page)
- **Impact**: Performance, UX complexity
- **Your Answer**: yes;

**Q12**: Should dashboard support data export (CSV, JSON)?
- **Current Assumption**: Yes, both CSV and JSON formats
- **Impact**: UI features, backend export service
- **Your Answer**: yes;

### UI/UX (3 Questions)

**Q13**: Should dashboard support dark mode?
- **Current Assumption**: Yes, with user preference storage
- **Impact**: CSS/styling, complexity
- **Your Answer**: yes;

**Q14**: Should dashboard be mobile-responsive or desktop-only?
- **Current Assumption**: Mobile-responsive (mobile-first design)
- **Impact**: CSS/layout, component design
- **Your Answer**: yes;

**Q15**: Should we use existing UI component library (shadcn/ui)?
- **Current Assumption**: Yes, shadcn/ui (headless + Tailwind)
- **Impact**: Styling, component library
- **Your Answer**: yes;

---

## SPEC-02: Controller/Orchestrator Questions (5 Total)

### Database & Storage (2 Questions)

**Q16**: Should we use PostgreSQL for primary registry or key-value store?
- **Current Assumption**: PostgreSQL for ACID compliance
- **Impact**: Database choice, consistency model
- **Your Answer**: use default; use whichever is convinent and more effective.

**Q17**: How long should nodes retry failed API calls?
- **Current Assumption**: Exponential backoff up to 5 minutes
- **Impact**: Failure recovery, system resilience
- **Your Answer**: use default;

### Deployment & Transactions (2 Questions)

**Q18**: Should deployment be atomic (all-or-nothing) or best-effort?
- **Current Assumption**: Best-effort (partial deployments allowed)
- **Impact**: Complexity, reliability guarantees
- **Your Answer**: both are allowed (user can choose which one they are going with)

**Q19**: How many times should we retry a failed query before failing?
- **Current Assumption**: 2 retries per shard
- **Impact**: System resilience, latency
- **Your Answer**: yes;

### Database Federation (1 Question)

**Q20**: Should we support transaction support across shards?
- **Current Assumption**: Not in MVP (eventually consistent only)
- **Impact**: Complexity, consistency model
- **Your Answer**: yes;

---

## SPEC-03: Node Wrapper Questions (6 Total)

### Deployment & Updates (2 Questions)

**Q21**: Should node support deploying from Docker image registries or always from tarball?
- **Current Assumption**: Always from tarball (simpler, more secure)
- **Impact**: Deployment workflow, complexity
- **Your Answer**: either way is fine. choose the one which has lesser dependency & more convinent without breaking anything and scalable

**Q22**: Should node support live code updates or always require restart?
- **Current Assumption**: Always requires restart (safer)
- **Impact**: Deployment strategy, downtime
- **Your Answer**: both - user can choose

### Storage & Logging (2 Questions)

**Q23**: How should logs be persisted if disk fills up?
- **Current Assumption**: Circular buffer with FIFO eviction (last 10MB per app)
- **Impact**: Log retention, debugging capability
- **Your Answer**: yes

**Q24**: How long should we keep historical logs/metrics?
- **Current Assumption**: 7 days local, unlimited in controller
- **Impact**: Storage, debugging capability
- **Your Answer**: yes - if possible store the logs in local if user wishes to pull them or auto google drive metrics and log storing mechanism.

### Capacity & Credentials (2 Questions)

**Q25**: How many concurrent applications per node before we reject deployments?
- **Current Assumption**: 10 applications max per node
- **Impact**: Scaling limits, resource management
- **Your Answer**: auto calculate based on the node as not all the nodes are same right.

**Q26**: Should credential rotation be automatic or manual?
- **Current Assumption**: Automatic every 30 days
- **Impact**: Security posture, maintenance
- **Your Answer**: use default;

---

## SPEC-04: Database Router Questions (5 Total)

### Caching & Performance (1 Question)

**Q27**: Should we cache query results or only query plans?
- **Current Assumption**: Only cache plans (safer for data consistency)
- **Impact**: Query performance, data freshness
- **Your Answer**: use default;

### JOINs & Transactions (2 Questions)

**Q28**: How should we handle cross-shard JOINs?
- **Current Assumption**: Fetch from both shards, join in application
- **Impact**: Performance, complexity
- **Your Answer**: use default;

**Q29**: How should transactions work across shards?
- **Current Assumption**: Not supported in MVP (eventually consistent only)
- **Impact**: Complexity, consistency guarantees
- **Your Answer**: use default; - see what can be done to support transaction work across shards.

### Features & Limits (2 Questions)

**Q30**: Should we support stored procedures/functions?
- **Current Assumption**: Not in MVP (pure SQL only)
- **Impact**: Feature scope, complexity
- **Your Answer**: yes - backlog 

**Q31**: What's the maximum number of rows we should buffer in memory?
- **Current Assumption**: 10,000 rows (then stream remaining)
- **Impact**: Memory usage, large result handling
- **Your Answer**: how much the db nodes support.

---

## SPEC-05: Storage Manager Questions (5 Total)

### File Management (2 Questions)

**Q32**: Should we support file versioning in MVP?
- **Current Assumption**: No, simple overwrite only
- **Impact**: Storage, complexity
- **Your Answer**: yes - backlog & user choice.

**Q33**: Should we support sharing files with other users?
- **Current Assumption**: Public links only (no direct sharing)
- **Impact**: Feature scope, access control
- **Your Answer**: yes.

### Replication & Retention (2 Questions)

**Q34**: What should be the default replication factor?
- **Current Assumption**: 2 (balance between redundancy and cost)
- **Impact**: Availability, storage cost
- **Your Answer**: yes

**Q35**: How long should we keep deleted files before permanent deletion?
- **Current Assumption**: 30 days (allows recovery)
- **Impact**: Storage, compliance
- **Your Answer**: no deletion required as it's users node and they'll decide when to store or delete things , but try to have a simple way for users to access the files they have and choose to add or delete the files.

### Limits (1 Question)

**Q36**: What's the max file size we should support?
- **Current Assumption**: 10GB
- **Impact**: Infrastructure limits, user experience
- **Your Answer**: again based on user provided nodes

---

## SPEC-06: Health Monitor & Auto-Recovery Questions (5 Total)

### Circuit Breaker (1 Question)

**Q37**: Should circuit breaker be per-node or per-endpoint?
- **Current Assumption**: Per-node (simpler, better for node failures)
- **Impact**: System resilience, complexity
- **Your Answer**: use default;

### Recovery Strategy (1 Question)

**Q38**: What recovery strategy is default (auto-restart, migrate, manual)?
- **Current Assumption**: Migrate (safer than restart)
- **Impact**: Automation level, manual intervention
- **Your Answer**: use default;

### Failure Thresholds (1 Question)

**Q39**: How many consecutive failures before marking node unavailable?
- **Current Assumption**: 6 (3 minutes at 30s interval)
- **Impact**: Failure detection speed, false positives
- **Your Answer**: use default;

### External Integration (1 Question)

**Q40**: Should we support alerting to external services (PagerDuty, Datadog)?
- **Current Assumption**: Not in MVP (email + webhook only)
- **Impact**: Integration complexity, alerting ecosystem
- **Your Answer**: yes

### Alert Frequency (1 Question)

**Q41**: What's the maximum alert frequency to avoid spam?
- **Current Assumption**: One alert per hour per issue
- **Impact**: Operational noise, alert fatigue
- **Your Answer**: yes;

---

## Summary by Category

### Authentication & Security (8 Questions)
- Q1, Q2, Q3 (Frontend)
- Q16, Q17 (Controller)
- Q21, Q22, Q26 (Node Wrapper)

### Deployment & Scaling (8 Questions)
- Q4, Q5, Q6 (Frontend)
- Q18, Q19, Q25 (Node Wrapper/Controller)
- Q38, Q39 (Health Monitor)

### Data Management (8 Questions)
- Q10, Q11, Q12 (Frontend)
- Q20, Q28, Q29 (Database Router)
- Q32, Q35 (Storage Manager)

### Performance & Optimization (8 Questions)
- Q7, Q8, Q9 (Frontend)
- Q27, Q31 (Database Router)
- Q23, Q24, Q34 (Storage/Logging)

### Feature Scope & Boundaries (9 Questions)
- Q13, Q14, Q15 (Frontend)
- Q30, Q33, Q36 (Features)
- Q37, Q40, Q41 (System Design)

---

## Next Steps

1. **Review** each specification file (SPEC-01 through SPEC-06)
2. **Answer** the corresponding questions above
3. **Provide answers** in the format shown
4. **Return answers** so we can:
   - Refine specifications based on your guidance
   - Create remaining specs (SPEC-07, SPEC-08) with clarity
   - Consolidate into master specification document
   - Begin development with zero assumptions

---

## File References

Each question in this document corresponds to a specific section in the specification files:

- **SPEC-01-FRONTEND-DASHBOARD.md**: Questions Q1-Q15 (Section 9: "Key Open Questions")
- **SPEC-02-CONTROLLER.md**: Questions Q16-Q20 (Section 9: "Key Open Questions")
- **SPEC-03-NODE-WRAPPER.md**: Questions Q21-Q26 (Section 10: "Key Open Questions")
- **SPEC-04-DATABASE-ROUTER.md**: Questions Q27-Q31 (Section 9: "Key Open Questions")
- **SPEC-05-STORAGE-MANAGER.md**: Questions Q32-Q36 (Section 8: "Key Open Questions")
- **SPEC-06-HEALTH-MONITOR.md**: Questions Q37-Q41 (Section 9: "Key Open Questions")

---

**Document Version**: 1.0  
**Created**: January 14, 2026  
**Status**: Awaiting User Answers
