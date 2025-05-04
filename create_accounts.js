const puppeteer = require("puppeteer");

(async () => {
  const start = parseInt(process.env.START_INDEX || "0", 10);
  const max = 0xFFFFFFFF; // up to 4,294,967,295

  console.log(`🚀 Starting account creation from index ${start} to ${max}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (let i = start; i <= max; i++) {
    const email = `${i}@qrlfoundation.org`;

    try {
      console.log(`🌐 Navigating to signup page for ${email}`);
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
    } catch (err) {
      console.error(`❌ Error for ${email}: ${err.message}`);
    }
  }

  await browser.close();
  console.log("🎉 All done!");
})();
