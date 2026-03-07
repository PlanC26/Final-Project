import psycopg2
import os

def bytea_to_jpeg(post_id, output_path):
    conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

    cursor = conn.cursor()

    cursor.execute("""
        SELECT image_file
        FROM posts
        WHERE post_id = %s
    """, (5,))

    result = cursor.fetchone()

    if result and result[0]:
        with open(output_path, "wb") as file:
            file.write(result[0])
        print("Image saved successfully as", output_path)
    else:
        print("No image found for this post_id")

    cursor.close()
    conn.close()


# Example usage
bytea_to_jpeg(4, "output_image.jpg")