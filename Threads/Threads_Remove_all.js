function unfollowAllSmart() {
  const whitelist = ['yourbestie', 'yanaheat', 'yanasn0w1'];
  let unfollowedCount = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 10;

  function getFollowButtons() {
    return Array.from(document.querySelectorAll('div[role="button"]'))
      .filter(btn => btn.textContent.trim() === 'Following' && btn.querySelector('div'))
      .filter(btn => {
        const parent = btn.closest('article') || btn.closest('div');
        let usernameEl = parent?.querySelector('a[href^="/"] span') ||
                        parent?.querySelector('span') ||
                        parent?.querySelector('a[href^="/"]');
        const username = usernameEl?.textContent?.trim().toLowerCase()?.replace('@', '');
        return !username || !whitelist.includes(username);
      });
  }

  function scrollToBottom() {
    const currentHeight = document.body.scrollHeight;
    window.scrollTo({ top: currentHeight, behavior: 'smooth' });
    console.log(`🔄 Scrolling to height: ${currentHeight}`);
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
      console.log(`🔄 Scrolling (Attempt ${scrollAttempts}/${maxScrollAttempts})`);
      setTimeout(clickNext, 2000); // Fixed 2s for scroll
      return;
    }

    scrollAttempts = 0; // Reset scroll attempts

    const btn = followButtons[0];
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Click "Following" button
    console.log(`👆 Clicking "Following" button`);
    btn.click();

    // Wait 1.5s, then click "Unfollow"
    setTimeout(() => {
      const unfollowBtn = Array.from(document.querySelectorAll('div[role="button"]'))
        .find(el => el.textContent.trim() === 'Unfollow' && el.querySelector('span'));

      if (unfollowBtn) {
        unfollowBtn.click();
        unfollowedCount++;
        console.log(`🚫 Unfollowed #${unfollowedCount}`);
      } else {
        console.warn(`⚠️ Unfollow button not found`);
      }

      // Wait 1.5s (total 3s for action), then proceed
      setTimeout(clickNext, 1500);
    }, 1500);
  }

  console.log(`🚀 Starting unfollow script for Threads`);
  clickNext();
}

unfollowAllSmart();
