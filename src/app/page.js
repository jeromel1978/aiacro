'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for game rooms
const mockRooms = [
  { id: 'AB7DEZ', rounds: 3, players: 2, maxPlayers: 5, name: 'Beginner Fun' },
  { id: 'CXY89K', rounds: 0, players: 1, maxPlayers: 4, name: 'Quick Match' },
  { id: 'LMNPQR', rounds: 10, players: 4, maxPlayers: 5, name: 'Pros Only' },
  { id: 'STVW12', rounds: 1, players: 3, maxPlayers: 6, name: 'Casual Hangout' },
];

export default function LobbyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Don't do anything while loading
    if (!session) router.push('/signin'); // Redirect if not authenticated
  }, [session, status, router]);

  const handleCreateRoom = () => {
    console.log('Create New Room button clicked');
    // For now, just logs. Later, navigate to /create-room or open a dialog.
    // router.push('/create-room'); // Example navigation
  };

  const handleJoinRoom = (roomId) => {
    console.log(`Attempting to join room: ${roomId}`);
    router.push(`/room/${roomId}`);
  };

  if (status === 'loading' || !session) {
    // Display a loading message or a blank screen while checking session and redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">
          Game Lobby
        </h1>
        <Button onClick={handleCreateRoom} size="lg">
          Create New Room
        </Button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-900 shadow-md rounded-lg">
        <Table>
          <TableCaption>A list of available game rooms. Click a room to join.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] sm:w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room Name</TableHead>
              <TableHead className="w-[100px] sm:w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</TableHead>
              <TableHead className="text-center w-[100px] sm:w-[120px] px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rounds</TableHead>
              <TableHead className="text-center w-[120px] sm:w-[150px] px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Players</TableHead>
              <TableHead className="text-right w-[100px] sm:w-[120px] px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRooms.map((room) => (
              <TableRow
                key={room.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                onClick={() => handleJoinRoom(room.id)}
              >
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{room.name}</TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{room.id}</TableCell>
                <TableCell className="text-center px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{room.rounds}</TableCell>
                <TableCell className="text-center px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{`${room.players}/${room.maxPlayers}`}</TableCell>
                <TableCell className="text-right px-4 py-3 whitespace-nowrap">
                  <Button variant="outline" size="sm">Join</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {mockRooms.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
          No game rooms available. Why not create one?
        </p>
      )}
    </div>
  );
}
