#!/usr/bin/env python3
"""
Test script to verify PDF endpoint returns proper binary data
"""
import requests
import sys

def test_pdf_endpoint(document_id, base_url="http://localhost:8000"):
    """Test the PDF endpoint for proper response"""
    url = f"{base_url}/api/documents/{document_id}/file"
    
    print(f"Testing PDF endpoint: {url}")
    
    try:
        response = requests.get(url, headers={'Accept': 'application/pdf'})
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Length: {response.headers.get('Content-Length')}")
        
        if response.status_code == 200:
            # Check if it's actually a PDF
            content = response.content
            if content.startswith(b'%PDF-'):
                print("✅ Valid PDF response - starts with %PDF- signature")
                print(f"✅ File size: {len(content)} bytes")
            else:
                print("❌ Invalid PDF - missing %PDF- signature")
                print(f"First 50 bytes: {content[:50]}")
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_pdf_endpoint.py <document_id>")
        sys.exit(1)
    
    document_id = sys.argv[1]
    test_pdf_endpoint(document_id)