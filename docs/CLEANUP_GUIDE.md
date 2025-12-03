# Cleanup Guide - Removing Legacy Folders

## Current State

After migrating to AATRAL architecture, the project has **duplicate folders**:

### Legacy (Old Structure)
- `frontend/` - Old React frontend
- `backend/` - Old FastAPI backend

### Active (AATRAL Structure)
- `apps/web/` - New React frontend
- `modules/` - New FastAPI backend modules
- `core/` - Shared utilities
- `shared/` - Shared config/assets
- `tools/` - Scripts and tools

## Should You Clean Up?

### ✅ Clean Up If:
- Migration is complete and tested
- All imports updated to new paths
- Application runs successfully from new structure
- Team is comfortable with AATRAL architecture
- No plans to rollback

### ⚠️ Keep Both If:
- Still testing the migration
- Need rollback option
- Gradual migration in progress
- Team needs time to adapt

## Cleanup Steps (When Ready)

### Step 1: Verify New Structure Works

```bash
# Test backend
cd modules
uv run python main.py

# Test frontend (separate terminal)
cd apps/web
npm run dev
```

### Step 2: Backup Old Folders (Optional)

```bash
# Create backup
mkdir ../project-backup
xcopy frontend ..\project-backup\frontend /E /I
xcopy backend ..\project-backup\backend /E /I
```

### Step 3: Remove Legacy Folders

```bash
# Remove old frontend
rmdir /s /q frontend

# Remove old backend
rmdir /s /q backend
```

### Step 4: Update .gitignore

Remove any frontend/backend specific entries if they exist.

### Step 5: Update Documentation

Update any remaining references to old paths in:
- README.md
- Documentation files
- Run scripts

## Files to Keep

Even after cleanup, keep these legacy files if they're still useful:
- `run.bat` / `run_aatral.bat` - Update to use new paths
- Database files in `backend/` - Move to appropriate location
- Upload files in `backend/uploads/` - Move to new location

## Recommended Approach

### Phase 1: Parallel Operation (Current)
- Keep both structures
- Use AATRAL for new development
- Test thoroughly

### Phase 2: Transition
- Update all team members
- Ensure CI/CD uses new structure
- Update deployment scripts

### Phase 3: Cleanup
- Remove legacy folders
- Update documentation
- Archive old structure if needed

## Migration Checklist

Before removing legacy folders, verify:

- [ ] Backend runs from `modules/main.py`
- [ ] Frontend runs from `apps/web/`
- [ ] All imports use new path aliases
- [ ] Database migrations work
- [ ] File uploads work
- [ ] Tests pass
- [ ] Environment variables updated
- [ ] Deployment scripts updated
- [ ] Team members trained
- [ ] Documentation updated

## Rollback Plan

If you need to rollback after cleanup:

1. Restore from backup
2. Or restore from git history:
   ```bash
   git checkout HEAD~1 frontend/
   git checkout HEAD~1 backend/
   ```

## Current Recommendation

**Status: Keep Both Structures**

Reasons:
1. Migration recently completed
2. Testing still in progress
3. Provides safety net
4. Allows gradual transition

**When to cleanup:**
- After 2-4 weeks of stable operation
- All team members comfortable with new structure
- No issues found in production

## Questions?

- See `MIGRATION_GUIDE.md` for migration details
- See `README_AATRAL.md` for architecture overview
- See `docs/04_SETUP_GUIDE.md` for setup instructions
