import { Client, Users } from 'node-appwrite';

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const users = new Users(client);

  const API_KEY = process.env.KLIPY_API_KEY;
  const BASE = 'https://api.klipy.com/api/v1';
  

  // use both body and query params for flexibility for GET and POST requests
  const searchQuery = req.body?.query || req.query?.query || '';
  const contentFilter = req.body?.contentFilter || req.query?.contentFilter || 'off';
  const nextPage = req.body?.page || req.query?.page || 1;

  let endpoint;
  if (searchQuery) {
    endpoint = `${BASE}/${API_KEY}/gifs/search?q=${encodeURIComponent(searchQuery)}&content_filter=${contentFilter}&per_page=50&page=${nextPage}`;
  } else {
    endpoint = `${BASE}/${API_KEY}/gifs/trending?per_page=50`;
  }

  try {
    const response = await fetch(endpoint);
    const result = await response.json();

    log(`Fetched GIFs from: ${endpoint}`);
    return res.json(result);
  } catch (err) {
    error(`Error fetching GIFs: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};
