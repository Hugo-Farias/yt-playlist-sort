import { sortRenderedPlaylist } from "@/helper";
import { ApiCache } from "@/types";

type SortOrder = "asc" | "desc" | "orig";

export function createDropdownMenu(
  playlistContainer: HTMLDivElement,
  cache: ApiCache,
): HTMLSelectElement {
  let sortOrder: SortOrder = "orig";

  const select = document.createElement("select");

  const options: { value: SortOrder; label: string }[] = [
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
    sortOrder = select.value as SortOrder;
    console.log("Sort order changed to:", sortOrder);
    sortRenderedPlaylist(playlistContainer, cache, sortOrder);
  });

  return select;
}
