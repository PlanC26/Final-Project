from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, LongTable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib import colors
from datetime import datetime
import matplotlib.pyplot as plt
import io
from collections import Counter

def generate_weekly_report(ranked_issues, output_path):
    # PDF setup
    doc = SimpleDocTemplate(output_path, pagesize=(595, 842))  # A4 portrait

    # Styles
    styles = {
        "title": ParagraphStyle(name="title", fontName="Helvetica-Bold", fontSize=18, leading=22, spaceAfter=20, alignment=TA_CENTER),
        "heading": ParagraphStyle(name="heading", fontName="Helvetica-Bold", fontSize=14, spaceBefore=20, spaceAfter=10),
        "body": ParagraphStyle(name="body", fontName="Helvetica", fontSize=9, leading=16, alignment=TA_JUSTIFY)
    }

    elements = []

    # Title
    elements.append(Paragraph(
        "WEEKLY CIVIC ISSUE ANALYSIS REPORT<br/>KOZHIKODE MUNICIPAL CORPORATION",
        styles["title"]
    ))

    elements.append(Paragraph(
        f"Generated on: {datetime.now().strftime('%d %B %Y')}",
        styles["body"]
    ))

    elements.append(Spacer(1, 20))

    # Executive Summary
    elements.append(Paragraph("Executive Summary", styles["heading"]))
    elements.append(Paragraph(
        f"A total of {len(ranked_issues)} civic complaints were analyzed this week "
        "using AI-assisted prioritization. Issues were evaluated based on urgency, "
        "citizen engagement, sentiment severity, and alignment with municipal planning objectives.",
        styles["body"]
    ))

    # Top Priority Issues
    elements.append(Paragraph("High Priority Issues Requiring Immediate Action", styles["heading"]))
    for issue in ranked_issues[:5]:
        inp = issue["input"]
        dec = issue["decision"]

        severity = inp.get("severity_score", 0)
        if severity >= 0.7:
            severity_label = "Critical"
        elif severity >= 0.4:
            severity_label = "Moderate"
        else:
            severity_label = "Minor"

        text = f"""
        <b>Location:</b> {inp['location']}<br/>
        <b>Issue:</b> {inp['description']}<br/>
        <b>Severity Score:</b> {severity} ({severity_label})<br/>
        <b>Priority:</b> {dec['priority']}<br/>
        <b>Recommended Action:</b> {dec['recommended_action']}<br/>
        <b>Citizen Engagement:</b> {inp.get('upvotes', 0)} upvotes.<br/><br/>
        """
        
        elements.append(Paragraph(text, styles["body"]))
        elements.append(Spacer(1, 10))

    # Category-wise summary
    elements.append(Paragraph("Category-wise Complaint Summary", styles["heading"]))
    category_list = ["traffic_block", "traffic_light", "street_light", "pothole",
                     "garbage", "building_crack", "stagnant_water"]

    label_to_category = {cat: cat.replace("_", " ") for cat in category_list}
    summary_data = {}
    all_short_locs = []  # Collect all short locations here for bar chart

    for issue in ranked_issues:
        raw_label = issue["input"].get("text_label", "").lower()
        cat = label_to_category.get(raw_label)
        if cat:
            if cat not in summary_data:
                summary_data[cat] = {"count":0, "locations":[], "max_severity":0}
            summary_data[cat]["count"] += 1
            summary_data[cat]["locations"].append(issue["input"].get("location", "Unknown"))
            summary_data[cat]["max_severity"] = max(summary_data[cat]["max_severity"], issue["input"].get("severity_score",0))

    # Table rows
    table_data = [["Category", "Count", "Top Locations", "Highest Severity"]]
    for cat in category_list:
        cat_name = cat.replace("_", " ")
        if cat_name in summary_data:
            locs = summary_data[cat_name]["locations"]
            short_locs = [loc.split(",")[0].strip() for loc in locs]
            all_short_locs.extend(short_locs)  # collect for bar chart

            top_locs = ", ".join(short_locs)
            table_data.append([
                cat_name.title(),
                str(summary_data[cat_name]["count"]),
                top_locs,
                str(summary_data[cat_name]["max_severity"])
            ])

    # Table with borders
    if len(table_data) > 1:
        table = LongTable(table_data, colWidths=[85, 35, 290, 90], repeatRows=1)
        table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('ALIGN',(1,0),(-1,-1),'CENTER'),
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('FONTSIZE', (0,0),(-1,-1), 11),
            ('WORDWRAP', (2,1), (2,-1), 'CJK')
        ]))
        elements.append(table)
        elements.append(Spacer(1,20))

    # Pie chart: Category vs Count
    categories = [row[0] for row in table_data[1:]]
    counts = [int(row[1]) for row in table_data[1:]]
    if categories:
        plt.figure(figsize=(7,4))
        plt.pie(counts, labels=categories, autopct='%1.1f%%', startangle=140, colors=plt.cm.tab20.colors)
        plt.title("Complaint Distribution by Category")
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='PNG')
        plt.close()
        buf.seek(0)
        img = Image(buf)
        img.drawHeight = 200
        img.drawWidth = 400
        elements.append(img)
        elements.append(Spacer(1,20))

    # Horizontal bar chart: Top Locations from table only
    top_locations = Counter(all_short_locs).most_common(5)
    if top_locations:
        loc_names, loc_counts = zip(*top_locations)
        loc_counts = [int(c) for c in loc_counts]

        plt.figure(figsize=(5,4))
        plt.barh(loc_names, loc_counts, color='mediumseagreen')
        plt.xlabel("Number of Complaints")
        plt.title("Top Locations (from table)")
        plt.xticks(range(0, max(loc_counts)+5))
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='PNG')
        plt.close()
        buf.seek(0)
        img = Image(buf)
        img.drawHeight = 200
        img.drawWidth = 400
        elements.append(img)
        elements.append(Spacer(1,20))

    doc.build(elements)
