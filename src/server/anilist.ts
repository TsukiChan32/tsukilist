// src/server/anilist.ts
import { createServerFn } from '@tanstack/react-start'

export const searchAnimeOnAniList = createServerFn({ method: 'POST' })
  .validator((data: { searchTerm: string; page: number }) => data)
  .handler(async ({ data }) => {
    const { searchTerm, page } = data

    const query = `
      query ($search: String, $page: Int) {
        Page(page: $page, perPage: 20) {
          pageInfo {
            hasNextPage
          }
          media(search: $search, type: ANIME) {
            id
            title {
              romaji
              english
            }
            coverImage {
              large
            }
            episodes
            status
          }
        }
      }
    `
    const variables = { search: searchTerm, page: page }

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'TsukiList/1.0',
        },
        body: JSON.stringify({ query, variables }),
      })

      const json = await response.json()

      if (!response.ok) {
        return {
          error: json.errors ? json.errors[0].message : 'Nieznany błąd AniList',
        }
      }

      const media = json.data?.Page?.media || []
      const hasNextPage = json.data?.Page?.pageInfo?.hasNextPage || false

      return { data: { media, hasNextPage } }
    } catch (error: any) {
      console.error('Błąd sieci (fetch):', error)
      return { error: 'Błąd sieci: ' + error.message }
    }
  })

export const getAnimeDetails = createServerFn({ method: 'POST' })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            extraLarge
          }
          bannerImage
          episodes
          duration
          status
          genres
          averageScore
        }
      }
    `
    const variables = { id }

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      })

      const json = await response.json()
      if (!response.ok) throw new Error('Błąd API')
      return { data: json.data?.Media }
    } catch (error: any) {
      return { error: 'Nie udało się pobrać szczegółów' }
    }
  })
