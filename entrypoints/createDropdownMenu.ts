import { clog, localGet, localSet, sortRenderedPlaylist } from "@/helper";
import { ApiCache, YtSortOrder } from "@/types";
import { reversePlaylistSVG } from "./ui/reverseBtn";

function createDropdownMenu(
  cache: ApiCache | null,
  playlistContainer: HTMLDivElement,
) {
  document.querySelector(".ytSortDropdown")?.remove();

  let isReversed: boolean = localGet("ytSortisReversed") === "true";

  let sortOrder: YtSortOrder =
    (localGet("ytSortOrder") as YtSortOrder) ?? "orig";

  const select = document.createElement("select");
  select.className = "header ytd-playlist-panel-renderer ytSortDropdown";
  select.style.color = "var(--yt-spec-text-primary)";
  select.style.height = "25px";
  select.style.paddingBlock = "0px";
  select.style.borderRadius = "5px";
  select.style.marginInline = "5px";

  const reverseBtn = document.createElement("button");
  reverseBtn.className = "ytSortReverseBtn ytSortDropdown";
  reverseBtn.innerHTML = reversePlaylistSVG;
  reverseBtn.style.color = "var(--yt-spec-text-primary)";
  reverseBtn.style.backgroundColor = "transparent";
  reverseBtn.style.border = "transparent";
  reverseBtn.style.cursor = "pointer";
  reverseBtn.style.height = "40px";
  reverseBtn.style.aspectRatio = "1/1";
  // reverseBtn.style.paddingBlock = "5px";
  // reverseBtn.style.paddingInline = "10px";
  reverseBtn.style.padding = "5px";
  reverseBtn.style.borderRadius = "50%";
  reverseBtn.style.fontSize = "16px";
  reverseBtn.style.fontWeight = "200";
  if (isReversed) reverseBtn.style.transform = "scaleY(-1)";
  else reverseBtn.style.transform = "scaleY(1)";
  // reverseBtn.style.backgroundColor = "rgba(255,26,26,0.2)";

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
    sortRenderedPlaylist(playlistContainer, cache, sortOrder, isReversed);
    localSet("ytSortOrder", sortOrder);
  });

  const reverseBtnFunc = (element: HTMLButtonElement) => {
    isReversed = !isReversed;

    if (isReversed) element.style.transform = "scaleY(-1)";
    else element.style.transform = "scaleY(1)";

    localSet("ytSortisReversed", isReversed ? "true" : "false");

    sortRenderedPlaylist(playlistContainer, cache, sortOrder, isReversed);
  };

  const playlistMenuBtns = document.querySelector(
    "div#playlist-actions > div > div > ytd-menu-renderer > #top-level-buttons-computed",
  );

  reverseBtn.addEventListener("mouseenter", () => {
    reverseBtn.style.backgroundColor = "var(--yt-spec-outline)";
  });

  ["click", "mouseleave"].forEach((v) => {
    reverseBtn.addEventListener(v, () => {
      reverseBtn.style.backgroundColor = "transparent";
    });
  });

  reverseBtn.addEventListener("click", () => {
    reverseBtnFunc(reverseBtn);
  });

  playlistMenuBtns?.appendChild(select);
  playlistMenuBtns?.appendChild(reverseBtn);
}

export default createDropdownMenu;
