# Biblioteca Escolar - Códigos Separados e Atualizados

Aqui estão os três códigos separados e atualizados com todas as melhorias implementadas:

## 1. HTML Atualizado (index.html)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteca Escolar</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <div class="header-content">
            <img src="https://via.placeholder.com/50/00274d/ffffff?text=LS" alt="Logo Biblioteca" class="logo" aria-label="Logo Biblioteca Escolar">
            <h1>Biblioteca Escolar</h1>
            <input type="search" id="search-bar" placeholder="Buscar por título ou autor..." aria-label="Buscar livros">
        </div>
        <nav class="main-nav">
            <button class="nav-btn active" id="nav-catalogo" aria-label="Ir para catálogo" type="button">Catálogo</button>
            <button class="nav-btn" id="nav-gerenciar" aria-label="Ir para gerenciar" type="button">Gerenciar</button>
            <button class="nav-btn" id="nav-relatorios" aria-label="Ir para relatórios" type="button">Relatórios</button>
        </nav>
    </header>

    <div class="main-layout">
        <aside class="sidebar" aria-label="Filtros de livros">
            <h2>Filtros</h2>
            <div class="filter-group">
                <label for="filter-genre">Gênero:</label>
                <select id="filter-genre">
                    <option value="">Todos</option>
                    <option value="Romance">Romance</option>
                    <option value="Aventura">Aventura</option>
                    <option value="Fantasia">Fantasia</option>
                    <option value="Suspense">Suspense</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filter-year">Ano:</label>
                <input type="number" id="filter-year" min="1900" max="2025" placeholder="Ano">
            </div>
            <div class="filter-group">
                <label for="filter-status">Status:</label>
                <select id="filter-status">
                    <option value="">Todos</option>
                    <option value="disponível">Disponível</option>
                    <option value="emprestado">Emprestado</option>
                </select>
            </div>
            <button class="button" id="aplicar-filtros">Aplicar Filtros</button>
            <button class="button" id="limpar-filtros" style="background: #666; margin-top: 10px;">Limpar Filtros</button>
        </aside>

        <main class="content-area">
            <!-- Catálogo -->
            <section id="sec-catalogo" class="book-list" aria-label="Lista de livros">
                <div id="book-grid" class="book-grid">
                    <div class="empty-state">
                        <p>Nenhum livro encontrado. Adicione um novo livro ou ajuste os filtros.</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="button" id="add-book-btn" aria-label="Adicionar novo livro" accesskey="n">Novo Livro</button>
                    <button class="button" id="open-emprestimo-btn" aria-label="Abrir modal de Empréstimo/Devolução">Empréstimo/Devolução</button>
                </div>
            </section>

            <!-- Gerenciar -->
            <section id="sec-gerenciar" class="form-container" aria-label="Gerenciar livros" hidden>
                <h2>Cadastro/Edição de Livro</h2>
                <form id="form-novo-livro" autocomplete="off">
                    <input type="hidden" id="livro-id" value="">
                    <div class="form-group">
                        <label for="titulo">Título*</label>
                        <input type="text" id="titulo" name="titulo" required minlength="3" maxlength="90" aria-label="Título do livro">
                        <span id="titulo-erro" class="erro" style="display:none;">Título já existe!</span>
                    </div>
                    <div class="form-group">
                        <label for="autor">Autor*</label>
                        <input type="text" id="autor" name="autor" required aria-label="Autor do livro">
                    </div>
                    <div class="form-group">
                        <label for="ano">Ano*</label>
                        <input type="number" id="ano" name="ano" required min="1900" max="2025" aria-label="Ano de publicação">
                    </div>
                    <div class="form-group">
                        <label for="paginas">Número de Páginas</label>
                        <input type="number" id="paginas" name="paginas" aria-label="Número de páginas do livro">
                    </div>
                    <div class="form-group">
                        <label for="genero">Gênero</label>
                        <select id="genero" name="genero" aria-label="Gênero do livro">
                            <option value="Romance">Romance</option>
                            <option value="Aventura">Aventura</option>
                            <option value="Fantasia">Fantasia</option>
                            <option value="Suspense">Suspense</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="isbn">ISBN</label>
                        <input type="text" id="isbn" name="isbn" aria-label="ISBN do livro">
                    </div>
                    <div class="form-group">
                        <label for="capa">Capa do Livro (URL)</label>
                        <input type="text" id="capa" name="capa" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label for="status">Status*</label>
                        <select id="status" name="status" required aria-label="Status do livro">
                            <option value="disponível">Disponível</option>
                            <option value="emprestado">Emprestado</option>
                        </select>
                    </div>
                    <div>
                        <input type="submit" class="button" value="Salvar" id="salvar-livro">
                        <button type="button" class="button" id="cancelar-edicao" style="background: #666;">Cancelar</button>
                    </div>
                </form>
            </section>

            <!-- Relatórios -->
            <section id="sec-relatorios" class="report-container" aria-label="Relatórios de livros" hidden>
                <h2>Relatórios</h2>
                <div class="action-buttons">
                    <button class="button" id="export-csv" aria-label="Exportar CSV">Exportar CSV</button>
                    <button class="button" id="export-json" aria-label="Exportar JSON">Exportar JSON</button>
                </div>
                <div id="report-output">
                    <h3>Estatísticas da Biblioteca</h3>
                    <p>Total de Livros: <span id="total-livros">0</span></p>
                    <p>Livros Disponíveis: <span id="livros-disponiveis">0</span></p>
                    <p>Livros Emprestados: <span id="livros-emprestados">0</span></p>
                    <p>Livros por Gênero:</p>
                    <ul id="livros-por-genero"></ul>
                </div>
            </section>
        </main>
    </div>

    <!-- Modal Detalhes -->
    <div id="modal-detalhes" class="modal" hidden>
        <div class="modal-content">
            <button class="close-modal">&times;</button>
            <img id="modal-capa" src="" alt="Capa do livro">
            <h2 id="modal-titulo"></h2>
            <p><strong>Autor:</strong> <span id="modal-autor"></span></p>
            <p><strong>Páginas:</strong> <span id="modal-paginas"></span></p>
            <p><strong>Ano:</strong> <span id="modal-ano"></span></p>
            <p><strong>ISBN:</strong> <span id="modal-isbn"></span></p>
            <p><strong>Gênero:</strong> <span id="modal-genero"></span></p>
            <p><strong>Status:</strong> <span id="modal-status"></span></p>
            <div class="action-buttons">
                <button class="button btn-editar" id="editar-livro">Editar</button>
                <button class="button btn-excluir" id="excluir-livro">Excluir</button>
                <button class="button btn-emprestar" id="emprestar-livro" style="display: none;">Emprestar</button>
                <button class="button btn-devolver" id="devolver-livro" style="display: none;">Devolver</button>
            </div>
        </div>
    </div>

    <!-- Modal Empréstimo -->
    <div id="modal-emprestimo" class="modal" hidden>
        <div class="modal-content">
            <button class="close-modal">&times;</button>
            <h2>Gerenciar Empréstimo</h2>
            <div class="form-group">
                <label for="livro-emprestimo">Selecionar Livro:</label>
                <select id="livro-emprestimo">
                    <option value="">Selecione um livro</option>
                </select>
            </div>
            <div class="form-group">
                <label for="nome-pessoa">Nome da Pessoa:</label>
                <input type="text" id="nome-pessoa" placeholder="Digite o nome">
            </div>
            <div class="form-group">
                <label for="data-emprestimo">Data de Empréstimo:</label>
                <input type="date" id="data-emprestimo">
            </div>
            <div class="form-group">
                <label for="data-devolucao">Data de Devolução:</label>
                <input type="date" id="data-devolucao">
            </div>
            <div class="action-buttons">
                <button class="button" id="confirmar-emprestimo">Registrar Empréstimo</button>
                <button class="button" id="confirmar-devolucao">Registrar Devolução</button>
            </div>
            <div id="historico-emprestimos" style="margin-top: 20px;">
                <h3>Histórico de Empréstimos</h3>
                <ul id="lista-emprestimos"></ul>
            </div>
        </div>
    </div>

    <script src="js/main.js"></script>
