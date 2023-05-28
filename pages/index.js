import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import Link from 'next/link';
import axios from 'axios';
import Image from 'next/image';

const api_key = '567d7156-42fa-4e6e-af6f-d10570f76c8c';

function CodenamesAIHeader() {
  return <div id="heading-bar" className="font-bold p-1 w-full bg-black text-white font-mono">CodenamesAI</div>
}

function InstructionBanner({gameId, gameState, handleNewGame}) {

  let message = "";
  if (gameState && gameState.is_game_over) {
    // game result
    // - lose: assassin
    // - lose: out of lives
    // - win: all correct
    let gameOverMessage = "";
    if (gameState.game_result === "win") {
      gameOverMessage = "You win! You have guessed all the words.";
    } else if (gameState.game_result === "assassin") {
      gameOverMessage = "You lose! You guessed an assassin.";
    } else if (gameState.game_result === "no lives") {
      gameOverMessage = "You lose! You ran out of lives.";
    } else if (gameState.game_result === "resigned") {
      gameOverMessage = "Game over! You resigned."
    }
    message = (
      <span>{gameOverMessage} <RedButton text="NEW GAME" onClick={handleNewGame} /></span>
    );
  } else if (gameState && gameState.active_player === "guesser") {
    if (gameState.current_guesses.length > 0) {
      const lastGuess = gameState.current_guesses.slice(-1);
      console.log("lastGuess", lastGuess)
      const lastGuessStatus = ((gameState.word_statuses[lastGuess] === "correct") ? "correct" : "incorrect");
      message = `Your guess "${lastGuess}" was ${lastGuessStatus}. You must guess again or pass.`;
    } else {
      message = "Your clue is " + gameState.current_clue_word + ", " + gameState.current_clue_number + ". You must make a guess.";
    }
    // message = "It is your turn. You must guess or pass.";
  } else if (gameState && gameState.active_player === "giver") {
    if (gameState.all_guesses.length > 0) {
      const lastGuess = gameState.all_guesses.slice(-1)[0].slice(-1)[0];
      const lastGuessStatus = ((gameState.word_statuses[lastGuess] === "correct") ? "correct" : "incorrect");
      message = `Your guess "${lastGuess}" was ${lastGuessStatus}. It is the clue-giver's turn. Please wait...`;
    } else {
      message = `It is the clue-giver's turn. Please wait...`;
    }
    
  }
    
  return (
    <div 
      className="flex justify-center items-center w-full mt-3 p-1 h-10 bg-amber-300 text-sm w-full">
      {message}
    </div>
  )
};

function RedButton({text, onClick}) {
  return (
    <button 
      className="p-1 px-2 h-8 bg-red-500 hover:bg-red-600 rounded-md text-white font-bold"
      onClick={onClick}>
        {text}
    </button>
  )
}

function ClueDisplay({gameState}) {
  return (
    <div className="mt-6 mb-3 h-16 w-64 rounded-lg shadow-sm border flex items-center justify-center font-mono">
      {
        (gameState && gameState.active_player === "guesser") ? 
          gameState.current_clue_word + ", " + gameState.current_clue_number
        :
          <div className="blinking-cursor">...</div>
      }
    </div>
  )
};

function CardArea({gameState, handleCardClick, handlePass}) {

  const cardClass = "flex h-10 items-center justify-center rounded-md border border-black text-center ";
  const gameActiveCardStatusClasses = {
    "open": "bg-white hover:border-red-500 hover:border-2",
    "correct": "bg-green-200 text-gray-400",
    "incorrect": "bg-gray-200 text-gray-400",
    "trap": "bg-amber-800 text-white"
  };
  const gameOverCardStatusClasses = {
    "open": "bg-white",
    "correct": "bg-green-200 text-gray-400",
    "incorrect": "bg-gray-200 text-gray-400",
    "trap": "bg-amber-800 text-white"
  };

  return (
    <div 
      className="grid grid-cols-4 w-full max-w-[32rem] p-1 gap-1 text-sm bg-yellow-100">
      {gameState && gameState.table_words && 
        gameState.table_words.map((word_entry) => (
        <div
          key={word_entry.word} 
          className={
            cardClass +
            (!gameState.isGameOver ? 
              gameActiveCardStatusClasses[word_entry.status] :
              gameOverCardStatusClasses[word_entry.status])}
          onClick={() => handleCardClick(word_entry.word)}>
            {word_entry.word}
        </div>
      ))}
    </div>
  )
}

