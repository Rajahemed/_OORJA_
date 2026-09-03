import re

with open('public/js/app-bundle.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Lines to remove:
lines_to_remove = [
    r"\s*const heroSlider = document\.getElementById\('loginHeroSlider'\);",
    r"\s*const landingSections = document\.getElementById\('oorja-landing-sections'\);",
    r"\s*if\s*\(heroSlider\)\s*heroSlider\.style\.display = 'none';",
    r"\s*if\s*\(landingSections\)\s*landingSections\.style\.display = 'none';",
    r"\s*if\s*\(heroSlider\)\s*heroSlider\.style\.display = 'block';",
    r"\s*if\s*\(landingSections\)\s*landingSections\.style\.display = 'block';",
]

for pattern in lines_to_remove:
    content = re.sub(pattern, '', content)

with open('public/js/app-bundle.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned up app-bundle.js successfully!")
