import { useMemo } from "react";
import { Interface, parseUnits } from "ethers";
import { QRCodeCanvas } from "qrcode.react";

const abi = [
  "function buyPointByToken(address token, string orderId, uint256 amount)",
  "function buyPointByNative(string orderId)",
];

const contractAddress = "0xAb2A4D46982E2a511443324368A0777C7f41faF6";

type BuyPointQRCodeProps = {
  useNative: boolean; // true: dùng ETH, false: dùng ERC20
};

const BuyPointQRCode1 = ({ useNative }: BuyPointQRCodeProps) => {
  const uri = useMemo(() => {
    const iface = new Interface(abi);
    const orderId = "order123";
    const amount = "0.01"; // Hiển thị cho user

    let data = "";
    let value = "";
    const chainId = 11155111;
    const gas = 200_000;

    if (useNative) {
      const nativeAmount = parseUnits(amount, 18); // Convert ETH to wei
      data = iface.encodeFunctionData("buyPointByNative", [orderId]);
      value = nativeAmount.toString(); // ETH value
    } else {
      const tokenAddress = "0x44c0d559923a7ae4857D5ae32EdA98b63F535d5d";
      const tokenAmount = parseUnits(amount, 18); // Convert token to smallest unit
      data = iface.encodeFunctionData("buyPointByToken", [
        tokenAddress,
        orderId,
        tokenAmount,
      ]);
    }

    const encodedData = encodeURIComponent(data);

    const params = [`gas=${gas}`, `data=${encodedData}`];
    if (value) params.unshift(`value=${value}`);

    return `ethereum:${contractAddress}@${chainId}?${params.join("&")}`;
  }, [useNative]);

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Scan to Pay with {useNative ? "ETH" : "Token"}</h3>
      <QRCodeCanvas value={uri} size={256} />
      <p style={{ wordBreak: "break-all", marginTop: "1rem" }}>{uri}</p>
    </div>
  );
};

export default BuyPointQRCode1;
