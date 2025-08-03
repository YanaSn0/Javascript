(async () => {
  const WHITELIST = ['YanaSn0w', 'YanaSn0w1'];
  const DELAY = 2000; // Increased delay
  const SCROLL_DELAY = 1200;
  const processed = new Set();
  let unfollowed = 0, skipped = 0, total = 0;
  let lastTotalCells = 0, stuckCount = 0;

  function getCells() {
    return Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
  }

  function getUsername(cell) {
    const a = cell.querySelector('a[href^="/"][role="link"]') || cell.querySelector('a[href^="/"]');
    return a ? a.getAttribute('href').replace(/^\//, '').split('/')[0] : '';
  }

  async function waitForConfirm() {
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const confirm = Array.from(document.querySelectorAll('button[data-testid="confirmationSheetConfirm"],div[role="menuitem"]')).find(el =>
          el.textContent.trim().toLowerCase() === 'unfollow' && el.offsetParent !== null
        );
        if (confirm) {
          observer.disconnect();
          resolve(confirm);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 2000);
    });
  }

  async function processVisible() {
    let didWork = false;
    const cells = getCells();
    for (let cell of cells) {
      const username = getUsername(cell);
      if (!username || processed.has(username)) continue;
      processed.add(username);
      total++;
      const isMutual = Array.from(cell.querySelectorAll('span')).some(span => span.textContent.trim().toLowerCase() === 'follows you');
      if (WHITELIST.includes(username) || isMutual) {
        console.log(`Skipping: @${username}`);
        skipped++;
        continue;
      }
      const btn = cell.querySelector('button[aria-label^="Following"],button[data-testid$="-unfollow"]');
      if (!btn) {
        console.log(`No unfollow button for: @${username}`);
        skipped++;
        continue;
      }
      btn.click();
      const confirm = await waitForConfirm();
      if (confirm) {
        confirm.click();
        unfollowed++;
        console.log(`Unfollowed: @${username}`);
        await new Promise(r => setTimeout(r, DELAY));
        didWork = true;
      } else {
        console.log(`Could not confirm for: @${username}, DOM state:`, document.querySelectorAll('div[role="dialog"]').length);
        skipped++;
      }
    }
    return didWork;
  }

  while (true) {
    await processVisible();
    window.scrollBy(0, 900);
    await new Promise(r => setTimeout(r, SCROLL_DELAY));
    let currCells = getCells().length;
    if (currCells === lastTotalCells) stuckCount++;
    else stuckCount = 0;
    lastTotalCells = currCells;
    if (stuckCount >= 8) break;
  }

  alert(`Done!\nUnfollowed: ${unfollowed}\nSkipped: ${skipped}`);
})();
