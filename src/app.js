import express from 'express';
import helmet from 'helmet';
import router from './routes/user.routes.js';

const app = express();

app.use(express.json());
app.use(helmet());


app.use('/api/user', router);


export default app;