import { useSnapshot } from '@/utils/valtio'
import { state } from './state'

export const useDownloadList = () => {
  return useSnapshot(state).list
}

export const useDownloadingCount = () => {
  return useSnapshot(state).downloadingCount
}
