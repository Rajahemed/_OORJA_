
        (function () {
            'use strict';

            /* ── Drawer toggle ─────────────────────────────────────── */
            window.toggleMobileDrawer = function () {
                var drawer = document.getElementById('mobileNavDrawer');
                var overlay = document.getElementById('mobileNavOverlay');
                var toggle = document.getElementById('mobileMenuToggle');
                if (!drawer) return;
                var isOpen = drawer.classList.contains('is-open');
                if (isOpen) { closeMobileDrawer(); } else { openMobileDrawer(); }
            };

            window.openMobileDrawer = function () {
                var drawer = document.getElementById('mobileNavDrawer');
                var overlay = document.getElementById('mobileNavOverlay');
                var toggle = document.getElementById('mobileMenuToggle');
                if (!drawer) return;
                drawer.classList.add('is-open');
                overlay.classList.add('is-visible');
                toggle && toggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
                /* Sync mobile lang selector with desktop one */
                syncMobileLangSelector();
            };

            window.closeMobileDrawer = function () {
                var drawer = document.getElementById('mobileNavDrawer');
                var overlay = document.getElementById('mobileNavOverlay');
                var toggle = document.getElementById('mobileMenuToggle');
                if (!drawer) return;
                drawer.classList.remove('is-open');
                overlay.classList.remove('is-visible');
                toggle && toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            };

            /* ── ESC key closes drawer ─────────────────────────────── */
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') { closeMobileDrawer(); }
            });

            /* ── Sync mobile lang select value with desktop ─────────── */
            function syncMobileLangSelector() {
                var desktop = document.getElementById('langSelector');
                var mobile = document.getElementById('mobileLangSelector');
                if (desktop && mobile) { mobile.value = desktop.value; }
            }

            /* ── Patch updateAuthNavbarState to also update drawer items ─ */
            /* We hook into the existing function via MutationObserver on the
               desktop nav items since we cannot safely override the closed
               IIFE without touching app.js. When a desktop li changes its
               display, we mirror that to the corresponding mobile drawer li. */
            function mirrorAuthState() {
                var map = [
                    { desktopId: 'navHome', mobileItemId: 'mobileNavHomeItem', mobileLogout: false },
                    { desktopId: 'navScore', mobileItemId: 'mobileNavScoreItem', mobileLogout: false },
                    { desktopId: 'navDashboard', mobileItemId: 'mobileNavDashboardItem', mobileLogout: false },
                    { desktopId: 'navProfile', mobileItemId: 'mobileNavProfileItem', mobileLogout: false },
                ];
                map.forEach(function (entry) {
                    var desktopLink = document.getElementById(entry.desktopId);
                    var mobileItem = document.getElementById(entry.mobileItemId);
                    if (!desktopLink || !mobileItem) return;
                    var desktopLi = desktopLink.parentElement;
                    var isVisible = desktopLi && desktopLi.style.display !== 'none';
                    mobileItem.style.display = isVisible ? '' : 'none';
                });

                /* Logout item mirrors loginLogoutBtn */
                var loginBtn = document.getElementById('loginLogoutBtn');
                var logoutItem = document.getElementById('mobileNavLogoutItem');
                if (loginBtn && logoutItem) {
                    logoutItem.style.display = (loginBtn.style.display !== 'none' && loginBtn.innerHTML.includes('sign-out')) ? '' : 'none';
                }
            }

            /* Poll lightly until the app is ready, then observe */
            var pollInterval = setInterval(function () {
                var navHome = document.getElementById('navHome');
                if (navHome) {
                    clearInterval(pollInterval);
                    mirrorAuthState();
                    /* MutationObserver on the desktop ul to detect show/hide */
                    var ul = document.querySelector('.navbar-nav');
                    if (ul && window.MutationObserver) {
                        var observer = new MutationObserver(function (mutations) {
                            mutations.forEach(function (m) {
                                if (m.type === 'attributes' && m.attributeName === 'style') {
                                    mirrorAuthState();
                                }
                            });
                        });
                        observer.observe(ul, { attributes: true, subtree: true, attributeFilter: ['style'] });
                    }
                    /* Also observe loginLogoutBtn for logout icon */
                    var btn = document.getElementById('loginLogoutBtn');
                    if (btn && window.MutationObserver) {
                        var btnObserver = new MutationObserver(function () { mirrorAuthState(); });
                        btnObserver.observe(btn, { attributes: true, childList: true, subtree: true, attributeFilter: ['style'] });
                    }
                }
            }, 200);

            /* Sync lang selector whenever drawer opens */
            document.addEventListener('click', function (e) {
                var toggle = document.getElementById('mobileMenuToggle');
                if (toggle && toggle.contains(e.target)) { syncMobileLangSelector(); }
            });

            /* Keep desktop lang selector in sync when mobile one changes */
            document.addEventListener('change', function (e) {
                if (e.target && e.target.id === 'mobileLangSelector') {
                    var desktop = document.getElementById('langSelector');
                    if (desktop) { desktop.value = e.target.value; }
                }
                if (e.target && e.target.id === 'langSelector') {
                    var mobile = document.getElementById('mobileLangSelector');
                    if (mobile) { mobile.value = e.target.value; }
                }
            });
        })();
    


        document.addEventListener('mouseleave', function(e) {
            if (e.clientY < 0 && !sessionStorage.getItem('exitIntentShown')) {
                const popup = document.getElementById('exitIntentPopup');
                if(popup) {
                    popup.style.display = 'flex';
                    sessionStorage.setItem('exitIntentShown', 'true');
                }
            }
        });
    


    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const res = await fetch('/api/client-config');
            const config = await res.json();
            if(config.VITE_TELEGRAM_LINK && !config.VITE_TELEGRAM_LINK.includes('WAITING')) {
                const a = document.createElement('a');
                a.id = 'telegramWidget';
                a.href = config.VITE_TELEGRAM_LINK;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.cssText = 'position:fixed; bottom:20px; left:20px; background:#229ED9; color:white; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; box-shadow:0 4px 10px rgba(0,0,0,0.3); z-index:1000; transition: transform 0.3s;';
                a.innerHTML = '<i class="fab fa-telegram-plane"></i>';
                a.onmouseover = () => a.style.transform = 'scale(1.1)';
                a.onmouseout = () => a.style.transform = 'scale(1)';
                document.body.appendChild(a);
            }
        } catch(e) {}
    });
    


    document.addEventListener("mouseleave", function(e) {
        if (e.clientY < 0 && !sessionStorage.getItem('exitIntentShown')) {
            const popup = document.getElementById('exit-intent-popup');
            if(popup) {
                popup.style.display = 'flex';
                sessionStorage.setItem('exitIntentShown', 'true');
            }
        }
    });


