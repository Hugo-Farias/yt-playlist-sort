export const showToast = (message: string, duration: number = 3000) => {
  const toast = document.createElement("span");

  toast.textContent = message;

  toast.className = "ytSortNotify";

  Object.assign(toast.style, {
    position: "fixed",
    top: "10%",
    left: "50%",
    transition: "transform 200ms",
    transform: "translateY(-500%)",
    // transform: "-100%",
    padding: "12px 16px",
    background: "rgba(33, 33, 33, 0.15)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    borderRadius: "2px",
    fontSize: "14px",
    zIndex: "9999",
    radius: "60px",
    // width: "100px",
    // height: "100px",
  });

  document.body.append(toast);

  setTimeout(() => {
    toast.style.transform = "translateY(100%)";
  }, 200);

  setTimeout(() => toast.remove(), duration);
};
