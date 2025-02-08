import { Router } from "express";
import TaskModel from "../models/task.model.js";
import Joi from "joi";
import { authentication } from "../middlewares/authentication.js";

const taskRouter = Router();

const taskValidationSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  completed: Joi.boolean(),
});

// Middleware to validate task data
const validateTaskData = (req, res, next) => {
  const { error } = taskValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// get all tasks
taskRouter.get("/mytasks", authentication, async (req, res) => {
  try {
    const tasks = await TaskModel.find({ userId: req.userId });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// create a new task
taskRouter.post("/create", authentication, validateTaskData, async (req, res) => {
  try {
    const { title, description, completed } = req.body;

    const task = new TaskModel({
      title,
      description,
      userId: req.userId,
      completed,
    });
    await task.save();
    res.status(201).json({ message: "Added successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Error creating tasks" });
  }
});

// Delete a task
taskRouter.delete("/delete/:taskId", authentication, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await TaskModel.findOneAndDelete({
      _id: taskId,
      userId: req.userId,
    });

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

taskRouter.put("/update/:id", authentication, validateTaskData, async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const updatedTask = await TaskModel.findByIdAndUpdate(
      req.params.id,
      { title, description, completed },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});

taskRouter.put("/complete/:id", async (req, res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");

    task.completed = !task.completed;
    await task.save();

    res.status(200).json({ message: "Task status updated", task });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

export default taskRouter;
