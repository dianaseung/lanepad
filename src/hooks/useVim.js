import { useState, useEffect, useCallback, useRef } from 'react'

export function useVim({
    page,
    addLane,
    addCard,
    deleteCard,
    deleteLane,
    reorderCards,
    updateLane,
    onSave,
    onNewPage,
}) {
    const [cursor, setCursor] = useState({ laneIndex: 0, cardIndex: null })
    const [yanked, setYanked] = useState(null)
    const [pendingG, setPendingG] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(false)
    const [pendingLaneDelete, setPendingLaneDelete] = useState(false)
    const [laneDeleteBlocked, setLaneDeleteBlocked] = useState(false)
    const gTimer = useRef(null)
    const deleteTimer = useRef(null)
    const laneDeleteTimer = useRef(null)
    const laneDeleteBlockedTimer = useRef(null)
    const wasInNormalMode = useRef(false)

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
        if (!page || cursor.cardIndex === null) return null
        const lane = page.lanes[cursor.laneIndex]
        if (!lane) return null
        return lane.cards[cursor.cardIndex] ?? null
    }, [page, cursor])

    const getFocusedLane = useCallback(() => {
        if (!page) return null
        return page.lanes[cursor.laneIndex] ?? null
    }, [page, cursor])

    useEffect(() => {
        if (!page) return

        const direction = page.direction // 'horizontal' | 'vertical'
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

            if (e.key === 'Escape') {
                if (!isInsertMode()) {
                    // Already in normal mode — second Escape, clear cursor
                    setCursor({ laneIndex: null, cardIndex: null })
                    wasInNormalMode.current = false
                } else {
                    // First Escape — exit insert mode
                    document.activeElement?.blur()
                }
                return
            }

            // If cursor is fully cleared, any nav key re-enters at lane 0
            if (cursor.laneIndex === null && !isInsertMode()) {
                if (['h','j','k','l','g','G','n','N','x','y','p',' '].includes(e.key)) {
                    setCursor({ laneIndex: 0, cardIndex: null })
                    return
                }
            }

            if (isInsertMode()) return

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

            // ── Direction-aware nav keys ──────────────────────────
            // Rows mode:    h/l = prev/next card, j/k = prev/next lane
            // Columns mode: j/k = prev/next card, h/l = prev/next lane

            const moveCardPrev = direction === 'horizontal' ? 'h' : 'k'
            const moveCardNext = direction === 'horizontal' ? 'l' : 'j'
            const moveLanePrev = direction === 'horizontal' ? 'k' : 'h'
            const moveLaneNext = direction === 'horizontal' ? 'j' : 'l'

            // Move to previous card
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

            // Move to next card
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

            // Move to previous lane
            if (e.key === moveLanePrev && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault()
                const newLaneIndex = Math.max(laneIndex - 1, 0)
                setCursor(clampCursor(newLaneIndex, cardIndex, lanes))
                return
            }

            // Move to next lane
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

            // ── Shift+Enter — rename lane (only at lane level) ────
            if (e.key === 'Enter' && e.shiftKey && cardIndex === null) {
                e.preventDefault()
                const laneEl = document.querySelector(`[data-lane-id="${currentLane?.id}"]`)
                const nameEl = laneEl?.querySelector('.lane-name')
                if (nameEl) nameEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
                return
            }

            // ── Shift+X — delete lane ─────────────────────────────
            if (e.key === 'X' && e.shiftKey) {
                e.preventDefault()
                if (!currentLane) return

                if (currentLane.cards.length > 0) {
                    // Blocked — has cards
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

            // ── y — yank card ─────────────────────────────────────
            if (e.key === 'y') {
                e.preventDefault()
                const card = getFocusedCard()
                if (card) setYanked({ ...card })
                return
            }

            // ── p — paste card ────────────────────────────────────
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
                    // Auto-focus the new card title
                    const newCard = page.lanes[laneIndex]?.cards[insertIndex]
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
        getFocusedCard,
        getFocusedLane,
    }
}