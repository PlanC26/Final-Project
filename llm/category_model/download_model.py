import gdown
import os

# Google Drive file IDs for each model type
# Replace these with your actual file IDs
file_ids = {
    "model.safetensors": "https://drive.google.com/file/d/1Kc-d_Hy1xXzNqqUv9zFNTPtj1MUPpe8Y/view?usp=sharing",
    "model.pth": "https://drive.google.com/file/d/1yt_QlS2noTrysk72XQJ5eDdV7WxsRsRr/view?usp=sharing",
    "model.pkl": "https://drive.google.com/file/d/1vSpUh7YoNv1__VUrTKCt7_MakMYWE8X1/view?usp=sharing"
}

# Destination folder
dest_folder = "llm/category_model"
os.makedirs(dest_folder, exist_ok=True)

# Download each model
for filename, file_id in file_ids.items():
    output_path = os.path.join(dest_folder, filename)
    url = f"https://drive.google.com/uc?id={file_id}"
    print(f"Downloading {filename}...")
    gdown.download(url, output_path, quiet=False)
    print(f"{filename} downloaded successfully at {output_path}!\n")