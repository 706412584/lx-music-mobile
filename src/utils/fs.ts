import RNFS from 'react-native-fs'
import { Platform } from 'react-native'

// react-native-file-system 只在 Android 上可用
let FileSystem: any
let Dirs: any
let AndroidScoped: any
let getExternalStoragePaths: any

if (Platform.OS === 'android') {
  const RNFileSystem = require('react-native-file-system')
  FileSystem = RNFileSystem.FileSystem
  Dirs = RNFileSystem.Dirs
  AndroidScoped = RNFileSystem.AndroidScoped
  getExternalStoragePaths = RNFileSystem.getExternalStoragePaths
}

export type {
  FileType,
} from 'react-native-file-system'

export type Encoding = 'utf8' | 'ascii' | 'base64'
export type HashAlgorithm = 'md5' | 'sha1' | 'sha224' | 'sha256' | 'sha384' | 'sha512'
export type OpenDocumentOptions = {
  type?: string | string[]
  multiple?: boolean
}

// export const externalDirectoryPath = RNFS.ExternalDirectoryPath

export const extname = (name: string) => name.lastIndexOf('.') > 0 ? name.substring(name.lastIndexOf('.') + 1) : ''

// iOS 使用 react-native-fs 的路径
export const temporaryDirectoryPath = Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : Dirs.CacheDir
export const externalStorageDirectoryPath = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : Dirs.SDCardDir
export const privateStorageDirectoryPath = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : Dirs.DocumentDir

export const getExternalStoragePaths = async(is_removable?: boolean) => {
  if (Platform.OS === 'ios') {
    // iOS 没有外部存储概念，返回文档目录
    return [RNFS.DocumentDirectoryPath]
  }
  return getExternalStoragePaths(is_removable)
}

export const selectManagedFolder = async(isPersist: boolean = false) => {
  if (Platform.OS === 'ios') {
    throw new Error('selectManagedFolder is not supported on iOS')
  }
  return AndroidScoped.openDocumentTree(isPersist)
}

export const selectFile = async(options: OpenDocumentOptions) => {
  if (Platform.OS === 'ios') {
    throw new Error('selectFile is not supported on iOS')
  }
  return AndroidScoped.openDocument(options)
}

export const removeManagedFolder = async(path: string) => {
  if (Platform.OS === 'ios') {
    throw new Error('removeManagedFolder is not supported on iOS')
  }
  return AndroidScoped.releasePersistableUriPermission(path)
}

export const getManagedFolders = async() => {
  if (Platform.OS === 'ios') {
    return []
  }
  return AndroidScoped.getPersistedUriPermissions()
}

export const getPersistedUriList = async() => {
  if (Platform.OS === 'ios') {
    return []
  }
  return AndroidScoped.getPersistedUriPermissions()
}


export const readDir = async(path: string) => {
  if (Platform.OS === 'ios') {
    return RNFS.readDir(path)
  }
  return FileSystem.ls(path)
}

export const unlink = async(path: string) => {
  if (Platform.OS === 'ios') {
    return RNFS.unlink(path)
  }
  return FileSystem.unlink(path)
}

export const mkdir = async(path: string) => {
  if (Platform.OS === 'ios') {
    return RNFS.mkdir(path)
  }
  return FileSystem.mkdir(path)
}

export const stat = async(path: string) => {
  if (Platform.OS === 'ios') {
    return RNFS.stat(path)
  }
  return FileSystem.stat(path)
}

export const hash = async(path: string, algorithm: HashAlgorithm) => {
  if (Platform.OS === 'ios') {
    return RNFS.hash(path, algorithm)
  }
  return FileSystem.hash(path, algorithm)
}

export const readFile = async(path: string, encoding?: Encoding) => {
  if (Platform.OS === 'ios') {
    return RNFS.readFile(path, encoding)
  }
  return FileSystem.readFile(path, encoding)
}


// export const copyFile = async(fromPath: string, toPath: string) => FileSystem.cp(fromPath, toPath)

export const moveFile = async(fromPath: string, toPath: string) => {
  if (Platform.OS === 'ios') {
    return RNFS.moveFile(fromPath, toPath)
  }
  return FileSystem.mv(fromPath, toPath)
}

export const gzipFile = async(fromPath: string, toPath: string) => {
  if (Platform.OS === 'ios') {
    throw new Error('gzipFile is not supported on iOS')
  }
  return FileSystem.gzipFile(fromPath, toPath)
}

export const unGzipFile = async(fromPath: string, toPath: string) => {
  if (Platform.OS === 'ios') {
    throw new Error('unGzipFile is not supported on iOS')
  }
  return FileSystem.unGzipFile(fromPath, toPath)
}

export const gzipString = async(data: string, encoding?: Encoding) => {
  if (Platform.OS === 'ios') {
    throw new Error('gzipString is not supported on iOS')
  }
  return FileSystem.gzipString(data, encoding)
}

export const unGzipString = async(data: string, encoding?: Encoding) => {
  if (Platform.OS === 'ios') {
    throw new Error('unGzipString is not supported on iOS')
  }
  return FileSystem.unGzipString(data, encoding)
}

export const existsFile = async(path: string) => {
  if (Platform.OS === 'ios') {
    return RNFS.exists(path)
  }
  return FileSystem.exists(path)
}

export const rename = async(path: string, name: string) => {
  if (Platform.OS === 'ios') {
    // react-native-fs 没有 rename，需要用 moveFile
    const dir = path.substring(0, path.lastIndexOf('/'))
    const newPath = `${dir}/${name}`
    await RNFS.moveFile(path, newPath)
    return newPath
  }
  return FileSystem.rename(path, name)
}

export const writeFile = async(path: string, data: string, encoding?: Encoding) => {
  if (Platform.OS === 'ios') {
    return RNFS.writeFile(path, data, encoding)
  }
  return FileSystem.writeFile(path, data, encoding)
}

export const appendFile = async(path: string, data: string, encoding?: Encoding) => {
  if (Platform.OS === 'ios') {
    return RNFS.appendFile(path, data, encoding)
  }
  return FileSystem.appendFile(path, data, encoding)
}

export const downloadFile = (url: string, path: string, options: Omit<RNFS.DownloadFileOptions, 'fromUrl' | 'toFile'> = {}) => {
  if (!options.headers) {
    options.headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36',
    }
  }
  return RNFS.downloadFile({
    fromUrl: url, // URL to download file from
    toFile: path, // Local filesystem path to save the file to
    ...options,
    // headers: options.headers, // An object of headers to be passed to the server
    // // background?: boolean;     // Continue the download in the background after the app terminates (iOS only)
    // // discretionary?: boolean;  // Allow the OS to control the timing and speed of the download to improve perceived performance  (iOS only)
    // // cacheable?: boolean;      // Whether the download can be stored in the shared NSURLCache (iOS only, defaults to true)
    // progressInterval: options.progressInterval,
    // progressDivider: options.progressDivider,
    // begin: (res: DownloadBeginCallbackResult) => void;
    // progress?: (res: DownloadProgressCallbackResult) => void;
    // // resumable?: () => void;    // only supported on iOS yet
    // connectionTimeout?: number // only supported on Android yet
    // readTimeout?: number       // supported on Android and iOS
    // // backgroundTimeout?: number // Maximum time (in milliseconds) to download an entire resource (iOS only, useful for timing out background downloads)
  })
}

export const stopDownload = (jobId: number) => {
  RNFS.stopDownload(jobId)
}
