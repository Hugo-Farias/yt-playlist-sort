const reversePlaylistSVG = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="24" height="24"
  aria-hidden="true"
  fill="currentColor"
  stroke="currentColor"
  stroke-width="1"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <!-- up arrow (left) -->
  <path d="M7 20V7m0 0l-3 3m3-3l3 3" />
  <!-- down arrow (right) -->
  <path d="M17 4v13m0 0l-3-3m3 3l3-3" />
</svg>
`;

// TODO: add reverse order UI button
export const reverseBtn = document.createElement("button");
// reverseBtn.className = "ytSortReverseBtn";
// reverseBtn.textContent = "⇅";
reverseBtn.innerHTML = reversePlaylistSVG;
reverseBtn.style.color = "var(--yt-spec-text-primary)";
reverseBtn.style.backgroundColor = "transparent";
reverseBtn.style.border = "transparent";
reverseBtn.style.cursor = "pointer";
reverseBtn.style.height = "40px";
reverseBtn.style.aspectRatio = "1/1";
// reverseBtn.style.paddingBlock = "5px";
// reverseBtn.style.paddingInline = "10px";
reverseBtn.style.padding = "7px";
reverseBtn.style.borderRadius = "50%";
reverseBtn.style.fontSize = "16px";
reverseBtn.style.fontWeight = "200";

reverseBtn.addEventListener("mouseenter", () => {
  // reverseBtn.style.backgroundColor = "var(--yt-spec-brand-background-solid)";
  reverseBtn.style.backgroundColor = "rgba(255,255,255,0.2)";
});

reverseBtn.addEventListener("mouseleave", () => {
  reverseBtn.style.backgroundColor = "transparent";
});
