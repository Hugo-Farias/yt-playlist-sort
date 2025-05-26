import { playlistAPI } from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  waitForElement,
} from "@/helper.ts";
import { RenderedPlaylistItem } from "@/types.ts";
// import { API_URI } from "@/config.ts";
// import { API_KEY } from "@/env.ts";

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
      // console.log(API_URI + `&playlistId=${message.listId}&key=${API_KEY}`);
      // console.log("Playlist ID:", message.listId);
      // console.log("Video ID:", message.videoId);

      const video = document.querySelector<HTMLVideoElement>("video");

      if (!video) return null;
      else {
        video.pause();
      }

      // TODO !important! have this wait for the element to load *async*
      const renderedPlaylistItems =
        await waitForElement<HTMLDivElement>(videoItemSelector);

      console.log(renderedPlaylistItems);
      // const renderedPlaylistItems = [
      //   ...document.querySelectorAll<HTMLDivElement>(videoItemSelector),
      // ].map((el): RenderedPlaylistItem => {
      //   {
      //     const titleEl = el.querySelector("#video-title");
      //     const urlEl = el.querySelector("a");
      //     return {
      //       title: titleEl?.textContent ? titleEl?.textContent.trim() : "null",
      //       videoId: urlEl ? getVideoId(urlEl.href) : "null",
      //     };
      //   }
      // });

      const cachedData = getCache("renderedCache", message.listId);

      console.log("=>renderedPlaylistItems", renderedPlaylistItems);
      console.log("=>renderedPlaylistItems", !!renderedPlaylistItems.length);

      console.log("=>cachedData", cachedData);
      console.log("=>cachedData", !!cachedData?.length);

      console.log(comparePlaylist(cachedData, renderedPlaylistItems));

      // console.log("=>(content.ts:40) message.listId", message.listId);

      return null;
      // if (
      //       cachedData &&
      //       !!cachedData?.length &&
      //       comparePlaylist(cachedData, renderedPlaylistItems)
      //     ) {
      //       console.log("check!!!");
      //     } else {
      //       storeCache("renderedCache", renderedPlaylistItems, message.listId);
      //       playlistAPI(message.listId)?.then((data) => {
      //         if (!data) return null;
      //         storeCache("playlistCache", data, message.listId!);
      //         return data;
      //       });
      //     }
    });
  },
  matches: ["*://*.youtube.com/*"],
});
