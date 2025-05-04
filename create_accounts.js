const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

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

  for (let i = start; i <= max; i++) {
    const email = `${i}@qrlfoundation.org`;
    let success = false;

    for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
      const page = await browser.newPage();

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

        await delay(1000 + Math.floor(Math.random() * 3000)); // delay to avoid rate-limiting
      } catch (err) {
        const pageTitle = await page.title().catch(() => 'No title');
        console.error(`❌ Error for ${email} (Attempt ${attempt}): ${err.message} | Page title: ${pageTitle}`);

        try {
          const debugDir = path.join(__dirname, 'debug');
          if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

          const html = await page.content();
          fs.writeFileSync(path.join(debugDir, `debug-${i}-attempt${attempt}.html`), html);
          await page.screenshot({
            path: path.join(debugDir, `debug-${i}-attempt${attempt}.png`)
          });
        } catch (e) {
          console.error(`⚠️ Failed to dump debug info: ${e.message}`);
        }

        if (attempt === MAX_RETRIES) {
          console.error(`💥 Giving up on ${email} after ${MAX_RETRIES} attempts`);
        } else {
          await delay(3000);
        }
      }

      // 🚨 Clear session manually
      try {
        const client = await page.target().createCDPSession();
        await client.send('Storage.clearCookies');
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      } catch (e) {
        console.error(`⚠️ Failed to clear session for ${email}: ${e.message}`);
      }

      await page.close();
    }
  }

  await browser.close();
  console.log("🎉 All done!");
})();
