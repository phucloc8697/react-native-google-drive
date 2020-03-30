import React from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import imgFile from '../images/img_file.png';
import imgFolder from '../images/img_folder.png';
import GoogleDrive, { GoogleFile } from '../googleDrive';
import { FlatListItem, GoogleDriveProps, GoogleDriveState } from './GoogleDrivePicker.interface';
import styles, { headerStyle, itemStyle } from './style';

const ID_PREVIOUS = 'PREVIOUS';


export interface LocalFile {
  uri: string;
  mimetype: string;
  type: string;
  name: string;
  size: number;
}


class GoogleDrivePicker extends React.PureComponent<GoogleDriveProps, GoogleDriveState> {
  googleDrive = GoogleDrive.getInstance();

  constructor(props: GoogleDriveProps) {
    super(props);
    this.state = {
      paths: ['My Drive'],
      data: [],
      loading: false,
    };
  }

  async componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    const { paths } = this.state;
    const currentPath = paths[paths.length - 1];
    this.setState({ loading: true });
    let data: GoogleFile[] = [];
    if (currentPath === 'My Drive') {
      data = await this.googleDrive.listMyDrive();
    } else if (currentPath === 'Shared') {
      data = await this.googleDrive.listSharedDrive();
    } else {
      data = await this.googleDrive.listFiles(currentPath);
      data.unshift({ id: ID_PREVIOUS } as GoogleFile);
    }
    this.setState({ data, loading: false });
  }

  handleItemPressed = async (file: GoogleFile) => {
    const { paths } = this.state;
    const { handlePick, handleError, onBack } = this.props;
    if (file.id === ID_PREVIOUS) {
      const newPaths = paths.slice(0, -1);
      this.setState({ paths: [...newPaths] }, () => this.loadData());
    } else if (this.googleDrive.isFoler(file)) {
      this.setState({ paths: [...paths, file.id] }, () => this.loadData());
    } else {
      this.setState({ loading: true });
      try {
        const uri = await this.googleDrive.downloadFile(file);
        const result: LocalFile = {
          uri,
          name: file.name,
          mimetype: file.mimeType,
          type: file.mimeType,
          size: file.size,
        };
        handlePick(result);
        onBack();
      } catch (error) {
        handleError(error);
        onBack();
      } finally {
        this.setState({ loading: false });
      }
    }
  }

  handleSignOut = async () => {
    await this.googleDrive.signOut();
    this.props.onBack();
  }

  _renderHeader = () => {
    const { onBack } = this.props;
    return <View style={headerStyle.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={headerStyle.signOut} >Back</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={this.handleSignOut}>
        <Text style={headerStyle.signOut} >Sign out</Text>
      </TouchableOpacity>
    </View>;
  }

  _renderEmpty = () => {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>There is no file</Text>
    </View>;
  }

  _formatTime(time: Date): string {
    const day = `0${time.getDate()}`.slice(-2);
    const month = `0${time.getMonth() + 1}`.slice(-2);
    const year = `0${time.getFullYear()}`.slice(-2);
    return `${day}/${month}/${year}`;
  }

  _renderItem = (data: FlatListItem) => {
    function round(divider: number, divident: number) {
      return Math.round(divider / divident * 10) / 10;
    }

    const { item } = data;
    const isPrevious = item.id === ID_PREVIOUS;
    const isFolder = this.googleDrive.isFoler(item);
    let sizeText = '';
    if (item.size > 1073741824) {
      sizeText = `${round(item.size, 1073741824)}GB`;
    } else if (item.size > 1048576) {
      sizeText = `${round(item.size, 1048576)}MB`;
    } else if (item.size) {
      sizeText = `${round(item.size, 1024)}KB`;
    }
    const timeText = this._formatTime(new Date(item.modifiedTime));

    return <TouchableOpacity onPress={() => this.handleItemPressed(item)}>
      <View style={itemStyle.container}>
        <Image style={itemStyle.icon} source={isFolder || isPrevious ? imgFolder : imgFile} />
        {isPrevious ? <Text>..</Text>
          : <View style={itemStyle.right}>
            <Text numberOfLines={1}>{item.name}</Text>
            <Text>{isFolder ? timeText : `${timeText} | ${sizeText}`}</Text>
          </View>
        }
      </View>
      <View style={itemStyle.divider} />
    </TouchableOpacity>;
  }

  render() {
    const { data, loading } = this.state;
    return <>
      <SafeAreaView style={{ backgroundColor: '#fff', zIndex: 2 }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <FlatList
            data={data}
            renderItem={this._renderItem}
            keyExtractor={(item: GoogleFile) => item.id}
            scrollEnabled={data.length > 0}
            scrollEventThrottle={8}
            ListEmptyComponent={this._renderEmpty}
            contentContainerStyle={[
              styles.listContent,
            ]} />
          {loading && <ActivityIndicator style={styles.loading} />}
        </View>
        {this._renderHeader()}
      </SafeAreaView>
    </>;
  }
}

export default GoogleDrivePicker;
