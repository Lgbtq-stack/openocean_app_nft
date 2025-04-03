import {showErrorPopup} from "./PopupLogic.js";
import {user_Id} from "./index.js";

window.usdBalance = 0;
window.nftBalance = 0;

export async function showCartUserHeader() {
    const response = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);
    if (!response.ok) {
        showErrorPopup("error", "Balance error x1.");
        return;
    }

    const userData = await response.json();

    const header = document.getElementById('cartUserHeader');
    document.getElementById('user-nickname').textContent = `👤${userData.nickname}`;
    document.getElementById('user-balance').innerHTML = `
                <img src="content/money-icon.png" class="price-icon" alt="NFT" />${userData.balance}`;
    document.getElementById('user-bonus').innerHTML = `
                <img src="content/nft_extra.png" class="price-icon" alt="Extra" />${userData.balance_extra}`;
    document.getElementById('user-level').textContent = `📊 ${userData.level}`;
    header.classList.add('show');

    window.usdBalance = userData.balance || 0;
    window.nftBalance = userData.balance_extra || 0;
}

export function hideCartUserHeader() {
    document.getElementById('cartUserHeader').classList.remove('show');
}

export function renderCart() {
    const itemsContainer = document.getElementById("cart-items");
    const items = Cart.getItems();

    itemsContainer.innerHTML = "";

    if (items.length === 0) {
        itemsContainer.innerHTML = "<p class='no-items-cart'>No items.</p>";
        return;
    }

    items.forEach(item => {
        const itemTotalUSD = item.price * item.count;
        const itemTotalNFT = item.count;
        const mode = item.mode || 'buy';

        const div = document.createElement("div");
        div.className = "cart-item";

        console.log(item)
        div.innerHTML = `
        <div class="cart-card">
            <button class="remove-item-btn" onclick="Cart.removeItem(${item.id}); renderCart();">✕</button>
            <div class="cart-card-header">
                <img src="https://miniappservcc.com/get-image?path=${item.image}" class="cart-item-image large" alt="${item.name}" />
                <div class="cart-item-info">
                    <strong class="cart-item-title">${item.name}</strong>
                    <p class="cart-item-collection">${item.collection || "Collection"}</p>
                    <div class="cart-item-controls">
                        <button class="cart-btn" onclick="updateItemCount(${item.id}, -1)">-</button>
                        <span class="cart-item-count">${item.count}</span>
                        <button class="cart-btn" onclick="updateItemCount(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>

            <div class="buy-section ${mode === 'buy' ? '' : 'hidden'}" id="buy-section-${item.id}">
                <div class="currency-toggle">
                    <div class="currency-option ${item.moneyType === 'usd' ? 'selected' : ''}" data-id="${item.id}" data-currency="usd">
                        ${itemTotalUSD.toFixed(2)} <img src="content/money-icon.png" class="price-icon" />
                    </div>
                    <div class="currency-option ${item.moneyType === 'nft' ? 'selected' : ''}" data-id="${item.id}" data-currency="nft">
                        ${itemTotalNFT} <img src="content/nft_extra.png" class="price-icon" />
                    </div>
                </div>
            </div>
        </div>`;

        itemsContainer.appendChild(div);
    });

    const summary = document.createElement("div");
    summary.classList.add("cart-summary");
    summary.innerHTML = `
        <div class="cart-total-row">
          <span class="total-label">Total price:</span>
          <div class="total-values"></div>
        </div>
        <button class="pay-now-btn">Pay Now</button>
    `;
    itemsContainer.appendChild(summary);

    setTimeout(() => {
        document.querySelectorAll(".currency-option").forEach(option => {
            option.addEventListener("click", () => {
                const id = option.dataset.id;
                const currency = option.dataset.currency;

                Cart.updateItemMoneyType(id, currency);

                document.querySelectorAll(`.currency-option[data-id='${id}']`)
                    .forEach(b => b.classList.remove("selected"));
                option.classList.add("selected");

                const btn = document.querySelector(`.buy-now-btn[data-id='${id}']`);
                if (btn) {
                    btn.dataset.currency = currency;
                }

                updateTotalSummary();
            });
        });


        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        document.querySelectorAll('.pay-now-btn').forEach(btn => {
            btn.addEventListener('click', async () => {

                const items = Cart.getItems();
                const usdPurchases = [];
                const nftPurchases = [];

                let totalUsd = 0;
                let totalNft = 0;

                items.forEach(item => {
                    const itemCurrency = item.moneyType || 'usd';

                    if (itemCurrency === "usd") {
                        usdPurchases.push({ id: item.id, count: item.count, price: item.price });
                        totalUsd += item.price * item.count;
                    } else if (itemCurrency === "nft") {
                        nftPurchases.push({ id: item.id, count: item.count });
                        totalNft += item.count;
                    }
                });

                const usdBalance = window.usdBalance || 0;
                const nftBalance = window.nftBalance || 0;

                if (totalUsd > usdBalance) {
                    showErrorPopup("warning","Not enough NFT balance.");
                    return;
                }

                if (totalNft > nftBalance) {
                    showErrorPopup("warning","Not enough FREE NFT balance.");
                    return;
                }

                for (const product of usdPurchases) {

                    await sendDataToTelegramTest(user_Id, product.id, product.count);
                    await delay(600);
                }

                for (const product of nftPurchases) {

                    await sendDataToTelegramExtra(user_Id, product.id, product.count);
                    await delay(600);
                }

                handleSuccessfulPurchase();
            });
        });

        updateTotalSummary();
    }, 0);
}

