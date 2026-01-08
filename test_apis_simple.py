#!/usr/bin/env python3
"""
Simple API Test - Tests backend endpoints using urllib (built-in)
"""

import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(name, method, url, data=None):
    """Test a single endpoint"""
    try:
        req = urllib.request.Request(url)
        if method == "POST" and data:
            req.add_header('Content-Type', 'application/json')
            data_bytes = json.dumps(data).encode('utf-8')
            req.data = data_bytes
        
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                print(f"✅ {name}: OK")
                return True
            else:
                print(f"❌ {name}: Status {response.status}")
                return False
    except urllib.error.URLError as e:
        if "Connection refused" in str(e) or "Errno 61" in str(e):
            print(f"❌ {name}: Connection refused - Backend not running on port 8000")
        else:
            print(f"❌ {name}: Error - {e}")
        return False
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
        return False

def main():
    print("\n" + "="*60)
    print("DJ Arsenal API Sanity Test")
    print("="*60 + "\n")
    
    results = []
    
    # Test backend health
    results.append(("Backend Health", test_endpoint("Backend Health", "GET", f"{BASE_URL}/health")))
    
    # Test trending endpoints
    results.append(("Trending Tracks", test_endpoint("Trending Tracks", "GET", f"{BASE_URL}/api/trending")))
    results.append(("Spotify Top Charts", test_endpoint("Spotify Top Charts", "GET", f"{BASE_URL}/api/trending/spotify")))
    results.append(("Spotify Featured", test_endpoint("Spotify Featured", "GET", f"{BASE_URL}/api/trending/spotify-featured?limit=20&market=US")))
    
    # Test dashboard endpoints
    results.append(("Sets API", test_endpoint("Sets API", "GET", f"{BASE_URL}/api/sets")))
    results.append(("Personas API", test_endpoint("Personas API", "GET", f"{BASE_URL}/api/personas")))
    results.append(("Tracks API", test_endpoint("Tracks API", "GET", f"{BASE_URL}/api/tracks")))
    
    # Test OpenAI endpoint
    results.append(("OpenAI DJ Intelligence", test_endpoint(
        "OpenAI DJ Intelligence", 
        "POST", 
        f"{BASE_URL}/api/ai/dj-intel/query",
        data={
            "query": "What should I play next?",
            "current_bpm": 128,
            "current_key": "C",
            "current_energy": 7
        }
    )))
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed")
        print("\nFailed tests:")
        for name, result in results:
            if not result:
                print(f"  - {name}")
    
    print("\n" + "="*60 + "\n")
    
    # Return exit code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
