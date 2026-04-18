const API_BASE_URL = "http://127.0.0.1:8000";

// ================= STATE =================
let currentCategoryId = "c1a7f2b0-9d3a-4e1f-8a2a-1f9d8a7b1234";

let allProductsInCategory = [];
let currentProducts = [];

let inputValue = "";
let selectedSuggestion = null;

let debounceTimer = null;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", async () => {
    await loadCategory(currentCategoryId);
    bindSearch();
});

// ================= LOAD CATEGORY (CASE 4) =================
async function loadCategory(catId) {
    currentCategoryId = catId;

    inputValue = "";
    selectedSuggestion = null;

    const res = await fetch(`${API_BASE_URL}/products/by_category/${catId}`);
    const data = await res.json();

    allProductsInCategory = data.products || [];
    currentProducts = [...allProductsInCategory];

    renderProducts(currentProducts);
    clearSearchUI();
}

// ================= SEARCH BIND =================
function bindSearch() {
    const input = document.querySelector(".search-box input");
    const searchBtn = document.querySelector(".icon-box"); // kính lúp

    // ===== INPUT (DEBOUNCED) =====
    input.addEventListener("input", (e) => {
        inputValue = e.target.value.trim();
        selectedSuggestion = null;

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            if (inputValue === "") {
                resetSearch(); // CASE 3
                return;
            }

            const results = localSearch(inputValue); // CASE 1

            renderProducts(results);
            renderSuggestions(results.slice(0, 6)); // CASE 2 (preview)
        }, 200);
    });

    // ===== ENTER =====
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSearch();
    });

    // ===== ICON CLICK =====
    searchBtn.addEventListener("click", handleSearch);
}

// ================= CORE SEARCH HANDLER =================
function handleSearch() {
    const input = document.querySelector(".search-box input");
    inputValue = input.value.trim();

    if (inputValue === "") {
        resetSearch(); // CASE 3
        return;
    }

    // CASE 2 (selected suggestion)
    if (selectedSuggestion) {
        renderProducts([selectedSuggestion]);
        hideSuggestions();
        return;
    }

    // CASE 1 (normal search)
    const results = localSearch(inputValue);
    renderProducts(results);
    hideSuggestions();
}

// ================= CASE 1: LOCAL SEARCH =================
// chỉ search trong category hiện tại
function localSearch(keyword) {
    const k = keyword.toLowerCase();

    return allProductsInCategory.filter(p =>
        matchProduct(p, k)
    );
}

// optimized search (KHÔNG flatten object)
function matchProduct(product, keyword) {
    // ưu tiên field quan trọng trước (FAST PATH)
    if (product.pro_name?.toLowerCase().includes(keyword)) return true;
    if (product.brand?.toLowerCase().includes(keyword)) return true;
    if (String(product.price).includes(keyword)) return true;
    if (product.description?.toLowerCase().includes(keyword)) return true;
    if (String(product.stock).includes(keyword)) return true;

    // attributes
    if (Array.isArray(product.attributes)) {
        for (let attr of product.attributes) {
            if (
                attr?.name?.toLowerCase().includes(keyword) ||
                attr?.value?.toLowerCase().includes(keyword)
            ) {
                return true;
            }
        }
    }

    // reviews (optional search)
    if (Array.isArray(product.reviews)) {
        for (let r of product.reviews) {
            if (r?.content?.toLowerCase?.().includes(keyword)) return true;
            if (r?.reviewer?.toLowerCase?.().includes(keyword)) return true;
        }
    }

    return false;
}

// ================= CASE 2: SUGGESTION =================
function renderSuggestions(products) {
    let box = document.getElementById("suggest-box");

    if (!box) {
        box = document.createElement("div");
        box.id = "suggest-box";
        box.style.position = "absolute";
        box.style.top = "40px";
        box.style.left = "0";
        box.style.width = "260px";
        box.style.background = "white";
        box.style.border = "1px solid #ddd";
        box.style.zIndex = "9999";
        box.style.borderRadius = "8px";

        document.querySelector(".search-box").appendChild(box);
    }

    box.innerHTML = "";

    products.forEach(p => {
        const item = document.createElement("div");
        item.style.padding = "8px";
        item.style.cursor = "pointer";
        item.style.borderBottom = "1px solid #eee";

        item.innerHTML = `
            <div><b>${p.pro_name}</b></div>
            <small>${p.brand}</small>
        `;

        item.onclick = () => {
            selectedSuggestion = p;

            document.querySelector(".search-box input").value = p.pro_name;

            renderProducts([p]); // CASE 2 immediate
            hideSuggestions();
        };

        box.appendChild(item);
    });
}

function hideSuggestions() {
    const box = document.getElementById("suggest-box");
    if (box) box.innerHTML = "";
}

// ================= CASE 3: RESET =================
function resetSearch() {
    selectedSuggestion = null;
    currentProducts = [...allProductsInCategory];

    renderProducts(currentProducts);
    hideSuggestions();
}

// ================= CASE 4: CATEGORY CHANGE =================
function changeContent(catId) {
    loadCategory(catId);
}

// ================= RENDER PRODUCTS =================
function renderProducts(products) {
    const panel = document.getElementById("right-panel");

    currentProducts = products;

    if (!products || products.length === 0) {
        panel.innerHTML = "No products found.";
        return;
    }

    panel.innerHTML = products.map(p => `
        <div class="product-card">
            <div><b>${p.pro_name}</b></div>
            <div>${p.brand}</div>
            <div>${p.price}</div>
            <div>${p.description}</div>
        </div>
    `).join("");
}

// ================= CLEAR UI =================
function clearSearchUI() {
    const input = document.querySelector(".search-box input");
    input.value = "";
    hideSuggestions();
}