function BelowCardInfoBar({gameState}) {
  if (gameState) {
    console.log("gameState.starting_lives", gameState.starting_lives)
    console.log("gameState.current_lives", gameState.current_lives)
  }

  return (
    <div className="w-full px-1 text-xs flex flex-row justify-between bg-yellow-200">
      <div className="ml-0">
        Correct: {gameState && gameState.correct_guesses.length} / {gameState && gameState.num_target_words && gameState.num_target_words}
      </div>
      <div id="hearts"className="m-0 flex flex-row">
        { gameState && gameState.current_lives >= 0 && [...Array(gameState.starting_lives - gameState.current_lives).keys()].map((i) =>
              <Image src="/heart.svg" width="8" height="8" key={i} />
          )
        }
        { gameState && gameState.current_lives >= 0 && [...Array(gameState.current_lives).keys()].map((i) => 
            <Image src="/heart_filled.svg" width="8" height="8" key={i} />
          )
        }
        
      </div>
    </div>
  )
}

function HistoryAndButtonsArea({gameState, handlePass, handleNewGame, handleResign}) {
  return (
    <div id="verticalWrapper" className="w-full">
    <div id="horizWrapper" className="flex w-full">
    
    <div id="historyLeft" className="flex w-full justify-between mt-2">
      {/* PAST CLUES and FORFEIT BUTTON on left*/}
      <div className="pl-1">
        
        {gameState  && gameState.all_clues.map((clue, index) => (
          <div key={index.toString() + clue}>
            <span className=""> #{index+1}:</span> {" "}
            <span className="font-mono">{clue[0]}, {clue[1]}</span> {gameState.is_game_over ? (" → " + clue[2].join(' ')) : ""}
          </div>
        ))}

      </div>
    </div>

    
      {/* PASS AND CONCEDE BUTTONS on right*/}
      {gameState && !gameState.is_game_over && gameState.active_player === "guesser" && gameState.current_guesses.length > 0 &&
        (<div
          className="flex w-32 h-10 mr-1 mt-2 items-center justify-center rounded-md text-center text-white font-bold bg-blue-500 hover:bg-blue-600"
          onClick={() => handlePass()}>
            PASS
        </div>)
      }
      
    </div> 
      <div id="bottomLinks" className="w-full text-center">
        {gameState && 
          (<div className="text-xs mt-10 w-full center">
            <button onClick={() => handleResign()}>resign</button> | <a>rules</a> | <a>about</a> 
          </div>)
        }
      </div>
    </div>
  );
}

function PlayArea({gameId, gameState, handleCardClick, handlePass, handleNewGame, handleResign}) {
  
  return (
    <>
      <CodenamesAIHeader />

      {!gameState &&
      <div>Game failed to load...</div>}

      {gameState && 
      (<InstructionBanner gameId={gameId} gameState={gameState} handleNewGame={handleNewGame} />)}

      {gameState &&
      (<div id="verticalFlowContainer" className="flex align-center justify-center w-full">

        <div className="flex w-[32rem] flex-col justify-center items-center">
      
          <div className="flex flex-col w-full justify-center items-center">
            <ClueDisplay gameState={gameState} />
      
            <CardArea gameState={gameState} handleCardClick={handleCardClick} handlePass={handlePass} />

            <BelowCardInfoBar gameState={gameState} />

            <HistoryAndButtonsArea gameState={gameState} handlePass={handlePass} handleNewGame={handleNewGame} handleResign={handleResign} />
          </div>
      
        </div>

      </div>)}
    </>
  );
}
  

