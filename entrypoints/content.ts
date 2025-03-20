export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  main() {
    chrome.runtime.onMessage.addListener((message) => {
      console.clear();
      // console.log("message=>", message);

      // const video = document.querySelector<HTMLVideoElement>("video");
      // if (video) video.pause();

      // [...document.querySelectorAll("#video-title")].forEach((value) =>
      //   console.log(value.textContent),
      // );

      const playlistItems = [
        ...document.querySelectorAll<HTMLDivElement>(
          "ytd-playlist-panel-video-renderer",
        ),
      ].map((el) => {
        const titleEl = el.querySelector("#video-title");
        const urlEl = el.querySelector("a");

        if (!titleEl?.textContent || !urlEl) return null;

        return {
          title: titleEl.textContent.trim(),
          videoId: new URL(urlEl.href).searchParams.get("v"),
        };
      });

      console.log(playlistItems);
    });
  },
});
