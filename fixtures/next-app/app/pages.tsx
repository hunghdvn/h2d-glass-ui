'use client';

// Pagination keeps its page in state here: a Server Component cannot pass it onPageChange.
import { Pagination } from 'fl-glass-ui';
import { useState } from 'react';

export function Pages() {
  const [page, setPage] = useState(5);
  return <Pagination count={12} page={page} onPageChange={setPage} />;
}
