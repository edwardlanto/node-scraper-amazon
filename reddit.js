const puppeteer = require('puppeteer');
const SUBREDDIT_URL = (reddit) => `https://old.reddit.com/r/${reddit}`;

const self = {
    browser:null,
    pages: null,
    init: async (reddit) => {
        self.browser = await puppeteer.launch({
            headless: false
        });
        self.page = await self.browser.newPage();

        /* Go to the subreddit */

        await self.page.goto(SUBREDDIT_URL(reddit), {waitUntil: 'networkidle0'});
    },

    getResults: async (num) => {
        // console.log("RAN FILE")
        let elements = await self.page.$$('#siteTable .thing');
        let results = [];
        for (let el of elements){
            let title = await el.$eval(('p[class="title"] a'), node =>  node.innerText);
            let rank = await el.$eval(('span[class="rank"]'), node => node.innerText.trim());
            let postTime = await el.$eval(('p[class="tagline "] > time'), node => node.getAttribute('title'));
            // let authUrl = await el.$eval(('p[class="tagline "] > a[class+="author"]'), node => node.getAttribute('title'));
            // let comments = await el.$eval(('a[data-event-action="comments"]'), node => node.innerText.trim());
            results.push(
                {
                 title,
                 rank
                }
             );
             console.log(title);  
        }

        
    },
}

module.exports = {
    self
}