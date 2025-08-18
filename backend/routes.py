from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from .models import Book
from .database import get_db

router = APIRouter()

@router.post("/books/")
def create_book(book: Book, db: Session = next(get_db())):
    db.add(book)
    db.commit()
    db.refresh(book)
    return book

@router.get("/books/")
def read_books(skip: int = 0, limit: int = 10, db: Session = next(get_db())):
    books = db.query(Book).offset(skip).limit(limit).all()
    return books

@router.get("/books/{book_id}")
def read_book(book_id: int, db: Session = next(get_db())):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.put("/books/{book_id}")
def update_book(book_id: int, book: Book, db: Session = next(get_db())):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    for key, value in book.dict().items():
        setattr(db_book, key, value)
    db.commit()
    return db_book

@router.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = next(get_db())):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(db_book)
    db.commit()
    return {"detail": "Book deleted"}

@router.post("/books/{book_id}/borrow")
def borrow_book(book_id: int, db: Session = next(get_db())):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None or book.status != "available":
        raise HTTPException(status_code=400, detail="Book not available for borrowing")
    book.status = "borrowed"
    db.commit()
    return book

@router.post("/books/{book_id}/return")
def return_book(book_id: int, db: Session = next(get_db())):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None or book.status != "borrowed":
        raise HTTPException(status_code=400, detail="Book not currently borrowed")
    book.status = "available"
    db.commit()
    return book