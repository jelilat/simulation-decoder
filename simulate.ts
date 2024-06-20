import {
  Account,
  ArraySignatureType,
  CairoVersion,
  Call,
  constants,
  RpcProvider,
  selector,
  stark,
} from "starknet";
import { decodeTrace } from "./decoder";

export type Function = {
  read: {
    name: string;
    inputs: any;
    outputs: any;
    state_mutability: string;
  }[];
  write: {
    name: string;
    inputs: any;
    outputs: any;
    state_mutability: string;
  }[];
};

const simulateTransaction = async (
  functionName: string,
  calldata: string[]
) => {
  const simulationParameters = {
    functionName,
    calldata,
  };

  try {
    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/",
    });

    const walletAddress = "REPLACE_ME";
    const privateKey = "REPLACE_ME";
    const contractAddress = "REPLACE_ME";
    const account = new Account(provider, walletAddress, privateKey);

    const nonce = await provider.getNonceForAddress(walletAddress!);
    const chainId = await account?.getChainId();
    const maxFee = "0x0";
    const version = 1;
    const cairoVersion = "1";

    const entrypoint = selector.getSelectorFromName(functionName);

    const call: Call = {
      contractAddress,
      entrypoint,
      calldata: {
        // REPLACE_ME
        recipient:
          "0x053f84E5968D384C1e6C731DfE9426705165a123d52388E006BA74437983f743",
        amount: "0x0",
      },
    };

    const signature = await signTransaction(
      account,
      walletAddress!,
      nonce,
      maxFee,
      version,
      chainId!,
      cairoVersion,
      call
    );

    calldata = [
      "0x1",
      contractAddress,
      entrypoint,
      "0x3",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0",
      "0x0",
    ];

    const simulation = await simulateTransactions(
      walletAddress!,
      calldata,
      signature,
      nonce
    );
    console.log(simulation);
    if (simulation) {
      const trace = await decodeTrace(simulation[0].transaction_trace);
      console.log(trace);
    }
  } catch (err) {
    console.error("Error fetching data: ", err);
  }
};

const simulateTransactions = async (
  sender_address: string,
  calldata: string[],
  signature: ArraySignatureType,
  nonce: string
) => {
  const url = "https://free-rpc.nethermind.io/sepolia-juno/";
  // EXAMPLE PAYLOAD
  const payload = {
    jsonrpc: "2.0",
    method: "starknet_simulateTransactions",
    params: {
      block_id: "latest",
      transactions: [
        {
          type: "INVOKE",
          version: "0x1",
          sender_address,
          calldata,
          max_fee: "0x0",
          signature,
          nonce,
        },
      ],
      simulation_flags: ["SKIP_VALIDATE"],
    },
    id: 1,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

const signTransaction = async (
  account: Account,
  walletAddress: string,
  nonce: string,
  maxFee: string,
  version: any,
  chainId: constants.StarknetChainId,
  cairoVersion: CairoVersion,
  call: Call
): Promise<ArraySignatureType> => {
  const signerDetails = {
    walletAddress,
    nonce,
    maxFee,
    version,
    chainId,
    cairoVersion,
    skipValidate: true,
  };

  const signer = account?.signer;
  const signature = await signer?.signTransaction([call], signerDetails);

  const formatedSignature = stark.formatSignature(signature);
  return formatedSignature;
};
