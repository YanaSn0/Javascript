(function () {
  'use strict';

  const targetHandle = 'MusingOnCoffee'; // change to the handle you want
  const scrollOffset = 100;
  const maxChecks   = 2000; // safety cap
  let checkedCount  = 0;
  const seenHandles = new Set();
  let stopFlag      = false; // manual kill switch

  // expose a way to stop manually from console
  window.stopWalker = () => { stopFlag = true; console.log('🛑 Stop flag set'); };

  function processNext() {
    if (stopFlag) {
      console.log('🛑 Script stopped manually');
      return;
    }

    const cells = Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"]'));
    if (cells.length === 0) {
      console.log('❌ No cells found');
      return;
    }

    const cell = cells.find(c => {
      const handleEl = c.querySelector('a[href^="/"] span');
      const handle   = handleEl ? handleEl.textContent.trim() : null;
      return handle && !seenHandles.has(handle);
    });

    if (!cell) {
      // scroll further to force new batch
      window.scrollBy(0, 600);
      return setTimeout(processNext, 300);
    }

    const rect    = cell.getBoundingClientRect();
    const scrollY = window.scrollY + rect.top - scrollOffset;
    window.scrollTo({ top: scrollY, behavior: 'instant' });

    const handleEl = cell.querySelector('a[href^="/"] span');
    const handle   = handleEl ? handleEl.textContent.trim() : '(no handle)';
    console.log(`${checkedCount}: ${handle}`);
    seenHandles.add(handle);
    checkedCount++;

    if (handle === targetHandle) {
      console.log(`🎯 Found ${targetHandle} at position ${checkedCount - 1}`);
      return; // stop automatically
    }

    if (checkedCount >= maxChecks) {
      console.log(`✅ Stopped after ${checkedCount} (safety cap)`);
      return;
    }

    setTimeout(processNext, 300);
  }

  processNext();
})();
