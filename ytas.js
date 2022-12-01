// ==UserScript==
// @name         YouTube Auto Skip
// @namespace    https://github.com/haejeong87/ytas/
// @version      0.1.2
// @description  YouTube Auto Skip Ads
// @author       Hae Jeong
// @updateURL    https://raw.githubusercontent.com/haejeong87/ytas/main/ytas.js
// @downloadURL  https://raw.githubusercontent.com/haejeong87/ytas/main/ytas.js
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const style = document.createElement('style');
  style.innerHTML = `
    #logo-icon svg { box-shadow: 0 1px red; }
    .ytp-ad-module { display: none; }
    yt-mealbar-promo-renderer { display: none; }
  `;
  document.body.appendChild(style);
  function autoskip() {
      const e = document.querySelector('.ytp-ad-skip-button');
      e && e.click();
  }
  setInterval(autoskip, 1000);
})();