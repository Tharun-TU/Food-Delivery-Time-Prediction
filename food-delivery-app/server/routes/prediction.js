const express = require("express")
const router = express.Router()
const DeliveryModel = require("../models/deliveryModel")

// POST /api/predict/delivery-time - Predict delivery time
router.post("/delivery-time", async (req, res) => {
  try {
    const {
      deliveryPersonRating,
      restaurantLocation,
      deliveryLocation,
      orderType,
      vehicleType,
      preparationTime,
      distance,
      weatherCondition,
    } = req.body

    // Validate required parameters
    const requiredParams = [
      "deliveryPersonRating",
      "orderType",
      "vehicleType",
      "preparationTime",
      "distance",
      "weatherCondition",
    ]

    for (const param of requiredParams) {
      if (req.body[param] === undefined || req.body[param] === null) {
        return res.status(400).json({
          success: false,
          error: `Missing required parameter: ${param}`,
        })
      }
    }

    // Validate parameter ranges
    if (deliveryPersonRating < 1 || deliveryPersonRating > 5) {
      return res.status(400).json({
        success: false,
        error: "Delivery person rating must be between 1 and 5",
      })
    }

    if (distance < 0) {
      return res.status(400).json({
        success: false,
        error: "Distance must be positive",
      })
    }

    if (preparationTime < 0) {
      return res.status(400).json({
        success: false,
        error: "Preparation time must be positive",
      })
    }

    // Get prediction from model
    const prediction = await DeliveryModel.predict({
      deliveryPersonRating,
      restaurantLocation,
      deliveryLocation,
      orderType,
      vehicleType,
      preparationTime,
      distance,
      weatherCondition,
    })

    res.json({
      success: true,
      data: prediction,
      message: "Delivery time predicted successfully",
    })
  } catch (error) {
    console.error("Prediction error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to predict delivery time",
    })
  }
})

// POST /api/predict/batch - Batch prediction for multiple orders
router.post("/batch", async (req, res) => {
  try {
    const { orders } = req.body

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Orders array is required",
      })
    }

    const predictions = await Promise.all(
      orders.map(async (order, index) => {
        try {
          const prediction = await DeliveryModel.predict(order)
          return {
            orderIndex: index,
            orderId: order.orderId || null,
            prediction,
            success: true,
          }
        } catch (error) {
          return {
            orderIndex: index,
            orderId: order.orderId || null,
            error: error.message,
            success: false,
          }
        }
      }),
    )

    res.json({
      success: true,
      data: predictions,
      message: "Batch prediction completed",
    })
  } catch (error) {
    console.error("Batch prediction error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to process batch prediction",
    })
  }
})

// GET /api/predict/model-info - Get model information
router.get("/model-info", (req, res) => {
  try {
    const modelInfo = DeliveryModel.getModelInfo()

    res.json({
      success: true,
      data: modelInfo,
      message: "Model information retrieved successfully",
    })
  } catch (error) {
    console.error("Model info error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to get model information",
    })
  }
})

module.exports = router
