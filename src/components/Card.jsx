import { useState, useRef, useEffect } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import './Card.css'
import CodeEditor from './CodeEditor.jsx'

const COLORS = [
    { id: 'none', label: 'None', value: null },
    { id: 'white', label: 'White', value: '#ffffff' },
    { id: 'blue', label: 'Blue', value: '#9fefe8' },
    { id: 'green', label: 'Green', value: '#aee88e' },
    { id: 'yellow', label: 'Yellow', value: '#ecd62e' },
    { id: 'red', label: 'Red', value: '#fb3c3c' },
    { id: 'purple', label: 'Purple', value: '#cca5f3' },
    { id: 'teal', label: 'Teal', value: '#00ffb3' },
]

const LANGUAGES = [
    'javascript', 'typescript', 'python', 'sql',
    'json', 'bash', 'html', 'css', 'other'
]

export default function Card({ card, onUpdate, onDelete, dragHandleProps = {}, isFocused, isMatch, isCurrentMatch, onExportCard }) {
    const [editingTitle, setEditingTitle] = useState(false)
    const [titleValue, setTitleValue] = useState(card.title)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const colorPickerRef = useRef(null)

    useEffect(() => {
        function handleClick(e) {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
                setShowColorPicker(false)
            }
        }
        if (showColorPicker) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [showColorPicker])

    // Sync title value if card.title changes externally
    useEffect(() => {
        setTitleValue(card.title)
    }, [card.title])

    function commitTitle() {
        setEditingTitle(false)
        if (titleValue.trim()) onUpdate({ title: titleValue.trim() })
        else setTitleValue(card.title)
    }

    const accentColor = COLORS.find(c => c.value === card.color)?.value ?? null

    if (card.type === 'heading') {
        return (
            <ContextMenu.Root>
                <ContextMenu.Trigger asChild>
                    <div
                        className={`card card-heading ${isFocused ? 'vim-focused' : ''} ${isCurrentMatch ? 'find-current' : isMatch ? 'find-match' : ''}`}
                        data-card-id={card.id}
                    >
                        <button className="card-drag-handle" {...dragHandleProps} title="Drag to reorder">⠿</button>
                        {editingTitle ? (
                            <input
                                className="card-heading-input"
                                value={titleValue}
                                autoFocus
                                onChange={e => setTitleValue(e.target.value)}
                                onBlur={commitTitle}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitTitle()
                                    if (e.key === 'Escape') { setTitleValue(card.title); setEditingTitle(false) }
                                }}
                            />
                        ) : (
                            <span
                                className="card-heading-label"
                                onDoubleClick={() => setEditingTitle(true)}
                            >{card.title}</span>
                        )}
                        <button className="card-delete-btn" onClick={onDelete}>✕</button>
                    </div>
                </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="context-menu">
                    <ContextMenu.Item 
                        className="context-menu-item" 
                        onSelect={() => onExportCard(card)}
                    >
                        Export Card as JSON
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
        )
    }

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                <div
                    className={`card ${card.collapsed ? 'collapsed' : ''} ${isFocused ? 'vim-focused' : ''} ${isCurrentMatch ? 'find-current' : isMatch ? 'find-match' : ''}`}
                    data-card-id={card.id}
                >
                    <div
                        className="card-header"
                        style={accentColor ? { background: accentColor } : {}}
                    >
                        <button
                            className="card-drag-handle"
                            {...dragHandleProps}
                            title="Drag to reorder"
                        >⠿</button>

                        <button
                            className="card-collapse-btn"
                            onClick={() => onUpdate({ collapsed: !card.collapsed })}
                            title={card.collapsed ? 'Expand' : 'Collapse'}
                        >
                            {card.collapsed ? '▶' : '▼'}
                        </button>

                        {editingTitle ? (
                            <input
                                className="card-title-input"
                                value={titleValue}
                                autoFocus
                                onChange={e => setTitleValue(e.target.value)}
                                onBlur={commitTitle}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitTitle()
                                    if (e.key === 'Escape') { setTitleValue(card.title); setEditingTitle(false) }
                                }}
                            />
                        ) : (
                            <span
                                className="card-title"
                                onDoubleClick={() => setEditingTitle(true)}
                                title="Double-click to rename"
                            >{card.title}</span>
                        )}

                        <div className="card-header-meta">
                            {card.type === 'code' && !card.collapsed && (
                                <select
                                    className="card-language-select"
                                    value={card.language}
                                    onChange={e => onUpdate({ language: e.target.value })}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {LANGUAGES.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            )}

                            <select
                                className="card-type-select"
                                value={card.type}
                                onChange={e => onUpdate({ type: e.target.value })}
                                onClick={e => e.stopPropagation()}
                                title="Card type"
                            >
                                <option value="code">code</option>
                                <option value="note">note</option>
                            </select>

                            <div className="card-color-picker-wrap" ref={colorPickerRef}>
                                <button
                                    className="card-color-btn"
                                    style={accentColor ? { background: accentColor } : {}}
                                    onClick={() => setShowColorPicker(v => !v)}
                                    title="Set color"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13z"/>
                                    </svg>
                                </button>
                                {showColorPicker && (
                                    <div className="card-color-dropdown">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.id}
                                                className={`color-swatch ${card.color === c.value ? 'active' : ''}`}
                                                style={{ background: c.value ?? '#2a2a2a' }}
                                                title={c.label}
                                                onClick={() => {
                                                    onUpdate({ color: c.value })
                                                    setShowColorPicker(false)
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                className="card-delete-btn"
                                onClick={onDelete}
                                title="Delete card"
                            >✕</button>
                        </div>
                    </div>

                    {!card.collapsed && (
                        <div className="card-body">
                            {card.type === 'code' && (
                                <CodeEditor
                                    value={card.content}
                                    language={card.language}
                                    onChange={(val) => onUpdate({ content: val })}
                                    onEscape={() => document.activeElement?.blur()}
                                />
                            )}
                            {card.type === 'note' && (
                                <textarea
                                    className="card-note-editor"
                                    value={card.content}
                                    onChange={e => onUpdate({ content: e.target.value })}
                                    placeholder="Write a note..."
                                    rows={4}
                                />
                            )}
                        </div>
                    )}
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="context-menu">
                    <ContextMenu.Item 
                        className="context-menu-item" 
                        onSelect={() => onExportCard(card)}
                    >
                        Export Card as JSON
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    )
}