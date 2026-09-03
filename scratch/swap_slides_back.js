const fs = require('fs');

const indexPath = 'd:/Road-Warrior/public/index.html';
let content = fs.readFileSync(indexPath, 'utf8');

const newSliderContent = `
        <div class="hero-slide active" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/img/home-bg.jpg'); align-items: center; justify-content: center;">
            <div class="hero-content" style="display:flex; justify-content:center; align-items:center; height:100%; width:100%;">
                <img src="/img/oorja-logo.png" alt="OORJA Logo" style="max-height: 120px; object-fit: contain;">
            </div>
        </div>
        <div class="hero-slide" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/img/refer-earn-win-banner.jpg'); align-items: center; justify-content: center;">
            <div class="hero-content">
                <h2 class="hero-title" data-i18n="hero_title_2">Refer & Earn</h2>
                <p class="hero-subtitle" data-i18n="hero_subtitle_2">Invite your friends and earn reward points when they join!</p>
                <div class="hero-cta">
                    <button class="btn btn-primary" onclick="navigateTo('/dashboard')"><i class="fas fa-share-alt"></i> <span data-i18n="hero_btn_refer">Refer Now</span></button>
                </div>
            </div>
        </div>
        <div class="carousel-indicators" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;">
            <span class="dot active" onclick="currentSlide(1)" style="height: 12px; width: 12px; background-color: var(--primary-color); border-radius: 50%; display: inline-block; cursor: pointer;"></span>
            <span class="dot" onclick="currentSlide(2)" style="height: 12px; width: 12px; background-color: #bbb; border-radius: 50%; display: inline-block; cursor: pointer;"></span>
        </div>
`;

const sliderRegex = /<div class="home-hero-slider" id="homeHeroSlider">([\s\S]*?)<\/div>\s*<div id="login-section">/g;
content = content.replace(sliderRegex, '<div class="home-hero-slider" id="homeHeroSlider">' + newSliderContent + '</div>\n<div id="login-section">');

fs.writeFileSync(indexPath, content, 'utf8');
console.log("Reverted slide order and simplified OORJA logo slide in index.html");
