import json
import os
import psycopg2
from geopy.geocoders import Nominatim
from llm_logic import make_decision
from report_generator import generate_pdf_report
from image_predictor import predict_image
from text_predictor import classify_text
from db import save_issue_to_db


# 🔹 Reverse geocode function
def get_location_name(lat_long):
    geolocator = Nominatim(user_agent="civic_ai_system")
    location = geolocator.reverse(lat_long)

    if location:
        return location.address
    return "Unknown Location"


# 🔹 Fetch one post from database (Image as PATH now)
def fetch_post():
    conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

    cursor = conn.cursor()

    cursor.execute("""
        SELECT post_id, description, noofupvotes, mappointer, image_file
        FROM posts
        WHERE counter = 'new'
        LIMIT 1
    """)

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        raise Exception("No pending posts found")

    return {
        "post_id": row[0],
        "description": row[1],
        "upvotes": row[2],
        "mappointer": row[3],
        "image_file": row[4]   # ✅ Direct image path
    }


# 🔹 Update decoded location in DB
def update_location_in_db(post_id, location_name):
    conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

    cursor = conn.cursor()

    cursor.execute("""
        UPDATE posts
        SET location = %s
        WHERE post_id = %s
    """, (location_name, post_id))

    conn.commit()
    cursor.close()
    conn.close()


# 🔹 Mark post as processed
def mark_post_processed(post_id):
    conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

    cursor = conn.cursor()

    cursor.execute("""
        UPDATE posts
        SET counter = 'Processed'
        WHERE post_id = %s
    """, (post_id,))

    conn.commit()
    cursor.close()
    conn.close()


# 🔥 Fetch from DB
input_data = fetch_post()


# 🔹 Convert mappointer → location name
location_name = get_location_name(input_data["mappointer"])

parts = location_name.split(",")

# ⭐ Strip only if address is very long
if len(parts) > 5:
    location_name = ", ".join(parts[2:]).strip()
else:
    location_name = location_name.strip()

input_data["location"] = location_name

# ✅ Store location in DB
update_location_in_db(input_data["post_id"], location_name)


# 🔹 Image prediction (Direct Path Now ✅)
predicted_label = predict_image(input_data["image_file"])
input_data["image_label"] = predicted_label


# 🔹 Text prediction
predicted_text = classify_text(input_data["description"])
input_data["text_label"] = predicted_text["category"]
input_data["sentiment"] = predicted_text["sentiment"]
input_data["severity_score"] = predicted_text["severity_score"]


# 🔹 LLM decision
decision = make_decision(input_data)

print("\n===== FINAL MUNICIPAL DECISION =====\n")
print(json.dumps(decision, indent=4))


# 🔹 Generate PDF
#output_pdf = f"reports/civic_report_{input_data['post_id']}.pdf"
#generate_pdf_report(input_data, decision, output_pdf)
generate_pdf_report(input_data, decision)

#print(f"\n📄 PDF report generated successfully at: {output_pdf}")
print(f"\n📄 PDF report generated successfully at: reports/civic_report_{input_data['post_id']}.pdf")




# Remove raw image bytes before saving decision JSON
input_data.pop("image_file", None)
# 🔹 Save decision
save_issue_to_db(input_data, decision)

# ✅ Mark as processed
mark_post_processed(input_data["post_id"])
