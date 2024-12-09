// Get elements
const chatIcon = document.getElementById("chat-icon");
const chatPopup = document.getElementById("chat-popup");
const closeChatBtn = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-btn");
const chatBody = document.getElementById("chat-body");
const chatInput = document.getElementById("chat-input");

// Create an error message element
const errorMessage = document.getElementById("error-message");

chatPopup.style.display = "none";
const messages = [
  {
    sender: "bot",
    text: "Hi there! I’m your assistant. How can I help you today?",
  },
];

// generate user id
function generateObjectId() {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const randomHex = [...Array(16)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
  return timestamp + randomHex;
}

// Generate or retrieve user ID
function getUserId() {
  const storedUserId = localStorage.getItem("chat_user_id");
  if (storedUserId) {
    return storedUserId;
  } else {
    const newUserId = generateObjectId();
    localStorage.setItem("chat_user_id", newUserId);
    return newUserId;
  }
}

const userId = getUserId();

function displayMessages() {
  chatBody.innerHTML = "";
  messages.forEach((message) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    if (message.sender === "user") {
      messageDiv.classList.add("user-message");
    } else {
      messageDiv.classList.add("bot-message");
    }
    messageDiv.textContent = message.text;
    chatBody.appendChild(messageDiv);
  });
  chatBody.scrollTop = chatBody.scrollHeight;
}

async function getBotResponse(userMessage) {
  // const assistantId = "asst_xKYFUqasy2eQSlsCNusBHSTO";
  const apiUrl = "http://127.0.0.1:8787/assistant/ask";
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, message: userMessage }),
    });

    const { message } = await response.json();
    return message || "I'm sorry, I couldn't process your message.";
  } catch (error) {
    console.error("Error fetching bot response:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}

chatIcon.addEventListener("click", function () {
  chatPopup.style.display = "flex";
  displayMessages();
});

closeChatBtn.addEventListener("click", function () {
  chatPopup.style.display = "none";
});

sendBtn.addEventListener("click", async function () {
  const messageText = chatInput.value.trim();

  if (messageText !== "") {
    sendBtn.disabled = true;
    errorMessage.style.display = "none";
    sendBtn.textContent = "Sending...";
    messages.push({ sender: "user", text: messageText });
    displayMessages();
    const loaderDiv = document.createElement("div");
    loaderDiv.classList.add("bot-message-loader");
    loaderDiv.innerHTML = `<div class="loader"></div>`;
    chatBody.appendChild(loaderDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    const botResponse = await getBotResponse(messageText);
    chatBody.removeChild(loaderDiv);
    messages.push({ sender: "bot", text: botResponse });
    displayMessages();
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    chatInput.value = "";
  } else {
    errorMessage.style.display = "block";
  }
});
