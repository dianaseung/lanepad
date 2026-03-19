import { useState, useEffect } from 'react'
import { usePage } from '../hooks/usePage.js'
import Lane from './Lane.jsx'
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

export default function Canvas({ folder, fileName, onSaveReady, onExportReady, onRefresh }) {
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
        />
    )
}

function CanvasInner({ folder, fileName, initialData, onSaveReady, onExportReady, onRefresh }) {
    const [dirty, setDirty] = useState(false)
    const [activeCard, setActiveCard] = useState(null)

    const {
        page, setDirection, setTitle,
        addLane, updateLane, deleteLane, reorderLanes,
        addCard, updateCard, deleteCard, reorderCards, moveCard,
    } = usePage(initialData)

    useEffect(() => {
        setDirty(true)
    }, [page])

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

    useEffect(() => {
        function onKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                save()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [page])

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
                        {page.lanes.map(lane => (
                            <Lane
                                key={lane.id}
                                lane={lane}
                                direction={page.direction}
                                onUpdateLane={(changes) => updateLane(lane.id, changes)}
                                onDeleteLane={() => deleteLane(lane.id)}
                                onAddCard={(type) => addCard(lane.id, type)}
                                onUpdateCard={(cardId, changes) => updateCard(lane.id, cardId, changes)}
                                onDeleteCard={(cardId) => deleteCard(lane.id, cardId)}
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