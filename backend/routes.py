from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from .models import Book, BookHistory
from .database import get_db
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class BookCreate(BaseModel):
    titulo: str | None = None
    autor: str | None = None
    ano: int | None = None
    genero: str | None = None
    isbn: str | None = None
    capa: str | None = None
    status: str | None = 'disponível'

class BorrowRequest(BaseModel):
    nome: str
    data_emprestimo: datetime | None = None
    data_prev_devolucao: datetime | None = None

class ReturnRequest(BaseModel):
    data_devolucao: datetime | None = None

@router.post('/books/')
def create_book(book: BookCreate, db: Session = Depends(get_db)):
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
    # incluir histórico de empréstimos no retorno
    history = []
    for h in book.history:
        history.append({
            'id': h.id,
            'nome': h.nome,
            'data_emprestimo': h.data_emprestimo.isoformat() if h.data_emprestimo else None,
            'data_prev_devolucao': h.data_prev_devolucao.isoformat() if h.data_prev_devolucao else None,
            'data_devolucao': h.data_devolucao.isoformat() if h.data_devolucao else None,
        })
    return {
        'id': book.id,
        'titulo': book.title,
        'autor': book.author,
        'ano': book.year,
        'genero': book.genre,
        'isbn': book.isbn,
        'status': 'disponível' if book.status else 'emprestado',
        'history': history
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
def borrow_book(book_id: int, payload: BorrowRequest = Body(...), db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    # regra de negócio: impedir empréstimo se já emprestado
    if book.status == False:
        raise HTTPException(status_code=400, detail='Book not available for borrowing')

    # criar entrada de histórico
    data_emp = payload.data_emprestimo or datetime.utcnow()
    hist = BookHistory(
        book_id=book.id,
        nome=payload.nome,
        data_emprestimo=data_emp,
        data_prev_devolucao=payload.data_prev_devolucao
    )
    db.add(hist)
    # atualizar status do livro
    book.status = False
    db.commit()
    db.refresh(hist)
    return {'detail': 'borrowed', 'history_id': hist.id}

@router.post('/books/{book_id}/return')
def return_book(book_id: int, payload: ReturnRequest = Body(...), db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    if book.status == True:
        raise HTTPException(status_code=400, detail='Book not currently borrowed')

    # localizar última entrada de historico sem data_devolucao
    hist = db.query(BookHistory).filter(BookHistory.book_id == book.id, BookHistory.data_devolucao == None).order_by(BookHistory.id.desc()).first()
    if hist is None:
        raise HTTPException(status_code=404, detail='Active borrow record not found')

    hist.data_devolucao = payload.data_devolucao or datetime.utcnow()
    book.status = True
    db.commit()
    return {'detail': 'returned', 'history_id': hist.id}