import {showErrorPopup} from "./PopupLogic.js";

export function showSuccessPopup(message = "Success!") {
    const toast = document.getElementById("toast-notification");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

export function disableScroll() {
    document.getElementById("container").classList.add('no-scroll');
}

export function enableScroll() {
    document.getElementById("container").classList.remove('no-scroll');
}

async function showLoader() {
    document.getElementById("loading-panel").classList.remove("hidden");
    disableScroll();
}

async function hideLoader() {
    document.getElementById("loading-panel").classList.add("hidden");
    enableScroll();
}

const scrollToTopButton = document.getElementById('scrollToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopButton.style.display = 'flex';
    } else {
        scrollToTopButton.style.display = 'none';
    }
});

scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
});

export function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}

window.copyToClipboard = function(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID "${elementId}" not found.`);
        return;
    }

    const text = element.textContent.trim();

    if (text.length === 0) {
        showErrorPopup("warning", "Nothing to copy!");
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => showErrorPopup("success", "Copied to clipboard"))
        .catch((err) => {
            console.error("Failed to copy text: ", err);
            showErrorPopup("error", "Failed to copy text. Please try again.");
        });
}