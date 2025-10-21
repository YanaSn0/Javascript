# Step 1: Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Step 2: Upgrade pip
python -m pip install --upgrade pip

# Step 3: Install FastAPI and Uvicorn
pip install fastapi uvicorn

# Step 4: Install Hugging Face Transformers and PyTorch
pip install transformers torch

# Step 5: Install Pillow (required for CLIP image processing)
pip install pillow

# Step 6: Optional — CORS support for browser extension
pip install fastapi[all]

# Step 7: Launch your FastAPI server
uvicorn class:app --reload --port 8000
