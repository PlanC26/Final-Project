import psycopg2
import json
import uuid
from datetime import datetime
import os
# ---------------- DATABASE CONFIG ----------------


conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

def save_issue_to_db(input_data, decision_data):
    cur = conn.cursor()

    issue_id = str(uuid.uuid4())   # auto-generate unique ID
    timestamp = datetime.now()

    query = """
        INSERT INTO postNew (issue_id, timestamp, input_data, decision_data)
        VALUES (%s, %s, %s, %s)
    """

    cur.execute(
        query,
        (
            issue_id,
            timestamp,
            json.dumps(input_data),
            json.dumps(decision_data)
        )
    )

    conn.commit()
    cur.close()

    print("✅ Data stored successfully in database")