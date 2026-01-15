# Git Branching & Workflow Strategy

**Project**: Automator67  
**Created**: January 15, 2026  
**Purpose**: Enable clean history, easy rollback, and isolated development per milestone

---

## Branching Model

### Main Branches (Protected)

```
main
├─ Production-ready code
├─ Only receives merges from milestone branches
├─ Every commit on main is a stable release
└─ Protected: No direct commits
```

### Milestone Branches (Feature Development)

```
develop
├─ Parent branch for all new work
├─ Latest development version
├─ Receives merges from milestone branches
└─ Can be partially stable

milestone/M1.2-authentication
├─ Created from: main (or develop)
├─ Contains: All M1.2 work
├─ Tests: All M1.2 tests passing before merge
├─ Merge to: develop, then main
└─ Branch pattern: milestone/M{version}-{feature}

milestone/M1.3-layout
├─ Created from: main
├─ Same structure as M1.2
└─ Isolated from other milestones

milestone/M2.0-backend
└─ Future backend work
```

### Supporting Branches (Hotfixes & Features)

```
feature/auth-forms (if breaking down M1.2)
├─ Created from: milestone/M1.2-authentication
├─ Work on specific feature within milestone
└─ Merge back to milestone branch

bugfix/css-issue (emergency fixes)
├─ Created from: main
├─ Hotfix for production issues
└─ Merge to both main and develop
```

---

## Workflow for Each Milestone

### Step 1: Create Milestone Branch

```bash
# Start from main (stable)
git checkout main
git pull origin main

# Create milestone branch
git checkout -b milestone/M1.2-authentication

# Push to GitHub
git push -u origin milestone/M1.2-authentication
```

### Step 2: Develop in Milestone Branch

```bash
# Work on tasks within this branch
# Task 1.2.1, 1.2.2, 1.2.3, etc.

# Each task gets its own commits
git add .
git commit -m "feat: Task 1.2.1 - Auth form validation"

# Commit frequently (good for history)
git commit -m "test: Add auth form tests"
git commit -m "fix: Handle form errors properly"
```

### Step 3: Test Everything in Branch

```bash
# Run all tests for this milestone
npm run test:run           # Unit tests
npm run build             # Build check
npm run lint              # Linting
npm run type-check        # Type checking

# The CI/CD pipeline will also test
# (See: .github/workflows/test-milestone-1.2.yml)
```

### Step 4: Create Pull Request

```bash
# Create PR on GitHub
# Target: main
# Title: "feat: Milestone 1.2 - Authentication (6 tasks)"
# Description: List what was completed, testing results
```

### Step 5: Code Review & Merge

```bash
# Once approved and tests pass:

# Option A: Merge via GitHub UI
# - Squash commits (if you want clean history)
# - Create merge commit (if you want full history)

# Option B: Merge locally
git checkout main
git pull origin main
git merge --no-ff milestone/M1.2-authentication
git push origin main

# Clean up branch
git branch -d milestone/M1.2-authentication
git push origin --delete milestone/M1.2-authentication
```

---

## Git Commands for History & Undo

### View Complete History

```bash
# See all commits with detailed info
git log --oneline --graph --all

# Example output:
# *   a7f1e1b (main) Milestone 1.1 complete
# |\
# | * 8240cdb (milestone/M1.2) Add auth forms
# | * 3d0cc14 Setup auth store
# |/
# *   462a9af CSS fixes
# |\
# | * 530dbc6 Update styles
# |/
# *   a674674 Initial commit

# See what changed in a commit
git show a7f1e1b

# See all commits by author
git log --author="Retr0-XD"

# See commits in date range
git log --since="2026-01-01" --until="2026-01-31"
```

### Undo/Rollback Operations

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo specific commit in middle of history
git revert a7f1e1b

# Go back to specific commit (create new branch from there)
git checkout -b recovery a7f1e1b

# See what was undone
git reflog
git log -p  # Show full diff with commits
```

### Compare Branches

```bash
# See what's in feature branch but not in main
git log main..milestone/M1.2-authentication

# See what's different between branches
git diff main..milestone/M1.2-authentication

# See which commits are in main but not in feature
git log milestone/M1.2-authentication..main
```

### Cherry-Pick Specific Commits

```bash
# Apply a specific commit from one branch to another
git checkout main
git cherry-pick 8240cdb

# Useful if you need just one fix from a branch
```

### Create a Tag for Releases

```bash
# Tag when merging to main
git tag -a v1.1 -m "Milestone 1.1 - Frontend MVP complete"
git push origin v1.1

# Later, checkout specific version
git checkout v1.1

