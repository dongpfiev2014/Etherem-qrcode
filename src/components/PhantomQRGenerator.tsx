import React, { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { encodeURL, createQR } from "@solana/pay";
import BigNumber from "bignumber.js";

const SolanaPayQR = () => {
  const [qrCode, setQrCode] = useState(null);
  const [amount, setAmount] = useState("0.1");
  const [recipient, setRecipient] = useState("F7qYwJXKk46fqRHzhnvpY4kBhnrDdysKGUcnycNW9AHu");
  const [reference, setReference] = useState("");
  const [label, setLabel] = useState("My Store");
  const [message, setMessage] = useState("Thanks for your purchase!");
  const [memo, setMemo] = useState("Order #123");

  // SPL Token mặc định (USDC)
  const splToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  // Tạo QR code khi các tham số thay đổi
  useEffect(() => {
    if (!recipient) return;

    try {
      const amountBigNumber = new BigNumber(amount);
      const referenceKey = reference ? new PublicKey(reference) : undefined;

      const url = encodeURL({
        recipient: new PublicKey(recipient),
        amount: amountBigNumber,
        splToken,
        reference: referenceKey,
        label,
        message,
        memo,
      });

      // Tạo QR code
      const qr = createQR(url, 512, "transparent");

      // Cập nhật QR code vào DOM
      const qrContainer = document.getElementById("qr-container");
      if (qrContainer) {
        qrContainer.innerHTML = "";
        qr.append(qrContainer);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }, [amount, recipient, reference, label, message, memo]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Solana Pay QR Generator</h2>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Recipient Wallet Address:</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Enter Solana wallet address"
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            placeholder="0.1"
            step="0.01"
            min="0"
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Reference (optional):</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Enter reference public key"
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Label (optional):</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Store name"
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Message (optional):</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Payment message"
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Memo (optional):</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Transaction memo"
          />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <h3>Payment QR Code</h3>
        {recipient ? (
          <div
            id="qr-container"
            style={{
              display: "inline-block",
              padding: "20px",
              backgroundColor: "white",
              borderRadius: "8px",
              marginTop: "20px",
            }}
          ></div>
        ) : (
          <p style={{ color: "#666" }}>Please enter a recipient address to generate QR code</p>
        )}
      </div>

      <div style={{ marginTop: "30px", color: "#666", fontSize: "14px" }}>
        <p>
          <strong>Token:</strong> USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
        </p>
        <p>Scan this QR code with a Solana Pay compatible wallet to make a payment.</p>
      </div>
    </div>
  );
};

export default SolanaPayQR;
