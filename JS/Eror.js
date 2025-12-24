
(() => {
  const modal = document.getElementById("errorModal");
  if (!modal) return;

  const overlay = modal.querySelector(".error-overlay");
  const closeBtn = modal.querySelector("#errorClose");
  const okBtn = modal.querySelector("#errorOkBtn");

  function openError() {
    modal.classList.add("active");
  }

  function closeError() {
    modal.classList.remove("active");
  }

  // =======================
  // OPEN (by data-error)
  // =======================
  document.addEventListener("click", e => {
    const link = e.target.closest("a[data-error]");
    if (!link) return;

    e.preventDefault(); // ❌ запрет перехода
    openError();
  });

  // =======================
  // CLOSE
  // =======================
  overlay.addEventListener("click", closeError);
  closeBtn.addEventListener("click", closeError);
  okBtn.addEventListener("click", closeError);

  // ESC key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeError();
    }
  });
})();

