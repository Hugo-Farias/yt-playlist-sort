import { playlistAPI } from "@/chromeAPI.ts";
import { MessageType } from "@/entrypoints/background.ts";
import {
  getVideoId,
  comparePlaylist,
  storeCache,
  getCache,
  waitForElements,
  getListId,
} from "@/helper.ts";
import { videoItemSelector } from "@/config.ts";

let previousURL = "";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  main() {
    chrome.runtime.onMessage.addListener(async (message: MessageType) => {
      if (!message.videoId || !message.listId) return null;
      if (previousURL === message.url) return null; // Prevents duplicate execution
      previousURL = location.href;

      console.log("content init");

      const nodeVideo = await waitForElements<HTMLVideoElement>("video");
      console.log(nodeVideo);

      if (!nodeVideo || [...nodeVideo].length === 0) return null;
      else {
        nodeVideo[0].pause();
      }

      // const video = [...nodeVideo].filter((el) => !el.paused);

      const nodePlaylistRender =
        await waitForElements<HTMLDivElement>(videoItemSelector);

      if (!nodePlaylistRender) return null;

      const renderedPlaylistItems = [...nodePlaylistRender].map((el): string =>
        getVideoId(el.querySelector("a")?.href),
      );
      const renderedCache = getCache("renderedCache", message.listId);

      // console.log("=>renderedPlaylistItems", renderedPlaylistItems);
      // console.log("=>renderedCache", renderedCache);

      if (
        renderedCache &&
        !!renderedCache?.length &&
        comparePlaylist(renderedCache, renderedPlaylistItems)
      ) {
        console.log("check!!!");
        //TODO use this data to organize the playlist
        console.log(
          getCache("playlistCache", getListId(location.href))?.items[
            message.videoId
          ].contentDetails.videoPublishedAt,
        );
      } else {
        storeCache("renderedCache", renderedPlaylistItems, message.listId);
        playlistAPI(message.listId)?.then((data) => {
          if (!data) return null;
          storeCache("playlistCache", data, message.listId!);
          return data;
        });
      }
    });
  },
  matches: ["*://*.youtube.com/*"],
});
