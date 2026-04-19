// One-off script to generate a placeholder Open Graph image at
// public/etl-images/og-cover.jpg (1200x630). Run with: node scripts/make-og-cover.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const logoPath = path.join(__dirname, "..", "public", "etl-images", "etl-logo.png");
const outPath = path.join(__dirname, "..", "public", "etl-images", "og-cover.jpg");

const W = 1200;
const H = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#0e264a"/>
      <stop offset="55%" stop-color="#1a3c6e"/>
      <stop offset="100%" stop-color="#2d5fa3"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#c8860a"/>
      <stop offset="100%" stop-color="#e6a830"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- decorative diagonal stripe -->
  <polygon points="0,540 1200,300 1200,630 0,630" fill="#000" opacity="0.18"/>
  <rect x="0" y="600" width="${W}" height="6" fill="url(#accent)"/>

  <!-- Company name (two lines so it fits) -->
  <text x="290" y="220"
        font-family="Barlow Condensed, Arial Narrow, Arial, sans-serif"
        font-size="72" font-weight="900" fill="#ffffff" letter-spacing="1">
    ENGINEERING
  </text>
  <text x="290" y="295"
        font-family="Barlow Condensed, Arial Narrow, Arial, sans-serif"
        font-size="72" font-weight="900" fill="#ffffff" letter-spacing="1">
    TRADE LINKS
  </text>
  <text x="290" y="340"
        font-family="Arial, sans-serif"
        font-size="22" font-weight="700" fill="#e6a830" letter-spacing="5">
    CO. LTD &#8212; UGANDA
  </text>

  <!-- Tagline -->
  <text x="290" y="410"
        font-family="Arial, sans-serif"
        font-size="26" font-weight="600" fill="#cfe3f0">
    Quality at Service &#8212; Construction, Civil &amp; Procurement
  </text>
  <text x="290" y="445"
        font-family="Arial, sans-serif"
        font-size="20" fill="#a9c6dc">
    Serving Uganda &amp; East Africa since 2006
  </text>

  <!-- URL badge -->
  <rect x="290" y="495" width="220" height="40" rx="20" fill="#ffffff" opacity="0.12"/>
  <text x="400" y="522" text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="17" font-weight="700" fill="#ffffff" letter-spacing="2">
    ETLUGANDA.COM
  </text>
</svg>
`;

(async () => {
  // Prepare logo: resize, then remove near-white background so it blends into the dark card.
  // Uses linear() to approximate a "multiply over dark bg" — replaces pure white with transparency.
  const raw = await sharp(logoPath)
    .resize(200, 200, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = raw;
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // if pixel is near-white, make it transparent
    if (r > 235 && g > 235 && b > 235) {
      data[i + 3] = 0;
    }
  }

  const logoBuf = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();

  await sharp(Buffer.from(svg))
    .composite([{ input: logoBuf, left: 65, top: 215 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outPath);

  console.log("Wrote:", outPath);
})();
