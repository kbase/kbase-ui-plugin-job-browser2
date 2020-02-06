# kbase-ui-plugin-job-browser2

> A kbase-ui plugin to allow a KBase user to view their Narrative jobs; and for job admins to manage all jobs.

This plugin provides a single top level component designed to serve both regular users and administrators. It's primary purpose is to allow the user to view their current and past jobs. Administrative users can use it to inspect jobs for all users.

## Usage

This plugin is only useful when installed into [kbase-ui](https://github.com/kbase/kbase-ui), as it is a plugin which extends the functionality of said web app.

If kbase-ui is currently configured to use this plugin, it will already be present in the default build (we only support one build of kbase-ui anyway).

## Installation

This plugin is installed into a kbase-ui build, and does not operate independently.

## Background

### For Users

Users may spawn jobs within the KBase infrastructure from the [KBase Narrative](https://github.com/kbase/narrative). These jobs may take from a few minutes, hours or even days to work through the job queue, run, and finish. Most jobs are spawned by running Narrative Apps. 

Within the Narrative, running Apps will report the status of the associated jobs.

However, a user may spawn many jobs concurrently, of which some may be executed in parallel, others in sequence. KBase utilizes a fair-share system to provide equitable job execution for an arbitrary number of users. Thus the order and timing of jobs is not deterministic.

The Job Browser allows a user to observe all of their jobs across all of their Narratives. Therefore, it is especially useful for such a user, because otherwise it would be difficult to monitor job progress in multiple open Narratives, each with multiple running Apps.

The Job Browser is also useful for inspecting all of a user's jobs, including past, completed jobs and current, queued or running jobs. The Job Browser provides several filtering facets, and sorting, allowing a user to research past jobs (e.g. to look for failures), as well as monitor all running jobs.

### For Admins

The Job Browser is also suitable for KBase administrators, who are often called up on the diagnose a user's failed jobs, or jobs which have been queued or running for longer than expected. The Job Browser, when accessed by a KBase Catalog Administrator, will show not just the current user's jobs, but all user jobs.

## Development

Complete development information [is available](./docs/development.md).

The quick version:

1. Clone the repo

    ```text
    git clone https://github.com/kbase/kbase-ui-plugin-job-browser2
    ```

    > Note - plugins operate purely on the master branch; feature branches may be utilized if need be for a particular effort.

2. Enter the app directory

    This plugin is a React web app utilizing CRA (Create React App), Typescript, Redux, and Ant Design as primary dependencies. As a CRA web app, development always starts with a local instance, like so:

    ```text
    cd kbase-ui-plugin-job-browser2/react-app
    yarn install
    yarn start
    ```

    This will compile the web app, start a local instance (at http://localhost:3000), open a browser to the local instance, and watch the source files, recompiling up on any change.

3. From here you may edit source files, after which the web app will automatically recompile and reload in the browser.

[Additional development information](./docs/development.md)

## Acknowledgments

- Mike - original author as an embedded aspect of the [catalog plugin](https://github.com/kbase/kbase-ui-plugin-catalog)
- Jim - separated the job browser from the catalog plugin into a standalone plugin
- Erik - port to Typescript & React

## See Also

- [KBase UI](https://github.com/kbase/kbase-ui)
- [Catalog Plugin](https://github.com/kbase/kbase-ui-plugin-catalog)
- [What is KBase?](http://kbase.us/what-is-kbase/)

## License

SEE LICENSE IN LICENSE.md
