from flask import Flask, render_template, request, jsonify, redirect, url_for
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

# Initialize Flask app
app = Flask(__name__)

# Path to your trained model
MODEL_PATH = os.path.join(os.getcwd(), 'poxmodel.h5')

# Load the model
model = tf.keras.models.load_model(MODEL_PATH)

# Route for the home page (index.html)
@app.route('/')
def index():
    return render_template('index.html')  # Flask will look for index.html in the 'templates' folder

# Route for making predictions
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    try:
        # Open the image and preprocess it
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

# Route for displaying the prediction result
@app.route('/results')
def results():
    class_id = request.args.get('class_id')
    confidence = request.args.get('confidence')

    # Pass the prediction data to the results.html template
    return render_template('results.html', class_id=class_id, confidence=confidence)

if __name__ == '__main__':
    app.run(debug=True)
