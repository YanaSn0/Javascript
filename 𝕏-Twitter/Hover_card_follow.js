(function () {
  'use strict';

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

  function clickFollowButton() {
    const followBtn = document.querySelector('button[aria-label="Follow @YanaSnow1"]');
    if (followBtn && followBtn.offsetParent !== null) {
      followBtn.click();
      console.log('✅ Follow button clicked');

      // Close the hover card after a short delay
      setTimeout(() => {
        const userLink = document.querySelector('a[href="/YanaSnow1"]');
        if (userLink) simulateUnhover(userLink);
      }, 500);
    } else {
      console.log('❌ Follow button not found or not visible');
    }
  }

  function openHoverCardAndFollow() {
    const userLinks = document.querySelectorAll('a[href="/YanaSnow1"]');
    for (const link of userLinks) {
      if (link.offsetParent !== null) {
        simulateHover(link);
        console.log('✅ Hover card trigger attempted');

        // Wait for hover card to render before clicking follow
        setTimeout(clickFollowButton, 1500);
        return;
      }
    }
    console.log('❌ Could not find visible user link');
  }

  setTimeout(openHoverCardAndFollow, 1000);
})();
