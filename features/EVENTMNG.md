# Flow in request event management system.

- Request come in.
    + On request start
    + On request data
    + On request end
    + On request error
    + On request close
    ... (Custom events)
- Response come in.
    + On response start
    + On response data
    + On response end
    + On response error
    + On response close
    ... (Custom events)

- Event observers:
    + On request start
    + On request data
    + On request end
    + On request error
    + On request close
    + On response start
    + On response data
    + On response end
    + On response error
    + On response close
    ... (Custom events)

# Event Listener class (Abstract)
Each class should be responsible for handling a specific event.
Register the class in the EventManager.

# Event context class (Abstract)
Firing the event will be passing the state of the request, response, and event data to a seperate class.

### TEST SECTION
```js
1. Recive a request.
2. Fire the event by the event manager.
3. Recive a event from the event manager.
4. Somehow to seperate a handler for each event.
5. That each event handler will only control that request.
```

## Problems
- The event manager is dispatch from the injectable Request.
    - So that the injectable request cannot be stoped.
    -> solution: the injectable request should be able to recive the event in event manager.


### Sumarize today
! FINISH THE EVENT MANAGER