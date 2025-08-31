(function () {
  'use strict';

  const maxChecks = 20;
  const scrollOffset = 100;
  let checkedCount = 0;
  let followedCount = 0;

  function goToProfile() {
    const profileBtn = document.querySelector('[data-testid="AppTabBar_Profile_Link"]');
    if (profileBtn) {
      profileBtn.click();
      console.log('🚀 Navigating to your profile');
      setTimeout(goToVerifiedFollowers, 2000);
    } else {
      console.log('❌ Profile button not found');
    }
  }

  function goToVerifiedFollowers() {
    const verifiedLink = Array.from(document.querySelectorAll('a[href]')).find(link =>
      link.getAttribute('href')?.includes('/verified_followers') &&
      link.offsetParent !== null
    );

    if (verifiedLink) {
      verifiedLink.click();
      console.log('🔍 Opening verified followers tab');
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
      const rect = cell.getBoundingClientRect();
      const scrollY = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top: scrollY, behavior: 'smooth' });

      const followBtn = cell.querySelector('button[aria-label*="Follow"]');
      if (followBtn && followBtn.offsetParent !== null) {
        const label = followBtn.getAttribute('aria-label');
        if (label.includes('Follow back')) {
          followBtn.click();
          followedCount++;
          console.log(`👤 Followed: ${label}`);
        } else {
          console.log(`🚫 Skipped: ${label}`);
        }
      } else {
        console.log('🚫 No followable button in cell');
      }

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

  setTimeout(goToProfile, 1000);
})();
