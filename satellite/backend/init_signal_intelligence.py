"""
Database initialization script for Signal Intelligence upgrade
Rebuilds database schema with new tables.

Run this once to apply schema changes.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.models import init_db
from detection.quiet_zone_monitor import initialize_quiet_zones
from sqlalchemy.orm import Session
from database.models import SessionLocal

def main():
    print("=" * 60)
    print("SPACE ANOMALY RADAR - Signal Intelligence Upgrade")
    print("Database Schema Initialization")
    print("=" * 60)
    
    # Initialize database schema
    print("\n[1/3] Creating database tables...")
    try:
        init_db()
        print("✓ Database schema created successfully")
    except Exception as e:
        print(f"✗ Error creating schema: {e}")
        return
    
    # Initialize protected frequency bands
    print("\n[2/3] Initializing protected frequency bands...")
    db = SessionLocal()
    try:
        count = initialize_quiet_zones(db)
        if count > 0:
            print(f"✓ Initialized {count} protected frequency bands")
        else:
            print("✓ Frequency bands already initialized")
    except Exception as e:
        print(f"✗ Error initializing bands: {e}")
    finally:
        db.close()
    
    # Summary
    print("\n[3/3] Initialization complete!")
    print("\nNext steps:")
    print("  1. Start backend: uvicorn main:app --reload")
    print("  2. Update transmitter catalog: curl -X POST http://localhost:8000/api/transmitters/update")
    print("  3. Classify signals: curl -X POST http://localhost:8000/api/signals/classify/{event_id}")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
