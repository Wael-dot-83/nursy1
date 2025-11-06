# ADR: Nursery Branch Creation and Manager Association Fix

**Date**: 2025-01-XX  
**Status**: Implemented  
**Decision Makers**: Development Team  

## Context

The admin nursery creation feature had several issues:
1. Branch creation logic was incomplete - branches were not being created
2. Manager accounts were not associated with specific branches (missing `branch_id`)
3. Governorate dropdown was not properly integrated with backend
4. Newly created managers were not immediately visible in `/admin/users`

## Decision

Implement a minimal, production-ready fix that:
1. Adds `branch_id` column to `users` table for manager-branch association
2. Fixes nursery creation endpoint to create exactly N branches when requested
3. Associates each branch manager with their specific branch via `branch_id`
4. Ensures all database operations are in a single transaction
5. Returns proper response format for frontend credentials modal
6. Leverages existing governorate table and endpoint

## Implementation Details

### Database Changes
- Added `branch_id INTEGER REFERENCES branches(id)` to `users` table
- Added index `idx_users_branch` for efficient lookups
- Migration: `004_add_branch_id_to_users.sql`

### Backend Changes (`nursery_router.py`)
- Fixed field name mapping (camelCase → snake_case)
- Added proper branch creation loop for exactly N branches
- Set `branch_id` on manager users during creation
- Added governorate validation
- Ensured single transaction for atomicity
- Fixed response format to match frontend expectations

### Response Format
```json
{
  "nursery": { "id": 1, "name": "...", ... },
  "director": { "email": "...", "temporaryPassword": "..." },
  "managers": [
    { "email": "...", "temporaryPassword": "...", "branchName": "فرع 1" },
    { "email": "...", "temporaryPassword": "...", "branchName": "فرع 2" }
  ]
}
```

### Frontend Changes
- **None required** - frontend already correct
- Already fetches governorates from `/admin/settings/governorates`
- Already invalidates `['admin-users']` query after creation
- Already displays credentials modal for all managers

## Consequences

### Positive
- ✅ Branches are created correctly (exactly N branches)
- ✅ Managers are associated with specific branches
- ✅ Managers appear immediately in `/admin/users` after creation
- ✅ Governorate dropdown works with backend FK
- ✅ Single transaction ensures data consistency
- ✅ No duplicate nurseries/branches (unique constraints enforced)
- ✅ Zero frontend changes needed
- ✅ Backward compatible (branch_id nullable)

### Negative
- Requires database migration (minimal, safe)
- Existing manager users won't have branch_id (acceptable - nullable)

## Alternatives Considered

1. **Create branches in separate endpoint** - Rejected: More complex, requires multiple API calls
2. **Use branch name instead of branch_id** - Rejected: Not normalized, harder to query
3. **Store branch association in separate table** - Rejected: Over-engineered for this use case

## Testing

### Unit Tests (`test_nursery_branches.py`)
- Create nursery with 0 branches → director only
- Create nursery with 2 branches → 2 branches + 2 managers
- Duplicate name/phone rejection
- Invalid governorate rejection
- Managers visible in users list immediately

### Smoke Test (`smoke_nursery_branches.sh`)
- End-to-end test of complete flow
- Verifies API responses
- Confirms managers in users list
- Validates branch count

## Rollback Plan

If issues arise:
1. Revert `nursery_router.py` changes
2. Run rollback migration to remove `branch_id` column
3. Frontend continues to work (already handles both formats)

## References

- Issue: Admin nursery creation with branches not working
- Frontend: `NurseryManagement.jsx` (already correct)
- Backend: `nursery_router.py`, `models.py`
- Migration: `004_add_branch_id_to_users.sql`
- Tests: `test_nursery_branches.py`
