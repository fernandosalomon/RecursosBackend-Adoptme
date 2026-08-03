import { expect } from "chai";
import supertest from "supertest";
import mongoose from "mongoose";
import { app, server } from "../src/app.js";
import dotenv from "dotenv";
dotenv.config();
import { faker } from "@faker-js/faker";

const requester = supertest(app);

// AJUSTAR si tu conexión a Mongo se hace en otro lugar / con otra variable de entorno
const MONGO_URL_TEST =
  process.env.MONGO_URL_TEST || "mongodb://localhost:27017/adoptme_test";

describe("Test adoption.router.js", () => {
  let userId;
  let petId;
  let adoptionId;

  before(async () => {
    // Conexión a una DB de test dedicada, para no ensuciar la de desarrollo.
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URL_TEST);
    }
  });

  afterEach(async () => {
    await mongoose.connection.collection("adoptions").deleteMany({});
    await mongoose.connection
      .collection("users")
      .updateMany({}, { $set: { pets: [] } });
    await mongoose.connection
      .collection("pets")
      .updateMany({}, { $set: { adopted: false, owner: {} } });
  });

  after(async () => {
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("pets").deleteMany({});
    await mongoose.disconnect();
    server.close();
  });

  describe("Crear usuario y mascota de prueba para los tests", () => {
    it("Debe crear un usuario de prueba", async () => {
      const mockUser = {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        password: "123456",
      };

      const { statusCode, body } = await requester
        .post("/api/sessions/register")
        .send(mockUser);

      expect(statusCode).to.be.eql(200);
      userId = body.payload;
    });

    it("Debe crear una mascota de prueba", async () => {
      const mockPet = {
        name: faker.animal.petName(),
        specie: faker.animal.type(),
        birthDate: faker.date.birthdate({ mode: "age", min: 1, max: 15 }),
      };
      const { statusCode, body } = await requester
        .post("/api/pets")
        .send(mockPet);

      expect(statusCode).to.equal(200);
      expect(body.payload).to.have.property("_id");
      expect(body.payload.adopted).to.equal(false);
      petId = body.payload._id;
    });
  });

  describe("GET /api/adoptions", () => {
    it("Debe devolver un array con todas las adopciones", async () => {
      let response;
      response = await requester.post(`/api/adoptions/${userId}/${petId}`);

      expect(response.statusCode).to.be.eql(201);

      response = await requester.get("/api/adoptions");

      expect(response.statusCode).to.be.eql(200);
      expect(response._body.status).to.be.eql("success");
      expect(Array.isArray(response._body.payload)).to.be.eql(true);
      expect(response._body.payload.length).to.be.eql(1);
    });

    it("Debe devolver array vacío si todavía no hay adopciones", async () => {
      const { body } = await requester.get("/api/adoptions");
      expect(body.payload.length).to.be.eql(0);
    });
  });

  describe("GET /api/adoptions/:aid", () => {
    it("Debe devolver 404 si el id no existe (pero es un ObjectId válido)", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const { statusCode, body } = await requester.get(
        `/api/adoptions/${fakeId}`,
      );

      expect(statusCode).to.be.eql(404);
      expect(body.status).to.be.eql("error");
      expect(body.message).to.be.eql("Adoption not found");
    });

    it("Debe devolver 200 y la adopción cuando el id existe", async () => {
      // Se crea la adopción primero a través del propio endpoint POST
      let response;
      response = await requester.post(`/api/adoptions/${userId}/${petId}`);

      const aid = response._body.payload;

      const { statusCode, body } = await requester.get(`/api/adoptions/${aid}`);

      expect(statusCode).to.equal(200);
      expect(body.status).to.equal("success");
      expect(body.payload).to.have.property("_id", aid);
    });

    it("Debe fallar (o devolver error) si el id tiene formato inválido de ObjectId", async () => {
      const { statusCode } = await requester.get(
        "/api/adoptions/idInvalido123",
      );
      expect(statusCode).to.be.eql(400);
    });
  });

  describe("POST /api/adoptions/:uid/:pid", () => {
    it("Debe devolver 404 si el usuario no existe", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      const { statusCode, body } = await requester.post(
        `/api/adoptions/${fakeUserId}/${petId}`,
      );

      expect(statusCode).to.be.eql(404);
      expect(body.status).to.be.eql("error");
      expect(body.message).to.be.eql("User not found");
    });

    it("Debe devolver 404 si la mascota no existe", async () => {
      const fakePetId = new mongoose.Types.ObjectId().toString();

      const { statusCode, body } = await requester.post(
        `/api/adoptions/${userId}/${fakePetId}`,
      );

      expect(statusCode).to.be.eql(404);
      expect(body.status).to.be.eql("error");
      expect(body.message).to.be.eql("Pet not found");
    });

    it("Debe adoptar correctamente cuando el usuario y la mascota existen", async () => {
      const { statusCode, body } = await requester.post(
        `/api/adoptions/${userId}/${petId}`,
      );

      expect(statusCode).to.be.eql(201);
      expect(body.status).to.be.eql("success");
      expect(body.message).to.be.eql("Pet adopted");
    });

    it("La mascota debe quedar marcada como adopted:true y con el owner correcto", async () => {
      let response;
      response = await requester.post(`/api/adoptions/${userId}/${petId}`);

      expect(response).to.be.ok;
      expect(response.statusCode).to.be.eql(201);

      response = await requester.get(`/api/pets`);
      const pet = response._body.payload.find((p) => p._id === petId);

      expect(pet.adopted).to.be.eql(true);
      expect(pet.owner).to.be.eql(userId);
    });

    it("El usuario debe tener la mascota agregada en su array pets", async () => {
      let response;
      response = await requester.post(`/api/adoptions/${userId}/${petId}`);

      expect(response).to.be.ok;
      expect(response.statusCode).to.be.eql(201);

      response = await requester.get(`/api/users/${userId}`);

      expect(response).to.be.ok;
      expect(response.statusCode).to.be.eql(200);

      const petsIds = response._body.payload.pets.map((p) => p._id);
      expect(petsIds).to.include(petId);
    });

    it("Debe quedar registrada la adopción en /api/adoptions", async () => {
      let response;
      response = await requester.post(`/api/adoptions/${userId}/${petId}`);

      expect(response).to.be.ok;
      expect(response.statusCode).to.be.eql(201);

      response = await requester.get("/api/adoptions");

      expect(response).to.be.ok;
      expect(response.statusCode).to.be.eql(200);

      const found = response._body.payload.find(
        (a) => a.pet === petId && a.owner === userId,
      );

      expect(found).to.exist;
    });

    it("Debe devolver 400 si se intenta adoptar una mascota ya adoptada y no debe duplicar la mascota en el array pets del usuario si se reintenta la adopción", async () => {
      let response;
      response = await requester.post(`/api/adoptions/${userId}/${petId}`);

      expect(response).to.be.ok;
      expect(response.statusCode).to.be.eql(201);

      response = await requester.post(`/api/adoptions/${userId}/${petId}`);

      expect(response.statusCode).to.be.eql(400);
      expect(response._body.status).to.be.eql("error");
      expect(response._body.message).to.be.eql("Pet is already adopted");

      response = await requester.get(`/api/users/${userId}`);

      expect(response).to.be.ok;
      expect(response.statusCode).to.be.eql(200);

      const petsIds = response._body.payload.pets.map((p) => p._id);

      const occurrences = petsIds.filter((id) => id === petId).length;

      expect(occurrences).to.be.eql(1);
    });

    it("Debe fallar (o devolver error) si uid tiene formato inválido de ObjectId", async () => {
      const response = await requester.post(
        `/api/adoptions/idInvalido/${petId}`,
      );

      expect(response.statusCode).to.be.eql(400);
    });

    it("Debe fallar (o devolver error) si pid tiene formato inválido de ObjectId", async () => {
      const response = await requester.post(
        `/api/adoptions/${userId}/idInvalido`,
      );

      expect(response.statusCode).to.be.eql(400);
    });
  });
});
