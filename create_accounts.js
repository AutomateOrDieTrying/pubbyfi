const puppeteer = require("puppeteer");
const fs = require("fs");

const delay = ms => new Promise(res => setTimeout(res, ms));
const MAX_RETRIES = 3;

(async () => {
  const start = parseInt(process.env.START_INDEX || "0", 10);
  const max = 0xFFFFFFFF;

  console.log(`🚀 Starting account creation from index ${start} to ${max}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (let i = start; i <= max; i++) {
    const email = `${i}@qrlfoundation.org`;

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
      try {
        console.log(`🌐 Navigating to signup page for ${email} (Attempt ${attempt})`);
        await page.goto("https://account.pubby.co/start-free", {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });

        await page.waitForSelector("#firstName", { timeout: 10000 });
        console.log(`🧾 Filling in form for ${email}`);

        await page.type("#firstName", email);
        await page.type("#email", email);
        await page.type("#password", email);

        console.log(`🕹️ Submitting form for ${email}`);
        await Promise.all([
          page.click("#createButton"),
          page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => null),
        ]);

        console.log(`✅ Successfully created: ${email}`);
        success = true;

        // Optional: wait 1–3 seconds before next iteration
        await delay(1000 + Math.floor(Math.random() * 2000));
      } catch (err) {
        console.error(`❌ Error for ${email} (Attempt ${attempt}): ${err.message}`);

        // Optionally write page HTML to debug
        try {
          const html = await page.content();
          fs.writeFileSync(`debug-${i}-attempt${attempt}.html`, html);
        } catch (_) {}

        if (attempt === MAX_RETRIES) {
          console.error(`💥 Giving up on ${email} after ${MAX_RETRIES} attempts`);
        } else {
          await delay(2000); // wait before retrying
        }
      }
    }
  }

  await browser.close();
  console.log("🎉 Finished all iterations.");
})();
