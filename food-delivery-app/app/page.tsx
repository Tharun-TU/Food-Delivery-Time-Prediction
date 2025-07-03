"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Star, Plus, Minus } from "lucide-react"
import Cart from "./components/Cart"
import OrderSummary from "./components/OrderSummary"

interface FoodItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  rating: number
  category: string
  preparationTime: number
}

interface CartItem extends FoodItem {
  quantity: number
}

export default function Home() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFoodItems()
  }, [])

  const fetchFoodItems = async () => {
    try {
      const response = await fetch("/api/food-items")
      const data = await response.json()
      setFoodItems(data)
    } catch (error) {
      console.error("Error fetching food items:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item: FoodItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === itemId)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem.id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem,
        )
      }
      return prevCart.filter((cartItem) => cartItem.id !== itemId)
    })
  }

  const getCartItemQuantity = (itemId: string) => {
    const item = cart.find((cartItem) => cartItem.id === itemId)
    return item ? item.quantity : 0
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handlePlaceOrder = () => {
    setShowCart(false)
    setShowOrderSummary(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-600">FoodieExpress</h1>
            </div>
            <Button onClick={() => setShowCart(true)} className="relative bg-orange-600 hover:bg-orange-700">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart ({getTotalItems()})
              {getTotalItems() > 0 && <Badge className="absolute -top-2 -right-2 bg-red-500">{getTotalItems()}</Badge>}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Delicious Food, Delivered Fast</h2>
          <p className="text-xl mb-8">Order from your favorite restaurants with AI-powered delivery predictions</p>
        </div>
      </section>

      {/* Food Items Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h3 className="text-2xl font-bold mb-6">Popular Dishes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {foodItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover" />
                <Badge className="absolute top-2 right-2 bg-green-600">{item.category}</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600 ml-1">{item.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">• {item.preparationTime} mins</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-orange-600">₹{item.price}</span>
                  <div className="flex items-center gap-2">
                    {getCartItemQuantity(item.id) > 0 ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold">{getCartItemQuantity(item.id)}</span>
                        <Button size="sm" variant="outline" onClick={() => addToCart(item)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => addToCart(item)} className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Cart Modal */}
      {showCart && (
        <Cart
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={(itemId, quantity) => {
            if (quantity === 0) {
              setCart(cart.filter((item) => item.id !== itemId))
            } else {
              setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
            }
          }}
          onPlaceOrder={handlePlaceOrder}
          totalPrice={getTotalPrice()}
        />
      )}

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <OrderSummary
          cart={cart}
          totalPrice={getTotalPrice()}
          onClose={() => {
            setShowOrderSummary(false)
            setCart([])
          }}
        />
      )}
    </div>
  )
}
