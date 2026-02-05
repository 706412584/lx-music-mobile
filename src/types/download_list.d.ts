
// interface DownloadList {

// }


declare namespace LX {
  namespace Download {
    // Download states following state machine pattern
    type DownloadStatus = 'pending' | 'preparing' | 'downloading' | 'paused' | 'completed' | 'error'

    // Legacy status type for backward compatibility
    type DownloadTaskStatus = 'run'
    | 'waiting'
    | 'pause'
    | 'error'
    | 'completed'

    // Error reasons
    type DownloadFailReason = 'no-write-permission' | 'fail-to-fetch-source' | 'network-error' | 'unknown'

    type FileExt = 'mp3' | 'flac' | 'wav' | 'ape'

    interface ProgressInfo {
      progress: number
      speed: string
      downloaded: number
      total: number
      downloadedFormatted?: string
      totalFormatted?: string
      remainingTime?: string
    }

    interface DownloadTaskActionBase <A> {
      action: A
    }
    interface DownloadTaskActionData<A, D> extends DownloadTaskActionBase<A> {
      data: D
    }
    type DownloadTaskAction<A, D = undefined> = D extends undefined ? DownloadTaskActionBase<A> : DownloadTaskActionData<A, D>

    type DownloadTaskActions = DownloadTaskAction<'start'>
    | DownloadTaskAction<'complete'>
    | DownloadTaskAction<'refreshUrl'>
    | DownloadTaskAction<'statusText', string>
    | DownloadTaskAction<'progress', ProgressInfo>
    | DownloadTaskAction<'error', {
      error?: string
      message?: string
    }>

    interface ListItem {
      id: string
      isComplate: boolean
      status: DownloadTaskStatus
      statusText: string
      downloaded: number
      total: number
      progress: number
      speed: string
      downloadedFormatted?: string
      totalFormatted?: string
      remainingTime?: string
      metadata: {
        musicInfo: LX.Music.MusicInfoOnline
        url: string | null
        quality: LX.Quality
        ext: FileExt
        fileName: string
        filePath: string
      }
      // State machine fields
      downloadStatus?: DownloadStatus
      errorReason?: DownloadFailReason
      jobId?: number
      // Retry fields
      retryCount?: number
      lastRetryTime?: number
      lastError?: string
    }

    interface saveDownloadMusicInfo {
      list: ListItem[]
      addMusicLocationType: LX.AddMusicLocationType
    }
  }
}
