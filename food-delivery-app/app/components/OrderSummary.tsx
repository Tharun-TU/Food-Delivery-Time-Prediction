"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Clock, MapPin, Star, Bike, Cloud } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  preparationTime: number
}

interface OrderSummaryProps {
  cart: CartItem[]
  totalPrice: number
  onClose: () => void
}

interface DeliveryPrediction {
  estimatedTime: number
  breakdown: {
    preparationTime: number
    travelTime: number
    weatherDelay: number
    trafficDelay: number
  }
  deliveryPersonRating: number
  vehicleType: string
  distance: number
  weatherCondition: string
}

export default function OrderSummary({ cart, totalPrice, onClose }: OrderSummaryProps) {
  const [prediction, setPrediction] = useState<DeliveryPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    fetchDeliveryPrediction()
  }, [])

  const fetchDeliveryPrediction = async () => {
    try {
      const maxPrepTime = Math.max(...cart.map((item) => item.preparationTime))

      const response = await fetch("/api/predict-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryPersonRating: 4.2,
          distance: 3.5,
          preparationTime: maxPrepTime,
          vehicleType: "bike",
          orderType: "normal",
          weatherCondition: "clear",
        }),
      })

      const data = await response.json()
      setPrediction(data)
    } catch (error) {
      console.error("Error fetching delivery prediction:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmOrder = () => {
    setOrderPlaced(true)
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  if (orderPlaced) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Order Placed!</h3>
            <p className="text-gray-600 mb-4">Your delicious food is on its way!</p>
            <div className="text-lg font-semibold text-orange-600">
              Estimated delivery: {prediction?.estimatedTime} minutes
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Summary & Delivery Prediction</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Items */}
          <div>
            <h4 className="font-semibold mb-3">Your Order</h4>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-bold text-lg">
                <span>Total:</span>
                <span className="text-orange-600">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Prediction */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p>Calculating delivery time...</p>
            </div>
          ) : prediction ? (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <Clock className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-orange-600 mb-1">{prediction.estimatedTime} minutes</h3>
                <p className="text-gray-600">Estimated delivery time</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Partner</p>
                    <p className="font-semibold">{prediction.deliveryPersonRating}★ Rating</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Bike className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-semibold capitalize">{prediction.vehicleType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="font-semibold">{prediction.distance} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Cloud className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Weather</p>
                    <p className="font-semibold capitalize">{prediction.weatherCondition}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Time Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Food preparation:</span>
                    <Badge variant="outline">{prediction.breakdown.preparationTime} mins</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel time:</span>
                    <Badge variant="outline">{prediction.breakdown.travelTime} mins</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Weather delay:</span>
                    <Badge variant="outline">{prediction.breakdown.weatherDelay} mins</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Traffic delay:</span>
                    <Badge variant="outline">{prediction.breakdown.trafficDelay} mins</Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-red-500">Failed to calculate delivery time. Please try again.</div>
          )}

          <Button onClick={handleConfirmOrder} className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            Confirm Order
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
