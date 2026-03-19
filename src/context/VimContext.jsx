import { createContext, useContext, useState } from 'react'

const VimContext = createContext(null)

export function VimProvider({ children }) {
    const [vimState, setVimState] = useState({
        cursor: { laneIndex: null, cardIndex: null },
        insertMode: false,
        pendingDelete: false,
        pendingLaneDelete: false,
        laneDeleteBlocked: false,
        yanked: null,
        page: null,
    })

    return (
        <VimContext.Provider value={{ vimState, setVimState }}>
            {children}
        </VimContext.Provider>
    )
}

export function useVimContext() {
    return useContext(VimContext)
}