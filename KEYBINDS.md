# Lanepad Keybinds

## Global (always active)

| Key | Action |
|-----|--------|
| `Cmd+S` | Save current page |
| `Cmd+N` | New page (auto-focuses title) |
| `Cmd+P` | Quick Switch |
| `Cmd+B` | Expand/Collapse Explorer |
| `Cmd+F` | Find Card |
| `Escape` | Exit insert mode (return to normal mode) |
| `Escape` (in normal mode) | Clear all focus |

## Navigation

Direction-aware — behavior changes based on page layout (Rows vs Columns).

### Rows mode (horizontal lanes)

| Key | Action |
|-----|--------|
| `h` | Move to previous card in lane |
| `l` | Move to next card in lane |
| `j` | Move to next lane |
| `k` | Move to previous lane |

### Columns mode (vertical lanes)

| Key | Action |
|-----|--------|
| `j` | Move to next card in lane |
| `k` | Move to previous card in lane |
| `h` | Move to previous lane |
| `l` | Move to next lane |

### Both modes

| Key | Action |
|-----|--------|
| `g g` | Jump to first card in lane |
| `G` | Jump to last card in lane |

## Card actions (card focused)

| Key | Action |
|-----|--------|
| `Enter` | Enter insert mode (focus code editor / note textarea) |
| `Shift+Enter` | Edit card title |
| `Space` | Toggle collapse / expand card |
| `x` | Delete card (press twice within 1.5s to confirm) |
| `y` | Yank (copy) card |
| `p` | Paste yanked card below focused posgitm