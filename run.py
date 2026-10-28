#!/usr/bin/env python3
"""
PrivacyLens — Application Launcher
AIORI Hackathon 3 (Problem Statement PS-019)
Personal-Data Discovery and Privacy Evidence Inventory
"""

import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def setup_environment():
    print("=" * 70)
    print("  PrivacyLens — Personal-Data Discovery & Privacy Evidence Inventory")
    print("  AIORI Hackathon 3 (Problem Statement PS-019)")
    print("=" * 70)

    # 1. Setup sample enterprise SQLite database if missing
    db_file = BASE_DIR / "sample_data" / "sample_enterprise.db"
    if not db_file.exists():
        print("[*] Generating synthetic sample enterprise database...")
        from sample_data.setup_sample_database import setup_database
        setup_database()

    # 2. Seed initial demo datasets and metadata register
    print("[*] Initializing PrivacyLens database and metadata register...")
    from backend.app.core.init_db import seed_demo_data
    seed_demo_data()

    print("[+] Initialization complete!")
    print("\nStarting PrivacyLens Full-Stack Application Server:")
    print("  -> Application Web UI:   http://127.0.0.1:8000")
    print("  -> Interactive API Docs: http://127.0.0.1:8000/docs")
    print("  -> ReDoc API Docs:       http://127.0.0.1:8000/redoc")
    print("  -> Health Check:         http://127.0.0.1:8000/api/health")
    print("=" * 70)
    print("Press CTRL+C to stop the server.\n")

def main():
    setup_environment()
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
