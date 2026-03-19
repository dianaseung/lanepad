import { useState, useEffect, useRef } from 'react'
import { usePage } from '../hooks/usePage.js'
import { useVim } from '../hooks/useVim.js'
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

export default function Canvas({ folder, fileName, onSaveReady, onExportReady, onRefresh, onFileRenamed }) {
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
            onExportReady={onExportReady}
            onRefresh={onRefresh}
            onFileRenamed={onFileRenamed}
        />
    )
}

function CanvasInner({ folder, fileName, initialData, onSaveReady, onExportReady, onRefresh, onFileRenamed }) {
    const [dirty, setDirty] = useState(false)
    const [activeCard, setActiveCard] = useState(null)

    // ── Find state ───────────────────────────────────────────────
    const [findOpen, setFindOpen] = useState(false)
    const [findQuery, setFindQuery] = useState('')
    const [findMatchIndex, setFindMatchIndex] = useState(0)

    const {
        page, setDirection, setTitle,
        addLane, updateLane, deleteLane, reorderLanes,
        addCard, updateCard, deleteCard, reorderCards, moveCard,
    } = usePage(initialData)

    // ── Compute find matches ─────────────────────────────────────
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

    // Reset match index when query changes
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

    // ── Save / export ────────────────────────────────────────────
    async function save() {
        await window.lanepad.writePage(folder, fileName, page)
        setDirty(false)
        if (onRefresh) onRefresh()
    }

    function exportMarkdown() {
        const lines = [`# ${page.title}`, '']
        for (const lane of page.lanes) {
            lines.push(`## ${lane.name}`, '')
            for (const card of lane.cards) {
                if (card.type === 'heading') {
                    lines.push(`### ${card.title}`, '')
                } else if (card.type === 'note') {
                    lines.push(`### ${card.title}`, '')
                    if (card.content) lines.push(card.content, '')
                } else if (card.type === 'code') {
                    lines.push(`### ${card.title}`, '')
                    if (card.content) {
                        lines.push(`\`\`\`${card.language}`, card.content, '```', '')
                    }
                }
            }
        }
        const md = lines.join('\n')
        const blob = new Blob([md], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${page.title.toLowerCase().replace(/\s+/g, '-')}.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    useEffect(() => {
        if (onSaveReady) onSaveReady(save)
    }, [page])

    useEffect(() => {
        if (onExportReady) onExportReady(exportMarkdown)
    }, [page])

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

    return (
        <div className={`canvas-root direction-${page.direction}`}>
            <div className="canvas-toolbar">
                <input
                    className="page-title-input"
                    value={page.title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Page title"
                />
                {dirty && <span className="dirty-indicator">Unsaved changes</span>}
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