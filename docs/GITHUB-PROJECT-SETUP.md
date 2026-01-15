# GitHub Project Setup Guide for Automator67

This guide shows how to create and organize a GitHub Project board to track all 109 development tasks.

---

## Current Status

✅ **109 issues created** (all granular tasks from SPEC-01 through SPEC-06)  
✅ **6 milestones created** (M1: Frontend MVP, M2: Controller Core, M3: Node Wrapper, M4: DB Router, M5: Storage Manager, M6: Health & Hardening)  
✅ **13 labels created** (area:frontend, area:controller, area:node, area:db, area:storage, area:health, type:feature, type:infra, type:tests, type:docs, prio:high, prio:med)  
❌ **GitHub Project board** (needs manual setup - see below)

---

## Step 1: Create Project Board

1. Go to: https://github.com/Retr0-XD/Automator67/projects
2. Click **"New project"**
3. Choose **"Board"** template
4. Project name: **Automator67 Development**
5. Click **"Create project"**

---

## Step 2: Configure Project Views

### View 1: Roadmap (Timeline View)

**Purpose**: See all milestones in a timeline

- Click **"+ New view"** → **"Roadmap"**
- Name: **"Timeline"**
- Group by: **Milestone**
- Date field: Create a custom field "Due Date" and set:
  - M1: Week 1-2 (Jan 15 - Jan 29)
  - M2: Week 3-4 (Jan 30 - Feb 12)
  - M3: Week 5-6 (Feb 13 - Feb 26)
  - M4: Week 7-8 (Feb 27 - Mar 12)
  - M5: Week 9-10 (Mar 13 - Mar 26)
  - M6: Week 11-12 (Mar 27 - Apr 9)

**Expected Result**:
```
M1: Frontend MVP    [████████████] 37 tasks
M2: Controller Core [██████]       18 tasks
M3: Node Wrapper    [████]          9 tasks
M4: DB Router       [███]           6 tasks
M5: Storage Manager [██]            5 tasks
M6: Health Monitor  [███]           6 tasks
```

### View 2: Kanban Board (By Status)

**Purpose**: Track task progress

- Click **"+ New view"** → **"Board"**
- Name: **"Board"**
- Group by: **Status** (create custom field - see Step 3)
- Columns:
  - 📋 **Todo** (default)
  - 🚧 **In Progress**
  - 👀 **In Review**
  - ✅ **Done**
  - 🚫 **Blocked**

### View 3: By Area (Component View)

**Purpose**: See tasks organized by component

- Click **"+ New view"** → **"Board"**
- Name: **"By Component"**
- Group by: **Labels**
- Filter: Show only `area:*` labels
- Columns will auto-create:
  - Frontend (37 tasks)
  - Controller (18 tasks)
  - Node (9 tasks)
  - DB (6 tasks)
  - Storage (5 tasks)
  - Health (6 tasks)

### View 4: High Priority (Table)

**Purpose**: Focus on high-priority work

- Click **"+ New view"** → **"Table"**
- Name: **"High Priority"**
- Filter: `label:prio:high`
- Sort by: Milestone (ascending)
- Columns: Title, Milestone, Assignee, Status

---

## Step 3: Add Custom Fields

Click **"⚙️ Settings"** → **"Custom fields"** → **"+ New field"**

### Field 1: Status (Single Select)

- **Name**: Status
- **Type**: Single select
- **Options**:
  - 📋 Todo (default, gray)
  - 🚧 In Progress (yellow)
  - 👀 In Review (blue)
  - ✅ Done (green)
  - 🚫 Blocked (red)

### Field 2: Effort (Number)

- **Name**: Effort
- **Type**: Number
- **Description**: Days to complete
- **Values**:
  - 1 = 1 day (small task)
  - 2 = 2 days (medium task)
  - 3 = 3 days (large task)
  - 5 = 1 week (epic)
  - 8 = 2 weeks (major feature)

### Field 3: Sprint (Iteration)

- **Name**: Sprint
- **Type**: Iteration
- **Duration**: 1 week
- **Iterations**: 12 (Sprint 1 through Sprint 12)
- **Start date**: January 15, 2026

---

## Step 4: Add All Issues to Project

### Option A: Manual (Reliable but Slow)

