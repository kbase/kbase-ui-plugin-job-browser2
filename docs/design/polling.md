# Polling for Job Updates

Since we do not have a built-in system for pushing job updates (e.g. push notification), this plugin implements a user-controlled poller.

The poller has an unusual design, which involves 4 major components.

- the job browser
- the Monitor component, which provides a switch to turn on polling and display polling status
- a Poller class, which provides the polling logic
- a Pubsub class, which provides message-based reactive communication between components and class instances.

