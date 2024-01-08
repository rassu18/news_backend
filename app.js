const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Define an object with arrays of RSS feed URLs for different categories
const RSS_FEEDS = {
  international: ['https://www.thehindu.com/news/international/feeder/default.rss'],
  national: [
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
  ],
  business: ['https://www.thehindu.com/business/feeder/default.rss'],
  // Add more categories and feed URLs as needed
};

// Enable CORS for all routes
app.use(cors());

app.get('/news/:category', async (req, res) => {
  const category = req.params.category.toLowerCase();

  try {
    if (!(category in RSS_FEEDS)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Fetch news from all RSS feeds for the specified category
    const allNews = await Promise.all(
      RSS_FEEDS[category].map(async feedUrl => {
        const response = await axios.get(feedUrl);
        const xmlData = response.data;

        // Parse XML to JSON
        const jsonData = await xml2js.parseStringPromise(xmlData, { explicitArray: false });

        // Extract relevant information, including images
        return jsonData.rss.channel.item.slice(0, 10).map(item => {
          const image =
            item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url
              ? item['media:content']['$'].url
              : null;

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

    // Merge news from different providers into a single array
    const newsList = allNews.flat();

    // Format the data
    const formattedData = { category: category, news: newsList };

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
