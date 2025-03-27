import {enableScroll} from "./Utilities.js";

const errorPopup = document.getElementById("error-popup");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const closeErrorPopupButton = document.getElementById("close-error-popup-button");
const overlayErrorPopupButton = document.getElementById("error-popup");

closeErrorPopupButton.addEventListener("click", closeErrorPopup);
overlayErrorPopupButton.addEventListener("click", closeErrorPopup);

export function showErrorPopup(type, message) {
    if (type === "error") {
        errorTitle.textContent = "⛔️ Error";
    } else if (type === "warning") {
        errorTitle.textContent = "⚠️ Warning";
    } else if (type === "success") {
        errorTitle.textContent = "✅ Success";
    }

    errorMessage.innerHTML = message;
    errorPopup.style.display = "flex";
}

export function closeErrorPopup() {
    errorPopup.style.display = "none";
    enableScroll();
}
