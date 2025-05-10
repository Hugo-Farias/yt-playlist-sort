import chromeAPI from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import { API_KEY } from "@/config.ts";
import { getVideoId, checkPlaylist, storeCache, getCache } from "@/helper.ts";
import { localPlaylistItem } from "@/types.ts";

let previousURL = "";
let videoItemSelector =
  "ytd-playlist-panel-video-renderer:not([within-miniplayer])";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener((message: MessageType) => {
      if (!message.videoId || !message.listId) return null;
      if (getVideoId(previousURL) === message.videoId) return null;

      previousURL = location.href;
      console.log("content init");

      const video = document.querySelector<HTMLVideoElement>("video");
      if (video) video.pause();

      const localPlaylistItems = [
        ...document.querySelectorAll<HTMLDivElement>(videoItemSelector),
      ].map((el): localPlaylistItem => {
        const titleEl = el.querySelector("#video-title");
        const urlEl = el.querySelector("a");

        return {
          title: titleEl?.textContent ? titleEl?.textContent.trim() : "null",
          videoId: urlEl ? getVideoId(urlEl.href) : "null",
        };
      });

      const cachedData = getCache(message.listId);

      const check: boolean = checkPlaylist(
        cachedData ? cachedData.items : null,
        localPlaylistItems,
      );

      if (check && cachedData) {
        console.log("check", cachedData.items);
      } else {
        chromeAPI(message.listId, API_KEY)?.then((data) => {
          if (!data || !message.listId) return null;
          storeCache(message.listId, data);
          return data;
        });
      }
    });
  },
  matches: ["*://*.youtube.com/*"],
});
