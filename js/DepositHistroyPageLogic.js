import { user_Id } from "./index.js";

export async function showDepositHistoryPage() {
    const section = document.getElementById("deposit-history-page");
    const container = document.getElementById("deposit-history-list");

    section.style.display = "block";
    container.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`https://miniappservcc.com/api/user/deposit_history?uid=${user_Id}`);
        const data = await res.json();

        if (!data.length) {
            container.innerHTML = "<p>No deposit activity.</p>";
            return;
        }

        const totalAmount = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const totalHTML = `
            <div class="deposit-total">
                <strong>Total Deposited:</strong> $${totalAmount.toFixed(2)} 
                <img src="/content/xml-icon.png" class="deposit-history-price-icon" />
            </div>
        `;

        const itemsHTML = data.map(item => {
            const date = new Date(item.created_at).toLocaleString("en-US", {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            return `
                <div class="deposit-history-item">
                    <div class="deposit-history-info">
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Amount:</strong> $${Number(item.amount).toFixed(2)}
                    <img src="/content/xml-icon.png" class="deposit-history-price-icon" /></p>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = totalHTML + itemsHTML;
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading history.</p>";
    }
}

function goDepositHistoryBack() {
    document.getElementById("deposit-history-page").style.display = "none";
}

window.goDepositHistoryBack = goDepositHistoryBack;