# See all tags
git tag -l
```

---

## For Milestone 1.2 (Next)

### Create the branch

```bash
git checkout main
git pull origin main
git checkout -b milestone/M1.2-authentication
git push -u origin milestone/M1.2-authentication
```

### Work on tasks

```bash
# Each task in its own commit
git commit -m "feat: Task 1.2.1 - Auth types and interfaces"
git commit -m "feat: Task 1.2.2 - Signup form component"
git commit -m "test: Add auth form validation tests"
git commit -m "fix: Handle validation edge cases"
git commit -m "feat: Task 1.2.3 - Login form component"
# ... and so on
```

### Create CI/CD workflow for M1.2

```bash
# Still on milestone/M1.2-authentication branch
# Copy and modify the template
cp .github/workflows/milestone-template.yml \
   .github/workflows/test-milestone-1.2.yml

# Edit test-milestone-1.2.yml with M1.2 specific paths and jobs
git add .github/workflows/test-milestone-1.2.yml
git commit -m "ci: Add M1.2 authentication testing pipeline"
```

### When tests pass

```bash
# All tests passing in the milestone branch? 
npm run test:run  # ✅ All pass
npm run build     # ✅ Success

# Create PR
git push origin milestone/M1.2-authentication

# On GitHub: Create PR to main
# Title: "feat: Milestone 1.2 - Authentication (6 tasks)"
```

### Merge to main

```bash
# Once approved and all CI checks pass:
git checkout main
git pull origin main
git merge --no-ff milestone/M1.2-authentication
git push origin main

# Tag the release
git tag -a v1.2 -m "Milestone 1.2 - Authentication"
git push origin v1.2

# Cleanup branch
git branch -d milestone/M1.2-authentication
git push origin --delete milestone/M1.2-authentication
```

---

## File Structure with Branching

### On `main` (stable, tested)
```
main/
├── frontend/       ✅ Fully tested
├── docs/           ✅ Complete
├── .github/        ✅ All workflows
└── All M1.1 complete
```

### On `milestone/M1.2-authentication` (in development)
```
M1.2/
├── frontend/
│   └── src/
│       ├── auth/          ✨ NEW (auth components)
│       ├── store/         ✨ NEW (Zustand store)
│       └── lib/           ✨ NEW (auth utilities)
├── .github/
│   └── workflows/
│       └── test-milestone-1.2.yml  ✨ NEW
└── All M1.1 + M1.2 work
```

### On `milestone/M1.3-layout` (separate milestone)
```
M1.3/
├── frontend/
│   └── src/
│       ├── components/    ✨ NEW (layout components)
│       ├── pages/         ✨ NEW (page layouts)
│       └── hooks/         ✨ NEW (layout hooks)
└── All M1.1 + M1.3 work (M1.2 can be merged in or skipped)
```

---

## Advanced: Git Workflow Helpers

### Alias for cleaner commands

Create in `~/.gitconfig`:

```ini
[alias]
  # View branching history
  graph = log --oneline --graph --all
  
  # See what's in current branch
  status-branch = log main..HEAD --oneline
  
  # Clean up merged branches
  cleanup = branch -d $(git branch --merged | grep -v main)
  
  # See all branches with last commit
  branches = branch -v
  
  # Interactive rebase (for cleaning history)
  rebase-interactive = rebase -i
```

### Use them like:

```bash
git graph                # See full history tree
git status-branch        # What's in my branch?
git cleanup              # Delete merged branches
git branches             # All branches at a glance
```

### Example: Clean History Before Merge

```bash
# Before submitting PR, clean up commits
git rebase -i main

# In the editor:
# pick 8240cdb Add auth forms
# squash 3d0cc14 Fix typo in form       <- Combine into above
# squash 1a2b3c4 Update tests           <- Combine
# pick 5e6f7g8 Add auth store

# Result: 2 clean commits instead of 4

git push -f origin milestone/M1.2-authentication
```

---

## Protection Rules (For GitHub)

### Set on `main` branch

- ✅ Require pull request before merging
- ✅ Require status checks to pass (CI/CD)
- ✅ Require code review (1 approver minimum)
- ✅ Dismiss stale PR approvals
- ✅ Require branches to be up to date before merging
- ✅ Include administrators in restrictions
- ✅ Require commit signatures (optional)

### Result: No direct commits to main!

```bash
# This fails:
git push origin main
# ❌ ERROR: Protected branch

# Must use PR:
# 1. Create branch
# 2. Make commits
# 3. Push branch
# 4. Open PR on GitHub
# 5. Pass all checks
# 6. Get review approval
# 7. Merge via GitHub UI
```

---

## Undo Scenarios

### Scenario 1: Undo Last Commit (Not Yet Pushed)

```bash
# On milestone/M1.2-authentication
git commit -m "Wrong commit message"
git log --oneline  # See it's the last one

