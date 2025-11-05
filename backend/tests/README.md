# Backend Tests

This directory contains unit tests for the Document Annotation System backend.

## Test Structure

- `conftest.py` - Test configuration and fixtures
- `test_models.py` - Tests for SQLAlchemy database models
- `test_schemas.py` - Tests for Pydantic validation schemas

## Running Tests

1. Install test dependencies:
   ```bash
   pip install -r requirements-dev.txt
   ```

2. Run all tests:
   ```bash
   python -m pytest tests/ -v
   ```

3. Run specific test files:
   ```bash
   python -m pytest tests/test_models.py -v
   python -m pytest tests/test_schemas.py -v
   ```

## Test Coverage

### Models (`test_models.py`)
- Document model creation and validation
- Annotation model creation and validation
- Model relationships and cascade deletion
- ID generation and timestamps

### Schemas (`test_schemas.py`)
- Pydantic schema validation
- Field constraints and error handling
- Content validation and trimming
- Boundary value testing

## Test Database

Tests use an in-memory SQLite database that is created fresh for each test function, ensuring test isolation and fast execution.