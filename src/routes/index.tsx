// src/routes/index.tsx
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { searchAnimeOnAniList } from '#/server/anilist'
import {
  saveAnimeToDatabase,
  getAnimeList,
  deleteAnimeFromDatabase,
} from '#/server/anime'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const queryClient = useQueryClient()

  const { data: savedAnime, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['anime', 'list'],
    queryFn: () => getAnimeList(),
  })

  const filteredAnime = savedAnime?.filter((anime: any) => {
    if (filterStatus === 'ALL') return true
    return anime.watchStatus === filterStatus
  })

  const handleSearch = async () => {
    if (!searchTerm) return
    setIsLoading(true)
    setPage(1)
    try {
      const response = await searchAnimeOnAniList({
        data: { searchTerm, page: 1 },
      })
      if (response.error) throw new Error(response.error)

      if (response.data) {
        setResults(response.data.media)
        setHasNextPage(response.data.hasNextPage)
      } else {
        setResults([])
        setHasNextPage(false)
      }
    } catch (error: any) {
      console.error('Błąd w komponencie:', error)
      alert('Błąd: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!hasNextPage || isLoading) return
    setIsLoading(true)
    const nextPage = page + 1

    try {
      const response = await searchAnimeOnAniList({
        data: { searchTerm, page: nextPage },
      })
      if (response.error) throw new Error(response.error)

      if (response.data) {
        setResults((prevResults) => [...prevResults, ...response.data.media])
        setPage(nextPage)
        setHasNextPage(response.data.hasNextPage)
      }
    } catch (error: any) {
      console.error('Błąd ładowania kolejnej strony:', error)
      alert('Błąd: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (anime: any) => {
    try {
      await saveAnimeToDatabase({ data: anime })
      queryClient.invalidateQueries({ queryKey: ['anime', 'list'] })
    } catch (error) {
      console.error('Błąd zapisu:', error)
      alert('Wystąpił błąd podczas zapisywania do bazy.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Na pewno usunąć to anime z listy?')) return

    try {
      await deleteAnimeFromDatabase({ data: id })
      queryClient.invalidateQueries({ queryKey: ['anime', 'list'] })
    } catch (error) {
      console.error('Błąd usuwania:', error)
      alert('Wystąpił błąd podczas usuwania.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OGLADAM':
        return { text: 'Oglądam', bg: 'bg-[#00ffcc]', textCol: 'text-black' }
      case 'SKONCZONE':
        return { text: 'Skończone', bg: 'bg-blue-400', textCol: 'text-black' }
      case 'POMINIONE':
        return { text: 'Pominięte', bg: 'bg-gray-500', textCol: 'text-white' }
      default:
        return { text: 'Planowane', bg: 'bg-[#ff00ff]', textCol: 'text-black' }
    }
  }

  return (
    <div className="min-h-screen bg-[#130921] text-[#f0e6ff] font-mono p-6 md:p-12 selection:bg-[#ff00ff] selection:text-black">
      <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row items-baseline justify-between border-b-4 border-[#ff00ff] pb-4">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#ff00ff] drop-shadow-[4px_4px_0px_#000]">
          TsukiList
        </h1>
        <span className="text-[#b892ff] font-bold text-lg mt-4 md:mt-0 bg-[#2a1745] px-4 py-2 border-2 border-[#b892ff]">
          // Baza_Danych_Anime
        </span>
      </header>

      <main className="max-w-7xl mx-auto space-y-20">
        {/* --- SEKCJA: MOJA ZAPISANA LISTA --- */}
        <section>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black uppercase text-[#00ffcc]">
                Twoja_Kolekcja
              </h2>
              <span className="bg-[#00ffcc] text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#fff]">
                {savedAnime?.length || 0}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'Wszystkie' },
                { id: 'OGLADAM', label: 'Oglądam' },
                { id: 'PLANOWANE', label: 'Planowane' },
                { id: 'SKONCZONE', label: 'Skończone' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-4 py-1 font-bold uppercase text-sm border-2 border-black transition-all ${
                    filterStatus === filter.id
                      ? 'bg-[#ff00ff] text-black shadow-[2px_2px_0px_#fff] -translate-y-1'
                      : 'bg-[#23153c] text-[#b892ff] hover:bg-[#3b2363]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingSaved ? (
            <p className="text-[#ff00ff] animate-pulse text-xl">
              _Ładowanie_danych...
            </p>
          ) : filteredAnime && filteredAnime.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 list-none p-0">
              {filteredAnime.map((anime) => {
                const badge = getStatusBadge(anime.watchStatus)

                return (
                  <li
                    key={anime.id}
                    className={`bg-[#23153c] border-4 shadow-[6px_6px_0px_#000] hover:-translate-y-2 transition-transform duration-200 relative group ${
                      anime.isFavorite
                        ? 'border-red-500 shadow-[6px_6px_0px_#ff0000]'
                        : 'border-black'
                    }`}
                  >
                    <button
                      onClick={() => handleDelete(anime.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white font-black w-8 h-8 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-red-500 active:translate-y-1 active:shadow-none z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Usuń z listy"
                    >
                      X
                    </button>

                    <div
                      className={`absolute top-2 left-2 z-10 px-2 py-0.5 text-xs font-black uppercase border-2 border-black ${badge.bg} ${badge.textCol}`}
                    >
                      {badge.text}
                    </div>

                    <Link
                      to="/anime/$animeId"
                      params={{ animeId: String(anime.anilistId) }}
                      className="block aspect-[3/4] border-b-4 border-black overflow-hidden bg-[#130921]"
                    >
                      {anime.coverImage && (
                        <img
                          src={anime.coverImage}
                          alt={anime.titleRomaji}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                    </Link>
                    <div className="p-3 bg-[#23153c]">
                      <p
                        className="text-sm font-bold uppercase tracking-tight line-clamp-2 flex items-start gap-1"
                        title={anime.titleRomaji}
                      >
                        {anime.isFavorite && (
                          <span className="text-red-500">❤️</span>
                        )}
                        <span>{anime.titleRomaji}</span>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="text-center py-16 bg-[#1a0b2e] border-4 border-dashed border-[#4a2c7a]">
              <p className="text-[#b892ff] text-xl font-bold uppercase">
                Brak_danych_w_tym_filtrze
              </p>
            </div>
          )}
        </section>

        {/* --- SEKCJA: WYSZUKIWARKA --- */}
        <section className="bg-[#1a0b2e] p-6 md:p-10 border-4 border-black shadow-[8px_8px_0px_#000]">
          <h2 className="text-3xl font-black uppercase text-[#ff00ff] mb-8">
            &gt; Wyszukaj_Anime
          </h2>

          <div className="flex flex-col md:flex-row gap-0 mb-10 border-4 border-black shadow-[4px_4px_0px_#00ffcc]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Wpisz_nazwę..."
              className="flex-1 bg-[#0d0617] text-[#00ffcc] px-6 py-4 text-xl font-bold focus:outline-none placeholder:text-[#4a2c7a]"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-[#ff00ff] text-black font-black uppercase text-xl py-4 px-10 hover:bg-[#00ffcc] transition-colors border-t-4 md:border-t-0 md:border-l-4 border-black disabled:opacity-50"
            >
              {isLoading && page === 1 ? 'Szukanie...' : 'Szukaj'}
            </button>
          </div>

          {results.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {results.map((anime) => {
                  const isAlreadySaved = savedAnime?.some(
                    (saved: any) => saved.anilistId === anime.id,
                  )

                  return (
                    <div
                      key={anime.id}
                      className="bg-[#130921] border-4 border-black shadow-[6px_6px_0px_#000] flex flex-col group"
                    >
                      <Link
                        to="/anime/$animeId"
                        params={{ animeId: String(anime.id) }}
                        className="block aspect-[3/4] overflow-hidden relative border-b-4 border-black"
                      >
                        <img
                          src={anime.coverImage.large}
                          alt={anime.title.romaji}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-0 right-0 bg-[#00ffcc] text-black border-b-4 border-l-4 border-black text-sm font-black px-2 py-1 z-10">
                          {anime.episodes ? `${anime.episodes} ODC` : '?? ODC'}
                        </div>
                      </Link>

                      <div className="p-3 flex flex-col flex-grow bg-[#23153c]">
                        <h3
                          className="text-sm font-bold uppercase line-clamp-2 mb-4 flex-grow text-[#f0e6ff]"
                          title={anime.title.romaji}
                        >
                          {anime.title.romaji}
                        </h3>

                        <button
                          onClick={() => handleSave(anime)}
                          disabled={isAlreadySaved}
                          className={`w-full font-black uppercase py-2 border-2 border-black shadow-[3px_3px_0px_#000] transition-all
                            ${
                              isAlreadySaved
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none translate-y-1'
                                : 'bg-[#ff00ff] text-black active:translate-y-1 active:translate-x-1 active:shadow-none hover:bg-[#00ffcc]'
                            }`}
                        >
                          {isAlreadySaved ? 'Na liście' : '+ Dodaj'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasNextPage && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="bg-[#00ffcc] text-black font-black uppercase text-xl py-3 px-12 border-4 border-black shadow-[6px_6px_0px_#fff] hover:-translate-y-1 hover:bg-[#ff00ff] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Ładowanie...' : 'Załaduj więcej ⏩'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
