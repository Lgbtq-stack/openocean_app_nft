// import {getAccountBalance} from "./backend/stellar_helper";
// import {get_config} from "./backend/datacontoller";

//walletTest = GAJDSJBEXLSF6K4D774YMQOLDIVTCEDMQVM3RCXWWHJN4PZ24JYZYD3B
// const user_Id = "350104566";
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

function showSection(sectionId) {
    if (currentSection === sectionId) {
        console.log(`Section "${sectionId}" is already active. Skipping request.`);
        return;
    }
    currentSection = sectionId;

    document.querySelectorAll("section").forEach(section => {
        section.style.display = "none";
    });
    document.getElementById(sectionId).style.display = "block";


    if (sectionId === "trendings") {
        loadTrendingNFTs();
    } else if (sectionId === "my-nfts") {
        fetchUserNFTs(user_Id);
    } else if (sectionId === "categories") {
        loadCategoriesOnce().then(categories => {
            console.log("Loaded categories:", categories);
            renderCategories(categories);
        });
    }
}

function getUserIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    user_Id = urlParams.get("user_id");

    if (user_Id) {
        console.log(`User ID from URL: ${user_Id}`);
        return user_Id;
    } else {
        console.warn("User ID not found in the URL.");
        return null;
    }
}

function updateWalletInfo(nickname, balance) {
    document.getElementById("wallet-address").textContent = `User: ${nickname}`;
    document.getElementById("wallet-balance").textContent = `Balance: ${balance} XLM`;
}

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

        console.log("Categories loaded and cached:", categoriesCache);

        return includeAll ? [{ id: "", name: "All" }, ...categoriesCache] : categoriesCache;
    } catch (error) {
        showErrorPopup("error", `Error loading categories: ${error.message}`);
        return [];
    }
}

