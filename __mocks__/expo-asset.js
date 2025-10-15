// Mock para expo-asset
export class Asset {
  constructor(options) {
    this.name = options?.name || 'mock-asset';
    this.type = options?.type || 'mock';
    this.hash = options?.hash || null;
    this.uri = options?.uri || 'file:///mock-asset';
    this.width = options?.width || null;
    this.height = options?.height || null;
    this.downloaded = true;
    this.downloading = false;
    this.localUri = this.uri;
  }

  async downloadAsync() {
    this.downloaded = true;
    return this;
  }

  static fromModule(moduleId) {
    return new Asset({ uri: `asset://${moduleId}` });
  }

  static fromURI(uri) {
    return new Asset({ uri });
  }

  static loadAsync() {
    return Promise.resolve();
  }
}

export default {
  Asset,
  fromModule: Asset.fromModule,
  fromURI: Asset.fromURI,
  loadAsync: Asset.loadAsync,
};
