// ==UserScript==
// @name         YouTube Auto Skip
// @namespace    https://github.com/haejeong87/ytas/
// @version      0.2.3
// @description  YouTube Auto Skip Ads
// @author       Hae Jeong
// @updateURL    https://raw.githubusercontent.com/haejeong87/ytas/main/ytas.js
// @downloadURL  https://raw.githubusercontent.com/haejeong87/ytas/main/ytas.js
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    log('Init');
    const CURRENT_TIME_KEY = 'YTAS_currentTime';
    const DISABLE_RELOAD = false;
    const SHOULD_UNMUTE_KEY = 'YTAS_shouldUnmute';
    const RELOAD_DELAY = 10000;
    let intervalId = null;
    class VideoStorage {
        constructor(videoId) {
            this.videoId = videoId;
        }
        getKey(name) {
            return `YTAS_${this.videoId}_${name}`;
        }
        getTime() {
            return localStorage.getItem(this.getKey('time'));
        }
        setTime(time) {
            return localStorage.setItem(this.getKey('time'), time);
        }
        getShouldUnmute() {
            return localStorage.getItem(this.getKey('shouldUnmute')) !== '0';
        }
        setShouldUnmute(shouldUnmute) {
            return localStorage.setItem(this.getKey('shouldUnmute'), shouldUnmute ? '1' : '0');
        }
    }
    const YT = {
        press(label) {
             document.querySelector(`#movie_player button[title^="${label}"]`).click();
        },
        isAdPlaying() {
            return document.querySelector('#movie_player.ad-showing') != null;
        },
        isDialogOpen() {
            const dialog = document.querySelector('tp-yt-paper-dialog');
            if (dialog == null) {
                return false;
            }
            return dialog.style.display !== 'none' || dialog.style.maxHeight !== '0px';
        },
        isHomePath() {
            return location.pathname === '/';
        },
        findAndClickSkipButton() {
            document.querySelector('#movie_player [class*=ytp-ad-skip-button]').click();
        },
        getCurrentTime() {
            return Math.floor(document.querySelector('#movie_player video').currentTime);
        },
        getKey(videoId) {
            return `${CURRENT_TIME_KEY}_${videoId}`;
        },
        getVideoId() {
            return new URL(location.href).searchParams.get('v');
        },
        updateCurrentTime() {
            storage.setTime(this.getCurrentTime());
        },
        getUrlAtCurrentTime() {
            const url = new URL(location.href);
            if (this.isCurrentTimeForCurrentVideo()) {
                url.searchParams.set('t', storage.getTime());
            }
            return url.toString();
        },
        confirmDialog() {
            document.querySelector('tp-yt-paper-dialog button[aria-label="Yes"]').click();
        },
        reload() {
            if (DISABLE_RELOAD) {
                return;
            }
            const url = this.getUrlAtCurrentTime();
            log(`Reloading: ${url}`);
            history.replaceState(null, null, url);
            location.reload();
        },
    };
    const storage = new VideoStorage(YT.getVideoId());
    main();
    function main() {
        addStyle();
        setInterval(autoHomeToSub, 1000);
        intervalId = setInterval(autoSkip, 1000);
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
                opacity: 0.9;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                inset: 10px;
                z-index: 999;
            }
        `;
        document.body.appendChild(style);
    }
    function autoSkip() {
        if (YT.isAdPlaying()) {
            try {
                YT.findAndClickSkipButton();
                log('Found Skip button');
            } catch (_) {
                try {
                    YT.press('Mute');
                    log('Muted');
                    storage.setShouldUnmute(true);
                } catch (e) {
                    log(`Could not find Mute button: ${e}`);
                }
                setTimeout(() => YT.reload(), RELOAD_DELAY);
                clearInterval(intervalId);
            }
        } else {
            YT.updateCurrentTime();
            if (YT.isDialogOpen()) {
                log('Detected dialog');
                try {
                    YT.confirmDialog();
                    log('Confirmed the dialog');
                } catch (e) {
                    log(`Could not find Yes button: ${e}`);
                }
            }
            if (storage.getShouldUnmute()) {
                try {
                    YT.press('Unmute');
                    log('Unmuted');
                } catch (e) {
                    log(`Could not find Unmute button: ${e}`);
                } finally {
                    storage.setShouldUnmute(false);
                }
            }
        }
    }
    function autoHomeToSub() {
        if (YT.isHomePath()) {
            log('Detected home path');
            location.assign('/feed/subscriptions');
        }
    }
})();