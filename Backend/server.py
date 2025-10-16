from flask import Flask, request, jsonify
import numpy as np
from tensorflow.keras.models import load_model
import joblib
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import os
from flask_cors import CORS
import traceback

app = Flask(__name__)

# Optimized CORS configuration - handles all scenarios
CORS(app, resources={
    r"/*": {
        "origins": "*",  # For production, replace with specific domains like ["https://yourdomain.com"]
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False,
        "max_age": 3600  # Cache preflight requests for 1 hour
    }
})

# File upload size limit
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

# Model loading with error handling
print("Loading model and label encoder...")
try:
    model = load_model("hasta_mudra_classifier.h5")
    le = joblib.load("label_encoder.pkl")
    print("Model and label encoder loaded successfully!")
    MODELS_LOADED = True
except Exception as e:
    print(f"ERROR loading models: {e}")
    traceback.print_exc()
    MODELS_LOADED = False

def predict_mudra(image_path):
    print(f"Starting prediction for: {image_path}")
    img = load_img(image_path, color_mode='grayscale', target_size=(48, 48))
    img_array = img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    print("Running model prediction...")
    predictions = model.predict(img_array, verbose=0)
    predicted_class_index = np.argmax(predictions)
    predicted_label = le.inverse_transform([predicted_class_index])[0]
    confidence = np.max(predictions) * 100
    
    print(f"Prediction complete: {predicted_label} with {confidence:.2f}% confidence")
    
    return str(predicted_label), float(confidence)

@app.route('/')
def home():
    print("Home route accessed")
    return jsonify({
        'status': 'running',
        'message': 'Bharatnatyam Mudra Classifier API',
        'models_loaded': MODELS_LOADED
    })

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    # Handle preflight request (automatically handled by Flask-CORS, but explicit for clarity)
    if request.method == 'OPTIONS':
        return '', 204
    
    print("\n" + "="*50)
    print("PREDICT ENDPOINT CALLED")
    print("="*50)
    
    # Check if models loaded
    if not MODELS_LOADED:
        return jsonify({'error': 'Models not loaded'}), 500
    
    print(f"Request method: {request.method}")
    print(f"Request files: {request.files}")
    print(f"Request form: {request.form}")
    
    if 'file' not in request.files:
        print("ERROR: No file in request")
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    print(f"File received: {file.filename}")
    print(f"File content type: {file.content_type}")
    
    if file.filename == '':
        print("ERROR: Empty filename")
        return jsonify({'error': 'No file selected'}), 400
    
    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, bmp'}), 400
    
    # Save file temporarily
    filepath = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
    print(f"Saving file to: {filepath}")
    
    try:
        file.save(filepath)
        print(f"File saved successfully. Size: {os.path.getsize(filepath)} bytes")
        
        # Get prediction
        print("Calling predict_mudra function...")
        label, confidence = predict_mudra(filepath)
        
        result = {
            'mudra': label,
            'label': label,
            'confidence': round(confidence, 2)
        }
        print(f"Returning result: {result}")
        print("="*50 + "\n")
        
        return jsonify(result), 200
        
    except Exception as e:
        error_msg = f'Prediction failed: {str(e)}'
        print(f"ERROR: {error_msg}")
        traceback.print_exc()
        print("="*50 + "\n")
        return jsonify({'error': error_msg}), 500
        
    finally:
        # Clean up temporary file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                print(f"Removed temporary file: {filepath}")
            except:
                pass

if __name__ == "__main__":
    print("\n" + "="*50)
    print("STARTING FLASK SERVER")
    print("="*50)
    
    port = int(os.environ.get("PORT", 5000))
    
    # Check if running in production (Render sets PORT env variable)
    is_production = os.environ.get("PORT") is not None
    
    if is_production:
        print("Production mode - Use 'gunicorn app:app' as start command")
        print(f"Server will run on port {port}")
    else:
        print("Development mode - Running Flask development server")
        print(f"Server starting on http://localhost:{port}")
        print("WARNING: For production, use Gunicorn instead!")
    
    print("="*50 + "\n")
    
    # This runs only in development
    app.run(host="0.0.0.0", port=port, debug=False)