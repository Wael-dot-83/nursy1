# Contributing to Nursery Management System

Thank you for your interest in contributing to the Nursery Management System! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Messages](#commit-messages)
7. [Pull Request Process](#pull-request-process)
8. [Documentation](#documentation)
9. [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or discriminatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Any conduct deemed inappropriate in a professional setting

## Getting Started

### Prerequisites

Before you start contributing, ensure you have:

- Git installed and configured
- Python 3.11+ installed
- Node.js 18+ installed
- A GitHub account
- Familiarity with the project (read README.md and SETUP_GUIDE.md)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nursery-system.git
   cd nursery-system
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/nursery-system.git
   ```

4. **Verify remotes**:
   ```bash
   git remote -v
   ```

### Environment Setup

Follow the [SETUP_GUIDE.md](SETUP_GUIDE.md) to set up your development environment.

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for a bug fix
git checkout -b fix/issue-description
```

**Branch Naming Convention**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates
- `chore/description` - Build process or tooling changes

### 2. Make Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

Before submitting:

```bash
# Backend tests
cd backend
pytest tests/ -v
black app/  # Format code
flake8 app/  # Lint code

# Frontend tests
cd frontend
npm test
npm run lint
npm run build  # Ensure it builds
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "type(scope): description"
```

See [Commit Messages](#commit-messages) for format details.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Fill in the PR template
4. Link any related issues
5. Request review from maintainers

## Coding Standards

### Python (Backend)

#### Style Guide

Follow PEP 8 with these specifics:

- **Line Length**: 120 characters max
- **Indentation**: 4 spaces
- **Quotes**: Double quotes for strings
- **Imports**: Group by standard library, third-party, local
- **Type Hints**: Use for all function signatures

**Example**:
```python
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserResponse


router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[User]:
    """
    Retrieve a list of users.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of users
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users
```

#### Code Formatting

Use **Black** for automatic formatting:

```bash
# Format all files
black app/

# Check without modifying
black app/ --check

# Format specific file
black app/main.py
```

#### Linting

Use **Flake8**:

```bash
# Lint all files
flake8 app/

# With specific rules
flake8 app/ --max-line-length=120 --exclude=venv
```

#### Type Checking

Use **mypy** for static type checking:

```bash
mypy app/
```

### JavaScript/React (Frontend)

#### Style Guide

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JS, double for JSX attributes
- **Semicolons**: Use them
- **Arrow Functions**: Prefer for callbacks
- **Components**: Use functional components with hooks

**Example**:
```javascript
import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../api';

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-list">
      {users.map(user => (
        <div key={user.id} className="user-item">
          {user.name}
        </div>
      ))}
    </div>
  );
};
```

#### Code Formatting

Use **Prettier**:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

#### Linting

Use **ESLint**:

```bash
# Lint all files
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## Testing Guidelines

### Backend Testing

#### Test Structure

```
tests/
├── __init__.py
├── conftest.py           # Shared fixtures
├── test_auth.py          # Authentication tests
├── test_models.py        # Model tests
├── test_api.py           # API endpoint tests
└── integration/          # Integration tests
    └── test_workflows.py
```

#### Writing Tests

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_user():
    """Test user creation endpoint"""
    response = client.post(
        "/users",
        json={
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "role": "PARENT"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"


@pytest.mark.parametrize("role,expected", [
    ("ADMIN", 200),
    ("MANAGER", 200),
    ("PARENT", 403),
])
def test_user_permissions(role, expected):
    """Test role-based permissions"""
    # Test implementation
    pass
```

#### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run tests matching pattern
pytest -k "test_user"

# Verbose output
pytest -v
```

### Frontend Testing

#### Test Structure

```
src/__tests__/
├── components/
│   ├── UserList.test.jsx
│   └── Dashboard.test.jsx
├── hooks/
│   └── useAPI.test.js
└── utils/
    └── validation.test.js
```

#### Writing Tests

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from '../components/UserList';

describe('UserList', () => {
  test('renders loading state initially', () => {
    render(<UserList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays users after loading', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('handles user click', async () => {
    const user = userEvent.setup();
    render(<UserList />);

    const userItem = await screen.findByText('John Doe');
    await user.click(userItem);

    expect(screen.getByText('User Details')).toBeInTheDocument();
  });
});
```

#### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test UserList.test.jsx

# Watch mode
npm test -- --watch
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```
feat(auth): add OAuth2 authentication

Implement OAuth2 authentication flow with Google and Facebook providers.
Includes token refresh and user profile sync.

Closes #123
```

```
fix(api): resolve CORS issue with file uploads

Updated CORS middleware to properly handle multipart/form-data requests.

Fixes #456
```

```
docs(api): update authentication endpoint documentation

Added examples for all authentication endpoints and clarified
error response formats.
```

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api)!: change user endpoint response format

BREAKING CHANGE: User endpoint now returns nested objects for
nursery and role information instead of IDs.

Migration guide: Update client code to access user.nursery.id
instead of user.nursery_id.
```

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commits follow conventional format
- [ ] Branch is up to date with main

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
Relates to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer reviews the code
3. **Feedback**: Address reviewer comments and push updates
4. **Approval**: PR approved by maintainer
5. **Merge**: Maintainer merges the PR

### After Merge

- Delete your feature branch
- Pull latest changes to your main branch
- Close related issues if applicable

## Documentation

### When to Update Documentation

Update documentation when you:
- Add new features
- Change API endpoints
- Modify configuration options
- Fix bugs that affect usage
- Add new dependencies

### Documentation Types

1. **Code Comments**: For complex logic
2. **Docstrings**: For all functions and classes
3. **README.md**: For project overview
4. **API_DOCUMENTATION.md**: For API changes
5. **USER_GUIDE.md**: For user-facing features
6. **SETUP_GUIDE.md**: For setup/configuration changes

### Writing Good Documentation

- Be clear and concise
- Include examples
- Use proper formatting
- Keep it up to date
- Test instructions before publishing

## Issue Reporting

### Before Creating an Issue

1. Search existing issues
2. Check if it's fixed in the latest version
3. Reproduce the issue
4. Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Python version: [e.g., 3.11.5]
- Node version: [e.g., 18.17.0]

**Additional context**
Any other relevant information.
```

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots about the feature.
```

## Questions?

If you have questions about contributing:

- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Contact the maintainers

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Happy Contributing! 🎉**
