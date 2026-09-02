import glob
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

public_dir = r"d:\Road-Warrior\public"
backup_dir = r"d:\Road-Warrior\public\backup_og_images"

if not os.path.exists(backup_dir):
    os.makedirs(backup_dir)

images = glob.glob(os.path.join(public_dir, "og-image*.png")) + glob.glob(os.path.join(public_dir, "og-image*.webp"))
images = [img for img in images if "backup" not in img]

for img_path in images:
    filename = os.path.basename(img_path)
    shutil.copy(img_path, os.path.join(backup_dir, filename))
    print(f"Backed up {filename}")

def add_branding_to_image(img_path):
    # Determine format from extension
    is_webp = img_path.lower().endswith(".webp")
    
    img = Image.open(img_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # QR Code area
    qr_w = width * 0.23
    qr_h = qr_w # aspect-ratio: 1/1
    qr_right = width * 0.04
    qr_bottom = height * 0.14
    
    qr_x1 = width - qr_right - qr_w
    qr_y2 = height - qr_bottom
    
    # Text OORJA
    text = "OORJA"
    try:
        font = ImageFont.truetype("arialbd.ttf", int(width * 0.06))
    except:
        font = ImageFont.load_default()
        
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # Center the text in the space below the QR code
    text_x = qr_x1 + (qr_w - text_w) / 2
    text_y = qr_y2 + ((height - qr_y2) - text_h) / 2
    
    # Move it slightly up if it looks too close to the bottom edge
    text_y -= height * 0.01 
    
    # Draw OORJA in white
    draw.text((text_x, text_y), text, fill="white", font=font)
    
    if is_webp:
        img = img.convert("RGB")
        img.save(img_path, "WEBP", quality=95)
    else:
        img = img.convert("RGB")
        img.save(img_path, "PNG")
    print(f"Processed {os.path.basename(img_path)}")

for img_path in images:
    add_branding_to_image(img_path)

print("All images processed successfully.")
