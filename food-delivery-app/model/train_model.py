import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import json
from datetime import datetime

def generate_sample_data(n_samples=10000):
    """Generate sample delivery data for training"""
    np.random.seed(42)
    
    # Generate features
    data = {
        'delivery_person_rating': np.random.uniform(1, 5, n_samples),
        'distance_km': np.random.exponential(3, n_samples),  # Most deliveries are short
        'preparation_time': np.random.normal(15, 5, n_samples),
        'vehicle_type': np.random.choice(['bike', 'bicycle'], n_samples, p=[0.7, 0.3]),
        'order_type': np.random.choice(['normal', 'delicate'], n_samples, p=[0.8, 0.2]),
        'weather_condition': np.random.choice(
            ['clear', 'cloudy', 'light_rain', 'heavy_rain', 'storm'], 
            n_samples, 
            p=[0.4, 0.3, 0.15, 0.1, 0.05]
        ),
        'time_of_day': np.random.choice(['morning', 'afternoon', 'evening', 'night'], n_samples),
        'day_of_week': np.random.choice(['weekday', 'weekend'], n_samples, p=[0.7, 0.3])
    }
    
    df = pd.DataFrame(data)
    
    # Ensure positive values
    df['distance_km'] = np.abs(df['distance_km'])
    df['preparation_time'] = np.maximum(df['preparation_time'], 5)
    
    return df

def calculate_delivery_time(df):
    """Calculate target delivery time based on features"""
    delivery_times = []
    
    for _, row in df.iterrows():
        # Base travel time (minutes per km)
        base_speed = 3.5 if row['vehicle_type'] == 'bike' else 5.0
        travel_time = row['distance_km'] * base_speed
        
        # Delivery person efficiency
        efficiency = (row['delivery_person_rating'] / 5) * 0.8 + 0.2
        travel_time = travel_time / efficiency
        
        # Weather impact
        weather_delays = {
            'clear': 0, 'cloudy': 1, 'light_rain': 3, 
            'heavy_rain': 8, 'storm': 15
        }
        weather_delay = weather_delays.get(row['weather_condition'], 0)
        
        # Order type impact
        order_delay = 3 if row['order_type'] == 'delicate' else 0
        
        # Time of day impact (traffic)
        time_delays = {'morning': 2, 'afternoon': 1, 'evening': 4, 'night': 0}
        time_delay = time_delays.get(row['time_of_day'], 0)
        
        # Weekend vs weekday
        weekend_factor = 0.9 if row['day_of_week'] == 'weekend' else 1.0
        
        # Calculate total time
        total_time = (row['preparation_time'] + travel_time + weather_delay + 
                     order_delay + time_delay) * weekend_factor
        
        # Add some noise
        noise = np.random.normal(0, 2)
        total_time += noise
        
        delivery_times.append(max(total_time, 10))  # Minimum 10 minutes
    
    return np.array(delivery_times)

def preprocess_features(df):
    """Preprocess features for training"""
    # Create a copy
    df_processed = df.copy()
    
    # Encode categorical variables
    label_encoders = {}
    categorical_cols = ['vehicle_type', 'order_type', 'weather_condition', 
                       'time_of_day', 'day_of_week']
    
    for col in categorical_cols:
        le = LabelEncoder()
        df_processed[col + '_encoded'] = le.fit_transform(df_processed[col])
        label_encoders[col] = le
    
    # Feature engineering
    df_processed['distance_squared'] = df_processed['distance_km'] ** 2
    df_processed['rating_distance_interaction'] = (
        df_processed['delivery_person_rating'] * df_processed['distance_km']
    )
    
    # Select features for training
    feature_cols = [
        'delivery_person_rating', 'distance_km', 'preparation_time',
        'vehicle_type_encoded', 'order_type_encoded', 'weather_condition_encoded',
        'time_of_day_encoded', 'day_of_week_encoded',
        'distance_squared', 'rating_distance_interaction'
    ]
    
    return df_processed[feature_cols], label_encoders

def train_model():
    """Train the delivery time prediction model"""
    print("🚀 Starting model training...")
    
    # Generate training data
    print("📊 Generating sample data...")
    df = generate_sample_data(50000)
    
    # Calculate target variable
    print("🎯 Calculating delivery times...")
    y = calculate_delivery_time(df)
    
    # Preprocess features
    print("🔧 Preprocessing features...")
    X, label_encoders = preprocess_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    print("🤖 Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    
    # Calculate metrics
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    print(f"📈 Model Performance:")
    print(f"   Mean Absolute Error: {mae:.2f} minutes")
    print(f"   Root Mean Square Error: {rmse:.2f} minutes")
    print(f"   R² Score: {r2:.3f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\n🔍 Top 5 Most Important Features:")
    for _, row in feature_importance.head().iterrows():
        print(f"   {row['feature']}: {row['importance']:.3f}")
    
    # Save model and preprocessors
    print("\n💾 Saving model and preprocessors...")
    
    model_artifacts = {
        'model': model,
        'scaler': scaler,
        'label_encoders': label_encoders,
        'feature_columns': list(X.columns),
        'metrics': {
            'mae': mae,
            'rmse': rmse,
            'r2': r2
        },
        'feature_importance': feature_importance.to_dict('records'),
        'training_date': datetime.now().isoformat(),
        'training_samples': len(X_train)
    }
    
    # Save as pickle file
    joblib.dump(model_artifacts, 'delivery_time_model.pkl')
    
    # Save metadata as JSON
    metadata = {
        'model_version': '1.0.0',
        'training_date': datetime.now().isoformat(),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2)
        },
        'features': list(X.columns),
        'target': 'delivery_time_minutes'
    }
    
    with open('model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("✅ Model training completed successfully!")
    print(f"📁 Model saved as: delivery_time_model.pkl")
    print(f"📄 Metadata saved as: model_metadata.json")
    
    return model_artifacts

if __name__ == "__main__":
    # Train the model
    artifacts = train_model()
    
    # Example prediction
    print("\n🧪 Testing model with sample prediction...")
    
    sample_data = pd.DataFrame({
        'delivery_person_rating': [4.2],
        'distance_km': [3.5],
        'preparation_time': [15],
        'vehicle_type': ['bike'],
        'order_type': ['normal'],
        'weather_condition': ['clear'],
        'time_of_day': ['evening'],
        'day_of_week': ['weekday']
    })
    
    # This would normally use the predict.py module
    print("Sample input:", sample_data.iloc[0].to_dict())
    print("Expected output: ~25-30 minutes")
