import "./App.css";
import SolanaPayQR from "./components/PhantomQRGenerator";
// import BuyPointQRCode1 from "./components/EthereumQRGenerator";
// import BuyPointQRCode2 from "./components/EthereumQRGenerator2";
// import BuyPointQRCode3 from "./components/EthereumQRGenerator3";
// import SmartContractMobileConnector from "./components/EthereumQRGenerator4";

function App() {
  return (
    <>
      {/* <BuyPointQRCode1 useNative={true} /> */}
      {/* <BuyPointQRCode2 useNative={true} /> */}
      {/* <BuyPointQRCode3 /> */}
      {/* <SmartContractMobileConnector /> */}
      <SolanaPayQR />
    </>
  );
}

export default App;
