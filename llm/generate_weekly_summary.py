from weekly_analytics import load_all_issues, rank_issues
from weekly_report_generator import generate_weekly_report
from dbNew import save_weekly_report

issues = load_all_issues()

if not issues:
    print("No issues found for weekly report.")
    exit()
output_path = "reports/weekly_civic_report.pdf"

ranked = rank_issues(issues)

generate_weekly_report(ranked, output_path)
save_weekly_report(ranked, output_path)

print("📊 Weekly report generated successfully.")
