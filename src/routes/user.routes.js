import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import Joi from "joi";

const userRouter = Router();
const key = process.env.JWT_SECRET;

const validationSchemas = {
    signup: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
};

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

// sign up
userRouter.post("/signup", validate(validationSchemas.signup), async (req, res) => {
    const { name, email, password } = req.body;
    const result = await UserModel.findOne({ email });
    if (result) {
        res.status(400).send({ message: "Email already exists" });
    } else {
        bcrypt.hash(password, 5, async function (err, hash) {
            if (err) {
                res.status(500).send({ message: "Something went wrong, please try again" });
            }
            const new_user = new UserModel({
                name: name,
                email: email,
                password: hash,
            });
            await new_user.save();
            res.status(200).send({ message: "Signup successful" });
        });
    }
});

// login
userRouter.post("/login", validate(validationSchemas.login), async (req, res) => {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
        return res.status(404).send({ message: "User not found" });
    }

    const userId = user._id;
    const userName = user.name;
    const hash = user.password;

    bcrypt.compare(password, hash, async function (err, result) {
        if (err) {
            return res.status(500).send({ message: "Something went wrong, please try again" });
        }
        if (result) {
            const token = jwt.sign({ userId, userName }, key);
            res.status(200).send({ message: "Login successful", token, userName, userId });
        } else {
            res.status(401).send({ message: "Login failed" });
        }
    });
});

export default userRouter;
