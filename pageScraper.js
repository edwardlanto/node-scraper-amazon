const scraperObject = {
  url:
    "https://www.amazon.ca/b/?_encoding=UTF8&node=6646928011&bbn=2206275011&ref_=Oct_s9_apbd_odnav_hd_bw_b2QVmV9_0&pf_rd_r=93MDVBSQ6G1NXBMGGH8M&pf_rd_p=e06c3dcb-a950-537a-a8b3-c08632afe364&pf_rd_s=merchandised-search-10&pf_rd_t=BROWSE&pf_rd_i=2224025011",
  async scraper(browser) {
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    // Navigate to the selected page
    await page.goto(this.url, {
      waitUntil: "networkidle0",
    });
    // page.click('a[href="/gp/browse.html?node=2206275011&amp;ref_=nav_cs_home"]');
    await page.waitForSelector(".a-unordered-list");
    let urls = await page.$$eval(".a-list-item > .a-section", (links) => {
      // Extract the links from the data
      links = links.map((el) => el.querySelector("a").href);
      return links;
    });

    // Loop through each of those links, open a new page instance and get the relevant data from them
    let pagePromise = (link) =>
      new Promise(async (resolve, reject) => {
        let dataObj = {};
        let newPage = await browser.newPage();
        await newPage.goto(link, {
          waitUntil: "networkidle0",
        });

        dataObj["title"] = await newPage.$eval("#productTitle", (text) =>
          text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "")
        );
        dataObj["brand"] = await newPage.$eval(
          "#bylineInfo",
          (text) => text.textContent
        );
        dataObj["rating"] = await newPage.$eval(
          "span[class='a-icon-alt']",
          (text) => text.textContent.trim()
        );

        await newPage.waitForSelector('#centerCol');
          let urls = await newPage.$$eval('#feature-bullets li', links => {
            links = links.map(el => el.querySelector('span').textContent)
            return links;
        });

        dataObj['description'] = urls;
        resolve(dataObj);
        await newPage.close();
      });

    for (link in urls) {
      let currentPageData = await pagePromise(urls[link]);
      // scrapedData.push(currentPageData);
      console.log(currentPageData);
    }
  },
};

module.exports = scraperObject;
