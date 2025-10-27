 document.addEventListener("DOMContentLoaded", () => {
      const modal = document.getElementById("appealModal");
      const openBtn = document.querySelector(".button-sn");
      const closeBtn = document.querySelector(".close-modal");
      const form = document.getElementById("appealForm");
      const thankYou = document.getElementById("thankYouMessage");
      const appealBody = document.getElementById("appealBody");

      // открыть модалку
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "flex";
      });

      // закрыть крестиком
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        resetFormView();
      });

      // закрыть по клику в фон
      modal.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
          modal.style.display = "none";
          resetFormView();
        }
      });

      // обработка формы
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        appealBody.style.display = "none"; 
        thankYou.style.display = "flex";   
        setTimeout(() => {
          modal.style.display = "none";
          resetFormView();
        }, 3000); 
      });

      function resetFormView() {
        appealBody.style.display = "block";
        thankYou.style.display = "none";
      }
    });