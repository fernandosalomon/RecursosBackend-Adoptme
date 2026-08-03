import mongoose from "mongoose";

export const validateMongoId = (listOfParams) => {
  return (req, res, next) => {
    listOfParams.forEach((paramName) => {
      const id = req.params[paramName];

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
          status: "error",
          message: `Invalid id: ${paramName}`,
          payload: [],
        });
      }
    });

    next();
  };
};
