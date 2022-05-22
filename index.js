import express from 'express';

import travelTime from './server/routes/travelTime.js';
import user from './server/routes/user.js';

import { PORT, API_VERSION } from './server/config.js';

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use(`/api/${API_VERSION}`, [
  travelTime,
  user,
]);

// Page not found
app.use((req, res, next) => {
  res.status(404).sendFile(`${__dirname}/public/404.html`);
});

// Error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => { console.log(`Listening on port: ${PORT}`); });

export default app;
