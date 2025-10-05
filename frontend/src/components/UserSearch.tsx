import React, { useEffect, useMemo, useState } from 'react'
import { Box, Input, InputGroup, InputLeftElement, Spinner, SimpleGrid, Text, VisuallyHidden, Card, CardBody } from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import axios from 'axios'

type User = { id: number; name: string; email: string }

export default function UserSearch() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<User[]>([])

  // debounce 300ms
  const debounced = useMemo(() => {
    let t: any
    return (value: string, fn: (v: string) => void) => {
      clearTimeout(t)
      t = setTimeout(() => fn(value), 300)
    }
  }, [])

  useEffect(() => {
    const fetchUsers = async (term: string) => {
      if (!term.trim()) { setResults([]); return }
      setLoading(true)
      try {
        // Example public API placeholder; adapt to your backend if available
        const res = await axios.get(`https://jsonplaceholder.typicode.com/users`)
        const users: User[] = res.data
        const filtered = users.filter(u => [u.name, u.email].some(s => s.toLowerCase().includes(term.toLowerCase())))
        setResults(filtered)
      } finally {
        setLoading(false)
      }
    }
    debounced(q, fetchUsers)
  }, [q, debounced])

  return (
    <Box>
      <VisuallyHidden>
        <label htmlFor="user-search-input">Search users</label>
      </VisuallyHidden>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          {loading ? <Spinner size="sm" /> : <SearchIcon color="gray.400" />}
        </InputLeftElement>
        <Input id="user-search-input" aria-label="Search users" placeholder="Search users by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </InputGroup>
      {!loading && results.length === 0 && q && (
        <Text mt={3} opacity={0.8}>No results</Text>
      )}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3} mt={3} role="grid">
        {results.map(u => (
          <Card key={u.id} role="gridcell" tabIndex={0} _focus={{ boxShadow: 'outline' }}>
            <CardBody>
              <Text fontWeight="bold">{u.name}</Text>
              <Text fontSize="sm" opacity={0.8}>{u.email}</Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  )
}

// Usage example:
// <UserSearch />