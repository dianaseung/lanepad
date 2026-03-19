import { useState, useEffect, useRef } from 'react'
import './FindBar.css'

export default function FindBar({ matches, currentMatch, query, onQueryChange, onNext, onPrev, onClose }) {
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            onClose()
            return
        }
        if (e.key === 'Enter') {
            e.preventDefault()
            if (e.shiftKey) onPrev()
            else onNext()
        }
    }

    return (
        <div className="find-bar">
            <span className="find-icon">⌘F</span>
            <input
                ref={inputRef}
                className="find-input"
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find in page..."
                spellCheck={false}
            />
            <span className="find-count">
                {query
                    ? matches > 0
                        ? `${currentMatch + 1} / ${matches}`
                        : 'No matches'
                    : ''
                }
            </span>
            <div className="find-nav">
                <button
                    className="find-nav-btn"
                    onClick={onPrev}
                    disabled={matches === 0}
                    title="Previous match (Shift+Enter)"
                >↑</button>
                <button
                    className="find-nav-btn"
                    onClick={onNext}
                    disabled={matches === 0}
                    title="Next match (Enter)"
                >↓</button>
            </div>
            <button className="find-close-btn" onClick={onClose} title="Close (Esc)">✕</button>
        </div>
    )
}