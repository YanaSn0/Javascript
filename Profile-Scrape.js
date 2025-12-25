(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function getCells() {
    return Array.from(document.querySelectorAll('button[data-testid="UserCell"]'));
  }

  async function scrapeProfileFromCell(cell) {
    const link = cell.querySelector('a[href^="/"][role="link"]');
    if (!link) {
      console.log("❌ No profile link found in cell");
      return null;
    }

    const username = link.getAttribute("href").replace(/^\//, "").split("/")[0];
    console.log("➡️ Clicking profile:", username);

    // Click into profile
    link.click();
    await sleep(1200);

    // Wait for profile header
    let tries = 0;
    while (!document.querySelector('div[data-testid="UserName"]') && tries < 60) {
      await sleep(150);
      tries++;
    }

    // ----- Core fields -----
    const displayName =
      document.querySelector('div[data-testid="UserName"] span')?.innerText?.trim() || "";

    const bio =
      document.querySelector('[data-testid="UserDescription"]')?.innerText?.trim() || "";

    // Posts (e.g. "2,565 posts")
    const posts =
      [...document.querySelectorAll("div.css-146c3p1, span.css-146c3p1")]
        .map(el => el.innerText.trim())
        .find(t => /\d[\d,.\s]*\s+posts/i.test(t)) || "";

    // Following: any link that contains "/following"
    const followingText =
      [...document.querySelectorAll('a[href*="/following"] span')]
        .map(el => el.innerText.trim())
        .find(t => /^\d/.test(t)) || "";

    // Followers: any link whose href contains "followers" (covers /followers, /verified_followers, etc.)
    const followersText =
      [...document.querySelectorAll('a[href*="followers"] span')]
        .map(el => el.innerText.trim())
        .find(t => /^\d/.test(t)) || "";

    const followingNum = parseInt(followingText.replace(/,/g, ""), 10) || 0;
    const followersNum = parseInt(followersText.replace(/,/g, ""), 10) || 0;
    const ratio = followersNum > 0 ? (followingNum / followersNum).toFixed(2) : "N/A";

    // Professional category (e.g. Doctor)
    const category =
      document.querySelector('[data-testid="UserProfessionalCategory"] span')
        ?.innerText?.trim() || "";

    // Joined date (data-testid first, then fallback text search)
    const joined =
      document.querySelector('[data-testid="UserJoinDate"] span')
        ?.innerText?.trim() ||
      [...document.querySelectorAll("span")]
        .map(el => el.innerText.trim())
        .find(t => /^Joined\s/i.test(t)) ||
      "";

    // Avatar
    const avatar =
      document.querySelector('img[src*="profile_images"]')?.src || "";

    // Location (from header items, but excluding Joined / category label)
    const headerSpans =
      [...document.querySelectorAll('[data-testid="UserProfileHeader_Items"] span')];
    const location =
      headerSpans
        .map(el => el.innerText.trim())
        .find(t =>
          t &&
          !/^Joined\s/i.test(t) &&
          t !== category &&
          !t.includes("Doctor") // extra guard against role labels
        ) || "";

    const result = {
      username,
      displayName,
      bio,
      posts,
      following: followingText,
      followers: followersText,
      ratio,
      category,
      joined,
      location,
      avatar
    };

    console.log("📌 SCRAPED PROFILE:", result);

    // Go back
    history.back();
    await sleep(800);

    return result;
  }

  // ----- Example usage: first cell only -----
  const cells = getCells();
  if (!cells.length) {
    console.log("❌ No user cells found on this followers page.");
    return;
  }

  cells[0].style.outline = "2px solid yellow";
  const data = await scrapeProfileFromCell(cells[0]);
  console.log("✅ Done. Data:", data);
})();
