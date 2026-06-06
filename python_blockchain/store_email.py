#!/usr/bin/env python3
"""
VendorBridge ERP — User Email Storage Script
Description: Accepts, validates, and stores user emails securely using parameterized queries.
             Ensures database compatibility, handles duplicates, and integrates with the
             blockchain ledger engine.
"""

import os
import sys
import re
import sqlite3

# Import BlockchainDB database connection wrapper
try:
    from blockchain_db import BlockchainDB
except ImportError:
    # Fallback to local import if executed differently
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from blockchain_db import BlockchainDB

# Robust regular expression for email address validation
EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

def validate_email(email):
    """
    Validates an email address against a robust regular expression format.
    Returns True if valid, False otherwise.
    """
    return bool(re.match(EMAIL_REGEX, email))

def main():
    # 1. Input Processing
    # Accept the email address via command-line arguments or interactive input prompt
    if len(sys.argv) > 1:
        email = sys.argv[1].strip()
    else:
        email = input("Enter email address: ").strip()

    # 2. Email Format Validation
    # Validate the format using the regular expression
    if not validate_email(email):
        print("Invalid Email → Validation Error")
        sys.exit(1)

    db = None
    try:
        # 3. Database Initialization
        # Instantiate BlockchainDB which connects to sqlite3 database
        db = BlockchainDB()
        cursor = db.conn.cursor()

        # 4. Duplicate Check
        # Perform secure parameterized query to check if the email exists in users table
        cursor.execute("SELECT email FROM users WHERE email = ?;", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            print("Duplicate Email → Email Already Exists")
            sys.exit(0)

        # 5. Insert Valid Email
        # Prepare default parameters to ensure users table schema compatibility
        default_password = "DefaultPassword123"
        default_role = "vendor"
        # Generate name display by splitting and title-casing the email prefix
        calculated_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').title()

        # Insert the user and seal it into the blockchain ledger database table
        db.insert_user(
            email=email,
            password=default_password,
            role=default_role,
            name=calculated_name,
            operator="System"
        )
        print("Valid Email → Stored Successfully")

        # 6. Retrieve and Display the Saved Email
        # Perform secure parameterized query to verify and retrieve saved record
        cursor.execute("SELECT email FROM users WHERE email = ?;", (email,))
        retrieved_record = cursor.fetchone()
        if retrieved_record:
            retrieved_email = retrieved_record['email']
            print(f"Stored Email → Display Retrieved Email from Database: {retrieved_email}")
            print(f"Stored Email → {retrieved_email}")

    except sqlite3.Error as se:
        # Error handling for database specific issues
        print(f"Database Error: Failed to perform operations safely. {se}")
        sys.exit(1)
    except Exception as e:
        # General exception handling
        print(f"Error: An unexpected error occurred: {e}")
        sys.exit(1)
    finally:
        # Ensure database connection is closed properly in all execution paths
        if db:
            db.close()

if __name__ == "__main__":
    main()
