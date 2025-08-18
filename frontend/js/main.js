// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const bookForm = document.getElementById('book-form');
    const bookList = document.getElementById('book-list');

    // Fetch and display books
    const fetchBooks = async () => {
        const response = await fetch('/api/books');
        const books = await response.json();
        bookList.innerHTML = '';
        books.forEach(book => {
            const li = document.createElement('li');
            li.textContent = `${book.title} by ${book.author} (${book.year}) - ${book.status}`;
            bookList.appendChild(li);
        });
    };

    // Add a new book
    bookForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(bookForm);
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            year: formData.get('year'),
            genre: formData.get('genre'),
            isbn: formData.get('isbn'),
            status: 'available'
        };

        await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });

        bookForm.reset();
        fetchBooks();
    });

    // Initial fetch of books
    fetchBooks();
});