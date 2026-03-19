import './Topbar.css'

export default function Topbar({ activePage, pages, onSave, onClose }) {
  const activeMeta = pages.find(p => p.fileName === activePage)
  const title = activeMeta?.title ?? 'Lanepad'

  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-actions">
        <button
          className="btn-topbar"
          disabled={!activePage}
          onClick={onSave}
        >Save</button>
        <button
            className="btn-topbar btn-topbar-close"
            disabled={!activePage}
            onClick={onClose}
        >Close</button>
      </div>
    </div>
  )
}