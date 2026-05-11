import axios from "axios";
import crypto from "crypto";
import { randomUUID } from "crypto";
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
          status: data.paymentStatus,
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

        /* ── Loader ── */
        #loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          gap: 16px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #2e7d32;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        #loader p {
          color: #666;
          font-size: 14px;
        }

        /* ── Hide form until widget ready ── */
        #payment-form {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">

        <!-- Show loader while widget loads -->
        <div id="loader">
          <div class="spinner"></div>
          <p>Loading payment...</p>
        </div>

        <!-- Hidden until widget is ready -->
        <div id="payment-form">
          <form
            class="paymentSPG"
            spg-context="${formContext}"
            spg-config='${formConfig}'
          ></form>
        </div>

      </div>

      <script>
        // ← Load widget script dynamically AFTER DOM is ready
        window.addEventListener("load", function () {
          var script = document.createElement("script");
          script.src = "https://spg.qly.site1.sibs.pt/assets/js/widget.js?id=${transactionId}";

          script.onload = function () {
            // Widget loaded — show form, hide loader
            document.getElementById("loader").style.display = "none";
            document.getElementById("payment-form").style.display = "block";
          };

          script.onerror = function () {
            // Widget failed to load
            document.getElementById("loader").innerHTML =
              "<p style='color:red;text-align:center;'>Failed to load payment. Please try again.</p>";
          };

          document.body.appendChild(script);
        });
      </script>
    </body>
  </html>
     `;

    // const html = `
    //   <!DOCTYPE html>
    //   <html>
    //     <head>
    //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //       <style>
    //         * { margin: 0; padding: 0; box-sizing: border-box; }
    //         body { font-family: sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    //         .container { background: white; padding: 24px; border-radius: 12px; width: 100%; max-width: 480px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
    //       </style>
    //     </head>
    //     <body>
    //       <div class="container">
    //         <form
    //           class="paymentSPG"
    //           spg-context="${formContext}"
    //           spg-config='${formConfig}'
    //         ></form>
    //       </div>

    //      <script src="https://spg.qly.site1.sibs.pt/assets/js/widget.js?id=${transactionId}"></script>
    //     </body>
    //   </html>
    // `;
    // <script src="https://spg.qly.site1.sibs.pt/assets/js/widget.js?id=${transactionId}"></script>
    // <script src="https://api.sibspayments.com/assets/js/widget.js?id=${transactionId}"></script>
    return res.send(html);
  } catch (error) {
    console.error("[SIBS getPaymentPage error]", error.message);
    return res.status(500).send("Failed to load payment page");
  }
};

// export const paymentResult = async (req, res) => {
//   const { transactionId } = req.query;
//   console.log("Payment result received:", req.query);

//   const FINAL_STATUSES = ["Success", "Declined", "Failed", "Expired"];
//   const POLL_INTERVAL_MS = 3000;
//   const MAX_ATTEMPTS = 20;

//   let paymentStatus = "Pending";
//   let isSuccess = false;

//   for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
//     try {
//       const { data } = await axios.get(
//         `${process.env.SIBS_PAYMENT_URL}/${transactionId}/status`,
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
//             "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
//           },
//         },
//       );

//       paymentStatus = data.paymentStatus;
//       console.log(
//         `[SIBS MBWay poll] attempt ${attempt + 1} → ${paymentStatus}`,
//       );

//       if (FINAL_STATUSES.includes(paymentStatus)) {
//         isSuccess = paymentStatus === "Success";
//         break;
//       }
//     } catch (err) {
//       console.error("[SIBS paymentResult check failed]", err.response?.data);
//       break;
//     }
//     await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
//   }

//   const timedOut = !["Success", "Declined", "Failed", "Expired"].includes(
//     paymentStatus,
//   );

