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
} from "@/helper.ts";
import { YTNavigateEvent } from "@/types";
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

    // TODO: trigger this event after the settings have changed for refresh
    document.addEventListener("yt-navigate-finish", async (b) => {
      console.log("content init 🟢");
      // return null;
      currUrl = location.href;
      const videoId = getVideoId(currUrl);
      const playlistId = getListId(currUrl);
      if (!videoId) return null;
      const video = document.querySelector("video");

      // video.currentTime = video?.duration - 10;
      // video?.pause();

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
          video?.pause();
          videoContainer.remove();
        }, 1000);
      }

      if (!playlistContainer) return null;

      const renderedCache = getCache("renderedCache", getListId(location.href));
      let apiCache = getCache("apiCache", getListId(location.href)!);

      if (apiCache) {
        const dropdown = createDropdownMenu(playlistContainer, apiCache);

        const playlistMenuBtns = document.querySelector(
          "div#playlist-actions > div > div > ytd-menu-renderer > #top-level-buttons-computed",
        );

        playlistMenuBtns?.appendChild(dropdown);
      }

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
        console.log("YT-playlist-sort: Cache hydration!!! 🟡");
        storeCache("renderedCache", renderedPlaylistIds, playlistId);
        const data = await playlistAPI(playlistId);
        storeCache("apiCache", data, playlistId!);
        apiCache = getCache("apiCache", playlistId!);
      }

      if (!apiCache) return null;

      sortRenderedPlaylist(playlistContainer, apiCache, "asc");

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
      }

      firstRun = false;
    });
  },
  matches: ["*://*.youtube.com/*"],
});
