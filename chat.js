// Unified cart
window.cart = {}; // global cart object

document.addEventListener("DOMContentLoaded", () => {
    const cartList = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");
    const countEl = document.getElementById("cart-count");
    const cartItemsDiv = document.getElementById("cartItems");

    const chatBtn = document.getElementById("chatButton");
    const chatBox = document.getElementById("chatBox");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const chatMessages = document.getElementById("chatMessages");
    const voiceBtn = document.getElementById("voiceBtn");

    // Toggle chat box
    chatBtn.onclick = () => {
        chatBox.style.display = chatBox.style.display === "block" ? "none" : "block";
    };

    chatSend.onclick = sendMessage;
    chatInput.addEventListener("keydown", e => { if(e.key==="Enter") sendMessage(); });

    // Send message to API
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        appendMsg("You", text);
        chatInput.value = "";

        try {
            const res = await fetch("/api/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            appendMsg("AI", data.reply || "⚠️ No reply from server");
        } catch (err) {
            appendMsg("AI", "⚠️ Cannot connect to server");
        }
    }

    function appendMsg(sender, text) {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatMessages.appendChild(p);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Voice input
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "ar-EG";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => voiceBtn.textContent="🎙️ Listening...";
        recognition.onresult = e => {
            chatInput.value = e.results[0][0].transcript;
            sendMessage();
        };
        recognition.onerror = e => { console.error(e.error); voiceBtn.textContent="🎤"; };
        recognition.onend = () => voiceBtn.textContent="🎤";

        voiceBtn.onclick = () => { try { recognition.start(); } catch(e){ console.error(e); } };
    } else {
        voiceBtn.onclick = () => alert("متصفحك لا يدعم التسجيل الصوتي. استخدم Chrome أو Edge.");
    }

    // Update cart UI
    function updateCartUI() {
        const keys = Object.keys(window.cart);

        // Main cart
        if(cartList){
            cartList.innerHTML="";
            if(keys.length===0){
                const li=document.createElement("li");
                li.textContent="لا يوجد منتجات بعد";
                cartList.appendChild(li);
                totalEl.textContent="0";
            } else {
                keys.forEach(key=>{
                    const item=window.cart[key];
                    const li=document.createElement("li");
                    li.textContent=`${key} × ${item.quantity} = $${(item.price*item.quantity).toFixed(2)}`;

                    const btnDec=document.createElement("button");
                    btnDec.textContent="−"; btnDec.onclick=()=>{ item.quantity--; if(item.quantity<=0) delete window.cart[key]; updateCartUI(); };

                    const btnInc=document.createElement("button");
                    btnInc.textContent="+"; btnInc.onclick=()=>{ item.quantity++; updateCartUI(); };

                    li.appendChild(btnDec); li.appendChild(btnInc);
                    cartList.appendChild(li);
                });
                const total = keys.reduce((sum,k)=>sum+window.cart[k].price*window.cart[k].quantity,0);
                totalEl.textContent=total.toFixed(2);
            }
        }

        // Chat cart
        if(cartItemsDiv){
            cartItemsDiv.innerHTML="";
            if(keys.length===0) cartItemsDiv.textContent="لا يوجد منتجات بعد";
            else keys.forEach(key=>{ const div=document.createElement("div"); div.textContent=`${key} × ${window.cart[key].quantity}`; cartItemsDiv.appendChild(div); });
        }

        // Header count
        if(countEl){
            const totalCount = keys.reduce((sum,k)=>sum+window.cart[k].quantity,0);
            countEl.textContent=totalCount;
        }
    }

    // Expose functions globally
    window.addToCart=(name,price,q=1)=>{
        if(window.cart[name]) window.cart[name].quantity+=q;
        else window.cart[name]={price,quantity:q};
        updateCartUI();
    };

    updateCartUI();
});