//   return res.send(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <style>
//           body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; margin: 0; }
//           .box { background: white; padding: 32px; border-radius: 12px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
//           h2 { margin-bottom: 8px; }
//           p { color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="box">
//           ${
//             timedOut
//               ? `<h2 style="color:#e65100">⏳ Payment Pending</h2>
//                <p>Please confirm the payment in your MBWay app.</p>
//                <p>We'll notify you once it's confirmed.</p>`
//               : isSuccess
//                 ? `<h2 style="color:#2e7d32">✅ Payment Complete</h2>`
//                 : `<h2 style="color:#c62828">❌ Payment Failed</h2>
//                  <p>Status: ${paymentStatus}</p>`
//           }
//           <p>Transaction ID: ${transactionId}</p>
//           <p>You can close this window.</p>
//         </div>
//       </body>
//     </html>
//   `);
// };

export const paymentResult = async (req, res) => {
  const { transactionId } = req.query;
  console.log("Payment result received:", req.query);

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; margin: 0; }
          .box { background: white; padding: 32px; border-radius: 12px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
          h2 { margin-bottom: 8px; }
          p { color: #666; }
          .spinner { width: 32px; height: 32px; border: 4px solid #f0f0f0; border-top: 4px solid #e65100; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="box" id="status-box">
          <div class="spinner" id="spinner"></div>
          <h2 style="color:#e65100" id="title">⏳ Checking Payment...</h2>
          <p id="msg">Please wait while we confirm your payment.</p>
          <p style="margin-top:12px;font-size:13px;color:#aaa">Transaction ID: ${transactionId}</p>
        </div>

        <script>
          const transactionId = "${transactionId}";
          const FINAL = ["Success", "Declined", "Failed", "Expired"];
          let attempts = 0;
          const MAX = 20; // 20 × 3s = 60s

          async function checkStatus() {
            try {
              const res = await fetch("${process.env.BASE_URL}/payment/status?transactionId=" + transactionId);
              const data = await res.json();
              const status = data.paymentStatus;

              if (status === "Success") {
                document.getElementById("spinner").style.display = "none";
                document.getElementById("title").textContent = "✅ Payment Complete";
                document.getElementById("title").style.color = "#2e7d32";
                document.getElementById("msg").textContent = "Your payment was confirmed.";
                return;
              }

              if (["Declined", "Failed", "Expired"].includes(status)) {
                document.getElementById("spinner").style.display = "none";
                document.getElementById("title").textContent = "❌ Payment Failed";
                document.getElementById("title").style.color = "#c62828";
                document.getElementById("msg").textContent = "Status: " + status;
                return;
              }

              // still pending
              attempts++;
              if (attempts < MAX) {
                setTimeout(checkStatus, 3000);
              } else {
                document.getElementById("spinner").style.display = "none";
                document.getElementById("title").textContent = "⏳ Payment Pending";
                document.getElementById("title").style.color = "#e65100";
                document.getElementById("msg").textContent = "Payment is taking longer than expected. Please check your app or try again.";
              }
            } catch (err) {
              attempts++;
              if (attempts < MAX) setTimeout(checkStatus, 3000);
            }
          }

          setTimeout(checkStatus, 3000);
        </script>
      </body>
    </html>
  `);
};

export const getPaymentStatus = async (req, res) => {
  const { transactionId } = req.query;
  try {
    const { data } = await axios.get(
      `${process.env.SIBS_PAYMENT_URL}/${transactionId}/status`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
        },
      },
    );
    return res.json({ paymentStatus: data.paymentStatus });
  } catch (err) {
    return res.status(500).json({ paymentStatus: "Unknown" });
  }
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

    const schema = Joi.object({
      amount: Joi.number().required(),
      transactionId: Joi.string().required(),
    });

    const { error } = schema.validate({ amount, transactionId });

    if (error) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { message: error.details[0].message },
            Msg.VALIDATION_ERROR,
          ),
        );
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
    const { amount, currency, originalTransactionId } = req.body;

    if (!amount || !originalTransactionId) {
      return res.status(400).json({
        message: "amount and originalTransactionId are required",
      });
    }

    const payload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `txn_${Date.now()}`,
      },
      transaction: {
        type: "UCOF",
        transactionTimestamp: new Date().toISOString(),
        description: "MIT payment",
        amount: {
          value: Number(amount),
          currency: currency || "EUR",
        },
        originalTransaction: {
          id: originalTransactionId,
        },
        validityDate: "2027-12-31T00:00:00.000Z",
        amountQualifier: "ESTIMATED",
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

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactionId: data.transactionID,
          status: data.paymentStatus,
          returnCode: data.returnStatus?.statusCode,
          statusMsg: data.returnStatus?.statusMsg,
          amount: data.amount,
        },
        Msg.PAYMENT_CREATED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS MIT error]", status, error.response?.data);
    return res
      .status(status)
      .json(
        new ApiResponse(
          status,
          {},
          error.response?.data?.returnStatus?.statusMsg || error.message,
        ),
      );
  }
};

// export const createAuth = async (req, res) => {
//   try {
//     const {
//       amount,
//       description,
//       currency = "EUR",
//       customerName,
//       customerEmail,
//     } = req.body;

//     console.log("[SIBS createAuth data]", req.body);

//     if (!amount) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, Msg.AMOUNT_REQUIRED));
//     }

//     // const payload = {
//     //   merchant: {
//     //     terminalId: Number(process.env.SIBS_TERMINAL),
//     //     channel: "web",
//     //     merchantTransactionId: `auth_${Date.now()}`,
//     //   },
//     //   customer: {
//     //     customerInfo: { customerName, customerEmail },
//     //   },
//     //   transaction: {
//     //     transactionTimestamp: new Date().toISOString(),
//     //     description,
//     //     moto: false,
//     //     paymentType: "AUTH", // ← AUTH not PURS
//     //     amount: { value: Number(amount), currency },
//     //   },
//     //   info: {
//     //     deviceInfo: {
//     //       browserAcceptHeader: req.headers["accept"] || "text/html",
//     //       browserJavaEnabled: "false",
//     //       browserLanguage:
//     //         req.headers["accept-language"]?.split(",")[0] || "en",
//     //       browserColorDepth: "24",
//     //       browserScreenHeight: "1080",
//     //       browserScreenWidth: "1920",
//     //       browserTZ: "0",
//     //       browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
//     //     },
//     //   }
//     //   // tokenisation: {
//     //   //   tokenisationRequest: { tokeniseCard: true },
//     //   // },
//     // };

//     const payload = {
//       merchant: {
//         terminalId: Number(process.env.SIBS_TERMINAL),
//         channel: "web",
//         merchantTransactionId: `auth_${Date.now()}`,
//       },
//       customer: {
//         customerInfo: { customerName, customerEmail },
//       },
//       transaction: {
//         transactionTimestamp: new Date().toISOString(),
//         description,
//         moto: false,
//         paymentType: "AUTH",
//         amount: { value: Number(amount), currency },
//       },
//       info: {
//         deviceInfo: {
//           browserAcceptHeader: req.headers["accept"] || "text/html",
//           browserJavaEnabled: "false",
//           browserLanguage:
//             req.headers["accept-language"]?.split(",")[0] || "en",
//           browserColorDepth: "24",
//           browserScreenHeight: "1080",
//           browserScreenWidth: "1920",
//           browserTZ: "0",
//           browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
//         },
//       },
//       tokenisation: {
//         tokenisationRequest: { tokeniseCard: true },
//       },
//     };
//     const { data } = await axios.post(process.env.SIBS_PAYMENT_URL, payload, {
//       headers: {
//         Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
//         "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
//         "Content-Type": "application/json",
//       },
//     });

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           transactionId: data.transactionID,
//           // formContext: data.formContext,
//           transactionSignature: data.transactionSignature,
//           paymentMethodList: data.paymentMethodList,
//           checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}`,
//         },
//         Msg.PAYMENT_CREATED_SUCCESSFULLY,
//       ),
//     );
//   } catch (error) {
//     const status = error.response?.status || 500;
//     console.error("[SIBS createAuth error]", status, error.response?.data);
//     return res
//       .status(500)
//       .json(
//         new ApiResponse(
//           500,
//           {},
//           error.response?.data?.returnStatus?.statusMsg || error.message,
//         ),
//       );
//   }
// };

export const createAuth = async (req, res) => {
  try {
    const {
      amount,
      currency = "EUR",
      description = "Tapsi Ride Payment",
      customerName = "Customer",
      customerEmail = "customer@example.com",
      saveCard,
    } = req.body;

    if (!amount)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "amount is required"));

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
        paymentType: saveCard ? "PURS" : "AUTH",
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

      ...(saveCard && {
        merchantInitiatedTransaction: {
          type: "UCOF",
          validityDate: "2027-12-31T00:00:00.000Z",
          amountQualifier: "ESTIMATED",
        },
      }),
    };
    console.log("[SIBS createAuth payload]", JSON.stringify(payload, null, 2));

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
          transactionSignature: data.transactionSignature,
          paymentMethodList: data.paymentMethodList,
          checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}`,
          saveCard,
        },
        Msg.PAYMENT_CREATED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS createAuth error]", status, error.response?.data);
    return res
      .status(status)
      .json(
        new ApiResponse(
          status,
          {},
          error.response?.data?.returnStatus?.statusMsg || error.message,
        ),
      );
  }
};


export const createAuthWithMbway = async (req, res) => {
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
      }
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
          transactionSignature: data.transactionSignature,
          paymentMethodList: data.paymentMethodList,
          checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}&paymentMethod=MBWAY`,
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


export const createPaymentDirectCIT = async (req, res) => {
  try {
    const {
      amount,
      currency = "EUR",
      description = "Tapsi Ride Payment",
      citTransactionId,   // ← saved transactionId from first payment
    } = req.body;

    const schema = Joi.object({
      amount: Joi.number().required(),
      citTransactionId: Joi.string().required(),
      currency: Joi.string().optional(),
      description: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json(new ApiResponse(400, {}, error.details[0].message));

    const payload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `mit_${Date.now()}`,
      },
      transaction: {
        type: "UCOF",
        transactionTimestamp: new Date().toISOString(),
        description,
        amount: { value: Number(amount), currency },
        originalTransaction: { id: citTransactionId },
      },
    };

    console.log("[SIBS directPayment payload]", JSON.stringify(payload, null, 2));

    const { data } = await axios.post(
      `${process.env.SIBS_BASE_URL}/api/v2/payments/${citTransactionId}/mit`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
          "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[SIBS directPayment response]", JSON.stringify(data, null, 2));

    return res.status(200).json(
      new ApiResponse(200, {
        transactionId: data.transactionID,  // ← use for capture
        citTransactionId,
        status: data.paymentStatus,
        returnCode: data.returnStatus?.statusCode,
        amount: data.amount,
      }, "Direct payment successful")
    );

  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[SIBS directPayment error]", status, error.response?.data);
    return res.status(status).json(
      new ApiResponse(status, {}, error.response?.data?.returnStatus?.statusMsg || error.message)
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

// export const sibsWebhook = async (req, res) => {
//   let notificationID = null;

//   try {
//     const iv = req.headers["x-initialization-vector"];
//     const authTag = req.headers["x-authentication-tag"];

//     let payload;

//     // if (iv && authTag) {
//     //   const key = Buffer.from(process.env.SIBS_WEBHOOK_KEY, "utf-8");
//     //   const decipher = crypto.createDecipheriv(
//     //     "aes-256-gcm",
//     //     key,
//     //     Buffer.from(iv, "base64"),
//     //   );
//     //   decipher.setAuthTag(Buffer.from(authTag, "base64"));
//     //   const decrypted =
//     //     decipher.update(Buffer.from(req.body, "base64"), undefined, "utf-8") +
//     //     decipher.final("utf-8");
//     //   payload = JSON.parse(decrypted);
//     // } else {
//     //   payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
//     // }

//     // notificationID = payload.notificationID;

//     if (iv && authTag) {
//       const key = Buffer.from(process.env.SIBS_WEBHOOK_KEY, "utf-8");
//       const decipher = crypto.createDecipheriv(
//         "aes-256-gcm",
//         key,
//         Buffer.from(iv, "base64"),
//       );
//       decipher.setAuthTag(Buffer.from(authTag, "base64"));
//       const decrypted =
//         decipher.update(Buffer.from(req.body, "base64"), undefined, "utf-8") +
//         decipher.final("utf-8");
//       payload = JSON.parse(decrypted);
//     } else {
//       if (Buffer.isBuffer(req.body)) {
//         payload = JSON.parse(req.body.toString("utf-8"));
//       } else if (typeof req.body === "string") {
//         payload = JSON.parse(req.body);
//       } else {
//         payload = req.body;
//       }
//     }

//     notificationID = payload.notificationID;
//     console.log("[SIBS Webhook notificationID]", notificationID);
//     const { paymentStatus, paymentType, paymentMethod, transactionID, amount } =
//       payload;

//     console.log("[SIBS Webhook]", {
//       paymentStatus,
//       paymentType,
//       paymentMethod,
//       transactionID,
//       amount,
//     });

//     const handlers = {
//       PURS: () => {},
//       AUTH: () => {},
//       CAPT: () => {},
//       RFND: () => {},
//       CANC: () => {},
//     };

//     if (paymentStatus === "Success" && handlers[paymentType]) {
//       handlers[paymentType]();
//     } else if (paymentStatus === "Declined") {
//       console.warn(
//         `[SIBS Webhook] Declined - txn: ${transactionID}, method: ${paymentMethod}`,
//       );
//     } else if (paymentStatus === "Pending") {
//       console.log(`[SIBS Webhook] Pending - txn: ${transactionID}`);
//     }
//   } catch (error) {
//     console.error("[SIBS Webhook error]", error.message);
//   }

//   return res.status(200).json({
//     statusCode: "200",
//     statusMsg: "Success",
//     notificationID,
//   });
// };

// export const createAuthAndSaveCard = async (req, res) => {
//   try {
//     const {
//       amount,
//       currency = "EUR",
//       description = "Ride booking",
//       customerName = "Customer",
//       customerEmail = "customer@example.com",
//     } = req.body;

//     if (!amount)
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, "amount is required"));

//     const payload = {
//       merchant: {
//         terminalId: Number(process.env.SIBS_TERMINAL),
//         channel: "web",
//         merchantTransactionId: `auth_${Date.now()}`,
//       },
//       customer: {
//         customerInfo: { customerName, customerEmail },
//       },
//       transaction: {
//         transactionTimestamp: new Date().toISOString(),
//         description,
//         moto: false,
//         paymentType: "AUTH",
//         amount: { value: Number(amount), currency },
//       },
//       info: {
//         deviceInfo: {
//           browserAcceptHeader: req.headers["accept"] || "text/html",
//           browserJavaEnabled: "false",
//           browserLanguage:
//             req.headers["accept-language"]?.split(",")[0] || "en",
//           browserColorDepth: "24",
//           browserScreenHeight: "1080",
//           browserScreenWidth: "1920",
//           browserTZ: "0",
//           browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
//         },
//       },

//       tokenisation: {
//         tokenisationRequest: { tokeniseCard: true },
//       },
//     };

//     const { data } = await axios.post(process.env.SIBS_PAYMENT_URL, payload, {
//       headers: {
//         Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
//         "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
//         "Content-Type": "application/json",
//       },
//     });

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           transactionId: data.transactionID,
//           formContext: data.formContext,
//           transactionSignature: data.transactionSignature,
//           checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}`,
//         },
//         "Auth created successfully",
//       ),
//     );
//   } catch (error) {
//     const status = error.response?.status || 500;
//     console.error(
//       "[SIBS createAuthAndSaveCard error]",
//       status,
//       error.response?.data,
//     );
//     return res
//       .status(status)
//       .json(
//         new ApiResponse(
//           status,
//           {},
//           error.response?.data?.returnStatus?.statusMsg || error.message,
//         ),
//       );
//   }
// };

export const sibsWebhook = async (req, res) => {
  let notificationID = null;

  try {
    const iv = req.headers["x-initialization-vector"];
    const authTag = req.headers["x-authentication-tag"];

    let payload;

    if (iv && authTag) {
      const key = Buffer.from(process.env.SIBS_WEBHOOK_KEY, "base64");

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(iv, "base64"),
      );

      decipher.setAuthTag(Buffer.from(authTag, "base64"));

      const decrypted =
        decipher.update(
          Buffer.from(req.body.toString(), "base64"),
          undefined,
          "utf-8",
        ) + decipher.final("utf-8");

      payload = JSON.parse(decrypted);

      console.log("[SIBS Webhook decrypted]", payload);
    } else {
      if (Buffer.isBuffer(req.body)) {
        payload = JSON.parse(req.body.toString("utf-8"));
      } else if (typeof req.body === "string") {
        payload = JSON.parse(req.body);
      } else {
        payload = req.body;
      }
    }

    notificationID = payload.notificationID;

    console.log("[SIBS Webhook notificationID]", notificationID);

    const { paymentStatus, paymentType, paymentMethod, transactionID, amount } =
      payload;

    console.log("[SIBS Webhook]", {
      paymentStatus,
      paymentType,
      paymentMethod,
      transactionID,
      amount,
    });

    // 🎯 Handle payment types
    const handlers = {
      PURS: () => {
        console.log(`[PURS] Purchase success for txn ${transactionID}`);
      },

      AUTH: () => {
        console.log(`[AUTH] Amount authorized for txn ${transactionID}`);
      },

      CAPT: () => {
        console.log(`[CAPT] Amount captured for txn ${transactionID}`);
      },

      RFND: () => {
        console.log(`[RFND] Refund completed for txn ${transactionID}`);
      },

      CANC: () => {
        console.log(`[CANC] Authorization cancelled for txn ${transactionID}`);
      },

      MITR: () => {
        console.log(`[MITR] MIT - txn: ${transactionID}`);
      },
    };

    if (paymentStatus === "Success" && handlers[paymentType]) {
      handlers[paymentType]();
    } else if (paymentStatus === "Declined") {
      console.warn(
        `[SIBS Webhook] Declined - txn: ${transactionID}, method: ${paymentMethod}`,
      );
    } else if (paymentStatus === "Pending") {
      console.log(`[SIBS Webhook] Pending - txn: ${transactionID}`);
    }
  } catch (error) {
    console.error("[SIBS Webhook error]", error.message);
  }

  return res.status(200).json({
    statusCode: "200",
    statusMsg: "Success",
    notificationID,
  });
};

// export const createAuthWithSavedCard = async (req, res) => {
//   try {
//     const {
//       amount,
//       currency = "EUR",
//       description = "Ride booking",
//       token,
//       tokenType = "Card",
//     } = req.body;

//     const schema = Joi.object({
//       amount: Joi.number().required(),
//       token: Joi.string().required(),
//     });

//     const { error } = schema.validate({ amount, token });

//     if (error) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, error.details[0].message));
//     }

//     const payload = {
//       merchant: {
//         terminalId: Number(process.env.SIBS_TERMINAL),
//         channel: "web",
//         merchantTransactionId: `auth_${Date.now()}`,
//       },
//       transaction: {
//         transactionTimestamp: new Date().toISOString(),
//         description,
//         moto: false,
//         paymentType: "AUTH",
//         amount: { value: Number(amount), currency },
//       },
//       info: {
//         deviceInfo: {
//           browserAcceptHeader: req.headers["accept"] || "text/html",
//           browserJavaEnabled: "false",
//           browserLanguage:
//             req.headers["accept-language"]?.split(",")[0] || "en",
//           browserColorDepth: "24",
//           browserScreenHeight: "1080",
//           browserScreenWidth: "1920",
//           browserTZ: "0",
//           browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
//         },
//       },
//       tokenisation: {
//         paymentTokens: [
//           {
//             tokenType,
//             value: token,
//           },
//         ],
//       },
//     };

//     const { data } = await axios.post(process.env.SIBS_PAYMENT_URL, payload, {
//       headers: {
//         Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
//         "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
//         "Content-Type": "application/json",
//       },
//     });

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           transactionId: data.transactionID,
//           // formContext: data.formContext,
//           // transactionSignature: data.transactionSignature,
//           paymentMethodList: data.paymentMethodList,
//           checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}&paymentMethod=CARD`,
//         },
//         Msg.AUTH_CREATED_WITH_SAVED_CARD,
//       ),
//     );
//   } catch (error) {
//     const status = error.response?.status || 500;
//     console.error(
//       "[SIBS createAuthWithSavedCard error]",
//       status,
//       error.response?.data,
//     );
//     return res
//       .status(status)
//       .json(
//         new ApiResponse(
//           status,
//           {},
//           error.response?.data?.returnStatus?.statusMsg || error.message,
//         ),
//       );
//   }
// };

// export const createAuthWithSavedCard = async (req, res) => {
//   try {
//     const {
//       amount,
//       currency = "EUR",
//       description = "Ride booking",
//       token,
//       initialTransactionId
//       // transactionSignature
//     } = req.body;

//     const schema = Joi.object({
//       amount: Joi.number().positive().required(),
//       token: Joi.string().required(),
//       initialTransactionId: Joi.string().required(),
//       // transactionSignature: Joi.string().required(),
//       currency: Joi.string().optional(),
//       description: Joi.string().optional(),
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, error.details[0].message));
//     }

