// ==UserScript==
// @name         YouTube Auto Skip
// @namespace    https://github.com/haejeong87/ytas/
// @version      0.2.1
// @description  YouTube Auto Skip Ads
// @author       Hae Jeong
// @updateURL    https://raw.githubusercontent.com/haejeong87/ytas/main/ytas.js
// @downloadURL  https://raw.githubusercontent.com/haejeong87/ytas/main/ytas.js
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    const CURRENT_TIME_KEY = 'YTAS_currentTime';
    const VIDEO_ID_KEY = 'YTAS_videoId';
    const SHOULD_UNMUTE_KEY = 'YTAS_shouldUnmute';
    const RELOAD_DELAY = 7000;
    let intervalId = null;
    log('Init');
    main();
    function main() {
        addStyle();
        intervalId = setInterval(autoSkip, 100);
        log('Interval scheduled');
    }
    function log(msg) {
        console.log(`[YTAS] ${msg}`);
    }
    function addStyle() {
        const style = document.createElement('style');
        style.innerHTML = `
            #logo-icon svg { box-shadow: 0 1px red; }
            #player-ads,
            .ytp-ad-module,
            yt-mealbar-promo-renderer,
            ytd-ad-slot-renderer { display: none; !important }
            .ad-showing::after {
                content: 'Ad is hidden';
                background: black;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                z-index: 999;
            }
        `;
        document.body.appendChild(style);
    }
    const YT = {
        player: document.querySelector('#movie_player'),
        press(label) {
             this.player.querySelector(`button[title^="${label}"]`).click();
        },
        isAdPlaying() {
            return this.player.classList.contains('ad-showing');
        },
        isCurrentTimeForCurrentVideo() {
            return this.getVideoId() === localStorage.getItem(VIDEO_ID_KEY);
        },
        isDialogOpen() {
            const dialog = document.querySelector('tp-yt-paper-dialog');
            return (dialog != null) && dialog.style.display !== 'none';
        },
        findAndClickSkipButton() {
            this.player.querySelector('.ytp-ad-skip-button').click();
        },
        getCurrentTime() {
            return Math.floor(this.player.querySelector('video').currentTime);
        },
        getVideoId() {
            return new URL(location.href).searchParams.get('v');
        },
        updateCurrentTime() {
            localStorage.setItem(CURRENT_TIME_KEY, this.getCurrentTime());
            localStorage.setItem(VIDEO_ID_KEY, this.getVideoId());
        },
        getUrlAtCurrentTime() {
            const url = new URL(location.href);
            if (this.isCurrentTimeForCurrentVideo()) {
                url.searchParams.set('t', localStorage.getItem(CURRENT_TIME_KEY));
            }
            return url.toString();
        },
        confirmDialog() {
            document.querySelector('tp-yt-paper-dialog button[aria-label="Yes"]').click();
        },
        reload() {
            const url = this.getUrlAtCurrentTime();
            log(`Reloading: ${url}`);
            history.replaceState(null, null, url);
            location.reload();
        },
    };
    function autoSkip() {
        if (YT.isAdPlaying()) {
            try {
                YT.findAndClickSkipButton();
                log('Found Skip button');
            } catch (_) {
                try {
                    YT.press('Mute');
                    localStorage.setItem(SHOULD_UNMUTE_KEY, '1');
                    log('Muted')
                } catch (e) {
                    log(`Could not find Mute button: ${e}`);
                }
                setTimeout(() => YT.reload(), RELOAD_DELAY);
                clearInterval(intervalId);
            }
        } else {
            if (YT.isDialogOpen()) {
                log('Detected dialog');
                try {
                    YT.confirmDialog();
                    log('Confirmed the dialog');
                } catch (e) {
                    log(`Could not find Yes button: ${e}`);
                }
            }
            if (localStorage.getItem(SHOULD_UNMUTE_KEY) === '1') {
                try {
                    YT.press('Unmute');
                    localStorage.setItem(SHOULD_UNMUTE_KEY, '0');
                    log('Unmuted');
                } catch (e) {
                    log(`Couldn not find Unmute button: ${e}`);
                }
            }
            YT.updateCurrentTime();
        }
    }
})();