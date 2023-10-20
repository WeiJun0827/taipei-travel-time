import express from 'express';
import 'reflect-metadata';

import travelTime from './routes/travelTime.js';
import user from './routes/user.js';
import ErrorWithStatusCode from './util/error.js';

import { PORT, API_VERSION } from './config.js';

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
  if (err instanceof ErrorWithStatusCode) {
    const { statusCode, message } = err;
    if (message) {
      res.status(statusCode).json({ errorMsg: message });
      return;
    }
  } else {
    console.error(err);
  }
  res.sendStatus(err.statusCode || 500);
});

app.listen(PORT, () => { console.log(`Listening on port ${PORT}`); });

export default app;
