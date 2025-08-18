from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routes import router

# Create the FastAPI app
app = FastAPI()

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the database
Base.metadata.create_all(bind=engine)

# Include the API routes
app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Library System API"}