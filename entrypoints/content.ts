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
  endpointData,
} from "@/helper.ts";
import { YTNavigateEvent } from "@/types";

export default defineContentScript({
  main() {
    // TODO: Hijack the event here, replace event detail with custom info
    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        const event = e as YTNavigateEvent;
        // const target = e.target as Element;

        console.log("detail ==> ", event.detail);
        // console.log("e ==> ", target.tagName);

        // if (target.tagName === "YTD-PLAYLIST-PANEL-VIDEO-RENDERER") {
        if (event.detail.endpoint?.watchEndpoint) {
          e.stopImmediatePropagation();
        } else if (event.detail.destination) {
          const videoUrl = event.detail.destination.url;
          const element = event.detail.destination.searchContainer;

          element
            .querySelector<HTMLAnchorElement>(
              `a[href="${videoUrl.replace("https://www.youtube.com", "")}"]`,
            )
            ?.click();
        }
      },
      true,
    );

    document.addEventListener("yt-navigate-finish", async () => {
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

      // TEST: development paragraph, remove in production
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

      const renderedPlaylistIds = [...playlistItems].map((el): string =>
        getVideoId(el),
      );

      const renderedCache = getCache("renderedCache", getListId(location.href));
      let apiCache = getCache("apiCache", getListId(location.href)!);

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
        renderDateToElement(el, apiCache!);
        playlistContainer.appendChild(el);

        if (
          index < arr.length - 1 &&
          getVideoId(el) === getVideoId(location.href)
        ) {
          const nxtVidInfo = getInfoFromElement(arr[index + 1]);

          // console.log("nxtVidInfo ==> ", nxtVidInfo);

          const nxtBtnEl =
            document.querySelector<HTMLAnchorElement>(".ytp-next-button");

          if (!nxtBtnEl || !nxtVidInfo) return null;

          setTimeout(() => {
            nxtBtnEl.dataset.tooltipText = nxtVidInfo.videoTitle;
            nxtBtnEl.dataset.preview = nxtVidInfo.preview;
            nxtBtnEl.href = nxtVidInfo.href;
          }, 1000);

          nxtBtnEl.addEventListener("click", () => {
            const event = endpointData(nxtVidInfo.href, playlistContainer);
            // const event = {detail: nxtVidInfo}

            window.dispatchEvent(event);

            // playlistContainer
            //   .querySelector<HTMLAnchorElement>(
            //     `a[href="${nxtVidInfo.href.replace("https://www.youtube.com", "")}"]`,
            //   )
            //   ?.click();
          });
        }
      });
    });
  },
  matches: ["*://*.youtube.com/*"],
});
