import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Welcome from './components/Welcome.jsx'
import Canvas from './components/Canvas.jsx'
import QuickSwitcher from './components/QuickSwitcher.jsx'
import StatusBar from './components/StatusBar.jsx'
import './App.css'

export default function App() {
    const [folder, setFolder] = useState(null)
    const [pages, setPages] = useState([])
    const [activePage, setActivePage] = useState(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false)

    const saveRef = useRef(null)
    const exportRef = useRef(null)

    useEffect(() => {
        window.lanepad.getLastFolder().then(f => {
            if (f) openFolder(f)
        })
    }, [])

    // Cmd+B and Cmd+P at app level
    useEffect(() => {
        function handleKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault()
                setSidebarCollapsed(v => !v)
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault()
                setQuickSwitcherOpen(v => !v)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    async function openFolder(folderPath) {
        setFolder(folderPath)
        await refreshPages(folderPath)
        window.lanepad.setLastFolder(folderPath)
    }

    async function refreshPages(folderPath) {
        const files = await window.lanepad.listPages(folderPath)
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
        const timestamp = Date.now()
        const fileName = `Untitled-${timestamp}.lanepad`
        const data = {
            title: 'Untitled',
            direction: 'horizontal',
            lanes: [],
        }
        await window.lanepad.writePage(folder, fileName, data)
        await refreshPages(folder)
        setActivePage(fileName)
    }

    async function handleDeletePage(fileName) {
        await window.lanepad.deletePage(folder, fileName)
        if (activePage === fileName) setActivePage(null)
        await refreshPages(folder)
    }

    async function handleRenamePage(oldFileName, newFileName) {
        await window.lanepad.renamePage(folder, oldFileName, newFileName)
        if (activePage === oldFileName) setActivePage(newFileName)
        await refreshPages(folder)
    }

    return (
        <div className="app-shell">
            <div className="app-body">
                {folder ? (
                    <>
                        <Sidebar
                            folder={folder}
                            pages={pages}
                            activePage={activePage}
                            onSelectPage={setActivePage}
                            onNewPage={handleNewPage}
                            onDeletePage={handleDeletePage}
                            onRenamePage={handleRenamePage}
                            collapsed={sidebarCollapsed}
                            onToggleCollapse={() => setSidebarCollapsed(v => !v)}
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
                                        onSaveReady={(fn) => { saveRef.current = fn }}
                                        onExportReady={(fn) => { exportRef.current = fn }}
                                        onRefresh={() => refreshPages(folder)}
                                        onFileRenamed={(newFileName) => {
                                            setActivePage(newFileName)
                                            refreshPages(folder)
                                        }}
                                    />
                                    : <div style={{ color: '#555', padding: 40, fontSize: 14 }}>
                                        Select or create a page
                                    </div>
                                }
                            </div>
                        </div>
                    </>
                ) : (
                    <Welcome onOpenFolder={openFolder} />
                )}
            </div>
            <StatusBar />

            {quickSwitcherOpen && (
                <QuickSwitcher
                    pages={pages}
                    onSelect={(fileName) => {
                        setActivePage(fileName)
                        setQuickSwitcherOpen(false)
                    }}
                    onClose={() => setQuickSwitcherOpen(false)}
                />
            )}
        </div>
    )
}