document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.innerHTML = "<i class='fas fa-bars'></i>";
  document.querySelector('.main-nav').appendChild(menuToggle);

  menuToggle.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
  });

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (currentPage === linkPage
            || (currentPage === '' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });
});
