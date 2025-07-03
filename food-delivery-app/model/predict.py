import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class DeliveryTimePredictor:
    def __init__(self, model_path='delivery_time_model.pkl'):
        """Initialize the predictor with a trained model"""
        self.model_path = model_path
        self.model_artifacts = None
        self.load_model()
    
    def load_model(self):
        """Load the trained model and preprocessors"""
        try:
            self.model_artifacts = joblib.load(self.model_path)
            print(f"✅ Model loaded successfully from {self.model_path}")
        except FileNotFoundError:
            print(f"❌ Model file not found: {self.model_path}")
            print("Please run train_model.py first to create the model.")
            self.model_artifacts = None
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            self.model_artifacts = None
    
    def preprocess_input(self, input_data):
        """Preprocess input data for prediction"""
        if self.model_artifacts is None:
            raise ValueError("Model not loaded. Cannot preprocess input.")
        
        # Convert to DataFrame if it's a dictionary
        if isinstance(input_data, dict):
            input_data = pd.DataFrame([input_data])
        elif not isinstance(input_data, pd.DataFrame):
            raise ValueError("Input data must be a dictionary or pandas DataFrame")
        
        # Create a copy to avoid modifying original data
        df = input_data.copy()
        
        # Encode categorical variables using saved encoders
        label_encoders = self.model_artifacts['label_encoders']
        categorical_cols = ['vehicle_type', 'order_type', 'weather_condition', 
                           'time_of_day', 'day_of_week']
        
        for col in categorical_cols:
            if col in df.columns:
                try:
                    df[col + '_encoded'] = label_encoders[col].transform(df[col])
                except ValueError as e:
                    # Handle unseen categories
                    print(f"Warning: Unseen category in {col}. Using default encoding.")
                    df[col + '_encoded'] = 0
        
        # Feature engineering
        df['distance_squared'] = df['distance_km'] ** 2
        df['rating_distance_interaction'] = (
            df['delivery_person_rating'] * df['distance_km']
        )
        
        # Select and order features as expected by the model
        feature_cols = self.model_artifacts['feature_columns']
        
        # Ensure all required columns exist
        for col in feature_cols:
            if col not in df.columns:
                df[col] = 0  # Default value for missing features
        
        return df[feature_cols]
    
    def predict(self, input_data):
        """Make delivery time prediction"""
        if self.model_artifacts is None:
            raise ValueError("Model not loaded. Cannot make predictions.")
        
        try:
            # Preprocess input
            X = self.preprocess_input(input_data)
            
            # Scale features
            scaler = self.model_artifacts['scaler']
            X_scaled = scaler.transform(X)
            
            # Make prediction
            model = self.model_artifacts['model']
            prediction = model.predict(X_scaled)
            
            # Calculate confidence (based on prediction variance)
            # For Random Forest, we can use the standard deviation of tree predictions
            tree_predictions = np.array([tree.predict(X_scaled) for tree in model.estimators_])
            prediction_std = np.std(tree_predictions, axis=0)
            confidence = np.maximum(0.6, 1 - (prediction_std / prediction))
            
            return {
                'estimated_time': float(prediction[0]),
                'confidence': float(confidence[0]),
                'prediction_std': float(prediction_std[0])
            }
            
        except Exception as e:
            raise ValueError(f"Prediction failed: {str(e)}")
    
    def predict_with_breakdown(self, input_data):
        """Make prediction with detailed breakdown"""
        base_prediction = self.predict(input_data)
        
        # Extract input parameters
        if isinstance(input_data, dict):
            params = input_data
        else:
            params = input_data.iloc[0].to_dict()
        
        # Calculate breakdown components
        prep_time = params.get('preparation_time', 15)
        distance = params.get('distance_km', 3)
        rating = params.get('delivery_person_rating', 4)
        vehicle = params.get('vehicle_type', 'bike')
        weather = params.get('weather_condition', 'clear')
        
        # Estimate travel time
        base_speed = 3.5 if vehicle == 'bike' else 5.0
        efficiency = (rating / 5) * 0.8 + 0.2
        travel_time = (distance * base_speed) / efficiency
        
        # Weather delays
        weather_delays = {
            'clear': 0, 'cloudy': 1, 'light_rain': 3, 
            'heavy_rain': 8, 'storm': 15
        }
        weather_delay = weather_delays.get(weather, 0)
        
        # Calculate remaining time (traffic, order complexity, etc.)
        remaining_time = max(0, base_prediction['estimated_time'] - prep_time - travel_time - weather_delay)
        
        return {
            **base_prediction,
            'breakdown': {
                'preparation_time': round(prep_time),
                'travel_time': round(travel_time),
                'weather_delay': round(weather_delay),
                'traffic_and_other': round(remaining_time)
            },
            'factors': {
                'delivery_person_rating': rating,
                'vehicle_type': vehicle,
                'distance_km': distance,
                'weather_condition': weather
            }
        }
    
    def get_model_info(self):
        """Get information about the loaded model"""
        if self.model_artifacts is None:
            return {"error": "Model not loaded"}
        
        return {
            'model_loaded': True,
            'training_date': self.model_artifacts.get('training_date'),
            'training_samples': self.model_artifacts.get('training_samples'),
            'metrics': self.model_artifacts.get('metrics'),
            'features': self.model_artifacts.get('feature_columns'),
            'feature_importance': self.model_artifacts.get('feature_importance', [])[:5]  # Top 5
        }

# Example usage and testing
if __name__ == "__main__":
    # Initialize predictor
    predictor = DeliveryTimePredictor()
    
    if predictor.model_artifacts is not None:
        # Test with sample data
        sample_orders = [
            {
                'delivery_person_rating': 4.2,
                'distance_km': 3.5,
                'preparation_time': 15,
                'vehicle_type': 'bike',
                'order_type': 'normal',
                'weather_condition': 'clear',
                'time_of_day': 'evening',
                'day_of_week': 'weekday'
            },
            {
                'delivery_person_rating': 3.8,
                'distance_km': 7.2,
                'preparation_time': 25,
                'vehicle_type': 'bicycle',
                'order_type': 'delicate',
                'weather_condition': 'light_rain',
                'time_of_day': 'afternoon',
                'day_of_week': 'weekend'
            }
        ]
        
        print("🧪 Testing delivery time predictions:\n")
        
        for i, order in enumerate(sample_orders, 1):
            print(f"Order {i}:")
            print(f"Input: {order}")
            
            try:
                result = predictor.predict_with_breakdown(order)
                print(f"Predicted delivery time: {result['estimated_time']:.1f} minutes")
                print(f"Confidence: {result['confidence']:.2f}")
                print(f"Breakdown: {result['breakdown']}")
                print("-" * 50)
            except Exception as e:
                print(f"Error: {e}")
                print("-" * 50)
        
        # Show model info
        print("\n📊 Model Information:")
        model_info = predictor.get_model_info()
        for key, value in model_info.items():
            if key != 'feature_importance':
                print(f"{key}: {value}")
    else:
        print("❌ Cannot run tests - model not loaded")
        print("Please run 'python train_model.py' first to create the model")
