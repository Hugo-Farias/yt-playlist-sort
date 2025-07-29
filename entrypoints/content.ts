import { playlistAPI } from "@/chromeAPI.ts";
import { playlistContainerSelector, playlistItemSelector } from "@/config";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  // waitForElements,
  getListId,
  sortList,
  renderDateToElement,
} from "@/helper.ts";
// import { playlistItemSelector } from "@/config.ts";

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

      const playlistContainer = document.querySelector<HTMLDivElement>(
        playlistContainerSelector,
      );

      // const nodePlaylistRender = playlistId
      //   ? await waitForElements<HTMLDivElement>(playlistItemSelector)
      //   : null;

      // NOTE: development block, remove in production
      const videoContainer = document.querySelector("#player-container-outer");
      if (videoContainer) {
        setTimeout(() => {
          // document.querySelector("video")?.pause();
          videoContainer.remove(); // Remove the video element to prevent autoplay
        }, 100);
      }

      if (!playlistContainer) return null;

      const playlistItems: NodeListOf<HTMLDivElement> =
        playlistContainer.querySelectorAll(playlistItemSelector);

      const renderedPlaylistIds = [...playlistContainer.children].map(
        (el): string => getVideoId(el.querySelector("a")?.href),
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
      const sortedList = sortList(playlistItems, apiCache);
      playlistContainer.replaceChildren(...sortedList);
      sortedList.map((el) => renderDateToElement(el, apiCache));
    });
  },
  matches: ["*://*.youtube.com/*"],
});
