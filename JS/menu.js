const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');
const links = document.querySelectorAll('.nav-link');

burger.addEventListener('click', () => {
  const opened = nav.classList.toggle('active');
  burger.classList.toggle('active', opened);
  document.body.classList.toggle('lock', opened);
});

links.forEach(link => {
  link.addEventListener('click', () => {
    link.parentElement.classList.toggle('open');
  });
});