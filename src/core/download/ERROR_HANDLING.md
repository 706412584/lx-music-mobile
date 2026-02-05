# Download Error Handling and Retry System

## Overview

The download system implements comprehensive error handling and automatic retry functionality to ensure reliable downloads even in unstable network conditions.

## Features

### 1. Error Categorization

The system automatically categorizes errors into specific types:

- **NoWritePermission**: File system permission errors (EACCES)
- **FailToFetchSource**: Failed to obtain download URL
- **NetworkError**: Network connectivity issues (ETIMEDOUT, ECONNREFUSED, ECONNRESET, etc.)
- **Unknown**: Other unclassified errors

### 2. Automatic Retry with Exponential Backoff

- **Maximum Retry Attempts**: 3 attempts per download
- **Retry Delay**: Exponential backoff starting at 2 seconds
  - Attempt 1: 2 seconds
  - Attempt 2: 4 seconds
  - Attempt 3: 8 seconds
  - Maximum delay: 30 seconds

### 3. Smart Retry Logic

The system intelligently decides when to retry:

- ✅ **Auto-retry**: Network errors, fetch source errors, unknown errors
- ❌ **No auto-retry**: Permission errors (requires user intervention)
- ❌ **No auto-retry**: After reaching maximum retry attempts

### 4. Timeout Detection

Two types of timeout protection:

- **Download Timeout**: 5 minutes (300,000ms) - Maximum time for entire download
- **Stalled Timeout**: 1 minute (60,000ms) - Maximum time without progress updates

### 5. Retry Count Tracking

Each download task tracks:
- Current retry count
- Last retry timestamp
- Last error information
- Error reason

### 6. Status Text Updates

The UI displays helpful status messages:
- During retry: "网络错误 (2/3次重试后)"
- Max retries reached: "网络错误 (已达最大重试次数)"
- Error-specific messages for each failure reason

## Configuration Constants

```typescript
const MAX_RETRY_ATTEMPTS = 3        // Maximum retry attempts
const RETRY_DELAY_BASE = 2000       // Base retry delay (2 seconds)
const RETRY_DELAY_MAX = 30000       // Maximum retry delay (30 seconds)
const DOWNLOAD_TIMEOUT = 300000     // Download timeout (5 minutes)
const STALLED_TIMEOUT = 60000       // Stalled detection (1 minute)
```

## API Functions

### Error Handling

```typescript
// Internal error handler with automatic retry
handleDownloadError(id: string, error: Error, errorReason?: DownloadFailReasonType)

// Categorize error into specific type
categorizeError(error: Error): DownloadFailReasonType
```

### Retry Functions

```typescript
// Manual retry (resets retry count)
retryDownload(id: string): Promise<void>

// Internal retry (preserves retry count)
retryDownloadInternal(id: string): Promise<void>
```

### Timeout Management

```typescript
// Setup timeout checker for a download
setupTimeoutChecker(id: string, task: DownloadTaskInfo)

// Clear timeout checker
clearTimeoutChecker(id: string)

// Cleanup all timeout checkers (on app exit)
cleanupTimeoutCheckers()
```

### Monitoring

```typescript
// Get retry information for a task
getRetryInfo(id: string): {
  retryCount: number
  maxRetries: number
  canRetry: boolean
  lastError?: string
  lastRetryTime?: number
  errorReason?: DownloadFailReasonType
} | null

// Get queue information (includes retry stats)
getQueueInfo(): {
  queueLength: number
  downloadingCount: number
  maxDownloadCount: number
  tasks: Array<{
    id: string
    musicName: string
    status: string
    downloadStatus: DownloadStatusType
    retryCount: number
    errorReason?: DownloadFailReasonType
    lastError?: string
  }>
}
```

## Error Flow

### Network Error with Auto-Retry

```
Downloading → Error (Network) → Auto-retry scheduled
                                ↓ (after delay)
                              Pending → Preparing → Downloading
                                                    ↓ (if fails again)
                                                  Error → Auto-retry...
                                                    ↓ (after 3 attempts)
                                                  Error (Final)
```

### Permission Error (No Auto-Retry)

```
Downloading → Error (Permission) → Final Error State
                                   (User must fix permissions)
```

### Manual Retry

```
Error (any reason) → User clicks retry → Pending → Preparing → Downloading
(Retry count reset to 0)
```

## Implementation Details

### Task Information Structure

```typescript
interface DownloadTaskInfo {
  jobId?: number
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
  item: LX.Download.ListItem
  downloadStatus: DownloadStatusType
  errorReason?: DownloadFailReasonType
  lastProgressUpdate?: number
  retryCount: number              // NEW: Tracks retry attempts
  lastRetryTime?: number          // NEW: Last retry timestamp
  downloadStartTime?: number      // NEW: Download start time
  lastError?: Error               // NEW: Last error object
}
```

### Timeout Checker System

The system maintains a map of timeout checkers:

```typescript
const timeoutCheckers = new Map<string, NodeJS.Timeout>()
```

Each download gets a timeout checker that:
1. Monitors for stalled downloads (no progress for 60 seconds)
2. Automatically triggers error handling if stalled
3. Is cleared on completion, error, or pause

### Progress Update Integration

Progress updates now also update the `lastProgressUpdate` timestamp, which is used for stalled detection:

```typescript
progress: (res) => {
  const now = Date.now()
  task.lastProgressUpdate = now  // Used for stalled detection
  // ... rest of progress handling
}
```

## Best Practices

### For Users

1. **Network Errors**: The system will automatically retry up to 3 times
2. **Permission Errors**: Check app permissions and storage access
3. **Manual Retry**: Use the retry button to reset retry count and try again
4. **Persistent Failures**: Check network connection and storage space

### For Developers

1. **Error Logging**: All errors are logged with context for debugging
2. **Timeout Tuning**: Adjust timeout constants based on typical file sizes
3. **Retry Strategy**: Modify retry logic for specific error types if needed
4. **Monitoring**: Use `getQueueInfo()` and `getRetryInfo()` for debugging

## Testing

Comprehensive tests are available in `__tests__/errorHandling.test.ts`:

- Error categorization tests
- Retry configuration tests
- Auto-retry logic tests
- Timeout detection tests
- Retry count tracking tests
- Integration scenario tests

## Future Enhancements

Potential improvements:

1. **Adaptive Retry Delays**: Adjust delays based on error type
2. **Disk Space Error Type**: Add specific error type for ENOSPC
3. **Retry Statistics**: Track success rate after retries
4. **User Preferences**: Allow users to configure retry behavior
5. **Network Quality Detection**: Adjust timeouts based on connection speed
