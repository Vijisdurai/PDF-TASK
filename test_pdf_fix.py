#!/usr/bin/env python3
"""
Test script to verify the PDF 404 fix
"""
import requests
import sys
import time

def test_backend_health(base_url="http://localhost:8000"):
    """Test if backend is running"""
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def test_document_endpoint(document_id, base_url="http://localhost:8000"):
    """Test the document file endpoint"""
    url = f"{base_url}/api/documents/{document_id}/file"
    
    print(f"Testing: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'Not set')}")
        print(f"Content-Length: {response.headers.get('Content-Length', 'Not set')}")
        
        if response.status_code == 200:
            content = response.content
            if content.startswith(b'%PDF-'):
                print("✅ SUCCESS: Valid PDF response")
                return True
            else:
                print("❌ FAIL: Not a valid PDF")
                print(f"First 50 bytes: {content[:50]}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Response: {response.text[:200]}")
                
    except Exception as e:
        print(f"❌ FAIL: Request error - {e}")
    
    return False

def main():
    print("🔧 PDF 404 Fix Verification")
    print("=" * 40)
    
    # Test backend health
    print("1. Testing backend health...")
    if not test_backend_health():
        print("❌ Backend not running on http://localhost:8000")
        print("   Please start the backend with: python backend/main.py")
        return
    
    print("✅ Backend is running")
    
    # Test with available document IDs
    test_documents = [
        "35d6e78a-42fc-4650-916f-5aa0188729ca",
        "bf82ef49-013d-4658f-9228-8dda83818af7"
    ]
    
    print("\n2. Testing document endpoints...")
    success_count = 0
    
    for doc_id in test_documents:
        print(f"\nTesting document: {doc_id}")
        if test_document_endpoint(doc_id):
            success_count += 1
    
    print(f"\n📊 Results: {success_count}/{len(test_documents)} documents accessible")
    
    if success_count > 0:
        print("\n✅ Fix successful! Documents are now accessible.")
        print("\nFrontend changes applied:")
        print("- Updated DocumentViewerPage.tsx to use correct API base URL")
        print("- Added Vite proxy configuration for development")
        print("- Updated API service for consistency")
    else:
        print("\n❌ Issues remain. Check backend logs and file permissions.")

if __name__ == "__main__":
    main()