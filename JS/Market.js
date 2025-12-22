
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });


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

