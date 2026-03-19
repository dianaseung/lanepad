import { useState, useEffect, useRef } from 'react'
import { usePage } from '../hooks/usePage.js'
import { useVim } from '../hooks/useVim.js'
import CodeEditor from './CodeEditor.jsx'
import Lane from './Lane.jsx'
import FindBar from './FindBar.jsx'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import CardDragOverlay from './CardDragOverlay.jsx'
import './Canvas.css'

export default function Canvas({ folder, fileName, onSaveReady, onRefresh, onFileRenamed }) {
    const [initialData, setInitialData] = useState(null)

    useEffect(() => {
        window.lanepad.readPage(folder, fileName).then(data => {
            setInitialData(data)
        })
    }, [folder, fileName])

    if (!initialData) return <div className="canvas-loading">Loading...</div>

    return (
        <CanvasInner
            folder={folder}
            fileName={fileName}
            initialData={initialData}
            onSaveReady={onSaveReady}
            onRefresh={onRefresh}
            onFileRenamed={onFileRenamed}
        />
    )
}

function CanvasInner({ folder, fileName, initialData, onSaveReady, onRefresh, onFileRenamed }) {
    const [dirty, setDirty] = useState(false)
    const [activeCard, setActiveCard] = useState(null)
    const [focusMode, setFocusMode] = useState(false)
    const [focusedCardData, setFocusedCardData] = useState(null)
    const [focusedLaneData, setFocusedLaneData] = useState(null)
    const [focusModeLaneId, setFocusModeLaneId] = useState(null)
    const [focusModeCardId, setFocusModeCardId] = useState(null)

    // ── Find state ───────────────────────────────────────────────
    const [findOpen, setFindOpen] = useState(false)
    const [findQuery, setFindQuery] = useState('')
    const [findMatchIndex, setFindMatchIndex] = useState(0)

    const {
        page, setDirection, setTitle,
        addLane, updateLane, deleteLane, reorderLanes,
        addCard, updateCard, deleteCard, reorderCards, moveCard,
    } = usePage(initialData)

    // ── Find matches ─────────────────────────────────────────────
    const findMatches = []
    if (findQuery.trim()) {
        const q = findQuery.toLowerCase()
        for (const lane of page.lanes) {
            for (const card of lane.cards) {
                if (
                    card.title.toLowerCase().includes(q) ||
                    card.content?.toLowerCase().includes(q)
                ) {
                    findMatches.push(card.id)
                }
            }
        }
    }

    const currentMatchCardId = findMatches[findMatchIndex] ?? null

    function openFind() {
        setFindOpen(true)
        setFindQuery('')
        setFindMatchIndex(0)
    }

    function closeFind() {
        setFindOpen(false)
        setFindQuery('')
        setFindMatchIndex(0)
    }

    function findNext() {
        if (findMatches.length === 0) return
        setFindMatchIndex(i => (i + 1) % findMatches.length)
    }

    function findPrev() {
        if (findMatches.length === 0) return
        setFindMatchIndex(i => (i - 1 + findMatches.length) % findMatches.length)
    }

    useEffect(() => {
        setFindMatchIndex(0)
    }, [findQuery])

    // ── Vim hook ─────────────────────────────────────────────────
    const {
        cursor,
        setCursor,
        getFocusedCard,
        getFocusedLane,
    } = useVim({
        page,
        addLane: () => addLane(),
        addCard: (laneIndex, insertIndex, template) => {
            const lane = page.lanes[laneIndex]
            if (lane) addCard(lane.id, 'code', insertIndex, template)
        },
        deleteCard: (laneIndex, cardId) => {
            const lane = page.lanes[laneIndex]
            if (lane) deleteCard(lane.id, cardId)
        },
        deleteLane: (laneId) => deleteLane(laneId),
        reorderCards: (laneId, newCards) => reorderCards(laneId, newCards),
        updateLane: (laneId, changes) => updateLane(laneId, changes),
        updateCard: (laneId, cardId, changes) => updateCard(laneId, cardId, changes),
        onSave: () => save(),
        onNewPage: () => {},
        onOpenFind: openFind,
        onToggleFocusMode: (val) => {
            setFocusMode(val)
            if (val) {
                const card = getFocusedCard()
                const lane = getFocusedLane()
                setFocusedCardData(card)
                setFocusedLaneData(lane)
                setFocusModeLaneId(lane?.id ?? null)
                setFocusModeCardId(card?.id ?? null)
            }
        },
    })

    // ── Dirty tracking ───────────────────────────────────────────
    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        setDirty(true)
    }, [page])

    // ── Save ─────────────────────────────────────────────────────
    async function save() {
        await window.lanepad.writePage(folder, fileName, page)
        setDirty(false)
        if (onRefresh) onRefresh()
    }

    useEffect(() => {
        if (onSaveReady) onSaveReady(save)
    }, [page])

    // ── Card export helpers ───────────────────────────────────────
    function exportCardJson(card) {
        const exportData = {
            title: card.title,
            type: card.type,
            content: card.content,
            language: card.language,
            color: card.color,
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${card.title.toLowerCase().replace(/\s+/g, '-')}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    function exportLaneJson(lane) {
        const exportData = {
            name: lane.name,
            cards: lane.cards.map(c => ({
                title: c.title,
                type: c.type,
                content: c.content,
                language: c.language,
                color: c.color,
            })),
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${lane.name.toLowerCase().replace(/\s+/g, '-')}-lane.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    function importCardsJson(laneId) {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            const text = await file.text()
            try {
                const data = JSON.parse(text)
                const { nanoid } = await import('nanoid')
                // Single card or lane export
                if (data.cards) {
                    // Lane export — import all cards
                    for (const card of data.cards) {
                        addCard(laneId, null, { ...card, id: nanoid() })
                    }
                } else if (data.title) {
                    // Single card export
                    addCard(laneId, null, { ...data, id: nanoid() })
                }
            } catch {
                console.error('Invalid JSON file')
            }
        }
        input.click()
    }

    // ── Drag and drop ────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    )

    function findLaneByCardId(cardId) {
        return page.lanes.find(l => l.cards.some(c => c.id === cardId))
    }

    function handleDragStart(event) {
        const { active } = event
        const lane = findLaneByCardId(active.id)
        if (lane) {
            const card = lane.cards.find(c => c.id === active.id)
            setActiveCard(card)
        }
    }

    function handleDragOver(event) {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const activeLane = findLaneByCardId(active.id)
        if (!activeLane) return
        const overCardLane = findLaneByCardId(over.id)
        const overLaneBody = over.id.toString().startsWith('lane-body-')
            ? page.lanes.find(l => l.id === over.id.toString().replace('lane-body-', ''))
            : null
        const overLane = overCardLane ?? overLaneBody
        if (!overLane || activeLane.id === overLane.id) return
        const toIndex = overCardLane
            ? overLane.cards.findIndex(c => c.id === over.id)
            : overLane.cards.length
        moveCard(
            active.id,
            activeLane.id,
            overLane.id,
            toIndex === -1 ? overLane.cards.length : toIndex
        )
    }

    function handleDragEnd(event) {
        const { active, over } = event
        setActiveCard(null)
        if (!over || active.id === over.id) return
        const isLaneDrag = page.lanes.some(l => l.id === active.id)
        if (isLaneDrag) {
            const oldIndex = page.lanes.findIndex(l => l.id === active.id)
            const newIndex = page.lanes.findIndex(l => l.id === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
                reorderLanes(arrayMove(page.lanes, oldIndex, newIndex))
            }
            return
        }
        const activeLane = findLaneByCardId(active.id)
        const overLane = findLaneByCardId(over.id)
        if (activeLane && overLane && activeLane.id === overLane.id) {
            const oldIndex = activeLane.cards.findIndex(c => c.id === active.id)
            const newIndex = activeLane.cards.findIndex(c => c.id === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
                reorderCards(activeLane.id, arrayMove(activeLane.cards, oldIndex, newIndex))
            }
        }
    }

    const laneIds = page.lanes.map(l => l.id)
    const focusedCard = getFocusedCard()
    const focusedLane = getFocusedLane()

    // ── Focus mode render ────────────────────────────────────────
    if (focusMode && focusModeCardId) {
        const liveLane = page.lanes.find(l => l.id === focusModeLaneId)
        const liveCard = liveLane?.cards.find(c => c.id === focusModeCardId) ?? focusedCardData

        return (
            <div className="canvas-root canvas-focus-mode">
                <div className="focus-toolbar">
                    <button
                        className="focus-exit-btn"
                        onClick={() => setFocusMode(false)}
                    >
                        ← Exit Focus
                    </button>
                    <span className="focus-breadcrumb">
                        {liveLane?.name ?? ''}
                        {liveLane?.name ? ' › ' : ''}
                        {liveCard.title}
                    </span>
                    <button
                        className="focus-export-btn"
                        onClick={() => exportCardJson(liveCard)}
                    >
                        Export Card JSON
                    </button>
                </div>
                <div className="focus-card-body">
                    {liveCard.type === 'code' && (
                        <div className="focus-editor-wrap">
                            <CodeEditor
                                value={liveCard.content}
                                language={liveCard.language}
                                onChange={(val) => {
                                    if (focusModeLaneId) {
                                        updateCard(focusModeLaneId, focusModeCardId, { content: val })
                                    }
                                }}
                                onEscape={() => document.activeElement?.blur()}
                            />
                        </div>
                    )}
                    {liveCard.type === 'note' && (
                        <textarea
                            className="focus-note-editor"
                            value={liveCard.content}
                            onChange={e => {
                                if (focusModeLaneId) {
                                    updateCard(focusModeLaneId, focusModeCardId, { content: e.target.value })
                                }
                            }}
                            placeholder="Write a note..."
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`canvas-root direction-${page.direction}`}>
            <div className="canvas-toolbar">
                <input
                    className="page-title-input"
                    value={page.title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Page title"
                />
                <div className="direction-toggle">
                    <button
                        className={page.direction === 'horizontal' ? 'active' : ''}
                        onClick={() => setDirection('horizontal')}
                        title="Horizontal lanes (rows)"
                    >⇆ Rows</button>
                    <button
                        className={page.direction === 'vertical' ? 'active' : ''}
                        onClick={() => setDirection('vertical')}
                        title="Vertical lanes (columns)"
                    >⇅ Columns</button>
                </div>
                {dirty && <span className="dirty-indicator">Unsaved changes</span>}
            </div>

            {findOpen && (
                <FindBar
                    query={findQuery}
                    matches={findMatches.length}
                    currentMatch={findMatchIndex}
                    onQueryChange={setFindQuery}
                    onNext={findNext}
                    onPrev={findPrev}
                    onClose={closeFind}
                />
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={laneIds}
                    strategy={
                        page.direction === 'vertical'
                            ? horizontalListSortingStrategy
                            : verticalListSortingStrategy
                    }
                >
                    <div className="lanes-container">
                        {page.lanes.map((lane, laneIndex) => (
                            <Lane
                                key={lane.id}
                                lane={lane}
                                direction={page.direction}
                                focusedCardId={cursor.laneIndex === laneIndex ? focusedCard?.id : null}
                                isLaneFocused={cursor.laneIndex !== null && cursor.laneIndex === laneIndex}
                                findMatchCardId={currentMatchCardId}
                                findMatchCardIds={findMatches}
                                onUpdateLane={(changes) => updateLane(lane.id, changes)}
                                onDeleteLane={() => deleteLane(lane.id)}
                                onAddCard={(type) => addCard(lane.id, type)}
                                onUpdateCard={(cardId, changes) => updateCard(lane.id, cardId, changes)}
                                onDeleteCard={(cardId) => deleteCard(lane.id, cardId)}
                                onCardClick={(cardId) => {
                                    const cardIndex = lane.cards.findIndex(c => c.id === cardId)
                                    setCursor({ laneIndex, cardIndex })
                                }}
                                onExportCard={exportCardJson}
                                onExportLane={() => exportLaneJson(lane)}
                                onImportCards={() => importCardsJson(lane.id)}
                            />
                        ))}
                        <button className="add-lane-btn" onClick={addLane}>
                            + Add Lane
                        </button>
                    </div>
                </SortableContext>

                <DragOverlay>
                    {activeCard ? <CardDragOverlay card={activeCard} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}