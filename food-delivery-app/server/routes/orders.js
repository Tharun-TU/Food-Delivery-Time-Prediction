const express = require("express")
const router = express.Router()

// In-memory storage for orders (use database in production)
const orders = []
let orderIdCounter = 1

// POST /api/orders - Create new order
router.post("/", (req, res) => {
  try {
    const { items, customerInfo, deliveryAddress, totalAmount, paymentMethod } = req.body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Items are required",
      })
    }

    if (!customerInfo || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: "Customer info and delivery address are required",
      })
    }

    // Create new order
    const newOrder = {
      id: `order_${orderIdCounter++}`,
      items,
      customerInfo,
      deliveryAddress,
      totalAmount,
      paymentMethod,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: null,
    }

    orders.push(newOrder)

    res.status(201).json({
      success: true,
      data: newOrder,
      message: "Order created successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create order",
    })
  }
})

// GET /api/orders/:id - Get specific order
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params
    const order = orders.find((order) => order.id === id)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      })
    }

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch order",
    })
  }
})

// PUT /api/orders/:id/status - Update order status
router.put("/:id/status", (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ["confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      })
    }

    const orderIndex = orders.findIndex((order) => order.id === id)

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      })
    }

    orders[orderIndex].status = status
    orders[orderIndex].updatedAt = new Date().toISOString()

    res.json({
      success: true,
      data: orders[orderIndex],
      message: "Order status updated successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
    })
  }
})

// GET /api/orders - Get all orders (with pagination)
router.get("/", (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const paginatedOrders = orders.slice(startIndex, endIndex)

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(orders.length / limit),
        totalOrders: orders.length,
        hasNext: endIndex < orders.length,
        hasPrev: startIndex > 0,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    })
  }
})

module.exports = router
