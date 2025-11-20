// --- CART LOGIC ---
window.cart=[]; // global cart

function addToCart(name, price, quantity=1){
    const existing=window.cart.find(i=>i.name===name);
    if(existing) existing.quantity+=quantity;
    else window.cart.push({name,price,quantity});
    updateCartUI();
}

function increaseQuantity(name){
    const item=window.cart.find(i=>i.name===name);
    if(item){ item.quantity++; updateCartUI(); }
}

function decreaseQuantity(name){
    const item=window.cart.find(i=>i.name===name);
    if(item){ item.quantity--; if(item.quantity<=0) window.cart=window.cart.filter(i=>i.name!==name); updateCartUI(); }
}

function updateCartUI(){
    const cartList=document.getElementById("cart-items");
    const totalEl=document.getElementById("total");
    const countEl=document.getElementById("cart-count");
    if(!cartList||!totalEl||!countEl) return;

    cartList.innerHTML="";
    if(window.cart.length===0){
        const li=document.createElement("li"); li.textContent="لا يوجد منتجات بعد"; cartList.appendChild(li);
        totalEl.textContent="0"; countEl.textContent="0"; return;
    }

    window.cart.forEach(item=>{
        const li=document.createElement("li");
        li.textContent=`${item.name} × ${item.quantity} = $${(item.price*item.quantity).toFixed(2)}`;
        const btnDec=document.createElement("button"); btnDec.textContent="−"; btnDec.onclick=()=>decreaseQuantity(item.name);
        const btnInc=document.createElement("button"); btnInc.textContent="+"; btnInc.onclick=()=>increaseQuantity(item.name);
        li.appendChild(btnDec); li.appendChild(btnInc); cartList.appendChild(li);
    });

    totalEl.textContent=window.cart.reduce((t,i)=>t+i.price*i.quantity,0).toFixed(2);
    countEl.textContent=window.cart.reduce((c,i)=>c+i.quantity,0);
}

// --- LOAD PRODUCTS FROM SHEETY ---
async function loadProducts(){
    try{
        const res=await fetch("https://api.sheety.co/e5f42c6a1510007d10970f8672a067dd/داتا تجربة/medicinesPrices");
        const data=await res.json();
        const products=data.medicinesPrices;
        const container=document.querySelector(".product-grid");
        container.innerHTML="";
        products.forEach(p=>{
            const div=document.createElement("div"); div.classList.add("product-card");
            div.innerHTML=`<h3>${p.medicine}</h3><p>Price: $${parseFloat(p.price).toFixed(2)}</p><button onclick="addToCart('${p.medicine}',${p.price})">Add to Cart</button>`;
            container.appendChild(div);
        });
    } catch(e){ console.error("Error loading products:",e); }
}

// --- CHECKOUT ---
document.getElementById("checkout").addEventListener("click", async ()=>{
    if(window.cart.length===0){ alert("Cart is empty!"); return; }
    const username=document.getElementById("username").value.trim();
    if(!username){ alert("Enter your name"); return; }

    const totalAmount=window.cart.reduce((t,i)=>t+i.price*i.quantity,0);
    const data={purchase:{username,price:totalAmount,items:window.cart.map(i=>`${i.name} × ${i.quantity}`).join(","),timestamp:new Date().toLocaleString()}};

    try{
        const response=await fetch("https://api.sheety.co/e5f42c6a1510007d10970f8672a067dd/داتا تجربة/purchase",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        if(response.ok){ alert("Invoice saved!"); window.cart=[]; document.getElementById("username").value=""; updateCartUI(); }
        else{ alert("Error saving invoice"); console.log(await response.text()); }
    } catch(e){ console.error(e); alert("Network error"); }
});

// --- NAVIGATION ---
function showSection(sectionId){
    document.querySelectorAll("section").forEach(sec=>sec.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
}

// --- INIT ---
window.addEventListener("DOMContentLoaded", loadProducts);
