import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import Link from 'next/link';
import axios from 'axios';

function RedButton({text, onClick}) {
  return (
    <button 
      className="p-1 h-8 bg-red-500 hover:bg-red-600 rounded-md text-white font-bold"
      onClick={onClick}>
        {text}
    </button>
  )
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
        className="flex justify-center items-center w-full m-3 p-1 h-10 bg-amber-300 text-sm w-full">
        {message}
      </div>
    )
  };

function TableCards({gameId, gameState, handleCardClick, handlePass, handleNewGame}) {

    const cardClass = "flex w-32 h-10 items-center justify-center rounded-md border border-black text-center  ";
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
      <>
      <div className="font-bold p-1 w-full bg-black text-white font-serif">CodenamesBot</div>
      <div className="flex justify-center w-full">
        
      
        <div className="flex w flex-col justify-center items-center">
      
        
        <InstructionBanner gameId={gameId} gameState={gameState} handleNewGame={handleNewGame} />
        
  
        {/* CLUE */}
        <div className="mt-6 mb-3 h-16 w-64 rounded-lg shadow-sm border flex items-center justify-center font-mono">
          {
            (gameState && gameState.active_player === "guesser") ? 
              gameState.current_clue_word + ", " + gameState.current_clue_number
            :
              <div className="blinking-cursor">...</div>
          }
        </div>
  
  
        {/* CARDS */}
        <div className="grid p-1 w-128 grid-cols-4 gap-1 text-sm bg-yellow-100">
            {gameState && gameState.table_words && gameState.table_words.map((word_entry) => (
              <div key={word_entry.word}
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
  
        {/* underneath cards */}
        <div className="flex w-full justify-between mt-2">
          {/* PAST CLUES on left*/}
          <div>
            
            {gameState  && gameState.all_clues.map((clue, index) => (
              <div>
                <span className=""> #{index+1}:</span> {" "}
                <span className="font-mono">{clue[0]}, {clue[1]}</span> {gameState.is_game_over ? (" → " +clue[2].join(' ')) : ""}
              </div>
            ))}
            
          </div>
        
          {/* PASS BUTTON on right*/}
          {gameState && !gameState.is_game_over && gameState.active_player === "guesser" &&
            (<div
              className="flex w-32 h-10 mr-1 mb-10 items-center justify-center rounded-md text-center text-white font-bold bg-blue-500 hover:bg-blue-600 w-24"
              onClick={() => handlePass()}>
                PASS
            </div>)
          }
          
        </div>
  
        
  
      </div>
      
    </div>
    
    </>
  );
  }
  

function App() {
    const router = useRouter();
    const [gameState, setGameState] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [gameId, setGameId] = useState(null);


    useEffect(() => {
        console.log("useEffect")
        if (!router.isReady) {
            console.log("router is not ready")
            return;
        }

        if (typeof window !== undefined && window.localStorage) {
            console.log("window.localStorage exists")
            if (localStorage.getItem('gameId') === null || localStorage.getItem('gameId') === 'undefined') {
                console.log("gameId does not exist");
                
                fetch('/api/new-game', {method: 'POST'})
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

                fetch('/api/game', {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ "game_id": localGameId })})
                .then((response) => response.json())
                .then((response_json) => {
                    setGameState(response_json);

                    console.log("response_json:")
                    console.log(response_json);

                    if (response_json && response_json.active_player === "giver") {
                        console.log("active_player is giver")
                        const timer = setTimeout(() => {
                            fetch('/api/game/next', {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ "game_id": localGameId })})
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
                });
            }
        }
    }, [router.isReady, gameId]);


    async function handleNewGame() {
        console.log("new game");

        const response_json = 
        axios
            .post(`/api/new-game`)
            .then((response) => {
                const gameId = response.data.game_id;
                setGameId(response_json.game_id);
                window.localStorage.setItem('gameId', response_json.game_id);
            });
    }


    async function handleCardClick(word) {
        console.log("clicked card " + word);

        const response_json = await axios.post(`/api/game/action`, { "game_id": gameId, "action_type": "guess", "guess": word });
        console.log(response_json.data)

        setGameState(response_json.data.state)

        console.log(response_json);

        if (response_json.data.state.active_player === "giver") {
        const timer = setTimeout(() => {
            fetch('/api/game/next', {method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
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
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ "action_type": "pass", "game_id": gameId})})
        const response_json = await response.json();

        setGameState(response_json.state)

        console.log(response_json);

        if (response_json.state.active_player === "giver") {
            const timer = setTimeout(() => {
                fetch('/api/game/next', {method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
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


return (
  <>
    <TableCards 
      gameId={gameId} 
      gameState={gameState} 
      handleCardClick={handleCardClick}
      handlePass={handlePass} 
      handleNewGame={handleNewGame} />
    
  </>
  
);

}

export default App;