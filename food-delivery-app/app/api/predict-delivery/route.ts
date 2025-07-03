import { type NextRequest, NextResponse } from "next/server"

// Simulated ML model prediction
function predictDeliveryTime(params: {
  deliveryPersonRating: number
  distance: number
  preparationTime: number
  vehicleType: string
  orderType: string
  weatherCondition: string
}) {
  const { deliveryPersonRating, distance, preparationTime, vehicleType, orderType, weatherCondition } = params

  // Base travel time calculation (minutes per km based on vehicle)
  const speedMultiplier = vehicleType === "bike" ? 0.8 : 1.2 // bike is faster
  const baseTravelTime = distance * 3 * speedMultiplier // ~3 minutes per km

  // Weather impact
  const weatherDelays: { [key: string]: number } = {
    clear: 0,
    cloudy: 1,
    rainy: 5,
    stormy: 10,
  }
  const weatherDelay = weatherDelays[weatherCondition] || 0

  // Traffic delay (random between 0-5 minutes)
  const trafficDelay = Math.floor(Math.random() * 6)

  // Delivery person efficiency (higher rating = faster delivery)
  const efficiencyFactor = (deliveryPersonRating / 5) * 0.9 + 0.1 // 0.1 to 1.0

  // Order type impact
  const orderTypeDelay = orderType === "delicate" ? 3 : 0

  // Calculate total time
  const travelTime = Math.round(baseTravelTime / efficiencyFactor)
  const totalTime = preparationTime + travelTime + weatherDelay + trafficDelay + orderTypeDelay

  return {
    estimatedTime: Math.round(totalTime),
    breakdown: {
      preparationTime,
      travelTime,
      weatherDelay,
      trafficDelay: trafficDelay + orderTypeDelay,
    },
    deliveryPersonRating,
    vehicleType,
    distance,
    weatherCondition,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required parameters
    const requiredParams = [
      "deliveryPersonRating",
      "distance",
      "preparationTime",
      "vehicleType",
      "orderType",
      "weatherCondition",
    ]

    for (const param of requiredParams) {
      if (!(param in body)) {
        return NextResponse.json({ error: `Missing required parameter: ${param}` }, { status: 400 })
      }
    }

    const prediction = predictDeliveryTime(body)

    return NextResponse.json(prediction)
  } catch (error) {
    console.error("Error in delivery prediction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
