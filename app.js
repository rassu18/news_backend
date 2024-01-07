const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;

const NEWS_FEED_URL = 'https://www.thehindu.com/sport/feeder/default.rss';

app.get('/news', async (req, res) => {
  try {
    // Fetch the RSS feed
    const response = await axios.get(NEWS_FEED_URL);
    const xmlData = response.data;

    // Parse XML to JSON
    const jsonData = await xml2js.parseStringPromise(xmlData, { explicitArray: false });

    // Extract relevant information, including images
    const newsList = jsonData.rss.channel.item.slice(0, 6).map(item => {
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

    // Format the data
    const formattedData = { news: newsList };

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
