import { sortRenderedPlaylist } from "@/helper";
import { ApiCache, YtSortOrder } from "@/types";

function createDropdownMenu(
  playlistContainer: HTMLDivElement,
  cache: ApiCache,
): HTMLSelectElement {
  let sortOrder: YtSortOrder =
    (localStorage.getItem("ytSortOrder") as YtSortOrder) ?? "orig";

  const select = document.createElement("select");
  select.className = "header ytd-playlist-panel-renderer";
  select.style.color = "var(--yt-spec-text-primary)";
  select.style.height = "25px";
  // select.style.paddingBottom = "1px";
  select.style.paddingBlock = "0px";
  select.style.borderRadius = "10px";
  // select.style.display = "flex";
  // select.style.justifyContent = "space-between";
  // select.style.alignItems = "center";

  const options: { value: YtSortOrder; label: string }[] = [
    { value: "asc", label: "Ascending" },
    { value: "desc", label: "Descending" },
    { value: "orig", label: "Original" },
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
    console.log("Sort order changed to:", sortOrder);
    sortRenderedPlaylist(playlistContainer, cache, sortOrder);
    localStorage.setItem("ytSortOrder", sortOrder);
  });

  return select;
}

export default createDropdownMenu;
