import { MessageType } from "@/entrypoints/background.ts";
import { fetchPlaylistItems } from "@/chromeAPI.ts";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  main() {
    chrome.runtime.onMessage.addListener((message: MessageType) => {
      // console.log(fetchPlaylistItems());

      const { id } = message;
      if (!id) return null;

      console.log(id);

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

      console.log(playlistItems);
    });
  },
});
