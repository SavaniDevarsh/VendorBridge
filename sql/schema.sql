-- Schema for VendorBridge ERP Blockchain-Secured Database
-- Target Database: SQLite

-- Disable foreign keys check during tables dropping if running schema reset
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS blockchain_ledger;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;

-- 1. Vendors Table
CREATE TABLE vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    gst TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'inactive', 'pending')),
    address TEXT,
    rating REAL DEFAULT 0.0,
    total_orders INTEGER DEFAULT 0
);

-- 2. Activity Log Table (Stores logs of transactions in the ERP)
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,          -- e.g., 'create', 'update', 'delete', 'approve'
    icon TEXT,                  -- Material icon name
    user TEXT NOT NULL,          -- Operator name
    role TEXT NOT NULL,          -- User role ('Admin', 'Procurement Officer', etc.)
    action TEXT NOT NULL,        -- Action description
    target TEXT NOT NULL,        -- Target resource identifier (e.g. 'V-001')
    time TEXT NOT NULL           -- Timestamp string (YYYY-MM-DD HH:MM:SS)
);

-- 3. Blockchain Ledger Table (Cryptographically chains state modifications)
CREATE TABLE blockchain_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_index INTEGER NOT NULL UNIQUE,
    timestamp TEXT NOT NULL,
    action TEXT NOT NULL,        -- Operation performed (INSERT, UPDATE, DELETE)
    user TEXT NOT NULL,          -- User who initiated
    data TEXT NOT NULL,          -- Stringified details/payload of the query executed
    previous_hash TEXT NOT NULL, -- Cryptographic hash of the previous block
    hash TEXT NOT NULL           -- Cryptographic hash of the current block
);

-- 4. Users Table (Stores user credentials protected by blockchain hashes)
CREATE TABLE users (
    email TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL
);