export async function sendDataToTelegramTest(user_id, nft_id, count) {
    try {
        const apiUrl = `https://miniappservcc.com/api/nft/buy?uid=${user_id}&nft_id=${nft_id}&count=${count}`;
        const response = await fetch(apiUrl, {
            method: "GET"
        });

        if (!response.ok) throw new Error(`Failed to buy NFT: ${response.status}`);
        const result = await response.json();
        console.log("NFT purchase successful:", result);

    } catch (error) {
        console.error("Error during NFT purchase:", error);
    }
}

export async function sendDataToTelegramLimited(user_id, nft_id, count) {
    const apiUrl = `https://miniappservcc.com/api/nft/buyLimited?uid=${user_id}&nft_id=${nft_id}&count=${count}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET"
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "No response body");
            throw new Error(`Failed to buy NFT: ${response.status} – ${errorText}`);
        }

        const result = await response.json();
        console.log("✅ NFT purchase successful:", result);
        return result;

    } catch (error) {
        console.error("❌ Error during NFT purchase:", error);
        throw error;
    }
}


async function sendDataToTelegramExtra(user_id, nft_id, count) {
    try {
        const apiUrl = `https://miniappservcc.com/api/nft/buyEx?uid=${user_id}&nft_id=${nft_id}&count=${count}`;
        const response = await fetch(apiUrl, {
            method: "GET"
        });

        if (!response.ok) throw new Error(`Failed to buy NFT: ${response.status}`);
        const result = await response.json();
        console.log("NFT purchase successful:", result);


    } catch (error) {
        console.error("Error during NFT purchase:", error);
    }
}

function updateTotalSummary() {
    const items = Cart.getItems();
    let totalUSD = 0;
    let totalNFT = 0;

    items.forEach(item => {
        const id = item.id;
        const count = item.count;
        const mode = item.mode || 'buy';

        if (mode === 'buy') {
            const selectedCurrencyBtn = document.querySelector(`.currency-option.selected[data-id='${id}']`);
            const currency = selectedCurrencyBtn?.dataset.currency || 'usd';

            if (currency === 'usd') {
                totalUSD += item.price * count;
            } else if (currency === 'nft') {
                totalNFT += count;
            }
        }

        if (mode === 'rent') {
            const duration = item.duration || 1;
            const rentKey = `rent_price_${duration}m`;
            const rentPrice = item[rentKey] || 0;
            totalUSD += rentPrice * count;
        }
    });

    const totalBlock = document.querySelector(".cart-total-row .total-values");
    totalBlock.innerHTML = '';

    if (totalUSD > 0) {
        totalBlock.innerHTML += `
            <div class="price-block">
                <span class="price">${totalUSD.toFixed(2)}</span>
                <img src="content/money-icon.png" class="price-icon" />
            </div>
        `;
    }

    if (totalNFT > 0) {
        if (totalUSD > 0) totalBlock.innerHTML += `<span class="price-separator">and</span>`;
        totalBlock.innerHTML += `
            <div class="price-block">
                <span class="price">${totalNFT}</span>
                <img src="content/nft_extra.png" class="price-icon" />
            </div>
        `;
    }
}

