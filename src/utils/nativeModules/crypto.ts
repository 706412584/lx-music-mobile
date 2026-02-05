import { NativeModules, Platform } from 'react-native'

const { CryptoModule } = NativeModules

// export const testRsa = (text: string, key: string) => {
//   // console.log(sourceFilePath, targetFilePath)
//   return CryptoModule.testRsa()
// }

enum KEY_PREFIX {
  publicKeyStart = '-----BEGIN PUBLIC KEY-----',
  publicKeyEnd = '-----END PUBLIC KEY-----',
  privateKeyStart = '-----BEGIN PRIVATE KEY-----',
  privateKeyEnd = '-----END PRIVATE KEY-----',
}

export enum RSA_PADDING {
  OAEPWithSHA1AndMGF1Padding = 'RSA/ECB/OAEPWithSHA1AndMGF1Padding',
  NoPadding = 'RSA/ECB/NoPadding',
}

export enum AES_MODE {
  CBC_128_PKCS7Padding = 'AES/CBC/PKCS7Padding',
  ECB_128_NoPadding = 'AES',
}

export const generateRsaKey = Platform.OS === 'android'
  ? async() => {
      // console.log(sourceFilePath, targetFilePath)
      const key = await CryptoModule.generateRsaKey() as { publicKey: string, privateKey: string }
      return {
        publicKey: `${KEY_PREFIX.publicKeyStart}\n${key.publicKey}${KEY_PREFIX.publicKeyEnd}`,
        privateKey: `${KEY_PREFIX.privateKeyStart}\n${key.privateKey}${KEY_PREFIX.privateKeyEnd}`,
      }
    }
  : async() => ({ publicKey: '', privateKey: '' })

export const rsaEncrypt = Platform.OS === 'android'
  ? async(text: string, key: string, padding: RSA_PADDING): Promise<string> => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.rsaEncrypt(text, key
        .replace(KEY_PREFIX.publicKeyStart, '')
        .replace(KEY_PREFIX.publicKeyEnd, ''),
      padding)
    }
  : async() => ''

export const rsaDecrypt = Platform.OS === 'android'
  ? async(text: string, key: string, padding: RSA_PADDING): Promise<string> => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.rsaDecrypt(text, key
        .replace(KEY_PREFIX.privateKeyStart, '')
        .replace(KEY_PREFIX.privateKeyEnd, ''),
      padding)
    }
  : async() => ''

export const rsaEncryptSync = Platform.OS === 'android'
  ? (text: string, key: string, padding: RSA_PADDING): string => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.rsaEncryptSync(text, key
        .replace(KEY_PREFIX.publicKeyStart, '')
        .replace(KEY_PREFIX.publicKeyEnd, ''),
      padding)
    }
  : () => ''

export const rsaDecryptSync = Platform.OS === 'android'
  ? (text: string, key: string, padding: RSA_PADDING): string => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.rsaDecryptSync(text, key
        .replace(KEY_PREFIX.privateKeyStart, '')
        .replace(KEY_PREFIX.privateKeyEnd, ''),
      padding)
    }
  : () => ''


export const aesEncrypt = Platform.OS === 'android'
  ? async(text: string, key: string, vi: string, mode: AES_MODE): Promise<string> => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.aesEncrypt(text, key, vi, mode)
    }
  : async() => ''

export const aesDecrypt = Platform.OS === 'android'
  ? async(text: string, key: string, vi: string, mode: AES_MODE): Promise<string> => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.aesDecrypt(text, key, vi, mode)
    }
  : async() => ''

export const aesEncryptSync = Platform.OS === 'android'
  ? (text: string, key: string, vi: string, mode: AES_MODE): string => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.aesEncryptSync(text, key, vi, mode)
    }
  : () => ''

export const aesDecryptSync = Platform.OS === 'android'
  ? (text: string, key: string, vi: string, mode: AES_MODE): string => {
      // console.log(sourceFilePath, targetFilePath)
      return CryptoModule.aesDecryptSync(text, key, vi, mode)
    }
  : () => ''
