# kbase-ui-plugin-job-browser2

> A kbase-ui plugin to allow a KBase user to view their existing jobs; and for job admins to manage all jobs.

[background details relevant to understanding what this module does]

## Usage

This plugin is only useful when installed into [KBase UI](https://github.com/kbase/kbase-ui), as it is a plugin which extends the functionality of said web app.

If kbase-ui is currently configured to use this plugin, it will already be present in the default build (we only support one build of kbase-ui anyway).

Generally, documentation for using this plugin with kbase-ui can be found in the [KBase UI Documentation]().

For hacking on this plugin, the short version, however, goes like this:

-   Create a project directory, which we'll call `project`
    ```bash
    mkdir project
    cd project
    ```
-   Clone kbase-ui:
    ```bash
    clone -b develop https://github.com/kbase/kbase-ui
    ```
-   Clone this plugin:
    ```bash
    clone https://github.com/kbase/kbase-ui-plugin-job-browser2
    ```
-   Start up kbase-ui with this plugin installed from the local source tree:
    ```bash
    cd kbase-ui
    make dev-start plugins="jobbrowser"
    ```

> Note: In order to develop any aspect of kbase-ui, you should be familiar with (what KBase is)[https://kbase.us]

## Install

This plugin is installed into a kbase-ui build, and does not operate independently.

## Background

### For Users

Users may spawn jobs within the KBase infrastructure from the [KBase Narrative](https://github.com/kbase/narrative). These jobs may take from a few minutes to may hours or days to work through the job queue and execute. A given user may need to span dozens of jobs concurrently, of which some may be executed in parallel, others in sequence. KBase utilizes a fair-share system to provide equitable job execution for an arbitrary number of users. Thus the order and timing of jobs is not deterministic.

KBase users can monitor their job status from the Narrative, but this practice is not efficient because the "app cells" which specify the jobs and provide job status may not be visible or accessible to the user. E.g. in a Narrative with many app cells some cells may be "below the fold"; or the active jobs may be spread across more than one Narrative.

The Job Browser comes to the rescue! The job browser provides access to all of a user's jobs, including past, completed jobs and current, queued or running jobs. The Job Browser provides several filtering facets, and sorting, allowing a user to research past jobs (e.g. to look for failures), as well as monitor all running jobs.

### For Admins

The Job Browser is also suitable for KBase administrators, who are often called up on the diagnose a user's failed jobs, or jobs which have been queued or running for longer than expected. The Job Browser, when accessed by a KBase Catalog Administrator, will show not just the current user's jobs, but all user jobs.
