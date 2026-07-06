import re

file_path = r"d:\Road-Warrior\public\js\app.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# The broken block we want to replace
pattern = re.compile(
    r"async function initVisitorTracking\(\) \{.*?"
    r"const finalDeviceType = model \? `\$\{_rwGetDeviceType\(\)\} \(\$\{model\}\)` : _rwGetDeviceType\(\);",
    re.DOTALL
)

replacement = """async function initVisitorTracking() {
    try {
        visitorId = localStorage.getItem('rw_visitor_id');
        if (!visitorId) {
            visitorId = _rwGenerateId();
            localStorage.setItem('rw_visitor_id', visitorId);
        }
    } catch (e) {
        console.warn('LocalStorage not available for visitor tracking');
        visitorId = _rwGenerateId();
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const savedDate = localStorage.getItem('rw_session_date');
        sessionId = localStorage.getItem('rw_session_id');

        if (!sessionId || savedDate !== today) {
            sessionId = _rwGenerateId();
            localStorage.setItem('rw_session_id', sessionId);
            localStorage.setItem('rw_session_date', today);
        }
    } catch (e) {
        sessionId = _rwGenerateId(); // fallback
    }

    let model = _rwGetDeviceModel();
    
    // Modern Chrome on Android hides the model in User-Agent, so we use Client Hints
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const highEntropy = await navigator.userAgentData.getHighEntropyValues(['model']);
            if (highEntropy.model && highEntropy.model !== 'K') {
                model = highEntropy.model;
            }
        } catch (err) {
            // Ignore error
        }
    }

    const finalDeviceType = model ? `${_rwGetDeviceType()} (${model})` : _rwGetDeviceType();"""

if pattern.search(content):
    new_content = pattern.sub(replacement, content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched app.js")
else:
    print("Pattern not found in app.js")
