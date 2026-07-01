const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  try {
    await page.goto('http://localhost:5173/saifi', { waitUntil: 'networkidle0', timeout: 5000 });
  } catch (e) {
    console.log('Timeout or error navigating:', e.toString());
  }
  
  await browser.close();
})();
