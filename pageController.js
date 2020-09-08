const pageScraper = require('./pageScraper');
const fs = require('fs');
async function scrapeAll(browserInstance){
    let browser;
    try{
        browser = await browserInstance;
        let scrapedData = {};
        // Call the scraper for different set of books to be scraped
        scrapedData['Travel'] = await pageScraper.scraper(browser, 'Travel');
        
        fs.writeFile("data.json", JSON.stringify(scrapedData), 'utf8', function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The data has been scraped and saved successfully! View it at './data.json'");
        });
        await browser.close();
    }
    catch(err){
        console.log("Could not resolve the browser instance => ", err);
    }
}

module.exports = (browserInstance) => scrapeAll(browserInstance)