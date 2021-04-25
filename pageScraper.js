const fs = require("fs");
const fetch = require("node-fetch");
const scraperObject = {
	url:
		"https://www.amazon.ca/b/?_encoding=UTF8&node=6646928011&bbn=2206275011&ref_=Oct_s9_apbd_odnav_hd_bw_b2QVmV9_0&pf_rd_r=93MDVBSQ6G1NXBMGGH8M&pf_rd_p=e06c3dcb-a950-537a-a8b3-c08632afe364&pf_rd_s=merchandised-search-10&pf_rd_t=BROWSE&pf_rd_i=2224025011",
	async scraper(browser) {
		let page = await browser.newPage();
		let scrapedDataArr = [];
		console.log(`Navigating to ${this.url}...`);

		// Navigate to the selected page
		await page.goto(this.url, {
			waitUntil: "networkidle0",
		});

		await page.waitForSelector(".a-unordered-list");
		let urls = await page.$$eval(".a-list-item > .a-section", (links) => {
			// Extract the links from the data
			links = links.map((el) => el.querySelector("a").href);
			return links;
		});

		// Loop through each of those links, open a new page instance and get the relevant data from them
		let pagePromise = (link) =>
			new Promise(async (resolve, reject) => {
				// Create object to structure data
				let dataObj = {};
				let newPage = await browser.newPage();
				await newPage.goto(link, {
					// Fix race condition. Wait until DOM has rendered
					waitUntil: "networkidle0",
				});

				dataObj.title = await newPage.$eval("#productTitle", (text) =>
					text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "")
				);

				dataObj.brand = await newPage.$eval(
					"#bylineInfo",
					(text) => text.textContent
				);

				await newPage.waitForSelector("#centerCol");
				let descriptions = await newPage.$$eval(
					"#feature-bullets li",
					(links) => {
						let descriptionArr = [];
						links = links.map((el, i) => {
							descriptionArr.push(
								el
									.querySelector("span")
									.textContent.replace(
										/(\r\n\t|\n|\r|\t)/gm,
										""
									)
									.trim()
							);
						});
						return descriptionArr;
					}
				);

				let imgUrls = await newPage.$$(".imageThumbnail");
				let imgArr = [];

				// Loop through all img thumbnails to get main img
				for (let i = 0; i < imgUrls.length; i++) {
					await imgUrls[i].hover();
					await newPage.waitFor(500);
					let img = await newPage.$eval(".selected img", (img) => {
						return img.getAttribute("src");
					});
					imgArr.push(img);
				}

				dataObj.descriptions = descriptions;
				dataObj.imgURls = imgArr;
				resolve(dataObj);
				await newPage.close();
			});

		for (link in urls) {
			scrapedDataArr.push(await pagePromise(urls[link]));
			if (scrapedDataArr.length === 5) {
				scrapedDataArr = JSON.stringify(scrapedDataArr);
				fs.writeFile("products.js", scrapedDataArr, (err) => {
					if (err) {
						console.log(err);
					} else {
						console.log("successfully wrote file");
					}
				});
				break;
			}
		}

		const morphedJson = JSON.parse(scrapedDataArr).map((product) => ({
			title: product.title,
			data: product.descriptions.map((description, index) =>
				index === 0 || index % 2 === 0
					? {
							left: {
								type: "image",
								url: !!product.imgURls[index]
									? product.imgURls[index]
									: product.imgURls[0],
							},
							right: {
								type: "points",
								text: [description],
							},
					  }
					: {
							right: {
								type: "image",
								url: !!product.imgURls[index]
									? product.imgURls[index]
									: product.imgURls[0],
							},
							left: {
								type: "points",
								text: [description],
							},
					  }
			),
		}));

		const generationURL =
			process.env.NODE_ENV === "development"
				? "http://localhost:8000"
				: "http://localhost:8000"; // replace with correct url once hosted

		try {
			const allPromises = morphedJson.map(
				async (product) =>
					await fetch(
						`${generationURL}?data=${encodeURI(
							JSON.stringify(product)
						)}`
					)
			);

			`${generationURL}?data=${encodeURI(
				JSON.stringify(morphedJson[0])
			)}`;

			const response = await Promise.all(allPromises);

			console.log(JSON.stringify(response, null, 4));
		} catch (error) {
			console.error(error);
		}
	},
};

module.exports = scraperObject;
