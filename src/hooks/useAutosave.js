import { useEffect, useRef, useCallback } from 'react'

export function useAutosave({ data, onSave, debounceMs = 2000 }) {
    const timerRef = useRef(null)
    const latestData = useRef(data)
    const latestSave = useRef(onSave)

    // Keep refs current
    useEffect(() => { latestData.current = data }, [data])
    useEffect(() => { latestSave.current = onSave }, [onSave])

    const scheduleAutosave = useCallback(() => {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            latestSave.current()
        }, debounceMs)
    }, [debounceMs])

    const cancelAutosave = useCallback(() => {
        clearTimeout(timerRef.current)
    }, [])

    const flushAutosave = useCallback(() => {
        clearTimeout(timerRef.current)
        latestSave.current()
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimeout(timerRef.current)
    }, [])

    return { scheduleAutosave, cancelAutosave, flushAutosave }
}