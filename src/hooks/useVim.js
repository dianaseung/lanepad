import { useState, useEffect, useCallback, useRef } from 'react'
import { useVimContext } from '../context/VimContext.jsx'

export function useVim({
    page,
    addLane,
    addCard,
    deleteCard,
    deleteLane,
    reorderCards,
    updateLane,
    updateCard,
    onSave,
    onNewPage,
    onOpenFind,
}) {
    const [cursor, setCursorRaw] = useState({ laneIndex: 0, cardIndex: null })
    const [yanked, setYankedRaw] = useState(null)
    const [pendingG, setPendingG] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(false)
    const [pendingLaneDelete, setPendingLaneDelete] = useState(false)
    const [laneDeleteBlocked, setLaneDeleteBlocked] = useState(false)
    const [insertMode, setInsertMode] = useState(false)

    const gTimer = useRef(null)
    const deleteTimer = useRef(null)
    const laneDeleteTimer = useRef(null)
    const laneDeleteBlockedTimer = useRef(null)

    const { setVimState } = useVimContext()

    // Sync all vim state to context whenever anything changes
    useEffect(() => {
        setVimState({
            cursor,
            insertMode,
            pendingDelete,
            pendingLaneDelete,
            laneDeleteBlocked,
            yanked,
            page,
        })
    }, [cursor, insertMode, pendingDelete, pendingLaneDelete, laneDeleteBlocked, yanked, page])

    // Wrap setCursor to keep things clean
    const setCursor = useCallback((val) => {
        setCursorRaw(val)
    }, [])

    const setYanked = useCallback((val) => {
        setYankedRaw(val)
    }, [])

    // Track insert mode via focus/blur events
    useEffect(() => {
        function onFocus() {
            const active = document.activeElement
            if (!active) return
            const tag = active.tagName.toLowerCase()
            if (tag === 'input' || tag === 'textarea' || active.closest('.cm-editor')) {
                setInsertMode(true)
            }
        }
        function onBlur() {
            setInsertMode(false)
        }
        document.addEventListener('focusin', onFocus)
        document.addEventListener('focusout', onBlur)
        return () => {
            document.removeEventListener('focusin', onFocus)
            document.removeEventListener('focusout', onBlur)
        }
    }, [])

    const isInsertMode = useCallback(() => {
        const active = document.activeElement
        if (!active) return false
        const tag = active.tagName.toLowerCase()
        return tag === 'input' || tag === 'textarea' || !!active.closest('.cm-editor')
    }, [])

    const clampCursor = useCallback((laneIndex, cardIndex, lanes) => {
        if (!lanes || lanes.length === 0) return { laneIndex: 0, cardIndex: null }
        const li = Math.max(0, Math.min(laneIndex, lanes.length - 1))
        const lane = lanes[li]
        if (cardIndex === null || !lane || lane.cards.length === 0) {
            return { laneIndex: li, cardIndex: null }
        }
        const ci = Math.max(0, Math.min(cardIndex, lane.cards.length - 1))
        return { laneIndex: li, cardIndex: ci }
    }, [])

    const getFocusedCard = useCallback(() => {
        if (!page || cursor.laneIndex === null || cursor.cardIndex === null) return null
        const lane = page.lanes[cursor.laneIndex]
        if (!lane) return null
        return lane.cards[cursor.cardIndex] ?? null
    }, [page, cursor])

    const getFocusedLane = useCallback(() => {
        if (!page || cursor.laneIndex === null) return null
        return page.lanes[cursor.laneIndex] ?? null
    }, [page, cursor])

    useEffect(() => {
        if (!page) return

        const direction = page.direction
        const lanes = page.lanes

        function handleKeyDown(e) {
            // Always-on shortcuts
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                onSave?.()
                return
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault()
                onNewPage?.()
                return
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault()
                onOpenFind?.()
                return
            }

            if (e.key === 'Escape') {
                if (!isInsertMode()) {
                    // Second escape — clear cursor entirely
                    setCursor({ laneIndex: null, cardIndex: null })
                } else {
                    document.activeElement?.blur()
                }
                return
            }

            if (isInsertMode()) return

            // Re-enter at lane 0 if cursor is fully cleared
            if (cursor.laneIndex === null) {
                if (['h', 'j', 'k', 'l', 'g', 'G', 'n', 'y', 'p', ' '].includes(e.key)) {
                    setCursor({ laneIndex: 0, cardIndex: null })
                    return
                }
                if (e.key === 'x' && !e.shiftKey) return
                if (e.key === 'X' && e.shiftKey) return
            }

            const { laneIndex, cardIndex } = cursor
            const currentLane = lanes[laneIndex]

            // ── g g sequence ──────────────────────────────────────
            if (e.key === 'g' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                if (pendingG) {
                    clearTimeout(gTimer.current)
                    setPendingG(false)
                    if (currentLane && currentLane.cards.length > 0) {
                        setCursor({ laneIndex, cardIndex: 0 })
                    }
                } else {
                    setPendingG(true)
                    gTimer.current = setTimeout(() => setPendingG(false), 500)
                }
                return
            }

            if (pendingG && e.key !== 'g') {
                clearTimeout(gTimer.current)
                setPendingG(false)
            }

            // ── Direction-aware nav ───────────────────────────────
            const moveCardPrev = direction === 'horizontal' ? 'h' : 'k'
            const moveCardNext = direction === 'horizontal' ? 'l' : 'j'
            const moveLanePrev = direction === 'horizontal' ? 'k' : 'h'
            const moveLaneNext = direction === 'horizontal' ? 'j' : 'l'

            if (e.key === moveCardPrev && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault()
                if (!currentLane || currentLane.cards.length === 0) return
                if (cardIndex === null) {
                    setCursor({ laneIndex, cardIndex: currentLane.cards.length - 1 })
                } else {
                    setCursor({ laneIndex, cardIndex: Math.max(cardIndex - 1, 0) })
                }
                return
            }

            if (e.key === moveCardNext && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault()
                if (!currentLane || currentLane.cards.length === 0) return
                if (cardIndex === null) {
                    setCursor({ laneIndex, cardIndex: 0 })
                } else {
                    setCursor({ laneIndex, cardIndex: Math.min(cardIndex + 1, currentLane.cards.length - 1) })
                }
                return
            }

            if (e.key === moveLanePrev && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault()
                const newLaneIndex = Math.max(laneIndex - 1, 0)
                setCursor(clampCursor(newLaneIndex, cardIndex, lanes))
                return
            }

            if (e.key === moveLaneNext && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault()
                const newLaneIndex = Math.min(laneIndex + 1, lanes.length - 1)
                setCursor(clampCursor(newLaneIndex, cardIndex, lanes))
                return
            }

            // ── Ctrl+j/k — move card within lane ─────────────────
            if (e.ctrlKey && (e.key === 'j' || e.key === 'k')) {
                e.preventDefault()
                if (cardIndex === null || !currentLane) return
                const newIndex = e.key === 'j'
                    ? Math.min(cardIndex + 1, currentLane.cards.length - 1)
                    : Math.max(cardIndex - 1, 0)
                if (newIndex !== cardIndex) {
                    const newCards = [...currentLane.cards]
                    const [card] = newCards.splice(cardIndex, 1)
                    newCards.splice(newIndex, 0, card)
                    reorderCards(currentLane.id, newCards)
                    setCursor({ laneIndex, cardIndex: newIndex })
                }
                return
            }

            // ── G — jump to last card ─────────────────────────────
            if (e.key === 'G' && e.shiftKey) {
                e.preventDefault()
                if (currentLane && currentLane.cards.length > 0) {
                    setCursor({ laneIndex, cardIndex: currentLane.cards.length - 1 })
                }
                return
            }

            // ── Enter — focus editor ──────────────────────────────
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const focusedCard = getFocusedCard()
                if (!focusedCard) return
                const cardEl = document.querySelector(`[data-card-id="${focusedCard.id}"]`)
                const cmEl = cardEl?.querySelector('.cm-content')
                const textareaEl = cardEl?.querySelector('.card-note-editor')
                if (cmEl) cmEl.focus()
                else if (textareaEl) textareaEl.focus()
                return
            }

            // ── Shift+Enter — rename lane or card title ───────────
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault()
                if (cardIndex === null) {
                    // Lane level — rename lane
                    const laneEl = document.querySelector(`[data-lane-id="${currentLane?.id}"]`)
                    const nameEl = laneEl?.querySelector('.lane-name')
                    if (nameEl) nameEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
                } else {
                    // Card level — rename card title
                    const focusedCard = getFocusedCard()
                    if (!focusedCard) return
                    const cardEl = document.querySelector(`[data-card-id="${focusedCard.id}"]`)
                    const titleEl = cardEl?.querySelector('.card-title')
                    if (titleEl) titleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
                }
                return
            }

            // ── Shift+X — delete lane ─────────────────────────────
            if (e.key === 'X' && e.shiftKey) {
                e.preventDefault()
                if (!currentLane) return
                if (currentLane.cards.length > 0) {
                    setLaneDeleteBlocked(true)
                    clearTimeout(laneDeleteBlockedTimer.current)
                    laneDeleteBlockedTimer.current = setTimeout(() => setLaneDeleteBlocked(false), 2000)
                    return
                }
                if (pendingLaneDelete) {
                    clearTimeout(laneDeleteTimer.current)
                    setPendingLaneDelete(false)
                    deleteLane(currentLane.id)
                    const newLaneIndex = Math.max(laneIndex - 1, 0)
                    setCursor({ laneIndex: newLaneIndex, cardIndex: null })
                } else {
                    setPendingLaneDelete(true)
                    laneDeleteTimer.current = setTimeout(() => setPendingLaneDelete(false), 1500)
                }
                return
            }

            // ── x — delete card ───────────────────────────────────
            if (e.key === 'x' && !e.shiftKey) {
                e.preventDefault()
                const card = getFocusedCard()
                if (!card) return
                if (pendingDelete) {
                    clearTimeout(deleteTimer.current)
                    setPendingDelete(false)
                    deleteCard(laneIndex, card.id)
                    const newCardIndex = cardIndex > 0 ? cardIndex - 1
                        : currentLane.cards.length > 1 ? 0 : null
                    setCursor({ laneIndex, cardIndex: newCardIndex })
                } else {
                    setPendingDelete(true)
                    deleteTimer.current = setTimeout(() => setPendingDelete(false), 1500)
                }
                return
            }

            // ── y — yank ──────────────────────────────────────────
            if (e.key === 'y') {
                e.preventDefault()
                const card = getFocusedCard()
                if (card) setYanked({ ...card })
                return
            }

            // ── p — paste ─────────────────────────────────────────
            if (e.key === 'p') {
                e.preventDefault()
                if (!yanked || !currentLane) return
                const insertIndex = cardIndex === null
                    ? currentLane.cards.length
                    : cardIndex + 1
                addCard(laneIndex, insertIndex, yanked)
                setCursor({ laneIndex, cardIndex: insertIndex })
                return
            }

            // ── n — new card ──────────────────────────────────────
            if (e.key === 'n' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                e.preventDefault()
                const insertIndex = cardIndex === null
                    ? (currentLane?.cards.length ?? 0)
                    : cardIndex + 1
                addCard(laneIndex, insertIndex)
                setTimeout(() => {
                    setCursor({ laneIndex, cardIndex: insertIndex })
                    const lane = page.lanes[laneIndex]
                    const newCard = lane?.cards[insertIndex]
                    if (newCard) {
                        const cardEl = document.querySelector(`[data-card-id="${newCard.id}"]`)
                        const titleEl = cardEl?.querySelector('.card-title')
                        if (titleEl) titleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
                    }
                }, 50)
                return
            }

            // ── N — new lane ──────────────────────────────────────
            if (e.key === 'N' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
                e.preventDefault()
                addLane()
                setTimeout(() => {
                    setCursor({ laneIndex: lanes.length, cardIndex: null })
                }, 50)
                return
            }

            // ── Space — toggle collapse ───────────────────────────
            if (e.key === ' ') {
                e.preventDefault()
                const focusedCard = getFocusedCard()
                if (focusedCard && currentLane) {
                    updateCard(currentLane.id, focusedCard.id, { collapsed: !focusedCard.collapsed })
                }
                return
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [page, cursor, pendingG, pendingDelete, pendingLaneDelete, yanked, isInsertMode])

    return {
        cursor,
        setCursor,
        yanked,
        pendingDelete,
        pendingLaneDelete,
        laneDeleteBlocked,
        insertMode,
        getFocusedCard,
        getFocusedLane,
    }
}