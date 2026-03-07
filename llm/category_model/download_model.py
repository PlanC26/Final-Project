import gdown

# Replace FILE_ID with the ID from your Google Drive link
url = "https://drive.google.com/file/d/1Kc-d_Hy1xXzNqqUv9zFNTPtj1MUPpe8Y/view?usp=sharing"
output = "model.safetensors"

gdown.download(url, output, quiet=False)
print("Model downloaded successfully!")

