const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

const RSS_FEEDS = {
  international: ['https://www.thehindu.com/news/international/feeder/default.rss'],
  national: [
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    'https://feeds.feedburner.com/ndtvnews-latest',
  ],
  business: [
    'https://www.thehindu.com/business/feeder/default.rss',
    'https://feeds.feedburner.com/ndtvprofit-latest',
],
entertainment: [
  'https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml',
  'https://feeds.feedburner.com/ndtvmovies-latest',
],
health: [
  'https://feeds.feedburner.com/ndtvcooks-latest',
],
science: [
    'https://www.thehindu.com/sci-tech/science/feeder/default.rss',
],
tech:[
  'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml',
  'https://feeds.feedburner.com/gadgets360-latest',
],
sport:[
  'https://feeds.feedburner.com/ndtvsports-latest',
  'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml',
],



  // Add more categories and feed URLs as needed
};

app.use(cors());

app.get('/news/:category', async (req, res) => {
  const category = req.params.category.toLowerCase();

  try {
    if (!(category in RSS_FEEDS)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const allNews = await Promise.all(
      RSS_FEEDS[category].map(async feedUrl => {
        const response = await axios.get(feedUrl);
        const xmlData = response.data;
        const jsonData = await xml2js.parseStringPromise(xmlData, { explicitArray: false });

        return jsonData.rss.channel.item
          .slice(0, 6)
          .filter(item => {
            const image =
              item['media:content'] &&
              item['media:content']['$'] &&
              item['media:content']['$'].url;
            return image !== undefined && image !== null;
          })
          .map(item => {
            const image =
              item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url;

            return {
              title: item.title,
              link: item.link,
              published: item.pubDate,
              summary: item.description,
              image: image,
            };
          });
      })
    );

    const newsList = allNews.flat();

    // Ensure the count is at least 18 and maximum 30 items
    const itemCount = Math.min(Math.max(18, newsList.length), 30);
    const trimmedNewsList = newsList.slice(0, itemCount);

    const formattedData = { category: category, news: trimmedNewsList };

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
