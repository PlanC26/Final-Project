import pdfplumber

def extract_pdf_text(pdf_path, max_pages=30):
    text = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            if i >= max_pages:
                break
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return "\n".join(text)
