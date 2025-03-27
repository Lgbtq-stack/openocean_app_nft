// import {getAccountBalance} from "./backend/stellar_helper";
// import {get_config} from "./backend/datacontoller";

//walletTest = GAJDSJBEXLSF6K4D774YMQOLDIVTCEDMQVM3RCXWWHJN4PZ24JYZYD3B
// const user_Id = "488916773";
import {showErrorPopup} from "./PopupLogic.js";

let user_Id = null;

let currentSection = null;
let currentCategoryId = null;

let tg = null;
document.addEventListener("DOMContentLoaded", () => {
    Telegram.WebApp.expand();
    tg = Telegram.WebApp;
});

let userDataCache = {
    data: null,
    timestamp: 0,
    ttl: 300000
};

let categoriesCache = [];


async function loadCategoriesOnce(includeAll = false) {
    if (categoriesCache.length > 0) {
        console.log("Using cached categories.");
        return includeAll ? [{ id: "", name: "All" }, ...categoriesCache] : categoriesCache;
    }

    try {
        const response = await fetch("https://miniappservcc.com/api/collections");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const collectionsData = await response.json();
        if (!Array.isArray(collectionsData.collections)) {
            throw new TypeError("Invalid data format: expected 'collections' to be an array.");
        }

        categoriesCache = collectionsData.collections.map(c => ({
            id: c.meta.id,
            name: c.meta.name,
        }));

        return includeAll ? [{ id: "", name: "All" }, ...categoriesCache] : categoriesCache;
    } catch (error) {
        showErrorPopup("error", `Error loading categories: ${error.message}`);
        return [];
    }
}

function renderCategories(categories) {
    const categoryContainer = document.getElementById("category-list");
    categoryContainer.innerHTML = "";

    categories.forEach(category => {
        const categoryCard = document.createElement("div");
        categoryCard.classList.add("category-card");
        categoryCard.textContent = category.name;

        categoryCard.addEventListener("click", () => fetchCategoryNFTs(category.id));
        categoryContainer.appendChild(categoryCard);
    });
}

function fetchCategoryNFTs(categoryId) {
    if (currentCategoryId === categoryId) {
        console.log(`Category "${categoryId}" is already selected. Skipping request.`);
        return;
    }
    currentCategoryId = categoryId;

    console.log(`Fetching NFTs for category: ${categoryId || "All"}`);
    fetchUserNFTs(user_Id, categoryId);
}

async function fetchUserNFTs(userId, collectionId = "", page = 1, limit = 5) {
    try {
        const apiUrl = `https://miniappservcc.com/api/collections?page=${page}&limit=${limit}&collection_id=${collectionId}&user_id=${userId}`;
        console.log(`Fetching NFTs for category: ${collectionId || "All"}`);

        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`Failed to fetch user NFTs: ${response.status}`);

        const data = await response.json();
        console.log(data);
        renderPurchasedNFTs(data.data);
    } catch (error) {
        showErrorPopup("error", "Failed to fetch user NFTs.");
    }
}

function renderPurchasedNFTs(nfts) {
    const nftContainer = document.querySelector(".my-nft-cards");
    const exploreSection = document.getElementById("explore-section");
    const noNFTs = document.getElementById("my-nft-no-nfts");

    function toggleExploreSection(show) {
        exploreSection.style.display = show ? "block" : "none";
        noNFTs.style.display = show ? "none" : "block";
    }

    if (!nftContainer) return;
    nftContainer.innerHTML = "";

    if (nfts.length > 0) {
        toggleExploreSection(true);
        nfts.forEach((nft) => {
            const nftCard = document.createElement("div");
            nftCard.classList.add("my-nft-card");

            nftCard.innerHTML = `
                <div class="my-nft-image-container">
                    <img src="https://miniappservcc.com/get-image?path=${nft.image}" alt="${nft.name}" class="my-nft-card-image">
                </div>
                <h3 class="my-nft-card-title">${nft.name}</h3>
                <div class="my-nft-info-row">
                    <div class="my-nft-info-item">
                        🏷️ <span>${nft.collection?.name || nft.collection}</span>
                    </div>
                    <div class="my-nft-info-item">
                        👥 <span>${nft.userCount}</span>
                    </div>
                    <div class="my-nft-info-item">
                        📊 <span>${nft.totalBought}</span>
                    </div>
                    <div class="my-nft-info-item">
                        📥 <span>${nft.count}</span>
                    </div>
                </div>
                <div class="my-nft-card-price">
                    <p><strong><img src="../content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: middle;"></strong> ${nft.price} </p>
                </div>
                <button class="my-nft-details-button" id="details-${nft.id}">
                    <img class="my-nft-info-icon" src="../content/info.png" alt="Info"> Details
                </button>
            `;

            const detailsButton = nftCard.querySelector('.my-nft-details-button');
            detailsButton.addEventListener('click', () => {
                showNFTDetails(nft.id, nfts);
            });

            nftContainer.appendChild(nftCard);
        });
    } else {
        toggleExploreSection(false);

    }
}

