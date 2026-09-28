const USERS_KEY = "roamReverieUsers";
const CURRENT_USER_KEY = "roamReverieCurrentUser";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function makeSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function hashPassword(password, salt) {
  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function showMessage(message, isSuccess = false) {
  const messageElement = document.querySelector("#form-message");
  messageElement.textContent = message;
  messageElement.classList.toggle("success", isSuccess);
}

const signupForm = document.querySelector("#signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(signupForm);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password");
    const confirmation = formData.get("confirm-password");

    if (!signupForm.reportValidity()) return;
    if (password !== confirmation) {
      showMessage("Those passwords do not match. Give it another try.");
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      showMessage("An account with that email already exists. Try logging in.");
      return;
    }

    const salt = makeSalt();
    users.push({ name, email, salt, passwordHash: await hashPassword(password, salt) });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name, email }));
    window.location.href = "index.html?welcome=1";
  });
}

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;

    const formData = new FormData(loginForm);
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password");
    const user = getUsers().find((account) => account.email === email);

    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      showMessage("We couldn't find a matching account and password.");
      return;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: user.name, email: user.email }));
    window.location.href = "index.html?welcome=1";
  });
}

const welcomeMessage = document.querySelector("#welcome-message");
if (welcomeMessage) {
  const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
  if (currentUser) {
    welcomeMessage.textContent = `Hi, ${currentUser.name}`;
    document.querySelector(".account-nav > .nav-login").hidden = true;
    const logoutLink = document.createElement("a");
    logoutLink.className = "nav-login";
    logoutLink.href = "#";
    logoutLink.textContent = "Log out";
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = "index.html";
    });
    welcomeMessage.after(logoutLink);
  }

  if (new URLSearchParams(window.location.search).has("welcome") && currentUser) {
    welcomeMessage.textContent = `Welcome, ${currentUser.name}!`;
  }
}