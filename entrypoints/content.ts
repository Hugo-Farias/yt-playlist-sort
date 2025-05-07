import { MessageType } from "@/entrypoints/background.ts";
import { getPlaylistInfo } from "@/chromeAPI.ts";
// import { API_KEY } from "@/config.ts";
import { YouTubePlaylistItemListResponse } from "@/types.ts";

const dummyPlaylistId = "PL9QdAxhqglB_h9lGh7kcXDewZZA-B6AEL";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener((message: MessageType) => {
      const data: YouTubePlaylistItemListResponse = getPlaylistInfo(
        dummyPlaylistId,
        "AIzaSyD9ByeJ-rnx_0V2EiMQzWVNmnvx679KOcY",
      );

      console.log("=>(content.ts:16) data", data.items);

      const { id } = message;
      if (!id) return null;

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
    });
  },
  matches: ["*://*.youtube.com/*"],
});
