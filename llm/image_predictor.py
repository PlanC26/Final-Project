import torch
from torchvision import transforms, models
from torch import nn
from PIL import Image

import io
import os

# ===============================
# Configuration
# ===============================

model_path = "classification_model.pth"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# IMPORTANT: must match your training folders
class_names = ['building_cracks', 'garbage', 'pothole', 'stagnant_water', 'street_light', 'traffic_block', 'traffic_light']
label_map = {
    "building_cracks": "building cracks",
    "stagnant_water": "stagnant water",
    "street_light": "street light",
    "traffic_block": "traffic block",
    "traffic_light": "traffic light",
    "garbage": "garbage",
    "pothole": "pothole"
}

# ===============================
# Data Transform (same as yours)
# ===============================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

num_classes = len(class_names)

# ===============================
# Load Model (same logic)
# ===============================

model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load(model_path, map_location=device))
model.to(device)
model.eval()

print("✅ Image model loaded successfully")

# ===============================
# SINGLE IMAGE PREDICTION
# ===============================


def predict_image(image_input):

    if not image_input:
        print("⚠ No image provided")
        return None

    try:
        # PostgreSQL BYTEA comes as memoryview → convert to bytes
        if isinstance(image_input, memoryview):
            image_input = bytes(image_input)

        # Open image from bytes
        image = Image.open(io.BytesIO(image_input)).convert("RGB")

        image = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(image)
            _, pred = torch.max(outputs, 1)

        raw_label = class_names[pred.item()]
        return label_map[raw_label]

    except Exception as e:
        print("❌ Image prediction failed:", e)
        return None