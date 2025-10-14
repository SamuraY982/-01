  window.addEventListener("load", () => {
      document.querySelectorAll(".bar-fill").forEach(bar => {
        const width = bar.getAttribute("data-width");
        bar.style.width = width;
      });
    });