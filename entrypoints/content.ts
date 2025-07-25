import { playlistAPI } from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  waitForElements,
  reorderPlaylist,
} from "@/helper.ts";
import { playlistItemSelector } from "@/config.ts";

let previousURL = "";
let previousPlaylistId: string | null = "";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener(async (message: MessageType) => {
      console.log("content init:");
      if (!message.videoId) return null;
      if (previousURL === message.url) return null; // Prevents duplicate execution
      previousURL = location.href;

      // console.log(API_URL + `&playlistId=${message.listId}&key=${API_KEY}`);

      const nodePlaylistRender = message.listId
        ? await waitForElements<HTMLDivElement>(playlistItemSelector)
        : null;

      // NOTE: development block, remove in production
      const videoEl = document.querySelector("#player-container-outer");
      if (videoEl) {
        setTimeout(() => {
          // videoEl.pause();
          videoEl.remove(); // Remove the video element to prevent autoplay
        }, 100);
      }

      if (!nodePlaylistRender) return null;

      const renderedPlaylistIds = [...nodePlaylistRender].map((el): string =>
        getVideoId(el.querySelector("a")?.href),
      );

      const renderedCache = getCache("renderedCache", message.listId);
      let apiCache = getCache("apiCache", message.listId!);

      // let playlistContainer = document.querySelector(".playlist-items");

      // if (playlistContainer) playlistContainer.innerHTML = ""; // Clear the playlist items container

      reorderPlaylist(nodePlaylistRender, apiCache, ".playlist-items");

      // Clause: Stop if the playlist id has not changed
      if (previousPlaylistId === message.listId || message.listId === "") {
        console.log("Same Playlist!!! Halting!!! 🔴🔴🔴");
        previousPlaylistId = message.listId;
        return null;
      }

      // If the rendered playlist items are different from the cache, hydrate the cache
      if (
        !comparePlaylist(renderedCache, renderedPlaylistIds) ||
        !apiCache?.items
      ) {
        console.log("YT-playlist-sort: Cache hydration!!! 🟡🟡🟡");
        storeCache("renderedCache", renderedPlaylistIds, message.listId);
        const data = await playlistAPI(message.listId);
        storeCache("apiCache", data, message.listId!);
        apiCache = getCache("apiCache", message.listId!);
      }

      previousPlaylistId = message.listId;

      console.log("New Playlist!!! Continuing!!! 🟢🟢🟢");

      // Render the date of the video if the API cache is available

      nodePlaylistRender.forEach((value) => {
        const videoId = getVideoId(value.querySelector("a")?.href);

        if (!apiCache?.items[videoId]) return null;

        const itemEl = value.querySelector("#byline-container");
        if (!itemEl) return null;

        const { videoPublishedAt } = apiCache?.items[videoId];

        const formattedDate = new Date(videoPublishedAt).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          },
        );

        const span = document.createElement("span");
        span.textContent = `- ${formattedDate}`;
        span.classList.add("style-scope", "ytd-playlist-panel-video-renderer");
        span.id = "byline";
        span.style.marginLeft = "-5px";

        itemEl.appendChild(span);
      });
    });
  },
  matches: ["*://*.youtube.com/*"],
});
