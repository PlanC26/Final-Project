from pdf_loader import extract_pdf_text

PDF_PATH = "AMRUT_MASTER_PLAN_KOZHIKODE.pdf"

_plan_text_cache = None


def load_plan_text():
    global _plan_text_cache
    if _plan_text_cache is None:
        _plan_text_cache = extract_pdf_text(PDF_PATH)
    return _plan_text_cache


def get_relevant_plan_context(issue_type, max_chars=1200):
    plan_text = load_plan_text()

    keyword_map = {
    "pothole": ["road", "street", "carriageway", "maintenance", "transport"],
    "building_cracks": ["building", "structure", "repair", "safety"],
    "garbage": ["solid waste", "sanitation", "cleanliness"],
    "stagnant_water": ["drainage", "water supply", "sewerage", "flood"],
    "traffic_block": ["traffic", "junction", "transport", "congestion"],
    "traffic_light": ["signal", "traffic", "junction"],
    "street_light": ["lighting", "street light", "illumination"]
}


    matched_lines = []
    for line in plan_text.split("\n"):
        for kw in keyword_map.get(issue_type.lower(), []):
            if kw in line.lower():
                matched_lines.append(line.strip())

    context = "\n".join(matched_lines)
    return context[:max_chars]
