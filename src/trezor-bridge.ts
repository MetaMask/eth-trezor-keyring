import type {
  ConnectSettings,
  EthereumSignedTx,
  Manifest,
  PROTO,
  Response,
  Params,
  EthereumSignMessage,
  EthereumSignTransaction,
  EthereumSignTypedDataTypes,
  EthereumSignTypedHash,
} from '@trezor/connect-web';

export interface TrezorBridge {
  model?: string;

  init(
    settings: {
      manifest: Manifest;
    } & Partial<ConnectSettings>,
  ): Promise<void>;

  dispose(): Promise<void>;

  // TrezorConnect.getPublicKey has two overloads
  // It is not possible to extract them from the library using utility types
  getPublicKey(params: {
    path: string;
    coin: string;
  }): Response<{ publicKey: string; chainCode: string }>;

  ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
  ): Response<EthereumSignedTx>;

  ethereumSignMessage(
    params: Params<EthereumSignMessage>,
  ): Response<PROTO.MessageSignature>;

  ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
  ): Response<PROTO.EthereumTypedDataSignature>;
}
