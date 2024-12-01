# Nodoto Hello World Example

This is a simple Hello World example using the nodoto HTTP server framework. It demonstrates basic server setup, routing, and request monitoring.

## Features
- Basic HTTP server setup
- Simple GET route
- Request timeout monitoring
- CORS configuration
- Error handling

## Running the Example

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

3. Visit http://localhost:3000 in your browser

You should see "Hello, World! Welcome to nodoto server."

## Configuration
The server is configured with:
- Port: 3000
- Timeout: 5 seconds
- CORS: Enabled for all origins

## Monitoring
The example includes request timeout monitoring. If any request takes longer than 5 seconds, it will be automatically terminated and logged.
