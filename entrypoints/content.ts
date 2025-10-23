import { createDropdownMenu, createReverseBtn } from "@/buttons";
import { playlistAPI } from "@/chromeAPI.ts";
import { playlistItemSelector } from "@/config";
import {
  clearOldCache,
  clog,
  comparePlaylist,
  getCache,
  getInfoFromElement,
  getListId,
  getVideoId,
  isLoopOn,
  isShuffleOn,
  localGet,
  localRemove,
  localSet,
  navigateEvent,
  replaceTooltipInfo,
  sortRenderedPlaylist,
  storeCache,
} from "@/helper.ts";
import type { YTNavigateEvent } from "@/types";
import pkg from "../package.json";

export default defineContentScript({
  main() {
    const extVersion = localGet("ytSortVersion");
    // TODO: also check age of cache and clear if older than a month
    if (!extVersion || pkg.version !== extVersion.replaceAll('"', "")) {
      clearOldCache(pkg.version);
      localSet("ytSortVersion", pkg.version);
    }

    let firstRun = true;
    let currUrl = location.href;
    let prevListId: string | null = null;

    clog("init 🟢");

    const devFunction = () => {
      if (firstRun) {
        // clog(`${API_URL}&playlistId=${getListId(currUrl)}&key=${API_KEY}`);

        const videoContainer = document.querySelector("#full-bleed-container");
        if (videoContainer) {
          const video = document.querySelector("video");
          if (!video) return null;
          clog("Pausing video... 🔴🔴🔴");
          // video.currentTime = video.duration / 2;
          setTimeout(() => {
            video.pause();
          }, 2000);
          video.remove();
          videoContainer.remove();
        }
      }
    };

    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        if (isShuffleOn()) return null;
        if (!getListId(currUrl)) return null;
        if (localGet("ytSortBlockNav", true)) {
          e.stopImmediatePropagation();
          return null;
        }

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
            next: "nextElementSibling",
            previous: "previousElementSibling",
            videoEnd: "nextElementSibling",
          } as const;

          let element: Element | null | undefined =
            currentItem?.[methodMap[ytSort]];

          if (element?.tagName !== "YTD-PLAYLIST-PANEL-VIDEO-RENDERER") {
            element = null;
          }

          if (ytSort !== "videoEnd") localRemove("ytSortLoop", true);
          else if (isLoopOn()) localSet("ytSortLoop", "true", true);

          if (!element && isLoopOn() && ytSort === "videoEnd") {
            localSet("ytSortLoop", "true", true);
            element = document.querySelector(
              "ytd-playlist-panel-video-renderer",
            );
          } else if (!element) {
            if (ytSort === "previous") {
              const videoItems = document.querySelectorAll(
                "ytd-playlist-panel-video-renderer",
              );

              element = [...videoItems].at(-1);
            } else {
              element = document.querySelector("yt-lockup-view-model");
            }
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

                  let prevElement = currentVidEl.previousElementSibling;
                  let nextElement = currentVidEl.nextElementSibling;

                  if (nextElement?.tagName === "YTD-MESSAGE-RENDERER") {
                    nextElement = document.querySelector(
                      "yt-lockup-view-model",
                    );
                  } else if (prevElement === null) {
                    const videoItems =
                      document.querySelectorAll<HTMLDivElement>(
                        "ytd-playlist-panel-video-renderer",
                      );

                    const lastVideoItem = [...videoItems].at(-1);

                    if (lastVideoItem) prevElement = lastVideoItem;
                  }

                  const vidInfo = getInfoFromElement(
                    btnSelector === ".ytp-prev-button"
                      ? prevElement
                      : nextElement,
                  );

                  replaceTooltipInfo(btnElement, vidInfo);
                },
                eventType === "click" ? 50 : 0,
              );
            });
          },
        );
        firstRun = false;
      });

      video?.addEventListener("pause", () => {
        const playBtn =
          document.querySelector<HTMLButtonElement>(".ytp-play-button");

        if (playBtn?.dataset.tooltipTitle === "Replay") {
          navigateEvent({ ytSort: "videoEnd" });
        }
      });

      const videoControlBtns = document.querySelector(".ytp-left-controls");
      videoControlBtns?.addEventListener("click", (e) => {
        const target = e.target as HTMLDivElement;

        const direction = target
          .getAttribute("data-title-no-tooltip")
          ?.toLowerCase();

        if (direction !== "next" && direction !== "previous") return null;

        navigateEvent({ ytSort: direction });
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "N") navigateEvent({ ytSort: "next" });
        else if (e.key === "P") navigateEvent({ ytSort: "previous" });
      });
    };

    const hydrateCache = async (
      playlistContainer: HTMLDivElement,
      playlistId: string,
    ) => {
      if (!playlistContainer) return null;

      if (prevListId !== playlistId) {
        const playlistItems: NodeListOf<HTMLDivElement> =
          playlistContainer.querySelectorAll(playlistItemSelector);

        const renderedCache = getCache(
          "ytSortRenderedCache",
          getListId(location.href),
        );
        const apiCache = getCache("ytSortMainCache", getListId(location.href));

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
          !apiCache?.items
        ) {
          clog("Playlist Changed, Hydrating Cache!!! 🟡");
          storeCache("ytSortRenderedCache", renderedPlaylistIds, playlistId);
          const data = await playlistAPI(playlistId);
          storeCache("ytSortMainCache", data, playlistId);
        }
      }

      prevListId = playlistId;
      return getCache("ytSortMainCache", playlistId);
    };

    // document.addEventListener("yt-navigate-start", () => {
    //   localSet("ytSortBlockNav", true, true);
    // });

    document.addEventListener("yt-navigate-finish", async () => {
      // document.addEventListener("yt-page-data-updated", async () => {
      currUrl = location.href;

      const playlistId = getListId(currUrl);
      if (!playlistId) return null;

      const playlistContainer = document.querySelector<HTMLDivElement>(
        "ytd-playlist-panel-renderer #items",
      );

      if (!playlistContainer) return null;

      const refreshedCache = await hydrateCache(playlistContainer, playlistId);

      if (!refreshedCache) return null;

      const { totalResults } = refreshedCache;

      if (totalResults > 500) return null;

      const playlistMenuBtns = document.querySelector<HTMLDivElement>(
        "div#playlist-actions > div > div > ytd-menu-renderer > #top-level-buttons-computed",
      );

      if (!playlistMenuBtns) return null;

      createDropdownMenu(refreshedCache, playlistContainer, playlistMenuBtns);

      createReverseBtn(refreshedCache, playlistContainer, playlistMenuBtns);

      sortRenderedPlaylist(
        playlistContainer,
        refreshedCache,
        refreshedCache.sortOrder,
        refreshedCache.isReversed,
      );

      setTimeout(() => localRemove("ytSortBlockNav", true), 300);

      const wasLoop = localGet("ytSortLoop", true);

      if (wasLoop) {
        const loopBtn = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Loop playlist"]',
        );
        loopBtn?.click();
        localRemove("ytSortLoop", true);
      }

      if (import.meta.env.DEV) {
        devFunction();
      }

      if (!firstRun) return;
      firstRunEvent();
    });
  },
  matches: ["*://*.youtube.com/*"],
});
