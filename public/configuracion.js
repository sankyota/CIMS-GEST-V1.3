document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar autenticación
    if (typeof checkAuth === 'function') {
        const userData = await checkAuth();
        if (!userData) window.location.href = "/login.html";
    }
    
    // 2. Aplicar tema guardado
    aplicarTemaGuardado();

    // 3. LISTENERS (Conectamos los IDs del HTML con las funciones aquí)
    
    // Tarjeta Usuarios
    const cardUsuarios = document.getElementById("card-usuarios");
    if (cardUsuarios) {
        cardUsuarios.addEventListener("click", () => {
            window.location.href = 'registrar-usuario.html';
        });
    }

    // Tarjeta Colores
    const cardColores = document.getElementById("card-colores");
    if (cardColores) {
        cardColores.addEventListener("click", abrirSelectorColor);
    }

    // Tarjeta Versión
    const cardVersion = document.getElementById("card-version");
    if (cardVersion) {
        cardVersion.addEventListener("click", mostrarVersion);
    }

    // Tarjeta Juegos
    const cardJuegos = document.getElementById("card-juegos");
    if (cardJuegos) {
        cardJuegos.addEventListener("click", abrirMenuJuegos);
    }

    // Botón Cerrar Juego (Modal)
    const btnCloseGame = document.getElementById("close-game");
    if (btnCloseGame) {
        btnCloseGame.addEventListener("click", cerrarJuego);
    }

    // Botones de Juegos (Delegación de eventos)
    const gameContainer = document.getElementById("gameContainer");
    if (gameContainer) {
        gameContainer.addEventListener("click", (e) => {
            // JUEGO 1: SNAKE
            if (e.target.id === "btn-snake") {
                iniciarSnake();
            }
            // JUEGO 2: PONG (NUEVO)
            if (e.target.id === "btn-pong") {
                iniciarPong();
            }
        });
    }
});

// --- FUNCIONES DE LÓGICA ---

// 1. SELECTOR DE COLOR
function abrirSelectorColor() {
    Swal.fire({
        title: '🎨 Elige el color principal',
        html: `
            <div style="display:flex; justify-content:center; gap:10px; margin-top:10px;">
                <div class="color-option" data-p="#2d3e50" data-a="#415d7b" style="width:40px; height:40px; background:#2d3e50; cursor:pointer; border-radius:50%; border:2px solid #ccc;"></div>
                <div class="color-option" data-p="#8e44ad" data-a="#9b59b6" style="width:40px; height:40px; background:#8e44ad; cursor:pointer; border-radius:50%; border:2px solid #ccc;"></div>
                <div class="color-option" data-p="#c0392b" data-a="#e74c3c" style="width:40px; height:40px; background:#c0392b; cursor:pointer; border-radius:50%; border:2px solid #ccc;"></div>
                <div class="color-option" data-p="#16a085" data-a="#1abc9c" style="width:40px; height:40px; background:#16a085; cursor:pointer; border-radius:50%; border:2px solid #ccc;"></div>
            </div>
            <p style="margin-top:15px; font-size:12px;">El cambio se guardará en tu navegador.</p>
        `,
        showConfirmButton: false,
        didOpen: () => {
            const opciones = Swal.getHtmlContainer().querySelectorAll('.color-option');
            opciones.forEach(el => {
                el.addEventListener('click', () => {
                    cambiarColor(el.dataset.p, el.dataset.a);
                    Swal.close();
                });
            });
        }
    });
}

function cambiarColor(primary, accent) {
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--accent-color', accent);
    localStorage.setItem('cims_primary', primary);
    localStorage.setItem('cims_accent', accent);
    
    Swal.fire({
        icon: 'success',
        title: 'Tema Actualizado',
        timer: 1000,
        showConfirmButton: false
    });
}

