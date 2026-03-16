import axios from "axios";

import { ApiResponse } from "../../utils/apiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

export const createCardPayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    console.log("api key", process.env.EUPAGO_API_KEY);

    if (!amount || !orderId) {
      return res.status(400).json({
        message: "amount and orderId are required",
      });
    }

    const response = await axios.post(
      "https://sandbox.eupago.pt/api/v1.02/creditcard/create",
      {
        amount: amount,
        identifier: orderId,
      },
      {
        headers: {
          apikey: process.env.EUPAGO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: "Payment creation failed",
      error: error.response?.data || error.message,
    });
  }
};