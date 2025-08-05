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
    let currUrl = location.href;

    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        console.log(getListId(currUrl));
        if (!getListId(currUrl)) return null;

        const event = e as YTNavigateEvent;

        if (event.detail?.endpoint) {
          e.stopImmediatePropagation();
        } else if (event.detail?.ytSort) {
          const { ytSort: direction } = event.detail;

          const currentItem = document.querySelector(
            "ytd-playlist-panel-video-renderer[selected]",
          );

          const methodMap = {
            next: "nextSibling",
            previous: "previousSibling",
          } as const;

          let element = currentItem?.[methodMap[direction]];
          if (element === null)
            element = document.querySelector("yt-lockup-view-model");
          if (!(element instanceof Element)) return null;
          element.querySelector("a")?.click();
        }
      },
      true,
    );

    document.addEventListener("yt-navigate-finish", async () => {
      console.log("content init 🟢");
      // return null;
      currUrl = location.href;
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

          // TEST: remove this before production
          // this closes the playlist container
          const isCollapsed = document
            .querySelector<HTMLDivElement>(
              "ytd-playlist-panel-renderer#playlist",
            )
            ?.hasAttribute("collapsed");

          console.log("isCollapsed ==> ", isCollapsed);

          if (!isCollapsed) {
            const containerElement = document.querySelector<HTMLDivElement>(
              "#container.ytd-playlist-panel-renderer",
            )?.firstChild as HTMLDivElement;

            containerElement.click();
          }
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
      const sortedList = sortList(playlistItems, apiCache);
      // playlistContainer.replaceChildren(...sortedList);
      sortedList.forEach((el, index, arr) => {
        renderDateToElement(el, apiCache!);
        playlistContainer.appendChild(el);

        if (index > arr.length - 1) return null;
        if (getVideoId(el) !== getVideoId(location.href)) return null;

        const prevVidInfo = getInfoFromElement(arr[index - 1]);
        console.log("prevVidInfo ==> ", prevVidInfo);
        let nextVidInfo = getInfoFromElement(arr[index + 1]);
        console.log("nextVidInfo ==> ", nextVidInfo);

        const nextLabel = document.querySelector(
          "#next-video-title > #next-label",
        );
        const sibling = nextLabel?.nextSibling as HTMLDivElement;

        if (!nextVidInfo && nextLabel && nextLabel.nextSibling) {
          nextLabel.textContent = "End of playlist";
          sibling.textContent = "";
        } else if (nextLabel && nextLabel.nextSibling) {
          nextLabel.textContent = "Next:";
          sibling.textContent = nextVidInfo?.videoTitle ?? "";
          sibling.removeAttribute("is-empty");
        }

        setTimeout(() => {
          if (!prevVidInfo) {
            const el =
              document.querySelector<HTMLAnchorElement>(".ytp-prev-button");
            if (el) el.style.display = "none";
          }
          if (!nextVidInfo) {
            const el = document.querySelector<Element>("yt-lockup-view-model");
            if (el) nextVidInfo = getInfoFromElement(el);
          }

          replaceTooltipInfo("next", nextVidInfo);
          replaceTooltipInfo("prev", prevVidInfo);
        }, 1000);
      });

      if (firstRun) {
        const navigateEvent = (direction: "next" | "previous") => {
          const endpointEvent = endpointData(direction);
          window.dispatchEvent(endpointEvent);
        };

        videoControlBtns = document.querySelector(".ytp-left-controls");
        videoControlBtns?.addEventListener("click", (e) => {
          const target = e.target as HTMLDivElement;

          const direction = target
            .getAttribute("data-title-no-tooltip")
            ?.toLowerCase();

          if (direction !== "next" && direction !== "previous") return null;

          navigateEvent(direction);
        });
        window.addEventListener("keydown", (e) => {
          if (e.key === "N") navigateEvent("next");
          else if (e.key === "P") navigateEvent("previous");
        });
      }

      firstRun = false;
    });
  },
  matches: ["*://*.youtube.com/*"],
});
