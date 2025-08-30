import { playlistAPI } from "@/chromeAPI.ts";
import { playlistContainerSelector, playlistItemSelector } from "@/config";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  getListId,
  navigateEvent,
  sortRenderedPlaylist,
  clog,
  replaceTooltipInfo,
  getInfoFromElement,
  isShuffleOn,
  isLoopOn,
  localSet,
  localRemove,
  localGet,
} from "@/helper.ts";
import { YTNavigateEvent, YtSortOrder } from "@/types";
import createDropdownMenu from "./createDropdownMenu";

export default defineContentScript({
  main() {
    let firstRun = true;
    let currUrl = location.href;

    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        if (isShuffleOn()) return null;
        if (!getListId(currUrl)) return null; // No playlist ID, do nothing

        const event = e as YTNavigateEvent;
        const { detail } = event;

        if (detail?.endpoint?.commandMetadata) {
          e.stopImmediatePropagation();
        } else if (detail?.ytSort) {
          const { ytSort } = detail;

          const currentItem = document.querySelector(
            "ytd-playlist-panel-video-renderer[selected]",
          );

          const methodMap = {
            next: "nextSibling",
            previous: "previousSibling",
            videoEnd: "nextSibling",
          } as const;

          let element = currentItem?.[methodMap[ytSort]];

          if (ytSort !== "videoEnd") localRemove("ytSortisLoopOn", true);
          else if (isLoopOn()) localSet("ytSortisLoopOn", "true", true);

          if (!element && isLoopOn() && ytSort === "videoEnd") {
            localSet("ytSortisLoopOn", "true", true);
            element = document.querySelector(
              "ytd-playlist-panel-video-renderer",
            );
          } else if (!element) {
            if (ytSort === "previous") return null;
            element = document.querySelector("yt-lockup-view-model");
          }

          if (!(element instanceof Element)) return null;
          element.querySelector("a")?.click();
        }
      },
      true,
    );

    const init = async () => {
      clog("init 🟢");
      currUrl = location.href;
      const videoId = getVideoId(currUrl);
      const playlistId = getListId(currUrl);
      if (!videoId) return null;
      if (!playlistId) return null;

      // clog(API_URL + `&playlistId=${playlistId}&key=${API_KEY}`);

      const playlistContainer = document.querySelector<HTMLDivElement>(
        playlistContainerSelector,
      );

      // // TEST: development block, remove in production
      // const videoContainer = document.querySelector("#player-container-outer");
      // if (videoContainer) {
      //   setTimeout(() => {
      //     clog("Pausing video... 🟢🟢🟢");
      //     if (!video) return null;
      //     // video.currentTime = video.duration - 2;
      //     video.pause();
      //     // videoContainer.remove();
      //   }, 2000);
      // }
      //
      if (!playlistContainer) return null;

      const renderedCache = getCache("renderedCache", getListId(location.href));
      let apiCache = getCache("apiCache", getListId(location.href)!);

      const playlistItems: NodeListOf<HTMLDivElement> =
        playlistContainer.querySelectorAll(playlistItemSelector);

      const renderedPlaylistIds = [...playlistItems].map((el): string =>
        getVideoId(el),
      );

      // If the rendered playlist items are different from the cache
      // or there is no cache, hydrate it
      if (
        !comparePlaylist(renderedCache, renderedPlaylistIds) ||
        !apiCache?.items
      ) {
        clog("Playlist Changed, Hydrating Cache!!! 🟡");
        storeCache("renderedCache", renderedPlaylistIds, playlistId);
        const data = await playlistAPI(playlistId);
        storeCache("apiCache", data, playlistId!);
        apiCache = getCache("apiCache", playlistId!);
      }

      if (!apiCache) return null;

      sortRenderedPlaylist(
        playlistContainer,
        apiCache,
        localGet("ytSortOrder") as YtSortOrder,
      );

      createDropdownMenu(playlistContainer, apiCache);

      const wasLoop = localGet("ytSortisLoopOn", true) === "true";

      if (wasLoop) {
        const loopBtn = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Loop playlist"]',
        );

        loopBtn?.click();
      }
    };

    const firstRunEvent = () => {
      const video = document.querySelector("video");

      const prevBtnEl =
        document.querySelector<HTMLAnchorElement>(".ytp-prev-button");

      ["click", "mouseenter"].forEach((eventType) => {
        prevBtnEl?.addEventListener(eventType, () => {
          const video = document.querySelector("video");
          if (!video) return null;
          setTimeout(() => {
            if (video.currentTime > 3) return null;
            const currentVidEl = document.querySelector<HTMLDivElement>(
              "ytd-playlist-panel-video-renderer[selected]",
            );

            if (!currentVidEl) return null;

            const prevVidInfo = getInfoFromElement(
              currentVidEl.previousElementSibling,
            );
            replaceTooltipInfo(prevBtnEl, prevVidInfo);
          }, 80);
        });
      });

      video?.addEventListener("pause", () => {
        const playBtn =
          document.querySelector<HTMLButtonElement>(".ytp-play-button");

        if (playBtn?.dataset.tooltipTitle === "Replay") {
          navigateEvent("yt-navigate", { ytSort: "videoEnd" });
        }
      });

      const videoControlBtns = document.querySelector(".ytp-left-controls");
      videoControlBtns?.addEventListener("click", (e) => {
        const target = e.target as HTMLDivElement;

        const direction = target
          .getAttribute("data-title-no-tooltip")
          ?.toLowerCase();

        if (direction !== "next" && direction !== "previous") return null;

        navigateEvent("yt-navigate", { ytSort: direction });
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "N") navigateEvent("yt-navigate", { ytSort: "next" });
        else if (e.key === "P")
          navigateEvent("yt-navigate", { ytSort: "previous" });
      });
    };

    document.addEventListener("yt-navigate-finish", () => init());

    if (firstRun) {
      new MutationObserver((_, obs) => {
        if (document.querySelector("video")) {
          clog("✅ Video player ready");
          firstRunEvent();
          firstRun = false;
          obs.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    }
  },
  matches: ["*://*.youtube.com/*"],
});
