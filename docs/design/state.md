# Job State

Over the years the representation of or even the discussion of job state has been somewhat muddled.

With this service serving as a middleware of sorts, we have the opportunity to present a rational, 
well though-out design.

First, let's understand that a job has a lifetime.

One aspect of the job lifetime is that it is either being managed by the job system or not. When the job is being managed by the job system, we say that it is active. When it is no longer being managed by the job system, but is just a record in the job database, it is done.

We can also use "live" and "dead", or "active" and "inactive". 

When a job is active, it is in one of three basic states: create, queue, run.

When a job is first submitted, if it is accepted, it is created and in the "create" state. This state should be very short, and at the moment just exists in the few milliseconds between when a job is received by the service (http), the job record created in the database (thus the moniker) and it is placed into the job execution service. 

The job is almost immediately placed into an available job queue,

It will remain in the queue until it reaches the front of the queue, at which point it is run.

Now, at any one of these stages - create, queue, run - the job may be stopped for three basic reasons. We call these the job's fate.

The normal job fate is to complete successfully, which we label the complete state. A job may only complete while in the run stage.

The job may also encounter an error, in which case it is in the error state. A job may enter the error state from any stage. A job in the error state has error information, including an error id, message, and associated data.

A job may also be terminated by the end user, an administrator, or some software process. A terminated job is in the "terminate" state, and like an error, has associated information including a reason code and message.

Then, at some point, the job ends, or is done.


There are steps in this life of a job which correspond to important changes in how a job is being handled:

- accept/create - when the job is first sent from the user to the job management system (njs, soon to be ee2)
- queue - after being accepted and created, it is placed in to a "queue", along with other jobs.
- run - when a job reaches the top of the queue, it's associated app is run
- done - when the app has stopped, for whatever reason, the job is done forever, and the life of the job is over.

For those familiar with the job state, this may seem like a simplification. It is! A job may not follow this order, but rather may jump from any lifecycle state to "done".

Lets call these lifecycle stages.

Each lifecycle stage is associated with certain information, some of which is cumulative.

- accept/create
  - time created
- queue
  - time queued
  - queue position
- run
  - time run
  - log entries
- done
  - time done
  - fate
    - success
      - result data
    - error
      - code
      - message
      - data
    - terminate
      - code

## Job Event History

In this plugin, job state is recorded as a sequence of job state change events.

In the upstream services, either njs or ee2, job state is stored as a mutable job state.
