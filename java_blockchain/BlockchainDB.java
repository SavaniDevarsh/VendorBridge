package java_blockchain;

import java.io.File;
import java.security.MessageDigest;
import java.sql.*;
import java.text.SimpleDateFormat;
import java.util.Date;

public class BlockchainDB {

    private static final String URL = "jdbc:sqlite:python_blockchain/vendorbridge.db";
    private Connection conn;

    public BlockchainDB() throws Exception {
        new File("python_blockchain").mkdirs();
        conn = DriverManager.getConnection(URL);
        init();
    }

    private String sha256(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void init() throws Exception {
        try (Statement s = conn.createStatement()) {
            s.execute("CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, name TEXT, contact TEXT, email TEXT, phone TEXT, gst TEXT, category TEXT, status TEXT, address TEXT, rating REAL, total_orders INTEGER);");
            s.execute("CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY, type TEXT, icon TEXT, user TEXT, role TEXT, action TEXT, target TEXT, time TEXT);");
            s.execute("CREATE TABLE IF NOT EXISTS blockchain_ledger (id INTEGER PRIMARY KEY, block_index INTEGER UNIQUE, timestamp TEXT, action TEXT, user TEXT, data TEXT, previous_hash TEXT, hash TEXT);");
            s.execute("CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password_hash TEXT, role TEXT, name TEXT);");
        }
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM users")) {
            if (rs.next() && rs.getInt(1) == 0) {
                String[][] u = {
                    {"admin@gmail.com", sha256("Admin@123"), "admin", "Admin User"},
                    {"officer@gmail.com", sha256("Officer@123"), "procurement", "Procurement Officer"},
                    {"manager@gmail.com", sha256("Manager@123"), "manager", "Manager"},
                    {"vendor@gmail.com", sha256("Vendor@123"), "vendor", "Vendor"}
                };
                for (String[] r : u) {
                    try (PreparedStatement p = conn.prepareStatement("INSERT INTO users VALUES (?,?,?,?)")) {
                        for (int i = 0; i < 4; i++) {
                            p.setString(i + 1, r[i]);
                        }
                        p.executeUpdate();
                    }
                }
            }
        }
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM blockchain_ledger")) {
            if (rs.next() && rs.getInt(1) == 0) {
                String ts = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
                String data = "{\"message\":\"Genesis\"}", pHash = "0".repeat(64);
                String hash = sha256("0" + ts + "GENESIS" + "System" + data + pHash);
                try (PreparedStatement p = conn.prepareStatement("INSERT INTO blockchain_ledger (block_index,timestamp,action,user,data,previous_hash,hash) VALUES (0,?,?,?,?,?,?)")) {
                    p.setString(1, ts);
                    p.setString(2, "GENESIS");
                    p.setString(3, "System");
                    p.setString(4, data);
                    p.setString(5, pHash);
                    p.setString(6, hash);
                    p.executeUpdate();
                }
            }
        }
    }

    public void addBlock(String action, String user, String data) throws Exception {
        int lastIdx = -1;
        String prevHash = "0".repeat(64);
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery("SELECT block_index, hash FROM blockchain_ledger ORDER BY block_index DESC LIMIT 1")) {
            if (rs.next()) {
                lastIdx = rs.getInt(1);
                prevHash = rs.getString(2);
            }
        }
        String ts = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        int nextIdx = lastIdx + 1;
        String hash = sha256(nextIdx + ts + action + user + data + prevHash);
        try (PreparedStatement p = conn.prepareStatement("INSERT INTO blockchain_ledger (block_index,timestamp,action,user,data,previous_hash,hash) VALUES (?,?,?,?,?,?,?)")) {
            p.setInt(1, nextIdx);
            p.setString(2, ts);
            p.setString(3, action);
            p.setString(4, user);
            p.setString(5, data);
            p.setString(6, prevHash);
            p.setString(7, hash);
            p.executeUpdate();
        }
    }

    public void insertVendor(String id, String name, String contact, String email, String phone, String gst, String cat, String stat, String addr, double rat, int ord, String op) throws Exception {
        conn.setAutoCommit(false);
        try {
            try (PreparedStatement p = conn.prepareStatement("INSERT INTO vendors VALUES (?,?,?,?,?,?,?,?,?,?,?)")) {
                p.setString(1, id);
                p.setString(2, name);
                p.setString(3, contact);
                p.setString(4, email);
                p.setString(5, phone);
                p.setString(6, gst);
                p.setString(7, cat);
                p.setString(8, stat);
                p.setString(9, addr);
                p.setDouble(10, rat);
                p.setInt(11, ord);
                p.executeUpdate();
            }
            String ts = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
            try (PreparedStatement p = conn.prepareStatement("INSERT INTO activity_log (type,icon,user,role,action,target,time) VALUES ('create','add_circle',?,'User','registered new vendor',?,?)")) {
                p.setString(1, op);
                p.setString(2, name + " (" + id + ")");
                p.setString(3, ts);
                p.executeUpdate();
            }
            addBlock("INSERT_VENDOR", op, String.format("{\"id\":\"%s\",\"name\":\"%s\"}", id, name));
            conn.commit();
        } catch (Exception e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }

    public void deleteVendor(String id, String op) throws Exception {
        conn.setAutoCommit(false);
        try {
            try (PreparedStatement p = conn.prepareStatement("DELETE FROM vendors WHERE id=?")) {
                p.setString(1, id);
                p.executeUpdate();
            }
            String ts = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
            try (PreparedStatement p = conn.prepareStatement("INSERT INTO activity_log (type,icon,user,role,action,target,time) VALUES ('delete','delete_forever',?,'User','deleted vendor record',?,?)")) {
                p.setString(1, op);
                p.setString(2, "ID: " + id);
                p.setString(3, ts);
                p.executeUpdate();
            }
            addBlock("DELETE_VENDOR", op, String.format("{\"id\":\"%s\"}", id));
            conn.commit();
        } catch (Exception e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }

    public void deleteActivityLog(int logId, String op, String role) throws Exception {
        if (!"admin".equalsIgnoreCase(role)) {
            throw new SecurityException("Access Denied: Admin role required.");
        }
        conn.setAutoCommit(false);
        try {
            try (PreparedStatement p = conn.prepareStatement("DELETE FROM activity_log WHERE id=?")) {
                p.setInt(1, logId);
                p.executeUpdate();
            }
            addBlock("DELETE_LOG", op, String.format("{\"id\":%d}", logId));
            conn.commit();
        } catch (Exception e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }

    public boolean verifyUser(String email, String password, String role) throws Exception {
        try (PreparedStatement p = conn.prepareStatement("SELECT * FROM users WHERE email=? AND password_hash=? AND role=?")) {
            p.setString(1, email);
            p.setString(2, sha256(password));
            p.setString(3, role);
            try (ResultSet rs = p.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void insertUser(String email, String password, String role, String name, String op) throws Exception {
        try (PreparedStatement p = conn.prepareStatement("INSERT INTO users VALUES (?,?,?,?)")) {
            p.setString(1, email);
            p.setString(2, sha256(password));
            p.setString(3, role);
            p.setString(4, name);
            p.executeUpdate();
        }
        addBlock("INSERT_USER", op, String.format("{\"email\":\"%s\",\"role\":\"%s\"}", email, role));
    }

    public boolean verifyChainIntegrity() throws Exception {
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery("SELECT * FROM blockchain_ledger ORDER BY block_index ASC")) {
            boolean isGenesis = true;
            int prevIdx = -1;
            String prevHash = "";
            while (rs.next()) {
                int idx = rs.getInt("block_index");
                String ts = rs.getString("timestamp"), act = rs.getString("action"), usr = rs.getString("user");
                String data = rs.getString("data"), stPrev = rs.getString("previous_hash"), stHash = rs.getString("hash");
                if (isGenesis) {
                    if (idx != 0 || !stPrev.equals("0".repeat(64))) {
                        return false;
                    }
                    isGenesis = false;
                } else {
                    if (idx != prevIdx + 1 || !stPrev.equals(prevHash)) {
                        return false;
                    }
                }
                if (!sha256(idx + ts + act + usr + data + stPrev).equals(stHash)) {
                    return false;
                }
                prevIdx = idx;
                prevHash = stHash;
            }
        }
        return true;
    }

    public void close() throws Exception {
        if (conn != null && !conn.isClosed()) {
            conn.close();
        }
    }

    public static boolean isValidEmail(String e) {
        return e.matches("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");
    }

    public static boolean isValidPassword(String p) {
        return p.length() >= 6 && p.matches(".*[a-zA-Z].*") && p.matches(".*\\d.*");
    }

    public static void main(String[] args) {
        try {
            BlockchainDB db = new BlockchainDB();
            System.out.println("Java engine loaded. Verification: " + db.verifyChainIntegrity());
            System.out.println("Login test: " + db.verifyUser("admin@gmail.com", "Admin@123", "admin"));
            db.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
