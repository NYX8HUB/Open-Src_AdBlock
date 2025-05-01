// thx https://github.com/TheRealJoelmatic/RemoveAdblockThing
//fuck you youtube

(function() {
    //
    //      Config
    //

    // Enable The Undetected Adblocker
    const adblocker = true;

    // Enable The Popup remover (pointless if you have the Undetected Adblocker)
    const removePopup = false;

    // Enable debug messages into the console
    const debugMessages = true;

    // Fix timestamps in the youtube comments for new method
    const fixTimestamps = true;

    //
    //      CODE
    //

    // Store the initial URL
    let currentUrl = window.location.href;

    // Used for after the player is updated
    let isVideoPlayerModified = false;

    //
    // Setup
    //

    //log("Script started");

    if (adblocker) removeAds();
    if (removePopup) popupRemover();
    if (fixTimestamps) timestampFix();

    // Remove popups
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

    // Adblocker method
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
})();