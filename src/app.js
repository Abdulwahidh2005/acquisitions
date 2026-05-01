import express from 'express';
import logger from './configs/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);
app.use(securityMiddleware);

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions API!');
  res.status(200).send('Hello, World!');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  void next;
  logger.error(err.message, { stack: err.stack });
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Internal server error' });
});

export default app;
