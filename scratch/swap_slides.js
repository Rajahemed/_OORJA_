const fs = require('fs');

const indexPath = 'd:/Road-Warrior/public/index.html';
let content = fs.readFileSync(indexPath, 'utf8');

// The slides look like this right now:
// <div class="hero-slide active" style="..."> OORJA ... </div>
// <div class="hero-slide" style="..."> Refer & Earn ... </div>

// Let's replace the innerHTML of homeHeroSlider
const newSliderContent = `
        <div class="hero-slide active" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/img/refer-earn-win-banner.jpg'); align-items: center; justify-content: center;">
            <div class="hero-content">
                <h2 class="hero-title" data-i18n="hero_title_2">Refer & Earn</h2>
                <p class="hero-subtitle" data-i18n="hero_subtitle_2">Invite your friends and earn reward points when they join!</p>
                <div class="hero-cta">
                    <button class="btn btn-primary" onclick="navigateTo('/dashboard')"><i class="fas fa-share-alt"></i> <span data-i18n="hero_btn_refer">Refer Now</span></button>
                </div>
            </div>
        </div>
        <div class="hero-slide" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/img/home-bg.jpg'); align-items: center; justify-content: center;">
            <div class="hero-content">
                <img src="/img/oorja-logo.png" alt="OORJA" style="max-height: 80px; margin-bottom: 1rem;">
                <h1 class="hero-title" data-i18n="hero_title_1">OORJA</h1>
                <p class="hero-subtitle" data-i18n="hero_subtitle_1">The ultimate EV platform for riders</p>
            </div>
        </div>
        <div class="carousel-indicators" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;">
            <span class="dot active" onclick="currentSlide(1)" style="height: 12px; width: 12px; background-color: var(--primary-color); border-radius: 50%; display: inline-block; cursor: pointer;"></span>
            <span class="dot" onclick="currentSlide(2)" style="height: 12px; width: 12px; background-color: #bbb; border-radius: 50%; display: inline-block; cursor: pointer;"></span>
        </div>
`;

// use regex to replace everything inside <div class="home-hero-slider" id="homeHeroSlider">...</div>
const sliderRegex = /<div class="home-hero-slider" id="homeHeroSlider">([\s\S]*?)<\/div>\s*<div id="login-section">/g;

content = content.replace(sliderRegex, '<div class="home-hero-slider" id="homeHeroSlider">' + newSliderContent + '</div>\n<div id="login-section">');

fs.writeFileSync(indexPath, content, 'utf8');
console.log("Updated slide order in index.html");
