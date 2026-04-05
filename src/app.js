import express from 'express';
import helmet from 'helmet';
import router from './routes/user.routes.js';
import mongoSanitizeMiddleware from './middleware/sanitize.middleware.js';
import limiter from './middleware/rate-limiter.middleware.js';
import errorHandler from './middleware/errorHandler.middleware.js';

const app = express();

app.use(express.json());
app.use(helmet());
app.use(mongoSanitizeMiddleware);

app.use('/api', limiter);

app.use('/api/user', router);
app.use('/uploads', express.static('uploads'));

app.use(errorHandler);

export default app;