# Git Workflow Quick Reference

**For Automator67 Development**

---

## Current Status

```
Branch: milestone/M1.2-authentication (NEW - Ready for development)
Parent: main (Stable - All M1.1 tests passing)
Status: Ready for Task 1.2.1
```

---

## Quick Commands (Copy-Paste Ready)

### See Current Branch
```bash
git branch
# Shows: * milestone/M1.2-authentication (active)
#          main
```

### View History
```bash
git log --oneline -10
git log --graph --oneline --all  # Visual tree
```

### Make a Commit
```bash
# Edit files, then:
git add .
git commit -m "feat: Task 1.2.1 - Auth form validation"
git push origin milestone/M1.2-authentication
```

### Switch Branches
```bash
git checkout main                    # Go to main
git checkout milestone/M1.2-authentication  # Go to M1.2
```

### Undo Last Commit (Not Pushed)
```bash
git reset --soft HEAD~1  # Keep changes
git reset --hard HEAD~1  # Discard changes
```

### Undo Commit (Already Pushed)
```bash
git revert HEAD  # Creates new commit that undoes it
git push origin milestone/M1.2-authentication
```

### See What's Different
```bash
git diff main        # Compare to main
git status           # What's changed locally?
```

### Test Before Push
```bash
npm run test:run     # Run tests
npm run build        # Build check
npm run lint         # Linting
npm run format:check # Code style

# All green? Safe to push
git push origin milestone/M1.2-authentication
```

---

## Commit Message Format

```
feat: Task 1.2.1 - Auth types and interfaces
      ↑     ↑
      |     └─ What was done
      └─────── Type (feat, fix, test, docs, refactor)

# Full example:
# feat: Task 1.2.1 - Auth types and interfaces
#
# - Created AuthUser interface
# - Created AuthResponse type
# - Added JSDoc comments
# - Added tests in auth.test.ts
```

### Message Types

- `feat:` - New feature/task
- `fix:` - Bug fix
- `test:` - Add/update tests
- `docs:` - Documentation
- `refactor:` - Code cleanup
- `ci:` - CI/CD changes
- `chore:` - Dependencies, configs

---

## Development Cycle for Each Task

```
1. Create commit with code
   git add .
   git commit -m "feat: Task 1.2.X - Description"

2. Push to see in GitHub
   git push origin milestone/M1.2-authentication

3. Test locally
   npm run test:run

4. Fix any issues with new commits
   git commit -m "fix: Handle edge case"

5. When task done, push final version
   git push origin milestone/M1.2-authentication

6. Repeat for next task
```

---

## When Milestone 1.2 is Complete

```bash
# All tests passing? All tasks done?

# Create PR on GitHub
# 1. Go to https://github.com/Retr0-XD/Automator67
# 2. Click "Compare & pull request" button for M1.2 branch
# 3. Title: "feat: Milestone 1.2 - Authentication (6 tasks)"
# 4. Description: List what was completed
# 5. Click "Create pull request"

# Wait for:
# - All CI/CD checks ✅
# - Code review ✅
# - Approval ✅

# Then merge:
git checkout main
git pull origin main
git merge --no-ff milestone/M1.2-authentication
git push origin main

# Tag it:
git tag -a v1.2 -m "Milestone 1.2 - Authentication"
git push origin v1.2

# Clean up:
git branch -d milestone/M1.2-authentication
git push origin --delete milestone/M1.2-authentication
```

---

## Undo Scenarios

### "I made a mistake in the last commit"

```bash
# Before pushing:
git reset --soft HEAD~1
# Fix the files
git commit -m "Corrected message"

# After pushing:
git revert HEAD
git push origin milestone/M1.2-authentication
```

### "I want to go back to an old version"

```bash
# See the history
git log --oneline

# Go back to specific commit
git checkout commit-hash

# Create new branch from there
git checkout -b recovery-branch

# Or undo to that point
git reset --hard commit-hash
```

### "I pushed the wrong code"

```bash
# See what went wrong
git log --oneline -5

# Undo it (creates new commit)
git revert HEAD
git push origin milestone/M1.2-authentication

# Or (⚠️ only if nobody pulled):
git reset --hard HEAD~1
git push -f origin milestone/M1.2-authentication
```

---

## Safety Checks

### Before Every Push

```bash
# See what you're pushing
git log origin/milestone/M1.2-authentication..HEAD --oneline

# Run tests
npm run test:run

# Check formatting
npm run format:check

# Build it
npm run build

# View changes
git diff main  # See all changes from main
```

### Before Starting New Day

```bash
# See if anyone pushed to main
git fetch origin

# See all branches
git branch -a

# Pull latest from your branch
git pull origin milestone/M1.2-authentication

# Make sure tests still pass
npm run test:run
```

---

## Viewing Progress

### See What's in M1.2 But Not in Main

```bash
git log main..milestone/M1.2-authentication --oneline
# Shows commits waiting to merge
```

### See All Commits in Timeline

```bash
git log --graph --oneline --all --decorate
# Visual tree of all branches and their history
```

### See File History

```bash
git log --oneline -- frontend/src/auth/
# Show commits that changed auth files
```

### See Who Changed What

```bash
git blame frontend/src/auth/types.ts
# Shows who changed each line and when
```

---

## Setup Git Aliases (Optional)

Add to `~/.gitconfig`:

```ini
[alias]
  graph = log --oneline --graph --all --decorate
  st = status
  co = checkout
  br = branch
  ci = commit
  unstage = reset HEAD --
  last = log -1 HEAD
  cleanup = branch --merged | grep -v '\\*\\|main' | xargs -n 1 git branch -d
```

Then use:
```bash
git graph      # See full history
git st         # See status
git co main    # Switch to main
git ci -m "..." # Commit
```

---

## Status Dashboard (Check Anytime)

```bash
# Quick overview
git status
git branch
git log --oneline -5

# Detailed view
git log --graph --oneline --all
```

---

## Remember

✅ **Always test before pushing**
```bash
npm run test:run && npm run build && npm run lint
```

✅ **Write good commit messages**
```bash
git commit -m "feat: Task 1.2.X - Clear description"
```

✅ **Push frequently** (many small commits > few big ones)
```bash
git push origin milestone/M1.2-authentication
```

✅ **Check tests on GitHub**
Visit: https://github.com/Retr0-XD/Automator67/actions

✅ **When stuck, check history**
```bash
git log --oneline
git show commit-hash
git diff main
```

---

**Current Branch**: `milestone/M1.2-authentication`  
**Status**: Ready for Task 1.2.1  
**Tests**: CI/CD pipeline ready  
**History**: Full git history available for undo/redo
