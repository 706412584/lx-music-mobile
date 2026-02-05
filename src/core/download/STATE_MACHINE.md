# Download State Machine

## Overview

The download state machine manages the lifecycle of download tasks with well-defined states and transitions. This ensures predictable behavior and makes the download system easier to maintain and debug.

## States

### 1. Pending (pending)
- **Description**: Task is waiting to be processed
- **Legacy Status**: `waiting`
- **Can transition to**: Preparing, Error

### 2. Preparing (preparing)
- **Description**: Fetching download URL and preparing resources
- **Legacy Status**: `waiting`
- **Can transition to**: Downloading, Error

### 3. Downloading (downloading)
- **Description**: Actively downloading the file
- **Legacy Status**: `run`
- **Can transition to**: Paused, Completed, Error

### 4. Paused (paused)
- **Description**: Download has been paused by user
- **Legacy Status**: `pause`
- **Can transition to**: Pending, Error

### 5. Completed (completed)
- **Description**: Download finished successfully (terminal state)
- **Legacy Status**: `completed`
- **Can transition to**: None (terminal state)

### 6. Error (error)
- **Description**: Download failed with an error
- **Legacy Status**: `error`
- **Can transition to**: Pending (retry)

## State Transition Diagram

```
Pending ──────> Preparing ──────> Downloading ──────> Completed
   │                │                   │
   │                │                   ├──────> Paused ──────> Pending
   │                │                   │
   └────────────────┴───────────────────┴──────> Error ──────> Pending (retry)
```

## Error Reasons

When a download enters the Error state, it includes a reason:

1. **NoWritePermission**: No permission to write to storage
2. **FailToFetchSource**: Failed to get download URL
3. **NetworkError**: Network connection issue
4. **Unknown**: Unspecified error

## Usage

### Checking State Transitions

```typescript
import { isValidTransition, DownloadStatus } from '@/core/download/stateMachine'

// Check if transition is valid
if (isValidTransition(currentStatus, newStatus)) {
  // Perform transition
}
```

### Getting Status Text

```typescript
import { getStatusText, DownloadStatus, DownloadFailReason } from '@/core/download/stateMachine'

// Get display text for status
const text = getStatusText(DownloadStatus.Downloading) // "下载中..."

// Get error-specific text
const errorText = getStatusText(
  DownloadStatus.Error, 
  DownloadFailReason.NetworkError
) // "网络错误"
```

### State Checks

```typescript
import { 
  canPause, 
  canResume, 
  canRetry,
  isActiveState,
  isTerminalState 
} from '@/core/download/stateMachine'

// Check if operations are allowed
if (canPause(status)) {
  // Show pause button
}

if (canResume(status)) {
  // Show resume button
}

if (canRetry(status)) {
  // Show retry button
}

// Check state type
if (isActiveState(status)) {
  // Download is actively running
}

if (isTerminalState(status)) {
  // Download is finished (no more transitions)
}
```

### Legacy Compatibility

The state machine maintains backward compatibility with the old status system:

```typescript
import { toLegacyStatus, fromLegacyStatus } from '@/core/download/stateMachine'

// Convert to legacy status for UI components
const legacyStatus = toLegacyStatus(DownloadStatus.Downloading) // "run"

// Convert from legacy status
const newStatus = fromLegacyStatus('run') // DownloadStatus.Downloading
```

## Implementation Details

### State Transition Validation

All state transitions are validated before being applied. Invalid transitions are logged as warnings and rejected:

```typescript
const transitionTaskState = (
  task: DownloadTaskInfo,
  newStatus: DownloadStatusType,
  errorReason?: DownloadFailReasonType
): boolean => {
  if (!isValidTransition(task.downloadStatus, newStatus)) {
    console.warn(`Invalid state transition: ${task.downloadStatus} -> ${newStatus}`)
    return false
  }
  // Apply transition...
  return true
}
```

### Automatic Status Text

Status text is automatically generated based on the current state and error reason:

- Pending: "等待中..."
- Preparing: "准备下载..."
- Downloading: "下载中..."
- Paused: "已暂停"
- Completed: "下载完成"
- Error: Error-specific message

## Benefits

1. **Predictable Behavior**: Clear rules for what transitions are allowed
2. **Type Safety**: TypeScript ensures correct state usage
3. **Easier Debugging**: State transitions are logged and validated
4. **Better UX**: Appropriate UI actions based on current state
5. **Maintainability**: Centralized state logic
6. **Backward Compatible**: Works with existing code using legacy statuses

## Testing

The state machine includes comprehensive tests covering:
- Valid and invalid state transitions
- Status text generation
- Error text generation
- Legacy status conversion
- State check functions

Run tests with:
```bash
npm test src/core/download/__tests__/stateMachine.test.ts
```

## Future Enhancements

Possible improvements:
1. Add state transition events/callbacks
2. Implement state history tracking
3. Add metrics for state durations
4. Support for partial downloads/resume from byte offset
5. Priority queue based on state
