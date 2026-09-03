import re

def scale_font_size(match):
    val = float(match.group(1))
    
    # Scale up by roughly 10-20% for the upper bound
    if val < 1.0:
        # Small text: labels, badges (e.g. 0.8rem, 0.95rem)
        min_val = max(val, 0.85) # Don't let it go below 0.85rem (13.6px) for readability
        max_val = val * 1.15
        vw_val = val * 1.2
    elif val < 1.5:
        # Normal text: paragraphs, buttons (e.g. 1.1rem, 1.2rem)
        min_val = val
        max_val = val * 1.2
        vw_val = val * 1.2
    elif val < 2.5:
        # Subheadings (e.g. 1.5rem, 2rem)
        min_val = val
        max_val = val * 1.25
        vw_val = val * 1.5
    else:
        # Headings (e.g. 2.5rem, 4rem)
        min_val = val
        max_val = val * 1.25
        vw_val = val * 2.0
        
    return f'font-size: clamp({min_val:.2f}rem, {vw_val:.2f}vw + 0.5rem, {max_val:.2f}rem)'

with open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find font-size: Xrem and replace with clamp
new_content = re.sub(r'font-size:\s*([0-9.]+)rem', scale_font_size, content)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated index.html inline styles.')
