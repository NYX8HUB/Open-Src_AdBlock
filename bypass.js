function removeAdblockOverlay() {
  const allDivs = document.querySelectorAll("div");

  allDivs.forEach(div => {
    const text = div.innerText?.toLowerCase();
    if (text && text.includes("please disable your adblocker")) {
      div.remove();
      console.log("ok");
    }
  });

  const swal = document.querySelector(".swal2-container");
  if (swal) {
    swal.remove();
    console.log("ok ok");
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