async function createMyNFTCategories() {
    const sliderTrack = document.getElementById("my-nft-slider-track");
    if (!sliderTrack) {
        console.error("Slider track not found.");
        return;
    }

    sliderTrack.innerHTML = "";

    const categories = await loadCategoriesOnce(true);

    categories.forEach(category => {
        const button = document.createElement("button");
        button.classList.add("my-nft-category-item");
        button.textContent = category.name;

        button.addEventListener("click", () => {
            document.querySelectorAll(".my-nft-category-item").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const collectionId = category.id === "" ? "" : category.id;
            console.log(`Selected category ID: ${collectionId}`);

            fetchUserNFTs(user_Id, collectionId);
        });

        sliderTrack.appendChild(button);
    });

    initializeNFTSlider();
}


function initializeNFTSlider() {
    const sliderWrapper = document.querySelector(".nft-slider-wrapper");
    const prevArrow = document.querySelector(".slider-control-nft.prev");
    const nextArrow = document.querySelector(".slider-control-nft.next");

    prevArrow.style.visibility = "visible";
    nextArrow.style.visibility = "visible";

    function moveSlider(offset) {
        sliderWrapper.scrollBy({ left: offset, behavior: "smooth" });
    }

    prevArrow.addEventListener("click", () => moveSlider(-1000));
    nextArrow.addEventListener("click", () => moveSlider(1000));

    // Переменные для отслеживания сенсорного и мышечного взаимодействия
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    // === Поддержка мыши ===
    sliderWrapper.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.pageX - sliderWrapper.offsetLeft;
        scrollLeft = sliderWrapper.scrollLeft;
        sliderWrapper.style.cursor = "grabbing";
    });

    sliderWrapper.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - sliderWrapper.offsetLeft;
        const walk = (x - startX) * 2;
        sliderWrapper.scrollLeft = scrollLeft - walk;
    });

    sliderWrapper.addEventListener("mouseup", () => {
        isDragging = false;
        sliderWrapper.style.cursor = "grab";
    });

    sliderWrapper.addEventListener("mouseleave", () => {
        isDragging = false;
        sliderWrapper.style.cursor = "grab";
    });

    sliderWrapper.addEventListener("touchstart", (e) => {
        isDragging = true;
        startX = e.touches[0].pageX - sliderWrapper.offsetLeft;
        scrollLeft = sliderWrapper.scrollLeft;
    });

    sliderWrapper.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - sliderWrapper.offsetLeft;
        const walk = (x - startX) * 2;
        sliderWrapper.scrollLeft = scrollLeft - walk;
    });

    sliderWrapper.addEventListener("touchend", () => {
        isDragging = false;
    });
}



let currentPage = 1;
let currentCategory = 1;

function generatePagination(paging, onPageChange) {
    const { page, totalPages } = paging;
    const paginationContainer = document.getElementById("pagination-container");

    if (!paginationContainer) {
        return;
    }

    paginationContainer.innerHTML = "";

    if (page > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "<";
        prevButton.className = "pagination-btn";
        prevButton.addEventListener("click", () => onPageChange(page - 1));
        paginationContainer.appendChild(prevButton);
    }

    const firstPage = createPageButton(1, page, onPageChange);
    paginationContainer.appendChild(firstPage);

    if (page > 3) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        dots.className = "dots";
        paginationContainer.appendChild(dots);
    }

    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        const pageButton = createPageButton(i, page, onPageChange);
        paginationContainer.appendChild(pageButton);
    }

    if (page < totalPages - 2) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        dots.className = "dots";
        paginationContainer.appendChild(dots);
    }

    if (totalPages > 1) {
        const lastPage = createPageButton(totalPages, page, onPageChange);
        paginationContainer.appendChild(lastPage);
    }

    if (page < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = ">";
        nextButton.className = "pagination-btn";
        nextButton.addEventListener("click", () => onPageChange(page + 1));
        paginationContainer.appendChild(nextButton);
    }
}

function createPageButton(pageNumber, currentPage, onPageChange) {
    const button = document.createElement("button");
    button.textContent = pageNumber;
    button.className = "pagination-btn";

    if (pageNumber === currentPage) {
        button.classList.add("active");
    }

    button.addEventListener("click", () => {
        onPageChange(pageNumber);
        scrollToTop();
    });

    return button;
}


async function onPageChange(newPage) {
    currentPage = newPage;
    await loadCategories(currentPage, currentCategory);
}

