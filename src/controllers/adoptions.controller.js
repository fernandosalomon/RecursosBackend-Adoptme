import {
  adoptionsService,
  petsService,
  usersService,
} from "../services/index.js";

const getAllAdoptions = async (req, res) => {
  try {
    const result = await adoptionsService.getAll();
    res.send({ status: "success", payload: result });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: [],
    });
  }
};

const getAdoption = async (req, res) => {
  const adoptionId = req.params.aid;
  try {
    const adoption = await adoptionsService.getBy({ _id: adoptionId });
    if (!adoption)
      return res
        .status(404)
        .send({ status: "error", error: "Adoption not found" });
    res.send({ status: "success", payload: adoption });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: [],
    });
  }
};

const createAdoption = async (req, res) => {
  const { uid, pid } = req.params;
  try {
    const user = await usersService.getUserById(uid);
    if (!user)
      return res
        .status(404)
        .send({ status: "error", message: "User not found", payload: [] });
    const pet = await petsService.getBy({ _id: pid });
    if (!pet)
      return res
        .status(404)
        .send({ status: "error", message: "Pet not found", payload: [] });
    if (pet.adopted)
      return res.status(400).send({
        status: "error",
        message: "Pet is already adopted",
        payload: [],
      });
    user.pets.push(pet._id);
    await usersService.update(user._id, { pets: user.pets });
    await petsService.update(pet._id, { adopted: true, owner: user._id });
    const newAdoption = await adoptionsService.create({
      owner: user._id,
      pet: pet._id,
    });
    res.status(201).send({
      status: "success",
      message: "Pet adopted",
      payload: newAdoption._id,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: [],
    });
  }
};

export default {
  createAdoption,
  getAllAdoptions,
  getAdoption,
};