function App() {
  const router = useRouter();
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      console.log("useEffect")

      // router not ready
      if (!router.isReady) {
          console.log("router is not ready")
          return;
      }

      // no window or no localStorage
      if (typeof window == undefined || !window.localStorage) {
        console.log("no local storage");
        return;
      }
      
      // check if gameId saved or not
      if (localStorage.getItem('gameId') === null || localStorage.getItem('gameId') === 'undefined') {
          console.log("gameId does not exist");
          
          fetch('/api/new-game', {method: 'POST', headers: {'x-api-key': api_key} })
          .then((response) => response.json())
          .then((response_json) => {
              console.log('new-game response_json')
              console.log(response_json)
              setGameId(response_json.game_id);
              console.log("gameId: " + gameId)
              window.localStorage.setItem('gameId', response_json.game_id);
              // setGameState(response_json.state);
          });
      } else {
          console.log("gameId exists"); 

          const localGameId = window.localStorage.getItem('gameId');

          console.log("gameId: " + localGameId)
          setGameId(localGameId);

          const response = await fetch('/api/game', {method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': api_key }, body: JSON.stringify({ "game_id": localGameId })})

          if (!response.ok) { // if game_id not available, ask for a new game
            fetch('/api/new-game', {method: 'POST', headers: {'x-api-key': api_key}})
            .then((response) => response.json())
            .then((response_json) => {
                console.log('new-game response_json')
                console.log(response_json)
                setGameId(response_json.game_id);
                console.log("gameId: " + gameId)
                window.localStorage.setItem('gameId', response_json.game_id);
                // setGameState(response_json.state);
            });
            return;
          }

          const response_json = await response.json();
          setGameState(response_json);

          console.log("response_json:")
          console.log(response_json);

          if (response_json && response_json.active_player === "giver") {
              console.log("active_player is giver")
              const timer = setTimeout(() => {
                  fetch('/api/game/next', {method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key':api_key }, body: JSON.stringify({ "game_id": localGameId })})
                  .then((response) => response.json())
                  .then((response_json) => {
                      console.log(response_json)
                      setGameState(response_json.state);
                  })
                  .catch((error) => console.log(error));
              }, 1000);
          } else {
              console.log("active_player is not giver")
          }
      }
    }

    fetchData();
  }, [router.isReady, gameId]);


  async function handleNewGame() {
      console.log("new game");

      const response_json = 
      axios
          .post(`/api/new-game`, {}, {headers:{'x-api-key':api_key}})
          .then((response) => {
              const gameId = response.data.game_id;
              setGameId(response_json.game_id);
              window.localStorage.setItem('gameId', response_json.game_id);
          });
  }

  async function handleCardClick(word) {
    console.log("clicked card " + word);

    const response_json = await axios.post(`/api/game/action`, { "game_id": gameId, "action_type": "guess", "guess": word }, {headers:{'x-api-key':api_key}});
    console.log(response_json.data)

    setGameState(response_json.data.state)

    console.log(response_json);

    if (response_json.data.state.active_player === "giver") {
    const timer = setTimeout(() => {
        fetch('/api/game/next', {method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'x-api-key':api_key },
                                    body: JSON.stringify({ "game_id": gameId }) })
        .then((response) => response.json())
        .then((response_json) => {
        console.log(response_json)
        setGameState(response_json.state);
        })
        .catch((error) => console.log(error));
      }, 1000);
    }
  }

  async function handlePass() {
    console.log("pass ");

    const response = await fetch(`/api/game/action`, { method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', 'x-api-key':api_key },
                                                        body: JSON.stringify({ "action_type": "pass", "game_id": gameId})})
    const response_json = await response.json();

    setGameState(response_json.state)

    console.log(response_json);

    if (response_json.state.active_player === "giver") {
      const timer = setTimeout(() => {
        fetch('/api/game/next', {method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-api-key':api_key },
                                body: JSON.stringify({ "game_id": gameId })})
        .then((response) => response.json())
        .then((response_json) => {
        console.log(response_json)
        setGameState(response_json.state);
        })
        .catch((error) => console.log(error));
      }, 1000);
    }
  }

  async function handleResign() {
    console.log("resign ");

    const response = await fetch(
      `/api/game/action`,
      { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': api_key},
        body: JSON.stringify({ 'action_type': 'resign', 'game_id': gameId}) 
      }
    );

    const response_json = await response.json();

    setGameState(response_json.state);
  }


return (
  <>
    <PlayArea 
      gameId={gameId} 
      gameState={gameState} 
      handleCardClick={handleCardClick}
      handlePass={handlePass} 
      handleNewGame={handleNewGame}
      handleResign={handleResign} />
    
  </>
  
);

}

export default App;