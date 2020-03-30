import { GoogleSignin, statusCodes } from '@react-native-community/google-signin';
import { NativeModules, Platform } from 'react-native';

const apiEndpoint = 'https://www.googleapis.com/drive/v3';
const CONDITION_IN_MY_DRIVE = "'me' in owners";
const CONDITION_IN_SHARED = 'sharedWithMe';
const CONDITION_IN_ROOT = "'root' in parents";
const MIME_TYPE_FOLDER = 'application/vnd.google-apps.folder';

let googleDrive: GoogleDrive = null;

class GoogleDrive {
  apiToken = '';
  androidClientId = '';
  iosClientId = '';
  apiKey = '';

  static getInstance() {
    if (googleDrive) return googleDrive;
    return new GoogleDrive();
  }

  isSignedIn = async (): Promise<boolean> => {
    const isSigned = await GoogleSignin.isSignedIn();
    if (!isSigned) return false;
    try {
      await GoogleSignin.getTokens();
      return true;
    } catch (err) {
      return false;
    }
  }

  getToken = async (): Promise<string> => {
    if (this.apiToken) return this.apiToken;
    const tokens = await GoogleSignin.getTokens();
    this.apiToken = tokens.accessToken;
    return this.apiToken;
  }

  isFoler = (file: GoogleFile): boolean => {
    return file.mimeType === MIME_TYPE_FOLDER;
  }

  config = ({ apiKey, androidClientId, iosClientId, scopes }) => {
    this.androidClientId = androidClientId;
    this.iosClientId = iosClientId;
    this.apiKey = apiKey;
    let driveScopes = scopes ? scopes : [
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ]
    let googleConfig = {};
    if (Platform.OS === 'android') {
      googleConfig = { webClientId: this.androidClientId };
    } else {
      googleConfig = { webClientId: this.iosClientId };
    }
    googleConfig = {
      ...googleConfig,
      scopes: driveScopes,
      shouldFetchBasicProfile: true,
    };
    GoogleSignin.configure(googleConfig);
  }

  signInGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const { idToken, accessToken } = tokens;
      this.apiToken = accessToken;
      if (idToken) {
        return idToken;
      }
      throw new Error('idToken empty');
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
      }
      throw error;
    }
  }

  signOut = async () => {
    await GoogleSignin.signOut();
    this.apiToken = '';
    return;
  }

  _configureGetOptions = async () => {
    const headers = new Headers();
    if (!this.apiToken) {
      this.apiToken = (await GoogleSignin.getTokens()).accessToken;
    }
    headers.append('Authorization', `Bearer ${this.apiToken}`);
    return {
      method: 'GET',
      headers,
    };
  }

  _parseAndHandleErrors = (response: any) => {
    if (response.ok) {
      return response.json();
    }
    return response.json()
      .then((error: any) => {
        throw error;
      });
  }

  _buildQueryOptions = (conditions: string[], mimetypes: string[] = []) => {
    const options = {
      key: this.apiKey,
      pageSize: 100,
      spaces: 'drive',
      orderBy: 'folder',
      fields: 'nextPageToken,files(mimeType,id,name,webContentLink,trashed,modifiedTime,size)',
      q: `${conditions.join(' and ')} and (mimeType='application/pdf' or mimeType='${MIME_TYPE_FOLDER}')`,
    };
    const q = '';
    options.q += q;
    const query = Object.entries(options).map(item => item.join('='));
    return query.join('&');
  }

  _requestToDrive = async (url: string, options: object) => {
    try {
      const res = await fetch(url, options);
      const body = await this._parseAndHandleErrors(res);
      if (body && body.files && body.files.length > 0) {
        return body.files;
      }
    } catch (err) {
      throw err;
    }
    return [];
  }

  listMyDrive = async (): Promise<GoogleFile[]> => {
    const conditions = [CONDITION_IN_MY_DRIVE, CONDITION_IN_ROOT];
    const getOptions = await this._configureGetOptions();
    return this._requestToDrive(`${apiEndpoint}/files?${this._buildQueryOptions(conditions)}`, getOptions);
  }

  listSharedDrive = async (): Promise<GoogleFile[]> => {
    const conditions = [CONDITION_IN_SHARED];
    const getOptions = await this._configureGetOptions();
    return this._requestToDrive(`${apiEndpoint}/files?${this._buildQueryOptions(conditions)}`, getOptions);
  }

  listFiles = async (folderId: string): Promise<GoogleFile[]> => {
    const conditions = [`'${folderId}' in parents`];
    const getOptions = await this._configureGetOptions();
    return this._requestToDrive(`${apiEndpoint}/files?${this._buildQueryOptions(conditions)}`, getOptions);
  }

  downloadFile = async (file: GoogleFile): Promise<string> => {
    const { LuminContract } = NativeModules;
    return LuminContract.downloadFromUrl(
      `${apiEndpoint}/files/${file.id}?alt=media`,
      file.name,
      { Authorization: `Bearer ${this.apiToken}` },
    ).then((res: any) => {
      return res.uri;
    }).catch((err: any) => {
      throw new Error(err.message || 'Failed to download file');
    });
  }
}

export interface GoogleFile {
  mimeType: string;
  id: string;
  name: string;
  modifiedTime: Date;
  size: number;
  webContentLink: string;
}

export default GoogleDrive;
