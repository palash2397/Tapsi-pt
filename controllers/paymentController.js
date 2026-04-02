import axios from "axios";
import { Msg } from "../utils/responseMsg.js";

export const createPayment = async (req, res) => {
  try {
    const { amount, currency, description, customerName, customerEmail } =
      req.body ?? {};

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
          browserJavaEnabled: "false",
          browserLanguage:
            req.headers["accept-language"]?.split(",")[0] || "en",
          browserColorDepth: "24",
          browserScreenHeight: "1080",
          browserScreenWidth: "1920",
          browserTZ: "0",
          browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
        },
      },

      tokenisation: {
        tokenisationRequest: {
          tokeniseCard: true,
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

    console.log("[SIBS createPayment data]", data);

    return res.status(200).json({
      transactionId: data.transactionID,
      transactionSignature: data.transactionSignature,
      paymentMethodList: data.paymentMethodList,
      tokenList: data.tokenList || [],
      checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}`,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS createPayment error]", status, error.response?.data);
    return res.status(status).json({
      message: error.response?.data?.returnStatus?.statusMsg || error.message,
      code: error.response?.data?.returnStatus?.returnCode || "UNKNOWN_ERROR",
    });
  }
};

export const paymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const { data } = await axios.get(
      `${process.env.SIBS_BASE_URL}/api/v2/payments/${transactionId}/status`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
          "Content-Type": "application/json",
        },
      },
    );

    // console.log("[SIBS getPaymentStatus data]", data);
    console.log("[SIBS getPaymentStatus data]", JSON.stringify(data, null, 2));

   return res.status(200).json({
      transactionId,
      status: data.paymentStatus,            // "Success", "Pending", "Declined"
      returnCode: data.returnStatus?.statusCode,
      transactionStatusCode: data.transactionStatusCode,
      transactionStatusDescription: data.transactionStatusDescription,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      // token comes here after Success
      savedCard: data.token ? data.token : null,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    console.error(
      "[SIBS getPaymentStatus error]",
      status,
      error.response?.data,
    );

    return res.status(status).json({
      message: error.response?.data?.returnStatus?.statusMsg || error.message,
      code: error.response?.data?.returnStatus?.returnCode || "UNKNOWN_ERROR",
    });
  }
};

export const getPaymentPage = async (req, res) => {
  try {
    const {
      transactionId,
      formContext: encodedContext,
      amount = 10,
      currency = "EUR",
    } = req.query;

    if (!transactionId || !encodedContext) {
      return res.status(400).send("Missing transactionId or formContext");
    }

    const formContext = decodeURIComponent(encodedContext);

    const formConfig = JSON.stringify({
      paymentMethodList: ["CARD", "MBWAY"],
      amount: { value: Number(amount), currency },
      language: "en",
      redirectUrl: `${process.env.BASE_URL}/payment/result?transactionId=${transactionId}`,
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .container { background: white; padding: 24px; border-radius: 12px; width: 100%; max-width: 480px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <form
              class="paymentSPG"
              spg-context="${formContext}"
              spg-config='${formConfig}'
            ></form>
          </div>
          <script src="https://spg.qly.site1.sibs.pt/assets/js/widget.js?id=${transactionId}"></script>
        </body>
      </html>
    `;

    return res.send(html);
  } catch (error) {
    console.error("[SIBS getPaymentPage error]", error.message);
    return res.status(500).send("Failed to load payment page");
  }
};

export const paymentResult = async (req, res) => {
  const { transactionId } = req.query;

  console.log("Payment result received:", req.query);

  // Just return a simple success page
  // Flutter will detect this URL and close WebView
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; margin: 0; }
          .box { background: white; padding: 32px; border-radius: 12px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
          h2 { color: #2e7d32; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>✅ Payment Complete</h2>
          <p>Transaction ID: ${transactionId}</p>
          <p>You can close this window.</p>
        </div>
      </body>
    </html>
  `);
};


export const payWithSavedCard = async (req, res) => {
  try {
    const {
      userId,
      cardId,
      amount = 10,
      currency = "EUR",
      description = "Payment",
    } = req.body;

    // 1. Get token from DB
    const card = await Card.findOne({ where: { id: cardId, userId } });
    if (!card) return res.status(404).json({ message: "Card not found" });

    // 2. Create checkout with saved token
    const checkoutPayload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `txn_${Date.now()}`,
      },
      customer: {
        customerInfo: { customerName: "User", customerEmail: "user@example.com" },
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description,
        moto: false,
        paymentType: "PURS",
        amount: { value: amount, currency },
      },
      // ← use saved token instead of card form
      tokenisation: {
        paymentTokens: [
          {
            tokenType: card.tokenType,
            value: card.token,
          },
        ],
      },
    };

    const { data: checkoutData } = await axios.post(
      process.env.SIBS_PAYMENT_URL,
      checkoutPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
          "Content-Type": "application/json",
        },
      }
    );

    // 3. Show mini widget (only CVV needed)
    return res.status(200).json({
      transactionId: checkoutData.transactionID,
      transactionSignature: checkoutData.transactionSignature,
      maskedPAN: card.maskedPAN,
      checkoutPageUrl: `${process.env.BASE_URL}/payment/sibs/page?transactionId=${checkoutData.transactionID}&formContext=${encodeURIComponent(checkoutData.formContext)}&amount=${amount}&currency=${currency}`,
    });

  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({
      message: error.response?.data?.returnStatus?.statusMsg || error.message,
    });
  }
};
