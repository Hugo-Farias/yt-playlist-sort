import { clog, localAdd, sortRenderedPlaylist } from "@/helper";
import { ApiCache, YtSortOrder } from "@/types";
import { reversePlaylistSVG } from "@/entrypoints/ui/reverseBtn";

let isReversed: boolean = false;
let sortOrder: YtSortOrder = "orig";

export const createDropdownMenu = (
  cache: ApiCache | null,
  playlistContainer: HTMLDivElement,
  playlistMenuBtns: HTMLDivElement,
) => {
  const dropdownElList = document.querySelectorAll(".ytSortDropdown");
  dropdownElList.forEach((el) => el.remove());

  sortOrder = cache?.sortOrder ?? "orig";

  const select = document.createElement("select");
  select.className = "header ytd-playlist-panel-renderer ytSortDropdown";
  select.style.color = "var(--yt-spec-text-primary)";
  select.style.height = "25px";
  select.style.paddingBlock = "0px";
  select.style.borderRadius = "5px";
  select.style.marginInline = "5px";

  const options: { value: YtSortOrder; label: string }[] = [
    { value: "orig", label: "Default Order" },
    { value: "date", label: "Sort By Date" },
  ];

  for (const { value, label } of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    if (value === sortOrder) option.selected = true;
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    sortOrder = select.value as YtSortOrder;

    clog("Sort order changed to:", sortOrder);

    localAdd("apiCache", { sortOrder: sortOrder });

    sortRenderedPlaylist(playlistContainer, cache, sortOrder, isReversed);
  });

  playlistMenuBtns?.appendChild(select);
};

export const createReverseBtn = (
  cache: ApiCache,
  playlistContainer: HTMLDivElement,
  playlistMenuBtns: HTMLDivElement | null,
) => {
  isReversed = cache.isReversed;
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

    sortRenderedPlaylist(playlistContainer, cache, sortOrder, isReversed);
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
