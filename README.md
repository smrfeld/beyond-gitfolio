# Beyond Gitfolio 

Jekyll theme for beautiful academic website - based on the fantastic [Gitfolio](https://imfunniee.github.io/gitfolio/).

The goals of this project are to extend `Gitfolio` to:
1. Instead of repos, show different links on the homepage.
2. Move the repos to a dedicated `code` page.
3. Add a dedicated `papers` page to display academic papers.
4. Update the `gitfolio ui` so that papers can be added dynamically to the page.
5. Small stylistic changes, e.g. change the background to full page image.

## Running beyond-gitfolio

Note that the command line interface from `gitfolio` is not supported because the configuration options are more complex. Only the GUI is supported:
```
beyond-gitfolio ui
```

## Development

To install locally:
```
npm link
```
in the local dircectory which gives
```
/usr/local/bin/beyond-gitfolio -> /usr/local/lib/node_modules/beyond-gitfolio/bin/beyond_gitfolio.js
/usr/local/lib/node_modules/beyond-gitfolio -> /Users/oernst/software_public/beyond-gitfolio
```

Then run
```
beyond-gitfolio ui
```

### To-Do

1. Blog is not tested and probably broken.
2. Ability to reorganize sections.