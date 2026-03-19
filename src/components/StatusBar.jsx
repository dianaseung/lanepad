import { useVimContext } from '../context/VimContext.jsx'
import './StatusBar.css'

export default function StatusBar() {
    const { vimState } = useVimContext()
    const { cursor, insertMode, pendingDelete, pendingLaneDelete, laneDeleteBlocked, yanked, page } = vimState

    const isDefocused = cursor.laneIndex === null

    // ── Left: location ────────────────────────────────────────────
    function getLocation() {
        if (!page || isDefocused) return '—'
        const lane = page.lanes[cursor.laneIndex]
        if (!lane) return '—'
        const laneCount = page.lanes.length
        const lanePos = `lane ${cursor.laneIndex + 1}/${laneCount}`

        if (cursor.cardIndex === null) {
            return `${lane.name}  [${lanePos}]`
        }

        const card = lane.cards[cursor.cardIndex]
        if (!card) return `${lane.name}  [${lanePos}]`
        const cardCount = lane.cards.length
        const cardPos = `card ${cursor.cardIndex + 1}/${cardCount}`
        return `${lane.name}  ›  ${card.title}  [${lanePos} · ${cardPos}]`
    }

    // ── Middle: hints ─────────────────────────────────────────────
    function getHint() {
        if (laneDeleteBlocked) return 'remove all cards before deleting lane'
        if (pendingLaneDelete) return 'press Shift+X again to confirm lane delete'
        if (pendingDelete) return 'press x again to confirm delete'
        if (yanked) return `yanked: ${yanked.title}`
        return ''
    }

    // ── Right: mode ───────────────────────────────────────────────
    function getMode() {
        if (isDefocused) return { label: '-- --', cls: 'mode-none' }
        if (insertMode) return { label: 'INSERT', cls: 'mode-insert' }
        return { label: 'NORMAL', cls: 'mode-normal' }
    }

    const location = getLocation()
    const hint = getHint()
    const mode = getMode()

    return (
        <div className="statusbar">
            <span className="statusbar-location">{location}</span>
            <span className="statusbar-hint">{hint}</span>
            <span className={`statusbar-mode ${mode.cls}`}>{mode.label}</span>
        </div>
    )
}