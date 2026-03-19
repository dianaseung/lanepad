export default function Welcome({ onOpenFolder }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw',
      height: '100vh',
      gap: 16,
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: '#e0e0e0' }}>Lanepad</h1>
      <p style={{ color: '#888', fontSize: 14 }}>Open a folder to get started</p>
      <button className="btn-primary" onClick={async () => {
        const f = await window.lanepad.openFolderDialog()
        if (f) onOpenFolder(f)
      }}>
        Open Folder
      </button>
    </div>
  )
}