const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

const RSS_FEEDS = {
  // Your existing RSS feeds
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
  'https://www.bollywoodhungama.com/rss/news.xml',
  
  'https://www.bollywoodhungama.com/rss/movie-release-date.xml',
  'https://www.bollywoodhungama.com/rss/movie-review.xml',
  'https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml',

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
 topstory:[
   'https://feeds.feedburner.com/ndtvnews-top-stories' 
 ],


hinational: [
  'https://hindi.news18.com/commonfeeds/v1/hin/rss/nation/nation.xml',
  
],
hibusiness: [
  'https://hindi.news18.com/commonfeeds/v1/hin/rss/business/online-business.xml',
 
],
hientertainment: [
'https://hindi.news18.com/commonfeeds/v1/hin/rss/entertainment/entertainment.xml',


],
hihealth: [
'https://hindi.news18.com/commonfeeds/v1/hin/rss/lifestyle/health.xml',
],
hiscience: [
  'https://hindi.news18.com/commonfeeds/v1/hin/rss/business/innovation.xml',
],
hitech:[
'https://hindi.news18.com/commonfeeds/v1/hin/rss/tech/tech.xml',
'https://hindi.news18.com/commonfeeds/v1/hin/rss/tech/apps.xml',
],
hisport:[
'https://hindi.news18.com/commonfeeds/v1/hin/rss/sports/cricket.xml',
'https://hindi.news18.com/commonfeeds/v1/hin/rss/sports/tennis.xml',
'https://hindi.news18.com/commonfeeds/v1/hin/rss/sports/football.xml',
],



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
          .filter(item => {
            // Check if required fields are present
            return (
              item.title &&
              item.link &&
              item.pubDate &&
              item.description &&
              item['media:content'] &&
              item['media:content']['$'] &&
              item['media:content']['$'].url
            );
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
