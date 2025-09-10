document.addEventListener('DOMContentLoaded', () => {
    const bookForm = document.getElementById('form-novo-livro');
    const bookGrid = document.getElementById('book-grid');
    const modalEmprestimo = document.getElementById('modal-emprestimo');
    const btnGerenciar = document.getElementById('nav-gerenciar');

    // Função para buscar livros (agora usa localStorage)
    const STORAGE_KEY = 'library_books';

    function loadBooksFromStorage() {
        const raw = localStorage.getItem(STORAGE_KEY);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Erro ao parsear books do localStorage', e);
            return [];
        }
    }

    function saveBooksToStorage(books) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    }

    const fetchBooks = async () => {
        // lê do localStorage em vez de chamar API
        const books = loadBooksFromStorage();
        bookGrid.innerHTML = '';
        if (!books || books.length === 0) {
            bookGrid.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum livro encontrado. Adicione um novo livro ou ajuste os filtros.</p>
                </div>
            `;
            // limpa select de empréstimo
            populateEmprestimoSelect([]);
            window.livros = [];
            return;
        }

        books.forEach(book => {
            const card = document.createElement('div');
            card.classList.add('book-card');
            const statusClass = (book.status && String(book.status).toLowerCase().includes('emprest')) ? 'status-emprestado' : 'status-disponivel';
            card.innerHTML = `
                <img src="${book.capa || 'https://via.placeholder.com/150x220?text=Livro'}" alt="Capa do livro" class="book-cover">
                <h3 class="book-title">${book.titulo}</h3>
                <p class="book-author">${book.autor || 'Autor não informado'}</p>
                <p class="book-year">${book.ano || ''}</p>
                <span class="book-status ${statusClass}">${book.status || 'desconhecido'}</span>
            `;
            card.onclick = () => abrirModalDetalhes(book);
            bookGrid.appendChild(card);
        });
        // atualizar select de empréstimo
        populateEmprestimoSelect(books);
        window.livros = books;
    };

    function populateEmprestimoSelect(books) {
        const sel = document.getElementById('livro-emprestimo');
        if (!sel) return;
        sel.innerHTML = '<option value="">Selecione um livro</option>';
        books.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id || b.isbn || b.titulo; // id preferencial
            opt.textContent = `${b.titulo} — ${b.autor || ''}`;
            sel.appendChild(opt);
        });
    }

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

        document.getElementById('modal-detalhes').style.display = 'block';
    }

    // Fechar qualquer modal
    function fecharModal(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'none';
    }

    // Abrir modal
    function abrirModal(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'block';
    }

    // Delegação segura: fechar modal ao clicar em qualquer botão com classe '.close-modal'
    document.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal');
            fecharModal(modal);
            return;
        }

        // Fechar modal ao clicar fora da caixa do modal
        if (e.target.classList && e.target.classList.contains('modal')) {
            fecharModal(e.target);
        }
    });

    // Fechar modal de detalhes (caso queira handler separado)
    document.querySelectorAll('#modal-detalhes .close-modal').forEach(btn => {
        btn.addEventListener('click', () => fecharModal(document.getElementById('modal-detalhes')));
    });

    // Cadastro de novo livro (salva em localStorage)
    bookForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(bookForm);
        const bookData = {
            id: Date.now().toString(),
            titulo: formData.get('titulo'),
            autor: formData.get('autor'),
            ano: formData.get('ano'),
            paginas: formData.get('paginas'),
            genero: formData.get('genero'),
            isbn: formData.get('isbn'),
            capa: formData.get('capa'),
            status: formData.get('status') || 'disponível'
        };

        try {
            const books = loadBooksFromStorage();
            books.unshift(bookData); // adiciona no início
            saveBooksToStorage(books);

            // Atualiza UI
            bookForm.reset();
            const modalNovoLivro = document.getElementById('modal-novo-livro');
            if (modalNovoLivro) fecharModal(modalNovoLivro);
            // Atualiza listagem imediatamente
            fetchBooks();
        } catch (err) {
            console.error('Erro ao salvar em localStorage', err);
            alert('Erro ao salvar livro no armazenamento local.');
        }
    });

    // Alterna visibilidade das seções
    function mostrarSecao(secaoId) {
        document.getElementById('sec-catalogo').hidden = true;
        document.getElementById('sec-gerenciar').hidden = true;
        document.getElementById('sec-relatorios').hidden = true;
        document.getElementById(secaoId).hidden = false;
    }

    // Inicial → abre Catálogo (não Gerenciar!)
    mostrarSecao('sec-catalogo');

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

    // Abrir modal de empréstimo só quando chamar explicitamente
    if (btnGerenciar) {
        btnGerenciar.addEventListener('dblclick', () => {
            abrirModal(modalEmprestimo);
        });
    }

    // Abrir modal Novo Livro pelo botão
    const openNovoLivroBtn = document.getElementById('add-book-btn');
    const modalNovoLivro = document.getElementById('modal-novo-livro');
    if (openNovoLivroBtn && modalNovoLivro) {
        openNovoLivroBtn.addEventListener('click', () => abrirModal(modalNovoLivro));
    }

    // Também abrir modal de empréstimo pelo botão na UI (se presente)
    const openEmprestimoBtn = document.getElementById('open-emprestimo-btn');
    if (openEmprestimoBtn) {
        openEmprestimoBtn.addEventListener('click', () => abrirModal(modalEmprestimo));
    }

    // Fechar modais ao clicar nos botões '.close-modal' (cobre todos os modais). Já tratado pela delegação acima.

    // Ao carregar a página, renderiza livros do localStorage
    fetchBooks();

});
