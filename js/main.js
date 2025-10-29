  window.addEventListener("load", () => {
      document.querySelectorAll(".bar-fill").forEach(bar => {
        const width = bar.getAttribute("data-width");
        bar.style.width = width;
      });
    });



let menuArrows = document.querySelectorAll ('.nav-arrow');
if (menuArrows.length > 0) {
   for (let index = 0; index < menuArrows.length; index++) {
    const menuArrow = menuArrows[index];
    menuArrow.addEventListener ("click", function (e) {
      menuArrow.parentElement.classList.toggle('_active')
    });
    
   }
}

const iconMenu = document.querySelector('.nav-icon');
if(iconMenu){
  const MenuNAV = document.querySelector('.nav');
  iconMenu.addEventListener ("click", function (e) {
      document.body.classList.toggle('_lock');
      iconMenu.classList.toggle('__active');
      MenuNAV.classList.toggle('__active');
    });
}
