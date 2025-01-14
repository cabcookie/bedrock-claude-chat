import express from 'express';
import serverless from 'serverless-http';
import routes from './routes';
import errorHandler, { RouteNotFound } from './helper/error-handler';

const app = express();
app.use(express.json());

app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('Lamba invoked...');
  console.log('Request:', req.method, req.path);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);

  const allowedOrigins = process.env.CORS_ALLOW_ORIGINS || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigins);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  next();
});

app.use('/v2/', routes);

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  throw new RouteNotFound();
});

app.use(errorHandler);

export const handler = serverless(app);
