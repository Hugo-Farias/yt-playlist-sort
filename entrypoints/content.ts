import { playlistAPI } from "@/chromeAPI.ts";
import { API_URL, playlistItemSelector } from "@/config";
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
import { ApiCache, YTNavigateEvent } from "@/types";
import createDropdownMenu from "./createDropdownMenu";
import { API_KEY } from "@/env";
import createReverseBtn from "./createReverseBtn";

// TODO: solution for huge playlists (1000+ videos)
export default defineContentScript({
  main() {
    let firstRun = true;
    let currUrl = location.href;

    const devFunction = () => {
      if (firstRun) {
        clog(`${API_URL}&playlistId=${getListId(currUrl)}&key=${API_KEY}`);
      }

      const videoContainer = document.querySelector("#full-bleed-container");
      if (videoContainer) {
        const video = document.querySelector("video");
        clog("Pausing video... 🔴🔴🔴");
        if (!video) return null;
        // video.currentTime = video.duration - 2;
        video.pause();
        video.currentTime = video.duration / 2;
        videoContainer.remove();
      }
    };

    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        if (isShuffleOn()) return null;
        if (!getListId(currUrl)) return null;

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

    const firstRunEvent = () => {
      const video = document.querySelector("video");

      (["click", "mouseenter"] as const).forEach((eventType) => {
        ([".ytp-prev-button", ".ytp-next-button"] as const).forEach(
          (btnSelector) => {
            const btnElement =
              document.querySelector<HTMLAnchorElement>(btnSelector);
            btnElement?.addEventListener(eventType, () => {
              if (!video) return null;
              if (
                btnSelector === ".ytp-prev-button" &&
                eventType === "mouseenter" &&
                video.currentTime > 3
              ) {
                return null;
              }
              setTimeout(
                () => {
                  const currentVidEl = document.querySelector<HTMLDivElement>(
                    "ytd-playlist-panel-video-renderer[selected]",
                  );

                  if (!currentVidEl) return null;

                  const vidInfo = getInfoFromElement(
                    btnSelector === ".ytp-prev-button"
                      ? currentVidEl.previousElementSibling
                      : currentVidEl.nextElementSibling,
                  );

                  replaceTooltipInfo(btnElement, vidInfo);
                },
                eventType === "click" ? 50 : 0,
              );
            });
          },
        );
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

    const hydrateCache = async (
      playlistContainer: HTMLDivElement,
      cache: ApiCache | null,
      renderedCache: string[] | null,
      playlistId: string,
    ) => {
      if (!playlistContainer) return null;

      const playlistItems: NodeListOf<HTMLDivElement> =
        playlistContainer.querySelectorAll(playlistItemSelector);

      const renderedPlaylistIds = [...playlistItems]
        .filter((el: HTMLDivElement) => {
          const anchor = el.querySelector("a");
          return getListId(anchor?.href) === playlistId;
        })
        .map((v) => getVideoId(v));

      // If the rendered playlist items are different from the cache
      // or there is no cache, hydrate it
      if (
        !comparePlaylist(renderedCache, renderedPlaylistIds) ||
        !cache?.items
      ) {
        clog("Playlist Changed, Hydrating Cache!!! 🟡");
        storeCache("renderedCache", renderedPlaylistIds, playlistId);
        const data = await playlistAPI(playlistId);
        storeCache("apiCache", data, playlistId!);
        renderedCache = getCache("renderedCache", playlistId);
      }

      return getCache("apiCache", playlistId!);
    };

    document.addEventListener("yt-navigate-finish", async () => {
      currUrl = location.href;

      const playlistId = getListId(currUrl);
      if (!playlistId) return null;

      clog("init 🟢");

      let renderedCache = getCache("renderedCache", getListId(location.href));
      let apiCache = getCache("apiCache", getListId(location.href)!);

      const playlistContainer = document.querySelector<HTMLDivElement>(
        "ytd-playlist-panel-renderer #items",
      );

      if (!playlistContainer) return null;

      const refreshedCache = await hydrateCache(
        playlistContainer,
        apiCache,
        renderedCache,
        playlistId,
      );

      // TODO: item limit check
      // if (refreshedCache?.items[getListId(location.href)!]) return null;

      if (!refreshedCache) return null;

      const { totalResults } = refreshedCache;

      console.log("totalResults ==> ", totalResults);

      if (totalResults > 500) return null;

      const playlistMenuBtns = document.querySelector<HTMLDivElement>(
        "div#playlist-actions > div > div > ytd-menu-renderer > #top-level-buttons-computed",
      );

      if (!playlistMenuBtns) return null;
      console.log(refreshedCache.isReversed);

      createDropdownMenu(refreshedCache, playlistContainer, playlistMenuBtns);

      createReverseBtn(refreshedCache, playlistContainer, playlistMenuBtns);

      // TODO: separate function for reverse
      sortRenderedPlaylist(
        playlistContainer,
        refreshedCache,
        refreshedCache.sortOrder,
        refreshedCache.isReversed,
      );

      const wasLoop = localGet("ytSortisLoopOn", true);

      if (wasLoop) {
        const loopBtn = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Loop playlist"]',
        );
        loopBtn?.click();
      }

      if (import.meta.env.DEV) {
        devFunction(); // TEST: development function, remove/comment in production
      }

      if (!firstRun) return;
      new MutationObserver((_, obs) => {
        if (document.querySelector("video")) {
          firstRunEvent();
          firstRun = false;
          obs.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    });
  },
  matches: ["*://*.youtube.com/*"],
});
