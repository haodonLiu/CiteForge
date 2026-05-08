'use client';

import { useRouter } from 'next/navigation';
import LiteratureList from '@/components/library/LiteratureList';

export default function LibraryPage() {
  const router = useRouter();

  return (
    <LiteratureList
      onSelect={(id) => router.push(`/reader/${id}`)}
    />
  );
}
