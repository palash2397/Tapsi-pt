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

    console.log("data ------------>", data);

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

export const openCheckoutPage = async (req, res) => {
  try {
    const {transactionId, transactionSignature, formContext } = req.body;

    // const payment = await PaymentModel.findOne({ transactionId });

    // if (!payment) {
    //   return res.status(404).send("Payment not found");
    // }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>SIBS Checkout</title>
          <script src="https://spg.qly.sibs.pt/assets/js/widget.js"></script>
        </head>
        <body>
          <div id="payment-container"></div>

          <script>
            var checkout = new SibsCheckout({
              transactionSignature: "${transactionSignature}",
              formContext: "${formContext}",
              containerId: "payment-container",
              onSuccess: function(response) {
                window.location.href = "https://yourdomain.com/payment-success?transactionId=${transactionId}";
              },
              onError: function(error) {
                window.location.href = "https://yourdomain.com/payment-failed?transactionId=${transactionId}";
              }
            });

            checkout.init();
          </script>
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send("Checkout page error");
  }
};
