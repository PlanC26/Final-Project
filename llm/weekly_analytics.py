import os

import psycopg2

# ---------------- DATABASE CONFIG ----------------
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

# ---------------- LOAD ALL ISSUES FROM DB ----------------
def load_all_issues():
    issues = []

    cur = conn.cursor()
    cur.execute("SELECT input_data, decision_data FROM postNew;")
    rows = cur.fetchall()

    for row in rows:
        issues.append({
            "input": row[0],      # JSON column from DB
            "decision": row[1]    # JSON column from DB
        })

    cur.close()
    return issues


# ---------------- PRIORITY SCORE (UNCHANGED) ----------------
def compute_priority_score(issue):
    decision = issue["decision"]
    input_data = issue["input"]

    severity = input_data["severity_score"]
    upvotes = input_data["upvotes"]

    priority_weight = {
        "High": 3,
        "Medium": 2,
        "Low": 1
    }.get(decision["priority"], 1)

    return (severity * 5) + (upvotes * 0.3) + priority_weight


# ---------------- RANK ISSUES (UNCHANGED) ----------------
def rank_issues(issues):
    for issue in issues:
        issue["computed_score"] = compute_priority_score(issue)

    return sorted(issues, key=lambda x: x["computed_score"], reverse=True)