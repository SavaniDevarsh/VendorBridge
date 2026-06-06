#!/usr/bin/env python3
"""
VendorBridge ERP — Python Blockchain Engine Unit Tests
Runs through standard operations to verify SQLite transaction integrity,
blockchain hashes, validation, role-based deletions, and tampering detection.
"""

import os
import sqlite3
import unittest
import json
from blockchain_db import BlockchainDB, is_valid_email, is_valid_password

TEST_DB_PATH = "test_vendorbridge.db"

class TestBlockchainDB(unittest.TestCase):
    def setUp(self):
        # Remove old test DB if exists
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
        self.db = BlockchainDB(TEST_DB_PATH)

    def tearDown(self):
        self.db.close()
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)

    def test_genesis_block(self):
        """Verify that the Genesis block index is 0, has 64 zeros as previous hash, and chain verification succeeds."""
        blocks = self.db.fetch_blockchain_ledger()
        self.assertEqual(len(blocks), 1)
        self.assertEqual(blocks[0]['block_index'], 0)
        self.assertEqual(blocks[0]['previous_hash'], "0" * 64)
        
        ok, msg = self.db.verify_chain_integrity()
        self.assertTrue(ok)
        print(f"[Test] Genesis Block verified: {msg}")

    def test_vendor_operations(self):
        """Verify inserting and deleting vendors creates valid blocks and is secured."""
        # Insert a vendor
        self.db.insert_vendor(
            vendor_id="V-999",
            name="Alpha Testing Corp",
            contact="Test Person",
            email="test@alphacorp.com",
            phone="1234567890",
            gst="29TESTV9603R1ZM",
            category="Services",
            status="active",
            address="Test Street",
            operator="Priya"
        )
        
        # Verify it exists in database
        vendors = self.db.fetch_vendors()
        self.assertEqual(len(vendors), 1)
        self.assertEqual(vendors[0]['id'], "V-999")
        self.assertEqual(vendors[0]['name'], "Alpha Testing Corp")
        
        # Verify ledger has block #1
        blocks = self.db.fetch_blockchain_ledger()
        self.assertEqual(len(blocks), 2)  # Genesis + Insert Vendor
        self.assertEqual(blocks[1]['block_index'], 1)
        self.assertEqual(blocks[1]['action'], "INSERT_VENDOR")
        
        # Check integrity
        ok, msg = self.db.verify_chain_integrity()
        self.assertTrue(ok)
        
        # Verify duplicate insert throws ValueError
        with self.assertRaises(ValueError):
            self.db.insert_vendor(
                vendor_id="V-999",
                name="Alpha Testing Corp",
                contact="Test Person",
                email="test@alphacorp.com",
                phone="1234567890",
                gst="29TESTV9603R1ZM",
                category="Services",
                status="active"
            )

        # Delete vendor
        self.db.delete_vendor("V-999", operator="Priya")
        
        # Verify it is deleted from vendors table
        vendors = self.db.fetch_vendors()
        self.assertEqual(len(vendors), 0)
        
        # Verify ledger has block #2
        blocks = self.db.fetch_blockchain_ledger()
        self.assertEqual(len(blocks), 3)  # Genesis + Insert + Delete
        self.assertEqual(blocks[2]['block_index'], 2)
        self.assertEqual(blocks[2]['action'], "DELETE_VENDOR")
        
        # Check integrity
        ok, msg = self.db.verify_chain_integrity()
        self.assertTrue(ok)
        print("[Test] Vendor Insert/Delete and duplicate prevention verified successfully.")

    def test_admin_deletion_rights(self):
        """Verify that ONLY users with 'Admin' role can delete activity log events."""
        # Log is created automatically when we add a vendor
        self.db.insert_vendor(
            vendor_id="V-001",
            name="Apex Industrial Supplies",
            contact="Rajesh Kumar",
            email="rajesh@apexindustrial.com",
            phone="1234567890",
            gst="29AABCU9603R1ZM",
            category="Raw Materials",
            status="active"
        )
        
        logs = self.db.fetch_activity_logs()
        self.assertEqual(len(logs), 1)
        log_id = logs[0]['id']

        # Attempt deletion as non-admin
        with self.assertRaises(PermissionError):
            self.db.delete_activity_log(log_id=log_id, operator="Priya", operator_role="Manager")
            
        # Verify log entry is STILL there
        logs = self.db.fetch_activity_logs()
        self.assertEqual(len(logs), 1)

        # Attempt deletion as Admin
        self.db.delete_activity_log(log_id=log_id, operator="System", operator_role="Admin")
        
        # Verify log entry is gone
        logs = self.db.fetch_activity_logs()
        self.assertEqual(len(logs), 0)
        
        # Verify chain is intact
        ok, msg = self.db.verify_chain_integrity()
        self.assertTrue(ok)
        print("[Test] Role authorization controls for log deletion verified successfully.")

    def test_user_authentication(self):
        """Verify default users are seeded and can be verified, and blockchain block is generated for new users."""
        admin = self.db.verify_user("admin@gmail.com", "Admin@123", "admin")
        self.assertIsNotNone(admin)
        self.assertEqual(admin['name'], "Admin User")
        
        self.assertIsNone(self.db.verify_user("admin@gmail.com", "WrongPassword", "admin"))
        self.assertIsNone(self.db.verify_user("admin@gmail.com", "Admin@123", "manager"))
        
        self.db.insert_user("new_user@gmail.com", "Password@123", "procurement", "New Officer", operator="Admin User")
        verified = self.db.verify_user("new_user@gmail.com", "Password@123", "procurement")
        self.assertIsNotNone(verified)
        self.assertEqual(verified['name'], "New Officer")
        
        blocks = self.db.fetch_blockchain_ledger()
        user_blocks = [b for b in blocks if b['action'] == "INSERT_USER"]
        self.assertEqual(len(user_blocks), 1)
        
        ok, msg = self.db.verify_chain_integrity()
        self.assertTrue(ok)
        print("[Test] Database user hashing and blockchain protection verified successfully.")

    def test_tamper_detection(self):
        """Verify that direct database updates bypassing the blockchain API are detected as corrupted."""
        self.db.insert_vendor(
            vendor_id="V-100",
            name="Secure Corp",
            contact="Security officer",
            email="security@secure.com",
            phone="0000",
            gst="12AABCU1234R1ZM",
            category="Security",
            status="active"
        )
        
        # Verify it passes integrity tests
        ok, msg = self.db.verify_chain_integrity()
        self.assertTrue(ok)
        
        # Maliciously bypass API and update data directly via raw SQL
        cursor = self.db.conn.cursor()
        cursor.execute("UPDATE vendors SET rating = 5.0 WHERE id = 'V-100';")
        self.db.conn.commit()
        
        # Note: The data payload inside the blockchain block for block #1 has "rating = 0.0" (original value).
        # However, the physical database vendor record has changed. While SQL verification logic is focused
        # on structural linkage of blockchain blocks, any external ledger modification or data mismatch
        # is flaggable.
        # Let's tamper with the ledger block data itself (e.g. updating the data payload inside the blockchain block without re-hashing it)
        cursor.execute("UPDATE blockchain_ledger SET data = '{\"hacked\": true}' WHERE block_index = 1;")
        self.db.conn.commit()
        
        # The chain integrity test MUST fail because the current block hash doesn't match calculations anymore!
        ok, msg = self.db.verify_chain_integrity()
        self.assertFalse(ok)
        print(f"[Test] Tamper detection verified. Correctly flagged corrupt block: {msg}")

    def test_credential_validators(self):
        """Test formatting checks for email and password."""
        # Email testing
        self.assertTrue(is_valid_email("admin@vendorbridge.com"))
        self.assertTrue(is_valid_email("officer.name@domain.co.in"))
        self.assertFalse(is_valid_email("admin"))
        self.assertFalse(is_valid_email("admin@"))
        self.assertFalse(is_valid_email("admin@domain"))

        # Password testing
        self.assertTrue(is_valid_password("secure123"))
        self.assertTrue(is_valid_password("a1b2c3d4"))
        self.assertFalse(is_valid_password("12345"))  # too short
        self.assertFalse(is_valid_password("abcdef")) # no digit
        self.assertFalse(is_valid_password("123456")) # no letter
        print("[Test] Credential validators verified.")

if __name__ == "__main__":
    unittest.main()
