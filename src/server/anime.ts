import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'

export const getAnimeList = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await prisma.anime.findMany({
      orderBy: { titleRomaji: 'asc' },
    })
  },
)

export const saveAnimeToDatabase = createServerFn({ method: 'POST' })
  .validator((animeData: any) => animeData)
  .handler(async ({ data: anime }) => {
    try {
      const savedAnime = await prisma.anime.upsert({
        where: { anilistId: anime.id },
        update: {},
        create: {
          anilistId: anime.id,
          titleRomaji: anime.title.romaji,
          titleEnglish: anime.title.english || null,
          // POPRAWKA: Bierzemy "large", a jak nie ma, to "extraLarge" (albo null)
          coverImage:
            anime.coverImage?.large || anime.coverImage?.extraLarge || null,
          episodes: anime.episodes || null,
          status: anime.status || null,
        },
      })
      return { success: true, anime: savedAnime }
    } catch (error) {
      console.error('Błąd zapisu do bazy:', error)
      throw new Error('Nie udało się zapisać anime do bazy')
    }
  })
export const deleteAnimeFromDatabase = createServerFn({ method: 'POST' })
  .validator((id: number) => id) // Przyjmujemy ID z bazy danych
  .handler(async ({ data: id }) => {
    try {
      await prisma.anime.delete({
        where: { id: id },
      })
      return { success: true }
    } catch (error) {
      console.error('Błąd usuwania z bazy:', error)
      throw new Error('Nie udało się usunąć anime')
    }
  })
// src/server/anime.ts
// ... (poprzednie funkcje)

export const updateAnimeStatus = createServerFn({ method: 'POST' })
  .validator((data: { id: number; status: string }) => data)
  .handler(async ({ data }) => {
    try {
      const updated = await prisma.anime.update({
        where: { id: data.id },
        data: { watchStatus: data.status },
      })
      return { success: true, updated }
    } catch (error) {
      console.error('Błąd aktualizacji statusu:', error)
      throw new Error('Nie udało się zaktualizować statusu')
    }
  })
// src/server/anime.ts
// ... (poprzednie funkcje)

export const updateAnimeRatingAndFavorite = createServerFn({ method: 'POST' })
  .validator(
    (data: { id: number; userRating?: number | null; isFavorite?: boolean }) =>
      data,
  )
  .handler(async ({ data }) => {
    try {
      const updated = await prisma.anime.update({
        where: { id: data.id },
        data: {
          // Aktualizujemy tylko to, co zostało przekazane
          ...(data.userRating !== undefined && { userRating: data.userRating }),
          ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
        },
      })
      return { success: true, updated }
    } catch (error) {
      console.error('Błąd aktualizacji oceny/ulubionych:', error)
      throw new Error('Nie udało się zaktualizować danych')
    }
  })
