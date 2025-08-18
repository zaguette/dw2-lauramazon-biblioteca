# Library System Backend

This document provides an overview of the backend for the Library System project, including setup instructions and API usage.

## Overview

The backend of the Library System is built using [FastAPI](https://fastapi.tiangolo.com/) (or Flask) and utilizes SQLite as the database. The application provides a RESTful API for managing books in the library, allowing users to perform CRUD operations and manage the borrowing and returning of books.

## Technologies Used

- Python
- FastAPI or Flask
- SQLAlchemy
- SQLite

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd library-system/backend
   ```

2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application**
   - For FastAPI:
     ```bash
     uvicorn app:app --reload
     ```
   - For Flask:
     ```bash
     flask run
     ```

5. **Access the API**
   - The API will be available at `http://127.0.0.1:8000` (FastAPI) or `http://127.0.0.1:5000` (Flask).

## API Endpoints

### Books

- **GET /books**: Retrieve a list of all books.
- **POST /books**: Add a new book.
- **GET /books/{id}**: Retrieve a specific book by ID.
- **PUT /books/{id}**: Update a specific book by ID.
- **DELETE /books/{id}**: Delete a specific book by ID.

### Borrowing and Returning Books

- **POST /borrow/{id}**: Borrow a book by ID.
- **POST /return/{id}**: Return a borrowed book by ID.

## Database Models

The application uses SQLAlchemy to define the database models. The primary model is the `Book` model, which includes the following fields:

- `title`: The title of the book.
- `author`: The author of the book.
- `year`: The year of publication.
- `genre`: The genre of the book.
- `ISBN`: The ISBN number of the book.
- `status`: The current status of the book (available, borrowed).

## Conclusion

This backend provides a robust API for managing a library system. For further details on the implementation, refer to the individual files in the backend directory.