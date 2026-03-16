import { ApiResponse } from "../../utils/apiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

export const testing = async (req, res) => {
  try {
    return res.status(200).json(new ApiResponse(200, {}, "Testing"));
  } catch (error) {
    console.log(`error while testing: ${error}`);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
