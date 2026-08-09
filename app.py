from flask import Flask, render_template, request, jsonify
from pathlib import Path
from datetime import datetime
import base64

app = Flask(__name__)

IMAGE_DIR = Path("captured_images")
VIDEO_DIR = Path("captured_videos")

IMAGE_DIR.mkdir(exist_ok=True)
VIDEO_DIR.mkdir(exist_ok=True)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/save-image", methods=["POST"])
def save_image():

    data = request.json.get("image")

    if not data:
        return jsonify({
            "success": False,
            "error": "No image received"
        }), 400

    try:

        _, encoded = data.split(",", 1)

        image_bytes = base64.b64decode(encoded)

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        filename = IMAGE_DIR / (
            f"image_{timestamp}.jpg"
        )

        filename.write_bytes(image_bytes)

        return jsonify({
            "success": True,
            "filename": filename.name
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


@app.route("/save-video", methods=["POST"])
def save_video():

    video_data = request.files.get("video")

    if not video_data:
        return jsonify({
            "success": False,
            "error": "No video received"
        }), 400

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S_%f"
    )

    filename = VIDEO_DIR / (
        f"video_{timestamp}.webm"
    )

    video_data.save(filename)

    return jsonify({
        "success": True,
        "filename": filename.name
    })


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
