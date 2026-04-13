import express from 'express';
import helmet from 'helmet';
import router from './routes/user.routes.js';
import mongoSanitizeMiddleware from './middleware/sanitize.middleware.js';
import limiter from './middleware/rate-limiter.middleware.js';
import errorHandler from './middleware/errorHandler.middleware.js';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleLogger.js';

const app = express();

app.use(express.json());

morganBody(app, {
  noColors: true,
  skip: (req, res) => res.statusCode < 400, 
  stream: loggerStream
});

app.use(helmet());
app.use(mongoSanitizeMiddleware);

app.use('/api', limiter);

app.use('/api/user', router);
app.use('/uploads', express.static('uploads'));

app.use(errorHandler);

export default app;