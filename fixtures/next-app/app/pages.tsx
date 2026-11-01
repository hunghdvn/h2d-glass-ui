'use client';

// Pagination keeps its page in state here: a Server Component cannot pass it onPageChange, getHref
// or renderLink, which are functions.
import { Pagination } from 'fl-glass-ui';
import Link from 'next/link';
import { useState } from 'react';

export function Pages() {
  const [page, setPage] = useState(5);
  return (
    <Pagination
      count={12}
      page={page}
      onPageChange={setPage}
      getHref={(target) => `?page=${target}`}
      renderLink={(props) => <Link {...props} />}
    />
  );
}
