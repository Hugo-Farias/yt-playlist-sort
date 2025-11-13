// ==UserScript==
// @name         Reload if atempting to redirect
// @namespace    http://tampermonkey.net/
// @version      2025-11-12
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/tv
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const content = document.querySelector(".content-container");

  setTimeout(() => {
    if (content) location.reload();
  }, 100);
})();