//     const payload = {
//       merchant: {
//         terminalId: Number(process.env.SIBS_TERMINAL),
//         channel: "web",
//         merchantTransactionId: `auth_${randomUUID().replace(/-/g, "").substring(0, 31)}`,
//       },
//       transaction: {
//         transactionTimestamp: new Date().toISOString(),
//         description,
//         moto: false,
//         paymentType: "AUTH",
//         amount: { value: Number(amount), currency },
//         merchantInitiatedTransaction: {
//           type: "UCOF",
//           validityDate: "2027-12-31T00:00:00.000Z",
//           amountQualifier: "ESTIMATED",
//           initialTransactionId,
//         },
//       },
//       tokenisation: {
//         paymentTokens: [
//           {
//             tokenType: "Card",
//             value: token,
//           },
//         ],
//       },
//     };

//     console.log("[SIBS MIT AUTH payload]", JSON.stringify(payload, null, 2));

//     const { data } = await axios.post(
//       `${process.env.SIBS_PAYMENT_URL}/${initialTransactionId}/mit`,
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.SIBS_BEARER_TOKEN}`,
//           "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     console.log("[SIBS MIT AUTH response]", JSON.stringify(data, null, 2));

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           transactionId: data.transactionID,
//           status: data.paymentStatus,
//           returnCode: data.returnStatus?.statusCode,
//           amount: data.amount,
//         },
//         Msg.AUTH_CREATED_WITH_SAVED_CARD,
//       ),
//     );
//   } catch (error) {
//     const status = error.response?.status || 500;
//     console.error(
//       "[SIBS createAuthWithSavedCard error]",
//       status,
//       error.response?.data,
//     );
//     return res
//       .status(status)
//       .json(
//         new ApiResponse(
//           status,
//           {},
//           error.response?.data?.returnStatus?.statusMsg || error.message,
//         ),
//       );
//   }
// };

export const createAuthWithSavedCard = async (req, res) => {
  try {
    const {
      amount,
      currency = "EUR",
      description = "Ride booking",
      token,
    } = req.body;

    const schema = Joi.object({
      amount: Joi.number().required(),
      token: Joi.string().required(),
    });

    const { error } = schema.validate({ amount, token });

    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const merchantTransactionId = `auth_${Date.now()}`;

    const checkoutPayload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId,
      },
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description,
        moto: false,
        paymentType: "AUTH",
        amount: {
          value: Number(amount),
          currency,
        },
        paymentMethod: ["CARD"],
      },
      tokenisation: {
        paymentTokens: [
          {
            tokenType: "Card",
            value: token,
          },
        ],
      },
    };

    const checkoutRes = await axios.post(
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

    const transactionId = checkoutRes.data.transactionID;
    const transactionSignature = checkoutRes.data.transactionSignature;

    const payUrl = `${process.env.SIBS_ROOT_URL}/api/v2/payments/${transactionId}/card/purchase`;

    const payPayload = {
      info: {
        deviceInfo: {
          browserAcceptHeader: req.headers["accept"] || "*/*",
          browserJavaEnabled: "false",
          browserJavascriptEnabled: "true",
          browserLanguage:
            req.headers["accept-language"]?.split(",")[0] || "en",
          browserColorDepth: "24",
          browserScreenHeight: "1080",
          browserScreenWidth: "1920",
          browserTZ: String(new Date().getTimezoneOffset()),
          browserUserAgent: req.headers["user-agent"] || "Mozilla/5.0",
        },
      },
      tokenInfo: {
        tokenType: "Card",
        value: token,
      },
      oneClick: {
        oneClickApplication: true,
      },
    };

    const payRes = await axios.post(payUrl, payPayload, {
      headers: {
        Authorization: `Digest ${transactionSignature}`,
        "x-ibm-client-id": process.env.SIBS_CLIENT_ID,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          merchantTransactionId,
          transactionId: payRes.data.transactionID || transactionId,
          paymentStatus: payRes.data.paymentStatus,
          returnStatus: payRes.data.returnStatus,
          amount: payRes.data.amount,
          raw: payRes.data,
        },
        Msg.AUTH_CREATED_WITH_SAVED_CARD,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;

    console.error(
      "[SIBS createAuthWithSavedCard error]",
      status,
      error.response?.data,
    );

    return res
      .status(status)
      .json(
        new ApiResponse(
          status,
          { raw: error.response?.data || null },
          error.response?.data?.statusMsg ||
            error.response?.data?.returnStatus?.statusMsg ||
            error.message,
        ),
      );
  }
};

export const createPaymentCIT = async (req, res) => {
  try {
    const {
      amount,
      currency = "EUR",
      description = "Tapsi Ride Payment",
      customerName = "Customer",
      customerEmail,
    } = req.body;

    const schema = Joi.object({
      amount: Joi.number().required(),
      customerEmail: Joi.string().email().optional(),
      description: Joi.string().optional(),
      customerName: Joi.string().optional(),
      currency: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    // console.log("[SIBS terminal debug]", {
    //   raw: process.env.SIBS_TERMINAL,
    //   asString: String(process.env.SIBS_TERMINAL),
    //   asNumber: Number(process.env.SIBS_TERMINAL),
    //   type: typeof process.env.SIBS_TERMINAL,
    // });

    const payload = {
      merchant: {
        terminalId: Number(process.env.SIBS_TERMINAL),
        channel: "web",
        merchantTransactionId: `cit_${randomUUID().replace(/-/g, "").substring(0, 31)}`,
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
      merchantInitiatedTransaction: {
        type: "UCOF",
        validityDate: "2027-12-31T00:00:00.000Z",
        amountQualifier: "ESTIMATED",
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

    // console.log("[SIBS CIT payload]", JSON.stringify(payload, null, 2));
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
          transactionSignature: data.transactionSignature,
          paymentMethodList: data.paymentMethodList,
          checkoutPageUrl: `${process.env.BASE_URL}/payment/page?transactionId=${data.transactionID}&formContext=${encodeURIComponent(data.formContext)}&amount=${amount}&currency=${currency}`,
        },
        Msg.CIT_CREATED_SUCCESSFULLY,
      ),
    );
  } catch (error) {
    const status = error.response?.status || 500;
    console.error(
      "[SIBS createPaymentCIT error]",
      status,
      error.response?.data,
    );
    return res
      .status(status)
      .json(
        new ApiResponse(
          status,
          {},
          error.response?.data?.returnStatus?.statusMsg || error.message,
        ),
      );
  }
};
