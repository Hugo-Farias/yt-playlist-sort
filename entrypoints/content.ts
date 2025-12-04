import { playlistAPI } from "@/chromeAPI.ts";
import { playlistItemSelector } from "@/config";
import { createDropdownMenu, createReverseBtn } from "@/entrypoints/ui/buttons";
import {
  checkCacheAge,
  cleanOldMainCacheEntries,
  clearOldCache,
  clog,
  comparePlaylist,
  debounce,
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
  storeMainCache,
  waitForElement,
} from "@/helper";
import type { ApiCache, YTNavigateEvent } from "@/types";
import pkg from "../package.json";

export default defineContentScript({
  main() {
    let fullCache: { [key: string]: ApiCache } = {};
    let currUrl = location.href;
    let playlistId: string = getListId(currUrl);
    let firstRun = true;
    let prevListId: string | null = null;
    let playlistContainer = document.querySelector<HTMLDivElement>(
      "ytd-playlist-panel-renderer #items",
    );

    try {
      fullCache = JSON.parse(localGet("ytSortMainCache") || "{}");
    } catch (e) {
      clog("Error parsing main cache JSON: \n", e);
      clog("Cleaning Cache");
      localRemove("ytSortMainCache");
      localRemove("ytSortRenderedCache");
    }

    chrome.storage.local.set({ lang: document.querySelector("html")?.lang });

    cleanOldMainCacheEntries(fullCache);

    let navBlock = false; // prevent navigation events during playlist load
    const extVersion = localGet("ytSortVersion");
    if (!extVersion || pkg.version !== extVersion.replaceAll('"', "")) {
      clearOldCache(pkg.version);
      localSet("ytSortVersion", pkg.version);
    }

    clog("init 🟢");

    const devFunction = () => {
      if (firstRun) {
        // clog(`${API_URL}&playlistId=${getListId(currUrl)}&key=${API_KEY}`);

        const videoContainer = document.querySelector("#full-bleed-container");
        if (videoContainer) {
          setTimeout(() => {
            const video = document.querySelector("video");
            if (!video) return null;
            video.currentTime = video.duration / 10;
            clog("Pausing video... 🔴🔴🔴");
            video.pause();
            video.remove();
            videoContainer.remove();
          }, 2000);
        }
      }
    };

    window.addEventListener(
      "yt-navigate",
      (e: Event) => {
        if (isShuffleOn()) return null;
        if (!getListId(currUrl)) return null;
        if (!getVideoId(currUrl)) return null;
        if (navBlock) {
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
            prev: "previousElementSibling",
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
            if (ytSort === "prev") {
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
                eventType === "click" ? 80 : 0,
              );
            });
          },
        );
        firstRun = false;
      });

      video?.addEventListener("pause", () => {
        const current =
          document.querySelector(".ytp-time-current")?.textContent;
        const duration =
          document.querySelector(".ytp-time-duration")?.textContent;
        if (current === duration) {
          navigateEvent({ ytSort: "videoEnd" });
        }
      });

      const videoControlBtns = document.querySelector(".ytp-left-controls");
      videoControlBtns?.addEventListener("click", (e) => {
        const target = e.target as HTMLDivElement;

        const direction = target.classList[0].split("-")[1];

        if (direction !== "next" && direction !== "prev") return null;
        if (!target.dataset.preview) return;

        navigateEvent({ ytSort: direction });
      });

      window.addEventListener("keydown", (e) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable)
        ) {
          return;
        }

        if (e.key === "N") navigateEvent({ ytSort: "next" });
        else if (e.key === "P") navigateEvent({ ytSort: "prev" });
      });
    };

    const hydrateCache = async (playlistContainer: HTMLDivElement) => {
      if (!playlistContainer) return null;

      if (prevListId !== playlistId) {
        const playlistItems: NodeListOf<HTMLDivElement> =
          playlistContainer.querySelectorAll(playlistItemSelector);

        const renderedCache = getCache(
          "ytSortRenderedCache",
          getListId(location.href),
        );

        // const apiCache = getCache("ytSortMainCache", getListId(location.href));
        const apiCache = fullCache?.[playlistId];

        const renderedPlaylistIds: string[] = [...playlistItems]
          .filter((el: HTMLDivElement) => {
            const anchor = el.querySelector("a");
            return getListId(anchor?.href) === playlistId;
          })
          .map((v) => getVideoId(v));

        // If the rendered playlist items are different from the cache
        // or there is no cache, hydrate it
        if (
          !comparePlaylist(renderedCache, renderedPlaylistIds) ||
          !apiCache?.videos ||
          checkCacheAge(apiCache.storeTime, 30)
        ) {
          clog("Playlist Changed, Hydrating Cache!!! 🟡");
          localSet("ytSortRenderedCache", {
            ...JSON.parse(localGet("ytSortRenderedCache") ?? "{}"),
            [playlistId]: renderedPlaylistIds,
          });
          const data = await playlistAPI(playlistId);

          if (data) {
            storeMainCache(data, playlistId);
            fullCache[playlistId] = getCache(
              "ytSortMainCache",
              playlistId,
            ) as ApiCache;
          }
        }
        prevListId = playlistId;
      }

      return fullCache?.[playlistId];
    };

    document.addEventListener("yt-navigate-finish", async () => {
      // document.addEventListener("yt-page-data-updated", async () => {
      currUrl = location.href;

      playlistId = getListId(currUrl);
      if (!playlistId) return null;

      playlistContainer = document.querySelector<HTMLDivElement>(
        "ytd-playlist-panel-renderer #items",
      );

      if (!playlistContainer) return null;

      const refreshedCache = await hydrateCache(playlistContainer);

      if (!refreshedCache) return null;

      const { totalResults } = refreshedCache;

      if (totalResults > 500) return null;

      const playlistMenuBtns = document.querySelector<HTMLDivElement>(
        "div#playlist-actions > div > div > ytd-menu-renderer > #top-level-buttons-computed",
      );

      if (!playlistMenuBtns) return null;

      createDropdownMenu(
        refreshedCache,
        playlistContainer,
        playlistMenuBtns,
        fullCache,
      );

      createReverseBtn(
        refreshedCache,
        playlistContainer,
        playlistMenuBtns,
        fullCache,
      );

      sortRenderedPlaylist(
        playlistContainer,
        refreshedCache,
        refreshedCache.sortOrder,
        refreshedCache.isReversed,
      );

      setTimeout(() => {
        navBlock = false;
      }, 100);

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
      waitForElement("video").then(() => {
        firstRunEvent();
      });
    });

    document.addEventListener("yt-navigate-start", () => {
      navBlock = true;
    });

    chrome.storage.onChanged.addListener(() => {
      if (!playlistId) return null;
      debounce(() => {
        clog("Settings Updated");
        const playlistContainer = document.querySelector<HTMLDivElement>(
          "ytd-playlist-panel-renderer #items",
        );

        const playlistId = getListId(currUrl);
        const cache = fullCache[playlistId];

        sortRenderedPlaylist(
          playlistContainer,
          cache,
          cache.sortOrder,
          cache.isReversed,
        );
      });
    });
  },
  matches: ["*://*.youtube.com/*"],
});
