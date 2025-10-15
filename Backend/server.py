from flask import Flask, request, jsonify
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import joblib
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import os
from flask_cors import CORS
import traceback

app = Flask(__name__)

# Configure CORS for file uploads
CORS(app, resources={
    r"/predict": {
        "origins": "*",
        "methods": ["POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Set max file size to 50MB
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Load model and label encoder with error handling
print("\n" + "="*60)
print("INITIALIZING FLASK SERVER")
print("="*60)
print("Loading model and label encoder...")

try:
    if not os.path.exists("hasta_mudra_classifier.h5"):
        raise FileNotFoundError("hasta_mudra_classifier.h5 not found")
    if not os.path.exists("label_encoder.pkl"):
        raise FileNotFoundError("label_encoder.pkl not found")
    
    model = load_model("hasta_mudra_classifier.h5")
    le = joblib.load("label_encoder.pkl")
    print("✓ Model loaded successfully")
    print("✓ Label encoder loaded successfully")
    MODELS_LOADED = True
    
except FileNotFoundError as e:
    print(f"✗ ERROR: {e}")
    print("Make sure these files exist in the same directory as this script:")
    print("  - hasta_mudra_classifier.h5")
    print("  - label_encoder.pkl")
    MODELS_LOADED = False
    
except Exception as e:
    print(f"✗ ERROR loading models: {e}")
    traceback.print_exc()
    MODELS_LOADED = False

print("="*60 + "\n")

def predict_mudra(image_path):
    """Predict mudra from image path"""
    try:
        print(f"  → Loading image from: {image_path}")
        
        # Load image as grayscale and resize to 48x48
        img = load_img(image_path, color_mode='grayscale', target_size=(48, 48))
        img_array = img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        print(f"  → Image shape: {img_array.shape}")
        print("  → Running model prediction...")
        
        predictions = model.predict(img_array, verbose=0)
        predicted_class_index = np.argmax(predictions)
        predicted_label = le.inverse_transform([predicted_class_index])[0]
        confidence = float(np.max(predictions) * 100)
        
        print(f"  → Prediction: {predicted_label} ({confidence:.2f}%)")
        
        return str(predicted_label), confidence
        
    except Exception as e:
        print(f"  ✗ Prediction error: {e}")
        traceback.print_exc()
        raise

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'Bharatnatyam Mudra Classifier API',
        'models_loaded': MODELS_LOADED
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """Predict mudra from uploaded image"""
    print("\n" + "="*60)
    print("PREDICT ENDPOINT CALLED")
    print("="*60)
    
    # Check if models are loaded
    if not MODELS_LOADED:
        print("✗ Models not loaded at startup")
        return jsonify({
            'error': 'Server not properly initialized. Models not loaded.'
        }), 500
    
    # Validate request
    if 'file' not in request.files:
        print("✗ No file in request")
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        print("✗ Empty filename")
        return jsonify({'error': 'No file selected'}), 400
    
    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        print(f"✗ Invalid file type: {file.filename}")
        return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, bmp'}), 400
    
    print(f"✓ File received: {file.filename}")
    print(f"  → Content type: {file.content_type}")
    
    # Save file temporarily
    filepath = os.path.join("uploads", file.filename)
    try:
        file.save(filepath)
        file_size = os.path.getsize(filepath)
        print(f"✓ File saved: {filepath} ({file_size} bytes)")
        
        # Get prediction
        print("→ Analyzing image...")
        label, confidence = predict_mudra(filepath)
        
        result = {
            'mudra': label,
            'label': label,  # Include both for compatibility
            'confidence': round(confidence, 2)
        }
        
        print(f"✓ Response: {result}")
        print("="*60 + "\n")
        
        return jsonify(result), 200
        
    except Exception as e:
        error_msg = f'Prediction failed: {str(e)}'
        print(f"✗ ERROR: {error_msg}")
        print("="*60 + "\n")
        return jsonify({'error': error_msg}), 500
        
    finally:
        # Clean up temporary file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                print("  → Temporary file removed")
            except:
                pass

if __name__ == "__main__":
    print("\n" + "="*60)
    print("STARTING FLASK SERVER")
    print("="*60)
    print("Server running on: http://127.0.0.1:5000")
    print("Frontend should connect to: http://127.0.0.1:5000/predict")
    print("Press CTRL+C to quit")
    print("="*60 + "\n")
    
    # Run server
    app.run(debug=True, host='127.0.0.1', port=5000)