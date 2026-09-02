from PIL import Image, ImageDraw, ImageFont
import glob
import os

def check_layout(img_path, output_path):
    img = Image.open(img_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # QR Code area
    qr_w = width * 0.23
    qr_h = qr_w # aspect-ratio: 1/1
    qr_right = width * 0.04
    qr_bottom = height * 0.14
    
    qr_x1 = width - qr_right - qr_w
    qr_y1 = height - qr_bottom - qr_h
    qr_x2 = width - qr_right
    qr_y2 = height - qr_bottom
    
    # Draw QR code placeholder
    draw.rectangle([qr_x1, qr_y1, qr_x2, qr_y2], outline="red", width=5)
    
    # Text OORJA
    text = "OORJA"
    try:
        font = ImageFont.truetype("arialbd.ttf", int(width * 0.06))
    except:
        font = ImageFont.load_default()
        
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # We have space between qr_y2 (bottom of QR code) and the bottom of the image (height)
    # qr_y2 is height * 0.86. The remaining height is 14% of the image.
    # Let's center the text in that 14% space below the QR code.
    text_x = qr_x1 + (qr_w - text_w) / 2
    text_y = qr_y2 + ((height - qr_y2) - text_h) / 2
    
    draw.text((text_x, text_y), text, fill="white", font=font)
    
    img = img.convert("RGB")
    img.save(output_path)
    print(f"Saved {output_path}")

check_layout(r"d:\Road-Warrior\public\og-image-English.png", r"d:\Road-Warrior\scratch\test_layout.png")
