#!/usr/bin/env python3
"""
VendorBridge ERP — Blockchain-Secured SQL Database Engine
Language: Python 3.14+ (or compatible)
Database: SQLite3
Description: Incorporates cryptographic block hashing to verify SQL entries and prevent
             unauthorized modifications. Enforces strict admin permission logic.
"""

import os
import sys
import sqlite3
import hashlib
import json
import re
from datetime import datetime

# Define paths relative to this file's folder
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(SCRIPT_DIR, "vendorbridge.db")
SCHEMA_PATH = os.path.join(PROJECT_DIR, "sql", "schema.sql")

class BlockchainDB:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_db()
    def hash_password(self, password):
        """Hashes a password using SHA-256."""
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

    def _init_db(self):
        """Initializes tables using schema.sql if it exists, or fallback inline definition."""
        cursor = self.conn.cursor()
        
        # Check if blockchain_ledger exists, if not initialize schema
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='blockchain_ledger';")
        has_ledger = cursor.fetchone() is not None
        
        if not has_ledger:
            print("[System] Initializing database schema...")
            if os.path.exists(SCHEMA_PATH):
                with open(SCHEMA_PATH, "r") as f:
                    schema_sql = f.read()
                cursor.executescript(schema_sql)
                self.conn.commit()
                print(f"[System] Schema successfully loaded from {SCHEMA_PATH}")
            else:
                # Fallback inline schema creation
                fallback_sql = """
                CREATE TABLE IF NOT EXISTS vendors (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    contact TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    gst TEXT NOT NULL,
                    category TEXT NOT NULL,
                    status TEXT NOT NULL,
                    address TEXT,
                    rating REAL DEFAULT 0.0,
                    total_orders INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    icon TEXT,
                    user TEXT NOT NULL,
                    role TEXT NOT NULL,
                    action TEXT NOT NULL,
                    target TEXT NOT NULL,
                    time TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS blockchain_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    block_index INTEGER NOT NULL UNIQUE,
                    timestamp TEXT NOT NULL,
                    action TEXT NOT NULL,
                    user TEXT NOT NULL,
                    data TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    hash TEXT NOT NULL
                );
                """
                cursor.executescript(fallback_sql)
                self.conn.commit()

        # ALWAYS ensure users table exists (for upgrades of existing db files)
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if cursor.fetchone() is None:
            cursor.execute("""
            CREATE TABLE users (
                email TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                name TEXT NOT NULL
            );
            """)
            self.conn.commit()

        # Seed default users if empty
        cursor.execute("SELECT COUNT(*) FROM users;")
        if cursor.fetchone()[0] == 0:
            print("[System] Seeding pre-registered users...")
            default_users = [
                ("admin@gmail.com", self.hash_password("Admin@123"), "admin", "Admin User"),
                ("officer@gmail.com", self.hash_password("Officer@123"), "procurement", "Procurement Officer"),
                ("manager@gmail.com", self.hash_password("Manager@123"), "manager", "Manager"),
                ("vendor@gmail.com", self.hash_password("Vendor@123"), "vendor", "Vendor")
            ]
            for u in default_users:
                cursor.execute(
                    "INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?);",
                    u
                )
            self.conn.commit()
            print("[System] Users seeded successfully.")

        # Seed Genesis Block if ledger is empty
        cursor.execute("SELECT COUNT(*) FROM blockchain_ledger;")
        if cursor.fetchone()[0] == 0:
            self._create_genesis_block()
    def _create_genesis_block(self):
        """Creates the first block in the blockchain ledger."""
        cursor = self.conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        action = "GENESIS"
        user = "System"
        data = json.dumps({"message": "VendorBridge ERP Blockchain Secured Ledger Initialized"})
        prev_hash = "0" * 64
        
        # Hash computation
        block_string = f"0{timestamp}{action}{user}{data}{prev_hash}"
        block_hash = hashlib.sha256(block_string.encode('utf-8')).hexdigest()

        cursor.execute(
            "INSERT INTO blockchain_ledger (block_index, timestamp, action, user, data, previous_hash, hash) VALUES (?, ?, ?, ?, ?, ?, ?);",
            (0, timestamp, action, user, data, prev_hash, block_hash)
        )
        self.conn.commit()
        print("[System] Genesis Block #0 successfully created.")

    def compute_hash(self, index, timestamp, action, user, data, prev_hash):
        """Computes SHA-256 hash for a block's parameters."""
        block_string = f"{index}{timestamp}{action}{user}{data}{prev_hash}"
        return hashlib.sha256(block_string.encode('utf-8')).hexdigest()

    def add_block(self, action, user, payload):
        """Helper to append a new block to the blockchain ledger database table."""
        cursor = self.conn.cursor()
        
        # Get the latest block
        cursor.execute("SELECT * FROM blockchain_ledger ORDER BY block_index DESC LIMIT 1;")
        last_block = cursor.fetchone()
        
        next_index = last_block['block_index'] + 1
        prev_hash = last_block['hash']
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Normalize and serialize data payload
        data_str = json.dumps(payload, sort_keys=True)
        
        # Compute next hash
        new_hash = self.compute_hash(next_index, timestamp, action, user, data_str, prev_hash)
        
        # Insert Block
        cursor.execute(
            "INSERT INTO blockchain_ledger (block_index, timestamp, action, user, data, previous_hash, hash) VALUES (?, ?, ?, ?, ?, ?, ?);",
            (next_index, timestamp, action, user, data_str, prev_hash, new_hash)
        )
        return next_index

    def verify_user(self, email, password, role):
        """Verifies user email, password, and role selector."""
        cursor = self.conn.cursor()
        hashed = self.hash_password(password)
        cursor.execute("SELECT * FROM users WHERE email = ? AND password_hash = ? AND role = ?;", (email, hashed, role))
        return cursor.fetchone()

    def insert_user(self, email, password, role, name, operator="System"):
        """Registers a new user and seals the transaction in the ledger."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT email FROM users WHERE email = ?;", (email,))
        if cursor.fetchone():
            raise ValueError(f"User '{email}' already exists.")
        
        hashed = self.hash_password(password)
        try:
            cursor.execute(
                "INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?);",
                (email, hashed, role, name)
            )
            payload = {
                "table": "users",
                "operation": "INSERT",
                "fields": {
                    "email": email,
                    "role": role,
                    "name": name
                }
            }
            self.add_block("INSERT_USER", operator, payload)
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            raise e

    # --- Vendor Operations ---
    def insert_vendor(self, vendor_id, name, contact, email, phone, gst, category, status, address="", rating=0.0, total_orders=0, operator="System"):
        """Inserts a new vendor and seals the transaction in the blockchain ledger."""
        cursor = self.conn.cursor()
        
        # Verify vendor uniqueness
        cursor.execute("SELECT id FROM vendors WHERE id = ?;", (vendor_id,))
        if cursor.fetchone():
            raise ValueError(f"Vendor with ID '{vendor_id}' already exists.")

        try:
            # SQL Insert for Vendor
            cursor.execute(
                "INSERT INTO vendors (id, name, contact, email, phone, gst, category, status, address, rating, total_orders) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                (vendor_id, name, contact, email, phone, gst, category, status, address, rating, total_orders)
            )
            
            # SQL Insert for Activity Log
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO activity_log (type, icon, user, role, action, target, time) VALUES (?, ?, ?, ?, ?, ?, ?);",
                ("create", "add_circle", operator, "User", f"registered new vendor", f"{name} ({vendor_id})", timestamp_str)
            )
            
            # Create block transaction payload
            payload = {
                "table": "vendors",
                "operation": "INSERT",
                "fields": {
                    "id": vendor_id,
                    "name": name,
                    "contact": contact,
                    "email": email,
                    "phone": phone,
                    "gst": gst,
                    "category": category,
                    "status": status,
                    "address": address,
                    "rating": rating,
                    "total_orders": total_orders
                }
            }
            
            # Append to blockchain ledger within same transaction
            self.add_block("INSERT_VENDOR", operator, payload)
            self.conn.commit()
            print(f"[Success] Vendor '{name}' inserted and secured via blockchain.")
        except Exception as e:
            self.conn.rollback()
            raise e

    def delete_vendor(self, vendor_id, operator="System"):
        """Deletes a vendor record and seals the action in the blockchain ledger."""
        cursor = self.conn.cursor()
        
        cursor.execute("SELECT * FROM vendors WHERE id = ?;", (vendor_id,))
        vendor = cursor.fetchone()
        if not vendor:
            raise ValueError(f"Vendor with ID '{vendor_id}' does not exist.")
            
        try:
            # Delete record
            cursor.execute("DELETE FROM vendors WHERE id = ?;", (vendor_id,))
            
            # Log Activity
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO activity_log (type, icon, user, role, action, target, time) VALUES (?, ?, ?, ?, ?, ?, ?);",
                ("delete", "delete_forever", operator, "User", "deleted vendor record", f"ID: {vendor_id}", timestamp_str)
            )
            
            payload = {
                "table": "vendors",
                "operation": "DELETE",
                "fields": {
                    "id": vendor_id,
                    "name": vendor['name']
                }
            }
            
            self.add_block("DELETE_VENDOR", operator, payload)
            self.conn.commit()
            print(f"[Success] Vendor with ID '{vendor_id}' deleted and logged in the blockchain.")
        except Exception as e:
            self.conn.rollback()
            raise e

    # --- Activity Log Operations ---
    def delete_activity_log(self, log_id, operator, operator_role):
        """
        Deletes a specific log record from activity_log.
        CRITICAL: ONLY Admin is authorized to perform this operation.
        """
        if operator_role.lower() != "admin":
            raise PermissionError(f"Access Denied: Role '{operator_role}' is not authorized to delete events. Only 'Admin' is authorized.")
            
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM activity_log WHERE id = ?;", (log_id,))
        log_entry = cursor.fetchone()
        if not log_entry:
            raise ValueError(f"Log entry with ID '{log_id}' does not exist.")

        try:
            # Delete record
            cursor.execute("DELETE FROM activity_log WHERE id = ?;", (log_id,))
            
            payload = {
                "table": "activity_log",
                "operation": "DELETE",
                "fields": {
                    "id": log_id,
                    "user": log_entry['user'],
                    "action": log_entry['action'],
                    "target": log_entry['target']
                }
            }
            
            self.add_block("DELETE_LOG", operator, payload)
            self.conn.commit()
            print(f"[Success] Log entry ID {log_id} deleted by Admin and secured in blockchain ledger.")
        except Exception as e:
            self.conn.rollback()
            raise e

    # --- Verification & Auditing ---
    def verify_chain_integrity(self):
        """
        Verifies the cryptographic integrity of the entire database ledger.
        Ensures that blocks are perfectly linked and hashes haven't been tampered with.
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM blockchain_ledger ORDER BY block_index ASC;")
        blocks = cursor.fetchall()
        
        if not blocks:
            return True, "Blockchain ledger is empty."

        # Check genesis block hash
        genesis = blocks[0]
        if genesis['block_index'] != 0:
            return False, "Error: Genesis block index mismatch."
        if genesis['previous_hash'] != "0" * 64:
            return False, "Error: Genesis block previous_hash is corrupted."
            
        calculated_genesis_hash = self.compute_hash(
            genesis['block_index'],
            genesis['timestamp'],
            genesis['action'],
            genesis['user'],
            genesis['data'],
            genesis['previous_hash']
        )
        if genesis['hash'] != calculated_genesis_hash:
            return False, f"Corrupted genesis block! DB Hash: {genesis['hash']}, Calculated Hash: {calculated_genesis_hash}"

        # Loop through the rest of the chain
        for i in range(1, len(blocks)):
            prev_block = blocks[i - 1]
            curr_block = blocks[i]
            
            # Check linkage
            if curr_block['previous_hash'] != prev_block['hash']:
                return False, f"Broken Chain Linkage at Block #{curr_block['block_index']}! Block's previous_hash doesn't match hash of Block #{prev_block['block_index']}."
            
            # Recalculate hash of current block
            calc_hash = self.compute_hash(
                curr_block['block_index'],
                curr_block['timestamp'],
                curr_block['action'],
                curr_block['user'],
                curr_block['data'],
                curr_block['previous_hash']
            )
            
            if curr_block['hash'] != calc_hash:
                return False, f"Corrupted Block Data at Block #{curr_block['block_index']}! Calculated Hash {calc_hash} != Stored Hash {curr_block['hash']}"
                
        return True, f"Integrity verification succeeded! Verified {len(blocks)} blocks. Chain is 100% secure."

    def fetch_vendors(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM vendors ORDER BY id ASC;")
        return cursor.fetchall()

    def fetch_activity_logs(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM activity_log ORDER BY id DESC;")
        return cursor.fetchall()

    def fetch_blockchain_ledger(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM blockchain_ledger ORDER BY block_index ASC;")
        return cursor.fetchall()

    def close(self):
        self.conn.close()

# --- Validator Utilities ---
def is_valid_email(email):
    """Regex-based email format validator."""
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(email_regex, email))

def is_valid_password(password):
    """
    Enforce security credentials rule:
    Must contain at least 6 characters, including 1 letter and 1 digit.
    """
    if len(password) < 6:
        return False
    if not any(c.isalpha() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True

# --- Interactive CLI ---
def print_banner():
    print("=" * 70)
    print("  VENDORBRIDGE ERP — BLOCKCHAIN SECURED SQL LEDGER INTERFACE  ")
    print("=" * 70)

def main():
    db = BlockchainDB()
    
    print_banner()
    print("[Session Setup] Please enter credentials to authorize database edits.")
    
    # 1. Log in Simulation & Input Validation
    while True:
        email = input("Enter email: ").strip()
        if not is_valid_email(email):
            print("[Error] Invalid email address format. Try again (e.g. admin@vendorbridge.com).")
            continue
        break
        
    while True:
        password = input("Enter password: ").strip()
        if not is_valid_password(password):
            print("[Error] Weak password! Must be at least 6 characters, containing a letter and a digit.")
            continue
        break
        
    # Role Selection
    roles = ["Admin", "Procurement Officer", "Manager", "Vendor"]
    role_keys = ["admin", "procurement", "manager", "vendor"]
    print("\nSelect User Role:")
    for idx, r in enumerate(roles, 1):
        print(f"  {idx}. {r}")
    
    while True:
        try:
            role_choice = int(input("Enter choice (1-4): "))
            if 1 <= role_choice <= 4:
                role = role_keys[role_choice - 1]
                role_label = roles[role_choice - 1]
                break
            print("[Error] Choice must be between 1 and 4.")
        except ValueError:
            print("[Error] Please enter a valid number.")

    user_record = db.verify_user(email, password, role)
    if not user_record:
        print("[Error] Login failed! Invalid email, password, or role selector choice.")
        db.close()
        sys.exit(1)

    operator_name = user_record['name']
    print(f"\nWelcome, {operator_name}! You are authenticated as role: '{role_label}'\n")

    # Main Action Loop
    while True:
        print("\n" + "-" * 50)
        print("MAIN DASHBOARD MENU:")
        print("1. View Vendors Table")
        print("2. View Activity Log")
        print("3. View Blockchain Ledger")
        print("4. Add Vendor (Secured)")
        print("5. Delete Vendor (Secured)")
        print("6. Delete Activity Log Event (Admin authorization required)")
        print("7. Verify Ledger Cryptographic Integrity")
        print("8. Exit")
        print("-" * 50)
        
        choice = input("Enter choice (1-8): ").strip()
        
        if choice == "1":
            print("\nVENDORS IN DATABASE:")
            vendors = db.fetch_vendors()
            if not vendors:
                print("No vendors found.")
            else:
                for v in vendors:
                    print(f"ID: {v['id']} | Name: {v['name']} | Contact: {v['contact']} | GST: {v['gst']} | Status: {v['status']} | Email: {v['email']}")
                    
        elif choice == "2":
            print("\nACTIVITY LOG ENTRIES:")
            logs = db.fetch_activity_logs()
            if not logs:
                print("No log entries found.")
            else:
                for l in logs:
                    print(f"[{l['time']}] ID: {l['id']} | {l['user']} ({l['role']}): {l['action']} -> {l['target']}")
                    
        elif choice == "3":
            print("\nBLOCKCHAIN LEDGER:")
            blocks = db.fetch_blockchain_ledger()
            for b in blocks:
                print(f"\nBlock #{b['block_index']} [{b['timestamp']}]")
                print(f"  Action: {b['action']} | Initiated by: {b['user']}")
                print(f"  Data: {b['data']}")
                print(f"  Prev Hash: {b['previous_hash']}")
                print(f"  Hash:      {b['hash']}")
                
        elif choice == "4":
            print("\nADD NEW VENDOR:")
            v_id = input("Enter Vendor ID (e.g. V-008): ").strip()
            name = input("Enter Vendor Name: ").strip()
            contact = input("Enter Contact Person: ").strip()
            v_email = input("Enter Vendor Email: ").strip()
            phone = input("Enter Phone Number: ").strip()
            gst = input("Enter GST Number (15 chars): ").strip()
            category = input("Enter Category (e.g., Raw Materials): ").strip()
            status = input("Enter Status (active/inactive/pending): ").strip().lower()
            address = input("Enter Address: ").strip()
            
            # Validation on GST
            if not v_id or not name or not gst:
                print("[Error] Vendor ID, Name, and GST are mandatory fields.")
                continue
            if status not in ['active', 'inactive', 'pending']:
                print("[Error] Status must be active, inactive, or pending.")
                continue
                
            try:
                db.insert_vendor(
                    vendor_id=v_id,
                    name=name,
                    contact=contact,
                    email=v_email,
                    phone=phone,
                    gst=gst,
                    category=category,
                    status=status,
                    address=address,
                    operator=operator_name
                )
            except Exception as e:
                print(f"[Error] Failed to insert vendor: {e}")
                
        elif choice == "5":
            print("\nDELETE VENDOR:")
            v_id = input("Enter Vendor ID to delete: ").strip()
            if not v_id:
                print("[Error] Vendor ID is required.")
                continue
            try:
                db.delete_vendor(v_id, operator=operator_name)
            except Exception as e:
                print(f"[Error] Failed to delete vendor: {e}")
                
        elif choice == "6":
            print("\nDELETE ACTIVITY LOG EVENT:")
            try:
                log_id = int(input("Enter Activity Log ID to delete: "))
                db.delete_activity_log(log_id, operator=operator_name, operator_role=role)
            except PermissionError as pe:
                print(f"[ACCESS DENIED] {pe}")
            except Exception as e:
                print(f"[Error] Failed to delete log entry: {e}")
                
        elif choice == "7":
            print("\nVERIFYING BLOCKCHAIN INTEGRITY...")
            ok, msg = db.verify_chain_integrity()
            if ok:
                print(f"[SUCCESS] {msg}")
            else:
                print(f"[CRITICAL WARNING] {msg}")
                
        elif choice == "8":
            print("\nExiting. Thank you for using VendorBridge.")
            db.close()
            break
            
        else:
            print("[Error] Invalid choice option. Select 1-8.")

if __name__ == "__main__":
    main()