export const Cart = {
    getItems: function () {
        return JSON.parse(sessionStorage.getItem('cart')) || [];
    },

    saveItems: function (items) {
        sessionStorage.setItem('cart', JSON.stringify(items));
        updateCartIndicator();
    },

    addItem: function (item) {
        const items = this.getItems();
        const existing = items.find(i => i.id === item.id);

        if (!item.moneyType) {
            item.moneyType = 'usd';
        }

        if (existing) {
            existing.count += item.count;
        } else {
            items.push(item);
        }

        this.saveItems(items);
    },

    removeItem: function (itemId) {
        let items = this.getItems().filter(i => i.id !== itemId);
        this.saveItems(items);
    },

    clearCart: function () {
        sessionStorage.removeItem('cart');
        updateCartIndicator();
    },

    getTotalCount: function () {
        return this.getItems().reduce((total, item) => total + item.count, 0);
    },

    updateItemMoneyType: function(id, moneyType) {
        const items = this.getItems();
        const item = items.find(i => i.id === Number(id));
        if (item) {
            item.moneyType = moneyType;
            this.saveItems(items);
        }
    },

    updateItemDuration: function(id, duration) {
        const items = this.getItems();
        const item = items.find(i => i.id === Number(id));
        if (item) {
            item.duration = duration;
            this.saveItems(items);
        }
    }
};

export function updateItemCount(id, change) {
    const items = Cart.getItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    item.count += change;
    if (item.count <= 0) {
        Cart.removeItem(id);
    } else {
        Cart.saveItems(items);
    }

    renderCart();
}

function updateCartIndicator() {
    const indicator = document.querySelector('.cart-count');
    const count = Cart.getTotalCount();
    indicator.textContent = count;

    indicator.style.display = count > 0 ? 'flex' : 'none';
}

function handleSuccessfulPurchase() {
    const purchasedItems = Cart.getItems();
    if (!purchasedItems.length) return;


    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    const section = document.getElementById('purchase-success');
    if (!section) return;

    const container = document.getElementById('purchased-items');
    container.innerHTML = '';

    purchasedItems.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('purchased-item-card');
        card.innerHTML = `
            <img src="https://miniappservcc.com/get-image?path=${item.image}" class="purchased-image-small" alt="${item.name}" />
            <h3 class="purchased-title">${item.name}</h3>
            <p class="purchased-author">by ${item.collection || 'Unknown'}</p>
        `;
        container.appendChild(card);
    });

    section.style.display = 'block';
}

export function completePurchase() {

    Cart.clearCart();
    renderCart();
    setActiveTab(document.querySelector('.nav-item.trending'));
}

export function hideSuccessfulPurchase() {
    const section = document.getElementById('purchase-success');
    if (!section) return;

    section.style.display = 'none';

    const container = document.getElementById('purchased-items');
    if (container) container.innerHTML = '';
}

window.updateItemCount = updateItemCount;
window.Cart = Cart;
window.renderCart = renderCart;
window.completePurchase = completePurchase;

window.handleSuccessfulPurchase = handleSuccessfulPurchase;

document.addEventListener('DOMContentLoaded', updateCartIndicator);

document.querySelectorAll('.rent-now-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const nftId = btn.dataset.id;
        const selectedBtn = document.querySelector(`.rent-duration-btn.selected[data-id="${nftId}"]`);
        const duration = selectedBtn?.dataset.duration;

        const item = Cart.getItems().find(i => String(i.id) === nftId);
        const count = item?.count || 1;

        if (!duration) {
            alert("⏱ Please select duration.");
            return;
        }

        try {
            const url = `https://miniappservcc.com/api/nft/rent?uid=${user_Id}&nft_id=${nftId}&duration=${duration}&count=${count}`;
            const res = await fetch(url);
            const json = await res.json();

            alert("✅ Rent successful!");
            console.log("Rent response:", json);
        } catch (err) {
            console.error("❌ Rent error:", err);
            alert("Failed to rent NFT.");
        }
    });
});

document.querySelectorAll('.rent-duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const nftId = btn.dataset.id;

        document.querySelectorAll(`.rent-duration-btn[data-id="${nftId}"]`)
            .forEach(b => b.classList.remove('selected'));

        btn.classList.add('selected');
    });
});