function aplicarTemaGuardado() {
    const primary = localStorage.getItem('cims_primary');
    const accent = localStorage.getItem('cims_accent');
    if (primary && accent) {
        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--accent-color', accent);
    }
}

// 2. VERSIÓN
function mostrarVersion() {
    Swal.fire({
        title: '🖥️ CIMS GESTOR',
        html: `
            <h3>Versión 1.3.0 (Stable)</h3>
            <p>Build: 2026/01</p>
            <hr>
            <p><strong>Desarrollado por:</strong> CIaMS Team</p>
            <p><strong>Stack:</strong> Node.js, Express, MySQL, AI</p>
        `,
        icon: 'info'
    });
}

// 3. JUEGOS
let gameInterval;

function abrirMenuJuegos() {
    const modal = document.getElementById('gameModal');
    if(modal) modal.style.display = 'flex';
}

function cerrarJuego() {
    const modal = document.getElementById('gameModal');
    if(modal) modal.style.display = 'none';
    
    clearInterval(gameInterval); // Detener loop del juego
    
    // Restaurar menú inicial (Ahora con los dos botones)
    const container = document.getElementById('gameContainer');
    if(container) {
        container.innerHTML = `
            <p>Selecciona un juego:</p>
            <button class="btn" id="btn-snake">🐍 Snake</button>
            <button class="btn" id="btn-pong" style="background-color: #e67e22 !important;">🏓 Pong</button>
        `;
        document.getElementById('gameTitle').innerText = "Juego";
    }
}

// --- JUEGO 1: SNAKE ---
function iniciarSnake() {
    const container = document.getElementById('gameContainer');
    document.getElementById('gameTitle').innerText = "🐍 Snake (Usa flechas)";
    container.innerHTML = '<canvas id="gameCanvas" width="300" height="300"></canvas>';
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const box = 15;
    let snake = [{ x: 9 * box, y: 10 * box }];
    let direction = "RIGHT";
    let food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
    let score = 0;

    // Control de teclado
    const keyHandler = (event) => {
        if (event.keyCode == 37 && direction != "RIGHT") direction = "LEFT";
        else if (event.keyCode == 38 && direction != "DOWN") direction = "UP";
        else if (event.keyCode == 39 && direction != "LEFT") direction = "RIGHT";
        else if (event.keyCode == 40 && direction != "UP") direction = "DOWN";
    };
    
    document.addEventListener("keydown", keyHandler);

    function draw() {
        if (!document.getElementById('gameCanvas')) {
            clearInterval(gameInterval);
            document.removeEventListener("keydown", keyHandler);
            return;
        }

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle = (i == 0) ? "green" : "white";
            ctx.fillRect(snake[i].x, snake[i].y, box, box);
        }

        ctx.fillStyle = "red";
        ctx.fillRect(food.x, food.y, box, box);

        let snakeX = snake[0].x;
        let snakeY = snake[0].y;

        if (direction == "LEFT") snakeX -= box;
        if (direction == "UP") snakeY -= box;
        if (direction == "RIGHT") snakeX += box;
        if (direction == "DOWN") snakeY += box;

        if (snakeX == food.x && snakeY == food.y) {
            score++;
            food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
        } else {
            snake.pop();
        }

        let newHead = { x: snakeX, y: snakeY };

        if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
            clearInterval(gameInterval);
            document.removeEventListener("keydown", keyHandler);
            Swal.fire("Game Over", "Puntuación: " + score, "error").then(() => cerrarJuego());
        }

        snake.unshift(newHead);
    }

    function collision(head, array) {
        for (let i = 0; i < array.length; i++) {
            if (head.x == array[i].x && head.y == array[i].y) return true;
        }
        return false;
    }

    clearInterval(gameInterval);
    gameInterval = setInterval(draw, 100);
}

