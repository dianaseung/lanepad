import { useState } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import './Sidebar.css'

export default function Sidebar({
  folder, pages, activePage,
  onSelectPage, onNewPage, onDeletePage, onRefresh
}) {
  const folderName = folder.split('/').pop()

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-folder-name">{folderName}</span>
        <button
          className="sidebar-new-btn"
          title="New page"
          onClick={onNewPage}
        >+</button>
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
          />
        ))}
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-open-btn"
          onClick={async () => {
            const f = await window.lanepad.openFolderDialog()
            if (f) window.location.reload() // simplest way to re-init with new folder
          }}
        >
          Change Folder
        </button>
      </div>
    </div>
  )
}

function PageItem({ fileName, title, isActive, onSelect, onDelete }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          className={`sidebar-item ${isActive ? 'active' : ''}`}
          onClick={onSelect}
        >
          <span className="sidebar-item-icon">⬜</span>
          <span className="sidebar-item-label">{title}</span>
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="context-menu">
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