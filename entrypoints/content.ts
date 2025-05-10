import { MessageType } from "@/entrypoints/background.ts";
import { getPlaylistInfo } from "@/chromeAPI.ts";
import { API_KEY } from "@/config.ts";
import { getVideoId, comparePlaylist } from "@/helper.ts";
import dummyList from "../data/DUMMYLIST.json";
import { localPlaylistItem } from "@/types.ts";

let previousURL = "";
let videoItemSelector =
  "ytd-playlist-panel-video-renderer:not([within-miniplayer])";

// TODO compare api return with rendered playlist items

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener((message: MessageType) => {
      if (!message.videoId || !message.listId) return null;
      if (getVideoId(previousURL) === message.videoId) return null;

      previousURL = location.href;
      console.log("content init");

      getPlaylistInfo(message.listId, API_KEY, true)?.then((data) => {
        if (!data) return null;
        // console.log(data.items);
        // data.items.forEach((v) => console.log(v.etag));

        const video = document.querySelector<HTMLVideoElement>("video");
        if (video) video.pause();

        const playlistItems = [
          ...document.querySelectorAll<HTMLDivElement>(videoItemSelector),
        ].map((el): localPlaylistItem => {
          const titleEl = el.querySelector("#video-title");
          const urlEl = el.querySelector("a");

          return {
            title: titleEl?.textContent ? titleEl?.textContent.trim() : "null",
            videoId: urlEl ? getVideoId(urlEl.href) : "null",
          };
        });

        console.log(comparePlaylist(data.items, playlistItems));
      });
    });
  },
  matches: ["*://*.youtube.com/*"],
});
