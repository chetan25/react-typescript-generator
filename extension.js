// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const OpenAi = require("openai");

const { Configuration, OpenAIApi } = OpenAi;

const SELECT_OUTPUT = "SELECT OUTPUT";
const GET_NEW_ONE = "GET NEW ONE";
const OPEN_API_KEY = "OPEN_API_KEY";
// const MAX_ATTEMPT = 8;

const saveOpenAIKey = async (context) => {
  const inputOptions = {
    title: "Enter your OpenAI API key",
    prompt:
      "We need the key to make calls to OpenAI. Don't worry it's not shared. If you don't have an account you can sign up at OpenAi",
    password: true,
    ignoreFocusOut: true,
  };

  const secret = await vscode.window.showInputBox(inputOptions);

  if (!secret) {
    vscode.window.showWarningMessage("No API Key Entered.");

    return false;
  }

  await context.secrets.store(OPEN_API_KEY, secret);

  return true;
};

const initOpenAI = async (context) => {
  const secret = await context.secrets.get(OPEN_API_KEY);
  console.log(secret);
  if (!secret) {
    vscode.window.showWarningMessage("No API Key found.");

    return false;
  }
  const configuration = new Configuration({
    organization: "org-wfb0oS1mArNbiQ3cIQe9ytyt",
    apiKey: secret,
  });

  return new OpenAIApi(configuration);
};

// const configureStatusBarItem = () => {
//   const statusBarItem = vscode.window.createStatusBarItem();
//   statusBarItem.name = "TypescriptEs6";
//   statusBarItem.text = " $(hubot) Fetching... $(hubot)";
//   statusBarItem.tooltip = "Fetching.....";

//   return statusBarItem;
// };

const makeRequest = async (openai, selection) => {
  const defaultPrompt = `Pretend you are a Typescript expert, Convert the given code or the commands to typescript using latest ES6 syntax. Use const wherever possible. Do not use any as type. Use Typescript to answer. Only answer if the question has key word of react or javascript in it.
  Question:
  Write a php code to add two number
  Sorry Can only do react orJavascript code
  
  Question:
   Write the following in typscript
   2. Write a React functional component named  Dropdown.
   3. Component takes two props optionLists  and callBack function and destructure the props in declaration.
   4. Has a internal state of selectedOption.
   5. Renders the select component with options from optionLists
  
   type DropdownProps = {
     optionLists: string[];
     callBack: (selectedOption: string) => void;
   }
  
   const Dropdown = ({optionLists, callBack}: DropdownProps) => {
     const [selectedOption, setSelectedOption] = useState<string>("");
  
     const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
       setSelectedOption(event.target.value);
       callBack(event.target.value);
    };
  
    return (
       <select value={selectedOption} onChange={handleChange}>
         {optionLists.map((option, index) => (
           <option key={index} value={option}>
             {option}
           </option>
       ))}
      </select>
    );
  };
  
  Question:
  Convert following to typescript
   const Dropdown = (optionLists, callBack) => {
    const [selectedOption, setSelectedOption] = useState("");
    
      const handleChange = (event) => {
        setSelectedOption(event.target.value);
        callBack(event.target.value);
      };
    
      return (
        <select value={selectedOption} onChange={handleChange}>
          {optionLists.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    };
    
    type DropdownProps = {
      optionLists: string[];
      callBack: (selectedOption: string) => void;
    }
    
    const Dropdown = ({optionLists, callBack}: DropdownProps) => {
      const [selectedOption, setSelectedOption] = useState<string>("");
    
      const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedOption(event.target.value);
        callBack(event.target.value);
      };
    
      return (
        <select value={selectedOption} onChange={handleChange}>
          {optionLists.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    };  

    Question:
  `;
  const prompt = `${defaultPrompt}
   ${selection}
  `;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 750,
    temperature: 0.15,
  });

  return response;
};

const getAndDisplayResults = async (openai, selection) => {
  const statusMessage = vscode.window.setStatusBarMessage(
    "$(hubot) Working on getting the code....  $(hubot)"
  );

  // const statusBarItem = configureStatusBarItem();
  // statusBarItem.show();

  vscode.window.showInformationMessage("Working on getting the code....");

  const result = await makeRequest(openai, selection);
  const output = result.data.choices[0].text.trim();

  // Insert the text at the start of the selection
  // const editor = vscode.window.activeTextEditor;
  // editor.edit((editBuilder) => {
  //   editBuilder.insert(editor.selection.end, `\n\n ${output} \n`);
  // });

  let items = [
    {
      title: SELECT_OUTPUT,
    },
    {
      title: GET_NEW_ONE,
    },
  ];

  const modalMesesageOptions = {
    modal: true,
    detail:
      "The AI tries to generate code as accurate as possible. If you like it you can hit the Select Output button to paste it. Else if you are not happy with the output, try again by hitting the Get New One button.",
  };

  const gptResponse = vscode.window.showInformationMessage(
    output,
    modalMesesageOptions,
    ...items
  );

  // statusBarItem.hide();
  statusMessage.dispose();

  gptResponse.then(async (button) => {
    if (button.title === SELECT_OUTPUT) {
      const editor = vscode.window.activeTextEditor;
      // replace the selected text
      editor.edit(async (selectedText) => {
        selectedText.replace(editor.selection, output);
      });
    }
    if (button.title === GET_NEW_ONE) {
      getAndDisplayResults(openai, selection);
    }
  });
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "react-typescript-generator" is now active!'
  );

  // context.globalState.setKeysForSync("");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "react-typescript-generator.convertToTypescript",
    async function () {
      // The code you place here will be executed every time your command is executed
      const editor = vscode.window.activeTextEditor;
      const selectedText = editor.document.getText(editor.selection);

      if (!selectedText) {
        vscode.window.showInformationMessage(
          "$(hubot) No Code Selected $(hubot)"
        );
        return;
      }

      // check if API Key is set
      const hasKey = await context.secrets.get(OPEN_API_KEY);
      if (!hasKey) {
        // open modal to ask for key
        const isKeySet = await saveOpenAIKey(context);
        if (!isKeySet) {
          return;
        }
      }

      // set default try
      // let defaultCount = await context.secrets.get("MAX_COUNT");
      // const nextDefaultCount = parseInt(defaultCount) + 1;
      // if (nextDefaultCount < MAX_ATTEMPT) {
      //   await context.secrets.delete("MAX_COUNT");
      //   await context.secrets.store("MAX_COUNT", nextDefaultCount);
      // } else {
      //   console.log("Ecceeded limit");
      //   const hasSecret = await context.secrets.get(OPEN_API_KEY);
      //   if (!hasSecret) {
      //     const isKeySet = await saveOpenAIKey(context);
      //     if (!isKeySet) {
      //       return;
      //     }
      //   }
      // }

      // if key is present configure OpenAI
      const openai = await initOpenAI(context);
      const selection = selectedText;
      await getAndDisplayResults(openai, selection);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
async function deactivate() {
  await context.secrets.delete(OPEN_API_KEY);
}

module.exports = {
  activate,
  deactivate,
};
