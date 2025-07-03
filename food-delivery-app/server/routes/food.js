const express = require("express")
const router = express.Router()

// Sample food data
const foodItems = [
  {
    id: "1",
    name: "Margherita Pizza",
    description: "Classic pizza with fresh tomatoes, mozzarella, and basil",
    price: 299,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
    rating: 4.5,
    category: "Pizza",
    preparationTime: 15,
    restaurant: {
      id: "rest_1",
      name: "Pizza Palace",
      location: { lat: 28.6139, lng: 77.209 },
    },
  },
  {
    id: "2",
    name: "Chicken Biryani",
    description: "Aromatic basmati rice with tender chicken and spices",
    price: 349,
    image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop",
    rating: 4.7,
    category: "Indian",
    preparationTime: 25,
    restaurant: {
      id: "rest_2",
      name: "Spice Garden",
      location: { lat: 28.6129, lng: 77.2295 },
    },
  },
  {
    id: "3",
    name: "Veggie Burger",
    description: "Delicious plant-based burger with fresh vegetables",
    price: 199,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop",
    rating: 4.2,
    category: "Burger",
    preparationTime: 10,
    restaurant: {
      id: "rest_3",
      name: "Green Bites",
      location: { lat: 28.6169, lng: 77.209 },
    },
  },
]

// GET /api/food - Get all food items
router.get("/", (req, res) => {
  try {
    res.json({
      success: true,
      data: foodItems,
      count: foodItems.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch food items",
    })
  }
})

// GET /api/food/:id - Get specific food item
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params
    const foodItem = foodItems.find((item) => item.id === id)

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        error: "Food item not found",
      })
    }

    res.json({
      success: true,
      data: foodItem,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch food item",
    })
  }
})

// GET /api/food/category/:category - Get food items by category
router.get("/category/:category", (req, res) => {
  try {
    const { category } = req.params
    const filteredItems = foodItems.filter((item) => item.category.toLowerCase() === category.toLowerCase())

    res.json({
      success: true,
      data: filteredItems,
      count: filteredItems.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch food items by category",
    })
  }
})

module.exports = router