function renderCategories(categories) {
    const categoryContainer = document.getElementById("category-list");
    categoryContainer.innerHTML = "";  // Очищаем старые категории

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

let currentIndex = 0;
let totalSlides = 0;

const sliderTrack = document.getElementById("sliderTrack");

function showNextSlide() {
    const slides = document.querySelectorAll(".slider-card img");
    totalSlides = slides.length;

    if (totalSlides === 0) {
        console.warn("No slides found!");
        return;
    }

    currentIndex = (currentIndex + 1) % totalSlides;
    sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
}

async function loadTrendingNFTs() {
    try {
        const response = await fetch("https://miniappservcc.com/api/trends");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const trendingData = await response.json();
        if (!Array.isArray(trendingData.trending)) {
            throw new TypeError("Invalid data format: expected 'trending' to be an array.");
        }

        const items = trendingData.trending;

        const sliderTrack = document.getElementById("sliderTrack");
        sliderTrack.innerHTML = "";

        items.slice(0, 4).forEach((nft) => {
            const slide = document.createElement("div");
            slide.classList.add("slider-item");

            slide.innerHTML = `
                <div class="slider-card">
                    <img class="trending-nft-image" src="${nft.image}" alt="${nft.name}">
                    <div class="slider-card-overlay">
                        <h3 class="trending-nft-title">${nft.name}</h3>
                        <div class="trending-info-row">
                            <div class="trending-info-item">🏷️ ${nft.collection || "Unknown"}</div>
                            <div class="trending-info-item">💰 ${nft.price} XLM</div>
                        </div>
                    </div>
                </div>
            `;

            slide.addEventListener("click", () => {
                console.log(`Card clicked for NFT ID: ${nft.id}`);
                showNFTDetails(nft.id, items);
            });

            sliderTrack.appendChild(slide);
        });

        const cardsContainer = document.querySelector('.cards');
        if (!cardsContainer) {
            throw new Error("Element with class 'cards' not found in DOM.");
        }

        cardsContainer.innerHTML = "";

        items.slice(4).forEach((nft) => {
            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <div class="nft-image-container">
                    <img src="${nft.image}" alt="${nft.name}" class="nft-image">
                </div>
                <div class="nft-details">
                    <h3 class="nft-title">${nft.name}</h3>
                    
                    <div class="nft-info-row">
                        <div class="nft-info-item">🏷️ <span>${nft.collection || "Unknown"}</span></div>
                        <div class="nft-info-item">👥 <span>${nft.userCount}</span></div>
                        <div class="nft-info-item">📊 <span>${nft.totalBought}</span></div>
                    </div>
                    
                    <p class="nft-price">💰${nft.price} XLM</p>
                </div>

                <div class="nft-button-container">
                    <button class="details-button" id="details-${nft.id}">
                        <img class="info-icon" src="content/info.png" alt="Info"> Details
                    </button>
                </div>
            `;

            cardsContainer.appendChild(card);

            const detailsButton = card.querySelector('.details-button');
            detailsButton.addEventListener('click', () => {
                console.log(`Button clicked for NFT ID: ${nft.id}`);
                showNFTDetails(nft.id, items);
            });
        });

        console.log("Trending NFTs and cards successfully loaded and rendered.");
    } catch (error) {
        console.error("Error loading trending NFTs:", error);
    }
}

async function showNFTDetails(id, dataSource) {
    try {
        if (!dataSource || !Array.isArray(dataSource)) {
            throw new TypeError("Invalid dataSource: expected an array of objects.");
        }

        const nft = dataSource.find((item) => item.id === Number(id));
        if (!nft) {
            console.error(`NFT with id=${id} not found in the provided data source.`);
            return;
        }

        document.getElementById('nft-title').textContent = nft.name;
        document.getElementById('nft-image').src = nft.image;
        document.getElementById('nft-collection').textContent = nft.collection.name || nft.collection;
        document.getElementById('nft-holders').textContent = `${nft.userCount}`;
        document.getElementById('nft-total-bought').textContent = `${nft.totalBought}`;
        document.getElementById('nft-description').textContent = nft.description || "No Description Available.";
        document.getElementById('nft-price').textContent = `${nft.price} XLM`;

        const countNFT = document.getElementById("nft-owned-count");
        const nftInfoItem = countNFT.closest(".nft-info-item");

        if (nft.count > 0) {
            nftInfoItem.style.display = "flex";
            countNFT.textContent = nft.count;
        } else {
            nftInfoItem.style.display = "none";
        }

        let nftCount = 1;
        document.getElementById('nft-count-display').textContent = `${nftCount}`;

        function updateBuyButton(price, count) {
            buyButton.textContent = `Buy NFT: ${(price * count).toFixed(2)} XLM`;
        }

        let buyButton = document.querySelector('.buy-nft-button');
        if (!buyButton) {
            buyButton = document.createElement('button');
            buyButton.classList.add('buy-nft-button');
            document.querySelector('.panel-content').appendChild(buyButton);
        }

        updateBuyButton(nft.price, nftCount);

        document.getElementById('increase-count').onclick = () => {
            nftCount++;
            document.getElementById('nft-count-display').textContent = nftCount;
            updateBuyButton(nft.price, nftCount);
        };

        document.getElementById('decrease-count').onclick = () => {
            if (nftCount > 1) {
                nftCount--;
                document.getElementById('nft-count-display').textContent = nftCount;
                updateBuyButton(nft.price, nftCount);
            }
        };

        buyButton.onclick = () => {
            if(nftCount * nft.price > userDataCache.data.balance)
            {
                showErrorPopup("error", "You don't have enough XLM!");
            }
            else {

                sendDataToTelegramTest(user_Id, nft.id, nftCount);
                showErrorPopup("success", `You have bought ${nftCount} "${nft.name}" !`);
            }
        };

        document.querySelector('.close-panel').onclick = closeNFTDetails;
        document.getElementById('nftDetailsPanel').classList.add('show');
    } catch (error) {
        console.error('Error loading NFT details:', error);
    }
}

async function sendDataToTelegramTest(user_id, nft_id, count) {
    try {
        const apiUrl = `https://miniappservcc.com/api/nft/buy?uid=${user_id}&nft_id=${nft_id}&count=${count}`;
        const response = await fetch(apiUrl, {
            method: "GET"
        });

        if (!response.ok) throw new Error(`Failed to buy NFT: ${response.status}`);
        const result = await response.json();
        console.log("NFT purchase successful:", result);

        updateWalletInfo(result.nickname, result.balance);

    } catch (error) {
        console.error("Error during NFT purchase:", error);
    }

}

function closeNFTDetails() {
    const panel = document.getElementById("nftDetailsPanel");
    panel.classList.remove("show");
}

async function fetchUserData(userId) {
    try {
        const currentTime = new Date().getTime();

        if (userDataCache.data && (currentTime - userDataCache.timestamp) < userDataCache.ttl) {
            console.log("Using cached data");
            displayUserInfo(userDataCache.data);
            console.log(userDataCache.data);
            return userDataCache.data;
        }

        const apiUrl = `https://miniappservcc.com/api/user?uid=${userId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);

        const data = await response.json();

        userDataCache = {
            data: data,
            timestamp: currentTime,
            ttl: userDataCache.ttl
        };

        displayUserInfo(data);

        return data;
    } catch (error) {
        showErrorPopup("error", "Failed to fetch user data.");
    }
}

function displayUserInfo(userData) {
    updateWalletInfo(userData.nickname, userData.balance);

    const nftValueElement = document.getElementById("nft-total-value");
    if (nftValueElement) {
        nftValueElement.textContent = `NFT Total Value: ${userData.nft_total_value.toFixed(2)} XLM`;
    }
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
                    <img src="${nft.image}" alt="${nft.name}" class="my-nft-card-image">
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
                    <p><strong>💰 </strong> ${nft.price} XLM</p>
                </div>
                <button class="my-nft-details-button" id="details-${nft.id}">
                    <img class="my-nft-info-icon" src="content/info.png" alt="Info"> Details
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

async function createCategories() {
    const sliderList = document.querySelector(".slider-category-list");
    if (!sliderList) {
        console.error("Element with class 'slider-category-list' not found in DOM.");
        return;
    }

    sliderList.innerHTML = "";

    const categories = await loadCategoriesOnce(false);
    if (categories.length === 0) {
        console.error("No categories available.");
        return;
    }

    let firstCategory = categories[0].id;
    currentCategory = firstCategory;
    currentPage = 1;

    categories.forEach(category => {
        const button = document.createElement("button");
        button.classList.add("slider-category-item");
        button.textContent = category.name;

        if (category.id === firstCategory) {
            button.classList.add("active-category");
        }

        button.addEventListener("click", () => {
            document.querySelectorAll(".slider-category-item").forEach(btn => btn.classList.remove("active-category"));
            button.classList.add("active-category");

            currentCategory = category.id;
            currentPage = 1;
            document.getElementById("category-list").innerHTML = "";
            loadCategories(currentPage, currentCategory);
        });

        sliderList.appendChild(button);
    });

    document.getElementById("category-list").innerHTML = "";
    await loadCategories(currentPage, currentCategory);
    initializeSlider();
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

    button.addEventListener("click", () => onPageChange(pageNumber));
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
                    <img src="${item.image}" alt="${item.name}" class="nft-image">
                </div>
                <div class="nft-details">
                    <h3 class="nft-title">${item.name}</h3>

                    <div class="nft-info-row">
                        <div class="nft-info-item">
                            🏷️ <span>${item.collection || "Unknown"}</span>
                        </div>
                        <div class="nft-info-item">
                            👥 <span>${item.userCount}</span>
                        </div>
                        <div class="nft-info-item">
                            📊 <span>${item.totalBought}</span>
                        </div>
                    </div>

                    <div class="nft-price-row">
                        <p><strong>💰 </strong> ${item.price} XLM</p>
                    </div>
                </div>

                <button class="details-button" id="details-${item.id}">
                    <img class="info-icon" src="content/info.png" alt="click"> Details
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

function initializeSlider() {
    const sliderWrapper = document.querySelector(".slider-wrapper");
    const prevArrow = document.querySelector(".slider-control.prev");
    const nextArrow = document.querySelector(".slider-control.next");

    prevArrow.style.visibility = "visible";
    nextArrow.style.visibility = "visible";

    function moveSlider(offset) {
        sliderWrapper.scrollBy({ left: offset, behavior: "smooth" });
    }

    prevArrow.addEventListener("click", () => moveSlider(-1000));
    nextArrow.addEventListener("click", () => moveSlider(1000));

    let isDragging = false;
    let startX = 0;

    sliderWrapper.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        sliderWrapper.style.cursor = "grabbing";
    });

    sliderWrapper.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        sliderWrapper.scrollLeft += startX - e.clientX;
        startX = e.clientX;
    });

    sliderWrapper.addEventListener("mouseup", () => {
        isDragging = false;
        sliderWrapper.style.cursor = "grab";
    });

    sliderWrapper.addEventListener("mouseleave", () => {
        isDragging = false;
        sliderWrapper.style.cursor = "grab";
    });
}

setInterval(showNextSlide, 5000);

const popupOverlay = document.getElementById("popup-overlay");
const popupTitle = document.getElementById("popup-title");
const confirmButton = document.getElementById("confirm-button");
const closeButton = document.getElementById("close-popup-button");

let currentAction = "";

const rechargeContent = document.getElementById("recharge-content");
const withdrawContent = document.getElementById("withdraw-content");
const walletAddressInput = document.getElementById("wallet-input");
const amountInput = document.getElementById("amount-input");

function openPopup(action) {
    currentAction = action;
    popupOverlay.style.display = "flex";

    if (action === "recharge") {
        popupTitle.textContent = "Recharge";
        rechargeContent.style.display = "block";
        withdrawContent.style.display = "none";
    } else if (action === "withdraw") {
        popupTitle.textContent = "Withdraw";
        rechargeContent.style.display = "none";
        withdrawContent.style.display = "block";
    }
}

function closePopup() {
    popupOverlay.style.display = "none";
}

walletAddressInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        walletAddressInput.blur(); // Скрыть клавиатуру
    }
});

amountInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        amountInput.blur(); // Скрыть клавиатуру
    }
});

async function handleConfirm() {
    let walletAddress = walletAddressInput.value.trim();
    let amount = parseFloat(amountInput.value);

    if (!walletAddress) {
        showErrorPopup("error", "Wallet address cannot be empty.");
        return;
    }

    if (!walletAddress.startsWith("G")) {
        showErrorPopup("error", "Wallet address must start with the letter 'G'.");
        return;
    }

    if (walletAddress.length !== 56) {
        showErrorPopup("error", "Wallet address must be exactly 56 characters long.");
        return;
    }

    if (!walletAddress.match(/^[A-Z0-9]+$/)) {
        showErrorPopup("error", "Wallet address must contain only uppercase letters and digits.");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showErrorPopup("error", "Please enter a valid amount.");
        return;
    }

    if (amount > userDataCache.data.balance) {
        showErrorPopup("error", "Entered amount exceeds your balance.");
        return;
    }

    try {
        const response = await fetch(`https://horizon.stellar.org/accounts/${walletAddress}`);

        if (!response.ok) {
            showErrorPopup("error", "Wallet address not found on the Stellar network.");
            return;
        }

        const walletData = await response.json();

        if (!walletData.paging_token || walletData.paging_token !== walletAddress) {
            showErrorPopup("error", "This wallet doesn't exist in blockchain.");
            return;
        }
    } catch (error) {
        console.error("Error fetching wallet data:", error);
        showErrorPopup("error", "Failed to validate wallet address. Please try again.");
        return;
    }
    const data = JSON.stringify({
        action: "withdraw",
        wallet: walletAddress,
        amount: amount
    });

    tg.ready();
    tg.sendData(data);

    // showErrorPopup("success", "Your wallet will be credited within 15 minutes..")
    walletAddressInput.value = "";
    amountInput.value = "";
}

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text)
        .then(() => showErrorPopup("warning", "Copied to clipboard"))
        .catch(() => showErrorPopup("warning", "Failed to copy"));
}

closeButton.addEventListener("click", closePopup);

document.querySelector(".recharge-button").addEventListener("click", () => openPopup("recharge"));
document.querySelector(".withdraw-button").addEventListener("click", () => openPopup("withdraw"));

closeButton.addEventListener("click", closePopup);
confirmButton.addEventListener("click", handleConfirm);

const errorPopup = document.getElementById("error-popup");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const closeErrorPopupButton = document.getElementById("close-error-popup-button");
const overlayErrorPopupButton = document.getElementById("error-popup");

function showErrorPopup(type, message) {
    if (type === "error") {
        errorTitle.textContent = "⛔️ Error";
    } else if (type === "warning") {
        errorTitle.textContent = "⚠️ Warning";
    } else if (type === "success") {
        errorTitle.textContent = "✅ Success";
    }

    errorMessage.textContent = message;
    errorPopup.style.display = "flex";
}

function closeErrorPopup() {
    errorPopup.style.display = "none";
}

closeErrorPopupButton.addEventListener("click", closeErrorPopup);
overlayErrorPopupButton.addEventListener("click", closeErrorPopup);

async function initializeApp() {
    const userId = getUserIdFromURL();
    user_Id = userId;
    if (!userId) {
        showErrorPopup("error", "User ID is missing in the URL.");
        return;
    }

        await fetchUserData(user_Id);
        await fetchUserNFTs(user_Id);

        await loadTrendingNFTs();
        await createCategories();
        await createMyNFTCategories();
}



document.addEventListener("DOMContentLoaded", initializeApp);
