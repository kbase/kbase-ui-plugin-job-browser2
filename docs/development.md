# Development

## To use a local version of the plugin within kbase-ui

- Create a project directory, which we'll call `project`
  
    ```bash
    mkdir project
    cd project
    ```

- Within it, clone kbase-ui:

    ```bash
    clone -b develop https://github.com/kbase/kbase-ui
    ```

- Within it, clone this plugin:

    ```bash
    clone https://github.com/kbase/kbase-ui-plugin-job-browser2
    ```

- Start up kbase-ui with this plugin installed from the local source tree:
  
    ```bash
    cd kbase-ui
    make dev-start plugins="job-browser2"
    ```

> Note: In order to develop any aspect of kbase-ui, you should be familiar with (what KBase is)[https://kbase.us]

## See Also

[Plugin Development]([https://kbaseincubator.github.io/kbase-ui-docs/guides/plugins/)