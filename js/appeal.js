
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("appealModal");
  const openBtn = document.querySelector(".button-sn a");
  const closeBtn = document.querySelector(".close-modal");
  const form = document.getElementById("appealForm");
  const thankYou = document.getElementById("thankYouMessage");
  const appealBody = document.getElementById("appealBody");

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    resetFormView();
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      resetFormView();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    appealBody.style.display = "none"; 
    thankYou.style.display = "flex";   
    setTimeout(() => {
      modal.style.display = "none";
      resetFormView();
    }, 5000); // 
  });

  function resetFormView() {
    appealBody.style.display = "block";
    thankYou.style.display = "none";
  }
});

