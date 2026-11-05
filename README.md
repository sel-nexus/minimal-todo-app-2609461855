# Minimal Todo App

A dependency-free, single-file todo list for validating browser end-to-end tests. The app is plain HTML, CSS, and vanilla JavaScript; all task state is in memory and resets when the page reloads.

## Run the app

Open `frontend/index.html` directly in a browser. No server, install, or build step is needed.

## Behavior

- Add tasks with the Add button or Enter; surrounding whitespace is trimmed and blank submissions are ignored.
- Tasks appear in creation order with sequential IDs starting at 1.
- Checkboxes toggle completion and show completed titles with a strikethrough.
- Delete removes only the selected task; deleting the last task restores the `No tasks yet.` empty state.
- Stable `data-testid` selectors are provided for the input, button, list, empty state, and each task control.

## Run the browser test

The Playwright dependency and configuration are test tooling only; they are not loaded by the app.

```sh
cd frontend
npm install --no-save
node node_modules/@playwright/test/cli.js install chromium
npm test
```
