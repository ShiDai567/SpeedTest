# app.py
# Backend for the Flask Speed Test Website

import json
import logging
import os
import time

from flask import Flask, Response, jsonify, render_template, request

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# In-memory store for speed test history.
# In a production app, you'd want to use a database.
speed_test_history = []

# Define the path for the history file
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
HISTORY_FILE = os.path.join(DATA_DIR, "speed_history.json")

logging.info(f"Data directory: {DATA_DIR}")
logging.info(f"History file path: {HISTORY_FILE}")

# Ensure the data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# In-memory store for speed test history.
speed_test_history = []


def load_history():
    """
    Loads speed test history from the JSON file.
    """
    global speed_test_history
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            try:
                speed_test_history = json.load(f)
            except json.JSONDecodeError:
                speed_test_history = []  # Handle empty or corrupt JSON
    else:
        speed_test_history = []


def save_history():
    """
    Saves current speed test history to the JSON file.
    """
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(speed_test_history, f, indent=4)
        logging.info(f"History saved to {HISTORY_FILE}")
    except IOError as e:
        logging.error(f"Error saving history to {HISTORY_FILE}: {e}")


# Load history when the application starts
load_history()


@app.route("/")
def index():
    """
    Renders the main page of the website.
    """
    return render_template("index.html")


@app.route("/download")
def download():
    """
    Sends a stream of data to the client for download speed testing for 10 seconds.
    """

    def generate():
        start_time = time.time()
        while time.time() - start_time < 10:
            yield b"0" * 10240  # 10KB chunks

    return Response(generate(), mimetype="application/octet-stream")


@app.route("/upload", methods=["POST"])
def upload():
    """
    Receives data from the client for upload speed testing.
    """
    # Read and discard the incoming data to properly handle the stream
    _ = request.data
    return "OK"


@app.route("/ping")
def ping():
    """
    A simple endpoint for the client to measure latency.
    """
    return "pong"


@app.route("/history", methods=["GET", "POST"])
def history():
    """
    Handles storing and retrieving speed test history.
    """
    if request.method == "POST":
        data = request.json
        # Create a new record with a server-side timestamp and client IP
        record = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "ip": request.remote_addr,
            "ping": data.get("ping"),
            "download": data.get("download"),
            "upload": data.get("upload"),
        }
        speed_test_history.insert(0, record)  # Add to the top of the list
        # Keep the history to a reasonable size (e.g., last 20 records)
        if len(speed_test_history) > 20:
            speed_test_history.pop()
        # save_history(speed_test_history)

        return jsonify({"status": "success"})
    else:  # GET request
        return jsonify(speed_test_history)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