function lazyLoadImages() {
    const lazyImages = document.querySelectorAll(".lazy-img");

    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                // if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.onload = () => {
                        const spinner = img.previousElementSibling;
                        if (spinner) spinner.style.display = "none";
                        img.style.display = "block";
                    };
                    img.onerror = () => {
                        const spinner = img.previousElementSibling;
                        if (spinner) spinner.style.display = "none";
                        img.src = "https://placehold.co/200x200?text=Error";
                    };
                    observer.unobserve(img);
                // }
            });
        },
        // { threshold: 0.1 }
    );

    lazyImages.forEach((img) => {
        observer.observe(img);
    });
}

async function loadCategories(page, category) {
    try {
        console.log(`Loading Categories ${category.name}`);
        if (!category) {
            console.error("Invalid category ID:", category);
            return;
        }

        const response = await fetch(`https://miniappservcc.com/api/collections?collection_id=${category}&page=${page}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        const items = Array.isArray(data.data) ? data.data : [];
        const paging = data.paging || { page: 1, totalPages: 1 };

        const cardsContainer = document.getElementById("category-list");
        if (!cardsContainer) {
            throw new Error("Element with ID 'category-list' not found in DOM.");
        }

        cardsContainer.innerHTML = "";
        items.forEach((item) => {
            const count = item.count ? item.count : 0;

            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <div class="nft-image-container">
                    <img src="https://miniappservcc.com/get-image?path=${item.image}" alt="${item.name}" class="nft-image">
                </div>
                <div class="nft-details">
                    <h3 class="nft-title">${item.name}</h3>

                    <div class="nft-info-row">
                        <div class="nft-info-item">
                            🏷️ <span>${item.collection || "Unknown"}</span>
                        </div>
                    </div>

                    <div class="nft-price-row">
                        <p><img src="../content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: sub;"> ${item.price}</p>
                    </div>
                </div>

                <button class="details-button" id="details-${item.id}">
                    <img class="info-icon" src="../content/info.png" alt="click"> Details
                </button>
            `;

            const detailsButton = card.querySelector(".details-button");
            detailsButton.addEventListener("click", () => {
                showNFTDetails(item.id, items);
            });

            cardsContainer.appendChild(card);
        });

        lazyLoadImages();
        generatePagination(paging, onPageChange);
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

import StellarSdk from 'https://cdn.jsdelivr.net/npm/@stellar/stellar-sdk/+esm';
const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");

async function checkTrustline(accountId) {
    try {
        const assetCode = "NFT";
        const assetIssuer = "GBBWC7PI3LX4GNQ2AMF3HOHJCTHFWSIADMCB2DZIRNM6IKIVRTXMJTRG";
        const account = await server.loadAccount(accountId);


        const trustlineExists = account.balances.some(balance =>
            balance.asset_code === assetCode && balance.asset_issuer === assetIssuer
        );
        console.log(`Trustline to ${assetCode} (${assetIssuer}) exists:`, trustlineExists);

        return trustlineExists;
    } catch (error) {
        console.error("Error checking trustline:", error);
        return false;
    }
}



window.openWebPage = function(elementId) {
    const url = document.getElementById(elementId).textContent.trim();
    if (url) {
        window.open(url, '_blank');
    } else {
        console.error("URL is empty or invalid.");
    }
}


function disableScroll() {
    document.body.classList.add('no-scroll');
}

function enableScroll() {
    document.body.classList.remove('no-scroll');
}

let refreshCooldown = false;

async function refreshUserBalance(showPopup = true) {
    if (refreshCooldown) {
        if (showPopup) {
            showErrorPopup("warning", "Please wait before refreshing again.");
        }
        return;
    }

    try {
        refreshCooldown = true;
        document.getElementById('refresh-balance-button').disabled = true;

        const response = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch balance: ${response.status}`);
        }

        const data = await response.json();

        let totalBalance;
        totalBalance = data.balance + data.balance_bonus;

        if (data && data.balance !== undefined) {
            document.getElementById('wallet-balance').innerHTML = ` ${totalBalance.toFixed(2)} 
            <img src="../content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: middle">`;


            userDataCache = {
                data: data,
                timestamp: new Date().getTime(),
                ttl: userDataCache.ttl
            };

            console.log("Updated userDataCache:", userDataCache);
            if (showPopup) {
                showErrorPopup("success", "Balance updated successfully!");
            }
        } else {
            if (showPopup) {
                showErrorPopup("error", "Invalid response: balance not found.");
            }
        }

    } catch (error) {
        console.error("Error refreshing balance:", error);
        if (showPopup) {
            showErrorPopup("error", "Failed to refresh balance. Try again later.");
        }
    } finally {
        setTimeout(() => {
            refreshCooldown = false;
            document.getElementById('refresh-balance-button').disabled = false;
        }, 5000);
    }
}



