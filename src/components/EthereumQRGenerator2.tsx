import { useMemo } from "react";
import { Interface, parseUnits } from "ethers";
import { QRCodeCanvas } from "qrcode.react";

const abiNative = [
  "function buyPointByNative(string orderId) payable",
];

const abiToken = [
  "function buyPointByToken(address token, string orderId, uint256 amount)",
];

const contractAddress = "0xAb2A4D46982E2a511443324368A0777C7f41faF6";
const tokenAddress = "0x44c0d559923a7ae4857D5ae32EdA98b63F535d5d";
const orderId = "123";
const amount = "0.001"; // Displayed in token units

const BuyPointQRCode2 = ({ useNative = true }) => {
  const uri = useMemo(() => {
    if (useNative) {
      // Native token (ETH) payment using EIP-681
      const iface = new Interface(abiNative);
      const tokenAmount = parseUnits(amount, 18); // Convert to wei
      const data = iface.encodeFunctionData("buyPointByNative", [orderId]);
      const encodedData = encodeURIComponent(data);
      
      // EIP-681: ethereum:pay-<contract>@<chain_id>/buyPointByNative?string=<orderId>&value=<amount>&gasLimit=200000&data=<encodedData>
      return `ethereum:${contractAddress}@11155111/buyPointByNative?orderId=${encodeURIComponent(orderId)}&value=${tokenAmount.toString()}&gasLimit=200000`;
    } else {
      // Non-native token payment using EIP-681
      const iface = new Interface(abiToken);
      const tokenAmount = parseUnits(amount, 18); // Convert to wei
      const data = iface.encodeFunctionData("buyPointByToken", [
        tokenAddress,
        orderId,
        tokenAmount,
      ]);
      const encodedData = encodeURIComponent(data);
      
      // EIP-681: ethereum:pay-<contract>@<chain_id>/buyPointByToken?address=<token>&string=<orderId>&uint256=<amount>&gasLimit=200000&data=<encodedData>
      return `ethereum:pay-${contractAddress}@11155111/buyPointByToken?address=${tokenAddress}&orderId=${encodeURIComponent(orderId)}&uint256=${tokenAmount.toString()}&gasLimit=200000`;
    }
  }, [useNative]);

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Scan to Pay with {useNative ? "ETH" : "Token"}</h3>
      <QRCodeCanvas value={uri} size={256} />
      <p style={{ wordBreak: "break-all", marginTop: "1rem" }}>{uri}</p>
    </div>
  );
};

export default BuyPointQRCode2;