import axios from "axios";
import { ApiResponse } from "../utils/apiResponse.js";
import { Msg } from "../utils/responseMsg.js";

export const createPayment = async (req, res) => {
  try {
    const { amount, currency, description, customerName, customerEmail } =
      req.body ?? {};

    console.log("req.body ------------>", req.body);

    const payload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `txn_${Date.now()}`,
      },
      customer: {
        customerInfo: {
          customerName,
          customerEmail,
        },
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description,
        moto: false,
        paymentType: "PURS",
        amount: {
          value: amount,
          currency,
        },
      },
      info: {
        deviceInfo: {
          browserAcceptHeader: req.headers["accept"] || "text/html",
          browserJavaEnabled: "false", // ← string
          browserLanguage:
            req.headers["accept-language"]?.split(",")[0] || "en",
          browserColorDepth: "24",
          browserScreenHeight: "1080",
          browserScreenWidth: "1920",
          browserTZ: "0",
          browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
        },
      },
    };

    const { data } = await axios.post(process.env.SIBS_PAYMENT_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
        "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({
      transactionId: data.transactionID,
      formContext: data.formContext,
      transactionSignature: data.transactionSignature,
      paymentMethodList: data.paymentMethodList,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const sibsError = error.response?.data;

    console.error(
      "[SIBS createPayment error]",
      status,
      sibsError || error.message,
    );

    return res.status(status).json({
      message: sibsError?.returnStatus?.statusMsg || error.message,
      code: sibsError?.returnStatus?.returnCode || "UNKNOWN_ERROR",
    });
  }
};
