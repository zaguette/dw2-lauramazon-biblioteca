# Library System Project

## Overview
This project is a library management system designed to facilitate the management of books, including functionalities for adding, borrowing, and returning books. The system is built using a FastAPI or Flask backend with an SQLite database and a simple frontend using HTML, CSS, and JavaScript.

## Objectives
- To create a user-friendly interface for managing library books.
- To implement a robust backend that handles CRUD operations for books.
- To ensure data persistence using SQLite.

## Technologies Used
- **Frontend**: 
  - HTML5
  - CSS3 (Flexbox/Grid)
  - JavaScript (ES6+)
  
- **Backend**: 
  - Python (FastAPI or Flask)
  - SQLite
  - SQLAlchemy (or sqlite3)

## Project Structure
```
library-system
├── backend
│   ├── app.py
│   ├── models.py
│   ├── database.py
│   ├── routes.py
│   ├── requirements.txt
│   └── README.md
├── frontend
│   ├── index.html
│   ├── css
│   │   └── styles.css
│   ├── js
│   │   └── main.js
│   └── README.md
├── ChatIA.md
└── README.md
```

## Setup Instructions

### Backend
1. Navigate to the `backend` directory.
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```

### Frontend
1. Open the `frontend/index.html` file in a web browser to access the application.

## API Usage
The backend provides several API endpoints for managing books. Refer to the `backend/README.md` for detailed API documentation.

## Contribution
Feel free to contribute to this project by submitting issues or pull requests. Your feedback and suggestions are welcome!