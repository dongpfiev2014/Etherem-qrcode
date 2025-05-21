import { useState, useEffect } from 'react';

// Smart Contract Mobile Connector Component
const SmartContractMobileConnector = () => {
  // State variables
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('123456789');
  const [ethAmount, setEthAmount] = useState('0.001');

  // Contract details
  const contractAddress = '0xAb2A4D46982E2a511443324368A0777C7f41faF6';
  const methodId = '0xc812b127'; // methodId for buyPointByNative(string)

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Get connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (err) {
          console.error("Error checking connection:", err);
        }
      }
    };

    checkConnection();
  }, []);

  // Function to encode parameters for the contract function call
  const encodeParams = (orderId) => {
    // Position of the data (32 bytes)
    const pos = '0000000000000000000000000000000000000000000000000000000000000020';
    
    // Length of string in hex (9 characters = 0x09)
    const length = '0000000000000000000000000000000000000000000000000000000000000009';
    
    // Convert string to hex and pad to 32 bytes
    let hexString = '';
    for (let i = 0; i < orderId.length; i++) {
      hexString += orderId.charCodeAt(i).toString(16).padStart(2, '0');
    }
    const data = hexString.padEnd(64, '0');
    
    return methodId + pos + length + data;
  };

  // Connect wallet function
  const connectWallet = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // Check if running on mobile with deep link support
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.ethereum) {
        // Deep link to open MetaMask
        window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        return;
      }
      
      // Connect using injected provider (MetaMask)
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        throw new Error("No Ethereum wallet found. Please install MetaMask.");
      }
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Call smart contract function
  const callSmartContract = async () => {
    setError('');
    setIsLoading(true);
    setTxHash('');
    
    try {
      if (!window.ethereum) {
        // On mobile without MetaMask injected, create a deep link
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // Convert ETH to wei
          const valueInWei = (parseFloat(ethAmount) * 1e18).toString(16);
          const encodedData = encodeParams(orderId);
          
          // Create transaction URL (using ethereum: protocol)
          const txUrl = `ethereum:${contractAddress}?value=0x${valueInWei}&data=0x${encodedData}`;
          
          // Redirect to metamask app
          window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}?action=sendTransaction&to=${contractAddress}&value=${ethAmount}&data=${encodedData}`;
          return;
        }
        throw new Error("No Ethereum wallet found");
      }

      // Check if we're on the correct network (Sepolia)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log(chainId)
      if (chainId !== '0xaa36a7') { // Sepolia chainId is 0xaa36a7
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
        });
      }

      // Convert ETH to wei (in hex)
      const valueInWei = `0x${(parseFloat(ethAmount) * 1e18).toString(16)}`;
      
      // Get transaction data
      const data = encodeParams(orderId);
      
      // Send transaction
      const transactionParameters = {
        to: contractAddress,
        from: account,
        value: valueInWei,
        data: data,
      };
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      
      setTxHash(txHash);
    } catch (err) {
      setError(err.message || "Transaction failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold text-center mb-6">Mua Point Bằng ETH</h1>
      
      {/* Wallet Connection Section */}
      <div className="mb-6">
        {!isConnected ? (
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
          >
            {isLoading ? 'Đang kết nối...' : 'Kết nối ví MetaMask'}
          </button>
        ) : (
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm text-gray-700">Ví đã kết nối:</p>
            <p className="font-mono text-sm truncate">{account}</p>
          </div>
        )}
      </div>
      
      {/* Transaction Form */}
      {isConnected && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã đơn hàng (OrderId)
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng ETH
            </label>
            <input
              type="text"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <button
            onClick={callSmartContract}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
          >
            {isLoading ? 'Đang xử lý...' : 'Mua Point Ngay'}
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Transaction Hash */}
      {txHash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          <p className="text-sm font-medium">Giao dịch thành công!</p>
          <p className="text-xs mt-1 break-all">
            Hash: {txHash}
          </p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
          >
            Xem trên Etherscan
          </a>
        </div>
      )}
      
      {/* Contract Info */}
      <div className="mt-6 text-xs text-gray-500">
        <p>Địa chỉ hợp đồng: {contractAddress}</p>
        <p>Mạng: Sepolia Testnet</p>
        <p>Hàm: buyPointByNative(string orderId)</p>
      </div>
    </div>
  );
};

export default SmartContractMobileConnector;