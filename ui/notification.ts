type ToastType = "normal" | "error" | "warning";

const dismissToast = (
  toast: HTMLElement,
  oldStyle: CSSStyleDeclaration,
  duration: number,
) => {
  toast.style.transform = oldStyle.transform;
  setTimeout(() => {
    toast.remove();
  }, duration * 0.2);
};

// TODO: This needs a close button
export const showToast = (
  message: string,
  duration: number = 3000,
  type: ToastType = "normal",
) => {
  const toast = document.createElement("div");

  toast.textContent = message;
  toast.className = "ytSortNotify";

  const opacity = "80";
  const typeObj: Record<ToastType, string> = {
    normal: `rgb(33 33 33 / ${opacity}%)`,
    error: `rgb(239 68 68 / ${opacity}%)`,
    warning: `rgb(234 179 8 / ${opacity}%)`,
  };

  Object.assign(toast.style, {
    position: "fixed",
    top: "10%",
    left: "50%",
    transition: "transform 300ms",
    transform: "translateX(200%)",
    padding: "12px 40px 12px 16px",
    background: typeObj[type],
    backdropFilter: "blur(10px)",
    border: "1px solid rgb(255 255 255 / 20%)",
    color: "#fff",
    borderRadius: "10px",
    fontSize: "20px",
    zIndex: "9999",
    width: "300px",
  });

  const closeButton = document.createElement("button");

  closeButton.textContent = "×";

  Object.assign(closeButton.style, {
    position: "absolute",
    top: "6px",
    right: "8px",
    border: "none",
    background: "none",
    color: "#fff",
    fontSize: "24px",
    lineHeight: "1",
    cursor: "pointer",
    padding: "2px 6px",
    opacity: "0.7",
  });

  toast.append(closeButton);
  document.body.append(toast);

  setTimeout(() => {
    toast.style.transform = "translateX(50%)";
  }, 200);

  const oldStyle = { ...toast.style };

  closeButton.addEventListener("click", () => {
    dismissToast(toast, oldStyle, duration);
  });

  setTimeout(() => {
    dismissToast(toast, oldStyle, duration);
  }, duration);
};
