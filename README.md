# PlanC – Civic Complaint Management System

A web application that allows citizens to report civic issues like potholes, garbage, and streetlight problems. Authorities can track and resolve complaints.

## Tech Stack
- React
- Node.js
- Firebase
- OpenStreetMap
- Python (for LLM-based analysis)

## Features
- User complaint registration
- Complaint tracking
- Admin dashboard
- Map-based complaint location
- Weekly civic issue summary generation using AI

## Setup Instructions

1. Clone the repository and navigate into it:
git clone https://github.com/PlanC26/Final-Project.git
cd Final-Project

2. Install Python dependencies:
pip install -r llm/requirements.txt

3. Prepare the model: The project uses a large AI model (`model.safetensors`) for category prediction. This file is not included in the repository due to size limits. You have two options:
- Option A: Manually add the model. Obtain `model.safetensors` from the project owner and place it in the folder `llm/category_model/model.safetensors`.
- Option B: Use the download script. Run the Python script `python llm/category_model/download_model.py` to automatically download and place the model in `llm/category_model/`.

4. Run the project:
- Backend & LLM scripts:
python llm/main.py
- Frontend:
cd frontend
npm install
npm start

## Notes
- The large AI model llama 3 by ollama (~1 GB) is kept locally and not tracked by GitHub.
- Make sure you have enough disk space and a stable internet connection if using the download script.
- The pubically avaible PDF `AMRUT MASTER PLAN KOZHIKODE VOLUME3 SANCTION_0.pdf` (~1.13 MB) is included for reference in llm folder. The project uses the full AMRUT MASTER PLAN document with more information (~55 MB) not share due to confidentiallity, which was obtained from the city planning office of kozhikode.



