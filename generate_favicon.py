import os
from PIL import Image

input_image_path = r"d:\Road-Warrior\public\img\new_ev_bike.png"
output_dir = r"d:\Road-Warrior\public"

# Open the image
try:
    img = Image.open(input_image_path)
    
    # Ensure image is square for favicons
    width, height = img.size
    size = min(width, height)
    left = (width - size) / 2
    top = (height - size) / 2
    right = (width + size) / 2
    bottom = (height + size) / 2
    img_square = img.crop((left, top, right, bottom))
    
    # 1. Generate favicon.ico (multi-size: 16, 32, 48)
    icon_sizes = [(16, 16), (32, 32), (48, 48)]
    img_square.save(os.path.join(output_dir, 'favicon.ico'), format='ICO', sizes=icon_sizes)
    print("Generated favicon.ico")
    
    # 2. Generate 32x32 PNG
    img_32 = img_square.resize((32, 32), Image.Resampling.LANCZOS)
    img_32.save(os.path.join(output_dir, 'favicon-32x32.png'), format='PNG')
    print("Generated favicon-32x32.png")
    
    # 3. Generate 16x16 PNG
    img_16 = img_square.resize((16, 16), Image.Resampling.LANCZOS)
    img_16.save(os.path.join(output_dir, 'favicon-16x16.png'), format='PNG')
    print("Generated favicon-16x16.png")
    
    # 4. Generate apple-touch-icon (180x180)
    img_180 = img_square.resize((180, 180), Image.Resampling.LANCZOS)
    img_180.save(os.path.join(output_dir, 'apple-touch-icon.png'), format='PNG')
    print("Generated apple-touch-icon.png")

except Exception as e:
    print(f"Error generating favicons: {e}")
