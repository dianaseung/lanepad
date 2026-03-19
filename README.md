# Lanepad

A vim-like code scratchpad for software engineers. Organize code snippets, API shapes, and architecture notes into named swimlanes on freeform pages — all stored as plain JSON files on disk.

![Lanepad](./screenshot.png)

## What it is

Lanepad sits between a whiteboard and a code editor. It's designed for moments when you need to think through a data model, sketch an API surface, or organize your thoughts before writing code — with full syntax highlighting, vim motions, and a keyboard-driven workflow.

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install and run
```bash
git clone <your-repo-url>
cd lanepad
npm install
npm run dev
```

### Build for distribution
```bash
npm run build
```

## How it works

### Projects and pages

Open any folder as a project. Each page is a `.lanepad` file (JSON) stored directly in that folder. Pages are listed in the sidebar — click to open, right-click for options.

### Pages and lanes

Each page contains named **swimlanes**. Pages can be set to **Rows** mode (horizontal lanes stacked top to bottom) or **Columns** mode (vertical lanes side by side). Toggle between modes with the ⇆/⇅ buttons in the canvas toolbar.

### Cards

Each lane contains **cards** of three types:

| Type | Description |
|------|-------------|
| `code` | Syntax-highlighted code editor (CodeMirror + vim mode) |
| `note` | Plain text area |
| `heading` | Visual divider label |

Cards can be collapsed to show only their title, color-labeled, reordered by drag, and moved between lanes.

### File format

Each `.lanepad` file is plain JSON:
```json
{
  "title": "My API Design",
  "direction": "horizontal",
  "lanes": [
    {
      "id": "abc123",
      "name": "Requests",
      "collapsed": false,
      "cards": [
        {
          "id": "def456",
          "title": "GET /users",
          "type": "code",
          "content": "fetch('/api/users')",
          "language": "javascript",
          "color": null,
          "collapsed": false
        }
      ]
    }
  ]
}
```

### Import / export

- **Export page** — right-click a page in the sidebar → Export as Markdown
- **Export card** — right-click a card → Export card as JSON
- **Export lane** — click ↓ Lane button on a lane header
- **Import cards** — click + Card → Import JSON on a lane (accepts single card or lane JSON)

## Keybinds

### Global

| Key | Action |
|-----|--------|
| `⌘S` | Save page |
| `⌘N` | New page |
| `⌘P` | Quick switcher |
| `⌘F` | Find in page |
| `⌘B` | Toggle sidebar |

### Navigation

Direction-aware — adapts to Rows vs Columns mode.

**Rows mode**

| Key | Action |
|-----|--------|
| `h / l` | Previous / next card |
| `j / k` | Previous / next lane |

**Columns mode**

| Key | Action |
|-----|--------|
| `j / k` | Previous / next card |
| `h / l` | Previous / next lane |

**Both modes**

| Key | Action |
|-----|--------|
| `g g` | First card in lane |
| `G` | Last card in lane |
| `Escape` | Exit insert mode |
| `Escape` (×2) | Clear all focus |

### Card actions

| Key | Action |
|-----|--------|
| `Enter` | Focus code editor / note textarea |
| `Shift+Enter` | Edit card title |
| `Space` | Toggle collapse / expand |
| `z` | Toggle focus mode (full-screen card) |
| `x` (×2) | Delete card |
| `y` | Yank (copy) card |
| `p` | Paste card below |
| `Ctrl+j / k` | Move card down / up in lane |
| `n` | New card below |

### Lane actions

| Key | Action |
|-----|--------|
| `Shift+Enter` | Edit lane name (lane-level focus) |
| `Shift+X` (×2) | Delete lane (must be empty) |
| `N` | New lane |

### Code editor (INSERT mode)

Full vim motions via `@replit/codemirror-vim`. Press `Escape` once to exit CodeMirror insert mode, again to return to Lanepad normal mode.

## Status bar

The bottom status bar shows three things:

| Section | Content |
|---------|---------|
| Left | Current location (lane › card) |
| Middle | Pending action hints |
| Right | Mode: `NORMAL` / `INSERT` / `FOCUS` / `-- --` |

## Tech stack

- [Electron](https://electronjs.org)
- [React](https://react.dev)
- [Vite](https://vitejs.dev) + [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron)
- [@dnd-kit](https://dndkit.com) — drag and drop
- [CodeMirror 6](https://codemirror.net) + [@replit/codemirror-vim](https://github.com/replit/codemirror-vim)
- [Radix UI](https://radix-ui.com) — context menus
- [electron-store](https://github.com/sindresorhus/electron-store) — persistent settings
- [nanoid](https://github.com/ai/nanoid) — unique IDs