import { playlistAPI } from "@/chromeAPI.ts";
import { playlistContainerSelector, playlistItemSelector } from "@/config";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  getListId,
  sortList,
  renderDateToElement,
  getInfoFromElement,
} from "@/helper.ts";

// TODO: update prev and next video buttons
export default defineContentScript({
  main() {
    document.addEventListener("yt-page-data-updated", async () => {
      console.log("content init 🟢");
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

      // TEST: development block, remove in production
      const videoContainer = document.querySelector("#player-container-outer");
      if (videoContainer) {
        setTimeout(() => {
          console.log("YT-playlist-sort: Pausing video...");
          document.querySelector("video")?.pause();
          // videoContainer.remove(); // Remove the video element to prevent autoplay
        }, 1000);
      }

      if (!playlistContainer) return null;

      const playlistItems: NodeListOf<HTMLDivElement> =
        playlistContainer.querySelectorAll(playlistItemSelector);

      const renderedPlaylistIds = [...playlistContainer.children].map(
        (el): string => getVideoId(el),
      );

      const renderedCache = getCache("renderedCache", playlistId);
      let apiCache = getCache("apiCache", playlistId!);

      // If the rendered playlist items are different from the cache
      // or there is no cache, hydrate it
      if (
        !comparePlaylist(renderedCache, renderedPlaylistIds) ||
        !apiCache?.items
      ) {
        console.log("YT-playlist-sort: Cache hydration!!! 🟡");
        storeCache("renderedCache", renderedPlaylistIds, playlistId);
        const data = await playlistAPI(playlistId);
        storeCache("apiCache", data, playlistId!);
        apiCache = getCache("apiCache", playlistId!);
      }

      if (!apiCache) return null;

      // console.log(apiCache.items[videoId]);

      const sortedList = sortList(playlistItems, apiCache);
      // playlistContainer.replaceChildren(...sortedList);
      sortedList.forEach((el, index, arr) => {
        renderDateToElement(el, apiCache);
        playlistContainer.appendChild(el);

        if (
          index < arr.length - 1 &&
          getVideoId(el) === getVideoId(location.href)
        ) {
          const nxtVidInfo = getInfoFromElement(arr[index + 1]);

          console.log("nxtVidInfo ==> ", nxtVidInfo);

          const nxtBtnEl =
            document.querySelector<HTMLAnchorElement>(".ytp-next-button");

          if (!nxtBtnEl) return null;
          // TODO: this is getting overwritten by the page on load
          setTimeout(() => {
            // console.log("nextBtnEl ==> ", nextBtnEl);
            nxtBtnEl.dataset.tooltipText = nxtVidInfo?.tooltipNext.trim();
            nxtBtnEl.dataset.preview = nxtVidInfo?.preview;
            nxtBtnEl.href = nxtVidInfo.href;
          }, 3000);
        }
      });
    });
  },
  matches: ["*://*.youtube.com/*"],
});
