from weekly_report_generator import generate_weekly_report
from dbNew import save_weekly_report
from datetime import datetime, timedelta
import psycopg2
import os

# ---------------- DATABASE CONFIG ----------------
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

# ---------------- GET CURRENT WEEK ----------------
today = datetime.now()
start_of_week = today - timedelta(days=today.weekday())  # Monday
end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)

# ---------------- LOAD ISSUES OF CURRENT WEEK ----------------
cur = conn.cursor()
cur.execute("""
    SELECT pn.input_data, pn.decision_data
    FROM postNew pn
    JOIN posts p ON (pn.input_data->>'post_id')::int = p.post_id
    WHERE p.createdate >= %s AND p.createdate <= %s
""", (start_of_week, end_of_week))

rows = cur.fetchall()
issues = [{"input": row[0], "decision": row[1]} for row in rows]

cur.close()
conn.close()

if not issues:
    print("No issues found for this week's report.")
    exit()

# ---------------- GENERATE WEEKLY REPORT ----------------
week_str = today.strftime("%Y_week_%U")
output_path = f"reports/weekly_civic_report_{week_str}.pdf"

# Use your existing rank_issues function from weekly_analytics
from weekly_analytics import rank_issues
ranked = rank_issues(issues)

# Generate PDF and save
generate_weekly_report(ranked, output_path)
save_weekly_report(ranked, output_path)

print(f"📊 Weekly report generated successfully for week {week_str}.")
