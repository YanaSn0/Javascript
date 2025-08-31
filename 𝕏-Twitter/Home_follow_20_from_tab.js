(function () {
  'use strict';

  const username = 'YanaSn0w1';
  const maxChecks = 20;
  let checkedCount = 0;
  let followedCount = 0;

  function goToProfileFromHome() {
    const profileLink = document.querySelector(`a[href="/${username}"]`);
    if (profileLink && profileLink.offsetParent !== null) {
      profileLink.click();
      console.log(`🚀 Navigating to @${username}'s profile`);
      setTimeout(goToVerifiedFollowers, 2000);
    } else {
      console.log(`❌ Profile link for @${username} not found on home`);
    }
  }

  function goToVerifiedFollowers() {
    const verifiedLink = document.querySelector(`a[href="/${username}/verified_followers"]`);
    if (verifiedLink && verifiedLink.offsetParent !== null) {
      verifiedLink.click();
      console.log('🔍 Opening verified followers list');
      setTimeout(() => followFromList(), 2000);
    } else {
      console.log('❌ Verified followers link not found');
    }
  }

  function followFromList() {
    const cells = Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"]'));
    if (cells.length === 0) {
      console.log('❌ No user cells found');
      return clickBackTwice();
    }

    function processNext() {
      if (checkedCount >= maxChecks || checkedCount >= cells.length) {
        console.log(`✅ Done. Checked ${checkedCount}, followed ${followedCount}`);
        return clickBackTwice();
      }

      const cell = cells[checkedCount];
      const followBtn = cell.querySelector('button[aria-label^="Follow"]');

      if (followBtn && followBtn.offsetParent !== null) {
        const label = followBtn.getAttribute('aria-label');
        if (label.includes('Follow back') || label.startsWith('Follow @')) {
          followBtn.click();
          followedCount++;
          console.log(`👤 Followed: ${label}`);
        } else {
          console.log(`⚠️ Skipped button: ${label}`);
        }
      } else {
        console.log('🚫 No followable button in cell');
      }

      cell.scrollIntoView({ behavior: 'smooth', block: 'end' });
      checkedCount++;

      setTimeout(processNext, 1000);
    }

    processNext();
  }

  function clickBackTwice() {
    const backBtn = document.querySelector('button[data-testid="app-bar-back"]');
    if (backBtn) {
      backBtn.click();
      console.log('🔙 First back click');
      setTimeout(() => {
        const secondBackBtn = document.querySelector('button[data-testid="app-bar-back"]');
        if (secondBackBtn) {
          secondBackBtn.click();
          console.log('🔙 Second back click — returned to home');
        } else {
          console.log('❌ Second back button not found');
        }
      }, 1000);
    } else {
      console.log('❌ Back button not found');
    }
  }

  setTimeout(goToProfileFromHome, 1000);
})();
