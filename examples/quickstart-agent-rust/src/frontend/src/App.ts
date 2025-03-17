import { agent_backend } from "../../declarations/agent-backend";
import { chat_message } from "../../declarations/agent-backend/agent-backend.did";
import botImg from "./bot.svg";
import userImg from "./user.svg";

const PERSON_IMG = userImg;
const BOT_IMG = botImg;

class App {
  chat: chat_message[] = [];
  chatBox: HTMLElement;
  form: HTMLFormElement;
  themeButton: HTMLButtonElement | null;
  chatInput: HTMLElement | null;
  isDarkTheme: boolean = true;

  constructor() {
    this.chatBox = document.querySelector(".msger-chat")!;
    this.form = document.querySelector(".msger-inputarea")!;
    this.themeButton = document.querySelector(".theme-button");
    this.chatInput = document.querySelector(".chat-input");

    // Set up event listeners
    this.form.addEventListener("submit", this.#handleSubmit);

    if (this.themeButton) {
      this.themeButton.addEventListener("click", this.#toggleTheme);
    }

    if (this.chatInput) {
      const input = this.chatInput.querySelector(".msger-input");
      if (input) {
        input.addEventListener("click", () => {
          if (input.textContent === "Ask anything…") {
            input.textContent = "";
            input.setAttribute("contenteditable", "true");
            (input as HTMLElement).focus();
          }
        });

        input.addEventListener("keydown", (e: Event) => {
          const keyEvent = e as KeyboardEvent;
          if (keyEvent.key === "Enter" && !keyEvent.shiftKey) {
            e.preventDefault();
            this.#handleSubmit(e);
          }
        });
      }
    }

    this.chat = [
      {
        role: { assistant: null },
        content:
          "I'm a sovereign AI agent living on the Internet Computer. Ask me anything.",
      },
    ];

    this.#render();
  }

  formatDate(date: Date) {
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();

    return `${h.slice(-2)}:${m.slice(-2)}`;
  }

  clearMessages() {
    this.chatBox.innerHTML = "";
  }

  // Appends a message to the chat box.
  appendMessage(message: chat_message) {
    let side = "user" in message.role ? "right" : "left";
    let text = message.content;

    // Special handling for "Thinking..." message
    if ("assistant" in message.role && message.content === "Thinking...") {
      const thinkingHTML = `
        <div class="thinking-msg">
          <div class="thinking-animation">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 187.3 93.7" width="100%" height="100%">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFB1C5" />
              <stop offset="100%" stop-color="#785DF6" />
            </linearGradient>
          </defs>
            <path class="track" fill="none" stroke="" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="10" stroke-width="8" d="M93.9 46.4c9.3 9.5 13.8 17.9 23.5 17.9s17.5-7.8 17.5-17.5-7.8-17.6-17.5-17.5c-9.7.1-13.3 7.2-22.1 17.1-8.9 8.8-15.7 17.9-25.4 17.9s-17.5-7.8-17.5-17.5 7.8-17.5 17.5-17.5 16.3 9.3 24 17.1z"/>
            <path class="outline" fill="none" stroke="url(#gradient)" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="10" stroke-width="8" d="M93.9 46.4c9.3 9.5 13.8 17.9 23.5 17.9s17.5-7.8 17.5-17.5-7.8-17.6-17.5-17.5c-9.7.1-13.3 7.2-22.1 17.1-8.9 8.8-15.7 17.9-25.4 17.9s-17.5-7.8-17.5-17.5 7.8-17.5 17.5-17.5 16.3 9.3 24 17.1z"/>     
        </svg>
          </div>
          <span>Thinking…</span>
        </div>
      `;
      this.chatBox.insertAdjacentHTML("beforeend", thinkingHTML);
    } else {
      const msgHTML = `
        <div class="msg ${side}-msg">
          <div class="msg-bubble">
            <div class="msg-text">${text}</div>
          </div>
        </div>
      `;
      this.chatBox.insertAdjacentHTML("beforeend", msgHTML);
    }

    this.scrollToBottom();
  }

  scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  askAgent = async () => {
    // Remove first and last message from chat array
    // The first one is the dummy system prompt. The last one is the
    // "thinking..." message.
    const messages = this.chat.slice(1, -1);

    try {
      console.log("Sending the following messages to the backend:");
      console.log(messages);
      const response = await agent_backend.chat(messages);
      console.log(response);
      // Remove the "thinking message" from the chat.
      this.chat.pop();

      // Add the agent's response.
      this.chat.push({
        role: { assistant: null },
        content: response,
      });
    } catch (e) {
      console.log(e);
      const eStr = String(e);

      const match = eStr.match(/(SysTransient|CanisterReject), \\+"([^\\"]+)/);
      if (match) {
        // Show the error in an alert.
        alert(match[2]);
      }

      // Remove the "thinking message" from the chat.
      this.chat.pop();
    }

    // Re-enable the send button.
    const sendButton = document.querySelector(
      ".msger-send-btn"
    )! as HTMLButtonElement;
    sendButton.disabled = false;

    this.#render();
  };

