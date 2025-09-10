from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from .models import Book
from .database import get_db
from pydantic import BaseModel

router = APIRouter()

class BookCreate(BaseModel):
    titulo: str | None = None
    autor: str | None = None
    ano: int | None = None
    genero: str | None = None
    isbn: str | None = None
    capa: str | None = None
    status: str | None = 'disponível'

@router.post('/books/')
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    # Map frontend fields to model fields
    db_book = Book(
        title=book.titulo or '',
        author=book.autor or '',
        year=book.ano,
        genre=book.genero,
        isbn=book.isbn,
        status=True if (book.status and 'disp' in book.status.lower()) else False
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return {
        'id': db_book.id,
        'titulo': db_book.title,
        'autor': db_book.author,
        'ano': db_book.year,
        'genero': db_book.genre,
        'isbn': db_book.isbn,
        'status': 'disponível' if db_book.status else 'emprestado'
    }

@router.get('/books/')
def read_books(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    books = db.query(Book).offset(skip).limit(limit).all()
    result = []
    for b in books:
        result.append({
            'id': b.id,
            'titulo': b.title,
            'autor': b.author,
            'ano': b.year,
            'genero': b.genre,
            'isbn': b.isbn,
            'status': 'disponível' if b.status else 'emprestado'
        })
    return result

@router.get('/books/{book_id}')
def read_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    return {
        'id': book.id,
        'titulo': book.title,
        'autor': book.author,
        'ano': book.year,
        'genero': book.genre,
        'isbn': book.isbn,
        'status': 'disponível' if book.status else 'emprestado'
    }

@router.put('/books/{book_id}')
def update_book(book_id: int, book: BookCreate, db: Session = Depends(get_db)):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if db_book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    if book.titulo is not None: db_book.title = book.titulo
    if book.autor is not None: db_book.author = book.autor
    if book.ano is not None: db_book.year = book.ano
    if book.genero is not None: db_book.genre = book.genero
    if book.isbn is not None: db_book.isbn = book.isbn
    if book.status is not None:
        db_book.status = True if 'disp' in book.status.lower() else False
    db.commit()
    return {'detail': 'updated'}

@router.delete('/books/{book_id}')
def delete_book(book_id: int, db: Session = Depends(get_db)):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if db_book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    db.delete(db_book)
    db.commit()
    return {'detail': 'Book deleted'}

@router.post('/books/{book_id}/borrow')
def borrow_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None or book.status != True:
        raise HTTPException(status_code=400, detail='Book not available for borrowing')
    book.status = False
    db.commit()
    return {'detail': 'borrowed'}

@router.post('/books/{book_id}/return')
def return_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None or book.status != False:
        raise HTTPException(status_code=400, detail='Book not currently borrowed')
    book.status = True
    db.commit()
    return {'detail': 'returned'}