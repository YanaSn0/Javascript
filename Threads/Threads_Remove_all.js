(async () => {
  // -----------------------------
  // Config
  // -----------------------------
  const followers = false;   // unfollow people who follow you
  const following = true;    // unfollow people you follow

  const WAIT_BEFORE_CLICK_FOLLOWING_MS = 2500;
  const limitU = 200;        // unfollow cap
  let countU = 0;            // unfollow counter
  const minU = 500;          // min delay (ms)
  const maxU = 1000;         // max delay (ms)

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function randomDelay() {
    const ms = Math.floor(Math.random() * (maxU - minU + 1)) + minU;
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // -----------------------------
  // Navigation
  // -----------------------------
  async function goToProfile() {
    const profileLink = [...document.querySelectorAll('a[role="link"]')]
      .find(a => a.querySelector('svg[aria-label="Profile"]'));
    if (profileLink) {
      profileLink.click();
      console.log('[Threads] Clicked profile');
      await sleep(2000);
    }
  }

  async function openList() {
    const counts = [...document.querySelectorAll('a, div[role="button"], span')]
      .filter(el => /followers/i.test(el.textContent) || /following/i.test(el.textContent));
    if (counts.length) {
      counts[0].click();
      console.log('[Threads] Opened followers/following modal');
      await sleep(1500);
    }

    if (following && !followers) {
      await sleep(WAIT_BEFORE_CLICK_FOLLOWING_MS);
      let tab =
        document.querySelector('div[aria-label="Following"][role="button"]') ||
        [...document.querySelectorAll('[role="tab"]')]
          .find(el => (el.textContent || '').trim().toLowerCase() === 'following') ||
        [...document.querySelectorAll('div[role="button"], button, span')]
          .find(el => (el.textContent || '').trim() === 'Following');
      if (tab) {
        tab.click();
        console.log('[Threads] Switched to Following tab');
        await sleep(2000);
      }
    }
  }

  // -----------------------------
  // Helper: wait for confirm
  // -----------------------------
  async function waitForUnfollowConfirm(timeout = 2000) {
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        const confirm = [...document.querySelectorAll('button, div[role="button"]')]
          .find(el => el.offsetParent !== null && el.textContent.trim() === 'Unfollow');
        if (confirm) {
          observer.disconnect();
          resolve(confirm);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
    });
  }

  // -----------------------------
  // Exit helpers
  // -----------------------------
  async function exitToHome() {
    // click outside modal
    document.body.click();
    await sleep(1000);
    // click home link
    const homeLink = document.querySelector('a[href="/"][role="link"]');
    if (homeLink) {
      homeLink.click();
      console.log('[Threads] Returned home');
    }
  }

  // -----------------------------
  // Unfollow loop
  // -----------------------------
  async function unfollowLoop() {
    let retries = 0;

    while (countU < limitU) {
      const btn = [...document.querySelectorAll('button, div[role="button"]')]
        .find(b => b.offsetParent !== null && b.textContent.trim() === 'Following');

      if (!btn) {
        retries++;
        if (retries >= 3) {
          console.log('[Threads] No more buttons after 3 retries, exiting…');
          await exitToHome();
          break;
        }
        window.scrollBy(0, 800);
        await sleep(1500);
        continue;
      }

      retries = 0;
      btn.scrollIntoView({behavior:'smooth', block:'center'});
      btn.click();

      const confirm = await waitForUnfollowConfirm();
      if (confirm) {
        confirm.click();
        await sleep(500);

        // Check if it bounced back to "Following" (rate limit)
        if (btn.textContent.trim() === 'Following') {
          console.warn('[Threads] Rate limit detected, exiting to home…');
          await exitToHome();
          break;
        }

        countU++;
        console.log(`[Threads] Unfollowed #${countU}`);
      }

      await randomDelay();
    }

    if (countU >= limitU) {
      console.log('[Threads] Done, limit reached.');
      await exitToHome();
    }
  }

  // -----------------------------
  // Run sequence
  // -----------------------------
  await sleep(2000);
  await goToProfile();
  await openList();
  await unfollowLoop();
})();
