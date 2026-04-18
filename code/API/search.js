// ================= SEARCH MODULE =================

let debounceTimer = null;
let selectedSuggestion = null;
let lastQuery = "";

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector(".search-box input");

    // FIX: đúng selector icon
    const searchIcon = document.querySelectorAll(".right-group .icon-box")[0];

    if (!input) return;

    input.addEventListener("input", onInputSearch);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleSearch(input.value.trim());
        }
    });

    if (searchIcon) {
        searchIcon.addEventListener("click", () => {
            handleSearch(input.value.trim());
        });
    }
});

// ================= INPUT =================
function onInputSearch(e) {
    const value = e.target.value.trim();
    lastQuery = value;

    // reset suggestion khi user gõ lại
    selectedSuggestion = null;

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        handleSearch(value);
    }, 250);
}

// ================= CORE =================
function handleSearch(query) {
    const panel = document.getElementById("right-panel");

    // CASE 3: empty → reset
    if (!query) {
        resetToCategory();
        return;
    }

    fuzzySearch(query);
}

// ================= FUZZY SEARCH =================
function fuzzySearch(query) {
    const panel = document.getElementById("right-panel");
    const products = window.currentProducts || [];

    const q = query.toLowerCase();

    const results = products.filter(p => {
        return [
            p.pro_name,
            p.description,
            p.brand,
            ...(p.attributes || []).map(a => a.name + " " + a.value),
            ...(p.reviews || []).map(r => r.content + " " + r.reviewer),
            String(p.price),
            String(p.stock)
        ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    window.renderProducts(panel, results);
}

// ================= RESET =================
function resetToCategory() {
    const panel = document.getElementById("right-panel");

    selectedSuggestion = null;
    lastQuery = "";

    if (window.currentProducts) {
        window.renderProducts(panel, window.currentProducts);
    }
}

// ================= SUGGESTION =================
function selectSuggestion(product) {
    selectedSuggestion = product;

    const panel = document.getElementById("right-panel");

    // click suggestion = show 1 product (OK logic của bạn)
    window.renderProducts(panel, [product]);

    // optional: sync input
    const input = document.querySelector(".search-box input");
    if (input) input.value = product.pro_name || "";
}

// ================= CATEGORY CHANGE =================
function onCategoryChanged(newProducts) {
    window.currentProducts = newProducts;

    selectedSuggestion = null;
    lastQuery = "";

    const input = document.querySelector(".search-box input");
    if (input) input.value = "";

    resetToCategory();
}

// ================= GLOBAL =================
window.selectSuggestion = selectSuggestion;
window.onCategoryChanged = onCategoryChanged;

console.log("CURRENT PRODUCTS:", window.currentProducts);
console.log("QUERY:", query);