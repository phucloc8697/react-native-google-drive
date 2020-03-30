import { GoogleFile } from '../googleDrive';
import { LocalFile } from './GoogleDrivePicker';

export interface GoogleDriveProps {
  onBack: () => void;
  handlePick?: (file: LocalFile) => void;
  handleError?: (error: Error) => void;
}

export interface GoogleDriveState {
  paths: string[];
  data: GoogleFile[];
  loading: boolean;
}

export interface FlatListItem {
  index: number;
  item: GoogleFile;
}
