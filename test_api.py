import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'nursery-system', 'backend'))

from fastapi.testclient import TestClient
from app.main import app

# Create test client
client = TestClient(app)

def test_root():
    """Test the root endpoint"""
    response = client.get("/")
    print(f"Root endpoint status: {response.status_code}")
    print(f"Root endpoint response: {response.json()}")
    return response

def test_health():
    """Test the health endpoint"""
    response = client.get("/health")
    print(f"Health endpoint status: {response.status_code}")
    print(f"Health endpoint response: {response.json()}")
    return response

def test_nurseries():
    """Test the nurseries endpoint"""
    response = client.get("/admin/")
    print(f"Nurseries endpoint status: {response.status_code}")
    print(f"Nurseries endpoint response: {response.json()}")
    return response

if __name__ == "__main__":
    print("Testing FastAPI endpoints with TestClient...")

    try:
        test_root()
        print()
        test_health()
        print()
        test_nurseries()
        print()
        print("All tests completed successfully!")
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()