// --- JUEGO 2: PONG ---
function iniciarPong() {
    const container = document.getElementById('gameContainer');
    document.getElementById('gameTitle').innerText = "🏓 Pong vs CPU (Usa W y S)";
    container.innerHTML = '<canvas id="gameCanvas" width="400" height="300"></canvas>';
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Elementos del juego
    const user = { x: 0, y: canvas.height/2 - 50, width: 10, height: 100, color: "white", score: 0 };
    const com = { x: canvas.width - 10, y: canvas.height/2 - 50, width: 10, height: 100, color: "white", score: 0 };
    const ball = { x: canvas.width/2, y: canvas.height/2, radius: 10, speed: 5, velocityX: 5, velocityY: 5, color: "#e74c3c" };
    const net = { x: (canvas.width - 2)/2, y: 0, width: 2, height: 10, color: "white" };

    function drawRect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    function drawArc(x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }

    function drawNet() {
        for(let i = 0; i <= canvas.height; i+=15) {
            drawRect(net.x, net.y + i, net.width, net.height, net.color);
        }
    }

    function drawText(text, x, y) {
        ctx.fillStyle = "#FFF";
        ctx.font = "35px sans-serif";
        ctx.fillText(text, x, y);
    }

    // Control del mouse
    const mouseHandler = (evt) => {
        if (!document.getElementById('gameCanvas')) return;
        let rect = canvas.getBoundingClientRect();
        user.y = evt.clientY - rect.top - user.height/2;
    };
    canvas.addEventListener("mousemove", mouseHandler);
    
    // Control teclado alternativo (W y S)
    const keyHandlerPong = (e) => {
        if(e.key === 'w' || e.key === 'W') user.y -= 25;
        if(e.key === 's' || e.key === 'S') user.y += 25;
    };
    document.addEventListener("keydown", keyHandlerPong);

    function collision(b, p) {
        p.top = p.y;
        p.bottom = p.y + p.height;
        p.left = p.x;
        p.right = p.x + p.width;

        b.top = b.y - b.radius;
        b.bottom = b.y + b.radius;
        b.left = b.x - b.radius;
        b.right = b.x + b.radius;

        return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
    }

    function resetBall() {
        ball.x = canvas.width/2;
        ball.y = canvas.height/2;
        ball.speed = 5;
        ball.velocityX = -ball.velocityX;
    }

    function update() {
        if (!document.getElementById('gameCanvas')) {
            clearInterval(gameInterval);
            document.removeEventListener("keydown", keyHandlerPong);
            return;
        }

        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // IA Computadora
        let computerLevel = 0.1;
        com.y += (ball.y - (com.y + com.height/2)) * computerLevel;

        if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.velocityY = -ball.velocityY;
        }

        let player = (ball.x + ball.radius < canvas.width/2) ? user : com;

        if(collision(ball, player)) {
            let collidePoint = (ball.y - (player.y + player.height/2));
            collidePoint = collidePoint / (player.height/2);
            let angleRad = (Math.PI/4) * collidePoint;
            let direction = (ball.x + ball.radius < canvas.width/2) ? 1 : -1;
            ball.velocityX = direction * ball.speed * Math.cos(angleRad);
            ball.velocityY = ball.speed * Math.sin(angleRad);
            ball.speed += 0.2;
        }

        if(ball.x - ball.radius < 0) {
            com.score++;
            resetBall();
        } else if(ball.x + ball.radius > canvas.width) {
            user.score++;
            resetBall();
        }
    }

    function game() {
        drawRect(0, 0, canvas.width, canvas.height, "#2d3e50");
        drawText(user.score, canvas.width/4, canvas.height/5);
        drawText(com.score, 3*canvas.width/4, canvas.height/5);
        drawNet();
        drawRect(user.x, user.y, user.width, user.height, user.color);
        drawRect(com.x, com.y, com.width, com.height, com.color);
        drawArc(ball.x, ball.y, ball.radius, ball.color);
        update();
    }

    clearInterval(gameInterval);
    gameInterval = setInterval(game, 1000/50);
}