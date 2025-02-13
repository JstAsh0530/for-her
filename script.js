let socket = null;

const originalContent = [
  "> INITIALIZING LOVE.EXE...",
  "> SYSTEM READY",
  "> LOADING VALENTINE'S MESSAGE...",
  "",
  "Hello baby",
  "",
  "I am not sure if you were even expecting this,",
  "but here I am, I just wanted to say something...",
  "It's just I wanted to say sorry for all the time I mess up",
  "and yes, I know I annoy you only sometimes,",
  "or probably more than ‘sometimes’ but yk what I mean...",
  "but even after 2 years, 6 months, and 5 days,",
  "you're still here. still putting up with me.",
  "and I'm SO glad you are.",
  "",
  "I love you. like, A LOT.",
  "more than I love gaming. more than I love even my PC.",
  "and that's saying something.",
  "",
  "speaking of gaming... don't think i forgot",
  "YOU STILL OWE ME AN ELDEN RING SESSION.",
  "Well not technically owe but still..",
  "a deal is a deal ;3",
  "",
  "I can't wait till we finally meet baby.",
  "gonna hug you so hard you might suffocate lol.",
  "one day, i wanna make a home with you.",
  "a place where it's just us, forever.",
  "",
  "oh btw, hope you would like to also play CODM with me.",
  "yk, if just in case your ‘phone’ happens to support it somehow :pp",
  "",
  "That's all I wanted to say, but my last question,",
  "andd... be honest.",
  "<span class=\"glitch\">Will you be my Valentine? ❤️</span>"
];

class TypeWriter {
  constructor(content, element, savedState = null) {
    this.lines = content;
    this.element = element;

    this.typedLines = [];
    this.currentLine = "";
    this.currentLineIndex = 0;
    this.currentCharIndex = 0;
    this.isError = false;
    this.isFinished = false;

    this.inputElement = null;

    if (savedState) {
      this.restoreState(savedState);
    }
  }

  restoreState(state) {
    this.typedLines = state.typedLines || [];
    this.currentLine = state.currentLine || "";
    this.currentLineIndex = state.currentLineIndex || 0;
    this.currentCharIndex = state.currentCharIndex || 0;
    this.isError = false;
    this.isFinished = state.isFinished || false;
    if (this.isFinished) {
      this.updateOutput();
      this.addUserInputBox();
    }
  }

  saveState() {
    const state = {
      typedLines: this.typedLines,
      currentLine: this.currentLine,
      currentLineIndex: this.currentLineIndex,
      currentCharIndex: this.currentCharIndex,
      isFinished: this.isFinished
    };
    localStorage.setItem("terminalState", JSON.stringify(state));
  }

  start() {
    if (this.isFinished) return;
    this.typeLine();
  }

  typeLine() {
    if (this.currentLineIndex >= this.lines.length) {
      this.finish();
      return;
    }
    this.typeCharacter();
  }

  typeCharacter() {
    const line = this.lines[this.currentLineIndex] || "";

    if (this.currentCharIndex >= line.length) {
      this.typedLines.push(this.currentLine);
      this.currentLine = "";
      this.currentCharIndex = 0;
      this.currentLineIndex++;

      this.updateOutput();
      setTimeout(() => this.typeLine(), 300);
      return;
    }

    const char = line[this.currentCharIndex];
    this.currentCharIndex++;

    if (!this.isError && Math.random() < 0.04) {
      this.isError = true;
      this.currentLine += `<span class="error">${char}</span>`;
      this.updateOutput();

      setTimeout(() => {
        const errorSpan = `<span class="error">${char}</span>`;
        this.currentLine = this.currentLine.slice(0, -errorSpan.length);
        this.currentLine += char;
        this.isError = false;
        this.updateOutput();

        setTimeout(() => this.typeCharacter(), this.getRandomSpeed());
      }, 200);
    } else {
      this.currentLine += char;
      this.updateOutput();
      setTimeout(() => this.typeCharacter(), this.getRandomSpeed());
    }
  }

  updateOutput() {
    const text =
      this.typedLines.join("<br>") +
      (this.typedLines.length ? "<br>" : "") +
      this.currentLine;

    this.element.innerHTML = text;

    if (this.inputElement) {
      this.element.appendChild(this.inputElement);
    }

    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.element.scrollTop = this.element.scrollHeight;
          });
        });
      });
    }, 30);

    this.saveState();
  }

  finish() {
    this.isFinished = true;
    this.updateOutput();
    this.addUserInputBox();
  }

  addUserInputBox() {
    if (this.inputElement) return;

    this.inputElement = document.createElement("input");
    this.inputElement.type = "text";
    this.inputElement.className = "terminal-input";
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      this.inputElement.placeholder = "Tap to type your response...";
    } else {
      this.inputElement.placeholder = "Type your response and press Enter...";
    }
    this.element.appendChild(this.inputElement);
    this.inputElement.focus();

    let typingTimer = null;
    this.inputElement.addEventListener("input", () => {
      socket.emit("typing", true);
      if (typingTimer) clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        socket.emit("typing", false);
      }, 1500);
    });

    this.inputElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const userText = this.inputElement.value.trim();
        if (userText) {
          this.typedLines.push("> " + userText);
          this.inputElement.value = "";
          this.updateOutput();
          socket.emit("userMessage", userText);
          socket.emit("typing", false);
        }
      }
    });
  }

  getRandomSpeed() {
    return 30 + Math.random() * 100;
  }
}

function setupSocketListeners(writerInstance) {
  socket.on("serverTyping", (isTyping) => {
    if (isTyping) {
      const typingHTML = "<span class='server-typing-line'>Ash is typing...</span>";
      const lastLine = writerInstance.typedLines[writerInstance.typedLines.length - 1];
      if (lastLine !== typingHTML) {
        writerInstance.typedLines.push(typingHTML);
        writerInstance.updateOutput();
      }
    } else {
      const typingHTML = "<span class='server-typing-line'>Ash is typing...</span>";
      const idx = writerInstance.typedLines.indexOf(typingHTML);
      if (idx !== -1) {
        writerInstance.typedLines.splice(idx, 1);
        writerInstance.updateOutput();
      }
    }
  });

  socket.on("serverMessage", (msg) => {
    const idx = writerInstance.typedLines.indexOf("Ash is typing...");
    if (idx !== -1) {
      writerInstance.typedLines.splice(idx, 1);
    }
    writerInstance.typedLines.push("Ash: " + msg);
    writerInstance.updateOutput();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("boot-screen").style.display = "none";

    let savedState = null;
    const stored = localStorage.getItem("terminalState");
    if (stored) {
      try { 
        savedState = JSON.parse(stored); 
      } catch(e) {}
    }

    const writer = new TypeWriter(
      originalContent,
      document.getElementById("terminal-content"),
      savedState
    );
    writer.start();

    socket = io();
    setupSocketListeners(writer);
  }, 3000);
});