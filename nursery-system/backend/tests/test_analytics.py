from datetime import datetime, timedelta

import pytest

from app.models import (
    Nursery,
    Branch,
    Classroom,
    Child,
    ChildStatus,
    User,
    RoleEnum,
    DailyReport,
)
from app.nursery_helpers import normalize_text, to_e164_jordan


@pytest.fixture
def analytics_dataset(db_session, admin_user):
    today = datetime.utcnow().date()

    nursery = Nursery(
        name="Downtown Nursery",
        name_normalized=normalize_text("Downtown Nursery"),
        is_branch=False,
        branch_name=None,
        branch_normalized="",
        main_phone="+962700000000",
        phone_normalized=to_e164_jordan("+962700000000"),
        email="info@downtownnursery.com",
        main_governorate="Amman",
        main_city="Amman",
        main_street="Rainbow Street",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(nursery)
    db_session.flush()

    branch = Branch(
        nursery_id=nursery.id,
        name="Main Branch",
        address_city="Amman",
        address_governorate="Amman",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(branch)
    db_session.flush()

    classroom = Classroom(
        branch_id=branch.id,
        name="Class A",
        capacity=25,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(classroom)
    db_session.flush()

    parent = User(
        email="parent@example.com",
        email_normalized="parent@example.com",
        first_name="Parent",
        last_name="User",
        phone="+962711111111",
        role=RoleEnum.PARENT,
        hashed_password="placeholder",
        is_active=True,
        nursery_id=nursery.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    manager = User(
        email="manager@example.com",
        email_normalized="manager@example.com",
        first_name="Manager",
        last_name="User",
        phone="+962722222222",
        role=RoleEnum.MANAGER,
        hashed_password="placeholder",
        is_active=True,
        nursery_id=nursery.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    supervisor = User(
        email="supervisor@example.com",
        email_normalized="supervisor@example.com",
        first_name="Supervisor",
        last_name="User",
        phone="+962733333333",
        role=RoleEnum.SUPERVISOR,
        hashed_password="placeholder",
        is_active=True,
        nursery_id=nursery.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add_all([parent, manager, supervisor])
    db_session.flush()

    children = [
        Child(
            first_name="Infant",
            last_name="One",
            date_of_birth=today - timedelta(days=180),
            gender="male",
            emergency_contact="Parent User",
            emergency_phone="+962711111111",
            classroom_id=classroom.id,
            parent_id=parent.id,
            nursery_id=nursery.id,
            status=ChildStatus.ACTIVE,
        ),
        Child(
            first_name="Toddler",
            last_name="Two",
            date_of_birth=today - timedelta(days=365 * 2),
            gender="female",
            emergency_contact="Parent User",
            emergency_phone="+962711111111",
            classroom_id=classroom.id,
            parent_id=parent.id,
            nursery_id=nursery.id,
            status=ChildStatus.ACTIVE,
        ),
        Child(
            first_name="Preschool",
            last_name="Three",
            date_of_birth=today - timedelta(days=365 * 4),
            gender="male",
            emergency_contact="Parent User",
            emergency_phone="+962711111111",
            classroom_id=classroom.id,
            parent_id=parent.id,
            nursery_id=nursery.id,
            status=ChildStatus.ACTIVE,
        ),
        Child(
            first_name="School",
            last_name="Four",
            date_of_birth=today - timedelta(days=365 * 6),
            gender="female",
            emergency_contact="Parent User",
            emergency_phone="+962711111111",
            classroom_id=classroom.id,
            parent_id=parent.id,
            nursery_id=nursery.id,
            status=ChildStatus.ACTIVE,
        ),
        Child(
            first_name="Inactive",
            last_name="Child",
            date_of_birth=today - timedelta(days=365),
            gender="male",
            emergency_contact="Parent User",
            emergency_phone="+962711111111",
            classroom_id=classroom.id,
            parent_id=parent.id,
            nursery_id=nursery.id,
            status=ChildStatus.INACTIVE,
        ),
    ]

    db_session.add_all(children)
    db_session.flush()

    recent_report = DailyReport(
        child_id=children[0].id,
        date=today,
        activities="Play time",
        meals="Lunch",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(recent_report)
    db_session.flush()

    return {
        "nursery": nursery,
        "branch": branch,
        "classroom": classroom,
        "children": children,
        "parent": parent,
        "manager": manager,
        "supervisor": supervisor,
    }


def obtain_token(client, email, password):
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_admin_analytics(client, analytics_dataset, admin_user):
    token = obtain_token(client, admin_user.email, "TestPass123!")
    response = client.get(
        "/system/analytics",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    payload = response.json()

    assert payload["totalNurseries"] == 1
    assert payload["activeNurseries"] == 1
    assert payload["totalUsers"] >= 4  # admin + manager + supervisor + parent
    assert payload["totalChildren"] == 4  # only active children counted
    assert payload["pendingReports"] == 1

    users_by_role = {entry["role"]: entry["count"] for entry in payload["usersByRole"]}
    assert users_by_role["admin"] >= 1
    assert users_by_role["manager"] >= 1
    assert users_by_role["supervisor"] >= 1
    assert users_by_role["parent"] >= 1

    age_groups = {entry["age_group"]: entry["count"] for entry in payload["childrenByAgeGroup"]}
    assert age_groups["0-1 years"] == 1
    assert age_groups["1-3 years"] == 1
    assert age_groups["3-5 years"] == 1
    assert age_groups["5+ years"] == 1

    governorates = {entry["governorate"]: entry["count"] for entry in payload["nurseriesByGovernorate"]}
    assert governorates["Amman"] == 1

    assert payload["recentLogins"]


def test_analytics_requires_auth(client):
    response = client.get("/system/analytics")
    assert response.status_code in (401, 403)
    body = response.json()
    assert "error" in body
    assert body["requestId"]
