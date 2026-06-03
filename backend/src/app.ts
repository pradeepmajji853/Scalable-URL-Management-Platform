import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import v1Routes from './routes/v1';
import urlController from './controllers/url.controller';
import { errorHandler } from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';
import config from './configs/index';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app: Express = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigins = config.cors.origin.split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.indexOf('*') !== -1) {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true,
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use(requestLogger);

// Swagger Documentation Configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Linkly API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Linkly URL Management Platform',
    },
    servers: [
      {
        url: `${config.app.url}/api/v1`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/v1/*.ts', './src/routes/v1/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base route redirection (GET /r/:shortCode)
// Resolves the short code and performs redirect or returns password check JSON
app.get('/r/:shortCode', urlController.resolveUrl);
app.post('/r/:shortCode/verify-password', urlController.verifyPasswordAndResolve);

// API routes
app.use('/api/v1', v1Routes);

// 404 Route handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler middleware
app.use(errorHandler);

export default app;
