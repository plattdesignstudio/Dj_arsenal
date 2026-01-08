#!/usr/bin/env python3
"""
Comprehensive API Sanity Test Suite
Tests all integrations: Spotify, OpenAI, SERPAPI, and Dashboard endpoints
"""

import os
import sys
import asyncio
import httpx
from typing import Dict, List, Any
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

BASE_URL = os.getenv("API_URL", "http://localhost:8000")
TIMEOUT = 30.0

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ {text}{Colors.RESET}")

class APITester:
    def __init__(self):
        self.results = {
            "passed": [],
            "failed": [],
            "warnings": []
        }
        # Disable SSL verification for local testing
        self.client = httpx.AsyncClient(timeout=TIMEOUT, verify=False)
    
    async def test_backend_health(self) -> bool:
        """Test if backend is running"""
        print_header("Testing Backend Health")
        try:
            response = await self.client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print_success(f"Backend is healthy: {response.json()}")
                self.results["passed"].append("Backend Health")
                return True
            else:
                print_error(f"Backend returned status {response.status_code}")
                self.results["failed"].append("Backend Health")
                return False
        except Exception as e:
            print_error(f"Cannot connect to backend: {e}")
            print_info("Make sure backend is running: cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
            self.results["failed"].append("Backend Health")
            return False
    
    async def test_spotify_auth(self) -> bool:
        """Test Spotify authentication"""
        print_header("Testing Spotify Integration")
        
        client_id = os.getenv("SPOTIFY_CLIENT_ID")
        client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            print_warning("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not set")
            self.results["warnings"].append("Spotify Credentials Missing")
            return False
        
        print_info(f"Spotify Client ID: {client_id[:10]}...")
        
        try:
            # Test Spotify service token endpoint
            response = await self.client.get(f"{BASE_URL}/api/trending/spotify")
            if response.status_code == 200:
                data = response.json()
                tracks = data.get("tracks", [])
                print_success(f"Spotify API working! Retrieved {len(tracks)} tracks")
                if tracks:
                    track = tracks[0]
                    print_info(f"Sample track: {track.get('title', 'N/A')} by {track.get('artist', 'N/A')}")
                    if track.get('album_image_url'):
                        print_success("Album art URLs are available")
                    else:
                        print_warning("No album art URLs in response")
                self.results["passed"].append("Spotify API")
                return True
            else:
                print_error(f"Spotify API returned status {response.status_code}: {response.text}")
                self.results["failed"].append("Spotify API")
                return False
        except Exception as e:
            print_error(f"Spotify API test failed: {e}")
            self.results["failed"].append("Spotify API")
            return False
    
    async def test_spotify_search(self) -> bool:
        """Test Spotify track search"""
        print_header("Testing Spotify Search")
        
        try:
            response = await self.client.get(
                f"{BASE_URL}/api/tracks/search",
                params={"q": "Daft Punk", "limit": 5}
            )
            if response.status_code == 200:
                data = response.json()
                tracks = data.get("tracks", [])
                print_success(f"Spotify search working! Found {len(tracks)} tracks")
                if tracks:
                    track = tracks[0]
                    print_info(f"Sample: {track.get('title')} by {track.get('artist')}")
                self.results["passed"].append("Spotify Search")
                return True
            else:
                print_error(f"Search returned status {response.status_code}")
                self.results["failed"].append("Spotify Search")
                return False
        except Exception as e:
            print_error(f"Spotify search failed: {e}")
            self.results["failed"].append("Spotify Search")
            return False
    
    async def test_trending_tracks(self) -> bool:
        """Test trending tracks endpoint"""
        print_header("Testing Trending Tracks")
        
        try:
            response = await self.client.get(f"{BASE_URL}/api/trending")
            if response.status_code == 200:
                data = response.json()
                tracks = data.get("tracks", [])
                print_success(f"Trending tracks working! Retrieved {len(tracks)} tracks")
                if tracks:
                    track = tracks[0]
                    print_info(f"Top track: {track.get('title')} by {track.get('artist')}")
                self.results["passed"].append("Trending Tracks")
                return True
            else:
                print_error(f"Trending tracks returned status {response.status_code}")
                self.results["failed"].append("Trending Tracks")
                return False
        except Exception as e:
            print_error(f"Trending tracks failed: {e}")
            self.results["failed"].append("Trending Tracks")
            return False
    
    async def test_serpapi_fallback(self) -> bool:
        """Test SERPAPI integration (fallback for trending)"""
        print_header("Testing SERPAPI Integration")
        
        serpapi_key = os.getenv("SERPAPI_KEY")
        if not serpapi_key:
            print_warning("SERPAPI_KEY not set - this is optional for trending tracks fallback")
            self.results["warnings"].append("SERPAPI Key Missing (Optional)")
            return False
        
        print_info("SERPAPI key is set (used as fallback for trending tracks)")
        self.results["passed"].append("SERPAPI Key Present")
        return True
    
    async def test_openai_integration(self) -> bool:
        """Test OpenAI API integration"""
        print_header("Testing OpenAI Integration")
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print_warning("OPENAI_API_KEY not set")
            self.results["warnings"].append("OpenAI API Key Missing")
            return False
        
        print_info(f"OpenAI API Key: {api_key[:10]}...")
        
        try:
            # Test DJ Intelligence endpoint
            response = await self.client.post(
                f"{BASE_URL}/api/ai/dj-intel/query",
                json={
                    "query": "What should I play next?",
                    "current_bpm": 128,
                    "current_key": "C",
                    "current_energy": 7,
                    "event_type": "club",
                    "time_of_night": "peak",
                    "crowd_vibe": "energetic"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success("OpenAI DJ Intelligence working!")
                if "response" in data:
                    print_info(f"Response preview: {data['response'][:100]}...")
                if "total_tokens" in data:
                    print_info(f"Tokens used: {data['total_tokens']}")
                self.results["passed"].append("OpenAI DJ Intelligence")
                return True
            else:
                print_error(f"OpenAI API returned status {response.status_code}: {response.text}")
                self.results["failed"].append("OpenAI DJ Intelligence")
                return False
        except Exception as e:
            print_error(f"OpenAI test failed: {e}")
            self.results["failed"].append("OpenAI DJ Intelligence")
            return False
    
    async def test_ai_recommendations(self) -> bool:
        """Test AI track recommendations"""
        print_header("Testing AI Recommendations")
        
        try:
            response = await self.client.post(
                f"{BASE_URL}/api/ai/recommend",
                json={
                    "current_track_id": "test",
                    "target_energy": 8,
                    "target_bpm": 130
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success("AI Recommendations working!")
                if "recommendations" in data:
                    print_info(f"Got {len(data['recommendations'])} recommendations")
                self.results["passed"].append("AI Recommendations")
                return True
            elif response.status_code == 404:
                print_warning("AI Recommendations endpoint not found (may not be implemented)")
                self.results["warnings"].append("AI Recommendations Endpoint")
                return False
            else:
                print_error(f"AI Recommendations returned status {response.status_code}")
                self.results["failed"].append("AI Recommendations")
                return False
        except Exception as e:
            print_error(f"AI Recommendations failed: {e}")
            self.results["failed"].append("AI Recommendations")
            return False
    
    async def test_dashboard_endpoints(self) -> bool:
        """Test dashboard data endpoints"""
        print_header("Testing Dashboard Endpoints")
        
        endpoints = [
            ("/api/sets", "Sets"),
            ("/api/personas", "Personas"),
            ("/api/tracks", "Tracks"),
        ]
        
        all_passed = True
        for endpoint, name in endpoints:
            try:
                response = await self.client.get(f"{BASE_URL}{endpoint}")
                if response.status_code == 200:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else 1
                    print_success(f"{name} endpoint working! ({count} items)")
                    self.results["passed"].append(f"Dashboard: {name}")
                else:
                    print_error(f"{name} returned status {response.status_code}")
                    self.results["failed"].append(f"Dashboard: {name}")
                    all_passed = False
            except Exception as e:
                print_error(f"{name} failed: {e}")
                self.results["failed"].append(f"Dashboard: {name}")
                all_passed = False
        
        return all_passed
    
    async def test_flow_engine(self) -> bool:
        """Test flow engine endpoint"""
        print_header("Testing Flow Engine")
        
        try:
            # First get a set
            sets_response = await self.client.get(f"{BASE_URL}/api/sets")
            if sets_response.status_code == 200:
                sets = sets_response.json()
                if sets and len(sets) > 0:
                    set_id = sets[0]["id"]
                    response = await self.client.get(f"{BASE_URL}/api/flow/energy-curve/{set_id}")
                    if response.status_code == 200:
                        print_success("Flow Engine working!")
                        self.results["passed"].append("Flow Engine")
                        return True
                    else:
                        print_warning(f"Flow Engine returned status {response.status_code} (may need tracks in set)")
                        self.results["warnings"].append("Flow Engine")
                        return False
                else:
                    print_warning("No sets found - cannot test flow engine")
                    self.results["warnings"].append("Flow Engine (No Sets)")
                    return False
            else:
                print_warning("Cannot get sets for flow engine test")
                self.results["warnings"].append("Flow Engine")
                return False
        except Exception as e:
            print_error(f"Flow Engine test failed: {e}")
            self.results["warnings"].append("Flow Engine")
            return False
    
    async def run_all_tests(self):
        """Run all tests"""
        print_header("DJ Arsenal API Sanity Test Suite")
        print_info(f"Testing against: {BASE_URL}")
        print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Check backend first
        if not await self.test_backend_health():
            print_error("\nBackend is not running! Please start it first.")
            print_info("Start backend: cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
            return
        
        # Run all tests
        await self.test_spotify_auth()
        await self.test_spotify_search()
        await self.test_trending_tracks()
        await self.test_serpapi_fallback()
        await self.test_openai_integration()
        await self.test_ai_recommendations()
        await self.test_dashboard_endpoints()
        await self.test_flow_engine()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print_header("Test Summary")
        
        total = len(self.results["passed"]) + len(self.results["failed"]) + len(self.results["warnings"])
        passed = len(self.results["passed"])
        failed = len(self.results["failed"])
        warnings = len(self.results["warnings"])
        
        print(f"\n{Colors.BOLD}Total Tests: {total}{Colors.RESET}")
        print(f"{Colors.GREEN}Passed: {passed}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {failed}{Colors.RESET}")
        print(f"{Colors.YELLOW}Warnings: {warnings}{Colors.RESET}\n")
        
        if self.results["passed"]:
            print(f"{Colors.GREEN}{Colors.BOLD}✓ Passed Tests:{Colors.RESET}")
            for test in self.results["passed"]:
                print(f"  {Colors.GREEN}✓ {test}{Colors.RESET}")
        
        if self.results["failed"]:
            print(f"\n{Colors.RED}{Colors.BOLD}✗ Failed Tests:{Colors.RESET}")
            for test in self.results["failed"]:
                print(f"  {Colors.RED}✗ {test}{Colors.RESET}")
        
        if self.results["warnings"]:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠ Warnings:{Colors.RESET}")
            for test in self.results["warnings"]:
                print(f"  {Colors.YELLOW}⚠ {test}{Colors.RESET}")
        
        print(f"\n{Colors.BOLD}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}\n")
        
        if failed == 0:
            print(f"{Colors.GREEN}{Colors.BOLD}🎉 All critical tests passed!{Colors.RESET}\n")
        else:
            print(f"{Colors.RED}{Colors.BOLD}⚠ Some tests failed. Check the errors above.{Colors.RESET}\n")
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

async def main():
    tester = APITester()
    try:
        await tester.run_all_tests()
    finally:
        await tester.close()

if __name__ == "__main__":
    asyncio.run(main())

