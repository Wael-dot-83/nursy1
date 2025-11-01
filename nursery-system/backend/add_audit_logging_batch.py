#!/usr/bin/env python3
"""
Batch Add Audit Logging to Remaining Routers
This script generates audit logging code for all CRUD operations
"""
import os
from pathlib import Path

# Routers that need audit logging with their resource types
ROUTERS_TO_INSTRUMENT = {
    'nursery_router.py': {
        'resource_type': 'nursery',
        'operations': ['create', 'update', 'delete']
    },
    'children_router.py': {
        'resource_type': 'child',
        'operations': ['create', 'update', 'delete']
    },
    'attendance_router.py': {
        'resource_type': 'attendance',
        'operations': ['create', 'update', 'delete']
    },
    'reports_router.py': {
        'resource_type': 'daily_report',
        'operations': ['create', 'update', 'delete']
    },
    'settings_router.py': {
        'resource_type': 'settings',
        'operations': ['update']  # Settings don't get created/deleted, just updated
    },
    'backup_router.py': {
        'resource_type': 'backup',
        'operations': ['create', 'delete']
    },
    'notification_router.py': {
        'resource_type': 'notification',
        'operations': ['create']
    },
    'file_router.py': {
        'resource_type': 'file',
        'operations': ['create', 'delete']
    }
}

# Templates for audit logging code
IMPORT_TEMPLATE = """from fastapi import Request
from .audit_helper import log_create, log_update, log_delete"""

CREATE_LOG_TEMPLATE = """
    # Log the creation
    log_create(
        db, current_user, "{resource_type}", {resource_id},
        details={{/* add relevant details */}},
        request=request
    )
"""

UPDATE_LOG_TEMPLATE = """
    # Log the update
    log_update(
        db, current_user, "{resource_type}", {resource_id},
        details={{/* add relevant details */}},
        request=request
    )
"""

DELETE_LOG_TEMPLATE = """
    # Log the deletion
    log_delete(
        db, current_user, "{resource_type}", {resource_id},
        details={{/* add relevant details */}},
        request=request
    )
"""

def generate_instructions():
    """Generate instructions for manual implementation"""

    print("="*80)
    print("AUDIT LOGGING IMPLEMENTATION GUIDE")
    print("="*80)
    print()
    print("For each router file listed below, follow these steps:")
    print()

    for router_file, config in ROUTERS_TO_INSTRUMENT.items():
        print(f"\n📄 {router_file}")
        print("-" * 80)

        # Step 1: Add imports
        print("\n1️⃣  ADD IMPORTS (at the top of the file):")
        print("   Add Request to FastAPI imports if not present:")
        print("   from fastapi import APIRouter, Depends, HTTPException, Request")
        print()
        print("   Add audit helper imports:")
        print(f"   from .audit_helper import {', '.join([f'log_{op}' for op in config['operations']])}")

        # Step 2: Add Request parameter
        print("\n2️⃣  ADD REQUEST PARAMETER to each endpoint:")
        print("   Change:")
        print("   async def create_xxx(..., db: Session = Depends(get_db), ...)")
        print("   To:")
        print("   async def create_xxx(..., request: Request, db: Session = Depends(get_db), ...)")

        # Step 3: Add logging calls
        print("\n3️⃣  ADD LOGGING CALLS:")

        for operation in config['operations']:
            print(f"\n   For {operation.upper()} operations:")

            if operation == 'create':
                print(f"""
   After db.add() and db.flush(), before db.commit():

   log_create(
       db, current_user, "{config['resource_type']}", new_record.id,
       details={{"relevant": "data"}},
       request=request
   )""")

            elif operation == 'update':
                print(f"""
   Before db.commit(), after making changes:

   log_update(
       db, current_user, "{config['resource_type']}", record_id,
       details={{"changes": changes_dict}},
       request=request
   )""")

            elif operation == 'delete':
                print(f"""
   BEFORE db.delete(), capture details:

   log_delete(
       db, current_user, "{config['resource_type']}", record_id,
       details={{"deleted_data": record.to_dict()}},
       request=request
   )""")

        print("\n" + "="*80)

def generate_checklist():
    """Generate a checklist for tracking progress"""
    print("\n\n")
    print("="*80)
    print("IMPLEMENTATION CHECKLIST")
    print("="*80)
    print()
    print("Copy this checklist to track your progress:")
    print()

    for router_file, config in ROUTERS_TO_INSTRUMENT.items():
        print(f"\n{router_file}:")
        print(f"  [ ] Imports added")
        print(f"  [ ] Request parameter added to endpoints")
        for operation in config['operations']:
            print(f"  [ ] {operation.upper()} logging added")
        print(f"  [ ] Tested")

    print("\n" + "="*80)

def generate_example_implementation():
    """Generate complete example for one router"""
    print("\n\n")
    print("="*80)
    print("COMPLETE EXAMPLE: nursery_router.py CREATE operation")
    print("="*80)
    print()

    example = '''
# At the top of the file:
from fastapi import APIRouter, Depends, HTTPException, Request
from .audit_helper import log_create, log_update, log_delete

# In the create endpoint:
@router.post("/nurseries")
async def create_nursery(
    nursery_data: NurseryCreate,
    request: Request,  # ← ADD THIS
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new nursery (Admin only)"""

    # Create nursery
    db_nursery = Nursery(**nursery_data.dict())
    db.add(db_nursery)
    db.flush()  # Get the ID before commit

    # ← ADD THIS BLOCK
    log_create(
        db, current_user, "nursery", db_nursery.id,
        details={
            "name": db_nursery.name,
            "email": db_nursery.email,
            "has_branches": len(branches) if branches else 0
        },
        request=request
    )

    db.commit()
    db.refresh(db_nursery)
    return db_nursery
'''
    print(example)
    print("="*80)

def main():
    print("\n🚀 AUDIT LOGGING BATCH IMPLEMENTATION TOOL\n")
    print("This tool generates instructions for adding audit logging to all routers.")
    print()

    generate_instructions()
    generate_checklist()
    generate_example_implementation()

    print("\n✅ Instructions generated successfully!")
    print("\nNext steps:")
    print("1. Follow the instructions above for each router")
    print("2. Test each router after implementation")
    print("3. Run verify_phase1_compliance.py to check coverage")
    print()

if __name__ == "__main__":
    main()
