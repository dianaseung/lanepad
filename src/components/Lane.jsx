import { useState } from 'react'
import Card from './Card.jsx'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import './Lane.css'

export default function Lane({
    lane, direction,
    onUpdateLane, onDeleteLane,
    onAddCard, onUpdateCard, onDeleteCard,
    focusedCardId, onCardClick,
    isLaneFocused,
}) {
    const [editingName, setEditingName] = useState(false)
    const [nameValue, setNameValue] = useState(lane.name)
    const [addingType, setAddingType] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lane.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    function commitName() {
        setEditingName(false)
        if (nameValue.trim()) onUpdateLane({ name: nameValue.trim() })
        else setNameValue(lane.name)
    }

    function handleAddCard(type) {
        onAddCard(type)
        setAddingType(false)
    }

    const cardIds = lane.cards.map(c => c.id)

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-lane-id={lane.id}
            className={`lane direction-${direction} ${lane.collapsed ? 'collapsed' : ''} ${isLaneFocused ? 'lane-vim-focused' : ''}`}
        >
            <div className="lane-header">
                <button
                    className="lane-drag-handle"
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder lane"
                >⠿</button>

                <button
                    className="lane-collapse-btn"
                    onClick={() => onUpdateLane({ collapsed: !lane.collapsed })}
                    title={lane.collapsed ? 'Expand lane' : 'Collapse lane'}
                >
                    {lane.collapsed ? '▶' : '▼'}
                </button>

                {editingName ? (
                    <input
                        className="lane-name-input"
                        value={nameValue}
                        autoFocus
                        onChange={e => setNameValue(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={e => {
                            if (e.key === 'Enter') commitName()
                            if (e.key === 'Escape') {
                                setNameValue(lane.name)
                                setEditingName(false)
                            }
                        }}
                    />
                ) : (
                    <span
                        className="lane-name"
                        onDoubleClick={() => setEditingName(true)}
                        title="Double-click to rename"
                    >
                        {lane.name}
                    </span>
                )}

                <div className="lane-actions">
                    {!lane.collapsed && (
                        <div className="add-card-wrap">
                            <button
                                className="lane-action-btn"
                                onClick={() => setAddingType(v => !v)}
                            >+ Card</button>
                            {addingType && (
                                <div className="add-card-dropdown">
                                    <button onClick={() => handleAddCard('code')}>Code</button>
                                    <button onClick={() => handleAddCard('note')}>Note</button>
                                    <button onClick={() => handleAddCard('heading')}>Heading</button>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        className="lane-action-btn danger"
                        onClick={onDeleteLane}
                    >✕</button>
                </div>
            </div>

            {!lane.collapsed && (
                <SortableContext
                    items={cardIds}
                    strategy={verticalListSortingStrategy}
                >
                    <DroppableLaneBody laneId={lane.id}>
                        {lane.cards.length === 0 && (
                            <div className="lane-empty">No cards — click + Card to add one</div>
                        )}
                        {lane.cards.map(card => (
                            <SortableCard
                                key={card.id}
                                card={card}
                                isFocused={focusedCardId === card.id}
                                onUpdate={(changes) => onUpdateCard(card.id, changes)}
                                onDelete={() => onDeleteCard(card.id)}
                                onClick={() => onCardClick(card.id)}
                            />
                        ))}
                    </DroppableLaneBody>
                </SortableContext>
            )}
        </div>
    )
}

function DroppableLaneBody({ laneId, children }) {
    const { setNodeRef, isOver } = useDroppable({ id: `lane-body-${laneId}` })
    return (
        <div
            ref={setNodeRef}
            className={`lane-cards ${isOver ? 'drop-over' : ''}`}
        >
            {children}
        </div>
    )
}

function SortableCard({ card, onUpdate, onDelete, onClick, isFocused }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} onClick={onClick}>
            <Card
                card={card}
                isFocused={isFocused}
                onUpdate={onUpdate}
                onDelete={onDelete}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    )
}