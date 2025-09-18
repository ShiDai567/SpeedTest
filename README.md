# Speed-test

A Flask-based web application for testing internet speed (download, upload, ping) and viewing historical results.

## Features

*   **Download Speed Test:** Measures your internet download speed.
*   **Upload Speed Test:** Measures your internet upload speed.
*   **Ping/Latency Test:** Determines the latency to the server.
*   **Real-time Visualization:** Displays current speed using a gauge and historical speed data with charts during the test.
*   **Test History:** Stores and displays a history of your speed test results.
*   **Web-based User Interface:** Easy-to-use interface accessible via a web browser.

## Technologies Used

*   **Backend:** Python (Flask)
*   **Frontend:** HTML, CSS, JavaScript
    *   [Chart.js](https://www.chartjs.org/) for speed charts.
    *   [Gauge.js](https://bernii.github.io/gauge.js/) for real-time speed visualization.
*   **Data Storage:** JSON file (`data/speed_history.json`) for test history.

## Setup and Installation

Follow these steps to get the project up and running on your local machine.

### Prerequisites

*   Python 3.x
*   `pip` (Python package installer)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://gitlab.com/Speed-test.git
    cd Speed-test
    ```

2.  **Create a virtual environment:**
    It's recommended to use a virtual environment to manage project dependencies.

    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

### Running the Application

1.  **Start the Flask application:**

    ```bash
    gunicorn -w 4 "app:app" -b 0.0.0.0:8000
    ```
    (For development, you can also run `python app.py` which will start the Flask development server on `http://127.0.0.1:5000` by default.)

2.  **Access the application:**
    Open your web browser and navigate to `http://127.0.0.1:8000` (or `http://127.0.0.1:5000` if running with `python app.py`).

## Project Structure

```
.
├── app.py                  # Flask backend application
├── README.md               # Project README file
├── requirements.txt        # Python dependencies
├── data/                   # Directory for data storage
│   └── speed_history.json  # Stores speed test history
├── static/                 # Static files (CSS, JS, images)
│   ├── chart.js            # Chart.js library
│   ├── gauge.min.js        # Gauge.js library
│   ├── script.js           # Frontend JavaScript logic
│   ├── style.css           # Frontend styling
│   └── ...                 # Other static assets (favicon, images)
└── templates/              # HTML templates
    └── index.html          # Main web page
```