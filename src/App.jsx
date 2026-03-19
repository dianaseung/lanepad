import { useState, useEffect, useRef } from 'react'
import Canvas from './components/Canvas.jsx'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Welcome from './components/Welcome.jsx'
import './App.css'

export default function App() {
  const [folder, setFolder] = useState(null)
  const [pages, setPages] = useState([])
  const [activePage, setActivePage] = useState(null) // fileName string

  const saveRef = useRef(null)
  const exportRef = useRef(null)

  useEffect(() => {
    window.lanepad.getLastFolder().then(f => {
      if (f) openFolder(f)
    })
  }, [])

  async function openFolder(folderPath) {
    setFolder(folderPath)
    await refreshPages(folderPath)
    window.lanepad.setLastFolder(folderPath)
  }

  async function refreshPages(folderPath) {
    const files = await window.lanepad.listPages(folderPath)
    // Load title from each file
    const pagesWithTitles = await Promise.all(
      files.map(async fileName => {
        const data = await window.lanepad.readPage(folderPath, fileName)
        return { fileName, title: data?.title ?? fileName.replace('.lanepad', '') }
      })
    )
    setPages(pagesWithTitles)
    return pagesWithTitles
  }

  async function handleNewPage() {
    const fileName = `untitled-${Date.now()}.lanepad`
    const data = {
      title: 'Untitled',
      direction: 'horizontal',
      lanes: [],
    }
    await window.lanepad.writePage(folder, fileName, data)
    const updated = await refreshPages(folder)
    setActivePage(fileName)
  }

  async function handleDeletePage(fileName) {
    await window.lanepad.deletePage(folder, fileName)
    if (activePage === fileName) setActivePage(null)
    await refreshPages(folder)
  }

  return (
    <div className="app-shell">
      {folder ? (
        <>
          <Sidebar
            folder={folder}
            pages={pages}
            activePage={activePage}
            onSelectPage={setActivePage}
            onNewPage={handleNewPage}
            onRefresh={() => refreshPages(folder)}
            onDeletePage={handleDeletePage}
          />
          <div className="main-area">
            <Topbar
              activePage={activePage}
              pages={pages}
              onSave={() => saveRef.current?.()}
              onExport={() => exportRef.current?.()}
            />
            <div className="canvas-area">
              {activePage
                ? <Canvas
                    key={activePage}
                    folder={folder}
                    fileName={activePage}
                    onSaveReady={(fn) => (saveRef.current = fn)}
                    onExportReady={(fn) => (exportRef.current = fn)}
                    onRefresh={() => refreshPages(folder)}
                  />
                : <div style={{ color: '#555', padding: 40, fontSize: 14 }}>Select or create a page</div>
              }
            </div>
          </div>
        </>
      ) : (
        <Welcome onOpenFolder={openFolder} />
      )}
    </div>
  )
}