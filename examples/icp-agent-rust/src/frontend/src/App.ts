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

  constructor() {
    this.chatBox = document.querySelector(".msger-chat")!;
    this.form = document.querySelector(".msger-inputarea")!;

    this.form.addEventListener("submit", this.#handleSubmit);

    this.chat = [{
        role: { system: null },
        content: "I'm a sovereign AI agent living on the Internet Computer. Ask me anything.",
      }
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
    let img = "user" in message.role ? PERSON_IMG : BOT_IMG;
    let name = "user" in message.role ? "User" : "System";
    let text = message.content;

    const msgHTML = `
<div class="msg ${side}-msg">
  <div class="msg-img" style="background-image: url(${img})"></div>

  <div class="msg-bubble">
    <div class="msg-info">
      <div class="msg-info-name">${name}</div>
      <div class="msg-info-time">${this.formatDate(new Date())}</div>
    </div>

    <div class="msg-text">${text}</div>
  </div>
</div>
`;

    this.chatBox.insertAdjacentHTML("beforeend", msgHTML);
    this.chatBox.scrollTop += 500;
  }

  askAgent= async () => {
    console.log("asking agent");
    const response = await agent_backend.chat(this.chat.slice(1));
    console.log(response);

    this.chat.push({
      role: { system: null },
      content: response,
    });

    this.#render();
  }

  #handleSubmit = async (e: Event) => {
    e.preventDefault();
    const msgerInput = document.querySelector(".msger-input")! as HTMLInputElement;

    const msgText = msgerInput.value;
    if (!msgText) return;

    this.chat.push({
      role: { user: null },
      content: msgText,
    });
    msgerInput.value = "";

    this.#render();

    this.askAgent();
  };

  #render() {
    this.clearMessages();
    this.chat.forEach((message) => this.appendMessage(message));
  }
}

export default App;
