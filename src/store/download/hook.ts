import { useEffect, useState } from 'react'
import { state } from './state'

export const useDownloadList = () => {
  const [list, setList] = useState(state.list)

  useEffect(() => {
    const handleUpdate = () => {
      setList([...state.list])
    }
    global.state_event.on('downloadListUpdated', handleUpdate)
    return () => {
      global.state_event.off('downloadListUpdated', handleUpdate)
    }
  }, [])

  return list
}

export const useDownloadingCount = () => {
  const [count, setCount] = useState(state.downloadingCount)

  useEffect(() => {
    const handleUpdate = () => {
      setCount(state.downloadingCount)
    }
    global.state_event.on('downloadListUpdated', handleUpdate)
    return () => {
      global.state_event.off('downloadListUpdated', handleUpdate)
    }
  }, [])

  return count
}
