// src/queries/anime.ts
import { queryOptions } from '@tanstack/react-query'
import { getAnimeList } from '#/server/anime'


export const animeListOptions = queryOptions({
  queryKey: ['anime', 'list'],
  queryFn: () => getAnimeList(),
})

