/**
 * State Machine Tests
 * 
 * Tests for the download state machine to ensure proper state transitions
 */

import {
  DownloadStatus,
  DownloadFailReason,
  isValidTransition,
  getStatusText,
  getErrorText,
  toLegacyStatus,
  fromLegacyStatus,
  isTerminalState,
  isActiveState,
  canRetry,
  canPause,
  canResume,
  canRemove,
} from '../stateMachine'

describe('Download State Machine', () => {
  describe('State Transitions', () => {
    test('should allow valid transitions from Pending', () => {
      expect(isValidTransition(DownloadStatus.Pending, DownloadStatus.Preparing)).toBe(true)
      expect(isValidTransition(DownloadStatus.Pending, DownloadStatus.Error)).toBe(true)
    })

    test('should reject invalid transitions from Pending', () => {
      expect(isValidTransition(DownloadStatus.Pending, DownloadStatus.Downloading)).toBe(false)
      expect(isValidTransition(DownloadStatus.Pending, DownloadStatus.Completed)).toBe(false)
      expect(isValidTransition(DownloadStatus.Pending, DownloadStatus.Paused)).toBe(false)
    })

    test('should allow valid transitions from Preparing', () => {
      expect(isValidTransition(DownloadStatus.Preparing, DownloadStatus.Downloading)).toBe(true)
      expect(isValidTransition(DownloadStatus.Preparing, DownloadStatus.Error)).toBe(true)
    })

    test('should allow valid transitions from Downloading', () => {
      expect(isValidTransition(DownloadStatus.Downloading, DownloadStatus.Paused)).toBe(true)
      expect(isValidTransition(DownloadStatus.Downloading, DownloadStatus.Completed)).toBe(true)
      expect(isValidTransition(DownloadStatus.Downloading, DownloadStatus.Error)).toBe(true)
    })

    test('should allow valid transitions from Paused', () => {
      expect(isValidTransition(DownloadStatus.Paused, DownloadStatus.Pending)).toBe(true)
      expect(isValidTransition(DownloadStatus.Paused, DownloadStatus.Error)).toBe(true)
    })

    test('should allow retry from Error', () => {
      expect(isValidTransition(DownloadStatus.Error, DownloadStatus.Pending)).toBe(true)
    })

    test('should not allow transitions from Completed', () => {
      expect(isValidTransition(DownloadStatus.Completed, DownloadStatus.Pending)).toBe(false)
      expect(isValidTransition(DownloadStatus.Completed, DownloadStatus.Error)).toBe(false)
    })
  })

  describe('Status Text', () => {
    test('should return correct status text for each state', () => {
      expect(getStatusText(DownloadStatus.Pending)).toBe('等待中...')
      expect(getStatusText(DownloadStatus.Preparing)).toBe('准备下载...')
      expect(getStatusText(DownloadStatus.Downloading)).toBe('下载中...')
      expect(getStatusText(DownloadStatus.Paused)).toBe('已暂停')
      expect(getStatusText(DownloadStatus.Completed)).toBe('下载完成')
      expect(getStatusText(DownloadStatus.Error)).toBe('下载失败')
    })

    test('should return error-specific text for Error state', () => {
      expect(getStatusText(DownloadStatus.Error, DownloadFailReason.NoWritePermission)).toBe('无写入权限')
      expect(getStatusText(DownloadStatus.Error, DownloadFailReason.FailToFetchSource)).toBe('获取下载链接失败')
      expect(getStatusText(DownloadStatus.Error, DownloadFailReason.NetworkError)).toBe('网络错误')
      expect(getStatusText(DownloadStatus.Error, DownloadFailReason.Unknown)).toBe('下载失败')
    })
  })

  describe('Error Text', () => {
    test('should return correct error text for each reason', () => {
      expect(getErrorText(DownloadFailReason.NoWritePermission)).toBe('无写入权限')
      expect(getErrorText(DownloadFailReason.FailToFetchSource)).toBe('获取下载链接失败')
      expect(getErrorText(DownloadFailReason.NetworkError)).toBe('网络错误')
      expect(getErrorText(DownloadFailReason.Unknown)).toBe('下载失败')
    })

    test('should return default text for undefined reason', () => {
      expect(getErrorText(undefined)).toBe('下载失败')
    })
  })

  describe('Legacy Status Conversion', () => {
    test('should convert new status to legacy status', () => {
      expect(toLegacyStatus(DownloadStatus.Pending)).toBe('waiting')
      expect(toLegacyStatus(DownloadStatus.Preparing)).toBe('waiting')
      expect(toLegacyStatus(DownloadStatus.Downloading)).toBe('run')
      expect(toLegacyStatus(DownloadStatus.Paused)).toBe('pause')
      expect(toLegacyStatus(DownloadStatus.Completed)).toBe('completed')
      expect(toLegacyStatus(DownloadStatus.Error)).toBe('error')
    })

    test('should convert legacy status to new status', () => {
      expect(fromLegacyStatus('waiting')).toBe(DownloadStatus.Pending)
      expect(fromLegacyStatus('run')).toBe(DownloadStatus.Downloading)
      expect(fromLegacyStatus('pause')).toBe(DownloadStatus.Paused)
      expect(fromLegacyStatus('completed')).toBe(DownloadStatus.Completed)
      expect(fromLegacyStatus('error')).toBe(DownloadStatus.Error)
    })
  })

  describe('State Checks', () => {
    test('should identify terminal states', () => {
      expect(isTerminalState(DownloadStatus.Completed)).toBe(true)
      expect(isTerminalState(DownloadStatus.Error)).toBe(false)
      expect(isTerminalState(DownloadStatus.Pending)).toBe(false)
    })

    test('should identify active states', () => {
      expect(isActiveState(DownloadStatus.Downloading)).toBe(true)
      expect(isActiveState(DownloadStatus.Preparing)).toBe(true)
      expect(isActiveState(DownloadStatus.Pending)).toBe(false)
      expect(isActiveState(DownloadStatus.Paused)).toBe(false)
    })

    test('should check if retry is allowed', () => {
      expect(canRetry(DownloadStatus.Error)).toBe(true)
      expect(canRetry(DownloadStatus.Completed)).toBe(false)
      expect(canRetry(DownloadStatus.Downloading)).toBe(false)
    })

    test('should check if pause is allowed', () => {
      expect(canPause(DownloadStatus.Downloading)).toBe(true)
      expect(canPause(DownloadStatus.Preparing)).toBe(true)
      expect(canPause(DownloadStatus.Pending)).toBe(true)
      expect(canPause(DownloadStatus.Paused)).toBe(false)
      expect(canPause(DownloadStatus.Completed)).toBe(false)
    })

    test('should check if resume is allowed', () => {
      expect(canResume(DownloadStatus.Paused)).toBe(true)
      expect(canResume(DownloadStatus.Downloading)).toBe(false)
      expect(canResume(DownloadStatus.Completed)).toBe(false)
    })

    test('should check if removal is allowed', () => {
      expect(canRemove(DownloadStatus.Pending)).toBe(true)
      expect(canRemove(DownloadStatus.Downloading)).toBe(true)
      expect(canRemove(DownloadStatus.Error)).toBe(true)
      expect(canRemove(DownloadStatus.Completed)).toBe(false)
    })
  })
})
