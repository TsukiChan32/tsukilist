// src/routes/anime/$animeId.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAnimeDetails } from '#/server/anilist'
import {
  getAnimeList,
  updateAnimeStatus,
  saveAnimeToDatabase,
  deleteAnimeFromDatabase,
  updateAnimeRatingAndFavorite, // <-- Nowy import
} from '#/server/anime'

export const Route = createFileRoute('/anime/$animeId')({
  component: AnimeDetailPage,
})

function AnimeDetailPage() {
  const { animeId } = Route.useParams()
  const numericId = parseInt(animeId, 10)

  const queryClient = useQueryClient()

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['anime', 'detail', numericId],
    queryFn: () => getAnimeDetails({ data: numericId }),
    enabled: !isNaN(numericId),
  })

  const { data: savedAnime } = useQuery({
    queryKey: ['anime', 'list'],
    queryFn: () => getAnimeList(),
  })

  const savedEntry = savedAnime?.find((a: any) => a.anilistId === numericId)

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    if (!savedEntry) return
    try {
      await updateAnimeStatus({
        data: { id: savedEntry.id, status: e.target.value },
      })
      queryClient.invalidateQueries({ queryKey: ['anime', 'list'] })
    } catch (err) {
      alert('Nie udało się zmienić statusu.')
    }
  }

  // NOWA FUNKCJA: Zmiana oceny
  const handleRatingChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    if (!savedEntry) return
    const rating = e.target.value ? parseInt(e.target.value, 10) : null
    try {
      await updateAnimeRatingAndFavorite({
        data: { id: savedEntry.id, userRating: rating },
      })
      queryClient.invalidateQueries({ queryKey: ['anime', 'list'] })
    } catch (err) {
      alert('Nie udało się zapisać oceny.')
    }
  }

  // NOWA FUNKCJA: Przełączanie ulubionych
  const handleFavoriteToggle = async () => {
    if (!savedEntry) return
    try {
      await updateAnimeRatingAndFavorite({
        data: { id: savedEntry.id, isFavorite: !savedEntry.isFavorite },
      })
      queryClient.invalidateQueries({ queryKey: ['anime', 'list'] })
    } catch (err) {
      alert('Nie udało się zmienić statusu ulubionego.')
    }
  }

  const handleSave = async () => {
    if (!response?.data) return
    try {
      await saveAnimeToDatabase({ data: response.data })
      queryClient.invalidateQueries({ queryKey: ['anime', 'list'] })
    } catch (err) {
      alert('Wystąpił błąd podczas zapisywania.')
    }
  }

  const handleDelete = async () => {
    if (!savedEntry) return
    if (!confirm('Na pewno chcesz usunąć to anime ze swojej listy?')) return
    try {
      await deleteAnimeFromDatabase({ data: savedEntry.id })
      queryClient.invalidateQueries({ queryKey: ['anime', 'list'] })
    } catch (err) {
      alert('Wystąpił błąd podczas usuwania.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#130921] text-[#00ffcc] font-mono p-10 flex justify-center items-center text-2xl font-black animate-pulse">
        _ŁADOWANIE_DANYCH...
      </div>
    )
  }

  if (error || !response?.data) {
    return (
      <div className="min-h-screen bg-[#130921] text-[#ff00ff] font-mono p-10 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-black mb-4">BŁĄD_404</h1>
        <Link
          to="/"
          className="mt-8 bg-[#ff00ff] text-black px-6 py-3 font-bold border-4 border-black shadow-[4px_4px_0px_#fff] hover:-translate-y-1 transition-transform"
        >
          &lt; Wróć do bazy
        </Link>
      </div>
    )
  }

  const anime = response.data

  return (
    <div className="min-h-screen bg-[#130921] text-[#f0e6ff] font-mono pb-20 selection:bg-[#ff00ff] selection:text-black">
      <div className="relative w-full h-[40vh] min-h-75 bg-[#1a0b2e] border-b-8 border-black overflow-hidden">
        {anime.bannerImage && (
          <img
            src={anime.bannerImage}
            alt="Banner"
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <Link
          to="/"
          className="absolute top-6 left-6 bg-[#00ffcc] text-black font-black px-4 py-2 border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-[#ff00ff] transition-colors z-10"
        >
          &lt; WRÓĆ
        </Link>
      </div>

      <main className="max-w-6xl mx-auto px-6 relative -mt-32 z-20">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 shrink-0">
            <div className="border-4 border-black shadow-[8px_8px_0px_#000] bg-[#23153c]">
              <img
                src={anime.coverImage.extraLarge}
                alt={anime.title.romaji}
                className="w-full h-auto"
              />
            </div>

            {/* PANEL AKCJI */}
            <div className="mt-6 bg-[#23153c] border-4 border-black p-4 shadow-[6px_6px_0px_#000] flex flex-col gap-4">
              {savedEntry ? (
                <>
                  {/* Status */}
                  <div>
                    <label className="block text-[#00ffcc] font-black mb-2 uppercase text-sm">
                      Twój_Status:
                    </label>
                    <select
                      value={savedEntry.watchStatus}
                      onChange={handleStatusChange}
                      className="w-full bg-[#130921] text-[#f0e6ff] font-bold border-2 border-[#00ffcc] p-2 outline-none cursor-pointer hover:border-[#ff00ff] transition-colors"
                    >
                      <option value="PLANOWANE">📅 Planowane</option>
                      <option value="OGLADAM">▶️ Oglądam</option>
                      <option value="SKONCZONE">✅ Skończone</option>
                      <option value="POMINIONE">⏭️ Pominięte</option>
                    </select>
                  </div>

                  {/* Ocena (1-10) */}
                  <div>
                    <label className="block text-[#00ffcc] font-black mb-2 uppercase text-sm">
                      Twoja_Ocena:
                    </label>
                    <select
                      value={savedEntry.userRating || ''}
                      onChange={handleRatingChange}
                      className="w-full bg-[#130921] text-[#f0e6ff] font-bold border-2 border-[#00ffcc] p-2 outline-none cursor-pointer hover:border-[#ff00ff] transition-colors"
                    >
                      <option value="">-- Brak --</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} / 10
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ulubione */}
                  <button
                    onClick={handleFavoriteToggle}
                    className={`w-full font-black uppercase py-2 border-2 border-black transition-all shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2
                      ${
                        savedEntry.isFavorite
                          ? 'bg-red-500 text-white'
                          : 'bg-[#130921] text-[#b892ff] hover:bg-red-500 hover:text-white'
                      }`}
                  >
                    {savedEntry.isFavorite
                      ? '❤️ Ulubione'
                      : '🖤 Dodaj do ulubionych'}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase py-2 border-2 border-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none transition-all mt-2"
                  >
                    - Usuń z bazy
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSave}
                  className="w-full bg-[#ff00ff] hover:bg-[#00ffcc] text-black font-black uppercase py-3 border-2 border-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none transition-all"
                >
                  + Dodaj do bazy
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 pt-4 md:pt-32">
            <h1 className="text-4xl md:text-6xl font-black uppercase text-[#ff00ff] drop-shadow-[3px_3px_0px_#000] mb-2 leading-tight">
              {anime.title.romaji}
            </h1>
            {anime.title.english && (
              <h2 className="text-xl text-[#b892ff] font-bold mb-6">
                {anime.title.english}
              </h2>
            )}

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="bg-[#1a0b2e] border-2 border-[#00ffcc] px-4 py-2">
                <span className="text-[#00ffcc] text-sm font-bold block">
                  STATUS_EMISJI
                </span>
                <span className="text-white font-black">{anime.status}</span>
              </div>
              <div className="bg-[#1a0b2e] border-2 border-[#00ffcc] px-4 py-2">
                <span className="text-[#00ffcc] text-sm font-bold block">
                  ODCINKI
                </span>
                <span className="text-white font-black">
                  {anime.episodes || '?'}
                </span>
              </div>
              <div className="bg-[#1a0b2e] border-2 border-[#00ffcc] px-4 py-2">
                <span className="text-[#00ffcc] text-sm font-bold block">
                  OCENA_GLOBALNA
                </span>
                <span className="text-white font-black">
                  {anime.averageScore ? `${anime.averageScore}/100` : 'Brak'}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-[#00ffcc] font-black mb-2 text-xl uppercase">
                &gt; Gatunki
              </h3>
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre: string) => (
                  <span
                    key={genre}
                    className="bg-[#ff00ff] text-black font-bold px-3 py-1 border-2 border-black"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[#00ffcc] font-black mb-2 text-xl uppercase">
                &gt; Opis
              </h3>
              <div
                className="text-[#d4c5f9] leading-relaxed text-lg border-l-4 border-[#ff00ff] pl-4 space-y-4"
                dangerouslySetInnerHTML={{
                  __html: anime.description || 'Brak opisu.',
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
