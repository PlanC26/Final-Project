import psycopg2
import uuid
from datetime import datetime
import os

def save_weekly_report(ranked_issues, report_path):
    conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

    cur = conn.cursor()

    week_id = str(uuid.uuid4())
    generated_at = datetime.now()
    total_issues = len(ranked_issues)

    # Read PDF as binary
    with open(report_path, "rb") as f:
        pdf_binary = f.read()

    query = """
        INSERT INTO weekly (week_id, generated_at, total_issues, report_file)
        VALUES (%s, %s, %s, %s)
    """

    cur.execute(query, (week_id, generated_at, total_issues, pdf_binary))

    conn.commit()
    cur.close()
    conn.close()

    print("✅ Weekly PDF stored inside DB")