from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Book(Base):
    __tablename__ = 'books'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String)
    year = Column(Integer)
    genre = Column(String)
    isbn = Column(String, unique=True)
    status = Column(Boolean, default=True)  # True for available, False for borrowed

    # relacionamento para histórico de empréstimos
    history = relationship('BookHistory', back_populates='book', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Book(title='{self.title}', author='{self.author}', year={self.year}, genre='{self.genre}', isbn='{self.isbn}', status={self.status})>"

class BookHistory(Base):
    __tablename__ = 'book_history'

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey('books.id', ondelete='CASCADE'))
    nome = Column(String)
    data_emprestimo = Column(DateTime, nullable=True)
    data_prev_devolucao = Column(DateTime, nullable=True)
    data_devolucao = Column(DateTime, nullable=True)

    book = relationship('Book', back_populates='history')

    def __repr__(self):
        return f"<BookHistory(book_id={self.book_id}, nome='{self.nome}', data_emprestimo={self.data_emprestimo})>"