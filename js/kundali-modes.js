(function () {
  'use strict';

  const section = document.getElementById('kundali-calc');
  const janma = document.getElementById('janma-panel');
  const milan = document.getElementById('milan-panel');
  const janmaBtn = document.getElementById('mode-janma');
  const milanBtn = document.getElementById('mode-milan');
  if (!janma || !milan || !janmaBtn || !milanBtn) return;

  function apply(mode, scroll) {
    const isMilan = mode === 'milan';
    janma.hidden = isMilan;
    milan.hidden = !isMilan;
    janmaBtn.classList.toggle('is-active', !isMilan);
    milanBtn.classList.toggle('is-active', isMilan);
    janmaBtn.setAttribute('aria-selected', String(!isMilan));
    milanBtn.setAttribute('aria-selected', String(isMilan));
    janmaBtn.setAttribute('aria-pressed', String(!isMilan));
    milanBtn.setAttribute('aria-pressed', String(isMilan));
    if (!scroll || !section) return;
    try { section.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {
      section.scrollIntoView();
    }
  }

  janmaBtn.addEventListener('click', () => apply('janma', true));
  milanBtn.addEventListener('click', () => apply('milan', true));

  if (location.hash === '#vivah-milan') apply('milan', false);
})();
