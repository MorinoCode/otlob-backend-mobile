import * as carModel from '../models/carModel.js';

export const addUserCar = async (req, res) => {
  try {
    const { model, color, plate_number } = req.body;
    const userId = req.user.id; // In ro az Middleware gereftim

    if (!model || !color) {
      return res.status(400).json({ error: 'Model and Color are required' });
    }

    const newCar = await carModel.createCar(userId, { model, color, plate_number });

    res.status(201).json({
      message: 'Car added successfully',
      car: newCar
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getMyCars = async (req, res) => {
  try {
    const userId = req.user.id;
    const cars = await carModel.getUserCars(userId);
    res.json(cars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const setDefaultCar = async (req, res) => {
  try {
    const carId = req.params.id;
    const userId = req.user.id;
    
    await carModel.setDefault(userId, carId);
    
    res.json({ message: 'Default car updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};