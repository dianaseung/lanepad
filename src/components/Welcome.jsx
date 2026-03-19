import { useState, useEffect } from 'react'
import './Welcome.css'

const SHORTCUTS = [
    { keys: ['Space'], description: 'Collapse / expand card' },
    { keys: ['n'], description: 'New card' },
    { keys: ['N'], description: 'New lane' },
    { keys: ['z'], description: 'Focus mode' },
    { keys: ['y'], description: 'Yank card' },
    { keys: ['p'], description: 'Paste card' },
    { keys: ['x'], description: 'Delete card (confirm)' },
    { keys: ['⇧', 'x'], description: 'Delete lane (confirm)' },
    { keys: ['⌘', 'S'], description: 'Save page' },
    { keys: ['⌘', 'N'], description: 'New page' },
    { keys: ['⌘', 'P'], description: 'Quick switcher' },
    { keys: ['⌘', 'F'], description: 'Find in page' },
    { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
    { keys: ['j', 'k'], description: 'Navigate lanes' },
    { keys: ['h', 'l'], description: 'Navigate cards' },
]

export default function Welcome({ onOpenFolder }) {
    const [recentFolders, setRecentFolders] = useState([])

    useEffect(() => {
        window.lanepad.getRecentFolders().then(folders => {
            setRecentFolders(folders ?? [])
        })
    }, [])

    return (
        <div className="welcome">
            {/* Logo */}
            <div className="welcome-logo">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    {/* Outer diamond */}
                    <path
                        d="M24 4L44 24L24 44L4 24Z"
                        stroke="#4a9eff"
                        strokeWidth="2"
                        fill="none"
                    />
                    {/* Inner lanes */}
                    <path
                        d="M24 12L36 24L24 36L12 24Z"
                        fill="#4a9eff22"
                        stroke="#4a9eff"
                        strokeWidth="1.5"
                    />
                    {/* Center dot */}
                    <circle cx="24" cy="24" r="3" fill="#4a9eff" />
                    {/* Lane dividers */}
                    <line x1="4" y1="24" x2="12" y2="24" stroke="#4a9eff66" strokeWidth="1" />
                    <line x1="36" y1="24" x2="44" y2="24" stroke="#4a9eff66" strokeWidth="1" />
                    <line x1="24" y1="4" x2="24" y2="12" stroke="#4a9eff66" strokeWidth="1" />
                    <line x1="24" y1="36" x2="24" y2="44" stroke="#4a9eff66" strokeWidth="1" />
                </svg>
                <div className="welcome-wordmark">
                    <span className="welcome-wordmark-lane">Lane</span>
                    <span className="welcome-wordmark-pad">pad</span>
                </div>
            </div>

            <p className="welcome-tagline">vim-like code scratchpad</p>

            {/* Main content */}
            <div className="welcome-content">
                {/* Left: recent folders */}
                <div className="welcome-section">
                    <h3 className="welcome-section-title">Recent</h3>
                    {recentFolders.length === 0 ? (
                        <p className="welcome-empty">No recent folders</p>
                    ) : (
                        <div className="welcome-recent-list">
                            {recentFolders.map(folder => (
                                <button
                                    key={folder}
                                    className="welcome-recent-item"
                                    onClick={() => onOpenFolder(folder)}
                                >
                                    <span className="welcome-recent-icon">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
                                        </svg>
                                    </span>
                                    <span className="welcome-recent-name">
                                        {folder.split('/').pop()}
                                    </span>
                                    <span className="welcome-recent-path">
                                        {folder}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        className="welcome-open-btn"
                        onClick={async () => {
                            const f = await window.lanepad.openFolderDialog()
                            if (f) onOpenFolder(f)
                        }}
                    >
                        Open Folder
                    </button>
                </div>

                {/* Right: shortcuts */}
                <div className="welcome-section">
                    <h3 className="welcome-section-title">Shortcuts</h3>
                    <div className="welcome-shortcuts">
                        {SHORTCUTS.map((s, i) => (
                            <div key={i} className="welcome-shortcut-row">
                                <div className="welcome-shortcut-keys">
                                    {s.keys.map((k, j) => (
                                        <span key={j} className="welcome-key">{k}</span>
                                    ))}
                                </div>
                                <span className="welcome-shortcut-desc">{s.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}