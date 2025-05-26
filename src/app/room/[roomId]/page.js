"use client";

import { useEffect, useState } from "react"; // Added useState
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Re-using Input for chat
import { Textarea } from "@/components/ui/textarea"; // For chat input
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for players in the room
// Alice is designated as the oldest player for this mock.
const mockPlayersData = [
  { id: "user1", name: "Alice", score: 120, isOldest: true },
  { id: "user2", name: "Bob", score: 150, isOldest: false },
  { id: "user3", name: "Charlie", score: 90, isOldest: false },
].sort((a, b) => b.score - a.score); // Sort by score descending

export default function GameRoomPage() {
  const router = useRouter();
  const params = useParams();
  const { roomId } = params;
  const { data: session, status } = useSession();
  const [gamePhase, setGamePhase] = useState("NotStarted"); // 'NotStarted', 'PhraseEntry', 'Voting', 'Results'
  const [players, setPlayers] = useState(mockPlayersData); // Manage players in state
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [currentAcronym, setCurrentAcronym] = useState([]);
  const [phraseInputValue, setPhraseInputValue] = useState("");
  const [isPhraseValid, setIsPhraseValid] = useState(false);
  const [hasSubmittedPhrase, setHasSubmittedPhrase] = useState(false);
  const [timerValue, setTimerValue] = useState(0);
  const [timerId, setTimerId] = useState(null); // To store interval ID for cleanup
  const [submittedPhrases, setSubmittedPhrases] = useState([]); // For Voting Phase
  const [playerVote, setPlayerVote] = useState(null); // For Voting Phase, stores phraseId

  // Determine if the current user is the oldest player
  // In a real app, session.user.id would be better, but using name for mock simplicity aligned with NextAuth setup
  const currentUsername = session?.user?.username || session?.user?.name;

  // The actual oldest player from the current player list
  const oldestPlayerInList = players.find((p) => p.isOldest);

  // Is the current logged-in user the oldest player in the list?
  const isCurrentUserTheOldest = oldestPlayerInList && currentUsername === oldestPlayerInList.name;

  // Fallback for UI testing when session might not be available (e.g. local dev without login)
  // This assumes 'Alice' (first in original mockPlayersData before sort, or explicitly named) is the test host
  const mockIsCurrentUserTheOldestForUITesting =
    !session && players.length > 0 && players[0].name === "Alice" && players[0].isOldest;

  const generateAcronym = (letterCount) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let acronym = [];
    for (let i = 0; i < letterCount; i++) {
      acronym.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    return acronym;
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
    }
  }, [session, status, router]);

  // Effect for game phase transitions
  useEffect(() => {
    // Cleanup timer function
    const cleanupTimer = () => {
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
    };

    if (gamePhase === "PhraseEntry") {
      cleanupTimer();

      let nextRoundNumber = currentRoundNumber;
      if (nextRoundNumber + 2 > 9) {
        nextRoundNumber = 1;
      }
      // setCurrentRoundNumber(nextRoundNumber); // Managed by Start Round button potentially or if rounds are automatic after results

      const numberOfLetters = nextRoundNumber + 2;
      const newAcronym = generateAcronym(numberOfLetters);
      setCurrentAcronym(newAcronym);

      setPhraseInputValue("");
      setIsPhraseValid(false);
      setHasSubmittedPhrase(false);

      const timeForRound = numberOfLetters * 8;
      setTimerValue(timeForRound);

      const newTimerId = setInterval(() => {
        setTimerValue((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(newTimerId);
            console.log("Phrase entry time up!");
            setGamePhase("Voting");
            setHasSubmittedPhrase(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      setTimerId(newTimerId);
    } else if (gamePhase === "Voting") {
      cleanupTimer();

      // Mock submitted phrases - in a real app, this comes from server/state
      const mockPhrases = [
        { id: "phrase1", text: `Alpha Bravo Charlie - Example One`, acronym: currentAcronym.join("") },
        { id: "phrase2", text: `Another Brilliant Creation`, acronym: currentAcronym.join("") },
        {
          id: "phrase3",
          text: `${currentAcronym[0]} Really ${currentAcronym[1]} Good ${currentAcronym[2]}${
            currentAcronym[3] ? " " + currentAcronym[3] : ""
          } Submission`,
          acronym: currentAcronym.join(""),
        },
      ].filter((p) => p.acronym === currentAcronym.join("") && p.text); // Ensure phrases match current acronym
      // Simulate filtering out the current user's own phrase if that's a game rule (not implemented yet)
      setSubmittedPhrases(mockPhrases);
      setPlayerVote(null); // Reset previous vote

      const votingTime = (currentAcronym.length > 0 ? currentAcronym.length : 3) * 10;
      setTimerValue(votingTime);

      const newTimerId = setInterval(() => {
        setTimerValue((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(newTimerId);
            console.log("Voting time up!");
            setGamePhase("Results");
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      setTimerId(newTimerId);
    } else if (gamePhase === "NotStarted" || gamePhase === "Results") {
      cleanupTimer();
    }

    return cleanupTimer;
  }, [gamePhase, currentAcronym, currentRoundNumber, timerId]); // Added missing dependencies to satisfy React Hook rules

  const validatePhrase = (phrase, acronym) => {
    if (!phrase.trim() || acronym.length === 0) return false;
    const words = phrase.trim().split(/\s+/);
    if (words.length !== acronym.length) return false;
    return words.every((word, index) => word.charAt(0).toUpperCase() === acronym[index]);
  };

  useEffect(() => {
    setIsPhraseValid(validatePhrase(phraseInputValue, currentAcronym));
  }, [phraseInputValue, currentAcronym]);

  const handleExitRoom = () => {
    router.push("/"); // Navigate back to the lobby
  };

  const handlePhraseSubmit = () => {
    if (!isPhraseValid || hasSubmittedPhrase) return;

    console.log(`Phrase submitted for ${currentAcronym.join("")}: ${phraseInputValue}`);
    setHasSubmittedPhrase(true);
    // In a real app, this phrase would be added to a list for the current user, then sent to server.
  };

  const handleVote = (phraseId) => {
    if (playerVote !== null || timerValue === 0) return; // Already voted or time is up

    setPlayerVote(phraseId);
    console.log(`Voted for phrase: ${phraseId}`);
    // In a real app, send vote to server.
  };

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-var(--header-height,80px))]">
      {/* Main Game Area / Player List */}
      <div className="lg:w-2/3 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Game Room: <span className="text-blue-600 dark:text-blue-400">{roomId}</span>
          </h1>
          <Button variant="outline" onClick={handleExitRoom}>
            Exit Room
          </Button>
        </div>

        {/* Player List and Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Players & Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player Name</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {player.name}
                      {player.name === currentUsername && " (You)"}
                      {player.isOldest && " (Host)"}
                    </TableCell>
                    <TableCell className="text-right">{player.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Game Area Content based on gamePhase */}
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>
              {gamePhase === "NotStarted" && "Game Area"}
              {gamePhase === "PhraseEntry" && `Round ${currentRoundNumber}: Your Acronym - ${currentAcronym.join(" ")}`}
              {gamePhase === "Voting" && `Voting - Acronym: ${currentAcronym.join(" . ")}.`}
              {gamePhase === "Results" && "Round Results"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full p-2 sm:p-4">
            {/* Not Started UI */}
            {gamePhase === "NotStarted" && (
              <div className="text-center py-8">
                {isCurrentUserTheOldest || mockIsCurrentUserTheOldestForUITesting ? (
                  <Button
                    size="lg"
                    onClick={() => {
                      setCurrentRoundNumber((prev) => prev + 1); // Increment round for the new game
                      setGamePhase("PhraseEntry");
                    }}
                  >
                    Start Round {currentRoundNumber}
                  </Button>
                ) : (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Waiting for host ({oldestPlayerInList?.name || "N/A"}) to start...
                  </p>
                )}
              </div>
            )}

            {/* Phrase Entry UI (Timer Display) */}
            {gamePhase === "PhraseEntry" && !hasSubmittedPhrase && timerValue > 0 && (
              <div className="w-full text-center">
                <p className="text-2xl font-semibold mb-2 sm:mb-4">
                  Acronym: <span className="text-blue-600 dark:text-blue-400">{currentAcronym.join(" . ")} .</span>
                </p>
                <p className="text-xl mb-4 sm:mb-6">Time remaining: {timerValue}s</p>
              </div>
            )}
            {gamePhase === "PhraseEntry" && hasSubmittedPhrase && (
              <p className="text-lg text-green-600 dark:text-green-400">Phrase submitted! Waiting...</p>
            )}
            {gamePhase === "PhraseEntry" && timerValue === 0 && !hasSubmittedPhrase && (
              <p className="text-lg text-red-600 dark:text-red-400">Time&apos;s up! Waiting for voting...</p>
            )}

            {/* Voting UI */}
            {gamePhase === "Voting" && (
              <div className="w-full">
                <p className="text-center text-xl mb-2 sm:mb-4">Vote for the best phrase! Time: {timerValue}s</p>
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-var(--header-height,80px)-250px)] p-1">
                  {submittedPhrases.length > 0 ? (
                    submittedPhrases.map((phrase) => (
                      <Card
                        key={phrase.id}
                        className={`p-3 flex justify-between items-center transition-all cursor-pointer
                                  ${
                                    playerVote === phrase.id
                                      ? "border-blue-500 ring-2 ring-blue-500 dark:border-blue-400"
                                      : "border-gray-200 dark:border-gray-700 hover:shadow-md"
                                  }
                                  ${playerVote && playerVote !== phrase.id ? "opacity-60" : ""}`}
                        onClick={() => handleVote(phrase.id)} // Allow clicking card to vote
                      >
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{phrase.text}</p>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(phrase.id);
                          }} // Prevent card click from double-triggering if button is inside
                          disabled={playerVote !== null || timerValue === 0}
                          variant={playerVote === phrase.id ? "default" : "outline"}
                          size="sm"
                        >
                          {playerVote === phrase.id ? "Voted" : "Vote"}
                        </Button>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No phrases submitted for voting.</p>
                  )}
                </div>
              </div>
            )}

            {/* Results UI (Placeholder) */}
            {gamePhase === "Results" && <p className="text-lg">Round results will be shown here...</p>}
          </CardContent>
        </Card>
      </div>

      {/* Side Panel: Chat / Phrase Submission / Info */}
      <div className="lg:w-1/3 flex flex-col border-l dark:border-gray-700 h-full">
        <Card className="flex-grow flex flex-col">
          <CardHeader>
            <CardTitle>
              {gamePhase === "PhraseEntry" && "Submit Your Phrase"}
              {gamePhase === "Voting" && "Voting Info"}
              {gamePhase !== "PhraseEntry" && gamePhase !== "Voting" && "Chat"}
            </CardTitle>
          </CardHeader>

          {/* Phrase Entry Submission Area */}
          {gamePhase === "PhraseEntry" && (
            <>
              <CardContent className="flex-grow flex flex-col justify-center p-4">
                {hasSubmittedPhrase ? (
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    Your phrase is submitted. Waiting for others...
                  </p>
                ) : timerValue === 0 ? (
                  <p className="text-center text-red-500 dark:text-red-400">Time is up for phrase submission!</p>
                ) : (
                  <Textarea
                    placeholder={`Enter your phrase for ${currentAcronym.join(" . ")}...`}
                    value={phraseInputValue}
                    onChange={(e) => setPhraseInputValue(e.target.value)}
                    className={`resize-none flex-grow text-base ${
                      !isPhraseValid && phraseInputValue
                        ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    rows={5}
                    disabled={hasSubmittedPhrase || timerValue === 0}
                  />
                )}
              </CardContent>
              <div className="p-4 border-t dark:border-gray-700">
                <Button
                  onClick={handlePhraseSubmit}
                  className="w-full"
                  disabled={!isPhraseValid || hasSubmittedPhrase || timerValue === 0}
                >
                  Submit Phrase
                </Button>
              </div>
            </>
          )}

          {/* Voting Info Area */}
          {gamePhase === "Voting" && (
            <CardContent className="flex-grow p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review the submitted phrases in the main game area. Click &quot;Vote&quot; for your favorite one.
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                You can only vote once. Voting ends when the timer runs out.
              </p>
              {playerVote && (
                <p className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  You voted for: {submittedPhrases.find((p) => p.id === playerVote)?.text || "a phrase"}.
                </p>
              )}
            </CardContent>
          )}

          {/* Chat Area for other phases */}
          {gamePhase !== "PhraseEntry" && gamePhase !== "Voting" && (
            <>
              <CardContent className="flex-grow overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-md mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Chat is active.</p>
                {/* Actual chat messages would go here */}
              </CardContent>
              <div className="p-4 border-t dark:border-gray-700">
                <div className="flex gap-2">
                  <Textarea placeholder="Type your message..." className="resize-none flex-grow" rows={2} />
                  <Button>Send</Button> {/* Removed onClick={handleSendMessage} as it was a placeholder */}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
