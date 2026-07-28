# Nodoto

An unnecessary big dependency chain template for NodeJS with the most bloated libraries that you mostly don't use — but you can make it one line without even needing to touch the `package.json`. Super extensible, super customizable, but super bloat :))

__shh you don't even need it...__

## Features

- **TypeSafe Express**: Express with TypeScript support
- **Auto CORS**: Pre-configured Cross-Origin Resource Sharing
- **Auto Body Parser**: Built-in request body parsing for JSON and URL-encoded data
- **Authentication**: Multiple strategy support using Passport.js
- **Authorization**: Flexible role-based access control
- **Database**: Support for multiple database strategies
- **File Upload**: Easy file handling with Multer integration
- **Session Management**: Secure session handling with express-session
- **Validation**: Request validation using Joi
- **Threading**: Multi-threading support scaling your app
- **Error Handling**: Centralized error handling using Express-Error-Handler
- **Swagger**: API documentation with Swagger
- **Health Check**: Built-in health check route for monitoring and debugging
- **Logger**: Customizable logger with different log levels

## Installation

```bash
npm install nodoto
```

## Quick Start (Not really quick actually lol!)

```javascript
import { HTTPServer } from '../../httpServer/HTTPServer';
import { RequestType } from '../../httpServer/request/RequestType';
import Middlewares from '../../httpServer/routing/Middleware';
import Route from '../../httpServer/routing/Route';
import Utils from '../../utils/utils';
import { logger } from '../../utils/winston';

// Initialize utils
Utils.init();

// Initialize HTTP server
HTTPServer.init({
    port: 3000,
    timeout: 5000, // 5 seconds timeout
    // cors: {
    //     enabled: true,
    //     origin: '*'
    // },
    logLevel: 'debug'
});
const server = HTTPServer.getInstance();

// Create a simple Hello World route
const helloRoute = new Route('/', RequestType.GET)
.route(Middlewares.timeout())
.route(async (req, res) => {
    logger.info('[Example] Processing request with 10 second delay');
    await Utils.sleep(10000); // Simulate some work
    res.status(200).json({ // This never gets called
        message: 'Hello, World! Welcome to nodoto server.',
        timestamp: Date.now()
    });
    return true; // Must return true to continue the chain
});

// Add route to server
server.addRoute(helloRoute);

// Start the server
server.start()
```

## Scripts

- `npm start`: Start the production server
- `npm run dev`: Start development server with hot reload
- `npm test`: Run tests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## TODO List

### Side Features
- [x] Event based request monitoring
- [x] Custom response wrapper to control flow.

### Core Framework Features
- [ ] TypeSafe Express Integration
  - [x] Create base Express app with TypeScript configuration
  - [x] Set up type definitions for request and response objects
  - [x] Implement type-safe middleware pipeline
  - [ ] Add type-safe route parameters and query string handling
  - [ ] Create type-safe request body validation

- [x] CORS Configuration
  - [x] Implement default CORS settings
  - [x] Add configurable CORS options per route
  - [x] Create CORS policy presets (development, production)
  - [x] Add documentation for custom CORS configuration

- [x] Request Body Parser
  - [x] Implement JSON parser
  - [x] Add URL-encoded data parser
  - [x] Create multipart form data parser
  - [x] Add raw body parser for webhooks

### Security Features
- [ ] Authentication System
  - [ ] Set up Passport.js integration
  - [ ] Implement JWT authentication strategy
  - [ ] Add OAuth2 support (Google, GitHub)
  - [ ] Create local authentication strategy
  - [ ] Add session-based authentication
  - [ ] Implement refresh token mechanism

- [-] Authorization Framework
  - [x] Create role-based access control (RBAC)
  - [x] Implement permission-based authorization
  - [x] Add route-level authorization middleware
  - [x] Create resource-level access control
  - [x] Add role hierarchy support

### Data Management
- [-] Database Integration
  - [x] Create database connection manager
  - [ ] Implement MongoDB support
  - [ ] Add PostgreSQL integration
  - [x] Create Redis cache layer
  - [ ] Implement connection pooling
  - [ ] Add database migration system

- [-] File Upload System
  - [x] Set up Multer integration
  - [x] Implement file size and type validation
  - [ ] Add cloud storage support (S3, GCS)
  - [ ] Create file cleanup mechanism
  - [ ] Implement progress tracking

### Session & State Management
- [-] Session Handler
  - [x] Implement express-session integration
  - [ ] Add Redis session store
  - [ ] Create session cleanup mechanism
  - [x] Implement session security measures
  - [ ] Add session analytics

### Validation & Error Handling
- [-] Request Validation
  - [x] Set up Joi validation framework
  - [ ] Create custom validation rules
  - [x] Implement validation middleware
  - [x] Add validation error formatting
  - [ ] Create validation documentation generator

- [-] Error Management
  - [x] Implement global error handler
  - [x] Create custom error classes
  - [x] Add error logging mechanism
  - [x] Implement error response formatting
  - [x] Add development/production error modes

### Performance & Scaling
- [-] Threading Support
  - [x] Implement worker threads
  - [x] Create thread pool manager
  - [ ] Add task queue system
  - [x] Implement thread communication
  - [x] Add thread monitoring

### Templates (Prebuilt Servers)
Prebuilt server templates combining multiple modules into ready-to-run examples.
- [x] Echo Server — minimal server that echoes requests back
- [x] Full User Pipeline — register, login (JWT), RBAC, session, validation, error handling
- [x] REST API Server — CRUD resource with validation, error handling, CORS, logging
- [ ] File Upload Server — multipart uploads with size/type validation and file listing
- [ ] Realtime Server — WebSocket-based realtime communication
- [x] Cached API Server — Redis-backed caching layer for API responses
- [ ] Health Check Server — health endpoints with system metrics
- [ ] Auth Gateway — authentication gateway with JWT + session + RBAC
- [x] Rate Limited Server — rate limiting + request validation + error handling
- [x] Worker Thread Server — CPU-bound task offloading via worker threads
- [ ] Swagger Documented Server — full API with auto-generated Swagger docs
- [x] Microservice Starter — minimal service with health check, logging, and error handling
- [ ] Session-Based App — express-session + Redis store + auth middleware
- [ ] Multi-Database Server — Redis cache + MongoDB/PostgreSQL persistence
- [ ] Full-Stack Starter — everything combined: auth, RBAC, validation, upload, sessions, logging, docs

### Documentation & Monitoring
- [-] Swagger Documentation
  - [x] Set up Swagger UI
  - [x] Implement automatic route documentation
  - [ ] Add schema documentation
  - [ ] Create API versioning system
  - [ ] Implement documentation testing

- [ ] Health Monitoring
  - [ ] Create health check endpoints
  - [ ] Implement system metrics collection
  - [ ] Add performance monitoring
  - [ ] Create status dashboard
  - [ ] Implement alerting system

### Logging System
- [ ] Advanced Logging
  - [x] Set up Winston configuration
  - [x] Implement log rotation
  - [x] Add log levels and filters
  - [x] Create log transport system
  - [-] Implement log analysis tools

### Testing & Quality Assurance
- [-] Testing Framework
  - [x] Set up Jest configuration
  - [x] Create unit test templates
  - [ ] Implement integration tests
  - [ ] Add performance testing
  - [ ] Create test documentation

### DevOps & Deployment
- [ ] CI/CD Pipeline
  - [ ] Set up GitHub Actions
  - [ ] Create deployment scripts
  - [ ] Implement version control
  - [ ] Add environment configuration
  - [ ] Create backup system
