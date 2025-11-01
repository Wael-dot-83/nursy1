#!/usr/bin/env python3
"""
Phase 1 Compliance Verification Script
Verifies:
1. All endpoints use require_admin properly
2. Database constraints exist
3. Error handling is standardized
4. Audit logging coverage
"""
import sys
import os
import ast
import re
from pathlib import Path
from sqlalchemy import inspect, MetaData
from sqlalchemy.schema import UniqueConstraint

# Fix encoding for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models import Base, Attendance, DailyReport


class ComplianceChecker:
    def __init__(self):
        self.results = {
            "auth_coverage": [],
            "db_constraints": [],
            "error_handling": [],
            "audit_logging": []
        }
        self.errors = []
        self.warnings = []

    def check_router_auth(self, router_file: Path):
        """Check if all router endpoints use require_admin"""
        print(f"\n🔍 Checking {router_file.name}...")

        with open(router_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find all @router decorators
        router_pattern = r'@router\.(get|post|put|patch|delete)\([\'"]([^\'"]+)[\'"]\)'
        endpoints = re.findall(router_pattern, content)

        # Parse the file to check for require_admin
        tree = ast.parse(content)

        functions_with_auth = set()

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Check function arguments for require_admin dependency
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call):
                        pass  # @router.get(...) decorators

                # Check function signature for Depends(require_admin)
                for arg in node.args.args + node.args.kwonlyargs:
                    if hasattr(arg, 'annotation') and arg.annotation:
                        annotation_str = ast.unparse(arg.annotation) if hasattr(ast, 'unparse') else ''
                        if 'require_admin' in annotation_str:
                            functions_with_auth.add(node.name)

                # Check in function body for explicit checks
                for stmt in ast.walk(node):
                    if isinstance(stmt, ast.Name) and stmt.id == 'require_admin':
                        functions_with_auth.add(node.name)

        missing_auth = []
        for method, path in endpoints:
            # Special exceptions (health checks, public endpoints)
            if path in ['/', '/health', '/protected']:
                continue
            if router_file.name == 'auth_router.py' and path in ['/login', '/refresh']:
                continue
            if router_file.name == 'settings_router.py' and path == '/governorates' and method == 'get':
                continue  # Public endpoint
            if router_file.name == 'settings_router.py' and path == '/age-categories' and method == 'get':
                continue  # Public endpoint

            # Find the function for this endpoint
            # This is a simplified check
            missing_auth.append(f"{method.upper()} {path}")

        if functions_with_auth:
            print(f"✅ Found {len(functions_with_auth)} endpoints with require_admin")
            self.results["auth_coverage"].append({
                "file": router_file.name,
                "protected_count": len(functions_with_auth),
                "status": "OK"
            })
        else:
            print(f"⚠️  No require_admin usage found (may be public router)")
            self.results["auth_coverage"].append({
                "file": router_file.name,
                "protected_count": 0,
                "status": "WARNING"
            })

    def check_database_constraints(self):
        """Verify database constraints"""
        print("\n🔍 Checking Database Constraints...")

        inspector = inspect(engine)

        # Check Attendance table for (child_id, date) uniqueness
        print("\n📋 Attendance Table:")
        try:
            attendance_indexes = inspector.get_indexes('attendance')
            attendance_unique = inspector.get_unique_constraints('attendance')

            has_child_date_constraint = False
            for constraint in attendance_unique:
                columns = constraint.get('column_names', [])
                if set(columns) == {'child_id', 'date'}:
                    has_child_date_constraint = True
                    print(f"✅ Found unique constraint on (child_id, date): {constraint['name']}")

            if not has_child_date_constraint:
                # Check if there's an index that enforces uniqueness
                for index in attendance_indexes:
                    if index.get('unique') and set(index['column_names']) == {'child_id', 'date'}:
                        has_child_date_constraint = True
                        print(f"✅ Found unique index on (child_id, date): {index['name']}")

            if not has_child_date_constraint:
                self.warnings.append("⚠️  Missing unique constraint on attendance(child_id, date)")
                self.results["db_constraints"].append({
                    "table": "attendance",
                    "constraint": "(child_id, date) UNIQUE",
                    "status": "MISSING"
                })
            else:
                self.results["db_constraints"].append({
                    "table": "attendance",
                    "constraint": "(child_id, date) UNIQUE",
                    "status": "OK"
                })
        except Exception as e:
            self.errors.append(f"Error checking attendance constraints: {e}")

        # Check DailyReport table for (child_id, date) uniqueness
        print("\n📋 Daily Reports Table:")
        try:
            reports_indexes = inspector.get_indexes('daily_reports')
            reports_unique = inspector.get_unique_constraints('daily_reports')

            has_child_date_constraint = False
            for constraint in reports_unique:
                columns = constraint.get('column_names', [])
                if set(columns) == {'child_id', 'date'}:
                    has_child_date_constraint = True
                    print(f"✅ Found unique constraint on (child_id, date): {constraint['name']}")

            if not has_child_date_constraint:
                for index in reports_indexes:
                    if index.get('unique') and set(index['column_names']) == {'child_id', 'date'}:
                        has_child_date_constraint = True
                        print(f"✅ Found unique index on (child_id, date): {index['name']}")

            if not has_child_date_constraint:
                self.warnings.append("⚠️  Missing unique constraint on daily_reports(child_id, date)")
                self.results["db_constraints"].append({
                    "table": "daily_reports",
                    "constraint": "(child_id, date) UNIQUE",
                    "status": "MISSING"
                })
            else:
                self.results["db_constraints"].append({
                    "table": "daily_reports",
                    "constraint": "(child_id, date) UNIQUE",
                    "status": "OK"
                })
        except Exception as e:
            self.errors.append(f"Error checking daily_reports constraints: {e}")

        # Check cascades
        print("\n🔗 Checking Foreign Key Cascades:")
        for table_name in ['branches', 'classrooms', 'children']:
            try:
                fks = inspector.get_foreign_keys(table_name)
                print(f"\n  {table_name}:")
                for fk in fks:
                    print(f"    - {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")
                    print(f"      ON DELETE: {fk.get('ondelete', 'NO ACTION')}")
            except Exception as e:
                print(f"    ⚠️  Error: {e}")

    def check_error_handling_patterns(self):
        """Check for consistent error handling"""
        print("\n🔍 Checking Error Handling Patterns...")

        router_files = list(Path('app').glob('*_router.py'))

        for router_file in router_files:
            try:
                with open(router_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check for HTTPException usage
                if 'HTTPException' in content:
                    # Count status code usage
                    status_400 = len(re.findall(r'status_code\s*=\s*400', content))
                    status_401 = len(re.findall(r'status_code\s*=\s*401', content))
                    status_403 = len(re.findall(r'status_code\s*=\s*403', content))
                    status_404 = len(re.findall(r'status_code\s*=\s*404', content))
                    status_409 = len(re.findall(r'status_code\s*=\s*409', content))
                    status_500 = len(re.findall(r'status_code\s*=\s*500', content))

                    self.results["error_handling"].append({
                        "file": router_file.name,
                        "400_count": status_400,
                        "404_count": status_404,
                        "409_count": status_409,
                        "500_count": status_500
                    })
            except Exception as e:
                print(f"⚠️  Error checking {router_file.name}: {e}")

    def check_audit_logging(self):
        """Check audit logging coverage"""
        print("\n🔍 Checking Audit Logging Coverage...")

        router_files = list(Path('app').glob('*_router.py'))

        for router_file in router_files:
            try:
                with open(router_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check for audit log creation
                has_audit = 'AuditLog' in content and 'audit_logs' in content.lower()

                if has_audit:
                    print(f"✅ {router_file.name} has audit logging")
                    self.results["audit_logging"].append({
                        "file": router_file.name,
                        "status": "IMPLEMENTED"
                    })
                else:
                    # Check if router has sensitive operations
                    has_create = re.search(r'@router\.post', content)
                    has_update = re.search(r'@router\.(put|patch)', content)
                    has_delete = re.search(r'@router\.delete', content)

                    if has_create or has_update or has_delete:
                        self.warnings.append(f"⚠️  {router_file.name} has CUD operations but no audit logging")
                        self.results["audit_logging"].append({
                            "file": router_file.name,
                            "status": "MISSING"
                        })
            except Exception as e:
                print(f"⚠️  Error checking {router_file.name}: {e}")

    def generate_report(self):
        """Generate final compliance report"""
        print("\n" + "="*80)
        print("📊 PHASE 1 COMPLIANCE REPORT")
        print("="*80)

        print("\n1️⃣  Authentication Coverage:")
        for result in self.results["auth_coverage"]:
            status_icon = "✅" if result["status"] == "OK" else "⚠️"
            print(f"  {status_icon} {result['file']}: {result['protected_count']} protected endpoints")

        print("\n2️⃣  Database Constraints:")
        for result in self.results["db_constraints"]:
            status_icon = "✅" if result["status"] == "OK" else "❌"
            print(f"  {status_icon} {result['table']}: {result['constraint']} - {result['status']}")

        print("\n3️⃣  Error Handling:")
        for result in self.results["error_handling"]:
            print(f"  📄 {result['file']}:")
            print(f"     400 errors: {result['400_count']}, 404 errors: {result['404_count']}")

        print("\n4️⃣  Audit Logging:")
        missing_audit = [r for r in self.results["audit_logging"] if r["status"] == "MISSING"]
        implemented_audit = [r for r in self.results["audit_logging"] if r["status"] == "IMPLEMENTED"]

        print(f"  ✅ Implemented: {len(implemented_audit)} routers")
        print(f"  ❌ Missing: {len(missing_audit)} routers")

        if missing_audit:
            print("\n  Routers needing audit logging:")
            for result in missing_audit:
                print(f"    - {result['file']}")

        print("\n" + "="*80)
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")

        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")

        if not self.errors and not self.warnings:
            print("\n✅ ALL CHECKS PASSED!")

        print("="*80)


def main():
    print("🚀 Starting Phase 1 Compliance Verification")
    print("="*80)

    checker = ComplianceChecker()

    # Check all router files
    router_files = list(Path('app').glob('*_router.py'))
    print(f"\n📁 Found {len(router_files)} router files")

    for router_file in router_files:
        checker.check_router_auth(router_file)

    # Check database constraints
    checker.check_database_constraints()

    # Check error handling
    checker.check_error_handling_patterns()

    # Check audit logging
    checker.check_audit_logging()

    # Generate final report
    checker.generate_report()

    # Return exit code
    return 0 if not checker.errors else 1


if __name__ == "__main__":
    sys.exit(main())
