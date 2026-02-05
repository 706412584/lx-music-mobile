export interface DownloadState {
  list: LX.Download.ListItem[]
  downloadingCount: number
}

export const state: DownloadState = {
  list: [],
  downloadingCount: 0,
}
