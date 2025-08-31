(function () {
  'use strict';

  const username = 'yummmycrypotato';
  const maxChecks = 20;
  const scrollOffset = 100; // Adjust this to control vertical offset
  let checkedCount = 0;
  let followedCount = 0;

  function simulateHover(element) {
    const mouseOverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(mouseOverEvent);
    console.log('🟡 Hover simulated on:', element);
  }

  function simulateUnhover(element) {
    const mouseOutEvent = new MouseEvent('mouseout', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(mouseOutEvent);
    console.log('🔵 Unhover simulated to close card');
  }

  function clickVerifiedFollowersLink() {
    const verifiedLink = document.querySelector(`a[href="/${username}/verified_followers"]`);
    if (verifiedLink && verifiedLink.offsetParent !== null) {
      verifiedLink.click();
      console.log('🔍 Verified followers link clicked from hover card');
      setTimeout(() => followFromList(), 2000);
    } else {
      console.log('❌ Verified followers link not found or not visible');
    }
  }

  function openHoverCardAndClickVerified() {
    const userLinks = document.querySelectorAll(`a[href="/${username}"]`);
    for (const link of userLinks) {
      if (link.offsetParent !== null) {
        simulateHover(link);
        console.log('✅ Hover card trigger attempted');
        setTimeout(clickVerifiedFollowersLink, 1500);
        return;
      }
    }
    console.log('❌ Could not find visible user link');
  }

  function followFromList() {
    const cells = Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"]'));
    if (cells.length === 0) {
      console.log('❌ No user cells found');
      return clickBackOnce();
    }

    function processNext() {
      if (checkedCount >= maxChecks || checkedCount >= cells.length) {
        console.log(`✅ Done. Checked ${checkedCount}, followed ${followedCount}`);
        return clickBackOnce();
      }

      const cell = cells[checkedCount];
      const rect = cell.getBoundingClientRect();
      const scrollY = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top: scrollY, behavior: 'smooth' });

      const followBtn = cell.querySelector('button[aria-label^="Follow"]');
      if (followBtn && followBtn.offsetParent !== null) {
        const label = followBtn.getAttribute('aria-label');
        const cellUsername = label.match(/@[\w]+/)?.[0] || '';
        const currentUser = document.querySelector('button[data-testid="SideNav_AccountSwitcher_Button"] div[data-testid^="UserAvatar-Container-"]')?.getAttribute('data-testid')?.replace('UserAvatar-Container-', '').toLowerCase();

        if (cellUsername.toLowerCase() === `@${currentUser}`) {
          console.log(`🙅 Skipped self: ${cellUsername}`);
        } else if (label.includes('Following') || label.includes('Blocked')) {
          console.log(`🚫 Skipped: ${label}`);
        } else if (label.includes('Follow back') || label.startsWith('Follow @')) {
          followBtn.click();
          followedCount++;
          console.log(`👤 Followed: ${label}`);
        } else {
          console.log(`⚠️ Skipped button: ${label}`);
        }
      } else {
        console.log('🚫 No followable button in cell');
      }

      checkedCount++;
      setTimeout(processNext, 1000);
    }

    processNext();
  }

  function clickBackOnce() {
    const backBtn = document.querySelector('button[data-testid="app-bar-back"]');
    if (backBtn) {
      backBtn.click();
      console.log('🔙 Back click — returned to home');
    } else {
      console.log('❌ Back button not found');
    }
  }

  setTimeout(openHoverCardAndClickVerified, 1000);
})();
