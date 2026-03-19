import { useState, useEffect, useCallback, useRef } from 'react'

export function useVim({ page, addLane, addCard, deleteCard, reorderCards, onSave, onNewPage }) {
    // { laneIndex, cardIndex } — null cardIndex means lane is focused
    const [cursor, setCursor] = useState({ laneIndex: 0, cardIndex: null })
    const [yanked, setYanked] = useState(null)
    const [pendingG, setPendingG] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(false)
    const gTimer = useRef(null)
    const deleteTimer = useRef(null)

    const isInsertMode = useCallback(() => {
        const active = document.activeElement
        if (!active) return false
        const tag = active.tagName.toLowerCase()
        return tag === 'input' || tag === 'textarea' || active.closest('.cm-editor')
    }, [])

    // Clamp cursor to valid bounds
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

    // Focused card getter
    const getFocusedCard = useCallback(() => {
        if (!page || cursor.cardIndex === null) return null
        const lane = page.lanes[cursor.laneIndex]
        if (!lane) return null
        return lane.cards[cursor.cardIndex] ?? null
    }, [page, cursor])

    // Focused lane getter
    const getFocusedLane = useCallback(() => {
        if (!page) return null
        return page.lanes[cursor.laneIndex] ?? null
    }, [page, cursor])

    useEffect(() => {
        if (!page) return

        function handleKeyDown(e) {
            // Cmd+S — always works
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                onSave?.()
                return
            }

            // Cmd+N — new page
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault()
                onNewPage?.()
                return
            }

            // Escape — always blurs to normal mode
            if (e.key === 'Escape') {
                document.activeElement?.blur()
                return
            }

            // Everything below only fires in normal mode
            if (isInsertMode()) return

            const lanes = page.lanes
            if (!lanes) return

            const { laneIndex, cardIndex } = cursor
            const currentLane = lanes[laneIndex]

            // ── g g sequence ─────────────────────────────────────
            if (e.key === 'g') {
                if (pendingG) {
                    // Second g — jump to first card
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

            // Clear pending g if another key pressed
            if (pendingG) {
                clearTimeout(gTimer.current)
                setPendingG(false)
            }

            switch (e.key) {

                // ── Navigation ───────────────────────────────────

                case 'j': {
                    e.preventDefault()
                    if (!currentLane || currentLane.cards.length === 0) break
                    const nextIndex = cardIndex === null ? 0
                        : Math.min(cardIndex + 1, currentLane.cards.length - 1)
                    setCursor({ laneIndex, cardIndex: nextIndex })
                    break
                }

                case 'k': {
                    e.preventDefault()
                    if (!currentLane || currentLane.cards.length === 0) break
                    const prevIndex = cardIndex === null
                        ? currentLane.cards.length - 1
                        : Math.max(cardIndex - 1, 0)
                    setCursor({ laneIndex, cardIndex: prevIndex })
                    break
                }

                case 'h': {
                    e.preventDefault()
                    const newLaneIndex = Math.max(laneIndex - 1, 0)
                    setCursor(clampCursor(newLaneIndex, cardIndex, lanes))
                    break
                }

                case 'l': {
                    e.preventDefault()
                    const newLaneIndex = Math.min(laneIndex + 1, lanes.length - 1)
                    setCursor(clampCursor(newLaneIndex, cardIndex, lanes))
                    break
                }

                case 'G': {
                    e.preventDefault()
                    if (currentLane && currentLane.cards.length > 0) {
                        setCursor({ laneIndex, cardIndex: currentLane.cards.length - 1 })
                    }
                    break
                }

                // ── Card actions ─────────────────────────────────

                case ' ': {
                    e.preventDefault()
                    // Toggle collapse handled by Canvas via focused card id
                    break
                }

                case 'x': {
                    e.preventDefault()
                    const card = getFocusedCard()
                    if (!card) break
                    if (pendingDelete) {
                        clearTimeout(deleteTimer.current)
                        setPendingDelete(false)
                        deleteCard(laneIndex, card.id)
                        // Move cursor up if possible
                        const newCardIndex = cardIndex > 0 ? cardIndex - 1
                            : currentLane.cards.length > 1 ? 0 : null
                        setCursor({ laneIndex, cardIndex: newCardIndex })
                    } else {
                        setPendingDelete(true)
                        deleteTimer.current = setTimeout(() => setPendingDelete(false), 1500)
                    }
                    break
                }

                case 'y': {
                    e.preventDefault()
                    const card = getFocusedCard()
                    if (card) setYanked({ ...card })
                    break
                }

                case 'p': {
                    e.preventDefault()
                    if (!yanked || !currentLane) break
                    const insertIndex = cardIndex === null
                        ? currentLane.cards.length
                        : cardIndex + 1
                    pasteCard(laneIndex, insertIndex, yanked)
                    setCursor({ laneIndex, cardIndex: insertIndex })
                    break
                }

                // ── Move card within lane ────────────────────────

                case 'Control': break // handled below

                default: {
                    // Ctrl+j — move card down
                    if (e.key === 'j' && e.ctrlKey) {
                        e.preventDefault()
                        if (cardIndex === null || !currentLane) break
                        const newIndex = Math.min(cardIndex + 1, currentLane.cards.length - 1)
                        if (newIndex !== cardIndex) {
                            const newCards = [...currentLane.cards]
                            const [card] = newCards.splice(cardIndex, 1)
                            newCards.splice(newIndex, 0, card)
                            reorderCards(currentLane.id, newCards)
                            setCursor({ laneIndex, cardIndex: newIndex })
                        }
                        break
                    }
                    // Ctrl+k — move card up
                    if (e.key === 'k' && e.ctrlKey) {
                        e.preventDefault()
                        if (cardIndex === null || !currentLane) break
                        const newIndex = Math.max(cardIndex - 1, 0)
                        if (newIndex !== cardIndex) {
                            const newCards = [...currentLane.cards]
                            const [card] = newCards.splice(cardIndex, 1)
                            newCards.splice(newIndex, 0, card)
                            reorderCards(currentLane.id, newCards)
                            setCursor({ laneIndex, cardIndex: newIndex })
                        }
                        break
                    }
                }
            }

            // ── Lane/page actions (outside switch for clarity) ───

            if (e.key === 'n' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                e.preventDefault()
                addCard(laneIndex)
                // Focus new card title after render
                setTimeout(() => {
                    const newCardIndex = currentLane ? currentLane.cards.length : 0
                    setCursor({ laneIndex, cardIndex: newCardIndex })
                }, 50)
            }

            if (e.key === 'N' && e.shiftKey) {
                e.preventDefault()
                addLane()
                setTimeout(() => {
                    setCursor({ laneIndex: lanes.length, cardIndex: null })
                }, 50)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [page, cursor, pendingG, pendingDelete, yanked, isInsertMode])

    function pasteCard(laneIndex, insertIndex, card) {
        // Implemented in Canvas and passed down
    }

    return {
        cursor,
        setCursor,
        yanked,
        pendingDelete,
        getFocusedCard,
        getFocusedLane,
    }
}