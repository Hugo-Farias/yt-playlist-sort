import { playlistAPI } from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  waitForPlaylistRender,
} from "@/helper.ts";

let previousURL = "";
let videoItemSelector =
  "ytd-playlist-panel-video-renderer:not([within-miniplayer])";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener(async (message: MessageType) => {
      if (!message.videoId || !message.listId) return null;
      if (getVideoId(previousURL) === message.videoId) return null;

      previousURL = location.href;
      console.log("content init");

      const video = document.querySelector<HTMLVideoElement>("video");

      if (!video) return null;
      else {
        video.pause();
      }

      const nodePlaylistRender =
        await waitForPlaylistRender<HTMLDivElement>(videoItemSelector);

      if (!nodePlaylistRender) return null;

      const renderedPlaylistItems = [...nodePlaylistRender].map(
        (el): string => {
          const urlId = getVideoId(el.querySelector("a")?.href ?? "");
          if (!urlId) return "";
          return urlId;
        },
      );

      const renderedCache = getCache("renderedCache", message.listId);

      console.log("=>renderedPlaylistItems", renderedPlaylistItems);
      console.log("=>renderedCache", renderedCache);

      if (
        renderedCache &&
        !!renderedCache?.length &&
        comparePlaylist(renderedCache, renderedPlaylistItems)
      ) {
        console.log("check!!!");
      } else {
        storeCache("renderedCache", renderedPlaylistItems, message.listId);
        playlistAPI(message.listId)?.then((data) => {
          if (!data) return null;
          storeCache("playlistCache", data, message.listId!);
          return data;
        });
      }
    });
  },
  matches: ["*://*.youtube.com/*"],
});
