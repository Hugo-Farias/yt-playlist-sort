import { playlistAPI } from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  waitForElements,
} from "@/helper.ts";
import { API_URL, playlistItemSelector } from "@/config.ts";
import { API_KEY } from "@/env.ts";

let previousURL = "";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener(async (message: MessageType) => {
      if (!message.videoId || !message.listId) return null;
      if (previousURL === message.url) return null; // Prevents duplicate execution
      previousURL = location.href;

      console.log("content init");

      console.log(API_URL + `&playlistId=${message.listId}&key=${API_KEY}`);

      const nodePlaylistRender =
        await waitForElements<HTMLDivElement>(playlistItemSelector);

      // development only paragraph
      const videoEl = document.querySelector("video");
      if (videoEl) {
        videoEl.pause();
      }

      if (!nodePlaylistRender) return null;

      const renderedPlaylistItems = [...nodePlaylistRender].map((el): string =>
        getVideoId(el.querySelector("a")?.href),
      );

      const renderedCache = getCache("renderedCache", message.listId);

      if (
        !renderedCache?.length ||
        !comparePlaylist(renderedCache, renderedPlaylistItems)
      ) {
        console.log("YT-playlist-sort: Cache hydration!!!");
        storeCache("renderedCache", renderedPlaylistItems, message.listId);
        const data = await playlistAPI(message.listId);
        if (data) {
          storeCache("apiCache", data, message.listId!);
        }
      }

      //TODO use this data to organize the playlist,

      const apiCache = getCache("apiCache", message.listId!);

      nodePlaylistRender.forEach((value) => {
        const videoId = getVideoId(value.querySelector("a")?.href);
        if (!message.videoId) return null;

        if (!apiCache?.items[videoId]) return null;

        const itemEl = value.querySelector("#byline-container");
        if (!itemEl) return null;
        const { videoPublishedAt } = apiCache?.items[videoId];
        const videoDate = new Date(videoPublishedAt);

        const span = document.createElement("span");
        span.textContent = videoDate.toUTCString().slice(0, -13);

        itemEl.appendChild(span);

        // console.log(`${videoDate.getFullYear()}/${videoDate.getMonth()}/${videoDate.getDay()}`,);
      });
    });
  },
  matches: ["*://*.youtube.com/*"],
});
