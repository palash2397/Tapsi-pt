import axios from "axios";

import { ApiResponse } from "../utils/apiResponse.js";
import { Msg } from "../utils/responseMsg.js";

export const createCreditCardPayment = async (req, res) => {
  try {
    const { amount, email, notify = true } = req.body;

    if (!amount || !email) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.AMOUNT_AND_EMAIL_REQUIRED));
    }

    const options = {
      method: "POST",
      url: `${process.env.EUPAGO_BASE_URL}/v1.02/creditcard/create`,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `ApiKey ${process.env.EUPAGO_API_KEY}`,
      },
      data: {
        payment: {
          amount: {
            currency: "EUR",
            value: amount,
          },
          lang: "PT",
          minutesFormUp: 1440,
          identifier: "Test",
          successUrl: "https://eupago.pt",
          failUrl: "https://eupago.pt",
          backUrl: "https://eupago.pt",
        },
        customer: {
          notify,
          email,
        },
      },
    };

    const response = await axios.request(options);

    return res
      .status(200)
      .json(
        new ApiResponse(200, response.data, Msg.CREDIT_CARD_PAYMENT_CREATED),
      );
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const createMbWayPayment = async (req, res) => {
  try {
    const { amount, customerPhone, countryCode } = req.body;

    if (!amount || !customerPhone || !countryCode) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.AMOUNT_AND_EMAIL_REQUIRED));
    }

    const response = await axios.post(
      `${process.env.EUPAGO_BASE_URL}/v1.02/mbway/create`,
      {
        payment: {
          amount: {
            currency: "EUR",
            value: amount,
          },
          customerPhone,
          countryCode,
          callbackUrl: `${process.env.BASE_URL}/mbway/callback`,
        },
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `ApiKey ${process.env.EUPAGO_API_KEY}`,
        },
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, response.data, Msg.MB_WAY_PAYMENT_CREATED));
  } catch (error) {
    console.log(`MB Way payment creation failed: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const mbWayCallback = async (req, res) => {
  try {
    console.log('MB Way Callback Received:', req.body);

    const { transactionStatus, transactionID, reference, identifier } = req.body;

    if (transactionStatus === 'Success') {
      // ✅ Payment confirmed — update your DB
      // await OrderModel.updateOne(
      //   { identifier },
      //   { status: 'PAID', transactionID }
      // );
      console.log(`Payment SUCCESS for order: ${identifier}`);
    } else {
      // ❌ Payment failed/expired
      console.log(`Payment FAILED for order: ${identifier}`);
    }

    // Always return 200 to euPago
    return res.status(200).json({ received: true });

  } catch (error) {
    console.log(`Callback error: ${error.message}`);
    return res.status(500).json({ received: false });
  }
};