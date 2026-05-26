import { createActor, type chat_message } from "./bindings/backend";
import { getCanisterEnv } from "@icp-sdk/core/agent/canister-env";
import botImg from "./bot.svg";
import userImg from "./user.svg";

interface CanisterEnv {
  readonly "PUBLIC_CANISTER_ID:agent-backend": string;
  readonly IC_ROOT_KEY: Uint8Array;
}

const env = getCanisterEnv<CanisterEnv>();
const agent_backend = createActor(env["PUBLIC_CANISTER_ID:agent-backend"], {
  agentOptions: { rootKey: env.IC_ROOT_KEY },
});

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

    this.chat = [
      {
        __kind__: "assistant",
        assistant: {
          content:
            "I'm a sovereign AI agent living on the Internet Computer. Ask me anything.",
          tool_calls: [],
        },
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
    let side = "user" in message ? "right" : "left";
    let img = "user" in message ? PERSON_IMG : BOT_IMG;
    let name = "user" in message ? "User" : "Assistant";
    let text =
      "user" in message
        ? message.user.content
        : "assistant" in message
        ? message.assistant.content
        : "system" in message
        ? message.system.content
        : "tool" in message
        ? message.tool.content
        : "";

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
        __kind__: "assistant",
        assistant: {
          content: response,
          tool_calls: [],
        },
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
    const msgerInput = document.querySelector(
      ".msger-input"
    )! as HTMLInputElement;

    const msgText = msgerInput.value;
    if (!msgText) return;

    this.chat.push({
      __kind__: "user",
      user: {
        content: msgText,
      },
    });
    msgerInput.value = "";

    // Add user message to chat and show "thinking..." while waiting for response.
    this.chat.push({
      __kind__: "assistant",
      assistant: {
        content: "Thinking...",
        tool_calls: [],
      },
    });

    // Disable the send button.
    const sendButton = document.querySelector(
      ".msger-send-btn"
    )! as HTMLButtonElement;
    sendButton.disabled = true;

    this.#render();

    this.askAgent();
  };

  #render() {
    this.clearMessages();
    this.chat.forEach((message) => this.appendMessage(message));
  }
}

export default App;
