#!/usr/bin/env python3
"""
Test admin analytics endpoint
"""
import requests
import json

API_BASE = "http://localhost:8000"

def test_admin_analytics():
    # Test login
    login_data = {
        'email': 'admin@nursery.com',
        'password': 'Admin123!'
    }

    print('Testing admin login...')
    response = requests.post(f'{API_BASE}/auth/login', json=login_data)
    if response.status_code == 200:
        token = response.json().get('access_token')
        print('✅ Admin login successful')

        # Test admin analytics
        headers = {'Authorization': f'Bearer {token}'}
        print('Testing admin analytics endpoint...')
        response = requests.get(f'{API_BASE}/admin/analytics', headers=headers)
        if response.status_code == 200:
            data = response.json()
            print('✅ Admin analytics endpoint working')
            print(f'   Total nurseries: {data.get("totalNurseries", 0)}')
            print(f'   Total users: {data.get("totalUsers", 0)}')
            print(f'   Total children: {data.get("totalChildren", 0)}')
            return True
        else:
            print(f'❌ Admin analytics failed: {response.status_code} - {response.text}')
            return False
    else:
        print(f'❌ Admin login failed: {response.status_code} - {response.text}')
        return False

if __name__ == "__main__":
    test_admin_analytics()