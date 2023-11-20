import express from 'express';
import serverless from 'serverless-http';
import { getCurrentUser } from './helper/auth';
import routes from './routes';

const app = express();
app.use(express.json());

app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('Lamba invoked...');
  console.log('Request:', req.method, req.path);
  console.log('Request body:', req.body);
  console.log('Request query:', req.query);
  console.log('Request params:', req.params);
  console.log('Request headers:', req.headers);

  // Log authorization token
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Authorization token:', token);

  const result = await getCurrentUser(token || '');
  console.log('Current user:', result);

  const allowedOrigins = process.env.CORS_ALLOW_ORIGINS || '*';
  const { TABLE_NAME, USER_POOL_ID, CLIENT_ID, ACCOUNT, REGION, BEDROCK_REGION, TABLE_ACCESS_ROLE_ARN } = process.env;
  console.log('Environment variables:', { TABLE_NAME, USER_POOL_ID, CLIENT_ID, ACCOUNT, REGION, BEDROCK_REGION, TABLE_ACCESS_ROLE_ARN, allowedOrigins });
  res.header('Access-Control-Allow-Origin', allowedOrigins);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  next();
});

app.use('/v2/', routes);

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(404).send('Not Found');
});
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || 500).send(err.message);
});

export const handler = serverless(app);