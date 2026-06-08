/* BRITCH seed data — Sarah Creates × Glow Labs Beauty
   All "why this rate" math resolves cleanly:
   reach × (CPM / 1000) × format multiplier = base → rounded to target. */
window.BRITCH = {
  brand: { name: "Glow Labs Beauty", note: "Spring 2026 — Skincare Launch" },
  creator: {
    name: "Sarah Creates",
    tagline: "Lifestyle storytelling that actually converts.",
    niches: ["Lifestyle", "Travel", "Fashion"],
    available: true,
    responds: "Replies within 24h",
    location: "Brooklyn, NY",
  },
  platforms: [
    {
      key: "tiktok", label: "TikTok", handle: "@sarah_creates",
      followers: "500K", followersNum: 500000,
      engagement: "4.5%", reach: "150K", reachNum: 150000,
      cpm: 8,
    },
    {
      key: "instagram", label: "Instagram", handle: "@sarah.creates",
      followers: "245K", followersNum: 245000,
      engagement: "3.8%", reach: "70K", reachNum: 70000,
      cpm: 12,
    },
  ],
  audience: {
    source: "Instagram",
    gender: [
      { label: "Female", pct: 64 },
      { label: "Male", pct: 32 },
      { label: "Other", pct: 4 },
    ],
    age: [
      { label: "18–24", pct: 38 },
      { label: "25–34", pct: 42 },
      { label: "35–44", pct: 14 },
      { label: "45+", pct: 6 },
    ],
    countries: [
      { label: "United States", code: "US", pct: 45 },
      { label: "United Kingdom", code: "UK", pct: 18 },
      { label: "Canada", code: "CA", pct: 12 },
      { label: "Australia", code: "AU", pct: 8 },
    ],
  },
  scope: [
    { k: "Turnaround", v: "7–10 days" },
    { k: "Revisions", v: "1 round included" },
    { k: "Concepting", v: "Brief → 2 directions" },
    { k: "Exclusivity", v: "30-day category" },
    { k: "Reporting", v: "48h post-recap" },
    { k: "Approvals", v: "Pre-post review" },
  ],
  // format multiplier reflects effort/value of the format
  rates: [
    {
      id: "tt-video", platform: "tiktok", name: "Video Post",
      desc: "Concept → shoot → edit, 1 in-feed TikTok video.",
      price: 1200, floor: 1050,
      reach: "150K", reachNum: 150000, cpm: 8, mult: 1.0,
    },
    {
      id: "tt-story", platform: "tiktok", name: "Story / Slide",
      desc: "Single TikTok Story slide with link sticker.",
      price: 400, floor: 350,
      reach: "83K", reachNum: 83000, cpm: 8, mult: 0.6,
    },
    {
      id: "tt-live", platform: "tiktok", name: "Live Stream",
      desc: "60-min hosted TikTok Live with product demo.",
      price: 2500, floor: 2200,
      reach: "130K", reachNum: 130000, cpm: 8, mult: 2.4,
    },
    {
      id: "ig-reel", platform: "instagram", name: "Reel",
      desc: "Vertical Reel, on-grid, with caption + CTA.",
      price: 900, floor: 790,
      reach: "70K", reachNum: 70000, cpm: 12, mult: 1.0,
    },
    {
      id: "ig-carousel", platform: "instagram", name: "Carousel",
      desc: "Up to 10-frame in-feed carousel, designed.",
      price: 750, floor: 660,
      reach: "62.5K", reachNum: 62500, cpm: 12, mult: 1.0,
    },
    {
      id: "ig-story", platform: "instagram", name: "Story (3 frames)",
      desc: "3-frame IG Story sequence with link + poll.",
      price: 350, floor: 310,
      reach: "48K", reachNum: 48000, cpm: 12, mult: 0.6,
    },
  ],
  bundles: [
    {
      id: "b-reelstory", name: "Reel + Story", platform: "instagram",
      items: ["ig-reel", "ig-story"], list: 1250, price: 1100,
      blurb: "The everyday launch combo — one hero Reel, one Story push.",
    },
    {
      id: "b-cross", name: "Cross-Platform Takeover", platform: "both",
      items: ["tt-live", "ig-reel"], list: 3400, price: 2800,
      blurb: "TikTok Live demo + IG Reel recap. Maximum reach, both feeds.",
    },
  ],
  addons: [
    { id: "usage", name: "Usage Rights", desc: "90-day paid media usage", price: 300 },
    { id: "whitelist", name: "Whitelisting", desc: "Spark / Partnership ad access", price: 200 },
    { id: "rush", name: "Rush Delivery", desc: "Live in 72 hours", price: 150 },
  ],
  cpmByPlatform: { tiktok: 8, instagram: 12 },
};
