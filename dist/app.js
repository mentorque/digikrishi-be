import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import authRoutes from './routes/auth.routes.js';
import farmerRoutes from './routes/farmer.routes.js';
import searchRoutes from './routes/search.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import csvRoutes from './routes/csv.routes.js';
import { csvQueue } from './queues/csvQueue.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { env } from './config/env.js';
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
    queues: [new BullMQAdapter(csvQueue)],
    serverAdapter,
});
const app = express();
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.get('/health', async (_req, res) => {
    const status = {
        status: 'ok',
        db: 'unknown',
        redis: 'unknown',
        elasticsearch: 'unknown',
    };
    try {
        const { sequelize } = await import('./models/index.js');
        await sequelize.authenticate();
        status.db = 'connected';
    }
    catch {
        status.db = 'disconnected';
    }
    try {
        const { redis } = await import('./config/redis.js');
        await redis.ping();
        status.redis = 'connected';
    }
    catch {
        status.redis = 'disconnected';
    }
    try {
        const { elasticsearchClient } = await import('./config/elasticsearch.js');
        await elasticsearchClient.ping();
        status.elasticsearch = 'connected';
    }
    catch {
        status.elasticsearch = 'disconnected';
    }
    res.json(status);
});
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/csv', csvRoutes);
app.use('/admin/queues', serverAdapter.getRouter());
app.use(errorMiddleware);
export default app;
//# sourceMappingURL=app.js.map