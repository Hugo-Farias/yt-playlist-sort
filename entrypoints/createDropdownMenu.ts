import { clog, localAdd, sortRenderedPlaylist } from "@/helper";
import { ApiCache, YtSortOrder } from "@/types";

function createDropdownMenu(
  cache: ApiCache | null,
  playlistContainer: HTMLDivElement,
  playlistMenuBtns: HTMLDivElement,
) {
  const dropdownElList = document.querySelectorAll(".ytSortDropdown");
  dropdownElList.forEach((el) => el.remove());

  let sortOrder: YtSortOrder = cache?.sortOrder ?? "orig";

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

    sortRenderedPlaylist(
      playlistContainer,
      cache,
      sortOrder,
      cache?.isReversed ?? false,
    );
  });

  playlistMenuBtns?.appendChild(select);
}

export default createDropdownMenu;
