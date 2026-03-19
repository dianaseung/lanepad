import { useState, useCallback } from 'react'
import { nanoid } from 'nanoid'
import { newLane, newCard } from '../utils/pageDefaults.js'

export function usePage(initialData) {
  const [page, setPage] = useState(initialData)

  const setTitle = useCallback((title) => {
    setPage(p => ({ ...p, title }))
  }, [])

  const setDirection = useCallback((direction) => {
    setPage(p => ({ ...p, direction }))
  }, [])

  // ── Lanes ────────────────────────────────────────────────────

  const addLane = useCallback(() => {
    setPage(p => ({ ...p, lanes: [...p.lanes, newLane()] }))
  }, [])

  const updateLane = useCallback((laneId, changes) => {
    setPage(p => ({
      ...p,
      lanes: p.lanes.map(l => l.id === laneId ? { ...l, ...changes } : l),
    }))
  }, [])

  const deleteLane = useCallback((laneId) => {
    setPage(p => ({ ...p, lanes: p.lanes.filter(l => l.id !== laneId) }))
  }, [])

  const reorderLanes = useCallback((newLanes) => {
    setPage(p => ({ ...p, lanes: newLanes }))
  }, [])

  // ── Cards ────────────────────────────────────────────────────

    const addCard = useCallback((laneId, type = 'code', insertIndex = null, template = null) => {
        setPage(p => ({
            ...p,
            lanes: p.lanes.map(l => {
                if (l.id !== laneId) return l
                const card = template
                    ? { ...template, id: nanoid() }
                    : newCard('Untitled Card', type)
                const cards = [...l.cards]
                if (insertIndex === null) {
                    cards.push(card)
                } else {
                    cards.splice(insertIndex, 0, card)
                }
                return { ...l, cards }
            }),
        }))
    }, [])

  const updateCard = useCallback((laneId, cardId, changes) => {
    setPage(p => ({
      ...p,
      lanes: p.lanes.map(l =>
        l.id === laneId
          ? {
              ...l,
              cards: l.cards.map(c =>
                c.id === cardId ? { ...c, ...changes } : c
              ),
            }
          : l
      ),
    }))
  }, [])

  const deleteCard = useCallback((laneId, cardId) => {
    setPage(p => ({
      ...p,
      lanes: p.lanes.map(l =>
        l.id === laneId
          ? { ...l, cards: l.cards.filter(c => c.id !== cardId) }
          : l
      ),
    }))
  }, [])

  const reorderCards = useCallback((laneId, newCards) => {
    setPage(p => ({
      ...p,
      lanes: p.lanes.map(l =>
        l.id === laneId ? { ...l, cards: newCards } : l
      ),
    }))
  }, [])

  // Move card between lanes
  const moveCard = useCallback((cardId, fromLaneId, toLaneId, toIndex) => {
    setPage(p => {
      const fromLane = p.lanes.find(l => l.id === fromLaneId)
      const card = fromLane?.cards.find(c => c.id === cardId)
      if (!card) return p

      return {
        ...p,
        lanes: p.lanes.map(l => {
          if (l.id === fromLaneId) {
            return { ...l, cards: l.cards.filter(c => c.id !== cardId) }
          }
          if (l.id === toLaneId) {
            const newCards = [...l.cards]
            newCards.splice(toIndex, 0, card)
            return { ...l, cards: newCards }
          }
          return l
        }),
      }
    })
  }, [])

  return {
    page,
    setTitle,
    setDirection,
    addLane,
    updateLane,
    deleteLane,
    reorderLanes,
    addCard,
    updateCard,
    deleteCard,
    reorderCards,
    moveCard,
  }
}