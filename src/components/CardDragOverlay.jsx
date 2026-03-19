import './CardDragOverlay.css'

export default function CardDragOverlay({ card }) {
  return (
    <div className="card-drag-overlay">
      <span className="card-drag-overlay-title">{card.title}</span>
      <span className="card-drag-overlay-type">{card.type}</span>
    </div>
  )
}