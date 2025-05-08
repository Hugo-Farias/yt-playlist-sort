import { MessageType } from "@/entrypoints/background.ts";
import { getPlaylistInfo } from "@/chromeAPI.ts";
import { API_KEY } from "@/config.ts";
import { getVideoId } from "@/helper.ts";

let previousURL = "";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener((message: MessageType) => {
      console.log(message.videoId === getVideoId(previousURL));
      console.log("message.videoId", message.videoId);
      console.log("getVideoId(previousURL)", getVideoId(previousURL));

      if (previousURL === message.url) return null;

      previousURL = location.href;
      console.log("content exec");

      getPlaylistInfo(message.videoId!, API_KEY)?.then((data) => {
        if (!data) return null;
        // console.log(data);
        // data.items.forEach((v) => console.log(v.snippet.title));
      });

      const { listId } = message;
      if (!listId) return null;

      // console.log(id);

      let videoItemSelector =
        "ytd-playlist-panel-video-renderer:not([within-miniplayer])";

      const video = document.querySelector<HTMLVideoElement>("video");
      if (video) video.pause();

      const playlistItems = [
        ...document.querySelectorAll<HTMLDivElement>(videoItemSelector),
      ].map((el) => {
        const titleEl = el.querySelector("#video-title");
        const urlEl = el.querySelector("a");

        if (!titleEl?.textContent || !urlEl) return null;

        return {
          title: titleEl.textContent.trim(),
          videoId: new URL(urlEl.href).searchParams.get("v"),
        };
      });

      // playlistItems.forEach((v) => console.log(v));
    });
  },
  matches: ["*://*.youtube.com/*"],
});
