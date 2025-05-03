function removeAdblockOverlay() {
  // Remover overlay genérico com texto "please disable your adblocker"
  const allDivs = document.querySelectorAll("div");

  allDivs.forEach(div => {
    const text = div.innerText?.toLowerCase();
    if (text && text.includes("please disable your adblocker")) {
      div.remove();
      console.log("[NS Blocker] Overlay 1 removido.");
    }
  });

  // Remover popup do SweetAlert2
  const swal = document.querySelector(".swal2-container");
  if (swal) {
    swal.remove();
    console.log("[NS Blocker] Overlay SweetAlert2 removido.");
  }
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