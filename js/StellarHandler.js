async function getTokenBalance(accountId, code, issuer) {
    const url = `https://horizon.stellar.org/accounts/${accountId}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.balances) return null;

    const token = data.balances.find(
        b => b.asset_code === code && b.asset_issuer === issuer
    );

    return token?.balance || null;
}

export function startLiquidityCoroutine() {
    const interval = 10000;
    const accountId = 'GD7Q7P4ILEWJKJSJVFIZIRQ5F2PVNNRCVWVOFUWF3NAPYS5NIQ7Z3TIZ';
    const code = "NFT";
    const issuer = "GBBWC7PI3LX4GNQ2AMF3HOHJCTHFWSIADMCB2DZIRNM6IKIVRTXMJTRG";

    const progressBar = document.getElementById('liquidity-progress');
    const balanceDisplay = document.getElementById('nft-balance');
    const timerDisplay = document.getElementById('countdown-seconds');

    let countdown = interval / 1000;
    let currentTimer = countdown;

    async function updateLiquidity() {
        const balance = await getTokenBalance(accountId, code, issuer);
        if (balance !== null) {
            const parsed = parseFloat(balance);
            balanceDisplay.innerHTML = `
                ${Number(parsed).toLocaleString('en-US')}
                <img src="content/money-icon.png" class="liquidity-icon" />
            `;

            const max = 10_000_000;
            const percent = Math.min(((max - parsed) / max) * 100, 100);
            if (progressBar) progressBar.style.width = `${percent}%`;
        } else {
            balanceDisplay.textContent = "N/A";
            if (progressBar) progressBar.style.width = "100%";
        }

        currentTimer = countdown;
        if (timerDisplay) timerDisplay.textContent = currentTimer;
    }


    updateLiquidity();

    setInterval(() => {
        currentTimer -= 1;
        if (timerDisplay) timerDisplay.textContent = currentTimer;

        if (currentTimer <= 0) {
            updateLiquidity();
        }
    }, 1000);
}
