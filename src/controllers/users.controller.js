import { usersService } from "../services/index.js";

const getAllUsers = async (req, res) => {
  try {
    const users = await usersService.getAll();
    res.send({ status: "success", message: "Users retrieved", payload: users });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

const getUser = async (req, res) => {
  const userId = req.params.uid;
  try {
    const user = await usersService.getUserById(userId);
    if (!user)
      return res
        .status(404)
        .send({ status: "error", message: "User not found", payload: null });
    res.send({ status: "success", message: "User retrieved", payload: user });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

const updateUser = async (req, res) => {
  const updateBody = req.body;
  const userId = req.params.uid;
  try {
    const user = await usersService.getUserById(userId);
    if (!user)
      return res
        .status(404)
        .send({ status: "error", message: "User not found", payload: null });
    const result = await usersService.update(userId, updateBody);
    res.send({ status: "success", message: "User updated", payload: user._id });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.uid;
    const result = await usersService.getUserById(userId);
    res.send({ status: "success", message: "User deleted", payload: result });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

export default {
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
};
