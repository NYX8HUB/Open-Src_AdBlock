// thx https://github.com/TheRealJoelmatic/RemoveAdblockThing
//fuck you youtube

(function() {
    //
    //      Config
    //

    const adblocker = true;

    const removePopup = false;

    const debugMessages = true;

    const fixTimestamps = true;

    //
    //      CODE
    //

    let currentUrl = window.location.href;

    let isVideoPlayerModified = false;

    //
    // Setup
    //

    //log("Script started");

    if (adblocker) removeAds();
    if (removePopup) popupRemover();
    if (fixTimestamps) timestampFix();

    function popupRemover() {
        setInterval(() => {
            const modalOverlay = document.querySelector("tp-yt-iron-overlay-backdrop");
            const popup = document.querySelector(".style-scope ytd-enforcement-message-view-model");
            const popupButton = document.getElementById("dismiss-button");
            const video = document.querySelector('video');

            document.body.style.setProperty('overflow-y', 'auto', 'important');

            if (modalOverlay) {
                modalOverlay.removeAttribute("opened");
                modalOverlay.remove();
            }

            if (popup) {
                //log("Popup detected, removing...");
                if(popupButton) popupButton.click();
                popup.remove();
                if (video) video.play();
                log("Popup removed");
            }

            if (video && video.paused) {
                video.play();
            }
        }, 1000);
    }

    function removeAds() {
        log("removeAds()");

        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                isVideoPlayerModified = false;
                clearAllPlayers();
                removePageAds();
            }

            if (window.location.href.includes("shorts")) {
                log("Youtube shorts detected, ignoring...");
                return;
            }

            if (isVideoPlayerModified){
                removeAllDuplicateVideos();
                return;
            }

            log("Video replacement started!");

            const video = document.querySelector('video');
            if (video) {
                video.volume = 0;
                video.pause();
                video.remove();
            }

            if (!clearAllPlayers()) {
                return;
            }

            const errorScreen = document.querySelector("#error-screen");
            if (errorScreen) errorScreen.remove();

            const url = new URL(window.location.href);
            const urlParams = new URLSearchParams(url.search);
            let videoID = '';

            if (urlParams.has('v')) {
                videoID = urlParams.get('v');
            } else {
                const pathSegments = url.pathname.split('/');
                const liveIndex = pathSegments.indexOf('live');
                if (liveIndex !== -1 && liveIndex + 1 < pathSegments.length) {
                    videoID = pathSegments[liveIndex + 1];
                }
            }

            if (!videoID) {
                log("YouTube video URL not found.", "e");
                return;
            }

            log("Video ID: " + videoID);

            const finalUrl = `https://www.youtube-nocookie.com/embed/${videoID}?autoplay=1&modestbranding=1&rel=0`;
            const iframe = document.createElement('iframe');

            iframe.setAttribute('src', finalUrl);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            iframe.setAttribute('allowfullscreen', '');
            
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 9999;
                pointer-events: all;
            `;

            const videoPlayerElement = document.querySelector('.html5-video-player');
            if (videoPlayerElement) {
                videoPlayerElement.appendChild(iframe);
                //log("Finished");
                isVideoPlayerModified = true;
            }
        }, 500);
        
        removePageAds();
    }

    function removeAllDuplicateVideos() {
        document.querySelectorAll('video').forEach(video => {
            if (video.src.includes('www.youtube.com')) {
                video.muted = true;
                video.pause();
                video.addEventListener('volumechange', () => {
                    if (!video.muted) {
                        video.muted = true;
                        video.pause();
                        log("Video unmuted detected! remuted!");
                    }
                });
                video.addEventListener('play', () => {
                    video.pause();
                    log("Video play detected! repaused!");
                });
                log("Duplicate video found! muted!");
            }
        });
    }

    function clearAllPlayers() {
        const videoPlayerElements = document.querySelectorAll('.html5-video-player');
        if (videoPlayerElements.length === 0) {
            log("No elements with class 'html5-video-player' found.", "e");
            return false;
        }
    
        videoPlayerElements.forEach(videoPlayerElement => {
            const iframes = videoPlayerElement.querySelectorAll('iframe');
            iframes.forEach(iframe => iframe.remove());
        });
    
        log("Removed all current players!");
        return true;
    }

    function removePageAds() {
        const style = document.createElement('style');
        style.textContent = `
            ytd-action-companion-ad-renderer,
            ytd-display-ad-renderer,
            ytd-video-masthead-ad-advertiser-info-renderer,
            ytd-video-masthead-ad-primary-video-renderer,
            ytd-in-feed-ad-layout-renderer,
            ytd-ad-slot-renderer,
            yt-about-this-ad-renderer,
            yt-mealbar-promo-renderer,
            ytd-statement-banner-renderer,
            ytd-banner-promo-renderer-background,
            .ytd-video-masthead-ad-v3-renderer,
            div#player-ads.style-scope.ytd-watch-flexy,
            ad-slot-renderer,
            ytm-promoted-sparkles-web-renderer,
            masthead-ad,
            tp-yt-iron-overlay-backdrop,
            #masthead-ad {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        log("Removed page ads (✔️)");
    }

    function timestampFix() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('yt-core-attributed-string__link') && target.href.includes('&t=')) {
                event.preventDefault();
                const timestamp = target.href.split('&t=')[1].split('s')[0];
                //log(`Timestamp link clicked: ${timestamp} seconds`);
                changeTimestamp(timestamp);
            }
        });
    }

    function changeTimestamp(timestamp) {
        document.querySelectorAll('.html5-video-player iframe').forEach(iframe => {
            if (iframe.src.includes("&start=")) {
                iframe.src = iframe.src.replace(/&start=\d+/, "&start=" + timestamp);
            } else {
                iframe.src += "&start=" + timestamp;
            }
        });
    }

    const observer = new MutationObserver((mutations) => {
        const isVideoAdded = mutations.some(mutation => 
            [...mutation.addedNodes].some(node => node.tagName === 'VIDEO')
        );

        if (isVideoAdded && !window.location.href.includes("shorts")) {
            //log("New video detected, checking for duplicates.");
            removeAllDuplicateVideos();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function log(message, level = 'info', ...args) {
        if(!debugMessages) return;
        
        const prefix = '🔧 Remove Adblock Thing:';
        const styles = {
            error: ['❌', 'color: orange'],
            log: ['✅', 'color: green'],
            warning: ['⚠️', 'color: yellow'],
            info: ['ℹ️', 'color: white']
        };
        
        const [icon, style] = styles[level] || styles.info;
        console.log(`%c${icon} ${prefix} ${message}`, style, ...args);
    }
    'use strict';

    let video;
    // Seletor de anúncios da interface
    const cssSelectorArr = [
        '#masthead-ad', // Banner no topo da página inicial
        'ytd-rich-item-renderer.style-scope.ytd-rich-grid-row #content:has(.ytd-display-ad-renderer)', // Anúncios entre vídeos na home
        '.video-ads.ytp-ad-module', // Anúncio na parte inferior do player
        'tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)', // Promoção Premium na página de reprodução
        'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]', // Anúncio no painel lateral
        '#related #player-ads', // Anúncios ao lado dos comentários
        '#related ytd-ad-slot-renderer', // Vídeos patrocinados na lateral
        'ytd-ad-slot-renderer', // Anúncios nos resultados de busca
        'yt-mealbar-promo-renderer', // Sugestão de Premium
        'ytd-popup-container:has(a[href="/premium"])', // Popup de bloqueio Premium
        'ad-slot-renderer', // Anúncio de terceiros (mobile)
        'ytm-companion-ad-renderer', // Link de vídeo pulável (mobile)
    ];
    window.dev = false; // Modo desenvolvedor

    function moment(time) {
        let y = time.getFullYear()
        let m = (time.getMonth() + 1).toString().padStart(2, '0')
        let d = time.getDate().toString().padStart(2, '0')
        let h = time.getHours().toString().padStart(2, '0')
        let min = time.getMinutes().toString().padStart(2, '0')
        let s = time.getSeconds().toString().padStart(2, '0')
        return `${y}-${m}-${d} ${h}:${min}:${s}`
    }

    function log(msg) {
        if (!window.dev) return false;
        console.log(window.location.href);
        console.log(`${moment(new Date())}  ${msg}`);
    }

    function setRunFlag(name) {
        let style = document.createElement('style');
        style.id = name;
        (document.head || document.body).appendChild(style);
    }

    function getRunFlag(name) {
        return document.getElementById(name);
    }

    function checkRunFlag(name) {
        if (getRunFlag(name)) {
            return true;
        } else {
            setRunFlag(name);
            return false;
        }
    }

    function generateRemoveADHTMLElement(id) {
        if (checkRunFlag(id)) {
            log('Elemento para esconder anúncios já gerado.');
            return false;
        }
        let style = document.createElement('style');
        (document.head || document.body).appendChild(style);
        style.appendChild(document.createTextNode(generateRemoveADCssText(cssSelectorArr)));
        log('Elemento para esconder anúncios criado com sucesso.');
    }

    function generateRemoveADCssText(cssSelectorArr) {
        cssSelectorArr.forEach((selector, index) => {
            cssSelectorArr[index] = `${selector}{display:none!important}`;
        });
        return cssSelectorArr.join(' ');
    }

    function nativeTouch() {
        let touch = new Touch({
            identifier: Date.now(),
            target: this,
            clientX: 12,
            clientY: 34,
            radiusX: 56,
            radiusY: 78,
            rotationAngle: 0,
            force: 1
        });
        let touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            view: window,
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch]
        });
        this.dispatchEvent(touchStartEvent);

        let touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            view: window,
            touches: [],
            targetTouches: [],
            changedTouches: [touch]
        });
        this.dispatchEvent(touchEndEvent);
    }

    function getVideoDom() {
        video = document.querySelector('.ad-showing video') || document.querySelector('video');
    }

    function playAfterAd() {
        if (video.paused && video.currentTime < 1) {
            video.play();
            log('Vídeo reproduzido automaticamente.');
        }
    }

    function closeOverlay() {
        const premiumContainers = [...document.querySelectorAll('ytd-popup-container')];
        const matchingContainers = premiumContainers.filter(container => container.querySelector('a[href="/premium"]'));

        if (matchingContainers.length > 0) {
            matchingContainers.forEach(container => container.remove());
            log('Removido popup de Premium do YouTube.');
        }

        const backdrops = document.querySelectorAll('tp-yt-iron-overlay-backdrop');
        const targetBackdrop = Array.from(backdrops).find(
            (backdrop) => backdrop.style.zIndex === '2201'
        );
        if (targetBackdrop) {
            targetBackdrop.className = '';
            targetBackdrop.removeAttribute('opened');
            log('Fundo escurecido removido.');
        }
    }

    function skipAd() {
        const skipButton = document.querySelector('.ytp-ad-skip-button') ||
            document.querySelector('.ytp-skip-ad-button') ||
            document.querySelector('.ytp-ad-skip-button-modern');

        const shortAdMsg = document.querySelector('.video-ads.ytp-ad-module .ytp-ad-player-overlay') ||
            document.querySelector('.ytp-ad-button-icon');

        if ((skipButton || shortAdMsg) && window.location.href.indexOf('https://m.youtube.com/') === -1) {
            video.muted = true;
        }

        if (skipButton) {
            const delayTime = 0.5;
            setTimeout(skipAd, delayTime * 1000);
            if (video.currentTime > delayTime) {
                video.currentTime = video.duration;
                log('Pulo forçado do anúncio por tempo.');
                return;
            }
            skipButton.click();
            nativeTouch.call(skipButton);
            log('Anúncio pulado com botão.');
        } else if (shortAdMsg) {
            video.currentTime = video.duration;
            log('Anúncio encerrado à força.');
        }
    }

    function removePlayerAD(id) {
        if (checkRunFlag(id)) {
            log('Remoção de anúncios durante reprodução já ativa.');
            return false;
        }

        const targetNode = document.body;
        const config = { childList: true, subtree: true };
        const observer = new MutationObserver(() => {
            getVideoDom(); closeOverlay(); skipAd(); playAfterAd();
        });
        observer.observe(targetNode, config);
        log('Remoção de anúncios durante reprodução ativada.');
    }

    function main() {
        generateRemoveADHTMLElement('removeADHTMLElement');
        removePlayerAD('removePlayerAD');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
        log('Script de remoção de anúncios prestes a iniciar.');
    } else {
        main();
        log('Script de remoção de anúncios iniciado rapidamente.');
    }

    let resumeVideo = () => {
        const videoelem = document.body.querySelector('video.html5-main-video');
        if (videoelem && videoelem.paused) {
            console.log('Vídeo retomado');
            videoelem.play();
        }
    }

    let removePop = node => {
        const elpopup = node.querySelector('.ytd-popup-container > .ytd-popup-container > .ytd-enforcement-message-view-model');

        if (elpopup) {
            elpopup.parentNode.remove();
            console.log('Popup removido', elpopup);
            const bdelems = document.getElementsByTagName('tp-yt-iron-overlay-backdrop');
            for (var x = (bdelems || []).length; x--;) bdelems[x].remove();
            resumeVideo();
        }

        if (node.tagName.toLowerCase() === 'tp-yt-iron-overlay-backdrop') {
            node.remove();
            resumeVideo();
            console.log('Fundo escurecido removido', node);
        }
    }

    let obs = new MutationObserver(mutations => mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            Array.from(mutation.addedNodes)
                .filter(node => node.nodeType === 1)
                .map(node => removePop(node));
        }
    }))

    obs.observe(document.body, {
        childList: true,
        subtree: true
    });
})();