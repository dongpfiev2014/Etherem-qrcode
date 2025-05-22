import React, { useState, useEffect, useRef } from "react";
import { BrowserProvider, Contract, parseEther, parseUnits, isAddress } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import BuyPointABI from "../contracts/BuyPoint.json";

const ABI = BuyPointABI.abi;

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

const SEPOLIA_CHAIN_ID = 11155111; // Sepolia Testnet Chain ID

const switchToSepolia = async (provider) => {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${parseInt(SEPOLIA_CHAIN_ID).toString(16)}` }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${parseInt(SEPOLIA_CHAIN_ID).toString(16)}`,
            chainName: "Sepolia Testnet",
            rpcUrls: ["https://rpc.sepolia.org"],
            nativeCurrency: {
              name: "Sepolia ETH",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

const BuyPointComponent = () => {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("Đang khởi tạo...");
  const [transactionId, setTransactionId] = useState("xsdf1-sdaf12-2341dsf-123123123");
  // const [tokenAddress, setTokenAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
  const [tokenAmount, setTokenAmount] = useState("0.0069");
  const [contractAddress, setContractAddress] = useState("0x67Ce370dCa7FA042d108daFCA914C03b768dea98");
  const [isLoading, setIsLoading] = useState({
    connecting: false,
    approving: false,
    processing: false,
    confirming: false,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [txHash, setTxHash] = useState("");
  const processedTxs = useRef(new Set());

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const getTokenDecimals = async (tokenAddress, provider) => {
    try {
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await tokenContract.decimals();
      return Number(decimals);
    } catch (error) {
      console.error("Lỗi lấy decimals:", error);
      throw new Error("Không thể lấy decimals của token!");
    }
  };

  const approveToken = async () => {
    setCurrentStep(2);
    setStatus("Đang phê duyệt token...");
    setIsLoading((prev) => ({ ...prev, approving: true }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const decimals = await getTokenDecimals(tokenAddress, provider);
      const amountInWei = parseUnits(tokenAmount, decimals);

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      const approveTx = await tokenContract.approve(contractAddress, amountInWei, {
        gasLimit: 100000,
      });

      setStatus(`Đang gửi giao dịch phê duyệt: ${approveTx.hash}`);
      const receipt = await approveTx.wait();
      console.log(receipt);
      setStatus(`Phê duyệt thành công! Tx Hash: ${receipt.hash}`);
      return true;
    } catch (error) {
      setStatus(`Lỗi phê duyệt: ${error.message}`);
      throw error;
    } finally {
      setIsLoading((prev) => ({ ...prev, approving: false }));
    }
  };

  const callBuyPointByNative = async () => {
    setCurrentStep(3);
    setStatus("Đang thực hiện giao dịch bằng ETH...");
    setIsLoading((prev) => ({ ...prev, processing: true }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, ABI, signer);

      const tx = await contract.buyPointByNative(transactionId, {
        value: parseEther(tokenAmount),
        gasLimit: 53307,
      });

      setTxHash(tx.hash);
      setStatus(`Đang gửi giao dịch: ${tx.hash}`);
      const receipt = await tx.wait();
      setStatus(`Giao dịch thành công! Tx Hash: ${receipt.hash}`);
    } catch (error) {
      setStatus(`Lỗi: ${error.message}`);
      throw error;
    } finally {
      setIsLoading((prev) => ({ ...prev, processing: false }));
    }
  };

  const callBuyPointByToken = async () => {
    setCurrentStep(3);
    setStatus("Đang thực hiện giao dịch bằng token...");
    setIsLoading((prev) => ({ ...prev, processing: true }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, ABI, signer);

      const decimals = await getTokenDecimals(tokenAddress, provider);
      const amountInWei = parseUnits(tokenAmount, decimals);

      const tx = await contract.buyPointByToken(tokenAddress, transactionId, amountInWei, {
        gasLimit: 100000,
      });

      setTxHash(tx.hash);
      setStatus(`Đang gửi giao dịch: ${tx.hash}`);
      const receipt = await tx.wait();
      setStatus(`Giao dịch thành công! Tx Hash: ${receipt.hash}`);
    } catch (error) {
      setStatus(`Lỗi: ${error.message}`);
      throw error;
    } finally {
      setIsLoading((prev) => ({ ...prev, processing: false }));
    }
  };

  const processPayment = async () => {
    try {
      // Bước 1: Kết nối ví
      setCurrentStep(1);
      setStatus("Đang kết nối ví...");
      setIsLoading((prev) => ({ ...prev, connecting: true }));

      const browserProvider = await detectEthereumProvider();
      if (!browserProvider) {
        throw new Error(
          isMobileDevice() ? "Vui lòng mở trang này trong trình duyệt của ví!" : "Vui lòng cài đặt ví extension!"
        );
      }
      await switchToSepolia(browserProvider); // Chuyển sang Sepolia

      const accounts = await browserProvider.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        const newAccounts = await browserProvider.request({ method: "eth_requestAccounts" });
        setAccount(newAccounts[0]);
      } else {
        setAccount(accounts[0]);
      }

      // Bước 2: Phê duyệt token (nếu là thanh toán bằng token)
      if (tokenAddress) {
        await approveToken();
      }

      // Bước 3: Thực hiện giao dịch
      if (tokenAddress) {
        await callBuyPointByToken();
      } else {
        await callBuyPointByNative();
      }
    } catch (error) {
      console.error(error);
      setStatus(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading((prev) => ({ ...prev, connecting: false }));
    }
  };

  useEffect(() => {
    // Đọc tham số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const transactionIdFromUrl = urlParams.get("transactionId");
    const tokenAddressFromUrl = urlParams.get("tokenAddress");
    const tokenAmountFromUrl = urlParams.get("tokenAmount");
    const contractAddressFromUrl = urlParams.get("contractAddress");

    if (transactionIdFromUrl) setTransactionId(transactionIdFromUrl);
    if (tokenAddressFromUrl) setTokenAddress(tokenAddressFromUrl);
    if (tokenAmountFromUrl) setTokenAmount(tokenAmountFromUrl);
    if (contractAddressFromUrl) setContractAddress(contractAddressFromUrl);

    // Tự động thực hiện thanh toán
    processPayment();
  }, []);

  useEffect(() => {
    if (!account || !transactionId || !txHash) return;

    let contract;
    const setupEventListeners = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        contract = new Contract(contractAddress, ABI, provider);

        // Remove any existing listeners to prevent duplicates
        contract.removeAllListeners("PaymentReceived");

        // Listen for PaymentReceived events
        contract.on("PaymentReceived", (from, token, eventtransactionId, amount, paymentType, event) => {
          // Skip if transaction was already processed
          if (processedTxs.current.has(event.log.transactionHash)) {
            return;
          }
          console.log("PaymentReceived event:", {
            from,
            token,
            eventtransactionId,
            amount: amount.toString(),
            paymentType,
            transactionHash: event.log.transactionHash,
          });
        });
      } catch (error) {
        console.error("Lỗi khi thiết lập event listeners:", error);
        setStatus(`Lỗi: ${error.message}`);
      }
    };

    setupEventListeners();

    return () => {
      if (contract) {
        contract.removeAllListeners("PaymentReceived");
      }
      if (window.ethereum && window.ethereum.removeAllListeners) {
        window.ethereum.removeAllListeners();
      }
    };
  }, [account, transactionId, txHash]);

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Quy trình thanh toán</h2>

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Thông tin đơn hàng:</strong>
        </p>
        <p>transaction ID: {transactionId}</p>
        <p>Contract Address: {contractAddress}</p>
        {tokenAddress ? (
          <>
            <p>Token: {tokenAddress}</p>
            <p>Số lượng: {tokenAmount}</p>
          </>
        ) : (
          <p>Thanh toán bằng: ETH ({tokenAmount} ETH)</p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Tiến trình:</strong>
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                btransactionRadius: "50%",
                backgroundColor: currentStep >= 1 ? "#4CAF50" : "#ddd",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              1
            </div>
            <p>Thiết lập giao dịch</p>
            {isLoading.connecting && <p>Đang xử lý...</p>}
          </div>
          {tokenAddress && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  btransactionRadius: "50%",
                  backgroundColor: currentStep >= 2 ? "#4CAF50" : "#ddd",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                2
              </div>
              <p>Phê duyệt token</p>
              {isLoading.approving && <p>Đang xử lý...</p>}
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                btransactionRadius: "50%",
                backgroundColor: currentStep >= 3 ? "#4CAF50" : "#ddd",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              {tokenAddress ? "3" : "2"}
            </div>
            <p>Thanh toán</p>
            {isLoading.processing && <p>Đang xử lý...</p>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Trạng thái:</strong> {status}
        </p>
        <p>
          <strong>Địa chỉ ví:</strong> {account || "Đang kết nối..."}
        </p>
        {txHash && (
          <p>
            <strong>Transaction Hash:</strong> {txHash}
          </p>
        )}
        {isLoading.confirming && <p>Đang xác nhận giao dịch với backend...</p>}
      </div>

      {isMobileDevice() && !window.ethereum && (
        <p style={{ color: "red", marginTop: "10px" }}>
          Vui lòng mở trang này trong trình duyệt của ví (MetaMask/OKX Wallet)!
        </p>
      )}
    </div>
  );
};

export default BuyPointComponent;
