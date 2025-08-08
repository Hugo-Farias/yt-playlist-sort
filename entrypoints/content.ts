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
  replaceTooltipInfo,
  navigateEvent,
} from "@/helper.ts";
import { YTNavigateEvent } from "@/types";

export default defineContentScript({
  main() {
    let firstRun = true;
    let currUrl = location.href;

    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        if (!getListId(currUrl)) return null;

        const event = e as YTNavigateEvent;
        const { detail } = event;

        // TODO: find a way to trigger on video end
        if (detail?.endpoint?.commandMetadata) {
          if (detail.tempData?.autonav) {
            console.log("autonav");
            // navigateEvent("next");
          }
          e.stopImmediatePropagation();
        } else if (detail?.ytSort) {
          const { ytSort } = detail;

          const currentItem = document.querySelector(
            "ytd-playlist-panel-video-renderer[selected]",
          );

          const methodMap = {
            next: "nextSibling",
            previous: "previousSibling",
          } as const;

          let element = currentItem?.[methodMap[ytSort]];
          if (element === null) {
            element = document.querySelector("yt-lockup-view-model");
          }
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
      const video = document.querySelector("video");
      // @ts-ignore
      video.currentTime = video?.duration - 10;
      video?.pause();

      // if (previousURL === currUrl) return null; // Prevents duplicate execution

      // previousURL = currUrl;

      // console.log(API_URL + `&playlistId=${playlistId}&key=${API_KEY}`);

      const playlistContainer = document.querySelector<HTMLDivElement>(
        playlistContainerSelector,
      );

      // TEST: development block, remove in production
      // const videoContainer = document.querySelector("#player-container-outer");
      // if (videoContainer) {
      //   setTimeout(() => {
      //     console.log("YT-playlist-sort: Pausing video...");
      //     video?.pause();
      //     // videoContainer.remove(); // Remove the video element to prevent autoplay
      //   }, 1000);
      // }

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

      sortedList.forEach((el, index, arr) => {
        renderDateToElement(el, apiCache!);
        playlistContainer.appendChild(el);

        // if (index > arr.length - 1) return null;
        if (getVideoId(el) !== getVideoId(location.href)) return null; // Code below runs only on the current video
        const currentLocation = `${index + 1}/${arr.length}`;

        const indexMessage = document.querySelector<HTMLSpanElement>(
          "span.index-message.ytd-playlist-panel-renderer",
        );

        if (indexMessage) {
          indexMessage.textContent = currentLocation;
          indexMessage.removeAttribute("hidden");
          // indexMessage.style.marginRight = "1rem";
          indexMessage.nextElementSibling?.setAttribute("hidden", "");
        }

        const prevVidInfo = getInfoFromElement(arr[index - 1]);
        let nextVidInfo = getInfoFromElement(arr[index + 1]);

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
        video?.addEventListener("pause", () => {
          const playBtn =
            document.querySelector<HTMLButtonElement>(".ytp-play-button");

          console.log(playBtn?.dataset.tooltipTitle);

          if (playBtn?.dataset.tooltipTitle === "Replay") {
            navigateEvent("next");
          }
        });

        const videoControlBtns = document.querySelector(".ytp-left-controls");
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
