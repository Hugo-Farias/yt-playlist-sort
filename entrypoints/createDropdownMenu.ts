import { clog, localGet, localSet, sortRenderedPlaylist } from "@/helper";
import { ApiCache, YtSortOrder } from "@/types";

function createDropdownMenu(
  cache: ApiCache | null,
  playlistContainer: HTMLDivElement,
) {
  document.querySelector(".ytSortDropdown")?.remove();

  let sortOrder: YtSortOrder =
    (localGet("ytSortOrder") as YtSortOrder) ?? "orig";

  // TODO: add reverse order button
  const select = document.createElement("select");
  select.className = "header ytd-playlist-panel-renderer ytSortDropdown";
  select.style.color = "var(--yt-spec-text-primary)";
  select.style.height = "25px";
  select.style.paddingBlock = "0px";
  select.style.borderRadius = "5px";

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
    sortRenderedPlaylist(playlistContainer, cache, sortOrder, false);
    localSet("ytSortOrder", sortOrder);
  });

  const playlistMenuBtns = document.querySelector(
    "div#playlist-actions > div > div > ytd-menu-renderer > #top-level-buttons-computed",
  );

  playlistMenuBtns?.appendChild(select);
}

export default createDropdownMenu;
