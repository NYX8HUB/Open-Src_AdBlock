function removeAdblockOverlay() {
  const allDivs = document.querySelectorAll("div");

  allDivs.forEach(div => {
    const text = div.innerText?.toLowerCase();
    if (text && text.includes("please disable your adblocker")) {
      div.remove();
      console.log("[NS Blocker] Overlay de Adblock removido.");
    }
  });
}

function startObserver() {
  removeAdblockOverlay();

  const observer = new MutationObserver(removeAdblockOverlay);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserver);
} else {
  startObserver();
}
