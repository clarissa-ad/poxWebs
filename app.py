from flask import Flask, render_template, request, jsonify, redirect, url_for
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

# Initialize Flask app
app = Flask(__name__)

# Load the trained model
MODEL_PATH = os.path.join(os.getcwd(), 'poxmodel.h5')
model = tf.keras.models.load_model(MODEL_PATH)

# Route for the homepage (index.html)
@app.route('/')
def index():
    return render_template('index.html')

# Route for the data page (data.html)
@app.route('/data')
def data():
    return render_template('data.html')

# Route for the entries page (entries.html)
@app.route('/entries')
def entries():
    return render_template('entries.html')

# Route for the about page (about.html)
@app.route('/about')
def about():
    return render_template('about.html')

# Route for image prediction (POST request)
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    try:
        # Preprocess the image and make a prediction
        image = Image.open(io.BytesIO(file.read()))
        image = image.resize((300, 300))  # Resize to match your model input size
        img_array = np.array(image) / 255.0  # Normalize the image
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        
        # Make prediction
        prediction = model.predict(img_array)
        predicted_class = np.argmax(prediction, axis=-1)[0]
        confidence = float(np.max(prediction))

        # Redirect to results page with the prediction data
        return redirect(url_for('results', class_id=predicted_class, confidence=confidence))

    except Exception as e:
        return jsonify({'error': str(e)})

# Route for displaying the prediction result (results.html)
@app.route('/results')
def results():
    class_id = request.args.get('class_id')
    confidence = request.args.get('confidence')

    # Pass the prediction data to the results.html template
    return render_template('results.html', class_id=class_id, confidence=confidence)

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
