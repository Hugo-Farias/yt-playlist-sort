import { i18n } from "#i18n";
import { reversePlaylistSVG } from "@/entrypoints/ui/reverseBtn";
import { debounce, localAdd, sortRenderedPlaylist } from "@/helper";
import type { ApiCache, YtSortOrder } from "@/types";

let isReversed: boolean = false;
let sortOrder: YtSortOrder = "orig";
const isDarkMode = document.querySelector("html")?.hasAttribute("dark");
const textColor = isDarkMode ? "#fff" : "#212121";

export const createDropdownMenu = (
  cache: ApiCache | null,
  playlistContainer: HTMLDivElement,
  playlistMenuBtns: HTMLDivElement,
  fullCache: { [key: string]: ApiCache },
) => {
  const dropdownElList = document.querySelectorAll(".ytSortDropdown");
  dropdownElList.forEach((el) => {
    el.remove();
  });

  sortOrder = cache?.sortOrder ?? "orig";

  const select = document.createElement("select");
  select.className = "header ytd-playlist-panel-renderer ytSortDropdown";
  select.style.color = textColor;
  select.style.height = "25px";
  select.style.paddingBlock = "0px";
  select.style.borderRadius = "5px";
  select.style.marginInline = "5px";
  select.ariaLabel = i18n.t("buttonSelect");

  const options: { value: YtSortOrder; label: string }[] = [
    { value: "orig", label: i18n.t("selectDefaultOrder") },
    { value: "title", label: i18n.t("selectTitle") },
    { value: "date", label: i18n.t("selectDate") },
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

    localAdd("ytSortMainCache", { sortOrder: sortOrder });

    if (cache) fullCache[cache.listId].sortOrder = sortOrder;

    debounce(() => {
      sortRenderedPlaylist(playlistContainer, cache);
    }, 250);
  });

  playlistMenuBtns?.appendChild(select);
};

export const createReverseBtn = (
  cache: ApiCache,
  playlistContainer: HTMLDivElement,
  playlistMenuBtns: HTMLDivElement | null,
  fullCache: { [key: string]: ApiCache },
) => {
  isReversed = cache.isReversed;

  const reverseBtn = document.createElement("button");
  reverseBtn.className = "ytSortReverseBtn ytSortDropdown";
  reverseBtn.innerHTML = reversePlaylistSVG;
  reverseBtn.style.backgroundColor = "transparent";
  reverseBtn.style.border = "transparent";
  reverseBtn.style.cursor = "pointer";
  reverseBtn.style.height = "40px";
  reverseBtn.style.aspectRatio = "1/1";
  reverseBtn.style.color = textColor;
  reverseBtn.style.padding = "5px";
  reverseBtn.style.borderRadius = "50%";
  reverseBtn.style.fontSize = "16px";
  reverseBtn.style.fontWeight = "200";
  reverseBtn.ariaLabel = i18n.t("buttonReverse");
  reverseBtn.title = i18n.t("buttonReverse");

  const changeBtnEffect = () => {
    reverseBtn.style.transform = `scaleY(${isReversed ? "-1" : "1"})`;
    reverseBtn.ariaPressed = String(isReversed);
    reverseBtn.children[0].setAttribute("stroke-width", isReversed ? "2" : "1");
  };
  changeBtnEffect();

  const reverseBtnFunc = () => {
    isReversed = !isReversed;
    changeBtnEffect();

    localAdd("ytSortMainCache", { isReversed: isReversed });

    fullCache[cache.listId].isReversed = isReversed;

    debounce(() => {
      sortRenderedPlaylist(playlistContainer, cache);
    }, 250);
  };

  reverseBtn.addEventListener("click", () => {
    return reverseBtnFunc();
  });

  reverseBtn.addEventListener("mouseenter", () => {
    reverseBtn.style.backgroundColor = "var(--yt-spec-outline)";
  });

  reverseBtn.addEventListener("mouseleave", () => {
    reverseBtn.style.backgroundColor = "transparent";
  });

  playlistMenuBtns?.appendChild(reverseBtn);
};

// Spinner Element used during loading of playlist data
export function createSpinner(className: string) {
  const spinner = document.createElement("span");

  spinner.className = className;

  const style = document.createElement("style");

  style.textContent =
    "." +
    className +
    " {" +
    "border: 2px solid rgba(0, 0, 0, 0.1);" +
    "border-top: 2px solid #888;" +
    "border-radius: 50%;" +
    "width: 20px;" +
    "height: 20px;" +
    "animation: spin 750ms linear infinite;" +
    "margin: auto;" +
    "}" +
    "@keyframes spin {" +
    "to { transform: rotate(360deg); }" +
    "}";

  spinner.appendChild(style);

  return spinner;
}

export const createLoadingLabel = (className: string) => {
  const loadingSpan = document.createElement("span");
  loadingSpan.textContent = "Loading playlist...";
  loadingSpan.style.color = "#888";
  loadingSpan.className = className;
  loadingSpan.style.marginInline = "10px";

  return loadingSpan;
};