For each issue (#1 - #109):
1. Open issue: `https://github.com/Retr0-XD/Automator67/issues/{number}`
2. Right sidebar → **"Projects"**
3. Select **"Automator67 Development"**
4. Set **Status** = "Todo"
5. Set **Sprint** based on milestone (see mapping below)
6. Set **Effort** based on task type (see guidelines below)

### Option B: CLI (Fast but Requires Token Upgrade)

```bash
# Step 1: Upgrade token with project scope
gh auth refresh -s project

# Step 2: Get project ID
PROJECT_ID=$(gh project list --owner Retr0-XD --format json | jq -r '.[] | select(.title=="Automator67 Development") | .id')

# Step 3: Add all issues
gh issue list -R Retr0-XD/Automator67 --state open --limit 200 --json number --jq '.[].number' | while read issue; do
  echo "Adding issue #$issue..."
  gh project item-add $PROJECT_ID --owner Retr0-XD --url https://github.com/Retr0-XD/Automator67/issues/$issue
done
```

---

## Step 5: Organize Issues by Milestone

### M1: Frontend MVP (37 tasks, Issues #32-62, #107-109)

**Sprint Assignment**: Sprint 1-2  
**Expected Duration**: 2 weeks (Jan 15 - Jan 29)

**Effort Mapping**:
- Project setup tasks (1.1.x): 1 day each
- Auth tasks (1.2.x): 2 days each
- Layout tasks (1.3.x): 2 days each
- Nodes UI tasks (1.4.x): 3 days each
- Dashboard tasks (1.5.x): 2 days each
- Testing tasks (1.6.x): 3-5 days each

### M2: Controller Core (18 tasks, Issues #63-81)

**Sprint Assignment**: Sprint 3-4  
**Expected Duration**: 2 weeks (Jan 30 - Feb 12)

**Effort Mapping**:
- Auth endpoint tasks (2.1.x): 2 days each
- OAuth callback tasks (2.2.x): 3 days each
- Node registry tasks (2.3.x): 2 days each
- Deployment tasks (2.4.x): 3 days each
- Metrics tasks (2.5.x): 2 days each
- Testing tasks (2.6.x): 3 days each

### M3: Node Wrapper (9 tasks, Issues #82-90)

**Sprint Assignment**: Sprint 5-6  
**Expected Duration**: 2 weeks (Feb 13 - Feb 26)

**Effort Mapping**:
- Deploy tasks (3.1.x): 3 days each
- Health/metrics tasks (3.2.x): 2 days each
- Security tasks (3.3.x): 3 days each

### M4: DB Router (6 tasks, Issues #91-96)

**Sprint Assignment**: Sprint 7-8  
**Expected Duration**: 2 weeks (Feb 27 - Mar 12)

**Effort Mapping**:
- SQL parsing tasks (4.1.x): 3 days each
- Configuration tasks (4.2.x): 2 days each

### M5: Storage Manager (5 tasks, Issues #97-101)

**Sprint Assignment**: Sprint 9-10  
**Expected Duration**: 2 weeks (Mar 13 - Mar 26)

**Effort Mapping**:
- Storage tasks (5.1.x): 3 days each

### M6: Health & Hardening (6 tasks, Issues #102-106)

**Sprint Assignment**: Sprint 11-12  
**Expected Duration**: 2 weeks (Mar 27 - Apr 9)

**Effort Mapping**:
- Circuit breaker tasks (6.1.x): 3 days each
- Alerting tasks (6.2.x): 2 days each

---

## Step 6: Set Up Automation

Click **"⚙️ Settings"** → **"Workflows"** → **"+ New workflow"**

### Automation 1: Auto-move to In Progress

- **Trigger**: Item field changed
- **Condition**: Assignee is set
- **Action**: Set Status = "In Progress"

### Automation 2: Auto-move to In Review

- **Trigger**: Pull request linked
- **Condition**: PR is opened
- **Action**: Set Status = "In Review"

### Automation 3: Auto-move to Done

- **Trigger**: Pull request merged
- **Action**: Set Status = "Done"

### Automation 4: Close issue when Done

- **Trigger**: Status changed to "Done"
- **Action**: Close issue

---

## Step 7: Quick Reference Commands

### View Issues by Milestone

```bash
# M1: Frontend MVP
gh issue list -R Retr0-XD/Automator67 --milestone "M1: Frontend MVP" --state open

# M2: Controller Core
gh issue list -R Retr0-XD/Automator67 --milestone "M2: Controller Core" --state open

# M3: Node Wrapper
gh issue list -R Retr0-XD/Automator67 --milestone "M3: Node Wrapper" --state open
```

### View Issues by Area

```bash
# Frontend tasks
gh issue list -R Retr0-XD/Automator67 --label "area:frontend" --state open

# Controller tasks
gh issue list -R Retr0-XD/Automator67 --label "area:controller" --state open

# Node wrapper tasks
gh issue list -R Retr0-XD/Automator67 --label "area:node" --state open
```

### View Issues by Priority

```bash
# High priority
gh issue list -R Retr0-XD/Automator67 --label "prio:high" --state open

# Medium priority
gh issue list -R Retr0-XD/Automator67 --label "prio:med" --state open
```

### View Issues by Type

```bash
# Feature work
gh issue list -R Retr0-XD/Automator67 --label "type:feature" --state open

# Test tasks
gh issue list -R Retr0-XD/Automator67 --label "type:tests" --state open

# Infrastructure/DevOps
gh issue list -R Retr0-XD/Automator67 --label "type:infra" --state open

# Documentation
gh issue list -R Retr0-XD/Automator67 --label "type:docs" --state open
```

---

## Visual Organization Reference

```
┌─────────────────────────────────────────────────────────────────┐
│              Automator67 Development (Project)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 ROADMAP VIEW (Timeline)                                     │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┬──────┐│
│  │    M1    │    M2    │    M3    │    M4    │   M5   │  M6  ││
│  │  W1-2    │  W3-4    │  W5-6    │  W7-8    │ W9-10  │W11-12││
│  │ Frontend │Controller│   Node   │    DB    │Storage │Health││
│  │ 37 tasks │ 18 tasks │  9 tasks │  6 tasks │5 tasks │6 task││
│  └──────────┴──────────┴──────────┴──────────┴────────┴──────┘│
│                                                                 │
│  📋 BOARD VIEW (Kanban)                                         │
│  ┌─────────┬──────────┬──────────┬──────────┬─────────┐       │
│  │  Todo   │In Progress│In Review │   Done   │ Blocked │       │
│  │   109   │     0     │    0     │    0     │    0    │       │
│  │         │           │          │          │         │       │
│  │  #2-109 │           │          │          │         │       │
│  └─────────┴──────────┴──────────┴──────────┴─────────┘       │
│                                                                 │
│  🎯 BY COMPONENT VIEW (Area)                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐                │
│  │ Frontend │Controller│   Node   │    DB    │                │
│  │    37    │    18    │    9     │    6     │                │
│  │          │          │          │          │                │
│  │ Storage  │  Health  │  Infra   │   Docs   │                │
│  │    5     │    6     │    3     │    3     │                │
│  └──────────┴──────────┴──────────┴──────────┘                │
│                                                                 │
│  ⚡ HIGH PRIORITY VIEW (Table)                                  │
│  ┌────────────────────────────────────────────────────┐        │
│  │ Title                      │ Milestone │ Status    │        │
│  ├────────────────────────────┼───────────┼───────────┤        │
│  │ FE: Project setup          │    M1     │   Todo    │        │
│  │ FE: Auth flows             │    M1     │   Todo    │        │
│  │ FE: Nodes UI               │    M1     │   Todo    │        │
│  │ API: Auth endpoints        │    M2     │   Todo    │        │
│  │ ... (filtered prio:high)   │    ...    │   ...     │        │
│  └────────────────────────────┴───────────┴───────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

Once project is set up, you should see:

- ✅ **109 tasks** visible in project
- ✅ **6 milestones** on roadmap timeline
- ✅ **4 views** configured (Roadmap, Board, By Component, High Priority)
- ✅ **3 custom fields** set (Status, Effort, Sprint)
- ✅ **4 automations** active (auto-move on assign/PR/merge/done)
- ✅ **All tasks** have Status = "Todo"
- ✅ **All tasks** have Sprint assigned (1-12)
- ✅ **All tasks** have Effort estimated (1-8 days)

---

## Next Steps

1. **Create project** following Step 1
2. **Configure views** following Step 2
3. **Add custom fields** following Step 3
4. **Add all 109 issues** following Step 4
5. **Set Sprint + Effort** for each issue following Step 5
6. **Enable automations** following Step 6
7. **Start development** by moving tasks from Todo → In Progress

Once complete, you'll have a production-ready project board to track every single task from specifications through to completion.

---

**Links**:
- Repository: https://github.com/Retr0-XD/Automator67
- Issues: https://github.com/Retr0-XD/Automator67/issues
- Milestones: https://github.com/Retr0-XD/Automator67/milestones
- Projects: https://github.com/Retr0-XD/Automator67/projects (← create here)

---

**Document Version**: 1.0  
**Created**: January 15, 2026  
**Status**: Ready for Project Creation
