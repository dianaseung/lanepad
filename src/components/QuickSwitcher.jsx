import { useState, useEffect, useRef } from 'react'
import './QuickSwitcher.css'

export default function QuickSwitcher({ pages, onSelect, onClose }) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef(null)

    const filtered = pages.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.fileName.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            onClose()
            return
        }
        if (e.key === 'ArrowDown' || (e.key === 'j' && !e.metaKey && !e.ctrlKey)) {
            e.preventDefault()
            setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
            return
        }
        if (e.key === 'ArrowUp' || (e.key === 'k' && !e.metaKey && !e.ctrlKey)) {
            e.preventDefault()
            setSelectedIndex(i => Math.max(i - 1, 0))
            return
        }
        if (e.key === 'Enter') {
            const page = filtered[selectedIndex]
            if (page) {
                onSelect(page.fileName)
                onClose()
            }
            return
        }
    }

    return (
        <div className="qs-backdrop" onClick={onClose}>
            <div
                className="qs-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className="qs-input-wrap">
                    <span className="qs-icon">⌘P</span>
                    <input
                        ref={inputRef}
                        className="qs-input"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search pages..."
                        spellCheck={false}
                    />
                    {query && (
                        <button className="qs-clear" onClick={() => setQuery('')}>✕</button>
                    )}
                </div>

                <div className="qs-results">
                    {filtered.length === 0 && (
                        <div className="qs-empty">No pages match "{query}"</div>
                    )}
                    {filtered.map((page, i) => (
                        <div
                            key={page.fileName}
                            className={`qs-item ${i === selectedIndex ? 'selected' : ''}`}
                            onClick={() => {
                                onSelect(page.fileName)
                                onClose()
                            }}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <span className="qs-item-title">{page.title}</span>
                            <span className="qs-item-filename">{page.fileName}</span>
                        </div>
                    ))}
                </div>

                <div className="qs-footer">
                    <span>↑↓ or j/k to navigate</span>
                    <span>Enter to open</span>
                    <span>Esc to close</span>
                </div>
            </div>
        </div>
    )
}