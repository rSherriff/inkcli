const Story = require("inkjs").Story;
const fs = require("fs");
const readline = require("readline");
const EventEmitter = require("events");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

var filePath = process.argv[2];

if (typeof filePath === "undefined" || filePath.slice(-4) !== "json") {
  console.log("Please provide an ink JSON file...");
  process.exit();
}

var inkFile = JSON.parse(fs.readFileSync(filePath, "UTF-8").replace(/^\uFEFF/, ""));

if (typeof inkFile.inkVersion === "undefined") {
  console.log("This JSON file is not supported...");
  process.exit();
}

var myStory = new Story(inkFile);
class ChoiceEmitter extends EventEmitter {}
const choiceEmitter = new ChoiceEmitter();

choiceEmitter.on("choice", (choice) => {
  if (typeof choice === "string") {
    choice = choice.toLowerCase().split(" ");

    if (choice[0] === "quit") {
      process.exit();
    } else if (choice[0] === "save") {
      save(choice[1]);
      return;
    }
    choice = parseInt(choice) - 1;
    if (typeof choice === "number" && choice < myStory.currentChoices.length) {
      myStory.ChooseChoiceIndex(choice);
      continueStory();
    } else {
      printChoices();
      waitForChoice();
    }
  }
});

continueStory();

function continueStory() {
  if (!myStory.canContinue && myStory.currentChoices.length === 0) end();

  while (myStory.canContinue) {
    console.log(myStory.Continue());
  }

  printChoices();
  waitForChoice();
}

function printChoices() {
  if (myStory.currentChoices.length > 0) {
    for (var i = 0; i < myStory.currentChoices.length; ++i) {
      console.log(i + 1 + ". " + myStory.currentChoices[i].text);
    }
  } else {
    end();
  }
}

function waitForChoice() {
  return new Promise((resolve) =>
    rl.question(">", (choice) => {
      resolve(choice);
      choiceEmitter.emit("choice", choice);
    })
  );
}

function end() {
  console.log("THE END");
  rl.close();
  process.exit();
}

function save(path) {
  if (path.slice(-5) !== ".json") {
    path += ".json";
  }
  fs.writeFile(path, myStory.ToJson(), function (err) {
    if (err) {
      console.log("Failed to save, check file path");
    } else {
      console.log("Saved Game...");
    }
  });
}
