-- SQL Queries for VendorBridge ERP Blockchain Database Engine

-- 1. Vendors Queries
-- Insert a new vendor
-- Parameters: :id, :name, :contact, :email, :phone, :gst, :category, :status, :address, :rating, :total_orders
INSERT INTO vendors (id, name, contact, email, phone, gst, category, status, address, rating, total_orders)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Delete a vendor by ID
-- Parameters: :id
DELETE FROM vendors WHERE id = ?;

-- Get all vendors
SELECT * FROM vendors ORDER BY id ASC;


-- 2. Activity Log Queries
-- Insert new activity log entry
-- Parameters: :type, :icon, :user, :role, :action, :target, :time
INSERT INTO activity_log (type, icon, user, role, action, target, time)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Delete activity log event (Only ADMIN is authorized to perform this query check)
-- Parameters: :id
DELETE FROM activity_log WHERE id = ?;

-- Get all activity logs
SELECT * FROM activity_log ORDER BY id DESC;


-- 3. Blockchain Ledger Queries
-- Get the last block in the blockchain to compute previous hash
SELECT * FROM blockchain_ledger ORDER BY block_index DESC LIMIT 1;

-- Insert a new block to the blockchain ledger
-- Parameters: :block_index, :timestamp, :action, :user, :data, :previous_hash, :hash
INSERT INTO blockchain_ledger (block_index, timestamp, action, user, data, previous_hash, hash)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Retrieve all blocks in index order to verify chain integrity
SELECT * FROM blockchain_ledger ORDER BY block_index ASC;

-- Get count of blocks
SELECT COUNT(*) FROM blockchain_ledger;


-- 4. Users Queries
-- Insert a new user
-- Parameters: :email, :password_hash, :role, :name
INSERT INTO users (email, password_hash, role, name)
VALUES (?, ?, ?, ?);

-- Get user by email
-- Parameters: :email
SELECT * FROM users WHERE email = ?;

