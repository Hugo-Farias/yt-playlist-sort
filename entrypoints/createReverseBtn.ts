import { clog, localAdd, sortRenderedPlaylist } from "@/helper";
import { ApiCache } from "@/types";
import { reversePlaylistSVG } from "./ui/reverseBtn";

const createReverseBtn = (
  cache: ApiCache,
  playlistContainer: HTMLDivElement,
  playlistMenuBtns: HTMLDivElement | null,
) => {
  let isReversed = cache.isReversed;
  console.log("isReversed ==> ", isReversed);

  const reverseBtn = document.createElement("button");
  reverseBtn.className = "ytSortReverseBtn ytSortDropdown";
  reverseBtn.innerHTML = reversePlaylistSVG;
  reverseBtn.style.backgroundColor = "transparent";
  reverseBtn.style.border = "transparent";
  reverseBtn.style.cursor = "pointer";
  reverseBtn.style.height = "40px";
  reverseBtn.style.aspectRatio = "1/1";
  reverseBtn.style.color = "var(--yt-spec-text-primary)";
  reverseBtn.style.padding = "5px";
  reverseBtn.style.borderRadius = "50%";
  reverseBtn.style.fontSize = "16px";
  reverseBtn.style.fontWeight = "200";
  reverseBtn.ariaLabel = "Reverse playlist order";

  const changeBtnEffect = () => {
    reverseBtn.style.transform = `scaleY(${isReversed ? "-1" : "1"})`;
    reverseBtn.ariaPressed = String(isReversed);
    reverseBtn.children[0].setAttribute("stroke-width", isReversed ? "2" : "1");
  };
  changeBtnEffect();

  const reverseBtnFunc = () => {
    isReversed = !isReversed;
    changeBtnEffect();

    clog("Reversed:", isReversed);
    localAdd("apiCache", { isReversed: isReversed });

    sortRenderedPlaylist(
      playlistContainer,
      cache,
      cache.sortOrder ?? "orig",
      isReversed,
    );
  };

  reverseBtn.addEventListener("click", () => {
    reverseBtnFunc();
  });

  reverseBtn.addEventListener("mouseenter", () => {
    reverseBtn.style.backgroundColor = "var(--yt-spec-outline)";
  });

  reverseBtn.addEventListener("mouseleave", () => {
    reverseBtn.style.backgroundColor = "transparent";
  });

  playlistMenuBtns?.appendChild(reverseBtn);
};

export default createReverseBtn;
