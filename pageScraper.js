const scraperObject = {
    url: 'http://amazon.ca/',
    async scraper(browser){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        // Navigate to the selected page
        await page.goto(this.url, {
            waitUntil: 'networkidle0',
        });
        page.click('a[href="/gp/browse.html?node=2206275011&amp;ref_=nav_cs_home"]');
        await page.waitForSelector('#zg_col1wrap');
        let urls = await page.$$eval('.zg_homeWidget > .zg_item', links => {
            // Extract the links from the data
            links = links.map(el => el.querySelector('a').href)
            return links;
        });
        console.log(urls);

    }
}

module.exports = scraperObject;