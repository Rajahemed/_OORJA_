import glob
import os
from PIL import Image

public_dir = r"d:\Road-Warrior\public"
logo_path = r"C:\Users\Latitude\.gemini\antigravity-ide\brain\aacb2b6a-2e53-413f-84ab-cdfb417db6bc\.user_uploaded\media_1788323059018.png"

images = glob.glob(os.path.join(public_dir, "og-image*.png")) + glob.glob(os.path.join(public_dir, "og-image*.webp"))
images = [img for img in images if "backup" not in img]

logo = Image.open(logo_path).convert("RGBA")

# Make white background transparent if it's not already transparent
# This is a basic thresholding to remove white backgrounds.
def make_transparent(img):
    datas = img.getdata()
    newData = []
    for item in datas:
        # If white or very light gray, make transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240 and item[3] > 100:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    return img

# Apply transparency to logo
logo = make_transparent(logo)

def apply_logo(img_path):
    is_webp = img_path.lower().endswith(".webp")
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    
    # QR Code area parameters
    qr_w = width * 0.23
    qr_h = qr_w
    qr_right = width * 0.04
    qr_bottom = height * 0.14
    
    qr_x1 = width - qr_right - qr_w
    qr_y2 = height - qr_bottom
    
    # Calculate available space below QR code
    available_w = qr_w * 1.5  # Give it a bit more width
    available_h = (height - qr_y2) * 0.90 # Use 90% of the height below QR
    
    # Resize logo proportionally
    logo_ratio = logo.width / logo.height
    avail_ratio = available_w / available_h
    
    if logo_ratio > avail_ratio:
        new_w = int(available_w)
        new_h = int(available_w / logo_ratio)
    else:
        new_h = int(available_h)
        new_w = int(available_h * logo_ratio)
        
    resized_logo = logo.resize((new_w, new_h), Image.LANCZOS)
    
    # Center the logo horizontally with the QR code, and vertically in the remaining space
    center_x = qr_x1 + qr_w / 2
    center_y = qr_y2 + (height - qr_y2) / 2
    
    paste_x = int(center_x - new_w / 2)
    paste_y = int(center_y - new_h / 2)
    
    # Move it slightly down to give breathing room from QR code
    paste_y = paste_y + int(height * 0.01)
    
    # Paste logo using itself as mask
    img.paste(resized_logo, (paste_x, paste_y), mask=resized_logo)
    
    if is_webp:
        img = img.convert("RGB")
        img.save(img_path, "WEBP", quality=95)
    else:
        img = img.convert("RGB")
        img.save(img_path, "PNG")
    print(f"Processed {os.path.basename(img_path)}")

for img_path in images:
    apply_logo(img_path)

print("All images processed with logo.")