</body>
</html>
```

## 2. CSS Atualizado (css/styles.css)

```css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    background: #f4f4f4;
}

header {
    background: #00274d;
    color: white;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
}

.logo {
    height: 50px;
    margin-right: 15px;
}

#search-bar {
    padding: 8px 12px;
    border-radius: 20px;
    border: none;
    min-width: 250px;
}

.main-nav {
    margin-top: 10px;
    display: flex;
    gap: 10px;
}

.nav-btn {
    background: #004080;
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.3s;
}

.nav-btn:hover, .nav-btn.active {
    background: #0059b3;
}

.main-layout {
    display: flex;
    min-height: calc(100vh - 130px);
}

.sidebar {
    width: 250px;
    background: #e8e8e8;
    padding: 20px;
    border-right: 1px solid #ccc;
}

.filter-group {
    margin-bottom: 15px;
}

.filter-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.filter-group select, .filter-group input {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.content-area {
    flex: 1;
    padding: 20px;
    position: relative;
}

.book-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.book-card {
    cursor: pointer;
    text-align: center;
    transition: transform 0.2s;
    background: white;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.book-card:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.book-cover {
    width: 150px;
    height: 220px;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.book-title {
    margin-top: 8px;
    font-size: 14px;
    font-weight: bold;
    height: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.book-status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 12px;
    margin-top: 5px;
}

.status-disponivel {
    background: #4CAF50;
    color: white;
}

.status-emprestado {
    background: #F44336;
    color: white;
}

.button {
    background: #004080;
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 4px;
    margin-right: 10px;
    transition: background 0.3s;
}

.button:hover {
    background: #0059b3;
}

.form-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    max-width: 600px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-group input, .form-group select {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    box-sizing: border-box;
}

.erro {
    display: block;
    color: #F59E0B;
    font-size: 14px;
    margin-top: 5px;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 25px;
    border-radius: 10px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.close-modal {
    position: absolute;
    top: 15px;
    right: 25px;
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #666;
}

.modal-content img {
    max-width: 150px;
    margin: 0 auto 15px;
    display: block;
    border-radius: 6px;
}

.report-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

#report-output {
    margin-top: 20px;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 6px;
    border: 1px solid #ddd;
}

.action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: center;
}

.btn-editar {
    background: #FF9800;
}

.btn-excluir {
    background: #F44336;
}

.btn-emprestar, .btn-devolver {
    background: #2196F3;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
}

@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #ccc;
    }
    
    .header-content {
        flex-direction: column;
        align-items: flex-start;
    }
    
    #search-bar {
        margin-top: 10px;
        min-width: unset;
        width: 100%;
    }
    
    .book-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
    
    .book-cover {
        width: 120px;
        height: 180px;
    }
}
```

## 3. JavaScript Atualizado (js/main.js)

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da DOM
    const bookForm = document.getElementById('form-novo-livro');
    const bookGrid = document.getElementById('book-grid');
    const searchBar = document.getElementById('search-bar');
    const filterGenre = document.getElementById('filter-genre');
    const filterYear = document.getElementById('filter-year');
    const filterStatus = document.getElementById('filter-status');
    const aplicarFiltros = document.getElementById('aplicar-filtros');
    const limparFiltros = document.getElementById('limpar-filtros');
    
    // Inicialização
    inicializarApp();
    
    function inicializarApp() {
        // Verificar se já existem livros no localStorage
        if (!localStorage.getItem('biblioteca_livros')) {
            // Adicionar alguns livros de exemplo
            const livrosExemplo = [
                {
                    id: 1,
                    titulo: 'Dom Casmurro',
                    autor: 'Machado de Assis',
                    ano: 1899,
                    paginas: 256,
                    genero: 'Romance',
                    isbn: '9788594318902',
                    capa: 'https://via.placeholder.com/150x220/00274d/ffffff?text=Dom+Casmurro',
                    status: 'disponível'
                },
                {
                    id: 2,
                    titulo: 'O Cortiço',
                    autor: 'Aluísio Azevedo',
                    ano: 1890,
                    paginas: 320,
                    genero: 'Romance',
                    isbn: '9788572326972',
                    capa: 'https://via.placeholder.com/150x220/00274d/ffffff?text=O+Cortiço',
                    status: 'disponível'
                },
                {
                    id: 3,
                    titulo: 'O Senhor dos Anéis',
                    autor: 'J.R.R. Tolkien',
                    ano: 1954,
                    paginas: 1200,
                    genero: 'Fantasia',
                    isbn: '9788533613379',
                    capa: 'https://via.placeholder.com/150x220/00274d/ffffff?text=Senhor+dos+Anéis',
                    status: 'emprestado'
                }
            ];
            localStorage.setItem('biblioteca_livros', JSON.stringify(livrosExemplo));
        }
        
        // Carregar livros
        fetchBooks();
        
        // Configurar event listeners
        configurarEventListeners();
    }
    
    function configurarEventListeners() {
        // Navegação
        document.getElementById('nav-catalogo').addEventListener('click', () => {
            mostrarSecao('sec-catalogo');
            fetchBooks();
            atualizarBotoesNavegacao('nav-catalogo');
        });
        
        document.getElementById('nav-gerenciar').addEventListener('click', () => {
            mostrarSecao('sec-gerenciar');
            atualizarBotoesNavegacao('nav-gerenciar');
            document.getElementById('livro-id').value = '';
            bookForm.reset();
        });
        
        document.getElementById('nav-relatorios').addEventListener('click', () => {
            mostrarSecao('sec-relatorios');
            atualizarBotoesNavegacao('nav-relatorios');
            gerarRelatorios();
        });
        
        // Formulário de livro
        bookForm.addEventListener('submit', salvarLivro);
        document.getElementById('cancelar-edicao').addEventListener('click', cancelarEdicao);
        
        // Busca e filtros
        searchBar.addEventListener('input', filtrarLivros);
        aplicarFiltros.addEventListener('click', filtrarLivros);
        limparFiltros.addEventListener('click', limparFiltrosHandler);
        
        // Botões de ação
        document.getElementById('add-book-btn').addEventListener('click', novoLivro);
        document.getElementById('open-emprestimo-btn').addEventListener('click', abrirModalEmprestimo);
        
        // Modal de detalhes
        document.getElementById('editar-livro').addEventListener('click', editarLivro);
        document.getElementById('excluir-livro').addEventListener('click', excluirLivro);
        document.getElementById('emprestar-livro').addEventListener('click', emprestarLivro);
        document.getElementById('devolver-livro').addEventListener('click', devolverLivro);
        
        // Modal de empréstimo
        document.getElementById('confirmar-emprestimo').addEventListener('click', confirmarEmprestimo);
        document.getElementById('confirmar-devolucao').addEventListener('click', confirmarDevolucao);
        
        // Exportação
        document.getElementById('export-csv').addEventListener('click', exportarCSV);
        document.getElementById('export-json').addEventListener('click', exportarJSON);
        
        // Fechar modais
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').hidden = true;
            });
        });
    }
    
    function atualizarBotoesNavegacao(ativo) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(ativo).classList.add('active');
    }
    
    // Função para buscar livros
    function fetchBooks() {
        const livros = JSON.parse(localStorage.getItem('biblioteca_livros') || '[]');
        window.livros = livros;
        renderBooks(livros);
    }
    
    // Função para renderizar livros na grade
    function renderBooks(livros) {
        bookGrid.innerHTML = '';
        
        if (livros.length === 0) {
            bookGrid.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum livro encontrado. Adicione um novo livro ou ajuste os filtros.</p>
                </div>
            `;
            return;
        }
        
        livros.forEach(livro => {
            const card = document.createElement('div');
            card.classList.add('book-card');
            card.dataset.id = livro.id;
            
            card.innerHTML = `
                <img src="${livro.capa || 'https://via.placeholder.com/150x220/cccccc/666666?text=Sem+Capa'}" 
                     alt="Capa do livro ${livro.titulo}" class="book-cover">
                <h3 class="book-title">${livro.titulo}</h3>
                <p><small>${livro.autor} (${livro.ano})</small></p>
                <span class="book-status status-${livro.status === 'disponível' ? 'disponivel' : 'emprestado'}">
                    ${livro.status}
                </span>
            `;
            
            card.addEventListener('click', () => abrirModalDetalhes(livro));
            bookGrid.appendChild(card);
        });
    }
    
    // Função para filtrar livros
    function filtrarLivros() {
        const termoBusca = searchBar.value.toLowerCase();
        const genero = filterGenre.value;
        const ano = filterYear.value;
        const status = filterStatus.value;
        
        const livrosFiltrados = window.livros.filter(livro => {
            const correspondeBusca = livro.titulo.toLowerCase().includes(termoBusca) || 
                                   livro.autor.toLowerCase().includes(termoBusca);
            const correspondeGenero = !genero || livro.genero === genero;
            const correspondeAno = !ano || livro.ano.toString() === ano;
            const correspondeStatus = !status || livro.status === status;
            
            return correspondeBusca && correspondeGenero && correspondeAno && correspondeStatus;
        });
        
        renderBooks(livrosFiltrados);
    }
    
    function limparFiltrosHandler() {
        searchBar.value = '';
        filterGenre.value = '';
        filterYear.value = '';
        filterStatus.value = '';
        filtrarLivros();
    }
    
    // Função para abrir modal de detalhes
    function abrirModalDetalhes(livro) {
        document.getElementById('modal-capa').src = livro.capa || 'https://via.placeholder.com/150x220/cccccc/666666?text=Sem+Capa';
        document.getElementById('modal-titulo').textContent = livro.titulo;
        document.getElementById('modal-autor').textContent = livro.autor;
        document.getElementById('modal-paginas').textContent = livro.paginas || "Não informado";
        document.getElementById('modal-ano').textContent = livro.ano;
        document.getElementById('modal-isbn').textContent = livro.isbn || "N/A";
        document.getElementById('modal-genero').textContent = livro.genero;
        document.getElementById('modal-status').textContent = livro.status;
        
        // Configurar botões de ação
        const btnEmprestar = document.getElementById('emprestar-livro');
        const btnDevolver = document.getElementById('devolver-livro');
        
        btnEmprestar.style.display = livro.status === 'disponível' ? 'block' : 'none';
        btnDevolver.style.display = livro.status === 'emprestado' ? 'block' : 'none';
        
        btnEmprestar.dataset.id = livro.id;
        btnDevolver.dataset.id = livro.id;
        document.getElementById('editar-livro').dataset.id = livro.id;
        document.getElementById('excluir-livro').dataset.id = livro.id;
        
        document.getElementById('modal-detalhes').hidden = false;
    }
    
    // Função para salvar livro (novo ou edição)
    function salvarLivro(event) {
        event.preventDefault();
        
        const livroId = document.getElementById('livro-id').value;
        const titulo = document.getElementById('titulo').value;
        const autor = document.getElementById('autor').value;
        const ano = document.getElementById('ano').value;
        const paginas = document.getElementById('paginas').value;
        const genero = document.getElementById('genero').value;
        const isbn = document.getElementById('isbn').value;
        const capa = document.getElementById('capa').value;
        const status = document.getElementById('status').value;
        
        // Verificar se título já existe (para novos livros)
        if (!livroId) {
            const tituloExiste = window.livros.some(livro => 
                livro.titulo.toLowerCase() === titulo.toLowerCase()
            );
            
            if (tituloExiste) {
                document.getElementById('titulo-erro').style.display = 'block';
                return;
            }
        }
        
        document.getElementById('titulo-erro').style.display = 'none';
        
        const livroData = {
            id: livroId || Date.now(),
            titulo,
            autor,
            ano: parseInt(ano),
            paginas: paginas ? parseInt(paginas) : 0,
            genero,
            isbn,
            capa,
            status
        };
        
        let livros = JSON.parse(localStorage.getItem('biblioteca_livros') || '[]');
        
        if (livroId) {
            // Editar livro existente
            const index = livros.findIndex(livro => livro.id == livroId);
            if (index !== -1) {
                livros[index] = livroData;
            }
        } else {
            // Adicionar novo livro
            livros.push(livroData);
        }
        
        localStorage.setItem('biblioteca_livros', JSON.stringify(livros));
        
        // Atualizar interface
        bookForm.reset();
        document.getElementById('livro-id').value = '';
        
        if (!document.getElementById('sec-catalogo').hidden) {
            fetchBooks();
        } else {
            mostrarSecao('sec-catalogo');
            fetchBooks();
        }
        
        alert(livroId ? 'Livro atualizado com sucesso!' : 'Livro adicionado com sucesso!');
    }
    
    function cancelarEdicao() {
        bookForm.reset();
        document.getElementById('livro-id').value = '';
        mostrarSecao('sec-catalogo');
        fetchBooks();
    }
    
    function novoLivro() {
        mostrarSecao('sec-gerenciar');
        bookForm.reset();
        document.getElementById('livro-id').value = '';
        document.getElementById('status').value = 'disponível';
    }
    
    function editarLivro() {
        const livroId = this.dataset.id;
        const livros = JSON.parse(localStorage.getItem('biblioteca_livros') || '[]');
        const livro = livros.find(l => l.id == livroId);
        
        if (livro) {
            document.getElementById('livro-id').value = livro.id;
            document.getElementById('titulo').value = livro.titulo;
            document.getElementById('autor').value = livro.autor;
            document.getElementById('ano').value = livro.ano;
            document.getElementById('paginas').value = livro.paginas || '';
            document.getElementById('genero').value = livro.genero;
            document.getElementById('isbn').value = livro.isbn || '';
            document.getElementById('capa').value = livro.capa || '';
            document.getElementById('status').value = livro.status;
            
            mostrarSecao('sec-gerenciar');
            document.getElementById('modal-detalhes').hidden = true;
        }
    }
    
    function excluirLivro() {
        if (confirm('Tem certeza que deseja excluir este livro?')) {
            const livroId = this.dataset.id;
            let livros = JSON.parse(localStorage.getItem('biblioteca_livros') || '[]');
            
            livros = livros.filter(livro => livro.id != livroId);
            localStorage.setItem('biblioteca_livros', JSON.stringify(livros));
            
            document.getElementById('modal-detalhes').hidden = true;
            fetchBooks();
            alert('Livro excluído com sucesso!');
        }
    }
    
    function emprestarLivro() {
        const livroId = this.dataset.id;
        abrirModalEmprestimo();
        
        // Selecionar o livro no modal de empréstimo
        setTimeout(() => {
            document.getElementById('livro-emprestimo').value = livroId;
            document.getElementById('data-emprestimo').valueAsDate = new Date();
            
            // Calcular data de devolução (14 dias)
            const devolucao = new Date();
            devolucao.setDate(devolucao.getDate() + 14);
            document.getElementById('data-devolucao').valueAsDate = devolucao;
            
            document.getElementById('modal-detalhes').hidden = true;
        }, 100);
    }
    
    function devolverLivro() {
        const livroId = this.dataset.id;
        let livros = JSON.parse(localStorage.getItem('biblioteca_livros') || '[]');
        const index = livros.findIndex(livro => livro.id == livroId);
        
        if (index !== -1) {
            livros[index].status = 'disponível';
            localStorage.setItem('biblioteca_livros', JSON.stringify(livros));
            
            document.getElementById('modal-detalhes').hidden = true;
            fetchBooks();
            alert('Livro marcado como disponível!');
        }
    }
    
    function abrirModalEmprestimo() {
        // Preencher select com livros disponíveis
        const select = document.getElementById('livro-emprestimo');
        select.innerHTML = '<option value="">Selecione um livro</option>';
        
        const livros = JSON.parse(localStorage.getItem('biblioteca_livros') || '[]');
        livros
            .filter(livro => livro.status === 'disponível')
            .forEach(livro => {
                const option = document.createElement('option');
                option.value = livro.id;
                option.textContent = `${livro.titulo} - ${livro.autor}`;
                select.appendChild(option);
            });
        
        // Limpar campos
        document.getElementById('nome-pessoa').value = '';
        document.getElementById('data-emprestimo').valueAsDate = new Date();
        
        // Calcular data de devolução (14 dias)
        const devolucao = new Date();
        devolucao.setDate(devolucao.getDate() + 14);
        document.getElementById('data-devolucao').valueAsDate = devolucao;
        
        // Carregar histórico de empréstimos
        carregarHistoricoEmprestimos();
        
        document.getElementById('modal-emprestimo').hidden = false;
    }
    
    function carregarHistoricoEmprestimos() {
        const historico = JSON.parse(localStorage.getItem('biblioteca_emprestimos') || '[]');
        const lista = document.getElementById('lista-emprestimos');
        lista.innerHTML = '';
        
        if (historico.length === 0) {
            lista.innerHTML = '<li>Nenhum empréstimo registrado</li>';
            return;
        }
        
        historico.forEach(emp => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${emp.tituloLivro}</strong> - 
                ${emp.nomePessoa} (${new Date(emp.dataEmprestimo).toLocaleDateString()}
                até ${new Date(emp.dataDevolucao).toLocaleDateString()})
            `;
            lista.appendChild(li);
        });
    }
    
    function confirmarEmprestimo() {
        const livroId = document.getElementById('livro-emprestimo').value;
        const nomePessoa = document.getElementById('nome-pessoa').value;
        const dataEmprestimo = document.getElementById('data-emprestimo').value;
        const dataDevolucao = document.getElementById('data-devolucao').value;
        
        if (!livroId || !nomePessoa || !dataEmprestimo || !dataDevolucao) {
            alert('Preencha todos os campos!');
            return;