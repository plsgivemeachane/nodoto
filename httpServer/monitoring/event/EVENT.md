# Event Management System

The Event Management System is a core component of the HTTP server monitoring infrastructure. It provides a structured way to handle and track various events that occur during request processing.

## Core Components

### Base Event Class
The `Event` class serves as the foundation for all event types in the system. It provides:
- Event name identification
- Timestamp tracking
- Custom data storage capability

```typescript
class Event {
    name: string
    timestamp: number
    data?: any
}
```

### RequestEvent Interface
The `RequestEvent` interface defines the structure for HTTP request-related events:
```typescript
interface RequestEvent {
    request: NRequest;    // The wrapped HTTP request
    timestamp: number;    // When the event occurred
    event: Event;        // Reference to the event instance
}
```

## Event Types

### 1. InteruptEvent
Triggered when a request is interrupted during processing.
```typescript
class InteruptEvent extends Event {
    name: string = 'request:interupt'
    // Used when a request processing is interrupted with a specific reason
}
```

### 2. RequestFinishEvent
Signals the completion of request processing.
```typescript
class RequestFinishEvent extends Event {
    name: string = 'request_finish'
    // Fired when a request has been fully processed
}
```

### 3. TimeoutEvent
Indicates that a request has exceeded its processing time limit.
```typescript
class TimeoutEvent extends Event {
    name: string = 'timeout'
    // Triggered when request processing exceeds the timeout threshold
}
```

## Common Event Methods

Each event type implements the following method:
- `getReqestEvent(req: NRequest): RequestEvent`: Creates a standardized request event object containing:
  - The original request
  - Event timestamp
  - Reference to the event instance

## Usage Example

```typescript
// Creating an event
const interruptEvent = new InteruptEvent({
    reason: "Client disconnected"
});

// Getting request event data
const requestEvent = interruptEvent.getReqestEvent(request);
```

## Event Flow

1. Events are instantiated when specific conditions are met (timeout, completion, interruption)
2. Each event carries relevant data about the condition that triggered it
3. The `getReqestEvent` method standardizes the event data format
4. Events can be used for monitoring, logging, and request tracking purposes

## Best Practices

1. Always use the appropriate event type for specific scenarios
2. Include relevant data when creating events
3. Use the standardized `getReqestEvent` method to ensure consistent event formatting
4. Maintain event timestamps for accurate request timeline tracking