  #handleSubmit = async (e: Event) => {
    e.preventDefault();

    let msgText = "";
    const inputElement = this.chatInput?.querySelector(".msger-input");

    if (
      inputElement &&
      inputElement.textContent &&
      inputElement.textContent !== "Ask anything…"
    ) {
      msgText = inputElement.textContent.trim();
      // Reset input
      inputElement.textContent = "Ask anything…";
      inputElement.removeAttribute("contenteditable");
    } else {
      // Fallback to traditional input if contenteditable isn't used
      const msgerInput = document.querySelector(
        ".msger-input"
      ) as HTMLInputElement;

      if (msgerInput.value) {
        msgText = msgerInput.value;
        msgerInput.value = "";
      } else if (
        msgerInput.textContent &&
        msgerInput.textContent !== "Ask anything…"
      ) {
        msgText = msgerInput.textContent.trim();
        msgerInput.textContent = "Ask anything…";
      }
    }

    if (!msgText) return;

    this.chat.push({
      role: { user: null },
      content: msgText,
    });

    // Add user message to chat and show "thinking..." while waiting for response.
    this.chat.push({
      role: { assistant: null },
      content: "Thinking...",
    });

    // Disable the send button.
    const sendButton = document.querySelector(
      ".msger-send-btn"
    )! as HTMLButtonElement;
    sendButton.disabled = true;

    this.#render();

    this.askAgent();
  };

  #toggleTheme = () => {
    this.isDarkTheme = !this.isDarkTheme;

    // Toggle body class
    document.body.classList.toggle("light-theme");

    // Update button icon
    if (this.themeButton) {
      if (this.isDarkTheme) {
        this.themeButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.75 1V4H11.25V1H12.75ZM12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5ZM12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM20 12.75H23V11.25H20V12.75ZM3.69129 19.2479L5.81261 17.1266L6.87327 18.1873L4.75195 20.3086L3.69129 19.2479ZM17.1256 18.1874L19.247 20.3087L20.3076 19.248L18.1863 17.1267L17.1256 18.1874ZM12.75 20V23H11.25V20H12.75ZM1 12.75H4V11.25H1V12.75ZM17.1268 5.81287L19.2482 3.69155L20.3088 4.75221L18.1875 6.87354L17.1268 5.81287ZM3.69107 4.75135L5.81239 6.87267L6.87305 5.81201L4.75173 3.69069L3.69107 4.75135Z" fill="white" fill-opacity="0.9"/>
        </svg>
        `;
      } else {
        this.themeButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="path-1-inside-1_839_3740" fill="white">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.9146 13.3128C20.5585 14.3701 18.8528 14.9999 17 14.9999C12.5817 14.9999 9 11.4182 9 6.99992C9 5.14719 9.62981 3.44156 10.687 2.08545C5.78465 2.72838 2 6.92222 2 12C2 17.5229 6.47715 22 12 22C17.0779 22 21.2718 18.2153 21.9146 13.3128Z"/>
        </mask>
        <path d="M21.9146 13.3128L23.4019 13.5078L23.8775 9.8805L20.9923 12.1298L21.9146 13.3128ZM10.687 2.08545L11.87 3.00769L14.1193 0.122471L10.492 0.598185L10.687 2.08545ZM20.9923 12.1298C19.8904 12.9889 18.507 13.4999 17 13.4999V16.4999C19.1986 16.4999 21.2266 15.7512 22.8369 14.4958L20.9923 12.1298ZM17 13.4999C13.4101 13.4999 10.5 10.5898 10.5 6.99992H7.5C7.5 12.2466 11.7533 16.4999 17 16.4999V13.4999ZM10.5 6.99992C10.5 5.493 11.011 4.10963 11.87 3.00769L9.50402 1.16321C8.24867 2.77349 7.5 4.80138 7.5 6.99992H10.5ZM3.5 12C3.5 7.68508 6.71655 4.11901 10.8821 3.57271L10.492 0.598185C4.85275 1.33776 0.5 6.15937 0.5 12H3.5ZM12 20.5C7.30558 20.5 3.5 16.6944 3.5 12H0.5C0.5 18.3513 5.64873 23.5 12 23.5V20.5ZM20.4273 13.1178C19.8811 17.2834 16.315 20.5 12 20.5V23.5C17.8407 23.5 22.6624 19.1472 23.4019 13.5078L20.4273 13.1178Z" fill="black" fill-opacity="0.9" mask="url(#path-1-inside-1_839_3740)"/>
        </svg>`;
      }
    }
  };

  #render() {
    this.clearMessages();
    this.chat.forEach((message) => this.appendMessage(message));
  }
}

export default App;
