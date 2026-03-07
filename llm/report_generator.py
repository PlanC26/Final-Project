import os
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from datetime import datetime


def generate_pdf_report(input_data, decision_data, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph(
        "<b>Civic Issue Decision Report</b>",
        styles["Title"]
    ))
    elements.append(Spacer(1, 0.3 * inch))

    # Date
    elements.append(Paragraph(
        f"<b>Date:</b> {datetime.now().strftime('%d %B %Y')}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))

    # Issue Description
    elements.append(Paragraph("<b>Issue Description</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(Paragraph(
        input_data["description"],
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))

    # Complaint Details
    elements.append(Paragraph("<b>Complaint Details</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))

    details_text = f"""
    Location: {input_data['location']}<br/>
    Total Upvotes: {input_data['upvotes']}<br/>
    Text Category: {input_data['text_label']}<br/>
    Image Category: {input_data['image_label']}<br/>
    Sentiment: {input_data['sentiment']}<br/>
    Urgency Score: {input_data['severity_score']}
    """
    elements.append(Paragraph(details_text, styles["Normal"]))
    elements.append(Spacer(1, 0.25 * inch))

    # System Analysis
    elements.append(Paragraph("<b>System Analysis</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))

    mismatch_text = (
        "A mismatch was detected between the complaint text and the uploaded image. "
        "This indicates that the issue details require verification before direct action."
        if decision_data["mismatch_detected"]
        else
        "No mismatch was detected between the complaint text and the uploaded image. "
        "The issue details are consistent and verified."
    )

    analysis_paragraph = f"""
    The system analyzed the complaint using text classification, image analysis, and
    sentiment-based urgency scoring. {mismatch_text}
    """
    elements.append(Paragraph(analysis_paragraph, styles["Normal"]))
    elements.append(Spacer(1, 0.25 * inch))

    # Decision Summary
    elements.append(Paragraph("<b>Decision Summary</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))

    decision_text = f"""
    Issue Type: {decision_data['issue_type']}<br/>
    Priority Level: {decision_data['priority']}<br/>
    Alignment with Master Plan: {decision_data['alignment_with_master_plan']}
    """
    elements.append(Paragraph(decision_text, styles["Normal"]))
    elements.append(Spacer(1, 0.25 * inch))

    # Recommended Action
    elements.append(Paragraph("<b>Recommended Action</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(Paragraph(
        decision_data["recommended_action"],
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.25 * inch))

    # Reasoning
    elements.append(Paragraph("<b>Reasoning</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(Paragraph(
        decision_data["reasoning"],
        styles["Normal"]
    ))

    doc.build(elements)
