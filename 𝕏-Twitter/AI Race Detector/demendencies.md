# Optional: create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install FastAPI and Uvicorn for the web server
pip install fastapi uvicorn

# Install Hugging Face Transformers and PyTorch (CLIP model)
pip install transformers torch

# Optional: if you want CORS support for browser extension
pip install fastapi[all]
