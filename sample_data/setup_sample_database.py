import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "sample_enterprise.db"

def setup_database():
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Table 1: customers
    cursor.execute("""
    CREATE TABLE customers (
        customer_id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        aadhaar_no TEXT,
        date_of_birth TEXT,
        loyalty_points INTEGER,
        created_at TEXT
    );
    """)

    customers_data = [
        ("CUST-101", "Aarav Sharma", "aarav.sharma@example.in", "+91 98201 12345", "4512 8734 9102", "1992-04-15", 450, "2023-01-10"),
        ("CUST-102", "Priya Patel", "priya.patel@example.com", "9876543210", "2341 5678 9012", "1985-11-23", 1200, "2023-02-14"),
        ("CUST-103", "Rohan Verma", "rohan.verma@example.org", "+91 97654 32109", "8765 4321 0987", "1998-07-08", 50, "2023-03-22"),
        ("CUST-104", "Sneha Kulkarni", "sneha.k@example.net", "9123456780", "6543 2109 8765", "1995-12-30", 320, "2023-04-05"),
        ("CUST-105", "Vikram Singh", "vikram.singh@example.co.in", "+91 94567 89012", "3456 7890 1234", "1980-03-19", 890, "2023-05-18"),
        ("CUST-106", "Ananya Roy", "ananya.roy@example.com", "9988776655", "5678 9012 3456", "2001-09-14", 145, "2023-06-25"),
        ("CUST-107", "Kabir Mehta", "kabir.mehta@example.in", "+91 93214 56789", "9012 3456 7890", "1990-06-02", 670, "2023-07-30"),
        ("CUST-108", "Deepika Joshi", "deepika.j@example.org", "9712345678", "7890 1234 5678", "1987-01-25", 1120, "2023-08-12"),
    ]
    cursor.executemany(
        "INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        customers_data
    )

    # Table 2: employees
    cursor.execute("""
    CREATE TABLE employees (
        emp_id TEXT PRIMARY KEY,
        employee_name TEXT NOT NULL,
        work_email TEXT NOT NULL,
        contact_no TEXT NOT NULL,
        pan TEXT NOT NULL,
        dob TEXT NOT NULL,
        department TEXT NOT NULL,
        salary_grade TEXT NOT NULL
    );
    """)

    employees_data = [
        ("EMP-01", "Vikram Malhotra", "v.malhotra@corp.internal", "+91 91234 56789", "ABCDE1234F", "1988-08-30", "Engineering", "L5"),
        ("EMP-02", "Ananya Sen", "ananya.sen@corp.internal", "9823456781", "BZRPK9821L", "1993-02-14", "Compliance", "L4"),
        ("EMP-03", "Rajesh Khanna", "r.khanna@corp.internal", "+91 97345 67892", "CLQPM4567K", "1982-11-05", "Finance", "L6"),
        ("EMP-04", "Meera Iyer", "meera.iyer@corp.internal", "9645678903", "DFRPN8901M", "1991-05-22", "Human Resources", "L4"),
        ("EMP-05", "Arjun Pillai", "a.pillai@corp.internal", "+91 95567 89014", "EKTPQ2345N", "1986-12-18", "Product", "L5"),
    ]
    cursor.executemany(
        "INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        employees_data
    )

    # Table 3: orders (purely non-personal transactions)
    cursor.execute("""
    CREATE TABLE orders (
        order_id TEXT PRIMARY KEY,
        customer_ref TEXT NOT NULL,
        order_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        shipping_status TEXT NOT NULL,
        item_count INTEGER NOT NULL
    );
    """)

    orders_data = [
        ("ORD-9001", "CUST-101", "2024-03-01", 1499.50, "DELIVERED", 3),
        ("ORD-9002", "CUST-102", "2024-03-02", 4890.00, "DELIVERED", 5),
        ("ORD-9003", "CUST-103", "2024-03-05", 250.00, "RETURNED", 1),
        ("ORD-9004", "CUST-104", "2024-03-08", 3200.75, "SHIPPED", 4),
        ("ORD-9005", "CUST-105", "2024-03-12", 8950.00, "PROCESSING", 8),
    ]
    cursor.executemany(
        "INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)",
        orders_data
    )

    conn.commit()
    conn.close()
    print(f"Sample SQLite database created at: {DB_PATH}")

if __name__ == "__main__":
    setup_database()
