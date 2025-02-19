import { agent_backend } from "../../declarations/agent-backend";
import botLogo from "./icp-token.svg";

const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
const BOT_IMG = botLogo;

type ChatMessage = {
  role: "user" | "system";
  content: string;
};

class App {
  chat: ChatMessage[] = [];
  chatBox: HTMLElement;
  form: HTMLFormElement;

  constructor() {
    this.chatBox = document.querySelector(".msger-chat")!;
    this.form = document.querySelector(".msger-inputarea")!;

    this.form.addEventListener("submit", this.#handleSubmit);

    this.chat = [{
        role: "system",
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
  appendMessage(message: ChatMessage) {
    let side = message.role === "user" ? "right" : "left";
    let img = message.role === "user" ? PERSON_IMG : BOT_IMG;
    let name = message.role === "user" ? "User" : "System";
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
    const response = await agent_backend.chat(this.chat[this.chat.length - 1].content);
    console.log(response);

    this.chat.push({
      role: "system",
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
      role: "user",
      content: msgText,
    });
    msgerInput.value = "";

    this.#render();

    this.askAgent();
  };

  #render() {
    this.clearMessages();
    this.chat.forEach((message) => this.appendMessage(message));


    /*let body = html`
      <main>
        <img src="${logo}" alt="DFINITY logo" />
        <br />
        <br />
        <form action="#">
          <label for="name">Enter your name: &nbsp;</label>
          <input id="name" alt="Name" type="text" />
          <button type="submit">Click Me!</button>
        </form>
        <section id="greeting">${this.greeting}</section>
      </main>
    `;
    render(body, document.getElementById('root'));
    document
      .querySelector('form')
      .addEventListener('submit', this.#handleSubmit);*/
  }
}

export default App;
