// Exit Intent Logic for Auditor Detection and Conversion Recovery
document.addEventListener("mouseout", function(e) {
    // Trigger when mouse leaves the window (relatedTarget is null) and towards the top (clientY < 50)
    if (!e.relatedTarget && e.clientY < 50 && !sessionStorage.getItem('exitIntentShown')) {
        const popup = document.getElementById('exit-intent-popup') || document.getElementById('exitIntentPopup');
        if(popup) {
            popup.style.display = 'flex';
            sessionStorage.setItem('exitIntentShown', 'true');
        }
    }
});
