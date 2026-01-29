document.addEventListener("DOMContentLoaded", () => {
    // 1. Inyectar el HTML del chat en la página
    const chatHTML = `
        <div class="chat-widget">
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span>🤖😺</span>
                        <span>Asistente CIaMS</span>
                    </div>
                    <button id="closeChat" title="Cerrar chat" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">&times;</button>
                </div>
                <div class="chat-body" id="chatBody">
                    <div class="msg msg-bot">
                        Hola 👋. Soy CIaMS-BOT. <br>
                        Puedo ayudarte con activos, incidencias, empleados o dudas del sistema. ¿Qué necesitas?
                    </div>
                </div>
                <div class="chat-footer">
                    <input type="text" id="chatInput" placeholder="Escribe tu pregunta..." autocomplete="off" />
                    <button id="sendChat">➤</button>
                </div>
            </div>
            <button class="chat-button" id="toggleChat" title="Ayuda IA">💬</button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // 2. Referencias a elementos
    const toggleBtn = document.getElementById("toggleChat");
    const closeBtn = document.getElementById("closeChat");
    const chatWindow = document.getElementById("chatWindow");
    const chatBody = document.getElementById("chatBody");
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendChat");

    let isOpen = false;

    // 3. Funciones
    const toggleChat = () => {
        isOpen = !isOpen;
        chatWindow.style.display = isOpen ? "flex" : "none";
        toggleBtn.style.display = isOpen ? "none" : "flex"; // Oculta burbuja al abrir
        if (isOpen) {
            chatInput.focus();
            scrollToBottom();
        }
    };

    const closeChatMain = () => {
        isOpen = false;
        chatWindow.style.display = "none";
        toggleBtn.style.display = "flex";
    };

    const appendMessage = (text, sender) => {
        const div = document.createElement("div");
        div.classList.add("msg", sender === "user" ? "msg-user" : "msg-bot");
        // Permitir saltos de línea y negritas simples
        div.innerHTML = text.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        chatBody.appendChild(div);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        // 1. Mostrar mensaje usuario
        appendMessage(text, "user");
        chatInput.value = "";

        // 2. Indicador de carga
        const loadingId = "loading-" + Date.now();
        const loadingDiv = document.createElement("div");
        loadingDiv.id = loadingId;
        loadingDiv.className = "msg msg-bot";
        loadingDiv.innerHTML = "<i>Escribiendo...</i>";
        chatBody.appendChild(loadingDiv);
        scrollToBottom();

        try {
            // 3. Petición al Backend 
            const response = await fetch('/api/chat-guia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: text })
            });

            const data = await response.json();
            
            // 4. Quitar loading y mostrar respuesta
            document.getElementById(loadingId).remove();
            
            if (data.error) {
                appendMessage("⚠️ " + data.error, "bot");
            } else {
                appendMessage(data.respuesta, "bot");
            }

        } catch (error) {
            document.getElementById(loadingId).remove();
            console.error(error);
            appendMessage("❌ Error de conexión. Intenta de nuevo.", "bot");
        }
    };

    // 4. Eventos
    toggleBtn.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", closeChatMain);
    
    sendBtn.addEventListener("click", sendMessage);
    
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });
});