import re

with open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract and remove old homeHeroSlider inside home-view
# We just replace the inside of home-view with a placeholder for now
home_view_pattern = re.compile(r'(<!-- ======= SECTION 1: HOME VIEW ======= -->\s*<section id="home-view" class="section-view">)(.*?)(?=</section>)', re.DOTALL)
m = home_view_pattern.search(content)
if not m:
    print('home-view not found')
    exit(1)
home_view_start = m.group(1)

# 2. Extract and remove LOGIN HERO SECTION
login_hero_pattern = re.compile(r'(\s*<!-- ======= LOGIN HERO SECTION ======= -->.*?<!-- ======= END LOGIN HERO SECTION ======= -->\s*)', re.DOTALL)
login_hero_match = login_hero_pattern.search(content)
if not login_hero_match:
    print('login hero not found')
    exit(1)
login_hero_content = login_hero_match.group(1)
content = content.replace(login_hero_content, '\n            ')

# 3. Extract and remove landing sections
# Let's extract exactly from ABOUT SECTION to the end of ECOSYSTEM WATCH </section>
landing_sections_pattern = re.compile(r'(\s*<!-- ======= ABOUT SECTION ======= -->.*?</section>\s*)(?=</div>\s*<!-- ======= SECTION 3: MY VEHICLES VIEW ======= -->|<!-- ======= SECTION 3: MY VEHICLES VIEW ======= -->|</div>)', re.DOTALL)
landing_match = landing_sections_pattern.search(content)
if not landing_match:
    print('landing sections not found')
    exit(1)

landing_content = landing_match.group(1)
content = content.replace(landing_content, '\n')

# Now construct the new home-view
# We want it to be: home_view_start + login_hero_content + landing_content
new_home_view = home_view_start + login_hero_content + landing_content

# Replace the original home_view with new_home_view
content = home_view_pattern.sub(lambda match: new_home_view, content)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restructured index.html successfully!")
