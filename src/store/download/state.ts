import { reactive } from '@/utils/valtio'

export interface DownloadState {
  list: LX.Download.ListItem[]
  downloadingCount: number
}

const createDownloadState = (): DownloadState => {
  return {
    list: [],
    downloadingCount: 0,
  }
}

export const state = reactive(createDownloadState())
