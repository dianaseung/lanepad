import { nanoid } from 'nanoid'

export function newPage(title = 'Untitled') {
  return {
    title,
    direction: 'horizontal', // 'horizontal' | 'vertical'
    lanes: [],
  }
}

export function newLane(name = 'New Lane') {
  return {
    id: nanoid(),
    name,
    collapsed: false,
    cards: [],
  }
}

export function newCard(title = 'Untitled Card', type = 'code') {
  return {
    id: nanoid(),
    title,
    type,
    content: '',
    language: 'javascript',
    color: null,
    collapsed: false,
  }
}