const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 920, height: 650 });
  
  await page.goto('file:///root/.openclaw/workspace/grid-fixed.html', {
    waitUntil: 'networkidle0'
  });
  
  await page.screenshot({
    path: '/root/.openclaw/workspace/luksoagent-grid-fixed.png',
    fullPage: true
  });
  
  console.log('Screenshot saved to luksoagent-grid-fixed.png');
  await browser.close();
})();
