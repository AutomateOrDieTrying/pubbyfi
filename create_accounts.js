const puppeteer = require("puppeteer");

(async () => {
  const start = parseInt(process.env.START_INDEX || "0", 10);
  const max = 0xFFFFFFFF; // 4,294,967,295

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (let i = start; i <= max; i++) {
    const email = `${i}@qrlfoundation.org`;

    try {
      await page.goto("https://account.pubby.co/start-free", {
        waitUntil: "networkidle2",
      });

      // Use the same email as name, email, and password
      await page.type("#firstName", email);
      await page.type("#email", email);
      await page.type("#password", email);

      await Promise.all([
        page.click("#createButton"),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => null),
      ]);

      console.log(`✅ Created account: ${email}`);
    } catch (err) {
      console.error(`❌ Error for ${email}: ${err.message}`);
    }
  }

  await browser.close();
})();
