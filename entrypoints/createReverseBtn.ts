import { localGet, localSet, sortRenderedPlaylist } from "@/helper";
import { ApiCache, YtSortOrder } from "@/types";
import { reversePlaylistSVG } from "./ui/reverseBtn";

const createReverseBtn = (
  cache: ApiCache,
  playlistContainer: HTMLDivElement,
  playlistMenuBtns: HTMLDivElement | null,
  isReversed: boolean,
) => {
  // const sortOrder = (localGet("ytSortOrder") as YtSortOrder) || "keep";

  const reverseBtn = document.createElement("button");
  reverseBtn.className = "ytSortReverseBtn ytSortDropdown";
  reverseBtn.innerHTML = reversePlaylistSVG;
  reverseBtn.style.backgroundColor = "transparent";
  reverseBtn.style.border = "transparent";
  reverseBtn.style.cursor = "pointer";
  reverseBtn.style.height = "40px";
  reverseBtn.style.aspectRatio = "1/1";
  reverseBtn.style.color = "var(--yt-spec-text-primary)";
  // reverseBtn.style.paddingBlock = "5px";
  // reverseBtn.style.paddingInline = "10px";
  reverseBtn.style.padding = "5px";
  reverseBtn.style.borderRadius = "50%";
  reverseBtn.style.fontSize = "16px";
  reverseBtn.style.fontWeight = "200";
  reverseBtn.ariaLabel = "Reverse playlist order";

  const changeBtnEffect = () => {
    reverseBtn.style.transform = `scaleY(${isReversed ? "1" : "-1"})`;
    reverseBtn.ariaPressed = String(isReversed);
    reverseBtn.children[0].setAttribute("stroke-width", isReversed ? "1" : "2");
  };
  changeBtnEffect();

  const reverseBtnFunc = () => {
    isReversed = !isReversed;

    localSet("ytSortisReversed", isReversed ? "true" : "false");

    sortRenderedPlaylist(
      playlistContainer,
      cache,
      isReversed,
      localGet("ytSortOrder") as YtSortOrder,
    );

    changeBtnEffect();
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
