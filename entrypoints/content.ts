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

    const init = async () => {
      clog("init 🟢");
      currUrl = location.href;
      const videoId = getVideoId(currUrl);
      const playlistId = getListId(currUrl);
      if (!videoId) return null;
      if (!playlistId) return null;
      const video = document.querySelector("video");

      if (video) {
        video.currentTime = 100;
        video.pause();
      }

      // if (previousURL === currUrl) return null; // Prevents duplicate execution

      // previousURL = currUrl;

      // clog(API_URL + `&playlistId=${playlistId}&key=${API_KEY}`);

      const playlistContainer = document.querySelector<HTMLDivElement>(
        playlistContainerSelector,
      );

      // // TEST: development block, remove in production
      // const videoContainer = document.querySelector("#player-container-outer");
      // if (videoContainer) {
      //   setTimeout(() => {
      //     clog("Pausing video...");
      //     video?.pause();
      //     // videoContainer.remove();
      //   }, 1000);
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
        localStorage.getItem("ytSortOrder") as YtSortOrder,
        firstRun,
      );

      createDropdownMenu(playlistContainer, apiCache);

      if (firstRun) {
        video?.addEventListener("pause", () => {
          const playBtn =
            document.querySelector<HTMLButtonElement>(".ytp-play-button");

          if (playBtn?.dataset.tooltipTitle === "Replay") {
            navigateEvent("yt-navigate", { ytSort: "next" });
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
        firstRun = false;
      }
    };

    document.addEventListener("yt-navigate-finish", () => init());

    init();
  },
  matches: ["*://*.youtube.com/*"],
});
