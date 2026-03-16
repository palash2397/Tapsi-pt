import axios from "axios";

import { ApiResponse } from "../../utils/apiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

export const createCreditCardPayment = async (req, res) => {
  try {
    const {
      amount,
      email,
      notify = true,
    } = req.body;

    if (!amount || !email) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.AMOUNT_AND_EMAIL_REQUIRED));
    }

    const options = {
      method: "POST",
      url: "https://sandbox.eupago.pt/api/v1.02/creditcard/create",
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

    return res.status(200).json(new ApiResponse(200, response.data, Msg.CREDIT_CARD_PAYMENT_CREATED));

    // return res.status(200).json({
    //   success: true,
    //   message: "Credit card payment created successfully",
    //   data: response.data,
    // });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create credit card payment",
      error: error.response?.data || error.message,
    });
  }
};
