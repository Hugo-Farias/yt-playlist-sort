import { playlistAPI } from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  waitForElements,
  getListId,
} from "@/helper.ts";
import { playlistItemSelector } from "@/config.ts";

let previousURL = "";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener(async (message: MessageType) => {
      if (!message.videoId || !message.listId) return null;
      if (previousURL === message.url) return null; // Prevents duplicate execution
      previousURL = location.href;

      console.log("content init");

      const nodePlaylistRender =
        await waitForElements<HTMLDivElement>(playlistItemSelector);

      // development only paragraph
      const videoEl = document.querySelector("video");
      if (!videoEl) return null;
      else {
        videoEl.pause();
      }

      if (!nodePlaylistRender) return null;

      const renderedPlaylistItems = [...nodePlaylistRender].map((el): string =>
        getVideoId(el.querySelector("a")?.href),
      );
      const renderedCache = getCache("renderedCache", message.listId);

      // console.log("=>renderedPlaylistItems", renderedPlaylistItems);
      // console.log("=>renderedCache", renderedCache);

      if (
        !renderedCache ||
        renderedCache.length === 0 ||
        !comparePlaylist(renderedCache, renderedPlaylistItems)
      ) {
        console.log("Cache hit!!!");
        storeCache("renderedCache", renderedPlaylistItems, message.listId);
        const data = await playlistAPI(message.listId);
        if (data) {
          storeCache("playlistCache", data, message.listId!);
        }
      }

      //TODO use this data to organize the playlist,
      console.log(
        getCache("playlistCache", getListId(location.href))?.items[
          message.videoId
        ].contentDetails.videoPublishedAt,
      );
    });
  },
  matches: ["*://*.youtube.com/*"],
});
