import axios from "axios";
import crypto from "crypto";
import Joi from "joi";
import { Msg } from "../utils/responseMsg.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    // return res.status(200).json({
    //   transactionId: data.transactionID,
    //   transactionSignature: data.transactionSignature,
    //   paymentMethodList: data.paymentMethodList,
    //   tokenList: data.tokenList || [],
    //   checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}&paymentMethod=CARD,MBWAY`,
    // });

    return res.status(201).json(
      new ApiResponse(
        200,
        {
          transactionId: data.transactionID,
          transactionSignature: data.transactionSignature,
          paymentMethodList: data.paymentMethodList,
          tokenList: data.tokenList || [],
          checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}&paymentMethod=CARD,MBWAY`,
        },
        Msg.PAYMENT_CREATED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    console.log("[SIBS createPayment error]", error);
    const status = error.response?.status || 500;
    console.error("[SIBS createPayment error]", status, error.response?.data);
    return res.status(status).json(
      new ApiResponse(
        status,
        {
          message:
            error.response?.data?.returnStatus?.statusMsg || error.message,
          code:
            error.response?.data?.returnStatus?.returnCode || "UNKNOWN_ERROR",
        },
        Msg.SERVER_ERROR,
      ),
    );
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

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactionId,
          status: data.paymentStatus, // "Success", "Pending", "Declined"
          returnCode: data.returnStatus?.statusCode,
          transactionStatusCode: data.transactionStatusCode,
          transactionStatusDescription: data.transactionStatusDescription,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          savedCard: data.token ? data.token : null,
        },
        Msg.PAYMENT_STATUS_RETRIEVED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error(
      "[SIBS getPaymentStatus error]",
      status,
      error.response?.data,
    );

    return res.status(status).json(
      new ApiResponse(
        status,
        {
          message:
            error.response?.data?.returnStatus?.statusMsg || error.message,
          code:
            error.response?.data?.returnStatus?.returnCode || "UNKNOWN_ERROR",
        },
        Msg.SERVER_ERROR,
      ),
    );
  }
};

// export const getPaymentPage = async (req, res) => {
//   try {
//     const {
//       transactionId,
//       formContext: encodedContext,
//       amount = 10,
//       currency = "EUR",
//     } = req.query;

//     if (!transactionId || !encodedContext) {
//       return res.status(400).send("Missing transactionId or formContext");
//     }

//     const formContext = decodeURIComponent(encodedContext);

//     const formConfig = JSON.stringify({
//       paymentMethodList: ["CARD", "MBWAY"],
//       amount: { value: Number(amount), currency },
//       language: "en",
//       redirectUrl: `${process.env.BASE_URL}/payment/result?transactionId=${transactionId}`,
//     });

//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <style>
//             * { margin: 0; padding: 0; box-sizing: border-box; }
//             body { font-family: sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
//             .container { background: white; padding: 24px; border-radius: 12px; width: 100%; max-width: 480px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <form
//               class="paymentSPG"
//               spg-context="${formContext}"
//               spg-config='${formConfig}'
//             ></form>
//           </div>
//           <script src="https://spg.qly.site1.sibs.pt/assets/js/widget.js?id=${transactionId}"></script>
//         </body>
//       </html>
//     `;

//     return res.send(html);
//   } catch (error) {
//     console.error("[SIBS getPaymentPage error]", error.message);
//     return res.status(500).send("Failed to load payment page");
//   }
// };

export const getPaymentPage = async (req, res) => {
  try {
    const {
      transactionId,
      formContext: encodedContext,
      amount,
      currency = "EUR",
      paymentMethod = "CARD,MBWAY", // ← new param
    } = req.query;

    if (!transactionId || !encodedContext) {
      return res.status(400).send("Missing transactionId or formContext");
    }

    const formContext = decodeURIComponent(encodedContext);

    // ← parse payment methods from query
    const paymentMethodList = paymentMethod.split(",");

    const formConfig = JSON.stringify({
      paymentMethodList, // ← dynamic now
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
    // <script src="https://spg.qly.site1.sibs.pt/assets/js/widget.js?id=${transactionId}"></script>
    // <script src="https://api.sibspayments.com/assets/js/widget.js?id=${transactionId}"></script>
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
    const { name, token, email, amount = 0.1, currency = "EUR" } = req.body;

    const checkoutPayload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `txn_${Date.now()}`,
      },
      customer: {
        customerInfo: { customerName: name, customerEmail: email },
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description: "Payment",
        moto: false,
        paymentType: "PURS",
        amount: { value: amount, currency },
      },
      // ← use saved token instead of card form
      tokenisation: {
        paymentTokens: [
          {
            tokenType: "Card",
            value: token,
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
      },
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactionId: checkoutData.transactionID,
          transactionSignature: checkoutData.transactionSignature,
          checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${checkoutData.transactionID}&formContext=${encodeURIComponent(checkoutData.formContext)}&amount=${amount}&currency=${currency}&paymentMethod=CARD`,
        },
        Msg.PAYMENT_CREATED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json(
      new ApiResponse(
        status,
        {
          message:
            error.response?.data?.returnStatus?.statusMsg || error.message,
        },
        Msg.SERVER_ERROR,
      ),
    );
  }
};

export const refundPayment = async (req, res) => {
  try {
    const {
      amount,
      transactionId,
      currency = "EUR",
      description = "Refund",
    } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    if (!amount) {
      return res.status(400).json({ error: "amount is required" });
    }

    const payload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `refund_${Date.now()}`,
        transactionDescription: description,
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description,
        amount: {
          value: amount,
          currency,
        },
        originalTransaction: {
          id: transactionId,
        },
      },
    };

    const { data } = await axios.post(
      `${process.env.SIBS_BASE_URL}/api/v2/payments/${transactionId}/refund`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[SIBS refundPayment data]", JSON.stringify(data, null, 2));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactionId: data.transactionID,
          originalTransactionId: transactionId,
          status: data.paymentStatus, // "Success", "Declined", "Pending"
          returnCode: data.returnStatus?.statusCode,
          statusMsg: data.returnStatus?.statusMsg,
          amount: data.amount,
        },
        Msg.REFUND_SUCCESS,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS refundPayment error]", status, error.response?.data);
    return res.status(status).json(
      new ApiResponse(
        status,
        {
          message:
            error.response?.data?.returnStatus?.statusMsg || error.message,
          code:
            error.response?.data?.returnStatus?.returnCode || "UNKNOWN_ERROR",
        },
        error.response?.data?.returnStatus?.statusDescription,
      ),
    );
  }
};

export const payWithSavedCardMIT = async (req, res) => {
  try {
    const {
      amount,
      currency = "EUR",
      originalTransactionId,
      type = "UCOF",
    } = req.body;

    if (!amount || !originalTransactionId) {
      return res.status(400).json({
        message: "amount and originalTransactionId are required",
      });
    }

    const payload = {
      merchant: {
        terminalId: String(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `txn_${Date.now()}`,
      },
      transaction: {
        type,
        transactionTimestamp: new Date().toISOString(),
        description: "MIT payment",
        amount: {
          value: Number(amount),
          currency,
        },
        originalTransaction: {
          id: originalTransactionId,
        },
      },
    };

    console.log("[SIBS MIT payload]", JSON.stringify(payload, null, 2));

    const { data } = await axios.post(
      `${process.env.SIBS_BASE_URL}/api/v2/payments/${originalTransactionId}/mit`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[SIBS MIT response]", JSON.stringify(data, null, 2));

    return res.status(200).json({
      transactionId: data.transactionID,
      status: data.paymentStatus,
      returnCode: data.returnStatus?.statusCode,
      statusMsg: data.returnStatus?.statusMsg,
      amount: data.amount,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS MIT error]", status, error.response?.data);
    return res.status(status).json({
      message: error.response?.data?.returnStatus?.statusMsg || error.message,
      code: error.response?.data?.returnStatus?.statusCode || "UNKNOWN_ERROR",
    });
  }
};

export const createAuth = async (req, res) => {
  try {
    const {
      amount,
      description,
      currency = "EUR",
      customerName,
      customerEmail,
    } = req.body;

    console.log("[SIBS createAuth data]", req.body);

    if (!amount) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.AMOUNT_REQUIRED));
    }

    // const payload = {
    //   merchant: {
    //     terminalId: Number(process.env.SIBS_TERMINAL),
    //     channel: "web",
    //     merchantTransactionId: `auth_${Date.now()}`,
    //   },
    //   customer: {
    //     customerInfo: { customerName, customerEmail },
    //   },
    //   transaction: {
    //     transactionTimestamp: new Date().toISOString(),
    //     description,
    //     moto: false,
    //     paymentType: "AUTH", // ← AUTH not PURS
    //     amount: { value: Number(amount), currency },
    //   },
    //   info: {
    //     deviceInfo: {
    //       browserAcceptHeader: req.headers["accept"] || "text/html",
    //       browserJavaEnabled: "false",
    //       browserLanguage:
    //         req.headers["accept-language"]?.split(",")[0] || "en",
    //       browserColorDepth: "24",
    //       browserScreenHeight: "1080",
    //       browserScreenWidth: "1920",
    //       browserTZ: "0",
    //       browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
    //     },
    //   }
    //   // tokenisation: {
    //   //   tokenisationRequest: { tokeniseCard: true },
    //   // },
    // };

    const payload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `auth_${Date.now()}`,
      },
      customer: {
        customerInfo: { customerName, customerEmail },
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description,
        moto: false,
        paymentType: "AUTH",
        amount: { value: Number(amount), currency },
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
      // ← tokenisation block completely removed
    };
    const { data } = await axios.post(process.env.SIBS_PAYMENT_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
        "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactionId: data.transactionID,
          // formContext: data.formContext,
          // transactionSignature: data.transactionSignature,
          paymentMethodList: data.paymentMethodList,
          checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}`,
        },
        Msg.PAYMENT_CREATED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS createAuth error]", status, error.response?.data);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          {},
          error.response?.data?.returnStatus?.statusMsg || error.message,
        ),
      );
  }
};

export const capturePayment = async (req, res) => {
  try {
    const {
      previousTransactionId,
      amount,
      description,
      captureNumber,
      maxCaptures,
    } = req.body;

    const schema = Joi.object({
      previousTransactionId: Joi.string().required(),
      amount: Joi.number().required(),
      description: Joi.string().optional(),
      captureNumber: Joi.number().optional(),
      maxCaptures: Joi.number().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const payload = {
      merchant: {
        terminalId: String(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `capt_${Date.now()}`,
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description,
        amount: { value: Number(amount), currency: "EUR" },
        originalTransaction: { id: previousTransactionId },
      },
      saleContext: {
        splitPayment: {
          split: true,
          paymentNumber: captureNumber,
          maxPayments: maxCaptures,
        },
      },
    };

    const { data } = await axios.post(
      `${process.env.SIBS_BASE_URL}/api/v2/payments/${previousTransactionId}/capture`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[SIBS capturePayment]", JSON.stringify(data, null, 2));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactionId: data.transactionID,
          previousTransactionId,
          status: data.paymentStatus,
          returnCode: data.returnStatus?.statusCode,
          amount: data.amount,
        },
        Msg.PAYMENT_CAPTURED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS capturePayment error]", status, error.response?.data);
    return res.status(status).json({
      message: error.response?.data?.returnStatus?.statusMsg || error.message,
      code: error.response?.data?.returnStatus?.statusCode || "UNKNOWN_ERROR",
    });
  }
};

export const cancelPayment = async (req, res) => {
  try {
    const { transactionId, description, amount } = req.body;
    const schema = Joi.object({
      transactionId: Joi.string().required(),
      description: Joi.string().required(),
      amount: Joi.number().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const payload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `canc_${Date.now()}`,
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description,
        amount: {
          value: Number(amount),
          currency: "EUR",
        },
        originalTransaction: { id: transactionId },
      },
    };

    console.log(
      "[SIBS cancelPayment payload]",
      JSON.stringify(payload, null, 2),
    );
    console.log(
      "[SIBS cancelPayment URL]",
      `${process.env.SIBS_BASE_URL}/api/v2/payments/${transactionId}/cancellation`,
    );

    const { data } = await axios.post(
      `${process.env.SIBS_BASE_URL}/api/v2/payments/${transactionId}/cancellation`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[SIBS cancelPayment]", JSON.stringify(data, null, 2));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactionID: data.transactionID,
          amount: data.amount,
          paymentStatus: data.paymentStatus,
          execution: data.execution,
        },
        Msg.PAYMENT_CANCELLED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS cancelPayment error]", status, error.response?.data);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const sibsWebhook = async (req, res) => {
  try {
    const iv = req.headers["x-initialization-vector"];
    const authTag = req.headers["x-authentication-tag"];

    if (!iv || !authTag) {
      console.error("[SIBS Webhook] Missing headers");
      return res.status(400).json({ message: "Missing decryption headers" });
    }

    const key = Buffer.from(process.env.SIBS_WEBHOOK_KEY, "utf-8");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decrypted = decipher.update(
      Buffer.from(req.body, "base64"),
      undefined,
      "utf-8",
    );
    decrypted += decipher.final("utf-8");

    const payload = JSON.parse(decrypted);

    console.log("[SIBS Webhook payload]", JSON.stringify(payload, null, 2));

    const {
      notificationID,
      paymentStatus,
      paymentMethod,
      paymentType,
      transactionID,
      amount,
      merchant,
    } = payload;

    if (paymentStatus === "Success" && paymentType === "PURS") {
      console.log(
        `[Webhook] PURS Success - txn: ${transactionID}, amount: ${amount?.value} ${amount?.currency}`,
      );
    } else if (paymentStatus === "Success" && paymentType === "AUTH") {
      console.log(`[Webhook] AUTH Success - txn: ${transactionID}`);
    } else if (paymentStatus === "Success" && paymentType === "CAPT") {
      console.log(
        `[Webhook] CAPT Success - txn: ${transactionID}, amount: ${amount?.value}`,
      );
    } else if (paymentStatus === "Success" && paymentType === "RFND") {
      console.log(`[Webhook] RFND Success - txn: ${transactionID}`);
    } else if (paymentStatus === "Success" && paymentType === "CANC") {
      console.log(`[Webhook] CANC Success - txn: ${transactionID}`);
    } else if (paymentStatus === "Declined") {
      console.log(
        `[Webhook] Declined - txn: ${transactionID}, method: ${paymentMethod}`,
      );
    }

    return res.status(200).json({
      statusCode: "200",
      statusMsg: "Success",
      notificationID,
    });
  } catch (error) {
    console.error("[SIBS Webhook error]", error.message);
   
    return res.status(200).json({
      statusCode: "200",
      statusMsg: "Success",
      notificationID: null,
    });
  }
};
