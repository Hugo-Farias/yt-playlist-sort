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
  replaceTooltipInfo,
} from "@/helper.ts";
import { YTNavigateEvent } from "@/types";

export default defineContentScript({
  main() {
    let firstRun = true;
    let videoControlBtns: HTMLDivElement | null;

    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        const event = e as YTNavigateEvent;
        // console.log("event ==> ", event);

        if (event.detail?.endpoint) {
          e.stopImmediatePropagation();
        } else if (event.detail?.ytSort) {
          // TODO: handle last item in playlist next button
          const { ytSort: direction } = event.detail;

          const currentItem = document.querySelector(
            "ytd-playlist-panel-video-renderer[selected]",
          );

          const methodMap = {
            next: "nextSibling",
            previous: "previousSibling",
          } as const;

          const element = currentItem?.[methodMap[direction]];
          // console.log("element ==> ", element);
          if (!(element instanceof Element)) return null;
          element.querySelector("a")?.click();
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

        if (index > arr.length - 1) return null;
        if (getVideoId(el) !== getVideoId(location.href)) return null;

        let nextVidInfo = getInfoFromElement(arr[index + 1]);
        const prevVidInfo = getInfoFromElement(arr[index - 1]);

        setTimeout(() => {
          if (!prevVidInfo) {
            const el =
              document.querySelector<HTMLAnchorElement>(".ytp-prev-button");
            if (el) el.style.display = "none";
          }
          if (!nextVidInfo) {
            const el = document.querySelector<Element>("yt-lockup-view-model");
            console.log("el ==> ", el);
            if (el) nextVidInfo = getInfoFromElement(el);
            console.log("nextVidInfo ==> ", nextVidInfo);
          }

          replaceTooltipInfo("next", nextVidInfo);
          replaceTooltipInfo("prev", prevVidInfo);
        }, 1000);
      });

      if (firstRun) {
        const clickEvent = (e: Event) => {
          const target = e.target as HTMLDivElement;

          const direction = target
            .getAttribute("data-title-no-tooltip")
            ?.toLowerCase();

          if (direction !== "next" && direction !== "previous") return null;

          const endpointEvent = endpointData(direction);
          window.dispatchEvent(endpointEvent);
        };

        // TODO: add event for keyboard shortcut
        videoControlBtns = document.querySelector(".ytp-left-controls");
        videoControlBtns?.addEventListener("click", clickEvent);
      }

      firstRun = false;
    });
  },
  matches: ["*://*.youtube.com/*"],
});
