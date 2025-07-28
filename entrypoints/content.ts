import { playlistAPI } from "@/chromeAPI.ts";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  waitForElements,
  getListId,
  sortPlaylist,
} from "@/helper.ts";
import { playlistItemSelector } from "@/config.ts";

// let previousURL = "";
// let previousPlaylistId: string | null = "";

export default defineContentScript({
  main() {
    document.addEventListener("yt-page-data-updated", async () => {
      console.log("content init");
      // return null;
      const currUrl = location.href;
      const videoId = getVideoId(currUrl);
      const playlistId = getListId(currUrl);
      if (!videoId) return null;
      // if (previousURL === currUrl) return null; // Prevents duplicate execution

      // previousURL = currUrl;

      // console.log(API_URL + `&playlistId=${playlistId}&key=${API_KEY}`);

      const nodePlaylistRender = playlistId
        ? await waitForElements<HTMLDivElement>(playlistItemSelector)
        : null;

      // NOTE: development block, remove in production
      const videoContainer = document.querySelector("#player-container-outer");
      if (videoContainer) {
        setTimeout(() => {
          // document.querySelector("video")?.pause();
          videoContainer.remove(); // Remove the video element to prevent autoplay
        }, 100);
      }

      if (!nodePlaylistRender) return null;

      const renderedPlaylistIds = [...nodePlaylistRender].map((el): string =>
        getVideoId(el.querySelector("a")?.href),
      );

      const renderedCache = getCache("renderedCache", playlistId);
      let apiCache = getCache("apiCache", playlistId!);

      // // Clause: Stop if the playlist id has not changed
      // if (previousPlaylistId === playlistId || playlistId === "") {
      //   console.log("Same Playlist!!! Halting!!! 🔴🔴🔴");
      //   previousPlaylistId = playlistId;
      //   return null;
      // }

      // previousPlaylistId = playlistId;

      // If the rendered playlist items are different from the cache
      // or there is no cache, hydrate it
      if (
        !comparePlaylist(renderedCache, renderedPlaylistIds) ||
        !apiCache?.items
      ) {
        console.log("YT-playlist-sort: Cache hydration!!! 🟡🟡🟡");
        storeCache("renderedCache", renderedPlaylistIds, playlistId);
        const data = await playlistAPI(playlistId);
        storeCache("apiCache", data, playlistId!);
        apiCache = getCache("apiCache", playlistId!);
      }

      // previousPlaylistId = playlistId;

      console.log("New Playlist!!! Continuing!!! 🟢🟢🟢");

      // Render the date of the video if the API cache is available

      if (!apiCache) return null;
      sortPlaylist([...nodePlaylistRender], apiCache, ".playlist-items");
    });
  },
  matches: ["*://*.youtube.com/*"],
});
