from PIL import Image, ImageDraw, ImageFont
import glob
import os
import math

def add_branding(img_path, output_path):
    img = Image.open(img_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    width, height = img.size
    
    # Position in the bottom right
    # "Empty green area on the bottom-right side of the image"
    # Let's say right 25%, bottom 25%
    
    text = "OORJA"
    try:
        font = ImageFont.truetype("arialbd.ttf", int(width * 0.08))
    except:
        font = ImageFont.load_default()
        
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # Center it in the right 28% of the image, bottom 30% of the image
    box_x = width * 0.72
    box_y = height * 0.70
    box_w = width * 0.28
    box_h = height * 0.30
    
    x = box_x + (box_w - text_w) / 2
    y = box_y + (box_h - text_h) / 2
    
    # Draw OORJA in white
    draw.text((x, y), text, fill="white", font=font)
    
    img = img.convert("RGB")
    img.save(output_path)
    print(f"Saved {output_path}")

add_branding(r"d:\Road-Warrior\public\og-image-English.png", r"d:\Road-Warrior\scratch\test_oorja.png")
