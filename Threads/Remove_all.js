function unfollowAllSmart() {
  const whitelist = ['threads', 'yourbestie', 'yanaheat', 'yanasn0w1'];
  let unfollowedCount = 0;
  let lastSeenCount = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 10;

  function randomDelay(min = 1000, max = 2000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getFollowButtons() {
    return Array.from(document.querySelectorAll('div[role="button"]'))
      .filter(btn => btn.textContent.trim() === 'Following')
      .filter(btn => {
        const parent = btn.closest('div.x78zum5');
        const usernameEl = parent?.querySelector('a[href^="/@"] span');
        const username = usernameEl?.textContent?.trim().toLowerCase();
        return username && !whitelist.includes(username);
      });
  }

  function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function clickNext() {
    const followButtons = getFollowButtons();

    if (followButtons.length === 0) {
      if (scrollAttempts >= maxScrollAttempts) {
        console.log(`✅ Finished unfollowing ${unfollowedCount} accounts.`);
        return;
      }

      scrollToBottom();
      scrollAttempts++;
      console.log(`🔄 Scrolling to load more... Attempt ${scrollAttempts}`);
      setTimeout(clickNext, randomDelay(1500, 2500));
      return;
    }

    scrollAttempts = 0; // Reset scroll attempts when new buttons found

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
            setTimeout(clickNext, randomDelay());
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
