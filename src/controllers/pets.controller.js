import PetDTO from "../dto/Pet.dto.js";
import { petsService } from "../services/index.js";
import __dirname from "../utils/index.js";

const getAllPets = async (req, res) => {
  try {
    const pets = await petsService.getAll();
    res.send({
      status: "success",
      message: "Pets recovered",
      payload: pets,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

const createPet = async (req, res) => {
  const { name, specie, birthDate } = req.body;
  if (!name || !specie || !birthDate)
    return res
      .status(400)
      .send({ status: "error", message: "Incomplete values", payload: null });
  try {
    const pet = PetDTO.getPetInputFrom({ name, specie, birthDate });
    const result = await petsService.create(pet);
    res.send({
      status: "success",
      message: "Pet added",
      payload: result,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

const updatePet = async (req, res) => {
  const petUpdateBody = req.body;
  const petId = req.params.pid;
  try {
    const result = await petsService.update(petId, petUpdateBody);
    res.send({ status: "success", message: "pet updated", payload: result });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

const deletePet = async (req, res) => {
  const petId = req.params.pid;
  try {
    const result = await petsService.delete(petId);
    res.send({ status: "success", message: "pet deleted", payload: result });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};

const createPetWithImage = async (req, res) => {
  const file = req.file;
  const { name, specie, birthDate } = req.body;
  if (!name || !specie || !birthDate)
    return res
      .status(400)
      .send({ status: "error", message: "Incomplete values", payload: null });

  try {
    const pet = PetDTO.getPetInputFrom({
      name,
      specie,
      birthDate,
      image: `${__dirname}/../public/img/${file.filename}`,
    });

    const result = await petsService.create(pet);
    res.send({ status: "success", message: "Pet added", payload: result._id });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: `Internal Server Error: ${error}`,
      payload: null,
    });
  }
};
export default {
  getAllPets,
  createPet,
  updatePet,
  deletePet,
  createPetWithImage,
};
