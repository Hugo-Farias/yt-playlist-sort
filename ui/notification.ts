type ToastType = "normal" | "error" | "warning";

const dismissToast = (
  toast: HTMLElement,
  oldStyle: CSSStyleDeclaration,
  duration: number,
) => {
  setTimeout(() => {
    toast.style.transform = oldStyle.transform;
    setTimeout(() => {
      toast.remove();
    }, duration * 0.2);
  }, duration);
};

export const showToast = (
  message: string,
  duration: number = 3000,
  type: ToastType = "normal",
) => {
  const toast = document.createElement("span");

  toast.textContent = `${capitalize(type)}:\n${message}`;

  toast.className = "ytSortNotify";

  const typeObj: Record<ToastType, string> = {
    normal: "rgb(120 130 145 / 12%)",
    error: "rgb(239 68 68 / 14%)",
    warning: "rgb(234 179 8 / 14%)",
  };

  Object.assign(toast.style, {
    position: "fixed",
    top: "10%",
    left: "50%",
    transition: "transform 300ms",
    transform: "translateX(150%)",
    // transform: "-100%",
    padding: "12px 16px",
    background: typeObj[type],
    backdropFilter: "blur(10px)",
    border: "1px solid rgb(255 255 255 / 20%)",
    color: "#fff",
    borderRadius: "10px",
    fontSize: "20px",
    zIndex: "9999",
    radius: "60px",
    width: "300px",
  });

  document.body.append(toast);

  setTimeout(() => {
    toast.style.transform = "translateX(50%)";
  }, 200);

  const oldStyle = { ...toast.style };

  dismissToast(toast, oldStyle, duration);
};
