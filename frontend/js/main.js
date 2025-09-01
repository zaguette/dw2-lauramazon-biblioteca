document.addEventListener('DOMContentLoaded', () => {
    const bookForm = document.getElementById('form-novo-livro');
    const bookGrid = document.getElementById('book-grid');

    // Função para buscar livros
    const fetchBooks = async () => {
        const response = await fetch('/api/books');
        const books = await response.json();
        bookGrid.innerHTML = '';
        books.forEach(book => {
            const card = document.createElement('div');
            card.classList.add('book-card');
            card.innerHTML = `
                <img src="${book.capa || 'https://via.placeholder.com/150x220?text=Livro'}" alt="Capa do livro" class="book-cover">
                <h3 class="book-title">${book.titulo}</h3>
            `;
            card.onclick = () => abrirModalDetalhes(book);
            bookGrid.appendChild(card);
        });
        window.livros = books;
    };

    // Função para fechar modais
function fecharModal(modalId) {
    document.getElementById(modalId).hidden = true;
}

// Fechar modal de empréstimo (já existia)
document.getElementById('close-modal-emprestimo').onclick = function() {
    fecharModal('modal-emprestimo');
};

// Fechar modal de novo livro
document.getElementById('close-modal-novo-livro').onclick = function() {
    fecharModal('sec-gerenciar');
};

// Fechar modal de detalhes do livro
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal')) {
        e.target.closest('.modal').hidden = true;
    }
});


    // Modal detalhes
    function abrirModalDetalhes(book) {
        document.getElementById('modal-capa').src = book.capa || 'https://via.placeholder.com/150x220?text=Livro';
        document.getElementById('modal-titulo').textContent = book.titulo;
        document.getElementById('modal-autor').textContent = book.autor;
        document.getElementById('modal-paginas').textContent = book.paginas || "Não informado";
        document.getElementById('modal-ano').textContent = book.ano;
        document.getElementById('modal-isbn').textContent = book.isbn || "N/A";
        document.getElementById('modal-genero').textContent = book.genero;
        document.getElementById('modal-status').textContent = book.status;

        document.getElementById('modal-detalhes').hidden = false;
    }

    document.querySelector('#modal-detalhes .close-modal').onclick = () => {
        document.getElementById('modal-detalhes').hidden = true;
    };

    // Cadastro de novo livro
    bookForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(bookForm);
        const bookData = {
            titulo: formData.get('titulo'),
            autor: formData.get('autor'),
            ano: formData.get('ano'),
            paginas: formData.get('paginas'),
            genero: formData.get('genero'),
            isbn: formData.get('isbn'),
            capa: formData.get('capa'),
            status: formData.get('status') || 'disponível'
        };

        await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });

        bookForm.reset();
        if (!document.getElementById('sec-catalogo').hidden) {
            fetchBooks();
        }
    });

    // Alterna visibilidade das seções
    function mostrarSecao(secaoId) {
        document.getElementById('sec-catalogo').hidden = true;
        document.getElementById('sec-gerenciar').hidden = true;
        document.getElementById('sec-relatorios').hidden = true;
        document.getElementById(secaoId).hidden = false;
    }

    // Inicial → abre Gerenciar
    mostrarSecao('sec-gerenciar');

    document.getElementById('nav-catalogo').onclick = () => {
        mostrarSecao('sec-catalogo');
        fetchBooks();
    };
    document.getElementById('nav-gerenciar').onclick = () => {
        mostrarSecao('sec-gerenciar');
    };
    document.getElementById('nav-relatorios').onclick = () => {
        mostrarSecao('sec-relatorios');
    };
});
