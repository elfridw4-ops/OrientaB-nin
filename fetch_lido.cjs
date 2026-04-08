const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('api') && response.request().method() === 'GET') {
        try {
          const text = await response.text();
          if (text.includes('université') || text.includes('filiere') || text.length > 1000) {
             console.log("API URL:", url);
             console.log("Data snippet:", text.substring(0, 500));
          }
        } catch (e) {}
      }
    });

    await page.goto('https://sheets.lido.app/sheet?lidoFileId=3798932f-800c-42cd-af30-942011e37cb6', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  } catch (e) {
    console.error("Puppeteer error:", e);
  }
})();
