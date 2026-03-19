import { useState } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import './Sidebar.css'

export default function Sidebar({
    folder, pages, activePage,
    onSelectPage, onNewPage, onDeletePage, onRenamePage,
    collapsed, onToggleCollapse,
}) {
    const folderName = folder.split('/').pop()

    if (collapsed) {
        return (
            <div className="sidebar sidebar-collapsed" onClick={onToggleCollapse} title="Expand sidebar (⌘B)">
                <div className="sidebar-collapsed-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                    </svg>
                </div>
            </div>
        )
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <span className="sidebar-folder-name">{folderName}</span>
                <div className="sidebar-header-actions">
                    <button
                        className="sidebar-new-btn"
                        title="New page"
                        onClick={onNewPage}
                    >+</button>
                    <button
                        className="sidebar-collapse-btn"
                        title="Collapse sidebar (⌘B)"
                        onClick={onToggleCollapse}
                    >‹</button>
                </div>
            </div>

            <div className="sidebar-list">
                {pages.length === 0 && (
                    <div className="sidebar-empty">No pages yet</div>
                )}
                {pages.map(({ fileName, title }) => (
                    <PageItem
                        key={fileName}
                        fileName={fileName}
                        title={title}
                        isActive={activePage === fileName}
                        onSelect={() => onSelectPage(fileName)}
                        onDelete={() => onDeletePage(fileName)}
                        onRenameFile={(newFileName) => onRenamePage(fileName, newFileName)}
                    />
                ))}
            </div>

            <div className="sidebar-footer">
                <button
                    className="sidebar-open-btn"
                    onClick={async () => {
                        const f = await window.lanepad.openFolderDialog()
                        if (f) window.location.reload()
                    }}
                >
                    Change Folder
                </button>
            </div>
        </div>
    )
}

function PageItem({ fileName, title, isActive, onSelect, onDelete, onRenameFile }) {
    const [renamingFile, setRenamingFile] = useState(false)
    const [renameValue, setRenameValue] = useState(fileName.replace('.lanepad', ''))

    function startRename() {
        setRenameValue(fileName.replace('.lanepad', ''))
        setRenamingFile(true)
    }

    function commitRename() {
        setRenamingFile(false)
        const sanitized = renameValue
            .trim()
            .replace(/[/\\?%*:|"<>]/g, '')
            .replace(/\s+/g, '-')
        if (sanitized && sanitized + '.lanepad' !== fileName) {
            onRenameFile(sanitized + '.lanepad')
        } else {
            setRenameValue(fileName.replace('.lanepad', ''))
        }
    }

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                <div
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={onSelect}
                >
                    <span className="sidebar-item-icon">⬜</span>
                    <div className="sidebar-item-text">
                        <span className="sidebar-item-title">{title}</span>
                        {renamingFile ? (
                            <span className="sidebar-item-rename-wrap">
                                <input
                                    className="sidebar-rename-input"
                                    value={renameValue}
                                    autoFocus
                                    onChange={e => setRenameValue(e.target.value)}
                                    onBlur={commitRename}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') commitRename()
                                        if (e.key === 'Escape') {
                                            setRenameValue(fileName.replace('.lanepad', ''))
                                            setRenamingFile(false)
                                        }
                                        e.stopPropagation()
                                    }}
                                    onClick={e => e.stopPropagation()}
                                />
                                <span className="sidebar-item-ext">.lanepad</span>
                            </span>
                        ) : (
                            <span
                                className="sidebar-item-filename"
                                onDoubleClick={e => {
                                    e.stopPropagation()
                                    startRename()
                                }}
                                title="Double-click to rename file"
                            >
                                {fileName}
                            </span>
                        )}
                    </div>
                </div>
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
                <ContextMenu.Content className="context-menu">
                    <ContextMenu.Item
                        className="context-menu-item"
                        onSelect={startRename}
                    >
                        Rename file
                    </ContextMenu.Item>
                    <ContextMenu.Separator className="context-menu-separator" />
                    <ContextMenu.Item
                        className="context-menu-item destructive"
                        onSelect={onDelete}
                    >
                        Delete
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    )
}