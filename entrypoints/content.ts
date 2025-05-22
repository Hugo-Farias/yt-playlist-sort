import { playlistAPI } from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import { getVideoId, comparePlaylist, storeCache, getCache } from "@/helper.ts";
import { renderedPlaylistItem } from "@/types.ts";
import { API_URI } from "@/config.ts";
import { API_KEY } from "@/env.ts";

let previousURL = "";
let videoItemSelector =
  "ytd-playlist-panel-video-renderer:not([within-miniplayer])";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener((message: MessageType) => {
      // console.clear();
      if (!message.videoId || !message.listId) return null;
      if (getVideoId(previousURL) === message.videoId) return null;

      previousURL = location.href;
      console.log("content init");
      console.log(API_URI + `&playlistId=${message.listId}&key=${API_KEY}`);

      const video = document.querySelector<HTMLVideoElement>("video");
      if (video) video.pause();

      const renderedPlaylistItems = [
        ...document.querySelectorAll<HTMLDivElement>(videoItemSelector),
      ].map((el): renderedPlaylistItem => {
        const titleEl = el.querySelector("#video-title");
        const urlEl = el.querySelector("a");

        return {
          title: titleEl?.textContent ? titleEl?.textContent.trim() : "null",
          videoId: urlEl ? getVideoId(urlEl.href) : "null",
        };
      });

      const cachedData = getCache(message.listId);

      if (cachedData && comparePlaylist(cachedData, renderedPlaylistItems)) {
        console.log("check", cachedData.items);
      } else {
        playlistAPI(message.listId!)?.then((data) => {
          if (!data) return null;
          storeCache(message.listId!, data);
          return data;
        });
      }
    });
  },
  matches: ["*://*.youtube.com/*"],
});
