from sqlalchemy import Column, Integer, String, Boolean
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

    def __repr__(self):
        return f"<Book(title='{self.title}', author='{self.author}', year={self.year}, genre='{self.genre}', isbn='{self.isbn}', status={self.status})>"