# Undo it (keep the changes)
git reset --soft HEAD~1

# Change the message and recommit
git commit -m "Correct commit message"
```

### Scenario 2: Undo Commits Already Pushed

```bash
# On milestone/M1.2-authentication
git commit -m "Bad code"
git push origin milestone/M1.2-authentication

# View what we want to undo
git log --oneline -5

# Create new commit that reverts the bad one
git revert 8240cdb
# This creates a NEW commit that undoes 8240cdb
git push origin milestone/M1.2-authentication

# Or, force rewrite (if only you're on this branch)
git reset --hard HEAD~1
git push -f origin milestone/M1.2-authentication
```

### Scenario 3: Undo Entire Branch

```bash
# Oops, whole milestone branch is wrong
# But we already pushed and created PR

# Option A: Close the PR, delete branch
# Go to GitHub, close PR
git push origin --delete milestone/M1.2-authentication
git branch -D milestone/M1.2-authentication

# Option B: Start fresh branch from main
git checkout main
git pull origin main
git checkout -b milestone/M1.2-authentication
# Start over with fresh commits

# View the old branch's history (for reference)
git log origin/milestone/M1.2-authentication --oneline
```

### Scenario 4: Merge Went Wrong

```bash
# We merged M1.2 to main, but it has bugs
git checkout main
git log --oneline -5

# Undo the merge commit
git revert -m 1 a7f1e1b
# This reverts the merge but keeps history visible

# Or, if merge hasn't been pushed:
git reset --hard HEAD~1
git push -f origin main  # ⚠️ Only if no one else pulled
```

---

## Status Check Commands

### Before Every Push

```bash
# See what will be pushed
git log origin/main..HEAD --oneline

# See what's uncommitted
git status

# See changes in current commits
git diff HEAD
git diff --staged  # Staged changes only

# Verify tests pass
npm run test:run
npm run build

# Verify no linting errors
npm run lint

# Good to go?
git push origin milestone/M1.2-authentication
```

---

## Example: Complete M1.2 Workflow

```bash
# 1. Create branch
git checkout main && git pull origin main
git checkout -b milestone/M1.2-authentication
git push -u origin milestone/M1.2-authentication

# 2. Work on tasks (over several days/commits)
git commit -m "feat: Task 1.2.1 - Auth types"
git commit -m "test: Add type tests"
git commit -m "feat: Task 1.2.2 - Signup form"
git commit -m "test: Add signup tests"
# ... more work ...

# 3. Push periodically
git push origin milestone/M1.2-authentication

# 4. Test when ready
npm run test:run
npm run build
npm run lint

# 5. Create PR on GitHub
# ... view logs, approve, all green ...

# 6. Merge and tag
git checkout main && git pull origin main
git merge --no-ff milestone/M1.2-authentication
git tag -a v1.2 -m "Milestone 1.2"
git push origin main --tags

# 7. Cleanup
git branch -d milestone/M1.2-authentication
git push origin --delete milestone/M1.2-authentication

# 8. Start next milestone
git checkout -b milestone/M1.3-layout
# ... repeat ...
```

---

## Troubleshooting

### "I pushed but want to change the commit"

```bash
# Make the change
git add .
git commit --amend  # Adds to last commit instead of new one
git push -f origin milestone/M1.2-authentication  # -f = force
# ⚠️ Only safe if you're the only one on this branch
```

### "I'm on the wrong branch"

```bash
git status  # See current branch
git branch  # See all branches
git checkout milestone/M1.2-authentication  # Switch
```

### "What's the difference?"

```bash
git diff main..HEAD  # See all changes in current branch vs main
git diff HEAD~3..HEAD  # Changes in last 3 commits
```

### "I want to see what changed"

```bash
git log -p milestone/M1.2-authentication  # Full diff of each commit
git log --stat  # Stats on what changed
git show 8240cdb  # Details of one commit
```

---

## Summary

**Branching Strategy Benefits**:
- ✅ **Isolation**: Each milestone is separate
- ✅ **History**: Full git history for undo/redo
- ✅ **Rollback**: Easy to go back to any commit
- ✅ **Review**: Clear PRs for code review
- ✅ **Stability**: Main branch always works
- ✅ **Parallel**: Multiple people can work on different milestones

**For Each Milestone**:
1. Create `milestone/M{X}.{Y}-{name}` branch
2. Work on all tasks in that branch
3. Test thoroughly
4. Create PR to main
5. Get approval
6. Merge to main with tag
7. Delete branch
8. Start next milestone

---

**Last Updated**: January 15, 2026  
**Status**: Ready for M1.2 development with proper branching  
**Next**: Create `milestone/M1.2-authentication` branch and start task 1.2.1
