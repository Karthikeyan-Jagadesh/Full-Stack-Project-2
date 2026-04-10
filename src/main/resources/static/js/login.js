const tabs = document.querySelectorAll(".tab-button");
const forms = document.querySelectorAll(".auth-form");
const messageBox = document.getElementById("auth-message");

tabs.forEach((button) => {
    button.addEventListener("click", () => {
        tabs.forEach((tab) => tab.classList.remove("active"));
        forms.forEach((form) => form.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(button.dataset.tabTarget).classList.add("active");
        messageBox.textContent = "";
    });
});

document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await submitAuth("/api/auth/login", Object.fromEntries(formData));
});

document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await submitAuth("/api/auth/register", Object.fromEntries(formData));
});

async function submitAuth(url, payload) {
    messageBox.textContent = "Submitting...";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Request failed.");
        }

        messageBox.textContent = data.message;
        window.location.href = "/dashboard";
    } catch (error) {
        messageBox.textContent = error.message;
    }
}
