import KanbanBoard from './components/KanbanBoard';
import Navbar from './components/Navbar';
import { AnimeProvider } from './context/AnimeContext';

function App() {
  return (
    <AnimeProvider>
      <main className="min-h-screen text-gray-100 bg-other">
        <Navbar />
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          <KanbanBoard />
        </div>
      </main>
    </AnimeProvider>
  );
}

export default App;

