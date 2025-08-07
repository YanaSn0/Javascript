// ⚠️ Educational use only — may violate Threads' terms of service

function unfollowAllSmart() {
  const whitelist = ['yanasn0w1', 'yanaheat', 'yourbestie']; // 👈 Add usernames to keep
  let unfollowedCount = 0;

  function getFollowButtons() {
    return Array.from(document.querySelectorAll('div[role="button"]'))
      .filter(btn => btn.textContent.trim() === 'Following')
      .filter(btn => {
        const parent = btn.closest('div.x78zum5'); // Adjust if needed
        const usernameEl = parent?.querySelector('a[href^="/@"] span');
        const username = usernameEl?.textContent?.trim().toLowerCase();
        return username && !whitelist.includes(username);
      });
  }

  function randomDelay(min = 1000, max = 2000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clickNext() {
    const followButtons = getFollowButtons();

    if (followButtons.length === 0) {
      console.log(`✅ Finished unfollowing ${unfollowedCount} accounts.`);
      return;
    }

    const btn = followButtons[0];
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      btn.click(); // Open unfollow dialog

      setTimeout(() => {
        const unfollowBtn = Array.from(document.querySelectorAll('div[role="button"]'))
          .find(el => el.textContent.trim() === 'Unfollow');

        if (unfollowBtn) {
          setTimeout(() => {
            unfollowBtn.click();
            unfollowedCount++;
            console.log(`🚫 Unfollowed #${unfollowedCount}`);
            setTimeout(clickNext, randomDelay()); // Wait before next iteration
          }, randomDelay());
        } else {
          console.warn(`⚠️ Unfollow button not found.`);
          setTimeout(clickNext, randomDelay());
        }
      }, randomDelay());
    }, randomDelay());
  }

  clickNext();
}

unfollowAllSmart();
